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

        if (!waSettings.phoneNumberId || !waSettings.accessToken) {
            console.log('Auto-WA: Missing Meta Phone Number ID or Access Token.');
            return false;
        }
        
        // 2. Check Customer Mobile
        if (!billData.customerMobile) {
            console.log('Auto-WA: No customer mobile number provided in the bill.');
            return false;
        }

        // Format mobile number to match Meta requirements (Country code without '+')
        let mobile = billData.customerMobile.replace(/\D/g, "");
        if (mobile.length === 10) mobile = "91" + mobile; // Assuming India default if length is 10

        // 3. Prepare Message from Template
        let message = waSettings.template || 'Hello, your invoice {billNumber} is ready.';
        message = message.replace(/{customerName}/g, billData.customerName || 'Customer');
        message = message.replace(/{billNumber}/g, billData.billNumber || billData.billNo || 'N/A');
        message = message.replace(/{amount}/g, billData.finalAmount || billData.totalAmount || billData.total || 0);
        message = message.replace(/{companyName}/g, company.name || 'Our Company');

        // 4. Send API Request to Official Meta Cloud API
        console.log(`Auto-WA: Sending message via Meta API to ${mobile}...`);
        
        const metaApiUrl = `https://graph.facebook.com/v18.0/${waSettings.phoneNumberId}/messages`;
        
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: mobile,
            type: "text",
            text: { preview_url: false, body: message }
        };

        const response = await axios.post(metaApiUrl, payload, {
            headers: {
                'Authorization': `Bearer ${waSettings.accessToken}`,
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