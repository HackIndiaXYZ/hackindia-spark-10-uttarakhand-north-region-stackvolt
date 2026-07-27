import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../auth/email.service';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/organizations.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private config: ConfigService,
  ) {}

  async getProfile(organizationId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async listMembers(organizationId: string) {
    return this.prisma.orgMembership.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, email: true, fullName: true, avatarUrl: true, isActive: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteMember(organizationId: string, invitedById: string, dto: InviteMemberDto) {
    const org = await this.getProfile(organizationId);

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      const alreadyMember = await this.prisma.orgMembership.findUnique({
        where: { organizationId_userId: { organizationId, userId: existingUser.id } },
      });
      if (alreadyMember) throw new ConflictException('This user is already a member of the organization');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const invite = await this.prisma.orgInvitation.create({
      data: {
        organizationId,
        email: dto.email,
        role: dto.role,
        token,
        invitedById,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });

    await this.email.sendInviteEmail(
      dto.email,
      org.name,
      token,
      this.config.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    );
    return invite;
  }

  async listInvitations(organizationId: string) {
    return this.prisma.orgInvitation.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
  }

  async revokeInvitation(organizationId: string, invitationId: string) {
    const invite = await this.prisma.orgInvitation.findFirst({ where: { id: invitationId, organizationId } });
    if (!invite) throw new NotFoundException('Invitation not found');
    return this.prisma.orgInvitation.update({ where: { id: invitationId }, data: { status: 'REVOKED' } });
  }

  async updateMemberRole(organizationId: string, membershipId: string, dto: UpdateMemberRoleDto) {
    const membership = await this.prisma.orgMembership.findFirst({
      where: { id: membershipId, organizationId },
    });
    if (!membership) throw new NotFoundException('Member not found');
    if (membership.role === 'OWNER' && dto.role !== 'OWNER') {
      const ownerCount = await this.prisma.orgMembership.count({ where: { organizationId, role: 'OWNER' } });
      if (ownerCount <= 1) throw new BadRequestException('An organization must always have at least one owner');
    }
    return this.prisma.orgMembership.update({ where: { id: membershipId }, data: { role: dto.role } });
  }

  async removeMember(organizationId: string, membershipId: string) {
    const membership = await this.prisma.orgMembership.findFirst({
      where: { id: membershipId, organizationId },
    });
    if (!membership) throw new NotFoundException('Member not found');
    if (membership.role === 'OWNER') {
      const ownerCount = await this.prisma.orgMembership.count({ where: { organizationId, role: 'OWNER' } });
      if (ownerCount <= 1) throw new BadRequestException('An organization must always have at least one owner');
    }
    await this.prisma.orgMembership.delete({ where: { id: membershipId } });
    return { success: true };
  }
}
