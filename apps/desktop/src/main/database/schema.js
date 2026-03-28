import { db } from './db.js';

export const initDatabase = () => {
  // 1. Customers Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      gstin TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      balance REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_synced INTEGER DEFAULT 0, -- 0 = Not Synced, 1 = Synced
      is_deleted INTEGER DEFAULT 0
    )
  `);

  // 2. Invoices Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      invoice_number TEXT NOT NULL,
      customer_uuid TEXT NOT NULL,
      date TEXT NOT NULL,
      total_amount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'Unpaid', -- Paid, Unpaid, Partial
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_synced INTEGER DEFAULT 0,
      FOREIGN KEY (customer_uuid) REFERENCES customers(uuid)
    )
  `);

  // 3. Invoice Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_uuid TEXT NOT NULL,
      item_name TEXT NOT NULL,
      hsn_code TEXT,
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      tax_rate REAL DEFAULT 0,
      total REAL NOT NULL,
      FOREIGN KEY (invoice_uuid) REFERENCES invoices(uuid)
    )
  `);

  // 4. Companies Table
  db.exec(`
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
    )
  `);

  // 5. Products / Inventory Table
  db.exec(`
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
    )
  `);

  console.log('Database tables initialized successfully');
};
