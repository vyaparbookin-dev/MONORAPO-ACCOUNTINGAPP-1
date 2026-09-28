/**
 * Unified Central Storage Manager (Single Source of Truth)
 * 
 * Solves the Offline-First key mismatch problem across all modules.
 * Standardizes key names, schemas, auto-migration, and synchronization rules.
 * 
 * Deterministic Key Pattern:
 * vb_v2_${companyId}_${entity}
 */
import { deduplicateBills } from "../utils/deduplicateBills";
import { deduplicateExpenses } from "../utils/deduplicateExpenses";

class StorageManager {
  constructor() {
    this.migratedCompanies = new Set();
  }

  /**
   * Generates a deterministic, company-scoped storage key
   */
  getKey(entity, companyId) {
    const cid = String(companyId || (typeof localStorage !== "undefined" ? localStorage.getItem("companyId") : "") || "default").trim();
    return `vb_v2_${cid}_${entity}`;
  }

  /**
   * Generates a client-side UUID / collision-free unique ID
   */
  generateId(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  // ==========================================
  // 1. PARTIES REPOSITORY
  // ==========================================

  normalizeParty(p) {
    if (!p || typeof p !== "object") return null;
    const rawBal = Number(p.currentBalance ?? p.balance ?? p.openingBalance ?? 0);
    const pName = String(p.name || p.partyName || "").trim();
    const pMobile = String(p.mobileNumber || p.phone || "").trim();
    const id = p._id || p.id || this.generateId("party");

    return {
      id,
      _id: id,
      name: pName || "अज्ञात पार्टी",
      mobileNumber: pMobile,
      phone: pMobile,
      balance: isNaN(rawBal) ? 0 : rawBal,
      currentBalance: isNaN(rawBal) ? 0 : rawBal,
      openingBalance: Number(p.openingBalance ?? 0),
      partyType: p.partyType || p.type || "customer",
      type: p.partyType || p.type || "customer",
      address: p.address || "",
      creditLimit: Number(p.creditLimit ?? 0),
      isCreditLimitActive: Boolean(p.isCreditLimitActive),
      creditLimitStatus: p.creditLimitStatus || (p.isCreditLimitActive ? "ACTIVE" : "INACTIVE"),
      hasPendingBillApproval: Boolean(p.hasPendingBillApproval),
      gstNumber: p.gstNumber || p.gstin || "",
      notes: p.notes || "",
      isActive: p.isActive !== false,
      isDeleted: Boolean(p.isDeleted),
      updatedAt: p.updatedAt || new Date().toISOString(),
      createdAt: p.createdAt || new Date().toISOString()
    };
  }

  getPartyUniqueKey(p) {
    if (!p) return "";
    const phone = String(p.phone || p.mobileNumber || "").replace(/\D/g, "").slice(-10);
    if (phone && phone.length === 10 && phone !== "9999999999") return `phone_${phone}`;
    const name = String(p.name || p.partyName || "").trim().toLowerCase();
    if (name) return `name_${name}`;
    return String(p._id || p.id || Math.random());
  }

  getParties(companyId) {
    this.runAutoMigration(companyId);
    if (typeof localStorage === "undefined") return [];

    const key = this.getKey("parties", companyId);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map(p => this.normalizeParty(p)).filter(Boolean);
        }
      }
    } catch (e) {
      console.warn("[StorageManager] getParties error:", e);
    }
    return [];
  }

  saveParties(companyId, partiesList = []) {
    if (typeof localStorage === "undefined" || !Array.isArray(partiesList)) return [];

    const cid = String(companyId || localStorage.getItem("companyId") || "default").trim();
    const normList = partiesList.map(p => this.normalizeParty(p)).filter(Boolean);

    // Save to primary v2 key
    const primaryKey = this.getKey("parties", cid);
    try {
      localStorage.setItem(primaryKey, JSON.stringify(normList));

      // Mirror to legacy keys for 100% backwards compatibility
      if (cid && cid !== "default") {
        localStorage.setItem(`vb_local_parties_${cid}`, JSON.stringify(normList));
      }
      localStorage.setItem("vb_local_parties", JSON.stringify(normList));
      localStorage.setItem("parties", JSON.stringify(normList));
    } catch (e) {
      console.warn("[StorageManager] saveParties storage quota warning:", e);
    }
    return normList;
  }

  saveParty(companyId, party) {
    const norm = this.normalizeParty(party);
    if (!norm) return null;

    const current = this.getParties(companyId);
    const key = this.getPartyUniqueKey(norm);

    let updated = false;
    const nextList = current.map(p => {
      const pKey = this.getPartyUniqueKey(p);
      if (pKey === key || p.id === norm.id || p._id === norm._id) {
        updated = true;
        return { ...p, ...norm, updatedAt: new Date().toISOString() };
      }
      return p;
    });

    if (!updated) {
      nextList.unshift(norm);
    }

    this.saveParties(companyId, nextList);
    return norm;
  }

  mergeParties(companyId, serverParties = []) {
    const localParties = this.getParties(companyId);
    const partyMap = new Map();

    // 1. Load local parties first
    localParties.forEach(p => {
      if (p.isActive === false || p.isDeleted === true) return;
      const key = this.getPartyUniqueKey(p);
      if (key) partyMap.set(key, p);
    });

    // 2. Authoritative server merge
    (Array.isArray(serverParties) ? serverParties : []).forEach(sp => {
      const normServer = this.normalizeParty(sp);
      if (!normServer || normServer.isActive === false || normServer.isDeleted === true) return;
      const key = this.getPartyUniqueKey(normServer);
      if (key) {
        const existing = partyMap.get(key) || {};
        partyMap.set(key, { ...existing, ...normServer });
      }
    });

    const merged = Array.from(partyMap.values());
    this.saveParties(companyId, merged);
    return merged;
  }

  // ==========================================
  // 2. BILLS & SALES REPOSITORY
  // ==========================================

  normalizeBill(b) {
    if (!b || typeof b !== "object") return null;
    const bNo = b.billNumber || b.invoiceNumber || (b._id ? `INV-${String(b._id).slice(-4)}` : "001");
    const bAmt = Number(b.finalAmount ?? b.amount ?? b.total ?? b.totalAmount ?? b.grandTotal ?? 0) ||
      (Array.isArray(b.items) ? b.items.reduce((s, it) => s + (Number(it.total || (it.quantity * it.price)) || 0), 0) : 0);
    const pMode = (b.paymentMode || b.paymentType || b.type || "CASH").toUpperCase();
    const id = b._id || b.id || this.generateId("bill");

    return {
      _id: id,
      id: bNo,
      billNumber: bNo,
      invoiceNumber: bNo,
      customerName: b.customerName || b.partyName || b.customer || "Walk-in Customer",
      party: b.party || b.partyId || "",
      partyId: b.partyId || (b.party && typeof b.party === "object" ? b.party._id : b.party) || "",
      partyName: b.partyName || b.customerName || b.customer || "Walk-in Customer",
      phone: b.customerPhone || b.phone || b.mobileNumber || "",
      amount: bAmt,
      finalAmount: bAmt,
      total: bAmt,
      totalAmount: bAmt,
      grandTotal: bAmt,
      type: pMode,
      paymentMode: pMode,
      paymentMethod: (pMode === "UDHAR" || pMode === "CREDIT") ? "credit" : "cash",
      paymentStatus: b.paymentStatus || (pMode === "UDHAR" ? "unpaid" : "paid"),
      date: b.date ? (String(b.date).includes("-") || String(b.date).includes("/") ? new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : String(b.date)) : "Today",
      rawDate: (() => {
        const candidates = [b.rawDate, b.createdAt, b.date];
        for (const c of candidates) {
          if (!c) continue;
          if (c instanceof Date && !isNaN(c.getTime())) return c.toISOString();
          const str = String(c).trim();
          if (str.includes("T") || str.match(/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/)) {
            const d = new Date(str);
            if (!isNaN(d.getTime())) return d.toISOString();
          }
        }
        return b.rawDate || b.createdAt || new Date().toISOString();
      })(),
      items: Array.isArray(b.items) ? b.items : [],
      isOfflineCreated: Boolean(b.isOfflineCreated),
      createdAt: b.createdAt || new Date().toISOString(),
      updatedAt: b.updatedAt || new Date().toISOString()
    };
  }

  getBills(companyId) {
    this.runAutoMigration(companyId);
    if (typeof localStorage === "undefined") return [];

    const key = this.getKey("bills", companyId);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map(b => this.normalizeBill(b)).filter(Boolean);
        }
      }
    } catch (e) {
      console.warn("[StorageManager] getBills error:", e);
    }
    return [];
  }

  saveBills(companyId, billsList = []) {
    if (typeof localStorage === "undefined" || !Array.isArray(billsList)) return [];

    const cid = String(companyId || localStorage.getItem("companyId") || "default").trim();
    const deduped = deduplicateBills(billsList.map(b => this.normalizeBill(b)).filter(Boolean));

    const primaryKey = this.getKey("bills", cid);
    try {
      localStorage.setItem(primaryKey, JSON.stringify(deduped));

      // Mirror to legacy keys
      if (cid && cid !== "default") {
        localStorage.setItem(`vb_local_manual_bills_${cid}`, JSON.stringify(deduped));
      }
      localStorage.setItem("vb_local_manual_bills", JSON.stringify(deduped));
      localStorage.setItem("bills", JSON.stringify(deduped));
    } catch (e) {
      console.warn("[StorageManager] saveBills storage quota warning:", e);
    }
    return deduped;
  }

  saveBill(companyId, bill) {
    const norm = this.normalizeBill(bill);
    if (!norm) return null;

    const current = this.getBills(companyId);
    const updated = deduplicateBills([norm, ...current]);
    this.saveBills(companyId, updated);
    return norm;
  }

  mergeBills(companyId, serverBills = []) {
    const localBills = this.getBills(companyId);
    const normServer = (Array.isArray(serverBills) ? serverBills : []).map(b => this.normalizeBill(b)).filter(Boolean);

    // CRITICAL: Deduplicate with authoritative server priority without wiping local offline bills
    const merged = deduplicateBills([...normServer, ...localBills]);
    this.saveBills(companyId, merged);
    return merged;
  }

  // ==========================================
  // 3. EXPENSES REPOSITORY
  // ==========================================

  normalizeExpense(e) {
    if (!e || typeof e !== "object") return null;
    const id = e._id || e.id || this.generateId("exp");
    return {
      _id: id,
      id,
      title: String(e.title || e.category || "विविध खर्च").trim(),
      amount: Number(e.amount || 0),
      category: e.category || "विविध खर्च",
      expenseType: e.expenseType || (e.familyMember ? "drawings" : "operating"),
      familyMember: e.familyMember || "",
      staffId: e.staffId || null,
      paymentMethod: e.paymentMethod || "CASH",
      date: e.date || new Date().toISOString(),
      notes: e.notes || "",
      createdAt: e.createdAt || new Date().toISOString()
    };
  }

  getExpenses(companyId) {
    this.runAutoMigration(companyId);
    if (typeof localStorage === "undefined") return [];

    const key = this.getKey("expenses", companyId);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map(e => this.normalizeExpense(e)).filter(Boolean);
        }
      }
    } catch (err) {}
    return [];
  }

  saveExpenses(companyId, expensesList = []) {
    if (typeof localStorage === "undefined" || !Array.isArray(expensesList)) return [];

    const cid = String(companyId || localStorage.getItem("companyId") || "default").trim();
    const deduped = deduplicateExpenses(expensesList.map(e => this.normalizeExpense(e)).filter(Boolean));

    const primaryKey = this.getKey("expenses", cid);
    try {
      localStorage.setItem(primaryKey, JSON.stringify(deduped));
      if (cid && cid !== "default") {
        localStorage.setItem(`vb_local_expenses_${cid}`, JSON.stringify(deduped));
      }
      localStorage.setItem("vb_local_expenses", JSON.stringify(deduped));
    } catch (e) {}
    return deduped;
  }

  // ==========================================
  // 4. AUTOMATIC LEGACY MIGRATION ENGINE
  // ==========================================

  runAutoMigration(companyId) {
    if (typeof localStorage === "undefined") return;
    const cid = String(companyId || localStorage.getItem("companyId") || "default").trim();
    if (this.migratedCompanies.has(cid)) return;

    try {
      // 1. Migrate Parties
      const primaryPartyKey = this.getKey("parties", cid);
      const existingPrimaryParties = localStorage.getItem(primaryPartyKey);
      if (!existingPrimaryParties || existingPrimaryParties === "[]") {
        const partyKeys = [
          cid && cid !== "default" ? `vb_local_parties_${cid}` : null,
          "vb_local_parties",
          "parties",
          "local_parties"
        ].filter(Boolean);

        const collectedParties = [];
        partyKeys.forEach(k => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const p = JSON.parse(raw);
              if (Array.isArray(p)) collectedParties.push(...p);
            }
          } catch (e) {}
        });

        if (collectedParties.length > 0) {
          const partyMap = new Map();
          collectedParties.forEach(p => {
            const norm = this.normalizeParty(p);
            if (!norm) return;
            const uKey = this.getPartyUniqueKey(norm);
            if (uKey && !partyMap.has(uKey)) {
              partyMap.set(uKey, norm);
            }
          });
          const migrated = Array.from(partyMap.values());
          if (migrated.length > 0) {
            localStorage.setItem(primaryPartyKey, JSON.stringify(migrated));
          }
        }
      }

      // 2. Migrate Bills
      const primaryBillKey = this.getKey("bills", cid);
      const existingPrimaryBills = localStorage.getItem(primaryBillKey);
      if (!existingPrimaryBills || existingPrimaryBills === "[]") {
        const billKeys = [
          cid && cid !== "default" ? `vb_local_manual_bills_${cid}` : null,
          "vb_local_manual_bills",
          "bills",
          "manual_bills",
          "vb_bills",
          "sales"
        ].filter(Boolean);

        const collectedBills = [];
        billKeys.forEach(k => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const b = JSON.parse(raw);
              if (Array.isArray(b)) collectedBills.push(...b);
            }
          } catch (e) {}
        });

        if (collectedBills.length > 0) {
          const deduped = deduplicateBills(collectedBills.map(b => this.normalizeBill(b)).filter(Boolean));
          if (deduped.length > 0) {
            localStorage.setItem(primaryBillKey, JSON.stringify(deduped));
          }
        }
      }

      // 3. Migrate Expenses
      const primaryExpKey = this.getKey("expenses", cid);
      const existingPrimaryExp = localStorage.getItem(primaryExpKey);
      if (!existingPrimaryExp || existingPrimaryExp === "[]") {
        const expKeys = [
          cid && cid !== "default" ? `vb_local_expenses_${cid}` : null,
          "vb_local_expenses",
          "expenses",
          "gharKharchList"
        ].filter(Boolean);

        const collectedExp = [];
        expKeys.forEach(k => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const e = JSON.parse(raw);
              if (Array.isArray(e)) collectedExp.push(...e);
            }
          } catch (e) {}
        });

        if (collectedExp.length > 0) {
          const deduped = deduplicateExpenses(collectedExp.map(e => this.normalizeExpense(e)).filter(Boolean));
          if (deduped.length > 0) {
            localStorage.setItem(primaryExpKey, JSON.stringify(deduped));
          }
        }
      }

      this.migratedCompanies.add(cid);
    } catch (migErr) {
      console.warn("[StorageManager] Auto-migration warning:", migErr);
    }
  }
}

export const storageManager = new StorageManager();
export default storageManager;
