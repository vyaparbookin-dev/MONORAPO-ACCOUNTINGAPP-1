import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { supabase } from '../src/config/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function mongoIdToUuid(mongoId) {
  if (!mongoId) return null;
  const hash = crypto.createHash('md5').update(String(mongoId)).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

async function syncAll() {
  console.log("=== STARTING FULL MONGODB TO SUPABASE SYNC ===");
  if (!supabase) {
    console.error("Supabase client not initialized. Check .env variables.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;

  // 1. Get Ganesh Hardware in Supabase
  const { data: sbCos, error: sbCoErr } = await supabase.from('companies').select('id, name').limit(1);
  if (sbCoErr || !sbCos || sbCos.length === 0) {
    console.error("Failed to fetch company from Supabase:", sbCoErr);
    process.exit(1);
  }
  const defaultSbCompanyId = sbCos[0].id;
  console.log(`Using Supabase Company: ${sbCos[0].name} (${defaultSbCompanyId})`);

  // 2. Sync Categories
  const mongoCategories = await db.collection('categories').find().toArray();
  console.log(`\nFound ${mongoCategories.length} categories in MongoDB...`);
  let catSynced = 0;
  for (const cat of mongoCategories) {
    const catUuid = mongoIdToUuid(cat._id);
    const { error } = await supabase.from('categories').upsert({
      id: catUuid,
      company_id: defaultSbCompanyId,
      name: cat.name,
      is_active: true,
      created_at: cat.createdAt || new Date().toISOString(),
      updated_at: cat.updatedAt || new Date().toISOString()
    });
    if (!error) catSynced++;
    else console.warn(`Category ${cat.name} error:`, error.message);
  }
  console.log(`Synced ${catSynced}/${mongoCategories.length} categories to Supabase.`);

  // 3. Sync Brands
  const mongoBrands = await db.collection('brands').find().toArray();
  console.log(`\nFound ${mongoBrands.length} brands in MongoDB...`);
  let brandSynced = 0;
  for (const br of mongoBrands) {
    const brUuid = mongoIdToUuid(br._id);
    const { error } = await supabase.from('brands').upsert({
      id: brUuid,
      company_id: defaultSbCompanyId,
      name: br.name,
      is_active: true,
      created_at: br.createdAt || new Date().toISOString(),
      updated_at: br.updatedAt || new Date().toISOString()
    });
    if (!error) brandSynced++;
    else console.warn(`Brand ${br.name} error:`, error.message);
  }
  console.log(`Synced ${brandSynced}/${mongoBrands.length} brands to Supabase.`);

  // 4. Sync Units
  const mongoUnits = await db.collection('units').find().toArray();
  console.log(`\nFound ${mongoUnits.length} units in MongoDB...`);
  let unitSynced = 0;
  for (const u of mongoUnits) {
    const uUuid = mongoIdToUuid(u._id);
    const { error } = await supabase.from('units').upsert({
      id: uUuid,
      company_id: defaultSbCompanyId,
      name: u.name,
      short_code: u.shortCode || u.name,
      is_active: true,
      created_at: u.createdAt || new Date().toISOString(),
      updated_at: u.updatedAt || new Date().toISOString()
    });
    if (!error) unitSynced++;
    else console.warn(`Unit ${u.name} error:`, error.message);
  }
  console.log(`Synced ${unitSynced}/${mongoUnits.length} units to Supabase.`);

  // 5. Sync Expenses
  const mongoExpenses = await db.collection('expenses').find().toArray();
  console.log(`\nFound ${mongoExpenses.length} expenses in MongoDB...`);
  let expSynced = 0;
  for (const exp of mongoExpenses) {
    const expUuid = mongoIdToUuid(exp._id);
    const { error } = await supabase.from('expenses').upsert({
      id: expUuid,
      company_id: defaultSbCompanyId,
      title: exp.title || "खर्च",
      amount: Number(exp.amount || 0),
      category: exp.category || "General",
      date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      description: exp.description || exp.notes || "",
      status: exp.status || "approved",
      is_deleted: Boolean(exp.isDeleted),
      created_at: exp.createdAt || new Date().toISOString(),
      updated_at: exp.updatedAt || new Date().toISOString()
    });
    if (!error) expSynced++;
    else console.warn(`Expense error:`, error.message);
  }
  console.log(`Synced ${expSynced}/${mongoExpenses.length} expenses to Supabase.`);

  // 6. Sync Staffs -> Employees
  const mongoStaffs = await db.collection('staffs').find().toArray();
  console.log(`\nFound ${mongoStaffs.length} staffs in MongoDB...`);
  let staffSynced = 0;
  const staffIdMap = {};
  for (const st of mongoStaffs) {
    const empUuid = mongoIdToUuid(st._id);
    staffIdMap[st._id.toString()] = empUuid;
    const { error } = await supabase.from('employees').upsert({
      id: empUuid,
      company_id: defaultSbCompanyId,
      full_name: st.name || "Staff",
      phone_number: st.mobileNumber || "",
      designation: st.position || "Worker",
      role: st.role || "staff",
      wage_type: st.wageType || "monthly",
      salary: Number(st.salary || st.wageAmount || 0),
      is_active: st.isActive !== false,
      created_at: st.createdAt || new Date().toISOString(),
      updated_at: st.updatedAt || new Date().toISOString()
    });
    if (!error) staffSynced++;
    else console.warn(`Staff ${st.name} error:`, error.message);
  }
  console.log(`Synced ${staffSynced}/${mongoStaffs.length} employees to Supabase.`);

  // 7. Sync Attendances
  const mongoAtt = await db.collection('attendances').find().toArray();
  console.log(`\nFound ${mongoAtt.length} attendance records in MongoDB...`);
  let attSynced = 0;
  for (const att of mongoAtt) {
    const attUuid = mongoIdToUuid(att._id);
    const empUuid = staffIdMap[att.staffId?.toString()] || mongoIdToUuid(att.staffId);
    if (!empUuid) continue;
    const { error } = await supabase.from('attendance').upsert({
      id: attUuid,
      company_id: defaultSbCompanyId,
      employee_id: empUuid,
      date: att.date ? new Date(att.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: att.status || "present",
      created_at: att.createdAt || new Date().toISOString(),
      updated_at: att.updatedAt || new Date().toISOString()
    });
    if (!error) attSynced++;
    else console.warn(`Attendance error:`, error.message);
  }
  console.log(`Synced ${attSynced}/${mongoAtt.length} attendance records to Supabase.`);

  console.log("\nFULL SYNC TO SUPABASE COMPLETED SUCCESSFULLY!");
  await mongoose.disconnect();
  process.exit(0);
}

syncAll().catch(e => {
  console.error("FATAL SYNC ERROR:", e);
  process.exit(1);
});
