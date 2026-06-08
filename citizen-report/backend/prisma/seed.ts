/**
 * Seeds default report categories and an initial admin account.
 * Idempotent — safe to run repeatedly. Run with: npm run seed
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: 'illegal_parking', name: 'Illegal parking', description: 'Vehicles parked in violation of traffic rules.' },
  { slug: 'blocked_sidewalk', name: 'Blocked sidewalk', description: 'Obstruction of pedestrian walkways.' },
  { slug: 'abandoned_vehicle', name: 'Abandoned vehicle', description: 'Vehicles left unattended for a long period.' },
  { slug: 'littering', name: 'Littering', description: 'Improper disposal of waste in public spaces.' },
  { slug: 'vandalism', name: 'Vandalism', description: 'Damage or defacement of public/private property.' },
  { slug: 'illegal_dumping', name: 'Illegal dumping', description: 'Dumping of bulky or hazardous waste.' },
  { slug: 'noise', name: 'Noise violation', description: 'Excessive noise disturbing the public.' },
  { slug: 'other', name: 'Other', description: 'Any other potential public infraction.' },
];

async function main() {
  // Categories
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: c,
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);

  // Initial admin
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@citizen-report.local';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!2024';
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      displayName: 'System Administrator',
      role: Role.ADMIN,
      emailVerified: true,
    },
  });
  console.log(`Seeded admin: ${email}`);
  console.log('⚠️  Change the admin password immediately in production.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
