import { Module } from '@nestjs/common';
import { CustomersController } from './customers/customers.controller';
import { CustomersService } from './customers/customers.service';
import { LeadsController } from './leads/leads.controller';
import { LeadsService } from './leads/leads.service';
import { DealsController } from './deals/deals.controller';
import { DealsService } from './deals/deals.service';
import { NotesController } from './notes/notes.controller';
import { NotesService } from './notes/notes.service';
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';
import { ActivitiesController } from './activities/activities.controller';
import { ActivitiesService } from './activities/activities.service';

@Module({
  controllers: [
    CustomersController,
    LeadsController,
    DealsController,
    NotesController,
    TasksController,
    ActivitiesController,
  ],
  providers: [
    CustomersService,
    LeadsService,
    DealsService,
    NotesService,
    TasksService,
    ActivitiesService,
  ],
  exports: [CustomersService, LeadsService, DealsService, NotesService, TasksService, ActivitiesService],
})
export class CrmModule {}
