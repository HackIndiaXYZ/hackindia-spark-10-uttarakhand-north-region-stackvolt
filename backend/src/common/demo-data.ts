import { DealStage, LeadStatus } from '@prisma/client';

/**
 * Populates a brand-new organization with a small set of realistic sample
 * records (customers, leads, deals) so a fresh signup doesn't look empty.
 * Called right after a new org + pipeline are created, both from normal
 * signup and from first-time Google sign-in.
 *
 * `tx` is typed loosely (Prisma.TransactionClient | PrismaService) since
 * both expose the same model methods used here.
 */
export async function seedDemoDataForOrg(
  tx: any,
  organizationId: string,
  ownerId: string,
  pipelineId: string,
) {
  const customer1 = await tx.customer.create({
    data: {
      organizationId,
      name: 'Rohan Mehta',
      company: 'Mehta Textiles',
      email: 'rohan@mehtatextiles.example',
      phone: '+91 98765 43210',
      tags: ['textiles', 'wholesale'],
    },
  });

  const customer2 = await tx.customer.create({
    data: {
      organizationId,
      name: 'Ananya Iyer',
      company: 'Iyer Digital Solutions',
      email: 'ananya@iyerdigital.example',
      phone: '+91 90000 11122',
      tags: ['agency'],
    },
  });

  const customer3 = await tx.customer.create({
    data: {
      organizationId,
      name: 'Karan Bhatia',
      company: 'Bhatia Auto Parts',
      email: 'karan@bhatiaauto.example',
      phone: '+91 98123 45670',
      tags: ['manufacturing'],
    },
  });

  const customer4 = await tx.customer.create({
    data: {
      organizationId,
      name: 'Neha Kulkarni',
      company: 'Kulkarni Wellness Clinic',
      email: 'neha@kulkarniwellness.example',
      phone: '+91 99887 76655',
      tags: ['healthcare'],
    },
  });

  await Promise.all([
    tx.lead.create({
      data: {
        organizationId,
        name: 'Priya Sharma',
        company: 'Sharma Retail Group',
        email: 'priya@sharmaretail.example',
        source: 'Website',
        status: LeadStatus.NEW,
        ownerId,
      },
    }),
    tx.lead.create({
      data: {
        organizationId,
        name: 'Vikram Rao',
        company: 'Rao Constructions',
        email: 'vikram@raoconstructions.example',
        source: 'Referral',
        status: LeadStatus.CONTACTED,
        ownerId,
      },
    }),
    tx.lead.create({
      data: {
        organizationId,
        name: 'Sanya Kapoor',
        company: 'Kapoor Fashion House',
        email: 'sanya@kapoorfashion.example',
        source: 'Instagram',
        status: LeadStatus.QUALIFIED,
        ownerId,
      },
    }),
    tx.lead.create({
      data: {
        organizationId,
        name: 'Arjun Nair',
        company: 'Nair Electronics',
        email: 'arjun@nairelectronics.example',
        source: 'Trade show',
        status: LeadStatus.NEW,
        ownerId,
      },
    }),
  ]);

  await Promise.all([
    tx.deal.create({
      data: {
        organizationId,
        pipelineId,
        customerId: customer1.id,
        title: 'Annual fabric supply contract',
        valueCents: 1_250_000,
        stage: DealStage.PROPOSAL,
        probability: 60,
        ownerId,
      },
    }),
    tx.deal.create({
      data: {
        organizationId,
        pipelineId,
        customerId: customer2.id,
        title: 'Website + brand refresh',
        valueCents: 350_000,
        stage: DealStage.NEGOTIATION,
        probability: 75,
        ownerId,
      },
    }),
    tx.deal.create({
      data: {
        organizationId,
        pipelineId,
        customerId: customer3.id,
        title: 'Bulk auto parts order — Q3',
        valueCents: 890_000,
        stage: DealStage.QUALIFICATION,
        probability: 40,
        ownerId,
      },
    }),
    tx.deal.create({
      data: {
        organizationId,
        pipelineId,
        customerId: customer4.id,
        title: 'Clinic management software',
        valueCents: 220_000,
        stage: DealStage.WON,
        probability: 100,
        ownerId,
      },
    }),
  ]);

  await tx.note.create({
    data: {
      organizationId,
      authorId: ownerId,
      customerId: customer1.id,
      body: 'Follow up after Diwali — wants updated pricing for the new cotton blend.',
    },
  });

  await tx.task.create({
    data: {
      organizationId,
      title: 'Send updated proposal to Mehta Textiles',
      description: 'Include new cotton blend pricing discussed on the last call.',
      assigneeId: ownerId,
      customerId: customer1.id,
      dueAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    },
  });
}