import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let DatabaseModule;
try {
  DatabaseModule = (await import('better-sqlite3')).default;
} catch (e) {
  console.warn('⚠️ better-sqlite3 import warning:', e.message);
}

// डेटाबेस फाइल का नाम
const DB_NAME = 'red_accounting.db';

let dbInstance = null;

try {
  const userDataPath = app?.getPath ? app.getPath('userData') : process.cwd();
  const dbPath = path.join(userDataPath, DB_NAME);

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  console.log('Local Database Path:', dbPath);

  if (DatabaseModule) {
    dbInstance = new DatabaseModule(dbPath, { verbose: null });
    dbInstance.pragma('journal_mode = WAL');
    
    // Initialize standard tables
    const schema = `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        sku TEXT,
        price REAL NOT NULL,
        quantity INTEGER DEFAULT 0,
        category TEXT,
        is_synced INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        gstin TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        balance REAL DEFAULT 0,
        is_synced INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        invoice_number TEXT,
        customer_uuid TEXT,
        date TEXT,
        total_amount REAL,
        tax_amount REAL,
        status TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_uuid TEXT NOT NULL,
        item_name TEXT,
        hsn_code TEXT,
        quantity REAL,
        price REAL,
        tax_rate REAL,
        total REAL,
        FOREIGN KEY (invoice_uuid) REFERENCES invoices (uuid)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        gstNumber TEXT,
        website TEXT,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS units (
        uuid TEXT PRIMARY KEY,
        name TEXT,
        shortCode TEXT,
        description TEXT,
        is_synced INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS categories (
        uuid TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        is_synced INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS staff (
        uuid TEXT PRIMARY KEY,
        name TEXT,
        role TEXT,
        balance REAL DEFAULT 0,
        is_synced INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS stock_adjustments (
        uuid TEXT PRIMARY KEY,
        product_uuid TEXT,
        product_name TEXT,
        type TEXT,
        quantity REAL,
        reason TEXT, notes TEXT, date TEXT, is_synced INTEGER DEFAULT 0
      );
    `;
    dbInstance.exec(schema);
    console.log('✅ Local Database initialized successfully with all tables.');
  } else {
    console.warn('⚠️ SQLite module unavailable. Running with memory mock.');
  }
} catch (error) {
  console.error('⚠️ SQLite initialization error (continuing gracefully):', error.message);
}

// Fallback dummy db if SQLite failed to load
if (!dbInstance) {
  const dummyStmt = {
    run: () => ({ changes: 0, lastInsertRowid: 0 }),
    get: () => null,
    all: () => []
  };
  dbInstance = {
    prepare: () => dummyStmt,
    exec: () => {},
    pragma: () => {},
    transaction: (fn) => fn
  };
}

export const db = dbInstance;
export default db;
