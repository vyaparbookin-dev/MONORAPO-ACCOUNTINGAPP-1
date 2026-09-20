import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function listAllDatabases() {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log("All Databases on MongoDB Atlas Cluster:", dbs.databases.map(d => ({ name: d.name, sizeOnDisk: d.sizeOnDisk })));

  for (const dbInfo of dbs.databases) {
    if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
    const db = mongoose.connection.client.db(dbInfo.name);
    const collections = await db.listCollections().toArray();
    console.log(`\n=== Database: ${dbInfo.name} (Collections: ${collections.length}) ===`);
    for (const c of collections) {
      const count = await db.collection(c.name).countDocuments();
      if (count > 0) {
        console.log(`  - Collection ${c.name}: ${count} docs`);
        // Check for 5000 in this collection
        const matches5000 = await db.collection(c.name).find({
          $or: [
            { amount: 5000 },
            { totalAmount: 5000 },
            { finalAmount: 5000 },
            { total: 5000 },
            { grandTotal: 5000 },
            { debit: 5000 },
            { credit: 5000 },
            { balance: 5000 },
            { notes: /5000/ },
            { details: /5000/ },
            { customerName: /5000/ }
          ]
        }).toArray();
        if (matches5000.length > 0) {
          console.log(`    🎯 FOUND 5000 MATCH IN [${dbInfo.name}.${c.name}]:`, JSON.stringify(matches5000, null, 2));
        }
      }
    }
  }

  await mongoose.disconnect();
}

listAllDatabases().catch(console.error);
