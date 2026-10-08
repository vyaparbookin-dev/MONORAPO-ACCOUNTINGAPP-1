import Quotation from '../model/quotation.js';

// Helper to generate next quotation number
const getNextQuotationNumber = async (companyId) => {
  const lastQuotation = await Quotation.findOne({ companyId }).sort({ createdAt: -1 });
  if (lastQuotation && lastQuotation.quotationNumber) {
    const lastNum = parseInt(lastQuotation.quotationNumber.split('-').pop());
    return `QUO-${lastNum + 1}`;
  }
  return 'QUO-1001';
};

export const createQuotation = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });

    const quotationNumber = req.body.quotationNumber || (await getNextQuotationNumber(companyId));

    const payload = { ...req.body, companyId, quotationNumber };
    if (!payload.partyId || String(payload.partyId).trim() === '') {
      delete payload.partyId;
    }
    if (!payload.customerName) {
      payload.customerName = payload.partyName || 'ग्राहक';
    }

    const quotation = new Quotation(payload);

    await quotation.save();
    res.status(201).json({ success: true, message: "Quotation created successfully", data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getQuotations = async (req, res) => {
  try {
    const { companyId } = req;
    const quotations = await Quotation.find({ companyId, isDeleted: false })
      .populate('partyId', 'name mobileNumber address')
      .populate('convertedBillId', 'billNumber invoiceNumber total')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: quotations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, companyId: req.companyId })
      .populate('partyId', 'name mobileNumber address')
      .populate('convertedBillId', 'billNumber invoiceNumber total');
    if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateQuotation = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (!updateData.partyId || String(updateData.partyId).trim() === '') {
      updateData.partyId = null;
    }
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId, isDeleted: false },
      updateData,
      { new: true }
    );
    if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
    res.status(200).json({ success: true, message: "Quotation updated successfully", data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateQuotationStatus = async (req, res) => {
  try {
    const { status, convertedBillId } = req.body;
    const updateFields = { status };
    if (convertedBillId) {
      updateFields.convertedBillId = convertedBillId;
    }
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      updateFields,
      { new: true }
    );
    if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
    res.status(200).json({ success: true, message: `Status updated to ${status}`, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isDeleted: true },
      { new: true }
    );
    if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
    res.status(200).json({ success: true, message: "Quotation deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};