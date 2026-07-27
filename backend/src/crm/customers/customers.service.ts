import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string, opts: { search?: string; skip?: number; take?: number } = {}) {
    const { search, skip = 0, take = 25 } = opts;
    const where = {
      organizationId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { company: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.customer.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  async get(organizationId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        deals: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        notes: { orderBy: { createdAt: 'desc' }, take: 20 },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        tasks: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(organizationId: string, actorId: string, dto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: { organizationId, ...dto, tags: dto.tags ?? [] },
    });
    await this.logActivity(organizationId, actorId, customer.id, `Customer "${customer.name}" was created`);
    return customer;
  }

  async update(organizationId: string, actorId: string, id: string, dto: UpdateCustomerDto) {
    await this.get(organizationId, id);
    const customer = await this.prisma.customer.update({ where: { id }, data: dto });
    await this.logActivity(organizationId, actorId, customer.id, `Customer "${customer.name}" was updated`);
    return customer;
  }

  async remove(organizationId: string, actorId: string, id: string) {
    await this.get(organizationId, id);
    await this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.logActivity(organizationId, actorId, id, 'Customer was deleted');
    return { success: true };
  }

  async saveAiSummary(organizationId: string, id: string, summary: string) {
    return this.prisma.customer.update({
      where: { id },
      data: { aiSummary: summary, aiSummaryAt: new Date() },
    });
  }

  private async logActivity(organizationId: string, actorId: string | undefined, customerId: string, summary: string) {
    await this.prisma.activity.create({
      data: { organizationId, actorId, customerId, type: 'NOTE', summary },
    });
  }
}
