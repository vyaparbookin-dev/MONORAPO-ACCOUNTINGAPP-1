/**
 * 2. PRODUCT MATCHER — Exact / Barcode / Alias / Fuzzy (Fuse.js)
 * Includes Smart Memory (Product Aliases) for vendor invoice mapping
 */
export async function matchProducts(scannedItems, productCatalog = []) {
  let Fuse;
  try {
    const fuseModule = await import("fuse.js");
    Fuse = fuseModule.default || fuseModule;
  } catch (e) {
    console.warn("[Matcher] Fuse.js load notice, fallback to exact matching:", e.message);
  }

  // Build fuse instance if available
  const fuse = Fuse ? new Fuse(productCatalog, {
    keys: [
      { name: "aliases", weight: 0.5 },
      { name: "name", weight: 0.4 },
      { name: "sku", weight: 0.2 },
      { name: "barcode", weight: 0.2 }
    ],
    threshold: 0.4, // Lower = stricter
    includeScore: true,
  }) : null;

  return scannedItems.map((item) => {
    const rawTrim = String(item.rawName || "").trim();
    const rawLower = rawTrim.toLowerCase();

    // ---------------------------------------------------------
    // STEP 1: Barcode / SKU Exact Match (Highest Reliability)
    // ---------------------------------------------------------
    if (item.barcode) {
      const barcodeMatch = productCatalog.find(
        (p) => String(p.barcode || "").trim() === String(item.barcode).trim() ||
               String(p.sku || "").trim().toLowerCase() === String(item.barcode).trim().toLowerCase()
      );
      if (barcodeMatch) {
        return {
          ...item,
          matchType: "exact-barcode",
          product: barcodeMatch,
          confidence: 100,
        };
      }
    }

    // ---------------------------------------------------------
    // STEP 2: Smart Memory (Saved Aliases from previous merges)
    // ---------------------------------------------------------
    const aliasMatch = productCatalog.find((p) => {
      if (Array.isArray(p.aliases) && p.aliases.length > 0) {
        return p.aliases.some((al) => String(al || "").trim().toLowerCase() === rawLower);
      }
      return false;
    });
    if (aliasMatch) {
      return {
        ...item,
        matchType: "alias-memory",
        product: aliasMatch,
        confidence: 99,
        reason: "Previously merged alias"
      };
    }

    // ---------------------------------------------------------
    // STEP 3: Exact Name Match (Case-Insensitive)
    // ---------------------------------------------------------
    const exactNameMatch = productCatalog.find(
      (p) => String(p.name || "").trim().toLowerCase() === rawLower
    );
    if (exactNameMatch) {
      return {
        ...item,
        matchType: "exact",
        product: exactNameMatch,
        confidence: 100,
      };
    }

    // ---------------------------------------------------------
    // STEP 4: Fuzzy Search with Fuse.js
    // ---------------------------------------------------------
    if (fuse) {
      const results = fuse.search(rawTrim);
      if (results.length > 0) {
        const best = results[0];
        const confidence = Math.round((1 - best.score) * 100);

        if (confidence >= 80) {
          return {
            ...item,
            matchType: "high-confidence",
            product: best.item,
            confidence,
          };
        }

        // Borderline (55% - 79%): Send top candidates to user for confirm tap
        return {
          ...item,
          matchType: "needs-confirmation",
          product: null,
          confidence,
          candidates: results.slice(0, 3).map((r) => ({
            product: r.item,
            confidence: Math.round((1 - r.score) * 100),
          })),
        };
      }
    }

    // ---------------------------------------------------------
    // STEP 5: No Match Found (New item to be added or mapped manually)
    // ---------------------------------------------------------
    return {
      ...item,
      matchType: "no-match",
      product: null,
      confidence: 0,
      candidates: [],
    };
  });
}
