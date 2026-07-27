import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNoteDto } from './dto/note.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, authorId: string, dto: CreateNoteDto) {
    return this.prisma.note.create({ data: { organizationId, authorId, ...dto } });
  }

  async listForCustomer(organizationId: string, customerId: string) {
    return this.prisma.note.findMany({ where: { organizationId, customerId }, orderBy: { createdAt: 'desc' } });
  }

  async listForDeal(organizationId: string, dealId: string) {
    return this.prisma.note.findMany({ where: { organizationId, dealId }, orderBy: { createdAt: 'desc' } });
  }

  async remove(organizationId: string, id: string) {
    await this.prisma.note.deleteMany({ where: { id, organizationId } });
    return { success: true };
  }
}
