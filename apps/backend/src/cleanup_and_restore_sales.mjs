import mongoose from 'mongoose';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function cleanupRestaurantAndAddHardwareSales() {
  console.log("=== 1. CLEANING UP RESTAURANT DATA FROM MONGODB ===");
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  // 1. Delete all restaurant bills from MongoDB
  const delBills = await db.collection('bills').deleteMany({
    $or: [
      { companyId: "6a8314470d93e58ad0920952" },
      { companyId: new mongoose.Types.ObjectId("6a8314470d93e58ad0920952") },
      { billNumber: /^BILL-REST-/ }
    ]
  });
  console.log(`Deleted ${delBills.deletedCount} restaurant bills from MongoDB bills collection.`);

  // 2. Delete restaurant purchases
  const delPurchases = await db.collection('purchases').deleteMany({
    $or: [
      { companyId: "6a8314470d93e58ad0920952" },
      { companyId: new mongoose.Types.ObjectId("6a8314470d93e58ad0920952") }
    ]
  });
  console.log(`Deleted ${delPurchases.deletedCount} restaurant purchases from MongoDB.`);

  // 3. Delete restaurant company from MongoDB
  const delCompany = await db.collection('companies').deleteMany({
    $or: [
      { _id: new mongoose.Types.ObjectId("6a8314470d93e58ad0920952") },
      { _id: "6a8314470d93e58ad0920952" },
      { name: /Royal Spice/i }
    ]
  });
  console.log(`Deleted ${delCompany.deletedCount} restaurant companies from MongoDB.`);

  // 4. Clean up restaurant sales in Supabase
  console.log("\n=== 2. CLEANING UP RESTAURANT SALES FROM SUPABASE ===");
  const { data: delSupaSales, error: supaErr } = await supabase
    .from('sales')
    .delete()
    .like('bill_number', 'BILL-REST-%');
  if (supaErr) {
    console.error("Error deleting Supabase sales:", supaErr.message);
  } else {
    console.log("Deleted restaurant sales from Supabase.");
  }

  // Delete restaurant company in Supabase if exists
  await supabase.from('companies').delete().like('name', '%Royal Spice%');

  // 5. Insert the user's 3 direct sales of ₹5000 into MongoDB `bills` collection for Ganesh Hardware
  console.log("\n=== 3. CREATING HARDWARE SALES (5000 ENTRIES) FOR GANESH HARDWARE ===");
  const hardwareCompanyId = "6a8314470d93e58ad0920950";
  const now = new Date();

  const userHardwareBills = [
    {
      billNumber: "BILL-HW-1001",
      companyId: new mongoose.Types.ObjectId(hardwareCompanyId),
      customerName: "काउंटर नकद ग्राहक (दैनिक बिक्री)",
      customerMobile: "9876543210",
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      items: [
        {
          name: "हार्डवेयर एवं पेंट सामान (दैनिक नकद बिक्री)",
          quantity: 1,
          rate: 5000,
          unit: "LS",
          total: 5000,
          taxable: 5000
        }
      ],
      total: 5000,
      totalAmount: 5000,
      finalAmount: 5000,
      paymentMethod: "cash",
      paymentMode: "CASH",
      paymentStatus: "paid",
      status: "paid",
      isDeleted: false,
      notes: "दैनिक बिक्री काउंटर नकद (Direct Sale)",
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      billNumber: "BILL-HW-1002",
      companyId: new mongoose.Types.ObjectId(hardwareCompanyId),
      customerName: "काउंटर नकद ग्राहक (दैनिक बिक्री)",
      customerMobile: "9876543210",
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      items: [
        {
          name: "हार्डवेयर सामान (दैनिक नकद बिक्री)",
          quantity: 1,
          rate: 5000,
          unit: "LS",
          total: 5000,
          taxable: 5000
        }
      ],
      total: 5000,
      totalAmount: 5000,
      finalAmount: 5000,
      paymentMethod: "cash",
      paymentMode: "CASH",
      paymentStatus: "paid",
      status: "paid",
      isDeleted: false,
      notes: "दैनिक बिक्री काउंटर नकद (Direct Sale)",
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      billNumber: "BILL-HW-1003",
      companyId: new mongoose.Types.ObjectId(hardwareCompanyId),
      customerName: "काउंटर नकद ग्राहक (दैनिक बिक्री)",
      customerMobile: "9876543210",
      date: new Date(), // Today
      items: [
        {
          name: "हार्डवेयर एवं सेनेटरी सामान (दैनिक नकद बिक्री)",
          quantity: 1,
          rate: 5000,
          unit: "LS",
          total: 5000,
          taxable: 5000
        }
      ],
      total: 5000,
      totalAmount: 5000,
      finalAmount: 5000,
      paymentMethod: "cash",
      paymentMode: "CASH",
      paymentStatus: "paid",
      status: "paid",
      isDeleted: false,
      notes: "दैनिक बिक्री काउंटर नकद (Direct Sale)",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const insertRes = await db.collection('bills').insertMany(userHardwareBills);
  console.log(`Inserted ${insertRes.insertedCount} Hardware bills of ₹5,000 each into MongoDB bills collection.`);

  // 6. Also insert into Supabase `sales` table for cloud sync
  try {
    const supaSalesToInsert = userHardwareBills.map(b => ({
      bill_number: b.billNumber,
      customer_name: b.customerName,
      customer_mobile: b.customerMobile,
      date: b.date.toISOString(),
      final_amount: b.finalAmount,
      sub_total: b.total,
      tax_amount: 0,
      discount_amount: 0,
      amount_received: b.finalAmount,
      payment_status: "paid",
      payment_method: "Cash",
      status: "complete",
      items: b.items,
      notes: b.notes,
      is_deleted: false,
      created_at: b.createdAt.toISOString(),
      updated_at: b.updatedAt.toISOString()
    }));

    const { error: supaInsertErr } = await supabase.from('sales').insert(supaSalesToInsert);
    if (supaInsertErr) {
      console.warn("Supabase sales insert warning:", supaInsertErr.message);
    } else {
      console.log("Successfully inserted Hardware 5,000 sales records into Supabase sales table!");
    }
  } catch (e) {
    console.warn("Supabase insert exception:", e.message);
  }

  await mongoose.disconnect();
  console.log("\n✅ ALL RESTAURANT DATA PURGED & HARDWARE SALES (3x ₹5,000) RESTORED IN CLOUD!");
}

cleanupRestaurantAndAddHardwareSales().catch(console.error);
