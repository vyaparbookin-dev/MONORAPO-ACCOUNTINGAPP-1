/**
 * Centralized Business Mode Identification Engine
 * Used across Web, Desktop, and Mobile to dynamically isolate industry-specific features.
 */
export const getBusinessMode = (selectedCompany) => {
  const ind = String(
    selectedCompany?.industryType ||
    (Array.isArray(selectedCompany?.businessType) ? selectedCompany?.businessType.join(' ') : selectedCompany?.businessType) ||
    'general'
  ).toLowerCase();

  const isGarments =
    ind.includes('garment') ||
    ind.includes('textile') ||
    ind.includes('cloth') ||
    ind.includes('fashion') ||
    ind.includes('footwear') ||
    ind.includes('shoe') ||
    ind.includes('apparel') ||
    ind.includes('boutique') ||
    ind.includes('saree') ||
    ind.includes('readymade');

  const isHardware =
    ind.includes('hardware') ||
    ind.includes('paint') ||
    ind.includes('sanitary') ||
    ind.includes('building') ||
    ind.includes('plywood') ||
    ind.includes('steel') ||
    ind.includes('tile') ||
    ind.includes('marble') ||
    ind.includes('cement') ||
    ind.includes('tmt');

  const isPharma =
    ind.includes('pharma') ||
    ind.includes('medical') ||
    ind.includes('chemist') ||
    ind.includes('medicine') ||
    ind.includes('drug') ||
    ind.includes('healthcare');

  const isRestaurant =
    ind.includes('restaurant') ||
    ind.includes('cafe') ||
    ind.includes('food') ||
    ind.includes('hotel') ||
    ind.includes('kitchen') ||
    ind.includes('dhaba') ||
    ind.includes('bakery') ||
    ind.includes('sweet');

  const isElectronics =
    ind.includes('electronic') ||
    ind.includes('mobile') ||
    ind.includes('computer') ||
    ind.includes('appliance') ||
    ind.includes('repair') ||
    ind.includes('cctv');

  const isService =
    ind.includes('salon') ||
    ind.includes('parlour') ||
    ind.includes('spa') ||
    ind.includes('beauty') ||
    ind.includes('service') ||
    ind.includes('consultant');

  const isKirana =
    ind.includes('kirana') ||
    ind.includes('grocery') ||
    ind.includes('supermarket') ||
    ind.includes('fmcg') ||
    ind.includes('provisions');

  const isJewellery =
    ind.includes('jewellery') ||
    ind.includes('jewelry') ||
    ind.includes('goldsmith') ||
    ind.includes('silver');

  return {
    rawIndustry: ind,
    isGarments,
    isHardware,
    isPharma,
    isRestaurant,
    isElectronics,
    isService,
    isKirana,
    isJewellery,
    isGeneral: !isGarments && !isHardware && !isPharma && !isRestaurant && !isElectronics && !isService && !isKirana && !isJewellery,
  };
};
