import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDealDto, UpdateDealDto } from './dto/deal.dto';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string, opts: { stage?: string; pipelineId?: string; skip?: number; take?: number } = {}) {
    const { stage, pipelineId, skip = 0, take = 50 } = opts;
    const where: any = { organizationId, deletedAt: null };
    if (stage) where.stage = stage;
    if (pipelineId) where.pipelineId = pipelineId;
    const [items, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { id: true, name: true } }, owner: { select: { id: true, fullName: true } } },
      }),
      this.prisma.deal.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  /** Grouped by stage, for a kanban board view. */
  async board(organizationId: string, pipelineId?: string) {
    const pipeline = pipelineId
      ? await this.prisma.pipeline.findFirst({ where: { id: pipelineId, organizationId } })
      : await this.prisma.pipeline.findFirst({ where: { organizationId, isDefault: true } });
    if (!pipeline) throw new NotFoundException('Pipeline not found');

    const deals = await this.prisma.deal.findMany({
      where: { organizationId, pipelineId: pipeline.id, deletedAt: null },
      include: { customer: { select: { id: true, name: true } }, owner: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const stages: Record<string, typeof deals> = {
      PROSPECTING: [],
      QUALIFICATION: [],
      PROPOSAL: [],
      NEGOTIATION: [],
      WON: [],
      LOST: [],
    };
    for (const deal of deals) stages[deal.stage].push(deal);

    return { pipeline, stages };
  }

  async get(organizationId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        customer: true,
        owner: { select: { id: true, fullName: true } },
        activities: { orderBy: { createdAt: 'desc' } },
        notes: { orderBy: { createdAt: 'desc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    return deal;
  }

  async create(organizationId: string, actorId: string, dto: CreateDealDto) {
    let pipelineId = dto.pipelineId;
    if (!pipelineId) {
      const defaultPipeline = await this.prisma.pipeline.findFirst({ where: { organizationId, isDefault: true } });
      if (!defaultPipeline) throw new BadRequestException('No pipeline configured for this organization');
      pipelineId = defaultPipeline.id;
    }

    const deal = await this.prisma.deal.create({
      data: {
        organizationId,
        pipelineId,
        title: dto.title,
        customerId: dto.customerId,
        valueCents: dto.valueCents ?? 0,
        currency: dto.currency ?? 'USD',
        probability: dto.probability ?? 10,
        ownerId: dto.ownerId,
        expectedCloseAt: dto.expectedCloseAt ? new Date(dto.expectedCloseAt) : undefined,
      },
    });
    await this.logActivity(organizationId, actorId, deal.id, `Deal "${deal.title}" was created`);
    return deal;
  }

  async update(organizationId: string, actorId: string, id: string, dto: UpdateDealDto) {
    const existing = await this.get(organizationId, id);
    const data: any = { ...dto };
    if (dto.expectedCloseAt) data.expectedCloseAt = new Date(dto.expectedCloseAt);
    if (dto.stage && (dto.stage === 'WON' || dto.stage === 'LOST')) data.closedAt = new Date();

    const deal = await this.prisma.deal.update({ where: { id }, data });

    if (dto.stage && dto.stage !== existing.stage) {
      await this.logActivity(
        organizationId,
        actorId,
        deal.id,
        `Deal stage changed: ${existing.stage} → ${dto.stage}`,
        'STAGE_CHANGE',
      );
    }
    return deal;
  }

  async remove(organizationId: string, actorId: string, id: string) {
    await this.get(organizationId, id);
    await this.prisma.deal.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  async saveAiSummary(organizationId: string, id: string, summary: string) {
    return this.prisma.deal.update({ where: { id }, data: { aiSummary: summary } });
  }

  private async logActivity(
    organizationId: string,
    actorId: string | undefined,
    dealId: string,
    summary: string,
    type: 'NOTE' | 'STAGE_CHANGE' = 'NOTE',
  ) {
    await this.prisma.activity.create({ data: { organizationId, actorId, dealId, type, summary } });
  }
}
