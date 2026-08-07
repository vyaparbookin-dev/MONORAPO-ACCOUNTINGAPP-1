// This file will contain the core logic for calculating all totals for a sales invoice.
// It should be pure and deterministic.

import { calculateTaxBreakdown, calculateGST } from '../tax/taxCalculator';
import { determineGstType } from '../tax/gstRules';
import { roundToDecimal } from '../money/rounding';

const CALCULATION_VERSION = "1.0.0"; // Define a version for this calculation logic

/**
 * Calculates all financial totals for a sales invoice.
 * @param {object} invoiceInput - Raw input for the invoice.
 * @param {string} invoiceInput.sellerState - State of the selling company.
 * @param {string} invoiceInput.buyerState - State of the customer.
 * @param {string} [invoiceInput.placeOfSupply] - Place of supply (defaults to buyerState if not provided).
 * @param {Array<object>} invoiceInput.items - Array of item objects.
 * @param {number} invoiceInput.items[].quantity - Quantity of the item.
 * @param {number} invoiceInput.items[].rate - Rate per unit of the item.
 * @param {number} invoiceInput.items[].gstRate - GST rate for the item (e.g., 18 for 18%).
 * @param {boolean} [invoiceInput.items[].taxInclusive=false] - Is the item rate tax-inclusive?
 * @param {number} [invoiceInput.items[].itemDiscount=0] - Item-level discount amount.
 * @param {number} [invoiceInput.items[].cessRate=0] - Item-level cess rate (%).
 * @param {number} [invoiceInput.items[].cessAmount=0] - Item-level fixed cess amount.
 * @param {number} [invoiceInput.invoiceDiscount=0] - Overall invoice discount amount.
 * @param {'PRE_TAX' | 'POST_TAX'} [invoiceInput.invoiceDiscountType='POST_TAX'] - Type of invoice discount.
 * @param {number} [invoiceInput.freightCharges=0] - Freight charges.
 * @param {number} [invoiceInput.packingForwardingCharges=0] - Packing and forwarding charges.
 * @param {number} [invoiceInput.laborCharges=0] - Labor/installation charges.
 * @param {number} [invoiceInput.roundOff=0] - Round-off amount.
 * @returns {object} - Object containing all calculated totals and item-level breakdowns.
 */
export const calculateInvoice = (invoiceInput) => {
  let subtotal = 0;
  let totalTaxableAmount = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let totalCess = 0; // Assuming cess might be added later
  let totalTotalTax = 0;

  const processedItems = invoiceInput.items.map(item => {
    const quantity = item.quantity || 0;
    const rate = item.rate || 0;
    const itemGstRate = item.gstRate || 0;
    const taxInclusive = item.taxInclusive || false;
    const itemDiscount = item.discount || 0; // Item-level discount

    let itemSubtotal = roundToDecimal(quantity * rate);
    let itemTaxableAmount = itemSubtotal;
    let itemCGST = 0;
    let itemSGST = 0;
    let itemIGST = 0;
    let itemTotalTax = 0;

    // Apply item-level discount first
    if (itemDiscount > 0) {
      itemSubtotal = roundToDecimal(itemSubtotal - itemDiscount);
      itemTaxableAmount = itemSubtotal;
    }

    // Determine GST type (Intra-state or Inter-state)
    const gstType = determineGstType(invoiceInput.sellerState, invoiceInput.buyerState, invoiceInput.placeOfSupply || invoiceInput.buyerState);

    if (itemGstRate > 0) {
      if (taxInclusive) {
        // If price is tax-inclusive, calculate taxable amount from total
        itemTaxableAmount = roundToDecimal(itemSubtotal / (1 + itemGstRate / 100));
        itemTotalTax = roundToDecimal(itemSubtotal - itemTaxableAmount);
      } else {
        // If price is tax-exclusive, calculate tax on taxable amount
        itemTotalTax = roundToDecimal(itemTaxableAmount * (itemGstRate / 100));
      }

      if (gstType === 'CGST_SGST') {
        itemCGST = roundToDecimal(itemTotalTax / 2);
        itemSGST = roundToDecimal(itemTotalTax / 2);
      } else { // IGST
        itemIGST = roundToDecimal(itemTotalTax);
      }
    }

    subtotal = roundToDecimal(subtotal + itemSubtotal);
    totalTaxableAmount = roundToDecimal(totalTaxableAmount + itemTaxableAmount);
    totalCGST = roundToDecimal(totalCGST + itemCGST);
    totalSGST = roundToDecimal(totalSGST + itemSGST);
    totalIGST = roundToDecimal(totalIGST + itemIGST);
    totalTotalTax = roundToDecimal(totalTotalTax + itemTotalTax); // Sum of all item-level taxes

    return {
      ...item,
      itemSubtotal: itemSubtotal,
      itemTaxableAmount: itemTaxableAmount,
      itemCGST: itemCGST,
      itemSGST: itemSGST,
      itemIGST: itemIGST,
      itemTotalTax: itemTotalTax,
      itemGrandTotal: roundToDecimal(itemTaxableAmount + itemTotalTax),
    };
  });

  const invoiceDiscount = invoiceInput.invoiceDiscount || 0;
  const freightCharges = invoiceInput.freightCharges || 0;
  const packingForwardingCharges = invoiceInput.packingForwardingCharges || 0;
  const laborCharges = invoiceInput.laborCharges || 0;
  const roundOff = invoiceInput.roundOff || 0;

  // Grand Total calculation
  let grandTotal = roundToDecimal(subtotal + totalTotalTax + freightCharges + packingForwardingCharges + laborCharges - invoiceDiscount + roundOff);

  return {
    processedItems,
    subtotal: subtotal,
    totalTaxableAmount: totalTaxableAmount,
    totalCGST: totalCGST,
    totalSGST: totalSGST,
    totalIGST: totalIGST,
    totalCess: totalCess,
    totalTax: totalTotalTax,
    invoiceDiscount: invoiceDiscount,
    freightCharges: freightCharges,
    packingForwardingCharges: packingForwardingCharges,
    laborCharges: laborCharges,
    roundOff: roundOff,
    grandTotal: grandTotal,
  };
};