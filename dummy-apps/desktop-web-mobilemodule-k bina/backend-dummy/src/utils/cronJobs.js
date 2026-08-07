import cron from 'node-cron';
import Bill from '../model/bill.js';
import Company from '../model/company.js';

export const startCronJobs = () => {
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