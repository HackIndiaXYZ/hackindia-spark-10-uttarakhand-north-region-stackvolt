import { PrismaService } from '../prisma/prisma.service';

/**
 * TEMPORARY: canned/preset responses used while the Anthropic API is not
 * wired up (to avoid API cost during early testing). Swap `chat()` in
 * ai.service.ts back to the real Anthropic call whenever ready — the
 * conversation history, persistence, and UI all stay the same either way.
 *
 * A few patterns below still hit the real database for counts, so those
 * numbers are always accurate — only the "personality"/wording is canned.
 *
 * Every reply gets a standard trailing note reminding the person this is
 * limited/demo mode, so there's never any ambiguity about capability.
 */
const LIMITED_MODE_NOTE =
  "\n\n_Note: I'm currently working in a limited demo mode — full conversational AI is coming soon._";

export async function getCannedReply(
  prisma: PrismaService,
  organizationId: string,
  message: string,
): Promise<string> {
  const text = message.toLowerCase().trim();
  const has = (...keywords: string[]) => keywords.some((k) => text.includes(k));

  let reply: string;

  if (has('hi', 'hello', 'hey', 'namaste')) {
    reply =
      "Hi! I'm the AITELLION AI Assistant. I can tell you real numbers about your customers, leads, and deals — try asking 'how many customers do I have?'";
  } else if (has('how many customer', 'customer count', 'total customers', 'number of customers')) {
    const count = await prisma.customer.count({ where: { organizationId, deletedAt: null } });
    reply = `You currently have ${count} customer${count === 1 ? '' : 's'} in AITELLION.`;
  } else if (has('how many lead', 'lead count', 'total leads', 'number of leads')) {
    const count = await prisma.lead.count({ where: { organizationId, deletedAt: null } });
    reply = `You currently have ${count} lead${count === 1 ? '' : 's'} in the pipeline.`;
  } else if (has('how many deal', 'deal count', 'pipeline value', 'pipeline', 'open deals')) {
    const deals = await prisma.deal.findMany({ where: { organizationId, deletedAt: null } });
    const open = deals.filter((d: { stage: string }) => d.stage !== 'WON' && d.stage !== 'LOST');
    const totalCents = open.reduce((sum: number, d: { valueCents: number }) => sum + d.valueCents, 0);
    const total = (totalCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    reply = `You have ${open.length} open deal${open.length === 1 ? '' : 's'} worth ${total} in total, out of ${deals.length} deals overall.`;
  } else if (has('who are you', 'what are you', 'what can you do')) {
    reply =
      'I\'m the AITELLION AI Assistant, built by Team StackVolt. Once fully enabled, I can look up and create customers, leads and deals, move deals through stages, add notes and tasks, and summarize accounts.';
  } else if (has('help', 'what should i ask', 'commands')) {
    reply =
      "Try asking things like:\n• How many customers do I have?\n• How many leads do I have?\n• What's my pipeline value?";
  } else if (has('create', 'add a', 'convert', 'move', 'update', 'delete')) {
    reply =
      'Taking actions through chat (like creating or updating records) will be available once the live AI is switched on. For now, please use the buttons on the Customers, Leads, or Deals pages.';
  } else if (has('summar', 'summary')) {
    reply =
      "Account summaries will be available once the live AI is switched on. For now, you can review a customer's notes and deals directly on their profile page.";
  } else if (has('thank', 'thanks', 'shukriya')) {
    reply = "You're welcome! Let me know if there's anything else you'd like to check.";
  } else {
    reply =
      'I can currently answer a few preset questions — try asking about your customer count, lead count, or pipeline value.';
  }

  return reply + LIMITED_MODE_NOTE;
}