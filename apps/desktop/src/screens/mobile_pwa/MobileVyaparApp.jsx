import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Home,
  Users,
  Package,
  BarChart2,
  Menu,
  Plus,
  Search,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  ChevronDown,
  Calculator,
  Gift,
  Tv,
  Share2,
  ShieldCheck,
  Calendar,
  X,
  RefreshCw,
  Phone,
  Trash2,
  Send,
  Printer,
  Receipt,
  Download,
  Camera,
  Upload,
  CheckCircle,
  FileText,
  TrendingUp,
  AlertTriangle,
  Building2,
  DollarSign,
  Truck,
  CreditCard,
  Percent,
  Sparkles,
  Bot,
  Layers,
  Clock,
  BookOpen,
  PieChart,
  Grid
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../contexts/CompanyContext";
import api from "../../services/api";
import PagarBookHub from "../../components/PagarBookHub";


class MobileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Mobile PWA Render Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-50 select-none">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold mb-3 shadow-sm">
            📱
          </div>
          <h2 className="text-lg font-black text-[#0F172A] mb-1">VyaparBook मोबाइल</h2>
          <p className="text-xs text-slate-500 mb-4 max-w-xs">
            ऐप रीलोड करने या अपने खाते में लॉगिन करने के लिए नीचे दिए गए विकल्प चुनें:
          </p>
          <div className="flex flex-col gap-2.5 w-full max-w-xs">
            <button
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              🔄 रीलोड करें (Reload App)
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("isGuestMode");
                localStorage.removeItem("authToken");
                localStorage.removeItem("token");
                localStorage.removeItem("companyId");
                localStorage.removeItem("selectedCompany");
                sessionStorage.clear();
                window.location.href = "/login";
              }}
              className="w-full py-3 bg-white border border-slate-300 text-slate-700 font-extrabold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              🔑 लॉगिन स्क्रीन पर जाएं (Go to Login)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MobileVyaparAppContent() {
  const navigate = useNavigate();
  const { selectedCompany, companies, selectCompany } = useCompany();

  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user") || localStorage.getItem("auth_user");
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });

  const isGuestMode = localStorage.getItem("isGuestMode") === "true";

  const handleExitGuestMode = () => {
    localStorage.removeItem("isGuestMode");
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("isGuestMode");
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const companyDisplayName = selectedCompany?.name || selectedCompany?.companyName || selectedCompany?.businessName || "VyaparBook";

  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem("mobile_active_tab") || "dashboard";
  });
  const [showCompanySelectModal, setShowCompanySelectModal] = useState(false);
  const [parties, setParties] = useState([]);
  const [items, setItems] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  // Modals
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [ecosystemModalVisible, setEcosystemModalVisible] = useState(false);
  const [selectedBillDetail, setSelectedBillDetail] = useState(null);
  const [selectedPartyDetail, setSelectedPartyDetail] = useState(null);

  // Calculator State
  const [calcInput, setCalcInput] = useState("");

  // ==================== FAST VYAPAR-STYLE BILLING STATE ====================
  const [showQuickBillModal, setShowQuickBillModal] = useState(false);
  const [billCustomer, setBillCustomer] = useState(""); // Optional, defaults to "नकद ग्राहक"
  const [billCustomerPhone, setBillCustomerPhone] = useState("");
  const [billPaymentMode, setBillPaymentMode] = useState("CASH"); // CASH, UDHAR, UPI
  const [billCart, setBillCart] = useState([]);
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [showPartySuggestions, setShowPartySuggestions] = useState(false);
  const [selectedPartyObject, setSelectedPartyObject] = useState(null);
  const [savingBill, setSavingBill] = useState(false);

  // ==================== MANUAL QUICK DAILY SALE STATE ====================
  const [showManualSaleModal, setShowManualSaleModal] = useState(false);
  const [manualSaleAmount, setManualSaleAmount] = useState("");
  const [manualSalePaymentMode, setManualSalePaymentMode] = useState("CASH"); // CASH, UPI, UDHAR
  const [manualSaleCustomer, setManualSaleCustomer] = useState("काउंटर नकद ग्राहक");
  const [manualSalePhone, setManualSalePhone] = useState("");
  const [manualSaleDate, setManualSaleDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [manualSaleNotes, setManualSaleNotes] = useState("");
  const [savingManualSale, setSavingManualSale] = useState(false);
  const [transactionTab, setTransactionTab] = useState("all"); // "all", "sales", "expenses"

  // AI Photo Bill OCR & Multi-Bill Batch State
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState("");
  const [ocrBillType, setOcrBillType] = useState('sale'); // 'sale' (Customer) or 'purchase' (Vendor)
  const [openaiApiKey, setOpenaiApiKey] = useState(() => localStorage.getItem("OPENAI_API_KEY") || "");
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem("GEMINI_API_KEY") || "");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  // Multi-Bill Batch Review Modal State
  const [showScannedReviewModal, setShowScannedReviewModal] = useState(false);
  const [scannedBillsBatch, setScannedBillsBatch] = useState([]); // Array of bills: [{ id, partyName, partyPhone, billType, paymentMode, items: [], imagePreview, totalAmount }]
  const [activeScannedIndex, setActiveScannedIndex] = useState(0);
  const [savingScannedBill, setSavingScannedBill] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Quick Party Modal
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");
  const [newPartyAddress, setNewPartyAddress] = useState("");
  const [newPartyBalance, setNewPartyBalance] = useState("0");
  const [newPartyType, setNewPartyType] = useState("customer");
  const [savingParty, setSavingParty] = useState(false);
  // Sync tab & modal states to sessionStorage
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    sessionStorage.setItem("mobile_active_tab", tab);
  };

  const handleTogglePagarBook = (show) => {
    setShowPagarBookModal(show);
    sessionStorage.setItem("mobile_show_pagarbook", show ? "true" : "false");
  };

  const handleToggleGharKharchEntry = (show) => {
    setShowGharKharchModal(show);
    sessionStorage.setItem("mobile_show_gharkharch_entry", show ? "true" : "false");
  };

  const handleToggleGharKharchLedger = (show) => {
    setShowGharKharchLedgerModal(show);
    sessionStorage.setItem("mobile_show_gharkharch_ledger", show ? "true" : "false");
  };


  // ==================== GHAR KHARCH (HOUSEHOLD & FAMILY EXPENSE) STATE ====================
  const [showGharKharchModal, setShowGharKharchModal] = useState(() => sessionStorage.getItem("mobile_show_gharkharch_entry") === "true");
  const [showGharKharchLedgerModal, setShowGharKharchLedgerModal] = useState(() => sessionStorage.getItem("mobile_show_gharkharch_ledger") === "true");
  const [gharKharchType, setGharKharchType] = useState("drawings"); // 'drawings' (Ghar Kharch) or 'operating' (Dukaan Kharch)
  const [gharKharchFlow, setGharKharchFlow] = useState("given"); // 'given' (पैसा दिया / खर्च) or 'received' (पैसा लिया / उधार/कैपिटल)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("ALL");
  const [selectedStockFilter, setSelectedStockFilter] = useState("ALL"); // 'ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState("General");
  const [newItemBrand, setNewItemBrand] = useState("General");
  const [newItemPurchasePrice, setNewItemPurchasePrice] = useState("");
  const [newItemTaxMode, setNewItemTaxMode] = useState("without_tax"); // 'without_tax' or 'with_tax'
  const [newItemGstRate, setNewItemGstRate] = useState(0); // 0, 5, 12, 18, 28
  const [newItemPriceWithTax, setNewItemPriceWithTax] = useState("");
  const [billCustomerAddress, setBillCustomerAddress] = useState("");
  const [showCustomerAddressInput, setShowCustomerAddressInput] = useState(false);

  // ==================== PAGARBOOK STAFF & SALARY STATE ====================
  const [showPagarBookModal, setShowPagarBookModal] = useState(() => sessionStorage.getItem("mobile_show_pagarbook") === "true");
  const [pagarBookMonth, setPagarBookMonth] = useState(new Date().getMonth() + 1);
  const [pagarBookYear, setPagarBookYear] = useState(new Date().getFullYear());
  const [pagarBookData, setPagarBookData] = useState({ staff: [], totalCompanySalaryEarned: 0, totalCompanyAdvanceGiven: 0, totalCompanyNetPayable: 0 });
  const [loadingPagarBook, setLoadingPagarBook] = useState(false);
  
  // Selected Staff for Full Detail & Salary Slip Modal
  const [selectedStaffForSlip, setSelectedStaffForSlip] = useState(null);
  const [showStaffSlipModal, setShowStaffSlipModal] = useState(false);

  // Quick Add Staff Modal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffSalary, setNewStaffSalary] = useState("");
  const [newStaffMobile, setNewStaffMobile] = useState("");
  const [newStaffPosition, setNewStaffPosition] = useState("Worker / Staff");
  const [newStaffWageType, setNewStaffWageType] = useState("daily"); // 'daily' (दैनिक वेतन / Daily Basis) or 'monthly' (मासिक वेतन)
  const [newStaffPaidLeaves, setNewStaffPaidLeaves] = useState("0"); // e.g. 0, 1, 2 allowed paid leaves
  const [newStaffOtRate, setNewStaffOtRate] = useState("");
  const [newStaffSalesTarget, setNewStaffSalesTarget] = useState("");
  const [newStaffCommission, setNewStaffCommission] = useState("");
  const [savingStaff, setSavingStaff] = useState(false);

  // Quick Action Modals (Advance, Overtime, Commission)
  const [showStaffActionModal, setShowStaffActionModal] = useState(false);
  const [actionStaffTarget, setActionStaffTarget] = useState(null);
  const [actionType, setActionType] = useState("advance"); // 'advance', 'overtime', 'commission'
  const [actionAmount, setActionAmount] = useState("");
  const [actionHours, setActionHours] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [savingStaffAction, setSavingStaffAction] = useState(false);

  // Quick Edit Staff Salary & Wage Modal (दैनिक / मासिक दर बदलें)
  const [showEditStaffSalaryModal, setShowEditStaffSalaryModal] = useState(false);
  const [editingStaffTarget, setEditingStaffTarget] = useState(null);
  const [editingWageType, setEditingWageType] = useState("daily"); // 'daily' or 'monthly'
  const [editingSalaryAmount, setEditingSalaryAmount] = useState("");
  const [editingPaidLeaves, setEditingPaidLeaves] = useState("0");
  const [savingEditSalary, setSavingEditSalary] = useState(false); // 'drawings' (Ghar Kharch) or 'operating' (Dukaan Kharch)
  const [selectedFamilyMember, setSelectedFamilyMember] = useState("Self");
  const [customFamilyMember, setCustomFamilyMember] = useState("");
  const [gharKharchDate, setGharKharchDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [gharKharchTitle, setGharKharchTitle] = useState("");
  const [gharKharchAmount, setGharKharchAmount] = useState("");
  const [gharKharchCategory, setGharKharchCategory] = useState("राशन/किराना");
  const [customGharKharchCategory, setCustomGharKharchCategory] = useState("");
  const [gharKharchPaymentMode, setGharKharchPaymentMode] = useState("cash");
  const [gharKharchNotes, setGharKharchNotes] = useState("");
  const [savingGharKharch, setSavingGharKharch] = useState(false);
  const [editingGharKharchItem, setEditingGharKharchItem] = useState(null); // When editing an existing entry
  const [savedFamilyMembers, setSavedFamilyMembers] = useState(() => {
    try {
      const stored = localStorage.getItem("saved_family_members");
      return stored ? JSON.parse(stored) : ["Self", "Papa", "Mummy", "Bhai", "Sister", "Wife", "Children", "Dada-Dadi"];
    } catch (e) {
      return ["Self", "Papa", "Mummy", "Bhai", "Sister", "Wife", "Children", "Dada-Dadi"];
    }
  });
  const [showAddNewMemberInput, setShowAddNewMemberInput] = useState(false);
  const [newMemberInputValue, setNewMemberInputValue] = useState("");
  
  // Ghar Kharch Ledger & Filter State
  const [gharKharchList, setGharKharchList] = useState(() => {
    try {
      const stored = localStorage.getItem("vb_local_expenses");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [gharKharchMemberFilter, setGharKharchMemberFilter] = useState("all");
  const [loadingGharKharch, setLoadingGharKharch] = useState(false);

  // Quick Item Modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemSalePrice, setNewItemSalePrice] = useState("");
  const [newItemMrp, setNewItemMrp] = useState("");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("Pcs");
  const [savingItem, setSavingItem] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
      setIsPwaInstalled(!!isStandalone);
    }
    fetchLiveDashboardData();
    fetchGharKharchData();

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, [selectedCompany]);

  useEffect(() => {
    if (showGharKharchLedgerModal || showGharKharchModal) {
      fetchGharKharchData();
    }
  }, [showGharKharchLedgerModal, showGharKharchModal]);

  const fetchGharKharchData = async () => {
    try {
      setLoadingGharKharch(true);
      let localList = [];
      try {
        const stored = localStorage.getItem("vb_local_expenses");
        if (stored) localList = JSON.parse(stored);
      } catch (e) {}

      const [res1, res2] = await Promise.allSettled([
        api.get("/expenses?limit=500"),
        api.get("/expenses/ghar-kharch-summary")
      ]);

      let serverList = [];
      if (res1.status === "fulfilled" && res1.value) {
        const v = res1.value;
        const list = v?.expenses || v?.recentExpenses || v?.data?.expenses || v?.data?.recentExpenses || (Array.isArray(v?.data) ? v.data : (Array.isArray(v) ? v : []));
        if (Array.isArray(list) && list.length > 0) {
          serverList = list;
        }
      }
      if (serverList.length === 0 && res2.status === "fulfilled" && res2.value) {
        const v = res2.value;
        const list = v?.recentExpenses || v?.expenses || v?.data?.recentExpenses || v?.data?.expenses || (Array.isArray(v?.data) ? v.data : (Array.isArray(v) ? v : []));
        if (Array.isArray(list) && list.length > 0) {
          serverList = list;
        }
      }
      
      const combinedMap = new Map();
      [...localList, ...(Array.isArray(serverList) ? serverList : [])].forEach(item => {
        if (!item) return;
        const key = item._id || item.id || `${item.title}_${item.amount}_${item.date}`;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, item);
        }
      });
      const combined = Array.from(combinedMap.values());
      setGharKharchList(combined);
      try {
        localStorage.setItem("vb_local_expenses", JSON.stringify(combined));
      } catch (e) {}
    } catch (e) {
      console.error("Failed to fetch Ghar Kharch:", e);
    } finally {
      setLoadingGharKharch(false);
    }
  };

  // ==================== PAGARBOOK HANDLERS ====================
  const fetchPagarBookData = async (m = pagarBookMonth, y = pagarBookYear) => {
    try {
      setLoadingPagarBook(true);
      const res = await api.get(`/staff/pagarbook-summary?month=${m}&year=${y}`);
      if (res.data && res.data.success) {
        setPagarBookData(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch PagarBook data:", e);
    } finally {
      setLoadingPagarBook(false);
    }
  };

  const handleQuickMarkAttendance = async (staffId, status) => {
    try {
      // Optimistic UI update
      setPagarBookData(prev => {
        const updatedStaff = (prev.staff || []).map(s => {
          if (s._id === staffId) {
            return { ...s, todayStatus: status };
          }
          return s;
        });
        return { ...prev, staff: updatedStaff };
      });

      await api.post("/staff/quick-attendance", {
        staffId,
        status,
        date: new Date()
      });

      // Refetch to recalculate perfect monthly stats
      fetchPagarBookData(pagarBookMonth, pagarBookYear);
    } catch (e) {
      console.error("Failed to mark quick attendance:", e);
      alert("हाजिरी दर्ज करने में त्रुटि आई।");
    }
  };

  const handleSaveNewStaff = async (e) => {
    if (e) e.preventDefault();
    if (!newStaffName.trim() || !newStaffSalary) {
      alert(newStaffWageType === 'daily' ? "कृपया स्टाफ का नाम और दैनिक दर (₹/दिन) दर्ज करें!" : "कृपया स्टाफ का नाम और मासिक सैलरी (₹) दर्ज करें!");
      return;
    }
    setSavingStaff(true);
    try {
      const payload = {
        name: newStaffName.trim(),
        salary: Number(newStaffSalary),
        wageAmount: Number(newStaffSalary),
        wageType: newStaffWageType,
        paidLeavesAllowed: Number(newStaffPaidLeaves) || 0,
        mobileNumber: newStaffMobile.trim(),
        position: newStaffPosition.trim() || "Worker",
        overtimeRatePerHour: Number(newStaffOtRate) || 0,
        salesTarget: Number(newStaffSalesTarget) || 0,
        commissionPercent: Number(newStaffCommission) || 0
      };

      await api.post("/staff", payload);
      alert(`✅ स्टाफ '${newStaffName}' (${newStaffWageType === 'daily' ? 'दैनिक ₹' + newStaffSalary + '/दिन' : 'मासिक ₹' + newStaffSalary + '/माह'}) सफलतापूर्वक जुड़ गया!`);
      
      setNewStaffName("");
      setNewStaffSalary("");
      setNewStaffMobile("");
      setNewStaffPosition("Worker / Staff");
      setNewStaffWageType("daily");
      setNewStaffPaidLeaves("0");
      setNewStaffOtRate("");
      setNewStaffSalesTarget("");
      setNewStaffCommission("");
      setShowAddStaffModal(false);
      fetchPagarBookData(pagarBookMonth, pagarBookYear);
    } catch (err) {
      console.error("Failed to add staff:", err);
      alert(err.response?.data?.error || "स्टाफ सेव करने में त्रुटि आई।");
    } finally {
      setSavingStaff(false);
    }
  };

  const handleUpdateStaffSalary = async (e) => {
    if (e) e.preventDefault();
    if (!editingStaffTarget || !editingSalaryAmount || Number(editingSalaryAmount) <= 0) {
      alert("कृपया सही वेतन राशि (₹) दर्ज करें!");
      return;
    }
    setSavingEditSalary(true);
    try {
      const payload = {
        salary: Number(editingSalaryAmount),
        wageAmount: Number(editingSalaryAmount),
        wageType: editingWageType,
        paidLeavesAllowed: Number(editingPaidLeaves) || 0
      };

      await api.put(`/staff/${editingStaffTarget._id}`, payload);
      alert(`✅ ${editingStaffTarget.name} का वेतन ${editingWageType === 'daily' ? 'दैनिक ₹' + editingSalaryAmount + '/दिन' : 'मासिक ₹' + editingSalaryAmount + '/माह'} पर सेट हो गया!`);
      
      setShowEditStaffSalaryModal(false);
      fetchPagarBookData(pagarBookMonth, pagarBookYear);
    } catch (err) {
      console.error("Failed to update staff salary:", err);
      alert("वेतन अपडेट करने में त्रुटि आई।");
    } finally {
      setSavingEditSalary(false);
    }
  };

  const handleSaveStaffAction = async (e) => {
    if (e) e.preventDefault();
    if (!actionStaffTarget) return;

    setSavingStaffAction(true);
    try {
      if (actionType === "advance") {
        if (!actionAmount || Number(actionAmount) <= 0) {
          alert("कृपया सही एडवांस राशि (₹) दर्ज करें!");
          return;
        }
        await api.post("/staff/advance", {
          staffId: actionStaffTarget._id,
          amount: Number(actionAmount),
          notes: actionNotes.trim() || "Advance Payment",
          date: new Date()
        });
        alert(`💵 ₹${actionAmount} एडवांस दर्ज हो गया!`);
      } else if (actionType === "overtime") {
        await api.post("/staff/overtime", {
          staffId: actionStaffTarget._id,
          hours: Number(actionHours) || 0,
          amount: Number(actionAmount) || 0,
          notes: actionNotes.trim() || `Overtime ${actionHours} hrs`,
          date: new Date()
        });
        alert(`⏱️ ओवरटाइम दर्ज हो गया!`);
      } else if (actionType === "commission") {
        if (!actionAmount || Number(actionAmount) <= 0) {
          alert("कृपया सही कमीशन राशि (₹) दर्ज करें!");
          return;
        }
        await api.post("/staff/commission", {
          staffId: actionStaffTarget._id,
          amount: Number(actionAmount),
          notes: actionNotes.trim() || "Sales Commission",
          date: new Date()
        });
        alert(`🎯 कमीशन दर्ज हो गया!`);
      }

      setShowStaffActionModal(false);
      setActionAmount("");
      setActionHours("");
      setActionNotes("");
      fetchPagarBookData(pagarBookMonth, pagarBookYear);
    } catch (err) {
      console.error("Failed staff action:", err);
      alert("एंट्री दर्ज करने में त्रुटि आई।");
    } finally {
      setSavingStaffAction(false);
    }
  };

      const handleShareSalarySlipWhatsApp = (staff) => {
    if (!staff) return;
    const monthNames = ["", "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];
    const mName = monthNames[pagarBookMonth] || ("Month " + pagarBookMonth);

    const wageLabel = staff.isDaily 
      ? ("📆 दैनिक दर: ₹" + staff.perDaySalary + "/दिन")
      : ("📅 मासिक मूल वेतन: ₹" + (staff.baseSalary || 0).toLocaleString('en-IN') + " (@ ₹" + staff.perDaySalary + "/दिन)");

    const lines = [
      "*📄 वेतन पर्ची / SALARY SLIP*",
      "🏢 *" + companyDisplayName + "*",
      "--------------------------------",
      "👤 *स्टाफ नाम:* " + staff.name,
      "📅 *माह:* " + mName + " " + pagarBookYear + " (कुल " + staff.daysInMonth + " दिन)",
      "💰 *वेतन प्रकार:* " + wageLabel,
      "--------------------------------",
      "🟢 *उपस्थित दिन (P):* " + staff.presentCount + " दिन",
      "🟡 *हाफ डे (HT):* " + staff.halfDayCount + " दिन",
      "🔴 *ली गई छुट्टियां (A):* " + staff.absentCount + " दिन" + (staff.paidLeavesBenefited > 0 ? (" (🎁 " + staff.paidLeavesBenefited + " दिन बिना वेतन कटे सवेतन अवकाश)") : ""),
      "⚡ *कुल देय दिन (Payable Days):* " + staff.payableDays + " दिन",
      "--------------------------------",
      "💵 *बनी हुई सैलरी:* ₹" + (staff.earnedSalary || 0).toLocaleString('en-IN'),
      (staff.otEarnings > 0 ? ("⏱️ *ओवरटाइम:* +₹" + staff.otEarnings.toLocaleString('en-IN')) : null),
      (staff.commEarnings > 0 ? ("🎯 *कमीशन:* +₹" + staff.commEarnings.toLocaleString('en-IN')) : null),
      "💸 *लिया गया एडवांस:* -₹" + (staff.totalAdvance || 0).toLocaleString('en-IN'),
      "--------------------------------",
      "⚖️ *शुद्ध देय बाकी वेतन (Net Payable):* *₹" + (staff.netPayable || 0).toLocaleString('en-IN') + "*",
      "--------------------------------",
      "_धन्यवाद!_"
    ].filter(Boolean).join(String.fromCharCode(10));

    const cleanPhone = (staff.mobileNumber || '').replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : '';
    const whatsappUrl = phoneParam 
      ? ("https://api.whatsapp.com/send?phone=91" + phoneParam + "&text=" + encodeURIComponent(lines))
      : ("https://api.whatsapp.com/send?text=" + encodeURIComponent(lines));
    
    window.open(whatsappUrl, '_blank');
  };

  const handleAddNewFamilyMember = (name) => {
    const cleanName = (name || newMemberInputValue).trim();
    if (!cleanName) return;
    if (!savedFamilyMembers.includes(cleanName)) {
      const updated = [...savedFamilyMembers, cleanName];
      setSavedFamilyMembers(updated);
      try { localStorage.setItem("saved_family_members", JSON.stringify(updated)); } catch (e) {}
    }
    setSelectedFamilyMember(cleanName);
    setNewMemberInputValue("");
    setShowAddNewMemberInput(false);
  };

  const handleOpenEditGharKharch = (item) => {
    if (!item) return;
    setEditingGharKharchItem(item);
    setSelectedFamilyMember(item.familyMember || "Self");
    setGharKharchDate(item.date ? new Date(item.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    setGharKharchAmount(String(item.amount || ""));
    setGharKharchCategory(item.category || "राशन/किराना");
    setCustomGharKharchCategory("");
    setGharKharchTitle(item.title || "");
    setGharKharchNotes(item.notes || item.description || "");
    setGharKharchPaymentMode(item.paymentMethod || "cash");
    setGharKharchType(item.expenseType || "drawings");
    setGharKharchFlow(item.transactionFlow || "given");
    handleToggleGharKharchEntry(true);
  };

  const handleSaveGharKharch = async (e) => {
    if (e) e.preventDefault();
    if (!gharKharchAmount || Number(gharKharchAmount) <= 0) {
      alert("कृपया सही राशि (₹) दर्ज करें!");
      return;
    }
    const finalMember = (selectedFamilyMember === "अन्य (Custom)" || selectedFamilyMember === "+ नया सदस्य")
      ? (customFamilyMember.trim() || "अन्य सदस्य")
      : selectedFamilyMember;

    const finalCategory = (gharKharchCategory === "अन्य (Custom Category)" || gharKharchCategory === "+ नया खर्च")
      ? (customGharKharchCategory.trim() || "विविध घरेलू खर्च")
      : gharKharchCategory;

    const defaultTitle = gharKharchType === "drawings" 
      ? `${finalCategory} - ${finalMember}` 
      : `${finalCategory} (दुकान खर्च)`;
    const finalTitle = gharKharchTitle.trim() || defaultTitle;

    setSavingGharKharch(true);
    try {
      const payload = {
        title: finalTitle,
        amount: Number(gharKharchAmount),
        category: finalCategory,
        expenseType: gharKharchType,
        transactionFlow: gharKharchFlow,
        familyMember: gharKharchType === 'drawings' ? finalMember : '',
        paymentMethod: gharKharchPaymentMode,
        description: gharKharchNotes.trim(),
        notes: gharKharchNotes.trim(),
        date: gharKharchDate ? new Date(gharKharchDate) : new Date()
      };

      const newExpenseRecord = {
        _id: editingGharKharchItem ? (editingGharKharchItem._id || editingGharKharchItem.id) : `exp_${Date.now()}`,
        id: editingGharKharchItem ? (editingGharKharchItem._id || editingGharKharchItem.id) : `exp_${Date.now()}`,
        ...payload
      };

      // Instantly persist in localStorage so it NEVER disappears
      try {
        const stored = localStorage.getItem("vb_local_expenses");
        let list = stored ? JSON.parse(stored) : [];
        if (editingGharKharchItem) {
          list = list.map(item => ((item._id || item.id) === newExpenseRecord._id ? newExpenseRecord : item));
        } else {
          list = [newExpenseRecord, ...list];
        }
        localStorage.setItem("vb_local_expenses", JSON.stringify(list));
        setGharKharchList(prev => [newExpenseRecord, ...prev.filter(p => (p._id || p.id) !== newExpenseRecord._id)]);
      } catch (err) {
        console.warn("Local expense store err:", err);
      }

      if (editingGharKharchItem) {
        const expId = editingGharKharchItem._id || editingGharKharchItem.id;
        await api.put(`/expenses/${expId}`, payload).catch(() => {});
        alert(`✅ ${finalMember} का खर्च (₹${gharKharchAmount}) सफलता से अपडेट हो गया!`);
      } else {
        await api.post("/expenses", payload).catch(() => {});
        const successMsg = gharKharchType === 'drawings'
          ? `🏡 ${finalMember} के लिए ${finalCategory} (₹${gharKharchAmount}) सफलतापूर्वक दर्ज हो गया!`
          : `🏢 दुकान खर्च ₹${gharKharchAmount} दर्ज हो गया!`;
        alert(successMsg);
      }
      
      // Auto-save member to list if custom
      if (finalMember && !savedFamilyMembers.includes(finalMember)) {
        const updated = [...savedFamilyMembers, finalMember];
        setSavedFamilyMembers(updated);
        try { localStorage.setItem("saved_family_members", JSON.stringify(updated)); } catch (e) {}
      }

      setEditingGharKharchItem(null);
      setGharKharchTitle("");
      setGharKharchAmount("");
      setGharKharchNotes("");
      setCustomFamilyMember("");
      setCustomGharKharchCategory("");
      setGharKharchCategory("राशन/किराना");
      handleToggleGharKharchEntry(false);
      fetchGharKharchData();
    } catch (err) {
      console.error(err);
      alert("एंट्री सेव/अपडेट करने में त्रुटि आई।");
    } finally {
      setSavingGharKharch(false);
    }
  };

  const handleShareGharKharchWhatsApp = (memberFilter = "all") => {
    const allItems = gharKharchList;
    const filtered = memberFilter === "all"
      ? allItems
      : allItems.filter(it => (it.familyMember || 'Unassigned').toLowerCase() === memberFilter.toLowerCase());
    
    const total = filtered.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const titleHeader = memberFilter === "all"
      ? "*🏡 सम्पूर्ण फैमिली घर खर्च विवरण (All Members)*"
      : `*🏡 ${memberFilter} का व्यक्तिगत घर खर्च विवरण*`;

    const lines = [
      titleHeader,
      `🏢 *${companyDisplayName}*`,
      `📅 *तारीख:* ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      "--------------------------------",
      ...filtered.slice(0, 15).map(it => {
        const dStr = it.date ? new Date(it.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'आज';
        return `• ${dStr} | ${it.familyMember ? `[${it.familyMember}] ` : ''}${it.category || it.title || 'खर्च'} : ₹${Number(it.amount || 0).toLocaleString('en-IN')}`;
      }),
      "--------------------------------",
      `💰 *कुल योग (Total Spent): ₹${total.toLocaleString('en-IN')}* (${filtered.length} एंट्रियां)`,
      "--------------------------------",
      "_VyaparBook सुरक्षित फैमिली लेजर_"
    ].join(String.fromCharCode(10));

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(lines)}`, '_blank');
  };

  const handleDeleteGharKharch = async (id) => {
    if (!window.confirm("क्या आप इस खर्च को हटाना चाहते हैं?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      setGharKharchList(prev => prev.filter(k => (k._id || k.id) !== id));
      alert("खर्च हटा दिया गया!");
    } catch (err) {
      console.error(err);
      alert("डिलीट करने में त्रुटि आई।");
    }
  };

  const fetchLiveDashboardData = async () => {
    setLoading(true);
    try {
      const [billsRes, partiesRes, invRes, catRes, brandRes] = await Promise.allSettled([
        api.get("/billing"),
        api.get("/parties"),
        api.get("/api/inventory").catch(() => api.get("/inventory")),
        api.get("/api/category").catch(() => ({ data: [] })),
        api.get("/api/brand").catch(() => ({ data: [] }))
      ]);

      if (billsRes.status === "fulfilled") {
        const rawBills = billsRes.value.data?.bills || billsRes.value.data?.data || billsRes.value.data || [];
        const normBills = (Array.isArray(rawBills) ? rawBills : []).map(b => ({
          _id: b._id,
          id: b.billNumber || b.invoiceNumber || (b._id ? `INV-${b._id.slice(-4)}` : "001"),
          customerName: b.partyName || b.customerName || "Walk-in Customer",
          phone: b.customerPhone || b.phone || "",
          amount: Number(b.finalAmount || b.total || b.grandTotal || 0),
          type: b.paymentMode || b.paymentType || "CASH",
          paymentStatus: b.paymentStatus || (b.paymentMode === "UDHAR" ? "unpaid" : "paid"),
          date: b.date ? new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Today",
          rawDate: b.date || b.createdAt || new Date(),
          items: b.items || []
        }));
        setBills(normBills);
      }

      if (partiesRes.status === "fulfilled") {
        const rawParties = partiesRes.value.data?.parties || partiesRes.value.data?.data || partiesRes.value.data || [];
        const normParties = (Array.isArray(rawParties) ? rawParties : []).map(p => ({
          id: p._id || p.id,
          name: p.name || p.partyName,
          phone: p.mobileNumber || p.phone || "",
          balance: Number(p.balance || p.openingBalance || 0),
          type: p.partyType || p.type || "customer",
          address: p.address || ""
        }));
        setParties(normParties);
      }

      if (invRes.status === "fulfilled") {
        const rawInv = invRes.value.data?.products || invRes.value.data?.inventory || invRes.value.data?.items || invRes.value.data || (Array.isArray(invRes.value) ? invRes.value : []);
        const normInv = (Array.isArray(rawInv) ? rawInv : []).map(it => ({
          ...it,
          id: it._id || it.id,
          _id: it._id || it.id,
          name: it.name || it.productName || "Unnamed Item",
          category: (it.category || "General").trim(),
          subCategory: (it.subCategory || "").trim(),
          brand: (it.brand || "General").trim(),
          salePrice: Number(it.sellingPrice ?? it.salePrice ?? it.price ?? 0),
          sellingPrice: Number(it.sellingPrice ?? it.salePrice ?? it.price ?? 0),
          costPrice: Number(it.costPrice ?? 0),
          mrp: Number(it.mrp ?? it.sellingPrice ?? 0),
          stock: Number(it.currentStock ?? it.stock ?? 0),
          currentStock: Number(it.currentStock ?? it.stock ?? 0),
          unit: it.unit || "Pcs",
          barcode: it.barcode || "",
          sku: it.sku || "",
          hsnCode: it.hsnCode || ""
        }));
        setItems(normInv);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Metrics
  const toCollect = parties.filter(p => Number(p.balance || 0) > 0).reduce((sum, p) => sum + Number(p.balance || 0), 0);
  const toPay = Math.abs(parties.filter(p => Number(p.balance || 0) < 0).reduce((sum, p) => sum + Number(p.balance || 0), 0));
  const stockValue = items.reduce((sum, it) => sum + (it.stock * it.salePrice), 0);
  const recentSales = bills.reduce((sum, b) => sum + b.amount, 0);

  // Filter bills created today
  const todayBills = bills.filter(b => {
    if (!b.rawDate) return true;
    const d = new Date(b.rawDate);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const todaySales = todayBills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const todayCash = todayBills.filter(b => b.type === "CASH").reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const todayUpi = todayBills.filter(b => b.type === "UPI" || b.type === "ONLINE").reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const todayCredit = todayBills.filter(b => b.type === "UDHAR" || b.type === "CREDIT").reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const handleShareWhatsAppBill = (bill) => {
    if (!bill) return;
    const itemsList = (bill.items || []).map(i => `• ${i.name || 'Item'} (x${i.qty || i.quantity || 1}) - ₹${(i.price || i.salePrice || 0) * (i.qty || i.quantity || 1)}`).join("\n");
    const text = encodeURIComponent(`*🧾 इनवॉइस बिल नं: ${bill.id || '001'}*\n*दुकान:* ${companyDisplayName}\n*ग्राहक:* ${bill.customerName || 'नकद ग्राहक'}\n*तारीख:* ${bill.date || 'आज'}\n\n*सामान विवरण:*\n${itemsList || 'बिल उत्पाद'}\n\n*कुल राशि:* ₹${bill.amount.toLocaleString('en-IN')}\n*भुगतान प्रकार:* ${bill.type || 'CASH'}\n\n*धन्यवाद! फिर पधारें।*`);
    window.open(`https://wa.me/${bill.phone || ''}?text=${text}`, "_blank");
  };

  // ==================== FAST BILLING CART ACTIONS ====================
  const handleAddToCart = (product) => {
    if (!product) return;
    const existing = billCart.find(i => i.id === product.id);
    if (existing) {
      setBillCart(billCart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setBillCart([...billCart, { id: product.id, name: product.name, salePrice: product.salePrice, qty: 1 }]);
    }
    setItemSearchTerm("");
    setShowItemSuggestions(false);
  };

  const handleUpdateCartQty = (productId, delta) => {
    setBillCart(billCart.map(i => {
      if (i.id === productId) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const handleUpdateCartPrice = (productId, newPrice) => {
    setBillCart(billCart.map(i => {
      if (i.id === productId) {
        return { ...i, salePrice: parseFloat(newPrice) || 0 };
      }
      return i;
    }));
  };

  const handleRemoveFromCart = (productId) => {
    setBillCart(billCart.filter(i => i.id !== productId));
  };

  const totalBillAmount = billCart.reduce((sum, item) => sum + (item.salePrice * item.qty), 0);

  const handleSaveAndGenerateBill = async () => {
    if (billCart.length === 0) {
      alert("कृपया बिल में कम से कम 1 सामान जोड़ें!");
      return;
    }

    setSavingBill(true);
    const finalCustomer = billCustomer.trim() || "नकद ग्राहक (Walk-in)";
    const finalPhone = billCustomerPhone.trim();
    const finalAddress = billCustomerAddress.trim() || "Local";

    const billPayload = {
      partyName: finalCustomer,
      customerName: finalCustomer,
      customerPhone: finalPhone,
      customerMobile: finalPhone,
      customerAddress: finalAddress,
      paymentMode: billPaymentMode,
      paymentStatus: billPaymentMode === "UDHAR" ? "unpaid" : "paid",
      items: billCart.map(i => ({ productId: i.id, name: i.name, quantity: i.qty, price: i.salePrice, total: i.salePrice * i.qty })),
      finalAmount: totalBillAmount,
      date: new Date()
    };

    // Auto-create party locally if it doesn't exist
    if (finalCustomer && finalCustomer !== "नकद ग्राहक (Walk-in)" && !parties.some(p => p.name.toLowerCase() === finalCustomer.toLowerCase())) {
      const newP = {
        id: `party-${Date.now()}`,
        name: finalCustomer,
        phone: finalPhone,
        address: finalAddress,
        balance: billPaymentMode === "UDHAR" ? totalBillAmount : 0,
        type: "customer"
      };
      setParties(prev => [newP, ...prev]);
    }

    try {
      const res = await api.post("/billing", billPayload).catch(() => null);
      const createdBill = {
        _id: res?.data?.bill?._id || Date.now().toString(),
        id: res?.data?.bill?.billNumber || `INV-${Date.now().toString().slice(-4)}`,
        customerName: finalCustomer,
        phone: billCustomerPhone.trim(),
        date: "Today",
        amount: totalBillAmount,
        type: billPaymentMode,
        paymentStatus: billPaymentMode === "UDHAR" ? "unpaid" : "paid",
        items: billCart
      };
      setBills([createdBill, ...bills]);
      setBillCart([]);
      setBillCustomer("");
      setBillCustomerPhone("");
      setShowQuickBillModal(false);
      setSelectedBillDetail(createdBill);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingBill(false);
    }
  };

  // ==================== FAST VYAPAR-STYLE 1-CLICK ITEM CREATOR ====================
  const handleSaveNewItem = async (e) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) {
      alert("कृपया सामान का नाम (Item Name) दर्ज करें!");
      return;
    }
    setSavingItem(true);
    try {
      const saleP = parseFloat(newItemSalePrice) || 0;
      const stockQ = parseFloat(newItemStock) || 0;
      const autoBarcode = `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const autoSku = `SKU-${Date.now().toString().slice(-6)}`;

      const gst = Number(newItemGstRate) || 0;
      let finalSellingPrice = saleP;
      let finalCostPrice = parseFloat(newItemPurchasePrice) || +(saleP * 0.8).toFixed(2);

      if (newItemTaxMode === "with_tax" && gst > 0) {
        finalSellingPrice = parseFloat(newItemPriceWithTax) || saleP;
      }

      const payload = {
        name: newItemName.trim(),
        sellingPrice: finalSellingPrice,
        costPrice: finalCostPrice,
        mrp: parseFloat(newItemMrp) || finalSellingPrice,
        gstRate: gst,
        gstType: gst > 0 ? "CGST" : "CGST",
        isTaxInclusive: newItemTaxMode === "with_tax",
        currentStock: stockQ,
        stock: stockQ,
        unit: newItemUnit || "Pcs",
        category: newItemCategory || "General",
        brand: newItemBrand || "General",
        barcode: autoBarcode,
        sku: autoSku,
        hsnCode: ""
      };

      const res = await api.post("/api/inventory", payload).catch(() => api.post("/inventory", payload));
      const createdItem = {
        ...payload,
        id: res?.data?.product?._id || res?.data?._id || `item-${Date.now()}`,
        _id: res?.data?.product?._id || res?.data?._id || `item-${Date.now()}`,
        salePrice: saleP
      };

      setItems(prev => [createdItem, ...prev]);
      
      // If billing modal is open, automatically add the newly created item to the cart!
      if (showQuickBillModal) {
        setBillCart(prev => [...prev, { id: createdItem.id, name: createdItem.name, salePrice: saleP, qty: 1 }]);
      }

      setShowAddItemModal(false);
      setNewItemName("");
      setNewItemSalePrice("");
      setNewItemMrp("");
      setNewItemStock("");
      setNewItemPurchasePrice("");
      setNewItemCategory("General");
      setNewItemBrand("General");
      setNewItemUnit("Pcs");

      alert(`✅ सामान '${createdItem.name}' (₹${saleP}) तुरंत बन गया और कैटलॉग में जुड़ गया!`);
      fetchLiveDashboardData();
    } catch (err) {
      console.error("Save item error:", err);
      alert("सामान सेव करने में त्रुटि आई।");
    } finally {
      setSavingItem(false);
    }
  };

  const handleSaveNewParty = async (e) => {
    if (e) e.preventDefault();
    if (!newPartyName.trim()) {
      alert("कृपया पार्टी का नाम दर्ज करें!");
      return;
    }
    setSavingParty(true);
    try {
      const payload = {
        name: newPartyName.trim(),
        mobileNumber: newPartyPhone.trim() || `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        openingBalance: Number(newPartyBalance) || 0,
        currentBalance: Number(newPartyBalance) || 0,
        partyType: newPartyType || "customer",
        address: newPartyAddress.trim() || "Local"
      };

      const res = await api.post("/parties", payload);
      const createdParty = {
        id: res?.data?.party?._id || res?.data?._id || `party-${Date.now()}`,
        name: payload.name,
        phone: payload.mobileNumber,
        balance: payload.currentBalance,
        type: payload.partyType
      };

      setParties(prev => [createdParty, ...prev]);
      setShowAddPartyModal(false);
      setNewPartyName("");
      setNewPartyPhone("");
      setNewPartyBalance("0");
      setNewPartyAddress("");

      alert(`✅ पार्टी '${createdParty.name}' सफलतापूर्वक जुड़ गई!`);
      fetchLiveDashboardData();
    } catch (err) {
      console.error("Save party error:", err);
      alert("पार्टी सेव करने में त्रुटि आई।");
    } finally {
      setSavingParty(false);
    }
  };

  // ==================== FAST MANUAL DAILY SALE HANDLER ====================
  const handleSaveManualSale = async (e) => {
    if (e) e.preventDefault();
    if (!manualSaleAmount || Number(manualSaleAmount) <= 0) {
      alert("कृपया सही बिक्री राशि (₹) दर्ज करें!");
      return;
    }
    setSavingManualSale(true);
    try {
      const saleAmt = Number(manualSaleAmount);
      const partyTitle = manualSaleCustomer.trim() || (manualSalePaymentMode === 'CASH' ? "काउंटर नकद बिक्री" : manualSalePaymentMode === 'UPI' ? "UPI ऑनलाइन बिक्री" : "उधारी ग्राहक");
      const payload = {
        partyName: partyTitle,
        customerPhone: manualSalePhone.trim(),
        paymentMode: manualSalePaymentMode,
        paymentStatus: manualSalePaymentMode === "UDHAR" ? "unpaid" : "paid",
        finalAmount: saleAmt,
        grandTotal: saleAmt,
        total: saleAmt,
        date: manualSaleDate ? new Date(manualSaleDate) : new Date(),
        items: [{
          name: manualSaleNotes.trim() || `दैनिक बिक्री (${manualSalePaymentMode})`,
          quantity: 1,
          price: saleAmt,
          total: saleAmt
        }],
        notes: manualSaleNotes.trim()
      };

      const res = await api.post("/billing", payload).catch(() => null);
      
      const createdBill = {
        _id: res?.data?.bill?._id || Date.now().toString(),
        id: res?.data?.bill?.billNumber || `SALE-${Date.now().toString().slice(-4)}`,
        customerName: payload.partyName,
        phone: payload.customerPhone,
        amount: saleAmt,
        type: manualSalePaymentMode,
        paymentStatus: payload.paymentStatus,
        date: "Today",
        rawDate: new Date(),
        items: payload.items
      };

      setBills(prev => [createdBill, ...prev]);
      setShowManualSaleModal(false);
      setManualSaleAmount("");
      setManualSaleNotes("");
      setManualSalePhone("");
      setManualSaleCustomer("काउंटर नकद ग्राहक");
      setManualSalePaymentMode("CASH");

      alert(`🎉 ₹${saleAmt.toLocaleString('en-IN')} की ${manualSalePaymentMode === 'CASH' ? 'नकद' : manualSalePaymentMode === 'UPI' ? 'UPI' : 'उधारी'} बिक्री सफलतापूर्वक दर्ज हो गई!`);
      fetchLiveDashboardData();
    } catch (err) {
      console.error("Manual sale error:", err);
      alert("बिक्री दर्ज करने में त्रुटि आई।");
    } finally {
      setSavingManualSale(false);
    }
  };

  // ==================== AI VISION MULTI-BILL PHOTO SCANNER & REVIEW ====================
  const handleProcessBillImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setOcrLoading(true);
    setOcrProgress(15);
    setOcrStatusText(`📸 ${files.length} फोटो लोड हो रही हैं...`);

    try {
      // Read all files as base64
      const base64List = await Promise.all(
        files.map(file => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }))
      );

      setOcrProgress(35);
      setOcrStatusText(`🤖 AI Vision ${files.length} बिलों को पढ़ रहा है...`);

      // Call Backend Multi-Image AI Endpoint
      const res = await api.post("/billing/parse-image", {
        images: base64List,
        openaiApiKey: openaiApiKey.trim() || undefined,
        geminiApiKey: geminiApiKey.trim() || undefined
      }).catch(err => {
        console.warn("Backend batch OCR error:", err);
        return null;
      });

      setOcrProgress(75);
      setOcrStatusText("🔍 1600+ इन्वेंटरी से सटीक मिलान किया जा रहा है...");

      let rawResults = [];
      if (res?.data?.batch && Array.isArray(res.data.bills)) {
        rawResults = res.data.bills;
      } else if (res?.data?.success && res.data.parsedItems) {
        rawResults = [res.data];
      } else {
        // Fallback for each file
        rawResults = base64List.map((b64, idx) => ({
          success: true,
          partyName: ocrBillType === 'sale' ? `कच्ची पर्ची ग्राहक ${idx + 1}` : "सप्लायर",
          billType: ocrBillType,
          parsedItems: [{ name: "सामान (Item)", quantity: 1, unit: "Pcs", price: 100, total: 100 }],
          totalAmount: 100
        }));
      }

      // Process each bill with 1600+ Inventory Catalog Fuzzy Matching
      const processedBatch = rawResults.map((rawBill, billIdx) => {
        const extractedItems = rawBill.parsedItems || [];
        const processedItems = extractedItems.map((it, itemIdx) => {
          const rawName = (it.name || '').trim();
          const rawPrice = Number(it.price || it.rate) || 0;
          const rawQty = Number(it.quantity || it.qty) || 1;

          // Fuzzy Match with 1600+ Catalog
          const matchedItem = items.find(catItem => {
            const catName = (catItem.name || '').toLowerCase();
            const pName = rawName.toLowerCase();
            if (catName === pName) return true;
            const tokens = pName.split(/\s+/).filter(t => t.length >= 3);
            return tokens.some(t => catName.includes(t));
          });

          const finalPrice = rawPrice > 0 ? rawPrice : (matchedItem ? matchedItem.salePrice : 100);
          const finalTotal = +(rawQty * finalPrice).toFixed(2);

          return {
            id: matchedItem?.id || `scanned-${Date.now()}-${billIdx}-${itemIdx}`,
            name: rawName || (matchedItem?.name || `सामान ${itemIdx + 1}`),
            qty: rawQty,
            unit: it.unit || (matchedItem?.unit || "Pcs"),
            price: finalPrice,
            total: finalTotal,
            matchedCatalogItem: matchedItem || null
          };
        });

        const detectedParty = rawBill.partyName?.trim() || (ocrBillType === 'sale' ? (files.length > 1 ? `पर्ची ग्राहक ${billIdx + 1}` : "कच्ची पर्ची ग्राहक") : "सप्लायर");
        const calculatedTotal = processedItems.reduce((sum, it) => sum + it.total, 0);

        return {
          id: `batch-bill-${Date.now()}-${billIdx}`,
          partyName: detectedParty,
          partyPhone: "",
          billType: rawBill.billType || ocrBillType,
          paymentMode: "CASH",
          items: processedItems,
          imagePreview: base64List[billIdx] || null,
          totalAmount: calculatedTotal
        };
      });

      setScannedBillsBatch(processedBatch);
      setActiveScannedIndex(0);
      setOcrProgress(100);
      setShowOcrModal(false);
      setShowScannedReviewModal(true);

    } catch (err) {
      console.error("Batch OCR error:", err);
      alert("फोटो पढ़ने में दिक्कत आई। कृपया साफ और सीधी फोटो अपलोड करें।");
    } finally {
      setOcrLoading(false);
      setOcrProgress(0);
      setOcrStatusText("");
    }
  };

  // Helper to update current active bill in batch
  const handleUpdateActiveBillField = (field, value) => {
    const updated = [...scannedBillsBatch];
    if (!updated[activeScannedIndex]) return;
    updated[activeScannedIndex] = {
      ...updated[activeScannedIndex],
      [field]: value
    };
    setScannedBillsBatch(updated);
  };

  const handleUpdateActiveBillItem = (itemIdx, field, value) => {
    const updated = [...scannedBillsBatch];
    const currentBill = { ...updated[activeScannedIndex] };
    const itemsList = [...currentBill.items];
    const targetItem = { ...itemsList[itemIdx] };

    if (field === 'qty') {
      const q = Math.max(1, parseFloat(value) || 1);
      targetItem.qty = q;
      targetItem.total = +(q * targetItem.price).toFixed(2);
    } else if (field === 'price') {
      const p = Math.max(0, parseFloat(value) || 0);
      targetItem.price = p;
      targetItem.total = +(targetItem.qty * p).toFixed(2);
    } else if (field === 'name') {
      targetItem.name = value;
    }

    itemsList[itemIdx] = targetItem;
    currentBill.items = itemsList;
    currentBill.totalAmount = itemsList.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
    updated[activeScannedIndex] = currentBill;
    setScannedBillsBatch(updated);
  };

  const handleRemoveActiveBillItem = (itemIdx) => {
    const updated = [...scannedBillsBatch];
    const currentBill = { ...updated[activeScannedIndex] };
    const itemsList = currentBill.items.filter((_, idx) => idx !== itemIdx);
    currentBill.items = itemsList;
    currentBill.totalAmount = itemsList.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
    updated[activeScannedIndex] = currentBill;
    setScannedBillsBatch(updated);
  };

  const handleAddActiveBillItem = () => {
    const updated = [...scannedBillsBatch];
    const currentBill = { ...updated[activeScannedIndex] };
    const newItem = {
      id: `custom-row-${Date.now()}`,
      name: "",
      qty: 1,
      unit: "Pcs",
      price: 0,
      total: 0,
      matchedCatalogItem: null
    };
    currentBill.items = [...currentBill.items, newItem];
    updated[activeScannedIndex] = currentBill;
    setScannedBillsBatch(updated);
  };

  // Merge All Bills of Same Party into 1 Single Master Bill
  const handleMergeAllBatchBills = () => {
    if (scannedBillsBatch.length <= 1) return;
    const firstBill = scannedBillsBatch[0];
    const allMergedItems = [];

    scannedBillsBatch.forEach(b => {
      b.items.forEach(it => {
        allMergedItems.push({ ...it, id: `merged-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });
      });
    });

    const masterBill = {
      id: `master-${Date.now()}`,
      partyName: firstBill.partyName || "संयुक्त ग्राहक (Merged Bill)",
      partyPhone: firstBill.partyPhone || "",
      billType: firstBill.billType || "sale",
      paymentMode: firstBill.paymentMode || "CASH",
      items: allMergedItems,
      imagePreview: firstBill.imagePreview,
      totalAmount: allMergedItems.reduce((sum, it) => sum + it.total, 0)
    };

    setScannedBillsBatch([masterBill]);
    setActiveScannedIndex(0);
    alert(`✨ सभी ${scannedBillsBatch.length} पर्चियों को 1 मास्टर बिल में जोड़ दिया गया है (${allMergedItems.length} कुल सामान)!`);
  };

  // Save ALL Scanned Bills to Backend in 1 Click
  const handleSaveAllScannedBills = async () => {
    if (scannedBillsBatch.length === 0) return;
    setSavingScannedBill(true);

    try {
      const createdList = [];
      for (const b of scannedBillsBatch) {
        if (b.items.length === 0) continue;
        const payload = {
          partyName: b.partyName.trim() || "कच्ची पर्ची ग्राहक",
          customerPhone: b.partyPhone.trim(),
          paymentMode: b.paymentMode,
          items: b.items.map(i => ({
            productId: i.matchedCatalogItem?.id || i.id,
            name: i.name,
            quantity: i.qty,
            price: i.price,
            total: i.total
          })),
          finalAmount: b.totalAmount,
          billImageUrl: b.imagePreview,
          date: new Date()
        };

        const res = await api.post("/billing", payload).catch(() => null);
        const createdBill = {
          _id: res?.data?.bill?._id || Date.now().toString(),
          id: res?.data?.bill?.billNumber || `INV-${Date.now().toString().slice(-4)}`,
          customerName: payload.partyName,
          phone: payload.customerPhone,
          date: "Today",
          amount: b.totalAmount,
          type: b.paymentMode,
          paymentStatus: b.paymentMode === "UDHAR" ? "unpaid" : "paid",
          items: b.items.map(i => ({ id: i.id, name: i.name, salePrice: i.price, qty: i.qty }))
        };
        createdList.push(createdBill);
      }

      setBills([...createdList, ...bills]);
      setShowScannedReviewModal(false);
      if (createdList.length > 0) {
        setSelectedBillDetail(createdList[0]);
        alert(`🎉 बधाई! ${createdList.length} बिल 1-क्लिक में सफलता से डिजिटल होकर सेव हो गए!`);
      }
    } catch (e) {
      console.error(e);
      alert("बिल सेव करने में त्रुटि आई।");
    } finally {
      setSavingScannedBill(false);
    }
  };

  // 20+ Comprehensive Reports Catalog
  const allReportsList = [
    { id: "daybook", title: "📖 DayBook (रोकड़ बही)", desc: "Daily Cash In/Out & Ledger", path: "/reports/daybook", category: "Core", color: "text-emerald-600 bg-emerald-50" },
    { id: "profitloss", title: "📊 Profit & Loss Report", desc: "Gross & Net Business Profit", path: "/reports/profitloss", category: "Core", color: "text-indigo-600 bg-indigo-50" },
    { id: "gst", title: "📑 GST Summary & Tax", desc: "Output & Input Tax Breakdown", path: "/reports/gst", category: "GST", color: "text-purple-600 bg-purple-50" },
    { id: "gstr1", title: "📋 GSTR-1 Monthly Return", desc: "B2B & B2C Sales Invoices", path: "/reports/gst", category: "GST", color: "text-amber-600 bg-amber-50" },
    { id: "gstr3b", title: "📄 GSTR-3B Summary", desc: "Tax Payment & ITC Filing", path: "/reports/gstr3b", category: "GST", color: "text-rose-600 bg-rose-50" },
    { id: "partywise", title: "👥 Party-Wise Sales Report", desc: "Customer Sales Breakdown", path: "/reports/partywise", category: "Sales", color: "text-blue-600 bg-blue-50" },
    { id: "itemwise", title: "📦 Item-Wise Sales Report", desc: "Top Selling Stock Items", path: "/reports/itemwise", category: "Sales", color: "text-teal-600 bg-teal-50" },
    { id: "billwise", title: "🧾 Bill-Wise Profit Register", desc: "Margin & Profit per Bill", path: "/reports/billwise", category: "Sales", color: "text-slate-700 bg-slate-100" },
    { id: "supplier_ledger", title: "🏢 Supplier Ledger (Purchase)", desc: "Vendor Accounts & Purchases", path: "/reports/supplier-ledger", category: "Purchase", color: "text-rose-600 bg-rose-50" },
    { id: "stock_aging", title: "⏳ Aging Report (Udhar Analysis)", desc: "Overdue Credit Days", path: "/reports/aging", category: "Udhar", color: "text-orange-600 bg-orange-50" },
    { id: "stock_alert", title: "⚠️ Low Stock & Reorder Alert", desc: "Items Below Minimum Limit", path: "/inventory", category: "Stock", color: "text-red-600 bg-red-50" },
    { id: "category_analytics", title: "🏷️ Category Analytics", desc: "Department & Group Sales", path: "/inventory/analytics", category: "Stock", color: "text-cyan-600 bg-cyan-50" },
    { id: "bank_rec", title: "🏦 Bank Auto-Tally Reco", desc: "Bank Statement Verification", path: "/reports/bank-reconciliation", category: "Banking", color: "text-indigo-600 bg-indigo-50" },
    { id: "eway_bill", title: "🚚 E-Way Bill Register", desc: "Govt Transport E-Way Invoices", path: "/reports/eway-bill", category: "Tax", color: "text-emerald-600 bg-emerald-50" },
    { id: "fixed_assets", title: "🏢 Fixed Assets & Capital", desc: "Shop Furniture, Machines & Equip", path: "/reports/fixed-assets", category: "Finance", color: "text-purple-600 bg-purple-50" },
    { id: "customer_builder", title: "🎯 Customer Report Builder", desc: "Custom Filtered Demographics", path: "/reports/customer", category: "CRM", color: "text-blue-600 bg-blue-50" },
    { id: "staff_payroll", title: "👔 PagarBook (स्टाफ हाजिरी व सैलरी)", desc: "Daily Attendance (P/HT/A), Advances, Overtime & Salary Slip", path: "pagarbook_modal", category: "Staff", color: "text-amber-600 bg-amber-50" },
    { id: "sales_return", title: "🔄 Sales Return Register", desc: "Credit Notes & Returns", path: "/billing/return", category: "Sales", color: "text-red-600 bg-red-50" },
    { id: "graphical_analytics", title: "📈 Graphical BI Analytics", desc: "Visual Charts & Trends", path: "/reports/analytics", category: "BI", color: "text-teal-600 bg-teal-50" },
    { id: "ghar_kharch", title: "🏡 Ghar Kharch (फैमिली घर खर्च लेजर)", desc: "Papa, Mummy, Family-wise Expense Ledger", path: "ghar_kharch_modal", category: "Personal", color: "text-amber-600 bg-amber-50" },
    { id: "ai_advisor", title: "🤖 AI मुनीम जी (Smart Insights)", desc: "AI Health Score & Predictions", path: "/ai-advisor", category: "AI", color: "text-purple-600 bg-purple-100" }
  ];

  // Filter 1600+ items live by search
  const filteredProducts = items.filter(it => 
    (it.name || '').toLowerCase().includes(itemSearchTerm.toLowerCase())
  ).slice(0, 8); // Top 8 matches for speed

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-28 select-none">
      {/* 📱 1. TOP WHITE HEADER */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setShowCompanySelectModal(true)}>
          <h1 className="font-extrabold text-[15px] tracking-wide text-[#1E293B]">
            {companyDisplayName.toUpperCase()}
          </h1>
          <ChevronDown size={16} className="text-[#6366F1]" />
        </div>

        <div className="flex items-center gap-2">
          {/* 1. AI OCR Bill Scanner Icon */}
          <button 
            onClick={() => setShowOcrModal(true)}
            className="w-9 h-9 rounded-full bg-[#ECFDF5] hover:bg-emerald-100 flex items-center justify-center text-[#059669] transition cursor-pointer"
            title="फोटो से बिल बनाएं (AI OCR)"
          >
            <Camera size={18} />
          </button>

          {/* 2. Calculator */}
          <button 
            onClick={() => setCalculatorVisible(true)}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
          >
            <Calculator size={18} />
          </button>

          {/* 3. Refer & Earn Gift Icon */}
          <button 
            onClick={() => setReferralModalVisible(true)}
            className="w-9 h-9 rounded-full bg-[#EEF2FF] hover:bg-indigo-100 flex items-center justify-center text-[#6366F1] transition cursor-pointer"
          >
            <Gift size={18} />
          </button>

          {/* 4. Profile / Logout Quick Icon */}
          <button 
            onClick={() => handleTabChange("more")}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer font-black text-xs"
            title="प्रोफाइल व सेटिंग्स"
          >
            <User size={18} />
          </button>
        </div>
      </header>
      {/* ⚠️ GUEST / DEMO MODE ALERT BANNER */}
      {isGuestMode && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-3 py-1.5 flex justify-between items-center text-xs font-bold shadow-sm sticky top-[53px] z-20">
          <div className="flex items-center gap-1.5">
            <span>⚠️</span>
            <span className="text-[11px]">गेस्ट / डेमो मोड सक्रिय है (Guest Mode)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="px-2 py-0.5 bg-white text-amber-900 font-extrabold text-[10px] rounded-md shadow-xs hover:bg-amber-50 cursor-pointer"
            >
              🔑 लॉगिन करें
            </button>
            <button
              onClick={handleExitGuestMode}
              className="px-2 py-0.5 bg-amber-900/60 hover:bg-amber-900 text-white font-bold text-[10px] rounded-md cursor-pointer"
            >
              एग्जिट
            </button>
          </div>
        </div>
      )}


      {/* 📱 2. MAIN SCROLLABLE CONTENT */}
      <main className="p-4 space-y-3.5 max-w-md mx-auto">
        {/* ==================== TAB 1: DASHBOARD ==================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-3.5 animate-in fade-in">
            {/* 💰 DEDICATED PROMINENT DAILY SALES CARD (आज की कुल बिक्री) */}
            <div className="p-4 bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4338CA] text-white rounded-3xl shadow-xl space-y-3 border border-indigo-500/40">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black text-indigo-200 uppercase tracking-wider">
                    आज की कुल बिक्री (Today's Total Sale)
                  </span>
                </div>
                <span className="text-[11px] font-bold text-indigo-200 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  📅 {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <div>
                  <div className="text-3xl font-black tracking-tight text-white drop-shadow-sm">
                    ₹ {todaySales.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-indigo-200 font-semibold mt-0.5">
                    {todayBills.length > 0 ? `कुल ${todayBills.length} बिक्री बिल दर्ज हैं` : 'आज की बिक्री दर्ज करने हेतु बटन दबाएं'}
                  </p>
                </div>
                <button
                  onClick={() => setShowManualSaleModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Plus size={15} /> + सीधी बिक्री
                </button>
              </div>

              {/* 3 Breakdown Pills: Cash, UPI, Udhar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-400/30 text-center">
                <div className="bg-white/10 p-2 rounded-xl backdrop-blur-xs">
                  <span className="text-[10px] text-emerald-300 font-bold block">💵 नकद (Cash)</span>
                  <span className="font-extrabold text-xs text-white">₹{todayCash.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-white/10 p-2 rounded-xl backdrop-blur-xs">
                  <span className="text-[10px] text-sky-300 font-bold block">📲 UPI / QR</span>
                  <span className="font-extrabold text-xs text-white">₹{todayUpi.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-white/10 p-2 rounded-xl backdrop-blur-xs">
                  <span className="text-[10px] text-rose-300 font-bold block">📒 उधारी (Udhar)</span>
                  <span className="font-extrabold text-xs text-white">₹{todayCredit.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            {/* Top Promo Banner */}
            <div className="p-3.5 bg-gradient-to-r from-[#EEF2FF] to-[#F5F3FF] border border-[#E0E7FF] rounded-2xl flex justify-between items-center shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-[#6366F1] uppercase tracking-wider">Supabase Cloud & Offline POS Active</p>
                <h3 className="font-black text-xs text-[#1E1B4B]">{companyDisplayName} ERP v2.0 Live</h3>
              </div>
              <button 
                onClick={() => handleTabChange("items")}
                className="px-3 py-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
              >
                View Stock →
              </button>
            </div>

            {/* 2x3 Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div 
                onClick={() => handleTabChange("parties")}
                className="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-[#34D399] transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-base text-[#059669]">₹ {toCollect.toLocaleString('en-IN')}</span>
                  <ChevronRight size={16} className="text-[#059669]" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#065F46]">To Collect</span>
                  <ArrowDown size={13} className="text-[#059669]" />
                </div>
              </div>

              <div 
                onClick={() => handleTabChange("parties")}
                className="p-3.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-[#FB7185] transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-base text-[#E11D48]">₹ {toPay.toLocaleString('en-IN')}</span>
                  <ChevronRight size={16} className="text-[#E11D48]" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#9F1239]">To Pay</span>
                  <ArrowUp size={13} className="text-[#E11D48]" />
                </div>
              </div>

              <div 
                onClick={() => handleTabChange("items")}
                className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-slate-200 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#64748B]">Stock Value</span>
                  <ChevronRight size={16} className="text-[#94A3B8]" />
                </div>
                <div className="font-black text-sm text-[#0F172A]">
                  ₹ {stockValue > 0 ? (stockValue / 100000).toFixed(2) + ' Lakhs' : '0'}
                </div>
              </div>

              <div 
                onClick={() => handleTabChange("reports")}
                className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-slate-200 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-sm text-[#0F172A]">₹ {recentSales.toLocaleString('en-IN')}</span>
                  <ChevronRight size={16} className="text-[#94A3B8]" />
                </div>
                <div className="text-xs font-bold text-[#64748B]">This week's sale</div>
              </div>

              <div 
                onClick={() => navigate("/reports/daybook")}
                className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-slate-200 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#64748B]">Total Balance</span>
                  <ChevronRight size={16} className="text-[#94A3B8]" />
                </div>
                <div className="text-[11px] font-bold text-[#475569]">Cash + Bank Balance</div>
              </div>

              <div 
                onClick={() => handleTabChange("reports")}
                className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-slate-200 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#64748B]">20+ Reports</span>
                  <ChevronRight size={16} className="text-[#94A3B8]" />
                </div>
                <div className="text-[11px] font-bold text-[#475569]">GST, P&L, DayBook...</div>
              </div>
            </div>

            {/* AI Photo Scanner Strip */}
            <div 
              onClick={() => setShowOcrModal(true)}
              className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow">
                  <Camera size={16} />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#065F46]">📸 फोटो से तुरंत बिल बनाएं (AI Scanner)</h4>
                  <p className="text-[10px] text-emerald-700">कागज़ी पर्ची/बिल की फोटो खींचें, AI खुद बिल बना देगा</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-emerald-600" />
            </div>

            {/* PagarBook Staff Strip */}
            <div 
              onClick={() => {
                fetchPagarBookData();
                handleTogglePagarBook(true);
              }}
              className="p-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm hover:border-amber-400 transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow">
                  👔
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-amber-950">👔 PagarBook (स्टाफ हाजिरी व सैलरी)</h4>
                  <p className="text-[10px] text-amber-800">1-क्लिक हाजिरी (P/HT/A), एडवांस, ओवरटाइम व वेतन पर्ची</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-amber-700" />
            </div>

            {/* 🏡 GHAR KHARCH (FAMILY & HOUSEHOLD EXPENSE) DASHBOARD STRIP */}
            {(() => {
              const totalExpVal = (gharKharchList || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
              return (
                <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl flex justify-between items-center shadow-sm hover:border-amber-400 transition">
                  <div 
                    onClick={() => {
                      fetchGharKharchData();
                      handleToggleGharKharchLedger(true);
                    }}
                    className="flex items-center gap-2.5 flex-1 cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shadow text-lg">
                      🏡
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-xs text-amber-950">घर खर्च व फैमिली लेजर</h4>
                        <span className="px-1.5 py-0.2 bg-amber-600 text-white font-black text-[9px] rounded-md">
                          ₹ {totalExpVal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-800 font-medium">
                        {(gharKharchList || []).length > 0 ? `${(gharKharchList || []).length} खर्चे दर्ज हैं • पापा, मम्मी, राशन हिसाब` : 'राशन, दवाई, बिजली, स्कूल फीस व फैमिली खर्च'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        fetchGharKharchData();
                        handleToggleGharKharchLedger(true);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-amber-300 text-amber-900 font-bold text-[11px] rounded-xl shadow-xs hover:bg-amber-50 transition cursor-pointer"
                    >
                      लेजर →
                    </button>
                    <button
                      onClick={() => handleToggleGharKharchEntry(true)}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={12} /> खर्च
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* EOD Daily Summary */}
            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-xs text-[#0F172A]">Today's Business Summary (EOD)</span>
                <span className="text-[11px] font-bold text-[#6366F1]">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-slate-100 text-center pt-1">
                <div className="px-1">
                  <div className="text-[10px] font-bold text-slate-400">Today's Sales</div>
                  <div className="font-black text-xs text-[#0F172A] mt-0.5">₹ {todaySales.toLocaleString('en-IN')}</div>
                </div>
                <div className="px-1">
                  <div className="text-[10px] font-bold text-slate-400">Cash Sales</div>
                  <div className="font-black text-xs text-[#059669] mt-0.5">₹ {todayCash.toLocaleString('en-IN')}</div>
                </div>
                <div className="px-1">
                  <div className="text-[10px] font-bold text-slate-400">Credit (Udhar)</div>
                  <div className="font-black text-xs text-[#DC2626] mt-0.5">₹ {todayCredit.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Unified Transactions Section (Sales & Ghar Kharch / Expenses) */}
            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-[#0F172A]">हालिया लेनदेन (Transactions)</h3>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                    <button
                      onClick={() => setTransactionTab("all")}
                      className={`px-2 py-0.5 rounded-md transition ${transactionTab === "all" ? "bg-white text-indigo-900 shadow-xs" : "text-slate-500"}`}
                    >
                      सभी ({bills.length + (gharKharchList || []).length})
                    </button>
                    <button
                      onClick={() => setTransactionTab("sales")}
                      className={`px-2 py-0.5 rounded-md transition ${transactionTab === "sales" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500"}`}
                    >
                      बिक्री ({bills.length})
                    </button>
                    <button
                      onClick={() => setTransactionTab("expenses")}
                      className={`px-2 py-0.5 rounded-md transition ${transactionTab === "expenses" ? "bg-amber-600 text-white shadow-xs" : "text-slate-500"}`}
                    >
                      खर्च ({(gharKharchList || []).length})
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleGharKharchEntry(true)}
                  className="text-[10px] font-black text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg transition flex items-center gap-1"
                >
                  <Plus size={11} /> + खर्च
                </button>
              </div>

              {(() => {
                const combinedStream = [
                  ...bills.map(b => ({
                    _id: b._id || b.id,
                    typeCategory: 'sale',
                    title: b.customerName || 'नकद काउंटर बिक्री',
                    subtitle: `Invoice #${b.id} • ${b.date} • ${b.paymentStatus === 'unpaid' ? 'Due (उधार)' : 'Paid'}`,
                    amount: b.amount,
                    isPositive: true,
                    dateObj: new Date(b.rawDate || b.date || Date.now()),
                    original: b
                  })),
                  ...(gharKharchList || []).map(e => ({
                    _id: e._id || e.id,
                    typeCategory: 'expense',
                    title: e.title || `${e.category || 'घरेलू खर्च'} ${e.familyMember ? `(${e.familyMember})` : ''}`,
                    subtitle: `🏡 ${e.category || 'खर्च'} • ${e.familyMember ? `[${e.familyMember}] • ` : ''}${e.date ? new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today'}`,
                    amount: Number(e.amount || 0),
                    isPositive: false,
                    dateObj: new Date(e.date || Date.now()),
                    original: e
                  }))
                ].sort((a, b) => b.dateObj - a.dateObj);

                const displayList = combinedStream.filter(tx => {
                  if (transactionTab === "sales") return tx.typeCategory === "sale";
                  if (transactionTab === "expenses") return tx.typeCategory === "expense";
                  return true;
                });

                if (displayList.length === 0) {
                  return (
                    <div className="p-8 bg-white border border-slate-100 rounded-2xl text-center space-y-2">
                      <Receipt size={36} className="mx-auto text-slate-300" />
                      <p className="text-xs font-bold text-slate-700">कोई लेनदेन नहीं मिला</p>
                      <p className="text-[11px] text-slate-400">नीचे दिए गए बटन से बिक्री या खर्च दर्ज करें</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {displayList.slice(0, 8).map((tx) => (
                      <div 
                        key={tx._id}
                        onClick={() => {
                          if (tx.typeCategory === 'sale') {
                            setSelectedBillDetail(tx.original);
                          } else {
                            handleOpenEditGharKharch(tx.original);
                          }
                        }}
                        className="p-3.5 bg-white border border-slate-100 hover:border-indigo-200 rounded-2xl flex justify-between items-center shadow-sm cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${tx.typeCategory === 'sale' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {tx.typeCategory === 'sale' ? '🧾' : '🏡'}
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-bold text-xs text-[#0F172A]">{tx.title}</div>
                            <div className="text-[10px] text-slate-400">
                              {tx.subtitle}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className={`font-black text-xs ${tx.typeCategory === 'sale' ? 'text-emerald-700' : 'text-amber-800'}`}>
                              {tx.typeCategory === 'sale' ? '+' : '-'} ₹ {tx.amount.toLocaleString('en-IN')}
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${tx.typeCategory === 'sale' ? (tx.original.paymentStatus === 'unpaid' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700') : 'bg-amber-100 text-amber-900'}`}>
                              {tx.typeCategory === 'sale' ? (tx.original.paymentStatus === 'unpaid' ? 'Unpaid' : 'Sale') : 'खर्च'}
                            </span>
                          </div>
                          {tx.typeCategory === 'sale' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareWhatsAppBill(tx.original);
                              }}
                              className="w-7 h-7 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition cursor-pointer"
                            >
                              <Share2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: PARTIES ==================== */}
        {activeTab === "parties" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-base text-[#0F172A]">Parties ({parties.length})</h2>
              <button 
                onClick={() => setShowAddPartyModal(true)}
                className="px-3.5 py-1.5 bg-[#4338CA] hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
              >
                + Add Party
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                placeholder="Search party by name or mobile..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#4338CA]"
              />
            </div>

            <div className="space-y-2">
              {parties
                .filter(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.phone && p.phone.includes(searchQuery)))
                .map((p) => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPartyDetail(p)}
                  className="p-3.5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm cursor-pointer hover:border-indigo-100 transition"
                >
                  <div>
                    <div className="font-bold text-xs text-[#0F172A]">{p.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone size={11} /> {p.phone || "No Phone"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black text-xs ${Number(p.balance || 0) >= 0 ? "text-[#059669]" : "text-[#DC2626]"}`}>
                      {Number(p.balance || 0) >= 0 ? `+ ₹${Number(p.balance || 0).toLocaleString('en-IN')}` : `- ₹${Math.abs(Number(p.balance || 0)).toLocaleString('en-IN')}`}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {Number(p.balance || 0) >= 0 ? "You'll Get" : "You'll Give"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: ITEMS ==================== */}
        {activeTab === "items" && (() => {
          // Extract unique categories and brands dynamically from items
          const dynamicCats = [...new Set(items.map(it => (it.category || '').trim()).filter(Boolean))];
          const dynamicBrands = [...new Set(items.map(it => (it.brand || '').trim()).filter(Boolean))];

          const standardCats = ["General", "Paints", "Hardware", "Pipes & Fittings", "Electricals", "Sanitary", "Plywood & Beat", "Tools"];
          const allAvailableCats = ["ALL", ...new Set([...standardCats, ...dynamicCats])];

          const standardBrands = ["General", "Asian Paints", "Berger", "Kamdhenu", "Astral", "Supreme", "Pidilite", "Havells", "Finolex"];
          const allAvailableBrands = ["ALL", ...new Set([...standardBrands, ...dynamicBrands])];

          // Filter items based on search, category, brand, and stock status
          const filteredItems = items.filter(it => {
            const itemCat = (it.category || 'General').trim().toLowerCase();
            const itemBrand = (it.brand || 'General').trim().toLowerCase();
            const q = searchQuery.trim().toLowerCase();

            const matchesSearch = !q || 
              (it.name || '').toLowerCase().includes(q) ||
              itemCat.includes(q) ||
              itemBrand.includes(q) ||
              (it.barcode || '').toLowerCase().includes(q) ||
              (it.sku || '').toLowerCase().includes(q);

            const matchesCategory = selectedCategoryFilter === "ALL" || 
              itemCat === selectedCategoryFilter.trim().toLowerCase() ||
              (selectedCategoryFilter.toLowerCase().includes("plywood") && itemCat.includes("plywood"));

            const matchesBrand = selectedBrandFilter === "ALL" || 
              itemBrand === selectedBrandFilter.trim().toLowerCase();

            const stockNum = Number(it.stock ?? it.currentStock ?? 0);
            let matchesStock = true;
            if (selectedStockFilter === "IN_STOCK") matchesStock = stockNum > 0;
            else if (selectedStockFilter === "LOW_STOCK") matchesStock = stockNum > 0 && stockNum <= 5;
            else if (selectedStockFilter === "OUT_OF_STOCK") matchesStock = stockNum <= 0;

            return matchesSearch && matchesCategory && matchesBrand && matchesStock;
          });

          return (
            <div className="space-y-3 animate-in fade-in">
              {/* Header with Title & Action Buttons */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-extrabold text-base text-[#0F172A]">Items ({filteredItems.length} / {items.length})</h2>
                  <p className="text-[10px] text-slate-500 font-medium">Category, Brand & Stock Filter</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setShowCategoryModal(true)}
                    className={`px-2.5 py-1.5 border rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-sm ${selectedCategoryFilter !== "ALL" ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  >
                    📁 Category {selectedCategoryFilter !== "ALL" ? `(${selectedCategoryFilter})` : ""}
                  </button>
                  <button 
                    onClick={() => setShowBrandModal(true)}
                    className={`px-2.5 py-1.5 border rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-sm ${selectedBrandFilter !== "ALL" ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  >
                    🏷️ Brand {selectedBrandFilter !== "ALL" ? `(${selectedBrandFilter})` : ""}
                  </button>
                  <button 
                    onClick={() => setShowAddItemModal(true)}
                    className="px-3 py-1.5 bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>
              </div>

              {/* Search Bar with Camera Barcode Scanner Shortcut */}
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input 
                    type="text" 
                    placeholder="Search name, category, brand, barcode..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#059669] shadow-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (cameraInputRef.current) cameraInputRef.current.click();
                  }}
                  title="Scan Barcode / Bill"
                  className="p-2.5 bg-[#4338CA] hover:bg-indigo-700 text-white rounded-xl shadow-sm cursor-pointer flex items-center justify-center"
                >
                  <Camera size={16} />
                </button>
              </div>

              {/* Quick Horizontal Category Filter Pills */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>📁 Categories:</span>
                  {(selectedCategoryFilter !== "ALL" || selectedBrandFilter !== "ALL" || selectedStockFilter !== "ALL") && (
                    <button 
                      onClick={() => {
                        setSelectedCategoryFilter("ALL");
                        setSelectedBrandFilter("ALL");
                        setSelectedStockFilter("ALL");
                      }}
                      className="text-[#4338CA] hover:underline cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {allAvailableCats.slice(0, 10).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${selectedCategoryFilter === cat ? "bg-[#4338CA] text-white shadow-sm" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                    >
                      {cat === "ALL" ? "All Categories" : cat}
                    </button>
                  ))}
                  {allAvailableCats.length > 10 && (
                    <button
                      onClick={() => setShowCategoryModal(true)}
                      className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold whitespace-nowrap"
                    >
                      + More ({allAvailableCats.length - 10})
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Horizontal Brand Filter Pills */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 block">🏷️ Popular Brands:</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {allAvailableBrands.slice(0, 8).map((br) => (
                    <button
                      key={br}
                      onClick={() => setSelectedBrandFilter(br)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${selectedBrandFilter === br ? "bg-amber-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                    >
                      {br === "ALL" ? "All Brands" : br}
                    </button>
                  ))}
                  {allAvailableBrands.length > 8 && (
                    <button
                      onClick={() => setShowBrandModal(true)}
                      className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold whitespace-nowrap"
                    >
                      + More Brands ({allAvailableBrands.length - 8})
                    </button>
                  )}
                </div>
              </div>

              {/* Stock Status Pills (All, In Stock, Low Stock, Out of Stock) */}
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                <button
                  onClick={() => setSelectedStockFilter("ALL")}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${selectedStockFilter === "ALL" ? "bg-white text-[#0F172A] shadow-sm font-extrabold" : "text-slate-500"}`}
                >
                  All Items ({items.length})
                </button>
                <button
                  onClick={() => setSelectedStockFilter("IN_STOCK")}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${selectedStockFilter === "IN_STOCK" ? "bg-emerald-600 text-white shadow-sm font-extrabold" : "text-slate-500"}`}
                >
                  ✨ In Stock ({items.filter(it => Number(it.stock || it.currentStock || 0) > 0).length})
                </button>
                <button
                  onClick={() => setSelectedStockFilter("LOW_STOCK")}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${selectedStockFilter === "LOW_STOCK" ? "bg-rose-600 text-white shadow-sm font-extrabold" : "text-slate-500"}`}
                >
                  ⚠️ Low Stock ({items.filter(it => Number(it.stock || it.currentStock || 0) > 0 && Number(it.stock || it.currentStock || 0) <= 5).length})
                </button>
                <button
                  onClick={() => setSelectedStockFilter("OUT_OF_STOCK")}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${selectedStockFilter === "OUT_OF_STOCK" ? "bg-slate-700 text-white shadow-sm font-extrabold" : "text-slate-500"}`}
                >
                  ❌ Out ({items.filter(it => Number(it.stock || it.currentStock || 0) <= 0).length})
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {filteredItems.length === 0 ? (
                  <div className="p-8 bg-white border border-slate-100 rounded-2xl text-center space-y-2 shadow-sm">
                    <p className="text-xs font-bold text-slate-600">कोई आइटम नहीं मिला (No items found)</p>
                    <p className="text-[10px] text-slate-400">फिल्टर बदलें या नया आइटम जोड़ें</p>
                    <button
                      onClick={() => setShowAddItemModal(true)}
                      className="px-3.5 py-1.5 bg-[#059669] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus size={14} /> + Add Item
                    </button>
                  </div>
                ) : (
                  filteredItems.map((it) => {
                    const stockVal = Number(it.stock || it.currentStock || 0);
                    return (
                      <div key={it.id || it._id} className="p-3.5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm hover:border-indigo-100 transition">
                        <div className="space-y-0.5">
                          <div className="font-bold text-xs text-[#0F172A]">{it.name}</div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                            {it.category && (
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-semibold">
                                📁 {it.category}
                              </span>
                            )}
                            {it.brand && it.brand !== "General" && (
                              <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 rounded font-semibold">
                                🏷️ {it.brand}
                              </span>
                            )}
                            <span>Sale: <strong className="text-slate-700">₹{it.salePrice || it.sellingPrice || 0}</strong></span>
                            {it.mrp && <span>MRP: ₹{it.mrp}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="text-right">
                            <div className="font-black text-xs text-[#0F172A]">{stockVal} {it.unit || "Pcs"}</div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${stockVal <= 0 ? "bg-slate-100 text-slate-600" : stockVal <= 5 ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#ECFDF5] text-[#059669]"}`}>
                              {stockVal <= 0 ? "Out of Stock" : stockVal <= 5 ? "Low Stock" : "In Stock"}
                            </span>
                          </div>
                          <button 
                            onClick={() => {
                              handleAddToCart(it);
                              setShowQuickBillModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-[#4338CA] hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl shadow-sm cursor-pointer transition"
                          >
                            + Sale
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* ==================== TAB 4: 20+ COMPLETE REPORTS MENU ==================== */}
        {activeTab === "reports" && (
          <div className="space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-extrabold text-base text-[#0F172A]">All Reports ({allReportsList.length})</h2>
                <p className="text-[11px] text-slate-500">DayBook, GST, Profit & Loss, Staff...</p>
              </div>
            </div>

            {/* Live Search inside 20+ Reports */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                placeholder="Search report (e.g. DayBook, GST, Profit)..." 
                value={reportSearchQuery}
                onChange={(e) => setReportSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#4338CA]"
              />
            </div>

            {/* 2-Column Grid of 20+ Reports */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allReportsList
                .filter(r => r.title.toLowerCase().includes(reportSearchQuery.toLowerCase()) || r.desc.toLowerCase().includes(reportSearchQuery.toLowerCase()))
                .map((r) => (
                <div 
                  key={r.id}
                  onClick={() => {
                    if (r.path === 'pagarbook_modal') {
                      fetchPagarBookData();
                      setShowPagarBookModal(true);
                    } else if (r.path === 'ghar_kharch_modal') {
                      fetchGharKharchData();
                      setShowGharKharchLedgerModal(true);
                    } else {
                      navigate(r.path);
                    }
                  }}
                  className="p-3 bg-white border border-slate-100 hover:border-indigo-200 rounded-2xl flex justify-between items-center shadow-sm cursor-pointer transition"
                >
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-xs text-[#0F172A]">{r.title}</div>
                    <div className="text-[10px] text-slate-400">{r.desc}</div>
                  </div>
                  <div className={`p-2 rounded-xl ${r.color}`}>
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 5: MORE SETTINGS & ACCOUNT ==================== */}
        {activeTab === "more" && (
          <div className="space-y-3.5 animate-in fade-in">
            {/* User & Company Profile Card */}
            <div className="p-4 bg-gradient-to-br from-[#1E1B4B] to-[#312E81] text-white rounded-3xl shadow-md space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 text-white flex items-center justify-center font-black text-xl shadow-inner">
                    🏢
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm text-white">{companyDisplayName}</h2>
                    <p className="text-[11px] text-indigo-200">
                      {isGuestMode ? "⚠️ गेस्ट / डेमो अकाउंट" : (user?.mobileNumber || user?.phone || user?.email || "सत्यापित खाता")}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${isGuestMode ? 'bg-amber-400 text-amber-950' : 'bg-emerald-400 text-emerald-950'}`}>
                  {isGuestMode ? "Demo Mode" : "Pro Plan Active"}
                </span>
              </div>

              <div className="pt-2 border-t border-indigo-400/20 flex gap-2">
                <button
                  onClick={() => setShowCompanySelectModal(true)}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl backdrop-blur-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  🏪 दुकान / कंपनी बदलें
                </button>
                {isGuestMode ? (
                  <button
                    onClick={() => navigate("/login")}
                    className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    🔑 असली लॉगिन करें
                  </button>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    🚪 लॉगआउट
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-2 text-xs font-bold">
              <div 
                onClick={() => setShowCompanySelectModal(true)} 
                className="p-3.5 bg-white border border-slate-100 hover:border-indigo-200 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🏪</span>
                  <div>
                    <span className="text-[#0F172A] block font-extrabold">दुकान / बिजनेस स्विच करें</span>
                    <span className="text-[10px] text-slate-400 font-medium">किराना, रेस्टोरेंट, हार्डवेयर, इलेक्ट्रॉनिक्स आदि</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>

              <div 
                onClick={() => navigate("/company/add")} 
                className="p-3.5 bg-white border border-slate-100 hover:border-indigo-200 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">➕</span>
                  <div>
                    <span className="text-[#0F172A] block font-extrabold">नया बिजनेस / फर्म जोड़ें</span>
                    <span className="text-[10px] text-slate-400 font-medium">एक ही ऐप में कई दुकानें व व्यापार चलाएं</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>

              <div 
                onClick={() => navigate("/dashboard")} 
                className="p-3.5 bg-[#EEF2FF] border border-[#E0E7FF] rounded-2xl flex justify-between items-center cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🚀</span>
                  <div>
                    <span className="text-[#4338CA] block font-extrabold">डेस्कटॉप ERP डैशबोर्ड खोलें</span>
                    <span className="text-[10px] text-indigo-400 font-medium">पूरी 30+ फीचर्स व विस्तृत रिपोर्ट</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#4338CA]" />
              </div>

              <div 
                onClick={() => setReferralModalVisible(true)} 
                className="p-3.5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🎁</span>
                  <div>
                    <span className="text-[#0F172A] block font-extrabold">रेफर करें और कमाएं (Refer & Earn)</span>
                    <span className="text-[10px] text-slate-400 font-medium">मित्रों को शेयर करें और 20% डिस्काउंट पाएं</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>

              <div 
                onClick={() => navigate("/settings/backup")} 
                className="p-3.5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">💾</span>
                  <div>
                    <span className="text-[#0F172A] block font-extrabold">बैकअप और क्लाउड सिंक</span>
                    <span className="text-[10px] text-slate-400 font-medium">Google Drive ऑटो बैकअप व डेटा सुरक्षा</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>

              {/* Logout / Exit Guest Mode Button */}
              <div 
                onClick={isGuestMode ? handleExitGuestMode : handleLogout} 
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm hover:bg-rose-100 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🚪</span>
                  <div>
                    <span className="text-rose-700 block font-extrabold">
                      {isGuestMode ? "गेस्ट मोड से बाहर निकलें (Exit Demo)" : "खाते से लॉगआउट करें (Logout)"}
                    </span>
                    <span className="text-[10px] text-rose-500 font-medium">
                      {isGuestMode ? "अपने असली यूजरनेम व पासवर्ड से लॉगिन करें" : "सुरक्षित रूप से बाहर निकलें"}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-rose-500" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 📱 3. FLOATING BOTTOM ACTION PILL BAR */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-4 flex justify-center items-center pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-full px-3 py-1.5 shadow-xl flex items-center gap-3 pointer-events-auto">
          <button 
            onClick={() => handleTabChange("parties")}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-bold text-xs rounded-full transition cursor-pointer"
          >
            Received Payment
          </button>

          <button 
            onClick={() => setShowQuickBillModal(true)}
            className="w-10 h-10 -my-2 bg-[#4338CA] hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/40 transform active:scale-95 transition cursor-pointer"
          >
            <Plus size={22} />
          </button>

          <button 
            onClick={() => setShowQuickBillModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white font-bold text-xs rounded-full shadow-md transition cursor-pointer"
          >
            + Bill / Invoice
          </button>
        </div>
      </div>

      {/* 📱 4. BOTTOM TAB NAVIGATOR (5 Tabs) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 px-2 py-2 shadow-2xl flex justify-around items-center">
        <button 
          onClick={() => handleTabChange("dashboard")}
          className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "dashboard" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
        >
          <Home size={20} />
          <span className="text-[11px]">Dashboard</span>
        </button>

        <button 
          onClick={() => handleTabChange("parties")}
          className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "parties" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
        >
          <Users size={20} />
          <span className="text-[11px]">Parties</span>
        </button>

        <button 
          onClick={() => handleTabChange("reports")}
          className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "reports" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
        >
          <BarChart2 size={20} />
          <span className="text-[11px]">Reports</span>
        </button>

        <button 
          onClick={() => handleTabChange("items")}
          className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "items" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
        >
          <Package size={20} />
          <span className="text-[11px]">Items</span>
        </button>

        <button 
          onClick={() => handleTabChange("more")}
          className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "more" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
        >
          <Menu size={20} />
          <span className="text-[11px]">More</span>
        </button>
      </nav>

      {/* 📱 5. ULTRA-FAST VYAPAR/MYBILLBOOK STYLE BILLING MODAL */}
      {showQuickBillModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 space-y-3.5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">फास्ट बिक्री बिल (+ Sale Bill)</h3>
                  <p className="text-[10px] text-slate-400">नाम ऑप्शनल है • 1600+ सामान खोजें</p>
                </div>
              </div>
              <button onClick={() => setShowQuickBillModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Customer Name, Search Dropdown & Phone */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-700">
                <span>👤 ग्राहक / पार्टी (Customer & Udhar Ledger):</span>
                {selectedPartyObject && (
                  <span className={`text-[10px] font-black ${selectedPartyObject.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    पुराना बकाया: ₹{Math.abs(selectedPartyObject.balance || 0).toLocaleString('en-IN')} ({selectedPartyObject.balance >= 0 ? "You'll Get" : "You'll Give"})
                  </span>
                )}
              </div>
              <div className="relative grid grid-cols-2 gap-2">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={billPaymentMode === "UDHAR" ? "उधारी ग्राहक का नाम खोजें/लिखें *" : "ग्राहक का नाम (ऑप्शनल)..."}
                    value={billCustomer}
                    onFocus={() => setShowPartySuggestions(true)}
                    onChange={(e) => {
                      setBillCustomer(e.target.value);
                      setShowPartySuggestions(true);
                    }}
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl text-xs text-[#0F172A] outline-none font-bold placeholder:font-normal ${billPaymentMode === "UDHAR" ? "border-rose-400 focus:border-rose-600 bg-rose-50/40" : "border-slate-200 focus:border-[#4338CA]"}`}
                  />
                  {/* Live Party Suggestions Dropdown */}
                  {showPartySuggestions && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-44 overflow-y-auto divide-y divide-slate-100">
                      {parties
                        .filter(p => (p.name || '').toLowerCase().includes(billCustomer.toLowerCase()) || (p.phone || '').includes(billCustomer))
                        .slice(0, 6)
                        .map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setBillCustomer(p.name);
                              setBillCustomerPhone(p.phone || "");
                              setSelectedPartyObject(p);
                              setShowPartySuggestions(false);
                            }}
                            className="p-2.5 hover:bg-indigo-50 flex justify-between items-center cursor-pointer transition"
                          >
                            <div>
                              <div className="font-extrabold text-xs text-[#0F172A]">👤 {p.name}</div>
                              <div className="text-[10px] text-slate-400">{p.phone || "No Phone"}</div>
                            </div>
                            <div className="text-right font-black text-xs text-[#DC2626]">
                              {Number(p.balance || 0) !== 0 ? `₹${Number(p.balance || 0).toLocaleString('en-IN')}` : '₹0'}
                            </div>
                          </div>
                        ))}
                      {billCustomer.trim().length > 0 && (
                        <div
                          onClick={() => setShowPartySuggestions(false)}
                          className="p-2 text-center text-xs text-[#4338CA] font-extrabold hover:bg-slate-50 cursor-pointer"
                        >
                          + "{billCustomer}" को नया ग्राहक रखें
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <input 
                  type="tel" 
                  placeholder="WhatsApp नंबर (ऑप्शनल)..." 
                  value={billCustomerPhone}
                  onChange={(e) => setBillCustomerPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none"
                />
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="grid grid-cols-3 gap-2">
              {["CASH", "UDHAR", "UPI"].map((m) => (
                <button
                  key={m}
                  onClick={() => setBillPaymentMode(m)}
                  className={`py-2 rounded-xl text-xs font-bold border ${billPaymentMode === m ? "bg-[#4338CA] text-white border-[#4338CA]" : "bg-slate-50 border-slate-200 text-slate-700"}`}
                >
                  {m === "CASH" ? "💵 नकद (Cash)" : m === "UDHAR" ? "📒 उधारी (Credit)" : "📲 UPI / QR"}
                </button>
              ))}
            </div>

            {/* 📍 CUSTOMER ADDRESS & DETAILS ON-THE-SPOT */}
            <div className="space-y-1.5">
              {!showCustomerAddressInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomerAddressInput(true)}
                  className="text-[11px] font-bold text-[#4338CA] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  📍 + ग्राहक का पता (Address) दर्ज करें
                </button>
              ) : (
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 animate-in fade-in">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                    <span>📍 ग्राहक का पता (Customer Address):</span>
                    <button onClick={() => setShowCustomerAddressInput(false)} className="text-slate-400 hover:text-slate-600">✕ बंद करें</button>
                  </div>
                  <input
                    type="text"
                    placeholder="दुकान/गांव/शहर का पता (उदा. मेन मार्केट, सारंगढ़)..."
                    value={billCustomerAddress}
                    onChange={(e) => setBillCustomerAddress(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-[#0F172A] outline-none font-medium"
                  />
                </div>
              )}
            </div>

            {/* ⚡ TOP 20-30 DAILY FREQUENT / TOP SELLING QUICK-PICK ITEMS BAR */}
            <div className="space-y-1.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-2.5 rounded-2xl border border-amber-300/60">
              <div className="flex justify-between items-center text-[11px] font-black text-amber-950">
                <span className="flex items-center gap-1">⚡ अक्सर बिकने वाले टॉप 20-30 सामान (Quick 1-Tap Pick):</span>
                <span className="text-[10px] text-amber-800 font-bold">{Math.min(items.length, 30)} सामान</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {items.slice(0, 30).map(quickIt => (
                  <button
                    key={quickIt.id || quickIt._id}
                    type="button"
                    onClick={() => handleAddToCart(quickIt)}
                    className="px-2.5 py-1.5 bg-white hover:bg-amber-100/80 active:scale-95 border border-amber-300 rounded-xl text-left transition cursor-pointer shadow-2xs whitespace-nowrap flex items-center gap-1.5"
                  >
                    <span className="font-extrabold text-xs text-slate-800">
                      {quickIt.name.length > 18 ? quickIt.name.slice(0, 18) + '…' : quickIt.name}
                    </span>
                    <span className="font-black text-xs text-[#059669] bg-emerald-50 px-1.5 py-0.2 rounded">
                      ₹{quickIt.salePrice || quickIt.sellingPrice}
                    </span>
                    <span className="text-amber-700 font-black text-xs">+</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 🔍 LIVE INSTANT SEARCH FOR 1600+ ITEMS */}
            <div className="relative space-y-1">
              <label className="text-[11px] font-extrabold text-slate-700 block">🔍 अन्य सामान खोजें (1600+ Stock Catalog):</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="आइटम का नाम, साइज या बारकोड टाइप करें..."
                  value={itemSearchTerm}
                  onFocus={() => setShowItemSuggestions(true)}
                  onChange={(e) => {
                    setItemSearchTerm(e.target.value);
                    setShowItemSuggestions(true);
                  }}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none font-bold focus:border-[#4338CA]"
                />
                {itemSearchTerm && (
                  <button 
                    onClick={() => setItemSearchTerm("")} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Instant Search Suggestions Dropdown */}
              {showItemSuggestions && itemSearchTerm.trim().length > 0 && (
                <div className="absolute left-0 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 font-bold">
                      कोई सामान नहीं मिला • <span onClick={() => setShowAddItemModal(true)} className="text-[#4338CA] underline cursor-pointer">+ नया सामान बनाएं</span>
                    </div>
                  ) : (
                    filteredProducts.map(it => (
                      <div 
                        key={it.id}
                        onClick={() => handleAddToCart(it)}
                        className="p-2.5 hover:bg-indigo-50 flex justify-between items-center cursor-pointer transition"
                      >
                        <div>
                          <div className="font-extrabold text-xs text-[#0F172A]">{it.name}</div>
                          <div className="text-[10px] text-slate-400">स्टॉक: {it.stock} {it.unit}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-[#059669]">₹{it.salePrice}</span>
                          <span className="px-2 py-1 bg-[#4338CA] text-white font-bold text-[10px] rounded-lg">+ जोड़ें</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Cart Items List with Stepper (+ / -) */}
            {billCart.length > 0 ? (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 max-h-44 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-500">जोड़े गए उत्पाद ({billCart.length}):</div>
                {billCart.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-xs bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-[#0F172A]">{item.name}</div>
                      <div className="text-[10px] text-slate-400">रेट: ₹{item.salePrice} × {item.qty} = <span className="font-black text-[#059669]">₹{item.salePrice * item.qty}</span></div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleUpdateCartQty(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-black text-xs px-1 text-[#0F172A]">{item.qty}</span>
                      <button 
                        onClick={() => handleUpdateCartQty(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-rose-500 p-1 hover:text-rose-700 ml-1 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                ऊपर सर्च बार से सामान चुनें या नीचे से जोड़ें
              </div>
            )}

            {/* Total Amount & Submit Button */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-2">
              <span className="font-bold text-xs text-slate-600">कुल बिल राशि:</span>
              <span className="font-black text-xl text-[#059669]">₹ {totalBillAmount.toLocaleString('en-IN')}</span>
            </div>

            <button
              onClick={handleSaveAndGenerateBill}
              disabled={savingBill}
              className="w-full py-3.5 bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
            >
              {savingBill ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />} 
              {savingBill ? "लाइव बिल सेव हो रहा है..." : "बिल सेव करें व WhatsApp भेजें →"}
            </button>
          </div>
        </div>
      )}

      {/* 📱 6. AI MULTI-BILL PHOTO & GALLERY SCANNER MODAL */}
      {showOcrModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">AI फोटो बिल स्कैनर</h3>
                  <p className="text-[10px] text-slate-400">कैमरा + गैलरी मल्टी-बिल • 100% सटीक</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowApiKeyModal(true)} 
                  title="Configure AI Keys"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-bold"
                >
                  ⚙️ Key
                </button>
                <button onClick={() => setShowOcrModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Bill Type Selector (Customer Sale vs Vendor Purchase) */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => setOcrBillType('sale')}
                className={`py-2 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${ocrBillType === 'sale' ? 'bg-[#059669] text-white border-[#059669] shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                🛍️ ग्राहक कच्ची पर्ची
              </button>
              <button
                onClick={() => setOcrBillType('purchase')}
                className={`py-2 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${ocrBillType === 'purchase' ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                🚚 सप्लायर खरीद बिल
              </button>
            </div>

            {/* Hidden File Inputs: Camera & Gallery */}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              ref={cameraInputRef}
              onChange={handleProcessBillImages}
              className="hidden" 
            />
            <input 
              type="file" 
              accept="image/*" 
              multiple
              ref={galleryInputRef}
              onChange={handleProcessBillImages}
              className="hidden" 
            />

            <div className="p-5 bg-gradient-to-b from-emerald-50/80 to-teal-50/40 border-2 border-dashed border-emerald-300 rounded-2xl space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-md mx-auto flex items-center justify-center text-emerald-600">
                <Camera size={28} />
              </div>

              <div>
                <h4 className="font-extrabold text-xs text-[#065F46]">
                  {ocrBillType === 'sale' ? 'कागजी पर्ची या हाथ से लिखे बिल की फोटो लें' : 'सप्लायर का पक्का इनवॉइस या बिल अपलोड करें'}
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  AI खुद-ब-खुद सामान, मात्रा व रेट पढ़कर आपके 1600+ कैटलॉग से मिला देगा। एक साथ कई फोटो भी चुन सकते हैं!
                </p>
              </div>

              {ocrLoading && (
                <div className="space-y-2 py-2">
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full transition-all duration-300 font-bold text-[9px] text-white flex items-center justify-center"
                      style={{ width: `${ocrProgress}%` }}
                    >
                      {ocrProgress}%
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-emerald-700 animate-pulse">
                    {ocrStatusText || "AI फोटो को स्कैन कर रहा है..."}
                  </p>
                </div>
              )}

              {/* 2 ACTION BUTTONS: CAMERA & GALLERY (MULTIPLE) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={ocrLoading}
                  className="py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Camera size={15} /> 📸 कैमरा खोलें
                </button>

                <button
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={ocrLoading}
                  className="py-3 bg-gradient-to-r from-[#4338CA] to-[#6366F1] hover:from-[#3730A3] hover:to-[#4F46E5] text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload size={15} /> 🖼️ गैलरी (Multiple)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📱 6.1 AI MULTI-BILL REVIEW & SMART MERGE MODAL */}
      {showScannedReviewModal && scannedBillsBatch.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 space-y-3.5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">AI स्कैन किए गए बिल ({scannedBillsBatch.length})</h3>
                  <p className="text-[10px] text-slate-400">1600+ इन्वेंटरी से सटीक मिलान • 1-क्लिक सेव</p>
                </div>
              </div>
              <button onClick={() => setShowScannedReviewModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* SMART SAME-PARTY MERGE BANNER (If multiple bills scanned) */}
            {scannedBillsBatch.length > 1 && (
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-black text-amber-900">
                    ✨ {scannedBillsBatch.length} पर्चियां पहचानी गईं!
                  </p>
                  <p className="text-[10px] text-amber-700">
                    क्या आप इन सभी पर्चियों को 1 मास्टर बिल में जोड़ना चाहते हैं?
                  </p>
                </div>
                <button
                  onClick={handleMergeAllBatchBills}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] rounded-xl shadow-sm cursor-pointer whitespace-nowrap"
                >
                  🔗 1 बिल में जोड़ें
                </button>
              </div>
            )}

            {/* BATCH TABS (If multiple bills) */}
            {scannedBillsBatch.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {scannedBillsBatch.map((b, idx) => (
                  <button
                    key={b.id || idx}
                    onClick={() => setActiveScannedIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${activeScannedIndex === idx ? 'bg-[#4338CA] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    <span>पर्ची #{idx + 1}</span>
                    <span className="text-[10px] opacity-80">₹{b.totalAmount}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ACTIVE BILL EDIT FORM */}
            {scannedBillsBatch[activeScannedIndex] && (
              <div className="space-y-3">
                {/* Party & Payment Details Card */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">पार्टी / ग्राहक का नाम:</span>
                    <div className="flex gap-1.5 text-[10px] font-bold">
                      <button 
                        onClick={() => handleUpdateActiveBillField('billType', 'sale')}
                        className={`px-2 py-0.5 rounded-full ${scannedBillsBatch[activeScannedIndex].billType === 'sale' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                      >
                        बिक्री (Sale)
                      </button>
                      <button 
                        onClick={() => handleUpdateActiveBillField('billType', 'purchase')}
                        className={`px-2 py-0.5 rounded-full ${scannedBillsBatch[activeScannedIndex].billType === 'purchase' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                      >
                        खरीद (Purchase)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      value={scannedBillsBatch[activeScannedIndex].partyName}
                      onChange={(e) => handleUpdateActiveBillField('partyName', e.target.value)}
                      placeholder="पार्टी का नाम..."
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-indigo-600"
                    />
                    <input 
                      type="tel" 
                      value={scannedBillsBatch[activeScannedIndex].partyPhone}
                      onChange={(e) => handleUpdateActiveBillField('partyPhone', e.target.value)}
                      placeholder="फोन / WhatsApp..."
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    {["CASH", "UDHAR", "UPI"].map((m) => (
                      <button
                        key={m}
                        onClick={() => handleUpdateActiveBillField('paymentMode', m)}
                        className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold border transition ${scannedBillsBatch[activeScannedIndex].paymentMode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-600'}`}
                      >
                        {m === "CASH" ? "💵 नकद" : m === "UDHAR" ? "📒 उधार" : "📲 UPI"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extracted Items Table */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-extrabold text-slate-700">
                      पहचाने गए सामान ({scannedBillsBatch[activeScannedIndex].items.length} Items):
                    </span>
                    <button 
                      onClick={handleAddActiveBillItem}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> सामान जोड़ें
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {scannedBillsBatch[activeScannedIndex].items.map((item, itemIdx) => (
                      <div key={item.id || itemIdx} className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 space-y-1.5 transition">
                        <div className="flex items-center justify-between gap-2">
                          <input 
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateActiveBillItem(itemIdx, 'name', e.target.value)}
                            placeholder="सामान का नाम..."
                            className="flex-1 bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-[#0F172A] outline-none"
                          />
                          <button 
                            onClick={() => handleRemoveActiveBillItem(itemIdx)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {item.matchedCatalogItem && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                            <CheckCircle size={10} /> 1600+ लिस्ट से मैच्ड: {item.matchedCatalogItem.name}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          {/* Qty Stepper */}
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <button 
                              onClick={() => handleUpdateActiveBillItem(itemIdx, 'qty', Math.max(1, item.qty - 1))}
                              className="w-7 h-7 flex items-center justify-center font-bold text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              value={item.qty}
                              onChange={(e) => handleUpdateActiveBillItem(itemIdx, 'qty', e.target.value)}
                              className="w-10 text-center font-bold text-xs text-[#0F172A] outline-none bg-transparent"
                            />
                            <button 
                              onClick={() => handleUpdateActiveBillItem(itemIdx, 'qty', item.qty + 1)}
                              className="w-7 h-7 flex items-center justify-center font-bold text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {/* Unit Price */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">दर ₹</span>
                            <input 
                              type="number" 
                              value={item.price}
                              onChange={(e) => handleUpdateActiveBillItem(itemIdx, 'price', e.target.value)}
                              className="w-20 bg-white px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-[#0F172A] outline-none text-right"
                            />
                          </div>

                          {/* Line Total */}
                          <div className="text-right min-w-[70px]">
                            <span className="text-[10px] text-slate-400 block">कुल</span>
                            <span className="text-xs font-black text-emerald-600">₹ {Number(item.total).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Summary */}
                <div className="flex justify-between items-center border-t border-slate-200 pt-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500">
                      कुल पर्चियां: {scannedBillsBatch.length} • सामान: {scannedBillsBatch[activeScannedIndex].items.length}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">इस बिल की कुल राशि</span>
                    <span className="font-black text-xl text-[#059669]">
                      ₹ {Number(scannedBillsBatch[activeScannedIndex].totalAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      const cur = scannedBillsBatch[activeScannedIndex];
                      setBillCart(cur.items.map(i => ({ id: i.id, name: i.name, salePrice: i.price, qty: i.qty })));
                      setBillCustomer(cur.partyName);
                      setBillCustomerPhone(cur.partyPhone);
                      setBillPaymentMode(cur.paymentMode);
                      setShowScannedReviewModal(false);
                      setShowQuickBillModal(true);
                    }}
                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    ✏️ कार्ट में एडिट करें
                  </button>

                  <button
                    onClick={handleSaveAllScannedBills}
                    disabled={savingScannedBill}
                    className="py-3 bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {savingScannedBill ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    {savingScannedBill ? "सेव हो रहा है..." : (scannedBillsBatch.length > 1 ? `💾 सभी ${scannedBillsBatch.length} बिल सेव करें` : "💾 1-Click बिल बनाएं")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📱 6.2 AI API KEYS SETTINGS MODAL */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-[#0F172A]">⚙️ AI Vision API Keys</h3>
              <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  🤖 OpenAI API Key (ChatGPT 4o Mini):
                </label>
                <input 
                  type="password" 
                  placeholder="sk-proj-..." 
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  ⚡ Google Gemini API Key (2.5 / 2.0 Flash):
                </label>
                <input 
                  type="password" 
                  placeholder="AIzaSy..." 
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-mono"
                />
              </div>

              <p className="text-[10px] text-slate-400">
                * यदि आपके पास अपनी Key है तो यहाँ डालें। सिस्टम ऑटोमेटिक उपलब्ध AI से तेज बिल स्कैनिंग करता है।
              </p>
            </div>

            <button
              onClick={() => {
                localStorage.setItem("OPENAI_API_KEY", openaiApiKey.trim());
                localStorage.setItem("GEMINI_API_KEY", geminiApiKey.trim());
                alert("✨ AI Keys सुरक्षित रूप से सेव हो गई!");
                setShowApiKeyModal(false);
              }}
              className="w-full py-2.5 bg-[#4338CA] hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
            >
              सेव करें (Save Keys)
            </button>
          </div>
        </div>
      )}

      {/* 📱 6.3 ADD GHAR KHARCH / EXPENSE MODAL */}
      {showGharKharchModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 space-y-3.5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  🏡
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">खर्च दर्ज करें (+ Expense)</h3>
                  <p className="text-[10px] text-slate-400">घर खर्च (Family) या दुकान खर्च दर्ज करें</p>
                </div>
              </div>
              <button onClick={() => setShowGharKharchModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Expense Type Switcher (Ghar Kharch vs Dukaan Kharch) */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setGharKharchType("drawings")}
                className={`py-2.5 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${gharKharchType === "drawings" ? "bg-amber-600 text-white border-amber-600 shadow-md" : "bg-slate-50 border-slate-200 text-slate-700"}`}
              >
                🏡 घर खर्च (Personal / Family)
              </button>
              <button
                type="button"
                onClick={() => setGharKharchType("operating")}
                className={`py-2.5 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${gharKharchType === "operating" ? "bg-[#4338CA] text-white border-[#4338CA] shadow-md" : "bg-slate-50 border-slate-200 text-slate-700"}`}
              >
                🏢 दुकान खर्च (Business Expense)
              </button>
            </div>

            <form onSubmit={handleSaveGharKharch} className="space-y-3">
              {/* If Ghar Kharch: Select Family Member */}
              {gharKharchType === "drawings" && (
                <div className="space-y-1.5 bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80">
                  <label className="text-[11px] font-extrabold text-amber-900 block">
                    👤 फैमिली मेंबर चुनें (किसका / किसके लिए खर्च):
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-xs font-bold">
                    {[
                      { id: "Self", label: "👨‍💼 Self (खुद)" },
                      { id: "Papa", label: "👴 Papa (पिताजी)" },
                      { id: "Mummy", label: "👵 Mummy (माताजी)" },
                      { id: "Bhai", label: "👦 Bhai (भाई)" },
                      { id: "Wife", label: "👩 Wife (पत्नी)" },
                      { id: "Children", label: "👶 बच्चे (Son/Daughter)" },
                      { id: "अन्य (Custom)", label: "✏️ अन्य सदस्य" }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedFamilyMember(m.id)}
                        className={`p-2 rounded-xl text-[11px] font-bold border text-center transition cursor-pointer ${selectedFamilyMember === m.id ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white border-amber-200 text-amber-900 hover:bg-amber-100/50'}`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {selectedFamilyMember === "अन्य (Custom)" && (
                    <input
                      type="text"
                      placeholder="फैमिली मेंबर का नाम टाइप करें (उदा. दादाजी, चाचाजी, बहन)..."
                      value={customFamilyMember}
                      onChange={(e) => setCustomFamilyMember(e.target.value)}
                      className="w-full mt-2 p-2.5 bg-white border border-amber-300 rounded-xl text-xs text-[#0F172A] outline-none font-bold"
                    />
                  )}
                </div>
              )}

              {/* Amount & Category */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">खर्च राशि (₹) *</label>
                  <input
                    type="number"
                    placeholder="₹ 500"
                    value={gharKharchAmount}
                    onChange={(e) => setGharKharchAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-[#0F172A] outline-none focus:border-amber-600"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">खर्च श्रेणी (Category)</label>
                  <select
                    value={gharKharchCategory}
                    onChange={(e) => setGharKharchCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                  >
                    {gharKharchType === "drawings" ? (
                      <>
                        <option value="राशन/किराना">🛒 राशन / किराना</option>
                        <option value="स्कूल/कॉलेज फीस">🎓 स्कूल / कॉलेज फीस</option>
                        <option value="दवाई/अस्पताल">💊 दवाई / इलाज</option>
                        <option value="बिजली/पानी/गैस">⚡ बिजली / पानी / गैस</option>
                        <option value="कपड़े/शॉपिंग">👗 कपड़े / शॉपिंग</option>
                        <option value="निजी जेब खर्च">💵 व्यक्तिगत जेब खर्च</option>
                        <option value="पेट्रोल/वाहन खर्च">🚗 पेट्रोल / गाड़ी खर्च</option>
                        <option value="अन्य घरेलू खर्च">📦 अन्य घरेलू खर्च</option>
                      </>
                    ) : (
                      <>
                        <option value="दुकान किराया">🏢 दुकान किराया (Rent)</option>
                        <option value="बिजली बिल">⚡ बिजली बिल</option>
                        <option value="चाय/नाश्ता">☕ चाय / नाश्ता / पानी</option>
                        <option value="स्टाफ सैलरी/मजदूरी">👔 स्टाफ मजदूरी / एडवांस</option>
                        <option value="ट्रांसपोर्ट/भाड़ा">🚚 ट्रांसपोर्ट / माल भाड़ा</option>
                        <option value="स्टेशनरी/पैकिंग">📦 स्टेशनरी / पैकिंग</option>
                        <option value="दुकान मेंटेनेंस">🛠️ मेंटेनेंस व मरम्मत</option>
                        <option value="अन्य बिजनेस खर्च">💼 अन्य बिजनेस खर्च</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Title / Description */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">खर्च का विवरण (विवरण / Title)</label>
                <input
                  type="text"
                  placeholder={gharKharchType === "drawings" ? "उदा. महीने का राशन, पापा की दवाइयाँ, स्कूल फीस..." : "उदा. दुकान का बिजली बिल, पैकिंग रोल..."}
                  value={gharKharchTitle}
                  onChange={(e) => setGharKharchTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none font-bold"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">भुगतान माध्यम (Payment Mode)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "cash", label: "💵 नकद (Cash)" },
                    { id: "upi", label: "📲 UPI / QR" },
                    { id: "bank", label: "🏦 बैंक / चेक" }
                  ].map(pm => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setGharKharchPaymentMode(pm.id)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${gharKharchPaymentMode === pm.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={savingGharKharch}
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                {savingGharKharch ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {savingGharKharch ? "खर्च दर्ज हो रहा है..." : (gharKharchType === "drawings" ? "💾 घर खर्च सेव करें" : "💾 दुकान खर्च सेव करें")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 📱 6.4 GHAR KHARCH FAMILY LEDGER & REPORT MODAL */}
      {showGharKharchLedgerModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full p-5 space-y-3.5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  🏡
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">फैमिली घर खर्च लेजर (Ghar Kharch Ledger)</h3>
                  <p className="text-[10px] text-slate-400">Papa, Mummy व फैमिली मेंबर्स के अनुसार खर्च देखें</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    handleToggleGharKharchLedger(false);
                    setShowGharKharchModal(true);
                  }}
                  className="px-2.5 py-1 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  + नया खर्च
                </button>
                <button onClick={() => setShowGharKharchLedgerModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            {(() => {
              const allItems = gharKharchList;
              const totalAmt = allItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
              const membersMap = {};
              allItems.forEach(it => {
                const m = it.familyMember?.trim() || "Unassigned";
                membersMap[m] = (membersMap[m] || 0) + (Number(it.amount) || 0);
              });
              const uniqueMembers = Object.keys(membersMap);

              const filteredItems = gharKharchMemberFilter === "all"
                ? allItems
                : allItems.filter(it => (it.familyMember || 'Unassigned').toLowerCase() === gharKharchMemberFilter.toLowerCase());
              
              const filteredTotal = filteredItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);

              return (
                <div className="space-y-3">
                  {/* Total Banner */}
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-2xl text-white shadow-md flex justify-between items-center">
                    <div>
                      <span className="text-[11px] font-bold text-amber-100 block">कुल घर खर्च (Total Ghar Kharch)</span>
                      <span className="text-2xl font-black">₹ {totalAmt.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-amber-100 block">कुल एंट्रीज</span>
                      <span className="text-sm font-extrabold">{allItems.length} खर्च दर्ज</span>
                    </div>
                  </div>

                  {/* Family Members Breakdown Chips & Progress */}
                  {uniqueMembers.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                      <span className="text-[11px] font-extrabold text-slate-700 block">
                        👥 फैमिली मेंबर के अनुसार खर्च ब्रेकअप:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {uniqueMembers.map(m => (
                          <div key={m} className="p-2 bg-white rounded-xl border border-slate-200 text-xs">
                            <div className="flex justify-between items-center font-bold text-slate-700">
                              <span>👤 {m}</span>
                              <span className="text-amber-700 font-black">₹{membersMap[m].toLocaleString('en-IN')}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full"
                                style={{ width: `${totalAmt > 0 ? (membersMap[m] / totalAmt) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filter by Family Member Pills */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 block">सदस्य अनुसार फिल्टर करें:</span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        onClick={() => setGharKharchMemberFilter("all")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${gharKharchMemberFilter === "all" ? 'bg-[#0F172A] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        सभी सदस्य ({allItems.length})
                      </button>
                      {uniqueMembers.map(m => (
                        <button
                          key={m}
                          onClick={() => setGharKharchMemberFilter(m)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${gharKharchMemberFilter.toLowerCase() === m.toLowerCase() ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          <span>👤 {m}</span>
                          <span className="text-[10px] opacity-80">₹{membersMap[m]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expenses List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {loadingGharKharch ? (
                      <div className="p-8 text-center text-xs text-slate-400">घर खर्च लोड हो रहा है...</div>
                    ) : filteredItems.length === 0 ? (
                      <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 space-y-1">
                        <p className="font-bold text-slate-600">कोई घर खर्च नहीं मिला</p>
                        <p className="text-[10px]">ऊपर "+ नया खर्च" बटन से पहला घर खर्च दर्ज करें</p>
                      </div>
                    ) : (
                      filteredItems.map(exp => (
                        <div key={exp._id || exp.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 flex justify-between items-center transition">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-[#0F172A]">{exp.title}</span>
                              {exp.familyMember && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-md">
                                  👤 {exp.familyMember}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                              <span>🏷️ {exp.category || "घरेलू खर्च"}</span>
                              <span>•</span>
                              <span>📅 {exp.date ? new Date(exp.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }) : 'Today'}</span>
                              <span>•</span>
                              <span className="uppercase">{exp.paymentMethod || 'cash'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="font-black text-xs text-amber-800">
                              ₹ {Number(exp.amount || 0).toLocaleString('en-IN')}
                            </span>
                            <button
                              onClick={() => handleDeleteGharKharch(exp._id || exp.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 📱 7. CALCULATOR MODAL */}
      {calculatorVisible && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-[#0F172A]">कैलकुलेटर (Calculator)</h3>
              <button onClick={() => setCalculatorVisible(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="bg-slate-100 p-3 rounded-xl text-right font-mono font-black text-xl text-[#0F172A] min-h-[48px]">
              {calcInput || "0"}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {["7","8","9","/", "4","5","6","*", "1","2","3","-", "C","0","=","+"].map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "C") setCalcInput("");
                    else if (key === "=") {
                      try { setCalcInput(String(Function(`"use strict"; return (${calcInput})`)())); } catch { setCalcInput("Error"); }
                    } else setCalcInput(calcInput + key);
                  }}
                  className="py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl font-bold text-sm text-[#0F172A] cursor-pointer"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 📱 8. REFER & EARN MODAL */}
      {referralModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Gift size={18} className="text-[#6366F1]" />
                <h3 className="font-extrabold text-sm text-[#0F172A]">Refer & Earn (Flat 20% Off)</h3>
              </div>
              <button onClick={() => setReferralModalVisible(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-3 bg-[#EEF2FF] border border-[#E0E7FF] rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-[#6366F1]">EARN 20% DISCOUNT + TOKENS</span>
              <p className="text-xs font-black text-[#1E1B4B]">Share with Merchant Friends & Get Flat 20% Off</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText("https://vyaparbook.in");
                alert("रेफरल लिंक कॉपी हो गया!");
                setReferralModalVisible(false);
              }}
              className="w-full py-3 bg-[#4338CA] hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
            >
              Copy Referral Link
            </button>
          </div>
        </div>
      )}

      {/* 📱 9. ADD PARTY MODAL */}
      {showAddPartyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-[#0F172A]">+ Add Party</h3>
              <button onClick={() => setShowAddPartyModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Party Name *" 
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none font-bold"
            />
            <input 
              type="tel" 
              placeholder="Mobile Number" 
              value={newPartyPhone}
              onChange={(e) => setNewPartyPhone(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none"
            />
            <input 
              type="number" 
              placeholder="Opening Balance (₹)" 
              value={newPartyBalance}
              onChange={(e) => setNewPartyBalance(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none"
            />
            <button
              onClick={handleSaveNewParty}
              disabled={savingParty}
              className="w-full py-2.5 bg-[#4338CA] hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
            >
              {savingParty ? "Saving..." : "Save Party"}
            </button>
          </div>
        </div>
      )}

      {/* 📱 10. VYAPAR-STYLE FAST ADD ITEM MODAL (AUTOMATIC BARCODE, SKU & CATEGORY) */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
                  📦
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">नया सामान जोड़ें (+ Quick Item)</h3>
                  <p className="text-[10px] text-slate-400">सिर्फ नाम और रेट डालें • बारकोड व कोड अपने आप बनेगा</p>
                </div>
              </div>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-3">
              {/* 1. Item Name (Required) */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  📝 सामान का नाम (Item Name) *
                </label>
                <input 
                  type="text" 
                  placeholder="उदा. Asian Paint Apex 1L, Supreme Pipe 1/2 inch..." 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 rounded-2xl text-xs font-black text-[#0F172A] outline-none shadow-xs"
                  autoFocus
                  required
                />
              </div>

              {/* 2. Tax Mode Switcher: Without Tax vs With Tax */}
              <div className="space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-700">
                  <span>🛡️ टैक्स प्रकार (Tax / GST Option):</span>
                  <span className="text-[10px] text-indigo-700 font-bold">
                    {newItemTaxMode === "without_tax" ? "बिना टैक्स (Non-GST)" : `GST ${newItemGstRate}% सहित`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setNewItemTaxMode("without_tax");
                      setNewItemGstRate(0);
                    }}
                    className={`py-2 rounded-xl border transition cursor-pointer text-center ${newItemTaxMode === "without_tax" ? "bg-[#0F172A] text-white border-[#0F172A] shadow-sm font-black" : "bg-white border-slate-200 text-slate-700"}`}
                  >
                    🏷️ बिना टैक्स (Without Tax)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewItemTaxMode("with_tax");
                      if (newItemGstRate === 0) setNewItemGstRate(18);
                    }}
                    className={`py-2 rounded-xl border transition cursor-pointer text-center ${newItemTaxMode === "with_tax" ? "bg-indigo-600 text-white border-indigo-600 shadow-sm font-black" : "bg-white border-slate-200 text-slate-700"}`}
                  >
                    📑 GST टैक्स सहित (With Tax)
                  </button>
                </div>

                {/* If With Tax: Select GST Rate % */}
                {newItemTaxMode === "with_tax" && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-extrabold text-indigo-900 block">GST दर (GST Rate %):</label>
                    <div className="grid grid-cols-5 gap-1 text-xs font-bold">
                      {[0, 5, 12, 18, 28].map(rate => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            setNewItemGstRate(rate);
                            const baseP = parseFloat(newItemSalePrice) || 0;
                            if (baseP > 0) {
                              setNewItemPriceWithTax((baseP + (baseP * rate) / 100).toFixed(2));
                            }
                          }}
                          className={`py-1.5 rounded-lg border text-center transition cursor-pointer ${newItemGstRate === rate ? "bg-indigo-600 text-white border-indigo-600 shadow-xs font-black" : "bg-white border-slate-200 text-slate-700"}`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Sale Price & Purchase Rate Auto-Calc */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    💰 {newItemTaxMode === "with_tax" ? "मूल रेट (Base Rate ₹) *" : "बिक्री रेट (Sale Price ₹) *"}
                  </label>
                  <input 
                    type="number" 
                    placeholder="₹ 250" 
                    value={newItemSalePrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewItemSalePrice(val);
                      const baseP = parseFloat(val) || 0;
                      if (newItemGstRate > 0) {
                        setNewItemPriceWithTax((baseP + (baseP * newItemGstRate) / 100).toFixed(2));
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-[#0F172A] outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                {newItemTaxMode === "with_tax" ? (
                  <div>
                    <label className="text-[11px] font-extrabold text-indigo-700 block mb-1">
                      ✨ टैक्स सहित रेट (Price + Tax ₹)
                    </label>
                    <input 
                      type="number" 
                      placeholder="₹ 295" 
                      value={newItemPriceWithTax}
                      onChange={(e) => {
                        const withTax = parseFloat(e.target.value) || 0;
                        setNewItemPriceWithTax(e.target.value);
                        if (newItemGstRate > 0 && withTax > 0) {
                          setNewItemSalePrice((withTax / (1 + newItemGstRate / 100)).toFixed(2));
                        }
                      }}
                      className="w-full p-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs font-black text-indigo-900 outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                      🏷️ खरीद रेट (Cost Price ₹ - ऑप्शनल)
                    </label>
                    <input 
                      type="number" 
                      placeholder="₹ 200" 
                      value={newItemPurchasePrice}
                      onChange={(e) => setNewItemPurchasePrice(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                    />
                  </div>
                )}
              </div>

              {/* 3. Initial Stock & Unit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    📦 शुरुआती स्टॉक (Qty)
                  </label>
                  <input 
                    type="number" 
                    placeholder="10" 
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    📏 इकाई (Unit)
                  </label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                  >
                    {["Pcs", "Nos", "Kg", "Ltr", "Box", "Bag", "Ft", "Mtr", "Set", "Dozen", "Nag", "Cartoon"].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Fast Category & Brand Group Selection */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    📁 श्रेणी / ग्रुप (Category)
                  </label>
                  <input
                    type="text"
                    placeholder="General / Paints..."
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    🏷️ ब्रांड (Brand - ऑप्शनल)
                  </label>
                  <input
                    type="text"
                    placeholder="Asian, Supreme..."
                    value={newItemBrand}
                    onChange={(e) => setNewItemBrand(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                  />
                </div>
              </div>

              {/* Auto Badge Info (Like Vyapar App) */}
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[10px] text-emerald-800 space-y-0.5">
                <div className="font-bold flex items-center gap-1">
                  ✨ <span>बारकोड, SKU कोड व इनवॉइस टैक्स ऑटोमेटिक जनरेट होंगे।</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingItem}
                className="w-full py-3.5 bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white font-black text-sm rounded-2xl shadow-xl transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                {savingItem ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {savingItem ? "सामान बन रहा है..." : "💾 1-क्लिक में सामान बनाएं (Save Item)"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📱 6.6B CATEGORY PICKER MODAL */}
      {/* ======================================================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  📁
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">श्रेणी अनुसार फिल्टर (Category Filter)</h3>
                  <p className="text-[10px] text-slate-400">अपनी दुकान के अनुसार कैटेगरी चुनें</p>
                </div>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {["ALL", "General", "Paints", "Hardware", "Pipes & Fittings", "Electricals", "Sanitary", "Plywood & Beat", "Tools", ...new Set(items.map(it => it.category).filter(Boolean))].map(cat => {
                const count = cat === "ALL" ? items.length : items.filter(it => (it.category || '').toLowerCase() === cat.toLowerCase()).length;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategoryFilter(cat);
                      setShowCategoryModal(false);
                    }}
                    className={`p-3 rounded-2xl border text-left font-bold text-xs flex justify-between items-center transition cursor-pointer ${selectedCategoryFilter === cat ? "bg-[#4338CA] text-white border-[#4338CA] shadow-md" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                  >
                    <span>📁 {cat === "ALL" ? "सभी कैटेगरी (All)" : cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedCategoryFilter === cat ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📱 6.6C BRAND PICKER MODAL */}
      {/* ======================================================== */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  🏷️
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">ब्रांड अनुसार फिल्टर (Brand Filter)</h3>
                  <p className="text-[10px] text-slate-400">पसंदीदा ब्रांड के अनुसार प्रोडक्ट्स देखें</p>
                </div>
              </div>
              <button onClick={() => setShowBrandModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {["ALL", "General", "Asian Paints", "Berger", "Kamdhenu", "Astral", "Supreme", "Pidilite", "Havells", "Finolex", ...new Set(items.map(it => it.brand).filter(Boolean))].map(br => {
                const count = br === "ALL" ? items.length : items.filter(it => (it.brand || '').toLowerCase() === br.toLowerCase()).length;
                return (
                  <button
                    key={br}
                    onClick={() => {
                      setSelectedBrandFilter(br);
                      setShowBrandModal(false);
                    }}
                    className={`p-3 rounded-2xl border text-left font-bold text-xs flex justify-between items-center transition cursor-pointer ${selectedBrandFilter === br ? "bg-amber-600 text-white border-amber-600 shadow-md" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                  >
                    <span>🏷️ {br === "ALL" ? "सभी ब्रांड (All)" : br}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedBrandFilter === br ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📱 6.8 PAGARBOOK (STAFF ATTENDANCE & SALARY) MAIN MODAL  */}
      {/* ======================================================== */}
      {showPagarBookModal && (
        <div className="fixed inset-0 z-50 bg-[#F4F6F9] overflow-y-auto animate-in fade-in">
          <PagarBookHub onClose={() => handleTogglePagarBook(false)} />
        </div>
      )}

      {/* ======================================================== */}
      {/* 📱 6.8B DEDICATED STAFF CALCULATION & SALARY SLIP MODAL */}
      {/* ======================================================== */}
      {showStaffSlipModal && selectedStaffForSlip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  📄
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">{selectedStaffForSlip.name} - पूरा सैलरी हिसाब</h3>
                  <p className="text-[10px] text-slate-400">वेतन पर्ची, हाजिरी विवरण व एडवांस पासबुक</p>
                </div>
              </div>
              <button onClick={() => setShowStaffSlipModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            {/* Attendance Breakdown Box */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-black text-slate-800 block">📊 हाजिरी विवरण (Attendance Calculation):</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">माह के कुल दिन</span>
                  <span className="font-black text-slate-800">{selectedStaffForSlip.daysInMonth} दिन</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-emerald-600 block">🟢 उपस्थित (P)</span>
                  <span className="font-black text-emerald-700">{selectedStaffForSlip.presentCount} दिन</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-amber-600 block">🟡 हाफ डे (HT)</span>
                  <span className="font-black text-amber-700">{selectedStaffForSlip.halfDayCount} दिन</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-rose-600 block">🔴 अनुपस्थित (A)</span>
                  <span className="font-black text-rose-700">{selectedStaffForSlip.absentCount} दिन</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 font-semibold bg-white p-2 rounded-xl border border-slate-100">
                ⚡ कुल प्रभावी काम के दिन: <strong>{selectedStaffForSlip.effectiveWorkingDays} दिन</strong> ({selectedStaffForSlip.presentCount} पूर्ण दिन + {selectedStaffForSlip.halfDayCount * 0.5} हाफ डे)
              </p>
            </div>

            {/* Salary Calculation Formula Sheet */}
            <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 p-4 rounded-2xl border border-indigo-100 space-y-2 text-xs">
              <span className="font-black text-xs text-indigo-950 block">💰 वेतन गणना (Salary Calculation):</span>
              
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-slate-700">
                  <span>मासिक मूल वेतन (Base Salary):</span>
                  <span className="font-bold">₹{(selectedStaffForSlip.baseSalary || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>प्रति दिन दर (Daily Rate):</span>
                  <span className="font-bold">₹{selectedStaffForSlip.perDaySalary} / दिन</span>
                </div>
                <div className="flex justify-between text-indigo-900 font-bold border-t border-indigo-100/80 pt-1">
                  <span>💵 बनी हुई सैलरी ({selectedStaffForSlip.effectiveWorkingDays} दिन × ₹{selectedStaffForSlip.perDaySalary}):</span>
                  <span className="font-black">₹{(selectedStaffForSlip.earnedSalary || 0).toLocaleString('en-IN')}</span>
                </div>

                {selectedStaffForSlip.otEarnings > 0 && (
                  <div className="flex justify-between text-amber-800 font-bold">
                    <span>⏱️ ओवरटाइम वेतन (Overtime):</span>
                    <span>+₹{selectedStaffForSlip.otEarnings.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {selectedStaffForSlip.commEarnings > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>🎯 बिक्री कमीशन / इंसेंटिव:</span>
                    <span>+₹{selectedStaffForSlip.commEarnings.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-rose-700 font-bold">
                  <span>💸 बीच में लिया गया एडवांस (Advance Paid):</span>
                  <span>-₹{(selectedStaffForSlip.totalAdvance || 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center bg-indigo-600 text-white p-2.5 rounded-xl font-black text-sm mt-2 shadow-sm">
                  <span>⚖️ शुद्ध देय बाकी वेतन (Net Payable):</span>
                  <span className="text-base">₹{(selectedStaffForSlip.netPayable || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Advance & Payment History List */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-800">
                  📝 एडवांस व भुगतान पासबुक ({(selectedStaffForSlip.transactions || []).length}):
                </span>
                <button
                  onClick={() => {
                    setActionStaffTarget(selectedStaffForSlip);
                    setActionType("advance");
                    setShowStaffActionModal(true);
                  }}
                  className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-200"
                >
                  + नया एडवांस
                </button>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                {(selectedStaffForSlip.transactions || []).length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-2">इस माह कोई एडवांस या अतिरिक्त लेन-देन नहीं है</p>
                ) : (
                  selectedStaffForSlip.transactions.map((t, idx) => (
                    <div key={idx} className="p-2 bg-white rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{t.type === 'advance' ? '💸 एडवांस' : t.type === 'overtime' ? '⏱️ ओवरटाइम' : '🎯 कमीशन'}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(t.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        {t.notes && <p className="text-[10px] text-slate-500 mt-0.5">{t.notes}</p>}
                      </div>
                      <span className={`font-black ${t.debit > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {t.debit > 0 ? `-₹${t.debit}` : `+₹${t.credit}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* WhatsApp Share Button */}
            <button
              onClick={() => handleShareSalarySlipWhatsApp(selectedStaffForSlip)}
              className="w-full py-3 bg-[#25D366] hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>📲 WhatsApp पर वेतन पर्ची (Salary Slip) भेजें</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📱 6.8C QUICK ADD STAFF MODAL (NAME + SALARY = DONE!)   */}
      {/* ======================================================== */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  👤
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">नया स्टाफ जोड़ें (Add Staff)</h3>
                  <p className="text-[10px] text-slate-400">नाम व सैलरी डालें, बस हो गया!</p>
                </div>
              </div>
              <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewStaff} className="space-y-3">
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">स्टाफ का नाम (Staff Name) *</label>
                <input
                  type="text"
                  placeholder="उदा. राहुल शर्मा, मुन्ना कारीगर..."
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-[#059669]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">मासिक वेतन (Monthly Salary ₹) *</label>
                  <input
                    type="number"
                    placeholder="₹ 15000"
                    value={newStaffSalary}
                    onChange={(e) => setNewStaffSalary(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-[#0F172A] outline-none focus:border-[#059669]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">मोबाइल नंबर (वैकल्पिक)</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={newStaffMobile}
                    onChange={(e) => setNewStaffMobile(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#0F172A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">पद / भूमिका (Role / Designation)</label>
                <input
                  type="text"
                  placeholder="उदा. हेल्पर, पेंटर, सेल्समैन, कारीगर..."
                  value={newStaffPosition}
                  onChange={(e) => setNewStaffPosition(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#0F172A] outline-none"
                />
              </div>

              {/* Optional Advanced Settings (Overtime & Commission) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">⚙️ अतिरिक्त (ओवरटाइम व कमीशन - यदि लागू हो):</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="text-[9px] text-slate-500 block">OT दर (₹/घंटा)</label>
                    <input
                      type="number"
                      placeholder="₹ 50"
                      value={newStaffOtRate}
                      onChange={(e) => setNewStaffOtRate(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block">सेल्स टारगेट (₹)</label>
                    <input
                      type="number"
                      placeholder="₹ 50000"
                      value={newStaffSalesTarget}
                      onChange={(e) => setNewStaffSalesTarget(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block">कमीशन (%)</label>
                    <input
                      type="number"
                      placeholder="2%"
                      value={newStaffCommission}
                      onChange={(e) => setNewStaffCommission(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingStaff}
                className="w-full py-3.5 bg-[#059669] hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                {savingStaff ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {savingStaff ? "स्टाफ जुड़ रहा है..." : "💾 नया स्टाफ सेव करें"}
              </button>
            </form>
          </div>
        </div>
      )}

            {/* ======================================================== */}
      {/* 📱 6.8E QUICK EDIT STAFF SALARY / DAILY RATE MODAL       */}
      {/* ======================================================== */}
      {showEditStaffSalaryModal && editingStaffTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  💰
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">वेतन व दर सेट करें (Set Salary Rate)</h3>
                  <p className="text-[10px] text-slate-400">स्टाफ: {editingStaffTarget.name}</p>
                </div>
              </div>
              <button onClick={() => setShowEditStaffSalaryModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStaffSalary} className="space-y-3">
              {/* 1. Switch between Daily Wage vs Monthly Salary */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 block">वेतन का आधार चुनें (Choose Wage Type):</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingWageType("daily")}
                    className={`py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${editingWageType === "daily" ? "bg-amber-600 text-white border-amber-600 shadow-md" : "bg-slate-50 border border-slate-200 text-slate-700"}`}
                  >
                    📆 दैनिक वेतन (Daily Rate ₹/दिन)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingWageType("monthly")}
                    className={`py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${editingWageType === "monthly" ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-slate-50 border border-slate-200 text-slate-700"}`}
                  >
                    📅 मासिक वेतन (Monthly ₹/माह)
                  </button>
                </div>
              </div>

              {/* 2. Amount Input */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  {editingWageType === "daily" ? "दैनिक वेतन दर (Daily Rate ₹/दिन) *" : "मासिक कुल वेतन (Monthly Salary ₹/माह) *"}
                </label>
                <input
                  type="number"
                  placeholder={editingWageType === "daily" ? "उदा. ₹ 500 / दिन" : "उदा. ₹ 15000 / माह"}
                  value={editingSalaryAmount}
                  onChange={(e) => setEditingSalaryAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-[#0F172A] outline-none focus:border-amber-600"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {editingWageType === "daily" 
                    ? "💡 दैनिक आधार में जितने दिन काम करेगा, सीधे (दिन × दर) से हिसाब बनेगा!" 
                    : "💡 मासिक आधार में महीने के दिनों के अनुसार प्रतिदिन दर बनेगी।"}
                </p>
              </div>

              {/* 3. Paid Leaves Allowance */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
                <label className="text-[11px] font-extrabold text-emerald-950 block">
                  🎁 सवेतन छुट्टी (महीने में कितनी छुट्टियां बिना पैसे कटे मिलेंगी):
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                  {[
                    { val: "0", label: "0 (कोई नहीं)" },
                    { val: "1", label: "1 दिन" },
                    { val: "2", label: "2 दिन" },
                    { val: "4", label: "4 दिन (Weekly)" }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setEditingPaidLeaves(opt.val)}
                      className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold transition cursor-pointer border ${editingPaidLeaves === opt.val ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white border-emerald-200 text-emerald-900'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={savingEditSalary}
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                {savingEditSalary ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {savingEditSalary ? "वेतन सेव हो रहा है..." : "💾 नया वेतन व दर सेव करें"}
              </button>
            </form>
          </div>
        </div>
      )}

{/* ======================================================== */}
      {/* 📱 6.8D QUICK ACTION MODAL (ADVANCE / OVERTIME / COMM)   */}
      {/* ======================================================== */}
      {showStaffActionModal && actionStaffTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  {actionType === "advance" ? "💸" : actionType === "overtime" ? "⏱️" : "🎯"}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">
                    {actionType === "advance" ? "एडवांस पेमेंट दर्ज करें" : actionType === "overtime" ? "ओवरटाइम दर्ज करें" : "कमीशन दर्ज करें"}
                  </h3>
                  <p className="text-[10px] text-slate-400">स्टाफ: {actionStaffTarget.name}</p>
                </div>
              </div>
              <button onClick={() => setShowStaffActionModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStaffAction} className="space-y-3">
              {actionType === "overtime" && (
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">कुल घंटे (Hours)</label>
                  <input
                    type="number"
                    placeholder="उदा. 4 घंटे"
                    value={actionHours}
                    onChange={(e) => setActionHours(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">राशि (₹ Amount) *</label>
                <input
                  type="number"
                  placeholder="₹ 1000"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-[#0F172A] outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">विवरण / नोट्स (Notes)</label>
                <input
                  type="text"
                  placeholder="उदा. घर के काम हेतु लिया, रात की शिफ्ट..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingStaffAction}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                {savingStaffAction ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {savingStaffAction ? "दर्ज हो रहा है..." : "💾 सेव करें"}
              </button>
            </form>
          </div>
        </div>
      )}


      
      {/* 📱 6.10 FAST MANUAL DAILY SALE ENTRY MODAL (मैन्युअल सीधी बिक्री) */}
      {showManualSaleModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
                  💵
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">मैन्युअल दैनिक बिक्री जोड़ें (+ Direct Sale)</h3>
                  <p className="text-[10px] text-slate-400">काउंटर बिक्री बिना आइटम सर्च किए तुरंत दर्ज करें</p>
                </div>
              </div>
              <button onClick={() => setShowManualSaleModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveManualSale} className="space-y-3.5">
              {/* Sale Amount (₹) */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  💰 कुल बिक्री राशि (Sale Amount ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-base">₹</span>
                  <input
                    type="number"
                    placeholder="5000"
                    value={manualSaleAmount}
                    onChange={(e) => setManualSaleAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-3 bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 rounded-2xl text-lg font-black text-[#0F172A] outline-none shadow-xs"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Payment Mode (Cash, UPI, Udhar) */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  भुगतान माध्यम (Payment Mode) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "CASH", label: "💵 नकद (Cash)" },
                    { id: "UPI", label: "📲 UPI / QR" },
                    { id: "UDHAR", label: "📒 उधारी (Credit)" }
                  ].map(pm => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setManualSalePaymentMode(pm.id)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${manualSalePaymentMode === pm.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-black' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Customer Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">📅 तारीख (Date)</label>
                  <input
                    type="date"
                    value={manualSaleDate}
                    onChange={(e) => setManualSaleDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">👤 ग्राहक / विवरण (Optional)</label>
                  <input
                    type="text"
                    placeholder="काउंटर नकद ग्राहक..."
                    value={manualSaleCustomer}
                    onChange={(e) => setManualSaleCustomer(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                  />
                </div>
              </div>

              {/* Customer Phone (Optional) */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">📱 WhatsApp नंबर (ऑप्शनल - पर्ची भेजने हेतु)</label>
                <input
                  type="tel"
                  placeholder="10 अंकों का मोबाइल नंबर..."
                  value={manualSalePhone}
                  onChange={(e) => setManualSalePhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                />
              </div>

              {/* Description / Remarks */}
              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">📝 टिप्पणी / नोट्स (Remarks - ऑप्शनल)</label>
                <input
                  type="text"
                  placeholder="उदा. सुबह की नकद बिक्री, हार्डवेयर सामान, गल्ला काउंटर सेल..."
                  value={manualSaleNotes}
                  onChange={(e) => setManualSaleNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#0F172A] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingManualSale}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-xl transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                {savingManualSale ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {savingManualSale ? "बिक्री दर्ज हो रही है..." : "💾 बिक्री सेव करें (Save Daily Sale)"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🏢 COMPANY SELECT / SWITCH MODAL */}
      {showCompanySelectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  🏢
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">कंपनी / दुकान चुनें</h3>
                  <p className="text-[10px] text-slate-400">अपनी एक्टिव कंपनी बदलें</p>
                </div>
              </div>
              <button onClick={() => setShowCompanySelectModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(companies && companies.length > 0 ? companies : [{ _id: selectedCompany?._id, name: companyDisplayName }]).map(c => {
                const cId = c._id || c.id;
                const isSelected = selectedCompany?._id === cId || selectedCompany?.id === cId;
                return (
                  <div
                    key={cId || Math.random()}
                    onClick={() => {
                      if (selectCompany) selectCompany(c);
                      setShowCompanySelectModal(false);
                      setTimeout(() => window.location.reload(), 100);
                    }}
                    className={`p-3 rounded-2xl border flex justify-between items-center cursor-pointer transition ${isSelected ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>🏪</span>
                      <span className="text-xs">{c.name || c.companyName || "My Company"}</span>
                    </div>
                    {isSelected && <CheckCircle size={16} className="text-indigo-600" />}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowCompanySelectModal(false);
                  navigate("/company/add");
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> + नई कंपनी / दुकान जोड़ें
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function MobileVyaparApp() {
  return (
    <MobileErrorBoundary>
      <MobileVyaparAppContent />
    </MobileErrorBoundary>
  );
}
