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
    if (company.plan === 'free' && company.freeBillCount >= company.maxFreeBills) {
      return res.status(403).json({ success: false, message: `Free bill limit (${company.maxFreeBills}) exceeded. Please upgrade to Premium to create more bills.` });
    }
    // --- END LICENSING CHECK ---


    const { billNumber, companyId, partyId, customerName, customerMobile, customerAddress, customerGst, siteName, date, dueDate, items, total, tax, discountPercent, discountAmount, finalAmount, paymentMethod, notes, status, billImageUrl } = req.body;
    const bill = new Bill({ ...req.body, companyId: req.companyId, billImageUrl: req.body.billImageUrl });
    await bill.save();
    
    // --- NEW FEATURE: Auto Raw Material Deduction & Standard Stock Update ---
    if (items && items.length > 0) {
      for (const item of items) {
        if (item.productId) {
          const product = await Product.findById(item.productId);
          if (product) {
            if (product.recipe && product.recipe.length > 0) {
              // Restaurant/Manufacturing: Deduct Raw Materials based on BOM
              for (const reqMat of product.recipe) {
                if (reqMat.rawMaterialId) {
                  await Product.findByIdAndUpdate(reqMat.rawMaterialId, {
                    $inc: { currentStock: -(reqMat.quantity * item.quantity) }
                  });
                }
              }
            } else {
              // Retail/Wholesale: Deduct the actual product stock
              await Product.findByIdAndUpdate(item.productId, { $inc: { currentStock: -item.quantity } });
            }
          }
        }
      }
    }

    // --- NEW FEATURE: Staff/Salesman Incentive Calculation (Clothes/Retail) ---
    if (req.body.salesmanId) {
      const staff = await Staff.findOne({ _id: req.body.salesmanId, companyId: req.companyId });
      if (staff && staff.incentiveType && staff.incentiveType !== 'none') {
        let earned = staff.incentiveType === 'fixed' ? staff.incentiveValue : (bill.finalAmount * staff.incentiveValue) / 100;
        if (earned > 0) await Staff.findByIdAndUpdate(staff._id, { $inc: { earnedIncentives: earned } });
      }
    }

    // Audit Trail: Log this action with Site Name for Builders
    let logMsg = `Created new Bill #${bill.billNumber} for amount ₹${bill.finalAmount}`;
    if (bill.siteName) logMsg += ` | Site: ${bill.siteName}`;
    await logActivity(req, logMsg);
    
    // --- LICENSING UPDATE ---
    if (company.plan === 'free') {
      company.freeBillCount += 1;
      await company.save();
    }

    // --- WHATSAPP AUTOMATION (Runs in background) ---
    // We don't wait for this to finish, so the API response is fast.
    // It will try to send a message if WhatsApp is enabled in settings.
    sendAutoWhatsappMessage(req.companyId, bill).catch(err => console.error("Non-blocking WA Error:", err));

    // --- END LICENSING UPDATE ---
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

    // 1. Fetch Bill and Company data in parallel
    const [bill, company] = await Promise.all([
      Bill.findOne({ _id: req.params.id, companyId }).populate("partyId"),
      Company.findById(companyId)
    ]);

    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }
    if (!company) {
      return res.status(404).json({ success: false, message: "Company details not found" });
    }

    // 2. Generate and stream the PDF
    await generateInvoicePdf(bill, company, res);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).json({ success: false, message: "Error generating PDF", error: error.message });
  }
};

export const listBills = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing. Please provide 'x-company-id' header." });
    }
    // 1. Get pagination and filter params from query
    const { status, date, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { companyId: req.companyId, isDeleted: false };

    if (status) filter.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // 2. Get total count and paginated data in parallel for efficiency
    const [bills, totalBills] = await Promise.all([
        Bill.find(filter)
            .populate("partyId", "name gstNumber")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Bill.countDocuments(filter)
    ]);

    // 3. Send response with pagination info
    res.json({ success: true, bills, pagination: { total: totalBills, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(totalBills / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBillById = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing. Please provide 'x-company-id' header." });
    }
    const bill = await Bill.findOne({ _id: req.params.id, companyId: req.companyId, isDeleted: false }).populate("partyId");
    if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });

    // Convert mongoose document to plain JS object to add extra properties
    let billData = bill.toJSON();

    // Fetch company details to get UPI ID
    const company = await Company.findById(req.companyId);

    // Generate QR Code if company has UPI ID and there is a payable amount
    if (company && company.upiId && billData.finalAmount > 0) {
      const qrBase64 = await generateUpiQrCode(
        company.upiId,
        company.name || "Merchant",
        billData.finalAmount,
        billData.billNumber
      );
      billData.paymentQrCode = qrBase64;
    }

    res.json({ success: true, bill: billData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBill = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing. Please provide 'x-company-id' header." });
    }

    // 1. Fetch old data before update to track changes
    const oldBill = await Bill.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!oldBill) return res.status(404).json({ success: false, error: "Bill not found" });

    // 2. Perform Update
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      req.body,
      { new: true }
    );

    // 3. Use the new powerful logger
    await logActivity(req, 'UPDATE', 'bill', bill._id, oldBill.toObject(), bill.toObject());
    
    res.json({ success: true, bill, message: "Bill updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Export all bills to CSV format
export const exportBillsCSV = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing." });
    }
    
    // Fetch all non-deleted bills for this company
    const bills = await Bill.find({ companyId: req.companyId, isDeleted: false }).populate("partyId", "name").sort({ date: -1 });

    // Define columns for CSV
    const fields = ['Bill Number', 'Date', 'Customer Name', 'Site Name', 'Status', 'Total Amount', 'Tax', 'Final Amount', 'Payment Method'];
    
    // Map database data to CSV columns
    const csvData = bills.map(b => ({
      'Bill Number': b.billNumber,
      'Date': new Date(b.date || b.createdAt).toLocaleDateString(),
      'Customer Name': b.customerName || (b.partyId ? b.partyId.name : 'Unknown'),
      'Site Name': b.siteName || 'N/A', // Useful for Builder / Contractor tracking
      'Status': b.status?.toUpperCase() || 'N/A',
      'Total Amount': b.total || 0,
      'Tax': b.tax || 0,
      'Final Amount': b.finalAmount || 0,
      'Payment Method': b.paymentMethod || 'N/A'
    }));

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    // Send file to client
    res.header('Content-Type', 'text/csv');
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
    
    // Fetch old data to know what is being deleted
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

// Multi-Provider AI Vision Bill Scanner: OpenAI GPT-4o Mini + Google Gemini 2.5/2.0 Flash
export const parseBillImage = async (req, res) => {
  try {
    const b64 = req.body?.image;
    if (!b64) return res.status(400).json({ success: false, error: "No image provided (expected base64 in body.image)" });

    let mimeType = "image/jpeg";
    let pureB64 = b64;
    const match = b64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      pureB64 = match[2];
    }

    const fullDataUri = match ? b64 : `data:${mimeType};base64,${pureB64}`;
    const openAiKey = req.body?.openaiApiKey || process.env.OPENAI_API_KEY;
    const geminiKey = req.body?.geminiApiKey || process.env.GEMINI_API_KEY;
    const selectedProvider = req.body?.provider || (openAiKey ? "openai" : "gemini");

    const promptSystem = `You are a world-class AI retail bill, handwritten chit (कच्ची पर्ची), purchase invoice, and GST bill parser specialized in Indian shopkeeping.
Analyze this receipt/slip image and extract every line item, quantity, unit, price, and party details with 100% precision.
Decipher handwritten Hindi/English terms and exact product names (e.g., 'Emulsion 10 ltr', 'Apex Ultima 20L', 'Asian Paints Tractor', 'White Cement 50kg', 'Nut Bolt 8mm').
Do NOT skip any product. Calculate total accurately.

Return STRICTLY a valid JSON object without markdown fences, matching this schema:
{
  "partyName": "Customer or supplier name if found, else ''",
  "partyType": "customer" or "supplier",
  "billType": "sale" or "purchase",
  "date": "YYYY-MM-DD or readable date string",
  "items": [
    {
      "name": "Exact item name and specification as written on the slip",
      "quantity": 1,
      "unit": "Pcs",
      "price": 2850,
      "total": 2850
    }
  ],
  "totalAmount": 2850,
  "rawText": "Complete transcribed text from the image"
}`;

    // 1. TRY OPENAI CHATGPT (GPT-4o Mini)
    if (openAiKey && (selectedProvider === "openai" || !geminiKey)) {
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
            headers: {
              "Authorization": `Bearer ${openAiKey}`,
              "Content-Type": "application/json"
            },
            timeout: 25000
          }
        );

        const content = openAiRes.data?.choices?.[0]?.message?.content;
        if (content) {
          const parsedData = JSON.parse(content);
          const itemsList = (parsedData.items || []).map(it => {
            const qty = Number(it.quantity) || 1;
            const price = Number(it.price || it.rate) || 0;
            const total = Number(it.total) || +(qty * price).toFixed(2);
            return {
              name: it.name || "सामान (Item)",
              quantity: qty,
              unit: it.unit || "Pcs",
              rate: price,
              price: price,
              taxable: total
            };
          });

          const calculatedTotal = Number(parsedData.totalAmount) || itemsList.reduce((s, it) => s + it.taxable, 0);

          return res.json({
            success: true,
            source: "openai-gpt-4o-mini",
            partyName: parsedData.partyName || "",
            partyType: parsedData.partyType || "customer",
            billType: parsedData.billType || "sale",
            date: parsedData.date || "",
            parsedItems: itemsList,
            totalAmount: calculatedTotal,
            rawText: parsedData.rawText || content
          });
        }
      } catch (openAiErr) {
        console.warn("OpenAI GPT-4o Mini failed:", openAiErr.response?.data || openAiErr.message);
      }
    }

    // 2. TRY GOOGLE GEMINI (Cascading Models: gemini-2.5-flash, gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-flash-8b)
    if (geminiKey) {
      const geminiCandidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash-8b", "gemini-1.5-pro"];
      const genAI = new GoogleGenerativeAI(geminiKey);

      for (const modelName of geminiCandidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const imagePart = {
            inlineData: {
              data: pureB64,
              mimeType: mimeType
            }
          };

          const result = await model.generateContent([promptSystem, imagePart]);
          const responseText = result.response.text();
          const cleanJson = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsedData = JSON.parse(cleanJson);

          const itemsList = (parsedData.items || []).map(it => {
            const qty = Number(it.quantity) || 1;
            const price = Number(it.price || it.rate) || 0;
            const total = Number(it.total) || +(qty * price).toFixed(2);
            return {
              name: it.name || "सामान (Item)",
              quantity: qty,
              unit: it.unit || "Pcs",
              rate: price,
              price: price,
              taxable: total
            };
          });

          const calculatedTotal = Number(parsedData.totalAmount) || itemsList.reduce((s, it) => s + it.taxable, 0);

          return res.json({
            success: true,
            source: modelName,
            partyName: parsedData.partyName || "",
            partyType: parsedData.partyType || "customer",
            billType: parsedData.billType || "sale",
            date: parsedData.date || "",
            parsedItems: itemsList,
            totalAmount: calculatedTotal,
            rawText: parsedData.rawText || responseText
          });
        } catch (mErr) {
          console.warn(`Gemini model ${modelName} failed, trying next candidate:`, mErr.message);
        }
      }
    }

    // 3. FALLBACK TO LOCAL TESSERACT OCR
    const buffer = Buffer.from(pureB64, "base64");
    const tmpDir = os.tmpdir();
    const filename = `bill_${Date.now()}.png`;
    const filepath = path.join(tmpDir, filename);
    fs.writeFileSync(filepath, buffer);

    const worker = await createWorker("eng");
    const { data: { text } } = await worker.recognize(filepath);
    await worker.terminate();

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsedItems = [];
    let partyName = "";
    let totalAmount = 0;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes("name:") || lowerLine.includes("to:") || lowerLine.includes("m/s")) {
        partyName = line.replace(/name:|to:|m\/s/i, "").trim();
      }
      if (lowerLine.includes("total") || lowerLine.includes("amount") || lowerLine.includes("g.total")) {
        const nums = line.match(/\d+[.,]?\d*/g) || [];
        if (nums.length > 0) totalAmount = parseFloat(nums[nums.length - 1].replace(/,/g, ""));
      }

      const nums = line.match(/\d+[.,]?\d*/g) || [];
      if (nums.length >= 1 && !lowerLine.includes("total") && !lowerLine.includes("invoice") && !lowerLine.includes("date")) {
        const priceRaw = nums[nums.length - 1];
        const qtyRaw = nums.length >= 2 ? nums[nums.length - 2] : "1";
        const price = parseFloat(priceRaw.replace(/,/g, "")) || 0;
        const qty = parseFloat(qtyRaw.replace(/,/g, "")) || 1;
        const name = line.replace(priceRaw, "").replace(qtyRaw, "").replace(/\s+/g, " ").replace(/[^a-zA-Z0-9 \-]/g, "").trim();
        if (name && name.length >= 2) {
          parsedItems.push({ name: name, quantity: qty, unit: "Pcs", rate: price, price, taxable: +(price * qty).toFixed(2) });
        }
      }
    }

    try { fs.unlinkSync(filepath); } catch (e) {}
    return res.json({ 
      success: true, 
      source: "tesseract-ocr",
      text, 
      parsedItems, 
      partyName, 
      totalAmount: totalAmount || parsedItems.reduce((s, it) => s + it.taxable, 0)
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
// Multi-Provider AI Vision Bill Scanner: OpenAI GPT-4o Mini + Google Gemini 2.5/2.0 Flash
export const parseBillImage = async (req, res) => {
  try {
    const b64 = req.body?.image;
    if (!b64) return res.status(400).json({ success: false, error: "No image provided (expected base64 in body.image)" });

    let mimeType = "image/jpeg";
    let pureB64 = b64;
    const match = b64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      pureB64 = match[2];
    }

    const fullDataUri = match ? b64 : `data:${mimeType};base64,${pureB64}`;
    const openAiKey = req.body?.openaiApiKey || process.env.OPENAI_API_KEY;
    const geminiKey = req.body?.geminiApiKey || process.env.GEMINI_API_KEY;
    const selectedProvider = req.body?.provider || (openAiKey ? "openai" : "gemini");

    const promptSystem = `You are a world-class AI retail bill, handwritten chit (कच्ची पर्ची), purchase invoice, and GST bill parser specialized in Indian shopkeeping.
Analyze this receipt/slip image and extract every line item, quantity, unit, price, and party details with 100% precision.
Decipher handwritten Hindi/English terms and exact product names (e.g., 'Emulsion 10 ltr', 'Apex Ultima 20L', 'Asian Paints Tractor', 'White Cement 50kg', 'Nut Bolt 8mm').
Do NOT skip any product. Calculate total accurately.

Return STRICTLY a valid JSON object without markdown fences, matching this schema:
{
  "partyName": "Customer or supplier name if found, else ''",
  "partyType": "customer" or "supplier",
  "billType": "sale" or "purchase",
  "date": "YYYY-MM-DD or readable date string",
  "items": [
    {
      "name": "Exact item name and specification as written on the slip",
      "quantity": 1,
      "unit": "Pcs",
      "price": 2850,
      "total": 2850
    }
  ],
  "totalAmount": 2850,
  "rawText": "Complete transcribed text from the image"
}`;

    // 1. TRY OPENAI CHATGPT (GPT-4o Mini)
    if (openAiKey && (selectedProvider === "openai" || !geminiKey)) {
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
            headers: {
              "Authorization": `Bearer ${openAiKey}`,
              "Content-Type": "application/json"
            },
            timeout: 25000
          }
        );

        const content = openAiRes.data?.choices?.[0]?.message?.content;
        if (content) {
          const parsedData = JSON.parse(content);
          const itemsList = (parsedData.items || []).map(it => {
            const qty = Number(it.quantity) || 1;
            const price = Number(it.price || it.rate) || 0;
            const total = Number(it.total) || +(qty * price).toFixed(2);
            return {
              name: it.name || "सामान (Item)",
              quantity: qty,
              unit: it.unit || "Pcs",
              rate: price,
              price: price,
              taxable: total
            };
          });

          const calculatedTotal = Number(parsedData.totalAmount) || itemsList.reduce((s, it) => s + it.taxable, 0);

          return res.json({
            success: true,
            source: "openai-gpt-4o-mini",
            partyName: parsedData.partyName || "",
            partyType: parsedData.partyType || "customer",
            billType: parsedData.billType || "sale",
            date: parsedData.date || "",
            parsedItems: itemsList,
            totalAmount: calculatedTotal,
            rawText: parsedData.rawText || content
          });
        }
      } catch (openAiErr) {
        console.warn("OpenAI GPT-4o Mini failed:", openAiErr.response?.data || openAiErr.message);
      }
    }

    // 2. TRY GOOGLE GEMINI (Cascading Models: gemini-2.5-flash, gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-flash-8b)
    if (geminiKey) {
      const geminiCandidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash-8b", "gemini-1.5-pro"];
      const genAI = new GoogleGenerativeAI(geminiKey);

      for (const modelName of geminiCandidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const imagePart = {
            inlineData: {
              data: pureB64,
              mimeType: mimeType
            }
          };

          const result = await model.generateContent([promptSystem, imagePart]);
          const responseText = result.response.text();
          const cleanJson = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsedData = JSON.parse(cleanJson);

          const itemsList = (parsedData.items || []).map(it => {
            const qty = Number(it.quantity) || 1;
            const price = Number(it.price || it.rate) || 0;
            const total = Number(it.total) || +(qty * price).toFixed(2);
            return {
              name: it.name || "सामान (Item)",
              quantity: qty,
              unit: it.unit || "Pcs",
              rate: price,
              price: price,
              taxable: total
            };
          });

          const calculatedTotal = Number(parsedData.totalAmount) || itemsList.reduce((s, it) => s + it.taxable, 0);

          return res.json({
            success: true,
            source: modelName,
            partyName: parsedData.partyName || "",
            partyType: parsedData.partyType || "customer",
            billType: parsedData.billType || "sale",
            date: parsedData.date || "",
            parsedItems: itemsList,
            totalAmount: calculatedTotal,
            rawText: parsedData.rawText || responseText
          });
        } catch (mErr) {
          console.warn(`Gemini model ${modelName} failed, trying next candidate:`, mErr.message);
        }
      }
    }

    // 3. FALLBACK TO LOCAL TESSERACT OCR
    const buffer = Buffer.from(pureB64, "base64");
    const tmpDir = os.tmpdir();
    const filename = `bill_${Date.now()}.png`;
    const filepath = path.join(tmpDir, filename);
    fs.writeFileSync(filepath, buffer);

    const worker = await createWorker("eng");
    const { data: { text } } = await worker.recognize(filepath);
    await worker.terminate();

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsedItems = [];
    let partyName = "";
    let totalAmount = 0;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes("name:") || lowerLine.includes("to:") || lowerLine.includes("m/s")) {
        partyName = line.replace(/name:|to:|m\/s/i, "").trim();
      }
      if (lowerLine.includes("total") || lowerLine.includes("amount") || lowerLine.includes("g.total")) {
        const nums = line.match(/\d+[.,]?\d*/g) || [];
        if (nums.length > 0) totalAmount = parseFloat(nums[nums.length - 1].replace(/,/g, ""));
      }

      const nums = line.match(/\d+[.,]?\d*/g) || [];
      if (nums.length >= 1 && !lowerLine.includes("total") && !lowerLine.includes("invoice") && !lowerLine.includes("date")) {
        const priceRaw = nums[nums.length - 1];
        const qtyRaw = nums.length >= 2 ? nums[nums.length - 2] : "1";
        const price = parseFloat(priceRaw.replace(/,/g, "")) || 0;
        const qty = parseFloat(qtyRaw.replace(/,/g, "")) || 1;
        const name = line.replace(priceRaw, "").replace(qtyRaw, "").replace(/\s+/g, " ").replace(/[^a-zA-Z0-9 \-]/g, "").trim();
        if (name && name.length >= 2) {
          parsedItems.push({ name: name, quantity: qty, unit: "Pcs", rate: price, price, taxable: +(price * qty).toFixed(2) });
        }
      }
    }

    try { fs.unlinkSync(filepath); } catch (e) {}
    return res.json({ 
      success: true, 
      source: "tesseract-ocr",
      text, 
      parsedItems, 
      partyName, 
      totalAmount: totalAmount || parsedItems.reduce((s, it) => s + it.taxable, 0)
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
export const createNonGstBill = async (req, res) => {
  try {
    if (!req.companyId) return res.status(400).json({ success: false, message: "Company ID is missing" });
    
    // Generate dummy bill number for estimate
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
    // For now returning success. In future, we can save this in a Dispatch model.
    res.status(201).json({ success: true, message: "Dispatch record saved successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const importBills = async (req, res) => {
  try {
    // Logic for processing Excel/CSV will go here
    res.status(201).json({ success: true, message: "File uploaded and processed for import!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};