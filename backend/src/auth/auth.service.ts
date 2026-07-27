import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OrgRole, Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { SignupDto, LoginDto, ResetPasswordDto, AcceptInviteDto } from './dto/auth.dto';
import { seedDemoDataForOrg } from '../common/demo-data'; 

const SALT_ROUNDS = 12;

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    crypto.randomBytes(3).toString('hex')
  );
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {
    this.googleClient = new OAuth2Client(this.config.get<string>('GOOGLE_CLIENT_ID'));
  }

  // ---------------------------------------------------------------------
  // Signup — creates a brand-new organization with the caller as OWNER
  // ---------------------------------------------------------------------
  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const org = await tx.organization.create({
        data: { name: dto.organizationName, slug: slugify(dto.organizationName) },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          fullName: dto.fullName,
          passwordHash,
          emailVerifyToken: hashToken(emailVerifyToken),
          emailVerifyExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        },
      });

      await tx.orgMembership.create({
        data: { organizationId: org.id, userId: user.id, role: OrgRole.OWNER },
      });

      const pipeline = await tx.pipeline.create({
        data: { organizationId: org.id, name: 'Sales Pipeline', isDefault: true },
      });

      await seedDemoDataForOrg(tx, org.id, user.id, pipeline.id);

      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          actorId: user.id,
          action: 'organization.created',
          entityType: 'Organization',
          entityId: org.id,
        },
      });

      return { org, user, pipeline };
    });

    await this.email.sendVerificationEmail(
      result.user.email,
      emailVerifyToken,
      this.config.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    );

    const tokens = await this.issueTokens(result.user.id, result.user.email, result.org.id, OrgRole.OWNER);
    return {
      user: this.toPublicUser(result.user),
      organization: result.org,
      ...tokens,
    };
  }

  // ---------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------
  async login(dto: LoginDto, meta: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash || user.deletedAt) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) throw new UnauthorizedException('This account has been deactivated');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    const memberships = await this.prisma.orgMembership.findMany({
      where: { userId: user.id },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });
    if (memberships.length === 0) {
      throw new UnauthorizedException('This account is not linked to any organization');
    }

    // Default to the first organization; the frontend can call
    // POST /auth/switch-org to change the active tenant afterwards.
    const primary = memberships[0];
    const tokens = await this.issueTokens(user.id, user.email, primary.organizationId, primary.role, meta);

    return {
      user: this.toPublicUser(user),
      organizations: memberships.map((m: (typeof memberships)[number]) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
      activeOrganizationId: primary.organizationId,
      ...tokens,
    };
  }

  async switchOrganization(userId: string, organizationId: string) {
    const membership = await this.prisma.orgMembership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership) throw new UnauthorizedException('No access to this organization');
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.issueTokens(user.id, user.email, organizationId, membership.role);
  }

  // ---------------------------------------------------------------------
  // Refresh token rotation
  // ---------------------------------------------------------------------
  async refresh(rawRefreshToken: string, meta: { ip?: string; userAgent?: string }) {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: stored.userId } });
    const membership = await this.prisma.orgMembership.findFirst({ where: { userId: user.id } });
    if (!membership) throw new UnauthorizedException('No organization access');

    return this.issueTokens(user.id, user.email, membership.organizationId, membership.role, meta);
  }

  async logout(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  // ---------------------------------------------------------------------
  // Email verification
  // ---------------------------------------------------------------------
  async verifyEmail(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: tokenHash, emailVerifyExpiresAt: { gt: new Date() } },
    });
    if (!user) throw new BadRequestException('Verification link is invalid or expired');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpiresAt: null },
    });
    return { success: true };
  }

  // ---------------------------------------------------------------------
  // Forgot / reset password
  // ---------------------------------------------------------------------
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return success to avoid leaking which emails are registered.
    if (!user) return { success: true };

    const rawToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashToken(rawToken),
        passwordResetExpiresAt: new Date(Date.now() + 3600 * 1000),
      },
    });

    await this.email.sendPasswordResetEmail(user.email, rawToken, this.config.get<string>('FRONTEND_URL', 'http://localhost:5173'));
    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashToken(dto.token);
    const user = await this.prisma.user.findFirst({
      where: { passwordResetToken: tokenHash, passwordResetExpiresAt: { gt: new Date() } },
    });
    if (!user) throw new BadRequestException('Reset link is invalid or expired');

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpiresAt: null },
    });

    // Invalidate all existing sessions on password change.
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  // ---------------------------------------------------------------------
  // Google OAuth (verifies a Google ID token from the frontend's Google
  // Identity Services sign-in). Requires GOOGLE_CLIENT_ID to be configured.
  // ---------------------------------------------------------------------
  async googleLogin(idToken: string) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Google login is not configured for this deployment');
    }

    const ticket = await this.googleClient.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.email) throw new UnauthorizedException('Invalid Google token');

    let user = await this.prisma.user.findUnique({ where: { email: payload.email } });

    if (!user) {
      // First time signing in with Google — create a personal organization.
      const org = await this.prisma.organization.create({
        data: { name: `${payload.given_name ?? payload.email}'s Workspace`, slug: slugify(payload.email) },
      });
      user = await this.prisma.user.create({
        data: {
          email: payload.email,
          fullName: payload.name ?? payload.email,
          avatarUrl: payload.picture,
          googleId: payload.sub,
          isEmailVerified: true,
        },
      });
     await this.prisma.orgMembership.create({
        data: { organizationId: org.id, userId: user.id, role: OrgRole.OWNER },
      });
      const pipeline = await this.prisma.pipeline.create({
        data: { organizationId: org.id, name: 'Sales Pipeline', isDefault: true },
      });
      await seedDemoDataForOrg(this.prisma, org.id, user.id, pipeline.id);
    } else if (!user.googleId) {
      user = await this.prisma.user.update({ where: { id: user.id }, data: { googleId: payload.sub } });
    }

    const membership = await this.prisma.orgMembership.findFirstOrThrow({ where: { userId: user.id } });
    const tokens = await this.issueTokens(user.id, user.email, membership.organizationId, membership.role);
    return { user: this.toPublicUser(user), ...tokens };
  }

  // ---------------------------------------------------------------------
  // Accept an org invitation -> creates the user (if new) and membership
  // ---------------------------------------------------------------------
  async acceptInvite(dto: AcceptInviteDto) {
    const invite = await this.prisma.orgInvitation.findUnique({ where: { token: dto.token } });
    if (!invite || invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
      throw new BadRequestException('Invitation is invalid or expired');
    }

    let user = await this.prisma.user.findUnique({ where: { email: invite.email } });
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: invite.email,
          fullName: dto.fullName,
          passwordHash,
          isEmailVerified: true, // invite flow implicitly verifies the email
        },
      });
    }

    await this.prisma.$transaction([
      this.prisma.orgMembership.upsert({
        where: { organizationId_userId: { organizationId: invite.organizationId, userId: user.id } },
        create: { organizationId: invite.organizationId, userId: user.id, role: invite.role },
        update: { role: invite.role },
      }),
      this.prisma.orgInvitation.update({ where: { id: invite.id }, data: { status: 'ACCEPTED' } }),
    ]);

    const tokens = await this.issueTokens(user.id, user.email, invite.organizationId, invite.role);
    return { user: this.toPublicUser(user), ...tokens };
  }

  // ---------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------
  private async issueTokens(
    userId: string,
    email: string,
    orgId: string,
    role: string,
    meta: { ip?: string; userAgent?: string } = {},
  ) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, orgId, role },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
      },
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const expiresInDays = 30;
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(rawRefreshToken),
        userAgent: meta.userAgent,
        ipAddress: meta.ip,
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 3600 * 1000),
      },
    });

    return { accessToken, refreshToken: rawRefreshToken, organizationId: orgId, role };
  }

  private toPublicUser(user: { id: string; email: string; fullName: string; avatarUrl?: string | null; isEmailVerified: boolean }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl ?? null,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
