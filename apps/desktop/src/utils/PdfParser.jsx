import * as pdfjsLib from "pdfjs-dist";

// Configure worker reliably for web with safe fallback
if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  try {
    const version = pdfjsLib.version || "4.10.38";
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
  } catch (wErr) {
    console.warn("PDF worker init warning:", wErr);
  }
}

/**
 * Extracts raw concatenated text from all PDF pages
 */
export const extractTextFromPDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((s) => s.str).join(" ") + "\n";
  }

  return text.trim();
};

/**
 * Reconstructs visual lines from PDF text items by grouping items with similar Y coordinates.
 * Tolerance is set to 7px to robustly capture table rows where text and numbers have slight baseline offsets.
 */
const reconstructVisualLines = (items) => {
  if (!items || items.length === 0) return [];
  const tolerance = 7; // pixels tolerance for grouping into the same horizontal line
  const linesMap = [];

  for (const item of items) {
    const text = (item.str || "").trim();
    if (!text) continue;
    const x = item.transform ? item.transform[4] : 0;
    const y = item.transform ? item.transform[5] : 0;

    let lineObj = linesMap.find((l) => Math.abs(l.y - y) <= tolerance);
    if (!lineObj) {
      lineObj = { y, items: [] };
      linesMap.push(lineObj);
    }
    lineObj.items.push({ text, x });
  }

  // Sort lines top to bottom (descending Y)
  linesMap.sort((a, b) => b.y - a.y);

  // In each line, sort items left to right (ascending X)
  return linesMap.map((l) => {
    l.items.sort((a, b) => a.x - b.x);
    return {
      y: l.y,
      lineText: l.items.map((i) => i.text).join(" ").trim(),
      items: l.items,
    };
  });
};

/**
 * Clean & parse a potential amount string
 */
const parseCleanAmount = (valStr) => {
  if (!valStr) return null;
  // Remove currency symbols, commas, and extra spaces
  const cleaned = valStr.replace(/[₹RsINR\s,]/gi, "").trim();
  const num = parseFloat(cleaned);
  if (isNaN(num) || num <= 0) return null;
  // Exclude phone numbers (10 digits) and 6-digit pin codes
  if (num >= 1000000000) return null; // Likely phone number or account number
  if (num >= 100000 && num <= 999999 && Number.isInteger(num)) return null; // Likely PIN code
  // Exclude 6-to-8-digit HSN codes (e.g. 85044090, 39269099)
  if (num >= 1000000 && num <= 99999999 && Number.isInteger(num)) return null;
  // Exclude 4-digit years like 2024, 2025, 2026 if exact integer
  if (num >= 2020 && num <= 2035 && Number.isInteger(num)) return null;
  return num;
};

/**
 * Smart detection of Grand Total / Total Amount from visual lines & text.
 * Strictly ignores tax totals (GST/CGST/SGST ~₹1,400) and prioritizes the true Invoice Grand Total.
 */
const detectGrandTotal = (lines, rawText) => {
  const candidateScores = [];

  // Patterns for high confidence grand totals
  const highPriorityRegex = /(?:grand\s*total|invoice\s*total|net\s*payable|total\s*payable|total\s*amount\s*payable|net\s*amount\s*payable|total\s*invoice\s*value|final\s*amount|final\s*total|gross\s*total|bill\s*amount|balance\s*due)/i;
  const mediumPriorityRegex = /(?:total\s*amount|net\s*amount|total\s*value)/i;
  const genericTotalRegex = /(?:^|\s)total(?:\s*\(|\s*\:|\s*$|\s+inr|\s+rs)/i;

  // Tax, deduction, and quantity patterns that must NEVER be confused with Grand Total
  const ignorePrefixes = /(?:total\s*qty|total\s*quantity|total\s*items|total\s*discount|discount\s*total|taxable|cgst|sgst|igst|cess|total\s*tax|total\s*gst|gst\s*total|tax\s*total|gst\s*amount|tax\s*amount|central\s*tax|state\s*tax|integrated\s*tax|output\s*tax|input\s*tax|tax\s*payable|vat|tds|tcs|round\s*off|freight|loading|unloading)/i;

  const numberExtractRegex = /(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/g;

  // 1. Scan visual lines from bottom to top (totals are in lower half)
  for (let idx = lines.length - 1; idx >= 0; idx--) {
    const { lineText } = lines[idx];

    // Explicitly reject tax summary lines
    if (ignorePrefixes.test(lineText)) {
      continue;
    }

    let priority = 0;
    if (highPriorityRegex.test(lineText)) {
      priority = 1000;
    } else if (mediumPriorityRegex.test(lineText)) {
      priority = 500;
    } else if (genericTotalRegex.test(lineText)) {
      priority = 250;
    }

    if (priority > 0) {
      // Find all numbers in this line
      const matches = [...lineText.matchAll(numberExtractRegex)];
      if (matches.length > 0) {
        // Find largest valid amount in the total row
        for (let m = matches.length - 1; m >= 0; m--) {
          const amt = parseCleanAmount(matches[m][1]);
          if (amt && amt > 0) {
            candidateScores.push({
              amount: amt,
              score: priority + amt * 0.005,
              label: lineText,
              lineIndex: idx,
            });
          }
        }
      } else if (idx + 1 < lines.length) {
        // Amount might be on the next line immediately below
        const nextLineMatches = [...lines[idx + 1].lineText.matchAll(numberExtractRegex)];
        for (const nm of nextLineMatches) {
          const amt = parseCleanAmount(nm[1]);
          if (amt && amt > 0) {
            candidateScores.push({
              amount: amt,
              score: priority - 50,
              label: `${lineText} -> ${lines[idx + 1].lineText}`,
              lineIndex: idx,
            });
          }
        }
      }
    }
  }

  // 2. Also check full raw text with direct multi-match regex (excluding tax phrases)
  const directMatches = [
    ...rawText.matchAll(
      /(?:grand\s*total|invoice\s*total|net\s*payable|total\s*payable|total\s*invoice\s*value|gross\s*total)[\s\:\₹\Rs\.\-]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi
    ),
  ];
  for (const dm of directMatches) {
    if (dm[1]) {
      const amt = parseCleanAmount(dm[1]);
      if (amt && amt > 0) {
        candidateScores.push({
          amount: amt,
          score: 900,
          label: dm[0],
          lineIndex: -1,
        });
      }
    }
  }

  if (candidateScores.length > 0) {
    // Filter out candidates with tax/discount/qty labels
    const validCandidates = candidateScores.filter((c) => !ignorePrefixes.test(c.label));
    const targetPool = validCandidates.length > 0 ? validCandidates : candidateScores;

    // Sort descending by score, then by amount
    targetPool.sort((a, b) => (b.score !== a.score ? b.score - a.score : b.amount - a.amount));

    // In Indian invoices, Grand Total is ALWAYS the largest total among valid candidates
    const topScore = targetPool[0].score;
    const topCandidates = targetPool.filter((c) => c.score >= topScore - 200);
    topCandidates.sort((a, b) => b.amount - a.amount);
    return topCandidates[0].amount;
  }

  // 3. Fallback: If no label matched, scan bottom 50% of lines for plausible largest amounts (skipping tax lines)
  const bottomLines = lines.slice(Math.floor(lines.length * 0.4));
  let maxPlausibleAmt = 0;
  for (const bl of bottomLines) {
    if (/tax|cgst|sgst|igst|hsn|rate|qty|discount|cess|vat|pan|gstin/i.test(bl.lineText)) continue;
    const matches = [...bl.lineText.matchAll(numberExtractRegex)];
    for (const m of matches) {
      const amt = parseCleanAmount(m[1]);
      if (amt && amt > maxPlausibleAmt && amt < 5000000) {
        maxPlausibleAmt = amt;
      }
    }
  }

  return maxPlausibleAmt;
};

/**
 * Smart detection of Vendor / Party / Business Name
 */
const detectPartyName = (lines, rawText, pageNum) => {
  // 1. Explicit Seller / Vendor / Party markers
  const explicitPrefixRegex = /(?:m\/s\.?|messrs|sold\s*by|supplier|seller|vendor|billed\s*by)[\s\:\.\-]*([A-Za-z0-9\s\&\.\'\-\(\)]{3,50})/i;
  const prefixMatch = rawText.match(explicitPrefixRegex);
  if (prefixMatch && prefixMatch[1]) {
    const cleaned = cleanPartyName(prefixMatch[1]);
    if (isValidPartyName(cleaned)) return cleaned;
  }

  // 2. Buyer / Customer markers (if purchase bill or billed to)
  const buyerPrefixRegex = /(?:billed\s*to|bill\s*to|buyer|consignee|customer\s*name|party\s*name|party)[\s\:\.\-]*([A-Za-z0-9\s\&\.\'\-\(\)]{3,50})/i;
  const buyerMatch = rawText.match(buyerPrefixRegex);
  if (buyerMatch && buyerMatch[1]) {
    const cleaned = cleanPartyName(buyerMatch[1]);
    if (isValidPartyName(cleaned)) return cleaned;
  }

  // 3. Inspect top visual lines (lines 0 to 6) for business header
  const topLines = lines.slice(0, 7);
  for (const { lineText } of topLines) {
    const cleaned = cleanPartyName(lineText);
    if (isValidPartyName(cleaned)) {
      return cleaned;
    }
  }

  return `सप्लायर / पार्टी (पेज ${pageNum})`;
};

const cleanPartyName = (str) => {
  if (!str) return "";
  return str
    .replace(/(?:tax\s*invoice|retail\s*invoice|bill\s*of\s*supply|cash\s*memo|original|duplicate|triplicate)/gi, "")
    .replace(/(?:gstin|gst\s*no|state|pan\s*no|cin|phone|mob|tel|email|date|inv\s*no|invoice)[\s\:\.\-].*/gi, "")
    .replace(/^[\s\:\,\.\-\#\/]+|[\s\:\,\.\-\#\/]+$/g, "")
    .trim();
};

const isValidPartyName = (str) => {
  if (!str || str.length < 3 || str.length > 55) return false;
  const lower = str.toLowerCase();
  // Filter out pure metadata / keywords
  if (
    lower.includes("invoice") ||
    lower.includes("gstin") ||
    lower.includes("original for") ||
    lower.includes("duplicate for") ||
    lower.includes("state code") ||
    lower.includes("challan") ||
    lower.includes("delivery") ||
    lower.includes("terms & conditions") ||
    lower.includes("e-way bill") ||
    lower.includes("buyer's order") ||
    /^\d+$/.test(str)
  ) {
    return false;
  }
  return true;
};

/**
 * Smart detection of Invoice / Bill Number
 */
const detectBillNumber = (lines, rawText, pageNum) => {
  const billNoRegex = /(?:invoice\s*no\.?|inv\s*no\.?|bill\s*no\.?|invoice\s*\#|bill\s*\#|voucher\s*no\.?|receipt\s*no\.?|ref\s*no\.?)[\s\:\#\-]*([A-Za-z0-9\/\-_]{2,25})/i;
  const match = rawText.match(billNoRegex);
  if (match && match[1]) {
    const cleanNo = match[1].trim();
    if (cleanNo.length >= 2 && !/^(date|dated|to|from)$/i.test(cleanNo)) {
      return cleanNo;
    }
  }

  // Also check lines that contain "invoice" or "bill"
  for (const { lineText } of lines.slice(0, 12)) {
    const lMatch = lineText.match(billNoRegex);
    if (lMatch && lMatch[1]) {
      return lMatch[1].trim();
    }
  }

  return `BILL-P${pageNum}-${Date.now().toString().slice(-4)}`;
};

/**
 * Smart detection of Invoice Date
 */
const detectBillDate = (lines, rawText) => {
  const labeledDateRegex = /(?:invoice\s*date|bill\s*date|dated?|date)[\s\:\.\-]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i;
  const labeledMatch = rawText.match(labeledDateRegex);
  if (labeledMatch && labeledMatch[1]) {
    const parsed = formatToISODate(labeledMatch[1]);
    if (parsed) return parsed;
  }

  // Check lines 0 to 15
  for (const { lineText } of lines.slice(0, 15)) {
    const lMatch = lineText.match(labeledDateRegex);
    if (lMatch && lMatch[1]) {
      const parsed = formatToISODate(lMatch[1]);
      if (parsed) return parsed;
    }
  }

  // Fallback to standalone date pattern
  const dateMatch =
    rawText.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/) ||
    rawText.match(/\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/);
  if (dateMatch && dateMatch[1]) {
    const parsed = formatToISODate(dateMatch[1]);
    if (parsed) return parsed;
  }

  return new Date().toISOString().split("T")[0];
};

const formatToISODate = (dateStr) => {
  try {
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      } else {
        // DD-MM-YYYY
        const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${y}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }
  } catch (e) {}
  return null;
};

/**
 * Smart detection of individual line items from invoice table rows.
 * Reliably extracts item name, quantity (with units), unit rate, and total amount.
 * Never leaves quantity or rate empty or zero.
 */
const detectLineItems = (lines, totalAmount, pageNum, rawText = "") => {
  const items = [];
  const numberExtractRegex = /(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/g;

  // 1. Detect default GST rate from entire page text if present
  let pageDefaultGst = 0;
  const pageSplitGstMatch = (rawText || "").match(/(?:cgst|sgst)\s*[@:]?\s*(2\.5|6|9|14)\s*%/i);
  if (pageSplitGstMatch) {
    pageDefaultGst = parseFloat(pageSplitGstMatch[1]) * 2;
  } else {
    const pageGstMatch = (rawText || "").match(/(?:gst|igst|tax)\s*[@:]?\s*(0|0\.25|3|5|12|18|28)\s*%/i);
    if (pageGstMatch) {
      pageDefaultGst = parseFloat(pageGstMatch[1]);
    }
  }

  // Load saved item aliases memory
  let itemAliases = {};
  try {
    itemAliases = JSON.parse(localStorage.getItem("vb_item_aliases") || "{}");
  } catch (e) {}

  // 2. Scan lines in the middle section
  const candidateLines = lines.slice(2, Math.max(3, lines.length - 2));

  for (let i = 0; i < candidateLines.length; i++) {
    const { lineText } = candidateLines[i];
    const trimmedLine = lineText.trim();

    // STRICT FILTER: Ignore table header rows
    if (/^(?:sl|sr|s\.no|sno|#|item|particulars|description|desc|hsn|sac|rate|qty|quantity|unit|amount|price|mrp|disc|discount|taxable)\b/i.test(trimmedLine)) {
      continue;
    }

    // STRICT FILTER: Ignore Subtotals, Tax breakups (CGST, SGST, IGST), Round Off, Grand Total, Freight, Terms, Bank
    if (
      /(?:sub\s*total|total\s*taxable|taxable\s*(?:value|amount)|tax\s*amount|gst\s*amount|cgst|sgst|igst|cess|central\s*tax|state\s*tax|integrated\s*tax|output\s*tax|input\s*tax|total\s*tax|total\s*gst|gst\s*total|tax\s*payable|round\s*off|grand\s*total|invoice\s*total|net\s*payable|total\s*payable|balance\s*due|final\s*amount|total\s*amount|net\s*amount|total\s*value)/i.test(lineText) ||
      /(?:freight|carriage|transport|cartage|loading|unloading|packing|handling|courier|insurance)/i.test(lineText) ||
      /(?:bank\s*(?:name|a\/c|acc|account)|ifsc|branch|upi\s*id|pan\s*no|gstin|state\s*code|cin\b)/i.test(lineText) ||
      /(?:terms\s*&|terms\s*and|authorized\s*signatory|for\s+[a-z]|e\.?\s*&\s*o\.?\s*e|jurisdiction|rupees\s*in\s*words|amount\s*in\s*words)/i.test(lineText)
    ) {
      continue;
    }

    // A. Detect explicit quantity with units e.g. "10 PCS", "5 NOS", "2 BOX", "1.5 KG"
    let explicitQty = null;
    let detectedUnit = "pcs";
    const unitQtyMatch = lineText.match(/\b([0-9]+(?:\.[0-9]{1,2})?)\s*(pcs|pc|nos|no|box|boxes|pkt|pkts|kg|kgs|mtr|mtrs|set|sets|ctn|bag|bags|doz|dz|pairs?|units?|gm|gms)\b/i);
    if (unitQtyMatch && parseFloat(unitQtyMatch[1]) > 0) {
      explicitQty = parseFloat(unitQtyMatch[1]);
      detectedUnit = unitQtyMatch[2].toLowerCase();
    }

    // B. Detect HSN code if present (4 to 8 digit standard GST HSN)
    let detectedHsn = "";
    const hsnMatch = lineText.match(/\b(?:hsn|sac)?\s*[:#]?\s*([1-9][0-9]{3,7})\b/i);
    if (hsnMatch && parseInt(hsnMatch[1]) >= 1000) {
      detectedHsn = hsnMatch[1];
    }

    // C. Detect Barcode or Item Code if present
    let detectedBarcode = "";
    const codeMatch = lineText.match(/\b([A-Za-z0-9]{3,12}-[A-Za-z0-9]{2,10})\b/);
    if (codeMatch) {
      detectedBarcode = codeMatch[1];
    }

    // D. Detect row-level GST rate
    let rowGst = pageDefaultGst;
    const rowSplitMatch = lineText.match(/(?:cgst|sgst)\s*[@:]?\s*(2\.5|6|9|14)\s*%/i);
    if (rowSplitMatch) {
      rowGst = parseFloat(rowSplitMatch[1]) * 2;
    } else {
      const rowGstMatch = lineText.match(/(?:gst|igst|tax)?\s*[@:]?\s*(0|0\.25|3|5|12|18|28)\s*%/i);
      if (rowGstMatch && rowGstMatch[1]) {
        rowGst = parseFloat(rowGstMatch[1]);
      } else {
        const anyPctMatch = lineText.match(/\b(3|5|12|18|28)\s*%/);
        if (anyPctMatch) {
          rowGst = parseFloat(anyPctMatch[1]);
        }
      }
    }

    // E. Detect row-level Less / Discount (छूट)
    let rowLess = 0;
    let rowLessType = "flat";
    const lessPctMatch = lineText.match(/(?:less|disc|discount|dis)\s*[@:]?\s*([0-9]+(?:\.[0-9]{1,2})?)\s*%/i);
    if (lessPctMatch) {
      rowLess = parseFloat(lessPctMatch[1]);
      rowLessType = "%";
    } else {
      const lessFlatMatch = lineText.match(/(?:less|disc|discount)\s*[@:]?\s*(?:₹|Rs\.?)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
      if (lessFlatMatch && parseFloat(lessFlatMatch[1]) > 0) {
        rowLess = parseFloat(lessFlatMatch[1]);
        rowLessType = "flat";
      }
    }

    const matches = [...lineText.matchAll(numberExtractRegex)];
    // Filter out:
    // - Numbers matching detectedHsn (prevents picking HSN e.g. 8414 or 3209 as price/total!)
    // - 6 to 8 digit integers (barcodes, pin codes)
    // - 4-digit years (2020-2035)
    // - Numbers that exceed totalAmount (if totalAmount > 0)
    const validNumMatches = matches.filter((m) => {
      const rawVal = m[1].replace(/,/g, "");
      const val = parseFloat(rawVal);
      if (isNaN(val) || val <= 0) return false;
      if (detectedHsn && rawVal === detectedHsn) return false;
      if (val >= 100000 && val <= 99999999 && Number.isInteger(val)) return false;
      if (val >= 2020 && val <= 2035 && Number.isInteger(val)) return false;
      if (totalAmount > 0 && val > totalAmount * 1.05) return false;
      return true;
    });

    if (validNumMatches.length >= 1) {
      let numbers = validNumMatches.map((m) => parseFloat(m[1].replace(/,/g, ""))).filter((n) => n > 0);

      // If line starts with serial number like "1.", "2 ", ignore first number if it equals leading serial no
      const srMatch = trimmedLine.match(/^(\d{1,2})[\.\s\-]/);
      if (srMatch && numbers.length > 2 && numbers[0] === parseFloat(srMatch[1])) {
        numbers = numbers.slice(1);
      }

      let rowAmt = 0;
      let qty = explicitQty || 1;
      let detectedPreGstRate = 0;
      let detectedWithGstRate = 0;

      if (numbers.length >= 2) {
        // Priority 1: Check if any pair (q, r) multiplies to equal a third candidate (total)
        let foundTrio = false;
        for (let a = 0; a < numbers.length; a++) {
          for (let b = 0; b < numbers.length; b++) {
            if (a === b) continue;
            const qCand = numbers[a];
            const rCand = numbers[b];
            if (qCand <= 0 || rCand <= 0 || qCand > 10000) continue;

            const expectedTot = qCand * rCand;
            for (let c = 0; c < numbers.length; c++) {
              if (c === a || c === b) continue;
              const tCand = numbers[c];
              if (Math.abs(expectedTot - tCand) <= Math.max(1.5, tCand * 0.02) ||
                  (rowGst > 0 && Math.abs((expectedTot * (1 + rowGst / 100)) - tCand) <= Math.max(1.5, tCand * 0.02))) {
                qty = explicitQty || qCand;
                detectedWithGstRate = (qty === qCand) ? rCand : Math.round((tCand / qty) * 100) / 100;
                rowAmt = tCand;
                foundTrio = true;
                break;
              }
            }
            if (foundTrio) break;
          }
          if (foundTrio) break;
        }

        if (!foundTrio) {
          // In standard tabular bills (ordered left-to-right), the row total is the LAST number in the row
          const lastNum = numbers[numbers.length - 1];
          const secondLastNum = numbers[numbers.length - 2];

          if (explicitQty) {
            qty = explicitQty;
            rowAmt = lastNum;
            detectedWithGstRate = (secondLastNum > 0 && Math.abs(qty * secondLastNum - lastNum) < 2)
              ? secondLastNum
              : Math.round((lastNum / qty) * 100) / 100;
          } else if (numbers.length >= 3 && numbers[0] <= 1000 && numbers[0] >= 1) {
            qty = numbers[0];
            detectedWithGstRate = numbers[1];
            rowAmt = numbers[2];
          } else {
            rowAmt = lastNum;
            qty = 1;
            detectedWithGstRate = lastNum;
          }
        }
      } else {
        rowAmt = numbers[0];
        qty = explicitQty || 1;
        detectedWithGstRate = Math.round((rowAmt / qty) * 100) / 100;
      }

      // Safeguards: Ensure row amount does not exceed bill total
      qty = Math.max(0.01, Number(qty) || 1);
      if (totalAmount > 0 && rowAmt > totalAmount * 1.05) {
        continue;
      }

      let unitWithGst = detectedWithGstRate > 0 ? detectedWithGstRate : Math.round((rowAmt / qty) * 100) / 100;
      let unitPreGst = detectedPreGstRate > 0 
        ? detectedPreGstRate 
        : (rowGst > 0 ? Math.round((unitWithGst / (1 + rowGst / 100)) * 100) / 100 : unitWithGst);

      // Apply Less if detected
      let netPreGst = unitPreGst;
      if (rowLess > 0) {
        const lessDeduction = rowLessType === "%" ? (unitPreGst * rowLess / 100) : rowLess;
        netPreGst = Math.max(0, unitPreGst - lessDeduction);
        unitWithGst = Math.round((netPreGst * (1 + rowGst / 100)) * 100) / 100;
      }

      if (rowAmt === 0 && unitWithGst > 0) {
        rowAmt = Math.round(qty * unitWithGst * 100) / 100;
      }

      const taxableValue = Math.round(qty * netPreGst * 100) / 100;
      const gstVal = Math.round((rowAmt - taxableValue) * 100) / 100;

      if (rowAmt > 0 && (totalAmount === 0 || rowAmt <= totalAmount * 1.05)) {
        let rawItemName = lineText
          .replace(numberExtractRegex, "")
          .replace(/\b(?:pcs|pc|nos|no|box|boxes|pkt|pkts|kg|kgs|mtr|mtrs|set|sets|ctn|bag|bags|doz|dz)\b/gi, "")
          .replace(/^[\d\s().-]+/, "")
          .replace(/[:#|-]+/g, " ")
          .trim();

        if (rawItemName.length >= 2 && !/^(pcs|kg|nos|mtr|box|total|amount|rate|qty|tax|gst|subtotal|balance|date|due)$/i.test(rawItemName)) {
          let resolvedName = rawItemName.slice(0, 60);
          let isAutoMapped = false;
          let originalVendorName = rawItemName;

          const aliasKey = rawItemName.toLowerCase().trim();
          if (itemAliases[aliasKey]) {
            resolvedName = itemAliases[aliasKey].mappedName || resolvedName;
            if (!detectedBarcode && itemAliases[aliasKey].barcode) {
              detectedBarcode = itemAliases[aliasKey].barcode;
            }
            if (!detectedHsn && itemAliases[aliasKey].hsnCode) {
              detectedHsn = itemAliases[aliasKey].hsnCode;
            }
            isAutoMapped = true;
          }

          items.push({
            id: `item_${items.length + 1}`,
            name: resolvedName,
            rawVendorName: originalVendorName,
            isAutoMapped: isAutoMapped,
            qty: qty,
            unit: detectedUnit,
            barcode: detectedBarcode,
            hsnCode: detectedHsn,
            preGstRate: unitPreGst,
            withGstRate: unitWithGst,
            rate: unitWithGst,
            gstRate: rowGst,
            less: rowLess,
            lessType: rowLessType,
            taxableAmount: taxableValue,
            gstAmount: gstVal,
            amount: rowAmt,
          });
        }
      }
    }
  }

  // If no specific lines were extracted, provide a single editable item equal to detectedAmount
  if (items.length === 0) {
    const singleAmt = totalAmount || 0;
    const defaultGst = pageDefaultGst || 0;
    const defaultPre = defaultGst > 0 ? Math.round((singleAmt / (1 + defaultGst / 100)) * 100) / 100 : singleAmt;
    items.push({
      id: "item_1",
      name: `बिल सामान विवरण (पेज ${pageNum})`,
      rawVendorName: `बिल सामान विवरण (पेज ${pageNum})`,
      isAutoMapped: false,
      qty: 1,
      unit: "pcs",
      barcode: "",
      hsnCode: "",
      preGstRate: defaultPre,
      withGstRate: singleAmt,
      rate: singleAmt,
      gstRate: defaultGst,
      less: 0,
      lessType: "flat",
      taxableAmount: defaultPre,
      gstAmount: Math.round((singleAmt - defaultPre) * 100) / 100,
      amount: singleAmt,
    });
  }

  return items;
};

/**
 * Parses a multi-page PDF into separate page images and auto-detects bill details per page
 * Handles:
 * 1. Rendering each page to a crisp JPEG image
 * 2. Visual line-based smart text recognition (Invoice No, Date, Party Name, Grand Total, Line Items)
 */
export const extractPagesAndBillsFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/standard_fonts/",
    });
    const pdf = await loadingTask.promise;
    const pages = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);

        // 1. Render page to high-definition image safely
        let imageUrl = "";
        try {
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx, viewport }).promise;
          imageUrl = canvas.toDataURL("image/jpeg", 0.85);
        } catch (imgErr) {
          console.warn(`Page ${pageNum} canvas image render note:`, imgErr);
        }

        // 2. Extract text items and reconstruct visual lines safely
        let rawText = "";
        let visualLines = [];
        try {
          const textContent = await page.getTextContent();
          rawText = textContent.items.map((item) => item.str).join(" ");
          visualLines = reconstructVisualLines(textContent.items);
        } catch (txtErr) {
          console.warn(`Page ${pageNum} text extract note:`, txtErr);
        }

        // 3. Smart Detection for Bill Fields
        const detectedAmount = detectGrandTotal(visualLines, rawText);
        const detectedBillNo = detectBillNumber(visualLines, rawText, pageNum);
        const detectedDate = detectBillDate(visualLines, rawText);
        const detectedParty = detectPartyName(visualLines, rawText, pageNum);
        const detectedItems = detectLineItems(visualLines, detectedAmount, pageNum, rawText);

        const itemsTotal = detectedItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
        let finalPageTotal = detectedAmount;
        if (itemsTotal > 0 && (finalPageTotal === 0 || Math.abs(finalPageTotal - itemsTotal) > itemsTotal * 0.4)) {
          finalPageTotal = Math.round(itemsTotal * 100) / 100;
        }

        pages.push({
          pageNumber: pageNum,
          imageUrl,
          rawText,
          billNumber: detectedBillNo,
          date: detectedDate,
          partyName: detectedParty,
          totalAmount: finalPageTotal || 0,
          items: detectedItems,
          isSelected: true,
        });
      } catch (pErr) {
        console.warn(`Skipping page ${pageNum} due to parse error:`, pErr);
      }
    }

    return pages;
  } catch (err) {
    console.error("PDF extraction error:", err);
    throw err;
  }
};