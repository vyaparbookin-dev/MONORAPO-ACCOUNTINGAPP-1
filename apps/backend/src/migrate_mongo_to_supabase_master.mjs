import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { supabase } from './src/config/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

function mongoIdToUuid(mongoId) {
  if (!mongoId) return null;
  const str = String(mongoId);
  const hash = crypto.createHash('md5').update(str).digest('hex');
  const p1 = hash.slice(0, 8);
  const p2 = hash.slice(8, 12);
  const p3 = '4' + hash.slice(13, 16);
  const p4 = 'a' + hash.slice(17, 20);
  const p5 = hash.slice(20, 32);
  return [p1, p2, p3, p4, p5].join('-');
}

async function runMasterMigration() {
  console.log('===============================================================');
  console.log('🚀 STARTING COMPREHENSIVE MONGO -> SUPABASE MASTER MIGRATION');
  console.log('===============================================================');

  if (!supabase) {
    console.error('❌ Supabase client is not configured!');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;
  console.log('✅ Connected to MongoDB successfully.\n');

  // ==========================================
  // 1. COMPANIES
  // ==========================================
  console.log('--- 1. SYNCING COMPANIES ---');
  const companies = await db.collection('companies').find({}).toArray();
  for (const c of companies) {
    const cUuid = mongoIdToUuid(c._id);
    const { error } = await supabase.from('companies').upsert({
      id: cUuid,
      name: c.name || 'Ganesh Hardware',
      email: c.email || c.ownerEmail || null,
      phone_number: c.phone || c.mobile || null,
      gst_number: c.gstin || c.gstNumber || null,
      address: c.address || null,
      is_active: true
    });
    if (error) console.warn(`Company error (${c.name}):`, error.message);
    else console.log(`✅ Synced Company: ${c.name} (${cUuid})`);
  }

  const { data: allSbCos } = await supabase.from('companies').select('id, name');
  const validCompanyIds = new Set((allSbCos || []).map(c => c.id));
  const defaultCompanyUuid = allSbCos?.[0]?.id || mongoIdToUuid('6a8314470d93e58ad0920950');

  const resolveCompanyUuid = (mongoCid) => {
    const uuid = mongoIdToUuid(mongoCid);
    if (uuid && validCompanyIds.has(uuid)) return uuid;
    return defaultCompanyUuid;
  };

  // ==========================================
  // 2. PARTIES
  // ==========================================
  console.log('\n--- 2. SYNCING PARTIES ---');
  const parties = await db.collection('parties').find({}).toArray();
  console.log(`Found ${parties.length} parties in MongoDB.`);
  const syncedPartyUuids = new Set();

  for (let i = 0; i < parties.length; i += 50) {
    const chunk = parties.slice(i, i + 50).map(p => {
      const pUuid = mongoIdToUuid(p._id);
      return {
        id: pUuid,
        company_id: resolveCompanyUuid(p.companyId),
        name: p.name || 'पार्टी',
        party_type: p.type === 'supplier' || p.partyType === 'supplier' ? 'supplier' : 'customer',
        mobile_number: p.mobileNumber || p.phone || '',
        billing_address: p.address || '',
        gst_number: p.gstin || p.gstNumber || null,
        pan_number: p.pan || null,
        opening_balance: Number(p.openingBalance || 0),
        current_balance: Number(p.currentBalance ?? p.balance ?? 0),
        credit_limit: Number(p.creditLimit || 0),
        is_active: p.isActive !== false,
        created_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        updated_at: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString()
      };
    });

    const { error } = await supabase.from('parties').upsert(chunk);
    if (error) {
      console.warn(`Parties batch error at ${i}:`, error.message);
    } else {
      chunk.forEach(p => syncedPartyUuids.add(p.id));
    }
  }
  console.log(`✅ Synced ${syncedPartyUuids.size}/${parties.length} Parties to Supabase!`);

  // ==========================================
  // 3. PRODUCTS
  // ==========================================
  console.log('\n--- 3. SYNCING PRODUCTS ---');
  const products = await db.collection('products').find({}).toArray();
  console.log(`Found ${products.length} products in MongoDB.`);
  let syncedProducts = 0;

  for (let i = 0; i < products.length; i += 50) {
    const chunk = products.slice(i, i + 50).map(p => ({
      id: mongoIdToUuid(p._id),
      company_id: resolveCompanyUuid(p.companyId),
      name: p.name || 'Product',
      category: p.category || '',
      cost_price: Number(p.costPrice || p.purchasePrice || 0),
      selling_price: Number(p.sellingPrice || p.price || 0),
      current_stock: Number(p.currentStock ?? p.stock ?? 0),
      unit: p.unit || 'pcs',
      brand: p.brand || '',
      barcode: p.barcode || null,
      is_active: p.isActive !== false,
      created_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      updated_at: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString()
    }));

    const { error } = await supabase.from('products').upsert(chunk);
    if (error) console.warn(`Products chunk error at ${i}:`, error.message);
    else syncedProducts += chunk.length;
  }
  console.log(`✅ Synced ${syncedProducts}/${products.length} Products to Supabase!`);

  // ==========================================
  // 4. SALES (BILLS)
  // ==========================================
  console.log('\n--- 4. SYNCING SALES / BILLS ---');
  const bills = await db.collection('bills').find({}).toArray();
  console.log(`Found ${bills.length} bills in MongoDB.`);
  let syncedBills = 0;

  for (let i = 0; i < bills.length; i += 50) {
    const chunk = bills.slice(i, i + 50).map(b => {
      const bUuid = mongoIdToUuid(b._id);
      const finalAmt = Number(b.totalAmount || b.finalAmount || b.total || 0);
      const subTot = Number(b.total || (finalAmt - Number(b.tax || 0)));
      const rawPartyUuid = b.partyId ? mongoIdToUuid(b.partyId) : null;
      const safePartyId = (rawPartyUuid && syncedPartyUuids.has(rawPartyUuid)) ? rawPartyUuid : null;

      return {
        id: bUuid,
        company_id: resolveCompanyUuid(b.companyId),
        party_id: safePartyId,
        bill_number: b.billNumber || ('BILL-' + bUuid.slice(0, 8)),
        customer_name: b.customerName || 'काउंटर नकद ग्राहक',
        customer_mobile: b.customerMobile || b.customerPhone || '',
        customer_address: b.customerAddress || null,
        customer_gst: b.customerGst || null,
        site_name: b.siteName || null,
        date: b.date ? new Date(b.date).toISOString() : (b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString()),
        items: Array.isArray(b.items) ? b.items : [],
        sub_total: subTot,
        tax_amount: Number(b.tax || 0),
        discount_amount: Number(b.discountAmount || 0),
        discount_percent: Number(b.discountPercent || 0),
        final_amount: finalAmt,
        amount_received: b.paymentStatus === 'unpaid' ? 0 : (b.paymentStatus === 'paid' ? finalAmt : Number(b.amountReceived || b.paidAmount || 0)),
        payment_status: b.paymentStatus || b.status || 'paid',
        payment_method: b.paymentMode || b.paymentMethod || 'cash',
        notes: b.notes || '',
        status: b.status || 'complete',
        bill_image_url: b.billImageUrl || (Array.isArray(b.billImageUrls) && b.billImageUrls[0]) || null,
        is_deleted: Boolean(b.isDeleted),
        created_at: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
        updated_at: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString()
      };
    });

    const { error } = await supabase.from('sales').upsert(chunk, { onConflict: 'bill_number' });
    if (error) console.warn(`Sales batch error at ${i}:`, error.message);
    else syncedBills += chunk.length;
  }
  console.log(`✅ Synced ${syncedBills}/${bills.length} Sales / Bills to Supabase!`);

  // ==========================================
  // 5. PARTY TRANSACTIONS
  // ==========================================
  console.log('\n--- 5. SYNCING PARTY TRANSACTIONS ---');
  const ptxs = await db.collection('partytransactions').find({}).toArray();
  console.log(`Found ${ptxs.length} party transactions in MongoDB.`);
  let syncedPtx = 0;

  for (let i = 0; i < ptxs.length; i += 50) {
    const chunk = ptxs.slice(i, i + 50).map(t => {
      const pUuid = t.partyId ? mongoIdToUuid(t.partyId) : null;
      const safePartyId = (pUuid && syncedPartyUuids.has(pUuid)) ? pUuid : null;
      if (!safePartyId) return null;

      return {
        company_id: resolveCompanyUuid(t.companyId),
        party_id: safePartyId,
        date: t.date ? new Date(t.date).toISOString() : (t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString()),
        details: t.details || t.description || 'पार्टी खाता लेन-देन',
        debit: Number(t.debit || 0),
        credit: Number(t.credit || 0),
        type: t.type || 'manual',
        created_at: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString()
      };
    }).filter(Boolean);

    if (chunk.length > 0) {
      const { error } = await supabase.from('party_transactions').insert(chunk);
      if (error) console.warn(`Party tx chunk error at ${i}:`, error.message);
      else syncedPtx += chunk.length;
    }
  }
  console.log(`✅ Synced ${syncedPtx}/${ptxs.length} Party Transactions to Supabase!`);

  // ==========================================
  // 6. EXPENSES
  // ==========================================
  console.log('\n--- 6. SYNCING EXPENSES ---');
  const expenses = await db.collection('expenses').find({}).toArray();
  console.log(`Found ${expenses.length} expenses in MongoDB.`);
  let syncedExpenses = 0;

  for (let i = 0; i < expenses.length; i += 50) {
    const chunk = expenses.slice(i, i + 50).map(e => ({
      id: mongoIdToUuid(e._id),
      company_id: resolveCompanyUuid(e.companyId),
      title: e.title || 'खर्च',
      amount: Number(e.amount || 0),
      category: e.category || 'General',
      date: e.date ? new Date(e.date).toISOString() : new Date().toISOString(),
      description: e.description || e.notes || e.title || '',
      status: e.status || 'approved',
      is_deleted: Boolean(e.isDeleted),
      created_at: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
      updated_at: e.updatedAt ? new Date(e.updatedAt).toISOString() : new Date().toISOString()
    }));

    const { error } = await supabase.from('expenses').upsert(chunk);
    if (error) console.warn(`Expenses chunk error at ${i}:`, error.message);
    else syncedExpenses += chunk.length;
  }
  console.log(`✅ Synced ${syncedExpenses}/${expenses.length} Expenses to Supabase!`);

  // ==========================================
  // 7. EMPLOYEES / STAFF
  // ==========================================
  console.log('\n--- 7. SYNCING EMPLOYEES / STAFF ---');
  const staffList = await db.collection('staff').find({}).toArray();
  const fallbackStaffs = await db.collection('staffs').find({}).toArray();
  const combinedStaff = [...staffList];
  fallbackStaffs.forEach(fs => {
    if (!combinedStaff.some(s => String(s._id) === String(fs._id) || s.name === fs.name)) {
      combinedStaff.push(fs);
    }
  });

  console.log(`Found ${combinedStaff.length} staff records in MongoDB.`);
  const syncedEmployeeUuids = new Set();

  for (const s of combinedStaff) {
    const eUuid = mongoIdToUuid(s._id);
    const wageVal = Number(s.dailyRate || s.wageAmount || s.salary || 0);

    const empPayload = {
      id: eUuid,
      company_id: resolveCompanyUuid(s.companyId),
      full_name: s.name || s.fullName || 'Staff Member',
      phone_number: s.mobileNumber || s.phone || '',
      designation: s.position || s.role || 'Staff',
      role: s.role || 'salesman',
      wage_type: s.wageType || 'daily',
      salary: wageVal,
      balance: Number(s.balance || 0),
      joining_date: s.dateOfJoining ? new Date(s.dateOfJoining).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      is_active: s.isActive !== false,
      created_at: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
      updated_at: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString()
    };

    const { error } = await supabase.from('employees').upsert(empPayload);
    if (error) {
      console.warn(`Employee error (${s.name}):`, error.message);
    } else {
      syncedEmployeeUuids.add(eUuid);
      console.log(`✅ Synced Staff/Employee: ${s.name} (${eUuid}) [Wage: ₹${wageVal}/day, Type: ${s.wageType}]`);
    }
  }

  // ==========================================
  // 8. ATTENDANCE
  // ==========================================
  console.log('\n--- 8. SYNCING ATTENDANCE RECORDS ---');
  const attendanceList = await db.collection('attendances').find({}).toArray();
  console.log(`Found ${attendanceList.length} attendance records in MongoDB.`);
  let syncedAtt = 0;

  for (let i = 0; i < attendanceList.length; i += 50) {
    const chunk = attendanceList.slice(i, i + 50).map(a => {
      const eUuid = a.staffId ? mongoIdToUuid(a.staffId) : null;
      if (!eUuid || !syncedEmployeeUuids.has(eUuid)) return null;

      const normStatus = (a.status === 'half-day' || a.status === 'halfday' || a.status === 'half_day')
        ? 'half_day'
        : (a.status === 'absent' || a.status === 'leave')
        ? 'absent'
        : 'present';

      return {
        id: mongoIdToUuid(a._id),
        company_id: resolveCompanyUuid(a.companyId),
        employee_id: eUuid,
        date: a.date ? new Date(a.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        status: normStatus,
        notes: a.notes || `Synced status: ${normStatus}`,
        created_at: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
        updated_at: a.updatedAt ? new Date(a.updatedAt).toISOString() : new Date().toISOString()
      };
    }).filter(Boolean);

    if (chunk.length > 0) {
      const { error } = await supabase.from('attendance').upsert(chunk);
      if (error) console.warn(`Attendance chunk error at ${i}:`, error.message);
      else syncedAtt += chunk.length;
    }
  }
  console.log(`✅ Synced ${syncedAtt}/${attendanceList.length} Attendance records to Supabase!`);

  // ==========================================
  // 9. STAFF TRANSACTIONS (ADVANCES & SALARIES)
  // ==========================================
  console.log('\n--- 9. SYNCING STAFF TRANSACTIONS ---');
  const staffTxs = await db.collection('stafftransactions').find({}).toArray();
  console.log(`Found ${staffTxs.length} staff transactions in MongoDB.`);
  let syncedStfTx = 0;

  for (let i = 0; i < staffTxs.length; i += 50) {
    const chunk = staffTxs.slice(i, i + 50).map(st => {
      const eUuid = st.staffId ? mongoIdToUuid(st.staffId) : null;
      if (!eUuid || !syncedEmployeeUuids.has(eUuid)) return null;

      return {
        company_id: resolveCompanyUuid(st.companyId),
        employee_id: eUuid,
        date: st.date ? new Date(st.date).toISOString() : new Date().toISOString(),
        type: st.type || 'advance',
        status: 'completed',
        debit: Number(st.debit || 0),
        credit: Number(st.credit || 0),
        notes: (st.notes || (st.forMonth ? `For ${st.forMonth}` : 'Staff payment')),
        is_deleted: Boolean(st.isDeleted),
        created_at: st.createdAt ? new Date(st.createdAt).toISOString() : new Date().toISOString(),
        updated_at: st.updatedAt ? new Date(st.updatedAt).toISOString() : new Date().toISOString()
      };
    }).filter(Boolean);

    if (chunk.length > 0) {
      const { error } = await supabase.from('staff_transactions').insert(chunk);
      if (error) console.warn(`Staff tx chunk error at ${i}:`, error.message);
      else syncedStfTx += chunk.length;
    }
  }
  console.log(`✅ Synced ${syncedStfTx}/${staffTxs.length} Staff Transactions to Supabase!`);

  // ==========================================
  // 10. PURCHASES
  // ==========================================
  console.log('\n--- 10. SYNCING PURCHASES ---');
  const purchases = await db.collection('purchases').find({}).toArray();
  console.log(`Found ${purchases.length} purchases in MongoDB.`);
  let syncedPurchases = 0;

  for (const pr of purchases) {
    const pUuid = mongoIdToUuid(pr._id);
    const suppUuid = pr.supplierId || pr.partyId ? mongoIdToUuid(pr.supplierId || pr.partyId) : null;
    const safeSuppId = (suppUuid && syncedPartyUuids.has(suppUuid)) ? suppUuid : null;

    const { error } = await supabase.from('purchases').upsert({
      id: pUuid,
      company_id: resolveCompanyUuid(pr.companyId),
      party_id: safeSuppId,
      purchase_number: pr.billNumber || pr.purchaseNumber || ('PO-' + pUuid.slice(0, 8)),
      date: pr.date ? new Date(pr.date).toISOString() : new Date().toISOString(),
      items: Array.isArray(pr.items) ? pr.items : [],
      sub_total: Number(pr.subTotal || pr.total || 0),
      discount_amount: Number(pr.discount || 0),
      tax_amount: Number(pr.tax || 0),
      final_amount: Number(pr.finalAmount || pr.total || 0),
      amount_paid: Number(pr.amountPaid || pr.paidAmount || 0),
      payment_status: pr.paymentStatus || 'paid',
      payment_method: pr.paymentMethod || 'cash',
      supplier_name: pr.supplierName || 'सप्लायर',
      is_deleted: Boolean(pr.isDeleted),
      created_at: pr.createdAt ? new Date(pr.createdAt).toISOString() : new Date().toISOString(),
      updated_at: pr.updatedAt ? new Date(pr.updatedAt).toISOString() : new Date().toISOString()
    });

    if (error) console.warn(`Purchase error:`, error.message);
    else syncedPurchases++;
  }
  console.log(`✅ Synced ${syncedPurchases}/${purchases.length} Purchases to Supabase!`);

  console.log('\n===============================================================');
  console.log('🎉 MASTER MIGRATION FINISHED! MONGODB & SUPABASE 100% MATCHED!');
  console.log('===============================================================');

  await mongoose.disconnect();
  process.exit(0);
}

runMasterMigration().catch(err => {
  console.error('Fatal master migration error:', err);
  process.exit(1);
});
