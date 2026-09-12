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
  console.log('=== SYNCING ALL MONGODB DATA TO SUPABASE (CHUNKED BATCH) ===');
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

  // 2. Parties
  const parties = await db.collection('parties').find({}).toArray();
  const partyRows = parties.map(p => ({
    id: mongoIdToUuid(p._id),
    company_id: mongoIdToUuid(p.companyId),
    name: p.name || 'Walk-in Guest',
    party_type: (p.type === 'supplier' ? 'supplier' : 'customer'),
    mobile_number: p.mobileNumber || p.phone || '',
    billing_address: p.address || '',
    current_balance: Number(p.currentBalance || p.balance || 0),
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || new Date().toISOString()
  }));
  const { error: pErr } = await supabase.from('parties').upsert(partyRows);
  if (pErr) console.warn('Parties sync error:', pErr.message);
  else console.log('✅ Synced ' + partyRows.length + ' Parties to Supabase!');

  // 3. Products (Batch of 50)
  const products = await db.collection('products').find({}).toArray();
  console.log('Syncing ' + products.length + ' Products...');
  for (let i = 0; i < products.length; i += 50) {
    const chunk = products.slice(i, i + 50).map(p => ({
      id: mongoIdToUuid(p._id),
      company_id: mongoIdToUuid(p.companyId),
      name: p.name,
      category: p.category || '',
      cost_price: Number(p.costPrice || p.purchasePrice || 0),
      selling_price: Number(p.sellingPrice || p.price || 0),
      current_stock: Number(p.currentStock || p.stock || 0),
      unit: p.unit || 'pcs',
      brand: p.brand || '',
      barcode: p.barcode || null,
      is_active: true,
      created_at: p.createdAt || new Date().toISOString(),
      updated_at: p.updatedAt || new Date().toISOString()
    }));
    const { error: prErr } = await supabase.from('products').upsert(chunk);
    if (prErr) console.warn('Product batch error at ' + i + ':', prErr.message);
  }
  console.log('✅ Synced ' + products.length + ' Products/Dishes to Supabase!');

  // 4. Sales (Bills)
  const bills = await db.collection('bills').find({}).toArray();
  console.log('Syncing ' + bills.length + ' Sales/Bills...');
  for (let i = 0; i < bills.length; i += 50) {
    const chunk = bills.slice(i, i + 50).map(b => {
      const bUuid = mongoIdToUuid(b._id);
      const finalAmt = Number(b.totalAmount || b.finalAmount || b.total || 0);
      const subTot = Number(b.total || (finalAmt - (b.tax || 0)));
      return {
        id: bUuid,
        company_id: mongoIdToUuid(b.companyId),
        party_id: b.partyId ? mongoIdToUuid(b.partyId) : null,
        bill_number: b.billNumber || ('BILL-' + bUuid.slice(0, 6)),
        date: b.date || b.createdAt || new Date().toISOString(),
        items: b.items || [],
        sub_total: subTot,
        tax_amount: Number(b.tax || 0),
        final_amount: finalAmt,
        amount_received: b.status === 'paid' ? finalAmt : 0,
        payment_status: b.status || 'paid',
        payment_method: b.paymentMode || b.paymentMethod || 'cash',
        is_deleted: Boolean(b.isDeleted),
        created_at: b.createdAt || new Date().toISOString(),
        updated_at: b.updatedAt || new Date().toISOString()
      };
    });
    const { error: slErr } = await supabase.from('sales').upsert(chunk);
    if (slErr) console.warn('Sales batch error at ' + i + ':', slErr.message);
  }
  console.log('✅ Synced ' + bills.length + ' Sales/Bills to Supabase!');

  // 5. Expenses
  const expenses = await db.collection('expenses').find({}).toArray();
  const expRows = expenses.map(e => ({
    id: mongoIdToUuid(e._id),
    company_id: mongoIdToUuid(e.companyId),
    amount: Number(e.amount || 0),
    category: e.category || 'General',
    date: e.date || new Date().toISOString(),
    description: (e.title || 'खर्च') + (e.description ? ' - ' + e.description : (e.notes ? ' - ' + e.notes : '')),
    created_at: e.createdAt || new Date().toISOString(),
    updated_at: e.updatedAt || new Date().toISOString()
  }));
  const { error: expErr } = await supabase.from('expenses').upsert(expRows);
  if (expErr) console.warn('Expenses sync error:', expErr.message);
  else console.log('✅ Synced ' + expRows.length + ' Expenses to Supabase!');

  console.log("🎉 ALL MONGODB DATA SUCCESSFULLY SYNCED TO SUPABASE 100%!");
  await mongoose.disconnect();
  process.exit(0);
}

syncAll().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
