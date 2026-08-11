import PurchaseOrder from '../model/PurchaseOrder.js';
import { asyncHandler } from '../middleware/errormiddleware.js';

/**
 * @desc    Create a new purchase order
 * @route   POST /api/purchase-orders
 * @access  Private
 */
export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const { supplierId, orderDate, items, notes } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'PO must have at least one item' });
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const purchaseOrder = new PurchaseOrder({
    companyId: req.companyId,
    supplierId,
    orderDate,
    items,
    totalAmount,
    notes,
    status: 'Pending',
  });

  const createdOrder = await purchaseOrder.save();
  res.status(201).json({ success: true, data: createdOrder });
});

/**
 * @desc    Get all purchase orders
 * @route   GET /api/purchase-orders
 * @access  Private
 */
export const getPurchaseOrders = asyncHandler(async (req, res) => {
  const purchaseOrders = await PurchaseOrder.find({ companyId: req.companyId }).sort({ orderDate: -1 });
  res.json({ success: true, data: purchaseOrders });
});