import Bill from "../model/bill.js";
import StockTransfer from "../model/stockTransfer.js";
import Expance from "../model/expance.js";

// Get all pending items (Maker-Checker Dashboard for Owner)
export const getPendingApprovals = async (req, res) => {
  try {
    const { companyId } = req;

    // 1. Fetch Draft/Pending Bills (Created by Cashier/Salesman)
    const pendingBills = await Bill.find({ 
        companyId, 
        status: 'draft', 
        isDeleted: false 
    }).populate('partyId', 'name').sort({ createdAt: -1 });

    // 2. Fetch Pending Stock Transfers (Created by Godown Staff)
    const pendingTransfers = await StockTransfer.find({ 
        companyId, 
        status: 'pending' 
    }).populate('fromBranchId toBranchId', 'name').sort({ createdAt: -1 });

    // 3. Fetch Pending Expenses (Claimed by Field Staff)
    const pendingExpenses = await Expance.find({ 
        companyId, 
        status: 'pending', 
        isDeleted: false 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        bills: pendingBills,
        stockTransfers: pendingTransfers,
        expenses: pendingExpenses,
        totalPending: pendingBills.length + pendingTransfers.length + pendingExpenses.length
      }
    });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// Update status of a pending item
export const updateApprovalStatus = async (req, res) => {
  try {
    const { companyId } = req;
    const { type, id, status } = req.body; // type: 'bill' | 'expense' | 'transfer', status: 'approved' | 'rejected'

    if (!type || !id || !status) return res.status(400).json({ success: false, message: "Missing required fields" });

    let updatedDoc;
    if (type === 'bill') {
      const targetStatus = status === 'approved' ? 'issued' : 'cancelled';
      updatedDoc = await Bill.findOneAndUpdate({ _id: id, companyId }, { status: targetStatus }, { new: true });
    } else if (type === 'expense') {
      const targetStatus = status === 'approved' ? 'approved' : 'rejected';
      updatedDoc = await Expance.findOneAndUpdate({ _id: id, companyId }, { status: targetStatus }, { new: true });
    } else if (type === 'transfer') {
      const targetStatus = status === 'approved' ? 'completed' : 'cancelled';
      updatedDoc = await StockTransfer.findOneAndUpdate({ _id: id, companyId }, { status: targetStatus }, { new: true });
    }

    res.json({ success: true, message: `${type} has been successfully ${status}`, data: updatedDoc });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};