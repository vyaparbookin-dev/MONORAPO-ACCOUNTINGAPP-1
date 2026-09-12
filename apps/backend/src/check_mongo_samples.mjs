import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  for (const c of ['categories', 'brands', 'units', 'expenses', 'staffs', 'attendances']) {
    const doc = await db.collection(c).findOne({});
    console.log('--- ' + c + ' sample ---');
    console.log(JSON.stringify(doc, null, 2));
  }
  await mongoose.disconnect();
  process.exit(0);
}
run();
