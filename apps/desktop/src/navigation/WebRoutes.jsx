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

// Approvals
import ApprovalsPage from "../screens/Dashboard/ApprovalsPage";

const WebRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Settings />} />
      <Route path="/laterpad/list" element={<LaterpadListPage />} />
      <Route path="/settings" element={<AppSettings />} />
      <Route path="/cloudsync" element={<CloudSync />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/security" element={<SecurityLog />} />
      <Route path="/fast-pos" element={<FastPOSPage />} />
      <Route path="/billing/b2b" element={<B2bDocumentListPage />} />
      <Route path="/billing/b2b/create" element={<CreateB2bDocumentPage />} />
      <Route path="/parties" element={<PartiesPage />} />
      <Route path="/approvals" element={<ApprovalsPage />} />

      {/* Inventory Routes */}
      <Route path="/inventory/bulk-upload-preview" element={<BulkUploadPage />} />

      {/* Reports */}
      <Route path="/reports/bank-reconciliation" element={<BankReconciliationPage />} />
      <Route path="/reports/tds-tcs" element={<TdsTcsPage />} />
      <Route path="/reports/fixed-assets" element={<FixedAssetsPage />} />
      <Route path="/reports/eway-bill" element={<EWayBillPage />} />
      <Route path="/reports/aging" element={<AgingReportPage />} />

      {/* Old Settings Routes */}
      <Route path="/pages/settings" element={<PageSettings />} />
      <Route path="/pages/settings/app" element={<PageAppSettings />} />
      <Route path="/pages/settings/cloud-sync" element={<PageCloudSync />} />
      <Route path="/pages/settings/profile" element={<PageProfile />} />
      <Route path="/pages/settings/security-log" element={<PageSecurityLog />} />
    </Routes>
  );
};

export default WebRoutes;