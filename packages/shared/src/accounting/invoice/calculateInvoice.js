import { determineGstType } from '../tax/gstRules';
import { roundMoney } from '../money/rounding';

export const INVOICE_CALCULATION_VERSION = '1.0.0';

const numberValue = (value, fieldName, defaultValue = 0) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return defaultValue;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(
      `Validation Error: ${fieldName} must be a valid number.`
    );
  }

  return number;
};

const validateDiscountType = (type) => {
  if (!['PRE_TAX', 'POST_TAX'].includes(type)) {
    throw new Error(
      'Validation Error: invoiceDiscountType must be PRE_TAX or POST_TAX.'
    );
  }
};

export const calculateInvoice = (invoiceInput) => {
  if (!invoiceInput || typeof invoiceInput !== 'object') {
    throw new Error(
      'Validation Error: Invoice input is required.'
    );
  }

  if (
    !Array.isArray(invoiceInput.items) ||
    invoiceInput.items.length === 0
  ) {
    throw new Error(
      'Validation Error: Invoice must contain at least one item.'
    );
  }

  const gstType = determineGstType(
    invoiceInput.sellerState,
    invoiceInput.buyerState,
    invoiceInput.placeOfSupply
  );

  const invoiceDiscount = roundMoney(
    numberValue(
      invoiceInput.invoiceDiscount,
      'invoiceDiscount'
    )
  );

  if (invoiceDiscount < 0) {
    throw new Error(
      'Validation Error: Invoice discount cannot be negative.'
    );
  }

  const invoiceDiscountType =
    invoiceInput.invoiceDiscountType || 'POST_TAX';

  validateDiscountType(invoiceDiscountType);

  const freightCharges = roundMoney(
    numberValue(
      invoiceInput.freightCharges,
      'freightCharges'
    )
  );

  const packingForwardingCharges = roundMoney(
    numberValue(
      invoiceInput.packingForwardingCharges,
      'packingForwardingCharges'
    )
  );

  const laborCharges = roundMoney(
    numberValue(
      invoiceInput.laborCharges,
      'laborCharges'
    )
  );

  const roundOff = roundMoney(
    numberValue(invoiceInput.roundOff, 'roundOff')
  );

  if (
    freightCharges < 0 ||
    packingForwardingCharges < 0 ||
    laborCharges < 0
  ) {
    throw new Error(
      'Validation Error: Additional charges cannot be negative.'
    );
  }

  // Phase 1:
  // Normalize items and calculate taxable value before
  // invoice-level PRE_TAX discount.

  const normalizedItems = invoiceInput.items.map(
    (item, index) => {
      const label =
        item?.name ||
        item?.productName ||
        `Item ${index + 1}`;

      const quantity = numberValue(
        item?.quantity,
        `${label} quantity`
      );

      const rate = numberValue(
        item?.rate,
        `${label} rate`
      );

      const gstRate = numberValue(
        item?.gstRate,
        `${label} GST rate`
      );

      const itemDiscount = roundMoney(
        numberValue(
          item?.itemDiscount ?? item?.discount,
          `${label} discount`
        )
      );

      const cessRate = numberValue(
        item?.cessRate,
        `${label} cess rate`
      );

      const cessAmount = roundMoney(
        numberValue(
          item?.cessAmount,
          `${label} cess amount`
        )
      );

      const taxInclusive = Boolean(item?.taxInclusive);

      if (quantity <= 0) {
        throw new Error(
          `Validation Error: ${label} quantity must be greater than zero.`
        );
      }

      if (rate < 0) {
        throw new Error(
          `Validation Error: ${label} rate cannot be negative.`
        );
      }

      if (gstRate < 0) {
        throw new Error(
          `Validation Error: ${label} GST rate cannot be negative.`
        );
      }

      if (cessRate < 0 || cessAmount < 0) {
        throw new Error(
          `Validation Error: ${label} cess cannot be negative.`
        );
      }

      const grossAmount = roundMoney(quantity * rate);

      if (itemDiscount < 0) {
        throw new Error(
          `Validation Error: ${label} discount cannot be negative.`
        );
      }

      if (itemDiscount > grossAmount) {
        throw new Error(
          `Validation Error: ${label} discount cannot exceed gross amount.`
        );
      }

      const amountAfterItemDiscount = roundMoney(
        grossAmount - itemDiscount
      );

      let taxableBeforeInvoiceDiscount;

      if (taxInclusive && gstRate > 0) {
        taxableBeforeInvoiceDiscount = roundMoney(
          amountAfterItemDiscount /
            (1 + gstRate / 100)
        );
      } else {
        taxableBeforeInvoiceDiscount =
          amountAfterItemDiscount;
      }

      return {
        ...item,
        quantity,
        rate,
        gstRate,
        taxInclusive,
        grossAmount,
        itemDiscountAmount: itemDiscount,
        amountAfterItemDiscount,
        taxableBeforeInvoiceDiscount,
        cessRate,
        cessAmount
      };
    }
  );

  const totalTaxableBeforeInvoiceDiscount =
    roundMoney(
      normalizedItems.reduce(
        (sum, item) =>
          sum + item.taxableBeforeInvoiceDiscount,
        0
      )
    );

  if (
    invoiceDiscountType === 'PRE_TAX' &&
    invoiceDiscount > totalTaxableBeforeInvoiceDiscount
  ) {
    throw new Error(
      'Validation Error: PRE_TAX invoice discount cannot exceed taxable amount.'
    );
  }

  // Phase 2:
  // Allocate PRE_TAX discount proportionally.
  // Last item absorbs rounding remainder so allocated
  // discount exactly equals invoiceDiscount.

  let remainingPreTaxDiscount =
    invoiceDiscountType === 'PRE_TAX'
      ? invoiceDiscount
      : 0;

  const processedItems = normalizedItems.map(
    (item, index) => {
      let allocatedInvoiceDiscount = 0;

      if (
        invoiceDiscountType === 'PRE_TAX' &&
        invoiceDiscount > 0
      ) {
        const isLast =
          index === normalizedItems.length - 1;

        if (isLast) {
          allocatedInvoiceDiscount =
            roundMoney(remainingPreTaxDiscount);
        } else {
          allocatedInvoiceDiscount = roundMoney(
            (
              item.taxableBeforeInvoiceDiscount /
              totalTaxableBeforeInvoiceDiscount
            ) * invoiceDiscount
          );

          allocatedInvoiceDiscount = Math.min(
            allocatedInvoiceDiscount,
            remainingPreTaxDiscount
          );
        }

        remainingPreTaxDiscount = roundMoney(
          remainingPreTaxDiscount -
            allocatedInvoiceDiscount
        );
      }

      const itemTaxableValue = roundMoney(
        item.taxableBeforeInvoiceDiscount -
          allocatedInvoiceDiscount
      );

      if (itemTaxableValue < 0) {
        throw new Error(
          `Validation Error: Taxable value became negative for ${
            item.name || item.productName || 'item'
          }.`
        );
      }

      let itemCGST = 0;
      let itemSGST = 0;
      let itemIGST = 0;

      const itemTotalTax = roundMoney(
        (itemTaxableValue * item.gstRate) / 100
      );

      if (gstType === 'CGST_SGST') {
        itemCGST = roundMoney(itemTotalTax / 2);

        // SGST gets the remainder to guarantee:
        // CGST + SGST === total tax.
        itemSGST = roundMoney(
          itemTotalTax - itemCGST
        );
      } else {
        itemIGST = itemTotalTax;
      }

      let itemCess = 0;

      if (item.cessRate > 0) {
        itemCess = roundMoney(
          (itemTaxableValue * item.cessRate) / 100
        );
      }

      if (item.cessAmount > 0) {
        itemCess = roundMoney(
          itemCess + item.cessAmount
        );
      }

      const itemGrandTotal = roundMoney(
        itemTaxableValue +
          itemTotalTax +
          itemCess
      );

      return {
        ...item,

        invoiceDiscountAllocated:
          allocatedInvoiceDiscount,

        itemTaxableValue,

        itemCGST,
        itemSGST,
        itemIGST,

        itemTotalTax,
        itemCess,
        itemGrandTotal
      };
    }
  );

  // Phase 3: Aggregate.

  const grossTotal = roundMoney(
    processedItems.reduce(
      (sum, item) => sum + item.grossAmount,
      0
    )
  );

  const totalItemDiscount = roundMoney(
    processedItems.reduce(
      (sum, item) =>
        sum + item.itemDiscountAmount,
      0
    )
  );

  const subtotal = roundMoney(
    grossTotal - totalItemDiscount
  );

  const totalTaxableAmount = roundMoney(
    processedItems.reduce(
      (sum, item) => sum + item.itemTaxableValue,
      0
    )
  );

  const totalCGST = roundMoney(
    processedItems.reduce(
      (sum, item) => sum + item.itemCGST,
      0
    )
  );

  const totalSGST = roundMoney(
    processedItems.reduce(
      (sum, item) => sum + item.itemSGST,
      0
    )
  );

  const totalIGST = roundMoney(
    processedItems.reduce(
      (sum, item) => sum + item.itemIGST,
      0
    )
  );

  const totalTax = roundMoney(
    totalCGST + totalSGST + totalIGST
  );

  const totalCess = roundMoney(
    processedItems.reduce(
      (sum, item) => sum + item.itemCess,
      0
    )
  );

  const additionalCharges = roundMoney(
    freightCharges +
      packingForwardingCharges +
      laborCharges
  );

  const postTaxDiscount =
    invoiceDiscountType === 'POST_TAX'
      ? invoiceDiscount
      : 0;

  const amountBeforeRoundOff = roundMoney(
    totalTaxableAmount +
      totalTax +
      totalCess +
      additionalCharges -
      postTaxDiscount
  );

  if (amountBeforeRoundOff < 0) {
    throw new Error(
      'Validation Error: Invoice total cannot be negative.'
    );
  }

  const grandTotal = roundMoney(
    amountBeforeRoundOff + roundOff
  );

  if (grandTotal < 0) {
    throw new Error(
      'Validation Error: Grand total cannot be negative.'
    );
  }

  return {
    calculationVersion:
      INVOICE_CALCULATION_VERSION,

    gstType,

    processedItems,

    grossTotal,
    totalItemDiscount,
    subtotal,

    totalTaxableAmount,

    totalCGST,
    totalSGST,
    totalIGST,
    totalTax,
    totalCess,

    invoiceDiscount,
    invoiceDiscountType,

    freightCharges,
    packingForwardingCharges,
    laborCharges,
    additionalCharges,

    amountBeforeRoundOff,
    roundOff,
    grandTotal
  };
};