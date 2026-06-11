import Product from "../model/product.js";
import StockAdjustment from "../model/stockAdjustment.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { Parser } from "json2csv";
import Category from "../model/category.js";
import SubCategory from "../model/subCategory.js";
import Brand from "../model/brand.js";
import Unit from "../model/unit.js";

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

export const exportProductsCSV = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing." });
    }
    
    const products = await Product.find({ companyId: req.companyId, isActive: true }).sort({ createdAt: -1 });

    const fields = ['Name', 'SKU', 'Barcode', 'Category', 'Sub Category', 'Cost Price', 'Selling Price', 'Current Stock', 'Minimum Stock', 'Unit'];
    
    const csvData = products.map(p => ({
      'Name': p.name || 'Unknown',
      'SKU': p.sku || 'N/A',
      'Barcode': p.barcode || 'N/A',
      'Category': p.category || 'General',
      'Sub Category': p.subCategory || 'N/A',
      'Cost Price': p.costPrice || 0,
      'Selling Price': p.sellingPrice || 0,
      'Current Stock': p.currentStock || 0,
      'Minimum Stock': p.minimumStock || 0,
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

    // --- AUTO-CREATE MASTERS ---
    const compIdObj = new mongoose.Types.ObjectId(req.companyId);
    const upsertOpt = { upsert: true, setDefaultsOnInsert: true };
    if (category) await Category.updateOne({ companyId: compIdObj, name: category }, { $setOnInsert: { companyId: compIdObj, name: category, isActive: true } }, upsertOpt);
    if (subCategory) await SubCategory.updateOne({ companyId: compIdObj, name: subCategory }, { $setOnInsert: { companyId: compIdObj, name: subCategory, isActive: true } }, upsertOpt);
    if (req.body.brand) await Brand.updateOne({ companyId: compIdObj, name: req.body.brand }, { $setOnInsert: { companyId: compIdObj, name: req.body.brand, isActive: true } }, upsertOpt);
    if (unit) await Unit.updateOne({ companyId: compIdObj, name: unit }, { $setOnInsert: { companyId: compIdObj, name: unit, shortCode: String(unit).substring(0, 3).toUpperCase() } }, upsertOpt);

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

    const normalize = (val) => {
      if (val === null || val === undefined) return '';
      return String(val).trim();
    };

    const generateSku = () => `SKU-${crypto.randomUUID()}`;
    const generateBarcode = (sku) => `BAR-${sku}`;

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

      // 🚨 STRICT MANUAL MAPPING: No automatic guessing at all.
      // Sirf item.name (jo explicitly map hua ho ya raw exact match ho)
      const itemName = item.name;
      if (!itemName || String(itemName).trim() === "") continue;

      let baseSku = item.sku;
      if (!isPlaceholder(baseSku)) {
          baseSku = String(baseSku).trim();
      } else {
          baseSku = undefined;
      }

      let baseBarcode = item.barcode;
      if (!isPlaceholder(baseBarcode)) {
          baseBarcode = String(baseBarcode).trim();
      } else {
          baseBarcode = undefined;
      }

      const parsedItem = {
        name: String(itemName).trim(),
        companyId: companyId,
        sku: baseSku,
        barcode: baseBarcode,
        isActive: true,
        source: 'excel',
        importBatchId: batchId // Product ke andar save ho jayega ki ye kis excel sheet se aaya tha
      };

      // SIRF WAHI FIELDS ASSIGN KAREIN JO EXPLICITLY MAP HUI HAIN
      if (item.category !== undefined) parsedItem.category = String(item.category).trim();
      if (item.subCategory !== undefined) parsedItem.subCategory = String(item.subCategory).trim();
      if (item.brand !== undefined) parsedItem.brand = String(item.brand).trim();
      if (item.hsnCode !== undefined) parsedItem.hsnCode = String(item.hsnCode).trim();
      if (item.costPrice !== undefined) parsedItem.costPrice = parseNum(item.costPrice);
      if (item.costPriceWithTax !== undefined) parsedItem.costPriceWithTax = parseNum(item.costPriceWithTax);
      if (item.sellingPrice !== undefined) parsedItem.sellingPrice = parseNum(item.sellingPrice);
      if (item.sellingPriceWithTax !== undefined) parsedItem.sellingPriceWithTax = parseNum(item.sellingPriceWithTax);
      if (item.wholesalePrice !== undefined) parsedItem.wholesalePrice = parseNum(item.wholesalePrice);
      if (item.dealerPrice !== undefined) parsedItem.dealerPrice = parseNum(item.dealerPrice);
      if (item.p3Rate !== undefined) parsedItem.p3Rate = parseNum(item.p3Rate);
      if (item.discount !== undefined) parsedItem.discount = parseNum(item.discount);
      if (item.mrp !== undefined) parsedItem.mrp = parseNum(item.mrp);
      if (item.gstRate !== undefined) parsedItem.gstRate = parseNum(item.gstRate);
      if (item.unit !== undefined) parsedItem.unit = String(item.unit).trim();
      if (item.secondaryUnit !== undefined) parsedItem.secondaryUnit = String(item.secondaryUnit).trim();
      if (item.conversionRate !== undefined) parsedItem.conversionRate = parseNum(item.conversionRate);
      if (item.currentStock !== undefined) parsedItem.currentStock = parseNum(item.currentStock);
      if (item.minimumStock !== undefined) parsedItem.minimumStock = parseNum(item.minimumStock);
      if (item.maximumStock !== undefined) parsedItem.maximumStock = parseNum(item.maximumStock);

      formattedProducts.push(parsedItem);
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
        const gst = p.gstRate || 0;
        if (p.costPrice === undefined && p.costPriceWithTax !== undefined) {
            p.costPrice = +(p.costPriceWithTax / (1 + gst / 100)).toFixed(2);
        }
        if (p.sellingPrice === undefined && p.sellingPriceWithTax !== undefined) {
            p.sellingPrice = +(p.sellingPriceWithTax / (1 + gst / 100)).toFixed(2);
        }

        let isAutoSku = !p.sku;
        let isAutoBarcode = !p.barcode;

        if (isAutoSku) {
            p.sku = generateSku();
            isAutoSku = true;
        }
        if (isAutoBarcode) {
            p.barcode = generateBarcode(p.sku);
            isAutoBarcode = true;
        }

        let skuKey = p.sku.toLowerCase();
        let barcodeKey = p.barcode.toLowerCase();
        const nameKey = p.name.toLowerCase();

        // Agar galti se Excel me same Name do baar ho tab hi skip karega (Mongo rules)
        if (seenNames.has(nameKey)) continue;

        if (!isAutoSku && seenSkus.has(skuKey)) {
            p.sku = generateSku();
            skuKey = p.sku.toLowerCase();
            isAutoSku = true;
        }
        if (!isAutoBarcode && seenBarcodes.has(barcodeKey)) {
            p.barcode = generateBarcode(p.sku);
            barcodeKey = p.barcode.toLowerCase();
            isAutoBarcode = true;
        }

        seenNames.add(nameKey);
        if (!isAutoSku) seenSkus.add(skuKey);
        if (!isAutoBarcode) seenBarcodes.add(barcodeKey);

        validProducts.push({ ...p, isAutoGeneratedSku: isAutoSku, isAutoGeneratedBarcode: isAutoBarcode });
    }

    // --- AUTO-CREATE MASTERS FROM EXCEL (Categories, Brands, Units) ---
    const uniqueCategories = new Set();
    const uniqueSubCategories = new Set();
    const uniqueBrands = new Set();
    const uniqueUnits = new Set();

    validProducts.forEach(p => {
      if (p.category) uniqueCategories.add(p.category);
      if (p.subCategory) uniqueSubCategories.add(p.subCategory);
      if (p.brand) uniqueBrands.add(p.brand);
      if (p.unit) uniqueUnits.add(p.unit);
      if (p.secondaryUnit) uniqueUnits.add(p.secondaryUnit);
    });

    const companyObjectId = new mongoose.Types.ObjectId(companyId);

    const createBulkOps = (set, isUnit = false) => Array.from(set).map(name => ({
      updateOne: {
        filter: { companyId: companyObjectId, name },
        update: { $setOnInsert: { companyId: companyObjectId, name, ...(isUnit ? { shortCode: String(name).substring(0, 3).toUpperCase() } : { isActive: true }) } },
        upsert: true
      }
    }));

    try {
      if (uniqueCategories.size > 0) await Category.bulkWrite(createBulkOps(uniqueCategories), { ordered: false });
      if (uniqueSubCategories.size > 0) await SubCategory.bulkWrite(createBulkOps(uniqueSubCategories), { ordered: false });
      if (uniqueBrands.size > 0) await Brand.bulkWrite(createBulkOps(uniqueBrands), { ordered: false });
      if (uniqueUnits.size > 0) await Unit.bulkWrite(createBulkOps(uniqueUnits, true), { ordered: false });
      console.log("✅ Auto-created missing master categories/brands from Excel.");
    } catch (masterErr) {
      console.warn("⚠️ Non-fatal error creating masters:", masterErr.message);
    }

    // --- DATABASE EXACT MATCHING LOGIC (ID ke sath) ---
    const existingProducts = await Product.find({ companyId }).select('_id name sku barcode').lean();
    
    const nameMap = new Map();
    const skuMap = new Map();
    const barcodeMap = new Map();
    const existingSkuSet = new Set();
    const existingBarcodeSet = new Set();

    for (const p of existingProducts) {
        nameMap.set(p.name.toLowerCase(), p._id);
        if (p.sku) {
          const lowerSku = p.sku.toLowerCase();
          skuMap.set(lowerSku, p._id);
          existingSkuSet.add(lowerSku);
        }
        if (p.barcode) {
          const lowerBarcode = p.barcode.toLowerCase();
          barcodeMap.set(lowerBarcode, p._id);
          existingBarcodeSet.add(lowerBarcode);
        }
    }

    const validationErrors = [];
    const validatedProducts = [];

    for (const item of validProducts) {
      const skuKey = item.sku.toLowerCase();
      const barcodeKey = item.barcode.toLowerCase();
      const nameKey = item.name.toLowerCase();
      const isAutoGeneratedSku = item.isAutoGeneratedSku === true;
      const isAutoGeneratedBarcode = item.isAutoGeneratedBarcode === true;

      // SMART MATCHING LOGIC: Assign matchId to update existing products
      let matchId = null;
      if (!isAutoGeneratedSku && skuMap.has(skuKey)) {
        matchId = skuMap.get(skuKey);
      } else if (!isAutoGeneratedBarcode && barcodeMap.has(barcodeKey)) {
        matchId = barcodeMap.get(barcodeKey);
      } else if (nameMap.has(nameKey)) {
        matchId = nameMap.get(nameKey);
      }
      if (matchId) item.matchId = matchId;

      if (!isAutoGeneratedSku && skuMap.has(skuKey) && nameMap.has(nameKey) && skuMap.get(skuKey).toString() !== nameMap.get(nameKey).toString()) {
        validationErrors.push(`SKU ${item.sku} is already assigned to a different product than the given name ${item.name}.`);
      }

      if (!isAutoGeneratedBarcode && barcodeMap.has(barcodeKey) && nameMap.has(nameKey) && barcodeMap.get(barcodeKey).toString() !== nameMap.get(nameKey).toString()) {
        validationErrors.push(`Barcode ${item.barcode} is already assigned to a different product than the given name ${item.name}.`);
      }

      // If auto-generated SKU/Barcode should not collide with existing values
      if (isAutoGeneratedSku) {
        let newSku = item.sku;
        while (seenSkus.has(newSku.toLowerCase()) || existingSkuSet.has(newSku.toLowerCase())) {
          newSku = generateSku();
        }
        item.sku = newSku;
        seenSkus.add(item.sku.toLowerCase());
      }

      if (isAutoGeneratedBarcode) {
        let newBarcode = item.barcode;
        let counter = 1;
        while (seenBarcodes.has(newBarcode.toLowerCase()) || existingBarcodeSet.has(newBarcode.toLowerCase())) {
          newBarcode = `BAR-${item.sku}-${counter++}`;
        }
        item.barcode = newBarcode;
        seenBarcodes.add(item.barcode.toLowerCase());
      }

      validatedProducts.push(item);
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: "Duplicate or inconsistent product identifiers detected.", errors: validationErrors });
    }

    const bulkOps = validatedProducts.map(item => {
      const { sku, barcode, matchId, ...updateFields } = item;
      const isAutoGeneratedSku = item.isAutoGeneratedSku === true;
      const isAutoGeneratedBarcode = item.isAutoGeneratedBarcode === true;

      // Make sure companyId is properly formatted as ObjectId for DB operations
      const safeCompanyId = new mongoose.Types.ObjectId(item.companyId);
      updateFields.companyId = safeCompanyId;

      if (matchId) {
        return {
          updateOne: {
            filter: { _id: matchId }, // Use only _id to guarantee match and prevent casting issues
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
        // Naye product ke liye zaroori required defaults (kyunki mapping strictly empty aati hai)
        const newProduct = {
            ...item,
            companyId: safeCompanyId,
            category: item.category || "General",
            costPrice: item.costPrice || 0,
            sellingPrice: item.sellingPrice || 0,
            unit: item.unit || "pcs",
            currentStock: item.currentStock || 0
        };
        return { insertOne: { document: newProduct } };
      }
    });

    // Database me ek sath changes push karna
    console.log(`🚀 [DEBUG BULK IMPORT] Executing DB bulkWrite with ${bulkOps.length} operations...`);
    const result = await Product.bulkWrite(bulkOps, { ordered: false });

    // Handle different MongoDB driver version result formats
    const finalInserted = result.insertedCount ?? result.nInserted ?? 0;
    const finalUpdated = result.modifiedCount ?? result.nModified ?? 0;
    const finalMatched = result.matchedCount ?? result.nMatched ?? 0;
    const finalUpserted = result.upsertedCount ?? result.nUpserted ?? 0;

    console.log(`✅ [DEBUG BULK IMPORT] DB Operation Success! Inserted: ${finalInserted}, Updated: ${finalUpdated}, Matched: ${finalMatched}`);

    res.status(200).json({ 
      success: true, 
      message: `Import complete! ${finalInserted || finalUpserted || 0} new products added, ${finalUpdated || 0} products updated (out of ${finalMatched || 0} exact matches found).`
    });
  } catch (error) {
    console.error("🔴 Bulk Import Error Details:", JSON.stringify(error, null, 2));
    console.error(error);
    
    let errorMessage = "Failed to import products. Check your Excel mapping.";
    let detailedErrors = [];

    // Parse Mongoose BulkWrite errors directly into array
    if (error.name === 'BulkWriteError' || error.writeErrors) {
        errorMessage = "Import rejected: Database duplicate entries found in your file.";
        const wErrors = error.writeErrors || [];
        detailedErrors = wErrors.map(err => {
            if (err.code === 11000) {
                const dupKey = err.err.keyValue ? JSON.stringify(err.err.keyValue) : '';
                return `Row/Item Rejected: Duplicate entry found for ${dupKey}. Ensure this SKU or Barcode doesn't belong to a DIFFERENT item name.`;
            }
            return `Row/Item Rejected: ${err.errmsg}`;
        });
    } else if (error.code === 11000) {
        errorMessage = `Duplicate Entry Error: System rejected the file because of overlapping unique keys (SKU/Barcode).`;
        detailedErrors.push(error.message);
    } else if (error.errors) {
        errorMessage = "Validation failed for some items.";
        detailedErrors = Object.values(error.errors).map(e => e.message);
    }
    return res.status(400).json({ success: false, message: errorMessage, error: error.message, errors: detailedErrors });
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

// --- SYNC MASTERS FROM PRODUCTS (Fix for missing Categories/Brands in Settings) ---
export const syncMastersFromProducts = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });

    // 1. Get all unique values directly from existing Products
    const uniqueCategories = await Product.distinct("category", { companyId });
    const uniqueSubCategories = await Product.distinct("subCategory", { companyId });
    const uniqueBrands = await Product.distinct("brand", { companyId });
    const uniqueUnits = await Product.distinct("unit", { companyId });

    const companyObjectId = new mongoose.Types.ObjectId(companyId);

    // 2. Create bulk operations to insert missing masters safely
    const createBulkOps = (items, isUnit = false) => 
      items.filter(Boolean).map(name => ({
        updateOne: {
          filter: { companyId: companyObjectId, name },
          update: { 
            $setOnInsert: { 
              companyId: companyObjectId, 
              name, 
              ...(isUnit ? { shortCode: String(name).substring(0, 3).toUpperCase() } : { isActive: true }) 
            } 
          },
          upsert: true
        }
      }));

    // 3. Execute Database Updates
    let stats = { categories: 0, subCategories: 0, brands: 0, units: 0 };

    if (uniqueCategories.length > 0) { const resCat = await Category.bulkWrite(createBulkOps(uniqueCategories), { ordered: false }); stats.categories = resCat.upsertedCount || 0; }
    if (uniqueSubCategories.length > 0) { const resSub = await SubCategory.bulkWrite(createBulkOps(uniqueSubCategories), { ordered: false }); stats.subCategories = resSub.upsertedCount || 0; }
    if (uniqueBrands.length > 0) { const resBrand = await Brand.bulkWrite(createBulkOps(uniqueBrands), { ordered: false }); stats.brands = resBrand.upsertedCount || 0; }
    if (uniqueUnits.length > 0) { const resUnit = await Unit.bulkWrite(createBulkOps(uniqueUnits, true), { ordered: false }); stats.units = resUnit.upsertedCount || 0; }

    res.json({ success: true, message: "Masters synced successfully from products!", stats });
  } catch (error) {
    console.error("Sync Masters Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};