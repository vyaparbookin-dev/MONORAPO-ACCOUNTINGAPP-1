import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  Search,
  Bell,
  Settings,
  LogOut,
  Home,
  BarChart3,
  DollarSign,
  Package,
  Users,
  Gift,
  Inbox,
  Warehouse,
  Clock,
  FileText,
  ChevronDown,
  Receipt,
  Building2,
  Plus,
  ShoppingCart,
  Briefcase,
  ArrowRightLeft,
  BookOpen,
  UserCheck,
  CheckCircle,
  Smartphone,
  ShieldCheck,
  PenTool,
  Calculator,
  Landmark,
  AlertTriangle,
  Bot
} from "lucide-react";
import Footer from "./Footer";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useCompany } from "../contexts/CompanyContext";
import { SecurityTracker } from "@repo/shared";
import CloudSyncToggel from "./CloudSyncToggel";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [ecosystemModalOpen, setEcosystemModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { companies, selectedCompany, selectCompany, loading } = useCompany();

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Keep user on dashboard; only suggest adding company if empty without forced navigation
  useEffect(() => {
    if (!selectedCompany && companies.length > 0) {
      selectCompany(companies[0]);
    }
  }, [companies, selectedCompany]);

  const handleLogout = () => {
    SecurityTracker.track('USER_LOGOUT', { userId: user?._id, email: user?.email });
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("companyId");
    localStorage.removeItem("selectedCompany");
    navigate("/login");
  };

  // Get the selected industry type and make it lowercase for easy checking
  const indType = selectedCompany?.industryType?.toLowerCase() || '';

  const menuItems = [
    { icon: Sparkles, label: "🚀 Landing Showcase", href: "/landing", color: "text-purple-400", roles: ['admin', 'manager', 'cashier'] },
    { icon: Home, label: "Dashboard", href: "/dashboard", color: "text-blue-600", roles: ['admin', 'manager', 'cashier'] },
    { icon: FileText, label: "Invoices", href: "/billing", color: "text-green-600", roles: ['admin', 'manager', 'cashier'] },
    { icon: ShoppingCart, label: "Fast POS", href: "/fast-pos", color: "text-amber-500", roles: ['admin', 'manager', 'cashier'] },
    { icon: Package, label: "Inventory", href: "/inventory", color: "text-purple-600", roles: ['admin', 'manager'] },
    { icon: Users, label: "Parties", href: "/parties", color: "text-blue-500", roles: ['admin', 'manager', 'cashier'] },
    { icon: Briefcase, label: "B2B Bills", href: "/billing/b2b", color: "text-blue-500", roles: ['admin', 'manager'] },
    { icon: Users, label: "Leads", href: "/leads", color: "text-purple-600", roles: ['admin', 'manager'] },
    { icon: FileText, label: "Quotations", href: "/quotations", color: "text-orange-500", roles: ['admin', 'manager'] },
    
    // INDUSTRY SPECIFIC FEATURES
    // 1. Electronics / Mobile
    ...(indType.includes('electronic') || indType.includes('mobile') || indType.includes('computer')
      ? [
          { icon: Smartphone, label: "IMEI Tracking", href: "/serial-tracking", color: "text-cyan-500", roles: ['admin', 'manager'] },
          { icon: ShieldCheck, label: "Warranty Claims", href: "/warranty", color: "text-emerald-500", roles: ['admin', 'manager'] }
        ] 
      : []),

    // 2. Hardware / Electricals
    ...(indType.includes('hardware') || indType.includes('electrical') || indType.includes('sanitary') || indType.includes('paint')
      ? [
          { icon: PenTool, label: "Batch & Stock", href: "/inventory/batch", color: "text-orange-700", roles: ['admin', 'manager'] }
        ] 
      : []),

    // If businessType is an array, check if it ONLY contains 'service' or if it includes others. By default, show inventory analytics unless strictly service.
    { icon: CheckCircle, label: "Approvals", href: "/approvals", color: "text-emerald-500", roles: ['admin', 'manager'] },
    ...(!Array.isArray(selectedCompany?.businessType) || selectedCompany?.businessType.length === 0 || selectedCompany?.businessType.some(t => t !== 'service') ? [{ icon: BarChart3, label: "Category Analytics", href: "/inventory/analytics", color: "text-blue-600", roles: ['admin', 'manager'] }] : []),
    ...(!Array.isArray(selectedCompany?.businessType) || selectedCompany?.businessType.length === 0 || selectedCompany?.businessType.some(t => t !== 'service') ? [{ icon: ArrowRightLeft, label: "Transfer", href: "/inventory/transfer", color: "text-indigo-500", roles: ['admin', 'manager'] }] : []),
    { icon: Landmark, label: "Cash & Bank", href: "/banking", color: "text-cyan-600", roles: ['admin', 'manager'] },
    { icon: AlertTriangle, label: "Non-Moving Stock", href: "/reports/non-moving-stock", color: "text-red-500", roles: ['admin', 'manager'] },
    { icon: DollarSign, label: "Expenses", href: "/expenses", color: "text-orange-600", roles: ['admin', 'manager'] },
    { icon: Building2, label: "Company", href: "/company", color: "text-indigo-600", roles: ['admin'] },
    { icon: Gift, label: "Coupons", href: "/coupons", color: "text-pink-600", roles: ['admin', 'manager'] },
    { icon: Users, label: "Membership", href: "/membership", color: "text-teal-600", roles: ['admin', 'manager', 'cashier'] },
    { icon: Inbox, label: "Notifications", href: "/notifications", color: "text-yellow-600", roles: ['admin', 'manager', 'cashier'] },
    { icon: BarChart3, label: "Reports", href: "/reports", color: "text-red-600", roles: ['admin'] },
    { icon: BarChart3, label: "Graphical Analytics", href: "/reports/analytics", color: "text-indigo-500", roles: ['admin', 'manager'] },
    { icon: DollarSign, label: "Profit & Loss", href: "/reports/profitloss", color: "text-emerald-500", roles: ['admin'] },
    { icon: FileText, label: "GST Report", href: "/reports/gst", color: "text-blue-500", roles: ['admin'] },
    { icon: Receipt, label: "Bank Recon", href: "/reports/bank-reconciliation", color: "text-cyan-500", roles: ['admin'] },
    { icon: Package, label: "E-Way Bill", href: "/reports/eway-bill", color: "text-indigo-500", roles: ['admin'] },
    { icon: FileText, label: "TDS / TCS", href: "/reports/tds-tcs", color: "text-purple-500", roles: ['admin'] },
    { icon: Clock, label: "Aging Analysis", href: "/reports/aging", color: "text-rose-500", roles: ['admin', 'manager'] },
    { icon: BookOpen, label: "Day Book", href: "/reports/daybook", color: "text-rose-500", roles: ['admin'] },
    { icon: Receipt, label: "Salary", href: "/salary", color: "text-cyan-600", roles: ['admin'] },
    { icon: UserCheck, label: "Attendance", href: "/salary/attendance", color: "text-emerald-500", roles: ['admin', 'manager'] },
    { icon: Bot, label: "AI मुनीम जी", href: "/ai-advisor", color: "text-purple-500", roles: ['admin', 'manager', 'cashier'] },
    { icon: ShieldCheck, label: "Super Admin Hub", href: "/admin", color: "text-red-500", roles: ['admin'] },
    { icon: Smartphone, label: "Mobile App (Live)", href: "http://localhost:8082", isExternal: true, color: "text-indigo-400", roles: ['admin', 'manager', 'cashier'] },
    { icon: Clock, label: "Laterpad", href: "/laterpad", color: "text-lime-600", roles: ['admin', 'manager', 'cashier'] },
    ...(Array.isArray(selectedCompany?.businessType) && selectedCompany?.businessType.includes('manufacturing') ? [{ icon: Warehouse, label: "Warehouse", href: "/warehouse", color: "text-amber-600", roles: ['admin', 'manager'] }] : []),
  ];

  const userRole = user?.role || 'admin'; // Default to admin if no role found

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col fixed h-screen z-40 md:relative overflow-y-auto`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!sidebarOpen && "justify-center w-full"}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
              <Building2 size={24} />
            </div>
            {sidebarOpen && (
              <div>
                <p className="font-bold text-lg">RedAccounting</p>
                <p className="text-xs text-gray-400">Business Suite</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.filter(item => !item.roles || item.roles.includes(userRole)).map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.isExternal) {
                  window.open(item.href, '_blank');
                } else {
                  navigate(item.href);
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-200 group text-left"
              title={!sidebarOpen ? item.label : ""}
            >
              <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
              {sidebarOpen && (
                <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Settings & Logout */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          {['admin'].includes(userRole) && (
          <button
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition text-left"
            title={!sidebarOpen ? "Settings" : ""}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
          </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition"
            title={!sidebarOpen ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 m-4 hover:bg-slate-700 rounded-lg transition hidden lg:block w-12 h-12 flex items-center justify-center"
        >
          {sidebarOpen ? <ChevronDown size={20} /> : <ChevronDown size={20} className="rotate-90" />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0" style={{ marginLeft: sidebarOpen ? 0 : 0 }}>
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            {/* Left Side - Menu Button & Search */}
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 flex-1 max-w-md">
                <Search className="text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search invoices, products..."
                  className="bg-transparent outline-none text-gray-700 placeholder-gray-500 w-full text-sm"
                />
              </div>
            </div>

            {/* Right Side - Header Tools, Company Selector, Notifications & Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 1. Fast Calculator Button */}
              <button
                onClick={() => setCalcModalOpen(true)}
                className="p-2 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-xl transition border border-gray-200 flex items-center gap-1.5 shadow-sm"
                title="Open Fast Calculator"
              >
                <Calculator size={18} />
                <span className="hidden xl:inline text-xs font-bold">Calculator</span>
              </button>

              {/* 2. Refer & Earn Cash Tokens (Gift Icon) */}
              <button
                onClick={() => setReferralModalOpen(true)}
                className="px-3 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-indigo-700 rounded-xl transition border border-indigo-200 flex items-center gap-1.5 shadow-sm"
                title="Refer & Earn Cash Tokens"
              >
                <Gift size={18} className="text-indigo-600 animate-bounce" />
                <span className="hidden md:inline text-xs font-extrabold text-indigo-900">Refer & Earn</span>
                <span className="text-[10px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">₹500</span>
              </button>

              {/* 3. Multi-Platform Ecosystem Showcase (Phone & Screen Icon) */}
              <button
                onClick={() => setEcosystemModalOpen(true)}
                className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 rounded-xl transition border border-emerald-200 flex items-center gap-1.5 shadow-sm"
                title="Mobile, Desktop & Web Features"
              >
                <Smartphone size={17} className="text-emerald-600" />
                <span className="hidden lg:inline text-xs font-extrabold text-emerald-900">All Apps</span>
              </button>

              {/* 4. AI Munim Ji (Copilot Button) */}
              <button
                onClick={() => navigate('/ai-advisor')}
                className="px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-800 rounded-xl transition border border-purple-200 flex items-center gap-1.5 shadow-sm"
                title="Ask AI Munim Ji (Smart Business Advisor)"
              >
                <Bot size={17} className="text-purple-600" />
                <span className="hidden md:inline text-xs font-black text-purple-900">AI मुनीम जी</span>
              </button>

              {/* Cloud Sync Toggle */}
              <CloudSyncToggel />

              {/* Company Selector */}
              {companies.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setCompanyMenuOpen(!companyMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    <Building2 size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedCompany ? selectedCompany.name : "Select Company"}
                    </span>
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>
                  {companyMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-0 z-50">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Select Company</h3>
                      </div>
                      <div className="space-y-1 p-2 max-h-64 overflow-y-auto">
                        {companies.map((company) => (
                          <button
                            key={company._id}
                            onClick={() => {
                              selectCompany(company);
                              setCompanyMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition ${
                              selectedCompany && selectedCompany._id === company._id ? "bg-blue-50 text-blue-700" : "text-gray-700"
                            }`}
                          >
                            <div className="font-medium">{company.name}</div>
                            <div className="text-xs text-gray-500 capitalize">{Array.isArray(company.businessType) ? company.businessType.join(', ') : company.businessType}</div>
                          </button>
                        ))}
                      </div>
                      <div className="p-2 border-t border-gray-200">
                        <button
                          onClick={() => {
                            navigate("/company/add");
                            setCompanyMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-2"
                        >
                          <Plus size={16} />
                          <span className="text-sm font-medium">Add New Company</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate("/company");
                            setCompanyMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition mt-1"
                        >
                          <span className="text-sm font-medium">Manage Companies</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 1-Click Public Landing Page Button */}
              <button
                type="button"
                onClick={() => navigate("/landing")}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-sm transition transform hover:scale-105"
                title="View & Share Public Landing Page"
              >
                <Sparkles size={14} className="text-yellow-300 animate-pulse" />
                <span>Landing Page</span>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <Bell size={20} className="text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-0 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="space-y-3 p-4 max-h-96 overflow-y-auto">
                      <NotificationItem
                        title="Invoice INV001 Overdue"
                        desc="Payment due was 10 days ago"
                        time="2 hours ago"
                        color="red"
                      />
                      <NotificationItem
                        title="Low Stock Alert"
                        desc="3 products have low inventory"
                        time="4 hours ago"
                        color="yellow"
                      />
                      <NotificationItem
                        title="Salary Processed"
                        desc="Monthly salary for all employees"
                        time="1 day ago"
                        color="green"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.email?.split("@")[0] || "User"}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role || "user"}</p>
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-0 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <p className="font-semibold text-gray-900">{user?.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/settings/profile"); }}
                      className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-100 text-sm flex items-center gap-2"
                    >
                      👤 प्रोफाइल (My Profile)
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/settings/profile"); }}
                      className="w-full text-left px-4 py-2.5 text-blue-600 hover:bg-blue-50 text-sm font-bold flex items-center gap-2"
                    >
                      🔑 पासवर्ड बदलें (Change Password)
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                      className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-100 text-sm border-b border-gray-200 flex items-center gap-2"
                    >
                      ⚙️ सेटिंग्स (App Settings)
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 text-sm font-medium"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>

      {/* 1. Quick Calculator Modal */}
      {calcModalOpen && (
        <QuickCalculatorModal onClose={() => setCalcModalOpen(false)} />
      )}

      {/* 2. Refer & Earn Cash Tokens Modal */}
      {referralModalOpen && (
        <ReferralCashTokensModal 
          company={selectedCompany} 
          onClose={() => setReferralModalOpen(false)} 
        />
      )}

      {/* 3. Multi-Platform Ecosystem Showcase Modal */}
      {ecosystemModalOpen && (
        <EcosystemShowcaseModal onClose={() => setEcosystemModalOpen(false)} />
      )}
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS & MODALS
// ==========================================

function QuickCalculatorModal({ onClose }) {
  const [calcInput, setCalcInput] = useState("0");
  const [calcHistory, setCalcHistory] = useState("");

  const handleDigit = (val) => {
    setCalcInput((prev) => (prev === "0" ? String(val) : prev + String(val)));
  };

  const handleOp = (op) => {
    setCalcHistory(`${calcInput} ${op}`);
    setCalcInput("0");
  };

  const handleClear = () => {
    setCalcInput("0");
    setCalcHistory("");
  };

  const handleEqual = () => {
    try {
      if (!calcHistory) return;
      const parts = calcHistory.split(" ");
      const prevNum = parseFloat(parts[0]);
      const op = parts[1];
      const currNum = parseFloat(calcInput);
      let res = 0;
      if (op === "+") res = prevNum + currNum;
      else if (op === "-") res = prevNum - currNum;
      else if (op === "×" || op === "*") res = prevNum * currNum;
      else if (op === "÷" || op === "/") res = currNum !== 0 ? prevNum / currNum : 0;
      else if (op === "%") res = (prevNum * currNum) / 100;
      setCalcInput(String(Math.round(res * 100) / 100));
      setCalcHistory("");
    } catch {
      setCalcInput("Error");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-blue-400" />
            <h3 className="font-bold text-sm">Fast Billing Calculator</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="bg-slate-950 p-4 text-right">
          <div className="text-xs text-gray-400 h-4 font-mono">{calcHistory}</div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight overflow-x-auto">{calcInput}</div>
        </div>
        <div className="p-4 grid grid-cols-4 gap-2 bg-slate-50">
          <button onClick={handleClear} className="col-span-2 p-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-sm transition">C</button>
          <button onClick={() => handleOp("%")} className="p-3 bg-gray-200 hover:bg-gray-300 font-bold rounded-xl text-sm transition">%</button>
          <button onClick={() => handleOp("÷")} className="p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition">÷</button>

          {["7", "8", "9"].map(d => (
            <button key={d} onClick={() => handleDigit(d)} className="p-3 bg-white hover:bg-gray-100 border border-gray-200 font-bold rounded-xl text-sm shadow-sm transition">{d}</button>
          ))}
          <button onClick={() => handleOp("×")} className="p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition">×</button>

          {["4", "5", "6"].map(d => (
            <button key={d} onClick={() => handleDigit(d)} className="p-3 bg-white hover:bg-gray-100 border border-gray-200 font-bold rounded-xl text-sm shadow-sm transition">{d}</button>
          ))}
          <button onClick={() => handleOp("-")} className="p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition">−</button>

          {["1", "2", "3"].map(d => (
            <button key={d} onClick={() => handleDigit(d)} className="p-3 bg-white hover:bg-gray-100 border border-gray-200 font-bold rounded-xl text-sm shadow-sm transition">{d}</button>
          ))}
          <button onClick={() => handleOp("+")} className="p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition">+</button>

          <button onClick={() => handleDigit("0")} className="col-span-2 p-3 bg-white hover:bg-gray-100 border border-gray-200 font-bold rounded-xl text-sm shadow-sm transition">0</button>
          <button onClick={() => handleDigit(".")} className="p-3 bg-white hover:bg-gray-100 border border-gray-200 font-bold rounded-xl text-sm shadow-sm transition">.</button>
          <button onClick={handleEqual} className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-sm transition">=</button>
        </div>
      </div>
    </div>
  );
}

function ReferralCashTokensModal({ company, onClose }) {
  const [copied, setCopied] = useState(false);
  const [selectedPlanPreview, setSelectedPlanPreview] = useState("pro");
  const referralCode = company?.referralCode || `${(company?.name || 'SHOP').replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase()}-20OFF`;
  const shareUrl = `https://vyaparbook.in/join?ref=${referralCode}`;
  const shareMessage = `नमस्ते! मैं अपनी दुकान के लिए Red Accounting Book ERP सॉफ्टवेयर इस्तेमाल कर रहा हूँ। इसमें फास्ट बिलिंग, स्टॉक मैनेजमेंट, बारकोड और ऑटोमैटिक हिसाब-किताब बहुत आसान है।\n\nमेरे रेफरल कोड *${referralCode}* से जुड़ें और किसी भी पैकेज पर तुरंत फ्लैट 20% का डिस्काउंट पाएं!\nलिंक: ${shareUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const planPricing = {
    offline: { name: "Mobile Offline", original: 299, discounted: 239, save: 60 },
    online: { name: "Mobile Cloud Hybrid", original: 599, discounted: 479, save: 120 },
    pro: { name: "Enterprise Pro (Web+Desktop+Mobile)", original: 2999, discounted: 2399, save: 600 }
  };

  const currentPreview = planPricing[selectedPlanPreview];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Gift size={22} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Refer & Earn (Flat 20% Off + Cash Tokens)</h3>
              <p className="text-xs text-indigo-100">Earn tokens & 20% discount on every successful referral</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Balance & 20% Benefit Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Your Referral Balance</span>
              <div className="text-2xl font-black text-amber-900 mt-0.5 flex items-center gap-1.5">
                <span>🪙 500 Tokens</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Flat 20% Off</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-amber-700 block font-medium">Valid on</span>
              <span className="text-xs font-bold text-amber-900">All 3 SaaS Plans</span>
            </div>
          </div>

          {/* Referral Code Box */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5 uppercase">Your Unique Referral Code & Link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border-2 border-dashed border-indigo-300 rounded-xl px-4 py-2.5 text-center font-mono font-black text-lg text-indigo-700 tracking-wider">
                {referralCode}
              </div>
              <button 
                onClick={handleCopy}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition border border-gray-200"
              >
                {copied ? <CheckCircle size={15} className="text-green-600" /> : <BookOpen size={15} />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>

          {/* 1-Click WhatsApp Share */}
          <button
            onClick={handleWhatsAppShare}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
          >
            <span className="text-lg">💬</span>
            <span>Share on WhatsApp (Code: {referralCode})</span>
          </button>

          {/* Live 20% Discount Calculator Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
              💡 20% Discount Calculator Preview:
            </span>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[
                { id: "offline", label: "📱 Offline" },
                { id: "online", label: "☁️ Cloud" },
                { id: "pro", label: "🚀 Pro (All 3)" }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlanPreview(p.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                    selectedPlanPreview === p.id 
                      ? "bg-indigo-600 text-white shadow-sm" 
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
              <div>
                <span className="text-slate-500 line-through">₹{currentPreview.original}</span>
                <span className="ml-2 font-extrabold text-indigo-700 text-sm">₹{currentPreview.discounted}/yr</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full text-[11px]">
                You Save ₹{currentPreview.save} (20% OFF)
              </span>
            </div>
          </div>

          {/* 3-Step Guide */}
          <div className="border-t border-gray-100 pt-3">
            <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2.5">How It Works:</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded-xl border border-gray-100">
                <span className="w-5 h-5 bg-indigo-100 text-indigo-700 font-bold rounded-full inline-flex items-center justify-center text-[10px] mb-1">1</span>
                <p className="text-xs font-bold text-gray-800">Share Code</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Send your code to merchant friends</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-gray-100">
                <span className="w-5 h-5 bg-purple-100 text-purple-700 font-bold rounded-full inline-flex items-center justify-center text-[10px] mb-1">2</span>
                <p className="text-xs font-bold text-gray-800">They Sign Up</p>
                <p className="text-[10px] text-gray-500 mt-0.5">They get 20% off on first purchase</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-gray-100">
                <span className="w-5 h-5 bg-emerald-100 text-emerald-700 font-bold rounded-full inline-flex items-center justify-center text-[10px] mb-1">3</span>
                <p className="text-xs font-bold text-gray-800">You Get 20% Off</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Direct 20% discount on your renewal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EcosystemShowcaseModal({ onClose }) {
  const [billingPeriod, setBillingPeriod] = useState("3year"); // "1year" or "3year"

  const plans = [
    {
      id: "offline",
      badge: "📱 Mobile Offline Edition",
      highlight: "Basic / 100% Offline POS",
      color: "from-blue-600 to-indigo-700",
      borderColor: "border-blue-200",
      headerBg: "bg-blue-50 text-blue-900",
      // Pricing
      price1Year: 299,
      first50_1Year: 209,
      price3Year: 672, // 25% cheaper: 299*3=897 -> 672 (224/yr)
      first50_3Year: 470, // 30% off on 672
      pricePerYear3Yr: 224,
      features: [
        "⚡ 100% Offline POS Billing: Generate bills anywhere without internet.",
        "💾 Local SQLite Engine: Zero-lag instant database performance on phone.",
        "🖨️ Wireless Bluetooth Thermal Printing: 2-inch & 3-inch receipt printing.",
        "📷 Barcode Camera Scanner: Instant item addition via phone camera.",
        "📄 Professional PDF Invoices: Clean bills ready to print/save."
      ]
    },
    {
      id: "online",
      badge: "☁️ Mobile Cloud Hybrid Edition",
      highlight: "Single Store + Auto Cloud Backup",
      color: "from-purple-600 to-indigo-800",
      borderColor: "border-purple-200",
      headerBg: "bg-purple-50 text-purple-900",
      // Pricing
      price1Year: 599,
      first50_1Year: 419,
      price3Year: 1348, // 25% cheaper: 599*3=1797 -> 1348 (449/yr)
      first50_3Year: 943, // 30% off on 1348
      pricePerYear3Yr: 449,
      features: [
        "☁️ Mobile Offline + Automatic Cloud Backup: 100% data safety.",
        "🔄 1-Click Cloud Restore: Phone change/chori hone par data kabhi nahi khoyega.",
        "💬 WhatsApp Invoice Sharing: Send professional PDF bills with payment QR.",
        "📦 Godown Stock Audit: Check & update stock directly in warehouse.",
        "⚡ Auto-sync when internet connects + Instant offline speed."
      ]
    },
    {
      id: "pro",
      badge: "🚀 Enterprise Pro (Web + Desktop + Mobile)",
      highlight: "Universal 3-Way Realtime Sync (Recommended)",
      color: "from-emerald-600 to-teal-800",
      borderColor: "border-emerald-300 ring-2 ring-emerald-500",
      headerBg: "bg-emerald-50 text-emerald-900",
      isPopular: true,
      // Pricing
      price1Year: 2999,
      first50_1Year: 2099,
      price3Year: 6749, // 25% cheaper: 2999*3=8997 -> 6749 (2249/yr, Save 2248!)
      first50_3Year: 4724, // 30% off on 6749
      pricePerYear3Yr: 2249,
      features: [
        "🌐💻📱 3-Device Real-time Sync: Mobile + Windows/Mac Desktop + Web Browser.",
        "⌨️ 100% Keyboard-Driven Desktop POS: Counter billing at lightning speed.",
        "🌍 Web Live Owner Analytics: Check sales, profits & cashflow from anywhere.",
        "📊 20+ GSTR Accounting Reports: Tally & CA Excel 1-click export.",
        "👥 Multi-User Roles & Permissions: Cashier, Manager, Admin controls.",
        "🏬 Multi-Branch Management: Manage multiple shops under 1 account."
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wide">
                ⏱️ 15 Days Free Trial Active
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wide">
                🎉 First 50 Users: Extra 30% OFF
              </span>
            </div>
            <h3 className="font-extrabold text-lg mt-1">SaaS Plans & Multi-Platform Ecosystem</h3>
            <p className="text-xs text-gray-300">Choose the perfect edition for your store — Mobile, Desktop & Web</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Duration Selector & Launch Banner */}
        <div className="p-4 bg-slate-50 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-300 shadow-sm">
            <button
              onClick={() => setBillingPeriod("1year")}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition ${
                billingPeriod === "1year" 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              1 Year Plan
            </button>
            <button
              onClick={() => setBillingPeriod("3year")}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                billingPeriod === "3year" 
                  ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm" 
                  : "text-emerald-700 hover:text-emerald-900"
              }`}
            >
              <span>3 Years Plan</span>
              <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black">25% Cheaper 🔥</span>
            </button>
          </div>

          <div className="text-xs text-emerald-800 font-bold bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-lg">
            ✨ First 50 Stores: Extra 30% Launch Discount Applied!
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          {plans.map(plan => {
            const is3Yr = billingPeriod === "3year";
            const normalRate = is3Yr ? plan.price3Year : plan.price1Year;
            const specialRate = is3Yr ? plan.first50_3Year : plan.first50_1Year;
            const perYearCost = is3Yr ? plan.pricePerYear3Yr : plan.price1Year;

            return (
              <div 
                key={plan.id} 
                className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition hover:shadow-md ${plan.borderColor}`}
              >
                <div>
                  {/* Card Header */}
                  <div className={`bg-gradient-to-r ${plan.color} text-white p-4`}>
                    {plan.isPopular && (
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block">
                        ★ Most Powerful
                      </span>
                    )}
                    <h4 className="font-extrabold text-sm leading-tight">{plan.badge}</h4>
                    <p className="text-[11px] text-white/80 mt-1">{plan.highlight}</p>
                  </div>

                  {/* Pricing Box */}
                  <div className="p-4 border-b border-gray-100 bg-slate-50/50">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">₹{specialRate.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 line-through">₹{normalRate.toLocaleString()}</span>
                    </div>

                    <div className="text-[11px] font-bold text-emerald-700 mt-1">
                      {is3Yr ? (
                        <span>₹{perYearCost}/year (25% + 30% Cheaper)</span>
                      ) : (
                        <span>₹{specialRate}/year (30% Launch Offer)</span>
                      )}
                    </div>

                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {is3Yr ? "Billed for 3 Years (₹" + specialRate + " total)" : "Billed Annually"}
                    </div>
                  </div>

                  {/* Feature List */}
                  <div className="p-4 space-y-2">
                    <span className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider block mb-2">Key Features:</span>
                    {plan.features.map((f, idx) => (
                      <div key={idx} className="text-xs text-gray-600 flex items-start gap-2 leading-snug">
                        <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer CTA */}
                <div className="p-4 pt-0">
                  <button 
                    onClick={() => {
                      alert(`आपने "${plan.badge}" चुना है। आपका 15 दिन का Free Trial एक्टिव है!`);
                      onClose();
                    }}
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition shadow-sm ${
                      plan.isPopular 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    Start 15-Day Free Trial →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Direct Download Action Bar */}
        <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left">
            <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
              <span>🚀 Download Native Apps (v1.2.0)</span>
            </div>
            <p className="text-[11px] text-slate-300">Download for Windows PC or Android smartphone</p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/vyaparbookin-dev/MONORAPO-ACCOUNTINGAPP-1/releases/download/v1.2.0/Red.Accounting.Book.Setup.1.2.0.exe"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Download Windows PC Installer"
            >
              <span>💻 Download Desktop (.exe)</span>
            </a>

            <a
              href="https://github.com/vyaparbookin-dev/MONORAPO-ACCOUNTINGAPP-1/releases/download/v1.2.0/RedAccounting-1.2.0.apk"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Download Android APK"
            >
              <span>📱 Download Android (.apk)</span>
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-gray-400 font-medium">
          🔒 100% Data Privacy & Encryption • Free Customer Support on WhatsApp • Cancel Anytime
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ title, desc, time, color }) {
  const colors = {
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <div className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition">
      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${colors[color]}`}></div>
      <div className="flex-1">
        <p className="font-medium text-gray-900 text-sm">{title}</p>
        <p className="text-gray-600 text-xs">{desc}</p>
        <p className="text-gray-500 text-xs mt-1">{time}</p>
      </div>
    </div>
  );
}

