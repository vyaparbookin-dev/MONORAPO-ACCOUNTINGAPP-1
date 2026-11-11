import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import crypto from 'crypto';
import { supabase } from "../config/supabase.js";

/**
 * Universal Supabase Dual-Write & Schema Sync Service
 * Ensures Mongoose (MongoDB) and Supabase databases stay 100% matched in real-time.
 */

export function mongoIdToUuid(mongoId) {
  if (!mongoId) return null;
  const str = String(mongoId);
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  const hash = crypto.createHash('md5').update(str).digest('hex');
  const p1 = hash.slice(0, 8);
  const p2 = hash.slice(8, 12);
  const p3 = '4' + hash.slice(13, 16);
  const p4 = 'a' + hash.slice(17, 20);
  const p5 = hash.slice(20, 32);
  return [p1, p2, p3, p4, p5].join('-');
}

/**
 * Dual-write / Upsert a Sales Bill to Supabase
 */
export const syncBillToSupabase = async (bill) => {
  if (!supabase || !bill || !bill.billNumber) return;

  try {
    const bUuid = mongoIdToUuid(bill._id || bill.id);
    const finalAmt = Number(bill.totalAmount || bill.finalAmount || bill.total || 0);
    const subTot = Number(bill.total || (finalAmt - Number(bill.tax || 0)));
    const partyUuid = bill.partyId ? mongoIdToUuid(bill.partyId) : null;

    const payload = {
      id: bUuid,
      company_id: mongoIdToUuid(bill.companyId),
      party_id: partyUuid,
      bill_number: bill.billNumber,
      customer_name: bill.customerName || "काउंटर नकद ग्राहक",
      customer_mobile: bill.customerMobile || bill.customerPhone || "",
      customer_address: bill.customerAddress || null,
      customer_gst: bill.customerGst || null,
      site_name: bill.siteName || null,
      date: bill.date ? new Date(bill.date).toISOString() : (bill.createdAt ? new Date(bill.createdAt).toISOString() : new Date().toISOString()),
      items: Array.isArray(bill.items) ? bill.items : [],
      sub_total: subTot,
      tax_amount: Number(bill.tax || 0),
      discount_amount: Number(bill.discountAmount || 0),
      discount_percent: Number(bill.discountPercent || 0),
      final_amount: finalAmt,
      amount_received: bill.paymentStatus === 'unpaid' ? 0 : (bill.paymentStatus === 'paid' ? finalAmt : Number(bill.amountReceived || bill.paidAmount || 0)),
      payment_status: bill.paymentStatus || bill.status || "paid",
      payment_method: bill.paymentMode || bill.paymentMethod || "cash",
      notes: bill.notes || "",
      status: bill.status || "complete",
      bill_image_url: bill.billImageUrl || (Array.isArray(bill.billImageUrls) && bill.billImageUrls[0]) || null,
      is_deleted: Boolean(bill.isDeleted),
      created_at: bill.createdAt ? new Date(bill.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from("sales").upsert(payload, { onConflict: "id" });
    if (error) {
      console.warn("[Supabase Sync] Sales upsert warning:", error.message);
    }
  } catch (err) {
    console.warn("[Supabase Sync] Sales dual-write warning:", err.message);
  }
};

/**
 * Mark a bill as deleted in Supabase
 */
export const syncBillDeleteToSupabase = async (billNumber, billId) => {
  if (!supabase || (!billNumber && !billId)) return;
  try {
    if (billId) {
      const bUuid = mongoIdToUuid(billId);
      await supabase.from("sales").update({ is_deleted: true }).eq("id", bUuid);
    } else {
      await supabase.from("sales").update({ is_deleted: true }).eq("bill_number", String(billNumber));
    }
  } catch (err) {
    console.warn("[Supabase Sync] Sales delete note:", err.message);
  }
};

/**
 * Sync bill photo attachment to Supabase (Sales and Purchases)
 */
export const syncBillPhotoToSupabase = async (billNumberOrId, imageUrl) => {
  if (!supabase || !billNumberOrId) return;
  try {
    const raw = String(billNumberOrId).trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);

    if (isUuid) {
      await supabase.from("sales").update({ bill_image_url: imageUrl }).eq("id", raw);
      await supabase.from("purchases").update({ bill_image_url: imageUrl }).eq("id", raw);
    } else {
      try {
        const uId = mongoIdToUuid(raw);
        if (uId) {
          await supabase.from("sales").update({ bill_image_url: imageUrl }).eq("id", uId);
          await supabase.from("purchases").update({ bill_image_url: imageUrl }).eq("id", uId);
        }
      } catch (e) {}
    }

    // Also update by bill_number / purchase_number / invoice_number
    await supabase.from("sales").update({ bill_image_url: imageUrl }).eq("bill_number", raw);
    await supabase.from("purchases").update({ bill_image_url: imageUrl }).eq("purchase_number", raw);
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
    const pUuid = mongoIdToUuid(party._id || party.id);
    const partyPayload = {
      id: pUuid,
      company_id: mongoIdToUuid(party.companyId),
      name: party.name,
      party_type: (party.type === 'supplier' || party.partyType === 'supplier') ? 'supplier' : 'customer',
      mobile_number: party.mobileNumber || party.phone || "",
      billing_address: party.address || "",
      gst_number: party.gstin || party.gstNumber || null,
      pan_number: party.pan || null,
      opening_balance: Number(party.openingBalance || 0),
      current_balance: Number(party.currentBalance ?? party.balance ?? 0),
      credit_limit: Number(party.creditLimit || 0),
      is_active: party.isActive !== false,
      created_at: party.createdAt ? new Date(party.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from("parties").upsert(partyPayload, { onConflict: "id" });
    if (error) console.warn("[Supabase Sync] Party sync error:", error.message);
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
    const txId = tx._id || tx.id;
    const txPayload = {
      ...(txId ? { id: mongoIdToUuid(txId) } : {}),
      company_id: mongoIdToUuid(tx.companyId),
      party_id: mongoIdToUuid(tx.partyId),
      date: tx.date ? new Date(tx.date).toISOString() : new Date().toISOString(),
      details: tx.details || tx.description || "पार्टी खाता लेन-देन",
      debit: Number(tx.debit || 0),
      credit: Number(tx.credit || 0),
      type: tx.type || "manual",
      created_at: tx.createdAt ? new Date(tx.createdAt).toISOString() : new Date().toISOString()
    };
    const { error } = txId
      ? await supabase.from("party_transactions").upsert(txPayload, { onConflict: "id" })
      : await supabase.from("party_transactions").insert(txPayload);
    if (error) console.warn("[Supabase Sync] Party Tx sync error:", error.message);
  } catch (err) {
    console.warn("[Supabase Sync] Party Transaction sync note:", err.message);
  }
};

/**
 * Sync Party Delete (Deactivate) to Supabase
 */
export const syncPartyDeleteToSupabase = async (partyId) => {
  if (!supabase || !partyId) return;
  try {
    const pUuid = mongoIdToUuid(partyId);
    await supabase.from("parties").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", pUuid);
  } catch (err) {
    console.warn("[Supabase Sync] Party delete note:", err.message);
  }
};

/**
 * Sync Expense to Supabase
 */
export const syncExpenseToSupabase = async (expense) => {
  if (!supabase || !expense) return;
  try {
    const eUuid = mongoIdToUuid(expense._id || expense.id);
    const meta = {
      expenseType: expense.expenseType || (expense.familyMember ? 'drawings' : 'operating'),
      familyMember: expense.familyMember || '',
      paymentMethod: expense.paymentMethod || 'cash',
      transactionFlow: expense.transactionFlow || 'given',
      staffId: expense.staffId ? String(expense.staffId) : undefined,
      staffTransactionId: expense.staffTransactionId ? String(expense.staffTransactionId) : undefined
    };
    const cleanDesc = (expense.description || expense.notes || '').replace(/\[VB_META:[^\]]+\]\s*/g, '').trim();
    const encodedDescription = `[VB_META:${JSON.stringify(meta)}] ${cleanDesc}`.trim();

    const payload = {
      id: eUuid,
      company_id: mongoIdToUuid(expense.companyId),
      title: expense.title || "खर्च",
      amount: Number(expense.amount || 0),
      category: expense.category || "General",
      date: expense.date ? new Date(expense.date).toISOString() : new Date().toISOString(),
      description: encodedDescription,
      status: expense.status || "approved",
      is_deleted: Boolean(expense.isDeleted),
      created_at: expense.createdAt ? new Date(expense.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from("expenses").upsert(payload, { onConflict: "id" });
    if (error) console.warn("[Supabase Sync] Expense sync error:", error.message);
  } catch (err) {
    console.warn("[Supabase Sync] Expense sync note:", err.message);
  }
};

/**
 * Sync Staff / Employee to Supabase
 */
export const syncStaffToSupabase = async (staff) => {
  if (!supabase || !staff || !staff.name) return;
  try {
    const eUuid = mongoIdToUuid(staff._id || staff.id);
    const wageVal = Number(staff.dailyRate || staff.wageAmount || staff.salary || 0);
    const payload = {
      id: eUuid,
      company_id: mongoIdToUuid(staff.companyId),
      full_name: staff.name || staff.fullName || "Staff Member",
      phone_number: staff.mobileNumber || staff.phone || "",
      designation: staff.position || staff.role || "Staff",
      role: staff.role || "salesman",
      wage_type: staff.wageType || "daily",
      salary: wageVal,
      balance: Number(staff.balance || 0),
      joining_date: staff.dateOfJoining ? new Date(staff.dateOfJoining).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      is_active: staff.isActive !== false,
      created_at: staff.createdAt ? new Date(staff.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from("employees").upsert(payload, { onConflict: "id" });
    if (error) console.warn("[Supabase Sync] Employee sync error:", error.message);
  } catch (err) {
    console.warn("[Supabase Sync] Employee sync note:", err.message);
  }
};

/**
 * Sync Attendance to Supabase
 */
export const syncAttendanceToSupabase = async (attendance) => {
  if (!supabase || !attendance || !attendance.staffId) return;
  try {
    const aUuid = mongoIdToUuid(attendance._id || attendance.id);
    const eUuid = mongoIdToUuid(attendance.staffId);
    const normStatus = (attendance.status === 'half-day' || attendance.status === 'halfday' || attendance.status === 'half_day')
      ? 'half_day'
      : (attendance.status === 'absent' || attendance.status === 'leave')
      ? 'absent'
      : 'present';

    const payload = {
      id: aUuid,
      company_id: mongoIdToUuid(attendance.companyId),
      employee_id: eUuid,
      date: attendance.date ? new Date(attendance.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: normStatus,
      notes: attendance.notes || `Synced status: ${normStatus}`,
      created_at: attendance.createdAt ? new Date(attendance.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from("attendance").upsert(payload, { onConflict: "employee_id,date" });
    if (error) console.warn("[Supabase Sync] Attendance sync error:", error.message);
  } catch (err) {
    console.warn("[Supabase Sync] Attendance sync note:", err.message);
  }
};

/**
 * Sync Staff Transaction (Advance / Settlement) to Supabase
 */
export const syncStaffTxToSupabase = async (tx) => {
  if (!supabase || !tx || !tx.staffId) return;
  try {
    const txId = tx._id || tx.id;
    const payload = {
      ...(txId ? { id: mongoIdToUuid(txId) } : {}),
      company_id: mongoIdToUuid(tx.companyId),
      employee_id: mongoIdToUuid(tx.staffId),
      date: tx.date ? new Date(tx.date).toISOString() : new Date().toISOString(),
      type: tx.type || "advance",
      status: "completed",
      debit: Number(tx.debit || 0),
      credit: Number(tx.credit || 0),
      notes: tx.notes || (tx.forMonth ? `For ${tx.forMonth}` : "Staff payment"),
      is_deleted: Boolean(tx.isDeleted),
      created_at: tx.createdAt ? new Date(tx.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = txId
      ? await supabase.from("staff_transactions").upsert(payload, { onConflict: "id" })
      : await supabase.from("staff_transactions").insert(payload);
    if (error) console.warn("[Supabase Sync] Staff Tx sync error:", error.message);
  } catch (err) {
    console.warn("[Supabase Sync] Staff Transaction sync note:", err.message);
  }
};

/**
 * Sync Staff Deletion (Deactivate) to Supabase
 */
export const syncStaffDeleteToSupabase = async (staffId) => {
  if (!supabase || !staffId) return;
  try {
    const sUuid = mongoIdToUuid(staffId);
    await supabase.from("employees").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", sUuid);
  } catch (err) {
    console.warn("[Supabase Sync] Staff delete note:", err.message);
  }
};

/**
 * Sync Purchase to Supabase
 */
export const syncPurchaseToSupabase = async (pr) => {
  if (!supabase || !pr) return;
  try {
    const pUuid = mongoIdToUuid(pr._id || pr.id);
    const suppUuid = pr.supplierId || pr.partyId ? mongoIdToUuid(pr.supplierId || pr.partyId) : null;

    const payload = {
      id: pUuid,
      company_id: mongoIdToUuid(pr.companyId),
      party_id: suppUuid,
      purchase_number: pr.billNumber || pr.purchaseNumber || ("PO-" + pUuid.slice(0, 8)),
      date: pr.date ? new Date(pr.date).toISOString() : new Date().toISOString(),
      items: Array.isArray(pr.items) ? pr.items : [],
      sub_total: Number(pr.subTotal || pr.total || 0),
      discount_amount: Number(pr.discount || 0),
      tax_amount: Number(pr.tax || 0),
      final_amount: Number(pr.finalAmount || pr.total || 0),
      amount_paid: Number(pr.amountPaid || pr.paidAmount || 0),
      payment_status: pr.paymentStatus || "paid",
      payment_method: pr.paymentMethod || "cash",
      supplier_name: pr.supplierName || "सप्लायर",
      is_deleted: Boolean(pr.isDeleted),
      created_at: pr.createdAt ? new Date(pr.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from("purchases").upsert(payload, { onConflict: "id" });
    if (error) console.warn("[Supabase Sync] Purchase sync error:", error.message);
  } catch (err) {
    console.warn("[Supabase Sync] Purchase sync note:", err.message);
  }
};

/**
 * Sync Purchase Deletion to Supabase
 */
export const syncPurchaseDeleteToSupabase = async (purchaseIdOrNumber) => {
  if (!supabase || !purchaseIdOrNumber) return;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(purchaseIdOrNumber));
    if (isUuid) {
      await supabase.from("purchases").update({ is_deleted: true, updated_at: new Date().toISOString() }).eq("id", purchaseIdOrNumber);
    } else {
      const pUuid = mongoIdToUuid(purchaseIdOrNumber);
      await supabase.from("purchases").update({ is_deleted: true, updated_at: new Date().toISOString() }).or(`id.eq.${pUuid},purchase_number.eq.${purchaseIdOrNumber}`);
    }
  } catch (err) {
    console.warn("[Supabase Sync] Purchase delete note:", err.message);
  }
};

/**
 * Sync Product to Supabase
 */
export const syncProductToSupabase = async (product) => {
  if (!supabase || !product || !product.name) return;
  try {
    const pUuid = mongoIdToUuid(product._id || product.id);
    const payload = {
      id: pUuid,
      company_id: mongoIdToUuid(product.companyId),
      name: product.name,
      category: product.category || 'General',
      sub_category: product.subCategory || null,
      brand: product.brand || null,
      unit: product.unit || 'pc',
      sku: product.sku || null,
      barcode: product.barcode || null,
      hsn_code: product.hsnCode || null,
      cost_price: Number(product.costPrice) || 0,
      selling_price: Number(product.sellingPrice) || 0,
      mrp: Number(product.mrp) || Number(product.sellingPrice) || 0,
      wholesale_price: Number(product.wholesalePrice) || 0,
      dealer_price: Number(product.dealerPrice) || 0,
      current_stock: Number(product.currentStock) || Number(product.stock) || 0,
      minimum_stock: Number(product.minimumStock) || 0,
      is_active: product.isActive !== false,
      created_at: product.createdAt ? new Date(product.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from("products").upsert(payload, { onConflict: "id" });
    if (error) console.warn("[Supabase Sync] Product sync error:", error.message);
  } catch (err) {
    console.warn("[Supabase Sync] Product sync note:", err.message);
  }
};

/**
 * Sync Product Deletion to Supabase
 */
export const syncProductDeleteToSupabase = async (productId) => {
  if (!supabase || !productId) return;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(productId));
    const pUuid = isUuid ? productId : mongoIdToUuid(productId);
    await supabase.from("products").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", pUuid);
  } catch (err) {
    console.warn("[Supabase Sync] Product delete note:", err.message);
  }
};

/**
 * Sync Company to Supabase
 */
export const syncCompanyToSupabase = async (company) => {
  if (!supabase || !company || !company.name) return;
  try {
    const cUuid = mongoIdToUuid(company._id || company.id);
    const payload = {
      id: cUuid,
      name: company.name,
      email: company.email || company.ownerEmail || null,
      phone_number: company.phone || company.phoneNumber || null,
      gst_number: company.gstNumber || company.gstin || null,
      pan_number: company.panNumber || company.pan || null,
      address: company.address || null,
      upi_id: company.upiId || null,
      google_review_url: company.googleReviewUrl || null,
      instagram_url: company.instagramUrl || null,
      facebook_url: company.facebookUrl || null,
      youtube_url: company.youtubeUrl || null,
      is_active: company.isActive !== false,
      created_at: company.createdAt ? new Date(company.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from("companies").upsert(payload, { onConflict: "id" });
    if (error) console.warn("[Supabase Sync] Company sync error:", error.message);
  } catch (err) {
    console.warn("[Supabase Sync] Company sync note:", err.message);
  }
};

/**
 * Sync User to Supabase
 */
export const syncUserToSupabase = async (user) => {
  if (!supabase || !user || !user.email) return;
  try {
    const uUuid = mongoIdToUuid(user._id || user.id);
    const payload = {
      id: uUuid,
      name: user.name || user.email.split('@')[0],
      email: user.email.toLowerCase(),
      password: user.password || "",
      phone: user.phone || null,
      role: user.role || 'admin',
      company_id: user.companyId ? mongoIdToUuid(user.companyId) : null,
      is_active: user.isActive !== false,
      is_verified: Boolean(user.isVerified),
      created_at: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from("users").upsert(payload, { onConflict: "id" });
    if (error) console.warn("[Supabase Sync] User sync error:", error.message);
  } catch (err) {
    console.warn("[Supabase Sync] User sync note:", err.message);
  }
};

/**
 * Sync Bank Account to Supabase
 */
export const syncBankAccountToSupabase = async (bankAccount) => {
  if (!supabase || !bankAccount || !bankAccount.accountName) return;
  try {
    const bUuid = mongoIdToUuid(bankAccount._id || bankAccount.id);
    const balanceVal = Number(bankAccount.balance ?? bankAccount.currentBalance ?? 0);
    const payload = {
      id: bUuid,
      company_id: bankAccount.companyId ? mongoIdToUuid(bankAccount.companyId) : null,
      account_name: bankAccount.accountName,
      bank_name: bankAccount.bankName || "",
      account_number: bankAccount.accountNumber || "",
      ifsc_code: bankAccount.ifscCode || "",
      upi_id: bankAccount.upiId || "",
      account_type: bankAccount.accountType || "CURRENT",
      has_cc_limit: Boolean(bankAccount.hasCcLimit),
      sanctioned_limit: Number(bankAccount.sanctionedLimit || 0),
      current_outstanding: Number(bankAccount.currentOutstanding || 0),
      opening_balance: Number(bankAccount.openingBalance || 0),
      current_balance: balanceVal,
      interest_rate: Number(bankAccount.interestRate || 0),
      transactions: Array.isArray(bankAccount.transactions) ? bankAccount.transactions : [],
      monthly_interests: Array.isArray(bankAccount.monthlyInterests) ? bankAccount.monthlyInterests : [],
      is_deleted: Boolean(bankAccount.isDeleted),
      created_at: bankAccount.createdAt ? new Date(bankAccount.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from("bank_accounts").upsert(payload, { onConflict: "id" });
    if (error) console.warn("[Supabase Sync] BankAccount sync error:", error.message);
  } catch (err) {
    console.warn("[Supabase Sync] BankAccount sync note:", err.message);
  }
};

/**
 * Sync Bank Account Delete to Supabase
 */
export const syncBankAccountDeleteToSupabase = async (bankAccountId) => {
  if (!supabase || !bankAccountId) return;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(bankAccountId));
    const bUuid = isUuid ? bankAccountId : mongoIdToUuid(bankAccountId);
    await supabase.from("bank_accounts").update({ is_deleted: true, updated_at: new Date().toISOString() }).eq("id", bUuid);
  } catch (err) {
    console.warn("[Supabase Sync] BankAccount delete note:", err.message);
  }
};

export default {
  syncBillToSupabase,
  syncBillDeleteToSupabase,
  syncBillPhotoToSupabase,
  syncPartyToSupabase,
  syncPartyDeleteToSupabase,
  syncPartyTxToSupabase,
  syncExpenseToSupabase,
  syncStaffToSupabase,
  syncStaffDeleteToSupabase,
  syncAttendanceToSupabase,
  syncStaffTxToSupabase,
  syncPurchaseToSupabase,
  syncPurchaseDeleteToSupabase,
  syncProductToSupabase,
  syncProductDeleteToSupabase,
  syncCompanyToSupabase,
  syncUserToSupabase,
  syncBankAccountToSupabase,
  syncBankAccountDeleteToSupabase,
  mongoIdToUuid
};
