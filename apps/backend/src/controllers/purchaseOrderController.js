import PurchaseOrder from "../model/purchaseOrder.js";
import { logActivity } from "../utils/logger.js";

// Create a new Purchase Order (No stock update yet)
export const createPurchaseOrder = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const order = new PurchaseOrder({ ...req.body, companyId });
    await order.save();

    await logActivity(req, `Created Purchase Order #${order.orderNumber} for amount ₹${order.finalAmount}`);

    res.status(201).json({ success: true, message: "Purchase Order created successfully!", order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all Purchase Orders
export const getPurchaseOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find({ companyId: req.companyId, isDeleted: false })
      .populate("partyId", "name mobileNumber")
      .sort({ date: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Order Status (e.g., from 'pending' to 'completed' or 'cancelled')
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'pending', 'completed', 'cancelled'

    const order = await PurchaseOrder.findOneAndUpdate(
      { _id: id, companyId: req.companyId },
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: "Purchase Order not found" });

    await logActivity(req, `Changed Purchase Order #${order.orderNumber} status to ${status.toUpperCase()}`);

    res.status(200).json({ success: true, message: `Order status updated to ${status}`, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};