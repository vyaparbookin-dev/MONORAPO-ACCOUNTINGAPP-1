// Common Tax Logic for Web, Mobile & Desktop

export const calculateGST = (amount, rate) => {
  const taxAmount = (amount * rate) / 100;
  const totalAmount = amount + taxAmount;
  
  return { 
    tax: taxAmount,      // Mobile uses 'tax'
    gst: taxAmount,      // Web uses 'gst'
    total: totalAmount,  // Common
    taxAmount            // Explicit name
  };
};

export const calculateTaxBreakdown = (amount, cgst, sgst, igst = 0) => {
  const cgstAmt = (amount * cgst) / 100;
  const sgstAmt = (amount * sgst) / 100;
  const igstAmt = (amount * igst) / 100;
  const total = amount + cgstAmt + sgstAmt + igstAmt;
  return { cgstAmt, sgstAmt, igstAmt, total };
};

// Aliases for backward compatibility with Mobile App
export const calculateTax = calculateGST;

export const gstCalculator = (amount, rate) => {
  const result = calculateGST(amount, rate);
  return { gstAmount: result.tax, total: result.total };
};