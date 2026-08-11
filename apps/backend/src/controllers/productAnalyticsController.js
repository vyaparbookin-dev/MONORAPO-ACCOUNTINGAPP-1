import Product from '../model/product.js';
import Bill from '../model/bill.js';
import Purchase from '../model/purchase.js';
import mongoose from 'mongoose';

export const getProductAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req;

    const product = await Product.findOne({ _id: id, companyId }).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // 1. Sales trend for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const salesData = await Bill.aggregate([
      { $match: { companyId, isDeleted: false, date: { $gte: sixMonthsAgo } } },
      { $unwind: '$items' },
      { $match: { 'items.productId': new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          totalQuantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // 2. Purchase history
    const purchaseHistory = await Purchase.find({
      companyId,
      'items.productId': new mongoose.Types.ObjectId(id),
    })
    .populate('partyId', 'name')
    .sort({ date: -1 })
    .limit(5)
    .lean();

    // 3. Profitability & Days in stock (Simplified for example)
    const sales = await Bill.find({ companyId, 'items.productId': new mongoose.Types.ObjectId(id) }).lean();
    let totalProfit = 0;
    sales.forEach(bill => {
        const item = bill.items.find(i => i.productId.toString() === id);
        if(item) {
            const profit = (item.price - (product.costPrice || 0)) * item.quantity;
            totalProfit += profit;
        }
    });

    const firstPurchase = await Purchase.findOne({ companyId, 'items.productId': new mongoose.Types.ObjectId(id) }).sort({date: 1});
    const daysInStock = firstPurchase ? Math.floor((new Date() - new Date(firstPurchase.date)) / (1000 * 60 * 60 * 24)) : 0;


    res.json({
      success: true,
      analytics: {
        product,
        salesTrend: salesData,
        purchaseHistory,
        profitability: {
            totalProfit,
            margin: product.sellingPrice > 0 ? ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100 : 0
        },
        daysInStock
      },
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};