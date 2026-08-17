import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

// डेटाबेस फाइल का नाम
const DB_NAME = 'red_accounting.db';

// यह पाथ यूजर के सिस्टम डेटा फोल्डर में होगा (ताकि अपडेट होने पर डिलीट न हो)
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, DB_NAME);

// फोल्डर मौजूद है या नहीं चेक करें
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

console.log('Local Database Path:', dbPath);

// डेटाबेस कनेक्ट करें
export const db = new Database(dbPath, { verbose: console.log });

// Performance के लिए WAL मोड ऑन करें (यह बहुत तेज होता है)
db.pragma('journal_mode = WAL');

// --- INITIALIZE TABLES ---
const initializeDatabase = () => {
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
  db.exec(schema); // Use db.exec for multiple statements
  console.log('✅ Local Database initialized with all required tables.');
};

// Call initialization function on app start
try {
  initializeDatabase();
} catch (error) {
  console.error('❌ Failed to initialize database:', error);
  throw error; // Re-throw the error to prevent the app from starting with a broken DB
}