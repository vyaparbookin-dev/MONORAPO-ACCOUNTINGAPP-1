// Smart Voice Order & Inventory Parser
// Supports Hindi, Hinglish, English spoken numbers, units, pricing, and fuzzy inventory matching

const HINDI_NUMBERS = {
  "आधा": 0.5,
  "पौना": 0.75,
  "एक": 1,
  "वन": 1,
  "one": 1,
  "डेढ़": 1.5,
  "दो": 2,
  "टू": 2,
  "two": 2,
  "ढाई": 2.5,
  "तीन": 3,
  "थ्री": 3,
  "three": 3,
  "चार": 4,
  "फोर": 4,
  "four": 4,
  "पांच": 5,
  "पाँच": 5,
  "फाइव": 5,
  "five": 5,
  "छह": 6,
  "छः": 6,
  "सिक्स": 6,
  "six": 6,
  "सात": 7,
  "सेवन": 7,
  "seven": 7,
  "आठ": 8,
  "एट": 8,
  "eight": 8,
  "नौ": 9,
  "नाइन": 9,
  "nine": 9,
  "दस": 10,
  "टेन": 10,
  "ten": 10,
  "ग्यारह": 11,
  "बारह": 12,
  "तेरह": 13,
  "चौदह": 14,
  "पंद्रह": 15,
  "सोलह": 16,
  "सत्रह": 17,
  "अठारह": 18,
  "उन्नीस": 19,
  "बीस": 20,
  "इक्कीस": 21,
  "बाईस": 22,
  "तेईस": 23,
  "चौबीस": 24,
  "पच्चीस": 25,
  "छब्बीस": 26,
  "सत्ताईस": 27,
  "अट्ठाईस": 28,
  "उनतीस": 29,
  "तीस": 30,
  "पैंतीस": 35,
  "चालीस": 40,
  "पैंतालीस": 45,
  "पचास": 50,
  "साठ": 60,
  "सत्तर": 70,
  "अस्सी": 80,
  "नब्बे": 90,
  "सौ": 100,
  "डेढ़ सौ": 150,
  "दो सौ": 200,
  "ढाई सौ": 250,
  "तीन सौ": 300,
  "चार सौ": 400,
  "पांच सौ": 500,
  "हजार": 1000
};

const UNIT_MAP = {
  "किलो": "kg",
  "केलो": "kg",
  "किलोग्राम": "kg",
  "kg": "kg",
  "kilo": "kg",
  "ग्राम": "gm",
  "gm": "gm",
  "gram": "gm",
  "लीटर": "ltr",
  "लिटर": "ltr",
  "ltr": "ltr",
  "liter": "ltr",
  "litre": "ltr",
  "प्लेट": "plate",
  "plate": "plate",
  "plt": "plate",
  "पैकेट": "packet",
  "पाकेट": "packet",
  "पॉकेट": "packet",
  "packet": "packet",
  "pkt": "packet",
  "pack": "packet",
  "पीस": "pcs",
  "नग": "pcs",
  "दाना": "pcs",
  "pcs": "pcs",
  "pc": "pcs",
  "piece": "pcs",
  "pieces": "pcs",
  "बोतल": "bottle",
  "bottle": "bottle",
  "btl": "bottle",
  "डिब्बा": "box",
  "बॉक्स": "box",
  "box": "box",
  "दर्जन": "dozen",
  "dozen": "dozen",
  "मीटर": "meter",
  "meter": "meter",
  "mtr": "meter",
  "बोरी": "bag",
  "बैग": "bag",
  "कट्टा": "bag",
  "bag": "bag"
};

// Levenshtein distance for fuzzy matching
export function levenshteinDistance(s1, s2) {
  const a = String(s1 || "").toLowerCase().trim();
  const b = String(s2 || "").toLowerCase().trim();
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Compute fuzzy similarity score between 0.0 and 1.0
export function calculateSimilarity(query, target) {
  const q = String(query || "").toLowerCase().trim();
  const t = String(target || "").toLowerCase().trim();
  if (!q || !t) return 0;
  if (q === t) return 1;

  // Exact substring match bonus
  if (t.includes(q)) return 0.85 + (q.length / t.length) * 0.15;
  if (q.includes(t)) return 0.80 + (t.length / q.length) * 0.15;

  // Word token overlap
  const qWords = q.split(/\s+/);
  const tWords = t.split(/\s+/);
  let matchedTokens = 0;
  for (const qw of qWords) {
    if (qw.length > 1 && tWords.some(tw => tw.includes(qw) || qw.includes(tw))) {
      matchedTokens++;
    }
  }
  const tokenScore = matchedTokens / Math.max(qWords.length, tWords.length);
  if (tokenScore > 0.6) return 0.75 + tokenScore * 0.2;

  // Levenshtein distance
  const dist = levenshteinDistance(q, t);
  const maxLen = Math.max(q.length, t.length);
  const levScore = 1 - dist / maxLen;

  return Math.max(levScore, tokenScore * 0.8);
}

// Find closest matching product from inventory
export function findBestProductMatch(rawName, inventoryList = []) {
  if (!rawName || !inventoryList || inventoryList.length === 0) {
    return { matchedProduct: null, score: 0, isMatch: false };
  }

  const cleanQuery = rawName.toLowerCase().replace(/[^\w\s\u0900-\u097F]/gi, " ").trim();
  let bestMatch = null;
  let highestScore = 0;

  for (const prod of inventoryList) {
    const prodName = prod.name || prod.productName || "";
    const score = calculateSimilarity(cleanQuery, prodName);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = prod;
    }
  }

  // Threshold: at least 42% similarity to count as matched
  const isMatch = highestScore >= 0.42;
  return {
    matchedProduct: isMatch ? bestMatch : null,
    score: Math.round(highestScore * 100),
    isMatch
  };
}

// Parse single item text chunk into quantity, unit, name, price
export function parseSingleItemText(textChunk, inventoryList = []) {
  let text = String(textChunk || "").trim();
  if (!text) return null;

  let quantity = 1;
  let unit = "pcs";
  let rate = 0;

  // 1. Extract Price if mentioned ("250 रुपये", "₹50", "@ 120", "का 40")
  const priceRegex = /(?:₹|rs\.?|inr|rate|रुपये|रुपए|वाले|वाला|का|at|@)?\s*(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|inr|रुपये|रुपए)?$/i;
  const priceMatch = text.match(priceRegex);
  if (priceMatch && priceMatch[1]) {
    const possiblePrice = parseFloat(priceMatch[1]);
    if (possiblePrice > 0) {
      rate = possiblePrice;
      text = text.substring(0, priceMatch.index).trim();
    }
  }

  // Check Hindi compound prices at the end ("ढाई सौ", "दो सौ", "डेढ़ सौ")
  const hindiPriceEnding = /(?:ढाई\s*सौ|दो\s*सौ|डेढ़\s*सौ|तीन\s*सौ|चार\s*सौ|पांच\s*सौ|सौ)$/i;
  const hpMatch = text.match(hindiPriceEnding);
  if (hpMatch) {
    const val = HINDI_NUMBERS[hpMatch[0].trim()];
    if (val) {
      rate = val;
      text = text.substring(0, hpMatch.index).trim();
    }
  }

  // 2. Extract Quantity at start (numeric or Hindi word)
  const numStartRegex = /^(\d+(?:\.\d+)?)\s*/;
  const numStartMatch = text.match(numStartRegex);
  if (numStartMatch) {
    quantity = parseFloat(numStartMatch[1]);
    text = text.substring(numStartMatch[0].length).trim();
  } else {
    // Check Hindi number word at start
    const firstTwoWords = text.split(/\s+/).slice(0, 2).join(" ");
    const firstWord = text.split(/\s+/)[0];

    if (HINDI_NUMBERS[firstTwoWords] !== undefined && HINDI_NUMBERS[firstTwoWords] !== null) {
      quantity = HINDI_NUMBERS[firstTwoWords];
      text = text.substring(firstTwoWords.length).trim();
    } else if (HINDI_NUMBERS[firstWord] !== undefined && HINDI_NUMBERS[firstWord] !== null) {
      quantity = HINDI_NUMBERS[firstWord];
      text = text.substring(firstWord.length).trim();
    }
  }

  // 3. Extract Unit after quantity
  const words = text.split(/\s+/);
  if (words.length > 0) {
    const candidateUnit = words[0].toLowerCase();
    if (UNIT_MAP[candidateUnit]) {
      unit = UNIT_MAP[candidateUnit];
      text = words.slice(1).join(" ").trim();
    }
  }

  // 4. Remaining text is Product Name
  let rawName = text.replace(/^(के|का|की|और|को|में)\s+/i, "").trim();
  rawName = rawName.replace(/\s+(के|का|की|और|को)$/i, "").trim();
  if (!rawName) rawName = "आइटम";

  // 5. Fuzzy Match against inventory
  const { matchedProduct, score, isMatch } = findBestProductMatch(rawName, inventoryList);

  const finalName = matchedProduct ? matchedProduct.name : rawName;
  const finalUnit = matchedProduct?.unit ? matchedProduct.unit : unit;
  const finalRate = rate > 0 ? rate : (matchedProduct?.sellingPrice || matchedProduct?.price || 0);

  return {
    id: `voice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    rawSpokenText: textChunk,
    name: finalName,
    spokenName: rawName,
    quantity: quantity || 1,
    unit: finalUnit,
    rate: finalRate,
    costPrice: matchedProduct?.costPrice || Math.round(finalRate * 0.75),
    total: Math.round((quantity || 1) * finalRate),
    category: matchedProduct?.category || "General",
    productId: matchedProduct?._id || matchedProduct?.id || null,
    isMatched: isMatch,
    matchScore: score,
    matchedInventoryItem: matchedProduct,
    isNewItem: !isMatch,
    autoCreateInInventory: !isMatch
  };
}

// Parse entire spoken sentence into multiple items
export function parseSpeechToItems(transcript, inventoryList = []) {
  if (!transcript || !transcript.trim()) return [];

  const raw = transcript.trim();

  // Split into chunks by separators: "और", "तथा", "comma", "and", "plus", "फिर", "\n", ";"
  const chunks = raw
    .split(/(?:\s+(?:और|तथा|and|plus|फिर|\+|next|dusra|दूसरा)\s+|[,;\n]+)/i)
    .map(c => c.trim())
    .filter(c => c.length > 0);

  const items = [];
  for (const chunk of chunks) {
    const parsed = parseSingleItemText(chunk, inventoryList);
    if (parsed && parsed.name) {
      items.push(parsed);
    }
  }

  return items;
}