import React, { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { CompanyProvider } from "./contexts/CompanyContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SettingsProvider } from "./contexts/SettingsContext"; // Import SettingsProvider
import { SecurityTracker } from "./components/SecurityTracker";
import DashboardLayout from "./components/DashboardLayout";
import Loader from "./components/Loader"; // Assuming a loader component exists

// Auth Screens
const LoginScreen = React.lazy(() => import("./screens/Auth/LoginScreen"));
const RegisterScreen = React.lazy(() => import("./screens/Auth/RegisterScreen"));
const ForgotPasswordScreen = React.lazy(() => import("./screens/Auth/ForgotPasswordScreen"));
const KeyreCoveryPage = React.lazy(() => import("./screens/Auth/KeyreCoveryPage"));
const VerifyOtp = React.lazy(() => import("./pages/setting/VerifyOtp"));

// Dashboard
const Dashboard = React.lazy(() => import("./screens/Dashboard/DashboardScreen"));
const ApprovalsPage = React.lazy(() => import("./screens/Dashboard/ApprovalsPage"));

// Parties
const PartiesPage = React.lazy(() => import("./screens/parties/PartiesPage"));

// Billing
const BillingPage = React.lazy(() => import("./screens/Billing/BillingPage"));
const BillListPage = React.lazy(() => import("./screens/Billing/BillListPage"));
const BillDetailPage = React.lazy(() => import("./screens/Billing/BillDetailPage"));
const FastPOSPage = React.lazy(() => import("./screens/Billing/FastPOSPage"));
const ImportBillPage = React.lazy(() => import("./screens/Billing/ImportBillPage"));
const ParseBillFromImage = React.lazy(() => import("./screens/Billing/ParseBillFromImage"));
const SalesReturnPage = React.lazy(() => import("./screens/Billing/SalesReturnPage"));
const CreateReturnScreen = React.lazy(() => import("./screens/returns/CreateReturnScreen"));
const B2bDocumentListPage = React.lazy(() => import("./screens/Billing/B2bDocumentListPage"));
const CreateB2bDocumentPage = React.lazy(() => import("./screens/Billing/CreateB2bDocumentPage"));

// Inventory
const InventoryPage = React.lazy(() => import("./screens/inventory/InventoryPage"));
const AddProductPage = React.lazy(() => import("./screens/inventory/AddProductPage"));
const BulkProductPage = React.lazy(() => import("./screens/inventory/BulkProductPage"));
const BulkUploadPage = React.lazy(() => import("./screens/inventory/BulkUploadPage"));
const CategoryAnalyticsPage = React.lazy(() => import("./screens/inventory/CategoryAnalyticsPage"));
const PurchaseEntryPage = React.lazy(() => import("./screens/inventory/PurchaseEntryPage"));
const StockAdjustmentPage = React.lazy(() => import("./screens/inventory/StockAdjustmentPage"));
const ProductListPage = React.lazy(() => import("./screens/inventory/ProductListPage"));
const ProductDetailPage = React.lazy(() => import("./screens/inventory/ProductDetailPage"));
const SerialBatchPage = React.lazy(() => import("./screens/inventory/SerialBatchPage"));
const InventorySalesReturnPage = React.lazy(() => import("./screens/inventory/SalesReturnPage"));
const InventorySupplierLedgerPage = React.lazy(() => import("./screens/inventory/SupplierLedgerPage"));
const StockTransferPage = React.lazy(() => import("./screens/inventory/StockTransferPage"));
const ParsePurchaseBillPage = React.lazy(() => import("./screens/inventory/ParseBillFromImage"));
const CategoryManagementPage = React.lazy(() => import("./screens/inventory/CategoryManagementPage"));
const ItemMasterPage = React.lazy(() => import("./screens/inventory/ItemMasterPage"));

// Expenses
const ExpensesPage = React.lazy(() => import("./screens/expenses/ExpensesPage"));
const AddExpensePage = React.lazy(() => import("./screens/expenses/AddExpensesPage"));
const ExpensesListPage = React.lazy(() => import("./screens/expenses/ExpensesListPage"));

// Company
const CompanyPage = React.lazy(() => import("./screens/company/CompanyPage"));
const AddCompanyPage = React.lazy(() => import("./screens/company/AddCompanyPage"));
const BranchPage = React.lazy(() => import("./screens/company/BranchPage"));
const CompanyListPage = React.lazy(() => import("./screens/company/CompanyListPage"));

// Coupons
const CouponsPage = React.lazy(() => import("./screens/coupons/CouponsPage"));
const CouponListPage = React.lazy(() => import("./screens/coupons/CouponListPage"));
const GenerateCoupanPage = React.lazy(() => import("./screens/coupons/GenerateCouponPage"));

// Membership
const MembershipPage = React.lazy(() => import("./screens/membership/MembershipPage"));
const MembershipListPage = React.lazy(() => import("./screens/membership/MemberShipListPage"));
const LoyaltyDetailPage = React.lazy(() => import("./screens/membership/LoyaltyDetailPage"));

// Notifications
const NotificationPage = React.lazy(() => import("./screens/notification/NotificationPage"));
const ReminderPage = React.lazy(() => import("./screens/notification/ReminderPage"));

// Reports
const ReportsPage = React.lazy(() => import("./screens/Reports/ReportsPage"));
const GstReportPost = React.lazy(() => import("./screens/Reports/GstReportPage"));
const ProductGstReportPage = React.lazy(() => import("./screens/Reports/ProductGstReportPage"));
const Gstr3bReportPage = React.lazy(() => import("./screens/Reports/Gstr3bReportPage"));
const ItemWiseReport = React.lazy(() => import("./screens/Reports/ItemWiseReport"));
const ItemWiseReportPage = React.lazy(() => import("./screens/Reports/ItemWiseReportpage"));
const BillWiseReportPage = React.lazy(() => import("./screens/Reports/BillWiseReportPage"));
const CustomerReportBuilder = React.lazy(() => import("./screens/Reports/CustomerReportBuilder"));
const PartyWiseReportPage = React.lazy(() => import("./screens/Reports/PartyWiseReportPage"));
const ProfitLossReportPage = React.lazy(() => import("./screens/Reports/ProfitLossReport"));
const SchemeReportPage = React.lazy(() => import("./screens/Reports/SchemeReportPage"));
const SupplierLedgerPage = React.lazy(() => import("./screens/Reports/SupplierLedgerPage"));
const DayBookPage = React.lazy(() => import("./screens/Reports/DayBookPage"));
const SitewiseReportPage = React.lazy(() => import("./screens/Reports/SitewiseReportPage"));
const AgingReportPage = React.lazy(() => import("./screens/Reports/AgingReportPage"));
const GraphicalAnalytics = React.lazy(() => import("./screens/Reports/GraphicalAnalytics"));
const BankReconciliationPage = React.lazy(() => import("./screens/Reports/BankReconciliationPage"));
const EWayBillPage = React.lazy(() => import("./screens/Reports/EWayBillPage"));
const FixedAssetsPage = React.lazy(() => import("./screens/Reports/FixedAssetsPage"));
const TdsTcsPage = React.lazy(() => import("./screens/Reports/TdsTcsPage"));

// Salary
const SalaryPage = React.lazy(() => import("./screens/salary/SalaryPage"));
const AddSalaryPage = React.lazy(() => import("./screens/salary/AddSalaryPage"));
const MarkAttendancePage = React.lazy(() => import("./screens/salary/MarkAttendancePage"));
const StaffStatementPage = React.lazy(() => import("./screens/salary/StaffStatementPage"));
const SalaryListPage = React.lazy(() => import("./screens/salary/SalaryListPage"));

// Laterpad (Late Payments)
const LaterpadPage = React.lazy(() => import("./screens/laterpad/LaterpadPage"));
const LaterpadListPage = React.lazy(() => import("./screens/laterpad/LaterpadlistPage"));

// Warehouse
const AddWarehousePage = React.lazy(() => import("./screens/warehouse/AddWarehousePage"));
const WarehouseListPage = React.lazy(() => import("./screens/warehouse/WareHouseListPage"));

// Settings
const SettingsPage = React.lazy(() => import("./screens/Settings/SettingsPage"));
const AppSettings = React.lazy(() => import("./screens/Settings/AppSettingPage"));
const BackupRestore = React.lazy(() => import("./screens/Settings/BackupRestore"));
const ProfilePage = React.lazy(() => import("./screens/Settings/ProfilePage"));
const SecurityLogPage = React.lazy(() => import("./screens/Settings/SecurityLogPage"));
const WebPreferences = React.lazy(() => import("./screens/Settings/WebPreferences"));
const StaffManagementPage = React.lazy(() => import("./screens/Settings/StaffManagementPage"));

// Additional Settings Pages (from pages/setting)
const PageAppSettings = React.lazy(() => import("./pages/setting/appsetting"));
const PageCloudSync = React.lazy(() => import("./pages/setting/cloudSync"));
const PageProfile = React.lazy(() => import("./pages/setting/profile"));
const PageSecurityLog = React.lazy(() => import("./pages/setting/securityLog"));
const PageSettings = React.lazy(() => import("./pages/setting/settings"));
const UnitSettingsPage = React.lazy(() => import("./screens/Settings/UnitSettingsPage"));
const StaffPerformancePage = React.lazy(() => import("./screens/Settings/StaffPerformancePage"));
const WhatsappSettingsPage = React.lazy(() => import("./screens/Settings/WhatsappSettingsPage"));

// Leads & Quotations
const LeadListPage = React.lazy(() => import("./screens/lead/LeadListPage"));
const CreateLeadPage = React.lazy(() => import("./screens/lead/CreateLeadPage"));
const LeadDetailPage = React.lazy(() => import("./screens/lead/LeadDetailPage"));
const QuotationListPage = React.lazy(() => import("./screens/quotation/QuotationListPage"));
const CreateQuotationPage = React.lazy(() => import("./screens/quotation/CreateQuotationPage"));
const QuotationDetailPage = React.lazy(() => import("./screens/quotation/QuotationDetailPage"));

// Super Admin & AI Advisor
const SuperAdminDashboardPage = React.lazy(() => import("./screens/admin/SuperAdminDashboardPage"));
const AIBusinessAdvisorPage = React.lazy(() => import("./screens/ai/AIBusinessAdvisorPage"));

const ComingSoonPage = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🚀</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Coming Soon</h2>
      <p className="text-gray-500">This feature is currently under development.</p>
    </div>
  </div>
);

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

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId || "dummy-client-id-for-dev"}>
      <ErrorBoundary>
        <SettingsProvider>
          <CompanyProvider>
            <Router>
              <Suspense fallback={<Loader />}>
                <Routes>
                  {/* Auth Routes - No Layout */}
                  <Route path="/login" element={<LoginScreen />} />
                  <Route path="/register" element={<RegisterScreen />} />
                  <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
                  <Route path="/key-recovery" element={<KeyreCoveryPage />} />
                  <Route path="/verify-otp" element={<VerifyOtp />} />

                  {/* Main App Routes - With Dashboard Layout */}
                  <Route element={<DashboardLayout />}>
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
                    <Route path="/inventory/analytics" element={<CategoryAnalyticsPage />} />
                    <Route path="/inventory/purchase" element={<PurchaseEntryPage />} />
                    <Route path="/inventory/adjust" element={<StockAdjustmentPage />} />
                    <Route path="/inventory/list" element={<ProductListPage />} />
                    <Route path="/inventory/detail/:id" element={<ProductDetailPage />} />
                    <Route path="/inventory/batch" element={<SerialBatchPage />} />
                    <Route path="/inventory/purchase-return" element={<InventorySalesReturnPage />} />
                    <Route path="/inventory/supplier-ledger" element={<InventorySupplierLedgerPage />} />
                    <Route path="/inventory/transfer" element={<StockTransferPage />} />
                    <Route path="/inventory/parse-purchase-bill" element={<ParsePurchaseBillPage />} />
                    <Route path="/inventory/categories" element={<CategoryManagementPage />} />
                    <Route path="/inventory/masters" element={<ItemMasterPage />} />

                    {/* Expenses */}
                    <Route path="/expenses" element={<ExpensesPage />} />
                    <Route path="/expenses/add" element={<AddExpensePage />} />
                    <Route path="/expenses/list" element={<ExpensesListPage />} />

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
                    <Route path="/capital" element={<FixedAssetsPage />} />
                    <Route path="/admin" element={<SuperAdminDashboardPage />} />
                    <Route path="/ai-advisor" element={<AIBusinessAdvisorPage />} />
                    <Route path="/reports/tds-tcs" element={<TdsTcsPage />} />

                    {/* Leads */}
                    <Route path="/leads" element={<LeadListPage />} />
                    <Route path="/leads/create" element={<CreateLeadPage />} />
                    <Route path="/leads/:id" element={<LeadDetailPage />} />

                    {/* Quotations */}
                    <Route path="/quotations" element={<QuotationListPage />} />
                    <Route path="/quotations/create" element={<CreateQuotationPage />} />
                    <Route path="/quotations/:id" element={<QuotationDetailPage />} />
                    <Route path="/billing/quotations" element={<QuotationListPage />} />
                    <Route path="/billing/quotations/create" element={<CreateQuotationPage />} />

                    {/* Salary */}
                    <Route path="/salary" element={<SalaryPage />} />
                    <Route path="/salary/add" element={<AddSalaryPage />} />
                    <Route path="/salary/attendance" element={<MarkAttendancePage />} />
                    <Route path="/salary/statement" element={<StaffStatementPage />} />
                    <Route path="/salary/list" element={<SalaryListPage />} />

                    {/* Cash & Bank */}
                    <Route path="/banking" element={<BankReconciliationPage />} />

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
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/change-password" element={<ProfilePage />} />
                    <Route path="/settings/security" element={<SecurityLogPage />} />
                    <Route path="/settings/web" element={<WebPreferences />} />
                    <Route path="/settings/staff" element={<StaffManagementPage />} />
                    <Route path="/settings/whatsapp" element={<WhatsappSettingsPage />} />
                    <Route path="/settings/units" element={<UnitSettingsPage />} />
                    <Route path="/settings/performance" element={<StaffPerformancePage />} />

                    {/* Additional Settings Routes */}
                    <Route path="/pages/settings" element={<PageSettings />} />
                    <Route path="/pages/settings/app" element={<PageAppSettings />} />
                    <Route path="/pages/settings/cloud-sync" element={<PageCloudSync />} />
                    <Route path="/pages/settings/profile" element={<PageProfile />} />
                    <Route path="/pages/settings/security-log" element={<PageSecurityLog />} />
                  </Route>
                </Routes>
              </Suspense>
            </Router>
          </CompanyProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
};

export default App;