import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// Backend के .env.local से वेरिएबल्स लोड करें
const envPath = path.resolve(projectRoot, 'apps', 'backend', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Environment variables loaded from apps/backend/.env.local');
} else {
  dotenv.config();
  console.log('✅ Loaded environment variables from platform environment.');
}

const runDiagnostics = async () => {
  const dbURI = process.env.MONGO_URI;
  if (!dbURI) {
    console.error('❌ MONGO_URI not found in environment variables. Script cannot connect to the database.');
    process.exit(1);
  }

  let client;
  try {
    // Connect without a specific DB to access the admin features
    client = await mongoose.connect(dbURI);
    console.log('✅ Successfully connected to MongoDB instance.');
 
    const adminDb = client.connection.db.admin();
    const { databases } = await adminDb.listDatabases();

    console.log(`\n🔎 Found ${databases.length} databases. Scanning for your app data...`);
    console.log(`   Databases on this cluster: [${databases.map(db => db.name).join(', ')}]\n`);

    let dataFound = false;

    for (const dbInfo of databases) {
      const dbName = dbInfo.name;
      // Skip system databases
      if (['admin', 'local', 'config', 'sample_training', 'sample_supplies', 'sample_restaurants', 'sample_geospatial', 'sample_weatherdata', 'sample_analytics', 'sample_guides'].includes(dbName)) {
        continue; // Skip system databases
      }

      const currentDb = client.connection.useDb(dbName);
      const collections = await currentDb.db.listCollections({}, { nameOnly: true }).toArray();
      const collectionNames = collections.map(c => c.name);

      // Check if it's a potential app database by looking for key collections
      const isAppDB = collectionNames.includes('products') || collectionNames.includes('companies') || collectionNames.includes('users');

      if (isAppDB) {
        dataFound = true;
        console.log(`--- 📊 Found App Data in Database: "${dbName}" ---`);
        console.log(`  - Collections found: [${collectionNames.join(', ')}]`);

        // --- NEW DIAGNOSTIC STEP ---
        const oneProduct = await currentDb.collection('products').findOne({}, { projection: { _id: 1, name: 1 } });
        console.log(`  - 🔬 Sample Product Check: ${oneProduct ? `Found one product (Name: "${oneProduct.name}")` : 'findOne() returned null.'}`);

        // 1. Get total product count and count of products without a companyId
        const totalProducts = await currentDb.collection('products').countDocuments();
        const productsWithoutCompany = await currentDb.collection('products').countDocuments({ companyId: { $exists: false } });

        console.log(`  - 📈 Total Products in this DB: ${totalProducts}`);

        if (productsWithoutCompany > 0) {
          console.log(`  - ⚠️ Found ${productsWithoutCompany} products WITHOUT a Company ID (This is your old data).`);
        } else {
          if (totalProducts > 0) {
            console.log(`  - ✅ All ${totalProducts} products seem to have a Company ID.`);
          } else {
            console.log(`  - 텅 No products found in this database.`);
          }
        }

        // 2. Get company and user details if companies collection exists
        if (collectionNames.includes('companies')) {
            const companiesWithUsers = await currentDb.collection('companies').aggregate([
            {
                $lookup: {
                from: 'users',
                localField: 'user', // Changed from 'owner' to 'user' to match your Company model
                foreignField: '_id',
                as: 'ownerDetails'
                }
            },
            {
                $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: 'companyId',
                as: 'products'
                }
            },
            {
                $project: {
                _id: 1,
                name: 1,
                ownerEmail: '$ownerDetails.email',
                productCount: { $size: '$products' }
                }
            }
            ]).toArray();

            if (companiesWithUsers.length > 0) {
            console.log('  - Company Details:');
            companiesWithUsers.forEach(comp => {
                console.log(`    - Company: "${comp.name}" (ID: ${comp._id})`);
                console.log(`      - Owner Email: ${comp.ownerEmail || 'Not Found'}`);
                console.log(`      - Products Linked: ${comp.productCount}`);
            });
            }
        }
        console.log('--------------------------------------------------\n');
      }
    }

    if (!dataFound) {
      console.log("❌ No databases with 'products', 'companies', and 'users' collections were found.");
      console.log("   Please check if your MONGO_URI is correct and points to the right server cluster.");
    }

  } catch (error) {
    console.error('\n❌ An error occurred during diagnostics:', error);
  } finally {
    if (client) {
      await client.disconnect();
      console.log('🔌 Disconnected from MongoDB.');
    }
  }
};

runDiagnostics();