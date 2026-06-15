import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const names: Record<string, string> = {
  'უკანონო პარკინგი': 'Illegal parking',
  'დაბლოკილი ტროტუარი': 'Blocked sidewalk',
  'მიტოვებული მანქანა': 'Abandoned vehicle',
  'უადგილოდ მოთავსებული ნაგავი': 'Littering',
  'ვანდალიზმი': 'Vandalism',
  'უკანონო ნარჩენების გადაყრა': 'Illegal dumping',
};

mongoose.connect(process.env.MONGODB_URI!).then(async () => {
  const col = mongoose.connection.collection('categories');
  for (const [name, nameEn] of Object.entries(names)) {
    await col.updateOne({ name }, { $set: { nameEn } });
    console.log(`Updated: ${name} -> ${nameEn}`);
  }
  console.log('Done!');
  process.exit(0);
});