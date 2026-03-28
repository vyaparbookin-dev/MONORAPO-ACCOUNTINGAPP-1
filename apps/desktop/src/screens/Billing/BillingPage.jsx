import React, { useState, useEffect } from "react";
import {
  Plus,
  Filter,
  Search,
  Download,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  User,
  Camera,
  Scan,
  RotateCcw,
  Gift,
  Clock,
  X,
  PauseCircle
} from "lucide-react";
import { syncQueue } from "@repo/shared";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import BarcodeScanner from "../../components/BarcodeScanner";
import ScheemApplyModel from "./ScheemApplyModel";
import WhatsappSender from "../../components/WhatsappSender";
import UdharReminder from "../../components/UdharReminder";
import { dbService } from "../../services/dbService";
import { auditService } from "../../services/auditService";

export default function BillingPage() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    billNumber: "",
    partyId: "",
    salesmanId: "",
    customerName: "",
    customerMobile: "",
    customerAddress: "",
    customerGst: "",
    items: [],
    total: 0,
    tax: 0,
    status: "draft",
    discount: 0, // Added discount field
    freightCharges: 0, // Added freight charges
    laborCharges: 0, // Added labor charges
    priceLevel: "retail", // Multi-Price List Feature
    dueDate: "",
    siteName: "", // New field for sitewise reporting
    termsAndConditions: "", // NEW
  });
  const [newItem, setNewItem] = useState({
    productId: "",
    name: "",
    category: "",
    quantity: 1,
    rate: 0,
    unit: "pcs",
    hsnCode: "",
    serialNumber: "",
    warranty: "",
    batchNumber: "",
    mfgDate: "",
    expiryDate: "",
  });
  const [unitsList, setUnitsList] = useState(["pcs", "kg", "ltr", "ft", "mtr", "dozen", "box", "bag", "nag", "cartoon", "set", "pair"]);
  const [dayFilter, setDayFilter] = useState("all");
  const [showScanner, setShowScanner] = useState(false);
  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [selectedPartyBalance, setSelectedPartyBalance] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryBill, setSelectedHistoryBill] = useState(null);
  
  // Advanced Barcode/Smart Unfound States
  const [inventory, setInventory] = useState([]);
  const [unfoundBarcode, setUnfoundBarcode] = useState(null);
  const [showUnfoundModal, setShowUnfoundModal] = useState(false);
  const [unfoundAction, setUnfoundAction] = useState('link'); // 'link' or 'create'
  const [unfoundSearchQuery, setUnfoundSearchQuery] = useState('');
  const [unfoundFilteredInventory, setUnfoundFilteredInventory] = useState([]);
  const [unfoundSelectedProduct, setUnfoundSelectedProduct] = useState(null);
  const [newProdData, setNewProdData] = useState({ name: '', rate: '', unit: 'pcs' });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  
  // NEW: Save to Inventory & Tatkal Create States
  const [saveToInventory, setSaveToInventory] = useState(false);
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [quickProduct, setQuickProduct] = useState({ name: '', itemId: '', barcode: '', hsnCode: '', gstRate: '', mrp: '', mrpDiscount: '', purchaseRate: '', purchaseDiscount: '', retailPrice: '', wholesalePrice: '', specialPrice: '', currentStock: '', unit: 'pcs', category: '', expiryDate: '', warrantyMonths: '', size: '', color: '', weight: '', purity: '', brand: '' });
  
  // NEW: Hold Bill & Customer Last Rate States
  const [heldBills, setHeldBills] = useState([]);
  const [showHeldBillsModal, setShowHeldBillsModal] = useState(false);
  const [lastRateMsg, setLastRateMsg] = useState("");
  const [staff, setStaff] = useState([]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);


  useEffect(() => {
    // Check if company is selected, otherwise redirect
    const companyId = dbService.getCompanyId();
    if (!companyId) {
      navigate("/company/list");
      return;
    }
    loadBills(1);
    loadParties();
    loadUnits();
    loadInventory();
    loadStaff();
  }, []);

  useEffect(() => {
    filterBills();
  }, [bills, searchTerm, statusFilter, dayFilter]);

  // NEW: Customer Last Rate Checker
  useEffect(() => {
    if (formData.partyId && newItem.name) {
      let found = false;
      for (const b of bills) {
        if (b.partyId === formData.partyId) {
          const item = b.items?.find(i => i.name.toLowerCase() === newItem.name.toLowerCase());
          if (item) {
            setLastRateMsg(`Last sold at ₹${item.rate ?? item.price} on ${new Date(b.date || b.createdAt).toLocaleDateString()}`);
            found = true;
            break;
          }
        }
      }
      if (!found) setLastRateMsg("");
    } else {
      setLastRateMsg("");
    }
  }, [newItem.name, formData.partyId, bills]);

  const loadParties = async () => {
    try {
      let partyList = [];
      
      // 1. Offline First: Local Desktop DB se customers lo
      partyList = await dbService.getCustomers();

      // 2. Sync-Down: Agar local DB khali hai, toh cloud se laao
      if (!partyList || partyList.length === 0) {
        if (navigator.onLine) {
          try {
            const response = await api.get('/api/party');
            const cloudParties = response.parties || response.data?.parties || response;
            const safeParties = Array.isArray(cloudParties) ? cloudParties : [];

            if (safeParties.length > 0) {
              for (const p of safeParties) {
                await dbService.addCustomer({ name: p.name, gstin: p.gstin || p.gstNumber || '', phone: p.phone || p.mobileNumber || '', address: p.address || '' });
              }
              partyList = await dbService.getCustomers();
            } else {
              partyList = safeParties;
            }
          } catch (apiErr) {
            console.warn("Offline: Could not fetch parties from API");
          }
        }
      }
      // Map SQLite id/uuid to _id for consistency
      setParties(partyList.map(p => ({...p, _id: p._id || p.uuid})));
    } catch (err) {
      console.error("Error loading parties:", err);
    }
  };

  const loadStaff = async () => {
    try {
      let localStaff = await dbService.getStaff?.() || [];
      if (!localStaff || localStaff.length === 0) {
        if (navigator.onLine) {
          try {
            const res = await api.get('/api/staff');
            localStaff = res.data?.staff || res.data || [];
          } catch (e) {
            console.warn("Offline: Could not fetch staff");
          }
        }
      }
      setStaff(Array.isArray(localStaff) ? localStaff : []);
    } catch (err) {
      console.error("Error loading staff:", err);
    }
  };

  const loadUnits = async () => {
    try {
      if (navigator.onLine) {
        const response = await api.get("/api/unit");
        const dbUnits = response.units || response.data?.units || [];
        if (dbUnits.length > 0) {
          const unitNames = dbUnits.map(u => u.name.toLowerCase());
          setUnitsList(prev => Array.from(new Set([...prev, ...unitNames])));
        }
      }
    } catch (err) {
      console.warn("Offline: Could not load units from API.");
    }
  };

  const loadInventory = async () => {
    try {
      let invList = await dbService.getInventory();
      if (!invList || invList.length === 0) {
        if (navigator.onLine) {
          try {
            const response = await api.get("/api/inventory");
            invList = response.data?.products || response.data || [];
          } catch (apiErr) {
            console.warn("Offline: Could not load inventory from API.");
          }
        }
      }
      setInventory(Array.isArray(invList) ? invList : []);
    } catch (err) {
      console.error("Error loading inventory:", err);
    }
  };

  const loadBills = async (pageNumber = 1) => {
    try {
      if (pageNumber === 1) setLoading(true);
      else setLoadingMore(true);

      let fetchedBills = [];

      // STRICT OFFLINE FIRST: Only read from SQLite via dbService
      const localBills = await dbService.getInvoices();
      fetchedBills = localBills.map(b => ({
        _id: b.uuid || b.id || b._id,
        billNumber: b.invoice_number || b.billNumber,
        partyId: b.customer_uuid === 'walk-in' ? '' : b.customer_uuid,
        customerName: b.customer_uuid === 'walk-in' ? 'Cash' : (b.customerName || 'Customer'), 
        total: b.total_amount || b.total || b.finalAmount || 0,
        tax: b.tax_amount || b.tax || 0,
        status: b.status || 'draft',
        date: b.date || b.createdAt,
        items: b.items || []
      }));

      // Sort by newest first
      fetchedBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).reverse();

      setHasMore(false); // All data is loaded from SQLite locally instantly

      if (pageNumber === 1) {
        setBills(Array.isArray(fetchedBills) ? fetchedBills : []);
      } else {
        setBills(prev => [...prev, ...(Array.isArray(fetchedBills) ? fetchedBills : [])]);
      }
      setPage(pageNumber);
    } catch (err) {
      console.error("Error loading bills:", err);
      if (pageNumber === 1) setBills([]); // क्रैश से बचाने के लिए खाली एरे सेट करें
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const filterBills = () => {
    let filtered = [...bills];

    if (searchTerm) {
      filtered = filtered.filter(
        (bill) =>
          bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bill.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((bill) => bill.status === statusFilter);
    }
    if (dayFilter === "today") {
      const today = new Date();
      filtered = filtered.filter((bill) => {
        const d = new Date(bill.date || bill.createdAt || bill.createdAt);
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        );
      });
    }

    setFilteredBills(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend Validation: Agar customer select nahi kiya aur naam bhi nahi dala, toh 'Cash' set kar do
    let finalCustomerName = formData.customerName?.trim();
    if (!formData.partyId && !finalCustomerName) {
      finalCustomerName = "Cash";
    }

    if (formData.items.length === 0) {
      alert("Validation Error: Please add at least one item to the bill.");
      return;
    }

    // --- CREDIT LIMIT & BLOCKING CHECK ---
    if (formData.status === "issued" && formData.partyId) {
      const party = parties.find(p => p._id === formData.partyId);
      if (party && party.creditLimit && party.creditLimit > 0) {
        const currentBal = selectedPartyBalance || 0;
        const newBillAmount = formData.total + (parseFloat(formData.tax) || 0) - (parseFloat(formData.discount) || 0) + (parseFloat(formData.freightCharges) || 0) + (parseFloat(formData.laborCharges) || 0);
        if (currentBal + newBillAmount > party.creditLimit) {
          alert(`⚠️ CREDIT LIMIT EXCEEDED!\n\nCustomer's credit limit is ₹${party.creditLimit}.\nCurrent Udhar + This Bill = ₹${currentBal + newBillAmount}.\n\nPlease collect cash or ask owner for approval.`);
          return; // Block bill creation
        }
      }
    }
    
    try {
      // Prepare items correctly for BOTH Create and Update
      const payload = { 
        ...formData, 
        customerName: finalCustomerName,
        finalAmount: formData.total + (parseFloat(formData.tax) || 0) - (parseFloat(formData.discount) || 0) + (parseFloat(formData.freightCharges) || 0) + (parseFloat(formData.laborCharges) || 0)
      };
      payload.items = payload.items.map((it) => ({
        productId: it.productId || "",
        name: it.name,
        category: it.category || "",
        quantity: it.quantity,
        rate: it.rate ?? it.price ?? 0,
        unit: it.unit || "pcs",
        hsnCode: it.hsnCode || "",
        serialNumber: it.serialNumber || "",
        warranty: it.warranty || "",
        batchNumber: it.batchNumber || "",
        mfgDate: it.mfgDate || "",
        expiryDate: it.expiryDate || "",
        total: it.total ?? (it.quantity * (it.rate ?? it.price ?? 0)),
      }));

      const localInvoiceData = {
        invoice: {
          invoice_number: payload.billNumber,
          customer_uuid: payload.partyId || "walk-in",
          date: payload.dueDate || new Date().toISOString(),
          total_amount: payload.finalAmount,
          tax_amount: payload.tax,
          status: payload.status
        },
        items: payload.items.map(i => ({
        item_name: i.name || i.item_name || "Unknown Item",
          hsn_code: i.hsnCode || "",
          serial_number: i.serialNumber || "",
          warranty: i.warranty || "",
          batch_number: i.batchNumber || "",
          mfg_date: i.mfgDate || "",
          expiry_date: i.expiryDate || "",
          quantity: i.quantity,
          price: i.rate,
          tax_rate: 0,
          total: i.total
        }))
      };

      if (editingId) {
        // --- UPDATE LOGIC ---
        const oldBill = bills.find(x => x._id === editingId);

        // 1. SQLite Update
        await dbService.updateInvoice(editingId, localInvoiceData);

        // 2. Audit Log
        await auditService.logAction('UPDATE', 'invoice', oldBill, payload);

        // 3. Sync Queue Deduplication
        await syncQueue.enqueue({ entityId: editingId, entity: 'invoice', method: "PUT", url: `/api/billing/${editingId}`, data: payload });
        
        alert("Bill updated successfully!");
      } else {
        // --- CREATE LOGIC ---
        const newId = crypto.randomUUID ? crypto.randomUUID() : `INV-UUID-${Date.now()}`;
        const finalPayload = { ...payload, _id: newId, uuid: newId };
        localInvoiceData.invoice.uuid = newId;

        // 1. SQLite Save
        await dbService.saveInvoice(localInvoiceData);

        // 2. Audit Log
        await auditService.logAction('CREATE', 'invoice', null, finalPayload);

        // 3. Sync Queue
        await syncQueue.enqueue({ entityId: newId, entity: 'invoice', method: "POST", url: "/api/billing", data: finalPayload });

        // --- LOCAL INVENTORY STOCK REDUCTION ---
        for (const item of payload.items) {
          if (item.productId) {
            const product = inventory.find(p => p._id === item.productId || p.uuid === item.productId);
            if (product && dbService.updateProduct) {
               const newStock = (parseFloat(product.currentStock) || 0) - item.quantity;
               await dbService.updateProduct(product._id || product.uuid, { ...product, currentStock: newStock });
            }
          }
        }

        // --- LOCAL CUSTOMER LEDGER (UDHAR) UPDATE ---
        if (payload.status === "issued" && payload.partyId) {
          const party = parties.find(p => p._id === payload.partyId);
          if (party && dbService.updateCustomer) {
            const updatedBal = (parseFloat(party.currentBalance ?? party.balance ?? 0)) + payload.finalAmount;
            await dbService.updateCustomer(party._id || party.uuid, { ...party, currentBalance: updatedBal, balance: updatedBal });
            
            // Create offline transaction record
            if (dbService.saveTransaction) {
              await dbService.saveTransaction({
                uuid: `TX-${Date.now()}`, partyId: party._id || party.uuid, type: 'bill', debit: payload.finalAmount, credit: 0, date: payload.dueDate || new Date().toISOString(), details: `Invoice #${payload.billNumber}`, status: 'completed'
              });
            }
          }
        }
        alert("Bill saved securely offline and queued for sync!");
      }
      loadBills(1);
      resetForm();
    } catch (err) {
      console.error("Error saving bill:", err);
      alert("Error: " + (err.response?.data?.message || err.response?.data?.error || "Failed to create invoice. Check required fields."));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this bill?")) {
      try {
        const oldBill = bills.find(x => x._id === id);

        await dbService.deleteInvoice(id);
        
        await auditService.logAction('DELETE', 'invoice', oldBill, null);
        
        await syncQueue.enqueue({ entityId: id, entity: 'invoice', method: 'DELETE', url: `/api/billing/${id}` });

        loadBills(1);
        alert("Bill deleted successfully!");
      } catch (err) {
        console.error("Error deleting bill:", err);
        alert("Failed to delete bill.");
      }
    }
  };

  const handleDownloadPDF = async (bill) => {
    try {
      // API request for PDF Blob
      const res = await api.get(`/api/billing/pdf/${bill._id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res], { type: 'application/pdf' }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${bill.billNumber || 'document'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to download PDF. Ensure the backend is running.");
    }
  };

  const handleViewHistory = (bill) => {
    setSelectedHistoryBill(bill);
    setShowHistoryModal(true);
  };

  const handleCreateInvoice = () => {
    setFormData({
      billNumber: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      partyId: "",
      salesmanId: "",
      customerName: "",
      customerMobile: "",
      customerAddress: "",
      customerGst: "",
      items: [],
      total: 0,
      tax: 0,
      discount: 0,
      freightCharges: 0,
      laborCharges: 0,
      status: "draft",
      priceLevel: "retail",
      dueDate: new Date().toISOString().split("T")[0],
      termsAndConditions: "1. Goods once sold will not be taken back.\n2. Warranty/Guarantee applicable as per company policy.",
    });
    setNewItem({ productId: "", name: "", category: "", quantity: 1, rate: 0, unit: "pcs", hsnCode: "", serialNumber: "", warranty: "", batchNumber: "", mfgDate: "", expiryDate: "" });
    setEditingId(null);
    setShowForm(true);
    setSelectedPartyBalance(null);
  };

  const resetForm = () => {
    setFormData({
      billNumber: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: "",
      customerMobile: "",
      customerGst: "",
      customerAddress: "",
      salesmanId: "",
      items: [],
      total: 0,
      tax: 0,
      discount: 0,
      freightCharges: 0,
      laborCharges: 0,
      status: "draft",
      priceLevel: "retail",
      dueDate: "",
      termsAndConditions: "",
    });
    setNewItem({ productId: "", name: "", category: "", quantity: 1, rate: 0, unit: "pcs", hsnCode: "", serialNumber: "", warranty: "", batchNumber: "", mfgDate: "", expiryDate: "" });
    setEditingId(null);
    setShowForm(false);
    setSelectedPartyBalance(null);
  };

  const handleAppendTc = (text) => {
    setFormData(prev => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions ? prev.termsAndConditions + "\n\n" + text : text
    }));
  };

  // NEW: Hold Bill Logic
  const handleHoldBill = () => {
    if (formData.items.length === 0) {
      alert("Cannot hold an empty bill.");
      return;
    }
    const holdName = prompt("Enter a reference name for this suspended bill (e.g. Customer Name):", formData.customerName || "Walk-in");
    if (holdName === null) return;
    
    setHeldBills(prev => [...prev, { ...formData, holdId: Date.now(), holdName, holdTime: new Date() }]);
    resetForm();
  };

  const handleRestoreHeldBill = (billToRestore) => {
    setFormData(billToRestore);
    setShowForm(true);
    setHeldBills(prev => prev.filter(b => b.holdId !== billToRestore.holdId));
    setShowHeldBillsModal(false);
  };

  const addItem = async () => {
    const qty = parseFloat(newItem.quantity) || 0;
    const rateVal = parseFloat(newItem.rate) || 0;
    if (!newItem.name.trim() || qty <= 0 || rateVal <= 0) {
      alert("Please fill all item fields with valid values");
      return;
    }

    // Auto-save unit if it's completely new (Tally-style feature)
    const currentUnit = (newItem.unit || "pcs").toLowerCase();
    if (!unitsList.includes(currentUnit)) {
      // Background me save kar denge, UI block nahi karenge
      api.post("/api/unit", { name: currentUnit, shortCode: currentUnit.substring(0, 3).toUpperCase() })
         .catch(err => console.error("Could not auto-save unit", err));
      setUnitsList(prev => [...prev, currentUnit]);
    }

    // NEW: Auto Save to Inventory Checkbox Logic
    if (saveToInventory) {
      try {
        const exists = inventory.find(p => p.name.toLowerCase() === newItem.name.toLowerCase());
        if (!exists) {
          const newId = crypto.randomUUID ? crypto.randomUUID() : `PROD-${Date.now()}`;
          const newProd = {
            _id: newId,
            uuid: newId,
            name: newItem.name,
            category: newItem.category || "General",
            sellingPrice: rateVal,
            unit: currentUnit,
            hsnCode: newItem.hsnCode || "",
            currentStock: 0
          };
          if (dbService.addProduct) await dbService.addProduct(newProd);
          await syncQueue.enqueue({ entityId: newId, entity: 'product', method: 'POST', url: '/api/inventory', data: newProd });
          setInventory(prev => [...prev, newProd]);
        }
      } catch (e) { console.error("Failed to auto-save to inventory", e); }
    }

    const itemTotal = qty * rateVal;
    const updatedItems = [
      ...formData.items,
      { ...newItem, quantity: qty, rate: rateVal, total: itemTotal, id: Date.now() + Math.random() },
    ];

    const newTotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);

    setFormData({
      ...formData,
      items: updatedItems,
      total: newTotal,
    });

    setNewItem({ productId: "", name: "", category: "", quantity: 1, rate: 0, unit: "pcs", hsnCode: "", serialNumber: "", warranty: "", batchNumber: "", mfgDate: "", expiryDate: "" });
  };

  const handleItemChange = (itemId, field, value) => {
    setFormData((prev) => {
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
             const qty = parseFloat(updatedItem.quantity) || 0;
               // Fallback: Agar edit mode me "rate" na hokar purana "price" ho, to calculate sahi se ho
               const rate = parseFloat(updatedItem.rate ?? updatedItem.price) || 0;
             updatedItem.total = qty * rate;
          }
          return updatedItem;
        }
        return item;
      });
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);
      return { ...prev, items: updatedItems, total: newTotal };
    });
  };

  const removeItem = (itemId) => {
    const updatedItems = formData.items.filter((item) => item.id !== itemId);
    const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);

    setFormData({
      ...formData,
      items: updatedItems,
      total: newTotal,
    });
  };

  const handleEdit = (bill) => {
    setEditingId(bill._id);
    
    // IMPORTANT: Map local DB items to frontend expected keys to prevent undefined errors when adding new items
    const mappedItems = (bill.items || []).map((it, idx) => ({
      id: it.id || it._id || `item-${Date.now()}-${idx}`,
      productId: it.productId || "",
      name: it.name || it.item_name || "",
      category: it.category || "",
      quantity: parseFloat(it.quantity) || 1,
      rate: parseFloat(it.rate ?? it.price ?? 0),
      unit: it.unit || "pcs",
      hsnCode: it.hsnCode || it.hsn_code || "",
      serialNumber: it.serialNumber || "",
      warranty: it.warranty || "",
      batchNumber: it.batchNumber || "",
      mfgDate: it.mfgDate || "",
      expiryDate: it.expiryDate || "",
      total: parseFloat(it.total) || (parseFloat(it.quantity) * parseFloat(it.rate ?? it.price ?? 0)),
      isFree: it.isFree || false
    }));

    setFormData({
      billNumber: bill.billNumber || "",
      partyId: bill.partyId || "",
      salesmanId: bill.salesmanId || "",
      customerName: bill.customerName || "",
      customerMobile: bill.customerMobile || "",
      customerAddress: bill.customerAddress || "",
      customerGst: bill.customerGst || "",
      items: mappedItems, 
      total: bill.total || 0,
      tax: bill.tax || 0,
      discount: bill.discount || 0,
      freightCharges: bill.freightCharges || 0,
      laborCharges: bill.laborCharges || 0,
      status: bill.status || "issued",
      priceLevel: bill.priceLevel || "retail",
      dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split("T")[0] : "",
      termsAndConditions: bill.termsAndConditions || "",
    });
    setShowForm(true);
  };

  const handlePartyChange = (e) => {
    const partyId = e.target.value;
    if (!partyId) {
      setFormData({ ...formData, partyId: "", customerName: "", customerMobile: "", customerAddress: "", customerGst: "" });
      setSelectedPartyBalance(null);
      return;
    }
    const party = parties.find((p) => p._id === partyId);
    if (party) {
      setFormData({
        ...formData,
        partyId: party._id,
        customerName: party.name,
        customerMobile: party.phone || "",
        customerAddress: party.address || "",
        customerGst: party.gstNumber || "",
        priceLevel: party.priceLevel || "retail", // AUTO-SELECT Customer's Fixed Rate (A/B/C)
      });
      // Assuming party object has 'currentBalance' or 'balance'
      // Positive value usually means Udhar (Debit), Negative means Advance (Credit) depending on your backend logic
      // Here assuming > 0 is Udhar (Receivable)
      setSelectedPartyBalance(party.currentBalance ?? party.balance ?? 0);
    }
  };

  const handleScanSuccess = async (decodedText) => {
    setShowScanner(false);
    try {
      const product = inventory.find((p) => 
        (p.sku && p.sku.toLowerCase() === decodedText.toLowerCase()) || 
        (p.barcode && p.barcode === decodedText) ||
        (p.name && p.name.toLowerCase() === decodedText.toLowerCase())
      );

      if (product) {
        const appliedRate = formData.priceLevel === 'wholesale' && product.wholesalePrice ? product.wholesalePrice : product.sellingPrice;
        setNewItem({
          productId: product._id || product.uuid,
          name: product.name,
          category: product.category || "",
          quantity: 1,
          rate: appliedRate || 0,
          unit: product.unit || "pcs",
          hsnCode: product.hsnCode || "",
          warranty: product.warrantyMonths ? `${product.warrantyMonths} Months` : "",
          serialNumber: "",
          batchNumber: "",
          mfgDate: "",
          expiryDate: product.expiryDate || "",
        });
        // Auto-focus on Quantity field so user can immediately type weight (e.g., 5 kg)
        setTimeout(() => document.getElementById('item-qty')?.focus(), 100);
      } else {
        // Barcode not found - Show Smart Modal
        setUnfoundBarcode(decodedText);
        setUnfoundAction('link');
        setUnfoundSearchQuery('');
        setUnfoundSelectedProduct(null);
        setNewProdData({ name: '', rate: '', unit: 'pcs' });
        setShowUnfoundModal(true);
      }
    } catch (err) {
      console.error("Error scanning product:", err);
    }
  };

  const handleLinkProduct = async () => {
    if (!unfoundSelectedProduct) return alert('Please select an existing product from the list.');
    setIsSavingProduct(true);
    try {
      await api.put(`/api/inventory/${unfoundSelectedProduct._id}`, { barcode: unfoundBarcode });
      
      // Update local inventory list
      setInventory(prev => prev.map(p => p._id === unfoundSelectedProduct._id ? { ...p, barcode: unfoundBarcode } : p));
      
      // Add to bill form
      const appliedRate = formData.priceLevel === 'wholesale' && unfoundSelectedProduct.wholesalePrice ? unfoundSelectedProduct.wholesalePrice : (unfoundSelectedProduct.sellingPrice || unfoundSelectedProduct.price);
      setNewItem({
        productId: unfoundSelectedProduct._id || unfoundSelectedProduct.uuid,
        name: unfoundSelectedProduct.name,
        category: unfoundSelectedProduct.category || "",
        quantity: 1,
        rate: appliedRate || 0,
        unit: unfoundSelectedProduct.unit || "pcs",
        hsnCode: unfoundSelectedProduct.hsnCode || "",
        warranty: unfoundSelectedProduct.warrantyMonths ? `${unfoundSelectedProduct.warrantyMonths} Months` : "",
        serialNumber: "",
        batchNumber: "",
        mfgDate: "",
        expiryDate: unfoundSelectedProduct.expiryDate || "",
      });
      setShowUnfoundModal(false);
      setTimeout(() => document.getElementById('item-qty')?.focus(), 100);
    } catch (err) {
      alert('Failed to link barcode to product: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProdData.name || !newProdData.rate) return alert('Product Name and Price are required.');
    setIsSavingProduct(true);
    try {
      const payload = {
        name: newProdData.name,
        sellingPrice: parseFloat(newProdData.rate),
        costPrice: 0,
        category: 'General',
        unit: newProdData.unit || 'pcs',
        barcode: unfoundBarcode,
        currentStock: 0
      };
      const res = await api.post('/api/inventory', payload);
      const createdProd = res.data?.product || res.data;
      
      setInventory(prev => [...prev, createdProd]);
      setNewItem({ productId: createdProd._id || createdProd.uuid, name: createdProd.name, category: createdProd.category || "", quantity: 1, rate: createdProd.sellingPrice || 0, unit: createdProd.unit || "pcs", hsnCode: createdProd.hsnCode || "", warranty: "", serialNumber: "", batchNumber: "", mfgDate: "", expiryDate: "" });
      setShowUnfoundModal(false);
      setTimeout(() => document.getElementById('item-qty')?.focus(), 100);
    } catch (err) {
      alert('Failed to create new product: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSavingProduct(false);
    }
  };

  // NEW: Handle Tatkal Quick Product Creation
  const handleQuickProductSave = async () => {
    if (!quickProduct.name || !quickProduct.sellingPrice) return alert("Product Name and Selling Price are required!");
    try {
      const newId = crypto.randomUUID ? crypto.randomUUID() : `PROD-${Date.now()}`;
      const newProd = {
        ...quickProduct,
        _id: newId,
        uuid: newId,
        sellingPrice: parseFloat(quickProduct.retailPrice || quickProduct.sellingPrice || 0),
        wholesalePrice: parseFloat(quickProduct.wholesalePrice || 0),
        specialPrice: parseFloat(quickProduct.specialPrice || 0),
        costPrice: parseFloat(quickProduct.costPrice || quickProduct.purchaseRate || 0),
        currentStock: parseFloat(quickProduct.currentStock || 0),
        mrp: parseFloat(quickProduct.mrp || 0),
        expiryDate: quickProduct.expiryDate || null,
        warrantyMonths: quickProduct.warrantyMonths || "",
        size: quickProduct.size || "",
        color: quickProduct.color || "",
        weight: quickProduct.weight || "",
        purity: quickProduct.purity || "",
        brand: quickProduct.brand || ""
      };
      if (dbService.addProduct) await dbService.addProduct(newProd);
      await syncQueue.enqueue({ entityId: newId, entity: 'product', method: 'POST', url: '/api/inventory', data: newProd });
      
      setInventory(prev => [...prev, newProd]);
      
      let appliedRate = newProd.sellingPrice;
      if (formData.priceLevel === 'wholesale' && newProd.wholesalePrice) appliedRate = newProd.wholesalePrice;
      if (formData.priceLevel === 'special' && newProd.specialPrice) appliedRate = newProd.specialPrice;

      // Auto-fill the billing form with this new product
      setNewItem({
        productId: newProd._id || newProd.uuid,
        name: newProd.name,
        category: newProd.category || "",
        quantity: 1,
        rate: appliedRate,
        unit: newProd.unit || "pcs",
        hsnCode: newProd.hsnCode || "",
        warranty: newProd.warrantyMonths ? `${newProd.warrantyMonths} Months` : "",
        serialNumber: "",
        batchNumber: "",
        mfgDate: "",
        expiryDate: newProd.expiryDate || "",
      });
      
      setShowQuickProductModal(false);
      setQuickProduct({ name: '', itemId: '', barcode: '', hsnCode: '', gstRate: '', mrp: '', mrpDiscount: '', purchaseRate: '', purchaseDiscount: '', retailPrice: '', wholesalePrice: '', specialPrice: '', currentStock: '', unit: 'pcs', category: '', expiryDate: '', warrantyMonths: '', size: '', color: '', weight: '', purity: '', brand: '' });
      setTimeout(() => document.getElementById('item-qty')?.focus(), 100);
    } catch (error) { alert("Failed to save product"); }
  };

  const handleHandheldScan = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = e.target.value.trim();
      if (!code) return;
      await handleScanSuccess(code);
      e.target.value = ""; // Clear input for next scan
    }
  };

  const handleSchemeApplied = (result) => {
    // If scheme gives a flat discount
    if (result.discount > 0) {
      setFormData(prev => ({
        ...prev,
        discount: (prev.discount || 0) + result.discount
      }));
      alert(`Scheme Applied: ₹${result.discount} discount added!`);
    }

    // If scheme gives free items
    if (result.freeItems && result.freeItems.length > 0) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, ...result.freeItems.map(i => ({ ...i, id: Date.now() + Math.random() }))]
      }));
      alert(`Scheme Applied: ${result.freeItems.length} free item(s) added!`);
    }
  };

  // Tally-like navigation handler
  const handleEnterNavigation = (e, nextId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextId === 'submit-item') {
        addItem();
        setTimeout(() => document.getElementById('item-name')?.focus(), 100);
      } else {
        document.getElementById(nextId)?.focus();
      }
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      loadBills(page + 1);
    }
  };

  const totalRevenue = filteredBills.reduce((sum, b) => {
    return sum + Number(b.finalAmount || b.total_amount || b.total || 0);
  }, 0);
  const totalPending = filteredBills.filter((b) => b.status !== "paid").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage and track all your invoices</p>
        </div>
        <div className="flex gap-2">
        {heldBills.length > 0 && (
          <button
            onClick={() => setShowHeldBillsModal(true)}
            className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition shadow-sm font-bold animate-pulse"
          >
            <PauseCircle size={20} />
            Restore Held ({heldBills.length})
          </button>
        )}
        <button
          onClick={() => navigate("/billing/parse")}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
        >
          <Camera size={20} />
          Scan Bill
        </button>
        <button
          onClick={() => navigate("/billing/return")}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
        >
          <RotateCcw size={20} />
          Sales Return
        </button>
        <button
          onClick={handleCreateInvoice}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Create Invoice
        </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          change="+2.3%"
          icon="📊"
        />
        <StatCard label="Total Invoices" value={filteredBills.length} icon="📄" />
        <StatCard label="Pending Payment" value={totalPending} icon="⏳" />
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by invoice number or customer..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="issued">Credit (Udhar)</option>
            <option value="paid">Cash</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="flex items-center">
            <button
              onClick={() => setDayFilter(dayFilter === 'today' ? 'all' : 'today')}
              className={`px-3 py-2 rounded-lg border ${dayFilter === 'today' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              {dayFilter === 'today' ? 'Showing: Today' : 'Show Today'}
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? "Edit Invoice" : "Create New Invoice"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Party (Optional)</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={handlePartyChange}
                  value={formData.partyId || ""}
                >
                  <option value="">-- Select Customer --</option>
                  {parties.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} {p.phone ? `(${p.phone})` : ''}</option>
                  ))}
                </select>
                {selectedPartyBalance !== null && (
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-sm font-semibold ${selectedPartyBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedPartyBalance > 0 ? `Pending Balance (Udhar): ₹${selectedPartyBalance}` : `Advance Balance: ₹${Math.abs(selectedPartyBalance)}`}
                    </p>
                    {selectedPartyBalance > 0 && (
                      <UdharReminder partyName={formData.customerName} mobileNumber={formData.customerMobile} pendingAmount={selectedPartyBalance} />
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  placeholder="Auto-generated"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.billNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, billNumber: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                placeholder="Customer Name (Defaults to 'Cash')"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
              />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  placeholder="Customer Mobile"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.customerMobile}
                  onChange={(e) =>
                    setFormData({ ...formData, customerMobile: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer GST (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 27AADCB2230M1Z2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  value={formData.customerGst}
                  onChange={(e) =>
                    setFormData({ ...formData, customerGst: e.target.value.toUpperCase() })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Construction Site A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.siteName}
                  onChange={(e) =>
                    setFormData({ ...formData, siteName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Level / Category</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-purple-700 bg-purple-50"
                  value={formData.priceLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, priceLevel: e.target.value })
                  }
                >
                  <option value="retail">Rate A (Retail)</option>
                  <option value="wholesale">Rate B (Wholesale)</option>
                  <option value="special">Rate C (Special)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salesman / Staff</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.salesmanId || ""}
                  onChange={(e) => setFormData({ ...formData, salesmanId: e.target.value })}
                >
                  <option value="">-- Select Salesman --</option>
                  {staff.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} {s.role ? `(${s.role})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="issued">Credit (Udhar)</option>
                  <option value="paid">Cash</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Add Items Section */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Product Details</h3>
                <button
                  type="button"
                  onClick={() => setShowScanner(!showScanner)}
                  className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition"
                >
                  <Scan size={18} />
                  {showScanner ? "Close Scanner" : "Scan Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSchemeModal(true)}
                  className="flex items-center gap-2 text-purple-600 hover:bg-purple-50 px-3 py-1 rounded-lg transition ml-2"
                >
                  <Gift size={18} /> Apply Scheme
                </button>
              </div>

              {showScanner && (
                <div className="mb-4">
                  <BarcodeScanner onScanSuccess={handleScanSuccess} onScanFailure={(err) => console.log(err)} />
                </div>
              )}

              <ScheemApplyModel 
                isOpen={showSchemeModal} 
                onClose={() => setShowSchemeModal(false)}
                cartItems={formData.items}
                onApply={handleSchemeApplied}
              />

              {/* Smart Unfound Barcode Modal */}
              {showUnfoundModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
                    <button type="button" onClick={() => setShowUnfoundModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                      <X size={24} />
                    </button>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Barcode Not Found!</h2>
                    <p className="text-gray-600 mb-4 text-sm">Scanned Code: <span className="font-mono bg-gray-100 border border-gray-200 px-2 py-1 rounded text-blue-600">{unfoundBarcode}</span></p>

                    <div className="flex border-b border-gray-200 mb-5">
                      <button
                        type="button"
                        className={`flex-1 py-2 font-medium text-sm transition ${unfoundAction === 'link' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setUnfoundAction('link')}
                      >
                        Link to Existing
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2 font-medium text-sm transition ${unfoundAction === 'create' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setUnfoundAction('create')}
                      >
                        Create New
                      </button>
                    </div>

                    {unfoundAction === 'link' ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Search your inventory (e.g. Parle G)..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={unfoundSearchQuery}
                          onChange={(e) => {
                            const val = e.target.value;
                            setUnfoundSearchQuery(val);
                            if (val.length > 0) setUnfoundFilteredInventory(inventory.filter(p => p.name.toLowerCase().includes(val.toLowerCase())));
                            else setUnfoundFilteredInventory([]);
                          }}
                        />
                        {unfoundFilteredInventory.length > 0 && (
                          <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-gray-50">
                            {unfoundFilteredInventory.map(item => (
                              <div key={item._id} onClick={() => { setUnfoundSelectedProduct(item); setUnfoundSearchQuery(item.name); setUnfoundFilteredInventory([]); }} className={`p-3 border-b border-gray-200 last:border-0 cursor-pointer hover:bg-blue-50 transition ${unfoundSelectedProduct?._id === item._id ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'}`}>
                                {item.name} <span className="text-xs text-gray-500 float-right">₹{item.sellingPrice || item.price}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <button type="button" onClick={handleLinkProduct} disabled={isSavingProduct || !unfoundSelectedProduct} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition">
                          {isSavingProduct ? "Linking..." : "Link Barcode & Add to Bill"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <input type="text" placeholder="Product Name" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newProdData.name} onChange={e => setNewProdData({...newProdData, name: e.target.value})} />
                        <input type="number" placeholder="Selling Price (₹)" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newProdData.rate} onChange={e => setNewProdData({...newProdData, rate: e.target.value})} />
                        <input type="text" placeholder="Unit (pcs, kg, ltr...)" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newProdData.unit} onChange={e => setNewProdData({...newProdData, unit: e.target.value})} />
                        <button type="button" onClick={handleCreateProduct} disabled={isSavingProduct || !newProdData.name || !newProdData.rate} className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition">
                          {isSavingProduct ? "Saving..." : "Save Product & Add to Bill"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Handheld Scanner Input */}
              <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <label className="text-xs font-bold text-blue-800 mb-1 block uppercase tracking-wide">⚡ Supermarket Quick Scan</label>
                <input
                  type="text"
                  placeholder="Click here & scan barcode with handheld scanner..."
                  className="w-full px-3 py-2 border border-blue-300 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={handleHandheldScan}
                />
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-600">Item Name</label>
                      <button type="button" onClick={() => setShowQuickProductModal(true)} className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"><Plus size={12}/> Adv. Tatkal</button>
                    </div>
                    <input
                      id="item-name"
                      list="inventory-options"
                      type="text"
                      placeholder="Product Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newItem.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matchedProd = inventory.find(p => p.name.toLowerCase() === val.toLowerCase());
                        if (matchedProd) {
                          const appliedRate = formData.priceLevel === 'wholesale' && matchedProd.wholesalePrice ? matchedProd.wholesalePrice : (matchedProd.sellingPrice || matchedProd.price || 0);
                          setNewItem({
                            ...newItem, name: matchedProd.name, productId: matchedProd._id || matchedProd.uuid, category: matchedProd.category || "",
                            rate: appliedRate, unit: matchedProd.unit || "pcs", hsnCode: matchedProd.hsnCode || "",
                            warranty: matchedProd.warrantyMonths ? `${matchedProd.warrantyMonths} Months` : "", expiryDate: matchedProd.expiryDate || "",
                          });
                          setTimeout(() => document.getElementById('item-qty')?.focus(), 100);
                        } else {
                          setNewItem({ ...newItem, name: val, productId: "" });
                        }
                      }}
                      onKeyDown={(e) => handleEnterNavigation(e, 'item-category')}
                    />
                    <datalist id="inventory-options">
                      {inventory.map(p => <option key={p._id || p.uuid} value={p.name} />)}
                    </datalist>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        placeholder="IMEI/Serial No"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-blue-700 placeholder-blue-300"
                        value={newItem.serialNumber || ''}
                        onChange={(e) => setNewItem({ ...newItem, serialNumber: e.target.value })}
                        onKeyDown={(e) => handleEnterNavigation(e, 'item-category')}
                      />
                      <input
                        type="text"
                        placeholder="Warranty"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-green-700 placeholder-green-300"
                        value={newItem.warranty || ''}
                        onChange={(e) => setNewItem({ ...newItem, warranty: e.target.value })}
                        onKeyDown={(e) => handleEnterNavigation(e, 'item-category')}
                      />
                    </div>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        placeholder="Batch No"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-purple-700 placeholder-purple-300"
                        value={newItem.batchNumber || ''}
                        onChange={(e) => setNewItem({ ...newItem, batchNumber: e.target.value })}
                        onKeyDown={(e) => handleEnterNavigation(e, 'item-category')}
                      />
                      <input
                        type="text"
                        placeholder="Mfg (MM/YY)"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-purple-700 placeholder-purple-300"
                        value={newItem.mfgDate || ''}
                        onChange={(e) => setNewItem({ ...newItem, mfgDate: e.target.value })}
                        onKeyDown={(e) => handleEnterNavigation(e, 'item-category')}
                      />
                      <input
                        type="text"
                        placeholder="Exp (MM/YY)"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-red-700 placeholder-red-300"
                        value={newItem.expiryDate || ''}
                        onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                        onKeyDown={(e) => handleEnterNavigation(e, 'item-category')}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
                    <input
                      id="item-category"
                      type="text"
                      placeholder="Category"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newItem.category}
                      onChange={(e) =>
                        setNewItem({ ...newItem, category: e.target.value })
                      }
                      onKeyDown={(e) => handleEnterNavigation(e, 'item-hsn')}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">HSN Code</label>
                    <input
                      id="item-hsn"
                      type="text"
                      placeholder="HSN"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newItem.hsnCode}
                      onChange={(e) => setNewItem({ ...newItem, hsnCode: e.target.value })}
                      onKeyDown={(e) => handleEnterNavigation(e, 'item-qty')}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Qty</label>
                    <input
                      id="item-qty"
                      type="number"
                      placeholder="Qty"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      onFocus={(e) => e.target.select()}
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          quantity: e.target.value,
                        })
                      }
                      onKeyDown={(e) => handleEnterNavigation(e, 'item-unit')}
                      min="0"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Unit</label>
                    <input
                      id="item-unit"
                      list="unit-options"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Unit"
                      onKeyDown={(e) => handleEnterNavigation(e, 'item-rate')}
                    />
                    <datalist id="unit-options">
                      {unitsList.map((u) => <option key={u} value={u} />)}
                    </datalist>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Rate (₹)</label>
                    <input
                      id="item-rate"
                      type="number"
                      placeholder="Price"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      onFocus={(e) => e.target.select()}
                      value={newItem.rate}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          rate: e.target.value,
                        })
                      }
                      onKeyDown={(e) => handleEnterNavigation(e, 'submit-item')}
                      min="0"
                    />
                    {lastRateMsg && <p className="text-[10px] text-green-700 mt-1 font-bold absolute whitespace-nowrap">{lastRateMsg}</p>}
                  </div>
                  <div className="md:col-span-1 flex flex-col justify-end">
                    <button
                      id="submit-item"
                      type="button"
                      onClick={addItem}
                      className="w-full px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium flex items-center justify-center shadow-sm"
                      title="Add Item"
                    >
                      <Plus size={20} />
                    </button>
                    <label className="flex items-center justify-center gap-1 mt-1 cursor-pointer text-gray-500 hover:text-gray-700" title="Save this item to inventory permanently">
                      <input type="checkbox" className="w-3 h-3 cursor-pointer" checked={saveToInventory} onChange={(e) => setSaveToInventory(e.target.checked)} />
                      <span className="text-[10px] font-medium leading-none">Save Inv.</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              {formData.items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Item Name</th>
                        <th className="px-4 py-2 text-left">Category</th>
                        <th className="px-4 py-2 text-center">Qty (Unit)</th>
                        <th className="px-4 py-2 text-center">Rate</th>
                        <th className="px-4 py-2 text-center">HSN</th>
                        <th className="px-4 py-2 text-center">Total</th>
                        <th className="px-4 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item) => (
                        <tr key={item.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                              className="w-full font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1"
                            />
                            <div className="flex gap-2 mt-1">
                              <input
                                type="text"
                                value={item.serialNumber || ''}
                                onChange={(e) => handleItemChange(item.id, 'serialNumber', e.target.value)}
                                className="w-full text-xs text-blue-600 bg-transparent border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-1"
                                placeholder="IMEI / Serial No"
                              />
                              <input
                                type="text"
                                value={item.warranty || ''}
                                onChange={(e) => handleItemChange(item.id, 'warranty', e.target.value)}
                                className="w-full text-xs text-green-600 bg-transparent border-b border-transparent hover:border-green-300 focus:border-green-500 focus:outline-none px-1"
                                placeholder="Warranty"
                              />
                            </div>
                            <div className="flex gap-2 mt-1">
                              <input
                                type="text"
                                value={item.batchNumber || ''}
                                onChange={(e) => handleItemChange(item.id, 'batchNumber', e.target.value)}
                                className="w-full text-xs text-purple-600 bg-transparent border-b border-transparent hover:border-purple-300 focus:border-purple-500 focus:outline-none px-1"
                                placeholder="Batch No"
                              />
                              <input
                                type="text"
                                value={item.mfgDate || ''}
                                onChange={(e) => handleItemChange(item.id, 'mfgDate', e.target.value)}
                                className="w-full text-xs text-purple-600 bg-transparent border-b border-transparent hover:border-purple-300 focus:border-purple-500 focus:outline-none px-1"
                                placeholder="Mfg Date"
                              />
                              <input
                                type="text"
                                value={item.expiryDate || ''}
                                onChange={(e) => handleItemChange(item.id, 'expiryDate', e.target.value)}
                                className="w-full text-xs text-red-600 bg-transparent border-b border-transparent hover:border-red-300 focus:border-red-500 focus:outline-none px-1"
                                placeholder="Exp Date"
                              />
                            </div>
                            {item.isFree && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">FREE</span>}
                          </td>
                          <td className="px-4 py-2 text-gray-600 text-sm">
                            <input
                              type="text"
                              value={item.category || ''}
                              onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1 text-sm"
                              placeholder="-"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                onFocus={(e) => e.target.select()}
                              />
                              <span className="text-sm text-gray-600">{item.unit || 'pcs'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-gray-500">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={item.rate ?? item.price ?? 0}
                                onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                                className="w-24 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                onFocus={(e) => e.target.select()}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                             <input
                              type="text"
                              value={item.hsnCode || ''}
                              onChange={(e) => handleItemChange(item.id, 'hsnCode', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-1 text-center text-sm"
                              placeholder="-"
                            />
                          </td>
                          <td className="px-4 py-2 text-center font-semibold">₹{(item.total ?? (item.quantity * (item.rate ?? item.price ?? 0))).toFixed(2)}</td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                              title="Remove Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Total Section */}
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col gap-3 mt-4 border border-gray-200">
              <div className="flex justify-end items-center gap-4">
                 <label className="text-sm font-medium text-gray-700">Subtotal:</label>
                 <span className="text-lg font-semibold w-32 text-right">₹{formData.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-end items-center gap-4">
                 <label className="text-sm font-medium text-gray-700">Tax / GST (₹):</label>
                 <input 
                   type="number" 
                   min="0"
                   className="w-32 px-3 py-1 border border-gray-300 rounded focus:ring-blue-500 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                   value={formData.tax || ""}
                   onChange={(e) => setFormData({...formData, tax: parseFloat(e.target.value) || 0})}
                   onFocus={(e) => e.target.select()}
                   placeholder="0"
                 />
              </div>
              <div className="flex justify-end items-center gap-4">
                 <label className="text-sm font-medium text-gray-700">Discount (₹):</label>
                 <input 
                   type="number" 
                   min="0"
                   className="w-32 px-3 py-1 border border-gray-300 rounded focus:ring-blue-500 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                   value={formData.discount || ""}
                   onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                   onFocus={(e) => e.target.select()}
                   placeholder="0"
                 />
              </div>
              <div className="flex justify-end items-center gap-4">
                 <label className="text-sm font-medium text-gray-700">Freight / Transport (₹):</label>
                 <input 
                   type="number" 
                   min="0"
                   className="w-32 px-3 py-1 border border-gray-300 rounded focus:ring-blue-500 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                   value={formData.freightCharges || ""}
                   onChange={(e) => setFormData({...formData, freightCharges: parseFloat(e.target.value) || 0})}
                   onFocus={(e) => e.target.select()}
                   placeholder="0"
                 />
              </div>
              <div className="flex justify-end items-center gap-4">
                 <label className="text-sm font-medium text-gray-700">Labor / Installation (₹):</label>
                 <input 
                   type="number" 
                   min="0"
                   className="w-32 px-3 py-1 border border-gray-300 rounded focus:ring-blue-500 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                   value={formData.laborCharges || ""}
                   onChange={(e) => setFormData({...formData, laborCharges: parseFloat(e.target.value) || 0})}
                   onFocus={(e) => e.target.select()}
                   placeholder="0"
                 />
              </div>
              <div className="flex justify-end items-center gap-4 border-t pt-3 mt-1">
                 <span className="text-lg font-bold">Grand Total:</span>
                 <span className="text-2xl font-bold text-blue-600 w-32 text-right">
                   ₹{(formData.total + (parseFloat(formData.tax) || 0) - (parseFloat(formData.discount) || 0) + (parseFloat(formData.freightCharges) || 0) + (parseFloat(formData.laborCharges) || 0)).toFixed(2)}
                 </span>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Terms &amp; Conditions (Auto-fetched from Settings)</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Global Terms & Conditions..."
                value={formData.termsAndConditions || ""}
                onChange={(e) => setFormData({...formData, termsAndConditions: e.target.value})}
              />
            </div>

            {/* Form Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <button
                type="submit"
                disabled={formData.items.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingId ? "Update" : "Create"} Invoice
              </button>
              <button
                type="button"
                onClick={handleHoldBill}
                className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium flex items-center gap-2"
              >
                <PauseCircle size={18} /> Hold Bill
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tatkal Quick Product Create Modal */}
      {showQuickProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button type="button" onClick={() => setShowQuickProductModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><Plus size={20} className="text-blue-600"/> Advanced Tatkal Item</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Item Name <span className="text-red-500">*</span></label>
                <input type="text" autoFocus className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={quickProduct.name} onChange={e => setQuickProduct({...quickProduct, name: e.target.value})} placeholder="e.g. Parle G 50g"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <input type="text" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={quickProduct.category} onChange={e => setQuickProduct({...quickProduct, category: e.target.value})} placeholder="General"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Barcode / SKU</label>
                <input type="text" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={quickProduct.barcode} onChange={e => setQuickProduct({...quickProduct, barcode: e.target.value})} placeholder="Scan or Type"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">HSN Code</label>
                <input type="text" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={quickProduct.hsnCode} onChange={e => setQuickProduct({...quickProduct, hsnCode: e.target.value})} placeholder="HSN"/>
              </div>
              
              {/* Selling Rates */}
              <div className="col-span-3 border-b pb-3 mb-2 mt-2"><h3 className="font-semibold text-gray-700">Rates & Stock</h3></div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rate A: Retail <span className="text-red-500">*</span></label>
                <input type="number" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50 font-bold" value={quickProduct.retailPrice || quickProduct.sellingPrice} onChange={e => setQuickProduct({...quickProduct, retailPrice: e.target.value, sellingPrice: e.target.value})} placeholder="0.00"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rate B: Wholesale</label>
                <input type="number" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-green-50" value={quickProduct.wholesalePrice} onChange={e => setQuickProduct({...quickProduct, wholesalePrice: e.target.value})} placeholder="0.00"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rate C: Special</label>
                <input type="number" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-purple-50" value={quickProduct.specialPrice} onChange={e => setQuickProduct({...quickProduct, specialPrice: e.target.value})} placeholder="0.00"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Opening Stock</label>
                <div className="flex gap-2">
                  <input type="number" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={quickProduct.currentStock} onChange={e => setQuickProduct({...quickProduct, currentStock: e.target.value})} placeholder="0"/>
                  <input type="text" className="w-20 px-2 py-2 border rounded outline-none" value={quickProduct.unit} onChange={e => setQuickProduct({...quickProduct, unit: e.target.value})} placeholder="pcs"/>
                </div>
              </div>
              
              {/* Additional Item Properties (Optional) */}
              <div className="col-span-3 border-b pb-3 mb-2 mt-2">
                <h3 className="font-semibold text-gray-700">Additional Properties (Optional)</h3>
              </div>
              
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Warranty (Months)</label><input type="number" className="w-full px-3 py-2 border rounded outline-none" value={quickProduct.warrantyMonths} onChange={e => setQuickProduct({...quickProduct, warrantyMonths: e.target.value})} placeholder="12"/></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date</label><input type="date" className="w-full px-3 py-2 border rounded outline-none" value={quickProduct.expiryDate} onChange={e => setQuickProduct({...quickProduct, expiryDate: e.target.value})} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Brand / Model</label><input type="text" className="w-full px-3 py-2 border rounded outline-none" value={quickProduct.brand} onChange={e => setQuickProduct({...quickProduct, brand: e.target.value})} placeholder="e.g. Samsung"/></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Size</label><input type="text" className="w-full px-3 py-2 border rounded outline-none" value={quickProduct.size} onChange={e => setQuickProduct({...quickProduct, size: e.target.value})} placeholder="S, M, L..."/></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Color</label><input type="text" className="w-full px-3 py-2 border rounded outline-none" value={quickProduct.color} onChange={e => setQuickProduct({...quickProduct, color: e.target.value})} placeholder="Red, Blue..."/></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Weight / Purity</label><input type="text" className="w-full px-3 py-2 border rounded outline-none" value={quickProduct.weight} onChange={e => setQuickProduct({...quickProduct, weight: e.target.value})} placeholder="e.g. 10g / 22K"/></div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button type="button" onClick={() => setShowQuickProductModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50 font-medium">Cancel</button>
              <button type="button" onClick={handleQuickProductSave} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow-sm">Save & Use in Bill</button>
            </div>
          </div>
        </div>
      )}

      {/* Held Bills Modal */}
      {showHeldBillsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
            <button type="button" onClick={() => setShowHeldBillsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><PauseCircle className="text-amber-500"/> Suspended / Held Bills</h2>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {heldBills.map((hb) => (
                <div key={hb.holdId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <h3 className="font-bold text-gray-800">{hb.holdName}</h3>
                    <p className="text-xs text-gray-500">{new Date(hb.holdTime).toLocaleTimeString()} • {hb.items.length} Items • ₹{hb.total}</p>
                  </div>
                  <button onClick={() => handleRestoreHeldBill(hb)} className="px-4 py-1.5 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700">
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Invoice
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <tr
                    key={bill._id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="text-blue-600" size={18} />
                        <span className="font-semibold text-gray-900">
                          {bill.billNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <User size={16} className="text-gray-400" />
                        <div>
                          <div className="font-medium">{bill.customerName}</div>
                          {bill.customerMobile && (
                            <div className="text-xs text-gray-500">{bill.customerMobile}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">
                        ₹{bill.total?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar size={16} className="text-gray-400" />
                        {bill.dueDate
                          ? new Date(bill.dueDate).toLocaleDateString("en-IN")
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={bill.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => navigate(`/billing/${bill._id}`)}
                          className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(bill)}
                          className="p-2 hover:bg-purple-100 rounded-lg text-purple-600 transition"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                        <WhatsappSender bill={bill} />
                        <button
                          onClick={() => handleEdit(bill)}
                          className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(bill._id)}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                        {bill.editHistory && bill.editHistory.length > 0 && (
                          <button
                            onClick={() => handleViewHistory(bill)}
                            className="p-2 hover:bg-orange-100 rounded-lg text-orange-600 transition"
                            title="View Edit History (Audit Trail)"
                          >
                            <Clock size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-100 p-4 rounded-full mb-3">
                        <FileText size={32} className="text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">No invoices found</p>
                      <p className="text-sm text-gray-500 mb-4">Create your first invoice to get started.</p>
                      <button onClick={handleCreateInvoice} className="text-blue-600 hover:text-blue-700 font-medium">
                        + Create New Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Load More Button at the bottom of the table */}
          {hasMore && filteredBills.length > 0 && (
            <div className="flex justify-center p-4 border-t border-gray-200">
              <button 
                onClick={handleLoadMore} 
                disabled={loadingMore}
                className="px-6 py-2 bg-gray-800 text-white rounded-full shadow hover:bg-gray-900 disabled:bg-gray-400 transition-all"
              >
                {loadingMore ? "Loading..." : "Load More Bills"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Audit Trail / History Modal */}
      {showHistoryModal && selectedHistoryBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">Audit Trail: {selectedHistoryBill.billNumber}</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-4">
              {selectedHistoryBill.editHistory.map((history, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                      <User size={16} className="text-blue-500" /> {history.editedByName || 'Staff'}
                    </p>
                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border shadow-sm">
                      {new Date(history.editedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{history.changesSummary || 'Updated bill details.'}</p>
                  <div className="flex gap-4 text-sm font-bold">
                    <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded border border-red-100">Old Total: ₹{history.previousTotal?.toFixed(2)}</div>
                    <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded border border-green-100">New Total: ₹{history.newTotal?.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t text-right">
              <button onClick={() => setShowHistoryModal(false)} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, change, icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {change && <p className="text-xs text-green-600 mt-2">{change}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const statuses = {
    paid: { bg: "bg-green-100", text: "text-green-800", label: "Cash" },
    issued: { bg: "bg-blue-100", text: "text-blue-800", label: "Credit (Udhar)" },
    draft: { bg: "bg-gray-100", text: "text-gray-800", label: "Draft" },
    cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
  };

  const style = statuses[status] || statuses.draft;

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}        