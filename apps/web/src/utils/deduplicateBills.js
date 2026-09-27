/**
 * Authoritative deduplication and merger of bills across local offline storage
 * and server response. Prevents optimistic manual sales from disappearing on refresh
 * and eliminates duplicate counting between Cloud (MongoDB) and Local (localStorage).
 */
export function deduplicateBills(bills = []) {
  if (!Array.isArray(bills)) return [];

  const isServerDoc = (b) => {
    const id = String(b?._id || b?.id || '');
    return /^[0-9a-fA-F]{24}$/.test(id) || (!id.startsWith('bill_') && !id.startsWith('temp_') && !b?.isOfflineCreated);
  };

  // 1. Sort authoritative server records first so they claim identity before local temporary clones
  const sorted = [...bills].sort((a, b) => {
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
    if (s.toLowerCase() === "today" || s === "आज") {
      return new Date().toISOString().slice(0, 10);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
  };

  const seenIds = new Set();
  const seenBillNumbers = new Set();
  const seenSignatures = new Set();
  const result = [];

  for (const bill of sorted) {
    if (!bill || typeof bill !== "object") continue;

    const id = String(bill._id || "").trim();
    const localId = String(bill.id || "").trim();
    const billNum = String(bill.billNumber || bill.invoiceNumber || bill.invoiceNo || (localId && !localId.startsWith("bill_") ? localId : "") || "").trim();
    const amtVal = Number(bill.amount ?? bill.finalAmount ?? bill.total ?? bill.totalAmount ?? bill.grandTotal ?? 0);
    const dateKey = extractDateKey(bill.rawDate || bill.date || bill.createdAt);
    const custName = String(bill.customerName || bill.partyName || bill.customer || "").trim().toLowerCase();

    // 1. Check if bill number already claimed by an authoritative record
    if (billNum && seenBillNumbers.has(billNum.toLowerCase())) {
      continue;
    }

    // 2. Check if primary MongoDB _id already claimed
    if (id && seenIds.has(id)) {
      continue;
    }

    // 3. Check if localId matches an existing billNumber or id
    if (localId && (seenBillNumbers.has(localId.toLowerCase()) || seenIds.has(localId))) {
      continue;
    }

    // 4. Content signature check: Same date, same amount, same customer
    // Avoids double counting the exact same sale if one has a temp ID and other has a cloud ID
    const signature = `${dateKey}_${amtVal.toFixed(2)}_${custName}`;
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
      date: bill.date && bill.date !== "Today" ? bill.date : dateKey
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
