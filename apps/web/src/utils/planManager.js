/**
 * Red Accounting Book ERP — 3-Tier SaaS Plan Enforcement Engine
 */

export const SAAS_PLANS = {
  OFFLINE: {
    id: 'offline',
    name: 'Mobile Offline Edition',
    priceAnnual: 299,
    price3Year: 672,
    first50Rate: 209,
    features: {
      cloudSync: false,
      autoCloudBackup: false,
      multiDeviceSync: false,
      desktopApp: false,
      webDashboard: false,
      bluetoothThermalPrint: true,
      barcodeCameraScan: true,
      localSqliteEngine: true,
      offlinePOS: true,
      tallyExcelExport: true,
    },
    badge: '📱 100% Offline POS',
    description: 'Runs entirely on local SQLite database with zero internet dependency.'
  },
  HYBRID: {
    id: 'hybrid',
    name: 'Mobile Cloud Hybrid Edition',
    priceAnnual: 599,
    price3Year: 1348,
    first50Rate: 419,
    features: {
      cloudSync: true,
      autoCloudBackup: true,
      multiDeviceSync: false,
      desktopApp: false,
      webDashboard: false,
      bluetoothThermalPrint: true,
      barcodeCameraScan: true,
      localSqliteEngine: true,
      offlinePOS: true,
      oneClickCloudRestore: true,
      whatsAppPdfBills: true,
      tallyExcelExport: true,
    },
    badge: '☁️ Mobile + Cloud Backup',
    description: 'Mobile offline POS with automatic encrypted cloud backup and 1-click restore.'
  },
  PRO: {
    id: 'pro',
    name: 'Enterprise Pro (Web + Desktop + Mobile)',
    priceAnnual: 2999,
    price3Year: 6749,
    first50Rate: 2099,
    features: {
      cloudSync: true,
      autoCloudBackup: true,
      multiDeviceSync: true,
      desktopApp: true,
      webDashboard: true,
      bluetoothThermalPrint: true,
      barcodeCameraScan: true,
      localSqliteEngine: true,
      offlinePOS: true,
      keyboardDrivenDesktopPOS: true,
      remoteLiveAnalytics: true,
      multiUserStaffRoles: true,
      multiBranchSupport: true,
      gstrReports20Plus: true,
      tallyExcelExport: true,
    },
    badge: '🚀 3-Way Universal Sync',
    description: 'Real-time sync across Mobile phone, Desktop Windows counter POS and Web Cloud.'
  }
};

export function getCurrentPlan(company) {
  const planKey = (typeof window !== 'undefined' && (company?.planType || localStorage.getItem('saas_active_plan'))) || 'pro';
  const normalizedKey = planKey.toLowerCase();
  
  if (normalizedKey.includes('offline') || normalizedKey === 'tier1') {
    return SAAS_PLANS.OFFLINE;
  }
  if (normalizedKey.includes('hybrid') || normalizedKey.includes('online') || normalizedKey === 'tier2') {
    return SAAS_PLANS.HYBRID;
  }
  return SAAS_PLANS.PRO;
}

export function setActivePlan(planId) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('saas_active_plan', planId);
  }
}

export function isFeatureAllowed(featureName, company) {
  const plan = getCurrentPlan(company);
  return !!plan.features[featureName];
}
