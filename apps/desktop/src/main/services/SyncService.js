import { db } from '../database/db.js';
import axios from 'axios';

// API क्लाइंट बनाएँ
const api = axios.create({
  baseURL: 'http://localhost:5000', // आपका बैकएंड सर्वर URL
  timeout: 10000, // 10 सेकंड का टाइमआउट
});

export const startSyncService = () => {
  console.log('🚀 Background Sync Service Started');

  // हर 30 सेकंड में सिंक चलाएं
  setInterval(runSync, 30 * 1000);
  
  // ऐप खुलते ही एक बार तुरंत चलाएं
  runSync();
};

const runSync = async () => {
  try {
    // --- 1. CUSTOMERS SYNC ---
    // वो कस्टमर ढूँढें जो अभी तक सिंक नहीं हुए (is_synced = 0)
    const unsyncedCustomers = db.prepare('SELECT * FROM customers WHERE is_synced = 0').all();
    
    if (unsyncedCustomers.length > 0) {
      console.log(`🔄 Found ${unsyncedCustomers.length} unsynced customers. Syncing...`);
      
      for (const customer of unsyncedCustomers) {
        try {
          // 1. सर्वर पर नया ग्राहक डेटा भेजें (POST रिक्वेस्ट)
          const response = await api.post('/api/parties', customer);
          
          // 2. अगर सर्वर से सफलता का संकेत मिलता है (status 200-299)
          if (response.status >= 200 && response.status < 300) {
          // लोकल डेटाबेस को अपडेट करें कि यह सिंक हो चुका है
          db.prepare('UPDATE customers SET is_synced = 1 WHERE uuid = ?').run(customer.uuid);
          console.log(`✅ Synced Customer: ${customer.name}`);
          }
        } catch (apiError) {
          console.error(`❌ Failed to sync customer ${customer.name}:`, apiError.message);
        }
      }
    }

    // --- 2. INVOICES SYNC ---
    // इसी तरह इनवॉइस के लिए भी लॉजिक लगेगा
    // const unsyncedInvoices = db.prepare('SELECT * FROM invoices WHERE is_synced = 0').all();
    // ... logic ...

  } catch (error) {
    console.error('❌ Sync Error:', error.message);
  }
};