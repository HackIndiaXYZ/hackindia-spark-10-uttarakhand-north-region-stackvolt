import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('crm/tasks')
@ApiBearerAuth()
@Controller('crm/tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  list(@CurrentUser('organizationId') organizationId: string, @Query('status') status?: string, @Query('assigneeId') assigneeId?: string) {
    return this.tasksService.list(organizationId, { status, assigneeId });
  }

  @Post()
  create(@CurrentUser('organizationId') organizationId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(organizationId, dto);
  }

  @Patch(':id')
  update(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(organizationId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.tasksService.remove(organizationId, id);
  }
}
