/**
 * Authoritative deduplication and merger of bills across local offline storage
 * and server response. Prevents optimistic manual sales from disappearing on refresh.
 */
export function deduplicateBills(bills = []) {
  if (!Array.isArray(bills)) return [];

  const seenIds = new Set();
  const seenFingerprints = new Set();
  const result = [];

  // Server bills (ObjectId 24-char hex or Supabase UUID) come first before local temp bills
  const sorted = [...bills].sort((a, b) => {
    const aId = String(a?._id || a?.id || "");
    const bId = String(b?._id || b?.id || "");
    const aIsTemp = aId.startsWith("SALE-") || aId.startsWith("mock_") || aId.startsWith("temp_") || aId.length < 12;
    const bIsTemp = bId.startsWith("SALE-") || bId.startsWith("mock_") || bId.startsWith("temp_") || bId.length < 12;
    if (aIsTemp && !bIsTemp) return 1;
    if (!aIsTemp && bIsTemp) return -1;
    return 0;
  });

  for (const bill of sorted) {
    if (!bill) continue;
    const id = String(bill._id || bill.id || "");
    const isTemp = id.startsWith("SALE-") || id.startsWith("mock_") || id.startsWith("temp_") || id.length < 12;

    let dateStr = "";
    if (bill.rawDate || bill.date) {
      try {
        const d = new Date(bill.rawDate || bill.date);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().slice(0, 10);
        }
      } catch (e) {}
    }

    const amtNorm = Number(bill.amount || bill.finalAmount || bill.total || 0).toFixed(2);
    const partyNorm = String(bill.customerName || bill.partyName || "").trim().toLowerCase();
    const typeNorm = String(bill.type || bill.paymentMode || "CASH").toUpperCase();

    // Fingerprint represents business identity: party + amount + date + paymentMode
    const fp = `${partyNorm}|${amtNorm}|${dateStr}|${typeNorm}`;

    if (id && seenIds.has(id)) {
      continue;
    }

    if (isTemp && seenFingerprints.has(fp)) {
      continue;
    }

    const amtVal = Number(bill.amount || bill.finalAmount || bill.total || bill.totalAmount || bill.grandTotal || 0);
    const pmVal = String(bill.paymentMode || bill.paymentMethod || bill.type || "CASH").toUpperCase();
    const billNum = bill.billNumber || bill.invoiceNumber || bill.invoiceNo || bill.id || bill._id || "BILL-001";
    const custName = bill.customerName || bill.partyName || bill.customer || "काउंटर नकद ग्राहक";

    const normalizedBill = {
      ...bill,
      _id: bill._id || bill.id || billNum,
      id: bill.id || bill._id || billNum,
      billNumber: billNum,
      customerName: custName,
      customer: custName,
      amount: amtVal,
      finalAmount: amtVal,
      total: amtVal,
      totalAmount: amtVal,
      grandTotal: amtVal,
      type: pmVal,
      paymentMode: pmVal,
      paymentMethod: pmVal === "CREDIT" || pmVal === "UDHAR" ? "credit" : "cash",
      rawDate: bill.rawDate || bill.date || bill.createdAt || new Date().toISOString(),
      date: bill.date || bill.rawDate || "Today"
    };

    if (id) seenIds.add(id);
    seenFingerprints.add(fp);
    result.push(normalizedBill);
  }

  // Sort descending by date
  return result.sort((a, b) => {
    const da = new Date(a.rawDate || a.date || a.createdAt || 0).getTime();
    const db = new Date(b.rawDate || b.date || b.createdAt || 0).getTime();
    return db - da;
  });
}

export default deduplicateBills;
