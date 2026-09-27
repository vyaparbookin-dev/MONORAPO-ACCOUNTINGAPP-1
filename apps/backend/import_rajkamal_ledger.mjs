import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const uri = process.env.MONGO_URI;
const jsonPath = path.resolve('C:/Users/Lenovo1/.gemini/antigravity/brain/7fcea790-b331-4035-b8cf-6ef9bed1a3cc/scratch/rajkamal_rows.json');

function parseDate(s) {
  if (!s) return new Date();
  s = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const parts = s.split(' ')[0].split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
  }
  const parts = s.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      return new Date(y, m, d, 12, 0, 0);
    }
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}

async function runImport() {
  console.log("Connecting to Mongo:", uri);
  await mongoose.connect(uri);
  console.log("Connected to MongoDB database:", mongoose.connection.db.databaseName);

  const db = mongoose.connection.db;
  const companiesColl = db.collection('companies');
  const partiesColl = db.collection('parties');
  const billsColl = db.collection('bills');
  const partyTxColl = db.collection('partytransactions');

  // 1. Get Ganesh Hardware company
  let company = await companiesColl.findOne({ name: { $regex: /ganesh\s*hardware/i } });
  if (!company) {
    company = await companiesColl.findOne({});
  }
  if (!company) {
    throw new Error("No company found in database");
  }

  const companyId = company._id;
  console.log(`Using Company: ${company.name} (${companyId.toString()})`);

  // 2. Find or create Rajkamal Agrawal party
  let party = await partiesColl.findOne({
    companyId: companyId,
    name: { $regex: /rajkamal\s*agrawal/i }
  });

  const finalNetBalance = 121574; // Rs. 1,21,574 (Total Dr: 7,22,602 - Total Cr: 6,01,028)

  if (!party) {
    const partyDoc = {
      name: "राजकमल अग्रवाल (Rajkamal Agrawal)",
      mobileNumber: "9999999999",
      address: "मेन पार्टी (Main Party)",
      partyType: "customer",
      priceLevel: "retail",
      openingBalance: 0,
      currentBalance: finalNetBalance,
      balance: finalNetBalance,
      creditLimit: 1000000,
      gstin: "",
      companyId: companyId,
      isActive: true,
      createdAt: new Date("2024-10-26T00:00:00.000Z"),
      updatedAt: new Date()
    };
    const res = await partiesColl.insertOne(partyDoc);
    party = { ...partyDoc, _id: res.insertedId };
    console.log("Created Party:", party.name, party._id.toString());
  } else {
    await partiesColl.updateOne(
      { _id: party._id },
      { $set: { currentBalance: finalNetBalance, balance: finalNetBalance, updatedAt: new Date() } }
    );
    console.log("Found & Updated Party:", party.name, party._id.toString());
  }

  const partyId = party._id;

  // 3. Clear old imported transactions/bills for clean slate
  const delTx = await partyTxColl.deleteMany({ partyId: partyId, companyId: companyId });
  console.log(`Cleaned up ${delTx.deletedCount} old party transactions for clean import`);

  const delBills = await billsColl.deleteMany({
    partyId: partyId,
    companyId: companyId,
    billNumber: { $regex: /^RA-/ }
  });
  console.log(`Cleaned up ${delBills.deletedCount} old bills for clean import`);

  // 4. Read JSON rows
  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${rawData.length} rows from JSON`);

  const billsToInsert = [];
  const partyTxToInsert = [];

  let drCount = 0;
  let crCount = 0;
  let totalDr = 0;
  let totalCr = 0;

  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i];
    const txDate = parseDate(item.date_str);
    const siteRaw = (item.site || "").trim();
    const siteClean = siteRaw || "General";
    const billNumRef = item.bill_no ? String(item.bill_no).trim() : "";
    const uniqueBillId = `RA-${String(i + 1).padStart(3, '0')}`;

    if (item.debit > 0) {
      drCount++;
      totalDr += item.debit;

      const billDetails = siteRaw
        ? `[Site: ${siteRaw}] बिक्री बिल ${billNumRef ? `#${billNumRef}` : ''}`.trim()
        : `बिक्री बिल ${billNumRef ? `#${billNumRef}` : ''}`.trim();

      // Bill Document for Sales & Sitewise Report
      const billDoc = {
        billNumber: uniqueBillId,
        refBillNo: billNumRef || uniqueBillId,
        companyId: companyId,
        partyId: partyId,
        customerName: party.name,
        customerMobile: party.mobileNumber,
        customerAddress: party.address,
        siteName: siteClean,
        projectName: siteClean,
        date: txDate,
        items: [
          {
            name: siteRaw ? `${siteRaw} सामान / चालान` : "हार्डवेयर सामान",
            quantity: 1,
            rate: item.debit,
            total: item.debit
          }
        ],
        total: item.debit,
        tax: 0,
        discountPercent: 0,
        discountAmount: 0,
        finalAmount: item.debit,
        paymentMethod: "credit",
        paymentStatus: "unpaid",
        amountPaid: 0,
        balanceDue: item.debit,
        isDeleted: false,
        source: "ExcelImport",
        notes: `Row ${item.row_index} | ${siteRaw || 'General'}`,
        createdAt: txDate,
        updatedAt: txDate
      };
      billsToInsert.push(billDoc);

      // Party Transaction
      partyTxToInsert.push({
        partyId: partyId,
        companyId: companyId,
        date: txDate,
        details: billDetails,
        siteName: siteClean,
        debit: item.debit,
        credit: 0,
        type: "sale",
        referenceBillId: uniqueBillId,
        billNumber: uniqueBillId,
        refNo: billNumRef ? `बिल #${billNumRef}` : uniqueBillId,
        isDeleted: false,
        createdAt: txDate,
        updatedAt: txDate
      });
    } else if (item.credit > 0) {
      crCount++;
      totalCr += item.credit;

      const isWapasi = siteRaw.toLowerCase().includes("wapasi") || item.type.toLowerCase().includes("वापसी");
      const crType = isWapasi ? "return" : "receipt";
      const crDetails = isWapasi
        ? `माल वापसी (Sales Return) ${siteRaw ? `- ${siteRaw}` : ''}`.trim()
        : `जमा भुगतान (${item.type || 'Credit'}) ${siteRaw ? `- ${siteRaw}` : ''}`.trim();

      partyTxToInsert.push({
        partyId: partyId,
        companyId: companyId,
        date: txDate,
        details: crDetails,
        siteName: siteClean,
        debit: 0,
        credit: item.credit,
        type: crType,
        billNumber: billNumRef || "REC",
        refNo: billNumRef || "REC",
        isDeleted: false,
        createdAt: txDate,
        updatedAt: txDate
      });
    }
  }

  // 5. Bulk insert to Mongo
  if (billsToInsert.length > 0) {
    const bRes = await billsColl.insertMany(billsToInsert);
    console.log(`Inserted ${bRes.insertedCount} Bills into MongoDB!`);
  }

  if (partyTxToInsert.length > 0) {
    const tRes = await partyTxColl.insertMany(partyTxToInsert);
    console.log(`Inserted ${tRes.insertedCount} PartyTransactions into MongoDB!`);
  }

  // 6. Supabase sync if configured
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      console.log("Syncing Party to Supabase...");
      
      await supabase.from('parties').upsert({
        id: partyId.toString(),
        name: party.name,
        mobile_number: party.mobileNumber,
        address: party.address,
        company_id: companyId.toString(),
        balance: finalNetBalance,
        current_balance: finalNetBalance,
        is_active: true
      });
      console.log("Party synced to Supabase!");
    } catch (sErr) {
      console.warn("Supabase sync warning:", sErr.message);
    }
  }

  console.log("\n================ IMPORT SUMMARY ================");
  console.log(`Party: ${party.name}`);
  console.log(`Total Bills Created: ${drCount} (Debit: Rs. ${totalDr.toLocaleString('en-IN')})`);
  console.log(`Total Receipts/Returns Created: ${crCount} (Credit: Rs. ${totalCr.toLocaleString('en-IN')})`);
  console.log(`Final Outstanding Balance: Rs. ${(totalDr - totalCr).toLocaleString('en-IN')}`);
  console.log("================================================");

  await mongoose.disconnect();
}

runImport().catch(err => {
  console.error("FATAL IMPORT ERROR:", err);
  process.exit(1);
});
