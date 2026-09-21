/**
 * Deduplicates an array of expense records across local storage optimistic IDs
 * and authoritative server IDs (MongoDB ObjectId / Supabase UUID).
 */
export function deduplicateExpenses(items = []) {
  if (!Array.isArray(items)) return [];

  const seenIds = new Set();
  const seenFingerprints = new Set();
  const result = [];

  // Sort so that real server records (ObjectId or UUID) come before temporary local ones (exp_ or temp_)
  const sorted = [...items].sort((a, b) => {
    const aId = String(a?._id || a?.id || '');
    const bId = String(b?._id || b?.id || '');
    const aIsTemp = aId.startsWith('exp_') || aId.startsWith('temp_') || aId.startsWith('mock_') || !aId;
    const bIsTemp = bId.startsWith('exp_') || bId.startsWith('temp_') || bId.startsWith('mock_') || !bId;
    if (aIsTemp && !bIsTemp) return 1;
    if (!aIsTemp && bIsTemp) return -1;
    return 0;
  });

  for (const item of sorted) {
    if (!item) continue;
    const id = String(item._id || item.id || '');
    const isTemp = id.startsWith('exp_') || id.startsWith('temp_') || id.startsWith('mock_') || !id;

    // Normalize date to YYYY-MM-DD
    let dateStr = '';
    if (item.date) {
      dateStr = typeof item.date === 'string' ? item.date.slice(0, 10) : new Date(item.date).toISOString().slice(0, 10);
    }

    const titleNorm = String(item.title || '').trim().toLowerCase();
    const amtNorm = Number(item.amount || 0).toFixed(2);
    const flowNorm = String(item.transactionFlow || 'given').toLowerCase();
    const typeNorm = String(item.expenseType || 'operating').toLowerCase();
    const memberNorm = String(item.familyMember || '').trim().toLowerCase();

    // Fingerprint represents business identity of the transaction
    const fp = [titleNorm, amtNorm, dateStr, flowNorm, typeNorm, memberNorm].join("|");

    // 1. If we have already seen this exact ID, skip
    if (id && seenIds.has(id)) {
      continue;
    }

    // 2. If this is a temporary/optimistic item and a server item with the same fingerprint already exists, skip!
    if (isTemp && seenFingerprints.has(fp)) {
      continue;
    }

    // 3. Double-click prevention: if two server items have the exact same fingerprint and were created within 15 seconds of each other
    if (seenFingerprints.has(fp)) {
      const existing = result.find(r => {
        const rTitle = String(r.title || '').trim().toLowerCase();
        const rAmt = Number(r.amount || 0).toFixed(2);
        const rDate = r.date ? (typeof r.date === 'string' ? r.date.slice(0, 10) : new Date(r.date).toISOString().slice(0, 10)) : '';
        return rTitle === titleNorm && rAmt === amtNorm && rDate === dateStr;
      });

      if (existing) {
        const timeA = new Date(item.createdAt || item.date || 0).getTime();
        const timeB = new Date(existing.createdAt || existing.date || 0).getTime();
        if (Math.abs(timeA - timeB) < 15000 && timeA > 0 && timeB > 0) {
          continue;
        }
      }
    }

    if (id) seenIds.add(id);
    seenFingerprints.add(fp);
    result.push(item);
  }

  // Return sorted by date/createdAt descending (newest first)
  return result.sort((a, b) => {
    const da = new Date(a.date || a.createdAt || 0).getTime();
    const db = new Date(b.date || b.createdAt || 0).getTime();
    return db - da;
  });
}

export default deduplicateExpenses;
