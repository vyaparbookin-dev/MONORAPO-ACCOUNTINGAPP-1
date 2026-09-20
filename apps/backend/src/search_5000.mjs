import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function searchMongo() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log("=== SEARCHING MONGODB FOR 5000 OR SALES DATA ===");

  for (const c of collections) {
    const col = db.collection(c.name);
    // Find documents with 5000 or similar
    const docs = await col.find({
      $or: [
        { amount: 5000 },
        { totalAmount: 5000 },
        { finalAmount: 5000 },
        { total: 5000 },
        { debit: 5000 },
        { credit: 5000 },
        { balance: 5000 },
        { openingBalance: 5000 },
        { currentBalance: 5000 },
        { price: 5000 },
        { notes: /5000/ },
        { details: /5000/ },
        { description: /5000/ },
        { customerName: /5000/ }
      ]
    }).toArray();

    if (docs.length > 0) {
      console.log(`FOUND in collection [${c.name}]: count = ${docs.length}`);
      console.log(JSON.stringify(docs, null, 2));
    }
  }

  // Also check party transactions in case there are 5000 or 2-3 sales entries
  console.log("\n=== ALL PARTY TRANSACTIONS ===");
  const allTxs = await db.collection('partytransactions').find({}).toArray();
  console.log(JSON.stringify(allTxs, null, 2));

  // Also check bills count & sample
  console.log("\n=== ALL BILLS (recent 10 or non-demo) ===");
  const nonDemoBills = await db.collection('bills').find({
    $or: [
      { companyId: "6a8314470d93e58ad0920950" },
      { companyId: new mongoose.Types.ObjectId("6a8314470d93e58ad0920950") },
      { customerName: { $not: /AC Hall Regular/ } }
    ]
  }).toArray();
  console.log(`Non-demo or Ganesh Hardware bills count: ${nonDemoBills.length}`);
  if (nonDemoBills.length > 0) {
    console.log(JSON.stringify(nonDemoBills.slice(0, 10), null, 2));
  }

  await mongoose.disconnect();
}

searchMongo().catch(console.error);
