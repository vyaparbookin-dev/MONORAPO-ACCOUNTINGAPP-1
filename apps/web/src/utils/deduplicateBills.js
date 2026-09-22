/**
 * Authoritative deduplication and merger of bills across local offline storage
 * and server response. Prevents optimistic manual sales from disappearing on refresh.
 */
export function deduplicateBills(bills = []) {
  if (!Array.isArray(bills)) return [];

  const seenIds = new Set();
  const seenBillNumbers = new Set();
  const seenSignatures = new Set();
  const result = [];

  for (const bill of bills) {
    if (!bill || typeof bill !== "object") continue;

    const id = String(bill._id || "").trim();
    const localId = String(bill.id || "").trim();
    const billNum = String(bill.billNumber || bill.invoiceNumber || bill.invoiceNo || "").trim();
    const amtVal = Number(bill.amount ?? bill.finalAmount ?? bill.total ?? bill.totalAmount ?? bill.grandTotal ?? 0);
    const dStr = String(bill.rawDate || bill.date || bill.createdAt || "").slice(0, 10);
    const custName = String(bill.customerName || bill.partyName || bill.customer || "").trim().toLowerCase();

    // 1. Check if non-empty billNumber was already seen
    if (billNum && seenBillNumbers.has(billNum.toLowerCase())) {
      continue;
    }

    // 2. Check if primary MongoDB _id was already seen
    if (id && seenIds.has(id)) {
      continue;
    }

    // 3. Check if localId matches an existing billNumber or id
    if (localId && (seenBillNumbers.has(localId.toLowerCase()) || seenIds.has(localId))) {
      continue;
    }

    // 4. Content signature check: Same date, same amount, same customer
    // Avoids double counting the exact same sale if one has a temp ID and other has a cloud ID
    const signature = `${dStr}_${amtVal.toFixed(2)}_${custName}`;
    if (amtVal > 0 && seenSignatures.has(signature)) {
      continue;
    }

    const pmVal = String(bill.paymentMode || bill.paymentMethod || bill.type || "CASH").toUpperCase();
    const fallbackNum = billNum || (localId && !localId.startsWith("bill_") ? localId : "") || (id && !id.startsWith("bill_") ? id : "") || `BILL-${Date.now()}`;
    const cleanCustName = bill.customerName || bill.partyName || bill.customer || "काउंटर नकद ग्राहक";

    const normalizedBill = {
      ...bill,
      _id: id || localId || fallbackNum,
      id: fallbackNum,
      billNumber: fallbackNum,
      invoiceNumber: fallbackNum,
      customerName: cleanCustName,
      customer: cleanCustName,
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
    if (localId) seenIds.add(localId);
    if (billNum) seenBillNumbers.add(billNum.toLowerCase());
    if (fallbackNum) seenBillNumbers.add(fallbackNum.toLowerCase());
    if (amtVal > 0) seenSignatures.add(signature);

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
