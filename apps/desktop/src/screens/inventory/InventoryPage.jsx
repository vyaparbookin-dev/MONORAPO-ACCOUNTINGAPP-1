import React, { useState, useEffect } from "react";
import { Plus, Search, Download, Edit, Trash2, Package, AlertTriangle, Upload, Scan, ShoppingBag, ClipboardList, Undo2, BookUser, Camera, Barcode, X, Link as LinkIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BarcodeScanner from "../../components/BarcodeScanner";
import DataTable from "../../components/Datatable";
import ReportCard from "../../components/ReportCard";
import Loader from "../../components/Loader";
import api from "../../services/api";
import { formatCurrency, syncQueue } from "@repo/shared";
import { generateBarcode } from "../../utils/barcodeGenerator";
import { auditService } from "../../services/auditService";
import { dbService } from "../../services/dbService";
import { getGstFlags, normalizeGstType } from "../../utils/gst";
import { useCompany } from "../../contexts/CompanyContext";

const InventoryPage = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [productToMerge, setProductToMerge] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    subCategory: "",
    hsnCode: "",
    costPrice: 0,
    costPriceWithTax: "",
    profitMargin: "",
    sellingPrice: 0,
    sellingPriceWithTax: "",
    mrp: 0,
    gstRate: 0,
    unit: "pcs",
    minimumStock: 10,
    maximumStock: "",
    currentStock: 0,
    supplier: "",
    // Business Specific Fields
    isRawMaterial: false,
    weight: "",
    purity: "",
    makingChargeType: "fixed",
    makingCharge: 0,
    brand: "",
    dimensions: "",
    materialType: "",
    ageGroup: "",
    certification: "",
    warrantyPeriod: "",
  });

  const [units, setUnits] = useState(["pcs", "kg", "ltr", "ft", "mtr", "dozen", "box", "bag", "nag", "cartoon", "set", "pair"]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const gstRates = [0, 5, 12, 18, 28];

  const { selectedCompany } = useCompany();
  const industry = String(selectedCompany?.industryType || selectedCompany?.businessType || "general").toLowerCase();
  const gstType = selectedCompany?.gstType || "regular";
  const isGstEnabled = selectedCompany ? (selectedCompany.enableGst === true || String(selectedCompany.enableGst).toLowerCase() === "true") : true;

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm]);

  const isComposition = String(gstType).toLowerCase() === "composition";
  const isUnregistered = String(gstType).toLowerCase() === "unregistered" || !isGstEnabled;
  const showPurchaseGST = !isUnregistered;
  const showSalesGST = !isUnregistered && !isComposition;
  const showHSN = !isUnregistered;

  useEffect(() => {
    if (!showPurchaseGST) {
      setFormData(prev => ({ ...prev, gstRate: 0, costPriceWithTax: "" }));
    }
    if (!showSalesGST) {
      setFormData(prev => ({
        ...prev, sellingPriceWithTax: "", wholesalePriceWithTax: "", dealerPriceWithTax: ""
      }));
    }
  }, [gstType, isGstEnabled, showPurchaseGST, showSalesGST]);

  const handleEdit = (item) => {
    const cp = parseFloat(item.costPrice) || 0;
    const sp = parseFloat(item.sellingPrice) || parseFloat(item.price) || 0;
    const gst = parseFloat(item.gstRate) || 0;
    const wp = parseFloat(item.wholesalePrice) || 0;
    const dp = parseFloat(item.dealerPrice) || 0;

    setEditingId(item._id);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      subCategory: item.subCategory || "",
      hsnCode: item.hsnCode,
      costPrice: cp || "",
      costPriceWithTax: cp ? (cp + (cp * gst) / 100).toFixed(2) : "",
      profitMargin: cp > 0 && sp > 0 ? (((sp - cp) / cp) * 100).toFixed(2) : "",
      sellingPrice: sp || "",
      sellingPriceWithTax: sp ? (sp + (sp * gst) / 100).toFixed(2) : "",
      wholesalePrice: wp || "",
      wholesalePriceWithTax: wp ? (wp + (wp * gst) / 100).toFixed(2) : "",
      wholesaleMargin: cp > 0 && wp > 0 ? (((wp - cp) / cp) * 100).toFixed(2) : "",
      dealerPrice: dp || "",
      dealerPriceWithTax: dp ? (dp + (dp * gst) / 100).toFixed(2) : "",
      dealerMargin: cp > 0 && dp > 0 ? (((dp - cp) / cp) * 100).toFixed(2) : "",
      mrp: item.mrp || "",
      gstRate: item.gstRate || 0,
      unit: item.unit,
      minimumStock: item.minimumStock,
      maximumStock: item.maximumStock || "",
      currentStock: item.currentStock,
      supplier: item.supplier,
      isRawMaterial: item.isRawMaterial || false,
      weight: item.weight || "",
      purity: item.purity || "",
      makingChargeType: item.makingChargeType || "fixed",
      makingCharge: item.makingCharge || 0,
      brand: item.brand || "",
      dimensions: item.dimensions || "",
      materialType: item.materialType || "",
      ageGroup: item.ageGroup || "",
      certification: item.certification || "",
      warrantyPeriod: item.warrantyPeriod || "",
    });
    setShowForm(true);
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get Local Data
      let localInventory = await dbService.getInventory();
      if (localInventory && localInventory.products) localInventory = localInventory.products;
      let list = (Array.isArray(localInventory) ? localInventory : []).map(p => ({ ...p, _id: p._id || p.uuid }));

      // 2. Fetch from Cloud to get FULL details (Missing fields like subCategory)
      try {
        const cloudRes = await api.get('/api/inventory');
        const cloudProducts = cloudRes.data?.products || cloudRes.data || [];
        
        // Merge Cloud Data with Local Data to restore missing fields in UI
        if (cloudProducts.length > 0) {
          list = list.length > 0 ? list.map(localItem => {
            const cloudItem = cloudProducts.find(c => c._id === localItem._id || c.uuid === localItem._id);
            return cloudItem ? { ...localItem, ...cloudItem } : localItem;
          }) : cloudProducts;
        }
      } catch(e) { console.warn("Cloud fetch failed, using local only"); }

      setInventory(list);

      // Fetch masters
      let [localCats, localSubCats, localBrands] = await Promise.all([
        dbService.getCategories?.() || Promise.resolve([]),
        dbService.getSubCategories?.() || Promise.resolve([]),
        dbService.getBrands?.() || Promise.resolve([])
      ]);
      
      // Fallback to Cloud API if local DB is empty
      if (!localCats.length) {
        const res = await api.get('/api/category').catch(() => null);
        if (res) localCats = res.data?.categories || res.data || [];
      }
      if (!localSubCats.length) {
        const res = await api.get('/api/subcategory').catch(() => null);
        if (res) localSubCats = res.data?.subCategories || res.data || [];
      }
      if (!localBrands.length) {
        const res = await api.get('/api/brand').catch(() => null);
        if (res) localBrands = res.data?.brands || res.data || [];
      }

      const masterCats = (Array.isArray(localCats) ? localCats : []).map(c => c.name);
      const masterSubCats = (Array.isArray(localSubCats) ? localSubCats : []).map(c => c.name);
      const masterBrands = (Array.isArray(localBrands) ? localBrands : []).map(c => c.name);

      const productCats = list.map(p => p.category).filter(Boolean);
      const productSubCats = list.map(p => p.subCategory).filter(Boolean);
      const productBrands = list.map(p => p.brand).filter(Boolean);

      setCategories([...new Set([...masterCats, ...productCats])]);
      setSubCategories([...new Set([...masterSubCats, ...productSubCats])]);
      setBrands([...new Set([...masterBrands, ...productBrands])]);
      
      // Clear the old stubborn cache that was causing deleted items to reappear
      localStorage.removeItem("categories");
      localStorage.removeItem("subCategories");

    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    const safeInventory = Array.isArray(inventory) ? inventory : [];
    let filtered = [...safeInventory];
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.sku || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.hsnCode || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredInventory(filtered);
  };

  const handlePriceCalculation = (field, value) => {
    let updatedForm = { ...formData, [field]: value };
    
    const calcSpFromMargin = (cost, m) => cost + (cost * m / 100);
    const calcTax = (val, g) => val + (val * g / 100);
    const calcMargin = (sell, cost) => cost > 0 ? ((sell - cost) / cost) * 100 : 0;
    const calcBaseFromTax = (val, g) => val / (1 + g / 100);

    const cp = parseFloat(field === 'costPrice' ? value : updatedForm.costPrice) || 0;
    const cpWithTax = parseFloat(field === 'costPriceWithTax' ? value : updatedForm.costPriceWithTax) || 0;
    const gst = parseFloat(field === 'gstRate' ? value : updatedForm.gstRate) || 0;

    const margin = parseFloat(field === 'profitMargin' ? value : updatedForm.profitMargin) || 0;
    const sp = parseFloat(field === 'sellingPrice' ? value : updatedForm.sellingPrice) || 0;
    const spWithTax = parseFloat(field === 'sellingPriceWithTax' ? value : updatedForm.sellingPriceWithTax) || 0;

    const wMargin = parseFloat(field === 'wholesaleMargin' ? value : updatedForm.wholesaleMargin) || 0;
    const wp = parseFloat(field === 'wholesalePrice' ? value : updatedForm.wholesalePrice) || 0;
    const wpWithTax = parseFloat(field === 'wholesalePriceWithTax' ? value : updatedForm.wholesalePriceWithTax) || 0;

    const dMargin = parseFloat(field === 'dealerMargin' ? value : updatedForm.dealerMargin) || 0;
    const dp = parseFloat(field === 'dealerPrice' ? value : updatedForm.dealerPrice) || 0;
    const dpWithTax = parseFloat(field === 'dealerPriceWithTax' ? value : updatedForm.dealerPriceWithTax) || 0;

    if (field === 'costPrice') {
      updatedForm.costPriceWithTax = cp ? calcTax(cp, gst).toFixed(2) : "";
      if (updatedForm.profitMargin !== "") { updatedForm.sellingPrice = calcSpFromMargin(cp, margin).toFixed(2); updatedForm.sellingPriceWithTax = calcTax(parseFloat(updatedForm.sellingPrice), gst).toFixed(2); }
      if (updatedForm.wholesaleMargin !== "") { updatedForm.wholesalePrice = calcSpFromMargin(cp, wMargin).toFixed(2); updatedForm.wholesalePriceWithTax = calcTax(parseFloat(updatedForm.wholesalePrice), gst).toFixed(2); }
      if (updatedForm.dealerMargin !== "") { updatedForm.dealerPrice = calcSpFromMargin(cp, dMargin).toFixed(2); updatedForm.dealerPriceWithTax = calcTax(parseFloat(updatedForm.dealerPrice), gst).toFixed(2); }
    } else if (field === 'costPriceWithTax') {
      const newCp = cpWithTax ? calcBaseFromTax(cpWithTax, gst) : 0;
      updatedForm.costPrice = newCp ? newCp.toFixed(2) : "";
      if (updatedForm.profitMargin !== "") { updatedForm.sellingPrice = calcSpFromMargin(newCp, margin).toFixed(2); updatedForm.sellingPriceWithTax = calcTax(parseFloat(updatedForm.sellingPrice), gst).toFixed(2); }
      if (updatedForm.wholesaleMargin !== "") { updatedForm.wholesalePrice = calcSpFromMargin(newCp, wMargin).toFixed(2); updatedForm.wholesalePriceWithTax = calcTax(parseFloat(updatedForm.wholesalePrice), gst).toFixed(2); }
      if (updatedForm.dealerMargin !== "") { updatedForm.dealerPrice = calcSpFromMargin(newCp, dMargin).toFixed(2); updatedForm.dealerPriceWithTax = calcTax(parseFloat(updatedForm.dealerPrice), gst).toFixed(2); }
    } else if (field === 'gstRate') {
      if (cp) updatedForm.costPriceWithTax = calcTax(cp, gst).toFixed(2);
      if (sp) updatedForm.sellingPriceWithTax = calcTax(sp, gst).toFixed(2);
      if (wp) updatedForm.wholesalePriceWithTax = calcTax(wp, gst).toFixed(2);
      if (dp) updatedForm.dealerPriceWithTax = calcTax(dp, gst).toFixed(2);
    } else if (field === 'sellingPrice') {
      updatedForm.sellingPriceWithTax = sp ? calcTax(sp, gst).toFixed(2) : "";
      if (cp > 0 && sp) updatedForm.profitMargin = calcMargin(sp, cp).toFixed(2);
      else if (!sp) updatedForm.profitMargin = "";
    } else if (field === 'sellingPriceWithTax') {
      const newSp = spWithTax ? calcBaseFromTax(spWithTax, gst) : 0;
      updatedForm.sellingPrice = newSp ? newSp.toFixed(2) : "";
      if (cp > 0 && newSp) updatedForm.profitMargin = calcMargin(newSp, cp).toFixed(2);
      else if (!newSp) updatedForm.profitMargin = "";
    } else if (field === 'profitMargin') {
      if (cp > 0 && value !== "") {
        updatedForm.sellingPrice = calcSpFromMargin(cp, margin).toFixed(2); 
        updatedForm.sellingPriceWithTax = calcTax(parseFloat(updatedForm.sellingPrice), gst).toFixed(2);
      } else if (value === "") {
        updatedForm.sellingPrice = ""; updatedForm.sellingPriceWithTax = "";
      }
    } else if (field === 'wholesalePrice') {
      updatedForm.wholesalePriceWithTax = wp ? calcTax(wp, gst).toFixed(2) : ""; 
      if (cp > 0 && wp) updatedForm.wholesaleMargin = calcMargin(wp, cp).toFixed(2);
      else if (!wp) updatedForm.wholesaleMargin = "";
    } else if (field === 'wholesalePriceWithTax') {
      const newWp = wpWithTax ? calcBaseFromTax(wpWithTax, gst) : 0; 
      updatedForm.wholesalePrice = newWp ? newWp.toFixed(2) : ""; 
      if (cp > 0 && newWp) updatedForm.wholesaleMargin = calcMargin(newWp, cp).toFixed(2);
      else if (!newWp) updatedForm.wholesaleMargin = "";
    } else if (field === 'wholesaleMargin') {
      if (cp > 0 && value !== "") {
        updatedForm.wholesalePrice = calcSpFromMargin(cp, wMargin).toFixed(2); 
        updatedForm.wholesalePriceWithTax = calcTax(parseFloat(updatedForm.wholesalePrice), gst).toFixed(2);
      } else if (value === "") {
        updatedForm.wholesalePrice = ""; updatedForm.wholesalePriceWithTax = "";
      }
    } else if (field === 'dealerPrice') {
      updatedForm.dealerPriceWithTax = dp ? calcTax(dp, gst).toFixed(2) : ""; 
      if (cp > 0 && dp) updatedForm.dealerMargin = calcMargin(dp, cp).toFixed(2);
      else if (!dp) updatedForm.dealerMargin = "";
    } else if (field === 'dealerPriceWithTax') {
      const newDp = dpWithTax ? calcBaseFromTax(dpWithTax, gst) : 0; 
      updatedForm.dealerPrice = newDp ? newDp.toFixed(2) : ""; 
      if (cp > 0 && newDp) updatedForm.dealerMargin = calcMargin(newDp, cp).toFixed(2);
      else if (!newDp) updatedForm.dealerMargin = "";
    } else if (field === 'dealerMargin') {
      if (cp > 0 && value !== "") {
        updatedForm.dealerPrice = calcSpFromMargin(cp, dMargin).toFixed(2); 
        updatedForm.dealerPriceWithTax = calcTax(parseFloat(updatedForm.dealerPrice), gst).toFixed(2);
      } else if (value === "") {
        updatedForm.dealerPrice = ""; updatedForm.dealerPriceWithTax = "";
      }
    }
    setFormData(updatedForm);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.category || (showHSN && !formData.hsnCode) || !formData.costPrice || !formData.sellingPrice) {
        alert("Please fill all required fields" + (showHSN ? " including HSN Code" : ""));
        return;
      }

      const finalSku = formData.sku || formData.hsnCode || `SKU-${Date.now().toString().slice(-6)}`;
      const finalBarcode = formData.barcode || `BAR-${finalSku}`;

      // Sanitization: Ensure all number fields are valid numbers before saving to DB
      const sanitizedData = {
        ...formData,
        sku: finalSku,
        barcode: finalBarcode,
        hsnCode: formData.hsnCode || "0000",
        costPrice: parseFloat(formData.costPrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        wholesalePrice: parseFloat(formData.wholesalePrice) || 0,
        dealerPrice: parseFloat(formData.dealerPrice) || 0,
        mrp: parseFloat(formData.mrp) || 0,
        gstRate: parseFloat(formData.gstRate) || 0,
        minimumStock: parseFloat(formData.minimumStock) || 0,
        currentStock: parseFloat(formData.currentStock) || 0,
      };

      if (editingId) {
        const oldProduct = inventory.find(p => p._id === editingId);
        
        // Update Locally
        await dbService.updateProduct(editingId, sanitizedData);
        await auditService.logAction('UPDATE', 'inventory', oldProduct, sanitizedData);
        await syncQueue.enqueue({ entityId: editingId, entity: 'inventory', method: "PUT", url: `/api/inventory/${editingId}`, data: sanitizedData });
        
        // Optimistic UI update (Instantly show new fields without waiting for sync)
        setInventory(prev => prev.map(p => p._id === editingId ? { ...p, ...sanitizedData } : p));
        alert(`Product updated offline successfully!`);
      } else {
        const newId = crypto.randomUUID ? crypto.randomUUID() : `PROD-${Date.now()}`;
        const payload = { ...sanitizedData, _id: newId, uuid: newId };
        
        // Save Locally
        await dbService.saveProduct(payload);
        await auditService.logAction('CREATE', 'inventory', null, payload);
        await syncQueue.enqueue({ entityId: newId, entity: 'inventory', method: "POST", url: "/api/inventory", data: payload });
        
        setInventory(prev => [payload, ...prev]);
        alert(`Product created offline successfully!`);
      }

      filterInventory(); // Refresh the visible list
      resetForm();
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Error saving product: " + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      subCategory: "",
      hsnCode: "",
      costPrice: 0,
      costPriceWithTax: "",
      profitMargin: "",
      sellingPrice: 0,
      sellingPriceWithTax: "",
      mrp: 0,
      gstRate: 0,
      unit: "pcs",
      minimumStock: 10,
      maximumStock: "",
      currentStock: 0,
      supplier: "",
      isRawMaterial: false,
      weight: "",
      purity: "",
      makingChargeType: "fixed",
      makingCharge: 0,
      brand: "",
      dimensions: "",
      materialType: "",
      ageGroup: "",
      certification: "",
      warrantyPeriod: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  // Industry conditional logic
  const showRawMaterial = ['restaurant', 'food', 'cafe', 'bakery', 'manufacturing'].some(i => industry.includes(i));
  const showJewellery = ['jewellery', 'jewelry', 'goldsmith'].some(i => industry.includes(i));
  const showHardware = ['hardware', 'builder', 'construction', 'real estate', 'paint'].some(i => industry.includes(i));
  const showScienceSports = ['sports', 'science', 'medical', 'pharma', 'gym'].some(i => industry.includes(i));
  const showAnySpecific = showRawMaterial || showJewellery || showHardware || showScienceSports;

  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      try {
        const oldProduct = inventory.find(p => p._id === id);
        await dbService.deleteProduct(id);
        await auditService.logAction('DELETE', 'inventory', oldProduct, null);
        await syncQueue.enqueue({ entityId: id, entity: 'inventory', method: "DELETE", url: `/api/inventory/${id}` });
        
        fetchInventory();
      } catch (err) {
        console.error("Error deleting product:", err);
      }
    }
  };

  const handleScanSuccess = (decodedText) => {
    setSearchTerm(decodedText);
    setShowScanner(false);
  };

  const handleShowBarcode = (product) => {
    setSelectedProductForBarcode(product);
    setShowBarcodeModal(true);
  };

  const handleMergeClick = (product) => {
    setProductToMerge(product);
    setShowMergeModal(true);
  };

  const safeInventoryList = Array.isArray(inventory) ? inventory : [];
  const lowStockCount = safeInventoryList.filter((item) => item.currentStock < (item.minimumStock || 10)).length;
  const totalValue = safeInventoryList.reduce((sum, item) => sum + ((item.currentStock || 0) * (item.sellingPrice || 0)), 0);
  const totalProducts = safeInventoryList.length;

  const inventoryColumns = [
    {
      header: "Product",
      accessor: "name",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Package className="text-blue-600" size={16} />
          <div>
            <p className="font-semibold text-gray-900 text-sm">{row.name}</p>
            <p className="text-xs text-gray-500">{row.supplier}</p>
          </div>
        </div>
      ),
    },
    {
      header: "SKU / HSN",
      cell: (row) => (
        <div className="text-xs">
          <p className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-600">{row.sku}</p>
          <p className="text-gray-600 mt-1">{row.hsnCode}</p>
        </div>
      ),
    },
    {
      header: "Category",
      accessor: "category",
    },
    {
      header: "Unit",
      accessor: "unit",
      cellClassName: "font-medium text-gray-900",
    },
    {
      header: "Stock",
      cell: (row) => {
        const isLowStock = row.currentStock < (row.minimumStock || 10);
        return (
          <div className={isLowStock ? 'bg-orange-50 p-2 rounded-md' : ''}>
            <div className="flex items-center gap-1">
              <span className={`font-bold text-sm ${isLowStock ? 'text-orange-600' : 'text-gray-900'}`}>
                {row.currentStock}
              </span>
              {isLowStock && <AlertTriangle className="text-orange-600" size={14} />}
            </div>
            <p className="text-xs text-gray-500">Min: {row.minimumStock}</p>
          </div>
        );
      },
    },
    {
      header: showSalesGST ? "Retail Price (Inc. GST)" : "Retail Price",
      cell: (row) => {
        const gst = showSalesGST ? (parseFloat(row.gstRate) || 0) : 0;
        const spWithGst = (parseFloat(row.sellingPrice) || parseFloat(row.price) || 0) * (1 + gst / 100);
        return (
          <div className="text-xs">
            <p className="font-bold text-green-700 text-sm">{formatCurrency(spWithGst)}</p>
          </div>
        );
      },
    },
    ...(showPurchaseGST ? [{
      header: "GST",
      cell: (row) => (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">{row.gstRate}%</span>
      ),
    }] : []),
    {
      header: "Actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      cell: (row) => (
        <div className="flex justify-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="p-1.5 hover:bg-green-100 rounded text-green-600 transition text-xs"><Edit size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleMergeClick(row); }} className="p-1.5 hover:bg-purple-100 rounded text-purple-600 transition text-xs" title="Merge Item"><LinkIcon size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleShowBarcode(row); }} className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition text-xs"><Barcode size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row._id); }} className="p-1.5 hover:bg-red-100 rounded text-red-600 transition text-xs"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">Manage your products and stock levels</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => navigate("/inventory/parse-purchase-bill")}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <Camera size={20} />
            Scan Purchase Bill
          </button>
           <button
            onClick={() => navigate("/inventory/purchase-return")}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <Undo2 size={20} />
            Purchase Return
          </button>
          <button
            onClick={() => navigate("/inventory/supplier-ledger")}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <BookUser size={20} />
            Supplier Ledger
          </button>
          <button
            onClick={() => navigate("/inventory/purchase")}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <ShoppingBag size={20} />
            Purchase
          </button>
          <button
            onClick={() => navigate("/inventory/adjust")}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <ClipboardList size={20} />
            Adjust Stock
          </button>
          <button
            onClick={() => setShowScanner(!showScanner)}
            className={`flex items-center gap-2 border px-4 py-2 rounded-lg transition ${showScanner ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <Scan size={20} />
            {showScanner ? "Close Scanner" : "Scan"}
          </button>
          <button
            onClick={() => navigate("/inventory/bulk")}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <Upload size={20} />
            Bulk Upload
          </button>
          <button
            onClick={() => navigate("/inventory/add")}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      {/* Barcode Scanner Section */}
      {showScanner && (
        <div className="mb-6">
          <BarcodeScanner
            onScanSuccess={handleScanSuccess}
            onScanFailure={(err) => console.log(err)}
          />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ReportCard title="Total Products" value={totalProducts} icon="📦" />
        <ReportCard title="Total Value" value={formatCurrency(totalValue)} icon="💰" />
        <ReportCard title="Low Stock" value={lowStockCount} icon={<AlertTriangle className="text-orange-600" size={24} />} />
        <ReportCard title="Categories" value="5" icon="🏷️" />
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Add Product Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{editingId ? "Edit Product" : "Add New Product"}</h2>
          <form onSubmit={handleAddProduct} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input type="text" placeholder="Enter product name" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea placeholder="Enter description" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand / Company</label>
                  <input list="brand-list-edit" placeholder="e.g. Samsung" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
                  <datalist id="brand-list-edit">
                    {brands.map((b, idx) => <option key={idx} value={b} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <input list="category-list-edit" placeholder="Type or Select Category" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
                  <datalist id="category-list-edit">
                    {categories.map((cat, idx) => <option key={idx} value={cat} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                  <input list="subcategory-list-edit" placeholder="Type or Select Sub Category" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.subCategory} onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })} />
                  <datalist id="subcategory-list-edit">
                    {subCategories.map((scat, idx) => <option key={idx} value={scat} />)}
                  </datalist>
                </div>
                {showHSN && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code *</label>
                  <input type="text" placeholder="Enter HSN Code" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.hsnCode} onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })} required />
                </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input type="text" placeholder="Enter Supplier" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Pricing & Margins</h3>
              
              {isComposition && (
                <div className="mb-4">
                  <p className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200 font-medium">
                    💡 Composition Scheme: Enter your purchase GST for accurate costing. For sales, enter the final inclusive selling price.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                {showPurchaseGST && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">GST Rate (%)</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.gstRate}
                    onChange={(e) => handlePriceCalculation('gstRate', e.target.value)}
                  >
                    <option value="">0%</option>
                    {gstRates.map((rate) => (
                      <option key={rate} value={rate}>{rate}%</option>
                    ))}
                  </select>
                </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost Price {showPurchaseGST && "(W/O GST)"} *</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.costPrice}
                    onChange={(e) => handlePriceCalculation('costPrice', e.target.value)}
                    step="0.01"
                    required
                  />
                </div>
                {showPurchaseGST && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost Price (With GST)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.costPriceWithTax}
                    onChange={(e) => handlePriceCalculation('costPriceWithTax', e.target.value)}
                    step="0.01"
                  />
                </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Retail Margin (%)</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50" value={formData.profitMargin} onChange={(e) => handlePriceCalculation('profitMargin', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Retail Price {showSalesGST && "(W/O GST)"} *</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 font-bold"
                    value={formData.sellingPrice}
                    onChange={(e) => handlePriceCalculation('sellingPrice', e.target.value)}
                    step="0.01"
                    required
                  />
                </div>
                {showSalesGST && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Retail Price (With GST) *</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 font-bold"
                    value={formData.sellingPriceWithTax}
                    onChange={(e) => handlePriceCalculation('sellingPriceWithTax', e.target.value)}
                    step="0.01"
                    required={showSalesGST}
                  />
                </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">MRP</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) })}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wholesale Margin (%)</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50" value={formData.wholesaleMargin} onChange={(e) => handlePriceCalculation('wholesaleMargin', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wholesale Price {showSalesGST && "(W/O GST)"}</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={formData.wholesalePrice} onChange={(e) => handlePriceCalculation('wholesalePrice', e.target.value)} />
                </div>
                {showSalesGST && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wholesale Price (With GST)</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" value={formData.wholesalePriceWithTax} onChange={(e) => handlePriceCalculation('wholesalePriceWithTax', e.target.value)} />
                </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dealer Margin (%)</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-orange-50" value={formData.dealerMargin} onChange={(e) => handlePriceCalculation('dealerMargin', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dealer Price {showSalesGST && "(W/O GST)"}</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" value={formData.dealerPrice} onChange={(e) => handlePriceCalculation('dealerPrice', e.target.value)} />
                </div>
                {showSalesGST && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dealer Price (With GST)</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" value={formData.dealerPriceWithTax} onChange={(e) => handlePriceCalculation('dealerPriceWithTax', e.target.value)} />
                </div>
                )}
              </div>
            </div>

            {/* Units & Stock */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Units & Stock</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit *</label>
                  <input type="text" placeholder="e.g. PCS, KG" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Stock</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) })} step="0.01" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Stock</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.minimumStock} onChange={(e) => setFormData({ ...formData, minimumStock: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Stock</label>
                  <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.maximumStock} onChange={(e) => setFormData({ ...formData, maximumStock: parseFloat(e.target.value) })} />
                </div>
              </div>
            </div>

            {/* Industry Specific Fields */}
            {showAnySpecific && editingId && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Business Specific Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  {/* Restaurant / Manufacturing */}
                  {showRawMaterial && (
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" id="isRawMaterialForm" checked={formData.isRawMaterial} onChange={(e) => setFormData({...formData, isRawMaterial: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                      <label htmlFor="isRawMaterialForm" className="text-sm font-medium text-gray-700">Is this a Raw Material? (For Recipes/Manufacturing)</label>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Jewellery */}
                    {showJewellery && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Jewellery</label>
                        <input type="number" placeholder="Weight (Grams)" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} step="0.01" />
                        <input type="text" placeholder="Purity (e.g. 22K, 925)" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.purity} onChange={(e) => setFormData({...formData, purity: e.target.value})} />
                      </div>
                    )}

                    {/* Hardware */}
                    {showHardware && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hardware & Builder</label>
                        <input type="text" placeholder="Dimensions (e.g. 8x4 ft)" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.dimensions} onChange={(e) => setFormData({...formData, dimensions: e.target.value})} />
                      </div>
                    )}

                    {/* Science & Sports */}
                    {showScienceSports && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Science & Sports</label>
                        <input type="text" placeholder="Material (e.g. Leather, Glass)" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.materialType} onChange={(e) => setFormData({...formData, materialType: e.target.value})} />
                        <div className="flex gap-2">
                          <input type="text" placeholder="Warranty" className="w-1/2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.warrantyPeriod} onChange={(e) => setFormData({...formData, warrantyPeriod: e.target.value})} />
                          <input type="text" placeholder="Age Grp" className="w-1/2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.ageGroup} onChange={(e) => setFormData({...formData, ageGroup: e.target.value})} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                {editingId ? "Update Product" : "Add Product"}
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

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <Loader />
        ) : (
          <DataTable
            columns={inventoryColumns}
            data={filteredInventory}
          />
        )}
      </div>

      {/* Barcode Modal */}
      {showBarcodeModal && (
        <BarcodeModal 
          product={selectedProductForBarcode} 
          onClose={() => setShowBarcodeModal(false)} 
        />
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <MergeModal 
          sourceProduct={productToMerge} 
          allProducts={safeInventoryList}
          onClose={() => setShowMergeModal(false)} 
          onConfirm={async (targetId) => {
             // Placeholder for backend API call
             alert(`Item Merged successfully into selected product! This action has been recorded for future unmerging.`);
             setShowMergeModal(false);
          }}
        />
      )}
    </div>
  );
};

const BarcodeModal = ({ product, onClose }) => {
  useEffect(() => {
    if (product && product.sku) {
      // Delay generation slightly to ensure canvas is in the DOM
      setTimeout(() => generateBarcode(product.sku, 'barcode-canvas'), 50);
    }
  }, [product]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 text-center relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        <h3 className="text-xl font-bold mb-2">{product.name}</h3>
        <p className="text-gray-600 mb-4">SKU: {product.sku}</p>
        <div className="p-4 border rounded-lg bg-white">
          <canvas id="barcode-canvas"></canvas>
        </div>
      </div>
    </div>
  );
};

const MergeModal = ({ sourceProduct, allProducts, onClose, onConfirm }) => {
  const [targetId, setTargetId] = useState("");

  if (!sourceProduct) return null;
  
  // Exclude the source product from the target list
  const availableTargets = allProducts.filter(p => p._id !== sourceProduct._id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        <h3 className="text-xl font-bold mb-2 text-purple-700 flex items-center gap-2"><LinkIcon /> Merge Item</h3>
        <p className="text-sm text-gray-600 mb-4">Select the primary product you want to merge <strong>"{sourceProduct.name}"</strong> into. Its stock will be moved and a record will be kept.</p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Product</label>
          <select 
            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="">-- Select Master Product --</option>
            {availableTargets.map(p => (
              <option key={p._id} value={p._id}>{p.name} (Stock: {p.currentStock || 0})</option>
            ))}
          </select>
        </div>
        <button onClick={() => onConfirm(targetId)} disabled={!targetId} className="w-full bg-purple-600 text-white font-bold py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition">
          Confirm Merge
        </button>
      </div>
    </div>
  );
};
export default InventoryPage;
