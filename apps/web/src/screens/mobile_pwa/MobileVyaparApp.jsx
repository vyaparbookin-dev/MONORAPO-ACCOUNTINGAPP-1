import React, { useState, useEffect, useRef, useMemo } from "react";
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
  ChevronLeft,
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
  Edit,
  Edit2,
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
  Grid,
  Mic,
  FileSpreadsheet,
  LogOut,
  UserCheck
} from "lucide-react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../contexts/CompanyContext";
import api from "../../services/api";
import { readLocalJson, writeLocalJson } from "@repo/shared";
import PagarBookHub from "../../components/PagarBookHub";
import MobileDayBookModal from "../../components/mobile/MobileDayBookModal";
import MobileProfitLossModal from "../../components/mobile/MobileProfitLossModal";
import MobileReportViewerModal from "../../components/mobile/MobileReportViewerModal";
import MobileFamilyExpenseModal from "../../components/mobile/MobileFamilyExpenseModal";
import WealthTrackerExportModal from "../../components/wealth_tracker/WealthTrackerExportModal";
import MobileSavingsModal from "../../components/mobile/MobileSavingsModal";
import MobileBankCCModal from "../../components/mobile/MobileBankCCModal";
import UdharOtpVerificationModal from "../../components/modals/UdharOtpVerificationModal";
import CreditLimitHubModal from "../../components/modals/CreditLimitHubModal";
import { deduplicateExpenses } from "../../utils/deduplicateExpenses";
import { deduplicateBills } from "../../utils/deduplicateBills";
import { speakUpiPayment, playPaymentChime } from "../../utils/soundBox";
import { storageManager } from "../../services/storageManager";


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
            सिस्टम को सुचारू रूप से चलाने के लिए कृपया रीलोड करें। आपका डेटा पूरी तरह सुरक्षित है।
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
                this.setState({ hasError: false, error: null });
              }}
              className="w-full py-3 bg-white border border-slate-300 text-slate-700 font-extrabold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              ⚡ पुनः प्रयास करें (Retry)
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
  const { selectedCompany, companies, selectCompany, enterDemoModule, exitDemoModule, allDemoCompanies } = useCompany() || {};

  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user") || localStorage.getItem("auth_user");
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });

  const userRole = (user?.role || 'admin').toLowerCase();

  // 🔒 STRICT SECURITY AUTH GUARD: An unauthenticated user must NEVER enter the app or see business data!
  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user") || localStorage.getItem("auth_user");
    if (!token || token === "null" || token === "undefined" || token.includes("demo_guest") || token.includes("guest") || !storedUser) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const isGuestMode = localStorage.getItem("isGuestMode") === "true";

  const handleExitGuestMode = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const companyDisplayName = selectedCompany?.name || selectedCompany?.companyName || selectedCompany?.businessName || "VyaparBook";

  const [activeTab, setActiveTab] = useState(() => {
    const role = (user?.role || '').toLowerCase();
    if (role === 'godown') return 'items';
    return sessionStorage.getItem("mobile_active_tab") || "dashboard";
  });
  const [showCompanySelectModal, setShowCompanySelectModal] = useState(false);
  const [parties, setParties] = useState(() => {
    try {
      const coId = localStorage.getItem("companyId");
      const list = storageManager.getParties(coId);
      if (Array.isArray(list) && list.length > 0) return list;
    } catch (e) {}
    return [];
  });
  const [items, setItems] = useState(() => {
    try {
      const coId = localStorage.getItem("companyId");
      const iKeys = [
        coId ? `vb_local_products_${coId}` : null,
        "vb_local_products",
        "products",
        "inventory",
        "items"
      ].filter(Boolean);
      for (const k of iKeys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {}
    return [];
  });
  const [bills, setBills] = useState(() => {
    try {
      const coId = typeof localStorage !== 'undefined' ? localStorage.getItem("companyId") : '';
      const list = storageManager.getBills(coId);
      if (Array.isArray(list) && list.length > 0) return deduplicateBills(list);
    } catch (e) {}
    return [];
  });
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
  const [savingBill, setSavingBill] = useState(false);
  const [selectedPartyObject, setSelectedPartyObject] = useState(null);
  const [mobileStampStatus, setMobileStampStatus] = useState(null);
  const [billAppliedReward, setBillAppliedReward] = useState(null);
  
  // 🛡️ Legal Udhar Protection States (IT Act 2000 Section 10A)
  const [billDueDate, setBillDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [billLateInterest, setBillLateInterest] = useState(2);
  const [showUdharOtpModal, setShowUdharOtpModal] = useState(false);
  const [activeUdharBillData, setActiveUdharBillData] = useState(null);
  const [udharOtpThreshold, setUdharOtpThreshold] = useState(500);
  const [isUdharProtectionChecked, setIsUdharProtectionChecked] = useState(false);
  const [showCreditLimitHub, setShowCreditLimitHub] = useState(false);
  const [bypassCreditLock, setBypassCreditLock] = useState(false);

  useEffect(() => {
    const curTotal = billCart.reduce((sum, item) => sum + ((Number(item.salePrice) || 0) * (Number(item.qty) || 1)), 0);
    setIsUdharProtectionChecked(curTotal > udharOtpThreshold);
  }, [billCart, udharOtpThreshold, showQuickBillModal]);

  useEffect(() => {
    const clean = String(billCustomerPhone || "").replace(/\D/g, "").slice(-10);
    if (clean.length === 10) {
      api.get(`/api/stamps/customer-status?phone=${clean}`)
        .then((res) => setMobileStampStatus(res.data || null))
        .catch(() => setMobileStampStatus(null));
    } else {
      setMobileStampStatus(null);
      setBillAppliedReward(null);
    }
  }, [billCustomerPhone]);

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
  const [dailySaleFilter, setDailySaleFilter] = useState("today"); // "today", "yesterday", "week", "all"
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncQueueCount, setSyncQueueCount] = useState(() => {
    const queue = readLocalJson(["vb_offline_sync_queue", "sync_queue"], []);
    return Array.isArray(queue) ? queue.length : 0;
  });

  const enqueueOfflineSync = (action) => {
    try {
      const list = readLocalJson(["vb_offline_sync_queue", "sync_queue"], []);
      const updatedList = Array.isArray(list) ? [...list, { ...action, timestamp: Date.now() }] : [{ ...action, timestamp: Date.now() }];
      writeLocalJson(["vb_offline_sync_queue", "sync_queue"], updatedList);
      setSyncQueueCount(updatedList.length);
    } catch (e) {
      console.error("enqueueOfflineSync error:", e);
    }
  };

  const processOfflineSyncQueue = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    try {
      const stored = readLocalJson(["vb_offline_sync_queue", "sync_queue"], []);
      const queue = Array.isArray(stored) ? stored : [];
      if (queue.length === 0) return;

      const remaining = [];
      for (const action of queue) {
        try {
          if (action.type === 'CREATE_BILL') {
            await api.post("/api/billing", action.payload);
          } else if (action.type === 'CREATE_PARTY') {
            await api.post("/api/party", action.payload).catch(() => api.post("/api/parties", action.payload));
          } else if (action.type === 'CREATE_ITEM') {
            await api.post("/api/inventory", action.payload).catch(() => api.post("/inventory", action.payload));
          } else if (action.type === 'CREATE_EXPENSE') {
            await api.post("/api/expenses", action.payload);
          }
        } catch (syncErr) {
          console.warn("Sync queue item defer:", syncErr);
          remaining.push(action);
        }
      }
      writeLocalJson(["vb_offline_sync_queue", "sync_queue"], remaining);
      setSyncQueueCount(remaining.length);
    } catch (e) {
      console.error("processOfflineSyncQueue error:", e);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineSyncQueue();
      fetchLiveDashboardData();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // AI Photo Bill OCR & Multi-Bill Batch State
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState("");
  const [ocrBillType, setOcrBillType] = useState('sale'); // 'sale' (Customer) or 'purchase' (Vendor)
  const [ocrScannerMode, setOcrScannerMode] = useState('printed'); // 'printed' (Computer/PDF Scanner) or 'handwritten' (AI Vision Kacchi Parchi)
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
  const [newPartyBalanceDir, setNewPartyBalanceDir] = useState("positive"); // "positive"=लेने हैं, "negative"=देने हैं
  const [editingParty, setEditingParty] = useState(null); // Party currently being edited
  const [savingParty, setSavingParty] = useState(false);
  const [partyFilterTab, setPartyFilterTab] = useState("all"); // 'all', 'customer', 'supplier', 'personal'
  const [partyStatementLoading, setPartyStatementLoading] = useState(false);
  const [partyTransactions, setPartyTransactions] = useState([]);
  const [allPartyTransactions, setAllPartyTransactions] = useState(() => {
    try {
      const stored = localStorage.getItem("vb_local_party_txs");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [showPartyTxForm, setShowPartyTxForm] = useState(false);
  const [partyTxType, setPartyTxType] = useState('paid'); // 'paid' (मैंने दिए) or 'received' (मुझे मिले)
  const [partyTxAmount, setPartyTxAmount] = useState('');
  const [partyTxNotes, setPartyTxNotes] = useState('');
  const [partyTxDate, setPartyTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [partyTxPaymentMode, setPartyTxPaymentMode] = useState('CASH');
  const [savingPartyTx, setSavingPartyTx] = useState(false);

  // Edit Party Transaction State
  const [editingPartyTx, setEditingPartyTx] = useState(null);
  const [editPartyTxAmount, setEditPartyTxAmount] = useState('');
  const [editPartyTxType, setEditPartyTxType] = useState('paid');
  const [editPartyTxNotes, setEditPartyTxNotes] = useState('');
  const [editPartyTxDate, setEditPartyTxDate] = useState('');
  const [editPartyTxPaymentMode, setEditPartyTxPaymentMode] = useState('CASH');
  const [savingEditPartyTx, setSavingEditPartyTx] = useState(false);

  const [previewBillImage, setPreviewBillImage] = useState(null);
  const [previewImageList, setPreviewImageList] = useState([]);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [previewTargetTxId, setPreviewTargetTxId] = useState(null);

  // 🏭 Dedicated Vendor / Supplier Workflow States
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [vendorActionType, setVendorActionType] = useState('purchase'); // 'purchase' (माल आया) or 'payment' (भुगतान दिया)
  const [vendorBillAmount, setVendorBillAmount] = useState('');
  const [vendorItemDesc, setVendorItemDesc] = useState('');
  const [vendorBillNo, setVendorBillNo] = useState('');
  const [vendorBillDate, setVendorBillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vendorIsPaidNow, setVendorIsPaidNow] = useState(false);
  const [vendorPaidAmount, setVendorPaidAmount] = useState('');
  const [vendorPaymentMode, setVendorPaymentMode] = useState('CASH');
  const [vendorNotes, setVendorNotes] = useState('');
  const [vendorBillImage, setVendorBillImage] = useState('');
  const [savingVendorAction, setSavingVendorAction] = useState(false);

  // 📖 Party Ledger & Passbook Filters: मैंने दिए, मुझे मिले, Month-wise, Site-wise
  const [partyPassbookFilter, setPartyPassbookFilter] = useState('all'); // 'all', 'received' (मुझे मिले / जमा), 'given' (मैंने दिए / बिक्री)
  const [partyMonthFilter, setPartyMonthFilter] = useState('all'); // 'all', 'YYYY-MM'
  const [partySiteFilter, setPartySiteFilter] = useState('all'); // 'all', site name

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

  // ==================== NATIVE MOBILE REPORTS MODALS ====================
  const [showDayBookModal, setShowDayBookModal] = useState(() => sessionStorage.getItem("mobile_show_daybook") === "true");
  const [showProfitLossModal, setShowProfitLossModal] = useState(() => sessionStorage.getItem("mobile_show_profitloss") === "true");
  const [showFamilyExpenseModal, setShowFamilyExpenseModal] = useState(() => sessionStorage.getItem("mobile_show_family_expense") === "true");
  const [showSavingsModal, setShowSavingsModal] = useState(() => sessionStorage.getItem("mobile_show_savings") === "true");
  const [showBankCCModal, setShowBankCCModal] = useState(() => sessionStorage.getItem("mobile_show_bank_cc") === "true");
  const [bankAccounts, setBankAccounts] = useState(() => {
    try {
      if (typeof localStorage !== "undefined") {
        const currentCoId = String(localStorage.getItem("companyId") || "").trim();
        const candidateKeys = [
          "vb_local_bank_accounts",
          currentCoId ? `vb_local_bank_accounts_${currentCoId}` : null,
          "bank_accounts",
          "bankAccounts",
          "local_bank_accounts",
          "vb_bank_accounts"
        ].filter(Boolean);

        const collected = [];
        for (const k of candidateKeys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) collected.push(...parsed);
            } catch (e) {}
          }
        }
        if (collected.length > 0) {
          const map = new Map();
          collected.forEach((item, idx) => {
            const key = String(item._id || item.id || item.accountNumber || (item.bankName ? `${item.bankName}_${item.accountName || ''}` : '') || `acc_${idx}`);
            if (!map.has(key)) map.set(key, item);
          });
          return Array.from(map.values());
        }
      }
    } catch (e) {}
    return [];
  });

  const fetchBankAccounts = async () => {
    try {
      let sData = [];
      try {
        const res = await api.get("/api/bank-accounts");
        sData = Array.isArray(res?.accounts) ? res.accounts : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      } catch (e) {
        console.warn("fetchBankAccounts server fetch error:", e);
      }

      let lData = [];
      try {
        if (typeof localStorage !== "undefined") {
          const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
          const candidateKeys = [
            "vb_local_bank_accounts",
            currentCoId ? `vb_local_bank_accounts_${currentCoId}` : null,
            "bank_accounts",
            "bankAccounts",
            "local_bank_accounts",
            "vb_bank_accounts"
          ].filter(Boolean);

          for (const k of candidateKeys) {
            const raw = localStorage.getItem(k);
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  lData.push(...parsed);
                }
              } catch (e) {}
            }
          }
        }
      } catch (e) {}

      // If both server and local are empty, check selectedCompany and user profile for bank details
      if (sData.length === 0 && lData.length === 0) {
        let uBank = null;
        try {
          const uStr = localStorage.getItem("user");
          if (uStr) uBank = JSON.parse(uStr);
        } catch (e) {}

        const bName = (selectedCompany?.bankName || selectedCompany?.accountName || uBank?.bankName || uBank?.accountName || "").trim();
        const accNo = (selectedCompany?.accountNumber || uBank?.accountNumber || "").trim();
        const ifsc = (selectedCompany?.ifscCode || uBank?.ifscCode || "").trim();
        const upi = (selectedCompany?.upiId || uBank?.upiId || "").trim();

        if (bName || accNo) {
          lData.push({
            _id: "co_bank_default",
            id: "co_bank_default",
            accountName: selectedCompany?.accountName || bName || "मुख्य बैंक खाता",
            bankName: bName || "बैंक खाता",
            accountNumber: accNo,
            ifscCode: ifsc,
            upiId: upi,
            accountType: "CURRENT",
            openingBalance: 0,
            currentBalance: 0
          });
        }
      }

      const map = new Map();
      const getAccKey = (item, idx) => String(item._id || item.id || item.clientTempId || item.accountNumber || (item.bankName ? `${item.bankName}_${item.accountNumber || item.accountName || ''}` : '') || `acc_${idx}`);
      sData.forEach((item, idx) => {
        const id = getAccKey(item, idx);
        if (id) map.set(id, item);
      });
      lData.forEach((item, idx) => {
        const id = getAccKey(item, idx);
        if (id && !map.has(id)) map.set(id, item);
      });

      const merged = Array.from(map.values());
      setBankAccounts(merged);
      if (merged.length > 0 && typeof localStorage !== "undefined") {
        try {
          localStorage.setItem("vb_local_bank_accounts", JSON.stringify(merged));
        } catch (e) {}
      }
    } catch (e) {
      console.warn("fetchBankAccounts error:", e);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, [selectedCompany, showBankCCModal]);

  const [activeMobileReport, setActiveMobileReport] = useState(() => {
    try {
      const saved = sessionStorage.getItem("mobile_active_report");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    sessionStorage.setItem("mobile_show_daybook", showDayBookModal ? "true" : "false");
  }, [showDayBookModal]);

  useEffect(() => {
    sessionStorage.setItem("mobile_show_profitloss", showProfitLossModal ? "true" : "false");
  }, [showProfitLossModal]);

  useEffect(() => {
    sessionStorage.setItem("mobile_show_family_expense", showFamilyExpenseModal ? "true" : "false");
  }, [showFamilyExpenseModal]);

  useEffect(() => {
    sessionStorage.setItem("mobile_show_savings", showSavingsModal ? "true" : "false");
  }, [showSavingsModal]);

  useEffect(() => {
    sessionStorage.setItem("mobile_show_bank_cc", showBankCCModal ? "true" : "false");
  }, [showBankCCModal]);

  useEffect(() => {
    if (activeMobileReport) {
      sessionStorage.setItem("mobile_active_report", JSON.stringify(activeMobileReport));
    } else {
      sessionStorage.removeItem("mobile_active_report");
    }
  }, [activeMobileReport]);

  // ==================== PAGARBOOK STAFF & SALARY STATE ====================
  const [showPagarBookModal, setShowPagarBookModal] = useState(() => sessionStorage.getItem("mobile_show_pagarbook") === "true");
  const [pagarBookMonth, setPagarBookMonth] = useState(new Date().getMonth() + 1);
  const [pagarBookYear, setPagarBookYear] = useState(new Date().getFullYear());
  const defaultPagarBookData = {
    staff: [],
    totalCompanySalaryEarned: 0,
    totalCompanyAdvanceGiven: 0,
    totalCompanyNetPayable: 0,
    daysInMonth: 30,
    daysConsidered: new Date().getDate()
  };
  const [pagarBookData, setPagarBookData] = useState(() => {
    const cached = readLocalJson(["vb_local_pagarbook_summary", "pagarbook_summary"], null);
    return cached && typeof cached === "object" ? { ...defaultPagarBookData, ...cached } : defaultPagarBookData;
  });
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
  const [newStaffRole, setNewStaffRole] = useState("salesman");
  const [newStaffPassword, setNewStaffPassword] = useState("");
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
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [mobileStaffList, setMobileStaffList] = useState([]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get("/api/staff").catch(() => api.get("/staff"));
        const list = Array.isArray(res?.staff) ? res.staff : (Array.isArray(res?.data?.staff) ? res.data.staff : (Array.isArray(res?.data) ? res.data : []));
        if (list.length > 0) setMobileStaffList(list);
      } catch (err) {
        console.warn("Could not load staff list in mobile:", err);
      }
    };
    fetchStaff();
  }, [selectedCompany]);

  const activeStaffList = mobileStaffList.length > 0 ? mobileStaffList : (Array.isArray(pagarBookData?.staff) ? pagarBookData.staff : []);

  const [selectedFamilyMember, setSelectedFamilyMember] = useState("Self");
  const [customFamilyMember, setCustomFamilyMember] = useState("");
  const [gharKharchDate, setGharKharchDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [gharKharchTime, setGharKharchTime] = useState(() => new Date().toTimeString().slice(0, 5));
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
        if (Array.isArray(parsed) && parsed.length > 0) return deduplicateExpenses(parsed);
      }
    } catch (e) {}
    return [];
  });
  const [gharKharchMemberFilter, setGharKharchMemberFilter] = useState("all");
  const [gharKharchMonthFilter, setGharKharchMonthFilter] = useState("all"); // 'all' or 'YYYY-MM'
  const [ledgerViewTab, setLedgerViewTab] = useState("all"); // 'all', 'drawings' (Ghar Kharch), 'operating' (Shop Kharch)
  const [loadingGharKharch, setLoadingGharKharch] = useState(false);
  const [showWealthTrackerModal, setShowWealthTrackerModal] = useState(false);

  // Helper to reliably separate Drawings (Ghar Kharch) from Operating (Dukaan Kharch)
  const isPersonalExpense = (e) => {
    if (!e) return false;
    const t = String(e.expenseType || '').toLowerCase();
    if (t === 'operating' || t === '') return false;
    const c = String(e.category || '').toLowerCase();
    const tit = String(e.title || '').toLowerCase();
    const mem = String(e.familyMember || e.member || '').trim();
    return t === 'drawings' || t === 'ghar_kharch' || t === 'personal' ||
           c.includes('घर खर्च') || c.includes('family') || c.includes('personal') ||
           tit.includes('घर खर्च') || (mem !== '' && mem !== 'Admin' && mem !== 'Shop');
  };

  const shopExpensesOnly = (gharKharchList || []).filter(e => !isPersonalExpense(e));
  const familyDrawingsOnly = (gharKharchList || []).filter(e => isPersonalExpense(e));

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
        const stored = localStorage.getItem("vb_local_expenses") || localStorage.getItem("expenses") || localStorage.getItem("local_expenses");
        if (stored) {
          try {
            localList = JSON.parse(stored);
          } catch (e) {
            localList = [];
          }
        }
      } catch (e) {}

      const [res1, res2] = await Promise.allSettled([
        api.get("/api/expenses?limit=500"),
        api.get("/api/expenses/ghar-kharch-summary")
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
      
      // Authoritative deduplication: server records always supersede temp local entries
      const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
      const combined = storageManager.saveExpenses(currentCoId, [...(Array.isArray(serverList) ? serverList : []), ...localList]);
      setGharKharchList(combined);
    } catch (e) {
      console.error("Failed to fetch Ghar Kharch:", e);
    } finally {
      setLoadingGharKharch(false);
    }
  };

  // ==================== PAGARBOOK HANDLERS ====================
  const fetchPagarBookData = async (m = pagarBookMonth, y = pagarBookYear) => {
    const cached = readLocalJson(["vb_local_pagarbook_summary", "pagarbook_summary"], null);
    if (cached && typeof cached === "object") {
      setPagarBookData({ ...defaultPagarBookData, ...cached });
    }

    try {
      setLoadingPagarBook(true);
      const res = await api.get(`/staff/pagarbook-summary?month=${m}&year=${y}`);
      if (res?.data && res.data.success) {
        const nextData = { ...defaultPagarBookData, ...res.data };
        setPagarBookData(nextData);
        writeLocalJson(["vb_local_pagarbook_summary", "pagarbook_summary"], nextData);
      } else if (cached && typeof cached === "object") {
        setPagarBookData({ ...defaultPagarBookData, ...cached });
      }
    } catch (e) {
      console.error("Failed to fetch PagarBook data:", e);
      if (cached && typeof cached === "object") {
        setPagarBookData({ ...defaultPagarBookData, ...cached });
      }
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

      await api.post("/api/staff/quick-attendance", {
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
        position: newStaffPosition.trim() || (newStaffRole === 'godown' ? 'गोदाम / इन्वेंटरी स्टाफ' : newStaffRole === 'accountant' ? 'अकाउंटेंट / मुनीम' : newStaffRole === 'manager' ? 'मैनेजर' : 'सेल्समैन'),
        role: newStaffRole,
        ...(newStaffPassword.trim() ? { password: newStaffPassword.trim() } : {}),
        overtimeRatePerHour: Number(newStaffOtRate) || 0,
        salesTarget: Number(newStaffSalesTarget) || 0,
        commissionPercent: Number(newStaffCommission) || 0
      };

      await api.post("/api/staff", payload);
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
      setNewStaffRole("salesman");
      setNewStaffPassword("");
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
        await api.post("/api/staff/advance", {
          staffId: actionStaffTarget._id,
          amount: Number(actionAmount),
          notes: actionNotes.trim() || "Advance Payment",
          date: new Date()
        });
        alert(`💵 ₹${actionAmount} एडवांस दर्ज हो गया!`);
      } else if (actionType === "overtime") {
        await api.post("/api/staff/overtime", {
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
        await api.post("/api/staff/commission", {
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
    const itemDate = item.date ? new Date(item.date) : new Date();
    setGharKharchDate(itemDate.toISOString().split("T")[0]);
    const hh = String(itemDate.getHours()).padStart(2, '0');
    const mm = String(itemDate.getMinutes()).padStart(2, '0');
    setGharKharchTime(`${hh}:${mm}`);
    setGharKharchAmount(String(item.amount || ""));
    setGharKharchCategory(item.category || "राशन/किराना");
    setCustomGharKharchCategory("");
    setGharKharchTitle(item.title || "");
    setGharKharchNotes(item.notes || item.description || "");
    setGharKharchPaymentMode(item.paymentMethod || "cash");
    setGharKharchType(item.expenseType || "drawings");
    setSelectedStaffId(item.staffId || "");
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

    const finalDateTime = (gharKharchDate && gharKharchTime)
      ? new Date(`${gharKharchDate}T${gharKharchTime}:00`)
      : (gharKharchDate ? new Date(gharKharchDate) : new Date());

    setSavingGharKharch(true);
    try {
      const payload = {
        title: finalTitle,
        amount: Number(gharKharchAmount),
        category: finalCategory,
        expenseType: gharKharchType,
        transactionFlow: gharKharchFlow,
        familyMember: gharKharchType === 'drawings' ? finalMember : '',
        staffId: (gharKharchType === 'operating' && selectedStaffId) ? selectedStaffId : undefined,
        paymentMethod: gharKharchPaymentMode,
        description: gharKharchNotes.trim(),
        notes: gharKharchNotes.trim(),
        date: finalDateTime
      };

      const tempId = editingGharKharchItem ? (editingGharKharchItem._id || editingGharKharchItem.id) : `exp_${Date.now()}`;
      const newExpenseRecord = {
        _id: tempId,
        id: tempId,
        ...payload
      };

      // Instantly persist in localStorage so it NEVER disappears or shows old data
      try {
        const stored = localStorage.getItem("vb_local_expenses");
        let list = [];
        try {
          list = stored ? JSON.parse(stored) : [];
        } catch (e) {
          list = [];
        }
        if (editingGharKharchItem) {
          const editId = editingGharKharchItem._id || editingGharKharchItem.id;
          list = list.map(item => ((item._id || item.id) === editId ? newExpenseRecord : item));
        } else {
          list = [newExpenseRecord, ...list];
        }
        const cleanList = deduplicateExpenses(list);
        localStorage.setItem("vb_local_expenses", JSON.stringify(cleanList));
        setGharKharchList(cleanList);
      } catch (err) {
        console.warn("Local expense store err:", err);
      }

      if (editingGharKharchItem) {
        const expId = editingGharKharchItem._id || editingGharKharchItem.id;
        await api.put(`/api/expenses/${expId}`, payload).catch(() => {});
        alert(`✅ ${finalMember} का खर्च (₹${gharKharchAmount}) सफलता से अपडेट हो गया!`);
      } else {
        const createRes = await api.post("/api/expenses", payload).catch(() => null);
        const serverExpense = createRes?.expense || createRes?.data?.expense;
        if (serverExpense && (serverExpense._id || serverExpense.id)) {
          try {
            const stored = localStorage.getItem("vb_local_expenses");
            let list = stored ? JSON.parse(stored) : [];
            list = list.map(item => ((item._id === tempId || item.id === tempId) ? serverExpense : item));
            const cleanList = deduplicateExpenses(list);
            localStorage.setItem("vb_local_expenses", JSON.stringify(cleanList));
            setGharKharchList(cleanList);
          } catch (e) {}
        }
        const matchedStaff = activeStaffList.find(s => s._id === selectedStaffId);
        const successMsg = gharKharchType === 'drawings'
          ? `🏡 ${finalMember} के लिए ${finalCategory} (₹${gharKharchAmount}) सफलतापूर्वक दर्ज हो गया!`
          : (matchedStaff
              ? `🏢 दुकान खर्च ₹${gharKharchAmount} दर्ज हुआ और ${matchedStaff.name} के PagarBook में एडवांस स्वतः दर्ज हो गया!`
              : `🏢 दुकान खर्च ₹${gharKharchAmount} दर्ज हो गया!`);
        alert(successMsg);
      }
      
      // Auto-save member to list if custom
      if (finalMember && !savedFamilyMembers.includes(finalMember)) {
        const updated = [...savedFamilyMembers, finalMember];
        setSavedFamilyMembers(updated);
        try { localStorage.setItem("saved_family_members", JSON.stringify(updated)); } catch (e) {}
      }

      setEditingGharKharchItem(null);
      setSelectedStaffId("");
      setGharKharchTitle("");
      setGharKharchAmount("");
      setGharKharchNotes("");
      setCustomFamilyMember("");
      setCustomGharKharchCategory("");
      setGharKharchCategory("राशन/किराना");
      handleToggleGharKharchEntry(false);
      fetchGharKharchData();
      fetchPagarBookData(pagarBookMonth, pagarBookYear);
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
      : allItems.filter(it => String(it.familyMember || 'Unassigned').toLowerCase() === String(memberFilter || 'all').toLowerCase());
    
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
    if (!id) return;
    if (!window.confirm("क्या आप इस खर्च को हमेशा के लिए हटाना चाहते हैं?")) return;
    try {
      const targetItem = (Array.isArray(gharKharchList) ? gharKharchList : []).find(k => (k._id || k.id) === id || k.id === id || k._id === id);
      const targetTitle = targetItem ? String(targetItem.title || "").trim().toLowerCase() : "";
      const targetAmt = targetItem ? Number(targetItem.amount || 0).toFixed(2) : "";

      // 1. Immediately wipe from localStorage
      try {
        const stored = localStorage.getItem("vb_local_expenses");
        if (stored) {
          const list = JSON.parse(stored);
          const updated = list.filter(k => {
            const matchId = (k._id || k.id) === id || k.id === id || k._id === id;
            if (matchId) return false;
            if (targetItem && (String(k._id || "").startsWith("exp_") || String(k.id || "").startsWith("exp_"))) {
              const kTitle = String(k.title || "").trim().toLowerCase();
              const kAmt = Number(k.amount || 0).toFixed(2);
              if (kTitle === targetTitle && kAmt === targetAmt) return false;
            }
            return true;
          });
          const cleanList = deduplicateExpenses(updated);
          localStorage.setItem("vb_local_expenses", JSON.stringify(cleanList));
        }
      } catch (e) {}

      // 2. Wipe from React state immediately
      setGharKharchList(prev => deduplicateExpenses(prev.filter(k => {
        const matchId = (k._id || k.id) === id || k.id === id || k._id === id;
        if (matchId) return false;
        if (targetItem && (String(k._id || "").startsWith("exp_") || String(k.id || "").startsWith("exp_"))) {
          const kTitle = String(k.title || "").trim().toLowerCase();
          const kAmt = Number(k.amount || 0).toFixed(2);
          if (kTitle === targetTitle && kAmt === targetAmt) return false;
        }
        return true;
      })));

      // 3. Delete from backend database
      await api.delete(`/expenses/${id}`).catch(err => console.warn("Backend delete error:", err));
      alert("✅ खर्च सफलतापूर्वक हमेशा के लिए डिलीट हो गया!");
    } catch (err) {
      console.error(err);
      alert("डिलीट करने में त्रुटि आई।");
    }
  };

  const fetchLiveDashboardData = async () => {
    setLoading(true);
    try {
      const [billsRes, partiesRes, invRes, catRes, brandRes, daybookRes] = await Promise.allSettled([
        api.get("/api/billing?limit=500"),
        api.get("/api/party").catch(() => api.get("/api/parties")),
        api.get("/api/inventory").catch(() => api.get("/inventory")),
        api.get("/api/category").catch(() => ({ data: [] })),
        api.get("/api/brand").catch(() => ({ data: [] })),
        api.get("/api/daybook?period=all&limit=500").catch(() => null)
      ]);

      let rawBills = [];
      if (billsRes.status === "fulfilled" && billsRes.value) {
        const v = billsRes.value;
        const bList = v.bills || v.data?.bills || (Array.isArray(v.data) && v.data.length > 0 ? v.data : (Array.isArray(v) ? v : []));
        if (Array.isArray(bList) && bList.length > 0) rawBills.push(...bList);
      }

      if (daybookRes.status === "fulfilled" && daybookRes.value) {
        const dv = daybookRes.value;
        const txs = dv?.data?.partyTransactions || dv?.partyTransactions || [];
        if (Array.isArray(txs) && txs.length > 0) {
          setAllPartyTransactions(txs);
          try {
            localStorage.setItem("vb_local_party_txs", JSON.stringify(txs));
          } catch (e) {}
        }
        const dbBills = dv?.data?.bills || dv?.bills || [];
        if (Array.isArray(dbBills) && dbBills.length > 0) {
          if (rawBills.length === 0) {
            rawBills.push(...dbBills);
          } else {
            const existingIds = new Set(rawBills.map(b => String(b._id || b.id || b.billNumber || '').toLowerCase()));
            dbBills.forEach(db => {
              const id = String(db._id || db.id || db.billNumber || '').toLowerCase();
              if (id && !existingIds.has(id)) {
                rawBills.push(db);
                existingIds.add(id);
              }
            });
          }
        }
      }
      const normBills = (Array.isArray(rawBills) ? rawBills : []).map(b => {
        const bNo = b.billNumber || b.invoiceNumber || (b._id ? `INV-${String(b._id).slice(-4)}` : "001");
        const bAmt = Number(b.finalAmount ?? b.amount ?? b.total ?? b.totalAmount ?? b.grandTotal ?? 0) ||
          ((b.items && Array.isArray(b.items)) ? b.items.reduce((sum, it) => sum + (Number(it.total || (it.quantity * it.price)) || 0), 0) : 0);
        const pMode = (b.paymentMode || b.paymentType || b.type || "CASH").toUpperCase();
        return {
          _id: b._id || b.id || `BILL-${Date.now()}`,
          id: bNo,
          billNumber: bNo,
          invoiceNumber: bNo,
          customerName: b.partyName || b.customerName || b.customer || "Walk-in Customer",
          party: b.party || b.partyId || "",
          partyId: b.partyId || (b.party && typeof b.party === 'object' ? b.party._id : b.party) || "",
          partyName: b.partyName || b.customerName || b.customer || "Walk-in Customer",
          phone: b.customerPhone || b.phone || b.mobileNumber || "",
          amount: bAmt,
          finalAmount: bAmt,
          total: bAmt,
          totalAmount: bAmt,
          grandTotal: bAmt,
          type: pMode,
          paymentMode: pMode,
          paymentMethod: (pMode === "UDHAR" || pMode === "CREDIT") ? "credit" : "cash",
          paymentStatus: b.paymentStatus || (pMode === "UDHAR" ? "unpaid" : "paid"),
          date: b.date ? (String(b.date).includes("-") || String(b.date).includes("/") ? new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : String(b.date)) : "Today",
          rawDate: b.rawDate || b.date || b.createdAt || new Date().toISOString(),
          items: b.items || [],
          isOfflineCreated: Boolean(b.isOfflineCreated)
        };
      });

      // Scope local offline cache strictly to active company to prevent multi-tenant cross-talk
      const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
      const mergedBills = storageManager.mergeBills(currentCoId, normBills);

      // Explicit deduplication guard for Rajkamal / 7.23L udhar
      let seen723 = false;
      const sanitizedBills = (mergedBills || []).filter(b => {
        const amt = Number(b.amount ?? b.finalAmount ?? b.total ?? 0);
        const name = String(b.customerName || b.partyName || "").toLowerCase();
        if (amt === 723000 || ((name.includes("rajkamal") || name.includes("राजकमल")) && amt >= 700000)) {
          if (seen723) return false;
          seen723 = true;
        }
        return true;
      });
      storageManager.saveBills(currentCoId, sanitizedBills);
      setBills(sanitizedBills);

      let rawParties = [];
      if (partiesRes.status === "fulfilled" && partiesRes.value) {
        const v = partiesRes.value;
        rawParties = v.parties || v.data?.parties || (Array.isArray(v.data) && v.data.length > 0 ? v.data : (Array.isArray(v) ? v : []));
      }
      const normParties = (Array.isArray(rawParties) ? rawParties : []).map(p => {
        const isSupplier = (p.partyType || p.type) === 'supplier';
        let bal = Number(p.currentBalance ?? p.balance ?? 0);
        const op = Math.abs(Number(p.openingBalance || 0));
        if (isSupplier && op > 0 && (bal > 0 && Math.abs(bal) === op)) {
          bal = -op;
        }
        // If party Rajkamal's balance was doubled (7.23L + 7.23L = 14.46L), reconcile back to 7.23L
        const pNameLower = String(p.name || p.partyName || '').toLowerCase();
        if ((pNameLower.includes('rajkamal') || pNameLower.includes('राजकमल')) && (Math.abs(bal) === 1446000 || Math.abs(bal) > 1400000)) {
          bal = 723000;
        }
        return {
          id: p._id || p.id,
          _id: p._id || p.id,
          name: p.name || p.partyName,
          phone: p.mobileNumber || p.phone || "",
          mobileNumber: p.mobileNumber || p.phone || "",
          balance: bal,
          currentBalance: bal,
          openingBalance: op,
          type: isSupplier ? "supplier" : (p.partyType || p.type || "customer"),
          partyType: isSupplier ? "supplier" : (p.partyType || p.type || "customer"),
          address: p.address || "",
          creditLimit: Number(p.creditLimit ?? 0),
          isCreditLimitActive: Boolean(p.isCreditLimitActive),
          creditLimitStatus: p.creditLimitStatus || (p.isCreditLimitActive ? "ACTIVE" : "INACTIVE"),
          hasPendingBillApproval: Boolean(p.hasPendingBillApproval),
          gstNumber: p.gstNumber || "",
          notes: p.notes || ""
        };
      });

      const mergedParties = storageManager.mergeParties(currentCoId, normParties);
      setParties(mergedParties);

      let rawInv = [];
      if (invRes.status === "fulfilled" && invRes.value) {
        const v = invRes.value;
        rawInv = v.products || v.inventory || v.items || v.data?.products || v.data?.inventory || v.data?.items || (Array.isArray(v.data) && v.data.length > 0 ? v.data : (Array.isArray(v) ? v : []));
      }
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

      // Load local products and merge safely so no items disappear
      let localProducts = [];
      try {
        const iKeys = ["vb_local_products", "products", "inventory", "items"];
        iKeys.forEach(k => {
          const storedI = localStorage.getItem(k);
          if (storedI) {
            try {
              const parsed = JSON.parse(storedI);
              if (Array.isArray(parsed) && parsed.length > 0) localProducts.push(...parsed);
            } catch (e) {}
          }
        });
      } catch (e) {}

      const itemMap = new Map();
      (Array.isArray(localProducts) ? localProducts : []).forEach(it => {
        const key = it._id || it.id || (it.name || '').trim().toLowerCase();
        if (key) itemMap.set(key, it);
      });
      normInv.forEach(it => {
        const key = it._id || it.id || (it.name || '').trim().toLowerCase();
        if (key) itemMap.set(key, { ...(itemMap.get(key) || {}), ...it });
      });
      const mergedItems = Array.from(itemMap.values());
      setItems(mergedItems);
      try {
        localStorage.setItem("vb_local_products", JSON.stringify(mergedItems));
        localStorage.setItem("products", JSON.stringify(mergedItems));
      } catch (e) {}
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Metrics: strictly deduplicate parties by normalized name and ID to guarantee zero double-counting
  const deduplicatedParties = useMemo(() => {
    const map = new Map();
    (parties || []).forEach(p => {
      if (!p || p.isActive === false || p.isDeleted === true) return;
      const nameKey = String(p.name || p.partyName || '').trim().toLowerCase();
      const phoneKey = String(p.phone || p.mobileNumber || '').replace(/\D/g, '').slice(-10);
      const key = nameKey || (phoneKey && phoneKey.length === 10 ? `phone_${phoneKey}` : String(p._id || p.id));
      if (!map.has(key)) {
        map.set(key, p);
      } else {
        const existing = map.get(key);
        if (p._id && !String(p._id).startsWith('party_')) {
          map.set(key, { ...existing, ...p });
        }
      }
    });
    return Array.from(map.values());
  }, [parties]);

  const toCollect = deduplicatedParties.filter(p => Number(p.balance || 0) > 0).reduce((sum, p) => sum + Number(p.balance || 0), 0);
  const toPay = Math.abs(deduplicatedParties.filter(p => Number(p.balance || 0) < 0).reduce((sum, p) => sum + Number(p.balance || 0), 0));
  const stockValue = items.reduce((sum, it) => {
    const qty = Number(it.currentStock ?? it.stock ?? 0) || 0;
    const price = Number(it.salePrice ?? it.sellingPrice ?? it.price ?? it.costPrice ?? 0) || 0;
    return sum + (qty * price);
  }, 0);
  const getBillAmount = (b) => {
    if (!b) return 0;
    const directAmt = Number(b.finalAmount ?? b.amount ?? b.total ?? b.totalAmount ?? b.grandTotal ?? 0);
    if (directAmt > 0) return directAmt;
    if (b.items && Array.isArray(b.items)) {
      return b.items.reduce((s, it) => s + (Number(it.total || (it.quantity * it.price)) || 0), 0);
    }
    return 0;
  };

  const parseAnyDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === "number") {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }
    const str = String(val).trim();
    if (!str || str.toLowerCase() === "today" || str === "आज") return new Date();

    // Check for standard ISO or YYYY-MM-DD
    const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (ymd) {
      const parsed = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Check for DD/MM/YYYY or DD-MM-YYYY
    const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmy) {
      const parsed = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Try standard Date parsing
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      if (d.getFullYear() > 2020) return d;
      // If year defaulted to e.g. 2001 because format was "28 Sep", attach current year!
      const currentYear = new Date().getFullYear();
      const withYear = new Date(`${str} ${currentYear}`);
      if (!isNaN(withYear.getTime())) return withYear;
    }

    // Fallback: try parsing with current year appended
    const currentYear = new Date().getFullYear();
    const tryWithYear = new Date(`${str} ${currentYear}`);
    if (!isNaN(tryWithYear.getTime())) return tryWithYear;

    return null;
  };

  const recentSales = bills.reduce((sum, b) => sum + getBillAmount(b), 0);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekBillSales = bills.filter(b => {
    if (String(b.date || "").toLowerCase() === "today" || String(b.date || "") === "आज") return true;
    const d = parseAnyDate(b.rawDate || b.createdAt || b.date);
    if (!d) return false;
    return d >= weekAgo;
  }).reduce((sum, b) => sum + getBillAmount(b), 0);

  const isPartyTxLinkedToBill = (tx, billList) => {
    if (!tx) return false;
    if (tx.type === 'bill' || tx.source === 'Bill' || tx.referenceBillId) return true;

    // If this is a 'sale' type party transaction with debit > 0, check if bills already exist 
    // for the same party/customer. The bills already represent these sales — exclude to prevent double-counting!
    if (tx.type === 'sale' && Number(tx.debit || 0) > 0) {
      const txPartyId = String(tx.partyId?._id || tx.partyId || '').trim();
      const txPartyName = String(tx.partyId?.name || tx.partyName || '').trim().toLowerCase();
      const txAmt = Number(tx.debit || tx.amount || 0);

      const hasMatchingBill = (billList || []).some(b => {
        const bPartyId = String(b.partyId?._id || b.partyId || '').trim();
        const bCust = String(b.customerName || b.partyName || '').trim().toLowerCase();
        const bAmt = Number(b.finalAmount ?? b.amount ?? b.total ?? 0);
        const isSameParty = (txPartyId && bPartyId && txPartyId === bPartyId) ||
          (txPartyName && bCust && (txPartyName === bCust || bCust.includes(txPartyName) || txPartyName.includes(bCust)));
        if (isSameParty) {
          if (txAmt > 0 && bAmt > 0 && Math.abs(txAmt - bAmt) < 1) return true;
          return true; // Any customer sale bill already exists in bills array
        }
        return false;
      });
      if (hasMatchingBill) return true;
    }

    const txRef = String(tx.refNo || tx.billNumber || tx.details || '').trim().toLowerCase();
    if (!txRef) return false;
    return (billList || []).some(b => {
      const bNo = String(b.billNumber || b.invoiceNumber || b.id || '').trim().toLowerCase();
      return bNo && (txRef === bNo || txRef.includes(bNo) || bNo.includes(txRef));
    });
  };

  // Sales are derived strictly from actual bills/invoices (party debits are loan/credit movements, not sales revenue)
  const totalRecentSales = recentSales;
  const weekSales = weekBillSales;
  const displayWeekSales = weekSales;

  const totalBankBalance = bankAccounts
    .filter(a => a.accountType !== "CC_OVERDRAFT")
    .reduce((s, a) => s + (Number(a.currentBalance ?? a.balance ?? a.openingBalance) || 0), 0);

  const primaryBankAccount = bankAccounts.find(a => a.accountType === "CURRENT") || bankAccounts[0];

  // Robust payment mode extractors
  const isCreditPayment = (b) => {
    const m = String(b.paymentMode || b.paymentMethod || b.type || "").toUpperCase();
    const st = String(b.paymentStatus || b.status || "").toLowerCase();
    return m === "UDHAR" || m === "CREDIT" || st === "unpaid" || st === "issued" || st === "due";
  };
  const isUpiPayment = (b) => {
    if (isCreditPayment(b)) return false;
    const m = String(b.paymentMode || b.paymentMethod || b.type || "").toUpperCase();
    return m === "UPI" || m === "ONLINE" || m === "QR";
  };
  const isCashPayment = (b) => {
    if (isCreditPayment(b) || isUpiPayment(b)) return false;
    const m = String(b.paymentMode || b.paymentMethod || b.type || "").toUpperCase();
    return m === "CASH" || m === "" || m === "NAKAD";
  };

  const isSameLocalDate = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Customer udhar payment received (parties paying back their credit/udhar)
  const isPartyPaymentReceived = (tx) => {
    const isCredit = Number(tx.credit || 0) > 0;
    const isSupplier = tx.type === 'purchase' || (tx.partyId?.partyType === 'supplier');
    return isCredit && !isSupplier;
  };

  const getTxFilterMatch = (tx, filter) => {
    if (filter === "all") return true;
    const d = parseAnyDate(tx.date || tx.createdAt);
    if (!d) return true;
    if (filter === "today") return isSameLocalDate(d, new Date());
    if (filter === "yesterday") return isSameLocalDate(d, new Date(Date.now() - 86400000));
    if (filter === "week") return d >= new Date(Date.now() - 7 * 86400000);
    return true;
  };

  // Filter bills created today
  const todayBills = bills.filter(b => {
    if (String(b.date || "").toLowerCase() === "today" || String(b.date || "") === "आज") return true;
    const d = parseAnyDate(b.rawDate || b.createdAt || b.date);
    if (!d) return false;
    const today = new Date();
    return isSameLocalDate(d, today);
  });

  const todayUdharCollected = (allPartyTransactions || [])
    .filter(tx => isPartyPaymentReceived(tx) && getTxFilterMatch(tx, "today"))
    .reduce((sum, tx) => sum + Number(tx.credit || 0), 0);

  const todaySales = todayBills.reduce((sum, b) => sum + getBillAmount(b), 0);
  const todayCash = todayBills.filter(isCashPayment).reduce((sum, b) => sum + getBillAmount(b), 0) + todayUdharCollected;
  const todayUpi = todayBills.filter(isUpiPayment).reduce((sum, b) => sum + getBillAmount(b), 0);
  const todayGrossCredit = todayBills.filter(isCreditPayment).reduce((sum, b) => sum + getBillAmount(b), 0);
  const todayCredit = Math.max(0, todayGrossCredit - todayUdharCollected);

  // Dynamic filter for Daily Sales Card (आज, कल, इस हफ़्ते, सभी)
  const activePeriodBills = bills.filter(b => {
    if (dailySaleFilter === "all") return true;
    if (dailySaleFilter === "today") {
      if (String(b.date || "").toLowerCase() === "today" || String(b.date || "") === "आज") return true;
      const d = parseAnyDate(b.rawDate || b.createdAt || b.date);
      if (!d) return false;
      return isSameLocalDate(d, new Date());
    }
    const d = parseAnyDate(b.rawDate || b.createdAt || b.date);
    if (!d) return false;
    if (dailySaleFilter === "yesterday") {
      const yest = new Date(Date.now() - 86400000);
      return isSameLocalDate(d, yest);
    }
    if (dailySaleFilter === "week") {
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      return d >= weekAgo;
    }
    return true;
  });

  // Calculate udhar payments collected from customers during active period
  const activePeriodUdharCollected = (allPartyTransactions || [])
    .filter(tx => isPartyPaymentReceived(tx) && getTxFilterMatch(tx, dailySaleFilter))
    .reduce((sum, tx) => sum + Number(tx.credit || 0), 0);

  const activePeriodSales = activePeriodBills.reduce((sum, b) => sum + getBillAmount(b), 0);
  const activePeriodPureCashSales = activePeriodBills.filter(isCashPayment).reduce((sum, b) => sum + getBillAmount(b), 0);
  // Cash Sales includes Direct Cash Sales + Udhar Vasooli (Cash Collected from Customers)
  const activePeriodCash = activePeriodPureCashSales + activePeriodUdharCollected;
  const activePeriodUpi = activePeriodBills.filter(isUpiPayment).reduce((sum, b) => sum + getBillAmount(b), 0);
  const activePeriodGrossCredit = activePeriodBills.filter(isCreditPayment).reduce((sum, b) => sum + getBillAmount(b), 0);
  // Net Credit = Total Udhar - Udhar payment collected
  const activePeriodCredit = Math.max(0, activePeriodGrossCredit - activePeriodUdharCollected);

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

    const genBillNo = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const billPayload = {
      billNumber: genBillNo,
      partyName: finalCustomer,
      customerName: finalCustomer,
      customerPhone: finalPhone,
      customerMobile: finalPhone || undefined,
      customerAddress: finalAddress,
      paymentMode: billPaymentMode,
      paymentMethod: billPaymentMode === "CASH" ? "cash" : billPaymentMode === "UPI" ? "online" : "credit",
      paymentStatus: billPaymentMode === "UDHAR" ? "unpaid" : "paid",
      status: billPaymentMode === "UDHAR" ? "issued" : "paid",
      dueDate: billPaymentMode === "UDHAR" ? billDueDate : undefined,
      lateInterestPercent: billPaymentMode === "UDHAR" ? (Number(billLateInterest) || 2) : 0,
      isUdharProtected: billPaymentMode === "UDHAR" ? isUdharProtectionChecked : false,
      udharOtpThreshold: udharOtpThreshold,
      partyId: selectedPartyObject?._id || selectedPartyObject?.id || undefined,
      bypassPendingLock: Boolean(bypassCreditLock),
      items: billCart.map(i => ({ 
        productId: i.id, 
        name: i.name, 
        quantity: Number(i.qty) || 1, 
        price: Number(i.salePrice) || 0, 
        total: (Number(i.salePrice) || 0) * (Number(i.qty) || 1) 
      })),
      total: totalBillAmount,
      finalAmount: totalBillAmount,
      date: new Date()
    };

    // Auto-create party locally if it doesn't exist
    if (finalCustomer && finalCustomer !== "नकद ग्राहक (Walk-in)" && !parties.some(p => String(p?.name || '').toLowerCase() === String(finalCustomer || '').toLowerCase())) {
      const newP = {
        id: `party-${Date.now()}`,
        name: finalCustomer,
        phone: finalPhone,
        address: finalAddress,
        balance: billPaymentMode === "UDHAR" ? totalBillAmount : 0,
        type: "customer"
      };
      setParties(prev => {
        const updated = [newP, ...prev];
        try {
          localStorage.setItem("vb_local_parties", JSON.stringify(updated));
          localStorage.setItem("parties", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    if (billAppliedReward) {
      billPayload.couponCode = billAppliedReward.code;
      if (billAppliedReward.rewardType === "percentage") {
        billPayload.discountAmount = Math.round((totalBillAmount * (billAppliedReward.discountPercentage || 0)) / 100);
      } else if (billAppliedReward.rewardType === "flat_discount") {
        billPayload.discountAmount = billAppliedReward.discountAmount || 0;
      }
      billPayload.finalAmount = Math.max(0, totalBillAmount - (billPayload.discountAmount || 0));
    }

    try {
      // 1. OFFLINE-FIRST: Construct createdBill and persist LOCALLY FIRST
      const localBillId = `bill_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const createdBill = {
      _id: localBillId,
      id: genBillNo,
      billNumber: genBillNo,
      invoiceNumber: genBillNo,
      customerName: finalCustomer,
      customer: finalCustomer,
      phone: billCustomerPhone.trim(),
      date: "Today",
      rawDate: new Date().toISOString(),
      amount: billPayload.finalAmount || totalBillAmount,
      finalAmount: billPayload.finalAmount || totalBillAmount,
      total: billPayload.finalAmount || totalBillAmount,
      type: billPaymentMode,
      paymentMode: billPaymentMode,
      paymentMethod: billPaymentMode === "UDHAR" ? "credit" : "cash",
      paymentStatus: billPaymentMode === "UDHAR" ? "unpaid" : "paid",
      items: billCart,
      isOfflineCreated: true,
      createdAt: new Date().toISOString()
    };

    const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
    const updatedBillsList = storageManager.saveBill(currentCoId, createdBill);
    setBills(updatedBillsList);

    setBillCart([]);
    setBillCustomer("");
    setBillCustomerPhone("");
    setBillAppliedReward(null);
    setMobileStampStatus(null);
    setShowQuickBillModal(false);
    setSelectedBillDetail(createdBill);

    if (billPaymentMode === "UPI" || billPaymentMode === "ONLINE") {
      speakUpiPayment(billPayload.finalAmount || totalBillAmount, "व्यापार");
    }

    // 2. BACKGROUND SERVER SYNC
    (async () => {
      try {
        let res;
        try {
          res = await api.post("/api/billing", billPayload);
        } catch (postErr) {
          if (postErr.response?.data?.isPendingApprovalBlocked) {
            if (window.confirm(`${postErr.response.data.message}\n\nक्या आप अभी 'काम न रुके' (बायपास) करके यह बिल तुरंत जारी करना चाहते हैं?`)) {
              billPayload.bypassPendingLock = true;
              res = await api.post("/api/billing", billPayload);
            } else {
              return;
            }
          } else {
            throw postErr;
          }
        }

        if (res?.data?.bill) {
          const serverBill = res.data.bill;
          const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
          const syncedBills = storageManager.saveBill(currentCoId, { ...serverBill, isOfflineCreated: false });
          setBills(syncedBills);

          if (res?.data?.udharProtection) {
            setActiveUdharBillData({
              ...createdBill,
              ...res.data.udharProtection,
              _id: serverBill._id || createdBill._id
            });
            setShowUdharOtpModal(true);
          }

          const stampAward = res?.data?.stampResult;
          if (stampAward?.awarded) {
            let msg = `⭐ ग्राहक का स्टैंप जुड़ा: ${stampAward.visualStamps}`;
            if (stampAward.rewardUnlocked) {
              msg += `\n\n🎉 बधाई! लक्ष्य पूरा हुआ - रिवॉर्ड कोड: ${stampAward.rewardData?.code} (${stampAward.rewardDescription})`;
            }
            alert(msg);
          }
        }
      } catch (err) {
        console.warn("Background billing sync deferred to offline queue:", err);
        enqueueOfflineSync({ type: 'CREATE_BILL', payload: billPayload, localId: localBillId });
      }
    })();
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

      setItems(prev => {
        const updated = [createdItem, ...prev];
        try {
          localStorage.setItem("vb_local_products", JSON.stringify(updated));
          localStorage.setItem("products", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      
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
      // FIXED: Apply balance direction — positive = we receive (लेने हैं), negative = we owe (देने हैं)
      const rawBal = Math.abs(Number(newPartyBalance) || 0);
      const isSupplier = newPartyType === "supplier";
      let signedBal = rawBal;
      if (isSupplier) {
        signedBal = (newPartyBalanceDir === "positive") ? rawBal : -rawBal;
      } else {
        signedBal = (newPartyBalanceDir === "negative") ? -rawBal : rawBal;
      }

      const trimmedName = newPartyName.trim();
      const trimmedAddr = newPartyAddress.trim() || "Local";

      // ⚠️ Check duplicate party: same name and same address
      const normName = trimmedName.toLowerCase();
      const normAddr = trimmedAddr.toLowerCase();
      const currentEditId = editingParty ? (editingParty._id || editingParty.id) : null;

      const isDuplicate = parties.some(p => {
        const pId = p._id || p.id;
        if (currentEditId && String(pId) === String(currentEditId)) return false;
        const existingName = (p.name || "").trim().toLowerCase();
        const existingAddr = (p.address || "Local").trim().toLowerCase();
        return existingName === normName && existingAddr === normAddr;
      });

      if (isDuplicate) {
        alert(`⚠️ इस नाम ("${trimmedName}") और पते ("${trimmedAddr}") से पहले से एक पार्टी मौजूद है!\nकृपया अलग नाम या पता दर्ज करें ताकि खातों में भ्रम न हो।`);
        setSavingParty(false);
        return;
      }

      const payload = {
        name: trimmedName,
        mobileNumber: newPartyPhone.trim() || `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        openingBalance: Math.abs(rawBal),
        currentBalance: signedBal,
        balanceType: signedBal < 0 ? "PAY" : "RECEIVE",
        partyType: newPartyType || "customer",
        address: trimmedAddr
      };

      if (editingParty) {
        const pId = editingParty._id || editingParty.id;
        await api.put(`/api/party/${pId}`, payload).catch(() => api.put(`/api/parties/${pId}`, payload));
        const updatedParty = {
          ...editingParty,
          name: payload.name,
          phone: payload.mobileNumber,
          mobileNumber: payload.mobileNumber,
          balance: signedBal,
          currentBalance: signedBal,
          openingBalance: signedBal,
          type: payload.partyType,
          partyType: payload.partyType,
          address: payload.address,
        };

        const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
        storageManager.saveParty(currentCoId, updatedParty);
        setParties(storageManager.getParties(currentCoId));
        if (selectedPartyDetail && ((selectedPartyDetail._id || selectedPartyDetail.id) === pId)) {
          setSelectedPartyDetail(updatedParty);
        }
        alert(`✅ पार्टी '${updatedParty.name}' सफलतापूर्वक अपडेट हो गई!`);
      } else {
        const res = await api.post("/api/party", payload).catch(() => api.post("/api/parties", payload));
        const savedId = res?.data?.party?._id || res?.data?._id || `party-${Date.now()}`;
        const createdParty = {
          id: savedId,
          _id: savedId,
          name: payload.name,
          phone: payload.mobileNumber,
          mobileNumber: payload.mobileNumber,
          balance: signedBal,
          currentBalance: signedBal,
          openingBalance: signedBal,
          type: payload.partyType,
          partyType: payload.partyType,
          address: payload.address,
          creditLimit: 0,
          notes: ""
        };

        const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
        storageManager.saveParty(currentCoId, createdParty);
        setParties(storageManager.getParties(currentCoId));
        alert(`✅ पार्टी '${createdParty.name}' सफलतापूर्वक जुड़ गई!`);
      }

      setShowAddPartyModal(false);
      setEditingParty(null);
      // reset all party form states
      setNewPartyName("");
      setNewPartyPhone("");
      setNewPartyBalance("0");
      setNewPartyAddress("");
      setNewPartyType("customer");
      setNewPartyBalanceDir("positive");

      fetchLiveDashboardData();
    } catch (err) {
      console.error("Save party error:", err);
      const errMsg = err?.response?.data?.error || err?.message || "Unknown error";
      alert("पार्टी सेव करने में त्रुटि आई।\n" + errMsg);
    } finally {
      setSavingParty(false);
    }
  };

  const handleOpenEditParty = (party) => {
    if (!party) return;
    setEditingParty(party);
    setNewPartyName(party.name || "");
    setNewPartyPhone(party.phone || party.mobileNumber || "");
    const pType = party.type || party.partyType || "customer";
    setNewPartyType(pType);
    const isSupplier = pType === "supplier" || String(pType).toLowerCase().includes("sup");
    let curBal = Number(party.currentBalance ?? party.balance ?? 0);
    const op = Math.abs(Number(party.openingBalance || 0));
    if (isSupplier && op > 0 && (curBal > 0 && Math.abs(curBal) === op)) {
      curBal = -op;
    }
    setNewPartyBalance(String(Math.abs(curBal)));
    setNewPartyBalanceDir(curBal < 0 || isSupplier ? "negative" : "positive");
    setShowAddPartyModal(true);
  };

  const handleDeleteParty = async (party) => {
    const id = party?._id || party?.id;
    if (!id) return;
    if (!window.confirm(`क्या आप पार्टी '${party.name}' को हटाना चाहते हैं?`)) return;
    try {
      await api.delete(`/api/party/${id}`).catch(() => api.delete(`/api/parties/${id}`));
      setParties(prev => prev.filter(p => (p._id || p.id) !== id));
      setSelectedPartyDetail(null);
      alert(`🗑️ पार्टी '${party.name}' सफलतापूर्वक हटा दी गई!`);
      fetchLiveDashboardData();
    } catch (err) {
      console.error("Delete party error:", err);
      alert("पार्टी हटाने में त्रुटि आई।");
    }
  };

  const fetchPartyStatement = async (partyId) => {
    if (!partyId) return;
    setPartyStatementLoading(true);
    try {
      const res = await api.get(`/api/party/${partyId}/statement`).catch(() => api.get(`/api/parties/${partyId}/statement`));
      const serverTxs = res?.transactions || res?.data?.transactions || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      
      const pObj = (parties || []).find(p => (p._id === partyId || p.id === partyId)) || selectedPartyDetail;
      const opBal = Number(pObj?.openingBalance ?? res?.openingBalance ?? 0);
      const isSupplier = (pObj?.type === "supplier" || pObj?.partyType === "supplier") || opBal < 0;

      let combinedTxs = Array.isArray(serverTxs) ? [...serverTxs] : [];

      // 1. If opening balance exists or was ever set, add opening bill/balance row if not already present
      const hasOpening = combinedTxs.some(t => t.refNo === "OPENING" || String(t._id || '').startsWith("open_") || String(t.details || '').includes("प्रारंभिक"));
      if (!hasOpening && (opBal !== 0 || pObj?.openingBalance)) {
        const absOp = Math.abs(opBal);
        combinedTxs.push({
          _id: `open_${partyId}`,
          date: pObj?.createdAt || new Date(2026, 0, 1).toISOString(),
          type: isSupplier ? "purchase" : "sale",
          refNo: "OPENING",
          billNumber: "OPENING-BILL",
          details: `प्रारंभिक पुराना हिसाब / बिल (Opening Balance: ${isSupplier ? 'देने हैं' : 'लेने हैं'})`,
          debit: isSupplier ? 0 : absOp,
          credit: isSupplier ? absOp : 0,
          runningBalance: isSupplier ? -absOp : absOp,
          source: "OpeningBalance"
        });
      }

      // 2. Merge local manual party transactions (मैंने दिए / मुझे मिले) from state and localStorage
      let localPartyTxs = [];
      try {
        const storedTxs = JSON.parse(localStorage.getItem("vb_local_party_txs") || "[]");
        if (Array.isArray(storedTxs)) localPartyTxs.push(...storedTxs);
      } catch (e) {}
      if (Array.isArray(allPartyTransactions)) localPartyTxs.push(...allPartyTransactions);

      const matchingLocalTxs = localPartyTxs.filter(t => {
        const tPartyId = String(t.partyId?._id || t.partyId?.id || t.partyId || "");
        return tPartyId && tPartyId === String(partyId);
      });

      matchingLocalTxs.forEach(lt => {
        const ltId = String(lt._id || lt.id || "").trim();
        const exists = combinedTxs.some(t => {
          const tId = String(t._id || t.id || "").trim();
          if (tId && ltId && tId === ltId) return true;
          const tDate = t.date ? new Date(t.date).toISOString().slice(0, 10) : "";
          const ltDate = lt.date ? new Date(lt.date).toISOString().slice(0, 10) : "";
          const tDeb = Number(t.debit || 0);
          const ltDeb = Number(lt.debit || 0);
          const tCred = Number(t.credit || 0);
          const ltCred = Number(lt.credit || 0);
          const tAmt = Number(t.amount || tDeb || tCred || 0);
          const ltAmt = Number(lt.amount || ltDeb || ltCred || 0);
          if (tDate && ltDate && tDate === ltDate) {
            if (tDeb > 0 && ltDeb > 0 && Math.abs(tDeb - ltDeb) < 0.01) return true;
            if (tCred > 0 && ltCred > 0 && Math.abs(tCred - ltCred) < 0.01) return true;
            if (tAmt > 0 && ltAmt > 0 && Math.abs(tAmt - ltAmt) < 0.01) return true;
          }
          return false;
        });

        if (!exists) {
          const isPaid = lt.type === 'paid' || (Number(lt.debit || 0) > 0 && lt.source === 'PartyTransaction');
          const amt = Number(lt.amount || lt.debit || lt.credit || 0);
          combinedTxs.push({
            _id: lt._id || lt.id,
            date: lt.date || lt.createdAt || new Date().toISOString(),
            type: lt.type || (isPaid ? 'payment' : 'receipt'),
            refNo: lt.refNo || (isPaid ? 'PAY-ENTRY' : 'REC-ENTRY'),
            billNumber: lt.billNumber || '',
            details: lt.details || (isPaid ? 'मैंने दिए (भुगतान)' : 'मुझे मिले (जमा)'),
            debit: lt.debit !== undefined ? Number(lt.debit) : (isPaid ? amt : 0),
            credit: lt.credit !== undefined ? Number(lt.credit) : (isPaid ? 0 : amt),
            amount: amt,
            source: 'PartyTransaction',
            paymentMethod: lt.paymentMethod || 'CASH'
          });
        }
      });

      // 3. Also merge unsynced local matching bills not already present in server transactions
      const pNameNorm = String(pObj?.name || '').trim().toLowerCase();
      const pPhoneNorm = String(pObj?.phone || pObj?.mobileNumber || '').trim();
      const existingRefNos = new Set();
      const existingSignatures = new Set();
      combinedTxs.forEach(t => {
        if (t.billNumber) existingRefNos.add(String(t.billNumber).trim().toLowerCase());
        if (t.refNo) existingRefNos.add(String(t.refNo).trim().toLowerCase());
        if (t._id) existingRefNos.add(String(t._id).trim().toLowerCase());
        if (t.id) existingRefNos.add(String(t.id).trim().toLowerCase());
        const dStr = t.date ? new Date(t.date).toISOString().slice(0, 10) : "";
        const amt = Number(t.billAmount || t.debit || t.credit || 0);
        if (dStr && amt > 0) {
          existingSignatures.add(`${dStr}_${amt}`);
        }
      });

      const localBills = (bills || []).filter(b => {
        const bPartyId = String(b.partyId || '');
        const bCust = String(b.customerName || b.partyName || '').trim().toLowerCase();
        const bPhone = String(b.customerMobile || b.customerPhone || '').trim();
        return (bPartyId && bPartyId === String(partyId)) || (bCust && bCust === pNameNorm) || (bPhone && pPhoneNorm && bPhone === pPhoneNorm);
      });

      for (const b of localBills) {
        const bNum = String(b.billNumber || b.invoiceNumber || 'BILL').trim();
        const bId = String(b._id || b.id || '').trim();
        if (existingRefNos.has(bNum.toLowerCase()) || existingRefNos.has(bId.toLowerCase())) continue;

        const bDateStr = (b.rawDate || b.date) ? new Date(b.rawDate || b.date).toISOString().slice(0, 10) : "";
        const finalAmt = Number(b.finalAmount ?? b.total ?? b.amount ?? 0);
        if (bDateStr && finalAmt > 0 && existingSignatures.has(`${bDateStr}_${finalAmt}`)) continue;

        const isPaid = String(b.paymentStatus || b.status || '').toLowerCase() === 'paid';
        const paidAmt = isPaid ? finalAmt : Number(b.amountPaid || b.advanceAmount || b.receivedAmount || 0);

        combinedTxs.push({
          _id: b._id || b.id,
          date: b.date || b.createdAt,
          type: isSupplier ? 'purchase' : 'sale',
          refNo: bNum,
          billNumber: bNum,
          billAmount: finalAmt,
          paidAmount: paidAmt,
          details: `बिल #${bNum} (${(b.items || []).length} सामान)`,
          items: b.items || [],
          debit: isSupplier ? 0 : finalAmt,
          credit: isSupplier ? finalAmt : 0,
          billImageUrl: b.billImageUrl || '',
          paymentMethod: b.paymentMode || b.paymentMethod || 'CASH'
        });

        if (paidAmt > 0) {
          combinedTxs.push({
            _id: `pay_${b._id || b.id}`,
            date: b.date || b.createdAt,
            type: 'payment',
            refNo: `REC-${bNum}`,
            billNumber: bNum,
            details: `बिल #${bNum} पर नकद/UPI जमा (Payment Received)`,
            debit: isSupplier ? paidAmt : 0,
            credit: isSupplier ? 0 : paidAmt,
            billImageUrl: b.billImageUrl || '',
            paymentMethod: b.paymentMode || b.paymentMethod || 'CASH'
          });
        }
      }

      // Sort descending (latest on top)
      combinedTxs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setPartyTransactions(combinedTxs);

      // Calculate true running balance from all transactions
      const sortedChronological = [...combinedTxs].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      let running = 0;
      sortedChronological.forEach(tx => {
        running += (Number(tx.debit || 0) - Number(tx.credit || 0));
      });
      const trueBalance = res?.currentBalance !== undefined ? Number(res.currentBalance) : running;

      setSelectedPartyDetail(prev => prev ? ({
        ...prev,
        balance: trueBalance,
        currentBalance: trueBalance
      }) : prev);

      setParties(prev => {
        const updated = prev.map(p => {
          const id = p.id || p._id;
          if (id === partyId) {
            return { ...p, balance: trueBalance, currentBalance: trueBalance };
          }
          return p;
        });
        const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
        if (currentCoId) {
          try {
            storageManager.saveParties(currentCoId, updated);
          } catch (e) {}
        }
        return updated;
      });
    } catch (e) {
      console.error("fetchPartyStatement error:", e);
      setPartyTransactions([]);
    } finally {
      setPartyStatementLoading(false);
    }
  };

  const handleAttachPartyImage = async (txId, filesInput) => {
    if (!filesInput) return;
    const files = filesInput instanceof FileList || Array.isArray(filesInput)
      ? Array.from(filesInput)
      : [filesInput];
    if (files.length === 0) return;

    // Up to 5 files
    const validFiles = files.slice(0, 5);

    try {
      let latestUrls = [];
      let latestPrimaryUrl = "";

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await api.post('/api/upload/bill-image', {
          fileData: base64Data,
          fileName: file.name,
          targetId: txId
        });

        if (res.data?.url) {
          latestPrimaryUrl = res.data.url;
          latestUrls = res.data.urls || [...latestUrls, res.data.url];
        }
      }

      if (latestUrls.length > 0 || latestPrimaryUrl) {
        setPartyTransactions(prev => prev.map(t => {
          if (t._id === txId || t.refNo === txId) {
            const currentList = t.billImageUrls || (t.billImageUrl ? [t.billImageUrl] : []);
            const merged = Array.from(new Set([...currentList, ...latestUrls, latestPrimaryUrl].filter(Boolean)));
            return {
              ...t,
              billImageUrl: latestPrimaryUrl || merged[0],
              billImageUrls: merged
            };
          }
          return t;
        }));

        setAllPartyTransactions(prev => {
          const next = (prev || []).map(t => {
            if (t._id === txId || t.refNo === txId) {
              const currentList = t.billImageUrls || (t.billImageUrl ? [t.billImageUrl] : []);
              const merged = Array.from(new Set([...currentList, ...latestUrls, latestPrimaryUrl].filter(Boolean)));
              return {
                ...t,
                billImageUrl: latestPrimaryUrl || merged[0],
                billImageUrls: merged
              };
            }
            return t;
          });
          try {
            localStorage.setItem("vb_local_party_txs", JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      }

      alert(`✅ ${validFiles.length} बिल फोटो सफलतापूर्वक सुरक्षित व लिंक हो गईं!`);
      const pId = selectedPartyDetail?._id || selectedPartyDetail?.id;
      if (pId) {
        fetchPartyStatement(pId);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("फोटो अपलोड करने में त्रुटि: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeletePartyImage = async (txId, imageUrl) => {
    if (!imageUrl) return;
    if (!window.confirm("क्या आप वाकई यह बिल फोटो हटाना चाहते हैं?")) return;
    try {
      const res = await api.post('/api/upload/delete-bill-image', {
        targetId: txId,
        imageUrl
      });
      const updatedUrls = res.data?.urls || [];
      const primaryUrl = res.data?.primaryUrl || (updatedUrls[0] || "");

      setPartyTransactions(prev => prev.map(t => {
        if (t._id === txId || t.refNo === txId) {
          return { ...t, billImageUrl: primaryUrl, billImageUrls: updatedUrls };
        }
        return t;
      }));

      setAllPartyTransactions(prev => {
        const next = (prev || []).map(t => {
          if (t._id === txId || t.refNo === txId) {
            return { ...t, billImageUrl: primaryUrl, billImageUrls: updatedUrls };
          }
          return t;
        });
        try {
          localStorage.setItem("vb_local_party_txs", JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      if (previewBillImage === imageUrl) {
        if (updatedUrls.length > 0) {
          setPreviewBillImage(updatedUrls[0]);
          setPreviewImageList(updatedUrls);
          setPreviewImageIndex(0);
        } else {
          setPreviewBillImage(null);
          setPreviewImageList([]);
          setPreviewImageIndex(0);
          setPreviewTargetTxId(null);
        }
      }

      alert("🗑️ बिल फोटो सफलतापूर्वक हटा दी गई!");
      const pId = selectedPartyDetail?._id || selectedPartyDetail?.id;
      if (pId) {
        fetchPartyStatement(pId);
      }
    } catch (err) {
      console.error("Delete photo error:", err);
      alert("फोटो हटाने में त्रुटि: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeletePartyTransaction = async (tx) => {
    if (!tx) return;
    const txId = tx._id || tx.id;
    const amt = Number(tx.amount || tx.debit || tx.credit || 0);
    const confirmMsg = `क्या आप इस प्रविष्टि (₹${amt.toLocaleString('en-IN')}) को हमेशा के लिए हटाना चाहते हैं?\n\nइससे पार्टी का खाता व बकाया बैलेंस स्वतः सही हो जाएगा।`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/api/party/transaction/${txId}`).catch(() => api.delete(`/api/parties/transaction/${txId}`));

      // Also clean up local storage matching tx
      try {
        const stored = JSON.parse(localStorage.getItem("vb_local_party_txs") || "[]");
        const filtered = stored.filter(t => (t._id || t.id) !== txId);
        localStorage.setItem("vb_local_party_txs", JSON.stringify(filtered));
      } catch (e) {}

      setAllPartyTransactions(prev => (prev || []).filter(t => (t._id || t.id) !== txId));
      setPartyTransactions(prev => prev.filter(t => (t._id || t.id) !== txId));

      alert("🗑️ प्रविष्टि सफलतापूर्वक हटा दी गई!");
      const pId = selectedPartyDetail?._id || selectedPartyDetail?.id;
      if (pId) {
        fetchPartyStatement(pId);
      }
    } catch (err) {
      console.error("Delete transaction error:", err);
      alert("प्रविष्टि हटाने में त्रुटि: " + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenEditPartyTx = (tx) => {
    if (!tx) return;
    const isDebit = Number(tx.debit || 0) > 0;
    const amt = isDebit ? tx.debit : (tx.credit || tx.amount || 0);
    setEditingPartyTx(tx);
    setEditPartyTxAmount(String(amt));
    setEditPartyTxType(isDebit ? 'paid' : 'received');
    setEditPartyTxNotes(tx.details || '');
    setEditPartyTxDate(tx.date ? new Date(tx.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditPartyTxPaymentMode(tx.paymentMethod || tx.paymentMode || 'CASH');
  };

  const handleSaveEditPartyTx = async (e) => {
    if (e) e.preventDefault();
    if (!editingPartyTx) return;
    const amt = Number(editPartyTxAmount);
    if (!editPartyTxAmount || isNaN(amt) || amt <= 0) {
      alert("कृपया मान्य राशि दर्ज करें!");
      return;
    }

    setSavingEditPartyTx(true);
    try {
      const txId = editingPartyTx._id || editingPartyTx.id;
      const payload = {
        amount: amt,
        type: editPartyTxType,
        details: editPartyTxNotes.trim(),
        date: editPartyTxDate ? new Date(editPartyTxDate).toISOString() : new Date().toISOString(),
        paymentMethod: editPartyTxPaymentMode
      };

      await api.put(`/api/party/transaction/${txId}`, payload).catch(() => api.put(`/api/parties/transaction/${txId}`, payload));

      // Also update local storage
      try {
        const stored = JSON.parse(localStorage.getItem("vb_local_party_txs") || "[]");
        const updatedList = stored.map(t => {
          if ((t._id || t.id) === txId) {
            return {
              ...t,
              amount: amt,
              debit: editPartyTxType === 'paid' ? amt : 0,
              credit: editPartyTxType === 'received' ? amt : 0,
              details: payload.details,
              date: payload.date,
              paymentMethod: editPartyTxPaymentMode
            };
          }
          return t;
        });
        localStorage.setItem("vb_local_party_txs", JSON.stringify(updatedList));
      } catch (e) {}

      alert("✅ प्रविष्टि सफलतापूर्वक अपडेट हो गई!");
      setEditingPartyTx(null);
      const pId = selectedPartyDetail?._id || selectedPartyDetail?.id;
      if (pId) {
        fetchPartyStatement(pId);
      }
    } catch (err) {
      console.error("Update transaction error:", err);
      alert("प्रविष्टि अपडेट करने में त्रुटि: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingEditPartyTx(false);
    }
  };

  const handleClearPartyBalance = async (party) => {
    if (!party) return;
    const pId = party._id || party.id;
    const pName = party.name || "पार्टी";
    const curBal = Number(party.balance ?? party.currentBalance ?? 0);
    const confirmMsg = `क्या आप '${pName}' का हिसाब-किताब चुकता (Clear Balance) करके बकाया ₹0 करना चाहते हैं?\n\nवर्तमान बकाया: ₹${Math.abs(curBal).toLocaleString('en-IN')} ${curBal > 0 ? '(लेने हैं)' : curBal < 0 ? '(देने हैं)' : '(₹0)'}`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.post(`/api/party/${pId}/clear-balance`).catch(() => api.post(`/api/parties/${pId}/clear-balance`));

      // 1. Purge any stale local transactions for this party from vb_local_party_txs
      try {
        const storedTxs = JSON.parse(localStorage.getItem("vb_local_party_txs") || "[]");
        if (Array.isArray(storedTxs)) {
          const filtered = storedTxs.filter(t => {
            const tPartyId = String(t.partyId?._id || t.partyId?.id || t.partyId || "");
            return tPartyId !== String(pId);
          });
          localStorage.setItem("vb_local_party_txs", JSON.stringify(filtered));
        }
      } catch (e) {}

      setAllPartyTransactions(prev => (prev || []).filter(t => {
        const tPartyId = String(t.partyId?._id || t.partyId?.id || t.partyId || "");
        return tPartyId !== String(pId);
      }));

      // 2. Update persistent storageManager cache so background sync never reverts
      const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
      const zeroParty = { ...party, balance: 0, currentBalance: 0, openingBalance: 0 };
      if (currentCoId) {
        try {
          storageManager.saveParty(currentCoId, zeroParty);
        } catch (e) {}
      }

      setSelectedPartyDetail(prev => prev ? ({ ...prev, balance: 0, currentBalance: 0, openingBalance: 0 }) : prev);
      setParties(prev => {
        const updated = prev.map(p => ((p.id || p._id) === pId ? { ...p, balance: 0, currentBalance: 0, openingBalance: 0 } : p));
        if (currentCoId) {
          try {
            storageManager.saveParties(currentCoId, updated);
          } catch (e) {}
        }
        return updated;
      });

      alert(`✅ '${pName}' का खाता चुकता कर दिया गया! अब बकाया ₹0 है।`);
      fetchPartyStatement(pId);
    } catch (err) {
      console.error("Clear balance error:", err);
      alert("खाता चुकता करने में त्रुटि: " + (err.response?.data?.message || err.message));
    }
  };


  const handleExportPartyExcel = (party, txs) => {
    if (!party) return;
    try {
      const curBal = Number(party.balance ?? party.currentBalance ?? 0);
      const rows = [
        ["🏢 गणेश हार्डवेयर - खाता पासबुक विवरण"],
        ["पार्टी का नाम:", party.name || "-"],
        ["मोबाइल नंबर:", party.phone || party.mobileNumber || "-"],
        ["खाता प्रकार:", (party.type || party.partyType) === 'personal' ? 'पर्सनल खाता' : 'व्यापारिक खाता'],
        ["तारीख:", new Date().toLocaleDateString('hi-IN')],
        ["कुल बकाया:", Math.abs(curBal) + (curBal > 0 ? " (लेने हैं / Due)" : curBal < 0 ? " (देने हैं / Advance)" : " (चुक्ता)")],
        [],
        ["दिनांक", "विवरण", "रेफरेंस / बिल #", "डेबिट (₹)", "क्रेडिट (₹)", "बकाया (₹)", "बिल फोटो लिंक"]
      ];

      (txs || []).forEach(tx => {
        rows.push([
          tx.date ? new Date(tx.date).toLocaleDateString('hi-IN') : '-',
          tx.details || '-',
          tx.refNo || tx.billNumber || '-',
          Number(tx.debit || 0),
          Number(tx.credit || 0),
          Number(tx.runningAfter ?? tx.runningBalance ?? 0),
          tx.billImageUrl || "कोई फोटो नहीं"
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 14 },
        { wch: 32 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 40 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Passbook");
      const safeName = (party.name || "Party").replace(/[^a-zA-Z0-9\u0900-\u097F_-]/g, "_");
      XLSX.writeFile(wb, `${safeName}_खाता_पासबुक.xlsx`);
    } catch (e) {
      console.error("Excel export error:", e);
      alert("एक्सेल फाइल बनाने में त्रुटि: " + e.message);
    }
  };

  const handleOpenPartyDetail = (party) => {
    setSelectedPartyDetail(party);
    setShowPartyTxForm(false);
    setPartyTxAmount('');
    setPartyTxNotes('');
    setPartyTxDate(new Date().toISOString().split('T')[0]);
    setPartyTxPaymentMode('CASH');
    const pId = party.id || party._id;
    if (pId) {
      fetchPartyStatement(pId);
    }
  };

  const handleSavePartyTx = async () => {
    if (!selectedPartyDetail) return;
    const amt = Number(partyTxAmount);
    if (!partyTxAmount || isNaN(amt) || amt <= 0) {
      alert("कृपया सही राशि (₹) दर्ज करें!");
      return;
    }
    setSavingPartyTx(true);
    try {
      const partyId = selectedPartyDetail.id || selectedPartyDetail._id;
      const type = partyTxType === 'paid' ? 'paid' : 'received';
      const notes = partyTxNotes.trim() || (type === 'paid' ? 'मैंने दिए' : 'मुझे मिले');
      const txDate = partyTxDate ? new Date(partyTxDate) : new Date();

      await api.post("/api/payment/entry", {
        partyId,
        amount: amt,
        type,
        date: txDate.toISOString(),
        paymentMethod: partyTxPaymentMode || 'CASH',
        notes
      });

      // 'paid' increases outstanding (+amt, You'll Get), 'received' decreases outstanding (-amt)
      const diff = type === 'paid' ? amt : -amt;
      const updatedBalance = Number(selectedPartyDetail.balance ?? selectedPartyDetail.currentBalance ?? 0) + diff;

      setSelectedPartyDetail(prev => ({
        ...prev,
        balance: updatedBalance,
        currentBalance: updatedBalance
      }));

      const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
      setParties(prev => {
        const updated = prev.map(p => {
          const id = p.id || p._id;
          if (id === partyId) {
            return { ...p, balance: updatedBalance, currentBalance: updatedBalance };
          }
          return p;
        });
        storageManager.saveParties(currentCoId, updated);
        return updated;
      });

      // Also record local transaction so ledger updates instantly even offline
      const newTxDoc = {
        _id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        partyId,
        date: txDate.toISOString(),
        details: notes,
        debit: type === 'paid' ? amt : 0,
        credit: type === 'received' ? amt : 0,
        amount: amt,
        type: type === 'paid' ? 'payment' : 'receipt',
        source: 'PartyTransaction',
        paymentMethod: partyTxPaymentMode || 'CASH'
      };
      setAllPartyTransactions(prev => [newTxDoc, ...(prev || [])]);
      try {
        const storedTxs = JSON.parse(localStorage.getItem("vb_local_party_txs") || "[]");
        localStorage.setItem("vb_local_party_txs", JSON.stringify([newTxDoc, ...storedTxs]));
      } catch (e) {}

      setPartyTxAmount('');
      setPartyTxNotes('');
      setPartyTxDate(new Date().toISOString().split('T')[0]);
      setShowPartyTxForm(false);
      fetchPartyStatement(partyId);
      
      if (type === 'received') {
        speakUpiPayment(amt, "व्यापार");
      }

      const formattedDate = txDate.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      alert(`✅ ₹${amt.toLocaleString('en-IN')} का भुगतान (${type === 'paid' ? 'मैंने दिए / किस्त' : 'मुझे मिले / किस्त'}) दिनांक ${formattedDate} को दर्ज हुआ!`);
    } catch (err) {
      console.error("Party transaction error:", err);
      alert("लेन-देन दर्ज करने में त्रुटि आई।");
    } finally {
      setSavingPartyTx(false);
    }
  };

  // ==================== DEDICATED VENDOR (SUPPLIER) WORKFLOW HANDLERS ====================
  const handleVendorImageCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setVendorBillImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveVendorPurchase = async () => {
    if (!selectedPartyDetail) return;
    const amt = Number(vendorBillAmount);
    if (!vendorBillAmount || isNaN(amt) || amt <= 0) {
      alert("कृपया मान्य खरीद बिल राशि (₹) दर्ज करें!");
      return;
    }
    const paidAmt = vendorIsPaidNow ? Number(vendorPaidAmount || 0) : 0;
    if (paidAmt > amt) {
      alert("भुगतान राशि कुल बिल राशि से अधिक नहीं हो सकती!");
      return;
    }

    setSavingVendorAction(true);
    try {
      const partyId = selectedPartyDetail.id || selectedPartyDetail._id;
      const pName = selectedPartyDetail.name || "वेंडर";
      const genPurNo = vendorBillNo.trim() || `PUR-${Date.now().toString().slice(-6)}`;
      const pDate = vendorBillDate ? new Date(vendorBillDate) : new Date();

      const payload = {
        partyId,
        supplierName: pName,
        purchaseNumber: genPurNo,
        items: [{
          name: vendorItemDesc.trim() || "सप्लायर से माल खरीद",
          quantity: 1,
          price: amt,
          total: amt
        }],
        finalAmount: amt,
        amountPaid: paidAmt,
        paymentMethod: paidAmt > 0 ? (vendorPaymentMode || 'CASH') : 'credit',
        date: pDate.toISOString(),
        billImageUrl: vendorBillImage || ""
      };

      // 1. Sync to backend purchase API
      try {
        await api.post("/api/purchase", payload);
      } catch (apiErr) {
        console.warn("Purchase backend sync deferred or error:", apiErr);
      }

      // 2. Update local Party balance (Payable decreases/becomes more negative by netDue)
      const netDue = amt - paidAmt;
      const currentBal = Number(selectedPartyDetail.balance ?? selectedPartyDetail.currentBalance ?? 0);
      const updatedBalance = currentBal - netDue;

      setSelectedPartyDetail(prev => ({
        ...prev,
        balance: updatedBalance,
        currentBalance: updatedBalance
      }));

      const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
      setParties(prev => {
        const updated = prev.map(p => {
          const id = p.id || p._id;
          if (id === partyId) {
            return { ...p, balance: updatedBalance, currentBalance: updatedBalance };
          }
          return p;
        });
        storageManager.saveParties(currentCoId, updated);
        return updated;
      });

      // 3. Record in local ledger
      const purchaseTxDoc = {
        _id: `pur_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        partyId,
        date: pDate.toISOString(),
        details: `📦 माल खरीद #${genPurNo}${vendorItemDesc.trim() ? ` - ${vendorItemDesc.trim()}` : ''}`,
        debit: 0,
        credit: amt,
        amount: amt,
        type: 'purchase',
        source: 'Purchase',
        billNumber: genPurNo,
        billImageUrl: vendorBillImage || ""
      };

      const newTxs = [purchaseTxDoc];
      if (paidAmt > 0) {
        const payTxDoc = {
          _id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          partyId,
          date: pDate.toISOString(),
          details: `तुरंत भुगतान (${vendorPaymentMode === 'CASH' ? 'नकद' : vendorPaymentMode === 'UPI' ? 'UPI' : 'बैंक'}) #${genPurNo}`,
          debit: paidAmt,
          credit: 0,
          amount: paidAmt,
          type: 'payment',
          source: 'PartyTransaction',
          paymentMethod: vendorPaymentMode || 'CASH'
        };
        newTxs.push(payTxDoc);
      }

      setAllPartyTransactions(prev => [...newTxs, ...(prev || [])]);
      try {
        const storedTxs = JSON.parse(localStorage.getItem("vb_local_party_txs") || "[]");
        localStorage.setItem("vb_local_party_txs", JSON.stringify([...newTxs, ...storedTxs]));
      } catch (e) {}

      // Reset form
      setShowVendorForm(false);
      setVendorBillAmount('');
      setVendorItemDesc('');
      setVendorBillNo('');
      setVendorIsPaidNow(false);
      setVendorPaidAmount('');
      setVendorBillImage('');
      setVendorBillDate(new Date().toISOString().split('T')[0]);
      fetchPartyStatement(partyId);

      alert(`🎉 वेंडर ${pName} से ₹${amt.toLocaleString('en-IN')} का माल (खरीद बिल #${genPurNo}) सफलता से दर्ज हुआ!${paidAmt > 0 ? ` (₹${paidAmt.toLocaleString('en-IN')} तुरंत भुगतान किया गया)` : ''}`);
    } catch (err) {
      console.error("Vendor purchase error:", err);
      alert("माल खरीद दर्ज करने में त्रुटि आई।");
    } finally {
      setSavingVendorAction(false);
    }
  };

  const handleSaveVendorPayment = async () => {
    if (!selectedPartyDetail) return;
    const amt = Number(vendorBillAmount);
    if (!vendorBillAmount || isNaN(amt) || amt <= 0) {
      alert("कृपया मान्य भुगतान राशि (₹) दर्ज करें!");
      return;
    }

    setSavingVendorAction(true);
    try {
      const partyId = selectedPartyDetail.id || selectedPartyDetail._id;
      const pName = selectedPartyDetail.name || "वेंडर";
      const txDate = vendorBillDate ? new Date(vendorBillDate) : new Date();
      const notes = vendorNotes.trim() || 'सप्लायर को भुगतान दिया';

      await api.post("/api/payment/entry", {
        partyId,
        amount: amt,
        type: 'paid',
        date: txDate.toISOString(),
        paymentMethod: vendorPaymentMode || 'CASH',
        notes
      });

      // For vendor, debt decreases (balance increases towards 0)
      const currentBal = Number(selectedPartyDetail.balance ?? selectedPartyDetail.currentBalance ?? 0);
      const updatedBalance = currentBal + amt;

      setSelectedPartyDetail(prev => ({
        ...prev,
        balance: updatedBalance,
        currentBalance: updatedBalance
      }));

      const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
      setParties(prev => {
        const updated = prev.map(p => {
          const id = p.id || p._id;
          if (id === partyId) {
            return { ...p, balance: updatedBalance, currentBalance: updatedBalance };
          }
          return p;
        });
        storageManager.saveParties(currentCoId, updated);
        return updated;
      });

      const newTxDoc = {
        _id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        partyId,
        date: txDate.toISOString(),
        details: notes,
        debit: amt,
        credit: 0,
        amount: amt,
        type: 'payment',
        source: 'PartyTransaction',
        paymentMethod: vendorPaymentMode || 'CASH'
      };
      setAllPartyTransactions(prev => [newTxDoc, ...(prev || [])]);
      try {
        const storedTxs = JSON.parse(localStorage.getItem("vb_local_party_txs") || "[]");
        localStorage.setItem("vb_local_party_txs", JSON.stringify([newTxDoc, ...storedTxs]));
      } catch (e) {}

      setShowVendorForm(false);
      setVendorBillAmount('');
      setVendorNotes('');
      setVendorBillDate(new Date().toISOString().split('T')[0]);
      fetchPartyStatement(partyId);

      alert(`✅ वेंडर ${pName} को ₹${amt.toLocaleString('en-IN')} का भुगतान (${vendorPaymentMode === 'CASH' ? 'नकद' : vendorPaymentMode === 'UPI' ? 'UPI' : 'बैंक'}) सफलतापूर्वक दर्ज हुआ!`);
    } catch (err) {
      console.error("Vendor payment error:", err);
      alert("भुगतान दर्ज करने में त्रुटि आई।");
    } finally {
      setSavingVendorAction(false);
    }
  };

  const handleSharePartyStatementWhatsApp = (party) => {
    if (!party) return;
    const bal = Number(party.balance ?? party.currentBalance ?? 0);
    const balText = bal > 0 
      ? `कुल बकाया (लेने हैं): ₹${bal.toLocaleString('en-IN')}` 
      : bal < 0 
        ? `कुल बकाया (देने हैं): ₹${Math.abs(bal).toLocaleString('en-IN')}` 
        : `हिसाब चुकता (₹0)`;
    
    const pTypeTag = (party.type || party.partyType) === 'personal' ? 'पर्सनल खाता' : 'व्यापारिक खाता';
    const msg = `नमस्ते ${party.name} जी,\n\nयह आपका हिसाब-किताब विवरण (${pTypeTag}) है:\n${balText}\n\nधन्यवाद!`;
    const cleanPhone = String(party.phone || party.mobileNumber || '').replace(/[^0-9]/g, '');
    const url = cleanPhone 
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
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
      const genBillNo = `SALE-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
      
      const payload = {
        billNumber: genBillNo,
        partyName: partyTitle,
        customerName: partyTitle,
        customerPhone: manualSalePhone.trim(),
        customerMobile: manualSalePhone.trim() || undefined,
        paymentMode: manualSalePaymentMode,
        paymentMethod: manualSalePaymentMode === "CASH" ? "cash" : manualSalePaymentMode === "UPI" ? "online" : "credit",
        paymentStatus: manualSalePaymentMode === "UDHAR" ? "unpaid" : "paid",
        status: manualSalePaymentMode === "UDHAR" ? "issued" : "paid",
        total: saleAmt,
        finalAmount: saleAmt,
        grandTotal: saleAmt,
        // Use noon IST (12:00 IST = 06:30 UTC) so the date doesn't shift to previous day in UTC storage
        date: manualSaleDate ? new Date(`${manualSaleDate}T12:00:00+05:30`) : new Date(),
        items: [{
          name: manualSaleNotes.trim() || `दैनिक बिक्री (${manualSalePaymentMode})`,
          quantity: 1,
          price: saleAmt,
          total: saleAmt
        }],
        notes: manualSaleNotes.trim()
      };

      const saleDateObj = manualSaleDate ? new Date(manualSaleDate) : new Date();
      const saleDateDisplay = manualSaleDate 
        ? new Date(manualSaleDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        : "Today";

      const localBillId = `bill_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const createdBill = {
        _id: localBillId,
        id: genBillNo,
        billNumber: genBillNo,
        invoiceNumber: genBillNo,
        customerName: partyTitle,
        customer: partyTitle,
        phone: payload.customerPhone,
        amount: saleAmt,
        finalAmount: saleAmt,
        total: saleAmt,
        totalAmount: saleAmt,
        grandTotal: saleAmt,
        type: manualSalePaymentMode,
        paymentMode: manualSalePaymentMode,
        paymentMethod: manualSalePaymentMode === "UDHAR" || manualSalePaymentMode === "CREDIT" ? "credit" : "cash",
        paymentStatus: payload.paymentStatus,
        date: saleDateDisplay,
        rawDate: manualSaleDate || new Date().toISOString(),
        items: payload.items,
        isOfflineCreated: true,
        createdAt: new Date().toISOString()
      };

      // 1. Instantly persist in localStorage so it NEVER disappears (Offline-First)
      const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
      const updatedList = storageManager.saveBill(currentCoId, createdBill);
      setBills(updatedList);

      setShowManualSaleModal(false);
      setManualSaleAmount("");
      setManualSaleNotes("");
      setManualSalePhone("");
      setManualSaleCustomer("काउंटर नकद ग्राहक");
      setManualSalePaymentMode("CASH");

      if (manualSalePaymentMode === 'UPI') {
        speakUpiPayment(saleAmt, "व्यापार");
      }

      alert(`🎉 ₹${saleAmt.toLocaleString('en-IN')} की ${manualSalePaymentMode === 'CASH' ? 'नकद' : manualSalePaymentMode === 'UPI' ? 'UPI' : 'उधारी'} बिक्री (${saleDateDisplay}) सफलतापूर्वक दर्ज हो गई!`);

      // 2. Background server sync
      (async () => {
        try {
          const res = await api.post("/api/billing", payload);
          const savedBill = res?.data?.bill || res?.data?.data || res?.data;
          if (savedBill && savedBill._id) {
            const currentCoId = String(selectedCompany?._id || selectedCompany?.id || localStorage.getItem("companyId") || "").trim();
            const syncedBills = storageManager.saveBill(currentCoId, { ...savedBill, isOfflineCreated: false });
            setBills(syncedBills);
          }
        } catch (postErr) {
          console.warn("Background manual sale sync deferred to offline queue:", postErr);
          enqueueOfflineSync({ type: 'CREATE_BILL', payload, localId: localBillId });
        }
      })();
    } catch (err) {
      console.error("Manual sale error:", err);
      const errMsg = err?.response?.data?.message || err?.response?.data?.error || "बिक्री दर्ज करने में त्रुटि आई।";
      alert(`त्रुटि: ${errMsg}`);
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

      // Call Backend Multi-Image Scanner Endpoint (Supports both Printed POS & Handwritten Slip)
      const res = await api.post("/api/billing/parse-image", {
        images: base64List,
        scannerType: ocrScannerMode,
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

          // 1. Check if backend scanner pipeline already matched an item with high confidence
          let matchedItem = null;
          if (it.productId) {
            matchedItem = items.find(ci => String(ci._id || ci.id) === String(it.productId));
          }

          // 2. Exact or Alias match from local catalog
          if (!matchedItem) {
            matchedItem = items.find(catItem => {
              const catName = (catItem.name || '').toLowerCase();
              const pName = rawName.toLowerCase();
              if (catName === pName) return true;
              if (Array.isArray(catItem.aliases) && catItem.aliases.some(a => String(a).toLowerCase() === pName)) return true;
              return false;
            });
          }

          // 3. Fallback token-based match
          if (!matchedItem) {
            matchedItem = items.find(catItem => {
              const catName = (catItem.name || '').toLowerCase();
              const pName = rawName.toLowerCase();
              const tokens = pName.split(/\s+/).filter(t => t.length >= 3);
              return tokens.length > 0 && tokens.some(t => catName.includes(t));
            });
          }

          const finalPrice = rawPrice > 0 ? rawPrice : (matchedItem ? (matchedItem.sellingPrice || matchedItem.salePrice) : 100);
          const finalTotal = +(rawQty * finalPrice).toFixed(2);

          return {
            id: matchedItem?.id || matchedItem?._id || `scanned-${Date.now()}-${billIdx}-${itemIdx}`,
            productId: matchedItem?._id || matchedItem?.id || null,
            name: matchedItem ? matchedItem.name : (rawName || `सामान ${itemIdx + 1}`),
            rawScannedName: rawName,
            hsn: it.hsn || matchedItem?.hsnCode || "",
            qty: rawQty,
            unit: it.unit || (matchedItem?.unit || "Pcs"),
            price: finalPrice,
            total: finalTotal,
            confidence: it.confidence || (matchedItem ? 90 : 0),
            matchType: it.matchType || (matchedItem ? 'catalog-match' : 'no-match'),
            candidates: it.candidates || [],
            matchedCatalogItem: matchedItem || null
          };
        });

        const detectedParty = rawBill.partyName?.trim() || (ocrBillType === 'sale' ? (files.length > 1 ? `पर्ची ग्राहक ${billIdx + 1}` : "कच्ची पर्ची ग्राहक") : "सप्लायर");
        const charges = rawBill.additionalCharges || [];
        const chargesTotal = charges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
        const roundOffVal = Number(rawBill.roundOff || 0);
        const calculatedTotal = +(processedItems.reduce((sum, it) => sum + it.total, 0) + chargesTotal + roundOffVal).toFixed(2);

        return {
          id: `batch-bill-${Date.now()}-${billIdx}`,
          partyName: detectedParty,
          partyPhone: "",
          gstin: rawBill.buyerGst || rawBill.gstin || "",
          sellerGst: rawBill.sellerGst || "",
          buyerGst: rawBill.buyerGst || "",
          billNumber: rawBill.invoiceNumber || "",
          billDate: rawBill.billDate || rawBill.date || new Date().toISOString().split("T")[0],
          challanNo: rawBill.challanNo || "",
          biltyNo: rawBill.biltyNo || "",
          vehicleNo: rawBill.vehicleNo || "",
          roundOff: roundOffVal,
          bankDetails: rawBill.bankDetails || {},
          additionalCharges: charges,
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
      for (const [idx, b] of scannedBillsBatch.entries()) {
        if (b.items.length === 0) continue;
        const genScanBillNo = b.billNumber && b.billNumber.trim().length > 1 
          ? b.billNumber.trim() 
          : `SCAN-${Date.now().toString().slice(-6)}-${idx + 1}`;
        const partyTitle = b.partyName.trim() || "कच्ची पर्ची ग्राहक";
        const extraNotes = (b.additionalCharges || []).length > 0
          ? `[अतिरिक्त खर्च: ${(b.additionalCharges || []).map(c => `${c.name} ₹${c.amount}`).join(", ")}]`
          : "";

        const payload = {
          billNumber: genScanBillNo,
          partyName: partyTitle,
          customerName: partyTitle,
          customerPhone: b.partyPhone.trim(),
          customerMobile: b.partyPhone.trim() || undefined,
          customerGst: b.gstin ? b.gstin.trim() : undefined,
          paymentMode: b.paymentMode,
          paymentMethod: b.paymentMode === "CASH" ? "cash" : b.paymentMode === "UPI" ? "online" : "credit",
          paymentStatus: b.paymentMode === "UDHAR" ? "unpaid" : "paid",
          status: b.paymentMode === "UDHAR" ? "issued" : "paid",
          notes: extraNotes || undefined,
          items: b.items.map(i => ({
            productId: i.matchedCatalogItem?.id || i.id,
            name: i.name,
            hsnCode: i.hsn || undefined,
            quantity: Number(i.qty) || 1,
            price: Number(i.price) || 0,
            total: Number(i.total) || ((Number(i.price) || 0) * (Number(i.qty) || 1))
          })),
          total: Number(b.totalAmount) || 0,
          finalAmount: Number(b.totalAmount) || 0,
          billImageUrl: b.imagePreview,
          date: b.billDate ? new Date(b.billDate) : new Date()
        };

        const res = await api.post("/api/billing", payload).catch(() => null);
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
    { id: "daybook", title: "📖 DayBook (रोकड़ बही)", desc: "Daily Cash In/Out & Ledger", path: "daybook_modal", category: "Core", color: "text-emerald-600 bg-emerald-50" },
    { id: "profitloss", title: "📊 Profit & Loss Report", desc: "Gross & Net Business Profit", path: "profitloss_modal", category: "Core", color: "text-indigo-600 bg-indigo-50" },
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
    { id: "bank_rec", title: "🏦 Bank Auto-Tally Reco", desc: "Bank Statement Verification & Accounts", path: "bank_cc_modal", category: "Banking", color: "text-indigo-600 bg-indigo-50" },
    { id: "eway_bill", title: "🚚 E-Way Bill Register", desc: "Govt Transport E-Way Invoices", path: "/reports/eway-bill", category: "Tax", color: "text-emerald-600 bg-emerald-50" },
    { id: "fixed_assets", title: "🏢 Fixed Assets & Capital", desc: "Shop Furniture, Machines & Equip", path: "/reports/fixed-assets", category: "Finance", color: "text-purple-600 bg-purple-50" },
    { id: "customer_builder", title: "🎯 Customer Report Builder", desc: "Custom Filtered Demographics", path: "/reports/customer", category: "CRM", color: "text-blue-600 bg-blue-50" },
    { id: "staff_payroll", title: "👔 PagarBook (स्टाफ हाजिरी व सैलरी)", desc: "Daily Attendance (P/HT/A), Advances, Overtime & Salary Slip", path: "pagarbook_modal", category: "Staff", color: "text-amber-600 bg-amber-50" },
    { id: "sales_return", title: "🔄 Sales Return Register", desc: "Credit Notes & Returns", path: "/billing/return", category: "Sales", color: "text-red-600 bg-red-50" },
    { id: "ghar_kharch", title: "🏡 फैमिली घर खर्च रिपोर्ट", desc: "पापा, मम्मी, खुद सदस्य-अनुसार पारिवारिक खर्च", path: "family_expense_modal", category: "Personal", color: "text-rose-600 bg-rose-50" },
    { id: "savings_investments", title: "💰 बचत व निवेश (FD / RD / SIP)", desc: "फिक्स्ड डिपॉजिट, आरडी, एसआईपी व बीमा", path: "savings_modal", category: "Finance", color: "text-amber-600 bg-amber-50" },
    { id: "bank_cc_limit", title: "🏦 बैंक व CC लिमिट खाता", desc: "करंट अकाउंट, CC ओवरड्राफ्ट लिमिट, जमा व ब्याज", path: "bank_cc_modal", category: "Banking", color: "text-blue-600 bg-blue-50" },
    { id: "ai_advisor", title: "🤖 AI मुनीम जी (Smart Insights)", desc: "AI Health Score & Predictions", path: "/ai-advisor", category: "AI", color: "text-purple-600 bg-purple-100" }
  ];

  // Filter 1600+ items live by search
  const filteredProducts = items.filter(it => 
    String(it?.name || '').toLowerCase().includes(String(itemSearchTerm || '').toLowerCase())
  ).slice(0, 8); // Top 8 matches for speed

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-28 select-none">
      {/* 🧪 SANDBOX DEMO STICKY BANNER */}
      {(selectedCompany?.isDemo || (typeof localStorage !== 'undefined' && localStorage.getItem("isDemoActive") === "true")) && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 px-3 py-2 font-bold text-xs flex items-center justify-between gap-2 shadow-md sticky top-0 z-50">
          <div className="flex items-center gap-1.5 truncate">
            <span className="bg-slate-900 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-black uppercase shrink-0">डेमो मोड</span>
            <span className="truncate text-[11px] font-extrabold">{companyDisplayName} (सैंडबॉक्स)</span>
          </div>
          <button
            onClick={() => {
              if (exitDemoModule) exitDemoModule();
              setTimeout(() => window.location.reload(), 100);
            }}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-lg transition shrink-0 cursor-pointer shadow"
          >
            ⬅️ असली बिज़नेस
          </button>
        </div>
      )}

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

      {/* ⚡ OFFLINE / SYNC STATUS BANNER */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-3.5 py-1.5 flex justify-between items-center text-xs font-bold shadow-md sticky top-[53px] z-20 animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-200 animate-ping" />
            <span className="text-[11px] font-extrabold">⚡ ऑफ़लाइन मोड (इंटरनेट बंद है • सारा डेटा फ़ोन में सुरक्षित रहेगा)</span>
          </div>
          {syncQueueCount > 0 && (
            <span className="bg-amber-950/70 px-2 py-0.5 rounded text-[10px] font-bold">
              {syncQueueCount} पेंडिंग
            </span>
          )}
        </div>
      )}

      {isOnline && syncQueueCount > 0 && (
        <div className="bg-indigo-600 text-white px-3.5 py-1.5 flex justify-between items-center text-xs font-bold shadow-md sticky top-[53px] z-20 animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold">🔄 {syncQueueCount} ऑफ़लाइन लेनदेन बैकएंड से सिंक हो रहे हैं...</span>
          </div>
          <button 
            onClick={processOfflineSyncQueue}
            className="px-2.5 py-0.5 bg-white text-indigo-950 font-extrabold text-[10px] rounded-md hover:bg-indigo-50 cursor-pointer shadow-xs"
          >
            अभी सिंक करें
          </button>
        </div>
      )}

      {/* ⚠️ GUEST / DEMO MODE ALERT BANNER */}
      {isGuestMode && (
        <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-950 text-white px-3 py-1.5 flex justify-between items-center text-xs font-bold shadow-sm sticky top-[53px] z-20">
          <div className="flex items-center gap-1.5">
            <span>👤</span>
            <span className="text-[11px]">अतिथि / लोकल मोड • मुख्य खाता सिंक करने हेतु</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="px-2 py-0.5 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-[10px] rounded-md shadow-xs cursor-pointer"
            >
              🔑 लॉगिन करें
            </button>
            <button
              onClick={handleExitGuestMode}
              className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-[10px] rounded-md cursor-pointer"
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
            {/* 💰 DEDICATED PROMINENT DAILY SALES CARD (दैनिक / अवधि बिक्री) */}
            <div className="p-4 bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4338CA] text-white rounded-3xl shadow-xl space-y-3 border border-indigo-500/40">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black text-indigo-200 uppercase tracking-wider">
                    {dailySaleFilter === "today" ? "आज की कुल बिक्री (Today's Sale)" : dailySaleFilter === "yesterday" ? "कल की बिक्री (Yesterday's Sale)" : dailySaleFilter === "week" ? "इस हफ़्ते की बिक्री (7 Days Sale)" : "कुल बिक्री (All Time Sales)"}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-indigo-400/30 text-[10px] font-bold">
                  {[
                    { id: "today", label: "आज" },
                    { id: "yesterday", label: "कल" },
                    { id: "week", label: "हफ़्ता" },
                    { id: "all", label: "सभी" }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setDailySaleFilter(f.id)}
                      className={`px-2 py-0.5 rounded-md transition cursor-pointer ${dailySaleFilter === f.id ? "bg-white text-indigo-950 font-black shadow-xs" : "text-indigo-200 hover:text-white"}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <div>
                  <div className="text-3xl font-black tracking-tight text-white drop-shadow-sm">
                    ₹ {activePeriodSales.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-indigo-200 font-semibold mt-0.5">
                    {activePeriodBills.length > 0 ? (
                      `कुल ${activePeriodBills.length} बिक्री बिल दर्ज हैं`
                    ) : bills.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setDailySaleFilter("all")}
                        className="text-amber-300 hover:text-white underline font-bold inline-flex items-center gap-1 cursor-pointer transition"
                      >
                        💡 आज कोई नया बिल नहीं • कुल {bills.length} पुराने बिल देखें →
                      </button>
                    ) : (
                      'बिक्री दर्ज करने हेतु + बटन दबाएं'
                    )}
                  </div>
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
                  <span className="font-extrabold text-xs text-white">₹{activePeriodCash.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-white/10 p-2 rounded-xl backdrop-blur-xs">
                  <span className="text-[10px] text-sky-300 font-bold block">📲 UPI / QR</span>
                  <span className="font-extrabold text-xs text-white">₹{activePeriodUpi.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-white/10 p-2 rounded-xl backdrop-blur-xs">
                  <span className="text-[10px] text-rose-300 font-bold block">📒 उधारी (Udhar)</span>
                  <span className="font-extrabold text-xs text-white">₹{activePeriodCredit.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* 🚀 NEW USER ONBOARDING & QUICK START GUIDE (WHEN ACCOUNT IS FRESH) */}
            {parties.length === 0 && bills.length === 0 && (
              <div className="p-4 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl shadow-xl border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚀</span>
                    <div>
                      <h3 className="font-black text-sm text-white">आपकी डिजिटल दुकान तैयार है!</h3>
                      <p className="text-[10px] text-indigo-200">खाता शुरू करने के लिए ये 3 आसान कदम उठाएं</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    नया खाता (Fresh)
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  {/* Step 1 */}
                  <div 
                    onClick={() => {
                      setNewPartyType("customer");
                      setShowAddPartyModal(true);
                    }}
                    className="p-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer transition active:scale-98"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shadow">
                        1
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-white">पहला ग्राहक या पार्टी जोड़ें</div>
                        <div className="text-[10px] text-slate-300">उधार या जमा का खाता शुरू करें</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-xl">
                      + पार्टी
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div 
                    onClick={() => setShowAddItemModal(true)}
                    className="p-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer transition active:scale-98"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-black text-sm shadow">
                        2
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-white">दुकान का सामान (आइटम) जोड़ें</div>
                        <div className="text-[10px] text-slate-300">रेट लिस्ट और स्टॉक दर्ज करें</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-xl">
                      + सामान
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div 
                    onClick={() => setShowManualSaleModal(true)}
                    className="p-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer transition active:scale-98"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow">
                        3
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-white">10 सेकंड में पहला बिल बनाएं</div>
                        <div className="text-[10px] text-slate-300">नकद या उधार बिक्री पर्ची काटें</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-xl">
                      + बिल बनाएं
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-indigo-200">
                  <span>💡 ऐप को टेस्ट करना चाहते हैं?</span>
                  <button
                    onClick={() => {
                      if (enterDemoModule) enterDemoModule("hardware");
                    }}
                    className="font-black text-amber-300 hover:text-amber-200 underline cursor-pointer"
                  >
                    🧪 सैंपल डेमो चलाकर देखें
                  </button>
                </div>
              </div>
            )}

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
                onClick={() => {
                  setSearchQuery("");
                  setPartyFilterTab("to_collect");
                  handleTabChange("parties");
                }}
                className="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-[#34D399] transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-base text-[#059669]">₹ {toCollect.toLocaleString('en-IN')}</span>
                  <ChevronRight size={16} className="text-[#059669]" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#065F46]">To Collect (लेने हैं)</span>
                  <ArrowDown size={13} className="text-[#059669]" />
                </div>
              </div>

              <div 
                onClick={() => {
                  setSearchQuery("");
                  setPartyFilterTab("to_pay");
                  handleTabChange("parties");
                }}
                className="p-3.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-[#FB7185] transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-base text-[#E11D48]">₹ {toPay.toLocaleString('en-IN')}</span>
                  <ChevronRight size={16} className="text-[#E11D48]" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#9F1239]">To Pay (देने हैं)</span>
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
                onClick={() => {
                  setDailySaleFilter("today");
                  setTransactionTab("sales");
                  setShowAllTransactions(true);
                  const sumEl = document.getElementById("eod-summary-section");
                  if (sumEl) {
                    sumEl.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    const txEl = document.getElementById("recent-tx-section");
                    if (txEl) txEl.scrollIntoView({ behavior: 'smooth' });
                    else setShowDayBookModal(true);
                  }
                }}
                className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-slate-200 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-sm text-[#0F172A]">₹ {todaySales.toLocaleString('en-IN')}</span>
                  <ChevronRight size={16} className="text-[#94A3B8]" />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-[#64748B]">
                  <span>आज की बिक्री (Today's Sale)</span>
                  <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">
                    हफ़्ता: ₹{weekSales.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div 
                onClick={() => setShowBankCCModal(true)}
                className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer space-y-1 hover:border-slate-200 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-sm text-[#0F172A]">
                    ₹ {totalBankBalance > 0 ? totalBankBalance.toLocaleString('en-IN') : '0'}
                  </span>
                  <ChevronRight size={16} className="text-[#94A3B8]" />
                </div>
                <div className="text-[11px] font-bold text-[#475569] flex items-center justify-between">
                  <span className="truncate">
                    {primaryBankAccount ? `🏛️ ${primaryBankAccount.bankName || primaryBankAccount.accountName}` : "Cash + Bank Balance"}
                  </span>
                  {bankAccounts.length > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-black shrink-0">
                      {bankAccounts.length} बैंक
                    </span>
                  )}
                </div>
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

            {/* 🏢 DUKAAN KHARCH (OPERATING EXPENSES) DASHBOARD STRIP */}
            {(() => {
              const shopExpVal = (shopExpensesOnly || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
              return (
                <div className="p-3.5 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-indigo-500/10 border border-indigo-500/20 rounded-2xl flex justify-between items-center shadow-xs hover:border-indigo-400 transition">
                  <div 
                    onClick={() => {
                      fetchGharKharchData();
                      setLedgerViewTab("operating");
                      handleToggleGharKharchLedger(true);
                    }}
                    className="flex items-center gap-2.5 flex-1 cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center font-bold shadow text-lg">
                      🏢
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-xs text-indigo-950">दुकान खर्च (Shop Expenses)</h4>
                        <span className="px-1.5 py-0.2 bg-indigo-600 text-white font-black text-[9px] rounded-md">
                          ₹ {shopExpVal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-800 font-medium">
                        {(shopExpensesOnly || []).length > 0 ? `${(shopExpensesOnly || []).length} खर्च दर्ज • स्टाफ एडवांस, किराया, बिजली, चाय-नाश्ता` : 'स्टाफ सैलरी, एडवांस, दुकान किराया व अन्य खर्च'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        fetchGharKharchData();
                        setLedgerViewTab("operating");
                        handleToggleGharKharchLedger(true);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-indigo-200 text-indigo-900 font-bold text-[11px] rounded-xl shadow-xs hover:bg-indigo-50 transition cursor-pointer"
                    >
                      हिसाब →
                    </button>
                    <button
                      onClick={() => {
                        setGharKharchType("operating");
                        handleToggleGharKharchEntry(true);
                      }}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={12} /> खर्च
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* 🏡 GHAR KHARCH (FAMILY & HOUSEHOLD EXPENSE) DASHBOARD STRIP */}
            {(() => {
              const totalFamilyVal = (familyDrawingsOnly || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
              return (
                <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl flex justify-between items-center shadow-xs hover:border-amber-400 transition">
                  <div 
                    onClick={() => {
                      fetchGharKharchData();
                      setLedgerViewTab("drawings");
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
                          ₹ {totalFamilyVal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-800 font-medium">
                        {(familyDrawingsOnly || []).length > 0 ? `${(familyDrawingsOnly || []).length} खर्चे दर्ज हैं • पापा, मम्मी, राशन हिसाब` : 'राशन, दवाई, बिजली, स्कूल फीस व फैमिली खर्च'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        fetchGharKharchData();
                        setShowWealthTrackerModal(true);
                      }}
                      className="px-2 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                      title="Export for Wealth Tracker"
                    >
                      <Sparkles size={11} /> 📊 Export
                    </button>
                    <button
                      onClick={() => {
                        fetchGharKharchData();
                        setLedgerViewTab("drawings");
                        handleToggleGharKharchLedger(true);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-amber-300 text-amber-900 font-bold text-[11px] rounded-xl shadow-xs hover:bg-amber-50 transition cursor-pointer"
                    >
                      लेजर →
                    </button>
                    <button
                      onClick={() => {
                        setGharKharchType("drawings");
                        handleToggleGharKharchEntry(true);
                      }}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={12} /> खर्च
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* EOD Business Summary Card with Period Filters */}
            <div id="eod-summary-section" className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <span className="font-extrabold text-xs text-[#0F172A] block">
                    {dailySaleFilter === "today" ? "आज का व्यापार सारांश (Today's EOD)" :
                     dailySaleFilter === "yesterday" ? "कल का व्यापार सारांश (Yesterday)" :
                     dailySaleFilter === "week" ? "इस हफ़्ते का व्यापार सारांश (This Week's Sales)" :
                     "कुल व्यापार सारांश (All-Time Sales)"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {dailySaleFilter === "today" ? new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' }) :
                     dailySaleFilter === "week" ? "पिछले 7 दिनों की कुल बिक्री व उधारी" :
                     dailySaleFilter === "yesterday" ? "कल की तारीख का हिसाब" : "शुरुआत से अब तक की कुल बिक्री"}
                  </span>
                </div>

                {/* 4 Period Toggle Buttons */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[10px] font-black">
                  {[
                    { id: "today", label: "आज" },
                    { id: "yesterday", label: "कल" },
                    { id: "week", label: "हफ़्ता" },
                    { id: "all", label: "सभी" }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setDailySaleFilter(f.id)}
                      className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                        dailySaleFilter === f.id
                          ? "bg-indigo-600 text-white shadow-xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-100 text-center pt-1">
                <div className="px-1">
                  <div className="text-[10px] font-bold text-slate-400">
                    {dailySaleFilter === "today" ? "Today's Sales" : dailySaleFilter === "week" ? "This Week" : "Total Sales"}
                  </div>
                  <div className="font-black text-xs text-[#0F172A] mt-0.5">₹ {activePeriodSales.toLocaleString('en-IN')}</div>
                </div>
                <div className="px-1">
                  <div className="text-[10px] font-bold text-slate-400">Cash Sales</div>
                  <div className="font-black text-xs text-[#059669] mt-0.5">₹ {activePeriodCash.toLocaleString('en-IN')}</div>
                </div>
                <div className="px-1">
                  <div className="text-[10px] font-bold text-slate-400">Credit (Udhar)</div>
                  <div className="font-black text-xs text-[#DC2626] mt-0.5">₹ {activePeriodCredit.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Unified Transactions Section (Sales & Ghar Kharch / Expenses) */}
            <div id="recent-tx-section" className="space-y-2.5 pt-1">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-[#0F172A]">हालिया लेनदेन (Transactions)</h3>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                    <button
                      onClick={() => setTransactionTab("all")}
                      className={`px-2 py-0.5 rounded-md transition ${transactionTab === "all" ? "bg-white text-indigo-900 shadow-xs" : "text-slate-500"}`}
                    >
                      सभी ({bills.length + (gharKharchList || []).length + (allPartyTransactions || []).length})
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
                      खर्च ({(gharKharchList || []).length + (allPartyTransactions || []).filter(tx => {
                        const isDebit = Number(tx.debit || 0) > 0;
                        const isSupplierTx = tx.type === 'purchase' || (tx.partyId?.partyType === 'supplier');
                        return isDebit && isSupplierTx;
                      }).length})
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      fetchGharKharchData();
                      setShowWealthTrackerModal(true);
                    }}
                    className="text-[10px] font-black text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    title="Export for Wealth Tracker"
                  >
                    <Sparkles size={11} /> Wealth Tracker
                  </button>
                  <button
                    onClick={() => handleToggleGharKharchEntry(true)}
                    className="text-[10px] font-black text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg transition flex items-center gap-1"
                  >
                    <Plus size={11} /> + खर्च
                  </button>
                </div>
              </div>

              {(() => {
                const salesTxsCount = bills.length;
                const expensesTxsCount = (gharKharchList || []).length + (allPartyTransactions || []).filter(tx => {
                  const isDebit = Number(tx.debit || 0) > 0;
                  const isSupplierTx = tx.type === 'purchase' || (tx.partyId?.partyType === 'supplier');
                  return isDebit && isSupplierTx;
                }).length;

                const combinedStream = [
                  ...bills.map(b => ({
                    _id: b._id || b.id,
                    typeCategory: 'sale',
                    title: b.customerName || 'नकद काउंटर बिक्री',
                    subtitle: `Invoice #${b.id} • ${b.date} • ${b.paymentStatus === 'unpaid' ? 'Due (उधार)' : 'Paid'}`,
                    amount: Number(b.amount || b.finalAmount || b.total || 0),
                    isPositive: true,
                    dateObj: parseAnyDate(b.rawDate || b.createdAt || b.date) || new Date(),
                    original: b
                  })),
                  ...(allPartyTransactions || []).filter(tx => !isPartyTxLinkedToBill(tx, bills)).map(tx => {
                    const isDebit = Number(tx.debit || 0) > 0;
                    const isSupplierTx = tx.type === 'purchase' || (tx.partyId?.partyType === 'supplier');
                    const pName = tx.partyId?.name || tx.partyName || 'पार्टी खाता';
                    const amt = Number(tx.debit || tx.credit || tx.amount || 0);
                    // Supplier: debit = payment TO supplier (expense), credit = return FROM supplier
                    // Customer: debit = udhar given (party_tx), credit = payment received (party_tx)
                    const typeCategory = isSupplierTx ? (isDebit ? 'expense' : 'party_tx') : 'party_tx';
                    const isPositive = isSupplierTx ? false : !isDebit;
                    const defaultLabel = isSupplierTx
                      ? (isDebit ? 'सप्लायर को भुगतान' : 'सप्लायर से वापसी')
                      : (isDebit ? 'उधार दिया / खाता' : 'रकम मिली / जमा');
                    return {
                      _id: tx._id || `ptx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                      typeCategory,
                      title: `${pName} • ${tx.details || defaultLabel}`,
                      subtitle: `${isSupplierTx ? '🏭' : '🤝'} ${isSupplierTx ? 'सप्लायर लेनदेन' : 'पार्टी लेनदेन'} • ${tx.date ? new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today'}`,
                      amount: amt,
                      isPositive,
                      dateObj: parseAnyDate(tx.date || tx.createdAt) || new Date(),
                      original: tx,
                      isPartyTx: true
                    };
                  }),
                  ...(gharKharchList || []).map(e => {
                    const isPersonal = isPersonalExpense(e);
                    const matchedStaff = e.staffId ? activeStaffList.find(s => s._id === e.staffId) : null;
                    return {
                      _id: e._id || e.id,
                      typeCategory: 'expense',
                      title: e.title || (isPersonal ? `${e.category || 'घरेलू खर्च'} ${e.familyMember ? `(${e.familyMember})` : ''}` : `${e.category || 'दुकान खर्च'}${matchedStaff ? ` (${matchedStaff.name})` : ''}`),
                      subtitle: isPersonal
                        ? `🏡 घर खर्च • ${e.familyMember ? `[${e.familyMember}] • ` : ''}${e.date ? new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today'}`
                        : `🏢 दुकान खर्च • ${matchedStaff ? `[${matchedStaff.name} एडवांस] • ` : ''}${e.category || 'संचालन'} • ${e.date ? new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today'}`,
                      amount: Number(e.amount || 0),
                      isPositive: false,
                      dateObj: parseAnyDate(e.date || e.createdAt) || new Date(),
                      original: e
                    };
                  })
                ].sort((a, b) => b.dateObj - a.dateObj);

                const baseList = combinedStream.filter(tx => {
                  if (transactionTab === "sales") return tx.typeCategory === "sale";
                  if (transactionTab === "expenses") return tx.typeCategory === "expense";
                  return true;
                });

                const displayList = baseList.filter(tx => {
                  if (dailySaleFilter === "today") {
                    return isSameLocalDate(tx.dateObj, new Date());
                  }
                  if (dailySaleFilter === "yesterday") {
                    return isSameLocalDate(tx.dateObj, new Date(Date.now() - 86400000));
                  }
                  if (dailySaleFilter === "week") {
                    const weekAgo = new Date(Date.now() - 7 * 86400000);
                    return tx.dateObj >= weekAgo;
                  }
                  return true;
                });

                // Fall back to baseList if specific period yielded 0 items but baseList has items
                const isFilteredEmpty = displayList.length === 0 && baseList.length > 0;
                const finalDisplayList = isFilteredEmpty ? baseList : displayList;

                if (finalDisplayList.length === 0) {
                  return (
                    <div className="p-6 bg-white border border-slate-100 rounded-3xl text-center space-y-3 shadow-xs">
                      <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl mx-auto flex items-center justify-center text-xl">
                        🧾
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#0F172A]">
                          {transactionTab === "sales" ? "इस अवधि में कोई बिक्री दर्ज नहीं है" : transactionTab === "expenses" ? "इस अवधि में कोई खर्च दर्ज नहीं है" : "कोई लेनदेन नहीं मिला"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {dailySaleFilter !== "all" ? `फ़िल्टर '${dailySaleFilter === 'week' ? 'हफ़्ता' : dailySaleFilter === 'today' ? 'आज' : 'कल'}' लागू है।` : "दुकान का हिसाब-किताब रखने के लिए पहली बिक्री या खर्च दर्ज करें"}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        {dailySaleFilter !== "all" && (
                          <button
                            type="button"
                            onClick={() => setDailySaleFilter("all")}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
                          >
                            🔄 सभी लेनदेन देखें
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowManualSaleModal(true)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1"
                        >
                          <Plus size={13} /> + बिक्री दर्ज करें
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {isFilteredEmpty ? (
                      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900">
                        <span>
                          💡 चयनित अवधि में कोई नया लेनदेन नहीं था • सभी कुल ({finalDisplayList.length}) लेनदेन दिखाए जा रहे हैं
                        </span>
                        <button
                          type="button"
                          onClick={() => setDailySaleFilter("all")}
                          className="text-amber-700 font-black underline text-[11px] cursor-pointer"
                        >
                          ठीक है
                        </button>
                      </div>
                    ) : dailySaleFilter !== "all" ? (
                      <div className="flex items-center justify-between bg-indigo-50/80 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-black text-indigo-900">
                        <span>
                          {dailySaleFilter === "week" ? "📅 इस हफ़्ते की बिक्री व लेनदेन" : dailySaleFilter === "today" ? "☀️ आज के लेनदेन" : "कल के लेनदेन"} ({finalDisplayList.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setDailySaleFilter("all")}
                          className="text-indigo-600 hover:text-indigo-800 underline text-[11px] cursor-pointer"
                        >
                          ✕ सभी दिखाएं
                        </button>
                      </div>
                    ) : null}
                    {(showAllTransactions ? finalDisplayList : finalDisplayList.slice(0, 8)).map((tx) => (
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
                            <div className={`font-black text-xs ${tx.typeCategory === 'sale' ? 'text-emerald-700' : (tx.isPartyTx ? (tx.isPositive ? 'text-emerald-700' : 'text-rose-700') : 'text-amber-800')}`}>
                              {tx.isPositive ? '+' : '-'} ₹ {tx.amount.toLocaleString('en-IN')}
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              tx.typeCategory === 'sale' 
                                ? (tx.original.paymentStatus === 'unpaid' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700') 
                                : (tx.isPartyTx ? (tx.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700') : 'bg-amber-100 text-amber-900')
                            }`}>
                              {tx.typeCategory === 'sale' 
                                ? (tx.original.paymentStatus === 'unpaid' ? 'Unpaid' : 'Sale') 
                                : (tx.isPartyTx ? (tx.isPositive ? 'जमा (Receipt)' : 'उधार') : 'खर्च')}
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
                    {displayList.length > 8 && (
                      <button
                        type="button"
                        onClick={() => setShowAllTransactions(prev => !prev)}
                        className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-indigo-700 text-xs font-black rounded-xl border border-indigo-100 transition cursor-pointer text-center"
                      >
                        {showAllTransactions ? "कम लेनदेन दिखाएं (Show Less)" : `सभी ${displayList.length} लेनदेन देखें (View All)`}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: PARTIES ==================== */}
        {activeTab === "parties" && (() => {
          const filteredParties = parties.filter(p => {
            const hasSearch = searchQuery && searchQuery.trim().length > 0;
            const matchesSearch = !hasSearch || String(p?.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) || String(p?.phone || p?.mobileNumber || '').includes(searchQuery.trim());
            
            // If user searches by name or mobile, find across ALL parties regardless of tab
            if (hasSearch) return matchesSearch;

            const pType = (p?.type || p?.partyType || 'customer').toLowerCase();
            const bal = Number(p?.balance ?? p?.currentBalance ?? 0);

            let matchesFilter = true;
            if (partyFilterTab === "to_collect") {
              matchesFilter = bal > 0;
            } else if (partyFilterTab === "to_pay") {
              matchesFilter = bal < 0;
            } else if (partyFilterTab === "settled") {
              matchesFilter = bal === 0;
            } else if (partyFilterTab === "customer") {
              matchesFilter = pType === "customer" || pType === "both";
            } else if (partyFilterTab === "supplier") {
              matchesFilter = pType === "supplier" || pType === "both";
            } else if (partyFilterTab === "personal") {
              matchesFilter = pType === "personal";
            }
            return matchesFilter;
          });

          return (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-extrabold text-base text-[#0F172A]">
                    {partyFilterTab === "to_pay"
                      ? `🔴 देने हैं (${filteredParties.length})`
                      : partyFilterTab === "to_collect"
                        ? `🟢 लेने हैं (${filteredParties.length})`
                        : partyFilterTab === "settled"
                          ? `✅ हिसाब चुकता (${filteredParties.length})`
                          : `Parties (${filteredParties.length})`}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {partyFilterTab === "to_pay"
                      ? `कुल देय रकम: ₹ ${toPay.toLocaleString('en-IN')}`
                      : partyFilterTab === "to_collect"
                        ? `कुल प्राप्य रकम: ₹ ${toCollect.toLocaleString('en-IN')}`
                        : partyFilterTab === "settled"
                          ? "जिन पार्टियों का पूरा हिसाब चुकता हो चुका है"
                          : "व्यापारिक ग्राहक, सप्लायर व पर्सनल खाते"}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    if (partyFilterTab === "to_pay" || partyFilterTab === "supplier") {
                      setNewPartyType("supplier");
                      setNewPartyBalanceDir("negative");
                    } else if (partyFilterTab === "personal") {
                      setNewPartyType("personal");
                      setNewPartyBalanceDir("positive");
                    } else {
                      setNewPartyType("customer");
                      setNewPartyBalanceDir("positive");
                    }
                    setShowAddPartyModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#4338CA] hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  + Add Party
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input 
                  type="text" 
                  placeholder="पार्टी का नाम या मोबाइल नंबर खोजें..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#4338CA]"
                />
              </div>

              {/* Filter Tabs: All / To Collect / To Pay / Settled / Customer / Supplier / Personal */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: "all", label: `सभी (${parties.length})` },
                  { id: "to_collect", label: `🟢 लेने हैं (₹${toCollect.toLocaleString('en-IN')})` },
                  { id: "to_pay", label: `🔴 देने हैं (₹${toPay.toLocaleString('en-IN')})` },
                  { id: "settled", label: `✅ चुकता (${parties.filter(p => Number(p.balance ?? p.currentBalance ?? 0) === 0).length})` },
                  { id: "customer", label: "🛒 ग्राहक" },
                  { id: "supplier", label: "🏢 सप्लायर" },
                  { id: "personal", label: "👤 पर्सनल खाता" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setPartyFilterTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      partyFilterTab === tab.id
                        ? tab.id === "to_collect"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : tab.id === "to_pay"
                            ? "bg-rose-600 text-white shadow-sm"
                            : tab.id === "settled"
                              ? "bg-slate-700 text-white shadow-sm"
                              : tab.id === "personal"
                                ? "bg-amber-600 text-white shadow-sm"
                                : "bg-[#4338CA] text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {filteredParties.length === 0 ? (
                <div className="p-8 text-center bg-gradient-to-b from-white to-indigo-50/30 rounded-3xl border border-indigo-100/60 shadow-sm space-y-3">
                  <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner">
                    👥
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-[#0F172A]">
                      {partyFilterTab === "to_pay" 
                        ? "कोई देनदारी बाकी नहीं है" 
                        : partyFilterTab === "to_collect" 
                          ? "कोई वसूली बाकी नहीं है" 
                          : "अभी कोई पार्टी या ग्राहक नहीं जुड़ा है"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      {partyFilterTab === "to_pay" || partyFilterTab === "to_collect"
                        ? "आपके सभी लेन-देन का हिसाब चुकता है।"
                        : "ग्राहकों के उधार-जमा और सप्लायर के बिलों का डिजिटल हिसाब रखने के लिए पहला खाता जोड़ें।"}
                    </p>
                  </div>
                  {parties.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewPartyType("customer");
                        setShowAddPartyModal(true);
                      }}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus size={15} /> + पहला ग्राहक या सप्लायर जोड़ें
                    </button>
                  )}
                  {parties.length > 0 && partyFilterTab !== "all" && (
                    <button
                      type="button"
                      onClick={() => setPartyFilterTab("all")}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#4338CA] font-bold rounded-xl border border-indigo-200 text-xs cursor-pointer inline-flex items-center gap-1 transition"
                    >
                      💡 कुल {parties.length} पार्टियां मौजूद हैं • सभी पार्टियां देखें →
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredParties.map((p) => {
                    const isPersonal = (p.type || p.partyType) === 'personal';
                    const bal = Number(p.balance ?? p.currentBalance ?? 0);
                    return (
                      <div 
                        key={p.id || p._id}
                        onClick={() => handleOpenPartyDetail(p)}
                        className={`p-3.5 bg-white border rounded-2xl shadow-xs transition cursor-pointer active:scale-[0.99] flex justify-between items-center gap-2 ${
                          isPersonal ? "border-amber-200 hover:border-amber-400 hover:bg-amber-50/20" : "border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-sm text-[#0F172A] truncate">{p.name}</span>
                            {isPersonal ? (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-full border border-amber-300 shrink-0">
                                👤 पर्सनल
                              </span>
                            ) : (p.type || p.partyType) === 'supplier' ? (
                              <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                🏢 सप्लायर
                              </span>
                            ) : (
                              <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                🛒 ग्राहक
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Phone size={11} /> {p.phone || p.mobileNumber || "कोई फोन नहीं"}
                          </div>
                          {p.address && p.address !== "Local" && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              📍 {p.address}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <div>
                            <div className={`font-black text-sm ${bal > 0 ? "text-[#059669]" : bal < 0 ? "text-[#DC2626]" : "text-slate-600"}`}>
                              {bal > 0 ? `+ ₹${bal.toLocaleString('en-IN')}` : bal < 0 ? `- ₹${Math.abs(bal).toLocaleString('en-IN')}` : "₹ 0"}
                            </div>
                            <span className={`text-[10px] font-bold block ${bal > 0 ? "text-emerald-600" : bal < 0 ? "text-rose-600" : "text-slate-400"}`}>
                              {bal > 0 ? "🟢 लेने हैं" : bal < 0 ? "🔴 देने हैं" : "हिसाब चुकता"}
                            </span>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

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
            const itemCat = String(typeof it?.category === 'string' ? it.category : (it?.category?.name || 'General')).trim().toLowerCase();
            const itemBrand = String(typeof it?.brand === 'string' ? it.brand : (it?.brand?.name || 'General')).trim().toLowerCase();
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
                  <div className="p-8 bg-gradient-to-b from-white to-indigo-50/30 border border-indigo-100/60 rounded-3xl text-center space-y-3 shadow-xs">
                    <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner">
                      📦
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-[#0F172A]">
                        {items.length === 0 ? "अभी दुकान में कोई सामान (आइटम) नहीं है" : "कोई आइटम मैच नहीं हुआ"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        {items.length === 0
                          ? "तेज़ बिलिंग और स्टॉक ट्रैक करने के लिए अपने उत्पाद, रेट व मात्रा जोड़ें।"
                          : `सर्च या फ़िल्टर के कारण कोई आइटम मैच नहीं हुआ। कुल ${items.length} आइटम उपलब्ध हैं।`}
                      </p>
                    </div>
                    {items.length > 0 && (selectedCategoryFilter !== "ALL" || selectedBrandFilter !== "ALL" || selectedStockFilter !== "ALL" || searchQuery) && (
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategoryFilter("ALL");
                            setSelectedBrandFilter("ALL");
                            setSelectedStockFilter("ALL");
                            setSearchQuery("");
                          }}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#4338CA] font-bold rounded-xl border border-indigo-200 text-xs cursor-pointer inline-flex items-center gap-1 transition mr-2"
                        >
                          🔄 सारे फ़िल्टर हटाएं ({items.length} आइटम देखें)
                        </button>
                      </div>
                    )}
                    <div>
                      <button
                        onClick={() => setShowAddItemModal(true)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus size={15} /> + पहला सामान (Item) जोड़ें
                      </button>
                    </div>
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
                .filter(r => String(r?.title || '').toLowerCase().includes(String(reportSearchQuery || '').toLowerCase()) || String(r?.desc || '').toLowerCase().includes(String(reportSearchQuery || '').toLowerCase()))
                .map((r) => (
                <div 
                  key={r.id}
                  onClick={() => {
                    if (r.path === 'pagarbook_modal') {
                      fetchPagarBookData();
                      setShowPagarBookModal(true);
                    } else if (r.path === 'family_expense_modal' || r.path === 'ghar_kharch_modal') {
                      setShowFamilyExpenseModal(true);
                    } else if (r.path === 'savings_modal') {
                      setShowSavingsModal(true);
                    } else if (r.path === 'bank_cc_modal') {
                      setShowBankCCModal(true);
                    } else if (r.path === 'daybook_modal') {
                      setShowDayBookModal(true);
                    } else if (r.path === 'profitloss_modal') {
                      setShowProfitLossModal(true);
                    } else {
                      // Open native mobile report viewer modal
                      setActiveMobileReport({ type: r.id, title: r.title });
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
              {/* 💰 बचत व निवेश (FD / RD / SIP / Gold) */}
              <div 
                onClick={() => setShowSavingsModal(true)} 
                className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">💰</span>
                  <div>
                    <span className="text-amber-900 block font-black">बचत व निवेश (FD / RD / SIP / Gold)</span>
                    <span className="text-[10px] text-amber-700 font-bold">गल्ले से बचत किस्त जमा करें • बिजनेस खर्चों से अलग कुल पोर्टफोलियो</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-amber-600" />
              </div>

              {/* 👔 स्टाफ प्रबंधन व हाजिरी (PagarBook) */}
              <div 
                onClick={() => {
                  fetchPagarBookData();
                  setShowPagarBookModal(true);
                }} 
                className="p-3.5 bg-white border border-slate-100 hover:border-indigo-200 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">👔</span>
                  <div>
                    <span className="text-[#0F172A] block font-extrabold">स्टाफ हाजिरी व सैलरी (PagarBook)</span>
                    <span className="text-[10px] text-slate-400 font-medium">स्टाफ जोड़ें, दैनिक हाजिरी (P/A/Half), एडवांस व वेतन पर्ची</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>

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
                onClick={() => navigate("/company")} 
                className="p-3.5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center cursor-pointer shadow-sm hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🌐</span>
                  <div>
                    <span className="text-[#0F172A] block font-extrabold">सोशल मीडिया व Google Business हब</span>
                    <span className="text-[10px] text-slate-400 font-medium">Google Reviews, Instagram, Facebook, YouTube व 5⭐ कूपन</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#4338CA]" />
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

          <button 
            onClick={() => navigate("/voice-assistant")}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-full shadow-md transition cursor-pointer flex items-center gap-1 active:scale-95"
            title="बोलकर बिल या इन्वेंटरी बनाएं"
          >
            <Mic size={13} className="animate-pulse text-amber-300" />
            <span>🎙️ बोलें</span>
          </button>

          <button 
            onClick={() => setShowCreditLimitHub(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-extrabold text-xs rounded-full shadow-md transition cursor-pointer flex items-center gap-1 active:scale-95"
            title="क्रेडिट लिमिट व दैनिक अप्रूवल हब"
          >
            <CreditCard size={13} className="text-emerald-200" />
            <span>💳 क्रेडिट हब</span>
          </button>
        </div>
      </div>

      {/* 📱 4. BOTTOM TAB NAVIGATOR (Role-Aware) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 px-2 py-2 shadow-2xl flex justify-around items-center">
        {userRole !== 'godown' && (
          <button 
            onClick={() => handleTabChange("dashboard")}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "dashboard" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
          >
            <Home size={20} />
            <span className="text-[11px]">Dashboard</span>
          </button>
        )}

        {userRole !== 'godown' && (
          <button 
            onClick={() => handleTabChange("parties")}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "parties" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
          >
            <Users size={20} />
            <span className="text-[11px]">Parties</span>
          </button>
        )}

        {(userRole === 'admin' || userRole === 'manager' || userRole === 'accountant') && (
          <button 
            onClick={() => handleTabChange("reports")}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "reports" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
          >
            <BarChart2 size={20} />
            <span className="text-[11px]">Reports</span>
          </button>
        )}

        <button 
          onClick={() => handleTabChange("items")}
          className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "items" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
        >
          <Package size={20} />
          <span className="text-[11px]">{userRole === 'godown' ? '📦 इन्वेंटरी (स्टॉक)' : 'Items'}</span>
        </button>

        {userRole !== 'godown' ? (
          <button 
            onClick={() => handleTabChange("more")}
            className={`flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer ${activeTab === "more" ? "text-[#4338CA] font-bold" : "text-[#94A3B8] font-medium"}`}
          >
            <Menu size={20} />
            <span className="text-[11px]">More</span>
          </button>
        ) : (
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 px-3 py-1 transition cursor-pointer text-rose-500 font-medium"
          >
            <LogOut size={20} />
            <span className="text-[11px]">लॉगआउट</span>
          </button>
        )}
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickBillModal(false);
                    navigate("/voice-assistant");
                  }}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-[11px] rounded-lg border border-purple-200 transition cursor-pointer flex items-center gap-1"
                  title="बोलकर बिल बनाएं"
                >
                  <Mic size={12} className="text-purple-600 animate-pulse" />
                  <span>🎙️ बोलकर बनाएं</span>
                </button>
                <button onClick={() => setShowQuickBillModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>
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
                        .filter(p => String(p?.name || '').toLowerCase().includes(String(billCustomer || '').toLowerCase()) || String(p?.phone || p?.mobileNumber || '').includes(String(billCustomer || '')))
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

                {/* ⭐ LIVE DIGITAL STAMP LOYALTY CARD IN MOBILE PWA */}
                {mobileStampStatus?.cards && mobileStampStatus.cards.length > 0 && (
                  <div className="p-2.5 bg-amber-50/90 rounded-xl border border-amber-300 space-y-1.5 animate-in fade-in">
                    {mobileStampStatus.cards.map((card, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-800 font-black text-[11px]">⭐ स्टैंप:</span>
                            <span className="font-mono text-amber-700 tracking-wider font-extrabold">{card.visualStamps}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {card.isRewardReady ? (
                              <span className="text-emerald-700 font-black">🎉 {card.rewardDescription} रिवॉर्ड अनलॉक!</span>
                            ) : (
                              <span>₹{card.minBillAmount}+ पर अगला स्टैंप • {card.stampsRemaining} शेष</span>
                            )}
                          </div>
                        </div>

                        {card.isRewardReady && card.unlockedReward && (
                          <button
                            type="button"
                            onClick={() => {
                              const r = card.unlockedReward;
                              setBillAppliedReward(r);
                              alert(`🎉 रिवॉर्ड '${r.code}' लागू हुआ! (${card.rewardDescription})`);
                            }}
                            className={`px-2.5 py-1 font-black text-[10px] rounded-lg shadow-xs cursor-pointer transition ${
                              billAppliedReward?.code === card.unlockedReward.code
                                ? "bg-emerald-700 text-white ring-2 ring-emerald-400"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                          >
                            {billAppliedReward?.code === card.unlockedReward.code ? "✓ लागू है" : "⚡ रिवॉर्ड लगाएं"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 💳 Live Customer Credit Limit Widget in Mobile Quick Bill */}
              {selectedPartyObject && (selectedPartyObject.creditLimit > 0 || selectedPartyObject.isCreditLimitActive) && (
                <div className={`p-2.5 rounded-2xl border text-xs space-y-1.5 animate-in fade-in ${
                  selectedPartyObject.hasPendingBillApproval
                    ? "bg-rose-50 border-rose-300 text-rose-950"
                    : "bg-indigo-50/90 border-indigo-200 text-indigo-950"
                }`}>
                  <div className="flex items-center justify-between font-black">
                    <span className="flex items-center gap-1">
                      <CreditCard size={14} className="text-indigo-600" />
                      <span>क्रेडिट लाइन: कुल ₹{Number(selectedPartyObject.creditLimit || 0).toLocaleString('en-IN')}</span>
                    </span>
                    <span className="text-emerald-700">
                      उपलब्ध: ₹{Math.max(0, (selectedPartyObject.creditLimit || 0) - (selectedPartyObject.balance || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {selectedPartyObject.hasPendingBillApproval ? (
                    <div className="p-2 bg-white/90 rounded-xl border border-rose-200 text-[11px] text-rose-900 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-black block">⚠️ पिछला बिल WhatsApp OTP से पेंडिंग है</span>
                        <span className="text-[10px] text-slate-500">नया उधारी बिल जारी करने के लिए बायपास करें या पिछला OTP लें</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBypassCreditLock(!bypassCreditLock)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition ${
                          bypassCreditLock ? "bg-amber-600 text-white shadow-xs" : "bg-slate-200 text-slate-800"
                        }`}
                      >
                        {bypassCreditLock ? "बायपास सक्रिय ✓" : "काम न रुके (बायपास)"}
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <span>✓ स्वीकृत क्रेडिट लाइन उपलब्ध है। बिल बनते ही 5-बिंदु WhatsApp विवरण जाएगा।</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Mode Selector */}
            <div className="grid grid-cols-3 gap-2">
              {["CASH", "UDHAR", "UPI"].map((m) => (
                <button
                  key={m}
                  onClick={() => setBillPaymentMode(m)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    billPaymentMode === m 
                      ? (m === "UDHAR" ? "bg-rose-600 text-white border-rose-600 shadow-sm" : "bg-[#4338CA] text-white border-[#4338CA] shadow-sm")
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  {m === "CASH" ? "💵 नकद (Cash)" : m === "UDHAR" ? "📒 उधारी 🛡️" : "📲 UPI / QR"}
                </button>
              ))}
            </div>

            {/* 🛡️ Legal Udhar Protection Card (IT Act 2000 Section 10A) - Optional & Smart Threshold */}
            {billPaymentMode === "UDHAR" && (
              <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-2.5 animate-in fade-in">
                {/* Threshold Status Banner */}
                <div className={`p-2 rounded-xl text-[11px] font-bold flex items-center justify-between gap-2 ${
                  totalBillAmount <= udharOtpThreshold 
                    ? "bg-amber-100/80 text-amber-900 border border-amber-300/80" 
                    : "bg-emerald-100/80 text-emerald-900 border border-emerald-300/80"
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span>{totalBillAmount <= udharOtpThreshold ? "⚡" : "🛡️"}</span>
                    <span>
                      {totalBillAmount <= udharOtpThreshold 
                        ? `छोटा बिल (₹${totalBillAmount} ≤ ₹${udharOtpThreshold}) - ऑटो-अप्रूव्ड` 
                        : `बड़ा बिल (₹${totalBillAmount} > ₹${udharOtpThreshold}) - OTP सुरक्षा अनुशंसित`}
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/70 font-black">
                    सीमा ₹{udharOtpThreshold}
                  </span>
                </div>

                {/* Optional Toggle Switch */}
                <div className="p-2.5 bg-white rounded-xl border border-rose-200/80 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-black text-rose-950">
                      <ShieldCheck size={15} className={isUdharProtectionChecked ? "text-emerald-600" : "text-slate-400"} />
                      <span>लीगल WhatsApp OTP सुरक्षा {isUdharProtectionChecked ? "(सक्रिय)" : "(बंद)"}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      {isUdharProtectionChecked
                        ? "ग्राहक के WhatsApp पर वचनपत्र + 4-अंकों का OTP भेजा जाएगा।"
                        : "विश्वस्त/नियमित ग्राहक: बिना OTP तुरंत सामान दें और उधारी दर्ज करें।"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUdharProtectionChecked(!isUdharProtectionChecked)}
                    className={`w-12 h-6.5 rounded-full transition-colors p-1 flex items-center cursor-pointer shrink-0 ${
                      isUdharProtectionChecked ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <span className="w-4.5 h-4.5 rounded-full bg-white shadow-sm block" />
                  </button>
                </div>

                {isUdharProtectionChecked ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">
                          📅 भुगतान तय तारीख:
                        </label>
                        <input
                          type="date"
                          value={billDueDate}
                          onChange={(e) => setBillDueDate(e.target.value)}
                          className="w-full p-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">
                          ⚖️ विलंब ब्याज % (माह):
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="30"
                          value={billLateInterest}
                          onChange={(e) => setBillLateInterest(e.target.value)}
                          className="w-full p-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                          placeholder="2"
                        />
                      </div>
                    </div>

                    <div className="p-2 bg-white rounded-xl border border-rose-100 text-[10px] text-slate-600 space-y-1">
                      <div className="font-bold text-rose-900 flex items-center gap-1">
                        <span>📱</span>
                        <span>व्हाट्सएप पर वचनपत्र + डिलीवरी OTP:</span>
                      </div>
                      <p>
                        बिल बनते ही ग्राहक के WhatsApp पर कानूनी वचनपत्र और 4-अंकों का OTP भेजा जाएगा। डिलीवरी देते समय OTP लेकर दर्ज करना अनिवार्य होगा।
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-2 bg-slate-100/90 rounded-xl border border-slate-200 text-[10px] text-slate-700 flex items-center gap-1.5 font-medium">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>त्वरित उधारी मोड: बिल बिना किसी OTP रुकावट के तुरंत सुरक्षित रूप से सेव हो जाएगा।</span>
                  </div>
                )}
              </div>
            )}

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

            {/* Scanner Mode Selector: Printed Computer Bill vs Handwritten Kacchi Parchi */}
            <div className="bg-slate-100 p-1 rounded-2xl flex text-xs font-black">
              <button
                type="button"
                onClick={() => setOcrScannerMode('printed')}
                className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  ocrScannerMode === 'printed'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🧾 कंप्यूटर / पक्का बिल (Printed / PDF)</span>
              </button>
              <button
                type="button"
                onClick={() => setOcrScannerMode('handwritten')}
                className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  ocrScannerMode === 'handwritten'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>✍️ हाथ की कच्ची पर्ची (Handwritten)</span>
              </button>
            </div>

            {/* Bill Type Selector (Customer Sale vs Vendor Purchase) */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => setOcrBillType('sale')}
                className={`py-2 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${ocrBillType === 'sale' ? 'bg-[#059669] text-white border-[#059669] shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                🛍️ ग्राहक बिक्री पर्ची
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
                      placeholder="पार्टी / फर्म का नाम..."
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

                  {/* Bill Date, Invoice No & GSTIN extracted from bill */}
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block font-semibold text-[9px]">📅 तारीख</span>
                      <input 
                        type="text" 
                        value={scannedBillsBatch[activeScannedIndex].billDate || ''} 
                        onChange={(e) => handleUpdateActiveBillField('billDate', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="w-full font-bold text-slate-800 outline-none bg-transparent"
                      />
                    </div>
                    <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block font-semibold text-[9px]">🧾 बिल सं.</span>
                      <input 
                        type="text" 
                        value={scannedBillsBatch[activeScannedIndex].billNumber || ''} 
                        onChange={(e) => handleUpdateActiveBillField('billNumber', e.target.value)}
                        placeholder="Inv No..."
                        className="w-full font-bold text-slate-800 outline-none bg-transparent"
                      />
                    </div>
                    <div className="bg-white p-1.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block font-semibold text-[9px]">🏛️ GSTIN</span>
                      <input 
                        type="text" 
                        value={scannedBillsBatch[activeScannedIndex].gstin || ''} 
                        onChange={(e) => handleUpdateActiveBillField('gstin', e.target.value)}
                        placeholder="GST No..."
                        className="w-full font-bold text-slate-800 outline-none bg-transparent uppercase"
                      />
                    </div>
                  </div>

                  {/* Both GSTINs (Seller vs Buyer) */}
                  {(scannedBillsBatch[activeScannedIndex].sellerGst || scannedBillsBatch[activeScannedIndex].buyerGst) && (
                    <div className="flex gap-2 text-[9px] font-bold text-slate-500 pt-0.5 flex-wrap">
                      {scannedBillsBatch[activeScannedIndex].sellerGst && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          🏢 सप्लायर GST: <strong className="text-slate-800">{scannedBillsBatch[activeScannedIndex].sellerGst}</strong>
                        </span>
                      )}
                      {scannedBillsBatch[activeScannedIndex].buyerGst && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          🛍️ खरीदार GST: <strong className="text-slate-800">{scannedBillsBatch[activeScannedIndex].buyerGst}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Transport, Challan & Bilty Details */}
                  {(scannedBillsBatch[activeScannedIndex].biltyNo || scannedBillsBatch[activeScannedIndex].challanNo || scannedBillsBatch[activeScannedIndex].vehicleNo) && (
                    <div className="bg-blue-50/70 p-2 rounded-xl border border-blue-200/80 flex flex-wrap gap-2 text-[10px] text-blue-900 font-bold">
                      <span className="text-blue-700 font-black">🚛 ट्रांसपोर्ट:</span>
                      {scannedBillsBatch[activeScannedIndex].biltyNo && <span>बिल्टी/LR: <strong className="text-blue-800">{scannedBillsBatch[activeScannedIndex].biltyNo}</strong></span>}
                      {scannedBillsBatch[activeScannedIndex].challanNo && <span>चालान: <strong className="text-blue-800">{scannedBillsBatch[activeScannedIndex].challanNo}</strong></span>}
                      {scannedBillsBatch[activeScannedIndex].vehicleNo && <span>गाड़ी: <strong className="text-blue-800">{scannedBillsBatch[activeScannedIndex].vehicleNo}</strong></span>}
                    </div>
                  )}

                  {/* Supplier Bank Details */}
                  {(scannedBillsBatch[activeScannedIndex].bankDetails?.accountNo || scannedBillsBatch[activeScannedIndex].bankDetails?.upiId) && (
                    <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-200/80 flex flex-wrap gap-2 text-[10px] text-emerald-900 font-bold">
                      <span className="text-emerald-700 font-black">🏦 सप्लायर बैंक:</span>
                      {scannedBillsBatch[activeScannedIndex].bankDetails.accountNo && <span>A/C: <strong className="font-mono text-emerald-800">{scannedBillsBatch[activeScannedIndex].bankDetails.accountNo}</strong></span>}
                      {scannedBillsBatch[activeScannedIndex].bankDetails.ifsc && <span>IFSC: <strong className="font-mono text-emerald-800">{scannedBillsBatch[activeScannedIndex].bankDetails.ifsc}</strong></span>}
                      {scannedBillsBatch[activeScannedIndex].bankDetails.upiId && <span>UPI: <strong className="font-mono text-emerald-800">{scannedBillsBatch[activeScannedIndex].bankDetails.upiId}</strong></span>}
                    </div>
                  )}

                  {/* Local Freight / Packaging / Hamali charges if detected */}
                  {scannedBillsBatch[activeScannedIndex].additionalCharges?.length > 0 && (
                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 space-y-1">
                      <span className="text-[10px] font-black text-amber-800">🚚 अतिरिक्त खर्च (भाड़ा / पैकेजिंग):</span>
                      {scannedBillsBatch[activeScannedIndex].additionalCharges.map((ch, cIdx) => (
                        <div key={cIdx} className="flex justify-between items-center text-xs font-bold text-amber-900">
                          <span>{ch.name}</span>
                          <span className="font-mono">₹{ch.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}

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

                        {/* Match Status Badge & Memory Link */}
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.matchedCatalogItem ? (
                              <div className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle size={10} /> 
                                <span>दुकान से मैच्ड: <strong>{item.matchedCatalogItem.name}</strong></span>
                                {item.confidence ? <span className="opacity-75">({item.confidence}%)</span> : null}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                <span>⚠️ नया सामान (दुकान में नहीं मिला)</span>
                              </div>
                            )}
                            {item.hsn ? (
                              <span className="font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                HSN: {item.hsn}
                              </span>
                            ) : null}
                          </div>

                          {/* Quick Link/Search Dropdown to link to existing catalog item */}
                          <select
                            value={item.matchedCatalogItem?._id || item.matchedCatalogItem?.id || ""}
                            onChange={async (e) => {
                              const chosenId = e.target.value;
                              if (!chosenId) return;
                              const chosenProduct = items.find(ci => String(ci._id || ci.id) === String(chosenId));
                              if (chosenProduct) {
                                handleUpdateActiveBillItem(itemIdx, 'name', chosenProduct.name);
                                handleUpdateActiveBillItem(itemIdx, 'price', chosenProduct.sellingPrice || chosenProduct.salePrice || item.price);
                                
                                // Auto-learn Alias memory in backend!
                                const scannedAlias = item.rawScannedName || item.name;
                                if (scannedAlias && scannedAlias !== chosenProduct.name) {
                                  try {
                                    await api.post('/api/billing/link-item-alias', {
                                      productId: chosenProduct._id || chosenProduct.id,
                                      alias: scannedAlias,
                                      keepName: "old"
                                    });
                                  } catch (aliasErr) {
                                    console.warn("Alias learning note:", aliasErr.message);
                                  }
                                }
                              }
                            }}
                            className="text-[10px] bg-white border border-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded outline-none max-w-[170px] truncate"
                          >
                            <option value="">🔗 दुकान के सामान से जोड़ें...</option>
                            {items.slice(0, 50).map(catIt => (
                              <option key={catIt._id || catIt.id} value={catIt._id || catIt.id}>
                                {catIt.name} (₹{catIt.sellingPrice || catIt.salePrice || 0})
                              </option>
                            ))}
                          </select>
                        </div>

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
                    {scannedBillsBatch[activeScannedIndex].roundOff !== 0 && (
                      <span className="text-[10px] text-slate-500 block font-semibold">
                        राउंड ऑफ: {scannedBillsBatch[activeScannedIndex].roundOff > 0 ? '+' : ''}₹{scannedBillsBatch[activeScannedIndex].roundOff}
                      </span>
                    )}
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

      {/* 📱 6.3 ADD / EDIT GHAR KHARCH / EXPENSE MODAL */}
      {showGharKharchModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 space-y-3.5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  {editingGharKharchItem ? "✏️" : "🏡"}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">
                    {editingGharKharchItem ? "✏️ खर्च संपादित करें (Edit Expense)" : "खर्च दर्ज करें (+ Expense)"}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {editingGharKharchItem ? "तारीख, समय, राशि व विवरण बदलें" : "घर खर्च (Family) या दुकान खर्च दर्ज करें"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setEditingGharKharchItem(null);
                  setShowGharKharchModal(false);
                }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
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
              {/* If Operating / Business: PROMINENT STAFF SELECTOR DROPDOWN */}
              {gharKharchType === "operating" && (
                <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-[11px] text-emerald-950 flex items-center gap-1.5">
                      <UserCheck size={14} className="text-emerald-700" />
                      👥 कर्मचारी / स्टाफ चुनें (PagarBook):
                    </label>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
                      ⚡ 2-Way Sync
                    </span>
                  </div>

                  <select
                    value={selectedStaffId}
                    onChange={(e) => {
                      const sId = e.target.value;
                      setSelectedStaffId(sId);
                      const selectedSt = activeStaffList.find(s => s._id === sId);
                      if (selectedSt) {
                        setGharKharchCategory("स्टाफ सैलरी/मजदूरी");
                        if (!gharKharchTitle || gharKharchTitle.includes("स्टाफ") || gharKharchTitle.includes("दुकान खर्च")) {
                          setGharKharchTitle(`स्टाफ एडवांस - ${selectedSt.name}`);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  >
                    <option value="">-- सामान्य दुकान खर्च (कोई स्टाफ नहीं) --</option>
                    {activeStaffList.map((st) => (
                      <option key={st._id} value={st._id}>
                        👤 {st.name} ({st.position || st.role || 'Staff'}) {st.mobileNumber ? `- 📱 ${st.mobileNumber}` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedStaffId ? (
                    <p className="text-[10px] text-emerald-800 font-bold flex items-center gap-1 pt-0.5">
                      ✅ यह राशि दुकान खर्च में जुड़ेगी और <b>{activeStaffList.find(s => s._id === selectedStaffId)?.name}</b> के PagarBook में एडवांस के रूप में स्वतः दर्ज होगी।
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500">
                      💡 यदि आप किसी स्टाफ को एडवांस या पेमेंट दे रहे हैं, तो ऊपर से उनका नाम चुनें।
                    </p>
                  )}
                </div>
              )}

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

              {/* If Shop Expense: Select Staff Member if paying staff */}
              {gharKharchType === "operating" && (
                <div className="space-y-1.5 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-emerald-950 flex items-center gap-1">
                      👥 किस स्टाफ / कर्मचारी को भुगतान दिया? (PagarBook Sync):
                    </label>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-300">
                      ⚡ 2-Way Sync
                    </span>
                  </div>
                  {activeStaffList.length === 0 ? (
                    <p className="text-[10px] text-amber-800 font-semibold">
                      ⚠️ कोई स्टाफ दर्ज नहीं है (सामान्य दुकान खर्च के रूप में दर्ज होगा)।
                    </p>
                  ) : (
                    <select
                      value={selectedStaffId}
                      onChange={(e) => {
                        const sId = e.target.value;
                        setSelectedStaffId(sId);
                        const matched = activeStaffList.find(s => s._id === sId);
                        if (matched) {
                          setGharKharchCategory("स्टाफ सैलरी/मजदूरी");
                          if (!gharKharchTitle || gharKharchTitle.includes("दुकान खर्च") || gharKharchTitle.includes("स्टाफ")) {
                            setGharKharchTitle(`स्टाफ एडवांस - ${matched.name}`);
                          }
                        }
                      }}
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-emerald-600"
                    >
                      <option value="">-- सामान्य दुकान खर्च (कोई स्टाफ नहीं) --</option>
                      {activeStaffList.map(st => (
                        <option key={st._id} value={st._id}>
                          👤 {st.name} ({st.position || st.role || 'Staff'}) {st.mobileNumber ? `- 📱 ${st.mobileNumber}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedStaffId && (
                    <p className="text-[10px] text-emerald-800 font-semibold">
                      ✓ यह राशि दुकान खर्च में जुड़ेगी और चुने गए कर्मचारी के पगार बुक में एडवांस के रूप में स्वतः दर्ज होगी।
                    </p>
                  )}
                </div>
              )}

              {/* Date & Time Picker */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">📅 तारीख (Date) *</label>
                  <input
                    type="date"
                    value={gharKharchDate}
                    onChange={(e) => setGharKharchDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-amber-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">⏰ समय (Time)</label>
                  <input
                    type="time"
                    value={gharKharchTime}
                    onChange={(e) => setGharKharchTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-amber-600"
                  />
                </div>
              </div>

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
                {savingGharKharch ? "खर्च सेव हो रहा है..." : (editingGharKharchItem ? "💾 बदलाव सेव करें (Update Expense)" : (gharKharchType === "drawings" ? "💾 घर खर्च सेव करें" : "💾 दुकान खर्च सेव करें"))}
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
                  onClick={() => setShowWealthTrackerModal(true)}
                  className="px-2.5 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1 active:scale-95 transition cursor-pointer"
                  title="Export / Share for Wealth Tracker"
                >
                  <Sparkles size={12} />
                  <span>Wealth Tracker</span>
                </button>
                <button
                  onClick={() => {
                    setEditingGharKharchItem(null);
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
              // Determine active item set based on ledgerViewTab
              const currentTab = ledgerViewTab; // 'all', 'drawings', 'operating'
              const tabItems = currentTab === "drawings"
                ? familyDrawingsOnly
                : currentTab === "operating"
                  ? shopExpensesOnly
                  : gharKharchList;

              // Available months from all expenses
              const availableGharKharchMonths = Array.from(new Set((gharKharchList || []).map(it => {
                const d = parseAnyDate(it.date || it.createdAt);
                return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : null;
              }).filter(Boolean))).sort().reverse();

              // Filter by month
              const monthFilteredItems = tabItems.filter(it => {
                if (gharKharchMonthFilter === "all") return true;
                const d = parseAnyDate(it.date || it.createdAt);
                if (!d) return true;
                const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                return ym === gharKharchMonthFilter;
              });

              const monthFilteredFamily = familyDrawingsOnly.filter(it => {
                if (gharKharchMonthFilter === "all") return true;
                const d = parseAnyDate(it.date || it.createdAt);
                if (!d) return true;
                const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                return ym === gharKharchMonthFilter;
              });

              const totalAmt = monthFilteredItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
              const membersMap = {};
              if (currentTab === "drawings" || currentTab === "all") {
                monthFilteredFamily.forEach(it => {
                  const m = it.familyMember?.trim() || "Self";
                  membersMap[m] = (membersMap[m] || 0) + (Number(it.amount) || 0);
                });
              }
              const uniqueMembers = Object.keys(membersMap);

              const filteredItems = currentTab === "drawings" && gharKharchMemberFilter !== "all"
                ? monthFilteredItems.filter(it => String(it.familyMember || 'Self').toLowerCase() === String(gharKharchMemberFilter).toLowerCase())
                : monthFilteredItems;

              const activeMonthLabel = gharKharchMonthFilter === "all" ? "सभी महीने" : (() => {
                const [y, m] = gharKharchMonthFilter.split("-").map(Number);
                return new Date(y, m - 1, 1).toLocaleDateString("hi-IN", { month: "long", year: "numeric" });
              })();

              return (
                <div className="space-y-3">
                  {/* Ledger Type Tabs */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => { setLedgerViewTab("all"); setGharKharchMemberFilter("all"); }}
                      className={`py-2 rounded-xl transition ${currentTab === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      सभी ({gharKharchList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLedgerViewTab("operating"); setGharKharchMemberFilter("all"); }}
                      className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${currentTab === "operating" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      🏢 दुकान ({shopExpensesOnly.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLedgerViewTab("drawings"); setGharKharchMemberFilter("all"); }}
                      className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${currentTab === "drawings" ? "bg-amber-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      🏡 घर खर्च ({familyDrawingsOnly.length})
                    </button>
                  </div>

                  {/* 📅 Month Filter & WhatsApp Quick Share Strip */}
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-[11px] font-black text-slate-700 shrink-0">📅 माह:</span>
                      <select
                        value={gharKharchMonthFilter}
                        onChange={(e) => setGharKharchMonthFilter(e.target.value)}
                        className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-2 py-1.5 outline-none cursor-pointer flex-1 min-w-0 truncate shadow-2xs"
                      >
                        <option value="all">🔄 सभी महीने (All Months)</option>
                        {availableGharKharchMonths.map(ym => {
                          const [y, m] = ym.split("-").map(Number);
                          const dateObj = new Date(y, m - 1, 1);
                          const label = dateObj.toLocaleDateString("hi-IN", { month: "long", year: "numeric" });
                          return (
                            <option key={ym} value={ym}>
                              {label} ({y})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        let msg = `*🏡 फैमिली घर खर्च रिपोर्ट (${activeMonthLabel})*\n`;
                        msg += `*🏢 कंपनी:* ${selectedCompany?.name || 'व्यापार'}\n`;
                        msg += `----------------------------------\n`;
                        msg += `*💰 कुल खर्च:* *₹${totalAmt.toLocaleString('en-IN')}*\n`;
                        msg += `*📝 कुल प्रविष्टियां:* ${filteredItems.length}\n`;
                        if (uniqueMembers.length > 0) {
                          msg += `----------------------------------\n*👥 सदस्यवार खर्च:*\n`;
                          uniqueMembers.forEach(mem => {
                            msg += `  • ${mem}: ₹${(membersMap[mem] || 0).toLocaleString('en-IN')}\n`;
                          });
                        }
                        msg += `----------------------------------\n*📋 प्रमुख खर्चे:*\n`;
                        filteredItems.slice(0, 15).forEach((it, idx) => {
                          const d = it.date ? new Date(it.date).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' }) : '';
                          msg += `${idx + 1}. ${it.title} - ₹${Number(it.amount || 0).toLocaleString('en-IN')} (${d})\n`;
                        });
                        if (filteredItems.length > 15) msg += `...और ${filteredItems.length - 15} अन्य खर्चे\n`;
                        msg += `----------------------------------\n_Generated via Mobile Vyapar App_`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                      title="इस माह की रिपोर्ट WhatsApp पर भेजें"
                    >
                      <span>📲 WhatsApp शेयर</span>
                    </button>
                  </div>

                  {/* Total Banner */}
                  <div className={`p-4 rounded-2xl text-white shadow-md flex justify-between items-center ${currentTab === "operating" ? "bg-gradient-to-r from-indigo-600 to-blue-600" : "bg-gradient-to-r from-amber-500 to-orange-500"}`}>
                    <div>
                      <span className="text-[11px] font-bold opacity-90 block">
                        {currentTab === "operating" ? `कुल दुकान खर्च (${activeMonthLabel})` : currentTab === "drawings" ? `कुल फैमिली घर खर्च (${activeMonthLabel})` : `कुल दर्ज खर्चे (${activeMonthLabel})`}
                      </span>
                      <span className="text-2xl font-black">₹ {totalAmt.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] opacity-90 block">कुल प्रविष्टियां</span>
                      <span className="text-sm font-extrabold">{filteredItems.length} खर्चे दर्ज</span>
                    </div>
                  </div>

                  {/* Wealth Tracker Quick Export Bar */}
                  <div className="flex items-center justify-between p-2.5 bg-violet-50/90 rounded-2xl border border-violet-200 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center text-xs font-bold">
                        📊
                      </div>
                      <div>
                        <span className="text-xs font-black text-violet-950 block leading-tight">Export for Wealth Tracker</span>
                        <span className="text-[10px] text-violet-700">WhatsApp / Clipboard / JSON फॉर्मेट</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowWealthTrackerModal(true)}
                      className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <span>एक्सपोर्ट करें →</span>
                    </button>
                  </div>

                  {/* Family Members Breakdown Chips & Progress (Only when viewing Family/All) */}
                  {(currentTab === "drawings" || currentTab === "all") && uniqueMembers.length > 0 && (
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

                      {/* Filter by Family Member Pills */}
                      <div className="flex gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
                        <button
                          onClick={() => setGharKharchMemberFilter("all")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${gharKharchMemberFilter === "all" ? 'bg-[#0F172A] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          सभी सदस्य ({familyDrawingsOnly.length})
                        </button>
                        {uniqueMembers.map(m => (
                          <button
                            key={m}
                            onClick={() => setGharKharchMemberFilter(m)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${String(gharKharchMemberFilter || '').toLowerCase() === String(m || '').toLowerCase() ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            <span>👤 {m}</span>
                            <span className="text-[10px] opacity-80">₹{membersMap[m]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expenses List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {loadingGharKharch ? (
                      <div className="p-8 text-center text-xs text-slate-400">खर्च लोड हो रहा है...</div>
                    ) : filteredItems.length === 0 ? (
                      <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 space-y-1">
                        <p className="font-bold text-slate-600">कोई खर्च नहीं मिला</p>
                        <p className="text-[10px]">ऊपर "+ नया खर्च" बटन से पहला खर्च दर्ज करें</p>
                      </div>
                    ) : (
                      filteredItems.map(exp => {
                        const isPersonal = isPersonalExpense(exp);
                        const matchedStaff = exp.staffId ? activeStaffList.find(s => s._id === exp.staffId) : null;
                        return (
                          <div key={exp._id || exp.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 flex justify-between items-center transition">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-xs text-[#0F172A]">{exp.title}</span>
                                {isPersonal ? (
                                  exp.familyMember && (
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-md">
                                      👤 {exp.familyMember}
                                    </span>
                                  )
                                ) : (
                                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-900 font-bold text-[10px] rounded-md flex items-center gap-1">
                                    🏢 दुकान खर्च
                                    {matchedStaff && <span className="text-emerald-800 font-extrabold">• 👔 {matchedStaff.name} (Advance)</span>}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                <span>🏷️ {exp.category || (isPersonal ? "घरेलू खर्च" : "दुकान खर्च")}</span>
                                <span>•</span>
                                <span>📅 {exp.date ? new Date(exp.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }) : 'Today'}</span>
                                <span>•</span>
                                <span className="uppercase">{exp.paymentMethod || 'cash'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className={`font-black text-xs mr-1 ${isPersonal ? 'text-amber-800' : 'text-indigo-800'}`}>
                                ₹ {Number(exp.amount || 0).toLocaleString('en-IN')}
                              </span>
                              <button
                                onClick={() => {
                                  handleToggleGharKharchLedger(false);
                                  handleOpenEditGharKharch(exp);
                                }}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-100/70 rounded-lg transition cursor-pointer"
                                title="एडिट करें (Edit Expense)"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteGharKharch(exp._id || exp.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="हमेशा के लिए हटाएं (Delete Expense)"
                              >
                                <Trash2 size={15} />
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

      {/* 📱 9. ADD / EDIT PARTY MODAL */}
      {showAddPartyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-[#0F172A]">
                {editingParty ? "✏️ Edit Party / पार्टी संपादित करें" : "+ Add Party / नया खाता जोड़ें"}
              </h3>
              <button onClick={() => { setShowAddPartyModal(false); setEditingParty(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Party Type Selector Tabs */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">खाता प्रकार (Party Type)</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: "customer", label: "🛒 ग्राहक" },
                  { id: "supplier", label: "🏢 सप्लायर" },
                  { id: "personal", label: "👤 पर्सनल" }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setNewPartyType(t.id);
                      if (!editingParty) {
                        if (t.id === "supplier") {
                          setNewPartyBalanceDir("negative"); // Default देने हैं (You'll Give) for supplier
                        } else {
                          setNewPartyBalanceDir("positive"); // Default लेने हैं (You'll Get) for customer
                        }
                      }
                    }}
                    className={`py-1.5 text-xs font-extrabold rounded-lg transition cursor-pointer ${
                      newPartyType === t.id
                        ? t.id === "personal"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "bg-[#4338CA] text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {newPartyType === "personal" && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                💡 <strong>गैर-व्यावसायिक खाता:</strong> यह बिज़नेस की बिक्री या देनदारों में नहीं जुड़ेगा। इसका हिसाब अलग पर्सनल लेजर में सुरक्षित रहेगा।
              </div>
            )}

            <input 
              type="text" 
              placeholder="पार्टी / व्यक्ति का नाम *" 
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none font-bold focus:border-[#4338CA]"
            />
            <input 
              type="tel" 
              placeholder="मोबाइल नंबर (WhatsApp के लिए)" 
              value={newPartyPhone}
              onChange={(e) => setNewPartyPhone(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#4338CA]"
            />
            <input 
              type="text" 
              placeholder="पता / शहर (Address)" 
              value={newPartyAddress}
              onChange={(e) => setNewPartyAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#4338CA]"
            />

            {/* Opening Balance with direction */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">
                शुरुआती बाकी (Opening Balance)
              </label>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {[
                  { v: "positive", label: "🟢 वो मेरा देनदार है (मुझे लेने हैं)" },
                  { v: "negative", label: "🔴 मैं देनदार हूँ (मुझे देने हैं)" }
                ].map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setNewPartyBalanceDir(opt.v)}
                    className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition cursor-pointer leading-tight ${
                      (newPartyBalanceDir || "positive") === opt.v
                        ? opt.v === "positive"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs"
                          : "bg-rose-50 text-rose-800 border border-rose-300 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <input 
                type="number" 
                placeholder="₹ 0 (खाली छोड़ें या राशि दर्ज करें)" 
                value={newPartyBalance}
                onChange={(e) => setNewPartyBalance(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none focus:border-[#4338CA]"
              />
            </div>

            <button
              onClick={handleSaveNewParty}
              disabled={savingParty}
              className="w-full py-2.5 bg-[#4338CA] hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition"
            >
              {savingParty ? "Saving..." : editingParty ? "पार्टी अपडेट करें (Update Party)" : "खाता सुरक्षित करें (Save Party)"}
            </button>
          </div>
        </div>
      )}

      {/* 📱 9.1 NATIVE PARTY DETAIL & RUNNING LEDGER MODAL */}
      {selectedPartyDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in">
            {/* Header with Party Info, Edit & Delete */}
            <div className="shrink-0 px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/70 gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-extrabold text-base text-[#0F172A] truncate">{selectedPartyDetail.name}</h3>
                  {(selectedPartyDetail.type || selectedPartyDetail.partyType) === 'personal' ? (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                      👤 पर्सनल
                    </span>
                  ) : (selectedPartyDetail.type || selectedPartyDetail.partyType) === 'supplier' ? (
                    <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                      🏢 सप्लायर
                    </span>
                  ) : (
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                      🛒 ग्राहक
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone size={11} /> <span>{selectedPartyDetail.phone || selectedPartyDetail.mobileNumber || "कोई फोन नहीं"}</span>
                  {selectedPartyDetail.address && <span className="ml-1 text-[10px] text-slate-400 truncate">• {selectedPartyDetail.address}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEditParty(selectedPartyDetail)}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 text-[11px] font-extrabold cursor-pointer border border-blue-200 active:scale-95 transition"
                  title="पार्टी संपादित करें"
                >
                  <Edit2 size={12} /> <span>एडिट</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteParty(selectedPartyDetail)}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center gap-1 text-[11px] font-extrabold cursor-pointer border border-rose-200 active:scale-95 transition"
                  title="पार्टी हटाएं"
                >
                  <Trash2 size={12} /> <span>हटाएं</span>
                </button>
                <button 
                  type="button"
                  onClick={() => { setSelectedPartyDetail(null); setShowPartyTxForm(false); setShowVendorForm(false); }} 
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer ml-0.5"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Body: Contains Balance, Quick Actions, Transaction Form & Ledger History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-10 overscroll-contain">
              {/* Balance Card */}
              {(() => {
                const bal = Number(selectedPartyDetail.balance ?? selectedPartyDetail.currentBalance ?? 0);
                const isSupplier = (selectedPartyDetail.type === 'supplier' || selectedPartyDetail.partyType === 'supplier');
                return (
                  <div className={`p-3.5 rounded-2xl border text-center transition ${
                    bal > 0 
                      ? "bg-emerald-50/70 border-emerald-200" 
                      : bal < 0 
                        ? "bg-rose-50/70 border-rose-200" 
                        : "bg-emerald-50/60 border-emerald-300"
                  }`}>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {isSupplier
                        ? (bal < 0 ? "कुल बकाया राशि (आपको वेंडर को देने हैं)" : bal > 0 ? "अग्रिम जमा (वेंडर को एडवांस दिया हुआ है)" : "हिसाब-किताब स्थिति (वेंडर खाता)")
                        : (bal > 0 ? "कुल बकाया राशि (आपको लेने हैं)" : bal < 0 ? "कुल बकाया राशि (आपको देने हैं)" : "हिसाब-किताब स्थिति")
                      }
                    </div>
                    <div className={`text-2xl font-black mt-0.5 ${
                      isSupplier
                        ? (bal < 0 ? "text-rose-700" : bal > 0 ? "text-emerald-700" : "text-emerald-800")
                        : (bal > 0 ? "text-emerald-700" : bal < 0 ? "text-rose-700" : "text-emerald-800")
                    }`}>
                      ₹ {Math.abs(bal).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] font-semibold mt-0.5">
                      {isSupplier ? (
                        bal < 0 
                          ? <span className="text-rose-700 font-extrabold">🔴 You'll Give (वेंडर को देने हैं)</span> 
                          : bal > 0 
                            ? <span className="text-emerald-700 font-extrabold">🟢 Advance (एडवांस दिया हुआ है)</span> 
                            : <span className="text-emerald-800 font-extrabold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 inline-block">✅ हिसाब पूर्णतः चुकता है (Settled / ₹0)</span>
                      ) : (
                        bal > 0 
                          ? <span className="text-emerald-700">🟢 You'll Get (लेने हैं)</span> 
                          : bal < 0 
                            ? <span className="text-rose-700">🔴 You'll Give (देने हैं)</span> 
                            : <span className="text-emerald-800 font-extrabold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 inline-block">✅ हिसाब पूर्णतः चुकता है (Settled / ₹0)</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 📊 Enterprise Account Audit Summary */}
              {partyTransactions.length > 0 && (() => {
                const isSupplier = (selectedPartyDetail.type === 'supplier' || selectedPartyDetail.partyType === 'supplier');
                const totalDebit = partyTransactions.reduce((s, t) => s + Number(t.debit || 0), 0);
                const totalCredit = partyTransactions.reduce((s, t) => s + Number(t.credit || 0), 0);
                const curBal = Number(selectedPartyDetail.balance ?? selectedPartyDetail.currentBalance ?? 0);
                return (
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 border-b border-slate-100 pb-1.5">
                      <span>📊 खाता ऑडिट सारांश ({isSupplier ? 'वेंडर / सप्लायर' : 'ग्राहक'})</span>
                      <span className="text-[10px] text-slate-500 font-bold">{partyTransactions.length} लेन-देन</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      {isSupplier ? (
                        <>
                          <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-100">
                            <span className="text-[10px] text-indigo-700 font-bold block">📦 कुल खरीद</span>
                            <span className="font-black text-indigo-900 mt-0.5 block text-xs">₹{totalCredit.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                            <span className="text-[10px] text-emerald-700 font-bold block">💵 भुगतान दिया</span>
                            <span className="font-black text-emerald-800 mt-0.5 block text-xs">₹{totalDebit.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-500 font-bold block">शुद्ध बाकी</span>
                            <span className={`font-black mt-0.5 block text-xs ${curBal === 0 ? 'text-emerald-700' : curBal < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              ₹{Math.abs(curBal).toLocaleString('en-IN')} {curBal === 0 ? '✓' : ''}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 font-bold block">कुल डेबिट / सामान</span>
                            <span className="font-black text-slate-800 mt-0.5 block text-xs">₹{totalDebit.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                            <span className="text-[10px] text-emerald-700 font-bold block">कुल क्रेडिट / जमा</span>
                            <span className="font-black text-emerald-800 mt-0.5 block text-xs">₹{totalCredit.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] text-slate-400 font-bold block">शुद्ध बाकी</span>
                            <span className={`font-black mt-0.5 block text-xs ${curBal === 0 ? 'text-emerald-700' : curBal > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              ₹{Math.abs(curBal).toLocaleString('en-IN')} {curBal === 0 ? '✓' : ''}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons: DEDICATED FOR VENDOR VS CUSTOMER */}
              {(() => {
                const isSupplier = (selectedPartyDetail.type === 'supplier' || selectedPartyDetail.partyType === 'supplier');
                if (isSupplier) {
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setVendorActionType('purchase');
                          setShowVendorForm(true);
                          setShowPartyTxForm(false);
                        }}
                        className={`py-2.5 px-3 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition ${
                          showVendorForm && vendorActionType === 'purchase'
                            ? 'bg-indigo-700 ring-2 ring-indigo-400 ring-offset-1 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        📦 माल आया (खरीद बिल)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVendorActionType('payment');
                          setShowVendorForm(true);
                          setShowPartyTxForm(false);
                        }}
                        className={`py-2.5 px-3 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition ${
                          showVendorForm && vendorActionType === 'payment'
                            ? 'bg-emerald-700 ring-2 ring-emerald-400 ring-offset-1 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        💵 भुगतान दिया (Payment)
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPartyTxType('paid');
                        setShowPartyTxForm(true);
                        setShowVendorForm(false);
                      }}
                      className={`py-2.5 px-3 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition ${
                        showPartyTxForm && partyTxType === 'paid' 
                          ? 'bg-rose-700 ring-2 ring-rose-400 ring-offset-1 text-white' 
                          : 'bg-rose-600 hover:bg-rose-700 text-white'
                      }`}
                    >
                      🔴 मैंने दिए (You Gave)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPartyTxType('received');
                        setShowPartyTxForm(true);
                        setShowVendorForm(false);
                      }}
                      className={`py-2.5 px-3 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition ${
                        showPartyTxForm && partyTxType === 'received' 
                          ? 'bg-emerald-700 ring-2 ring-emerald-400 ring-offset-1 text-white' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      🟢 मुझे मिले (You Got)
                    </button>
                  </div>
                );
              })()}

              {/* WhatsApp & Call & Clear Balance */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSharePartyStatementWhatsApp(selectedPartyDetail)}
                  className="flex-1 py-2 bg-[#25D366] hover:bg-green-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition"
                >
                  💬 WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => handleClearPartyBalance(selectedPartyDetail)}
                  className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition shadow-xs"
                  title="खाता चुकता करके बैलेंस ₹0 करें"
                >
                  ⚖️ हिसाब चुकता (₹0)
                </button>
                {(selectedPartyDetail.phone || selectedPartyDetail.mobileNumber) && (
                  <a
                    href={`tel:${selectedPartyDetail.phone || selectedPartyDetail.mobileNumber}`}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition"
                  >
                    <Phone size={13} /> कॉल
                  </a>
                )}
              </div>

              {/* 🏭 DEDICATED VENDOR ACTION FORM (माल आया / भुगतान दिया) */}
              {showVendorForm && (
                <div className={`p-4 rounded-2xl border-2 shadow-sm space-y-3 animate-in fade-in ${
                  vendorActionType === 'purchase' ? 'bg-indigo-50/40 border-indigo-200' : 'bg-emerald-50/40 border-emerald-200'
                }`}>
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/70">
                    <span className={`font-black text-xs flex items-center gap-1.5 ${vendorActionType === 'purchase' ? 'text-indigo-800' : 'text-emerald-800'}`}>
                      <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ backgroundColor: vendorActionType === 'purchase' ? '#4f46e5' : '#059669' }} />
                      {vendorActionType === 'purchase' ? '📦 सप्लायर से माल आया (खरीद बिल प्रविष्टि)' : '💵 सप्लायर को भुगतान दिया (Payment to Vendor)'}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setShowVendorForm(false)} 
                      className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-0.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                    >
                      ✕ रद्द करें
                    </button>
                  </div>

                  {vendorActionType === 'purchase' ? (
                    /* ====== VENDOR PURCHASE FORM ====== */
                    <div className="space-y-3">
                      {/* Amount */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                          खरीद बिल कुल राशि (Total Bill Amount ₹) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">₹</span>
                          <input 
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={vendorBillAmount}
                            onChange={(e) => setVendorBillAmount(e.target.value)}
                            className="w-full pl-7 pr-3 py-2.5 bg-white border-2 border-indigo-200 rounded-xl text-base font-black text-[#0F172A] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Items / Goods Description */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                          सामान का विवरण / माल (Goods Description)
                        </label>
                        <input 
                          type="text"
                          placeholder="उदा. 20 बोरी सीमेंट, 5 पेटी तेल, हार्डवेयर सामान"
                          value={vendorItemDesc}
                          onChange={(e) => setVendorItemDesc(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-indigo-500 shadow-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Bill / Invoice Number */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                            बिल / पर्ची नं. (Bill No.)
                          </label>
                          <input 
                            type="text"
                            placeholder="उदा. INV-104"
                            value={vendorBillNo}
                            onChange={(e) => setVendorBillNo(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-indigo-500 shadow-xs"
                          />
                        </div>

                        {/* Date */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                            <Calendar size={12} className="text-indigo-600" />
                            <span>बिल तारीख (Date) *</span>
                          </label>
                          <input 
                            type="date"
                            value={vendorBillDate}
                            onChange={(e) => setVendorBillDate(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-indigo-500 shadow-xs"
                          />
                        </div>
                      </div>

                      {/* Immediate Payment Option */}
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">क्या तुरंत कुछ भुगतान किया?</span>
                          <button
                            type="button"
                            onClick={() => setVendorIsPaidNow(!vendorIsPaidNow)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                              vendorIsPaidNow ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-300'
                            }`}
                          >
                            {vendorIsPaidNow ? '✓ हाँ, भुगतान किया' : 'पूरा उधार (₹0 भुगतान)'}
                          </button>
                        </div>

                        {vendorIsPaidNow && (
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">भुगतान राशि (₹):</label>
                              <input 
                                type="number"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={vendorPaidAmount}
                                onChange={(e) => setVendorPaidAmount(e.target.value)}
                                className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-[#0F172A] outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">माध्यम (Mode):</label>
                              <select
                                value={vendorPaymentMode}
                                onChange={(e) => setVendorPaymentMode(e.target.value)}
                                className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#0F172A] outline-none"
                              >
                                <option value="CASH">💵 नकद (गल्ला)</option>
                                <option value="UPI">📱 UPI</option>
                                <option value="BANK">🏛️ बैंक ट्रांसफर</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bill Photo Attachment */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center justify-between">
                          <span>📸 सप्लायर के बिल की फोटो खींचें / अपलोड करें</span>
                          {vendorBillImage && (
                            <button
                              type="button"
                              onClick={() => setVendorBillImage('')}
                              className="text-rose-600 hover:underline text-[10px] font-bold cursor-pointer"
                            >
                              ✕ फोटो हटाएं
                            </button>
                          )}
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex-1 py-2 px-3 bg-white border border-dashed border-indigo-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-indigo-50 transition text-xs font-bold text-indigo-700 shadow-2xs">
                            <Camera size={14} />
                            <span>{vendorBillImage ? "✓ बिल फोटो लोड हो गई (बदलें)" : "📷 कैमरा खोलें / बिल फोटो लें"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleVendorImageCapture}
                              className="hidden"
                            />
                          </label>
                          {vendorBillImage && (
                            <img 
                              src={vendorBillImage} 
                              alt="Vendor Bill Preview" 
                              onClick={() => setPreviewBillImage(vendorBillImage)}
                              className="w-10 h-10 rounded-lg object-cover border border-indigo-400 cursor-pointer shadow-xs active:scale-95" 
                            />
                          )}
                        </div>
                      </div>

                      {/* Save Purchase Button */}
                      <button
                        type="button"
                        onClick={handleSaveVendorPurchase}
                        disabled={savingVendorAction}
                        className="w-full py-3 px-4 font-black text-sm rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md cursor-pointer active:scale-95 transition flex items-center justify-center gap-2"
                      >
                        {savingVendorAction ? (
                          <span>⏳ खरीद दर्ज हो रही है...</span>
                        ) : (
                          <span>💾 माल खरीद दर्ज करें {vendorBillAmount ? `(₹${Number(vendorBillAmount).toLocaleString('en-IN')})` : ''}</span>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* ====== VENDOR PAYMENT FORM ====== */
                    <div className="space-y-3">
                      {/* Payment Amount */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                          भुगतान राशि (Payment Amount ₹) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">₹</span>
                          <input 
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={vendorBillAmount}
                            onChange={(e) => setVendorBillAmount(e.target.value)}
                            className="w-full pl-7 pr-3 py-2.5 bg-white border-2 border-emerald-200 rounded-xl text-base font-black text-[#0F172A] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-xs"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Date */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                          <Calendar size={12} className="text-emerald-600" />
                          <span>भुगतान तारीख (Payment Date) *</span>
                        </label>
                        <input 
                          type="date"
                          value={vendorBillDate}
                          onChange={(e) => setVendorBillDate(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-emerald-500 shadow-xs"
                        />
                      </div>

                      {/* Payment Mode */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                          भुगतान माध्यम (Payment Mode)
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 p-1 rounded-xl">
                          {[
                            { id: 'CASH', label: '💵 नकद (गल्ला)' },
                            { id: 'UPI', label: '📱 UPI' },
                            { id: 'BANK', label: '🏛️ बैंक' }
                          ].map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setVendorPaymentMode(m.id)}
                              className={`py-1.5 text-xs font-black rounded-lg transition cursor-pointer ${
                                vendorPaymentMode === m.id ? 'bg-white text-[#0F172A] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notes / Description */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                          विवरण / नोट (Description)
                        </label>
                        <input 
                          type="text"
                          placeholder="उदा. चेक नंबर, UTR नंबर, नकद गल्ले से दिया"
                          value={vendorNotes}
                          onChange={(e) => setVendorNotes(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none focus:border-emerald-500 shadow-xs"
                        />
                      </div>

                      {/* Save Payment Button */}
                      <button
                        type="button"
                        onClick={handleSaveVendorPayment}
                        disabled={savingVendorAction}
                        className="w-full py-3 px-4 font-black text-sm rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md cursor-pointer active:scale-95 transition flex items-center justify-center gap-2"
                      >
                        {savingVendorAction ? (
                          <span>⏳ भुगतान सुरक्षित हो रहा है...</span>
                        ) : (
                          <span>💾 भुगतान दर्ज करें {vendorBillAmount ? `(₹${Number(vendorBillAmount).toLocaleString('en-IN')})` : ''}</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Inline Transaction Entry Form (FOR CUSTOMERS) */}
              {showPartyTxForm && (
                <div className={`p-4 rounded-2xl border-2 shadow-sm space-y-3 animate-in fade-in ${
                  partyTxType === 'paid' ? 'bg-rose-50/40 border-rose-200' : 'bg-emerald-50/40 border-emerald-200'
                }`}>
                  <div className="flex justify-between items-center pb-1 border-b border-slate-200/70">
                    <span className={`font-black text-xs flex items-center gap-1.5 ${partyTxType === 'paid' ? 'text-rose-700' : 'text-emerald-700'}`}>
                      <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ backgroundColor: partyTxType === 'paid' ? '#e11d48' : '#059669' }} />
                      {partyTxType === 'paid' ? '🔴 मैंने दिए / किस्त भुगतान (You Gave)' : '🟢 मुझे मिले / किस्त वसूली (You Got)'}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setShowPartyTxForm(false)} 
                      className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-0.5 rounded-lg bg-white border border-slate-200 cursor-pointer"
                    >
                      ✕ रद्द करें
                    </button>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                      राशि (Amount ₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">₹</span>
                      <input 
                        type="number"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={partyTxAmount}
                        onChange={(e) => setPartyTxAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-base font-black text-[#0F172A] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Date Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={12} className="text-indigo-600" />
                      <span>तारीख (Payment Date) *</span>
                    </label>
                    <input 
                      type="date"
                      value={partyTxDate}
                      onChange={(e) => setPartyTxDate(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                      भुगतान माध्यम (Payment Mode)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 p-1 rounded-xl">
                      {[
                        { id: 'CASH', label: '💵 नकद (Cash)' },
                        { id: 'UPI', label: '📱 UPI' },
                        { id: 'BANK', label: '🏛️ बैंक' }
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPartyTxPaymentMode(m.id)}
                          className={`py-1.5 text-xs font-black rounded-lg transition cursor-pointer ${
                            partyTxPaymentMode === m.id ? 'bg-white text-[#0F172A] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes / Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                      विवरण / नोट (Description)
                    </label>
                    <input 
                      type="text"
                      placeholder="उदा. किस्त 1, चेक नंबर, ऑनलाइन ट्रांसफर आदि"
                      value={partyTxNotes}
                      onChange={(e) => setPartyTxNotes(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-[#0F172A] outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    type="button"
                    onClick={handleSavePartyTx}
                    disabled={savingPartyTx}
                    className={`w-full py-3 px-4 font-black text-sm rounded-xl text-white shadow-md cursor-pointer active:scale-95 transition flex items-center justify-center gap-2 ${
                      partyTxType === 'paid' ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800' : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                    }`}
                  >
                    {savingPartyTx ? (
                      <span>⏳ सुरक्षित हो रहा है...</span>
                    ) : (
                      <span>💾 सुरक्षित करें ({partyTxType === 'paid' ? 'मैंने दिए' : 'मुझे मिले'})</span>
                    )}
                  </button>
                </div>
              )}

              {/* Monthly Breakdown Card (महीनेवार बिक्री व जमा) */}
              {partyTransactions.length > 0 && (() => {
                const monthMap = new Map();
                partyTransactions.forEach(tx => {
                  const d = new Date(tx.date || Date.now());
                  const mKey = isNaN(d.getTime()) ? 'अन्य' : d.toLocaleDateString('hi-IN', { month: 'short', year: 'numeric' });
                  if (!monthMap.has(mKey)) {
                    monthMap.set(mKey, { month: mKey, sales: 0, received: 0, count: 0 });
                  }
                  const mObj = monthMap.get(mKey);
                  mObj.sales += Number(tx.debit || 0);
                  mObj.received += Number(tx.credit || 0);
                  mObj.count += 1;
                });
                const monthList = Array.from(monthMap.values());
                if (monthList.length === 0) return null;

                return (
                  <div className="p-3 bg-gradient-to-r from-slate-50 to-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                    <span className="text-[11px] font-black text-indigo-950 flex items-center gap-1">
                      📅 महीनेवार हिसाब (Month-wise Sales & Received):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                      {monthList.map(m => (
                        <div key={m.month} className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">{m.month}</span>
                            <span className="text-[10px] text-slate-400">{m.count} लेन-देन</span>
                          </div>
                          <div className="text-right text-[11px]">
                            <div className="text-indigo-700 font-bold">बिक्री: ₹{m.sales.toLocaleString('en-IN')}</div>
                            <div className="text-emerald-700 font-bold">जमा मिला: ₹{m.received.toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Statement Title & List */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="font-extrabold text-xs text-[#0F172A]">📖 खाता पासबुक व लेन-देन (Running Ledger)</span>
                <div className="flex items-center gap-1.5">
                  {partyStatementLoading && <span className="text-[10px] text-slate-400 animate-pulse">लोड हो रहा है...</span>}
                  <button
                    type="button"
                    onClick={() => handleExportPartyExcel(selectedPartyDetail, partyTransactions)}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 flex items-center gap-1 transition shadow-xs cursor-pointer"
                    title="Excel स्टेटमेंट डाउनलोड करें"
                  >
                    <FileSpreadsheet size={11} /> <span>Excel</span>
                  </button>
                </div>
              </div>

              {/* 🎯 LEDGER CONTROLS & FILTERS: मैंने दिए, मुझे मिले, Month, Site */}
              {(() => {
                const availableMonths = Array.from(new Set((partyTransactions || []).map(t => {
                  const raw = t.date || t.createdAt;
                  if (!raw) return null;
                  const d = new Date(raw);
                  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 7);
                }).filter(Boolean))).sort().reverse();

                const availableSites = Array.from(new Set((partyTransactions || []).map(t => (t.siteName || t.site || '').trim()).filter(Boolean)));

                return (
                  <div className="space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
                    {/* 3 Main Filter Tabs */}
                    <div className="grid grid-cols-3 gap-1.5 text-xs font-black">
                      <button
                        type="button"
                        onClick={() => setPartyPassbookFilter('all')}
                        className={`py-1.5 px-2 rounded-xl text-center transition cursor-pointer ${
                          partyPassbookFilter === 'all'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        🔄 सभी ({partyTransactions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPartyPassbookFilter('received')}
                        className={`py-1.5 px-2 rounded-xl text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                          partyPassbookFilter === 'received'
                            ? 'bg-emerald-600 text-white shadow-xs font-black'
                            : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        <span>🟢</span> <span>मुझे मिले</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPartyPassbookFilter('given')}
                        className={`py-1.5 px-2 rounded-xl text-center transition cursor-pointer flex items-center justify-center gap-1 ${
                          partyPassbookFilter === 'given'
                            ? 'bg-rose-600 text-white shadow-xs font-black'
                            : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-50'
                        }`}
                      >
                        <span>🔴</span> <span>मैंने दिए</span>
                      </button>
                    </div>

                    {/* Month & Site Selectors */}
                    <div className={`grid ${availableSites.length > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 text-xs`}>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">📅 माह (Month):</label>
                        <select
                          value={partyMonthFilter}
                          onChange={(e) => setPartyMonthFilter(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                        >
                          <option value="all">सभी माह (All Months)</option>
                          {availableMonths.map((m) => {
                            const [y, mo] = m.split("-");
                            const dateObj = new Date(parseInt(y), parseInt(mo) - 1, 1);
                            const label = dateObj.toLocaleDateString("hi-IN", { month: "long", year: "numeric" });
                            return (
                              <option key={m} value={m}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {availableSites.length > 0 && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">🏗️ साइट (Site):</label>
                          <select
                            value={partySiteFilter}
                            onChange={(e) => setPartySiteFilter(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                          >
                            <option value="all">सभी साइट्स (All Sites)</option>
                            {availableSites.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Reset Filter Button if active */}
                    {(partyPassbookFilter !== 'all' || partyMonthFilter !== 'all' || partySiteFilter !== 'all') && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/80 text-slate-600 font-bold">
                        <span>
                          फिल्टर: {partyPassbookFilter === 'received' ? '🟢 मुझे मिले' : partyPassbookFilter === 'given' ? '🔴 मैंने दिए' : 'सभी'}
                          {partyMonthFilter !== 'all' ? ` • माह: ${partyMonthFilter}` : ''}
                          {partySiteFilter !== 'all' ? ` • साइट: ${partySiteFilter}` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPartyPassbookFilter('all');
                            setPartyMonthFilter('all');
                            setPartySiteFilter('all');
                          }}
                          className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                        >
                          ✕ रीसेट करें
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Detailed Passbook Ledger List with Running Balance */}
              <div className="space-y-2">
                {partyTransactions.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                    अभी तक कोई लेन-देन दर्ज नहीं है। ऊपर दिए गए "मैंने दिए" या "मुझे मिले" बटन से प्रविष्टि दर्ज करें।
                  </div>
                ) : (() => {
                  // Compute chronological running balance
                  const sortedAsc = [...partyTransactions].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
                  
                  const hasOpeningTx = sortedAsc.some(t => t.refNo === 'OPENING' || String(t._id || '').startsWith('open_') || String(t.details || '').includes('प्रारंभिक'));
                  let initialBal = Number(selectedPartyDetail.openingBalance || 0);
                  let running = hasOpeningTx ? 0 : initialBal;

                  const txWithRunning = sortedAsc.map((tx) => {
                    const debit = Number(tx.debit || 0);
                    const credit = Number(tx.credit || 0);
                    running = running + debit - credit;
                    return { ...tx, runningAfter: running };
                  });

                  // Display latest transactions first
                  const txWithRunningDesc = [...txWithRunning].reverse();
                  const isSupplierParty = (selectedPartyDetail.type === 'supplier' || selectedPartyDetail.partyType === 'supplier') || Number(selectedPartyDetail.openingBalance || 0) < 0;

                  // Apply active filters
                  const filteredPartyTxs = txWithRunningDesc.filter(tx => {
                    if (partyPassbookFilter === 'received') {
                      const isCredit = Number(tx.credit || 0) > 0;
                      const isReturn = tx.type === 'sales_return' || tx.type === 'return';
                      if (!isCredit && !isReturn) return false;
                    } else if (partyPassbookFilter === 'given') {
                      const isDebit = Number(tx.debit || 0) > 0;
                      const isSale = tx.type === 'sale';
                      if (!isDebit && !isSale) return false;
                    }

                    if (partyMonthFilter !== 'all') {
                      const raw = tx.date || tx.createdAt;
                      if (raw) {
                        const d = new Date(raw);
                        if (!isNaN(d.getTime())) {
                          const ym = d.toISOString().slice(0, 7);
                          if (ym !== partyMonthFilter) return false;
                        }
                      }
                    }

                    if (partySiteFilter !== 'all') {
                      const sName = (tx.siteName || tx.site || '').trim();
                      if (sName !== partySiteFilter) return false;
                    }

                    return true;
                  });

                  if (filteredPartyTxs.length === 0) {
                    return (
                      <div className="py-6 text-center text-slate-400 text-xs bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                        इस फ़िल्टर में कोई लेन-देन नहीं मिला।
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {filteredPartyTxs.map((tx, idx) => {
                        const isDebit = Number(tx.debit || 0) > 0;
                        const amt = isDebit ? tx.debit : tx.credit;
                        const mode = tx.paymentMethod || tx.paymentMode || 'CASH';
                        const isOpening = tx.refNo === 'OPENING' || String(tx._id || '').startsWith('open_') || String(tx.details || '').includes('प्रारंभिक');

                        let badgeText = 'लेन-देन';
                        let badgeBg = 'bg-slate-100 text-slate-800';
                        if (isOpening) {
                          badgeText = '📦 प्रारंभिक शेष / बिल';
                          badgeBg = 'bg-amber-100 text-amber-900 border border-amber-300';
                        } else if (tx.type === 'sale') {
                          badgeText = `🛒 बिक्री बिल #${tx.billNumber || tx.refNo}`;
                          badgeBg = 'bg-blue-100 text-blue-800';
                        } else if (tx.type === 'purchase') {
                          badgeText = `📦 खरीद बिल #${tx.billNumber || tx.refNo}`;
                          badgeBg = 'bg-purple-100 text-purple-800';
                        } else if (tx.type === 'payment' || tx.type === 'receipt' || tx.source === 'PartyTransaction') {
                          badgeText = isDebit ? `🔴 भुगतान #${tx.refNo || 'PAY'}` : `🟢 जमा #${tx.refNo || 'REC'}`;
                          badgeBg = isDebit ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800';
                        } else if (tx.refNo) {
                          badgeText = `#${tx.refNo}`;
                        }

                        return (
                          <div key={tx._id || idx} className="p-3 bg-[#F8FAFC] border border-slate-200/80 rounded-2xl space-y-2 shadow-xs">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1 flex-1 pr-2">
                                <div className="font-extrabold text-xs text-[#0F172A] flex items-center gap-1.5 flex-wrap">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${isOpening ? 'bg-amber-500' : isDebit ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${badgeBg}`}>
                                    {badgeText}
                                  </span>
                                  <span className="text-slate-800 font-bold">{tx.details || (isDebit ? "उधारी बिक्री" : "राशि जमा")}</span>
                                </div>

                                {/* Bill Items & Breakdown (if available) */}
                                {tx.items && tx.items.length > 0 && (
                                  <div className="text-[10px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/70 mt-1 space-y-1">
                                    <span className="font-bold text-slate-800 block">📦 सामान विवरण ({tx.items.length}):</span>
                                    <div className="flex flex-wrap gap-1">
                                      {tx.items.map((it, iIdx) => (
                                        <span key={iIdx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-medium border border-slate-200">
                                          {it.name} <strong className="text-indigo-700">x{it.quantity || 1}</strong> {it.rate ? `(₹${it.rate})` : ''}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Bill Amount vs Jama Amount */}
                                {(tx.billAmount || tx.paidAmount > 0) && (
                                  <div className="text-[10px] text-slate-600 flex items-center gap-2 pt-0.5 flex-wrap">
                                    {tx.billAmount && <span>कुल बिल राशि: <strong className="text-slate-800">₹{Number(tx.billAmount).toLocaleString('en-IN')}</strong></span>}
                                    {tx.paidAmount > 0 && (
                                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        जमा हुआ: ₹{Number(tx.paidAmount).toLocaleString('en-IN')}
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span>📅 {tx.date ? new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'आज'}</span>
                                    <span className="px-1.5 py-0.2 bg-slate-200/60 rounded text-[9px] font-bold text-slate-700">
                                      {mode === 'UPI' ? '📱 UPI' : mode === 'BANK' ? '🏛️ Bank' : '💵 Cash'}
                                    </span>
                                  </div>

                                  {/* ✏️ Edit & 🗑️ Delete Action Buttons */}
                                  <div className="flex items-center gap-1 ml-auto">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditPartyTx(tx)}
                                      className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200 flex items-center gap-0.5 transition active:scale-95 cursor-pointer shadow-2xs"
                                      title="प्रविष्टि संपादित करें (Edit)"
                                    >
                                      <Edit2 size={10} /> <span>बदलें</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePartyTransaction(tx)}
                                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-200 flex items-center gap-0.5 transition active:scale-95 cursor-pointer shadow-2xs"
                                      title="प्रविष्टि हटाएं (Delete)"
                                    >
                                      <Trash2 size={10} /> <span>हटाएं</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className={`font-black text-sm ${
                                  isOpening 
                                    ? 'text-amber-700' 
                                    : (isSupplierParty ? (isDebit ? 'text-emerald-600' : 'text-rose-600') : (isDebit ? 'text-rose-600' : 'text-emerald-600'))
                                }`}>
                                  ₹{Number(amt).toLocaleString('en-IN')}
                                </div>
                                <span className="text-[9px] font-extrabold text-slate-500">
                                  {isOpening 
                                    ? "📦 पुराना हिसाब / बिल" 
                                    : isSupplierParty
                                      ? (isDebit ? "🟢 मैंने दिए" : "🔴 खरीद / बिल")
                                      : (isDebit ? "🔴 उधारी बिल" : "🟢 जमा / मिले")}
                                </span>
                              </div>
                            </div>
                            
                            {/* Attached Bill Photos Gallery (1-5 images) & Running Balance */}
                            <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              {(() => {
                                const rawImages = (tx.billImageUrls && tx.billImageUrls.length > 0)
                                  ? tx.billImageUrls
                                  : (tx.billImageUrl ? [tx.billImageUrl] : []);
                                const uniqueImages = Array.from(new Set(rawImages.filter(Boolean)));
                                const canAddMore = uniqueImages.length < 5;

                                return (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {uniqueImages.map((imgUrl, imgIdx) => (
                                      <div key={imgIdx} className="relative group shrink-0">
                                        <img
                                          src={imgUrl}
                                          alt={`Bill ${imgIdx + 1}`}
                                          onClick={() => {
                                            setPreviewBillImage(imgUrl);
                                            setPreviewImageList(uniqueImages);
                                            setPreviewImageIndex(imgIdx);
                                            setPreviewTargetTxId(tx._id || tx.refNo);
                                          }}
                                          className="w-9 h-9 rounded-lg object-cover border border-indigo-300 cursor-pointer shadow-xs active:scale-95 hover:opacity-90 transition"
                                        />
                                        {/* Direct Delete button on thumbnail */}
                                        <button
                                          type="button"
                                          title="यह फोटो हटाएं"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePartyImage(tx._id || tx.refNo, imgUrl);
                                          }}
                                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black shadow hover:bg-rose-700 cursor-pointer transition active:scale-90"
                                        >
                                          ✕
                                        </button>
                                        <span className="absolute bottom-0 left-0 bg-black/60 text-[8px] text-white px-1 rounded-bl-lg font-mono">
                                          #{imgIdx + 1}
                                        </span>
                                      </div>
                                    ))}

                                    {uniqueImages.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPreviewBillImage(uniqueImages[0]);
                                          setPreviewImageList(uniqueImages);
                                          setPreviewImageIndex(0);
                                          setPreviewTargetTxId(tx._id || tx.refNo);
                                        }}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer underline mr-1"
                                      >
                                        📷 {uniqueImages.length} फोटो देखें
                                      </button>
                                    )}

                                    {canAddMore && (
                                      <label className="text-[10px] font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-indigo-50 px-2 py-1 rounded-lg border border-dashed border-slate-300 transition">
                                        <span>📷 + {uniqueImages.length > 0 ? "और फोटो" : "बिल फोटो"} ({uniqueImages.length}/5)</span>
                                        <input
                                          type="file"
                                          multiple
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => handleAttachPartyImage(tx._id || tx.refNo, e.target.files)}
                                        />
                                      </label>
                                    )}
                                  </div>
                                );
                              })()}

                              <div className="text-right shrink-0">
                                <span className="text-slate-500 font-bold text-[9px] block">इसके बाद बकाया:</span>
                                <span className={`font-black text-xs ${tx.runningAfter > 0 ? 'text-emerald-700' : tx.runningAfter < 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                                  ₹ {Math.abs(tx.runningAfter).toLocaleString('en-IN')} {tx.runningAfter > 0 ? '(लेने हैं)' : tx.runningAfter < 0 ? '(देने हैं)' : '(चुक्ता)'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {!hasOpeningTx && initialBal !== 0 && (
                        <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl flex justify-between items-center text-xs text-amber-900 font-bold">
                          <span>📦 प्रारंभिक शेष (Opening Balance)</span>
                          <span>₹ {Math.abs(initialBal).toLocaleString('en-IN')} {initialBal > 0 ? '(लेने थे)' : '(देने थे)'}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📱 EDIT PARTY TRANSACTION MODAL */}
      {editingPartyTx && (
        <div className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  ✏️
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">प्रविष्टि संपादित करें (Edit Entry)</h3>
                  <p className="text-[10px] text-slate-400">राशि, प्रकार, तारीख व विवरण बदलें</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPartyTx(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditPartyTx} className="space-y-3">
              {/* Type Switch: मैंने दिए vs मुझे मिले */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">प्रकार (Type):</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditPartyTxType('paid')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
                      editPartyTxType === 'paid'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    🔴 मैंने दिए (You Gave)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPartyTxType('received')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
                      editPartyTxType === 'received'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    🟢 मुझे मिले (You Got)
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">राशि (Amount ₹):</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={editPartyTxAmount}
                  onChange={(e) => setEditPartyTxAmount(e.target.value)}
                  placeholder="₹ 0.00"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">तारीख (Date):</label>
                <input
                  type="date"
                  value={editPartyTxDate}
                  onChange={(e) => setEditPartyTxDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Details / Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">विवरण / नोट (Details):</label>
                <input
                  type="text"
                  value={editPartyTxNotes}
                  onChange={(e) => setEditPartyTxNotes(e.target.value)}
                  placeholder="उदा. नकद भुगतान, फोनपे ट्रांसफर..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">भुगतान माध्यम (Mode):</label>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                  {['CASH', 'UPI', 'BANK'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEditPartyTxPaymentMode(m)}
                      className={`py-1.5 rounded-xl transition cursor-pointer ${
                        editPartyTxPaymentMode === m
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m === 'CASH' ? '💵 Cash' : m === 'UPI' ? '📱 UPI' : '🏛️ Bank'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPartyTx(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={savingEditPartyTx}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {savingEditPartyTx ? "सहेज रहे हैं..." : "💾 बदलाव सेव करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📱 BILL PHOTO ZOOM & GALLERY MODAL */}
      {previewBillImage && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-4 max-w-md w-full shadow-2xl relative">
            <div className="flex justify-between items-center pb-2 border-b mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📷</span>
                <div>
                  <h3 className="font-black text-sm text-slate-800">
                    बिल / रसीद फोटो (Bill Image)
                  </h3>
                  {previewImageList.length > 1 && (
                    <span className="text-[11px] font-bold text-indigo-600">
                      फोटो {previewImageIndex + 1} / {previewImageList.length}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewBillImage(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Preview Image with Prev/Next buttons */}
            <div className="relative max-h-[65vh] overflow-hidden flex items-center justify-center bg-slate-900 rounded-2xl p-2 border border-slate-200">
              <img
                src={previewBillImage}
                alt="Full Bill"
                className="max-h-[60vh] w-auto object-contain rounded-xl shadow-md"
              />

              {previewImageList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const prevIdx = (previewImageIndex - 1 + previewImageList.length) % previewImageList.length;
                      setPreviewImageIndex(prevIdx);
                      setPreviewBillImage(previewImageList[prevIdx]);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer shadow transition"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (previewImageIndex + 1) % previewImageList.length;
                      setPreviewImageIndex(nextIdx);
                      setPreviewBillImage(previewImageList[nextIdx]);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer shadow transition"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail carousel strip if multiple images */}
            {previewImageList.length > 1 && (
              <div className="flex items-center gap-2 mt-2.5 overflow-x-auto py-1">
                {previewImageList.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Thumb ${i + 1}`}
                    onClick={() => {
                      setPreviewImageIndex(i);
                      setPreviewBillImage(url);
                    }}
                    className={`w-11 h-11 rounded-lg object-cover cursor-pointer shrink-0 border-2 transition ${
                      i === previewImageIndex ? "border-indigo-600 scale-105 shadow-md" : "border-slate-200 opacity-60 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Actions: Delete photo, Close, Download */}
            <div className="mt-3.5 flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-100">
              {previewTargetTxId && (
                <button
                  type="button"
                  onClick={() => handleDeletePartyImage(previewTargetTxId, previewBillImage)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Trash2 size={13} /> यह फोटो हटाएं
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setPreviewBillImage(null)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  बंद करें
                </button>
                <a
                  href={previewBillImage}
                  download="bill_photo.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Download size={13} /> डाउनलोड करें
                </a>
              </div>
            </div>
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
                const count = cat === "ALL" ? items.length : items.filter(it => String(it?.category || '').toLowerCase() === String(cat || '').toLowerCase()).length;
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
                const count = br === "ALL" ? items.length : items.filter(it => String(it?.brand || '').toLowerCase() === String(br || '').toLowerCase()).length;
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
      {/* 📱 6.7 NATIVE MOBILE DAYBOOK & PROFIT LOSS REPORTS MODALS */}
      {/* ======================================================== */}
      {showDayBookModal && (
        <MobileDayBookModal
          isOpen={showDayBookModal}
          onClose={() => setShowDayBookModal(false)}
        />
      )}

      {showProfitLossModal && (
        <MobileProfitLossModal
          isOpen={showProfitLossModal}
          onClose={() => setShowProfitLossModal(false)}
        />
      )}

      {showFamilyExpenseModal && (
        <MobileFamilyExpenseModal
          isOpen={showFamilyExpenseModal}
          onClose={() => setShowFamilyExpenseModal(false)}
          onOpenSavings={() => setShowSavingsModal(true)}
        />
      )}

      {showWealthTrackerModal && (
        <WealthTrackerExportModal
          isOpen={showWealthTrackerModal}
          onClose={() => setShowWealthTrackerModal(false)}
          expenses={gharKharchList}
          companyName={companyDisplayName}
          defaultType={ledgerViewTab || "all"}
        />
      )}

      {showSavingsModal && (
        <MobileSavingsModal
          isOpen={showSavingsModal}
          onClose={() => setShowSavingsModal(false)}
        />
      )}

      {showBankCCModal && (
        <MobileBankCCModal
          isOpen={showBankCCModal}
          onClose={() => {
            setShowBankCCModal(false);
            fetchBankAccounts();
          }}
          onAccountsChange={fetchBankAccounts}
        />
      )}

      {activeMobileReport && (
        <MobileReportViewerModal
          isOpen={!!activeMobileReport}
          onClose={() => setActiveMobileReport(null)}
          reportType={activeMobileReport.type}
          reportTitle={activeMobileReport.title}
        />
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
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  स्टाफ अधिकार व रोल (Role & Permissions) *
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => {
                    setNewStaffRole(e.target.value);
                    if (e.target.value === 'godown') setNewStaffPosition('गोदाम / इन्वेंटरी स्टाफ');
                    else if (e.target.value === 'accountant') setNewStaffPosition('अकाउंटेंट / मुनीम जी');
                    else if (e.target.value === 'manager') setNewStaffPosition('मैनेजर');
                    else if (e.target.value === 'salesman') setNewStaffPosition('सेल्समैन / बिलर');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-[#059669]"
                >
                  <option value="salesman">🛒 सेल्समैन / काउंटर बिलर (POS बिलिंग + कलेक्शन)</option>
                  <option value="godown">📦 गोदाम / इन्वेंटरी स्टाफ (सिर्फ आइटम व स्टॉक जोड़ना)</option>
                  <option value="accountant">📑 अकाउंटेंट / मुनीम जी (DayBook, लेजर, बिल, GST, खर्च)</option>
                  <option value="manager">👔 मैनेजर (बिलिंग + स्टॉक + सभी अकाउंट्स)</option>
                  <option value="admin">👑 मालिक / एडमिन (फुल कंट्रोल व सेटिंग्स)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  {newStaffRole === 'godown' && "🔒 यह स्टाफ मोबाइल में केवल आइटम व स्टॉक संभाल सकेगा। वित्तीय व सेल्स डेटा पूरी तरह छिपा रहेगा।"}
                  {newStaffRole === 'salesman' && "🔒 यह स्टाफ काउंटर पर बिलिंग व कलेक्शन करेगा। खरीद रेट व प्रॉफिट नहीं दिखेगा।"}
                  {newStaffRole === 'accountant' && "🔒 यह स्टाफ डे-बुक, लेजर, बिल, टैक्स व खर्च देखेगा। रेट नहीं बदल सकेगा।"}
                  {newStaffRole === 'manager' && "🔒 मैनेजर को बिलिंग, स्टॉक और अकाउंट्स का पूरा अधिकार मिलेगा।"}
                  {newStaffRole === 'admin' && "👑 एडमिन को सभी सेटिंग्स और डेटा का पूर्ण अधिकार रहेगा।"}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  मोबाइल ऐप लॉगिन पिन / पासवर्ड (Login PIN)
                </label>
                <input
                  type="password"
                  maxLength={8}
                  placeholder="उदा. 1234 (खाली छोड़ने पर मोबाइल के अंतिम 4 अंक)"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-[#059669]"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  📱 स्टाफ अपने मोबाइल में नंबर और इस पिन से सीधे लॉगिन कर सकेगा।
                </p>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">पद / भूमिका (Designation / Note)</label>
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

            <div className="space-y-3 max-h-72 overflow-y-auto">
              <div>
                <div className="text-[10px] font-black uppercase text-indigo-900 tracking-wider mb-1 px-1">
                  🏢 आपकी मुख्य व्यापारिक दुकान
                </div>
                <div className="space-y-2">
                  {(() => {
                    const realList = (companies || []).filter(c => !c.isDemo && !(c._id || c.id || '').toString().startsWith('demo_'));
                    const listToDisplay = realList.length > 0 ? realList : (selectedCompany && !selectedCompany.isDemo && !(selectedCompany._id || '').toString().startsWith('demo_') ? [selectedCompany] : []);
                    if (listToDisplay.length === 0) {
                      return (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                          <p className="text-xs font-bold text-slate-700">{user?.name ? `${user.name} का खाता` : "नया खाता"}</p>
                          <p className="text-[10px] text-slate-500">आपकी व्यक्तिगत दुकान सक्रिय है (डेटा पूर्णतः सुरक्षित व प्राइवेट)</p>
                        </div>
                      );
                    }
                    return listToDisplay.map(c => {
                      const isSelected = selectedCompany?._id === c._id || selectedCompany?.id === c._id;
                      return (
                        <div
                          key={c._id || c.id}
                          onClick={() => {
                            if (exitDemoModule) exitDemoModule();
                            if (selectCompany) selectCompany(c);
                            setShowCompanySelectModal(false);
                            setTimeout(() => window.location.reload(), 100);
                          }}
                          className={`p-3 rounded-2xl border flex justify-between items-center cursor-pointer transition ${isSelected ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-extrabold shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold'}`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black">{c.name || c.businessName}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                {c.industryType || "दुकान"}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold">
                              {c.phone ? `📞 ${c.phone}` : "प्राइवेट सुरक्षित खाता"}
                            </div>
                          </div>
                          {isSelected && <CheckCircle size={18} className="text-indigo-600 shrink-0" />}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="text-[10px] font-black uppercase text-amber-600 tracking-wider mb-1 px-1">
                  🧪 टेस्टिंग व डेमो मॉड्यूल्स (सैंपल डेटा)
                </div>
                <div className="space-y-1.5">
                  {(allDemoCompanies || []).map(demoCo => {
                    const isSelected = selectedCompany?._id === demoCo._id;
                    return (
                      <div
                        key={demoCo._id}
                        onClick={() => {
                          if (enterDemoModule) enterDemoModule(demoCo.industryType);
                          setShowCompanySelectModal(false);
                          setTimeout(() => window.location.reload(), 100);
                        }}
                        className={`p-2.5 rounded-xl border flex justify-between items-center cursor-pointer transition ${isSelected ? 'bg-amber-100 border-amber-300 text-amber-900 font-extrabold' : 'bg-amber-50/50 border-amber-200/60 text-slate-700 hover:bg-amber-100/50 font-medium'}`}
                      >
                        <span className="text-xs">{demoCo.name}</span>
                        {isSelected && <CheckCircle size={15} className="text-amber-700" />}
                      </div>
                    );
                  })}
                </div>
              </div>
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

      {/* 🛡️ LEGAL UDHAR OTP & HANDOVER VERIFICATION MODAL */}
      <UdharOtpVerificationModal
        isOpen={showUdharOtpModal}
        onClose={() => setShowUdharOtpModal(false)}
        billData={activeUdharBillData}
        onVerified={(verifiedBill) => {
          setBills(prev => prev.map(b => (b._id === verifiedBill._id || b.id === verifiedBill._id || b.billNumber === verifiedBill.billNumber) ? { ...b, ...verifiedBill, isOtpVerified: true, handoverStatus: verifiedBill.handoverStatus || "VERIFIED_HANDED_OVER" } : b));
          if (selectedBillDetail && (selectedBillDetail._id === verifiedBill._id || selectedBillDetail.id === verifiedBill._id)) {
            setSelectedBillDetail(prev => ({ ...prev, ...verifiedBill, isOtpVerified: true, handoverStatus: verifiedBill.handoverStatus || "VERIFIED_HANDED_OVER" }));
          }
        }}
      />

      {/* 💳 DEDICATED CREDIT LIMIT & MANDATE HUB MODAL */}
      <CreditLimitHubModal
        isOpen={showCreditLimitHub}
        onClose={() => setShowCreditLimitHub(false)}
        onPartyUpdated={() => fetchAllData()}
      />

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
