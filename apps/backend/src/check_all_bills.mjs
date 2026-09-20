import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log("All collections:", collections.map(c => c.name));

  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    if (count > 0) {
      console.log(`Collection: ${c.name} (Count: ${count})`);
      const sample = await db.collection(c.name).findOne({});
      if (sample && (sample.totalAmount || sample.grandTotal || sample.billNumber || sample.amount || sample.price)) {
        console.log(`   Sample from ${c.name}:`, {
          _id: sample._id,
          companyId: sample.companyId,
          billNumber: sample.billNumber,
          totalAmount: sample.totalAmount || sample.grandTotal || sample.amount,
          date: sample.date || sample.createdAt
        });
      }
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}
run();
