export const normalizeGstType = (type) => {
  if (!type) return "regular";
  const t = String(type).toLowerCase().trim();

  if (t === "composite") return "composition";
  if (t === "unregistered") return "unregistered";

  return t;
};

export const getGstFlags = (gstType, isGstEnabled) => {
  const type = normalizeGstType(gstType);

  const isComposition = type === "composition";
  const isUnregistered = type === "unregistered";

  return {
    isComposition,
    isUnregistered,
    showPurchaseGST: isGstEnabled && !isUnregistered && (type === "regular" || isComposition),
    showSalesGST: isGstEnabled && type === "regular",
    showHSN: isGstEnabled && !isUnregistered,
  };
};