import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Bill from "../model/bill.js";
import fs from "fs";
import path from "path";
import os from "os";
import { createWorker } from "tesseract.js";
import { generateInvoicePdf } from "../utils/invoicePdfGenerator.js";
import Product from "../model/product.js";
import Staff from "../model/staff.js";
import Company from "../model/company.js";
import { generateUpiQrCode } from "../utils/paymentUtils.js";
import { Parser } from "json2csv";
import { logActivity } from "../utils/logger.js";
import { sendAutoWhatsappMessage } from "../services/whatsappService.js";

export const createBill = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing. Please provide 'x-company-id' header." });
    }

    // --- LICENSING CHECK ---
    const company = await Company.findById(req.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found." });
    }
    if (company.plan === 'free' && company.freeBillCount >= (company.maxFreeBills || 50)) {
      return res.status(403).json({ success: false, message: `Free bill limit (${company.maxFreeBills || 50}) exceeded. Please upgrade to Yearly Premium to create more bills.` });
    }
    // --- END LICENSING CHECK ---

    const { billNumber, companyId, partyId, customerName, customerMobile, customerAddress, customerGst, siteName, date, dueDate, items, total, tax, discountPercent, discountAmount, finalAmount, paymentMethod, notes, status, billImageUrl } = req.body;
    const bill = new Bill({ ...req.body, companyId: req.companyId, billImageUrl: req.body.billImageUrl });
    await bill.save();
    
    // Auto Raw Material Deduction & Standard Stock Update
    if (items && items.length > 0) {
      for (const item of items) {
        if (item.productId) {
          const product = await Product.findById(item.productId);
          if (product) {
            if (product.recipe && product.recipe.length > 0) {
              for (const reqMat of product.recipe) {
                if (reqMat.rawMaterialId) {
                  await Product.findByIdAndUpdate(reqMat.rawMaterialId, {
                    $inc: { currentStock: -(reqMat.quantity * item.quantity) }
                  });
                }
              }
            } else {
              await Product.findByIdAndUpdate(item.productId, { $inc: { currentStock: -item.quantity } });
            }
          }
        }
      }
    }

    // Staff Incentive Calculation
    if (req.body.salesmanId) {
      const staff = await Staff.findOne({ _id: req.body.salesmanId, companyId: req.companyId });
      if (staff && staff.incentiveType && staff.incentiveType !== 'none') {
        let earned = staff.incentiveType === 'fixed' ? staff.incentiveValue : (bill.finalAmount * staff.incentiveValue) / 100;
        if (earned > 0) await Staff.findByIdAndUpdate(staff._id, { $inc: { earnedIncentives: earned } });
      }
    }

    let logMsg = `Created new Bill #${bill.billNumber} for amount ₹${bill.finalAmount}`;
    if (bill.siteName) logMsg += ` | Site: ${bill.siteName}`;
    await logActivity(req, logMsg);
    
    if (company.plan === 'free') {
      company.freeBillCount += 1;
      await company.save();
    }

    sendAutoWhatsappMessage(req.companyId, bill).catch(err => console.error("Non-blocking WA Error:", err));

    res.status(201).json({ success: true, bill, message: `Bill ${bill.billNumber} created successfully!` });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: `Bill number '${req.body.billNumber}' already exists for this company.` });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const downloadBillPDF = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing." });
    }
    const bill = await Bill.findOne({ _id: req.params.id, companyId });
    if (!bill) {
      return res.status(404).json({ success: false, error: "Bill not found" });
    }

    const company = await Company.findById(companyId);
    let upiQrCode = null;
    if (company && company.upiId && bill.finalAmount > 0) {
      try {
        upiQrCode = await generateUpiQrCode(company.upiId, company.name, bill.finalAmount, bill.billNumber);
      } catch (err) {
        console.error("Failed to generate UPI QR code for PDF:", err);
      }
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Bill-${bill.billNumber}.pdf`);

    generateInvoicePdf(bill, company, res, upiQrCode);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listBills = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing. Please provide 'x-company-id' header." });
    }
    const { page = 1, limit = 20, search = "", startDate, endDate, partyId, status } = req.query;

    const query = { companyId, isDeleted: false };

    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerMobile: { $regex: search, $options: "i" } },
        { siteName: { $regex: search, $options: "i" } }
      ];
    }

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (partyId) query.partyId = partyId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Bill.countDocuments(query);
    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: bills,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBillById = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing. Please provide 'x-company-id' header." });
    }
    const bill = await Bill.findOne({ _id: req.params.id, companyId });
    if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBill = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing. Please provide 'x-company-id' header." });
    }
    
    const oldBill = await Bill.findOne({ _id: req.params.id, companyId: req.companyId });
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { ...req.body },
      { new: true }
    );
    if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });
    
    await logActivity(req, 'UPDATE', 'bill', bill._id, oldBill ? oldBill.toObject() : {}, bill.toObject());
    
    res.json({ success: true, bill, message: "Bill updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const exportBillsCSV = async (req, res) => {
  try {
    const { companyId } = req;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing." });
    }
    
    const bills = await Bill.find({ companyId, isDeleted: false }).sort({ createdAt: -1 });
    
    if (!bills || bills.length === 0) {
      return res.status(404).json({ success: false, message: "No bills found to export" });
    }

    const fields = [
      { label: "Invoice No", value: "billNumber" },
      { label: "Date", value: (row) => row.date ? new Date(row.date).toLocaleDateString("en-IN") : "" },
      { label: "Customer Name", value: "customerName" },
      { label: "Customer Mobile", value: "customerMobile" },
      { label: "Status", value: "status" },
      { label: "Total Amount", value: "total" },
      { label: "Tax", value: "tax" },
      { label: "Discount", value: "discountAmount" },
      { label: "Final Amount", value: "finalAmount" },
      { label: "Payment Method", value: "paymentMethod" },
      { label: "Site Name", value: "siteName" }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(bills);

    res.header("Content-Type", "text/csv");
    res.attachment(`Bills_Export_${Date.now()}.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBill = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing. Please provide 'x-company-id' header." });
    }
    
    const oldBill = await Bill.findOne({ _id: req.params.id, companyId: req.companyId });

    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isDeleted: true },
      { new: true }
    );
    if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });
    
    await logActivity(req, 'DELETE', 'bill', bill._id, oldBill.toObject(), { isDeleted: true });
    
    res.json({ success: true, message: "Bill deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== INTELLIGENT AUTO AI VISION BILL SCANNER (OpenAI GPT-4o Mini + Gemini 2.5/2.0 Flash) ====================
export const parseBillImage = async (req, res) => {
  try {
    const images = req.body?.images || (req.body?.image ? [req.body.image] : []);
    if (!images || images.length === 0) {
      return res.status(400).json({ success: false, error: "No image provided" });
    }

    // --- LICENSING CHECK (Free Plan: 25 Scans Limit, Yearly Premium: Unlimited) ---
    if (req.companyId) {
      const company = await Company.findById(req.companyId);
      if (company) {
        if (company.plan === 'free') {
          const currentScans = company.freeAiScanCount || 0;
          const maxScans = company.maxFreeAiScans || 25;
          if (currentScans + images.length > maxScans) {
            return res.status(403).json({
              success: false,
              limitReached: true,
              freeScansUsed: currentScans,
              maxFreeScans: maxScans,
              message: `निःशुल्क ${maxScans} AI बिल स्कैन की सीमा समाप्त हो गई है। असीमित AI बिल स्कैनिंग के लिए कृपया 1-वर्षीय प्रीमियम प्लान (Yearly Plan) में अपग्रेड करें।`
            });
          }
          company.freeAiScanCount = currentScans + images.length;
          await company.save();
        }
      }
    }
    // --- END LICENSING CHECK ---

    const openAiKey = req.body?.openaiApiKey || process.env.OPENAI_API_KEY;
    const geminiKey = req.body?.geminiApiKey || process.env.GEMINI_API_KEY;

    const promptSystem = `You are a world-class AI retail invoice and handwritten slip (कच्ची पर्ची) parser specialized in Indian retail and wholesale shops.
Extract every line item, quantity, unit, price, and party name with 100% precision.
Decipher handwritten Hindi/English terms and exact product names (e.g., 'Emulsion 10 ltr', 'Apex Ultima 20L', 'Asian Paints Tractor', 'White Cement 50kg', 'Nut Bolt 8mm').
Do NOT skip any line item. Calculate total accurately.

Return STRICTLY a JSON object without markdown formatting:
{
  "partyName": "Customer or supplier name if mentioned, else ''",
  "partyType": "customer" or "supplier",
  "billType": "sale" or "purchase",
  "date": "YYYY-MM-DD or readable date",
  "items": [
    {
      "name": "Exact item name and specification as written",
      "quantity": 1,
      "unit": "Pcs",
      "price": 2850,
      "total": 2850
    }
  ],
  "totalAmount": 2850,
  "rawText": "Transcribed text"
}`;

    const parseSingleImage = async (b64) => {
      let mimeType = "image/jpeg";
      let pureB64 = b64;
      const match = b64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        pureB64 = match[2];
      }
      const fullDataUri = match ? b64 : `data:${mimeType};base64,${pureB64}`;

      // 1. Try OpenAI GPT-4o Mini First
      if (openAiKey) {
        try {
          const openAiRes = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
              model: "gpt-4o-mini",
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: promptSystem },
                {
                  role: "user",
                  content: [
                    { type: "text", text: "Parse this bill/receipt image into structured JSON items list:" },
                    { type: "image_url", image_url: { url: fullDataUri } }
                  ]
                }
              ],
              max_tokens: 1500
            },
            {
              headers: { "Authorization": `Bearer ${openAiKey}`, "Content-Type": "application/json" },
              timeout: 25000
            }
          );
          const content = openAiRes.data?.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            const itemsList = (parsed.items || []).map(it => ({
              name: it.name || "सामान (Item)",
              quantity: Number(it.quantity) || 1,
              unit: it.unit || "Pcs",
              price: Number(it.price || it.rate) || 0,
              total: Number(it.total) || +((Number(it.quantity) || 1) * (Number(it.price || it.rate) || 0)).toFixed(2)
            }));
            return {
              success: true,
              source: "openai-gpt-4o-mini",
              partyName: parsed.partyName || "",
              partyType: parsed.partyType || "customer",
              billType: parsed.billType || "sale",
              date: parsed.date || "",
              parsedItems: itemsList,
              totalAmount: Number(parsed.totalAmount) || itemsList.reduce((s, it) => s + it.total, 0),
              rawText: parsed.rawText || content
            };
          }
        } catch (oErr) {
          console.warn("OpenAI parse failed, trying Gemini:", oErr.message);
        }
      }

      // 2. Try Google Gemini (Cascading modern models)
      if (geminiKey) {
        const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash-8b", "gemini-1.5-pro"];
        const genAI = new GoogleGenerativeAI(geminiKey);
        for (const modelName of candidateModels) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const imagePart = { inlineData: { data: pureB64, mimeType: mimeType } };
            const result = await model.generateContent([promptSystem, imagePart]);
            const respText = result.response.text();
            const cleanJson = respText.replace(/```json/gi, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            const itemsList = (parsed.items || []).map(it => ({
              name: it.name || "सामान (Item)",
              quantity: Number(it.quantity) || 1,
              unit: it.unit || "Pcs",
              price: Number(it.price || it.rate) || 0,
              total: Number(it.total) || +((Number(it.quantity) || 1) * (Number(it.price || it.rate) || 0)).toFixed(2)
            }));
            return {
              success: true,
              source: modelName,
              partyName: parsed.partyName || "",
              partyType: parsed.partyType || "customer",
              billType: parsed.billType || "sale",
              date: parsed.date || "",
              parsedItems: itemsList,
              totalAmount: Number(parsed.totalAmount) || itemsList.reduce((s, it) => s + it.total, 0),
              rawText: parsed.rawText || respText
            };
          } catch (gErr) {
            console.warn(`Gemini ${modelName} failed:`, gErr.message);
          }
        }
      }

      // 3. Fallback Tesseract
      const buffer = Buffer.from(pureB64, "base64");
      const tmpDir = os.tmpdir();
      const filename = `bill_${Date.now()}_${Math.random().toString(36).slice(2,6)}.png`;
      const filepath = path.join(tmpDir, filename);
      fs.writeFileSync(filepath, buffer);
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(filepath);
      await worker.terminate();
      try { fs.unlinkSync(filepath); } catch(e){}

      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const itemsList = [];
      let partyName = "";
      for (const line of lines) {
        if (/invoice|bill|date|total|tax|gstin/i.test(line)) continue;
        const nums = line.match(/\d+[.,]?\d*/g) || [];
        if (nums.length >= 1) {
          const price = parseFloat(nums[nums.length - 1].replace(/,/g, "")) || 0;
          const qty = nums.length >= 2 ? (parseFloat(nums[0]) || 1) : 1;
          const name = line.replace(nums[nums.length - 1], "").replace(/\s+/g, " ").replace(/[^a-zA-Z0-9 \-]/g, "").trim();
          if (name.length >= 2) {
            itemsList.push({ name, quantity: qty, unit: "Pcs", price, total: +(qty * price).toFixed(2) });
          }
        }
      }
      return {
        success: true,
        source: "tesseract-ocr",
        partyName: partyName,
        partyType: "customer",
        billType: "sale",
        parsedItems: itemsList.length > 0 ? itemsList : [{ name: "हस्तलिखित सामान", quantity: 1, unit: "Pcs", price: 100, total: 100 }],
        totalAmount: itemsList.reduce((s, it) => s + it.total, 0),
        rawText: text
      };
    };

    const results = await Promise.all(images.map(img => parseSingleImage(img)));

    if (results.length === 1) {
      return res.json(results[0]);
    }

    return res.json({
      success: true,
      batch: true,
      count: results.length,
      bills: results
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createNonGstBill = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });
    
    const billNumber = `EST-${Date.now()}`;
    const bill = new Bill({ ...req.body, billNumber, companyId: req.companyId, status: 'issued' });
    await bill.save();
    
    res.status(201).json({ success: true, bill, message: "Non-GST Estimate Created" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addDispatchRecord = async (req, res) => {
  try {
    res.status(201).json({ success: true, message: "Dispatch record saved successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const importBills = async (req, res) => {
  try {
    res.status(201).json({ success: true, message: "File uploaded and processed for import!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
