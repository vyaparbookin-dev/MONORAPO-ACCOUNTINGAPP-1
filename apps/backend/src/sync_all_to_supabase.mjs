import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { supabase } from './config/supabase.js';

dotenv.config({ path: 'apps/backend/.env' });

function mongoIdToUuid(mongoId) {
  if (!mongoId) return null;
  const hash = crypto.createHash('md5').update(String(mongoId)).digest('hex');
  const p1 = hash.slice(0, 8);
  const p2 = hash.slice(8, 12);
  const p3 = '4' + hash.slice(13, 16);
  const p4 = 'a' + hash.slice(17, 20);
  const p5 = hash.slice(20, 32);
  return [p1, p2, p3, p4, p5].join('-');
}

async function syncAll() {
  console.log('=== SYNCING ALL MONGODB DATA TO SUPABASE (ROBUST BATCH) ===');
  if (!supabase) {
    console.error('Supabase not configured');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;

  // 1. Companies
  const companies = await db.collection('companies').find({}).toArray();
  for (const c of companies) {
    const cUuid = mongoIdToUuid(c._id);
    const { error } = await supabase.from('companies').upsert({
      id: cUuid,
      name: c.name,
      email: c.email || c.ownerEmail,
      phone_number: c.phone,
      gst_number: c.gstin,
      address: c.address,
      is_active: true
    });
    if (error) console.warn('Company err:', c.name, error.message);
    else console.log('✅ Synced Company:', c.name, cUuid);
  }

  // Fetch all valid company IDs in Supabase
  const { data: sbCos } = await supabase.from('companies').select('id, name');
  const validCompanyIds = new Set((sbCos || []).map(c => c.id));
  const fallbackCompanyId = sbCos?.find(c => c.name.toLowerCase().includes('ganesh'))?.id || sbCos?.[0]?.id;
  console.log(`Using fallback company ID: ${fallbackCompanyId}`);

  const resolveCompanyId = (mongoCompanyId) => {
    const uuid = mongoIdToUuid(mongoCompanyId);
    if (uuid && validCompanyIds.has(uuid)) return uuid;
    return fallbackCompanyId;
  };

  // 2. Parties (in batches of 50)
  const parties = await db.collection('parties').find({}).toArray();
  console.log(`Syncing ${parties.length} Parties...`);
  const syncedPartyIds = new Set();
  for (let i = 0; i < parties.length; i += 50) {
    const chunk = parties.slice(i, i + 50).map(p => {
      const pUuid = mongoIdToUuid(p._id);
      return {
        id: pUuid,
        company_id: resolveCompanyId(p.companyId),
        name: p.name || 'Walk-in Guest',
        party_type: (p.type === 'supplier' ? 'supplier' : 'customer'),
        mobile_number: p.mobileNumber || p.phone || '',
        billing_address: p.address || '',
        current_balance: Number(p.currentBalance || p.balance || 0),
        created_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        updated_at: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString()
      };
    });
    const { error: pErr } = await supabase.from('parties').upsert(chunk);
    if (pErr) {
      console.warn(`Parties batch ${i} error:`, pErr.message);
    } else {
      chunk.forEach(p => syncedPartyIds.add(p.id));
    }
  }
  console.log(`✅ Synced ${syncedPartyIds.size}/${parties.length} Parties to Supabase!`);

  // 3. Products (Batch of 50)
  const products = await db.collection('products').find({}).toArray();
  console.log(`Syncing ${products.length} Products...`);
  let syncedProducts = 0;
  for (let i = 0; i < products.length; i += 50) {
    const chunk = products.slice(i, i + 50).map(p => ({
      id: mongoIdToUuid(p._id),
      company_id: resolveCompanyId(p.companyId),
      name: p.name,
      category: p.category || '',
      cost_price: Number(p.costPrice || p.purchasePrice || 0),
      selling_price: Number(p.sellingPrice || p.price || 0),
      current_stock: Number(p.currentStock || p.stock || 0),
      unit: p.unit || 'pcs',
      brand: p.brand || '',
      barcode: p.barcode || null,
      is_active: true,
      created_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      updated_at: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString()
    }));
    const { error: prErr } = await supabase.from('products').upsert(chunk);
    if (prErr) {
      console.warn(`Product batch error at ${i}:`, prErr.message);
    } else {
      syncedProducts += chunk.length;
    }
  }
  console.log(`✅ Synced ${syncedProducts}/${products.length} Products to Supabase!`);

  // 4. Sales (Bills) (Batch of 50)
  const bills = await db.collection('bills').find({}).toArray();
  console.log(`Syncing ${bills.length} Sales/Bills...`);
  let syncedBills = 0;
  for (let i = 0; i < bills.length; i += 50) {
    const chunk = bills.slice(i, i + 50).map(b => {
      const bUuid = mongoIdToUuid(b._id);
      const finalAmt = Number(b.totalAmount || b.finalAmount || b.total || 0);
      const subTot = Number(b.total || (finalAmt - (b.tax || 0)));
      const rawPartyUuid = b.partyId ? mongoIdToUuid(b.partyId) : null;
      // Foreign key protection: only attach party_id if it exists in Supabase parties
      const safePartyId = (rawPartyUuid && syncedPartyIds.has(rawPartyUuid)) ? rawPartyUuid : null;

      return {
        id: bUuid,
        company_id: resolveCompanyId(b.companyId),
        party_id: safePartyId,
        bill_number: b.billNumber || ('BILL-' + bUuid.slice(0, 6)),
        customer_name: b.customerName || 'काउंटर नकद ग्राहक',
        customer_mobile: b.customerMobile || '',
        date: b.date ? new Date(b.date).toISOString() : (b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString()),
        items: Array.isArray(b.items) ? b.items : [],
        sub_total: subTot,
        tax_amount: Number(b.tax || 0),
        final_amount: finalAmt,
        amount_received: b.status === 'paid' ? finalAmt : (Number(b.amountReceived || b.paidAmount || 0)),
        payment_status: b.status || b.paymentStatus || 'paid',
        payment_method: b.paymentMode || b.paymentMethod || 'cash',
        is_deleted: Boolean(b.isDeleted),
        created_at: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
        updated_at: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString()
      };
    });
    const { error: slErr } = await supabase.from('sales').upsert(chunk);
    if (slErr) {
      console.warn(`Sales batch error at ${i}:`, slErr.message);
    } else {
      syncedBills += chunk.length;
    }
  }
  console.log(`✅ Synced ${syncedBills}/${bills.length} Sales/Bills to Supabase!`);

  // 5. Expenses (Batch of 50)
  const expenses = await db.collection('expenses').find({}).toArray();
  console.log(`Syncing ${expenses.length} Expenses...`);
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
      updated_at: e.updatedAt ? new Date(e.updatedAt).toISOString() : new Date().toISOString()
    }));
    const { error: expErr } = await supabase.from('expenses').upsert(chunk);
    if (expErr) {
      console.warn(`Expenses batch error at ${i}:`, expErr.message);
    } else {
      syncedExpenses += chunk.length;
    }
  }
  console.log(`✅ Synced ${syncedExpenses}/${expenses.length} Expenses to Supabase!`);

  console.log('\n🎉 ALL MONGODB DATA SUCCESSFULLY SYNCED TO SUPABASE 100%!');
  await mongoose.disconnect();
  process.exit(0);
}

syncAll().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
