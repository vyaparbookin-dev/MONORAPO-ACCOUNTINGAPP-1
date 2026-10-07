/**
 * 3. BILL ENTRY BUILDER
 * Groups matched items into structured arrays for frontend review modal:
 * - readyLines: Auto-linked items (Exact / Barcode / Alias / High confidence)
 * - pendingConfirmation: Needs quick merchant confirm tap (with top 3 suggestions)
 * - unmatched: Not in catalog (Offer to link or create new item)
 */
export function buildBillEntry({ matchedItems = [], billMeta = {} }) {
  const readyLines = [];
  const pendingConfirmation = [];
  const unmatched = [];

  for (const item of matchedItems) {
    const pId = item.product?._id || item.product?.id || null;
    const pName = item.product?.name || item.rawName;
    const price = Number(item.rate ?? item.product?.sellingPrice ?? item.product?.price ?? 0);
    const qty = Number(item.qty || 1);
    const total = Number(item.amount ?? (qty * price).toFixed(2));

    const line = {
      productId: pId,
      name: pName,
      rawName: item.rawName,
      hsn: item.hsn || item.product?.hsnCode || "",
      quantity: qty,
      rate: price,
      price: price,
      total: total,
      unit: item.product?.unit || "Pcs",
      confidence: item.confidence,
      matchType: item.matchType,
    };

    if (["exact", "exact-barcode", "alias-memory", "high-confidence"].includes(item.matchType)) {
      readyLines.push(line);
    } else if (item.matchType === "needs-confirmation") {
      pendingConfirmation.push({
        ...line,
        candidates: (item.candidates || []).map(c => ({
          productId: c.product?._id || c.product?.id,
          name: c.product?.name,
          price: c.product?.sellingPrice || c.product?.price || 0,
          confidence: c.confidence
        }))
      });
    } else {
      unmatched.push(line);
    }
  }

  const additionalCharges = billMeta.additionalCharges || [];
  const additionalChargesTotal = additionalCharges.reduce((s, c) => s + Number(c.amount || 0), 0);

  const grandTotal = readyLines.reduce((s, it) => s + Number(it.total || 0), 0) +
                     pendingConfirmation.reduce((s, it) => s + Number(it.total || 0), 0) +
                     unmatched.reduce((s, it) => s + Number(it.total || 0), 0) +
                     additionalChargesTotal;

  return {
    bill: {
      date: billMeta.date || billMeta.billDate || new Date().toISOString(),
      partyName: billMeta.partyName || "",
      gstin: billMeta.gstin || "",
      invoiceNumber: billMeta.invoiceNumber || "",
      additionalCharges: additionalCharges,
      partyType: billMeta.partyType || "customer",
      billType: billMeta.billType || "sale",
      lines: readyLines,
      status: (pendingConfirmation.length > 0 || unmatched.length > 0) ? "needs-review" : "ready",
      totalAmount: +grandTotal.toFixed(2),
    },
    additionalCharges,
    readyLines,
    pendingConfirmation,
    unmatched,
  };
}
