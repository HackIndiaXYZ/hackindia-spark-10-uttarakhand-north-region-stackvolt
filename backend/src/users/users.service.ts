import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async me(userId: string, organizationId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const membership = await this.prisma.orgMembership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
      role: membership?.role,
      organizationId,
    };
  }

  async updateProfile(userId: string, data: { fullName?: string; avatarUrl?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }
}
