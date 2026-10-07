import fs from "fs";
import path from "path";
import { createWorker } from "tesseract.js";

/**
 * 1. TEXT EXTRACTION — For COMPUTER-GENERATED (printed) bills & PDF invoices
 * Handles image files (.png, .jpg, .jpeg) and PDF documents.
 */
export async function extractText(filePathOrBuffer, mimeType = "image/png") {
  // If a file path string was provided
  if (typeof filePathOrBuffer === "string") {
    const ext = path.extname(filePathOrBuffer).toLowerCase();

    if (ext === ".pdf") {
      try {
        const { default: pdfParse } = await import("pdf-parse");
        const buffer = fs.readFileSync(filePathOrBuffer);
        const data = await pdfParse(buffer);
        if (data.text && data.text.trim().length > 15) {
          return { text: data.text, method: "pdf-text" };
        }
      } catch (pdfErr) {
        console.warn("[OCR] Direct PDF extraction note:", pdfErr.message);
      }
    }

    // Fallback or Image: OCR with Tesseract
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(filePathOrBuffer);
    await worker.terminate();
    return { text: data.text, method: "ocr-tesseract" };
  }

  // If a buffer was provided
  if (Buffer.isBuffer(filePathOrBuffer)) {
    if (mimeType === "application/pdf") {
      try {
        const { default: pdfParse } = await import("pdf-parse");
        const data = await pdfParse(filePathOrBuffer);
        if (data.text && data.text.trim().length > 15) {
          return { text: data.text, method: "pdf-text" };
        }
      } catch (pdfErr) {
        console.warn("[OCR] Direct Buffer PDF extraction note:", pdfErr.message);
      }
    }

    const worker = await createWorker("eng");
    const { data } = await worker.recognize(filePathOrBuffer);
    await worker.terminate();
    return { text: data.text, method: "ocr-tesseract" };
  }

  throw new Error("Unsupported input format for text extraction");
}

/**
 * Printed POS bills are tabular:
 * Examples:
export function parseBillMetadata(rawText) {
  if (!rawText || typeof rawText !== "string") return {};

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const meta = {
    partyName: "",
    gstin: "",
    billDate: "",
    invoiceNumber: "",
    additionalCharges: [], // e.g. [{ name: 'लोकल भाड़ा (Freight)', amount: 250 }]
  };

  // 1. GSTIN Regex (Standard 15-character Indian GSTIN)
  const gstMatch = rawText.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/i);
  if (gstMatch) {
    meta.gstin = gstMatch[0].toUpperCase();
  }

  // 2. Invoice / Bill Number Regex
  const invMatch = rawText.match(/\b(?:inv(?:oice)?|bill|memo|voucher)[\s\.\#\:\-]*([A-Za-z0-9\/\-]+)\b/i);
  if (invMatch && invMatch[1] && invMatch[1].length >= 2 && !/^(no|num|number|date)$/i.test(invMatch[1])) {
    meta.invoiceNumber = invMatch[1].trim();
  }

  // 3. Bill Date Regex (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, etc.)
  const dateMatch = rawText.match(/\b(?:date|dt|दिनांक|dated)[\s\.\:\-]*([0-3]?\d[\/\-\.][0-1]?\d[\/\-\.](?:20)?\d{2,4})\b/i);
  if (dateMatch && dateMatch[1]) {
    meta.billDate = dateMatch[1].trim();
  }

  // 4. Party / Vendor Name Extraction from top header lines
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const l = lines[i];
    if (/tax\s*invoice|cash\s*memo|retail\s*invoice|bill\s*of\s*supply|estimate|quotation|original/i.test(l)) {
      continue;
    }
    if (meta.gstin && l.includes(meta.gstin)) continue;
    if (meta.invoiceNumber && l.includes(meta.invoiceNumber)) continue;
    if (/^(gstin|ph|phone|mob|tel|date|pan|fssai|email)/i.test(l)) continue;
    if (l.length >= 3 && l.length <= 60 && !/^\d+$/.test(l)) {
      meta.partyName = l.replace(/^(m\/s\.?|shree|sri)\s*/i, "").trim();
      break;
    }
  }

  // 5. Additional Charges (Freight / Transport / भाड़ा / Packaging / Hamali)
  const chargeRegex = /\b(freight|transport|cartage|packaging|packing|bhada|भाड़ा|हमाली|loading|delivery|courier)[\s\w\.\:\-]*?(\d+(?:\.\d+)?)\b/i;
  for (const line of lines) {
    const chMatch = line.match(chargeRegex);
    if (chMatch) {
      const label = chMatch[1].toLowerCase().includes("bhada") || chMatch[1].includes("भाड़ा")
        ? "लोकल भाड़ा (Freight)"
        : chMatch[1].toLowerCase().includes("pack")
        ? "पैकेजिंग खर्च (Packaging)"
        : `${chMatch[1]} खर्च`;
      const amount = parseFloat(chMatch[2]);
      if (amount > 0 && amount < 100000 && !meta.additionalCharges.some(c => c.name === label)) {
        meta.additionalCharges.push({ name: label, amount });
      }
    }
  }

  return meta;
}

/**
 * Printed POS bills are tabular:
 * Examples:
 * - "TATA TEA GOLD 500G   2   280.00   560.00"
 * - "SURF EXCEL MATIC     3402   5   120.00   600.00" (with HSN)
 * - "PARLE G BISCUIT      10  10       100"
 * - "Rin Soap Bar 250g    5   35.50    177.50"
 */
export function parseLineItems(rawText) {
  if (!rawText || typeof rawText !== "string") return [];

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  
  // Regex 5: Matches 5-part tabular line with HSN: [Name] [HSN] [Qty] [Rate] [Total]
  const itemLineRegex5 = /^(.+?)\s+(\d{4,8})\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/;
  // Regex 4: Matches standard 4-part tabular line: [Name] [Qty] [Rate] [Total]
  const itemLineRegex4 = /^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/;
  // Regex 3: Matches 3-part tabular line: [Name] [Qty] [Total] (where rate = total / qty)
  const itemLineRegex3 = /^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/;

  const items = [];
  const skipWords = /invoice|bill|subtotal|total|cgst|sgst|igst|tax|round|discount|gstin|fssai|phone|mobile|date|cashier|welcome|thank/i;

  for (const line of lines) {
    if (skipWords.test(line)) continue;

    // Check 5 columns: Name, HSN, Qty, Rate, Amount
    const match5 = line.match(itemLineRegex5);
    if (match5) {
      const rawName = match5[1].trim();
      if (rawName.length >= 2 && !/^\d+$/.test(rawName)) {
        items.push({
          rawName,
          hsn: match5[2].trim(),
          qty: parseFloat(match5[3]) || 1,
          rate: parseFloat(match5[4]) || 0,
          amount: parseFloat(match5[5]) || 0,
        });
        continue;
      }
    }

    // Check 4 columns: Name, Qty, Rate, Amount
    const match4 = line.match(itemLineRegex4);
    if (match4) {
      const rawName = match4[1].trim();
      if (rawName.length >= 2 && !/^\d+$/.test(rawName)) {
        items.push({
          rawName,
          hsn: "",
          qty: parseFloat(match4[2]) || 1,
          rate: parseFloat(match4[3]) || 0,
          amount: parseFloat(match4[4]) || 0,
        });
        continue;
      }
    }

    // Check 3 columns fallback
    const match3 = line.match(itemLineRegex3);
    if (match3) {
      const rawName = match3[1].trim();
      if (rawName.length >= 2 && !/^\d+$/.test(rawName)) {
        const qty = parseFloat(match3[2]) || 1;
        const total = parseFloat(match3[3]) || 0;
        const rate = qty > 0 ? +(total / qty).toFixed(2) : total;
        items.push({
          rawName,
          hsn: "",
          qty,
          rate,
          amount: total,
        });
      }
    }
  }

  return items;
}
