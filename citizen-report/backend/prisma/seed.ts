import bcrypt from 'bcryptjs';
import { Role, Category, User } from '../src/models';
import { connectMongo, disconnectMongo } from '../src/lib/mongoose';

const CATEGORIES = [
  { slug: 'illegal_parking', name: 'უკანონო პარკინგი', nameEn: 'Illegal parking', description: 'სატრანსპორტო საშუალებები გაჩერებულია საგზაო წესების დარღვევით.' },
  { slug: 'blocked_sidewalk', name: 'დაბლოკილი ტროტუარი', nameEn: 'Blocked sidewalk', description: 'ქვეითთა გზის დაბლოკვა.' },
  { slug: 'abandoned_vehicle', name: 'მიტოვებული მანქანა', nameEn: 'Abandoned vehicle', description: 'დიდი ხნის განმავლობაში მიტოვებული სატრანსპორტო საშუალება.' },
  { slug: 'littering', name: 'ნაგვის გადაყრა', nameEn: 'Littering', description: 'საზოგადოებრივ ადგილებში ნარჩენების არაწესიერი გადაყრა.' },
  { slug: 'vandalism', name: 'ვანდალიზმი', nameEn: 'Vandalism', description: 'საჯარო ან კერძო საკუთრების დაზიანება.' },
  { slug: 'illegal_dumping', name: 'უკანონო ნარჩენების გადაყრა', nameEn: 'Illegal dumping', description: 'მსხვილი ან საშიში ნარჩენების უკანონო გადაყრა.' },
  { slug: 'noise', name: 'ხმაურის დარღვევა', nameEn: 'Noise violation', description: 'მოსახლეობის შემაწუხებელი გადაჭარბებული ხმაური.' },
  { slug: 'other', name: 'სხვა', nameEn: 'Other', description: 'სხვა სახის საჯარო სამართალდარღვევა.' },
];

async function main() {
  await connectMongo();

  for (const c of CATEGORIES) {
    await Category.updateOne(
      { slug: c.slug },
      { $set: { name: c.name, nameEn: c.nameEn, description: c.description }, $setOnInsert: { slug: c.slug } },
      { upsert: true },
    );
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@citizen-report.local';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!2024';
  const passwordHash = await bcrypt.hash(password, 12);

  await User.updateOne(
    { email },
    {
      $setOnInsert: {
        email,
        passwordHash,
        displayName: 'System Administrator',
        role: Role.ADMIN,
        emailVerified: true,
      },
    },
    { upsert: true },
  );
  console.log(`Seeded admin: ${email}`);
  console.log('⚠️  Change the admin password immediately in production.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMongo();
  });