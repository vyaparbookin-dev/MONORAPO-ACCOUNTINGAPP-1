import Return from "../model/return.js";
import Product from "../model/product.js";
import Party from "../model/party.js";
import PartyTransaction from "../model/PartyTransaction.js";

export const createReturn = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const { type, partyId, items, totalAmount, reason } = req.body;

    // 1. Create Return Entry
    const returnEntry = new Return({
      ...req.body,
      companyId
    });
    await returnEntry.save();

    // 2. Adjust Stock & Ledger based on Return Type
    for (const item of items) {
      if (item.productId) {
        const stockChange = type === "sales_return" ? item.quantity : -item.quantity;
        // Sales Return: Maal wapas aaya (+ stock). Purchase Return: Maal wapas bheja (- stock).
        await Product.findByIdAndUpdate(item.productId, { $inc: { currentStock: stockChange } });
      }
    }

    // Party Ledger Update
    if (partyId) {
      const balanceChange = type === "sales_return" ? -totalAmount : -totalAmount;
      // Agar customer ne maal wapas kiya, toh uska udhar kam hoga (-)
      // Agar humne supplier ko wapas kiya, toh humara dena kam hoga (-)
      
      await Party.findByIdAndUpdate(partyId, { $inc: { currentBalance: balanceChange } });

      // Add Ledger Transaction
      await PartyTransaction.create({
        partyId,
        companyId,
        date: req.body.date || new Date(),
        details: `${type === "sales_return" ? "Sales Return" : "Purchase Return"} #${returnEntry.returnNumber} ${reason ? `- ${reason}` : ''}`,
        debit: type === "purchase_return" ? totalAmount : 0, // Humara udhar kam hua toh debit
        credit: type === "sales_return" ? totalAmount : 0,   // Customer ka udhar kam hua toh credit
        type: 'manual' // ya 'return' bhi use kar sakte hain
      });
    }

    res.status(201).json({ success: true, message: "Return processed & stock adjusted successfully", data: returnEntry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getReturns = async (req, res) => {
  try {
    const returns = await Return.find({ companyId: req.companyId, isDeleted: false })
                                .populate("partyId", "name")
                                .sort({ date: -1 });
    res.status(200).json({ success: true, returns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};