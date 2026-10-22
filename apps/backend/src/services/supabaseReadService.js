import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { supabase } from "../config/supabase.js";
import { mongoIdToUuid } from "./supabaseSyncService.js";

const isSupabaseConfigured = Boolean(supabase);

/**
 * Universal Supabase Read Service
 * Enables Supabase as Primary READ Data Store with seamless Mongoose fallbacks.
 */

// ==========================================
// MAPPERS: Supabase SQL Rows -> JSON Models
// ==========================================

export const mapSupabaseSalesToBill = (row) => ({
  _id: row.id,
  id: row.id,
  companyId: row.company_id,
  partyId: row.party_id,
  billNumber: row.bill_number,
  customerName: row.customer_name || "काउंटर नकद ग्राहक",
  customerMobile: row.customer_mobile || "",
  customerAddress: row.customer_address || "",
  customerGst: row.customer_gst || "",
  siteName: row.site_name || "",
  date: row.date,
  items: row.items || [],
  subTotal: Number(row.sub_total || 0),
  total: Number(row.final_amount || 0),
  finalAmount: Number(row.final_amount || 0),
  totalAmount: Number(row.final_amount || 0),
  tax: Number(row.tax_amount || 0),
  discountAmount: Number(row.discount_amount || 0),
  discountPercent: Number(row.discount_percent || 0),
  amountReceived: Number(row.amount_received || 0),
  paymentStatus: row.payment_status || "paid",
  paymentMode: row.payment_method || "cash",
  paymentMethod: row.payment_method || "cash",
  status: row.status || "complete",
  notes: row.notes || "",
  billImageUrl: row.bill_image_url || null,
  isDeleted: Boolean(row.is_deleted),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapSupabasePartyToParty = (row) => ({
  _id: row.id,
  id: row.id,
  companyId: row.company_id,
  name: row.name,
  partyType: row.party_type,
  type: row.party_type,
  mobileNumber: row.mobile_number || "",
  phone: row.mobile_number || "",
  address: row.billing_address || "",
  billingAddress: row.billing_address || "",
  gstNumber: row.gst_number || "",
  pan: row.pan_number || "",
  openingBalance: Number(row.opening_balance || 0),
  currentBalance: Number(row.current_balance || 0),
  balance: Number(row.current_balance || 0),
  creditLimit: Number(row.credit_limit || 0),
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapSupabasePartyTxToTx = (row) => ({
  _id: row.id,
  id: row.id,
  partyId: row.party_id,
  companyId: row.company_id,
  date: row.date,
  details: row.details || "",
  debit: Number(row.debit || 0),
  credit: Number(row.credit || 0),
  amount: Number(row.debit || row.credit || 0),
  type: row.type || "manual",
  createdAt: row.created_at
});

export const mapSupabaseStaffTxToTx = (row) => ({
  _id: row.id,
  id: row.id,
  staffId: row.employee_id,
  employeeId: row.employee_id,
  companyId: row.company_id,
  date: row.date,
  type: row.type || "payment",
  status: row.status || "completed",
  debit: Number(row.debit || 0),
  credit: Number(row.credit || 0),
  amount: Number(row.debit || row.credit || 0),
  notes: row.notes || "",
  isDeleted: Boolean(row.is_deleted),
  createdAt: row.created_at
});

export const mapSupabaseProductToProduct = (row) => ({
  _id: row.id,
  id: row.id,
  companyId: row.company_id,
  name: row.name,
  category: row.category || "",
  costPrice: Number(row.cost_price || 0),
  purchasePrice: Number(row.cost_price || 0),
  sellingPrice: Number(row.selling_price || 0),
  price: Number(row.selling_price || 0),
  currentStock: Number(row.current_stock || 0),
  stock: Number(row.current_stock || 0),
  unit: row.unit || "pcs",
  brand: row.brand || "",
  barcode: row.barcode || "",
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapSupabaseExpenseToExpense = (row) => ({
  _id: row.id,
  id: row.id,
  companyId: row.company_id,
  title: row.title || "खर्च",
  amount: Number(row.amount || 0),
  category: row.category || "General",
  date: row.date,
  description: row.description || "",
  status: row.status || "approved",
  expenseType: "operating",
  isDeleted: Boolean(row.is_deleted),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapSupabaseEmployeeToStaff = (row) => ({
  _id: row.id,
  id: row.id,
  companyId: row.company_id,
  name: row.full_name,
  fullName: row.full_name,
  mobileNumber: row.phone_number || "",
  phone: row.phone_number || "",
  position: row.designation || "Staff",
  role: row.role || "salesman",
  wageType: row.wage_type || "daily",
  dailyRate: row.wage_type === "daily" ? Number(row.salary || 0) : 0,
  monthlySalary: row.wage_type === "monthly" ? Number(row.salary || 0) : Number(row.salary || 0) * 30,
  salary: Number(row.salary || 0),
  wageAmount: Number(row.salary || 0),
  balance: Number(row.balance || 0),
  dateOfJoining: row.joining_date,
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapSupabasePurchaseToPurchase = (row) => ({
  _id: row.id,
  id: row.id,
  companyId: row.company_id,
  partyId: row.party_id,
  purchaseNumber: row.purchase_number,
  billNumber: row.purchase_number,
  date: row.date,
  items: row.items || [],
  subTotal: Number(row.sub_total || 0),
  discount: Number(row.discount_amount || 0),
  tax: Number(row.tax_amount || 0),
  finalAmount: Number(row.final_amount || 0),
  totalAmount: Number(row.final_amount || 0),
  amountPaid: Number(row.amount_paid || 0),
  paymentStatus: row.payment_status || "paid",
  paymentMethod: row.payment_method || "cash",
  supplierName: row.supplier_name || "सप्लायर",
  isDeleted: Boolean(row.is_deleted),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// ==========================================
// READ QUERIES WITH FAILSAFE FALLBACKS
// ==========================================

/**
 * 1. Fetch Bills from Supabase
 */
export const getBillsFromSupabase = async ({ companyId, search, startDate, endDate, partyId, status, page = 1, limit = 200 }) => {
  if (!isSupabaseConfigured || !companyId) return null;
  try {
    const cUuid = mongoIdToUuid(companyId);
    let q = supabase
      .from("sales")
      .select("*", { count: "exact" })
      .eq("is_deleted", false)
      .eq("company_id", cUuid)
      .order("date", { ascending: false });

    if (search) {
      q = q.or(`bill_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_mobile.ilike.%${search}%`);
    }

    if (partyId) {
      q = q.eq("party_id", mongoIdToUuid(partyId));
    }

    if (status) {
      q = q.eq("status", status);
    }

    if (startDate && endDate) {
      q = q.gte("date", new Date(startDate).toISOString()).lte("date", new Date(endDate).toISOString());
    }

    const limitNum = limit === "all" ? 10000 : (parseInt(limit) || 200);
    const pageNum = Math.max(1, parseInt(page) || 1);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    q = q.range(from, to);

    const { data, count, error } = await q;
    if (error) {
      console.warn("[Supabase Read] getBills error:", error.message);
      return null;
    }

    return {
      bills: (data || []).map(mapSupabaseSalesToBill),
      total: count || (data ? data.length : 0),
      page: pageNum,
      pages: Math.ceil((count || 0) / limitNum) || 1
    };
  } catch (err) {
    console.warn("[Supabase Read] getBills exception:", err.message);
    return null;
  }
};

/**
 * 2. Fetch Single Bill by ID or Bill Number
 */
export const getBillByIdFromSupabase = async (idOrNumber, companyId) => {
  if (!isSupabaseConfigured || !idOrNumber) return null;
  try {
    const cUuid = companyId ? mongoIdToUuid(companyId) : null;
    let q = supabase.from("sales").select("*").eq("is_deleted", false);

    if (cUuid) q = q.eq("company_id", cUuid);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(idOrNumber));
    if (isUuid) {
      q = q.eq("id", idOrNumber);
    } else {
      const generatedUuid = mongoIdToUuid(idOrNumber);
      q = q.or(`id.eq.${generatedUuid},bill_number.eq.${idOrNumber}`);
    }

    const { data, error } = await q.limit(1).maybeSingle();
    if (error || !data) return null;
    return mapSupabaseSalesToBill(data);
  } catch (err) {
    return null;
  }
};

/**
 * 3. Fetch Parties from Supabase
 */
export const getPartiesFromSupabase = async ({ companyId, search, partyType }) => {
  if (!isSupabaseConfigured || !companyId) return null;
  try {
    const cUuid = mongoIdToUuid(companyId);
    let q = supabase
      .from("parties")
      .select("*")
      .eq("company_id", cUuid)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (partyType && partyType !== "both") {
      q = q.or(`party_type.eq.${partyType},party_type.eq.both`);
    }

    if (search) {
      q = q.or(`name.ilike.%${search}%,mobile_number.ilike.%${search}%`);
    }

    const { data, error } = await q;
    if (error) {
      console.warn("[Supabase Read] getParties error:", error.message);
      return null;
    }

    return (data || []).map(mapSupabasePartyToParty);
  } catch (err) {
    console.warn("[Supabase Read] getParties exception:", err.message);
    return null;
  }
};

/**
 * 4. Fetch Party by ID from Supabase
 */
export const getPartyByIdFromSupabase = async (partyId, companyId) => {
  if (!isSupabaseConfigured || !partyId) return null;
  try {
    const pUuid = mongoIdToUuid(partyId);
    const cUuid = companyId ? mongoIdToUuid(companyId) : null;
    let q = supabase.from("parties").select("*").eq("id", pUuid);
    if (cUuid) q = q.eq("company_id", cUuid);

    const { data, error } = await q.limit(1).maybeSingle();
    if (error || !data) return null;
    return mapSupabasePartyToParty(data);
  } catch (err) {
    return null;
  }
};

/**
 * 5. Fetch Party Statement / Transactions from Supabase
 */
export const getPartyTransactionsFromSupabase = async ({ partyId, companyId, startDate, endDate }) => {
  if (!isSupabaseConfigured || !partyId) return null;
  try {
    const pUuid = mongoIdToUuid(partyId);
    let q = supabase
      .from("party_transactions")
      .select("*")
      .eq("party_id", pUuid)
      .order("date", { ascending: true });

    if (companyId) {
      q = q.eq("company_id", mongoIdToUuid(companyId));
    }

    if (startDate && endDate) {
      q = q.gte("date", new Date(startDate).toISOString()).lte("date", new Date(endDate).toISOString());
    }

    const { data, error } = await q;
    if (error) {
      console.warn("[Supabase Read] getPartyTransactions error:", error.message);
      return null;
    }

    return (data || []).map(mapSupabasePartyTxToTx);
  } catch (err) {
    console.warn("[Supabase Read] getPartyTransactions exception:", err.message);
    return null;
  }
};

/**
 * 6. Fetch Expenses from Supabase
 */
export const getExpensesFromSupabase = async ({ companyId, category, startDate, endDate, limit = 200 }) => {
  if (!isSupabaseConfigured || !companyId) return null;
  try {
    const cUuid = mongoIdToUuid(companyId);
    let q = supabase
      .from("expenses")
      .select("*")
      .eq("is_deleted", false)
      .eq("company_id", cUuid)
      .order("date", { ascending: false });

    if (category) {
      q = q.eq("category", category);
    }

    if (startDate && endDate) {
      q = q.gte("date", new Date(startDate).toISOString()).lte("date", new Date(endDate).toISOString());
    }

    if (limit && limit !== "all") {
      q = q.limit(parseInt(limit) || 200);
    }

    const { data, error } = await q;
    if (error) {
      console.warn("[Supabase Read] getExpenses error:", error.message);
      return null;
    }

    return (data || []).map(mapSupabaseExpenseToExpense);
  } catch (err) {
    console.warn("[Supabase Read] getExpenses exception:", err.message);
    return null;
  }
};

/**
 * 7. Fetch Staff List from Supabase
 */
export const getStaffFromSupabase = async ({ companyId }) => {
  if (!isSupabaseConfigured || !companyId) return null;
  try {
    const cUuid = mongoIdToUuid(companyId);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("company_id", cUuid)
      .eq("is_active", true)
      .order("full_name", { ascending: true });

    if (error) {
      console.warn("[Supabase Read] getStaff error:", error.message);
      return null;
    }

    return (data || []).map(mapSupabaseEmployeeToStaff);
  } catch (err) {
    console.warn("[Supabase Read] getStaff exception:", err.message);
    return null;
  }
};

/**
 * 8. Fetch Purchases from Supabase
 */
export const getPurchasesFromSupabase = async ({ companyId, limit = 200 }) => {
  if (!isSupabaseConfigured || !companyId) return null;
  try {
    const cUuid = mongoIdToUuid(companyId);
    let q = supabase
      .from("purchases")
      .select("*")
      .eq("is_deleted", false)
      .eq("company_id", cUuid)
      .order("date", { ascending: false });

    if (limit && limit !== "all") {
      q = q.limit(parseInt(limit) || 200);
    }

    const { data, error } = await q;
    if (error) {
      console.warn("[Supabase Read] getPurchases error:", error.message);
      return null;
    }

    return (data || []).map(mapSupabasePurchaseToPurchase);
  } catch (err) {
    console.warn("[Supabase Read] getPurchases exception:", err.message);
    return null;
  }
};

/**
 * 9. Fetch Single Purchase by ID
 */
export const getPurchaseByIdFromSupabase = async (id, companyId) => {
  if (!isSupabaseConfigured || !id) return null;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id));
    const targetUuid = isUuid ? id : mongoIdToUuid(id);
    let q = supabase.from("purchases").select("*").eq("id", targetUuid).eq("is_deleted", false);
    if (companyId) {
      q = q.eq("company_id", mongoIdToUuid(companyId));
    }
    const { data, error } = await q.maybeSingle();
    if (error || !data) return null;
    return mapSupabasePurchaseToPurchase(data);
  } catch (err) {
    return null;
  }
};

/**
 * 10. Fetch Single Expense by ID
 */
export const getExpenseByIdFromSupabase = async (id, companyId) => {
  if (!isSupabaseConfigured || !id) return null;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id));
    const targetUuid = isUuid ? id : mongoIdToUuid(id);
    let q = supabase.from("expenses").select("*").eq("id", targetUuid).eq("is_deleted", false);
    if (companyId) {
      q = q.eq("company_id", mongoIdToUuid(companyId));
    }
    const { data, error } = await q.maybeSingle();
    if (error || !data) return null;
    return mapSupabaseExpenseToExpense(data);
  } catch (err) {
    return null;
  }
};

/**
 * 11. Fetch Single Staff by ID
 */
export const getStaffByIdFromSupabase = async (id, companyId) => {
  if (!isSupabaseConfigured || !id) return null;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id));
    const targetUuid = isUuid ? id : mongoIdToUuid(id);
    let q = supabase.from("employees").select("*").eq("id", targetUuid);
    if (companyId) {
      q = q.eq("company_id", mongoIdToUuid(companyId));
    }
    const { data, error } = await q.maybeSingle();
    if (error || !data) return null;
    return mapSupabaseEmployeeToStaff(data);
  } catch (err) {
    return null;
  }
};

/**
 * 12. Fetch Staff Transactions (Statement) from Supabase
 */
export const getStaffTransactionsFromSupabase = async ({ staffId, companyId }) => {
  if (!isSupabaseConfigured) return null;
  try {
    let q = supabase.from("staff_transactions").select("*").eq("is_deleted", false).order("date", { ascending: false });
    if (companyId) {
      q = q.eq("company_id", mongoIdToUuid(companyId));
    }
    if (staffId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(staffId));
      q = q.eq("employee_id", isUuid ? staffId : mongoIdToUuid(staffId));
    }
    const { data, error } = await q;
    if (error || !data) return null;
    return data.map(mapSupabaseStaffTxToTx);
  } catch (err) {
    return null;
  }
};

/**
 * 13. Fetch Products from Supabase
 */
export const getProductsFromSupabase = async ({ companyId, category, search, limit = 500 }) => {
  if (!isSupabaseConfigured || !companyId) return null;
  try {
    const cUuid = mongoIdToUuid(companyId);
    let q = supabase
      .from("products")
      .select("*")
      .eq("company_id", cUuid)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      q = q.eq("category", category);
    }
    if (search) {
      q = q.or(`name.ilike.%${search}%,barcode.ilike.%${search}%,brand.ilike.%${search}%`);
    }
    if (limit && limit !== "all") {
      q = q.limit(parseInt(limit) || 500);
    }

    const { data, error } = await q;
    if (error) {
      console.warn("[Supabase Read] getProducts error:", error.message);
      return null;
    }
    return (data || []).map(mapSupabaseProductToProduct);
  } catch (err) {
    console.warn("[Supabase Read] getProducts exception:", err.message);
    return null;
  }
};

/**
 * 14. Fetch Single Product by ID
 */
export const getProductByIdFromSupabase = async (id, companyId) => {
  if (!isSupabaseConfigured || !id) return null;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id));
    const targetUuid = isUuid ? id : mongoIdToUuid(id);
    let q = supabase.from("products").select("*").eq("id", targetUuid);
    if (companyId) {
      q = q.eq("company_id", mongoIdToUuid(companyId));
    }
    const { data, error } = await q.maybeSingle();
    if (error || !data) return null;
    return mapSupabaseProductToProduct(data);
  } catch (err) {
    return null;
  }
};

export default {
  getBillsFromSupabase,
  getBillByIdFromSupabase,
  getPartiesFromSupabase,
  getPartyByIdFromSupabase,
  getPartyTransactionsFromSupabase,
  getExpensesFromSupabase,
  getExpenseByIdFromSupabase,
  getStaffFromSupabase,
  getStaffByIdFromSupabase,
  getStaffTransactionsFromSupabase,
  getPurchasesFromSupabase,
  getPurchaseByIdFromSupabase,
  getProductsFromSupabase,
  getProductByIdFromSupabase
};
