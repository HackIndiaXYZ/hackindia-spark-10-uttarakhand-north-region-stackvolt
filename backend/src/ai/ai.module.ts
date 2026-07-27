import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { CrmToolExecutor } from './tools/crm-tools';
import { CustomersService } from '../crm/customers/customers.service';
import { LeadsService } from '../crm/leads/leads.service';
import { DealsService } from '../crm/deals/deals.service';
import { TasksService } from '../crm/tasks/tasks.service';
import { NotesService } from '../crm/notes/notes.service';
import { ActivitiesService } from '../crm/activities/activities.service';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    CrmToolExecutor,
    CustomersService,
    LeadsService,
    DealsService,
    TasksService,
    NotesService,
    ActivitiesService,
  ],
})
export class AiModule {}
