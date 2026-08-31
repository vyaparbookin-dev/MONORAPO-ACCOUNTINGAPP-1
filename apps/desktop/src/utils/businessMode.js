/**
 * Business Mode Engine
 * Identifies the business type of the active company and enables/disables specific UI features
 * so that different businesses never clash with each other.
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
    ind.includes('sweet') ||
    ind.includes('fast food');

  const isCafe =
    ind.includes('cafe') ||
    ind.includes('coffee') ||
    ind.includes('bakery') ||
    ind.includes('tea') ||
    ind.includes('bistro') ||
    ind.includes('lounge');

  const isGamezone =
    ind.includes('game') ||
    ind.includes('arcade') ||
    ind.includes('play') ||
    ind.includes('snooker') ||
    ind.includes('pool') ||
    ind.includes('bowling') ||
    ind.includes('vr') ||
    ind.includes('ps5') ||
    ind.includes('gaming') ||
    ind.includes('trampoline') ||
    ind.includes('amusement') ||
    ind.includes('soft play');

  const isBanquet =
    ind.includes('banquet') ||
    ind.includes('event') ||
    ind.includes('marriage') ||
    ind.includes('catering') ||
    ind.includes('lawn') ||
    ind.includes('party hall') ||
    ind.includes('function');

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

  return {
    rawIndustry: ind,
    isGarments,
    isHardware,
    isPharma,
    isRestaurant: isRestaurant || isCafe,
    isCafe,
    isGamezone,
    isBanquet,
    isElectronics,
    isService,
    isKirana,
    isGeneral: !isGarments && !isHardware && !isPharma && !isRestaurant && !isGamezone && !isBanquet && !isElectronics && !isService && !isKirana,
  };
};
