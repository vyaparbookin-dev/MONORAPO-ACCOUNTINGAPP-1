import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function searchHardwareData() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log("=== ALL COLLECTIONS WITH GANESH HARDWARE DATA (6a8314470d93e58ad0920950) ===");

  for (const c of collections) {
    const col = db.collection(c.name);
    const count = await col.countDocuments({
      $or: [
        { companyId: "6a8314470d93e58ad0920950" },
        { companyId: new mongoose.Types.ObjectId("6a8314470d93e58ad0920950") }
      ]
    });
    if (count > 0) {
      console.log(`- Collection [${c.name}]: ${count} docs`);
      const sample = await col.find({
        $or: [
          { companyId: "6a8314470d93e58ad0920950" },
          { companyId: new mongoose.Types.ObjectId("6a8314470d93e58ad0920950") }
        ]
      }).limit(5).toArray();
      console.log(`  Sample:`, JSON.stringify(sample.map(d => ({
        _id: d._id,
        name: d.name || d.customerName || d.title,
        amount: d.amount || d.totalAmount || d.finalAmount || d.debit || d.credit,
        date: d.date || d.createdAt
      })), null, 2));
    }
  }

  await mongoose.disconnect();
}

searchHardwareData().catch(console.error);
