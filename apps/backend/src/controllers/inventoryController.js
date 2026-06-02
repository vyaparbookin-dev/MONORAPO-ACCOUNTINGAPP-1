import Product from "../model/product.js";
import StockAdjustment from "../model/stockAdjustment.js";
import mongoose from "mongoose";
import { Parser } from "json2csv";

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
      name, category, subCategory, costPrice, sellingPrice, unit, stock, currentStock
    } = req.body;

    // Validation
    if (!name) { return res.status(400).json({ success: false, message: "Product name is required" }); }

    // Check if product already exists (Smart detection based on Name + Category + SubCategory)
    const existingProduct = await Product.findOne({ 
      name, 
      category: category || "General", 
      subCategory: subCategory || "", 
      companyId: req.companyId 
    });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product with this name already exists"
      });
    }

    const product = await Product.create({
      ...req.body,
      category: category || "General",
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      unit: unit || "pcs",
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

export const exportProductsCSV = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing." });
    }
    
    const products = await Product.find({ companyId: req.companyId, isActive: true }).sort({ createdAt: -1 });

    const fields = ['Name', 'Category', 'Sub Category', 'Brand', 'SKU', 'Barcode', 'Cost Price', 'Selling Price', 'Current Stock', 'Unit'];
    
    const csvData = products.map(p => ({
      'Name': p.name || 'N/A',
      'Category': p.category || 'N/A',
      'Sub Category': p.subCategory || 'N/A',
      'Brand': p.brand || 'N/A',
      'SKU': p.sku || 'N/A',
      'Barcode': p.barcode || 'N/A',
      'Cost Price': p.costPrice || 0,
      'Selling Price': p.sellingPrice || 0,
      'Current Stock': p.currentStock || 0,
      'Unit': p.unit || 'pcs'
    }));

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.attachment(`Products_Export_${Date.now()}.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Excel Bulk Import Controller
export const bulkImportProducts = async (req, res) => {
  try {
    const { companyId } = req;
    const { products, mapping, startRow } = req.body; // 'startRow' add kiya taaki Marg jese A,B,C map karte waqt Header skip ho sake

    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: "No products provided for import" });
    }

    const batchId = `IMP-${Date.now()}`; // Har Excel upload ko ek naya Batch ID milega

    const formattedProducts = [];
    
    // Marg ERP jesa system: User batayega data kis row se start hai (Default 0).
    // Agar Excel me pehli line (Row 1) headers hain ('Product Name', 'Price'), toh startRow 1 bhejenge taaki wo skip ho jaye.
    const startIndex = startRow !== undefined ? Number(startRow) : 0;

    // Safe number parser: Commas, spaces aur currency symbols ko hatayega
    // Lekin agar column me string/text hai toh zabardasti number nahi nikalega
    const parseNum = (val) => {
      if (val === null || val === undefined || val === '') return 0;
      if (typeof val === 'number') return val;
      const cleaned = String(val).replace(/[^\d.-]/g, ''); // Extract only exact numbers/decimals
      const num = Number(cleaned);
      return isNaN(num) ? 0 : num;
    };

    // Helper: Marg/Tally me khali fields me '-', 'NA', 'N/A' aata hai, jisko handle karna zaroori hai
    const isPlaceholder = (val) => {
        if (!val) return true;
        const str = String(val).trim().toLowerCase();
        return str === "" || str === "-" || str === "na" || str === "n/a" || str === "null" || str === "none";
    };

    // Loop through each product from the Excel sheet
    for (let i = startIndex; i < products.length; i++) {
      const rawItem = products[i];
      const item = {};

      // Agar Tally/Marg jesa mapping configuration aaya hai, toh Excel headers ko DB fields se map karein
      if (mapping && Object.keys(mapping).length > 0) {
        for (const [dbField, excelColumnName] of Object.entries(mapping)) {
          item[dbField] = rawItem[excelColumnName];
        }
      } else {
        Object.assign(item, rawItem); // Fallback: agar frontend ne bina mapping already match karke bheja hai
      }

      // Agar data me 'name' ya 'item name' dono hi nahi hain (completely empty/invalid row), toh use skip karein
      const itemName = item.name || item['item name'] || item.productName || item['Product Name'];
      if (!itemName || String(itemName).trim() === "") continue;

      // Excel mapping edge cases (Capital letters, spaces, placeholders) handle karne ke liye
      let baseSku = item.sku || item['item-code'] || item.itemCode || item.ItemCode || item['Item Code'];
      if (!isPlaceholder(baseSku)) {
          baseSku = String(baseSku).trim();
      } else {
          baseSku = `SKU-${Date.now()}-${i}`;
      }

      let baseBarcode = item.barcode || item.barcodeNo || item.Barcode || item['Barcode'];
      if (!isPlaceholder(baseBarcode)) {
          baseBarcode = String(baseBarcode).trim();
      } else {
          baseBarcode = `BAR-${baseSku}`;
      }

      // Mapping Logic (Backend me safely store karne ke liye format)
      formattedProducts.push({
        name: String(itemName).trim(),
        companyId: companyId,
        category: String(item.category || item.group || "General").trim(),
        subCategory: String(item.subCategory || "").trim(),
        brand: String(item.brand || "").trim(), // Smart catching removed, will only take strictly mapped brand
        hsnCode: String(item.hsnCode || "0000").trim(),
        sku: baseSku,
        barcode: baseBarcode,
        costPrice: parseNum(item.costPrice || item.purchaseRate || item['purchase cost']),
        sellingPrice: parseNum(item.sellingPrice || item.rate1 || item['rate 1'] || item['rate a']),
        wholesalePrice: parseNum(item.wholesalePrice || item.rate2 || item['rate 2'] || item['rate b']),
        dealerPrice: parseNum(item.dealerPrice || item.rate3 || item['rate 3'] || item['rate c']),
        p3Rate: parseNum(item.p3Rate || item.p3 || item.rate4 || item['rate 4'] || item['rate d']),
        discount: parseNum(item.discount || item.disc),
        mrp: parseNum(item.mrp || item.maximumRetailPrice),
        gstRate: parseNum(item.gstRate || item.gst || item.tax),
        unit: String(item.unit || "pcs").trim(),
        secondaryUnit: String(item.secondaryUnit || item['unit-2'] || "").trim(),
        conversionRate: parseNum(item.conversionRate || item['conversionunit -1']),
        currentStock: parseNum(item.currentStock || item['opening stock'] || item.stock || item.quantity),
        minimumStock: parseNum(item.minimumStock || item.miniqua || item['min stock'] || 10),
        maximumStock: parseNum(item.maximumStock || item['max.qua'] || item['max stock'] || 0),
        isActive: true,
        source: 'excel',
        importBatchId: batchId // Product ke andar save ho jayega ki ye kis excel sheet se aaya tha
      });
    }

    if (formattedProducts.length === 0) {
      return res.status(400).json({ success: false, message: "No valid product data found. Please check your Excel mapping." });
    }

    // --- SMART DEDUPLICATION & VALIDATION (Excel Sheet ke andar) ---
    const validProducts = [];
    const seenNames = new Set();
    const seenSkus = new Set();
    const seenBarcodes = new Set();

    for (const p of formattedProducts) {
        let isAutoSku = p.sku.startsWith('SKU-');
        let isAutoBarcode = p.barcode.startsWith('BAR-');
        
        let skuKey = p.sku.toLowerCase();
        let barcodeKey = p.barcode.toLowerCase();
        const nameKey = p.name.toLowerCase();

        // Agar galti se Excel me same Name do baar ho tab hi skip karega (Mongo rules)
        if (seenNames.has(nameKey)) continue;

        // Sabse Badi Fix: Agar user ne galat/duplicate SKU map kar diya hai, toh product DROP nahi karna hai!
        // Usko ek auto-SKU de dena hai taaki wo bina error ke database me successfully save ho jaye.
        if (!isAutoSku && seenSkus.has(skuKey)) {
            p.sku = `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            skuKey = p.sku.toLowerCase();
            isAutoSku = true;
        }
        if (!isAutoBarcode && seenBarcodes.has(barcodeKey)) {
            p.barcode = `BAR-${p.sku}`;
            barcodeKey = p.barcode.toLowerCase();
            isAutoBarcode = true;
        }

        seenNames.add(nameKey);
        if (!isAutoSku) seenSkus.add(skuKey);
        if (!isAutoBarcode) seenBarcodes.add(barcodeKey);

        validProducts.push(p);
    }

    // --- DATABASE EXACT MATCHING LOGIC (ID ke sath) ---
    const existingProducts = await Product.find({ companyId }).select('_id name sku barcode').lean();
    
    const nameMap = new Map();
    const skuMap = new Map();
    const barcodeMap = new Map();
    
    for (const p of existingProducts) {
        nameMap.set(p.name.toLowerCase(), p._id);
        if (p.sku) skuMap.set(p.sku.toLowerCase(), p._id);
        if (p.barcode) barcodeMap.set(p.barcode.toLowerCase(), p._id);
    }

    const bulkOps = validProducts.map(item => {
      const { sku, barcode, ...updateFields } = item;
      const isAutoGeneratedSku = item.sku.startsWith('SKU-');
      const isAutoGeneratedBarcode = item.barcode.startsWith('BAR-');

      let matchId = null;
      if (!isAutoGeneratedSku && skuMap.has(item.sku.toLowerCase())) {
          matchId = skuMap.get(item.sku.toLowerCase());
      } else if (!isAutoGeneratedBarcode && barcodeMap.has(item.barcode.toLowerCase())) {
          matchId = barcodeMap.get(item.barcode.toLowerCase());
      } else if (nameMap.has(item.name.toLowerCase())) {
          matchId = nameMap.get(item.name.toLowerCase());
      }

      if (matchId) {
        return {
          updateOne: {
            filter: { _id: matchId, companyId: item.companyId },
            update: { 
                $set: { 
                    ...updateFields,
                    ...( !isAutoGeneratedSku && { sku: item.sku } ),
                    ...( !isAutoGeneratedBarcode && { barcode: item.barcode } )
                } 
            }
          }
        };
      } else {
        return { insertOne: { document: item } };
      }
    });

    // Database me ek sath changes push karna
    const result = await Product.bulkWrite(bulkOps, { ordered: false });

    res.status(200).json({ 
      success: true, 
      message: `Import complete! ${result.insertedCount || result.upsertedCount || 0} new products added, ${result.modifiedCount || 0} products updated.` 
    });
  } catch (error) {
    console.error("🔴 Bulk Import Error:", error);
    
    let errorMessage = "Failed to import products. Check your Excel mapping.";
    if (error.code === 11000) {
        let duplicateKey = "an identifier";
        if (error.message.includes("sku_1")) duplicateKey = "SKU / Item Code";
        else if (error.message.includes("barcode_1")) duplicateKey = "Barcode";
        else if (error.message.includes("name_1")) duplicateKey = "Product Name";
        
        errorMessage = `Duplicate Entry Error: The Excel file contains a ${duplicateKey} that is already assigned to a DIFFERENT product in the system.`;
    }

    return res.status(400).json({ success: false, message: errorMessage, error: error.message });
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

// --- FETCH EXCEL IMPORT BATCHES (For Settings Page) ---
export const getImportBatches = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });
    const batches = await Product.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(req.companyId), source: 'excel', importBatchId: { $exists: true } } },
      { $group: { 
          _id: "$importBatchId", 
          itemCount: { $sum: 1 }, 
          uploadDate: { $first: "$createdAt" } 
      }},
      { $sort: { uploadDate: -1 } }
    ]);
    res.json({ success: true, batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- REAL BULK DELETE (Batch / Imported Data) ---
export const bulkDeleteProducts = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });

    const { productIds, deleteAll, deleteInactiveOnly, deleteImportedOnly, batchId } = req.body;

    let result;
    if (deleteAll === true) {
      result = await Product.deleteMany({ companyId: req.companyId });
    } else if (deleteInactiveOnly === true) {
      result = await Product.deleteMany({ companyId: req.companyId, isActive: false });
    } else if (deleteImportedOnly === true) {
      result = await Product.deleteMany({ companyId: req.companyId, source: 'excel' });
    } else if (batchId) {
      result = await Product.deleteMany({ companyId: req.companyId, importBatchId: batchId });
    } else if (Array.isArray(productIds) && productIds.length > 0) {
      result = await Product.deleteMany({ _id: { $in: productIds }, companyId: req.companyId });
    } else {
      return res.status(400).json({ success: false, message: "Provide valid delete parameters" });
    }

    res.json({ success: true, message: `Successfully deleted ${result?.deletedCount || 0} products.` });
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

    // Removed .select() so the frontend receives all fields (subCategory, costPrice, margins, etc.) for Editing
    const products = await Product.find({ isActive: true, companyId: req.companyId }).sort({ createdAt: -1 });
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

    const productId = req.params.id;

    // 🚀 SMART DELETE LOGIC (Hard Delete vs Soft Delete)
    // TODO: Jab Invoices/Bills ka backend banega, yahan check lagana hoga:
    // const isUsedInBills = await Bill.exists({ "items.productId": productId });
    const isUsedInBills = false; // Abhi ke liye 'false' maan rahe hain (Hard delete allowed)

    if (isUsedInBills) {
      // SOFT DELETE: Product hide hoga, par SKU same rahega taaki Excel se wapas merge (restore) ho sake
      const product = await Product.findOneAndUpdate(
        { _id: productId, companyId: req.companyId },
        { isActive: false },
        { new: true }
      );
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });
      return res.json({ success: true, message: "Product is linked to bills. Soft-deleted safely." });
    } else {
      // HARD DELETE: Koi bill nahi bana, toh DB se permanently saaf
      const product = await Product.findOneAndDelete({ _id: productId, companyId: req.companyId });
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });
      return res.json({ success: true, message: "Unused product permanently deleted." });
    }
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