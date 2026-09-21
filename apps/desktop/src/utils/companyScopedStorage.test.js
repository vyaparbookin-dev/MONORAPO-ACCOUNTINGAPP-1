import test from 'node:test';
import assert from 'node:assert/strict';
import { getCompanyScopedStorageKey, filterCompanyScopedBills, readCompanyScopedJson, readCompanyScopedBills } from './companyScopedStorage.js';

const mockLocalStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(String(key), String(value)),
    removeItem: (key) => store.delete(String(key)),
    clear: () => store.clear(),
    keys: () => [...store.keys()],
    length: store.size
  };
};

test('scopes storage keys by company id', () => {
  assert.equal(getCompanyScopedStorageKey('bills', 'company_123'), 'bills_company_123');
  assert.equal(getCompanyScopedStorageKey('sales', 'company-456'), 'sales_company-456');
});

test('keeps only current-company bills and leaves unscoped local records available as fallback', () => {
  const bills = [
    { _id: 'a', companyId: 'company_123', amount: 100 },
    { _id: 'b', companyId: 'company_999', amount: 300 },
    { _id: 'c', amount: 200 },
    { _id: 'd', companyId: 'company_123', amount: 50 }
  ];

  const filtered = filterCompanyScopedBills(bills, 'company_123');
  assert.deepEqual(filtered.map((bill) => bill._id), ['a', 'c', 'd']);
});

test('merges scoped and fallback local bill arrays without letting stale unscoped data override the active company', () => {
  const scopedData = [
    { _id: 'sale_1', companyId: 'company_123', amount: 1500 },
    { _id: 'sale_2', companyId: 'company_123', amount: 2500 }
  ];
  const globalFallbackData = [
    { _id: 'sale_old', companyId: 'company_999', amount: 9999 },
    { _id: 'sale_3', amount: 1500 }
  ];

  const prev = globalThis.localStorage;
  globalThis.localStorage = mockLocalStorage();

  try {
    globalThis.localStorage.setItem('bills_company_123', JSON.stringify(scopedData));
    globalThis.localStorage.setItem('bills', JSON.stringify(globalFallbackData));

    const result = readCompanyScopedBills(['bills'], 'company_123', []);
    assert.deepEqual(result.map((bill) => bill._id), ['sale_1', 'sale_2', 'sale_3']);
    assert.ok(!result.some((bill) => bill._id === 'sale_old'));
    assert.deepEqual(readCompanyScopedJson(['bills'], 'company_123', []).map((bill) => bill._id), ['sale_1', 'sale_2', 'sale_3']);
  } finally {
    globalThis.localStorage = prev;
  }
});
