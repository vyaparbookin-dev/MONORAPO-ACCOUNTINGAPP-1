export const applyScheme = (billAmount, scheme) => {
  if (!scheme) return billAmount;
  
  if (scheme.type === "percentage") {
    return billAmount - (billAmount * scheme.value) / 100;
  } else if (scheme.type === "flat") {
    return billAmount - scheme.value;
  }
  return billAmount;
};