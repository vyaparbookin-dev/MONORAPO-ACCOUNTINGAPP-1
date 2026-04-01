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
  Calculator
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

  // Auto-redirect to Add Company if no companies exist
  useEffect(() => {
    if (!loading && companies.length === 0 && (location.pathname === "/" || location.pathname === "/dashboard")) {
      navigate("/company/add");
    }
  }, [companies, loading, location.pathname, navigate]);

  const handleLogout = () => {
    SecurityTracker.track('USER_LOGOUT', { userId: user?._id, email: user?.email });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Get the selected industry type and make it lowercase for easy checking
  const indType = selectedCompany?.industryType?.toLowerCase() || '';

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard", color: "text-blue-600", roles: ['admin', 'manager', 'cashier'] },
    { icon: FileText, label: "Invoices", href: "/billing", color: "text-green-600", roles: ['admin', 'manager', 'cashier'] },
    { icon: ShoppingCart, label: "Fast POS", href: "/fast-pos", color: "text-amber-500", roles: ['admin', 'manager', 'cashier'] },
    { icon: CheckCircle, label: "Approvals", href: "/approvals", color: "text-emerald-500", roles: ['admin', 'manager'] },
    { icon: Users, label: "Parties", href: "/parties", color: "text-blue-500", roles: ['admin', 'manager', 'cashier'] },
    { icon: Briefcase, label: "B2B Bills", href: "/billing/b2b", color: "text-blue-500", roles: ['admin', 'manager'] },
    
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

    ...(selectedCompany?.businessType !== 'service' ? [{ icon: Package, label: "Inventory", href: "/inventory", color: "text-purple-600", roles: ['admin', 'manager'] }] : []),
    ...(selectedCompany?.businessType !== 'service' ? [{ icon: ArrowRightLeft, label: "Transfer", href: "/inventory/transfer", color: "text-indigo-500", roles: ['admin', 'manager'] }] : []),
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
    { icon: Clock, label: "Laterpad", href: "/laterpad", color: "text-lime-600", roles: ['admin', 'manager', 'cashier'] },
    ...(selectedCompany?.businessType === 'manufacturing' ? [{ icon: Warehouse, label: "Warehouse", href: "/warehouse", color: "text-amber-600", roles: ['admin', 'manager'] }] : []),
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
              RA
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
              onClick={() => navigate(item.href)}
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

            {/* Right Side - Company Selector, Notifications & Profile */}
            <div className="flex items-center gap-4">
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
                            <div className="text-xs text-gray-500">{company.businessType}</div>
                          </button>
                        ))}
                      </div>
                      <div className="p-2 border-t border-gray-200">
                        <button
                          onClick={() => {
                            navigate("/company/create");
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
                    <a
                      href="/settings"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
                    >
                      Settings
                    </a>
                    <a
                      href="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm border-b border-gray-200"
                    >
                      Profile
                    </a>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-medium"
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
