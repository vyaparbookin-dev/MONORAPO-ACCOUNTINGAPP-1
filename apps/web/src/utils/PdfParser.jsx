import * as pdfjsLib from "pdfjs-dist";

// Configure worker reliably for web
if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.2.67"}/pdf.worker.min.mjs`;
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
 * In PDF coordinates, Y increases from bottom to top.
 */
const reconstructVisualLines = (items) => {
  if (!items || items.length === 0) return [];
  const tolerance = 4; // pixels tolerance for grouping into the same horizontal line
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
  // Exclude 4-digit years like 2024, 2025, 2026 if exact integer
  if (num >= 2020 && num <= 2035 && Number.isInteger(num)) return null;
  return num;
};

/**
 * Smart detection of Grand Total / Total Amount from visual lines & text
 */
const detectGrandTotal = (lines, rawText) => {
  const candidateScores = [];

  // Patterns for high confidence grand totals
  const highPriorityRegex = /(?:grand\s*total|invoice\s*total|net\s*payable|total\s*payable|total\s*amount\s*payable|net\s*amount\s*payable|total\s*invoice\s*value|final\s*amount|final\s*total|balance\s*due|bill\s*amount)/i;
  const mediumPriorityRegex = /(?:total\s*amount|net\s*amount|total\s*value)/i;
  const genericTotalRegex = /(?:^|\s)total(?:\s|$|\:)/i;
  const ignorePrefixes = /(?:total\s*qty|total\s*quantity|total\s*items|total\s*discount|taxable|cgst|sgst|igst|cess)/i;

  const numberExtractRegex = /(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/g;

  // 1. Scan visual lines from bottom to top (totals are in lower half)
  for (let idx = lines.length - 1; idx >= 0; idx--) {
    const { lineText, y } = lines[idx];

    let priority = 0;
    if (highPriorityRegex.test(lineText)) {
      priority = 1000;
    } else if (mediumPriorityRegex.test(lineText)) {
      priority = 500;
    } else if (genericTotalRegex.test(lineText) && !ignorePrefixes.test(lineText)) {
      priority = 200;
    }

    if (priority > 0) {
      // Find all numbers in this line
      const matches = [...lineText.matchAll(numberExtractRegex)];
      if (matches.length > 0) {
        // Take the last number in this total line (often the final column amount)
        for (let m = matches.length - 1; m >= 0; m--) {
          const amt = parseCleanAmount(matches[m][1]);
          if (amt && amt > 0) {
            candidateScores.push({
              amount: amt,
              score: priority + amt * 0.01, // slight bonus to higher amount if same label
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

  // 2. Also check full raw text with direct multi-match regex
  const directMatches = [
    ...rawText.matchAll(
      /(?:grand\s*total|invoice\s*total|net\s*payable|total\s*payable|total\s*amount)[\s\:\₹\Rs\.\-]*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi
    ),
  ];
  for (const dm of directMatches) {
    if (dm[1]) {
      const amt = parseCleanAmount(dm[1]);
      if (amt && amt > 0) {
        candidateScores.push({
          amount: amt,
          score: 800,
          label: dm[0],
          lineIndex: -1,
        });
      }
    }
  }

  if (candidateScores.length > 0) {
    // Sort descending by score
    candidateScores.sort((a, b) => b.score - a.score);
    // If top candidates have high priority, choose the maximum amount among top tier
    const topScore = candidateScores[0].score;
    const topCandidates = candidateScores.filter((c) => c.score >= topScore - 200);
    topCandidates.sort((a, b) => b.amount - a.amount);
    return topCandidates[0].amount;
  }

  // 3. Fallback: If no label matched, scan bottom 40% of lines for plausible largest amounts
  const bottomLines = lines.slice(Math.floor(lines.length * 0.5));
  let maxPlausibleAmt = 0;
  for (const bl of bottomLines) {
    if (/tax|cgst|sgst|igst|hsn|rate|qty|discount/i.test(bl.lineText)) continue;
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

  // 3. Inspect top visual lines (lines 0 to 5) for business header
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
 * Parses a multi-page PDF into separate page images and auto-detects bill details per page
 * Handles:
 * 1. Rendering each page to a crisp JPEG image
 * 2. Visual line-based smart text recognition (Invoice No, Date, Party Name, Grand Total)
 */
export const extractPagesAndBillsFromPDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);

    // 1. Render page to high-definition image
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;
    const imageUrl = canvas.toDataURL("image/jpeg", 0.85);

    // 2. Extract text items and reconstruct visual lines
    const textContent = await page.getTextContent();
    const rawText = textContent.items.map((item) => item.str).join(" ");
    const visualLines = reconstructVisualLines(textContent.items);

    // 3. Smart Detection for Bill Fields
    const detectedAmount = detectGrandTotal(visualLines, rawText);
    const detectedBillNo = detectBillNumber(visualLines, rawText, pageNum);
    const detectedDate = detectBillDate(visualLines, rawText);
    const detectedParty = detectPartyName(visualLines, rawText, pageNum);

    pages.push({
      pageNumber: pageNum,
      imageUrl,
      rawText,
      billNumber: detectedBillNo,
      date: detectedDate,
      partyName: detectedParty,
      totalAmount: detectedAmount || 0,
      isSelected: true, // checked by default
    });
  }

  return pages;
};
