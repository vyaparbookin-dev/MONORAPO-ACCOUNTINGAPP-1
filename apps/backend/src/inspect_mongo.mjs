import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected successfully to DB:', mongoose.connection.name);

  const collections = await mongoose.connection.db.listCollections().toArray();
  const summary = [];
  for (const col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    if (count > 0) {
      summary.push({ name: col.name, count });
    }
  }

  console.log('\n=== MongoDB Collections with Data ===');
  summary.sort((a, b) => b.count - a.count).forEach(c => {
    console.log('- ' + c.name + ': ' + c.count + ' documents');
  });

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
}

run().catch(err => {
  console.error('Error connecting to MongoDB:', err.message);
  process.exit(1);
});
