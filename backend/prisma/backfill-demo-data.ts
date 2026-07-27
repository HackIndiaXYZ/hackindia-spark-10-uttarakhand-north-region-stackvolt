import { PrismaClient } from '@prisma/client';
import { seedDemoDataForOrg } from '../src/common/demo-data';

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({ where: { deletedAt: null } });
  let updated = 0;

  for (const org of orgs) {
    const customerCount = await prisma.customer.count({ where: { organizationId: org.id } });
    if (customerCount > 0) {
      console.log(`Skipping "${org.name}" — already has data.`);
      continue;
    }

    // Prefer the org's OWNER as the record owner; fall back to any member.
    const membership =
      (await prisma.orgMembership.findFirst({ where: { organizationId: org.id, role: 'OWNER' } })) ??
      (await prisma.orgMembership.findFirst({ where: { organizationId: org.id } }));
    if (!membership) {
      console.log(`Skipping "${org.name}" — no members found.`);
      continue;
    }

    let pipeline = await prisma.pipeline.findFirst({ where: { organizationId: org.id, isDefault: true } });
    if (!pipeline) {
      pipeline = await prisma.pipeline.create({
        data: { organizationId: org.id, name: 'Sales Pipeline', isDefault: true },
      });
    }

    await seedDemoDataForOrg(prisma, org.id, membership.userId, pipeline.id);
    console.log(`Seeded demo data for "${org.name}".`);
    updated++;
  }

  console.log(`\nDone. Backfilled ${updated} organization(s) out of ${orgs.length} total.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });