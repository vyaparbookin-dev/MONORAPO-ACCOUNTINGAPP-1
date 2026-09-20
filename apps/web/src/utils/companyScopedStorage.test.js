import test from 'node:test';
import assert from 'node:assert/strict';
import { getCompanyScopedStorageKey, filterCompanyScopedBills } from './companyScopedStorage.js';

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
