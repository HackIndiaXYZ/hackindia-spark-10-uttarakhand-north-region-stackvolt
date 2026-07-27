import { PrismaClient, OrgRole, LeadStatus, DealStage } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function upsertCustomer(orgId: string, data: {
  name: string; company?: string; email?: string; phone?: string; tags?: string[];
}) {
  const existing = await prisma.customer.findFirst({ where: { organizationId: orgId, name: data.name } });
  if (existing) return existing;
  return prisma.customer.create({ data: { organizationId: orgId, ...data } });
}

async function upsertLead(orgId: string, data: {
  name: string; company?: string; email?: string; source?: string; status: LeadStatus; ownerId?: string;
}) {
  const existing = await prisma.lead.findFirst({ where: { organizationId: orgId, name: data.name } });
  if (existing) return existing;
  return prisma.lead.create({ data: { organizationId: orgId, ...data } });
}

async function upsertDeal(orgId: string, pipelineId: string, data: {
  title: string; customerId?: string; valueCents: number; stage: DealStage; probability: number; ownerId?: string;
}) {
  const existing = await prisma.deal.findFirst({ where: { organizationId: orgId, title: data.title } });
  if (existing) return existing;
  return prisma.deal.create({ data: { organizationId: orgId, pipelineId, ...data } });
}

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: 'stackvolt-demo' },
    update: {},
    create: { name: 'StackVolt Demo Co.', slug: 'stackvolt-demo' },
  });

  const passwordHash = await bcrypt.hash('Demo1234!', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@aitellion.dev' },
    update: {},
    create: {
      email: 'owner@aitellion.dev',
      fullName: 'Demo Owner',
      passwordHash,
      isEmailVerified: true,
    },
  });

  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: owner.id } },
    update: {},
    create: { organizationId: org.id, userId: owner.id, role: OrgRole.OWNER },
  });

  let pipeline = await prisma.pipeline.findFirst({ where: { organizationId: org.id, isDefault: true } });
  if (!pipeline) {
    pipeline = await prisma.pipeline.create({
      data: { organizationId: org.id, name: 'Sales Pipeline', isDefault: true },
    });
  }

  const customers = await Promise.all([
    upsertCustomer(org.id, {
      name: 'Rohan Mehta', company: 'Mehta Textiles', email: 'rohan@mehtatextiles.example',
      phone: '+91 98765 43210', tags: ['textiles', 'wholesale'],
    }),
    upsertCustomer(org.id, {
      name: 'Ananya Iyer', company: 'Iyer Digital Solutions', email: 'ananya@iyerdigital.example',
      phone: '+91 90000 11122', tags: ['agency', 'existing'],
    }),
    upsertCustomer(org.id, {
      name: 'Karan Bhatia', company: 'Bhatia Auto Parts', email: 'karan@bhatiaauto.example',
      phone: '+91 98123 45670', tags: ['manufacturing'],
    }),
    upsertCustomer(org.id, {
      name: 'Neha Kulkarni', company: 'Kulkarni Wellness Clinic', email: 'neha@kulkarniwellness.example',
      phone: '+91 99887 76655', tags: ['healthcare'],
    }),
    upsertCustomer(org.id, {
      name: 'Farhan Ali', company: 'Ali Freight Logistics', email: 'farhan@alifreight.example',
      phone: '+91 91234 56789', tags: ['logistics', 'wholesale'],
    }),
  ]);
  const [c1, c2, c3, c4, c5] = customers;

  await Promise.all([
    upsertLead(org.id, {
      name: 'Priya Sharma', company: 'Sharma Retail Group', email: 'priya@sharmaretail.example',
      source: 'Website', status: LeadStatus.NEW, ownerId: owner.id,
    }),
    upsertLead(org.id, {
      name: 'Vikram Rao', company: 'Rao Constructions', email: 'vikram@raoconstructions.example',
      source: 'Referral', status: LeadStatus.CONTACTED, ownerId: owner.id,
    }),
    upsertLead(org.id, {
      name: 'Sanya Kapoor', company: 'Kapoor Fashion House', email: 'sanya@kapoorfashion.example',
      source: 'Instagram', status: LeadStatus.QUALIFIED, ownerId: owner.id,
    }),
    upsertLead(org.id, {
      name: 'Arjun Nair', company: 'Nair Electronics', email: 'arjun@nairelectronics.example',
      source: 'Trade show', status: LeadStatus.NEW, ownerId: owner.id,
    }),
    upsertLead(org.id, {
      name: 'Meera Joshi', company: 'Joshi Bakery Chain', email: 'meera@joshibakery.example',
      source: 'Google Ads', status: LeadStatus.UNQUALIFIED, ownerId: owner.id,
    }),
  ]);

  await Promise.all([
    upsertDeal(org.id, pipeline.id, {
      title: 'Annual fabric supply contract', customerId: c1.id, valueCents: 1_250_000,
      stage: DealStage.PROPOSAL, probability: 60, ownerId: owner.id,
    }),
    upsertDeal(org.id, pipeline.id, {
      title: 'Website + brand refresh', customerId: c2.id, valueCents: 350_000,
      stage: DealStage.NEGOTIATION, probability: 75, ownerId: owner.id,
    }),
    upsertDeal(org.id, pipeline.id, {
      title: 'Bulk auto parts order — Q3', customerId: c3.id, valueCents: 890_000,
      stage: DealStage.QUALIFICATION, probability: 40, ownerId: owner.id,
    }),
    upsertDeal(org.id, pipeline.id, {
      title: 'Clinic management software', customerId: c4.id, valueCents: 220_000,
      stage: DealStage.WON, probability: 100, ownerId: owner.id,
    }),
    upsertDeal(org.id, pipeline.id, {
      title: 'Fleet logistics contract renewal', customerId: c5.id, valueCents: 640_000,
      stage: DealStage.PROSPECTING, probability: 20, ownerId: owner.id,
    }),
  ]);

  const existingNote = await prisma.note.findFirst({ where: { organizationId: org.id, customerId: c1.id } });
  if (!existingNote) {
    await prisma.note.create({
      data: {
        organizationId: org.id,
        authorId: owner.id,
        customerId: c1.id,
        body: 'Follow up after Diwali — wants updated pricing for the new cotton blend.',
      },
    });
  }

  const existingTask = await prisma.task.findFirst({ where: { organizationId: org.id, title: 'Send updated proposal to Mehta Textiles' } });
  if (!existingTask) {
    await prisma.task.create({
      data: {
        organizationId: org.id,
        title: 'Send updated proposal to Mehta Textiles',
        description: 'Include new cotton blend pricing discussed on the last call.',
        assigneeId: owner.id,
        customerId: c1.id,
        dueAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      },
    });
  }

  console.log('Seed complete.');
  console.log('Login with: owner@aitellion.dev / Demo1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });