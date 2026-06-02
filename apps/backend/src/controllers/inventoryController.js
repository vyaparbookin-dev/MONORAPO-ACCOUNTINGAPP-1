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

// Excel Bulk Import Controller
export const bulkImportProducts = async (req, res) => {
  try {
    const { companyId } = req;
    const { products, mapping, startRow } = req.body; // 'startRow' add kiya taaki Marg jese A,B,C map karte waqt Header skip ho sake

    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: "No products provided for import" });
    }

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

    const hasMapping = mapping && Object.keys(mapping).length > 0;

    // Loop through each product from the Excel sheet
    for (let i = startIndex; i < products.length; i++) {
      const rawItem = products[i];
      const item = {};

      // A, B, C, D Strict Mapping (Agar frontend se send ki gayi hai)
      if (hasMapping) {
        for (const [dbField, excelColumnName] of Object.entries(mapping)) {
          // Cell ka pura data strictly uthayega
          item[dbField] = rawItem[excelColumnName];
        }
      } else {
        // Fallback: Agar mapping disable hai, toh old auto-detect chalega
        Object.assign(item, rawItem); 
      }

      // Agar mapped data me name nahi hai (khali row hai), toh use skip karein
      const itemName = hasMapping ? item.name : (item.name || item['item name'] || item.productName || item['Product Name']);
      if (!itemName || String(itemName).trim() === "") continue;

      let baseSku = hasMapping ? item.sku : (item.sku || item['item-code'] || item.itemCode || item.ItemCode || item['Item Code']);
      if (!isPlaceholder(baseSku)) {
          baseSku = String(baseSku).trim();
      } else {
          baseSku = `SKU-${Date.now()}-${i}`;
      }

      let baseBarcode = hasMapping ? item.barcode : (item.barcode || item.barcodeNo || item.Barcode || item['Barcode']);
      if (!isPlaceholder(baseBarcode)) {
          baseBarcode = String(baseBarcode).trim();
      } else {
          baseBarcode = `BAR-${baseSku}`;
      }

      // Mapping Logic (Strict Mode vs Auto-detect Fallback)
      formattedProducts.push({
        name: String(itemName).trim(),
        description: item.description ? String(item.description).trim() : undefined,
        companyId: companyId,
        category: String(item.category || (!hasMapping ? item.group : null) || "General").trim(),
        subCategory: String(item.subCategory || "").trim(),
        brand: String(item.brand || "").trim(), 
        hsnCode: String(item.hsnCode || "0000").trim(),
        sku: baseSku,
        barcode: baseBarcode,
        supplier: item.supplier ? String(item.supplier).trim() : undefined,
        costPrice: parseNum(item.costPrice || (!hasMapping ? (item.purchaseRate || item['purchase cost']) : null)),
        sellingPrice: parseNum(item.sellingPrice || (!hasMapping ? (item.rate1 || item['rate 1'] || item['rate a']) : null)),
        wholesalePrice: parseNum(item.wholesalePrice || (!hasMapping ? (item.rate2 || item['rate 2'] || item['rate b']) : null)),
        dealerPrice: parseNum(item.dealerPrice || (!hasMapping ? (item.rate3 || item['rate 3'] || item['rate c']) : null)),
        p3Rate: parseNum(item.p3Rate || (!hasMapping ? (item.p3 || item.rate4 || item['rate 4'] || item['rate d']) : null)),
        discount: parseNum(item.discount || (!hasMapping ? item.disc : null)),
        mrp: parseNum(item.mrp || (!hasMapping ? item.maximumRetailPrice : null)),
        gstRate: parseNum(item.gstRate || (!hasMapping ? (item.gst || item.tax) : null)),
        unit: String(item.unit || "pcs").trim(),
        secondaryUnit: String(item.secondaryUnit || (!hasMapping ? item['unit-2'] : null) || "").trim(),
        conversionRate: parseNum(item.conversionRate || (!hasMapping ? item['conversionunit -1'] : null)),
        currentStock: parseNum(item.currentStock || (!hasMapping ? (item['opening stock'] || item.stock || item.quantity) : null)),
        minimumStock: parseNum(item.minimumStock || (!hasMapping ? (item.miniqua || item['min stock']) : null) || 10),
        maximumStock: parseNum(item.maximumStock || (!hasMapping ? (item['max.qua'] || item['max stock']) : null) || 0),
        isActive: true
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
      let isAutoGeneratedSku = item.sku.startsWith('SKU-');
      let isAutoGeneratedBarcode = item.barcode.startsWith('BAR-');

      let matchId = null;
      if (!isAutoGeneratedSku && skuMap.has(item.sku.toLowerCase())) {
          matchId = skuMap.get(item.sku.toLowerCase());
      } else if (!isAutoGeneratedBarcode && barcodeMap.has(item.barcode.toLowerCase())) {
          matchId = barcodeMap.get(item.barcode.toLowerCase());
      } else if (nameMap.has(item.name.toLowerCase())) {
          matchId = nameMap.get(item.name.toLowerCase());
      }

      // --- COLLISION PREVENTION (Fixes 11000 Duplicate Key Error) ---
      if (matchId) {
          // Agar existing product update ho raha hai, toh ensure karein ki SKU/Barcode kisi DUSRE product ka toh nahi hai
          const confSkuId = skuMap.get(item.sku.toLowerCase());
          if (confSkuId && confSkuId.toString() !== matchId.toString()) {
              item.sku = `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
              isAutoGeneratedSku = true; // Prevent overwriting existing good SKU
          }
          
          const confBarId = barcodeMap.get(item.barcode.toLowerCase());
          if (confBarId && confBarId.toString() !== matchId.toString()) {
              item.barcode = `BAR-${item.sku}`;
              isAutoGeneratedBarcode = true; // Prevent overwriting existing good Barcode
          }
      } else {
          // Agar naya product insert ho raha hai, ensure karein ki SKU/Barcode database me bilkul nahi hai
          if (!isAutoGeneratedSku && skuMap.has(item.sku.toLowerCase())) {
              item.sku = `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          }
          if (!isAutoGeneratedBarcode && barcodeMap.has(item.barcode.toLowerCase())) {
              item.barcode = `BAR-${item.sku}`;
          }
      }

      const { sku, barcode, ...updateFields } = item;

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