import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('crm/activities')
@ApiBearerAuth()
@Controller('crm/activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get('feed')
  feed(@CurrentUser('organizationId') organizationId: string, @Query('take') take?: string) {
    return this.activitiesService.feed(organizationId, take ? Number(take) : undefined);
  }
}
