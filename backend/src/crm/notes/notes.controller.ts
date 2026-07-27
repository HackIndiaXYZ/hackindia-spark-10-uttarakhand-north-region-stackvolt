import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/note.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('crm/notes')
@ApiBearerAuth()
@Controller('crm/notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Post()
  create(@CurrentUser('organizationId') organizationId: string, @CurrentUser('userId') userId: string, @Body() dto: CreateNoteDto) {
    return this.notesService.create(organizationId, userId, dto);
  }

  @Get()
  list(
    @CurrentUser('organizationId') organizationId: string,
    @Query('customerId') customerId?: string,
    @Query('dealId') dealId?: string,
  ) {
    if (customerId) return this.notesService.listForCustomer(organizationId, customerId);
    if (dealId) return this.notesService.listForDeal(organizationId, dealId);
    return [];
  }

  @Delete(':id')
  remove(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.notesService.remove(organizationId, id);
  }
}
