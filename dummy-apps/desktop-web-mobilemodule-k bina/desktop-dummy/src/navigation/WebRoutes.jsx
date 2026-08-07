import React from "react";
import { Routes, Route } from "react-router-dom";
import LaterpadListPage from "../screens/laterpad/LaterpadlistPage";
import AppSettings from "../screens/Settings/AppSettingPage";
import CloudSync from "../screens/Settings/BackupRestore";
import Profile from "../screens/Settings/ProfilePage";
import SecurityLog from "../screens/Settings/SecurityLogPage";
import Settings from "../screens/Settings/SettingsPage";

// Old Settings Pages (from src/pages/setting)
import PageAppSettings from "../pages/setting/appsetting";
import PageCloudSync from "../pages/setting/cloudSync";
import PageProfile from "../pages/setting/profile";
import PageSecurityLog from "../pages/setting/securityLog";
import PageSettings from "../pages/setting/settings";

// New Inventory Pages
import BulkUploadPage from "../screens/inventory/BulkUploadPage";

// Reports
import BankReconciliationPage from "../screens/Reports/BankReconciliationPage";
import TdsTcsPage from "../screens/Reports/TdsTcsPage";
import FixedAssetsPage from "../screens/Reports/FixedAssetsPage";
import EWayBillPage from "../screens/Reports/EWayBillPage";
import AgingReportPage from "../screens/Reports/AgingReportPage";

// Billing Pages
import FastPOSPage from "../screens/Billing/FastPOSPage";
import B2bDocumentListPage from "../screens/Billing/B2bDocumentListPage";
import CreateB2bDocumentPage from "../screens/Billing/CreateB2bDocumentPage";

// Parties
import PartiesPage from "../screens/parties/PartiesPage";

// ApprovalsPage is now in AppNavigator.jsx

// यह फ़ाइल अब रूट परिभाषाओं का एक एरे एक्सपोर्ट करती है,
// जिसे AppNavigator.jsx द्वारा उपभोग किया जाएगा।
export const webFeatureRoutes = [
  // Note: The root path "/" is handled by AppNavigator as Dashboard.
  // WebRoutes's "/" -> Settings is a conflict and will be ignored here.
  { path: "/laterpad/list", element: <LaterpadListPage /> },
  { path: "/settings", element: <SettingsPage /> }, // Main settings page
  { path: "/settings/app", element: <AppSettings /> },
  { path: "/cloudsync", element: <BackupRestore /> }, // Alias for /settings/backup
  { path: "/settings/backup", element: <BackupRestore /> },
  { path: "/profile", element: <ProfilePage /> }, // Alias for /settings/profile
  { path: "/settings/profile", element: <ProfilePage /> },
  { path: "/security", element: <SecurityLogPage /> }, // Alias for /settings/security
  { path: "/settings/security", element: <SecurityLogPage /> },

  // Legacy /pages/settings aliases
  { path: "/pages/settings", element: <PageSettings /> },
  { path: "/pages/settings/app", element: <PageAppSettings /> },
  { path: "/pages/settings/cloud-sync", element: <PageCloudSync /> },
  { path: "/pages/setting/profile", element: <PageProfile /> },
  { path: "/pages/settings/security-log", element: <PageSecurityLog /> },

  // Other Feature Routes
  { path: "/fast-pos", element: <FastPOSPage /> },
  { path: "/billing/b2b", element: <B2bDocumentListPage /> },
  { path: "/billing/b2b/create", element: <CreateB2bDocumentPage /> },
  { path: "/parties", element: <PartiesPage /> },
  { path: "/approvals", element: <ApprovalsPage /> },
  { path: "/inventory/bulk-upload-preview", element: <BulkUploadPage /> },
  { path: "/reports/bank-reconciliation", element: <BankReconciliationPage /> },
  { path: "/reports/tds-tcs", element: <TdsTcsPage /> },
  { path: "/reports/fixed-assets", element: <FixedAssetsPage /> },
  { path: "/reports/eway-bill", element: <EWayBillPage /> },
  { path: "/reports/aging", element: <AgingReportPage /> },
];