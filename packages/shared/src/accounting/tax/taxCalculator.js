import { roundMoney } from '../money/rounding';

const toValidNumber = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(
      `Validation Error: ${fieldName} must be a valid number.`
    );
  }

  return number;
};

export const calculateGST = (amount, rate) => {
  const taxableAmount = toValidNumber(amount, 'amount');
  const gstRate = toValidNumber(rate, 'GST rate');

  if (taxableAmount < 0) {
    throw new Error(
      'Validation Error: Taxable amount cannot be negative.'
    );
  }

  if (gstRate < 0) {
    throw new Error(
      'Validation Error: GST rate cannot be negative.'
    );
  }

  const taxAmount = roundMoney(
    (taxableAmount * gstRate) / 100
  );

  const totalAmount = roundMoney(
    taxableAmount + taxAmount
  );

  return {
    tax: taxAmount,
    gst: taxAmount,
    taxAmount,
    total: totalAmount
  };
};

export const calculateTaxBreakdown = (
  amount,
  cgstRate = 0,
  sgstRate = 0,
  igstRate = 0
) => {
  const taxableAmount = toValidNumber(amount, 'amount');

  const cgst = toValidNumber(cgstRate, 'CGST rate');
  const sgst = toValidNumber(sgstRate, 'SGST rate');
  const igst = toValidNumber(igstRate, 'IGST rate');

  if (
    taxableAmount < 0 ||
    cgst < 0 ||
    sgst < 0 ||
    igst < 0
  ) {
    throw new Error(
      'Validation Error: Tax amount/rates cannot be negative.'
    );
  }

  const cgstAmt = roundMoney(
    (taxableAmount * cgst) / 100
  );

  const sgstAmt = roundMoney(
    (taxableAmount * sgst) / 100
  );

  const igstAmt = roundMoney(
    (taxableAmount * igst) / 100
  );

  const taxAmount = roundMoney(
    cgstAmt + sgstAmt + igstAmt
  );

  const total = roundMoney(
    taxableAmount + taxAmount
  );

  return {
    cgstAmt,
    sgstAmt,
    igstAmt,
    taxAmount,
    total
  };
};

// Backward compatibility
export const calculateTax = calculateGST;

export const gstCalculator = (amount, rate) => {
  const result = calculateGST(amount, rate);

  return {
    gstAmount: result.taxAmount,
    total: result.total
  };
};