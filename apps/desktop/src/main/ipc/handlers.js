import { ipcMain } from 'electron';
import { db } from '../database/db.js';
import pkg from 'uuid';
const { v4: uuidv4 } = pkg;

// Prevent double registration
let isRegistered = false;

export const setupHandlers = () => {
  if (isRegistered) return;
  isRegistered = true;
  console.log("🚀 [Electron Backend] Successfully registered SQLite IPC Handlers!");
  
  // --- CUSTOMERS ---

  // Get All Customers
  ipcMain.handle('db:get-customers', () => {
    try {
      db.prepare(`CREATE TABLE IF NOT EXISTS customers (uuid TEXT PRIMARY KEY, name TEXT, gstin TEXT, phone TEXT, email TEXT, address TEXT, is_synced INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0)`).run();
      const stmt = db.prepare('SELECT * FROM customers WHERE is_deleted = 0 ORDER BY name ASC');
      return stmt.all();
    } catch(e) { console.error("Customer fetch error:", e); return []; }
  });

  // Add Customer
  ipcMain.handle('db:add-customer', (_, customer) => {
    db.prepare(`CREATE TABLE IF NOT EXISTS customers (uuid TEXT PRIMARY KEY, name TEXT, gstin TEXT, phone TEXT, email TEXT, address TEXT, is_synced INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0)`).run();
    const uuid = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO customers (uuid, name, gstin, phone, email, address, is_synced)
      VALUES (@uuid, @name, @gstin, @phone, @email, @address, 0)
    `);
    
    stmt.run({ 
      uuid: customer.uuid || uuid,
      name: customer.name || 'Unknown',
      gstin: customer.gstin || customer.gstNumber || '',
      phone: customer.phone || customer.mobileNumber || '',
      email: customer.email || '',
      address: customer.address || ''
    });
    return { success: true, uuid };
  });

  // --- INVOICES ---

  // Get All Invoices (Bills)
  ipcMain.handle('db:get-invoices', () => {
    try {
      db.prepare(`CREATE TABLE IF NOT EXISTS invoices (uuid TEXT PRIMARY KEY, invoice_number TEXT, customer_uuid TEXT, date TEXT, total_amount REAL, tax_amount REAL, status TEXT, is_synced INTEGER DEFAULT 0)`).run();
      db.prepare(`CREATE TABLE IF NOT EXISTS invoice_items (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_uuid TEXT, item_name TEXT, hsn_code TEXT, quantity REAL, price REAL, tax_rate REAL, total REAL)`).run();
      
      const invoices = db.prepare('SELECT * FROM invoices ORDER BY date DESC').all();
      const itemsStmt = db.prepare('SELECT * FROM invoice_items WHERE invoice_uuid = ?');
      
      // Har invoice ke andar uske items attach kar do
      for (let inv of invoices) {
        inv.items = itemsStmt.all(inv.uuid).map(i => ({
          name: i.item_name,
          hsnCode: i.hsn_code,
          quantity: i.quantity,
          rate: i.price,
          tax_rate: i.tax_rate,
          total: i.total
        }));
      }
      return invoices;
    } catch(e) { console.error("Invoice fetch error:", e); return []; }
  });

  // Save Invoice (Transaction ensures data integrity)
  ipcMain.handle('db:save-invoice', (_, { invoice, items }) => {
    db.prepare(`CREATE TABLE IF NOT EXISTS invoices (uuid TEXT PRIMARY KEY, invoice_number TEXT, customer_uuid TEXT, date TEXT, total_amount REAL, tax_amount REAL, status TEXT, is_synced INTEGER DEFAULT 0)`).run();
    db.prepare(`CREATE TABLE IF NOT EXISTS invoice_items (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_uuid TEXT, item_name TEXT, hsn_code TEXT, quantity REAL, price REAL, tax_rate REAL, total REAL)`).run();
    const invoiceUuid = uuidv4();
    
    const insertInvoice = db.transaction(() => {
      // 1. Insert Invoice
      db.prepare(`
        INSERT INTO invoices (uuid, invoice_number, customer_uuid, date, total_amount, tax_amount, status, is_synced)
        VALUES (@uuid, @invoice_number, @customer_uuid, @date, @total_amount, @tax_amount, @status, 0)
      `).run({ 
        uuid: invoiceUuid,
        invoice_number: invoice.invoice_number || invoice.billNumber || 'INV',
        customer_uuid: invoice.customer_uuid || invoice.partyId || 'walk-in',
        date: invoice.date || new Date().toISOString(),
        total_amount: invoice.total_amount || invoice.finalAmount || invoice.total || 0,
        tax_amount: invoice.tax_amount || invoice.tax || 0,
        status: invoice.status || 'draft'
      });

      // 2. Insert Items
      const itemStmt = db.prepare(`
        INSERT INTO invoice_items (invoice_uuid, item_name, hsn_code, quantity, price, tax_rate, total)
        VALUES (@invoice_uuid, @item_name, @hsn_code, @quantity, @price, @tax_rate, @total)
      `);

      for (const item of items) {
        itemStmt.run({ 
          invoice_uuid: invoiceUuid,
          item_name: item.item_name || item.name || 'Item',
          hsn_code: item.hsn_code || item.hsnCode || '',
          quantity: item.quantity || 1,
          price: item.price || item.rate || 0,
          tax_rate: item.tax_rate || item.gstRate || 0,
          total: item.total || 0
        });
      }
    });

    insertInvoice();
    return { success: true, uuid: invoiceUuid };
  });

  // Update Invoice
  ipcMain.handle('db:update-invoice', (_, uuid, { invoice, items }) => {
    const updateTransaction = db.transaction(() => {
      // 1. Update main invoice
      db.prepare(`
        UPDATE invoices 
        SET invoice_number = @invoice_number, customer_uuid = @customer_uuid, 
            date = @date, total_amount = @total_amount, tax_amount = @tax_amount, 
            status = @status, is_synced = 0
        WHERE uuid = @uuid
      `).run({ ...invoice, uuid });

      // 2. Delete old items
      db.prepare('DELETE FROM invoice_items WHERE invoice_uuid = ?').run(uuid);

      // 3. Insert new items
      const itemStmt = db.prepare(`
        INSERT INTO invoice_items (invoice_uuid, item_name, hsn_code, quantity, price, tax_rate, total)
        VALUES (@invoice_uuid, @item_name, @hsn_code, @quantity, @price, @tax_rate, @total)
      `);
      for (const item of items) {
        itemStmt.run({ ...item, invoice_uuid: uuid });
      }
    });
    updateTransaction();
    return { success: true };
  });

  // Delete Invoice
  ipcMain.handle('db:delete-invoice', (_, uuid) => {
    const deleteItems = db.prepare('DELETE FROM invoice_items WHERE invoice_uuid = ?');
    const deleteInvoice = db.prepare('DELETE FROM invoices WHERE uuid = ?');
    
    const transaction = db.transaction(() => {
      deleteItems.run(uuid);
      deleteInvoice.run(uuid);
    });
    
    transaction();
    return { success: true };
  });

  // --- INVENTORY / PRODUCTS ---
  
  ipcMain.handle('db:get-inventory', () => {
    try {
      db.prepare(`CREATE TABLE IF NOT EXISTS products (uuid TEXT PRIMARY KEY, name TEXT, sku TEXT, price REAL, quantity REAL, category TEXT, is_synced INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0)`).run();
      const stmt = db.prepare('SELECT * FROM products WHERE is_deleted = 0 ORDER BY name ASC');
      return stmt.all();
    } catch(e) { console.error("Inventory fetch error:", e); return []; }
  });

  ipcMain.handle('db:save-product', (_, product) => {
    db.prepare(`CREATE TABLE IF NOT EXISTS products (uuid TEXT PRIMARY KEY, name TEXT, sku TEXT, price REAL, quantity REAL, category TEXT, is_synced INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0)`).run();
    const uuid = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO products (uuid, name, sku, price, quantity, category, is_synced)
      VALUES (@uuid, @name, @sku, @price, @quantity, @category, 0)
    `);
    stmt.run({ 
      uuid: product.uuid || product._id || uuid,
      name: product.name || 'Unnamed',
      sku: product.sku || product.barcode || '',
      price: product.price || product.sellingPrice || 0,
      quantity: product.quantity || product.currentStock || 0,
      category: product.category || 'General'
    });
    return { success: true, uuid };
  });

  ipcMain.handle('db:update-product', (_, uuid, product) => {
    const stmt = db.prepare(`
      UPDATE products 
      SET name = @name, sku = @sku, price = @price, quantity = @quantity, category = @category, is_synced = 0
      WHERE uuid = @uuid
    `);
    stmt.run({
      uuid,
      name: product.name || 'Unnamed',
      sku: product.sku || product.barcode || '',
      price: product.price || product.sellingPrice || 0,
      quantity: product.quantity || product.currentStock || 0,
      category: product.category || 'General'
    });
    return { success: true };
  });

  ipcMain.handle('db:delete-product', (_, uuid) => {
    db.prepare("UPDATE products SET is_deleted = 1, is_synced = 0 WHERE uuid = ?").run(uuid);
    return { success: true };
  });

  // --- STOCK ADJUSTMENTS ---
  ipcMain.handle('db:get-adjustments', () => {
    try {
      db.prepare(`CREATE TABLE IF NOT EXISTS stock_adjustments (uuid TEXT PRIMARY KEY, product_uuid TEXT, product_name TEXT, type TEXT, quantity REAL, reason TEXT, notes TEXT, date TEXT, is_synced INTEGER DEFAULT 0)`).run();
      const stmt = db.prepare('SELECT * FROM stock_adjustments ORDER BY date DESC');
      return stmt.all();
    } catch(e) { console.error("Adjustment fetch error:", e); return []; }
  });

  ipcMain.handle('db:save-adjustment', (_, adj) => {
    try {
      db.prepare(`CREATE TABLE IF NOT EXISTS stock_adjustments (uuid TEXT PRIMARY KEY, product_uuid TEXT, product_name TEXT, type TEXT, quantity REAL, reason TEXT, notes TEXT, date TEXT, is_synced INTEGER DEFAULT 0)`).run();
      const transaction = db.transaction(() => {
        db.prepare(`
          INSERT INTO stock_adjustments (uuid, product_uuid, product_name, type, quantity, reason, notes, date, is_synced)
          VALUES (@uuid, @product_uuid, @product_name, @type, @quantity, @reason, @notes, @date, 0)
        `).run({
          uuid: adj.uuid || adj._id, product_uuid: adj.productId, product_name: adj.productName || 'Unknown',
          type: adj.type, quantity: adj.quantity, reason: adj.reason || '', notes: adj.notes || '', date: adj.date
        });
        const qtyChange = adj.type === 'addition' ? parseFloat(adj.quantity) : -parseFloat(adj.quantity);
        db.prepare(`UPDATE products SET quantity = quantity + @qtyChange, is_synced = 0 WHERE uuid = @uuid`).run({ qtyChange, uuid: adj.productId });
      });
      transaction();
      return { success: true };
    } catch (e) { console.error("Adjustment save error:", e); throw e; }
  });

  // --- COMPANIES ---
  
  // Get All Companies
  ipcMain.handle('db:get-companies', () => {
    try {
      const stmt = db.prepare('SELECT * FROM companies ORDER BY name ASC');
      return stmt.all();
    } catch (error) {
      console.error("Error fetching companies:", error);
      return [];
    }
  });

  // Save Company
  ipcMain.handle('db:save-company', (_, company) => {
    const uuid = company.uuid || uuidv4();
    const stmt = db.prepare(`
      INSERT INTO companies (uuid, name, email, phone, address, gstNumber, website, is_synced)
      VALUES (@uuid, @name, @email, @phone, @address, @gstNumber, @website, 0)
    `);
    stmt.run({ uuid, name: company.name, email: company.email || '', phone: company.phone || '', address: company.address || '', gstNumber: company.gstNumber || '', website: company.website || '' });
    return { success: true, uuid };
  });

  // --- EXPENSES DB HANDLERS ---
  
  ipcMain.handle('db:get-expenses', () => {
    try {
      db.prepare("CREATE TABLE IF NOT EXISTS expenses (uuid TEXT PRIMARY KEY, data TEXT)").run();
      const rows = db.prepare("SELECT data FROM expenses").all();
      return rows.map(row => JSON.parse(row.data));
    } catch (error) {
      console.warn("Expenses table error:", error.message);
      return [];
    }
  });

  ipcMain.handle('db:save-expense', (_, expenseData) => {
    db.prepare("CREATE TABLE IF NOT EXISTS expenses (uuid TEXT PRIMARY KEY, data TEXT)").run();
    const uuid = expenseData.uuid || expenseData._id;
    db.prepare("INSERT INTO expenses (uuid, data) VALUES (@uuid, @data)").run({
      uuid,
      data: JSON.stringify(expenseData)
    });
    return { success: true, uuid };
  });

  ipcMain.handle('db:update-expense', (_, uuid, expenseData) => {
    db.prepare("UPDATE expenses SET data = @data WHERE uuid = @uuid").run({
      uuid,
      data: JSON.stringify(expenseData)
    });
    return { success: true };
  });

  ipcMain.handle('db:delete-expense', (_, uuid) => {
    db.prepare("DELETE FROM expenses WHERE uuid = ?").run(uuid);
    return { success: true };
  });

  // --- SYNC QUEUE & AUDIT LOG HANDLERS ---
  
  ipcMain.handle('db:get-sync-queue', () => {
    db.prepare("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)").run();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'sync_queue'").get();
    return row ? JSON.parse(row.value) : [];
  });

  ipcMain.handle('db:save-sync-queue', (_, queueData) => {
    db.prepare("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)").run();
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('sync_queue', @value)").run({ value: JSON.stringify(queueData) });
    return { success: true };
  });

  ipcMain.handle('db:save-audit-log', (_, logData) => {
    db.prepare("CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, timestamp TEXT, data TEXT)").run();
    db.prepare("INSERT INTO audit_logs (id, timestamp, data) VALUES (@id, @timestamp, @data)").run({ id: logData.id, timestamp: logData.timestamp, data: JSON.stringify(logData) });
    return { success: true };
  });

  // --- APPROVALS HANDLER ---
  ipcMain.handle('db:get-approvals', () => {
    try {
      return { bills: [], expenses: [], stockTransfers: [] };
    } catch (error) {
      return { bills: [], expenses: [], stockTransfers: [] };
    }
  });

  // --- MASTER DATA (UNITS & CATEGORIES) & CUSTOMER EXTRAS ---
  ipcMain.handle('db:delete-customer', (_, uuid) => {
    db.prepare("UPDATE customers SET is_deleted = 1, is_synced = 0 WHERE uuid = ?").run(uuid);
    return { success: true };
  });

  ipcMain.handle('db:get-units', () => {
    try {
      db.prepare(`CREATE TABLE IF NOT EXISTS units (uuid TEXT PRIMARY KEY, name TEXT, shortCode TEXT, description TEXT, is_synced INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0)`).run();
      return db.prepare('SELECT * FROM units WHERE is_deleted = 0 ORDER BY name ASC').all();
    } catch(e) { return []; }
  });

  ipcMain.handle('db:save-unit', (_, unit) => {
    db.prepare(`CREATE TABLE IF NOT EXISTS units (uuid TEXT PRIMARY KEY, name TEXT, shortCode TEXT, description TEXT, is_synced INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0)`).run();
    db.prepare(`INSERT INTO units (uuid, name, shortCode, description, is_synced) VALUES (@uuid, @name, @shortCode, @description, 0)`).run({ uuid: unit.uuid || unit._id, name: unit.name, shortCode: unit.shortCode || '', description: unit.description || '' });
    return { success: true };
  });

  ipcMain.handle('db:delete-unit', (_, uuid) => {
    db.prepare("UPDATE units SET is_deleted = 1, is_synced = 0 WHERE uuid = ?").run(uuid);
    return { success: true };
  });

  ipcMain.handle('db:get-categories', () => {
    try {
      db.prepare(`CREATE TABLE IF NOT EXISTS categories (uuid TEXT PRIMARY KEY, name TEXT, description TEXT, is_synced INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0)`).run();
      return db.prepare('SELECT * FROM categories WHERE is_deleted = 0 ORDER BY name ASC').all();
    } catch(e) { return []; }
  });

  ipcMain.handle('db:save-category', (_, cat) => {
    db.prepare(`CREATE TABLE IF NOT EXISTS categories (uuid TEXT PRIMARY KEY, name TEXT, description TEXT, is_synced INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0)`).run();
    db.prepare(`INSERT INTO categories (uuid, name, description, is_synced) VALUES (@uuid, @name, @description, 0)`).run({ uuid: cat.uuid || cat._id, name: cat.name, description: cat.description || '' });
    return { success: true };
  });

  ipcMain.handle('db:delete-category', (_, uuid) => {
    db.prepare("UPDATE categories SET is_deleted = 1, is_synced = 0 WHERE uuid = ?").run(uuid);
    return { success: true };
  });

  // --- STAFF & SALARY HANDLERS ---
  ipcMain.handle('db:get-staff', () => {
    try {
      db.prepare(`CREATE TABLE IF NOT EXISTS staff (uuid TEXT PRIMARY KEY, name TEXT, role TEXT, balance REAL DEFAULT 0, is_synced INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0)`).run();
      return db.prepare('SELECT * FROM staff WHERE is_deleted = 0').all();
    } catch(e) { return []; }
  });

  ipcMain.handle('db:get-salaries', () => {
    try {
      db.prepare(`CREATE TABLE IF NOT EXISTS salaries (uuid TEXT PRIMARY KEY, employeeName TEXT, amount REAL, status TEXT, date TEXT, notes TEXT, is_synced INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0)`).run();
      return db.prepare('SELECT * FROM salaries WHERE is_deleted = 0 ORDER BY date DESC').all();
    } catch(e) { return []; }
  });

  ipcMain.handle('db:save-salary', (_, data) => {
    db.prepare(`CREATE TABLE IF NOT EXISTS salaries (uuid TEXT PRIMARY KEY, employeeName TEXT, amount REAL, status TEXT, date TEXT, notes TEXT, is_synced INTEGER DEFAULT 0, is_deleted INTEGER DEFAULT 0)`).run();
    db.prepare(`INSERT INTO salaries (uuid, employeeName, amount, status, date, notes, is_synced) VALUES (@uuid, @employeeName, @amount, @status, @date, @notes, 0)`).run(data);
    return { success: true };
  });

  ipcMain.handle('db:update-salary', (_, uuid, data) => {
    db.prepare(`UPDATE salaries SET employeeName=@employeeName, amount=@amount, status=@status, date=@date, notes=@notes, is_synced=0 WHERE uuid=@uuid`).run({ ...data, uuid });
    return { success: true };
  });

  ipcMain.handle('db:delete-salary', (_, uuid) => {
    db.prepare(`UPDATE salaries SET is_deleted=1, is_synced=0 WHERE uuid=?`).run(uuid);
    return { success: true };
  });

  ipcMain.handle('db:get-transactions', (_, staffId) => {
    try {
      db.prepare(`CREATE TABLE IF NOT EXISTS staff_transactions (uuid TEXT PRIMARY KEY, staff_uuid TEXT, type TEXT, debit REAL DEFAULT 0, credit REAL DEFAULT 0, notes TEXT, date TEXT, status TEXT, is_synced INTEGER DEFAULT 0)`).run();
      return db.prepare('SELECT * FROM staff_transactions WHERE staff_uuid = ? ORDER BY date DESC').all(staffId);
    } catch(e) { return []; }
  });

  ipcMain.handle('db:save-transaction', (_, data) => {
    db.prepare(`CREATE TABLE IF NOT EXISTS staff_transactions (uuid TEXT PRIMARY KEY, staff_uuid TEXT, type TEXT, debit REAL DEFAULT 0, credit REAL DEFAULT 0, notes TEXT, date TEXT, status TEXT, is_synced INTEGER DEFAULT 0)`).run();
    db.prepare(`INSERT INTO staff_transactions (uuid, staff_uuid, type, debit, credit, notes, date, status, is_synced) VALUES (@uuid, @staff_uuid, @type, @debit, @credit, @notes, @date, @status, 0)`).run(data);
    return { success: true };
  });
};

// AUTO-INITIALIZE: Ensures handlers are registered even if main.cjs just imports this file
setupHandlers();
