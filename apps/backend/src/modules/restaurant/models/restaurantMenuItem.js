import mongoose from 'mongoose';

const restaurantMenuItemSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['food', 'beverage', 'dessert', 'combo'],
    default: 'food',
  },
  description: {
    type: String,
    trim: true,
  },
  costPrice: {
    type: Number,
    default: 0,
  },
  sellingPrice: {
    type: Number,
    default: 0,
  },
  stockQuantity: {
    type: Number,
    default: 0,
  },
  reorderLevel: {
    type: Number,
    default: 0,
  },
  servingType: {
    type: String,
    enum: ['dine_in', 'takeaway', 'delivery', 'all'],
    default: 'all',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active',
  },
  imageUrl: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

restaurantMenuItemSchema.index({ companyId: 1, name: 1 }, { unique: false });

export default mongoose.models.RestaurantMenuItem || mongoose.model("RestaurantMenuItem", restaurantMenuItemSchema);
