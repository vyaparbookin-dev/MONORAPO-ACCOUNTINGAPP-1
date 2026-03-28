import Purchase from "../model/purchase.js";
import Product from "../model/product.js";
import Party from "../model/party.js";
import PartyTransaction from "../model/PartyTransaction.js";
import { Parser } from "json2csv";
import { logActivity } from "../utils/logger.js";

// Create a new Purchase Bill (Stock Inward)
export const createPurchase = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const { partyId, items, finalAmount, amountPaid = 0, paymentMethod } = req.body;

    // 1. Create Purchase Bill Record
    const purchase = new Purchase({
      ...req.body,
      companyId,
      paymentStatus: amountPaid >= finalAmount ? "paid" : amountPaid > 0 ? "partial" : "unpaid",
      paymentMethod: paymentMethod || "credit"
    });

    await purchase.save();

    // 2. UPDATE INVENTORY (Increase Stock)
    for (const item of items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { currentStock: item.quantity } } // Stock Badha diya
        );
      }
    }

    // 3. UPDATE SUPPLIER LEDGER (Accounts Payable)
    const pendingAmount = finalAmount - amountPaid;
    if (pendingAmount > 0) {
      // Supplier ka current balance badhayenge (Udhar badh gaya)
      await Party.findByIdAndUpdate(
        partyId,
        { $inc: { currentBalance: pendingAmount } } 
      );

      // Transaction ki entry karenge (Credit means hume supplier ko paise dene hain)
      await PartyTransaction.create({
        partyId,
        companyId,
        date: req.body.date || new Date(),
        details: `Purchase Bill #${purchase.purchaseNumber}`,
        debit: 0,
        credit: pendingAmount, // Dukaan ke upar supplier ka paisa jama ho gaya
        type: 'bill'
      });
    }

    // Agar turant kuch amount pay kiya hai, uska record alag se transaction me dalna ho toh:
    if (amountPaid > 0) {
        await PartyTransaction.create({
            partyId,
            companyId,
            date: req.body.date || new Date(),
            details: `Advance Payment for Purchase Bill #${purchase.purchaseNumber}`,
            debit: amountPaid, // Humne paise de diye
            credit: 0,
            type: 'manual'
          });
    }

    // Audit Trail: Log this action
    await logActivity(req, `Recorded new Purchase #${purchase.purchaseNumber || purchase._id} for amount ₹${finalAmount}`);

    res.status(201).json({ success: true, message: "Purchase recorded and stock updated successfully!", purchase });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Export all purchases to CSV format
export const exportPurchasesCSV = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing." });
    }
    
    // Fetch all non-deleted purchases for this company
    const purchases = await Purchase.find({ companyId: req.companyId, isDeleted: false })
                                    .populate("partyId", "name")
                                    .sort({ date: -1 });

    // Define columns for CSV
    const fields = ['Purchase Number', 'Date', 'Supplier Name', 'Payment Status', 'Payment Method', 'Total Amount', 'Amount Paid'];
    
    // Map database data to CSV columns
    const csvData = purchases.map(p => ({
      'Purchase Number': p.purchaseNumber || 'N/A',
      'Date': new Date(p.date || p.createdAt).toLocaleDateString(),
      'Supplier Name': p.partyId ? p.partyId.name : 'Unknown',
      'Payment Status': p.paymentStatus?.toUpperCase() || 'N/A',
      'Payment Method': p.paymentMethod || 'N/A',
      'Total Amount': p.finalAmount || 0,
      'Amount Paid': p.amountPaid || 0
    }));

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    // Send file to client
    res.header('Content-Type', 'text/csv');
    res.attachment(`Purchases_Export_${Date.now()}.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Soft Delete a Purchase
export const deletePurchase = async (req, res) => {
  try {
    const oldPurchase = await Purchase.findOne({ _id: req.params.id, companyId: req.companyId });
    const purchase = await Purchase.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isDeleted: true },
      { new: true }
    );
    if (!purchase) return res.status(404).json({ success: false, error: "Purchase not found" });
    
    await logActivity(req, `Deleted Purchase #${purchase.purchaseNumber || req.params.id} | Supplier: ${oldPurchase?.supplierName || 'Unknown'}, Amount was: ₹${oldPurchase?.finalAmount || 0}`);
    
    res.json({ success: true, message: "Purchase deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all Purchases for a company
export const getPurchases = async (req, res) => {
  try {
    // Pagination parameters URL query se nikalenge (e.g., ?page=1&limit=50)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = { companyId: req.companyId, isDeleted: false };

    // Promise.all se data aur count dono ek saath fetch honge (Speed double ho jayegi)
    const [purchases, totalPurchases] = await Promise.all([
      Purchase.find(filter)
        .populate("partyId", "name mobileNumber")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Purchase.countDocuments(filter)
    ]);

    res.status(200).json({ 
      success: true, 
      purchases,
      pagination: { total: totalPurchases, page, limit, totalPages: Math.ceil(totalPurchases / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single Purchase details
export const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findOne({ _id: req.params.id, companyId: req.companyId })
                                   .populate("partyId", "name address gstNumber");
    if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });
    res.status(200).json({ success: true, purchase });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};