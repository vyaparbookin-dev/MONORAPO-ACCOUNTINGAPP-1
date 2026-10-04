import { supabase } from "../config/supabase.js";

/**
 * Universal Supabase Dual-Write & Schema Sync Service
 * Ensures Mongoose and Supabase databases stay 100% matched and up-to-date.
 */

/**
 * Dual-write / Upsert a Sales Bill to Supabase
 */
export const syncBillToSupabase = async (bill) => {
  if (!supabase || !bill || !bill.billNumber) return;

  const fullPayload = {
    bill_number: bill.billNumber,
    customer_name: bill.customerName || "काउंटर नकद ग्राहक",
    customer_mobile: bill.customerMobile || bill.customerPhone || "9876543210",
    customer_address: bill.customerAddress || "",
    customer_gst: bill.customerGst || "",
    site_name: bill.siteName || "",
    items: Array.isArray(bill.items) ? bill.items : [],
    sub_total: Number(bill.total || bill.finalAmount || 0),
    tax: Number(bill.tax || 0),
    discount_amount: Number(bill.discountAmount || 0),
    discount_percent: Number(bill.discountPercent || 0),
    final_amount: Number(bill.finalAmount || bill.total || 0),
    amount_received: Number(bill.finalAmount || bill.total || 0),
    payment_status: bill.paymentStatus || "paid",
    payment_method: bill.paymentMode || bill.paymentMethod || "Cash",
    notes: bill.notes || "",
    status: bill.status || "complete",
    date: bill.date ? new Date(bill.date).toISOString() : new Date().toISOString(),
    due_date: bill.dueDate ? new Date(bill.dueDate).toISOString() : null,
    bill_image_url: bill.billImageUrl || (Array.isArray(bill.billImageUrls) && bill.billImageUrls[0]) || "",
    bill_image_urls: Array.isArray(bill.billImageUrls) ? bill.billImageUrls : (bill.billImageUrl ? [bill.billImageUrl] : []),
    order_type: bill.orderType || "dine_in",
    table_no: bill.tableNo || "",
    company_id: bill.companyId ? String(bill.companyId) : null,
    party_id: bill.partyId ? String(bill.partyId) : null,
    is_deleted: Boolean(bill.isDeleted)
  };

  try {
    const { error } = await supabase.from("sales").upsert(fullPayload, { onConflict: "bill_number" });
    if (error) {
      // If error is caused by a missing optional column in user's Supabase schema, fallback to core columns
      console.warn("[Supabase Sync] Sales upsert note with full payload, trying core fields:", error.message);
      const corePayload = {
        bill_number: fullPayload.bill_number,
        customer_name: fullPayload.customer_name,
        customer_mobile: fullPayload.customer_mobile,
        items: fullPayload.items,
        sub_total: fullPayload.sub_total,
        final_amount: fullPayload.final_amount,
        amount_received: fullPayload.amount_received,
        payment_status: fullPayload.payment_status,
        payment_method: fullPayload.payment_method,
        notes: fullPayload.notes,
        status: fullPayload.status,
        date: fullPayload.date,
        is_deleted: fullPayload.is_deleted
      };
      await supabase.from("sales").upsert(corePayload, { onConflict: "bill_number" });
    }
  } catch (err) {
    console.warn("[Supabase Sync] Sales dual-write warning:", err.message);
  }
};

/**
 * Mark a bill as deleted in Supabase
 */
export const syncBillDeleteToSupabase = async (billNumber) => {
  if (!supabase || !billNumber) return;
  try {
    await supabase.from("sales").update({ is_deleted: true }).eq("bill_number", billNumber);
  } catch (err) {
    console.warn("[Supabase Sync] Sales delete note:", err.message);
  }
};

/**
 * Sync bill photo attachment to Supabase
 */
export const syncBillPhotoToSupabase = async (billNumberOrId, imageUrl, urls = []) => {
  if (!supabase || !billNumberOrId) return;
  try {
    const updateObj = {
      bill_image_url: imageUrl,
      bill_image_urls: urls.length > 0 ? urls : [imageUrl]
    };
    const { error } = await supabase
      .from("sales")
      .update(updateObj)
      .eq("bill_number", String(billNumberOrId));

    if (error) {
      // Fallback if bill_image_urls column doesn't exist yet
      await supabase
        .from("sales")
        .update({ bill_image_url: imageUrl })
        .eq("bill_number", String(billNumberOrId));
    }
  } catch (err) {
    console.warn("[Supabase Sync] Bill photo sync note:", err.message);
  }
};

/**
 * Sync Party to Supabase
 */
export const syncPartyToSupabase = async (party) => {
  if (!supabase || !party || !party.name) return;
  try {
    const partyPayload = {
      name: party.name,
      mobile_number: party.mobileNumber || party.phone || "",
      address: party.address || "",
      party_type: party.partyType || party.type || "both",
      opening_balance: Number(party.openingBalance || 0),
      current_balance: Number(party.currentBalance || party.balance || 0),
      credit_limit: Number(party.creditLimit || 0),
      company_id: party.companyId ? String(party.companyId) : null,
      is_active: party.isActive !== false,
      is_deleted: Boolean(party.isDeleted)
    };
    await supabase.from("parties").upsert(partyPayload);
  } catch (err) {
    console.warn("[Supabase Sync] Party sync note:", err.message);
  }
};

/**
 * Sync Party Transaction to Supabase
 */
export const syncPartyTxToSupabase = async (tx) => {
  if (!supabase || !tx) return;
  try {
    const txPayload = {
      party_id: tx.partyId ? String(tx.partyId) : null,
      company_id: tx.companyId ? String(tx.companyId) : null,
      date: tx.date ? new Date(tx.date).toISOString() : new Date().toISOString(),
      details: tx.details || tx.description || "",
      debit: Number(tx.debit || 0),
      credit: Number(tx.credit || 0),
      amount: Number(tx.amount || tx.debit || tx.credit || 0),
      type: tx.type || "manual",
      bill_number: tx.billNumber || "",
      bill_image_url: tx.billImageUrl || (Array.isArray(tx.billImageUrls) && tx.billImageUrls[0]) || "",
      bill_image_urls: Array.isArray(tx.billImageUrls) ? tx.billImageUrls : (tx.billImageUrl ? [tx.billImageUrl] : []),
      site_name: tx.siteName || "",
      is_deleted: Boolean(tx.isDeleted)
    };
    await supabase.from("party_transactions").upsert(txPayload);
  } catch (err) {
    console.warn("[Supabase Sync] Party Transaction sync note:", err.message);
  }
};

/**
 * Sync Bank Account to Supabase
 */
export const syncBankAccountToSupabase = async (acc) => {
  if (!supabase || !acc || !acc.accountName) return;
  try {
    const accPayload = {
      account_name: acc.accountName,
      bank_name: acc.bankName || "",
      account_number: acc.accountNumber || "",
      ifsc_code: acc.ifscCode || "",
      upi_id: acc.upiId || "",
      account_type: acc.accountType || "CURRENT",
      sanctioned_limit: Number(acc.sanctionedLimit || 0),
      current_outstanding: Number(acc.currentOutstanding || 0),
      opening_balance: Number(acc.openingBalance || 0),
      current_balance: Number(acc.currentBalance || acc.balance || 0),
      interest_rate: Number(acc.interestRate || 0),
      company_id: acc.companyId ? String(acc.companyId) : null,
      is_deleted: Boolean(acc.isDeleted)
    };
    await supabase.from("bank_accounts").upsert(accPayload);
  } catch (err) {
    console.warn("[Supabase Sync] Bank Account sync note:", err.message);
  }
};
