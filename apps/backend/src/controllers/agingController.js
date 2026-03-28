import Bill from "../model/bill.js";

export const getAgingReport = async (req, res) => {
  try {
    const { companyId } = req;
    const today = new Date();

    // Find all bills that are on credit (issued) or partially paid
    const bills = await Bill.find({
      companyId,
      status: { $in: ['issued', 'partial', 'draft'] }, // Considering these might have pending amounts
      isDeleted: false
    }).populate('partyId', 'name mobileNumber');

    const agingData = {};

    bills.forEach(bill => {
      if (!bill.partyId) return; // Skip retail bills (no customer linked)

      const partyId = bill.partyId._id.toString();
      if (!agingData[partyId]) {
        agingData[partyId] = {
          partyId: partyId,
          partyName: bill.partyId.name,
          mobileNumber: bill.partyId.mobileNumber,
          totalPending: 0,
          '0_30': 0,
          '31_60': 0,
          '61_90': 0,
          '90_plus': 0,
        };
      }

      const total = bill.total || bill.finalAmount || 0;
      const paid = bill.amountPaid || bill.receivedAmount || 0;
      const pendingAmount = total - paid;

      if (pendingAmount <= 0) return;

      const billDate = new Date(bill.date || bill.createdAt);
      const diffDays = Math.ceil(Math.abs(today - billDate) / (1000 * 60 * 60 * 24));

      agingData[partyId].totalPending += pendingAmount;
      if (diffDays <= 30) agingData[partyId]['0_30'] += pendingAmount;
      else if (diffDays <= 60) agingData[partyId]['31_60'] += pendingAmount;
      else if (diffDays <= 90) agingData[partyId]['61_90'] += pendingAmount;
      else agingData[partyId]['90_plus'] += pendingAmount;
    });

    res.json({ success: true, data: Object.values(agingData) });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};