import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  description: String,
  site: String,
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  
  // Category & Classification
  category: { type: String, required: true }, // Electronics, Textiles, etc.
  subCategory: String,
  hsnCode: { type: String, required: true }, // HSN Code for GST
  image: { type: String }, // Base64 compressed image
  
  // Codes & Identifiers
  sku: { type: String }, // Auto-generated
  barcode: { type: String }, // Auto-generated
  
  // Pricing
  costPrice: { type: Number, required: true }, // Cost to you
  sellingPrice: { type: Number, required: true }, // Sell price
  wholesalePrice: { type: Number, default: 0 }, // Wholesale Rate
  dealerPrice: { type: Number, default: 0 },
  mrp: Number, // Maximum Retail Price
  
  // Tax & GST
  gstRate: { type: Number, default: 0 }, // 0%, 5%, 12%, 18%, 28%
  gstType: { type: String, enum: ["CGST", "SGST", "IGST"], default: "CGST" },
  
  // Units & Quantity
  unit: { type: String, required: true }, // kg, ltr, pcs, ft, mtr, etc.
  minimumStock: { type: Number, default: 10 },
  maximumStock: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  stockLocations: [{
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    quantity: { type: Number, default: 0 }
  }],
  
  // For Restaurants / Manufacturing (Recipe & Raw Materials)
  isRawMaterial: { type: Boolean, default: false }, // True if this is a raw material like 'Flour', 'Sugar', 'Fabric'
  recipe: [{ // Bill of Materials (BOM) - Ek dish banane me kya kya use hota hai
    rawMaterialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true }, // Kitni quantity lagegi
    unit: String
  }],
  productionCost: { type: Number, default: 0 }, // Per dish cost (raw materials se calculate hoke yahan aayegi)

  // For Jewellery Business
  weight: { type: Number }, // Weight in grams or mg
  purity: { type: String }, // e.g., '22K', '24K', '925 Silver'
  makingChargeType: { type: String, enum: ['per_gram', 'fixed', 'percentage'], default: 'fixed' },
  makingCharge: { type: Number, default: 0 },

  // For Hardware / Builders
  brand: String,
  dimensions: String, // e.g., '8x4 ft', '12mm'

  // For Science & Sports
  materialType: String, // e.g., 'Borosilicate Glass', 'Leather'
  ageGroup: String, // e.g., 'U-14', 'Adults' (for sports)
  certification: String, // e.g., 'ISO 9001', 'ISI'
  warrantyPeriod: String, // e.g., '6 Months', '1 Year'

  // Tracking
  supplier: String,
  reorderQuantity: Number,
  
  // Metadata
  isActive: { type: Boolean, default: true },
  synced: { type: Boolean, default: false },

  // Flexible fields for different business types
  customFields: { type: Map, of: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { strict: false }); // 🚀 strict: false makes the schema 100% dynamic! Any new field from frontend will auto-save.

// Compound indexes to ensure uniqueness per company
productSchema.index({ companyId: 1, name: 1 }, { unique: true });
productSchema.index({ companyId: 1, sku: 1 }, { unique: true });
productSchema.index({ companyId: 1, barcode: 1 }, { unique: true });

// Auto-generate SKU if not provided
productSchema.pre("save", async function (next) {
  if (!this.sku) {
    const count = await mongoose.model("Product").countDocuments({ companyId: this.companyId });
    this.sku = `SKU-${Date.now()}-${count}`;
  }
  
  if (!this.barcode) {
    this.barcode = `BAR-${this.sku}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Product", productSchema);