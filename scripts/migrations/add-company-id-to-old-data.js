import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// --- कॉन्फ़िगरेशन ---
// ❗ यहाँ अपनी कंपनी ID डालें जो लॉग्स में मिली थी।
const YOUR_COMPANY_ID = '6a8314470d93e58ad0920950';

// उन सभी कलेक्शंस की लिस्ट जिन्हें अपडेट करना है।
const COLLECTIONS_TO_UPDATE = [
  'products',
  'bills',
  'parties',
  'expenses',
  'partytransactions',
  'stockadjustments',
  'leads',
  'quotations',
  'warehouses',
  'branches',
  'staffs',
  'salaries',
  'attendances',
  'coupons',
  'memberships',
  'reminders',
  'schemes',
];
// --------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// Backend के .env.local से वेरिएबल्स लोड करें
const envPath = path.resolve(projectRoot, 'apps', 'backend', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Loaded environment variables from .env.local');
} else {
  dotenv.config();
  console.log('✅ Loaded environment variables from platform environment.');
}

const runMigration = async () => {
  const dbURI = process.env.MONGO_URI; // Changed from DB_URI to MONGO_URI
  if (!dbURI) {
    console.error('❌ DB_URI not found in environment variables. Script cannot connect to the database.');
    process.exit(1);
  }

  if (!mongoose.Types.ObjectId.isValid(YOUR_COMPANY_ID)) {
    console.error(`❌ Invalid Company ID: "${YOUR_COMPANY_ID}". Please provide a valid MongoDB ObjectId.`);
    process.exit(1);
  }

  const companyObjectId = new mongoose.Types.ObjectId(YOUR_COMPANY_ID);

  try {
    await mongoose.connect(dbURI);
    console.log('✅ Successfully connected to MongoDB.');

    for (const collectionName of COLLECTIONS_TO_UPDATE) {
      console.log(`\n🚀 Processing collection: "${collectionName}"...`);
      
      const result = await mongoose.connection.db.collection(collectionName).updateMany(
        { companyId: { $exists: false } },
        { $set: { companyId: companyObjectId } }
      );

      if (result.modifiedCount > 0) {
        console.log(`  🟢 Success! Updated ${result.modifiedCount} documents in "${collectionName}".`);
      } else {
        console.log(`  ⚪️ No documents needed updating in "${collectionName}".`);
      }
    }

    console.log('\n\n✅✅✅ Data migration complete! ✅✅✅');
    console.log('Your old data should now be visible in the app.');

  } catch (error) {
    console.error('\n❌ An error occurred during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
  }
};

runMigration();