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

  const numberExtractRegex = /(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/g;

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
      /(?:grand\s*total|invoice\s*total|net\s*payable|total\s*payable|total\s*invoice\s*value|gross\s*total)[\s\:\₹\Rs\.\-]*([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi
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
/**
 * Smart detection of individual line items from invoice table rows.
 * Reliably extracts item name, quantity (with units), unit rate, and total amount.
 * Strictly excludes:
 * - Table header row
 * - All address, location, PIN codes, phone/mobile numbers
 * - Buyer / Seller / Vendor header details
 * - Transporter, E-way bill, Vehicle, and Challan lines
 * - Subtotals, taxes (CGST/SGST/IGST), Round off, Grand totals, Bank details, and Terms
 */
const detectLineItems = (lines, totalAmount, pageNum, rawText = "") => {
  const items = [];
  // Standardized regex for comma-separated currency amounts with mandatory comma in multi-digit grouping
  const numberExtractRegex = /(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/g;

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

  // 2. Identify Table Header index & Column Ordering (Where actual item rows begin)
  const isTableHeaderRegex = /(?:(?:description|particulars|item|product|goods|details).*(?:qty|quantity|rate|price|mrp|amount|value|taxable|hsn|sac)|^(?:sl|sr|s\.no|sno|#|item\s*no)\b)/i;
  let tableHeaderIndex = -1;
  let detectedColumnOrder = "qty_first"; // default: Qty column comes before Rate column

  for (let idx = 0; idx < lines.length; idx++) {
    if (isTableHeaderRegex.test(lines[idx].lineText)) {
      tableHeaderIndex = idx;
      const hText = lines[idx].lineText;
      const qtyMatch = hText.match(/\b(?:qty|quantity|nos|qnty|pkts?|bags?|pcs)\b/i);
      const rateMatch = hText.match(/\b(?:rate|price|mrp|unit\s*price|prc)\b/i);
      if (qtyMatch && rateMatch && qtyMatch.index !== undefined && rateMatch.index !== undefined) {
        if (rateMatch.index < qtyMatch.index) {
          detectedColumnOrder = "rate_first";
        } else {
          detectedColumnOrder = "qty_first";
        }
      }
      break;
    }
  }

  // 3. Strict Exclusion Regex for Header Metadata, Address, Contact, and Registration details
  const addressAndContactRegex = /(?:pin[\s\:\-\.]*\d{4,6}|pincode|pin\s*code|address|addr|road|street|nagar|colony|marg|chowk|ward|plot|floor|flat|shop\s*no|complex|plaza|near|opp|opposite|behind|beside|dist|district|tehsil|state\s*code|mob(?:ile)?[\s\:\-\.]*\d|phone|ph[\s\:\-\.]*\d|tel|contact|call|whatsapp|email|@|\.com\b|\.in\b|website|www\.)/i;
  const partyAndInvoiceMetaRegex = /(?:bill\s*to|billed\s*to|buyer|consignee|ship\s*to|shipped\s*to|deliver\s*to|sold\s*by|supplier|seller|vendor|party\s*name|customer\s*name|client\s*name|transporter|transport|vehicle\s*no|veh\s*no|e-?way|eway|challan|lr\s*no|bilty|dispatch|despatch|place\s*of\s*supply|gstin|gst\s*no|pan\s*no|cin\b|fssai|dl\s*no|drug\s*lic|tax\s*invoice|retail\s*invoice|bill\s*of\s*supply|cash\s*memo|original\s*for|duplicate\s*for|triplicate\s*for|invoice\s*no|inv\s*no|bill\s*no|date\s*[:#])/i;

  // 4. Strict Exclusion Regex for Table Summary, Taxes, Round Off, Grand Total, Footer, Banking
  const tableFooterSummaryRegex = /(?:sub\s*total|total\s*taxable|taxable\s*(?:value|amount)|tax\s*amount|gst\s*amount|cgst|sgst|igst|cess|central\s*tax|state\s*tax|integrated\s*tax|output\s*tax|input\s*tax|total\s*tax|total\s*gst|gst\s*total|tax\s*payable|round\s*off|grand\s*total|invoice\s*total|net\s*payable|total\s*payable|balance\s*due|final\s*amount|total\s*amount|net\s*amount|total\s*value|freight|carriage|transport|cartage|loading|unloading|packing|handling|courier|insurance|bank\s*(?:name|a\/c|acc|account)|ifsc|branch|upi\s*id|terms\s*&|terms\s*and|authorized\s*signatory|authorised\s*signatory|for\s+[a-z]|e\.?\s*&\s*o\.?\s*e|jurisdiction|rupees\s*in\s*words|amount\s*in\s*words|amount\s*chargeable)/i;

  // Start from line after Table Header if found, else start after top 30% of lines or line 3
  const startIdx = tableHeaderIndex !== -1 ? tableHeaderIndex + 1 : Math.min(3, Math.floor(lines.length * 0.25));

  for (let i = startIdx; i < lines.length; i++) {
    const { lineText } = lines[i];
    const trimmedLine = lineText.trim();
    if (!trimmedLine) continue;

    // STOP CONDITION: Table items end as soon as table summary/subtotal/total/tax/footer appears
    if (tableFooterSummaryRegex.test(trimmedLine)) {
      break;
    }

    // STRICT REJECTION: Table header row
    if (isTableHeaderRegex.test(trimmedLine)) {
      continue;
    }

    // STRICT REJECTION: Address, PIN Code, Mobile, Buyer/Seller Header, Registration Details
    if (addressAndContactRegex.test(trimmedLine) || partyAndInvoiceMetaRegex.test(trimmedLine)) {
      continue;
    }

    // A. Detect explicit quantity with units e.g. "10 PCS", "5 NOS", "2 BOX", "1.5 KG"
    let explicitQty = null;
    let detectedUnit = "pcs";
    const unitQtyMatch = lineText.match(/\b([0-9]+(?:\.[0-9]{1,2})?)\s*(pcs|pc|nos|no|box|boxes|pkt|pkts|kg|kgs|mtr|mtrs|set|sets|ctn|bag|bags|doz|dz|pairs?|units?|gm|gms|tin|tins|ltr|ltrs|liter|litres)\b/i);
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
        if (anyPctMatch) rowGst = parseFloat(anyPctMatch[1]);
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

    // F. Extract valid numbers excluding PIN, mobile, years, and HSN
    const matches = [...lineText.matchAll(numberExtractRegex)];
    const validNumMatches = matches.filter((m) => {
      const rawVal = m[1].replace(/,/g, "");
      const val = parseFloat(rawVal);
      if (isNaN(val) || val <= 0) return false;
      if (detectedHsn && rawVal === detectedHsn) return false;
      if (val >= 100000 && val <= 99999999 && Number.isInteger(val)) return false; // PIN code / large code
      if (val >= 1000000000) return false; // Mobile number
      if (val >= 2020 && val <= 2035 && Number.isInteger(val)) return false; // Year
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

      // If only 1 number and it's a small integer without explicit unit/item context, skip it (likely a serial/ward/page number)
      if (numbers.length === 1 && !explicitQty && numbers[0] <= 50 && Number.isInteger(numbers[0])) {
        continue;
      }

      let rowAmt = 0;
      let qty = explicitQty || 1;
      let detectedPreGstRate = 0;
      let detectedWithGstRate = 0;

      // Smart resolution of Trio (q * r = t) with column-order and unit awareness
      let bestTrio = null;
      if (numbers.length >= 2) {
        for (let c = numbers.length - 1; c >= 0; c--) {
          const tCand = numbers[c];
          if (tCand <= 0) continue;
          if (totalAmount > 0 && tCand > totalAmount * 1.05) continue;

          for (let a = 0; a < numbers.length; a++) {
            if (a === c) continue;
            for (let b = 0; b < numbers.length; b++) {
              if (b === c || b === a) continue;

              const numA = numbers[a];
              const numB = numbers[b];
              if (numA <= 0 || numB <= 0) continue;

              const prod = numA * numB;
              const matchesPlain = Math.abs(prod - tCand) <= Math.max(1.5, tCand * 0.02);
              const matchesGst = rowGst > 0 && Math.abs((prod * (1 + rowGst / 100)) - tCand) <= Math.max(1.5, tCand * 0.02);

              if (matchesPlain || matchesGst) {
                let candQ = numA;
                let candR = numB;

                // Rule 1: If explicitQty was matched from regex (e.g. "50 KG"), that number is QTY
                if (explicitQty && (Math.abs(numA - explicitQty) < 0.01 || Math.abs(numB - explicitQty) < 0.01)) {
                  if (Math.abs(numA - explicitQty) < 0.01) {
                    candQ = numA;
                    candR = numB;
                  } else {
                    candQ = numB;
                    candR = numA;
                  }
                } 
                // Rule 2: Column order based on table header or standard left-to-right invoice format
                else if (detectedColumnOrder === "rate_first") {
                  candR = (a < b) ? numA : numB;
                  candQ = (a < b) ? numB : numA;
                } else {
                  // Standard: Qty column comes before Rate column (a < b)
                  candQ = (a < b) ? numA : numB;
                  candR = (a < b) ? numB : numA;
                }

                // NOTE: Never swap based on number magnitude! (Supports high-volume trade like TMT steel, cement, bricks)

                bestTrio = {
                  qty: candQ,
                  rate: candR,
                  amount: tCand,
                  isGstIncluded: matchesGst && !matchesPlain
                };
                break;
              }
            }
            if (bestTrio) break;
          }
          if (bestTrio) break;
        }
      }

      if (bestTrio) {
        qty = bestTrio.qty;
        rowAmt = bestTrio.amount;
        detectedWithGstRate = bestTrio.isGstIncluded ? Math.round((bestTrio.amount / qty) * 100) / 100 : bestTrio.rate;
        detectedPreGstRate = bestTrio.isGstIncluded ? bestTrio.rate : 0;
      } else if (numbers.length >= 2) {
        // Fallback for non-multiplication lines
        const lastNum = numbers[numbers.length - 1];
        const secondLastNum = numbers[numbers.length - 2];

        if (explicitQty) {
          qty = explicitQty;
          rowAmt = lastNum;
          detectedWithGstRate = (secondLastNum > 0 && Math.abs(qty * secondLastNum - lastNum) < 2)
            ? secondLastNum
            : Math.round((lastNum / qty) * 100) / 100;
        } else if (numbers.length >= 3) {
          const candQty = (detectedColumnOrder === "rate_first") ? numbers[numbers.length - 2] : numbers[numbers.length - 3];
          const candRate = (detectedColumnOrder === "rate_first") ? numbers[numbers.length - 3] : numbers[numbers.length - 2];
          if (candQty > 0 && candRate > 0) {
            qty = candQty;
            detectedWithGstRate = candRate;
            rowAmt = lastNum;
          } else {
            rowAmt = lastNum;
            qty = 1;
            detectedWithGstRate = lastNum;
          }
        } else {
          const cand = numbers[0];
          rowAmt = lastNum;
          if (detectedColumnOrder === "rate_first") {
            detectedWithGstRate = cand;
            qty = (cand > 0 && rowAmt >= cand) ? Math.round((rowAmt / cand) * 100) / 100 : 1;
          } else {
            qty = cand > 0 ? cand : 1;
            detectedWithGstRate = Math.round((rowAmt / qty) * 100) / 100;
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
        // Clean item name: Find where column numbers begin and extract item description cleanly
        let rawItemName = trimmedLine.replace(/^\d{1,3}[\.\s\)-]+\s*/, "");
        
        // Find position of the first table column (HSN or first number match)
        let firstColIndex = -1;
        if (detectedHsn) {
          firstColIndex = rawItemName.indexOf(detectedHsn);
        }
        if (firstColIndex === -1 && validNumMatches.length > 0) {
          const firstNumRaw = validNumMatches[0][0];
          firstColIndex = rawItemName.indexOf(firstNumRaw);
        }

        if (firstColIndex > 3) {
          rawItemName = rawItemName.slice(0, firstColIndex).trim();
        } else {
          rawItemName = rawItemName
            .replace(numberExtractRegex, "")
            .replace(/\b(?:pcs|pc|nos|no|box|boxes|pkt|pkts|kg|kgs|mtr|mtrs|set|sets|ctn|bag|bags|doz|dz|tin|tins|ltr|ltrs|liter|litres)\b/gi, "")
            .replace(/[:#|-]+/g, " ")
            .trim();
        }

        // Must have at least 2 alphabetic characters and not be generic keywords
        if (rawItemName.length >= 2 && /[A-Za-z\u0900-\u097F]{2,}/.test(rawItemName) &&
            !/^(pcs|kg|nos|mtr|box|tin|total|amount|rate|qty|tax|gst|subtotal|balance|date|due)$/i.test(rawItemName)) {
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

  // --- Post-Processing: Mathematical Reconciliation with Bill Total & Cross-Validation ---
  if (items.length > 0) {
    // 1. Eliminate any accidental Total/Subtotal row masquerading as an item
    const summaryNamePattern = /\b(?:total|subtotal|sub\s*total|net\s*amt|net\s*payable|grand\s*total|balance|taxable\s*amt|taxable\s*value|round\s*off)\b/i;
    let filteredItems = items.filter((it) => {
      if (items.length > 1 && totalAmount > 0) {
        if (Math.abs(it.amount - totalAmount) < 2 && summaryNamePattern.test(it.name)) {
          return false;
        }
      }
      return true;
    });

    // 2. Strict Cross-verification: qty * rate = amount for every item row
    filteredItems = filteredItems.map((it) => {
      let q = Math.max(0.001, Number(it.qty) || 1);
      let r = Number(it.rate) || Number(it.withGstRate) || 0;
      let amt = Number(it.amount) || 0;

      // Ensure mathematical integrity of row: amount = qty * rate
      if (amt > 0) {
        const expected = q * r;
        if (r <= 0 || Math.abs(expected - amt) > Math.max(2, amt * 0.02)) {
          r = Math.round((amt / q) * 100) / 100;
        }
      } else if (q > 0 && r > 0) {
        amt = Math.round(q * r * 100) / 100;
      }

      const preRate = it.gstRate > 0 ? Math.round((r / (1 + it.gstRate / 100)) * 100) / 100 : r;
      const taxable = Math.round(q * preRate * 100) / 100;
      const gstAmt = Math.round((amt - taxable) * 100) / 100;

      return {
        ...it,
        qty: q,
        rate: r,
        withGstRate: r,
        preGstRate: preRate,
        taxableAmount: taxable,
        gstAmount: gstAmt,
        amount: amt,
      };
    });

    // 3. Mathematical Reconciliation against Grand Total (totalAmount)
    const sumItems = filteredItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

    if (totalAmount > 0 && sumItems > 0) {
      // Scenario A: Exact or near match within ₹5 (Direct Match or minor Round-off)
      if (Math.abs(sumItems - totalAmount) <= Math.max(5, totalAmount * 0.005)) {
        // Items match Grand Total directly!
      }
      // Scenario B: Items are pre-tax (Taxable Subtotal) and totalAmount includes GST
      else if (pageDefaultGst > 0 && Math.abs(sumItems * (1 + pageDefaultGst / 100) - totalAmount) <= Math.max(5, totalAmount * 0.01)) {
        filteredItems = filteredItems.map((it) => {
          const inclusiveRate = Math.round(it.rate * (1 + pageDefaultGst / 100) * 100) / 100;
          const inclusiveAmt = Math.round(it.qty * inclusiveRate * 100) / 100;
          return {
            ...it,
            gstRate: pageDefaultGst,
            preGstRate: it.rate,
            withGstRate: inclusiveRate,
            rate: inclusiveRate,
            amount: inclusiveAmt,
            taxableAmount: it.amount,
            gstAmount: Math.round((inclusiveAmt - it.amount) * 100) / 100,
          };
        });
      }
      // Scenario C: Single item detected whose amount was parsed lower than bill total
      else if (filteredItems.length === 1 && totalAmount > filteredItems[0].amount) {
        const singleIt = filteredItems[0];
        singleIt.amount = totalAmount;
        if (singleIt.qty > 0) {
          singleIt.rate = Math.round((totalAmount / singleIt.qty) * 100) / 100;
          singleIt.withGstRate = singleIt.rate;
        }
      }
    }

    return filteredItems;
  }

  return items;
};

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
        
        // Reconcile page total amount with items total:
        let finalPageTotal = detectedAmount;
        if (detectedAmount <= 0) {
          finalPageTotal = itemsTotal > 0 ? Math.round(itemsTotal * 100) / 100 : 0;
        } else if (itemsTotal > 0 && Math.abs(itemsTotal - detectedAmount) <= Math.max(5, detectedAmount * 0.01)) {
          // If items sum is within 1% or ₹5 (round-off), keep exact detectedAmount from bill footer
          finalPageTotal = detectedAmount;
        } else if (itemsTotal > 0 && detectedAmount > 0 && Math.abs(itemsTotal - detectedAmount) > detectedAmount * 0.5) {
          // If detectedAmount was way off while items are comprehensive, trust items
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