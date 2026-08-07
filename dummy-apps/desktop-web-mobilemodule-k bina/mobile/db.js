import * as SQLite from 'expo-sqlite';

let db = null;
let isInitializing = false; // 🔥 Prevent double initialization on Hot Reload

export const initDB = async () => {
  if (db) return; // Already initialized
  if (isInitializing) return; // Wait if already initializing
  isInitializing = true;

  try {
    try {
      // Asynchronous तरीके से DB ओपन करें ताकि Web पर SharedArrayBuffer का एरर न आए
      db = await SQLite.openDatabaseAsync('redaccounting.db');
    } catch (dbError) {
      console.warn("⚠️ Local DB Lock Error (Happens on Web Hot-Reload). Please Hard Refresh the page.", dbError.message);
      isInitializing = false;
      return; // Stop initialization safely without crashing
    }
    
    if (!db) return;
    
    // Products टेबल बनाना (अगर पहले से नहीं है)
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        name TEXT NOT NULL,
        sku TEXT,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        category TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS parties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        gstin TEXT,
        partyType TEXT,
        balance REAL DEFAULT 0,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        billNumber TEXT NOT NULL,
        partyUuid TEXT,
        totalAmount REAL NOT NULL,
        date TEXT NOT NULL,
        status TEXT,
        items TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        gstNumber TEXT,
        website TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        title TEXT NOT NULL,
        category TEXT,
        amount REAL NOT NULL,
        date TEXT,
        description TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        code TEXT NOT NULL,
        discountValue REAL,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        name TEXT NOT NULL,
        location TEXT,
        contactNumber TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS warehouses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        name TEXT NOT NULL,
        location TEXT,
        capacity TEXT,
        manager TEXT,
        branchId TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        name TEXT NOT NULL,
        mobile TEXT,
        role TEXT,
        wageType TEXT,
        wageAmount REAL,
        isActive INTEGER DEFAULT 1,
        balance REAL DEFAULT 0,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS staff_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        staffUuid TEXT,
        amount REAL,
        type TEXT,
        date TEXT,
        notes TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        staffUuid TEXT,
        startDate TEXT,
        endDate TEXT,
        status TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        name TEXT,
        email TEXT,
        role TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS security_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE,
        action TEXT,
        timestamp TEXT,
        is_synced INTEGER DEFAULT 0
      );
    `);
    console.log('✅ Local SQLite Database Initialized!');
  } catch (error) {
    console.error('❌ Database Initialization Failed:', error);
  } finally {
    isInitializing = false;
  }
};

// --- Products CRUD (Offline) ---

// 1. नया प्रोडक्ट लोकल DB में सेव करना
export const addProductLocal = async (product) => {
  if (!db) throw new Error("Database not initialized");
  try {
    const uuid = product.uuid || Date.now().toString(); // Temporary UUID agar server se nahi mila
    const result = await db.runAsync(
      'INSERT INTO products (uuid, name, sku, price, quantity, category, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuid, product.name, product.sku || '', product.price, product.quantity || 0, product.category || '', 0]
    );
    return { success: true, insertId: result.lastInsertRowId, uuid };
  } catch (error) {
    console.error('❌ Error adding product locally:', error);
    return { success: false, error };
  }
};

// 2. सारे प्रोडक्ट्स लोकल DB से मंगाना (बिना इंटरनेट के)
export const getProductsLocal = async () => {
  if (!db) return [];
  try {
    return await db.getAllAsync('SELECT * FROM products ORDER BY name ASC');
  } catch (error) {
    console.error('❌ Error fetching products locally:', error);
    return [];
  }
};

// --- Settings CRUD (Offline Key-Value Store) ---
export const saveSettingLocal = async (key, value) => {
  if (!db) throw new Error("Database not initialized");
  try {
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value, is_synced) VALUES (?, ?, ?)',
      [key, String(value), 0]
    );
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving setting locally:', error);
    return { success: false, error };
  }
};

export const getSettingLocal = async (key) => {
  if (!db) return null;
  try {
    const result = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', [key]);
    return result ? result.value : null;
  } catch (error) {
    console.error('❌ Error fetching setting locally:', error);
    return null;
  }
};

// --- Staff & Salary CRUD (Offline) ---
export const addStaffLocal = async (staff) => {
  if (!db) throw new Error("Database not initialized");
  try {
    const uuid = staff.uuid || Date.now().toString();
    await db.runAsync(
      'INSERT INTO staff (uuid, name, mobile, role, wageType, wageAmount, isActive, balance, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [uuid, staff.name, staff.mobile || '', staff.role || 'staff', staff.wageType || 'monthly', staff.wageAmount || 0, staff.isActive ? 1 : 0, 0, 0]
    );
    return { success: true, uuid };
  } catch (error) {
    console.error('❌ Error adding staff locally:', error);
    return { success: false, error };
  }
};

export const getStaffLocal = async () => {
  if (!db) return [];
  try {
    return await db.getAllAsync('SELECT * FROM staff ORDER BY name ASC');
  } catch (error) {
    console.error('❌ Error fetching staff locally:', error);
    return [];
  }
};

export const addStaffPaymentLocal = async (payment) => {
  if (!db) throw new Error("Database not initialized");
  try {
    const uuid = Date.now().toString();
    await db.runAsync(
      'INSERT INTO staff_payments (uuid, staffUuid, amount, type, date, notes, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuid, payment.staffId, payment.amount, payment.paymentType, payment.date || new Date().toISOString(), payment.notes || '', 0]
    );
    
    // Update staff balance (simplified logic)
    const isAdvance = payment.paymentType === 'advance' || payment.paymentType === 'deduction';
    const modifier = isAdvance ? `balance - ${payment.amount}` : `balance + ${payment.amount}`;
    await db.runAsync(`UPDATE staff SET balance = ${modifier} WHERE uuid = ?`, [payment.staffId]);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error adding payment locally:', error);
    return { success: false, error };
  }
};

export const addAttendanceLocal = async (att) => {
  if (!db) throw new Error("Database not initialized");
  try {
    const uuid = Date.now().toString();
    await db.runAsync(
      'INSERT INTO attendance (uuid, staffUuid, startDate, endDate, status, is_synced) VALUES (?, ?, ?, ?, ?, ?)',
      [uuid, att.staffId, att.startDate, att.endDate, att.status, 0]
    );
    return { success: true };
  } catch (error) {
    console.error('❌ Error adding attendance locally:', error);
    return { success: false, error };
  }
};

export const getStaffStatementLocal = async (staffUuid) => {
  if (!db) return [];
  try {
    const payments = await db.getAllAsync('SELECT * FROM staff_payments WHERE staffUuid = ? ORDER BY date DESC', [staffUuid]);
    return payments.map(p => ({
      _id: p.uuid,
      date: p.date,
      type: p.type,
      notes: p.notes,
      debit: p.type === 'advance' || p.type === 'deduction' ? p.amount : null,
      credit: p.type === 'salary_settlement' || p.type === 'incentive' ? p.amount : null
    }));
  } catch (error) {
    console.error('❌ Error fetching staff statement locally:', error);
    return [];
  }
};

// --- Users & Roles CRUD (Offline) ---
export const getUsersLocal = async () => {
  if (!db) return [];
  try {
    return await db.getAllAsync('SELECT * FROM users ORDER BY name ASC');
  } catch (error) {
    console.error('❌ Error fetching users locally:', error);
    return [];
  }
};

export const updateUserRoleLocal = async (userUuid, role) => {
  if (!db) throw new Error("Database not initialized");
  try {
    await db.runAsync('UPDATE users SET role = ?, is_synced = 0 WHERE uuid = ?', [role, userUuid]);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating user role locally:', error);
    return { success: false, error };
  }
};

// --- Security Logs CRUD (Offline) ---
export const getSecurityLogsLocal = async () => {
  if (!db) return [];
  try {
    return await db.getAllAsync('SELECT * FROM security_logs ORDER BY timestamp DESC LIMIT 50');
  } catch (error) {
    console.error('❌ Error fetching security logs locally:', error);
    return [];
  }
};

// --- Branches & Warehouses CRUD (Offline) ---
export const getBranchesLocal = async () => {
  if (!db) return [];
  try {
    return await db.getAllAsync('SELECT * FROM branches ORDER BY name ASC');
  } catch (error) {
    console.error('❌ Error fetching branches locally:', error);
    return [];
  }
};

export const addBranchLocal = async (branch) => {
  if (!db) throw new Error("Database not initialized");
  try {
    const uuid = branch.uuid || Date.now().toString();
    const result = await db.runAsync(
      'INSERT INTO branches (uuid, name, location, contactNumber, is_synced) VALUES (?, ?, ?, ?, ?)',
      [uuid, branch.name, branch.address || branch.location || '', branch.contactNumber || '', 0]
    );
    return { success: true, insertId: result.lastInsertRowId, uuid };
  } catch (error) {
    console.error('❌ Error adding branch locally:', error);
    return { success: false, error };
  }
};

export const addWarehouseLocal = async (warehouse) => {
  if (!db) throw new Error("Database not initialized");
  try {
    const uuid = warehouse.uuid || Date.now().toString();
    const result = await db.runAsync(
      'INSERT INTO warehouses (uuid, name, location, capacity, manager, branchId, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuid, warehouse.name, warehouse.location || '', warehouse.capacity || '', warehouse.manager || '', warehouse.branchId || '', 0]
    );
    return { success: true, insertId: result.lastInsertRowId, uuid };
  } catch (error) {
    console.error('❌ Error adding warehouse locally:', error);
    return { success: false, error };
  }
};

export const getWarehousesLocal = async () => {
  if (!db) return [];
  try {
    // JOIN laga rahe hain taaki list mein Branch ka naam bhi aa sake
    return await db.getAllAsync(`
      SELECT warehouses.*, branches.name as branchName 
      FROM warehouses 
      LEFT JOIN branches ON warehouses.branchId = branches.uuid 
      ORDER BY warehouses.name ASC
    `);
  } catch (error) {
    console.error('❌ Error fetching warehouses locally:', error);
    return [];
  }
};

// --- Companies CRUD (Offline) ---
export const addCompanyLocal = async (company) => {
  if (!db) throw new Error("Database not initialized");
  try {
    const uuid = company.uuid || Date.now().toString();
    const result = await db.runAsync(
      'INSERT INTO companies (uuid, name, email, phone, address, gstNumber, website, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [uuid, company.name, company.email || '', company.phone || '', company.address || '', company.gstNumber || '', company.website || '', 0]
    );
    return { success: true, insertId: result.lastInsertRowId, uuid };
  } catch (error) {
    console.error('❌ Error adding company locally:', error);
    return { success: false, error };
  }
};

export const getCompaniesLocal = async () => {
  if (!db) return [];
  try {
    return await db.getAllAsync('SELECT * FROM companies ORDER BY name ASC');
  } catch (error) {
    console.error('❌ Error fetching companies locally:', error);
    return [];
  }
};

// --- Expenses CRUD (Offline) ---
export const addExpenseLocal = async (expense) => {
  if (!db) throw new Error("Database not initialized");
  try {
    const uuid = expense.uuid || Date.now().toString();
    const result = await db.runAsync(
      'INSERT INTO expenses (uuid, title, category, amount, date, description, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuid, expense.title, expense.category || '', expense.amount, expense.date || new Date().toISOString(), expense.description || '', 0]
    );
    return { success: true, insertId: result.lastInsertRowId, uuid };
  } catch (error) {
    console.error('❌ Error adding expense locally:', error);
    return { success: false, error };
  }
};

export const getExpensesLocal = async () => {
  if (!db) return [];
  try {
    return await db.getAllAsync('SELECT * FROM expenses ORDER BY date DESC');
  } catch (error) {
    console.error('❌ Error fetching expenses locally:', error);
    return [];
  }
};

// --- Parties (Customers/Suppliers) CRUD (Offline) ---
export const addPartyLocal = async (party) => {
  if (!db) throw new Error("Database not initialized");
  try {
    const uuid = party.uuid || Date.now().toString();
    const result = await db.runAsync(
      'INSERT INTO parties (uuid, name, phone, address, gstin, partyType, balance, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [uuid, party.name, party.phone || '', party.address || '', party.gstin || '', party.partyType || 'customer', party.balance || 0, 0]
    );
    return { success: true, insertId: result.lastInsertRowId, uuid };
  } catch (error) {
    console.error('❌ Error adding party locally:', error);
    return { success: false, error };
  }
};

export const getPartiesLocal = async () => {
  if (!db) return [];
  try {
    return await db.getAllAsync('SELECT * FROM parties ORDER BY name ASC');
  } catch (error) {
    console.error('❌ Error fetching parties locally:', error);
    return [];
  }
};

// --- Bills / Invoices CRUD (Offline) ---
export const addBillLocal = async (bill, items) => {
  if (!db) throw new Error("Database not initialized");
  try {
    const uuid = bill.uuid || Date.now().toString();
    const itemsJson = JSON.stringify(items || []); // Items ko JSON string bana kar save karte hain
    
    const result = await db.runAsync(
      'INSERT INTO bills (uuid, billNumber, partyUuid, totalAmount, date, status, items, is_synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [uuid, bill.billNumber, bill.partyUuid || '', bill.totalAmount, bill.date || new Date().toISOString(), bill.status || 'issued', itemsJson, 0]
    );
    return { success: true, insertId: result.lastInsertRowId, uuid };
  } catch (error) {
    console.error('❌ Error adding bill locally:', error);
    return { success: false, error };
  }
};

// 2. सारे Bills लोकल DB से मंगाना (Parties/Customer के नाम के साथ)
export const getBillsLocal = async () => {
  if (!db) return [];
  try {
    return await db.getAllAsync(`
      SELECT bills.*, parties.name as customerName 
      FROM bills 
      LEFT JOIN parties ON bills.partyUuid = parties.uuid 
      ORDER BY date DESC
    `);
  } catch (error) {
    console.error('❌ Error fetching bills locally:', error);
    return [];
  }
};

// --- Coupons CRUD (Offline) ---
export const addCouponLocal = async (coupon) => {
  if (!db) throw new Error("Database not initialized");
  try {
    const uuid = coupon.uuid || Date.now().toString();
    const result = await db.runAsync(
      'INSERT INTO coupons (uuid, code, discountValue, is_synced) VALUES (?, ?, ?, ?)',
      [uuid, coupon.code, coupon.discountPercentage || 0, 0]
    );
    return { success: true, insertId: result.lastInsertRowId, uuid };
  } catch (error) {
    console.error('❌ Error adding coupon locally:', error);
    return { success: false, error };
  }
};

export const getCouponsLocal = async () => {
  if (!db) return [];
  try {
    const coupons = await db.getAllAsync('SELECT * FROM coupons ORDER BY id DESC');
    // Map discountValue to discountPercentage for UI
    return coupons.map(c => ({ ...c, discountPercentage: c.discountValue, expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }));
  } catch (error) {
    console.error('❌ Error fetching coupons locally:', error);
    return [];
  }
};