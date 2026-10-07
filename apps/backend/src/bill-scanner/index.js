import { extractText, parseLineItems, parseBillMetadata } from "./ocrExtractor.js";
import { matchProducts } from "./productMatcher.js";
import { buildBillEntry } from "./billEntryBuilder.js";

/**
 * 4. MAIN ENTRY POINT
 * Coordinates OCR extraction, smart matching with alias memory, and entry building.
 *
 * @param {string|Buffer} filePathOrBuffer
 * @param {Array} productCatalog - Array of products from DB with name, sku, barcode, aliases
 * @param {Object} billMeta - Optional metadata (date, partyName, mimeType)
 */
export async function scanBillToEntry(filePathOrBuffer, productCatalog = [], billMeta = {}) {
  const mimeType = billMeta.mimeType || "image/png";
  const { text, method } = await extractText(filePathOrBuffer, mimeType);
  const metadata = parseBillMetadata(text);
  const mergedMeta = {
    ...metadata,
    ...billMeta,
    partyName: billMeta.partyName || metadata.partyName || "",
    date: billMeta.date || metadata.billDate || "",
    billDate: metadata.billDate || billMeta.date || "",
    invoiceNumber: metadata.invoiceNumber || "",
    gstin: metadata.gstin || "",
    additionalCharges: metadata.additionalCharges || []
  };
  const rawItems = parseLineItems(text);
  const matchedItems = await matchProducts(rawItems, productCatalog);
  const result = buildBillEntry({ matchedItems, billMeta: mergedMeta });

  return {
    success: true,
    source: "bill-scanner-pipeline",
    extractionMethod: method,
    rawText: text,
    scannedCount: rawItems.length,
    partyName: mergedMeta.partyName,
    gstin: mergedMeta.gstin,
    invoiceNumber: mergedMeta.invoiceNumber,
    billDate: mergedMeta.billDate,
    additionalCharges: mergedMeta.additionalCharges,
    ...result
  };
}

export {
  extractText,
  parseLineItems,
  matchProducts,
  buildBillEntry
};

export default {
  scanBillToEntry,
  extractText,
  parseLineItems,
  matchProducts,
  buildBillEntry
};
