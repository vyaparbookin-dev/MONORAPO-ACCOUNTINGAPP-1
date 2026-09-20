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
  for (const key of candidates) {
    if (seen.has(key)) continue;
    seen.add(key);

    try {
      const rawValue = localStorage.getItem(key);
      if (rawValue === null || rawValue === undefined || rawValue === "null") continue;
      const parsed = JSON.parse(rawValue);
      if (parsed !== null) return parsed;
    } catch (error) {
      continue;
    }
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
  const data = Array.isArray(rawValue) ? rawValue : [];
  return filterCompanyScopedBills(data, companyId);
};

export default {
  getCompanyScopedStorageKey,
  readCompanyScopedJson,
  writeCompanyScopedJson,
  filterCompanyScopedBills,
  readCompanyScopedBills
};
