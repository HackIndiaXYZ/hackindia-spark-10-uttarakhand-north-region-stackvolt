import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { CreateDealDto, UpdateDealDto } from './dto/deal.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('crm/deals')
@ApiBearerAuth()
@Controller('crm/deals')
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @Get()
  list(
    @CurrentUser('organizationId') organizationId: string,
    @Query('stage') stage?: string,
    @Query('pipelineId') pipelineId?: string,
  ) {
    return this.dealsService.list(organizationId, { stage, pipelineId });
  }

  @Get('board')
  board(@CurrentUser('organizationId') organizationId: string, @Query('pipelineId') pipelineId?: string) {
    return this.dealsService.board(organizationId, pipelineId);
  }

  @Get(':id')
  get(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.dealsService.get(organizationId, id);
  }

  @Post()
  create(@CurrentUser('organizationId') organizationId: string, @CurrentUser('userId') userId: string, @Body() dto: CreateDealDto) {
    return this.dealsService.create(organizationId, userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
  ) {
    return this.dealsService.update(organizationId, userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('organizationId') organizationId: string, @CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.dealsService.remove(organizationId, userId, id);
  }
}
