import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string, opts: { status?: string; skip?: number; take?: number } = {}) {
    const { status, skip = 0, take = 25 } = opts;
    const where: any = { organizationId, deletedAt: null };
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { owner: { select: { id: true, fullName: true } } } }),
      this.prisma.lead.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  async get(organizationId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { owner: { select: { id: true, fullName: true } }, activities: { orderBy: { createdAt: 'desc' } } },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async create(organizationId: string, actorId: string, dto: CreateLeadDto) {
    const lead = await this.prisma.lead.create({ data: { organizationId, ...dto } });
    await this.logActivity(organizationId, actorId, lead.id, `Lead "${lead.name}" was created`);
    return lead;
  }

  async update(organizationId: string, actorId: string, id: string, dto: UpdateLeadDto) {
    const existing = await this.get(organizationId, id);
    const lead = await this.prisma.lead.update({ where: { id }, data: dto });
    if (dto.status && dto.status !== existing.status) {
      await this.logActivity(organizationId, actorId, lead.id, `Lead status changed: ${existing.status} → ${dto.status}`, 'STAGE_CHANGE');
    }
    return lead;
  }

  async remove(organizationId: string, actorId: string, id: string) {
    await this.get(organizationId, id);
    await this.prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  /** Converts a qualified lead into a Customer record + logs the activity. */
  async convertToCustomer(organizationId: string, actorId: string, id: string) {
    const lead = await this.get(organizationId, id);
    if (lead.convertedCustomerId) throw new BadRequestException('Lead has already been converted');

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const customer = await tx.customer.create({
        data: {
          organizationId,
          name: lead.name,
          company: lead.company,
          email: lead.email,
          phone: lead.phone,
        },
      });
      await tx.lead.update({
        where: { id: lead.id },
        data: { status: 'CONVERTED', convertedCustomerId: customer.id },
      });
      await tx.activity.create({
        data: {
          organizationId,
          actorId,
          customerId: customer.id,
          leadId: lead.id,
          type: 'STAGE_CHANGE',
          summary: `Converted from lead "${lead.name}"`,
        },
      });
      return customer;
    });

    return result;
  }

  private async logActivity(
    organizationId: string,
    actorId: string | undefined,
    leadId: string,
    summary: string,
    type: 'NOTE' | 'STAGE_CHANGE' = 'NOTE',
  ) {
    await this.prisma.activity.create({ data: { organizationId, actorId, leadId, type, summary } });
  }
}
