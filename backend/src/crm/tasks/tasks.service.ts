import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string, opts: { status?: string; assigneeId?: string } = {}) {
    const where: any = { organizationId };
    if (opts.status) where.status = opts.status;
    if (opts.assigneeId) where.assigneeId = opts.assigneeId;
    return this.prisma.task.findMany({ where, orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }] });
  }

  async create(organizationId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: { organizationId, ...dto, dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined },
    });
  }

  async update(organizationId: string, id: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.task.findFirst({ where: { id, organizationId } });
    if (!existing) throw new NotFoundException('Task not found');
    return this.prisma.task.update({
      where: { id },
      data: { ...dto, dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.prisma.task.deleteMany({ where: { id, organizationId } });
    return { success: true };
  }
}
