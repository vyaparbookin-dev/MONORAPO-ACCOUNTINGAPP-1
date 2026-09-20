const normalizeCompanyId = (companyId) => {
  if (companyId === null || companyId === undefined) return "";
  const value = String(companyId).trim();
  if (value === "null" || value === "undefined" || value === "") return "";
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
};

export const getCompanyScopedStorageKey = (baseKey, companyId) => {
  const cleanCompanyId = normalizeCompanyId(companyId);
  if (!baseKey) return baseKey;
  if (!cleanCompanyId) return baseKey;
  return `${baseKey}_${cleanCompanyId}`;
};

const mergeScopedData = (items, companyId) => {
  const unique = [];
  const seen = new Set();
  const companyIdValue = normalizeCompanyId(companyId);

  for (const item of Array.isArray(items) ? items : []) {
    if (!item || typeof item !== "object") continue;
    const companyMatch = normalizeCompanyId(
      item.companyId || item.company_id || item.company || item.businessId || item.companyID
    );

    if (companyIdValue && companyMatch && companyMatch !== companyIdValue) {
      continue;
    }

    const key = item._id || item.id || item.billNumber || item.invoiceNumber || JSON.stringify({
      company: companyMatch,
      amount: item.amount || item.finalAmount || item.total || 0,
      date: item.rawDate || item.date || item.createdAt || "",
      name: item.customerName || item.partyName || item.customer || ""
    });

    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return unique;
};

export const readCompanyScopedJson = (baseKeys, companyId, fallback = []) => {
  if (typeof localStorage === "undefined") return fallback;
  const keys = Array.isArray(baseKeys) ? baseKeys : [baseKeys];
  const companyIdValue = normalizeCompanyId(companyId);
  const candidates = [];

  for (const key of keys) {
    const scopedKey = getCompanyScopedStorageKey(key, companyIdValue);
    candidates.push(scopedKey, key);
  }

  const seen = new Set();
  const collected = [];

  for (const key of candidates) {
    if (seen.has(key)) continue;
    seen.add(key);

    try {
      const rawValue = localStorage.getItem(key);
      if (rawValue === null || rawValue === undefined || rawValue === "null") continue;
      const parsed = JSON.parse(rawValue);
      if (parsed === null) continue;
      if (Array.isArray(parsed)) {
        collected.push(...parsed);
        continue;
      }
      return parsed;
    } catch (error) {
      continue;
    }
  }

  if (collected.length > 0) {
    return mergeScopedData(collected, companyIdValue);
  }

  return fallback;
};

export const writeCompanyScopedJson = (baseKeys, value, companyId) => {
  if (typeof localStorage === "undefined") return;
  const keys = Array.isArray(baseKeys) ? baseKeys : [baseKeys];
  const payload = typeof value === "string" ? value : JSON.stringify(value);
  const companyIdValue = normalizeCompanyId(companyId);
  const uniqueKeys = [];
  const seen = new Set();

  for (const key of keys) {
    const scopedKey = getCompanyScopedStorageKey(key, companyIdValue);
    for (const candidate of [scopedKey, key]) {
      if (!seen.has(candidate)) {
        seen.add(candidate);
        uniqueKeys.push(candidate);
      }
    }
  }

  for (const key of uniqueKeys) {
    try {
      localStorage.setItem(key, payload);
    } catch (error) {
      continue;
    }
  }
};

export const filterCompanyScopedBills = (bills, companyId) => {
  if (!Array.isArray(bills)) return [];
  const companyIdValue = normalizeCompanyId(companyId);

  return bills.filter((bill) => {
    if (!bill) return false;
    const billCompanyId = normalizeCompanyId(
      bill.companyId || bill.company_id || bill.company || bill.businessId || bill.companyID
    );

    if (!companyIdValue) return true;
    if (!billCompanyId) return true;
    return billCompanyId === companyIdValue;
  });
};

export const readCompanyScopedBills = (billKeys, companyId, fallback = []) => {
  const rawValue = readCompanyScopedJson(billKeys, companyId, fallback);
  const merged = Array.isArray(rawValue) ? rawValue : [];
  const data = mergeScopedData(merged, companyId);
  return filterCompanyScopedBills(data, companyId);
};

export default {
  getCompanyScopedStorageKey,
  readCompanyScopedJson,
  writeCompanyScopedJson,
  filterCompanyScopedBills,
  readCompanyScopedBills
};
