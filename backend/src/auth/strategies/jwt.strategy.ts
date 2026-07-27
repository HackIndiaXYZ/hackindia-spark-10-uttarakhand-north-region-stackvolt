import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  orgId: string; // active organization
  role: string; // role within that organization
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: AccessTokenPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Account is no longer active');
    }

    const membership = await this.prisma.orgMembership.findUnique({
      where: { organizationId_userId: { organizationId: payload.orgId, userId: user.id } },
    });
    if (!membership) {
      throw new UnauthorizedException('No access to this organization');
    }

    // Attached to req.user; consumed via @CurrentUser()
    return {
      userId: user.id,
      email: user.email,
      organizationId: payload.orgId,
      role: membership.role,
    };
  }
}
