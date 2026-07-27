import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async feed(organizationId: string, take = 50) {
    return this.prisma.activity.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take,
      include: { actor: { select: { id: true, fullName: true } } },
    });
  }
}
