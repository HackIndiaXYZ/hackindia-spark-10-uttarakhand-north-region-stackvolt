import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser('userId') userId: string, @CurrentUser('organizationId') organizationId: string) {
    return this.usersService.me(userId, organizationId);
  }

  @Patch('me')
  updateProfile(@CurrentUser('userId') userId: string, @Body() body: { fullName?: string; avatarUrl?: string }) {
    return this.usersService.updateProfile(userId, body);
  }
}
