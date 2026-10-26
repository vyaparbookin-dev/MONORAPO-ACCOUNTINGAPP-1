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
    const pType = String(p.partyType || p.type || "customer").toLowerCase();
    const isSupplier = pType === "supplier" || pType.includes("sup") || pType.includes("vendor");

    let rawBal = Number(p.currentBalance ?? p.balance ?? p.openingBalance ?? 0);
    const opBal = Math.abs(Number(p.openingBalance || 0));

    // If supplier balance is positive from opening balance, treat as payable (negative / देने हैं)
    if (isSupplier && opBal > 0) {
      if (rawBal > 0 && Math.abs(rawBal) === opBal) {
        rawBal = -opBal;
      }
    }
    const finalBal = isNaN(rawBal) ? 0 : rawBal;
    const pName = String(p.name || p.partyName || "").trim();
    const pMobile = String(p.mobileNumber || p.phone || "").trim();
    const id = p._id || p.id || this.generateId("party");

    return {
      id,
      _id: id,
      name: pName || "अज्ञात पार्टी",
      mobileNumber: pMobile,
      phone: pMobile,
      balance: finalBal,
      currentBalance: finalBal,
      openingBalance: opBal,
      partyType: isSupplier ? "supplier" : (pType === "personal" ? "personal" : (pType === "both" ? "both" : "customer")),
      type: isSupplier ? "supplier" : (pType === "personal" ? "personal" : (pType === "both" ? "both" : "customer")),
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
    const name = String(p.name || p.partyName || "").trim().toLowerCase();
    const phone = String(p.phone || p.mobileNumber || "").replace(/\D/g, "").slice(-10);
    if (name) return `name_${name}`;
    if (phone && phone.length === 10 && phone !== "9999999999") return `phone_${phone}`;
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
    const pId = String(norm._id || norm.id || '').trim();
    const pName = String(norm.name || norm.partyName || '').trim().toLowerCase();
    const pPhone = String(norm.phone || norm.mobileNumber || '').replace(/\D/g, '').slice(-10);

    let updated = false;
    const nextList = current.map(p => {
      const eId = String(p._id || p.id || '').trim();
      const eName = String(p.name || p.partyName || '').trim().toLowerCase();
      const ePhone = String(p.phone || p.mobileNumber || '').replace(/\D/g, '').slice(-10);

      const isMatch = (pId && eId && pId === eId) ||
        (pName && eName && pName === eName) ||
        (pPhone && ePhone && pPhone.length === 10 && ePhone.length === 10 && pPhone === ePhone && pPhone !== "9999999999");

      if (isMatch) {
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
    const partyList = [];

    const findMatchIndex = (party) => {
      const pId = String(party._id || party.id || '').trim();
      const pName = String(party.name || party.partyName || '').trim().toLowerCase();
      const pPhone = String(party.phone || party.mobileNumber || '').replace(/\D/g, '').slice(-10);

      return partyList.findIndex(existing => {
        const eId = String(existing._id || existing.id || '').trim();
        const eName = String(existing.name || existing.partyName || '').trim().toLowerCase();
        const ePhone = String(existing.phone || existing.mobileNumber || '').replace(/\D/g, '').slice(-10);

        if (pId && eId && pId === eId) return true;
        if (pName && eName && pName === eName) return true;
        if (pPhone && ePhone && pPhone.length === 10 && ePhone.length === 10 && pPhone === ePhone && pPhone !== "9999999999") return true;
        return false;
      });
    };

    // 1. Add local parties, deduplicating among themselves
    localParties.forEach(p => {
      if (!p || p.isActive === false || p.isDeleted === true) return;
      const idx = findMatchIndex(p);
      if (idx >= 0) {
        partyList[idx] = { ...partyList[idx], ...p };
      } else {
        partyList.push(p);
      }
    });

    // 2. Authoritative server merge (server data takes precedence)
    (Array.isArray(serverParties) ? serverParties : []).forEach(sp => {
      const normServer = this.normalizeParty(sp);
      if (!normServer || normServer.isActive === false || normServer.isDeleted === true) return;
      const idx = findMatchIndex(normServer);
      if (idx >= 0) {
        partyList[idx] = { ...partyList[idx], ...normServer };
      } else {
        partyList.push(normServer);
      }
    });

    this.saveParties(companyId, partyList);
    return partyList;
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

    const parseStorageDate = (val) => {
      if (!val) return null;
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      const str = String(val).trim();
      if (!str) return null;
      if (str.toLowerCase() === "today" || str === "आज") return new Date();

      // If it contains T, parse directly via Date constructor so timezone is respected
      if (str.includes("T")) {
        const d = new Date(str);
        if (!isNaN(d.getTime())) return d;
      }

      // Check YYYY-MM-DD (anchored with $)
      const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (ymd) {
        const d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), 12, 0, 0);
        if (!isNaN(d.getTime())) return d;
      }
      // Check DD-MM-YYYY or DD/MM/YYYY (anchored with $)
      const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (dmy) {
        const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]), 12, 0, 0);
        if (!isNaN(d.getTime())) return d;
      }
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        if (d.getFullYear() > 2000) return d;
        const currentYear = new Date().getFullYear();
        const withYear = new Date(`${str} ${currentYear}`);
        if (!isNaN(withYear.getTime())) return withYear;
      }
      return null;
    };

    const parsedDateObj = parseStorageDate(b.rawDate) || parseStorageDate(b.createdAt) || parseStorageDate(b.date);
    const resolvedRawDate = (b.rawDate && String(b.rawDate).includes("T"))
      ? b.rawDate
      : (parsedDateObj ? parsedDateObj.toISOString() : (b.rawDate || b.createdAt || new Date().toISOString()));
    const resolvedDateDisplay = (b.date === "Today" || b.date === "आज")
      ? "Today"
      : (parsedDateObj
          ? parsedDateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
          : (b.date || "Today"));

    const rawImages = (b.billImageUrls && Array.isArray(b.billImageUrls) && b.billImageUrls.length > 0)
      ? b.billImageUrls
      : (b.billImageUrl ? [b.billImageUrl] : []);
    const uniqueImages = Array.from(new Set(rawImages.filter(Boolean)));
    const primaryImg = b.billImageUrl || (uniqueImages.length > 0 ? uniqueImages[0] : "");

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
      billImageUrl: primaryImg,
      billImageUrls: uniqueImages,
      notes: b.notes || "",
      status: b.status || (pMode === "UDHAR" ? "issued" : "paid"),
      dueDate: b.dueDate || "",
      tax: Number(b.tax) || 0,
      discountAmount: Number(b.discountAmount) || 0,
      customerAddress: b.customerAddress || b.address || "",
      customerGst: b.customerGst || b.gstin || "",
      date: resolvedDateDisplay,
      rawDate: resolvedRawDate,
      items: Array.isArray(b.items) ? b.items : [],
      isOfflineCreated: Boolean(b.isOfflineCreated),
      createdAt: b.createdAt || resolvedRawDate,
      updatedAt: b.updatedAt || new Date().toISOString()
    };
  }

  getBills(companyId) {
    this.runAutoMigration(companyId);
    if (typeof localStorage === "undefined") return [];

    const cid = String(companyId || localStorage.getItem("companyId") || "default").trim();
    const key = this.getKey("bills", cid);
    const collected = [];

    // 1. Read primary v2 key
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) collected.push(...parsed);
      }
    } catch (e) {
      console.warn("[StorageManager] getBills error:", e);
    }

    // 2. Also sweep candidate keys so offline / manual cash sales (like vb_local_manual_bills) are never missed
    const candidateKeys = [
      cid && cid !== "default" ? `vb_local_manual_bills_${cid}` : null,
      "vb_local_manual_bills",
      "bills",
      "manual_bills",
      "vb_bills",
      "sales"
    ].filter(Boolean);

    for (const k of candidateKeys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) collected.push(...parsed);
        }
      } catch (err) {}
    }

    const deduped = deduplicateBills(collected.map(b => this.normalizeBill(b)).filter(Boolean));
    return deduped;
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
    if (!norm) return this.getBills(companyId);

    const current = this.getBills(companyId);
    const updated = deduplicateBills([norm, ...current]);
    this.saveBills(companyId, updated);
    return updated;
  }

  updateBill(companyId, bill) {
    const norm = this.normalizeBill(bill);
    if (!norm) return this.getBills(companyId);

    const current = this.getBills(companyId);
    const targetId = String(norm._id || norm.id || norm.billNumber || "").trim();
    let found = false;

    const nextList = current.map(b => {
      const bId = String(b._id || b.id || b.billNumber || "").trim();
      const bNum = String(b.billNumber || b.invoiceNumber || "").trim();
      if ((targetId && bId && targetId === bId) || (norm.billNumber && bNum && norm.billNumber === bNum)) {
        found = true;
        return { ...b, ...norm, updatedAt: new Date().toISOString() };
      }
      return b;
    });

    if (!found) {
      nextList.unshift(norm);
    }

    this.saveBills(companyId, nextList);
    return nextList;
  }

  deleteBill(companyId, billId) {
    if (!billId) return this.getBills(companyId);
    const current = this.getBills(companyId);
    const targetId = String(billId).trim();
    const nextList = current.filter(b => {
      const bId = String(b._id || b.id || b.billNumber || "").trim();
      const bNum = String(b.billNumber || b.invoiceNumber || "").trim();
      return bId !== targetId && bNum !== targetId;
    });
    this.saveBills(companyId, nextList);
    return nextList;
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
