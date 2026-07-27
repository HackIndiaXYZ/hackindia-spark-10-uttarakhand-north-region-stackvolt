import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { CustomersService } from '../../crm/customers/customers.service';
import { LeadsService } from '../../crm/leads/leads.service';
import { DealsService } from '../../crm/deals/deals.service';
import { TasksService } from '../../crm/tasks/tasks.service';
import { NotesService } from '../../crm/notes/notes.service';
import { ActivitiesService } from '../../crm/activities/activities.service';

/**
 * The tool schema exposed to Claude. Every tool here maps 1:1 to a real
 * CRM service call — there is no mocked/faked execution path. All calls are
 * automatically scoped to the caller's organization and cannot cross tenants.
 */
export const CRM_TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_customers',
    description: 'Search customers by name, company, or email. Returns up to 10 matches.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Free text search term' } },
      required: ['query'],
    },
  },
  {
    name: 'get_customer',
    description: 'Fetch full detail for one customer by id, including recent deals, notes, tasks and activity.',
    input_schema: {
      type: 'object',
      properties: { customerId: { type: 'string' } },
      required: ['customerId'],
    },
  },
  {
    name: 'create_customer',
    description: 'Create a new customer record.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        company: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_lead',
    description: 'Create a new sales lead.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        company: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        source: { type: 'string', description: 'Where the lead came from, e.g. "Website", "Referral"' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_leads',
    description: 'List leads, optionally filtered by status (NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED).',
    input_schema: {
      type: 'object',
      properties: { status: { type: 'string' } },
    },
  },
  {
    name: 'convert_lead_to_customer',
    description: 'Convert a qualified lead into a full customer record.',
    input_schema: {
      type: 'object',
      properties: { leadId: { type: 'string' } },
      required: ['leadId'],
    },
  },
  {
    name: 'create_deal',
    description: 'Create a new deal/opportunity, optionally linked to a customer.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        customerId: { type: 'string' },
        valueCents: { type: 'integer', description: 'Deal value in cents (e.g. $500 = 50000)' },
        currency: { type: 'string' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_deal_stage',
    description: 'Move a deal to a new pipeline stage (PROSPECTING, QUALIFICATION, PROPOSAL, NEGOTIATION, WON, LOST).',
    input_schema: {
      type: 'object',
      properties: {
        dealId: { type: 'string' },
        stage: { type: 'string' },
      },
      required: ['dealId', 'stage'],
    },
  },
  {
    name: 'list_deals_board',
    description: 'Get every open deal grouped by pipeline stage — useful for pipeline overviews and forecasting questions.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'create_task',
    description: 'Create a follow-up task, optionally linked to a customer or deal and assigned to a due date.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        dueAt: { type: 'string', description: 'ISO 8601 date' },
        customerId: { type: 'string' },
        dealId: { type: 'string' },
      },
      required: ['title'],
    },
  },
  {
    name: 'add_note',
    description: 'Attach a note to a customer or deal.',
    input_schema: {
      type: 'object',
      properties: {
        body: { type: 'string' },
        customerId: { type: 'string' },
        dealId: { type: 'string' },
      },
      required: ['body'],
    },
  },
  {
    name: 'get_recent_activity',
    description: 'Get the most recent CRM activity feed (created/updated customers, leads, deals, stage changes).',
    input_schema: {
      type: 'object',
      properties: { take: { type: 'integer' } },
    },
  },
  {
    name: 'save_customer_summary',
    description:
      'Persist a short AI-generated account summary onto a customer record so it shows on their profile. Call this after producing a summary of a customer, if the user asked for one.',
    input_schema: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        summary: { type: 'string' },
      },
      required: ['customerId', 'summary'],
    },
  },
];

@Injectable()
export class CrmToolExecutor {
  constructor(
    private customers: CustomersService,
    private leads: LeadsService,
    private deals: DealsService,
    private tasks: TasksService,
    private notes: NotesService,
    private activities: ActivitiesService,
  ) {}

  /** Executes one tool call. All lookups are scoped to organizationId. */
  async execute(name: string, input: any, organizationId: string, actorId: string): Promise<unknown> {
    switch (name) {
      case 'search_customers': {
        const result = await this.customers.list(organizationId, { search: input.query, take: 10 });
        return result.items;
      }
      case 'get_customer':
        return this.customers.get(organizationId, input.customerId);
      case 'create_customer':
        return this.customers.create(organizationId, actorId, input);
      case 'create_lead':
        return this.leads.create(organizationId, actorId, input);
      case 'list_leads': {
        const result = await this.leads.list(organizationId, { status: input.status, take: 25 });
        return result.items;
      }
      case 'convert_lead_to_customer':
        return this.leads.convertToCustomer(organizationId, actorId, input.leadId);
      case 'create_deal':
        return this.deals.create(organizationId, actorId, input);
      case 'update_deal_stage':
        return this.deals.update(organizationId, actorId, input.dealId, { stage: input.stage });
      case 'list_deals_board':
        return this.deals.board(organizationId);
      case 'create_task':
        return this.tasks.create(organizationId, input);
      case 'add_note':
        return this.notes.create(organizationId, actorId, input);
      case 'get_recent_activity':
        return this.activities.feed(organizationId, input.take ?? 20);
      case 'save_customer_summary':
        return this.customers.saveAiSummary(organizationId, input.customerId, input.summary);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
