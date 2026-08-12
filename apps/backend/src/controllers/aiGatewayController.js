// apps/backend/src/controllers/aiGatewayController.js

import Product from '../model/product.js';
import Party from '../model/party.js';
import Bill from '../model/bill.js';
// Quotation मॉडल को भी इम्पोर्ट करना होगा जब वह बन जाएगा

// क्षमता 1: प्रोडक्ट की जानकारी देना
export const searchProductByName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }
    // प्रोडक्ट को नाम से खोजें (case-insensitive)
    const product = await Product.findOne({ name: { $regex: new RegExp(name, 'i') } });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // केवल ज़रूरी जानकारी ही AI को भेजें
    res.status(200).json({
      success: true,
      data: {
        name: product.name,
        price: product.sellingPrice,
        stock: product.currentStock,
        unit: product.unit,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// क्षमता 2: ग्राहक का इतिहास बताना
export const getCustomerHistoryByPhone = async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required.' });
        }

        // ग्राहक को फ़ोन नंबर से खोजें
        const party = await Party.findOne({ phone: phone });
        if (!party) {
            return res.status(404).json({ success: false, message: 'Customer not found.' });
        }

        // ग्राहक का आखिरी बिल खोजें
        const lastBill = await Bill.findOne({ partyId: party._id }).sort({ date: -1 });

        res.status(200).json({
            success: true,
            data: {
                customerName: party.name,
                lastPurchaseDate: lastBill ? lastBill.date : 'No purchase history',
                lastPurchaseAmount: lastBill ? lastBill.finalAmount : 0,
            },
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// क्षमता 4: स्टॉक की उपलब्धता बताना (यह searchProductByName में पहले से ही शामिल है)
export const getProductStock = async (req, res) => {
    // यह लॉजिक searchProductByName के जैसा ही है, इसलिए हम उसी का उपयोग कर सकते हैं।
    // डुप्लीकेट कोड लिखने की ज़रूरत नहीं है।
    return searchProductByName(req, res);
};

// क्षमता 3: कोटेशन बनाना (यह तब बनेगा जब कोटेशन का API तैयार हो जाएगा)
export const createQuotationForAI = async (req, res) => {
    // TODO: जब /api/quotations बन जाएगा, तो यह फंक्शन उस API को कॉल करेगा
    // और एक नया कोटेशन बनाएगा।
    res.status(501).json({ success: false, message: 'Not Implemented Yet' });
};
