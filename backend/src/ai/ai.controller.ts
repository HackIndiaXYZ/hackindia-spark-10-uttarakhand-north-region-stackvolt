import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AiService } from './ai.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class ChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  conversationId?: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  chat(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: ChatDto,
  ) {
    return this.aiService.chat(organizationId, userId, dto.conversationId, dto.message);
  }

  @Get('conversations')
  listConversations(@CurrentUser('organizationId') organizationId: string, @CurrentUser('userId') userId: string) {
    return this.aiService.listConversations(organizationId, userId);
  }

  @Get('conversations/:id')
  getConversation(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.aiService.getConversation(organizationId, userId, id);
  }
}
