import React, { useState, useEffect } from "react";
import { 
  ArrowRightLeft, 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  FileSpreadsheet, 
  Warehouse, 
  Truck, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Eye, 
  X, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Package,
  Layers,
  ChevronRight,
  Edit2,
  RefreshCw,
  Phone,
  User,
  MapPin,
  Check
} from "lucide-react";
import api from "../../services/api";
import * as XLSX from "xlsx";

export default function StockTransferPage() {
  const [activeTab, setActiveTab] = useState("challans"); // "challans", "create", "warehouses"
  const [warehouses, setWarehouses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transfersLoading, setTransfersLoading] = useState(false);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected Challan for Modal / Print
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // New Warehouse Modal state
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [newWhForm, setNewWhForm] = useState({
    name: "",
    location: "",
    address: "",
    managerName: "",
    phone: "",
    capacity: "",
    isDefault: false
  });

  // Create Transfer Form state
  const [formData, setFormData] = useState({
    fromWarehouseId: "",
    toWarehouseId: "",
    vehicleNumber: "",
    driverName: "",
    driverPhone: "",
    ewayBillNumber: "",
    notes: "",
    status: "completed",
    items: [],
  });

  const [currentItem, setCurrentItem] = useState({
    productId: "",
    name: "",
    quantity: 1,
    unit: "Pcs",
    rate: 0,
    notes: ""
  });

  const [productSearch, setProductSearch] = useState("");

  // Fetch initial master data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [whRes, prodRes] = await Promise.all([
        api.get("/api/warehouse"),
        api.get("/api/inventory"),
      ]);
      
      const whList = whRes.data?.warehouses || whRes.data?.data || [];
      const prodList = prodRes.data?.products || [];
      
      setWarehouses(whList);
      setProducts(prodList);

      // Auto-select source & destination if available
      if (whList.length > 0 && !formData.fromWarehouseId) {
        const defaultWh = whList.find(w => w.isDefault) || whList[0];
        const secondWh = whList.find(w => w._id !== defaultWh._id);
        setFormData(prev => ({
          ...prev,
          fromWarehouseId: defaultWh?._id || "",
          toWarehouseId: secondWh?._id || ""
        }));
      }
    } catch (err) {
      console.error("Error loading master data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transfers list
  const fetchTransfers = async () => {
    try {
      setTransfersLoading(true);
      let url = "/api/stock-transfer";
      if (statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }
      const res = await api.get(url);
      setTransfers(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching transfers:", err);
    } finally {
      setTransfersLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [statusFilter]);

  // Handle Product selection in create form
  const handleSelectProduct = (pId) => {
    const prod = products.find(p => p._id === pId);
    if (!prod) return;

    const rate = Number(prod.purchasePrice ?? prod.costPrice ?? prod.sellingPrice ?? 0);
    setCurrentItem({
      productId: prod._id,
      name: prod.name,
      quantity: 1,
      unit: prod.unit || "Pcs",
      rate: rate,
      notes: ""
    });
    setProductSearch(prod.name);
  };

  // Add Item to Transfer List
  const handleAddItem = () => {
    if (!currentItem.productId || currentItem.quantity <= 0) {
      alert("कृपया मान्य उत्पाद और मात्रा चुनें!");
      return;
    }

    const itemTotal = Math.round(Number(currentItem.quantity) * Number(currentItem.rate) * 100) / 100;
    
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          ...currentItem,
          quantity: parseFloat(currentItem.quantity),
          rate: parseFloat(currentItem.rate),
          total: itemTotal
        }
      ]
    }));

    setCurrentItem({ productId: "", name: "", quantity: 1, unit: "Pcs", rate: 0, notes: "" });
    setProductSearch("");
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Submit New Stock Transfer
  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    if (!formData.fromWarehouseId || !formData.toWarehouseId) {
      alert("कृपया भेजने वाला और प्राप्तकर्ता दोनों गोदाम चुनें!");
      return;
    }
    if (formData.fromWarehouseId === formData.toWarehouseId) {
      alert("भेजने वाला और प्राप्तकर्ता गोदाम अलग-अलग होने चाहिए!");
      return;
    }
    if (formData.items.length === 0) {
      alert("कृपया ट्रांसफर के लिए कम से कम 1 आइटम जोड़ें!");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/stock-transfer", formData);
      const created = res.data?.data;
      alert(`✅ ${res.data?.message || "स्टॉक ट्रांसफर चालान सफलतापूर्वक जनरेट हुआ!"}`);
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        vehicleNumber: "",
        driverName: "",
        driverPhone: "",
        ewayBillNumber: "",
        notes: "",
        items: []
      }));

      // Refresh master data & transfers
      await fetchTransfers();
      await fetchData();

      // Show print modal for newly created challan
      if (created) {
        setSelectedChallan(created);
        setShowPrintModal(true);
      }
      setActiveTab("challans");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "स्टॉक ट्रांसफर विफल");
    } finally {
      setLoading(false);
    }
  };

  // Add New Warehouse
  const handleAddWarehouseSubmit = async (e) => {
    e.preventDefault();
    if (!newWhForm.name.trim()) return alert("गोदाम का नाम आवश्यक है");

    try {
      setLoading(true);
      const res = await api.post("/api/warehouse", newWhForm);
      alert("✅ नया गोदाम सफलतापूर्वक जोड़ा गया!");
      setShowAddWarehouseModal(false);
      setNewWhForm({
        name: "",
        location: "",
        address: "",
        managerName: "",
        phone: "",
        capacity: "",
        isDefault: false
      });
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "गोदाम जोड़ने में त्रुटि");
    } finally {
      setLoading(false);
    }
  };

  // Update Status (e.g. mark received)
  const handleUpdateStatus = async (challanId, newStatus) => {
    try {
      await api.patch(`/api/stock-transfer/${challanId}/status`, { status: newStatus });
      fetchTransfers();
      fetchData();
    } catch (err) {
      alert("स्थिति अपडेट करने में विफल");
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    if (transfers.length === 0) return alert("एक्सपोर्ट करने के लिए कोई चालान नहीं है");
    const wb = XLSX.utils.book_new();

    const rows = [
      ["गणेश हार्डवेयर - स्टॉक ट्रांसफर चालान रजिस्टर (Stock Transfer Register)"],
      [`दिनांक: ${new Date().toLocaleDateString('hi-IN')}`],
      [""],
      ["चालान नं.", "दिनांक", "प्रेषक गोदाम (From)", "प्राप्तकर्ता गोदाम (To)", "वाहन नं.", "ड्राइवर", "कुल आइटम", "कुल मात्रा", "चालान मूल्य (₹)", "स्थिति"]
    ];

    transfers.forEach(t => {
      rows.push([
        t.transferNumber,
        new Date(t.date).toLocaleDateString('hi-IN'),
        t.fromLocationName || t.fromWarehouseId?.name || "मुख्य दुकान",
        t.toLocationName || t.toWarehouseId?.name || "गोदाम",
        t.vehicleNumber || "-",
        t.driverName || "-",
        t.items?.length || 0,
        t.totalQuantity || 0,
        t.totalAmount || 0,
        t.status === 'completed' || t.status === 'received' ? 'प्राप्त (Completed)' : (t.status === 'dispatched' ? 'मार्ग में (In-Transit)' : t.status)
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "StockTransfers");
    XLSX.writeFile(wb, `StockTransfers_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Summary calculations
  const totalChallansCount = transfers.length;
  const totalTransferredQty = transfers.reduce((s, t) => s + (Number(t.totalQuantity) || 0), 0);
  const totalTransferredAmt = transfers.reduce((s, t) => s + (Number(t.totalAmount) || 0), 0);
  const inTransitCount = transfers.filter(t => t.status === 'dispatched' || t.status === 'pending').length;

  const filteredTransfers = transfers.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.transferNumber && t.transferNumber.toLowerCase().includes(q)) ||
      (t.fromLocationName && t.fromLocationName.toLowerCase().includes(q)) ||
      (t.toLocationName && t.toLocationName.toLowerCase().includes(q)) ||
      (t.vehicleNumber && t.vehicleNumber.toLowerCase().includes(q)) ||
      (t.driverName && t.driverName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen text-slate-800">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Top Header */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200/60 shadow-sm">
              <ArrowRightLeft className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  गोदाम स्टॉक ट्रांसफर (Godown Stock Transfer)
                </h1>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  मल्टी-गोदाम चालान
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                दुकान व गोदामों के बीच माल स्थानांतरण, डिलीवरी चालान जनरेशन व लाइव स्टॉक अपडेट
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => { fetchData(); fetchTransfers(); }}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="रिफ्रेश करें"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>एक्सेल एक्सपोर्ट</span>
            </button>

            <button
              onClick={() => setShowAddWarehouseModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"
            >
              <Warehouse className="w-4 h-4" />
              <span>➕ नया गोदाम जोड़ें</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">कुल चालान (Total Challans)</span>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalChallansCount}</div>
            <p className="text-xs text-slate-500 mt-1">जारी किए गए ट्रांसफर चालान</p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">सक्रिय गोदाम (Active Godowns)</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">{warehouses.length}</div>
            <p className="text-xs text-slate-500 mt-1">दुकान व बाहरी स्टोरेज लोकेशन</p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">कुल ट्रांसफर माल (Total Quantity)</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{totalTransferredQty.toLocaleString('en-IN')} Units</div>
            <p className="text-xs text-slate-500 mt-1">मूल्य: ₹{totalTransferredAmt.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">मार्ग में प्रेषित (In-Transit)</span>
            <div className={`text-2xl font-black mt-1 ${inTransitCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {inTransitCount} चालान
            </div>
            <p className="text-xs text-slate-500 mt-1">गंतव्य पर पहुंचना बाकी</p>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex border-b border-slate-200 bg-white px-4 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab("challans")}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${activeTab === 'challans' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <FileText className="w-4 h-4" />
            <span>चालान इतिहास व रजिस्टर ({transfers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${activeTab === 'create' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Plus className="w-4 h-4" />
            <span>नया ट्रांसफर चालान बनाएं</span>
          </button>
          <button
            onClick={() => setActiveTab("warehouses")}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${activeTab === 'warehouses' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Warehouse className="w-4 h-4" />
            <span>गोदाम सूची व स्टॉक ({warehouses.length})</span>
          </button>
        </div>

        {/* TAB 1: CHALLANS LIST */}
        {activeTab === "challans" && (
          <div className="space-y-4">
            {/* Filter and search bar */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="चालान नं, गोदाम, वाहन या ड्राइवर खोजें..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded-lg transition ${statusFilter === 'all' ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500'}`}
                >
                  सभी
                </button>
                <button
                  onClick={() => setStatusFilter("completed")}
                  className={`px-3 py-1 rounded-lg transition ${statusFilter === 'completed' ? 'bg-white shadow text-emerald-700 font-bold' : 'text-slate-500'}`}
                >
                  पूर्ण / प्राप्त
                </button>
                <button
                  onClick={() => setStatusFilter("dispatched")}
                  className={`px-3 py-1 rounded-lg transition ${statusFilter === 'dispatched' ? 'bg-white shadow text-amber-700 font-bold' : 'text-slate-500'}`}
                >
                  मार्ग में (In-Transit)
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 font-bold">
                      <th className="py-3 px-4">चालान नं.</th>
                      <th className="py-3 px-4">दिनांक</th>
                      <th className="py-3 px-4">प्रेषक ➔ गंतव्य गोदाम</th>
                      <th className="py-3 px-4">वाहन व ट्रांसपोर्ट</th>
                      <th className="py-3 px-4 text-center">आइटम / मात्रा</th>
                      <th className="py-3 px-4 text-right">चालान मूल्य (₹)</th>
                      <th className="py-3 px-4 text-center">स्थिति</th>
                      <th className="py-3 px-4 text-center">ऐक्शन</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transfersLoading ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400">
                          चालान लोड हो रहे हैं...
                        </td>
                      </tr>
                    ) : filteredTransfers.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400">
                          कोई स्टॉक ट्रांसफर चालान नहीं मिला।
                          <button
                            onClick={() => setActiveTab("create")}
                            className="block mx-auto mt-2 text-xs font-bold text-amber-600 hover:underline"
                          >
                            ➕ नया चालान बनाएं
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredTransfers.map((t) => (
                        <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                            {t.transferNumber}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-xs">
                            {new Date(t.date).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                              <span className="text-rose-700">{t.fromLocationName || t.fromWarehouseId?.name || "मुख्य दुकान"}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-emerald-700">{t.toLocationName || t.toWarehouseId?.name || "गोदाम"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            {t.vehicleNumber ? (
                              <div className="flex items-center gap-1 font-mono font-bold text-slate-700">
                                <Truck className="w-3.5 h-3.5 text-slate-400" />
                                {t.vehicleNumber}
                              </div>
                            ) : (
                              <span className="text-slate-400">स्वयं / लोकल</span>
                            )}
                            {t.driverName && <div className="text-[11px] text-slate-400">चालक: {t.driverName}</div>}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-slate-800">{t.totalQuantity}</span>
                            <span className="text-xs text-slate-400 ml-1">({t.items?.length || 0} आइटम)</span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-800">
                            ₹{Number(t.totalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {t.status === 'completed' || t.status === 'received' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> प्राप्त
                              </span>
                            ) : t.status === 'dispatched' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                <Clock className="w-3 h-3" /> मार्ग में
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                {t.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => { setSelectedChallan(t); setShowPrintModal(true); }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                title="A4 चालान प्रिंट करें"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              {t.status === 'dispatched' && (
                                <button
                                  onClick={() => handleUpdateStatus(t._id, 'received')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                                  title="प्राप्त दर्ज करें"
                                >
                                  प्राप्त करें
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CREATE TRANSFER CHALLAN */}
        {activeTab === "create" && (
          <form onSubmit={handleSubmitTransfer} className="space-y-5">
            
            {/* Godown Selection Box */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-amber-600" />
                स्रोत व गंतव्य गोदाम चयन (Source & Destination)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* From Godown */}
                <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">
                      माल भेजने वाला गोदाम (Source / From) *
                    </label>
                    <span className="text-[11px] text-rose-600 font-bold">स्टॉक घटेगा (-)</span>
                  </div>
                  <select
                    value={formData.fromWarehouseId}
                    onChange={(e) => setFormData({ ...formData, fromWarehouseId: e.target.value })}
                    className="w-full bg-white border border-rose-300 rounded-xl p-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  >
                    <option value="">-- भेजने वाला गोदाम चुनें --</option>
                    {warehouses.map(w => (
                      <option key={w._id} value={w._id}>
                        {w.name} {w.location ? `(${w.location})` : ""} {w.isDefault ? "★ मुख्य" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* To Godown */}
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                      माल प्राप्तकर्ता गोदाम (Destination / To) *
                    </label>
                    <span className="text-[11px] text-emerald-600 font-bold">स्टॉक बढ़ेगा (+)</span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={formData.toWarehouseId}
                      onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value })}
                      className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">-- प्राप्तकर्ता गोदाम चुनें --</option>
                      {warehouses.map(w => (
                        <option key={w._id} value={w._id} disabled={w._id === formData.fromWarehouseId}>
                          {w.name} {w.location ? `(${w.location})` : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAddWarehouseModal(true)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex-shrink-0 transition"
                      title="नया गोदाम जोड़ें"
                    >
                      ➕
                    </button>
                  </div>
                </div>
              </div>

              {/* Transport & Vehicle Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">वाहन नंबर (Vehicle No.)</label>
                  <input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    placeholder="उदा. CG 04 MB 4567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">ड्राइवर / वाहक का नाम</label>
                  <input
                    type="text"
                    value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    placeholder="उदा. दिनेश यादव"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">ड्राइवर मोबाइल नंबर</label>
                  <input
                    type="tel"
                    value={formData.driverPhone}
                    onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                    placeholder="उदा. 98261XXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">ई-वे बिल नंबर (E-Way Bill)</label>
                  <input
                    type="text"
                    value={formData.ewayBillNumber}
                    onChange={(e) => setFormData({ ...formData, ewayBillNumber: e.target.value })}
                    placeholder="यदि ₹50K+ माल हो"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Item Selection Box */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                स्थानांतरण उत्पाद सूची (Transfer Items)
              </h2>

              {/* Add item row */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-bold text-slate-600 mb-1">उत्पाद खोजें या चुनें *</label>
                  <select
                    value={currentItem.productId}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- उत्पाद चुनें --</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} {p.currentStock !== undefined ? `(उपलब्ध: ${p.currentStock} ${p.unit || 'Pcs'})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">ट्रांसफर मात्रा *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs sm:text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">इकाई (Unit)</label>
                  <input
                    type="text"
                    value={currentItem.unit}
                    onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs sm:text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">दर (Rate ₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={currentItem.rate}
                    onChange={(e) => setCurrentItem({ ...currentItem, rate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs sm:text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> जोड़ें
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">आइटम का नाम</th>
                      <th className="py-2.5 px-3 text-center w-24">मात्रा</th>
                      <th className="py-2.5 px-3 text-center w-20">यूनिट</th>
                      <th className="py-2.5 px-3 text-right w-28">मूल्य दर (₹)</th>
                      <th className="py-2.5 px-3 text-right w-32">कुल मूल्य (₹)</th>
                      <th className="py-2.5 px-3 text-center w-12">हटाएं</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.items.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-400">
                          अभी कोई आइटम नहीं जोड़ा गया है। ऊपर से उत्पाद चुनें और "जोड़ें" दबाएं।
                        </td>
                      </tr>
                    ) : (
                      formData.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{item.name}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-indigo-700">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-center text-slate-500">{item.unit}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">₹{item.rate}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">₹{item.total}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 hover:bg-rose-100 text-rose-600 rounded transition"
                              title="हटाएं"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {formData.items.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t border-slate-200">
                        <td colSpan="2" className="py-3 px-4 text-right">कुल योग:</td>
                        <td className="py-3 px-3 text-center text-indigo-700 font-black">
                          {formData.items.reduce((s, i) => s + i.quantity, 0)}
                        </td>
                        <td></td>
                        <td></td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                          ₹{formData.items.reduce((s, i) => s + i.total, 0).toLocaleString('en-IN')}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Notes & Submit */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3">
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="अतिरिक्त निर्देश / टिप्पणी (उदा. प्रोजेक्ट साइट हेतु भेजा गया)..."
                  className="w-full sm:max-w-md bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />

                <button
                  type="submit"
                  disabled={loading || formData.items.length === 0}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>📦 स्टॉक ट्रांसफर चालान जनरेट करें</span>
                </button>
              </div>

            </div>

          </form>
        )}

        {/* TAB 3: WAREHOUSES MANAGEMENT */}
        {activeTab === "warehouses" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouses.map(w => (
                <div key={w._id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden flex flex-col justify-between">
                  {w.isDefault && (
                    <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl tracking-wider uppercase">
                      ★ प्राथमिक (Main)
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
                        <Warehouse className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-800">{w.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {w.location || w.address || "लोकेशन दर्ज नहीं"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block">गोदाम प्रभारी:</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {w.managerName || "प्रभारी नहीं"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">संपर्क नंबर:</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {w.phone || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">वर्तमान स्टॉक:</span>
                      <span className="font-black text-indigo-700 text-base">
                        {w.totalStock !== undefined ? Number(w.totalStock).toLocaleString('en-IN') : "-"} Units
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setFormData(prev => ({ ...prev, fromWarehouseId: w._id }));
                        setActiveTab("create");
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      माल भेजें <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: ADD NEW WAREHOUSE */}
        {showAddWarehouseModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-indigo-600" />
                  नया गोदाम / वेयरहाउस जोड़ें
                </h3>
                <button
                  onClick={() => setShowAddWarehouseModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddWarehouseSubmit} className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">गोदाम का नाम *</label>
                  <input
                    type="text"
                    required
                    value={newWhForm.name}
                    onChange={(e) => setNewWhForm({ ...newWhForm, name: e.target.value })}
                    placeholder="उदा. गोदाम #2 (बाईपास रोड)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">स्थान / क्षेत्र (Location)</label>
                  <input
                    type="text"
                    value={newWhForm.location}
                    onChange={(e) => setNewWhForm({ ...newWhForm, location: e.target.value })}
                    placeholder="उदा. औद्योगिक क्षेत्र, रायपुर"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">गोदाम प्रभारी (Manager)</label>
                    <input
                      type="text"
                      value={newWhForm.managerName}
                      onChange={(e) => setNewWhForm({ ...newWhForm, managerName: e.target.value })}
                      placeholder="उदा. राजेश कुमार"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">मोबाइल नंबर</label>
                    <input
                      type="tel"
                      value={newWhForm.phone}
                      onChange={(e) => setNewWhForm({ ...newWhForm, phone: e.target.value })}
                      placeholder="उदा. 98260XXXXX"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={newWhForm.isDefault}
                    onChange={(e) => setNewWhForm({ ...newWhForm, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isDefault" className="font-semibold text-slate-700 cursor-pointer">
                    प्राथमिक / डिफ़ॉल्ट गोदाम बनाएं (Set as Primary)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddWarehouseModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                  >
                    सहेजें
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: OFFICIAL A4 DELIVERY CHALLAN PRINT */}
        {showPrintModal && selectedChallan && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto">
              
              {/* Modal Actions Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">स्टॉक ट्रांसफर डिलीवरी चालान पूर्वावलोकन (Challan Preview)</span>
                  <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                    {selectedChallan.transferNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>प्रिंट करें (Print A4)</span>
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* PRINTABLE A4 AREA */}
              <div className="p-4 sm:p-6 bg-white text-slate-900 space-y-4 font-sans text-xs sm:text-sm">
                
                {/* Company Header */}
                <div className="text-center border-b-2 border-slate-900 pb-3">
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide">गणेश हार्डवेयर (Ganesh Hardware)</h1>
                  <p className="text-xs text-slate-600">हार्डवेयर, प्लाईवुड, सेनेटरी, पेंट्स व टिम्बर व्यापारी</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    स्टॉक ट्रांसफर डिलीवरी चालान (Stock Transfer Delivery Challan)
                  </p>
                  <span className="inline-block mt-1 text-[11px] bg-slate-100 text-slate-600 px-3 py-0.5 rounded font-mono font-bold">
                    आंतरिक स्थानांतरण (Internal Stock Movement - Not For Sale)
                  </span>
                </div>

                {/* Challan & Date Row */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500">चालान नंबर:</span> <span className="font-mono font-black text-slate-800">{selectedChallan.transferNumber}</span>
                    <br />
                    <span className="text-slate-500">दिनांक:</span> <span className="font-bold text-slate-800">{new Date(selectedChallan.date).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500">वाहन नंबर:</span> <span className="font-mono font-bold text-slate-800">{selectedChallan.vehicleNumber || "लोकल / रिक्शा"}</span>
                    <br />
                    <span className="text-slate-500">चालक का नाम:</span> <span className="font-bold text-slate-800">{selectedChallan.driverName || "-"} {selectedChallan.driverPhone ? `(${selectedChallan.driverPhone})` : ''}</span>
                  </div>
                </div>

                {/* Consignor & Consignee */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-slate-300 rounded-lg">
                    <span className="text-[11px] font-black uppercase text-slate-400 block mb-1">प्रेषक गोदाम (Consignor / From):</span>
                    <h4 className="font-bold text-sm text-slate-900">
                      {selectedChallan.fromLocationName || selectedChallan.fromWarehouseId?.name || "मुख्य दुकान"}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {selectedChallan.fromWarehouseId?.address || selectedChallan.fromWarehouseId?.location || "दुकान परिसर"}
                    </p>
                  </div>

                  <div className="p-3 border border-slate-300 rounded-lg">
                    <span className="text-[11px] font-black uppercase text-slate-400 block mb-1">प्राप्तकर्ता गोदाम (Consignee / To):</span>
                    <h4 className="font-bold text-sm text-slate-900">
                      {selectedChallan.toLocationName || selectedChallan.toWarehouseId?.name || "गंतव्य गोदाम"}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {selectedChallan.toWarehouseId?.address || selectedChallan.toWarehouseId?.location || "गोदाम परिसर"}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-black">
                      <th className="p-2 border-r border-slate-300 w-10 text-center">क्र.</th>
                      <th className="p-2 border-r border-slate-300">उत्पाद का नाम व विवरण</th>
                      <th className="p-2 border-r border-slate-300 text-center w-20">मात्रा</th>
                      <th className="p-2 border-r border-slate-300 text-center w-16">इकाई</th>
                      <th className="p-2 border-r border-slate-300 text-right w-24">मूल्य दर (₹)</th>
                      <th className="p-2 text-right w-28">कुल राशि (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedChallan.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-r border-slate-300 text-center">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-300 font-semibold">{item.name}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold">{item.quantity}</td>
                        <td className="p-2 border-r border-slate-300 text-center">{item.unit || "Pcs"}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono">₹{item.rate}</td>
                        <td className="p-2 text-right font-mono font-bold">₹{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black border-t-2 border-slate-400">
                      <td colSpan="2" className="p-2 border-r border-slate-300 text-right">कुल स्थानांतरण योग:</td>
                      <td className="p-2 border-r border-slate-300 text-center font-mono">{selectedChallan.totalQuantity}</td>
                      <td className="p-2 border-r border-slate-300"></td>
                      <td className="p-2 border-r border-slate-300"></td>
                      <td className="p-2 text-right font-mono">₹{Number(selectedChallan.totalAmount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Declaration Statement */}
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                  <span className="font-bold">घोषणा:</span> प्रमाणित किया जाता है कि यह माल केवल आंतरिक शाखा/गोदाम स्थानांतरण (Stock Transfer) हेतु ले जाया जा रहा है। इसका कोई वाणिज्यिक क्रय-विक्रय मूल्य देय नहीं है।
                </div>

                {/* Dual Signature Blocks */}
                <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
                  <div>
                    <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
                    <p className="font-bold">हस्ताक्षर - प्रेषक (Dispatched By)</p>
                    <p className="text-[10px] text-slate-400">गणेश हार्डवेयर - मुख्य दुकान</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
                    <p className="font-bold">हस्ताक्षर - प्राप्तकर्ता / वाहन चालक (Received By)</p>
                    <p className="text-[10px] text-slate-400">माल सही सलामत प्राप्त हुआ</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
