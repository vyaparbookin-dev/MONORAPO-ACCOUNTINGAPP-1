/**
 * Authoritative deduplication of purchase invoices across local offline storage
 * and MongoDB server responses. Prevents double-counting in inventory and P&L.
 */
export function deduplicatePurchases(purchases = []) {
  if (!Array.isArray(purchases)) return [];

  const seenIds = new Set();
  const seenNumbers = new Set();
  const seenSignatures = new Set();
  const result = [];

  const isServerDoc = (p) => {
    const id = String(p?._id || p?.id || "");
    return /^[0-9a-fA-F]{24}$/.test(id) || (!id.startsWith("pur_") && !id.startsWith("temp_") && !p?.isOfflineCreated);
  };

  // Prioritize server authoritative records first
  const sorted = [...purchases].sort((a, b) => {
    const aServer = isServerDoc(a);
    const bServer = isServerDoc(b);
    if (aServer && !bServer) return -1;
    if (!aServer && bServer) return 1;
    return 0;
  });

  const extractDateKey = (val) => {
    if (!val) return new Date().toISOString().slice(0, 10);
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
  };

  for (const pur of sorted) {
    if (!pur || typeof pur !== "object") continue;

    const id = String(pur._id || pur.id || "").trim();
    const purNum = String(pur.purchaseNumber || pur.billNumber || pur.invoiceNo || pur.invoiceNumber || "").trim().toLowerCase();
    const amtVal = Number(pur.finalAmount ?? pur.totalAmount ?? pur.total ?? pur.amountPaid ?? 0);
    const dateKey = extractDateKey(pur.date || pur.createdAt);
    const suppName = String(pur.supplierName || pur.partyName || pur.supplier || "").trim().toLowerCase();

    // 1. By ID
    if (id && seenIds.has(id)) continue;

    // 2. By Purchase/Bill Number
    if (purNum && seenNumbers.has(purNum)) continue;

    // 3. By Content Signature (Date+Time + Amount + Supplier + ItemCount)
    const timeKey = (() => {
      const raw = pur.date || pur.createdAt;
      if (!raw) return '00:00';
      const d = new Date(raw);
      return isNaN(d.getTime()) ? '00:00' : `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    })();
    const itemCount = Array.isArray(pur.items) ? pur.items.length : 0;
    const sig = `${dateKey}_${timeKey}_${amtVal.toFixed(2)}_${suppName}_${itemCount}`;
    if (amtVal > 0 && seenSignatures.has(sig)) continue;

    if (id) seenIds.add(id);
    if (purNum) seenNumbers.add(purNum);
    if (amtVal > 0) seenSignatures.add(sig);

    result.push(pur);
  }

  return result.sort((a, b) => {
    const da = new Date(a.date || a.createdAt || 0).getTime();
    const db = new Date(b.date || b.createdAt || 0).getTime();
    return db - da;
  });
}

export default deduplicatePurchases;
