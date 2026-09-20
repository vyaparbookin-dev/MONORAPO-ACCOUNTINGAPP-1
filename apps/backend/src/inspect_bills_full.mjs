import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  
  const sample = await db.collection('bills').findOne({});
  console.log("Sample Bill document keys & structure:", JSON.stringify(sample, null, 2));

  const allCompanies = await db.collection('companies').find({}).toArray();
  console.log("Companies in MongoDB:", allCompanies.map(c => ({ _id: c._id, name: c.name || c.companyName || c.businessName, businessType: c.businessType, modules: c.modulesEnabled || c.activeModules || c.modules })));

  await mongoose.disconnect();
  process.exit(0);
}
run();
