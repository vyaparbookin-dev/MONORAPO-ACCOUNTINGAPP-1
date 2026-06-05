import axios from 'axios';
import Company from '../model/company.js';

export const sendAutoWhatsappMessage = async (companyId, billData) => {
    try {
        // 1. Fetch Company Settings
        const company = await Company.findById(companyId);
        if (!company || !company.settings || !company.settings.whatsapp || !company.settings.whatsapp.enabled) {
            // WhatsApp is turned off for this company, ignore safely
            return false;
        }

        const waSettings = company.settings.whatsapp;
        
        // 2. Check Customer Mobile
        if (!billData.customerMobile) {
            console.log('Auto-WA: No customer mobile number provided in the bill.');
            return false;
        }

        // 3. Prepare Message from Template
        let message = waSettings.template || 'Hello, your invoice {billNumber} is ready.';
        message = message.replace(/{customerName}/g, billData.customerName || 'Customer');
        message = message.replace(/{billNumber}/g, billData.billNumber || billData.billNo || 'N/A');
        message = message.replace(/{amount}/g, billData.finalAmount || billData.totalAmount || billData.total || 0);
        message = message.replace(/{companyName}/g, company.name || 'Our Company');

        // 4. Send API Request to Custom Provider
        console.log(`Auto-WA: Sending message to ${billData.customerMobile}...`);
        
        const response = await axios.post(waSettings.apiUrl, {
            mobile: billData.customerMobile,
            message: message,
            senderId: waSettings.senderId
        }, {
            headers: {
                'Authorization': `Bearer ${waSettings.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Auto-WA: Message sent successfully!');
        return true;
    } catch (error) {
        console.error('Auto-WA: Error sending message -', error.message);
        return false;
    }
};