import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { supabase } from './config/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function mongoIdToUuid(mongoId) {
  if (!mongoId) return null;
  const str = String(mongoId);
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  const hash = crypto.createHash('md5').update(str).digest('hex');
  const p1 = hash.slice(0, 8);
  const p2 = hash.slice(8, 12);
  const p3 = '4' + hash.slice(13, 16);
  const p4 = 'a' + hash.slice(17, 20);
  const p5 = hash.slice(20, 32);
  return [p1, p2, p3, p4, p5].join('-');
}

async function runComprehensiveSync() {
  console.log('=====================================================');
  console.log('🚀 STARTING COMPREHENSIVE MONGODB ➔ SUPABASE SYNC');
  console.log('=====================================================');

  if (!supabase) {
    console.error('❌ Supabase client is not initialized! Check SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000, family: 4 });
  const db = mongoose.connection.db;

  // 1. COMPANIES
  console.log('\n--- 1. SYNCING COMPANIES ---');
  const companies = await db.collection('companies').find({}).toArray();
  for (const c of companies) {
    const cUuid = mongoIdToUuid(c._id);
    const { error } = await supabase.from('companies').upsert({
      id: cUuid,
      name: c.name,
      email: c.email || c.ownerEmail || null,
      phone_number: c.phone || null,
      gst_number: c.gstNumber || c.gstin || null,
      address: c.address || null,
      upi_id: c.upiId || null,
      is_active: true
    }, { onConflict: 'id' });
    if (error) console.warn(`⚠️ Company '${c.name}':`, error.message);
    else console.log(`✅ Synced Company: ${c.name} (${cUuid})`);
  }

  const { data: sbCos } = await supabase.from('companies').select('id, name');
  const validCompanyIds = new Set((sbCos || []).map(c => c.id));
  const fallbackCompanyId = sbCos?.find(c => c.name.toLowerCase().includes('ganesh'))?.id || sbCos?.[0]?.id;
  const resolveCompanyId = (mongoCoId) => {
    const u = mongoIdToUuid(mongoCoId);
    if (u && validCompanyIds.has(u)) return u;
    return fallbackCompanyId;
  };

  // 2. USERS
  console.log('\n--- 2. SYNCING USERS ---');
  try {
    const users = await db.collection('users').find({}).toArray();
    for (const u of users) {
      const uUuid = mongoIdToUuid(u._id);
      const { error } = await supabase.from('users').upsert({
        id: uUuid,
        name: u.name || u.email?.split('@')[0],
        email: u.email?.toLowerCase(),
        password: u.password || '',
        phone: u.phone || null,
        role: u.role || 'admin',
        company_id: resolveCompanyId(u.companyId),
        is_active: u.isActive !== false,
        is_verified: Boolean(u.isVerified),
        created_at: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) {
        console.warn(`⚠️ User '${u.email}':`, error.message);
      } else {
        console.log(`✅ Synced User: ${u.email} (${uUuid})`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Users table sync skipped:', err.message);
  }

  // 3. BANK ACCOUNTS
  console.log('\n--- 3. SYNCING BANK ACCOUNTS ---');
  try {
    const bankAccounts = await db.collection('bankaccounts').find({}).toArray();
    for (const b of bankAccounts) {
      const bUuid = mongoIdToUuid(b._id);
      const balanceVal = Number(b.balance ?? b.currentBalance ?? 0);
      const { error } = await supabase.from('bank_accounts').upsert({
        id: bUuid,
        company_id: resolveCompanyId(b.companyId),
        account_name: b.accountName,
        bank_name: b.bankName || '',
        account_number: b.accountNumber || '',
        ifsc_code: b.ifscCode || '',
        upi_id: b.upiId || '',
        account_type: b.accountType || 'CURRENT',
        has_cc_limit: Boolean(b.hasCcLimit),
        sanctioned_limit: Number(b.sanctionedLimit || 0),
        current_outstanding: Number(b.currentOutstanding || 0),
        opening_balance: Number(b.openingBalance || 0),
        current_balance: balanceVal,
        interest_rate: Number(b.interestRate || 0),
        transactions: Array.isArray(b.transactions) ? b.transactions : [],
        monthly_interests: Array.isArray(b.monthlyInterests) ? b.monthlyInterests : [],
        is_deleted: Boolean(b.isDeleted),
        created_at: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) {
        console.warn(`⚠️ BankAccount '${b.accountName}':`, error.message);
      } else {
        console.log(`✅ Synced BankAccount: ${b.accountName} (${bUuid}) - Balance: ₹${balanceVal}`);
      }
    }
  } catch (err) {
    console.warn('⚠️ BankAccounts table sync skipped:', err.message);
  }

  // 4. PARTIES
  console.log('\n--- 4. SYNCING PARTIES ---');
  const parties = await db.collection('parties').find({}).toArray();
  const syncedPartyIds = new Set();
  for (let i = 0; i < parties.length; i += 50) {
    const chunk = parties.slice(i, i + 50).map(p => {
      const pUuid = mongoIdToUuid(p._id);
      return {
        id: pUuid,
        company_id: resolveCompanyId(p.companyId),
        name: p.name || 'Unknown Party',
        party_type: (p.type === 'supplier' || p.partyType === 'supplier') ? 'supplier' : 'customer',
        mobile_number: p.mobileNumber || p.phone || '',
        billing_address: p.address || '',
        gst_number: p.gstin || p.gstNumber || null,
        pan_number: p.pan || null,
        opening_balance: Number(p.openingBalance || 0),
        current_balance: Number(p.currentBalance ?? p.balance ?? 0),
        credit_limit: Number(p.creditLimit || 0),
        is_active: p.isActive !== false,
        created_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    const { error: pErr } = await supabase.from('parties').upsert(chunk, { onConflict: 'id' });
    if (pErr) {
      console.warn(`⚠️ Parties batch ${i} error:`, pErr.message);
    } else {
      chunk.forEach(p => syncedPartyIds.add(p.id));
    }
  }
  console.log(`✅ Synced ${syncedPartyIds.size}/${parties.length} Parties to Supabase!`);

  // 5. PRODUCTS
  console.log('\n--- 5. SYNCING PRODUCTS ---');
  const products = await db.collection('products').find({}).toArray();
  let syncedProducts = 0;
  for (let i = 0; i < products.length; i += 100) {
    const chunk = products.slice(i, i + 100).map(p => ({
      id: mongoIdToUuid(p._id),
      company_id: resolveCompanyId(p.companyId),
      name: p.name,
      category: p.category || 'General',
      sub_category: p.subCategory || null,
      brand: p.brand || null,
      unit: p.unit || 'pc',
      sku: p.sku || null,
      barcode: p.barcode || null,
      hsn_code: p.hsnCode || null,
      cost_price: Number(p.costPrice || p.purchasePrice || 0),
      selling_price: Number(p.sellingPrice || p.price || 0),
      mrp: Number(p.mrp || p.sellingPrice || 0),
      current_stock: Number(p.currentStock || p.stock || 0),
      minimum_stock: Number(p.minimumStock || 0),
      is_active: p.isActive !== false,
      created_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    const { error: prErr } = await supabase.from('products').upsert(chunk, { onConflict: 'id' });
    if (prErr) {
      console.warn(`⚠️ Product batch error at ${i}:`, prErr.message);
    } else {
      syncedProducts += chunk.length;
    }
  }
  console.log(`✅ Synced ${syncedProducts}/${products.length} Products to Supabase!`);

  // 6. SALES / BILLS
  console.log('\n--- 6. SYNCING SALES / BILLS ---');
  const bills = await db.collection('bills').find({}).toArray();
  let syncedBills = 0;
  for (let i = 0; i < bills.length; i += 50) {
    const chunk = bills.slice(i, i + 50).map(b => {
      const bUuid = mongoIdToUuid(b._id);
      const finalAmt = Number(b.totalAmount || b.finalAmount || b.total || 0);
      const subTot = Number(b.total || (finalAmt - Number(b.tax || 0)));
      const rawPartyUuid = b.partyId ? mongoIdToUuid(b.partyId) : null;
      const safePartyId = (rawPartyUuid && syncedPartyIds.has(rawPartyUuid)) ? rawPartyUuid : null;

      return {
        id: bUuid,
        company_id: resolveCompanyId(b.companyId),
        party_id: safePartyId,
        bill_number: b.billNumber || ('BILL-' + bUuid.slice(0, 8)),
        customer_name: b.customerName || 'काउंटर नकद ग्राहक',
        customer_mobile: b.customerMobile || '',
        customer_address: b.customerAddress || null,
        site_name: b.siteName || null,
        date: b.date ? new Date(b.date).toISOString() : (b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString()),
        items: Array.isArray(b.items) ? b.items : [],
        sub_total: subTot,
        tax_amount: Number(b.tax || 0),
        discount_amount: Number(b.discountAmount || 0),
        discount_percent: Number(b.discountPercent || 0),
        final_amount: finalAmt,
        amount_received: b.status === 'paid' ? finalAmt : Number(b.amountReceived || b.paidAmount || 0),
        payment_status: b.status || b.paymentStatus || 'paid',
        payment_method: b.paymentMode || b.paymentMethod || 'cash',
        notes: b.notes || '',
        status: b.status || 'complete',
        bill_image_url: b.billImageUrl || (Array.isArray(b.billImageUrls) && b.billImageUrls[0]) || null,
        is_deleted: Boolean(b.isDeleted),
        created_at: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    const { error: slErr } = await supabase.from('sales').upsert(chunk, { onConflict: 'id' });
    if (slErr) {
      console.warn(`⚠️ Sales batch error at ${i}:`, slErr.message);
    } else {
      syncedBills += chunk.length;
    }
  }
  console.log(`✅ Synced ${syncedBills}/${bills.length} Sales/Bills to Supabase!`);

  // 7. EXPENSES
  console.log('\n--- 7. SYNCING EXPENSES ---');
  const expenses = await db.collection('expenses').find({}).toArray();
  let syncedExpenses = 0;
  for (let i = 0; i < expenses.length; i += 50) {
    const chunk = expenses.slice(i, i + 50).map(e => ({
      id: mongoIdToUuid(e._id),
      company_id: resolveCompanyId(e.companyId),
      title: e.title || 'खर्च',
      amount: Number(e.amount || 0),
      category: e.category || 'General',
      date: e.date ? new Date(e.date).toISOString() : new Date().toISOString(),
      description: (e.title || 'खर्च') + (e.description ? ' - ' + e.description : (e.notes ? ' - ' + e.notes : '')),
      status: e.status || 'approved',
      is_deleted: Boolean(e.isDeleted),
      created_at: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    const { error: expErr } = await supabase.from('expenses').upsert(chunk, { onConflict: 'id' });
    if (expErr) {
      console.warn(`⚠️ Expenses batch error at ${i}:`, expErr.message);
    } else {
      syncedExpenses += chunk.length;
    }
  }
  console.log(`✅ Synced ${syncedExpenses}/${expenses.length} Expenses to Supabase!`);

  // 8. STAFF / EMPLOYEES
  console.log('\n--- 8. SYNCING STAFF / EMPLOYEES ---');
  const staffs = await db.collection('staffs').find({}).toArray();
  for (const s of staffs) {
    const sUuid = mongoIdToUuid(s._id);
    const wageVal = Number(s.dailyRate || s.wageAmount || s.salary || 0);
    const { error: stErr } = await supabase.from('employees').upsert({
      id: sUuid,
      company_id: resolveCompanyId(s.companyId),
      full_name: s.name || 'Staff Member',
      phone_number: s.mobileNumber || s.phone || '',
      designation: s.position || s.role || 'Staff',
      role: s.role || 'salesman',
      wage_type: s.wageType || 'daily',
      salary: wageVal,
      balance: Number(s.balance || 0),
      is_active: s.isActive !== false,
      created_at: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (stErr) console.warn(`⚠️ Employee '${s.name}':`, stErr.message);
    else console.log(`✅ Synced Employee: ${s.name} (${sUuid})`);
  }

  // 9. PURCHASES
  console.log('\n--- 9. SYNCING PURCHASES ---');
  const purchases = await db.collection('purchases').find({}).toArray();
  for (const pr of purchases) {
    const pUuid = mongoIdToUuid(pr._id);
    const suppUuid = pr.supplierId || pr.partyId ? mongoIdToUuid(pr.supplierId || pr.partyId) : null;
    const { error: purErr } = await supabase.from('purchases').upsert({
      id: pUuid,
      company_id: resolveCompanyId(pr.companyId),
      party_id: suppUuid,
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
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (purErr) console.warn(`⚠️ Purchase:`, purErr.message);
    else console.log(`✅ Synced Purchase: ${pr.billNumber || pUuid}`);
  }

  // 10. ATTENDANCE
  console.log('\n--- 10. SYNCING ATTENDANCE ---');
  const attendances = await db.collection('attendances').find({}).toArray();
  let syncedAttendance = 0;
  for (const a of attendances) {
    const aUuid = mongoIdToUuid(a._id);
    const eUuid = mongoIdToUuid(a.staffId);
    const normStatus = (a.status === 'half-day' || a.status === 'halfday' || a.status === 'half_day')
      ? 'half_day'
      : (a.status === 'absent' || a.status === 'leave')
      ? 'absent'
      : 'present';

    const { error: attErr } = await supabase.from('attendance').upsert({
      id: aUuid,
      company_id: resolveCompanyId(a.companyId),
      employee_id: eUuid,
      date: a.date ? new Date(a.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: normStatus,
      notes: a.notes || `Synced status: ${normStatus}`,
      created_at: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'employee_id,date' });
    if (!attErr) syncedAttendance++;
  }
  console.log(`✅ Synced ${syncedAttendance}/${attendances.length} Attendance records to Supabase!`);

  // 11. PARTY TRANSACTIONS
  console.log('\n--- 11. SYNCING PARTY TRANSACTIONS ---');
  const partyTxs = await db.collection('partytransactions').find({}).toArray();
  const { data: existingPTxs } = await supabase.from('party_transactions').select('party_id, date, debit, credit');
  const existingPTxKey = new Set((existingPTxs || []).map(t => `${t.party_id}_${t.date}_${t.debit}_${t.credit}`));

  let syncedPTxs = 0;
  for (let i = 0; i < partyTxs.length; i += 50) {
    const chunk = partyTxs.slice(i, i + 50)
      .map(t => {
        const pUuid = mongoIdToUuid(t.partyId);
        const dStr = t.date ? new Date(t.date).toISOString() : new Date().toISOString();
        const key = `${pUuid}_${dStr}_${Number(t.debit || 0)}_${Number(t.credit || 0)}`;
        if (existingPTxKey.has(key)) return null;
        return {
          company_id: resolveCompanyId(t.companyId),
          party_id: pUuid,
          date: dStr,
          details: t.details || t.description || 'पार्टी खाता लेन-देन',
          debit: Number(t.debit || 0),
          credit: Number(t.credit || 0),
          type: t.type || 'manual',
          created_at: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString()
        };
      })
      .filter(Boolean);

    if (chunk.length > 0) {
      const { error: ptErr } = await supabase.from('party_transactions').insert(chunk);
      if (ptErr) console.warn('⚠️ PartyTx batch error:', ptErr.message);
      else syncedPTxs += chunk.length;
    }
  }
  console.log(`✅ Synced ${syncedPTxs} new/missing Party Transactions to Supabase!`);

  // 12. STAFF TRANSACTIONS
  console.log('\n--- 12. SYNCING STAFF TRANSACTIONS ---');
  const staffTxs = await db.collection('stafftransactions').find({}).toArray();
  const { data: existingSTxs } = await supabase.from('staff_transactions').select('employee_id, date, debit, credit');
  const existingSTxKey = new Set((existingSTxs || []).map(t => `${t.employee_id}_${t.date}_${t.debit}_${t.credit}`));

  let syncedSTxs = 0;
  for (let i = 0; i < staffTxs.length; i += 50) {
    const chunk = staffTxs.slice(i, i + 50)
      .map(t => {
        const eUuid = mongoIdToUuid(t.staffId);
        const dStr = t.date ? new Date(t.date).toISOString() : new Date().toISOString();
        const key = `${eUuid}_${dStr}_${Number(t.debit || 0)}_${Number(t.credit || 0)}`;
        if (existingSTxKey.has(key)) return null;
        return {
          company_id: resolveCompanyId(t.companyId),
          employee_id: eUuid,
          date: dStr,
          type: t.type || 'advance',
          status: 'completed',
          debit: Number(t.debit || 0),
          credit: Number(t.credit || 0),
          notes: t.notes || (t.forMonth ? `For ${t.forMonth}` : 'Staff payment'),
          is_deleted: Boolean(t.isDeleted),
          created_at: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      })
      .filter(Boolean);

    if (chunk.length > 0) {
      const { error: stErr } = await supabase.from('staff_transactions').insert(chunk);
      if (stErr) console.warn('⚠️ StaffTx batch error:', stErr.message);
      else syncedSTxs += chunk.length;
    }
  }
  console.log(`✅ Synced ${syncedSTxs} new/missing Staff Transactions to Supabase!`);

  console.log('\n=====================================================');
  console.log('🎉 SYNC COMPLETE! MongoDB & Supabase are in sync!');
  console.log('=====================================================');

  await mongoose.disconnect();
  process.exit(0);
}

runComprehensiveSync().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
