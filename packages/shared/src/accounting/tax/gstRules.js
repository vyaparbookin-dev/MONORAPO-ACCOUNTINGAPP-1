const normalizeState = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
};

export const determineGstType = (
  sellerState,
  buyerState,
  placeOfSupply
) => {
  const seller = normalizeState(sellerState);

  const supplyState = normalizeState(
    placeOfSupply || buyerState
  );

  if (!seller) {
    throw new Error(
      'Validation Error: Seller state is required.'
    );
  }

  if (!supplyState) {
    throw new Error(
      'Validation Error: Place of supply or buyer state is required.'
    );
  }

  return seller === supplyState
    ? 'CGST_SGST'
    : 'IGST';
};