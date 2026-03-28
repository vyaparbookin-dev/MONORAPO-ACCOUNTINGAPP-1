import B2bDocument from "../model/b2bDocument.js";
import Product from "../model/product.js";
import Bill from "../model/bill.js";
import Party from "../model/party.js";
import PartyTransaction from "../model/PartyTransaction.js";

// Create a Quotation, Sales Order, or Delivery Challan
export const createDocument = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const { type, items } = req.body;

    const document = new B2bDocument({
      ...req.body,
      companyId
    });

    await document.save();

    // Agar Delivery Challan hai, toh maal dukan se nikal gaya, isliye stock kam karna hoga
    if (type === "delivery_challan") {
      for (const item of items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { currentStock: -item.quantity } // Reduce stock
          });
        }
      }
    }

    res.status(201).json({ success: true, message: `${type.replace('_', ' ').toUpperCase()} created successfully`, data: document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all B2B Documents
export const getDocuments = async (req, res) => {
  try {
    const { type } = req.query; // optional filter by type
    const filter = { companyId: req.companyId, isDeleted: false };
    if (type) filter.type = type;

    const documents = await B2bDocument.find(filter)
      .populate("partyId", "name mobileNumber gstNumber")
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Convert Document to Invoice (Bill)
export const convertToInvoice = async (req, res) => {
  try {
    const { companyId } = req;
    const { id } = req.params;

    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const document = await B2bDocument.findOne({ _id: id, companyId });
    if (!document) return res.status(404).json({ success: false, message: "Document not found" });
    if (document.status === "converted") return res.status(400).json({ success: false, message: "This document is already converted to a bill." });

    const party = await Party.findById(document.partyId);

    // 1. Create Final Bill
    const bill = new Bill({
      companyId,
      billNumber: `INV-${Date.now()}`, // Auto-generate bill number
      partyId: document.partyId,
      customerName: party ? party.name : "Unknown",
      customerMobile: party ? party.phone : "",
      items: document.items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.rate, // Bill model uses 'price' instead of 'rate'
        total: item.total
      })),
      totalAmount: document.totalAmount,
      finalAmount: document.finalAmount,
      status: "issued", // Credit (Udhar) by default
      date: new Date(),
      notes: `Converted from ${document.type.replace('_', ' ').toUpperCase()} #${document.documentNumber}`
    });

    await bill.save();

    // 2. Adjust Stock (Only if NOT Delivery Challan, because Challan already reduced stock)
    if (document.type !== "delivery_challan") {
      for (const item of document.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { currentStock: -item.quantity } });
        }
      }
    }

    // 3. Update Ledger (Increase Customer's Udhar)
    if (party) {
      party.currentBalance = (party.currentBalance || 0) + bill.finalAmount;
      await party.save();

      await PartyTransaction.create({ partyId: party._id, companyId, date: new Date(), details: `Bill #${bill.billNumber} (From ${document.documentNumber})`, debit: bill.finalAmount, credit: 0, type: 'bill' });
    }

    // 4. Mark Document as Converted
    document.status = "converted";
    await document.save();

    res.status(200).json({ success: true, message: "Successfully converted to Invoice!", bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};