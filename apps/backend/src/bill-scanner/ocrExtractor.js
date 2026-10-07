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
 * - "TATA TEA GOLD 500G   2   280.00   560.00"
 * - "PARLE G BISCUIT      10  10       100"
 * - "Rin Soap Bar 250g    5   35.50    177.50"
 */
export function parseLineItems(rawText) {
  if (!rawText || typeof rawText !== "string") return [];

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  
  // Regex 1: Matches standard 4-part tabular line: [Name] [Qty] [Rate] [Total]
  const itemLineRegex4 = /^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/;
  // Regex 2: Matches 3-part tabular line: [Name] [Qty] [Total] (where rate = total / qty)
  const itemLineRegex3 = /^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/;

  const items = [];
  const skipWords = /invoice|bill|subtotal|total|cgst|sgst|igst|tax|round|discount|gstin|fssai|phone|mobile|date|cashier|welcome|thank/i;

  for (const line of lines) {
    if (skipWords.test(line)) continue;

    // Check 4 columns: Name, Qty, Rate, Amount
    const match4 = line.match(itemLineRegex4);
    if (match4) {
      const rawName = match4[1].trim();
      if (rawName.length >= 2 && !/^\d+$/.test(rawName)) {
        items.push({
          rawName,
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
          qty,
          rate,
          amount: total,
        });
      }
    }
  }

  return items;
}
