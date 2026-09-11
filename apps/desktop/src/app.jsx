import React, { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { CompanyProvider } from "./contexts/CompanyContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SettingsProvider } from "./contexts/SettingsContext"; // Import SettingsProvider
import { SecurityTracker } from "./components/SecurityTracker";
import DashboardLayout from "./components/DashboardLayout";
import Loader from "./components/Loader";

// Resilient Dynamic Import Wrapper with Auto-Recovery for Stale Deployments
const safeLazy = (importFn) => {
  return React.lazy(async () => {
    try {
      return await importFn();
    } catch (err) {
      console.warn("Dynamic import failed, retrying chunk...", err);
      const isChunkError = 
        err?.message?.includes("dynamically imported module") || 
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("MIME type") ||
        err?.message?.includes("text/html") ||
        err?.name === "ChunkLoadError";

      if (isChunkError && typeof window !== "undefined") {
        const key = "safe_lazy_reload_" + (window.location.pathname || "root");
        const alreadyReloaded = sessionStorage.getItem(key);
        if (!alreadyReloaded) {
          sessionStorage.setItem(key, "true");
          window.location.reload();
          return new Promise(() => {});
        }
      }
      try {
        return await importFn();
      } catch (retryErr) {
        console.error("Critical component load fallback:", retryErr);
        return {
          default: () => (
            <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
              <div className="text-4xl mb-2">⚡</div>
              <h3 className="text-lg font-bold text-gray-800">Screen Refreshing...</h3>
              <p className="text-sm text-gray-500 mb-4">Please refresh to load the latest components.</p>
              <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">
                Refresh Now
              </button>
            </div>
          )
        };
      }
    }
  });
};

 // Assuming a loader component exists

// Landing & Gamezone
const LandingPage = safeLazy(() => import("./screens/Landing/LandingPage"));
const MobileVyaparApp = safeLazy(() => import("./screens/mobile_pwa/MobileVyaparApp"));
const GamezoneOperationsPage = safeLazy(() => import("./screens/gamezone/GamezoneOperationsPage"));

// Auth Screens
const LoginScreen = safeLazy(() => import("./screens/Auth/LoginScreen"));
const RegisterScreen = safeLazy(() => import("./screens/Auth/RegisterScreen"));
const ForgotPasswordScreen = safeLazy(() => import("./screens/Auth/ForgotPasswordScreen"));
const KeyreCoveryPage = safeLazy(() => import("./screens/Auth/KeyreCoveryPage"));
const VerifyOtp = safeLazy(() => import("./pages/setting/VerifyOtp"));

// Dashboard
const Dashboard = safeLazy(() => import("./screens/Dashboard/DashboardScreen"));
const ApprovalsPage = safeLazy(() => import("./screens/Dashboard/ApprovalsPage"));

// Parties
const PartiesPage = safeLazy(() => import("./screens/parties/PartiesPage"));

// Billing
const BillingPage = safeLazy(() => import("./screens/Billing/BillingPage"));
const BillListPage = safeLazy(() => import("./screens/Billing/BillListPage"));
const BillDetailPage = safeLazy(() => import("./screens/Billing/BillDetailPage"));
const FastPOSPage = safeLazy(() => import("./screens/Billing/FastPOSPage"));
const ImportBillPage = safeLazy(() => import("./screens/Billing/ImportBillPage"));
const ParseBillFromImage = safeLazy(() => import("./screens/Billing/ParseBillFromImage"));
const SalesReturnPage = safeLazy(() => import("./screens/Billing/SalesReturnPage"));
const CreateReturnScreen = safeLazy(() => import("./screens/returns/CreateReturnScreen"));
const B2bDocumentListPage = safeLazy(() => import("./screens/Billing/B2bDocumentListPage"));
const CreateB2bDocumentPage = safeLazy(() => import("./screens/Billing/CreateB2bDocumentPage"));

// Inventory
const InventoryPage = safeLazy(() => import("./screens/inventory/InventoryPage"));
const AddProductPage = safeLazy(() => import("./screens/inventory/AddProductPage"));
const BulkProductPage = safeLazy(() => import("./screens/inventory/BulkProductPage"));
const BulkUploadPage = safeLazy(() => import("./screens/inventory/BulkUploadPage"));
const CategoryAnalyticsPage = safeLazy(() => import("./screens/inventory/CategoryAnalyticsPage"));
const PurchaseEntryPage = safeLazy(() => import("./screens/inventory/PurchaseEntryPage"));
const StockAdjustmentPage = safeLazy(() => import("./screens/inventory/StockAdjustmentPage"));
const ProductListPage = safeLazy(() => import("./screens/inventory/ProductListPage"));
const ProductDetailPage = safeLazy(() => import("./screens/inventory/ProductDetailPage"));
const SerialBatchPage = safeLazy(() => import("./screens/inventory/SerialBatchPage"));
const InventorySalesReturnPage = safeLazy(() => import("./screens/inventory/SalesReturnPage"));
const InventorySupplierLedgerPage = safeLazy(() => import("./screens/inventory/SupplierLedgerPage"));
const StockTransferPage = safeLazy(() => import("./screens/inventory/StockTransferPage"));
const ParsePurchaseBillPage = safeLazy(() => import("./screens/inventory/ParseBillFromImage"));
const CategoryManagementPage = safeLazy(() => import("./screens/inventory/CategoryManagementPage"));
const ItemMasterPage = safeLazy(() => import("./screens/inventory/ItemMasterPage"));

// Expenses
const ExpensesPage = safeLazy(() => import("./screens/expenses/ExpensesPage"));
const AddExpensePage = safeLazy(() => import("./screens/expenses/AddExpensesPage"));
const ExpensesListPage = safeLazy(() => import("./screens/expenses/ExpensesListPage"));

// Company
const CompanyPage = safeLazy(() => import("./screens/company/CompanyPage"));
const AddCompanyPage = safeLazy(() => import("./screens/company/AddCompanyPage"));
const BranchPage = safeLazy(() => import("./screens/company/BranchPage"));
const CompanyListPage = safeLazy(() => import("./screens/company/CompanyListPage"));

// Coupons
const CouponsPage = safeLazy(() => import("./screens/coupons/CouponsPage"));
const CouponListPage = safeLazy(() => import("./screens/coupons/CouponListPage"));
const GenerateCoupanPage = safeLazy(() => import("./screens/coupons/GenerateCouponPage"));

// Membership
const MembershipPage = safeLazy(() => import("./screens/membership/MembershipPage"));
const MembershipListPage = safeLazy(() => import("./screens/membership/MemberShipListPage"));
const LoyaltyDetailPage = safeLazy(() => import("./screens/membership/LoyaltyDetailPage"));

// Notifications
const NotificationPage = safeLazy(() => import("./screens/notification/NotificationPage"));
const ReminderPage = safeLazy(() => import("./screens/notification/ReminderPage"));

// Reports
const ReportsPage = safeLazy(() => import("./screens/Reports/ReportsPage"));
const GstReportPost = safeLazy(() => import("./screens/Reports/GstReportPage"));
const ProductGstReportPage = safeLazy(() => import("./screens/Reports/ProductGstReportPage"));
const Gstr3bReportPage = safeLazy(() => import("./screens/Reports/Gstr3bReportPage"));
const ItemWiseReport = safeLazy(() => import("./screens/Reports/ItemWiseReport"));
const ItemWiseReportPage = safeLazy(() => import("./screens/Reports/ItemWiseReportpage"));
const BillWiseReportPage = safeLazy(() => import("./screens/Reports/BillWiseReportPage"));
const CustomerReportBuilder = safeLazy(() => import("./screens/Reports/CustomerReportBuilder"));
const PartyWiseReportPage = safeLazy(() => import("./screens/Reports/PartyWiseReportPage"));
const ProfitLossReportPage = safeLazy(() => import("./screens/Reports/ProfitLossReport"));
const SchemeReportPage = safeLazy(() => import("./screens/Reports/SchemeReportPage"));
const SupplierLedgerPage = safeLazy(() => import("./screens/Reports/SupplierLedgerPage"));
const DayBookPage = safeLazy(() => import("./screens/Reports/DayBookPage"));
const SitewiseReportPage = safeLazy(() => import("./screens/Reports/SitewiseReportPage"));
const AgingReportPage = safeLazy(() => import("./screens/Reports/AgingReportPage"));
const GraphicalAnalytics = safeLazy(() => import("./screens/Reports/GraphicalAnalytics"));
const BankReconciliationPage = safeLazy(() => import("./screens/Reports/BankReconciliationPage"));
const EWayBillPage = safeLazy(() => import("./screens/Reports/EWayBillPage"));
const FixedAssetsPage = safeLazy(() => import("./screens/Reports/FixedAssetsPage"));
const TdsTcsPage = safeLazy(() => import("./screens/Reports/TdsTcsPage"));

// Salary
const SalaryPage = safeLazy(() => import("./screens/salary/SalaryPage"));
const AddSalaryPage = safeLazy(() => import("./screens/salary/AddSalaryPage"));
const MarkAttendancePage = safeLazy(() => import("./screens/salary/MarkAttendancePage"));
const StaffStatementPage = safeLazy(() => import("./screens/salary/StaffStatementPage"));
const SalaryListPage = safeLazy(() => import("./screens/salary/SalaryListPage"));

// Laterpad (Late Payments)
const LaterpadPage = safeLazy(() => import("./screens/laterpad/LaterpadPage"));
const LaterpadListPage = safeLazy(() => import("./screens/laterpad/LaterpadlistPage"));

// Warehouse
const AddWarehousePage = safeLazy(() => import("./screens/warehouse/AddWarehousePage"));
const WarehouseListPage = safeLazy(() => import("./screens/warehouse/WareHouseListPage"));

// Settings
const SettingsPage = safeLazy(() => import("./screens/Settings/SettingsPage"));
const AppSettings = safeLazy(() => import("./screens/Settings/AppSettingPage"));
const BackupRestore = safeLazy(() => import("./screens/Settings/BackupRestore"));
const ProfilePage = safeLazy(() => import("./screens/Settings/ProfilePage"));
const SecurityLogPage = safeLazy(() => import("./screens/Settings/SecurityLogPage"));
const WebPreferences = safeLazy(() => import("./screens/Settings/WebPreferences"));
const StaffManagementPage = safeLazy(() => import("./screens/Settings/StaffManagementPage"));

// Additional Settings Pages (from pages/setting)
const PageAppSettings = safeLazy(() => import("./pages/setting/appsetting"));
const PageCloudSync = safeLazy(() => import("./pages/setting/cloudSync"));
const PageProfile = safeLazy(() => import("./pages/setting/profile"));
const PageSecurityLog = safeLazy(() => import("./pages/setting/securityLog"));
const PageSettings = safeLazy(() => import("./pages/setting/settings"));
const UnitSettingsPage = safeLazy(() => import("./screens/Settings/UnitSettingsPage"));
const StaffPerformancePage = safeLazy(() => import("./screens/Settings/StaffPerformancePage"));
const WhatsappSettingsPage = safeLazy(() => import("./screens/Settings/WhatsappSettingsPage"));

// Leads & Quotations
const LeadListPage = safeLazy(() => import("./screens/lead/LeadListPage"));
const CreateLeadPage = safeLazy(() => import("./screens/lead/CreateLeadPage"));
const LeadDetailPage = safeLazy(() => import("./screens/lead/LeadDetailPage"));
const QuotationListPage = safeLazy(() => import("./screens/quotation/QuotationListPage"));
const CreateQuotationPage = safeLazy(() => import("./screens/quotation/CreateQuotationPage"));
const QuotationDetailPage = safeLazy(() => import("./screens/quotation/QuotationDetailPage"));

// Super Admin & AI Advisor
const SuperAdminDashboardPage = safeLazy(() => import("./screens/admin/SuperAdminDashboardPage"));
const AIBusinessAdvisorPage = safeLazy(() => import("./screens/ai/AIBusinessAdvisorPage"));

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
                  <Route path="/landing" element={<LandingPage />} />
              <Route path="/mobile-app" element={<MobileVyaparApp />} />
              <Route path="/m" element={<MobileVyaparApp />} />
                  <Route path="/welcome" element={<LandingPage />} />
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
                    <Route path="/gamezone-operations" element={<GamezoneOperationsPage />} />
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