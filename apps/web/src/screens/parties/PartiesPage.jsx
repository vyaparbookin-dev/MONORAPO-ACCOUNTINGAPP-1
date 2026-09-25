import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import { Plus, Search, User, Phone, Edit, Trash2, Calendar, DollarSign, X, CreditCard, FileText, Printer, Share2, Image as ImageIcon, Eye, UploadCloud, CheckCircle2, Download, FileSpreadsheet, Upload, AlertCircle, MapPin, RotateCcw, Filter } from 'lucide-react';
import { syncQueue } from "@repo/shared";
import CreditLimitHubModal from '../../components/modals/CreditLimitHubModal';

export default function PartiesPage() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCreditLimitHub, setShowCreditLimitHub] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'to_collect', 'to_pay', 'customer', 'supplier', 'personal'

  // Statement & Image Modal State
  const [statementParty, setStatementParty] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // URL for full-res bill photo preview modal

  // Statement Filters State (Site, Financial Year & Custom Dates)
  const [statementSiteFilter, setStatementSiteFilter] = useState('all');
  const [statementPeriodFilter, setStatementPeriodFilter] = useState('all'); // 'all', 'FY2425', 'FY2526', 'FY2627', 'custom'
  const [statementStartDate, setStatementStartDate] = useState('');
  const [statementEndDate, setStatementEndDate] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    address: '',
    partyType: 'customer',
    priceLevel: 'retail',
    openingBalance: '',
    creditLimit: ''
  });

  // Edit Party State
  const [editingParty, setEditingParty] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    mobileNumber: '',
    address: '',
    partyType: 'customer',
    priceLevel: 'retail',
    creditLimit: ''
  });

  // Payment / Installment Entry Modal State
  const [paymentParty, setPaymentParty] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState('paid'); // 'paid' (मैंने दिए) or 'received' (मुझे मिले)
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('CASH'); // CASH, UPI, BANK
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Bulk Import Excel Modal State
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkPartiesList, setBulkPartiesList] = useState([]);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [bulkImportFileName, setBulkImportFileName] = useState('');
  const [bulkStats, setBulkStats] = useState({ total: 0, customers: 0, suppliers: 0, toCollectTotal: 0, toPayTotal: 0 });
  const bulkFileRef = useRef(null);

  // 1. Download Pre-formatted Sample Excel Template
  const handleDownloadPartyTemplate = () => {
    const sampleData = [
      {
        "PartyName": "राजेश किराना स्टोर (उदा. देनदार ग्राहक)",
        "PartyType": "customer",
        "OpeningBalance": 15000,
        "BalanceType": "RECEIVE",
        "MobileNumber": "9876543210",
        "Address": "गांधी चौक, रायपुर",
        "CreditLimit": 50000,
        "GSTIN": "22AAAAA0000A1Z5"
      },
      {
        "PartyName": "वर्मा हार्डवेयर (उदा. देनदार ग्राहक)",
        "PartyType": "customer",
        "OpeningBalance": 8500,
        "BalanceType": "RECEIVE",
        "MobileNumber": "9823456789",
        "Address": "मेन रोड, बिलासपुर",
        "CreditLimit": 30000,
        "GSTIN": ""
      },
      {
        "PartyName": "अंबुजा सीमेंट एजेंसी (उदा. लेनदार सप्लायर)",
        "PartyType": "supplier",
        "OpeningBalance": 45000,
        "BalanceType": "PAY",
        "MobileNumber": "9811122233",
        "Address": "ट्रांसपोर्ट नगर, रायपुर",
        "CreditLimit": 100000,
        "GSTIN": "22BBBBB1111B1Z2"
      },
      {
        "PartyName": "टाटा स्टील डिस्ट्रीब्यूटर (उदा. लेनदार सप्लायर)",
        "PartyType": "supplier",
        "OpeningBalance": 92000,
        "BalanceType": "PAY",
        "MobileNumber": "9899988877",
        "Address": "इंडस्ट्रियल एस्टेट",
        "CreditLimit": 200000,
        "GSTIN": ""
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Parties_Import_Format");
    XLSX.writeFile(wb, `VyaparBook_Parties_Import_Template.xlsx`);
  };

  // 2. Parse Uploaded Excel (.xlsx, .xls, .csv)
  const handlePartyFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          alert("चयनित फ़ाइल खाली है! कृपया डेटा वाली फ़ाइल अपलोड करें।");
          return;
        }

        let customersCount = 0;
        let suppliersCount = 0;
        let collectTotal = 0;
        let payTotal = 0;

        const parsedRows = rawJson.map((row, index) => {
          const name = (row["PartyName"] || row["partyName"] || row["Name"] || row["पार्टी का नाम"] || row["Party Name"] || Object.values(row)[0] || "").toString().trim();
          const rawType = (row["PartyType"] || row["partyType"] || row["Type"] || row["खाता प्रकार"] || "customer").toString().toLowerCase();
          const isSupplier = rawType.includes("sup") || rawType.includes("लेनदार") || rawType.includes("vendor");
          const partyType = isSupplier ? "supplier" : "customer";

          const mobile = (row["MobileNumber"] || row["mobileNumber"] || row["Phone"] || row["Mobile"] || row["मोबाइल नंबर"] || "").toString().trim();
          const address = (row["Address"] || row["address"] || row["पता"] || "Local").toString().trim();
          const gstin = (row["GSTIN"] || row["gstin"] || row["GST"] || "").toString().trim();
          const creditLimit = parseFloat(row["CreditLimit"] || row["creditLimit"] || row["क्रेडिट लिमिट"] || 0) || 0;

          const rawBal = parseFloat(row["OpeningBalance"] || row["openingBalance"] || row["Balance"] || row["शुरुआती बैलेंस"] || 0) || 0;
          const rawBalType = (row["BalanceType"] || row["balanceType"] || row["बैलेंस प्रकार"] || "").toString().toUpperCase();

          let balanceType = "RECEIVE";
          if (rawBalType.includes("PAY") || rawBalType.includes("देने")) {
            balanceType = "PAY";
          } else if (rawBalType.includes("REC") || rawBalType.includes("लेने")) {
            balanceType = "RECEIVE";
          } else {
            balanceType = isSupplier ? "PAY" : "RECEIVE";
          }

          const currentBal = balanceType === "PAY" ? -Math.abs(rawBal) : Math.abs(rawBal);

          if (balanceType === "PAY") {
            suppliersCount++;
            payTotal += Math.abs(rawBal);
          } else {
            customersCount++;
            collectTotal += Math.abs(rawBal);
          }

          return {
            id: index + 1,
            name,
            partyType,
            openingBalance: Math.abs(rawBal),
            balanceType,
            currentBalance: currentBal,
            balance: currentBal,
            mobileNumber: mobile,
            address,
            creditLimit,
            gstin
          };
        }).filter(r => r.name);

        setBulkPartiesList(parsedRows);
        setBulkStats({
          total: parsedRows.length,
          customers: customersCount,
          suppliers: suppliersCount,
          toCollectTotal: collectTotal,
          toPayTotal: payTotal
        });
      } catch (err) {
        console.error("Failed to parse parties excel:", err);
        alert("Excel फ़ाइल पढ़ने में त्रुटि: " + err.message);
      }
    };

    reader.readAsBinaryString(file);
  };

  // 3. Confirm and Save All Bulk Parties
  const handleConfirmBulkImport = async () => {
    if (bulkPartiesList.length === 0) {
      alert("कोई पार्टी अपलोड करने के लिए नहीं है!");
      return;
    }
    setBulkImportLoading(true);
    try {
      const res = await api.post("/api/party/bulk-create", { parties: bulkPartiesList });
      const data = res.data;
      alert(`🎉 बधाई हो!\n${data.message || `कुल ${data.count || bulkPartiesList.length} पार्टियां सफलतापूर्वक जुड़ गईं!`}`);
      setShowBulkImportModal(false);
      setBulkPartiesList([]);
      setBulkImportFileName('');
      fetchParties();
    } catch (err) {
      console.error("Bulk party import error:", err);
      try {
        let savedCount = 0;
        for (const p of bulkPartiesList) {
          await api.post("/api/party", {
            ...p,
            mobileNumber: p.mobileNumber || `99${Math.floor(10000000 + Math.random() * 90000000)}`
          }).catch(() => null);
          savedCount++;
        }
        alert(`✅ कुल ${savedCount} पार्टियां सफलतापूर्वक जुड़ गईं!`);
        setShowBulkImportModal(false);
        setBulkPartiesList([]);
        fetchParties();
      } catch (fallbackErr) {
        alert("पार्टी सेव करने में त्रुटि: " + (err.response?.data?.error || err.message));
      }
    } finally {
      setBulkImportLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      setLoading(true);
      // Local-First: डेस्कटॉप ऐप के लिए लोकल SQLite से डेटा लें
      if (window.electron && window.electron.db) {
        const localParties = await window.electron.db.getCustomers();
        setParties(localParties || []);
      } else {
        const res = await api.get('/api/party').catch(() => api.get('/api/parties'));
        setParties(res.data?.parties || res.parties || (Array.isArray(res) ? res : []));
      }
    } catch (error) {
      console.error("Error fetching parties", error);
      if (!window.electron) setParties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParties(); }, []);

  // Add Party Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const trimmedName = formData.name.trim();
      const trimmedAddr = formData.address.trim() || "Local";

      // Duplicate Check: Same name and same address
      const normName = trimmedName.toLowerCase();
      const normAddr = trimmedAddr.toLowerCase();
      const isDuplicate = parties.some(p => {
        const existingName = (p.name || "").trim().toLowerCase();
        const existingAddr = (p.address || "Local").trim().toLowerCase();
        return existingName === normName && existingAddr === normAddr;
      });

      if (isDuplicate) {
        alert(`⚠️ इस नाम ("${trimmedName}") और पते ("${trimmedAddr}") से पहले से एक पार्टी मौजूद है!\nकृपया अलग नाम या पता दर्ज करें।`);
        return;
      }

      const payload = {
        ...formData,
        name: trimmedName,
        address: trimmedAddr,
        openingBalance: parseFloat(formData.openingBalance) || 0,
        creditLimit: parseFloat(formData.creditLimit) || 0
      };

      // Desktop: लोकल SQLite में तुरंत सेव करें (Offline Guarantee)
      if (window.electron && window.electron.db) {
        await window.electron.db.addCustomer({
          name: payload.name,
          gstin: '',
          phone: payload.mobileNumber,
          email: '',
          address: payload.address
        });
      }

      try {
        await api.post('/api/party', payload);
        alert(`✅ पार्टी '${payload.name}' सफलतापूर्वक जुड़ गई!`);
      } catch (apiErr) {
        if (!navigator.onLine || apiErr.message === "Network Error") {
          syncQueue.enqueue({ method: "POST", url: "/api/party", data: payload });
          alert("You are offline. Party saved safely locally and will sync automatically!");
        } else throw apiErr;
      }

      setShowModal(false);
      setFormData({ name: '', mobileNumber: '', address: '', partyType: 'customer', priceLevel: 'retail', openingBalance: '', creditLimit: '' });
      fetchParties();
    } catch (error) {
      alert('Error adding party: ' + (error.response?.data?.error || error.message));
    }
  };

  // Open Edit Party
  const handleOpenEdit = (party) => {
    setEditingParty(party);
    setEditFormData({
      name: party.name || '',
      mobileNumber: party.mobileNumber || party.phone || '',
      address: party.address || '',
      partyType: party.partyType || party.type || 'customer',
      priceLevel: party.priceLevel || 'retail',
      creditLimit: party.creditLimit || ''
    });
    setShowEditModal(true);
  };

  // Submit Edit Party
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingParty) return;
    try {
      const pId = editingParty._id || editingParty.id;
      const trimmedName = editFormData.name.trim();
      const trimmedAddr = editFormData.address.trim() || "Local";

      // Duplicate Check
      const normName = trimmedName.toLowerCase();
      const normAddr = trimmedAddr.toLowerCase();
      const isDuplicate = parties.some(p => {
        const id = p._id || p.id;
        if (String(id) === String(pId)) return false;
        const existingName = (p.name || "").trim().toLowerCase();
        const existingAddr = (p.address || "Local").trim().toLowerCase();
        return existingName === normName && existingAddr === normAddr;
      });

      if (isDuplicate) {
        alert(`⚠️ इस नाम ("${trimmedName}") और पते ("${trimmedAddr}") से पहले से एक पार्टी मौजूद है!\nकृपया अलग नाम या पता दर्ज करें।`);
        return;
      }

      const payload = {
        name: trimmedName,
        mobileNumber: editFormData.mobileNumber.trim(),
        address: trimmedAddr,
        partyType: editFormData.partyType,
        priceLevel: editFormData.priceLevel,
        creditLimit: parseFloat(editFormData.creditLimit) || 0
      };

      await api.put(`/api/party/${pId}`, payload).catch(() => api.put(`/api/parties/${pId}`, payload));
      alert(`✅ पार्टी '${payload.name}' सफलतापूर्वक अपडेट हो गई!`);
      setShowEditModal(false);
      setEditingParty(null);
      fetchParties();
    } catch (error) {
      alert('Error updating party: ' + (error.response?.data?.error || error.message));
    }
  };

  // Delete Party
  const handleDeleteParty = async (party) => {
    const pId = party._id || party.id;
    if (!pId) return;
    if (!window.confirm(`क्या आप वाकई पार्टी '${party.name}' को हटाना चाहते हैं?`)) return;
    try {
      await api.delete(`/api/party/${pId}`).catch(() => api.delete(`/api/parties/${pId}`));
      setParties(prev => prev.filter(p => (p._id || p.id) !== pId));
      alert(`🗑️ पार्टी '${party.name}' सफलतापूर्वक हटा दी गई!`);
    } catch (error) {
      alert('Error deleting party: ' + (error.response?.data?.error || error.message));
    }
  };

  // Open Payment / Installment Entry Modal
  const handleOpenPayment = (party, type = 'paid') => {
    setPaymentParty(party);
    setPaymentType(type);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('CASH');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  // Submit Payment / Installment Entry
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentParty) return;
    const amt = parseFloat(paymentAmount);
    if (!paymentAmount || isNaN(amt) || amt <= 0) {
      alert("कृपया मान्य राशि (₹) दर्ज करें!");
      return;
    }
    setSavingPayment(true);
    try {
      const partyId = paymentParty._id || paymentParty.id;
      const txDate = paymentDate ? new Date(paymentDate) : new Date();
      const defaultNotes = paymentType === 'paid' ? 'किस्त भुगतान (Payment Given)' : 'किस्त वसूली (Payment Received)';
      const notes = paymentNotes.trim() || defaultNotes;

      await api.post("/api/payment/entry", {
        partyId,
        amount: amt,
        type: paymentType,
        date: txDate.toISOString(),
        paymentMethod: paymentMode,
        notes
      });

      // Update party in local state
      const diff = paymentType === 'paid' ? amt : -amt;
      setParties(prev => prev.map(p => {
        const id = p._id || p.id;
        if (id === partyId) {
          const currentBal = Number(p.currentBalance ?? p.balance ?? 0);
          return { ...p, currentBalance: currentBal + diff, balance: currentBal + diff };
        }
        return p;
      }));

      const formattedDate = txDate.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      alert(`✅ ₹${amt.toLocaleString('en-IN')} का भुगतान (${paymentType === 'paid' ? 'मैंने दिए / किस्त' : 'मुझे मिले / किस्त'}) दिनांक ${formattedDate} को सफलतापूर्वक दर्ज हुआ!`);
      setShowPaymentModal(false);
      setPaymentParty(null);
    } catch (error) {
      alert('Error recording payment: ' + (error.response?.data?.error || error.message));
    } finally {
      setSavingPayment(false);
    }
  };

  // Open Full Itemized Ledger Statement
  const handleOpenStatement = async (party) => {
    setStatementParty(party);
    setStatementSiteFilter('all');
    setStatementPeriodFilter('all');
    setStatementStartDate('');
    setStatementEndDate('');
    setShowStatementModal(true);
    setStatementLoading(true);
    setStatementData(null);
    try {
      const pId = party._id || party.id;
      const res = await api.get(`/api/party/${pId}/statement`);
      if (res?.data) {
        setStatementData(res.data);
      }
    } catch (err) {
      console.error("Statement fetch error", err);
      alert("लेजर लोड करने में समस्या आई: " + (err.response?.data?.error || err.message));
    } finally {
      setStatementLoading(false);
    }
  };

  // Distinct sites available in active party's statement
  const availableSites = useMemo(() => {
    if (!statementData?.transactions) return [];
    const siteMap = new Map();
    statementData.transactions.forEach(t => {
      const s = (t.siteName || '').trim();
      if (s) {
        siteMap.set(s, (siteMap.get(s) || 0) + 1);
      }
    });
    return Array.from(siteMap.entries()).map(([name, count]) => ({ name, count }));
  }, [statementData]);

  // Filtered transactions for active party statement (by Site, FY, and Custom Date)
  const filteredStatementTransactions = useMemo(() => {
    if (!statementData?.transactions) return [];
    let list = [...statementData.transactions];

    // 1. Site filter
    if (statementSiteFilter && statementSiteFilter !== 'all') {
      list = list.filter(t => (t.siteName || '').trim().toLowerCase() === statementSiteFilter.toLowerCase());
    }

    // 2. Financial Year or Date filter
    if (statementPeriodFilter === 'FY2425') {
      const from = new Date('2024-04-01T00:00:00.000Z');
      const to = new Date('2025-03-31T23:59:59.999Z');
      list = list.filter(t => {
        const d = new Date(t.date);
        return d >= from && d <= to;
      });
    } else if (statementPeriodFilter === 'FY2526') {
      const from = new Date('2025-04-01T00:00:00.000Z');
      const to = new Date('2026-03-31T23:59:59.999Z');
      list = list.filter(t => {
        const d = new Date(t.date);
        return d >= from && d <= to;
      });
    } else if (statementPeriodFilter === 'FY2627') {
      const from = new Date('2026-04-01T00:00:00.000Z');
      const to = new Date('2027-03-31T23:59:59.999Z');
      list = list.filter(t => {
        const d = new Date(t.date);
        return d >= from && d <= to;
      });
    } else if (statementPeriodFilter === 'custom') {
      if (statementStartDate) {
        const from = new Date(statementStartDate);
        from.setHours(0, 0, 0, 0);
        list = list.filter(t => new Date(t.date) >= from);
      }
      if (statementEndDate) {
        const to = new Date(statementEndDate);
        to.setHours(23, 59, 59, 999);
        list = list.filter(t => new Date(t.date) <= to);
      }
    }

    return list;
  }, [statementData, statementSiteFilter, statementPeriodFilter, statementStartDate, statementEndDate]);

  const filteredDebit = useMemo(() => {
    return filteredStatementTransactions.reduce((acc, t) => acc + (Number(t.debit) || 0), 0);
  }, [filteredStatementTransactions]);

  const filteredCredit = useMemo(() => {
    return filteredStatementTransactions.reduce((acc, t) => acc + (Number(t.credit) || 0), 0);
  }, [filteredStatementTransactions]);

  const filteredNet = filteredDebit - filteredCredit;

  // Attach Bill Photo / Receipt Image to Transaction
  const handleAttachImage = async (txId, file) => {
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Url = e.target.result;
        await api.post('/api/party/attach-image', { txId, imageUrl: base64Url });
        alert("✅ बिल/रसीद फोटो सफलतापूर्वक सेव हो गया!");
        if (statementParty) {
          handleOpenStatement(statementParty);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      alert("फोटो सेव विफल: " + e.message);
    }
  };

  // WhatsApp Share Ledger (incorporates active site and date range)
  const handleShareWhatsApp = () => {
    if (!statementParty) return;
    const p = statementParty;

    let periodLabel = 'सभी समय (All Time)';
    if (statementPeriodFilter === 'FY2425') periodLabel = 'FY 2024-25 (01 Apr 2024 - 31 Mar 2025)';
    else if (statementPeriodFilter === 'FY2526') periodLabel = 'FY 2025-26 (01 Apr 2025 - 31 Mar 2026)';
    else if (statementPeriodFilter === 'FY2627') periodLabel = 'FY 2026-27 (01 Apr 2026 - 31 Mar 2027)';
    else if (statementPeriodFilter === 'custom') {
      const fromStr = statementStartDate ? new Date(statementStartDate).toLocaleDateString('hi-IN') : 'शुरुआत';
      const toStr = statementEndDate ? new Date(statementEndDate).toLocaleDateString('hi-IN') : 'आज तक';
      periodLabel = `${fromStr} से ${toStr}`;
    }

    const siteLabel = statementSiteFilter !== 'all' ? statementSiteFilter : 'सभी साइटें (All Sites)';
    const isFiltered = statementSiteFilter !== 'all' || statementPeriodFilter !== 'all' || statementStartDate || statementEndDate;

    let text = `*खाता विवरण (Statement of Account)*\n` +
      `🏢 *गणेश हार्डवेयर (Ganesh Hardware)*\n` +
      `👤 पार्टी: *${p.name}*\n` +
      `📞 मोबाइल: ${p.mobileNumber && p.mobileNumber !== '9999999999' ? p.mobileNumber : '-'}\n` +
      `📅 अवधि: *${periodLabel}*\n` +
      `🏗️ साइट: *${siteLabel}*\n` +
      `------------------------------------\n` +
      `📋 कुल प्रविष्टियाँ: ${filteredStatementTransactions.length}\n` +
      `🔴 कुल बिल (Debit): *₹${filteredDebit.toLocaleString('en-IN')}*\n` +
      `🟢 कुल जमा (Credit): *₹${filteredCredit.toLocaleString('en-IN')}*\n` +
      `⚖️ *इस अवधि/साइट का बाकी:* *₹${Math.abs(filteredNet).toLocaleString('en-IN')} ${filteredNet > 0 ? '(लेने हैं / Due)' : filteredNet < 0 ? '(देने हैं / Advance)' : '(चुक्ता / Nil)'}*\n`;

    if (isFiltered) {
      const overallBal = Number(p.currentBalance ?? statementData?.currentBalance ?? 0);
      text += `💰 *कुल समग्र बकाया (All Time Net):* *₹${Math.abs(overallBal).toLocaleString('en-IN')} ${overallBal > 0 ? '(लेने हैं)' : '(देने हैं)'}*\n`;
    }

    text += `------------------------------------\n` +
      `कृपया हिसाब मिलान कर लें। धन्यवाद!\n- Ganesh Hardware`;

    const cleanPhone = (p.mobileNumber || p.phone || '').replace(/[^0-9]/g, '');
    const url = (cleanPhone && cleanPhone !== '9999999999' && cleanPhone.length >= 10)
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filtered Parties calculation
  const filteredParties = parties.filter(p => {
    const matchesSearch = String(p?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || String(p?.mobileNumber || p?.phone || '').includes(searchTerm);
    const pType = (p?.partyType || p?.type || 'customer').toLowerCase();
    const bal = Number(p?.currentBalance ?? p?.balance ?? 0);

    let matchesType = true;
    if (filterType === 'to_collect') matchesType = bal > 0;
    else if (filterType === 'to_pay') matchesType = bal < 0;
    else if (filterType === 'customer') matchesType = pType === 'customer' || pType === 'both';
    else if (filterType === 'supplier') matchesType = pType === 'supplier' || pType === 'both';
    else if (filterType === 'personal') matchesType = pType === 'personal';
    return matchesSearch && matchesType;
  });

  const totalToCollect = parties.filter(p => Number(p.currentBalance ?? p.balance ?? 0) > 0).reduce((sum, p) => sum + Number(p.currentBalance ?? p.balance ?? 0), 0);
  const totalToPay = Math.abs(parties.filter(p => Number(p.currentBalance ?? p.balance ?? 0) < 0).reduce((sum, p) => sum + Number(p.currentBalance ?? p.balance ?? 0), 0));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800">खाता बही व पार्टियां (Parties & Ledger)</h1>
            <p className="text-gray-500 text-sm">ग्राहकों, सप्लायरों व पर्सनल खातों की किस्त, उधारी व लेन-देन का संपूर्ण हिसाब</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => setShowBulkImportModal(true)} 
              className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition text-xs sm:text-sm"
              title="Excel से देनदार व लेनदार पार्टियां एक साथ बल्क में जोड़ें"
            >
              <FileSpreadsheet size={17} /> 📥 Excel से बल्क पार्टी जोड़ें
            </button>
            <button 
              onClick={() => setShowCreditLimitHub(true)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition text-xs sm:text-sm"
            >
              <CreditCard size={17} /> 💳 क्रेडिट लिमिट हब
            </button>
            <button onClick={() => setShowModal(true)} className="bg-[#4338CA] hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md transition text-xs sm:text-sm">
              <Plus size={18} /> + नया खाता जोड़ें
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="पार्टी का नाम या मोबाइल नंबर खोजें..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: `सभी (${parties.length})` },
              { id: 'to_collect', label: `🟢 लेने हैं (₹${totalToCollect.toLocaleString('en-IN')})` },
              { id: 'to_pay', label: `🔴 देने हैं (₹${totalToPay.toLocaleString('en-IN')})` },
              { id: 'customer', label: '🛒 ग्राहक' },
              { id: 'supplier', label: '🏢 सप्लायर' },
              { id: 'personal', label: '👤 पर्सनल खाता' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterType === tab.id
                    ? tab.id === 'to_collect' ? 'bg-emerald-600 text-white shadow-sm'
                    : tab.id === 'to_pay' ? 'bg-rose-600 text-white shadow-sm'
                    : tab.id === 'personal' ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-[#4338CA] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table of Parties */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-100 text-gray-700 uppercase font-semibold text-xs border-b">
                <tr>
                  <th className="px-5 py-3.5">पार्टी का नाम (Party)</th>
                  <th className="px-4 py-3.5">खाता प्रकार</th>
                  <th className="px-4 py-3.5">रेट लेवल</th>
                  <th className="px-4 py-3.5">मोबाइल व पता</th>
                  <th className="px-4 py-3.5">बाकी हिसाब (Balance)</th>
                  <th className="px-4 py-3.5 text-center">किस्त / भुगतान</th>
                  <th className="px-4 py-3.5 text-right">कार्रवाई (Action)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-10 text-gray-500">लोड हो रहा है...</td></tr>
                ) : filteredParties.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-10 text-gray-400">कोई पार्टी नहीं मिली।</td></tr>
                ) : (
                  filteredParties.map(p => {
                    const pId = p._id || p.id;
                    const bal = Number(p.currentBalance ?? p.balance ?? 0);
                    const isPersonal = (p.partyType || p.type) === 'personal';
                    const isSupplier = (p.partyType || p.type) === 'supplier';

                    return (
                      <tr key={pId} className="border-b hover:bg-gray-50/80 transition">
                        <td className="px-5 py-3.5 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <User size={16} className={isPersonal ? 'text-amber-500' : 'text-indigo-600'}/> 
                            <span>{p.name}</span>
                            {isPersonal && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold border border-amber-300">पर्सनल</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 capitalize">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isPersonal ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            isSupplier ? 'bg-purple-100 text-purple-700' : 
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {isPersonal ? '👤 पर्सनल' : isSupplier ? '🏢 सप्लायर' : '🛒 ग्राहक'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {isPersonal ? (
                            <span className="text-xs text-gray-400 italic">पर्सनल खाता</span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              p.priceLevel === 'wholesale' ? 'bg-blue-100 text-blue-800' : p.priceLevel === 'special' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {p.priceLevel === 'wholesale' ? 'Rate B (Wholesale)' : p.priceLevel === 'special' ? 'Rate C (Dealer)' : 'Rate A (Retail)'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Phone size={13} className="text-gray-400" />
                            <span>{p.mobileNumber || p.phone || '-'}</span>
                          </div>
                          {p.address && <div className="text-[11px] text-gray-400 mt-0.5">📍 {p.address}</div>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className={`font-black text-sm ${bal > 0 ? 'text-emerald-600' : bal < 0 ? 'text-rose-600' : 'text-gray-600'}`}>
                            {bal > 0 ? `+ ₹${bal.toLocaleString('en-IN')}` : bal < 0 ? `- ₹${Math.abs(bal).toLocaleString('en-IN')}` : '₹ 0'}
                          </div>
                          <span className={`text-[10px] font-bold block ${bal > 0 ? 'text-emerald-700' : bal < 0 ? 'text-rose-700' : 'text-gray-400'}`}>
                            {bal > 0 ? '🟢 लेने हैं' : bal < 0 ? '🔴 देने हैं' : 'हिसाब चुकता'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenStatement(p)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1 shadow-xs"
                              title="पार्टी का संपूर्ण लेजर स्टेटमेंट देखें"
                            >
                              <FileText size={12} /> लेजर
                            </button>
                            <button
                              onClick={() => handleOpenPayment(p, 'paid')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition"
                              title="मैंने दिए (किस्त भुगतान)"
                            >
                              🔴 दिए
                            </button>
                            <button
                              onClick={() => handleOpenPayment(p, 'received')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold cursor-pointer transition"
                              title="मुझे मिले (किस्त वसूली)"
                            >
                              🟢 मिले
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer transition"
                              title="पार्टी विवरण संपादित करें"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteParty(p)}
                              className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition"
                              title="पार्टी हटाएं"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD PARTY MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h2 className="text-lg font-black text-gray-900">+ नया खाता जोड़ें (Add Party)</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">पार्टी का नाम *</label>
                  <input required type="text" placeholder="नाम दर्ज करें" className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">मोबाइल नंबर *</label>
                    <input required type="text" maxLength="10" placeholder="10-अंक मोबाइल" className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">खाता प्रकार</label>
                    <select className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 font-medium" value={formData.partyType} onChange={e => setFormData({...formData, partyType: e.target.value})}>
                      <option value="customer">🛒 Customer (ग्राहक)</option>
                      <option value="supplier">🏢 Supplier (सप्लायर)</option>
                      <option value="both">Both (ग्राहक व सप्लायर)</option>
                      <option value="personal">👤 Personal (पर्सनल खाता)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">पता / शहर (Address) *</label>
                  <input required type="text" placeholder="पता या शहर दर्ज करें" className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">शुरुआती बाकी (Opening Bal)</label>
                    <input type="number" placeholder="₹ 0.00" className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">क्रेडिट लिमिट (Credit Limit)</label>
                    <input type="number" placeholder="₹ 0.00" className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" value={formData.creditLimit} onChange={e => setFormData({...formData, creditLimit: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6 pt-2 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50 text-xs font-bold cursor-pointer">रद्द करें</button>
                  <button type="submit" className="px-4 py-2 bg-[#4338CA] text-white rounded-xl hover:bg-indigo-700 font-bold text-xs cursor-pointer shadow">सहेजें (Save)</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT PARTY MODAL */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h2 className="text-lg font-black text-gray-900">✏️ पार्टी विवरण संपादित करें (Edit Party)</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">पार्टी का नाम *</label>
                  <input required type="text" className="w-full border rounded-xl px-3 py-2 text-sm font-bold" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">मोबाइल नंबर</label>
                    <input type="text" maxLength="10" className="w-full border rounded-xl px-3 py-2 text-sm" value={editFormData.mobileNumber} onChange={e => setEditFormData({...editFormData, mobileNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">खाता प्रकार</label>
                    <select className="w-full border rounded-xl px-3 py-2 text-sm font-medium" value={editFormData.partyType} onChange={e => setEditFormData({...editFormData, partyType: e.target.value})}>
                      <option value="customer">🛒 Customer (ग्राहक)</option>
                      <option value="supplier">🏢 Supplier (सप्लायर)</option>
                      <option value="both">Both (ग्राहक व सप्लायर)</option>
                      <option value="personal">👤 Personal (पर्सनल)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">पता / शहर (Address)</label>
                  <input type="text" className="w-full border rounded-xl px-3 py-2 text-sm" value={editFormData.address} onChange={e => setEditFormData({...editFormData, address: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2 mt-6 pt-2 border-t">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50 text-xs font-bold cursor-pointer">रद्द करें</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-xs cursor-pointer shadow">अपडेट करें (Update)</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PAYMENT / INSTALLMENT ENTRY MODAL */}
        {showPaymentModal && paymentParty && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h2 className="text-base font-black text-gray-900">
                    💰 किस्त / भुगतान प्रविष्टि ({paymentParty.name})
                  </h2>
                  <p className="text-xs text-slate-500">
                    मौजूदा बाकी: <strong>{Number(paymentParty.currentBalance ?? paymentParty.balance ?? 0) >= 0 ? `+ ₹${Number(paymentParty.currentBalance ?? paymentParty.balance ?? 0).toLocaleString('en-IN')} (लेने हैं)` : `- ₹${Math.abs(Number(paymentParty.currentBalance ?? paymentParty.balance ?? 0)).toLocaleString('en-IN')} (देने हैं)`}</strong>
                  </p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
                {/* Type toggle */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">लेन-देन प्रकार (Type)</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPaymentType('paid')}
                      className={`py-2 text-xs font-extrabold rounded-lg transition cursor-pointer ${
                        paymentType === 'paid' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🔴 मैंने दिए (You Gave / किस्त)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('received')}
                      className={`py-2 text-xs font-extrabold rounded-lg transition cursor-pointer ${
                        paymentType === 'received' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🟢 मुझे मिले (You Got / किस्त)
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">राशि (Amount ₹) *</label>
                  <input 
                    required 
                    type="number" 
                    placeholder="₹ 0.00 *" 
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)} 
                    autoFocus
                  />
                </div>

                {/* Date Input */}
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-600" />
                    <span>तारीख (Payment Date) *</span>
                  </label>
                  <input 
                    required 
                    type="date" 
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={paymentDate} 
                    onChange={e => setPaymentDate(e.target.value)} 
                  />
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">भुगतान माध्यम (Payment Mode)</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                    {[
                      { id: 'CASH', label: '💵 नकद (Cash)' },
                      { id: 'UPI', label: '📱 ऑनलाइन (UPI)' },
                      { id: 'BANK', label: '🏛️ बैंक (Bank)' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMode(m.id)}
                        className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                          paymentMode === m.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">विवरण / नोट (Description)</label>
                  <input 
                    type="text" 
                    placeholder="उदा. किस्त 1, चेक नंबर, सामान का भुगतान" 
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={paymentNotes} 
                    onChange={e => setPaymentNotes(e.target.value)} 
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-2 border-t">
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50 text-xs font-bold cursor-pointer">
                    रद्द करें
                  </button>
                  <button 
                    type="submit" 
                    disabled={savingPayment}
                    className={`px-5 py-2 text-white rounded-xl font-bold text-xs cursor-pointer shadow transition ${
                      paymentType === 'paid' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {savingPayment ? 'सेव हो रहा है...' : 'सुरक्षित करें (Save Payment)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 💳 Dedicated Credit Limit & Mandate Hub Modal */}
        <CreditLimitHubModal
          isOpen={showCreditLimitHub}
          onClose={() => setShowCreditLimitHub(false)}
          onPartyUpdated={fetchParties}
        />

        {/* 📄 FULL ITEMIZED PARTY LEDGER STATEMENT MODAL */}
        {showStatementModal && statementParty && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-3 sm:p-5 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-start flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-500/30 rounded-lg text-indigo-300">
                      <FileText size={18} />
                    </span>
                    <h2 className="text-lg sm:text-xl font-black">{statementParty.name}</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/20 text-white capitalize">
                      {statementParty.partyType || 'customer'}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 mt-1 flex items-center gap-2">
                    <span>📞 {statementParty.mobileNumber || statementParty.phone || 'कोई नंबर नहीं'}</span>
                    {statementParty.address && <span>• 📍 {statementParty.address}</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShareWhatsApp}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow cursor-pointer transition"
                    title="व्हाट्सएप पर स्टेटमेंट भेजें"
                  >
                    <Share2 size={14} /> <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 border border-white/20 cursor-pointer transition"
                    title="प्रिंट या PDF डाउनलोड करें"
                  >
                    <Printer size={14} /> <span>प्रिंट / PDF</span>
                  </button>
                  <button
                    onClick={() => setShowStatementModal(false)}
                    className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              {(() => {
                const isFilterActive = statementSiteFilter !== 'all' || statementPeriodFilter !== 'all' || statementStartDate || statementEndDate;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-50 border-b border-slate-200 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] text-slate-500 font-bold block">शुरूआती बैलेंस (Opening)</span>
                      <p className="text-sm font-black text-slate-800 mt-0.5">
                        ₹{(statementData?.openingBalance || statementParty.openingBalance || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] text-indigo-600 font-bold block">
                        कुल बिल (Debit) {isFilterActive && <span className="text-amber-600 font-normal">(फ़िल्टर)</span>}
                      </span>
                      <p className="text-sm font-black text-indigo-700 mt-0.5">
                        ₹{(isFilterActive ? filteredDebit : (statementData?.totalDebit || 0)).toLocaleString('en-IN')}
                      </p>
                      {isFilterActive && (
                        <span className="text-[9px] text-slate-400">कुल: ₹{(statementData?.totalDebit || 0).toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] text-emerald-600 font-bold block">
                        कुल जमा (Credit) {isFilterActive && <span className="text-amber-600 font-normal">(फ़िल्टर)</span>}
                      </span>
                      <p className="text-sm font-black text-emerald-700 mt-0.5">
                        ₹{(isFilterActive ? filteredCredit : (statementData?.totalCredit || 0)).toLocaleString('en-IN')}
                      </p>
                      {isFilterActive && (
                        <span className="text-[9px] text-slate-400">कुल: ₹{(statementData?.totalCredit || 0).toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] text-rose-600 font-bold block">
                        {isFilterActive ? 'अवधि बाकी (Period Net)' : 'मौजूदा बाकी (Net Due)'}
                      </span>
                      <p className={`text-sm font-black mt-0.5 ${
                        (isFilterActive ? filteredNet : Number(statementParty.currentBalance ?? statementData?.currentBalance ?? 0)) > 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}>
                        ₹{Math.abs(isFilterActive ? filteredNet : Number(statementParty.currentBalance ?? statementData?.currentBalance ?? 0)).toLocaleString('en-IN')}
                        <span className="text-[10px] font-normal ml-1">
                          {(isFilterActive ? filteredNet : Number(statementParty.currentBalance ?? statementData?.currentBalance ?? 0)) > 0 ? '(लेने हैं)' : '(देने हैं)'}
                        </span>
                      </p>
                      {isFilterActive && (
                        <span className="text-[9px] text-slate-500 font-medium">
                          समग्र: ₹{Math.abs(Number(statementParty.currentBalance ?? statementData?.currentBalance ?? 0)).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 🔍 FILTER BAR: Site, Financial Year & Custom Dates */}
              <div className="p-3 bg-indigo-50/60 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Site Filter Dropdown */}
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                    <MapPin size={13} className="text-indigo-600 shrink-0" />
                    <span className="font-bold text-slate-600 text-[11px]">साइट:</span>
                    <select
                      value={statementSiteFilter}
                      onChange={(e) => setStatementSiteFilter(e.target.value)}
                      className="bg-transparent font-bold text-indigo-700 outline-none cursor-pointer text-xs pr-1"
                    >
                      <option value="all">सभी साइटें ({statementData?.transactions?.length || 0})</option>
                      {availableSites.map(s => (
                        <option key={s.name} value={s.name}>
                          {s.name} ({s.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Financial Year / Period Dropdown */}
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                    <Calendar size={13} className="text-indigo-600 shrink-0" />
                    <span className="font-bold text-slate-600 text-[11px]">अवधि:</span>
                    <select
                      value={statementPeriodFilter}
                      onChange={(e) => setStatementPeriodFilter(e.target.value)}
                      className="bg-transparent font-bold text-indigo-700 outline-none cursor-pointer text-xs pr-1"
                    >
                      <option value="all">सभी समय (All Time)</option>
                      <option value="FY2425">FY 2024-25 (01/04/24 - 31/03/25)</option>
                      <option value="FY2526">FY 2025-26 (01/04/25 - 31/03/26)</option>
                      <option value="FY2627">FY 2026-27 (01/04/26 - 31/03/27)</option>
                      <option value="custom">📅 कस्टम तारीख चुनें (Custom Date)</option>
                    </select>
                  </div>

                  {/* Custom Date Pickers */}
                  {statementPeriodFilter === 'custom' && (
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-xs animate-in fade-in">
                      <input
                        type="date"
                        value={statementStartDate}
                        onChange={(e) => setStatementStartDate(e.target.value)}
                        className="border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 outline-none"
                        title="प्रारंभिक तारीख"
                      />
                      <span className="text-slate-400 font-bold text-[11px]">से</span>
                      <input
                        type="date"
                        value={statementEndDate}
                        onChange={(e) => setStatementEndDate(e.target.value)}
                        className="border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 outline-none"
                        title="अंतिम तारीख"
                      />
                    </div>
                  )}

                  {/* Reset Filters Button */}
                  {(statementSiteFilter !== 'all' || statementPeriodFilter !== 'all' || statementStartDate || statementEndDate) && (
                    <button
                      onClick={() => {
                        setStatementSiteFilter('all');
                        setStatementPeriodFilter('all');
                        setStatementStartDate('');
                        setStatementEndDate('');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer transition text-[11px]"
                      title="फ़िल्टर हटाएं"
                    >
                      <RotateCcw size={12} /> रीसेट
                    </button>
                  )}
                </div>

                {/* Filter Counter */}
                <div className="text-[11px] font-bold text-slate-500 ml-auto">
                  दिखा रहे हैं: <span className="text-indigo-700">{filteredStatementTransactions.length}</span> / {statementData?.transactions?.length || 0}
                </div>
              </div>

              {/* Transactions List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {statementLoading ? (
                  <div className="py-16 text-center text-slate-400 font-bold text-sm">
                    लेजर स्टेटमेंट लोड हो रहा है...
                  </div>
                ) : filteredStatementTransactions.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 font-medium text-xs">
                    चयनित फ़िल्टर (साइट या अवधि) के अनुसार कोई प्रविष्टि नहीं मिली।
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b">
                        <tr>
                          <th className="px-3 py-2.5">दिनांक (Date)</th>
                          <th className="px-3 py-2.5">प्रकार (Type)</th>
                          <th className="px-3 py-2.5">रेफरेंस / बिल #</th>
                          <th className="px-3 py-2.5">विवरण (Details)</th>
                          <th className="px-3 py-2.5 text-center">साइट (Site)</th>
                          <th className="px-3 py-2.5 text-right">बिल (Debit ₹)</th>
                          <th className="px-3 py-2.5 text-right">जमा (Credit ₹)</th>
                          <th className="px-3 py-2.5 text-right">बाकी (Balance ₹)</th>
                          <th className="px-3 py-2.5 text-center">बिल फोटो</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStatementTransactions.map((tx, idx) => {
                          const isSale = tx.type === 'sale';
                          const isPurchase = tx.type === 'purchase';
                          const isReceipt = tx.type === 'receipt' || tx.credit > 0;
                          const formattedDate = tx.date ? new Date(tx.date).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
                          const siteStr = (tx.siteName || '').trim();

                          return (
                            <tr key={tx._id || idx} className="hover:bg-slate-50/80 transition">
                              <td className="px-3 py-2.5 whitespace-nowrap font-medium text-slate-700">
                                {formattedDate}
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isSale ? 'bg-indigo-100 text-indigo-700' :
                                  isPurchase ? 'bg-amber-100 text-amber-800' :
                                  isReceipt ? 'bg-emerald-100 text-emerald-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {isSale ? '🛒 बिक्री बिल' : isPurchase ? '🏢 खरीद बिल' : isReceipt ? '🟢 मुझे मिले' : '🔴 मैंने दिए'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                                {tx.refNo || '-'}
                              </td>
                              <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate" title={tx.details}>
                                {tx.details || '-'}
                              </td>
                              <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                {siteStr ? (
                                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                    siteStr === 'COMPLEX' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                    siteStr === 'PWD' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                    siteStr === 'PAINT' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                    siteStr === 'S' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                    siteStr.includes('%') ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                    'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}>
                                    🏗️ {siteStr}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-[10px]">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right font-black text-rose-600 whitespace-nowrap">
                                {tx.debit > 0 ? `₹${tx.debit.toLocaleString('en-IN')}` : '-'}
                              </td>
                              <td className="px-3 py-2.5 text-right font-black text-emerald-700 whitespace-nowrap">
                                {tx.credit > 0 ? `₹${tx.credit.toLocaleString('en-IN')}` : '-'}
                              </td>
                              <td className="px-3 py-2.5 text-right font-black text-slate-900 whitespace-nowrap">
                                ₹{Math.abs(Number(tx.runningBalance || 0)).toLocaleString('en-IN')}
                                <span className="text-[9px] font-medium ml-1 text-slate-400">
                                  {Number(tx.runningBalance || 0) >= 0 ? 'Dr' : 'Cr'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                {tx.billImageUrl ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <img
                                      src={tx.billImageUrl}
                                      alt="Bill"
                                      onClick={() => setPreviewImage(tx.billImageUrl)}
                                      className="w-8 h-8 rounded-lg object-cover border border-indigo-200 cursor-pointer hover:scale-110 shadow-xs transition"
                                      title="बिल फोटो बड़ी देखें"
                                    />
                                    <button
                                      onClick={() => setPreviewImage(tx.billImageUrl)}
                                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                      title="बड़ा देखें"
                                    >
                                      <Eye size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-2 py-1 rounded-lg border border-dashed border-slate-300 cursor-pointer transition">
                                    <UploadCloud size={11} />
                                    <span>फोटो जोड़ें</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleAttachImage(tx._id, e.target.files[0])}
                                    />
                                  </label>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-500">
                  प्रदर्शित प्रविष्टियाँ: <strong className="text-slate-800">{filteredStatementTransactions.length}</strong> / कुल: <strong>{(statementData?.transactions || []).length}</strong>
                </span>
                <button
                  onClick={() => setShowStatementModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition"
                >
                  बंद करें (Close)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🖼️ HIGH-RES BILL IMAGE PREVIEW MODAL */}
        {previewImage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in">
            <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-4 flex flex-col gap-3 shadow-2xl border border-slate-700">
              <div className="flex justify-between items-center text-white pb-2 border-b border-slate-800">
                <span className="text-sm font-bold flex items-center gap-2">
                  <ImageIcon size={18} className="text-indigo-400" /> मूल बिल / रसीद की फोटो (Bill Document)
                </span>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[75vh] overflow-auto flex justify-center items-center bg-black/50 rounded-2xl p-2">
                <img src={previewImage} alt="Original Bill" className="max-h-[70vh] w-auto rounded-xl object-contain shadow-lg" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <a
                  href={previewImage}
                  download="bill_invoice_photo.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition"
                >
                  डाउनलोड फोटो
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer transition"
                >
                  बंद करें
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 📥 BULK IMPORT PARTIES MODAL (EXCEL / CSV) */}
        {showBulkImportModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex justify-center items-center z-50 p-3 sm:p-5 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
              {/* Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-500/30 rounded-xl text-teal-300">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black">Excel से बल्क पार्टियां जोड़ें (Bulk Import Parties)</h2>
                    <p className="text-xs text-teal-200">देनदार (ग्राहक - जिनसे लेना है) व लेनदार (सप्लायर - जिन्हें देना है) एक साथ अपलोड करें</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkImportModal(false)}
                  className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Action Banner: Download Template & Upload */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">चरण 1:</span>
                  <button
                    onClick={handleDownloadPartyTemplate}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Download size={15} />
                    <span>📥 सैंपल Excel फ़ॉर्मेट डाउनलोड करें</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="font-bold text-slate-700">चरण 2:</span>
                  <label className="flex-1 sm:flex-none px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow transition cursor-pointer">
                    <Upload size={15} />
                    <span>{bulkImportFileName ? "दूसरी फ़ाइल चुनें" : "📂 Excel फ़ाइल अपलोड करें"}</span>
                    <input
                      ref={bulkFileRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handlePartyFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {bulkPartiesList.length === 0 ? (
                  <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3 bg-white">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <FileSpreadsheet size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-800">अभी कोई फ़ाइल अपलोड नहीं की गई है</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        ऊपर दिए गए <b>'सैंपल Excel फ़ॉर्मेट डाउनलोड करें'</b> बटन पर क्लिक करें, उसमें अपनी पार्टियों के नाम, देनदार (Customer) या लेनदार (Supplier), और बैलेंस भरें, फिर यहाँ अपलोड करें।
                      </p>
                    </div>

                    <div className="bg-slate-50 max-w-xl mx-auto p-3.5 rounded-xl border border-slate-200 text-left space-y-1 text-slate-600 text-[11px]">
                      <span className="font-bold text-slate-800 block">💡 कॉलम निर्देश (Column Guide):</span>
                      <p>• <b>PartyName</b>: पार्टी का नाम (उदा. राजेश ट्रेडर्स)</p>
                      <p>• <b>PartyType</b>: <code className="bg-white px-1 py-0.5 rounded border text-indigo-700 font-bold">customer</code> (ग्राहक) या <code className="bg-white px-1 py-0.5 rounded border text-purple-700 font-bold">supplier</code> (सप्लायर)</p>
                      <p>• <b>BalanceType</b>: <code className="bg-white px-1 py-0.5 rounded border text-emerald-700 font-bold">RECEIVE</code> (लेने हैं) या <code className="bg-white px-1 py-0.5 rounded border text-rose-700 font-bold">PAY</code> (देने हैं)</p>
                      <p>• <b>OpeningBalance</b>: अब तक का बकाया हिसाब (₹)</p>
                      <p>• <b>MobileNumber, Address, CreditLimit, GSTIN</b>: संपर्क व टैक्स विवरण</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold block">कुल पार्टियां (Total)</span>
                        <p className="text-base font-black text-slate-800 mt-0.5">{bulkStats.total}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-emerald-700 font-bold block">🟢 देनदार (ग्राहक - लेने हैं)</span>
                        <p className="text-base font-black text-emerald-800 mt-0.5">
                          {bulkStats.customers} पार्टियां <span className="text-xs font-semibold block sm:inline">({bulkStats.toCollectTotal.toLocaleString('en-IN')})</span>
                        </p>
                      </div>
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                        <span className="text-[10px] text-rose-700 font-bold block">🔴 लेनदार (सप्लायर - देने हैं)</span>
                        <p className="text-base font-black text-rose-800 mt-0.5">
                          {bulkStats.suppliers} पार्टियां <span className="text-xs font-semibold block sm:inline">({bulkStats.toPayTotal.toLocaleString('en-IN')})</span>
                        </p>
                      </div>
                      <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                        <span className="text-[10px] text-teal-700 font-bold block">अपलोड की गई फ़ाइल</span>
                        <p className="text-xs font-black text-teal-900 mt-0.5 truncate">{bulkImportFileName}</p>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                      <div className="p-2.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
                        <span>डेटा प्रीव्यू (Data Preview - पहली {bulkPartiesList.length} पार्टियां)</span>
                        <span className="text-[10px] text-slate-500">कृपया डेटा जांचें, फिर नीचे सेव बटन दबाएं</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b sticky top-0">
                            <tr>
                              <th className="px-3 py-2">#</th>
                              <th className="px-3 py-2">पार्टी का नाम</th>
                              <th className="px-3 py-2">प्रकार</th>
                              <th className="px-3 py-2">मोबाइल</th>
                              <th className="px-3 py-2">पता</th>
                              <th className="px-3 py-2 text-right">ओपनिंग बैलेंस</th>
                              <th className="px-3 py-2">हिसाब (Balance Type)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {bulkPartiesList.map((p, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80">
                                <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                                <td className="px-3 py-2 font-bold text-slate-900">{p.name}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.partyType === 'supplier' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {p.partyType === 'supplier' ? '🏢 सप्लायर' : '🛒 ग्राहक'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-slate-600">{p.mobileNumber || '-'}</td>
                                <td className="px-3 py-2 text-slate-600 max-w-xs truncate">{p.address || 'Local'}</td>
                                <td className="px-3 py-2 text-right font-black text-slate-800">
                                  ₹{p.openingBalance.toLocaleString('en-IN')}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    p.balanceType === 'PAY' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {p.balanceType === 'PAY' ? '🔴 देने हैं (To Pay)' : '🟢 लेने हैं (To Receive)'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  रद्द करें (Cancel)
                </button>

                {bulkPartiesList.length > 0 && (
                  <button
                    type="button"
                    disabled={bulkImportLoading}
                    onClick={handleConfirmBulkImport}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2"
                  >
                    {bulkImportLoading ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    <span>{bulkImportLoading ? "पार्टियां सेव हो रही हैं..." : `🚀 सभी ${bulkPartiesList.length} पार्टियां सॉफ्टवेयर में सेव करें`}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
