import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('crm/customers')
@ApiBearerAuth()
@Controller('crm/customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  list(
    @CurrentUser('organizationId') organizationId: string,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.customersService.list(organizationId, {
      search,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get(':id')
  get(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.customersService.get(organizationId, id);
  }

  @Post()
  create(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(organizationId, userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(organizationId, userId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.customersService.remove(organizationId, userId, id);
  }
}
