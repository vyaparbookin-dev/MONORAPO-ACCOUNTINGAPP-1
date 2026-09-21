/**
 * Authoritative deduplication and merger of bills across local offline storage
 * and server response. Prevents optimistic manual sales from disappearing on refresh.
 */
export function deduplicateBills(bills = []) {
  if (!Array.isArray(bills)) return [];

  const seenIds = new Set();
  const seenBillNumbers = new Set();
  const result = [];

  for (const bill of bills) {
    if (!bill) continue;
    const id = String(bill._id || bill.id || "").trim();
    const billNum = String(bill.billNumber || bill.invoiceNumber || bill.invoiceNo || "").trim();

    // If exact ID already seen, skip duplicate
    if (id && seenIds.has(id)) {
      continue;
    }

    // If non-empty billNumber already seen, skip duplicate
    if (billNum && seenBillNumbers.has(billNum)) {
      continue;
    }

    const amtVal = Number(bill.amount ?? bill.finalAmount ?? bill.total ?? bill.totalAmount ?? bill.grandTotal ?? 0);
    const pmVal = String(bill.paymentMode || bill.paymentMethod || bill.type || "CASH").toUpperCase();
    const fallbackNum = billNum || id || `BILL-${Date.now()}`;
    const custName = bill.customerName || bill.partyName || bill.customer || "काउंटर नकद ग्राहक";

    const normalizedBill = {
      ...bill,
      _id: bill._id || bill.id || fallbackNum,
      id: bill.id || bill._id || fallbackNum,
      billNumber: fallbackNum,
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
    if (billNum) seenBillNumbers.add(billNum);
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
