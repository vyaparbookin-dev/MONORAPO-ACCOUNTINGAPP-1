import { calculateInvoice } from '../invoice/calculateInvoice';

export const PURCHASE_CALCULATION_VERSION = '1.0.0';

export const calculatePurchase = (purchaseInput) => {
  if (!purchaseInput || typeof purchaseInput !== 'object') {
    throw new Error(
      'Validation Error: Purchase input is required.'
    );
  }

  const otherCharges = Number(
    purchaseInput.otherCharges || 0
  );

  if (!Number.isFinite(otherCharges) || otherCharges < 0) {
    throw new Error(
      'Validation Error: Other charges must be a valid non-negative number.'
    );
  }

  /*
   * Purchase perspective:
   *
   * sellerState = Supplier state
   * buyerState  = Our/company state
   *
   * calculateInvoice only needs these states to determine
   * sellerState vs placeOfSupply, so the same deterministic
   * GST engine can safely calculate the monetary breakdown.
   */

  const result = calculateInvoice({
    ...purchaseInput,

    freightCharges:
      Number(purchaseInput.freightCharges || 0) +
      otherCharges,

    packingForwardingCharges: 0,
    laborCharges: 0
  });

  return {
    ...result,

    calculationVersion:
      PURCHASE_CALCULATION_VERSION,

    freightCharges: Number(
      purchaseInput.freightCharges || 0
    ),

    otherCharges,

    additionalCharges:
      Number(purchaseInput.freightCharges || 0) +
      otherCharges
  };
};