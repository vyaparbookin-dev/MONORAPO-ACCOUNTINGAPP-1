import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CompanyProvider } from "./contexts/CompanyContext";
import { SecurityTracker } from "./components/SecurityTracker";

// Auth Screens
import LoginScreen from "./screens/Auth/LoginScreen";
import RegisterScreen from "./screens/Auth/RegisterScreen";
import ForgotPasswordScreen from "./screens/Auth/ForgotPasswordScreen";
import KeyreCoveryPage from "./screens/Auth/KeyreCoveryPage";

// Dashboard
import Dashboard from "./screens/Dashboard/DashboardScreen";
import ApprovalsPage from "./screens/Dashboard/ApprovalsPage";

// Parties
import PartiesPage from "./screens/parties/PartiesPage";

// Billing
import BillingPage from "./screens/Billing/BillingPage";
import BillListPage from "./screens/Billing/BillListPage";
import BillDetailPage from "./screens/Billing/BillDetailPage";
import FastPOSPage from "./screens/Billing/FastPOSPage";
import ImportBillPage from "./screens/Billing/ImportBillPage";
import ParseBillFromImage from "./screens/Billing/ParseBillFromImage";
import SalesReturnPage from "./screens/Billing/SalesReturnPage";
import CreateReturnScreen from "./screens/returns/CreateReturnScreen";
import B2bDocumentListPage from "./screens/Billing/B2bDocumentListPage";
import CreateB2bDocumentPage from "./screens/Billing/CreateB2bDocumentPage";

// Inventory
import InventoryPage from "./screens/inventory/InventoryPage";
import AddProductPage from "./screens/inventory/AddProductPage";
import BulkProductPage from "./screens/inventory/BulkProductPage";
import BulkUploadPage from "./screens/inventory/BulkUploadPage";
import PurchaseEntryPage from "./screens/inventory/PurchaseEntryPage";
import StockAdjustmentPage from "./screens/inventory/StockAdjustmentPage";
import ProductListPage from "./screens/inventory/ProductListPage";
import ProductDetailPage from "./screens/inventory/ProductDetailPage";
import SerialBatchPage from "./screens/inventory/SerialBatchPage";
import InventorySalesReturnPage from "./screens/inventory/SalesReturnPage";
import InventorySupplierLedgerPage from "./screens/inventory/SupplierLedgerPage";
import StockTransferPage from "./screens/inventory/StockTransferPage";
import ParsePurchaseBillPage from "./screens/inventory/ParseBillFromImage";

// Expenses
import ExpensesPage from "./screens/expanses/ExpensesPage";
import AddExpansePage from "./screens/expanses/AddExpansePage";
import ExpansesListPage from "./screens/expanses/ExpansesListPage";

// Company
import CompanyPage from "./screens/company/CompanyPage";
import AddCompanyPage from "./screens/company/AddCompanyPage";
import BranchPage from "./screens/company/BranchPage";
import CompanyListPage from "./screens/company/CompanyListPage";

// Coupons
import CouponsPage from "./screens/coupons/CouponsPage";
import CouponListPage from "./screens/coupons/CouponListPage";
import GenerateCoupanPage from "./screens/coupons/GenerateCouponPage";

// Membership
import MembershipPage from "./screens/membership/MembershipPage";
import MembershipListPage from "./screens/membership/MemberShipListPage";
import LoyaltyDetailPage from "./screens/membership/LoyaltyDetailPage";

// Notifications
import NotificationPage from "./screens/notification/NotificationPage";
import ReminderPage from "./screens/notification/ReminderPage";

// Reports
import ReportsPage from "./screens/Reports/ReportsPage";
import GstReportPost from "./screens/Reports/GstReportPage";
import ProductGstReportPage from "./screens/Reports/ProductGstReportPage";
import Gstr3bReportPage from "./screens/Reports/Gstr3bReportPage";
import ItemWiseReport from "./screens/Reports/ItemWiseReport";
import ItemWiseReportPage from "./screens/Reports/ItemWiseReportpage";
import BillWiseReportPage from "./screens/Reports/BillWiseReportPage";
import CustomerReportBuilder from "./screens/Reports/CustomerReportBuilder";
import PartyWiseReportPage from "./screens/Reports/PartyWiseReportPage";
import ProfitLossReportPage from "./screens/Reports/ProfitLossReport";
import SchemeReportPage from "./screens/Reports/ScheemReportPage";
import SupplierLedgerPage from "./screens/Reports/SupplierLedgerPage";
import DayBookPage from "./screens/Reports/DayBookPage";
import SitewiseReportPage from "./screens/Reports/SitewiseReportPage";
import AgingReportPage from "./screens/Reports/AgingReportPage";
import GraphicalAnalytics from "./screens/Reports/GraphicalAnalytics";
import BankReconciliationPage from "./screens/Reports/BankReconciliationPage";
import EWayBillPage from "./screens/Reports/EWayBillPage";
import FixedAssetsPage from "./screens/Reports/FixedAssetsPage";
import TdsTcsPage from "./screens/Reports/TdsTcsPage";

// Salary
import SalaryPage from "./screens/salary/SalaryPage";
import AddSalaryPage from "./screens/salary/AddSalaryPage";
import MarkAttendancePage from "./screens/salary/MarkAttendancePage";
import StaffStatementPage from "./screens/salary/StaffStatementPage";
import SalaryListPage from "./screens/salary/SalaryListPage";

// Laterpad (Late Payments)
import LaterpadPage from "./screens/laterpad/LaterpadPage";
import LaterpadListPage from "./screens/laterpad/LaterpadlistPage";

// Warehouse
import AddWarehousePage from "./screens/warehouse/AddWarehousePage";
import WarehouseListPage from "./screens/warehouse/WareHouseListPage";

// Settings
import SettingsPage from "./screens/Settings/SettingsPage";
import AppSettings from "./screens/Settings/AppSettingPage";
import BackupRestore from "./screens/Settings/BackupRestore";
import ProfilePage from "./screens/Settings/ProfilePage";
import SecurityLogPage from "./screens/Settings/SecurityLogPage";
import WebPreferences from "./screens/Settings/WebPreferences";
import StaffManagementPage from "./screens/Settings/StaffManagementPage";

// Additional Settings Pages (from pages/setting)
import PageAppSettings from "./pages/setting/appsetting";
import PageCloudSync from "./pages/setting/cloudSync";
import PageProfile from "./pages/setting/profile";
import PageSecurityLog from "./pages/setting/securityLog";
import PageSettings from "./pages/setting/settings";

// Components
import DashboardLayout from "./components/DashboardLayout";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6">The application encountered an error. Please try reloading.</p>
            <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  useEffect(() => {
    // App start hote hi security tracker active ho jayega
    SecurityTracker.track("APP_STARTED", { platform: "web", timestamp: new Date() });
  }, []);

  return (
  <ErrorBoundary>
    <Router>
      <CompanyProvider>
    <Routes>
      {/* Auth Routes - No Layout */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/key-recovery" element={<KeyreCoveryPage />} />

      {/* Main App Routes - With Dashboard Layout */}
      <Route
        path="/*"
        element={
          <DashboardLayout>
            <Routes>
              {/* Dashboard */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Approvals */}
              <Route path="/approvals" element={<ApprovalsPage />} />
              
              {/* Parties */}
              <Route path="/parties" element={<PartiesPage />} />
              
              {/* Fast POS */}
              <Route path="/fast-pos" element={<FastPOSPage />} />

              {/* Billing */}
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/billing/list" element={<BillListPage />} />
              <Route path="/billing/import" element={<ImportBillPage />} />
              <Route path="/billing/parse" element={<ParseBillFromImage />} />
              <Route path="/billing/return" element={<SalesReturnPage />} />
              <Route path="/billing/return/create" element={<CreateReturnScreen />} />
              <Route path="/billing/b2b" element={<B2bDocumentListPage />} />
              <Route path="/billing/b2b/create" element={<CreateB2bDocumentPage />} />
              <Route path="/billing/:id" element={<BillDetailPage />} />

              {/* Inventory */}
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/inventory/add" element={<AddProductPage />} />
              <Route path="/inventory/bulk" element={<BulkProductPage />} />
              <Route path="/inventory/bulk-upload" element={<BulkUploadPage />} />
              <Route path="/inventory/purchase" element={<PurchaseEntryPage />} />
              <Route path="/inventory/adjust" element={<StockAdjustmentPage />} />
              <Route path="/inventory/list" element={<ProductListPage />} />
              <Route path="/inventory/detail/:id" element={<ProductDetailPage />} />
              <Route path="/inventory/batch" element={<SerialBatchPage />} />
              <Route path="/inventory/purchase-return" element={<InventorySalesReturnPage />} />
              <Route path="/inventory/supplier-ledger" element={<InventorySupplierLedgerPage />} />
              <Route path="/inventory/transfer" element={<StockTransferPage />} />
              <Route path="/inventory/parse-purchase-bill" element={<ParsePurchaseBillPage />} />

              {/* Expenses */}
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/expenses/add" element={<AddExpansePage />} />
              <Route path="/expenses/list" element={<ExpansesListPage />} />

              {/* Company */}
              <Route path="/company" element={<CompanyPage />} />
              <Route path="/company/add" element={<AddCompanyPage />} />
              <Route path="/company/branches" element={<BranchPage />} />
              <Route path="/company/list" element={<CompanyListPage />} />

              {/* Coupons */}
              <Route path="/coupans" element={<CouponsPage />} />
              <Route path="/coupons" element={<CouponsPage />} />
              <Route path="/coupons/list" element={<CouponListPage />} />
              {/* <Route path="/coupons/view" element={<CouponPage />} /> */}
              <Route path="/coupons/generate" element={<GenerateCoupanPage />} />

              {/* Membership */}
              <Route path="/membership" element={<MembershipPage />} />
              <Route path="/membership/list" element={<MembershipListPage />} />
              <Route path="/membership/loyalty/:id" element={<LoyaltyDetailPage />} />

              {/* Notifications */}
              <Route path="/notifications" element={<NotificationPage />} />
              <Route path="/notifications/reminders" element={<ReminderPage />} />

              {/* Reports */}
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/gst" element={<GstReportPost />} />
              <Route path="/reports/product-gst" element={<ProductGstReportPage />} />
              <Route path="/reports/gstr3b" element={<Gstr3bReportPage />} />
              <Route path="/reports/itemwise" element={<ItemWiseReport />} />
              <Route path="/reports/itemwise-page" element={<ItemWiseReportPage />} />
              <Route path="/reports/billwise" element={<BillWiseReportPage />} />
              <Route path="/reports/customer" element={<CustomerReportBuilder />} />
              <Route path="/reports/partywise" element={<PartyWiseReportPage />} />
              <Route path="/reports/profitloss" element={<ProfitLossReportPage />} />
              <Route path="/reports/scheme" element={<SchemeReportPage />} />
              <Route path="/reports/supplier-ledger" element={<SupplierLedgerPage />} />
              <Route path="/reports/daybook" element={<DayBookPage />} />
              <Route path="/reports/sitewise" element={<SitewiseReportPage />} />
              <Route path="/reports/aging" element={<AgingReportPage />} />
              <Route path="/reports/analytics" element={<GraphicalAnalytics />} />
              <Route path="/reports/bank-reconciliation" element={<BankReconciliationPage />} />
              <Route path="/reports/eway-bill" element={<EWayBillPage />} />
              <Route path="/reports/fixed-assets" element={<FixedAssetsPage />} />
              <Route path="/reports/tds-tcs" element={<TdsTcsPage />} />

              {/* Salary */}
              <Route path="/salary" element={<SalaryPage />} />
              <Route path="/salary/add" element={<AddSalaryPage />} />
              <Route path="/salary/attendance" element={<MarkAttendancePage />} />
              <Route path="/salary/statement" element={<StaffStatementPage />} />
              <Route path="/salary/list" element={<SalaryListPage />} />

              {/* Late Payments */}
              <Route path="/laterpad" element={<LaterpadPage />} />
              <Route path="/laterpad/list" element={<LaterpadListPage />} />

              {/* Warehouse */}
              <Route path="/warehouse/add" element={<AddWarehousePage />} />
              <Route path="/warehouse/list" element={<WarehouseListPage />} />
              <Route path="/warehouse" element={<WarehouseListPage />} />

              {/* Settings */}
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/app" element={<AppSettings />} />
              <Route path="/settings/backup" element={<BackupRestore />} />
              <Route path="/settings/profile" element={<ProfilePage />} />
              <Route path="/settings/security" element={<SecurityLogPage />} />
              <Route path="/settings/web" element={<WebPreferences />} />
              <Route path="/settings/staff" element={<StaffManagementPage />} />

              {/* Additional Settings Routes */}
              <Route path="/pages/settings" element={<PageSettings />} />
              <Route path="/pages/settings/app" element={<PageAppSettings />} />
              <Route path="/pages/settings/cloud-sync" element={<PageCloudSync />} />
              <Route path="/pages/settings/profile" element={<PageProfile />} />
              <Route path="/pages/settings/security-log" element={<PageSecurityLog />} />
            </Routes>
          </DashboardLayout>
        }
      />
    </Routes>
      </CompanyProvider>
    </Router>
  </ErrorBoundary>
  );
};

export default App;