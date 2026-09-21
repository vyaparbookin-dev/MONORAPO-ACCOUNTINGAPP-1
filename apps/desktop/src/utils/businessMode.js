/**
 * Business Mode Engine
 * Identifies the business type of the active company and enables/disables specific UI features
 * so that different businesses never clash with each other.
 */
export const BUSINESS_MODULE_OPTIONS = [
  { id: 'restaurant', label: 'Restaurant & Cafe', aliases: ['restaurant', 'cafe', 'food', 'dine'] },
  { id: 'hardware', label: 'Hardware & Sanitary', aliases: ['hardware', 'paint', 'sanitary', 'plywood', 'building', 'steel', 'tile', 'marble', 'cement'] },
  { id: 'gamezone', label: 'Gamezone & FEC', aliases: ['gamezone', 'arcade', 'gaming', 'bowling', 'vr'] },
  { id: 'supermarket', label: 'Supermarket & Grocery', aliases: ['supermarket', 'grocery', 'kirana', 'retail'] },
  { id: 'electronics', label: 'Electronics & Mobile', aliases: ['electronics', 'mobile', 'computer', 'appliance'] },
  { id: 'garments', label: 'Garments & Fashion', aliases: ['garments', 'fashion', 'textile', 'clothing', 'apparel'] },
  { id: 'banquet', label: 'Banquet & Events', aliases: ['banquet', 'events', 'hotel', 'wedding', 'party hall'] },
  { id: 'pharma', label: 'Pharma & Healthcare', aliases: ['pharma', 'healthcare', 'medical', 'chemist', 'medicine'] },
  { id: 'service', label: 'Salon & Services', aliases: ['salon', 'spa', 'beauty', 'parlour', 'service'] },
  { id: 'general', label: 'General Trade', aliases: ['general', 'trading', 'wholesale', 'distribution'] }
];

export const getCompanyModuleList = (company) => {
  const direct = Array.isArray(company?.modulesEnabled)
    ? company.modulesEnabled
    : Array.isArray(company?.activeModules)
      ? company.activeModules
      : Array.isArray(company?.linkedModules)
        ? company.linkedModules
        : [];

  const normalized = direct
    .map((module) => String(module || '').trim().toLowerCase())
    .filter(Boolean);

  if (normalized.length > 0) {
    return [...new Set(normalized)];
  }

  const ind = String(
    company?.industryType ||
    (Array.isArray(company?.businessType) ? company.businessType.join(' ') : company?.businessType) ||
    ''
  ).toLowerCase();

  const inferred = BUSINESS_MODULE_OPTIONS.filter((option) =>
    option.aliases.some((alias) => ind.includes(alias))
  ).map((option) => option.id);

  return inferred.length > 0 ? [...new Set(inferred)] : [];
};

export const hasLinkedModule = (company, moduleId) => {
  const modules = getCompanyModuleList(company);
  if (!modules.length) return false;
  return modules.includes(String(moduleId).toLowerCase());
};

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

  const isKirana =
    ind.includes('kirana') ||
    ind.includes('grocery') ||
    ind.includes('supermarket') ||
    ind.includes('fmcg') ||
    ind.includes('provisions') ||
    ind.includes('kirana / grocery');

  const isRestaurant =
    !isKirana &&
    (ind.includes('restaurant') ||
     ind.includes('dhaba') ||
     ind.includes('canteen') ||
     ind.includes('dine_in') ||
     ind.includes('food_court') ||
     ind.includes('fast_food_restaurant') ||
     ind === 'restaurant' ||
     ind === 'cafe');

  const isCafe = !isKirana && (ind === 'cafe' || ind.includes('coffee shop') || ind.includes('tea bar'));

  const isGamezone =
    ind.includes('gamezone') ||
    ind.includes('arcade') ||
    ind.includes('gaming zone') ||
    ind.includes('bowling') ||
    ind.includes('trampoline park');

  const isBanquet =
    ind.includes('banquet') ||
    ind.includes('marriage hall') ||
    ind.includes('party hall') ||
    ind.includes('resort');

  const isElectronics =
    ind.includes('electronic') ||
    ind.includes('mobile') ||
    ind.includes('computer') ||
    ind.includes('appliance') ||
    ind.includes('cctv');

  const isService =
    ind.includes('salon') ||
    ind.includes('parlour') ||
    ind.includes('spa') ||
    ind.includes('beauty parlour');

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
    isGeneral: !isGarments && !isHardware && !isPharma && !isRestaurant && !isCafe && !isGamezone && !isBanquet && !isElectronics && !isService && !isKirana,
  };
};
