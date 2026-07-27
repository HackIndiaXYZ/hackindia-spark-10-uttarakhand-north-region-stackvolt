import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import { CRM_TOOLS, CrmToolExecutor } from './tools/crm-tools';
import { getCannedReply } from './canned-responses';

// TEMPORARY SWITCH: set to false once ready to use the real Anthropic API
// (make sure ANTHROPIC_API_KEY is set in .env / Railway variables first).
const USE_CANNED_RESPONSES = true;

const SYSTEM_PROMPT = `You are the AITELLION AI Assistant, built by Team StackVolt.
You help small and medium businesses run their operations — starting with their CRM.
You can look up and create customers, leads, and deals; move deals through the pipeline;
create tasks and notes; and summarize account activity, using the tools available to you.

Rules:
- Always use tools to look up or change real data — never invent customer names, deal values, or IDs.
- Confirm destructive or high-impact actions (large deal value changes, stage moves to WON/LOST) by
  restating what you're about to do in your final answer.
- Keep answers concise and business-focused. Use bullet points for lists of records.
- Amounts are stored in cents; convert to a normal currency figure when talking to the user.
- If a request is ambiguous (e.g. which customer named "Sam"), ask a clarifying question instead of guessing.
- When asked to summarize a customer/account, call save_customer_summary after producing the summary so it persists on their profile.`;

const MAX_TOOL_ITERATIONS = 6;

@Injectable()
export class AiService {
  private client: Anthropic;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private toolExecutor: CrmToolExecutor,
  ) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.client = new Anthropic({ apiKey: apiKey || undefined });
  }

  async listConversations(organizationId: string, userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { organizationId, userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversation(organizationId: string, userId: string, conversationId: string) {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: { id: conversationId, organizationId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async chat(organizationId: string, userId: string, conversationId: string | undefined, userMessage: string) {
    if (USE_CANNED_RESPONSES) {
      return this.chatCanned(organizationId, userId, conversationId, userMessage);
    }

    if (!this.config.get<string>('ANTHROPIC_API_KEY')) {
      throw new BadRequestException(
        'ANTHROPIC_API_KEY is not configured on this deployment. Set it in the backend .env to enable the AI Assistant.',
      );
    }

    const conversation = conversationId
      ? await this.getConversation(organizationId, userId, conversationId)
      : await this.prisma.aiConversation.create({
          data: {
            organizationId,
            userId,
            title: userMessage.slice(0, 60),
          },
          include: { messages: true },
        });

    await this.prisma.aiMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: userMessage },
    });

    // Rebuild full history for context (conversation memory).
    const history = await this.prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    const messages: Anthropic.MessageParam[] = history.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    let finalText = '';
    const executedToolCalls: Array<{ name: string; input: unknown; output: unknown }> = [];

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        tools: CRM_TOOLS,
        messages,
      });

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );
      const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text');
      finalText = textBlocks.map((b) => b.text).join('\n');

      if (response.stop_reason !== 'tool_use' || toolUseBlocks.length === 0) {
        break;
      }

      messages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        let output: unknown;
        let isError = false;
        try {
          output = await this.toolExecutor.execute(toolUse.name, toolUse.input, organizationId, userId);
        } catch (err) {
          output = { error: err instanceof Error ? err.message : 'Tool execution failed' };
          isError = true;
        }
        executedToolCalls.push({ name: toolUse.name, input: toolUse.input, output });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(output),
          is_error: isError,
        });
      }
      messages.push({ role: 'user', content: toolResults });
    }

    await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: finalText || '(No response generated)',
        toolCalls: executedToolCalls.length ? (executedToolCalls as any) : undefined,
      },
    });

    await this.prisma.aiConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    if (executedToolCalls.length > 0) {
      await this.prisma.activity.create({
        data: {
          organizationId,
          actorId: userId,
          type: 'AI_ACTION',
          summary: `AI Assistant executed: ${executedToolCalls.map((t) => t.name).join(', ')}`,
          metadata: executedToolCalls as any,
        },
      });
    }

    return {
      conversationId: conversation.id,
      message: finalText,
      toolCalls: executedToolCalls,
    };
  }

  /**
   * Canned-response path — used while USE_CANNED_RESPONSES is true.
   * Still creates/persists the conversation and messages exactly like the
   * real path, so the UI and history work identically either way.
   */
  private async chatCanned(
    organizationId: string,
    userId: string,
    conversationId: string | undefined,
    userMessage: string,
  ) {
    const conversation = conversationId
      ? await this.getConversation(organizationId, userId, conversationId)
      : await this.prisma.aiConversation.create({
          data: { organizationId, userId, title: userMessage.slice(0, 60) },
        });

    await this.prisma.aiMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: userMessage },
    });

    const replyText = await getCannedReply(this.prisma, organizationId, userMessage);

    await this.prisma.aiMessage.create({
      data: { conversationId: conversation.id, role: 'assistant', content: replyText },
    });

    await this.prisma.aiConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId: conversation.id,
      message: replyText,
      toolCalls: [],
    };
  }
}