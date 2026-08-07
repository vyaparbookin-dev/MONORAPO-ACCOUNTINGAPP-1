const featureAccess = {
  billing: true,
  gstReports: true,
  cloudSync: false,
  whatsapp: true,
};

export const isFeatureEnabled = (feature) => {
  return featureAccess[feature] || false;
};