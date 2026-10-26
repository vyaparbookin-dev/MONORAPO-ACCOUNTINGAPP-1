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
 * Parses a multi-page PDF into separate page images and auto-detects bill details per page
 * Handles:
 * 1. Rendering each page to a crisp JPEG image
 * 2. Smart text recognition (Invoice No, Date, Party Name, Amount)
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

    // 2. Extract text for this page
    const textContent = await page.getTextContent();
    const rawText = textContent.items.map((item) => item.str).join(" ");
    const lines = textContent.items.map((item) => item.str.trim()).filter(Boolean);

    // 3. Smart Regex Detection for Bill Fields
    let detectedAmount = 0;
    let detectedBillNo = `BILL-P${pageNum}-${Date.now().toString().slice(-4)}`;
    let detectedDate = new Date().toISOString().split("T")[0];
    let detectedParty = `Party Page ${pageNum}`;

    // A. Detect Amount (Total / Grand Total / Net Amount)
    const amountMatch = rawText.match(/(?:grand\s*total|total\s*amount|net\s*amount|invoice\s*total|total|amount|balance\s*due)[\s\:\₹\Rs\.]*([\d\,]+(?:\.\d{1,2})?)/i);
    if (amountMatch && amountMatch[1]) {
      const cleanAmt = parseFloat(amountMatch[1].replace(/,/g, ""));
      if (!isNaN(cleanAmt) && cleanAmt > 0) {
        detectedAmount = cleanAmt;
      }
    }

    // B. Detect Bill / Invoice Number
    const billNoMatch = rawText.match(/(?:invoice\s*no|inv\s*no|bill\s*no|voucher\s*no|receipt\s*no|inv\#|bill\#)[\s\.\:\#\-]*([A-Za-z0-9\-\/]{2,20})/i);
    if (billNoMatch && billNoMatch[1]) {
      detectedBillNo = billNoMatch[1].trim();
    }

    // C. Detect Date (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
    const dateMatch = rawText.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/) ||
                      rawText.match(/\b(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/);
    if (dateMatch && dateMatch[1]) {
      try {
        const parts = dateMatch[1].split(/[\/\-\.]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            detectedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          } else {
            // DD-MM-YYYY
            const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            detectedDate = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      } catch (e) {}
    }

    // D. Detect Party Name
    const partyMatch = rawText.match(/(?:m\/s|messrs|to\s*\:|buyer\s*\:|customer\s*\:|party\s*\:|bill\s*to\s*\:)[\s\.]*([^\n\r\,\:\#]{3,35})/i);
    if (partyMatch && partyMatch[1]) {
      detectedParty = partyMatch[1].trim();
    } else if (lines.length > 0) {
      // Fallback: search early lines for business name
      const candidate = lines.slice(0, 5).find(l => l.length > 3 && !/invoice|bill|gstin|phone|tax|date/i.test(l));
      if (candidate) detectedParty = candidate.slice(0, 30).trim();
    }

    pages.push({
      pageNumber: pageNum,
      imageUrl,
      rawText,
      billNumber: detectedBillNo,
      date: detectedDate,
      partyName: detectedParty,
      totalAmount: detectedAmount,
      isSelected: true // checked by default
    });
  }

  return pages;
};
