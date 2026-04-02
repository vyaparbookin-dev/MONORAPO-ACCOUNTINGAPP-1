import Product from "../model/product.js";
import StockAdjustment from "../model/stockAdjustment.js";

export const addPurchaseEntry = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { items } = req.body;
    
    // Loop through purchased items and increase their current stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { currentStock: Number(item.quantity) }
      });
    }

    res.status(201).json({ success: true, message: "Purchase saved & stock updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addProduct = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const {
      name, category, costPrice, sellingPrice, unit, stock, currentStock
    } = req.body;

    // Validation
    if (!name || !category || !costPrice || !sellingPrice || !unit) { return res.status(400).json({ success: false, message: "Missing required fields: name, category, costPrice, sellingPrice, unit" }); }

    // Check if product already exists
    const existingProduct = await Product.findOne({ name, companyId: req.companyId });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product with this name already exists"
      });
    }

    const product = await Product.create({
      ...req.body,
      companyId: req.companyId,
      currentStock: Number(currentStock) || Number(stock) || 0,
    });

    res.status(201).json({ 
      success: true, 
      product,
      message: `Product created! SKU: ${product.sku}, Barcode: ${product.barcode}`
    });
  } catch (err) {
    if (err.code === 11000) {
        return res.status(400).json({ success: false, message: "A product with this SKU or Barcode already exists." });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// Excel Bulk Import Controller
export const bulkImportProducts = async (req, res) => {
  try {
    const { companyId } = req;
    const { products } = req.body; // Excel se mapped data yaha aayega array format me

    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: "No products provided for import" });
    }

    const formattedProducts = [];
    
    // Loop through each product from the Excel sheet
    for (let i = 0; i < products.length; i++) {
      const item = products[i];

      // Agar user ne Excel me SKU ya Barcode nahi diya, toh automatic generate karo
      const baseSku = item.sku || `SKU-${Date.now()}-${i}`;
      const baseBarcode = item.barcode || `BAR-${baseSku}`;

      // Mapping Logic (Backend me safely store karne ke liye format)
      formattedProducts.push({
        name: item.name || item.productName || "Unknown Product",
        companyId: companyId,
        category: item.category || "General",      // Excel column mapped to Category
        subCategory: item.subCategory || "",       // Excel column mapped to SubCategory
        hsnCode: item.hsnCode || "0000",
        sku: baseSku,
        barcode: baseBarcode,
        costPrice: Number(item.purchaseRate) || Number(item.costPrice) || 0,
        sellingPrice: Number(item.sellingPrice) || Number(item.mrp) || 0,
        mrp: Number(item.mrp) || 0,
        gstRate: Number(item.gstRate) || 0,
        unit: item.unit || "pcs",
        currentStock: Number(item.stock) || Number(item.quantity) || 0,
        minimumStock: Number(item.minimumStock) || 10,
        isActive: true
      });
    }

    // Ek baar me saare products Insert karna (Speed ke liye)
    // ordered: false lagane se agar 1 product duplicate (SKU error) hoga, tab bhi baaki upload ho jayenge
    const insertedProducts = await Product.insertMany(formattedProducts, { ordered: false });

    res.status(201).json({ success: true, message: `${insertedProducts.length} products imported successfully!`, data: insertedProducts });
  } catch (error) {
    console.error("🔴 Bulk Import Error:", error);
    if (error.name === 'BulkWriteError') {
       return res.status(207).json({ success: true, message: `Partial import successful. ${error.insertedDocs.length} products added. Some were skipped due to duplicate SKU/Barcode.`, errors: error.writeErrors });
    }
    res.status(500).json({ success: false, message: "Failed to import products", error: error.message });
  }
};

// --- Stock Adjustment Logic ---
export const adjustStock = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const { productId, type, quantity, reason, notes } = req.body;
    const product = await Product.findOne({ _id: productId, companyId });
    
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const qty = Math.abs(Number(quantity));
    if (type === 'reduction' && (product.currentStock || 0) < qty) {
      return res.status(400).json({ success: false, message: "Not enough stock to reduce." });
    }

    const adjustment = new StockAdjustment({ companyId, productId, type, quantity: qty, reason, notes });
    await adjustment.save();

    // Update actual stock
    const incValue = type === 'addition' ? qty : -qty;
    product.currentStock = (product.currentStock || 0) + incValue;
    await product.save();

    res.status(201).json({ success: true, message: "Stock adjusted successfully", product, adjustment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getStockAdjustments = async (req, res) => {
  try {
    const adjustments = await StockAdjustment.find({ companyId: req.companyId })
      .populate('productId', 'name sku currentStock unit')
      .sort({ date: -1 });
    res.status(200).json({ success: true, adjustments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listProducts = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const products = await Product.find({ isActive: true, companyId: req.companyId })
      .select('name category unit sellingPrice gstRate sku barcode currentStock hsnCode');
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const product = await Product.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStock = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { quantity } = req.body;
    if (quantity === undefined) {
      return res.status(400).json({ success: false, message: "Quantity required" });
    }
    
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { currentStock: quantity },
      { new: true }
    );
    
    res.json({ 
      success: true, 
      product,
      message: `Stock updated to ${quantity}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProductByBarcode = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const { barcode } = req.query;
    if (!barcode) {
      return res.status(400).json({ success: false, message: "Barcode is required" });
    }

    const product = await Product.findOne({ 
      barcode, 
      companyId: req.companyId,
      isActive: true 
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getInventorySummary = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    const products = await Product.find({ isActive: true, companyId: req.companyId });
    
    const totalProducts = products.length;
    const totalStock = products.reduce((acc, curr) => acc + (curr.currentStock || 0), 0);
    const lowStockItems = products.filter(p => (p.currentStock || 0) <= (p.minimumStock || 10)).length;
    const totalValue = products.reduce((acc, curr) => acc + ((curr.currentStock || 0) * (curr.costPrice || 0)), 0);

    res.json({ 
      success: true, 
      summary: {
        totalProducts,
        totalStock,
        lowStockItems,
        totalValue
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};