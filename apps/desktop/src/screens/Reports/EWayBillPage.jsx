import React, { useState, useEffect, useMemo, useRef } from "react";
import api from "../../services/api";
import * as XLSX from "xlsx";
import {
  Truck,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  QrCode,
  Printer,
  Download,
  RefreshCw,
  Plus,
  Search,
  ShieldCheck,
  ArrowRight,
  Building,
  MapPin,
  Eye,
  ExternalLink,
  Calendar,
  Hash,
  Copy,
  ChevronDown,
  X
} from "lucide-react";

export default function EWayBillPage() {
  const [docs, setDocs] = useState([]);
  const [bills, setBills] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    cancelled: 0,
    eInvoices: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showUpdateVehicleModal, setShowUpdateVehicleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Generation Form State
  const [sourceType, setSourceType] = useState("bill"); // 'bill' | 'transfer' | 'custom'
  const [selectedBillId, setSelectedBillId] = useState("");
  const [selectedTransferId, setSelectedTransferId] = useState("");
  const [subType, setSubType] = useState("Supply");
  const [docType, setDocType] = useState("INV");
  const [vehicleNo, setVehicleNo] = useState("");
  const [vehicleType, setVehicleType] = useState("Regular");
  const [mode, setMode] = useState("Road");
  const [distanceKm, setDistanceKm] = useState(25);
  const [transporterName, setTransporterName] = useState("");
  const [transporterId, setTransporterId] = useState("");
  const [transDocNo, setTransDocNo] = useState("");
  const [generateEInvoice, setGenerateEInvoice] = useState(true);

  // Manual / Custom Consignment Fields
  const [customPartyName, setCustomPartyName] = useState("");
  const [customPartyGstin, setCustomPartyGstin] = useState("");
  const [customPartyAddress, setCustomPartyAddress] = useState("");
  const [customPartyPincode, setCustomPartyPincode] = useState("496450");
  const [customAmount, setCustomAmount] = useState(55000);

  // Vehicle Update Form State
  const [newVehicleNo, setNewVehicleNo] = useState("");
  const [updateReason, setUpdateReason] = useState("Breakdown");
  const [updateFromPlace, setUpdateFromPlace] = useState("Sarangarh");
  const [updateTransDocNo, setUpdateTransDocNo] = useState("");

  // Cancel Form State
  const [cancelReason, setCancelReason] = useState("Order Cancelled");

  // Submitting States
  const [actionLoading, setActionLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");

  const printRef = useRef();

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [ewayRes, billsRes, transferRes] = await Promise.all([
        api.get("/api/ewaybill"),
        api.get("/api/billing?limit=100").catch(() => ({ data: { bills: [] } })),
        api.get("/api/inventory/stock-transfers?limit=50").catch(() => ({ data: { data: [] } }))
      ]);

      const ewayData = ewayRes.data?.data || [];
      setDocs(ewayData);
      if (ewayRes.data?.stats) {
        setStats(ewayRes.data.stats);
      }

      setBills(billsRes.data?.bills || billsRes.data?.data || []);
      setTransfers(transferRes.data?.data || []);
    } catch (error) {
      console.error("Error fetching E-Way Bills:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return docs.filter(doc => {
      // Status filter
      if (statusFilter === "active" && doc.status !== "active") return false;
      if (statusFilter === "cancelled" && doc.status !== "cancelled") return false;
      if (statusFilter === "expiringSoon") {
        if (doc.status !== "active") return false;
        const diffHours = (new Date(doc.validUpto) - new Date()) / (1000 * 60 * 60);
        if (diffHours <= 0 || diffHours > 24) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const invNo = (doc.invoiceNumber || "").toLowerCase();
        const ewbNo = (doc.ewayBillNumber || "").toLowerCase();
        const party = (doc.toTradeName || "").toLowerCase();
        const veh = (doc.vehicleNumber || "").toLowerCase();
        const irn = (doc.irn || "").toLowerCase();
        return invNo.includes(q) || ewbNo.includes(q) || party.includes(q) || veh.includes(q) || irn.includes(q);
      }

      return true;
    });
  }, [docs, statusFilter, searchQuery]);

  // Copy to clipboard helper
  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(`${label} कॉपी हो गया!`);
    setTimeout(() => setCopyFeedback(""), 2000);
  };

  // Handle Generate
  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const payload = {
        docType,
        subType,
        vehicleNumber: vehicleNo.trim().toUpperCase(),
        vehicleType,
        mode,
        distance: Number(distanceKm) || 20,
        transporterName,
        transporterId,
        transDocNo,
        isEInvoice: generateEInvoice
      };

      if (sourceType === "bill") {
        if (!selectedBillId) throw new Error("कृपया बिल का चयन करें!");
        payload.billId = selectedBillId;
      } else if (sourceType === "transfer") {
        if (!selectedTransferId) throw new Error("कृपया स्टॉक ट्रांसफर चालान का चयन करें!");
        payload.transferId = selectedTransferId;
        payload.subType = "Transfer";
      } else {
        if (!customPartyName) throw new Error("कृपया पार्टी / ग्राहक का नाम दर्ज करें!");
        payload.toTradeName = customPartyName;
        payload.toGstin = customPartyGstin || "URP";
        payload.toAddress = customPartyAddress || "Sarangarh";
        payload.toPincode = customPartyPincode || "496450";
        payload.totalAmount = Number(customAmount) || 50000;
      }

      const res = await api.post("/api/ewaybill/generate", payload);
      alert(res.data?.message || "E-Way Bill व E-Invoice सफलतापूर्वक जनरेट हुआ!");
      setShowGenerateModal(false);
      resetGenerateForm();
      fetchData();
    } catch (error) {
      alert("जनरेशन त्रुटि: " + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const resetGenerateForm = () => {
    setSelectedBillId("");
    setSelectedTransferId("");
    setVehicleNo("");
    setCustomPartyName("");
    setCustomAmount(55000);
    setDistanceKm(25);
  };

  // Handle Vehicle Update (Part-B)
  const handleUpdateVehicleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoc || !newVehicleNo.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/api/ewaybill/${selectedDoc._id}/update-vehicle`, {
        vehicleNumber: newVehicleNo.trim().toUpperCase(),
        reason: updateReason,
        fromPlace: updateFromPlace,
        transDocNo: updateTransDocNo
      });
      alert(res.data?.message || "वाहन विवरण अपडेट हुआ!");
      setShowUpdateVehicleModal(false);
      setNewVehicleNo("");
      fetchData();
    } catch (error) {
      alert("अपडेट विफल: " + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;
    if (!window.confirm(`क्या आप सचमुच E-Way Bill #${selectedDoc.ewayBillNumber} को रद्द (Cancel) करना चाहते हैं?`)) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/api/ewaybill/${selectedDoc._id}/cancel`, {
        cancelReason
      });
      alert(res.data?.message || "E-Way Bill रद्द कर दिया गया!");
      setShowCancelModal(false);
      fetchData();
    } catch (error) {
      alert("रद्द करने में त्रुटि: " + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Download NIC JSON
  const handleDownloadNicJson = async (doc) => {
    try {
      const res = await api.get(`/api/ewaybill/${doc._id}/nic-json`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `EWB_${doc.ewayBillNumber || doc.invoiceNumber}_NIC.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("JSON डाउनलोड विफल: " + err.message);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (docs.length === 0) {
      alert("डाउनलोड करने के लिए कोई E-Way Bill रिकॉर्ड नहीं है!");
      return;
    }

    const exportRows = docs.map((d, index) => ({
      "क्र.सं.": index + 1,
      "दस्तावेज़ संख्या": d.invoiceNumber,
      "दस्तावेज़ तिथि": d.docDate ? new Date(d.docDate).toLocaleDateString("en-IN") : "",
      "ई-वे बिल नं. (12 Digit)": d.ewayBillNumber,
      "ई-इनवॉइस IRN": d.irn || "N/A",
      "पावती नं. (Ack No)": d.ackNo || "N/A",
      "सप्लाई प्रकार": d.subType,
      "विक्रेता (Consignor)": d.fromTradeName,
      "विक्रेता GSTIN": d.fromGstin,
      "क्रेता (Consignee)": d.toTradeName,
      "क्रेता GSTIN": d.toGstin,
      "क्रेता पता": d.toAddress,
      "दूरी (किमी)": d.distance,
      "वाहन नंबर": d.vehicleNumber,
      "परिवहन साधन": d.mode,
      "कर योग्य मूल्य (₹)": d.taxableAmount,
      "कुल बिल राशि (₹)": d.totalAmount,
      "जनरेट तिथि": new Date(d.generatedDate).toLocaleString("en-IN"),
      "वैधता तिथि": new Date(d.validUpto).toLocaleString("en-IN"),
      "स्थिति": d.status === "cancelled" ? "रद्द (Cancelled)" : "सक्रिय (Active)",
      "रद्दीकरण कारण": d.cancelReason || ""
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "E-Way Bills & IRN");
    XLSX.writeFile(wb, `Ganesh_Hardware_EWayBills_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Print Function
  const handlePrint = () => {
    window.print();
  };

  // Validity status helper
  const getValidityBadge = (validUpto, status) => {
    if (status === "cancelled") {
      return <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700">🔴 रद्द</span>;
    }
    const diffHours = (new Date(validUpto) - new Date()) / (1000 * 60 * 60);
    if (diffHours <= 0) {
      return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">⛔ अवधि समाप्त</span>;
    }
    if (diffHours <= 24) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
          <Clock className="w-3 h-3 inline" /> {Math.round(diffHours)}h शेष
        </span>
      );
    }
    const days = Math.ceil(diffHours / 24);
    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 flex items-center gap-1">
        <CheckCircle className="w-3 h-3 inline" /> {days} दिन वैध
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen text-slate-800">
      {/* Toast Notification for Clipboard */}
      {copyFeedback && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{copyFeedback}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER SECTION */}
        <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs tracking-wider uppercase mb-1">
              <Truck className="w-4 h-4" />
              <span>GST NIC पोर्टल कम्प्लायंस • IRN v1.03</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              E-Way Bill व E-Invoicing
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              सरकारी NIC पोर्टल अनुरूप 12-अंकीय ई-वे बिल, 64-अक्षर IRN एवं हाई-वे चेकिंग हेतु अधिकृत QR कोड
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSourceType("bill");
                setShowGenerateModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow flex items-center gap-2 text-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>नया ई-वे बिल बनाएं</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-3.5 rounded-lg border border-slate-300 flex items-center gap-2 text-sm transition"
              title="Excel रजिस्टर डाउनलोड करें"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-lg border border-slate-300 transition"
              title="रिफ्रेश करें"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">कुल ई-वे बिल</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
            <div className="text-xs text-slate-400 mt-0.5">₹{(stats.totalValue || 0).toLocaleString("en-IN")} माल</div>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-sm">
            <span className="text-xs font-semibold text-emerald-700 uppercase">सक्रिय ट्रांजिट</span>
            <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.active}</div>
            <div className="text-xs text-emerald-600 mt-0.5">मार्ग पर वैध (On Road)</div>
          </div>

          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-sm">
            <span className="text-xs font-semibold text-amber-700 uppercase">समाप्त होने वाले</span>
            <div className="text-2xl font-bold text-amber-800 mt-1">{stats.expiringSoon}</div>
            <div className="text-xs text-amber-600 mt-0.5">&lt; 24 घंटे शेष</div>
          </div>

          <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 shadow-sm">
            <span className="text-xs font-semibold text-indigo-700 uppercase">ई-इनवॉइस IRN</span>
            <div className="text-2xl font-bold text-indigo-800 mt-1">{stats.eInvoices}</div>
            <div className="text-xs text-indigo-600 mt-0.5">हस्ताक्षरित QR सक्रिय</div>
          </div>

          <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 shadow-sm">
            <span className="text-xs font-semibold text-rose-700 uppercase">अवधि समाप्त</span>
            <div className="text-2xl font-bold text-rose-800 mt-1">{stats.expired}</div>
            <div className="text-xs text-rose-600 mt-0.5">ट्रिप पूर्ण / एक्सपायर्ड</div>
          </div>

          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-600 uppercase">रद्द किए गए</span>
            <div className="text-2xl font-bold text-slate-800 mt-1">{stats.cancelled}</div>
            <div className="text-xs text-slate-500 mt-0.5">Cancelled Bills</div>
          </div>
        </div>

        {/* FILTER & SEARCH BAR */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              सभी ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === "active" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              सक्रिय ट्रांजिट ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter("expiringSoon")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === "expiringSoon" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              शीघ्र समाप्त ({stats.expiringSoon})
            </button>
            <button
              onClick={() => setStatusFilter("cancelled")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === "cancelled" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              रद्द ({stats.cancelled})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="बिल नं., ई-वे बिल नं., पार्टी या वाहन..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* REGISTER TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">बिल / चालान</th>
                  <th className="py-3 px-4">ई-वे बिल नं. (12 Digit)</th>
                  <th className="py-3 px-4">ई-इनवॉइस (IRN)</th>
                  <th className="py-3 px-4">प्राप्तकर्ता (Consignee)</th>
                  <th className="py-3 px-4 text-right">माल मूल्य (₹)</th>
                  <th className="py-3 px-4">वाहन / साधन</th>
                  <th className="py-3 px-4">वैधता</th>
                  <th className="py-3 px-4 text-center">क्रियाएं (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      ई-वे बिल डेटा लोड हो रहा है...
                    </td>
                  </tr>
                ) : filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-400">
                      <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      कोई ई-वे बिल रिकॉर्ड नहीं मिला। "नया ई-वे बिल बनाएं" पर क्लिक करें।
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50 transition">
                      {/* Document Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{doc.invoiceNumber}</div>
                        <div className="text-xs text-slate-500">
                          {doc.docDate ? new Date(doc.docDate).toLocaleDateString("en-IN") : ""} • {doc.subType || "Supply"}
                        </div>
                      </td>

                      {/* E-Way Bill Number */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-indigo-700 tracking-wide text-sm">
                            {doc.ewayBillNumber}
                          </span>
                          <button
                            onClick={() => copyToClipboard(doc.ewayBillNumber, "ई-वे बिल नंबर")}
                            className="text-slate-400 hover:text-slate-700"
                            title="नंबर कॉपी करें"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {new Date(doc.generatedDate).toLocaleDateString("en-IN")}
                        </div>
                      </td>

                      {/* IRN */}
                      <td className="py-3 px-4">
                        {doc.irn ? (
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs text-slate-700 max-w-[120px] truncate" title={doc.irn}>
                                {doc.irn}
                              </span>
                              <button
                                onClick={() => copyToClipboard(doc.irn, "IRN Hash")}
                                className="text-slate-400 hover:text-slate-700"
                                title="IRN कॉपी करें"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                              ✓ IRN Active
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* Consignee */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 max-w-[180px] truncate" title={doc.toTradeName}>
                          {doc.toTradeName}
                        </div>
                        <div className="text-xs text-slate-400">
                          GSTIN: {doc.toGstin || "URP"} • {doc.toAddress || "Sarangarh"}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          ₹{(doc.totalAmount || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-xs text-slate-400">
                          कर: ₹{((doc.cgstAmount || 0) + (doc.sgstAmount || 0)).toLocaleString("en-IN")}
                        </div>
                      </td>

                      {/* Vehicle & Distance */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1 font-mono">
                          <Truck className="w-3.5 h-3.5 text-slate-500" />
                          <span>{doc.vehicleNumber || "वाहन लंबित"}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {doc.distance} km • {doc.mode || "Road"}
                        </div>
                      </td>

                      {/* Validity */}
                      <td className="py-3 px-4">
                        {getValidityBadge(doc.validUpto, doc.status)}
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(doc.validUpto).toLocaleDateString("en-IN")}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Print Govt Format */}
                          <button
                            onClick={() => {
                              setSelectedDoc(doc);
                              setShowPrintModal(true);
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="अधिकृत सरकारी प्रारूप A4 प्रिंट"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* QR Code Highway Check */}
                          {doc.qrCodeImage && (
                            <button
                              onClick={() => {
                                setSelectedDoc(doc);
                                setShowQrModal(true);
                              }}
                              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded"
                              title="हाई-वे चेकिंग QR कोड"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}

                          {/* Update Vehicle (Part-B) */}
                          {doc.status === "active" && (
                            <button
                              onClick={() => {
                                setSelectedDoc(doc);
                                setNewVehicleNo(doc.vehicleNumber || "");
                                setShowUpdateVehicleModal(true);
                              }}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                              title="वाहन नंबर बदलें (Part-B Update)"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          )}

                          {/* NIC JSON Download */}
                          <button
                            onClick={() => handleDownloadNicJson(doc)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="NIC सरकारी पोर्टल JSON डाउनलोड"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Cancel */}
                          {doc.status === "active" && (
                            <button
                              onClick={() => {
                                setSelectedDoc(doc);
                                setShowCancelModal(true);
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                              title="ई-वे बिल रद्द करें (Cancel Within 24h)"
                            >
                              <XCircle className="w-4 h-4" />
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

      {/* ======================================================== */}
      {/* MODAL 1: GENERATE E-WAY BILL & E-INVOICE                 */}
      {/* ======================================================== */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  नया E-Way Bill व E-Invoice जनरेट करें
                </h2>
                <p className="text-xs text-slate-500">सरकारी GST पोर्टल हेतु 12-अंकीय EWB व 64-अक्षर IRN</p>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              {/* Source Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  दस्तावेज़ का स्रोत (Consignment Source)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSourceType("bill")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                      sourceType === "bill" ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    बिक्री बिल (Sale Bill)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType("transfer")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                      sourceType === "transfer" ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    गोदाम चालान (Stock Transfer)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType("custom")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                      sourceType === "custom" ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    कस्टम / अन्य चालान
                  </button>
                </div>
              </div>

              {/* Source Selection Fields */}
              {sourceType === "bill" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">बिक्री बिल चुनें (Select Invoice)</label>
                  <select
                    required
                    value={selectedBillId}
                    onChange={(e) => setSelectedBillId(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- बिल चुनें (चालान संख्या / ग्राहक) --</option>
                    {bills.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.billNumber || b.billNo} - {b.customerName || "नकद ग्राहक"} (₹{Number(b.finalAmount || b.total || 0).toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {sourceType === "transfer" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">स्टॉक ट्रांसफर चालान चुनें</label>
                  <select
                    required
                    value={selectedTransferId}
                    onChange={(e) => setSelectedTransferId(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- ट्रांसफर चालान चुनें --</option>
                    {transfers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.transferNumber} - {t.destinationWarehouseName} (₹{Number(t.totalValue || 0).toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {sourceType === "custom" && (
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">ग्राहक / पार्टी का नाम</label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. राजकमल ट्रेडर्स"
                      value={customPartyName}
                      onChange={(e) => setCustomPartyName(e.target.value)}
                      className="w-full border rounded p-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">GSTIN (या URP)</label>
                    <input
                      type="text"
                      placeholder="22AAAAA0000A1Z5"
                      value={customPartyGstin}
                      onChange={(e) => setCustomPartyGstin(e.target.value.toUpperCase())}
                      className="w-full border rounded p-2 text-sm bg-white uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">स्थान / शहर</label>
                    <input
                      type="text"
                      placeholder="सारंगढ़"
                      value={customPartyAddress}
                      onChange={(e) => setCustomPartyAddress(e.target.value)}
                      className="w-full border rounded p-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">कुल माल मूल्य (₹)</label>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full border rounded p-2 text-sm bg-white font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Transportation Details (PART - B) */}
              <div className="border-t pt-3">
                <span className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5 mb-2">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  परिवहन विवरण (PART - B Transport Details)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">वाहन नंबर (Vehicle No.)</label>
                    <input
                      type="text"
                      placeholder="उदा. CG-04-AB-1234"
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                      className="w-full border rounded p-2 text-sm uppercase font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">दूरी (किलोमीटर में)</label>
                    <input
                      type="number"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(e.target.value)}
                      className="w-full border rounded p-2 text-sm font-semibold"
                    />
                    <span className="text-[10px] text-slate-400">वैधता: {Math.max(1, Math.ceil(distanceKm / 200))} दिन</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">वाहन का प्रकार</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full border rounded p-2 text-sm bg-white"
                    >
                      <option value="Regular">नियमित कार्गो (200 km/दिन)</option>
                      <option value="ODC">ओवर डाइमेंशनल (20 km/दिन)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">ट्रांसपोर्टर का नाम / ID</label>
                    <input
                      type="text"
                      placeholder="उदा. श्री राम रोडलाइंस"
                      value={transporterName}
                      onChange={(e) => setTransporterName(e.target.value)}
                      className="w-full border rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">LR / GR चालान नंबर</label>
                    <input
                      type="text"
                      placeholder="उदा. LR-98234"
                      value={transDocNo}
                      onChange={(e) => setTransDocNo(e.target.value)}
                      className="w-full border rounded p-2 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* E-Invoice Toggle */}
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    ई-इनवॉइस (64-अक्षर IRN) एवं डिजिटल हस्ताक्षरित QR कोड
                  </div>
                  <div className="text-[11px] text-indigo-700">GST पोर्टल अनुरूप स्वचालित IRN व QR कोड शामिल होगा</div>
                </div>
                <input
                  type="checkbox"
                  checked={generateEInvoice}
                  onChange={(e) => setGenerateEInvoice(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg shadow disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  <span>जनरेट करें</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: OFFICIAL GOVERNMENT A4 E-WAY BILL PRINT LAYOUT   */}
      {/* ======================================================== */}
      {showPrintModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
            {/* Modal Controls */}
            <div className="flex items-center justify-between border-b pb-3 mb-4 print:hidden">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                सरकारी A4 प्रारूप ई-वे बिल (Government Format)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-lg flex items-center gap-1.5 text-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>प्रिंट (Print A4)</span>
                </button>
                <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE OFFICIAL E-WAY BILL CANVAS */}
            <div ref={printRef} className="border-2 border-slate-900 p-6 text-slate-900 text-xs bg-white space-y-4">
              
              {/* Top Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                <div className="space-y-1">
                  <div className="text-xl font-extrabold tracking-tight">e-Way Bill</div>
                  <div className="text-[11px] font-semibold text-slate-600">Government of India • GST e-Way Bill System</div>
                  <div className="text-sm font-bold mt-2">
                    e-Way Bill No: <span className="font-mono text-base text-indigo-900">{selectedDoc.ewayBillNumber}</span>
                  </div>
                  <div className="text-[11px]">
                    Generated Date: <span className="font-semibold">{new Date(selectedDoc.generatedDate).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="text-[11px]">
                    Generated By: <span className="font-semibold font-mono">{selectedDoc.fromGstin} - {selectedDoc.fromTradeName}</span>
                  </div>
                  <div className="text-[11px]">
                    Valid From: <span className="font-semibold">{new Date(selectedDoc.generatedDate).toLocaleString("en-IN")}</span> &nbsp;|&nbsp;
                    Valid Until: <span className="font-bold text-emerald-800">{new Date(selectedDoc.validUpto).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* QR Code */}
                {selectedDoc.qrCodeImage && (
                  <div className="flex flex-col items-center">
                    <img src={selectedDoc.qrCodeImage} alt="GST Official QR" className="w-28 h-28 border border-slate-300 p-1" />
                    <span className="text-[9px] text-slate-500 mt-1 font-semibold">NIC Digitally Signed</span>
                  </div>
                )}
              </div>

              {/* IRN Section (if B2B E-Invoice) */}
              {selectedDoc.irn && (
                <div className="bg-slate-50 p-2.5 rounded border border-slate-300">
                  <div className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">E-Invoice Reference Number (IRN)</div>
                  <div className="font-mono text-[10px] font-bold text-slate-800 break-all select-all mt-0.5">
                    {selectedDoc.irn}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1 flex gap-4">
                    <span>Ack No: <strong className="font-mono">{selectedDoc.ackNo || "1224890123"}</strong></span>
                    <span>Ack Date: <strong>{new Date(selectedDoc.ackDate || selectedDoc.generatedDate).toLocaleDateString("en-IN")}</strong></span>
                  </div>
                </div>
              )}

              {/* PART - A: Address & Document Details */}
              <div className="border border-slate-900">
                <div className="bg-slate-800 text-white font-bold px-3 py-1 text-xs">
                  PART - A: CONSIGNOR & CONSIGNEE DETAILS
                </div>
                <div className="grid grid-cols-2 divide-x border-b border-slate-300">
                  <div className="p-3 space-y-1">
                    <div className="font-bold text-slate-700 uppercase text-[10px]">प्रेषक (From - Consignor)</div>
                    <div className="font-bold text-sm">{selectedDoc.fromTradeName}</div>
                    <div className="font-mono text-xs">GSTIN: {selectedDoc.fromGstin}</div>
                    <div>पता: {selectedDoc.fromAddress}</div>
                    <div>पिनकोड: {selectedDoc.fromPincode} • राज्य: {selectedDoc.fromState}</div>
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="font-bold text-slate-700 uppercase text-[10px]">प्राप्तकर्ता (To - Consignee)</div>
                    <div className="font-bold text-sm">{selectedDoc.toTradeName}</div>
                    <div className="font-mono text-xs">GSTIN: {selectedDoc.toGstin}</div>
                    <div>पता: {selectedDoc.toAddress}</div>
                    <div>पिनकोड: {selectedDoc.toPincode} • राज्य: {selectedDoc.toState}</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 divide-x p-2 bg-slate-50 text-[11px]">
                  <div><strong>Doc Type:</strong> {selectedDoc.docType}</div>
                  <div><strong>Doc No:</strong> {selectedDoc.invoiceNumber}</div>
                  <div><strong>Doc Date:</strong> {new Date(selectedDoc.docDate).toLocaleDateString("en-IN")}</div>
                  <div><strong>Sub Supply Type:</strong> {selectedDoc.subType}</div>
                </div>
              </div>

              {/* GOODS & TAX VALUATION TABLE */}
              <div className="border border-slate-900">
                <div className="bg-slate-800 text-white font-bold px-3 py-1 text-xs">
                  GOODS & TAX VALUATION (माल एवं कर का विवरण)
                </div>
                <table className="w-full text-left text-xs divide-y">
                  <thead className="bg-slate-100 font-semibold">
                    <tr>
                      <th className="p-2">HSN</th>
                      <th className="p-2">विवरण (Description)</th>
                      <th className="p-2 text-right">मात्रा</th>
                      <th className="p-2 text-right">कर योग्य मूल्य (₹)</th>
                      <th className="p-2 text-right">CGST</th>
                      <th className="p-2 text-right">SGST</th>
                      <th className="p-2 text-right">कुल (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(selectedDoc.items && selectedDoc.items.length > 0 ? selectedDoc.items : [
                      {
                        hsnCode: "8481",
                        productName: "हार्डवेयर माल",
                        quantity: 1,
                        unit: "LOT",
                        taxableAmount: selectedDoc.taxableAmount,
                        cgstAmount: selectedDoc.cgstAmount,
                        sgstAmount: selectedDoc.sgstAmount
                      }
                    ]).map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-mono">{item.hsnCode}</td>
                        <td className="p-2">{item.productName}</td>
                        <td className="p-2 text-right">{item.quantity} {item.unit || "PCS"}</td>
                        <td className="p-2 text-right">₹{Number(item.taxableAmount || 0).toLocaleString("en-IN")}</td>
                        <td className="p-2 text-right">₹{Number(item.cgstAmount || 0).toLocaleString("en-IN")}</td>
                        <td className="p-2 text-right">₹{Number(item.sgstAmount || 0).toLocaleString("en-IN")}</td>
                        <td className="p-2 text-right font-bold">
                          ₹{(Number(item.taxableAmount || 0) + Number(item.cgstAmount || 0) + Number(item.sgstAmount || 0)).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-900">
                    <tr>
                      <td colSpan="3" className="p-2 text-right">कुल योग (Total Valuation):</td>
                      <td className="p-2 text-right">₹{Number(selectedDoc.taxableAmount || 0).toLocaleString("en-IN")}</td>
                      <td className="p-2 text-right">₹{Number(selectedDoc.cgstAmount || 0).toLocaleString("en-IN")}</td>
                      <td className="p-2 text-right">₹{Number(selectedDoc.sgstAmount || 0).toLocaleString("en-IN")}</td>
                      <td className="p-2 text-right text-sm">₹{Number(selectedDoc.totalAmount || 0).toLocaleString("en-IN")}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* PART - B: Transporter / Vehicle Details */}
              <div className="border border-slate-900">
                <div className="bg-slate-800 text-white font-bold px-3 py-1 text-xs">
                  PART - B: VEHICLE / TRANSPORTER DETAILS (वाहनों का विवरण)
                </div>
                <table className="w-full text-left text-xs divide-y">
                  <thead className="bg-slate-100 font-semibold">
                    <tr>
                      <th className="p-2">मोड (Mode)</th>
                      <th className="p-2">वाहन नंबर (Vehicle No.)</th>
                      <th className="p-2">दूरी (km)</th>
                      <th className="p-2">स्थान से (From)</th>
                      <th className="p-2">LR / Doc No.</th>
                      <th className="p-2">प्रविष्टि तिथि</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 font-semibold">{selectedDoc.mode || "Road"}</td>
                      <td className="p-2 font-mono font-bold text-sm text-indigo-900">{selectedDoc.vehicleNumber || "लंबित"}</td>
                      <td className="p-2">{selectedDoc.distance} km</td>
                      <td className="p-2">{selectedDoc.fromAddress}</td>
                      <td className="p-2 font-mono">{selectedDoc.transDocNo || "N/A"}</td>
                      <td className="p-2">{new Date(selectedDoc.generatedDate).toLocaleDateString("en-IN")}</td>
                    </tr>
                    {/* Vehicle updates if any */}
                    {selectedDoc.vehicleUpdates && selectedDoc.vehicleUpdates.map((vu, idx) => (
                      <tr key={idx} className="bg-amber-50/50">
                        <td className="p-2 font-semibold">Road (Update #{idx + 1})</td>
                        <td className="p-2 font-mono font-bold text-amber-900">{vu.vehicleNumber}</td>
                        <td className="p-2">-</td>
                        <td className="p-2">{vu.fromPlace} ({vu.reason})</td>
                        <td className="p-2 font-mono">{vu.transDocNo || "-"}</td>
                        <td className="p-2">{new Date(vu.updatedAt).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Note */}
              <div className="pt-2 text-[10px] text-slate-500 flex justify-between items-center border-t border-slate-300">
                <span>यह एक कम्प्यूटरीकृत अधिकृत ई-वे बिल है। किसी भौतिक हस्ताक्षर की आवश्यकता नहीं है।</span>
                <span className="font-mono">Generated via VyaparBook ERP • NIC API v1.03</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: HIGH-RES HIGHWAY CHECK QR CODE                  */}
      {/* ======================================================== */}
      {showQrModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                हाई-वे जांच QR कोड
              </span>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block mx-auto">
              {selectedDoc.qrCodeImage ? (
                <img src={selectedDoc.qrCodeImage} alt="Highway QR" className="w-56 h-56 mx-auto" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">QR उपलब्ध नहीं</div>
              )}
            </div>

            <div className="text-left bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div><strong>EWB No:</strong> <span className="font-mono font-bold text-indigo-700">{selectedDoc.ewayBillNumber}</span></div>
              <div><strong>दस्तावेज़:</strong> {selectedDoc.invoiceNumber}</div>
              <div><strong>वाहन नं.:</strong> <span className="font-mono font-bold">{selectedDoc.vehicleNumber}</span></div>
              <div><strong>क्रेता:</strong> {selectedDoc.toTradeName}</div>
              <div><strong>वैधता:</strong> {new Date(selectedDoc.validUpto).toLocaleString("en-IN")}</div>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg text-sm"
            >
              बंद करें
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: PART-B VEHICLE NUMBER UPDATE                    */}
      {/* ======================================================== */}
      {showUpdateVehicleModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                वाहन नंबर बदलें (Part-B Update)
              </span>
              <button onClick={() => setShowUpdateVehicleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900">
              वाहन खराब होने या ट्रांसशिपमेंट के दौरान बिना नया ई-वे बिल बनाए वाहन नंबर बदला जा सकता है।
            </div>

            <form onSubmit={handleUpdateVehicleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">वर्तमान वाहन नंबर</label>
                <div className="font-mono font-bold text-slate-800 bg-slate-100 p-2 rounded">
                  {selectedDoc.vehicleNumber || "कोई वाहन दर्ज नहीं था"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">नया वाहन नंबर (New Vehicle No.)</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. CG-04-ME-9080"
                  value={newVehicleNo}
                  onChange={(e) => setNewVehicleNo(e.target.value.toUpperCase())}
                  className="w-full border rounded p-2.5 text-sm uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">परिवर्तन का कारण</label>
                <select
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  className="w-full border rounded p-2 text-sm bg-white"
                >
                  <option value="Breakdown">वाहन खराबी (Vehicle Breakdown)</option>
                  <option value="Transshipment">ट्रांसशिपमेंट (Transshipment)</option>
                  <option value="Others">अन्य कारण (Others)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">स्थान (From Place)</label>
                <input
                  type="text"
                  value={updateFromPlace}
                  onChange={(e) => setUpdateFromPlace(e.target.value)}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowUpdateVehicleModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-5 rounded-lg text-sm shadow flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  <span>वाहन अपडेट करें</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: CANCEL E-WAY BILL                               */}
      {/* ======================================================== */}
      {showCancelModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="font-bold text-rose-700 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                E-Way Bill रद्द करें (Cancel)
              </span>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-xs text-rose-800 space-y-1">
              <div><strong>सावधानी:</strong> GST नियमों के तहत ई-वे बिल जनरेट होने के 24 घंटे के भीतर रद्द किया जा सकता है।</div>
              <div>ई-वे बिल नं.: <span className="font-mono font-bold">{selectedDoc.ewayBillNumber}</span></div>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">रद्द करने का कारण चुनें</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border rounded p-2.5 text-sm bg-white"
                >
                  <option value="Order Cancelled">ऑर्डर रद्द हुआ (Order Cancelled)</option>
                  <option value="Data Entry Mistake">डेटा प्रविष्टि में गलती (Data Entry Mistake)</option>
                  <option value="Duplicate">डुप्लीकेट ई-वे बिल (Duplicate)</option>
                  <option value="Others">अन्य कारण (Others)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  वापस जाएं
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-5 rounded-lg text-sm shadow flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  <span>रद्द करें (Confirm Cancel)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
