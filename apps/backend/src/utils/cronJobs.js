import cron from 'node-cron';
import Bill from '../model/bill.js';
import Company from '../model/company.js';

// --- Supabase Keep-Alive Ping (Prevents Supabase Free Tier auto-pause) ---
export const pingSupabaseKeepAlive = async () => {
  try {
    const { supabase } = await import('../config/supabase.js');
    if (supabase) {
      const { data, error } = await supabase.from('companies').select('id').limit(1);
      if (error) {
        console.warn('⚠️ [Supabase Keep-Alive] Ping note:', error.message);
      } else {
        console.log('💚 [Supabase Keep-Alive] Supabase is alive and active! (Auto-pause prevented)');
      }
    }
  } catch (err) {
    console.warn('⚠️ [Supabase Keep-Alive] Error:', err.message);
  }
};

export const startCronJobs = () => {
  // Run immediate keep-alive ping on server startup
  pingSupabaseKeepAlive();

  // Run every 2 days at 03:00 AM ('0 3 */2 * *') to keep Supabase active
  cron.schedule('0 3 */2 * *', async () => {
    console.log('⏳ Running Supabase Keep-Alive Cron...');
    await pingSupabaseKeepAlive();
  });

  // Run every day at 10:00 AM ('0 10 * * *')
  cron.schedule('0 10 * * *', async () => {
    console.log('⏳ Running Daily Auto-Payment Reminder Cron Job...');
    try {
      const today = new Date();
      
      // Find bills that are issued/partial and their dueDate has passed
      const overdueBills = await Bill.find({
        status: { $in: ['issued', 'partial'] },
        dueDate: { $lte: today },
        isDeleted: false
      });

      for (const bill of overdueBills) {
        if (bill.customerMobile) {
          const company = await Company.findById(bill.companyId);
          const paymentLink = company?.upiId ? `upi://pay?pa=${company.upiId}&pn=${encodeURIComponent(company.name)}&am=${bill.finalAmount}&cu=INR` : '';
          const message = `Reminder: Hello ${bill.customerName}, your invoice #${bill.billNumber} from ${company?.name || 'our store'} for ₹${bill.finalAmount} is OVERDUE.\n\n${paymentLink ? `Please pay using this link: ${paymentLink}` : ''}`;
          
          console.log(`📲 [CRON Auto-WhatsApp] To: ${bill.customerMobile} | Msg: ${message}`);
        }
      }
      console.log(`✅ Processed ${overdueBills.length} overdue bills.`);
    } catch (error) {
      console.error('❌ Cron Job Error:', error);
    }
  });
};