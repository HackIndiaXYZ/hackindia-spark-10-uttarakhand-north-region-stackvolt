import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('crm/leads')
@ApiBearerAuth()
@Controller('crm/leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  list(
    @CurrentUser('organizationId') organizationId: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.leadsService.list(organizationId, { status, skip: skip ? +skip : undefined, take: take ? +take : undefined });
  }

  @Get(':id')
  get(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.leadsService.get(organizationId, id);
  }

  @Post()
  create(@CurrentUser('organizationId') organizationId: string, @CurrentUser('userId') userId: string, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(organizationId, userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(organizationId, userId, id, dto);
  }

  @Post(':id/convert')
  convert(@CurrentUser('organizationId') organizationId: string, @CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.leadsService.convertToCustomer(organizationId, userId, id);
  }

  @Delete(':id')
  remove(@CurrentUser('organizationId') organizationId: string, @CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.leadsService.remove(organizationId, userId, id);
  }
}
