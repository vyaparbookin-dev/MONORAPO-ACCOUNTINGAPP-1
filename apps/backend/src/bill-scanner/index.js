import { extractText, parseLineItems } from "./ocrExtractor.js";
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
  const rawItems = parseLineItems(text);
  const matchedItems = await matchProducts(rawItems, productCatalog);
  const result = buildBillEntry({ matchedItems, billMeta });

  return {
    success: true,
    source: "bill-scanner-pipeline",
    extractionMethod: method,
    rawText: text,
    scannedCount: rawItems.length,
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
