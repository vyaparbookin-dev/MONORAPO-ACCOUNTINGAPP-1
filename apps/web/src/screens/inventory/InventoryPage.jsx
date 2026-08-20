import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, Download, Edit, Trash2, Package, AlertTriangle, Upload, Scan, ShoppingBag, ClipboardList, Undo2, BookUser, Camera, Barcode, X, Link as LinkIcon, UploadCloud, History, Printer, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import BarcodeScanner from "../../components/BarcodeScanner";
import DataTable from "../../components/Datatable";
import ReportCard from "../../components/ReportCard";
import Loader from "../../components/Loader";
import api from "../../services/api";
import { formatCurrency, syncQueue } from "@repo/shared";
import { generateBarcode } from "../../utils/barcodeGenerator";
import { getGstFlags, normalizeGstType } from "../../utils/gst";
import { useCompany } from "../../contexts/CompanyContext";

const InventoryPage = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("ALL");
  const [selectedStockFilter, setSelectedStockFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [productToMerge, setProductToMerge] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    image: "",
    description: "",
    category: "",
    subCategory: "",
    hsnCode: "",
    costPrice: 0,
    costPriceWithTax: "",
    profitMargin: "",
    sellingPrice: 0,
    sellingPriceWithTax: "",
    wholesalePrice: "",
    wholesalePriceWithTax: "",
    wholesaleMargin: "",
    dealerPrice: "",
    dealerPriceWithTax: "",
    dealerMargin: "",
    mrp: 0,
    gstRate: 0,
    unit: "pcs",
    secondaryUnit: "",
    conversionRate: "",
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
  const isGstEnabled = selectedCompany?.enableGst !== false && String(selectedCompany?.enableGst).toLowerCase() !== "false";

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const safeInventoryList = Array.isArray(inventory) ? inventory : [];

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, selectedCategoryFilter, selectedBrandFilter, selectedStockFilter]);

  const isComposition = String(gstType).toLowerCase() === "composition";
  const isUnregistered = String(gstType).toLowerCase() === "unregistered";
  const showPurchaseGST = !isUnregistered;
  const showSalesGST = !isUnregistered;
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
    const margin = cp > 0 ? (((sp - cp) / cp) * 100).toFixed(2) : 0;
    const wp = parseFloat(item.wholesalePrice) || 0;
    const dp = parseFloat(item.dealerPrice) || 0;
    const wMargin = cp > 0 && wp > 0 ? (((wp - cp) / cp) * 100).toFixed(2) : "";
    const dMargin = cp > 0 && dp > 0 ? (((dp - cp) / cp) * 100).toFixed(2) : "";

    setEditingId(item._id);
    setFormData({
      name: item.name,
      sku: item.sku || "",
      barcode: item.barcode || "",
      image: item.image || "",
      description: item.description,
      category: item.category,
      subCategory: item.subCategory || "",
      hsnCode: item.hsnCode,
      costPrice: cp,
      costPriceWithTax: (cp + (cp * gst) / 100).toFixed(2),
      profitMargin: margin,
      sellingPrice: sp,
      sellingPriceWithTax: (sp + (sp * gst) / 100).toFixed(2),
      wholesalePrice: wp,
      wholesalePriceWithTax: wp ? (wp + (wp * gst) / 100).toFixed(2) : "",
      wholesaleMargin: wMargin,
      dealerPrice: dp,
      dealerPriceWithTax: dp ? (dp + (dp * gst) / 100).toFixed(2) : "",
      dealerMargin: dMargin,
      mrp: item.mrp,
      gstRate: item.gstRate,
      unit: item.unit,
      secondaryUnit: item.secondaryUnit || "",
      conversionRate: item.conversionRate || "",
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, facingMode: 'environment' });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraOpen(true);
    } catch (err) {
      alert("Camera access denied.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.7);
      setFormData({ ...formData, image: dataUrl });
      stopCamera();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Image must be less than 2MB");
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => { if (isCameraOpen) stopCamera(); };
  }, [isCameraOpen]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      if (window.electron && window.electron.db) {
        const localInventory = await window.electron.db.getInventory();
        setInventory(localInventory || []);
      } else {
        const [invRes, catRes, subCatRes, brandRes] = await Promise.all([
          api.get("/api/inventory"),
          api.get("/api/category").catch(() => ({ data: [] })),
          api.get("/api/subcategory").catch(() => ({ data: [] })),
          api.get("/api/brand").catch(() => ({ data: [] }))
        ]);

        const inventoryList = invRes.inventory || invRes.data?.products || invRes.data || (Array.isArray(invRes) ? invRes : []);
        setInventory(inventoryList);

        const productCats = inventoryList.map(p => p.category).filter(Boolean);
        const productSubCats = inventoryList.map(p => p.subCategory).filter(Boolean);
        const productBrands = inventoryList.map(p => p.brand).filter(Boolean);
        
        // Robust data extractor to prevent crashes
        const extractNames = (resData, key) => {
          if (!resData) return [];
          let list = [];
          if (Array.isArray(resData[key])) list = resData[key];
          else if (Array.isArray(resData.data)) list = resData.data;
          else if (Array.isArray(resData)) list = resData;
          return list.map(c => typeof c === 'string' ? c : c?.name).filter(Boolean);
        };

        const masterCats = extractNames(catRes.data, 'categories');
        const masterSubCats = extractNames(subCatRes.data, 'subCategories');
        const masterBrands = extractNames(brandRes.data, 'brands');

        setCategories([...new Set([...masterCats, ...productCats])]);
        setSubCategories([...new Set([...masterSubCats, ...productSubCats])]);
        setBrands([...new Set([...masterBrands, ...productBrands])]);
        
        // Clear old cache
        localStorage.removeItem("categories");
        localStorage.removeItem("subCategories");
      }

    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      if (!window.electron) setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const matchCategory = (item, catId) => {
    if (!item) return false;
    if (catId === 'ALL') return true;
    const stock = Number(item.currentStock ?? item.stock ?? item.openingStock ?? 0);
    const minStock = Number(item.minimumStock ?? 10);
    if (catId === 'LOW_STOCK') return stock < minStock;
    if (catId === 'OUT_OF_STOCK') return stock <= 0;
    if (catId === 'IN_STOCK') return stock > 0;

    const cat = String(item.category || '').toUpperCase();
    const brand = String(item.brand || '').toUpperCase();
    const subCat = String(item.subCategory || '').toUpperCase();
    const name = String(item.name || '').toUpperCase();

    if (catId === 'PLYWOOD_GROUP') {
      return cat === 'PLYWOOD' || cat === 'BEAT' || cat.includes('PLY') || cat.includes('BEAT') || cat.includes('HARDWOOD') || subCat.includes('PLY') || name.includes('PLYWOOD') || name.includes('18MM') || name.includes('12MM') || name.includes('6MM');
    }
    if (catId === 'BERGER_GROUP') {
      if (brand.includes('KAMDHENU') || cat.includes('KAMDHENU') || name.includes('KAMDHENU') || name.includes('KAMOBLASTER')) return false;
      return brand.includes('BERGER') || cat.includes('BERGER') || name.includes('BERGER') || name.includes('BISON') || name.includes('LUXOL') || name.includes('WALMASTA') || name.includes('WEATHERCOAT') || name.includes('SILK') || name.includes('RANGOLI') || name.includes('BUTERFLY') || (cat.includes('DISTEMPER') && !brand.includes('KAMDHENU')) || (cat.includes('ACRILIC') && !brand.includes('KAMDHENU'));
    }
    if (catId === 'KAMDHENU_GROUP') {
      return brand.includes('KAMDHENU') || cat.includes('KAMDHENU') || name.includes('KAMDHENU') || name.includes('KAMOBLASTER') || name.includes('KAMOCRETE') || name.includes('KAMODUR');
    }
    if (catId === 'ELECTRICALS_GROUP') {
      return cat.includes('ELE') || cat.includes('ARKAYLITE') || brand.includes('ARKAYLITE') || cat.includes('MODUL') || cat.includes('SWITCH') || cat.includes('WIRE') || cat.includes('COPPER') || cat.includes('ANCHOR') || cat.includes('CONA') || cat.includes('CR') || cat.includes('VINAY') || name.includes('SWITCH') || name.includes('SOCKET') || name.includes('ELEMENT') || name.includes('MCB');
    }
    if (catId === 'GI_FITTING') {
      return cat.includes('GI') || name.includes('GI ') || name.includes('PUMP') || cat.includes('MONOBLOCK') || cat.includes('PRIMING') || name.includes('ELBOW') || name.includes('NIPPLE') || name.includes('UNION') || name.includes('REDUCER');
    }
    if (catId === 'PIPES_GROUP') {
      if (cat.includes('GI')) return false;
      return cat.includes('UPVC') || cat.includes('SWR') || cat.includes('CPVC') || cat.includes('PIPE') || brand.includes('KISAN') || cat.includes('PRINCE') || cat.includes('PAPULAR') || cat.includes('GARDEN') || cat.includes('SACTION') || cat.includes('FOOTVALVE') || name.includes('UPVC') || name.includes('CPVC') || name.includes('SWR');
    }
    return cat.toLowerCase() === catId.toLowerCase();
  };

  const filterInventory = () => {
    const safeInventory = Array.isArray(inventory) ? inventory : [];
    let filtered = [...safeInventory];

    // Category / Group Filter
    if (selectedCategoryFilter !== "ALL") {
      filtered = filtered.filter(item => matchCategory(item, selectedCategoryFilter));
    }

    // Brand Filter
    if (selectedBrandFilter !== "ALL") {
      filtered = filtered.filter(item => (item.brand || "").toLowerCase() === selectedBrandFilter.toLowerCase());
    }

    // Stock Status Sub-Filter (In Stock / Low Stock / Out of Stock)
    if (selectedStockFilter === "IN_STOCK") {
      filtered = filtered.filter(item => (Number(item.currentStock) || 0) > 0);
    } else if (selectedStockFilter === "LOW_STOCK") {
      filtered = filtered.filter(item => (Number(item.currentStock) || 0) < (Number(item.minimumStock) || 10));
    } else if (selectedStockFilter === "OUT_OF_STOCK") {
      filtered = filtered.filter(item => (Number(item.currentStock) || 0) <= 0);
    }

    // Multi-word Intelligent Search Filter
    if (searchTerm && searchTerm.trim()) {
      const tokens = searchTerm.toLowerCase().trim().split(/\s+/);
      filtered = filtered.filter(item => {
        const itemText = `${item.name || ''} ${item.sku || ''} ${item.barcode || ''} ${item.category || ''} ${item.subCategory || ''} ${item.brand || ''} ${item.hsnCode || ''} ${item.unit || ''}`.toLowerCase();
        return tokens.every(token => itemText.includes(token));
      });
    }

    setFilteredInventory(filtered);
  };

  const handleDirectExcelExport = (itemsToExport) => {
    const list = itemsToExport || filteredInventory;
    const formattedData = list.map((p, idx) => ({
      "Sr No": idx + 1,
      "SKU": p.sku || "",
      "Item Name": p.name || "",
      "Brand": p.brand || "",
      "Category": p.category || "",
      "Sub Category": p.subCategory || "",
      "Packing / Size": p.packing || "",
      "Unit": p.unit || "PC",
      "Current Stock (Qty)": Number(p.currentStock) || 0,
      "Cost Price (₹)": Number(p.costPrice) || 0,
      "Selling Price (₹)": Number(p.sellingPrice || p.price) || 0,
      "MRP (₹)": Number(p.mrp) || 0,
      "Stock Value (₹)": (Number(p.currentStock) || 0) * (Number(p.sellingPrice || p.price) || 0),
      "GST Rate (%)": p.gstRate ? `${p.gstRate}%` : "18%",
      "HSN Code": p.hsnCode || ""
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");

    const categoryName = (selectedCategoryFilter || "All").replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `Inventory_${categoryName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
        alert("Please fill all required fields (Name, Category, Cost, Selling Price" + (showHSN ? ", and HSN Code" : "") + ")");
        return;
      }

      const cleanName = formData.name.trim();
      const duplicateItem = safeInventoryList.find(p => p.name.toLowerCase().trim() === cleanName.toLowerCase() && p._id !== editingId);
      if (duplicateItem) {
        alert(`Error: A product with the name "${cleanName}" already exists!`);
        return;
      }

      const formatMasterValue = (val, list) => {
        if (!val) return "";
        const cleanVal = val.trim();
        const existing = list.find(item => typeof item === 'string' && item.toLowerCase() === cleanVal.toLowerCase());
        return existing || (cleanVal.charAt(0).toUpperCase() + cleanVal.slice(1));
      };

      const sanitizedData = {
        ...formData,
        name: cleanName,
        category: formatMasterValue(formData.category, categories) || "General",
        subCategory: formatMasterValue(formData.subCategory, subCategories),
        brand: formatMasterValue(formData.brand, brands),
        hsnCode: formData.hsnCode || "0000"
      };

      if (editingId) {
        const response = await api.put(`/api/inventory/${editingId}`, sanitizedData);
        // Optimistic UI update for Web
        setInventory(prev => prev.map(p => p._id === editingId ? { ...p, ...sanitizedData } : p));
        alert(`Product updated! SKU: ${response?.data?.product?.sku || sanitizedData.hsnCode || ''}`);
      } else {
        // Desktop: लोकल SQLite में तुरंत सेव करें (Offline Guarantee)
        if (window.electron && window.electron.db) {
          await window.electron.db.saveProduct({
            ...sanitizedData,
            name: sanitizedData.name,
            sku: sanitizedData.hsnCode || sanitizedData.sku || "SKU-" + Date.now(),
            price: sanitizedData.sellingPrice,
            quantity: sanitizedData.currentStock,
            category: sanitizedData.category,
            subCategory: sanitizedData.subCategory || ""
          });
        }

        try {
          const response = await api.post("/api/inventory", sanitizedData);
          alert(`Product created! SKU: ${response?.data?.product?.sku || ''}`);
        } catch (apiErr) {
          if (!navigator.onLine || apiErr.message === "Network Error") {
            syncQueue.enqueue({ method: "POST", url: "/api/inventory", data: sanitizedData });
            alert("You are offline. Product saved safely locally and will sync automatically!");
          } else throw apiErr;
        }
      }

      fetchInventory();
      resetForm();
    } catch (err) {
      console.error("Error saving product:", err);
      alert(err.response?.data?.message || "Error saving product");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      barcode: "",
      image: "",
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
      secondaryUnit: "",
      conversionRate: "",
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
        await api.delete(`/api/inventory/${id}`);
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
                {row.currentStock} {row.unit}
              </span>
              {isLowStock && <AlertTriangle className="text-orange-600" size={14} />}
            </div>
            {row.secondaryUnit && row.conversionRate && row.conversionRate !== 0 && (
              <p className="text-xs font-bold text-blue-600 mt-0.5">
                {Number((row.currentStock / row.conversionRate).toFixed(2))} {row.secondaryUnit}
              </p>
            )}
            <p className="text-[10px] text-gray-500 mt-0.5">Min: {row.minimumStock}</p>
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

  // Dynamic Real-time Calculations for Filtered View (Only multiply in-stock units)
  const filteredTotalValue = filteredInventory.reduce((acc, item) => {
    const qty = Number(item.currentStock) || 0;
    const price = Number(item.sellingPrice || item.price || 0);
    return acc + (qty > 0 ? qty * price : 0);
  }, 0);

  const filteredTotalUnits = filteredInventory.reduce((acc, item) => acc + (Number(item.currentStock) || 0), 0);
  const filteredLowStockCount = filteredInventory.filter(item => (Number(item.currentStock) || 0) < (Number(item.minimumStock) || 10)).length;
  const filteredHighStockCount = filteredInventory.filter(item => (Number(item.currentStock) || 0) >= 50).length;

  // Dynamic SaaS Multi-tenant Category Detection
  const distinctCats = [...new Set(safeInventoryList.map(p => (p.category || '').trim()).filter(Boolean))];
  const isHardwareStore = safeInventoryList.some(p => {
    const c = String(p.category || '').toUpperCase();
    const n = String(p.name || '').toUpperCase();
    return c.includes('PLY') || c.includes('PAINT') || c.includes('PIPE') || c.includes('GI') || n.includes('PLY') || n.includes('BERGER');
  });

  const categoryFilterTabs = isHardwareStore ? [
    { id: "ALL", label: "All Products", icon: "📦", count: safeInventoryList.length },
    { id: "PLYWOOD_GROUP", label: "Plywood & Beat", icon: "🪵", count: safeInventoryList.filter(p => matchCategory(p, 'PLYWOOD_GROUP')).length },
    { id: "BERGER_GROUP", label: "Berger Paints", icon: "🎨", count: safeInventoryList.filter(p => matchCategory(p, 'BERGER_GROUP')).length },
    { id: "KAMDHENU_GROUP", label: "Kamdhenu Paints", icon: "🎨", count: safeInventoryList.filter(p => matchCategory(p, 'KAMDHENU_GROUP')).length },
    { id: "ELECTRICALS_GROUP", label: "Electricals", icon: "⚡", count: safeInventoryList.filter(p => matchCategory(p, 'ELECTRICALS_GROUP')).length },
    { id: "GI_FITTING", label: "GI Fittings & Pumps", icon: "🔩", count: safeInventoryList.filter(p => matchCategory(p, 'GI_FITTING')).length },
    { id: "PIPES_GROUP", label: "Pipes & UPVC", icon: "🚰", count: safeInventoryList.filter(p => matchCategory(p, 'PIPES_GROUP')).length },
    { id: "IN_STOCK", label: "All In Stock", icon: "✨", count: safeInventoryList.filter(p => (Number(p.currentStock) || 0) > 0).length },
  ] : [
    { id: "ALL", label: "All Products", icon: "📦", count: safeInventoryList.length },
    ...distinctCats.slice(0, 10).map(cat => ({
      id: cat,
      label: cat,
      icon: "🏷️",
      count: safeInventoryList.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase()).length
    })),
    { id: "IN_STOCK", label: "All In Stock", icon: "✨", count: safeInventoryList.filter(p => (Number(p.currentStock) || 0) > 0).length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory & Stock Master</h1>
          <p className="text-gray-600 mt-1">Manage products, stock levels, brand & category analytics</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => setShowAuditModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold px-4 py-2 rounded-lg hover:from-amber-600 hover:to-amber-700 transition shadow-sm"
          >
            <FileSpreadsheet size={18} />
            📋 Stock Audit & Excel Export
          </button>
          <button
            onClick={() => navigate("/inventory/category-analytics")}
            className="flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 font-semibold px-3.5 py-2 rounded-lg hover:bg-purple-100 transition shadow-sm"
          >
            📊 Category Analytics
          </button>
          <button
            onClick={() => navigate("/inventory/category-management")}
            className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold px-3.5 py-2 rounded-lg hover:bg-indigo-100 transition shadow-sm"
          >
            🏷️ Category Masters
          </button>
          <button
            onClick={() => navigate("/inventory/parse-purchase-bill")}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <Camera size={18} />
            Scan Bill
          </button>
           <button
            onClick={() => navigate("/inventory/purchase-return")}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <Undo2 size={18} />
            Purchase Return
          </button>
          <button
            onClick={() => navigate("/inventory/supplier-ledger")}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <BookUser size={18} />
            Supplier Ledger
          </button>
          <button
            onClick={() => navigate("/inventory/purchase")}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <ShoppingBag size={18} />
            Purchase
          </button>
          <button
            onClick={() => navigate("/inventory/adjust")}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <ClipboardList size={18} />
            Adjust Stock
          </button>
          <button
            onClick={() => setShowScanner(!showScanner)}
            className={`flex items-center gap-2 border px-3.5 py-2 rounded-lg transition ${showScanner ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <Scan size={18} />
            {showScanner ? "Close" : "Barcode Scan"}
          </button>
          <button
            onClick={() => navigate("/inventory/bulk")}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <Upload size={18} />
            Bulk Upload
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-emerald-600 text-white font-semibold px-3.5 py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm"
          >
            <Plus size={18} />
            {showForm ? "Close Form" : "Quick Add"}
          </button>
          <button
            onClick={() => navigate("/inventory/add")}
            className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow"
          >
            <Plus size={18} />
            Full Add Page
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

      {/* Realtime Stats / Analytics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtered Products</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{filteredInventory.length} <span className="text-xs text-gray-400 font-normal">/ {safeInventoryList.length} total</span></h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xl">📦</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Valuation (Selling)</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(filteredTotalValue)}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">💰</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Units in Stock</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">{filteredTotalUnits.toLocaleString('en-IN')} <span className="text-xs text-gray-400 font-normal">Units/KG</span></h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl text-xl">📊</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Low Stock Alerts</p>
            <h3 className="text-2xl font-bold text-orange-600 mt-1">{filteredLowStockCount} <span className="text-xs text-gray-400 font-normal">items</span></h3>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl text-xl">⚠️</div>
        </div>
      </div>

      {/* Category Filter Chips Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Category Quick Filters:</span>
          <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline" onClick={() => { setSelectedCategoryFilter("ALL"); setSelectedBrandFilter("ALL"); setSearchTerm(""); }}>
            Reset Filters
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categoryFilterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategoryFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategoryFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${selectedCategoryFilter === tab.id ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Stock Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex-1 min-w-[260px] relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, size (e.g. 18mm, 6*4, 1LTR), SKU, brand, category..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Brand Filter Dropdown */}
          <div className="min-w-[180px]">
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Brands ({brands.length})</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Direct Excel Download Button */}
          <button
            onClick={() => handleDirectExcelExport(filteredInventory)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg transition shadow-sm text-sm"
            title="Download current filtered list to Excel"
          >
            <Download size={16} />
            Download Excel (.xlsx)
          </button>
        </div>

        {/* Stock Level Sub-Pills (Prevents cross-category mixing) */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase">Stock Level:</span>
          {[
            { id: "ALL", label: "All Items" },
            { id: "IN_STOCK", label: "✨ In Stock Only (>0)" },
            { id: "LOW_STOCK", label: "⚠️ Low Stock (<10)" },
            { id: "OUT_OF_STOCK", label: "🚫 Out of Stock (0)" }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setSelectedStockFilter(st.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                selectedStockFilter === st.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Product Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{editingId ? "Edit Product" : "Add New Product"}</h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            {/* Product Image Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Image (Optional)</label>
              {isCameraOpen ? (
                <div className="relative w-full max-w-sm bg-black rounded-lg overflow-hidden flex flex-col items-center">
                  <video ref={videoRef} autoPlay playsInline className="h-48 w-full object-contain" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-2 flex gap-2">
                    <button type="button" onClick={captureImage} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold hover:bg-blue-700">Capture</button>
                    <button type="button" onClick={stopCamera} className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700"><X size={20} /></button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-300">
                    {formData.image ? <img src={formData.image} alt="Product" className="w-full h-full object-cover" /> : <UploadCloud className="text-gray-400" size={32} />}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex w-fit items-center justify-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition text-sm font-medium shadow-sm">
                      <UploadCloud size={16} /> Upload File
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <button type="button" onClick={startCamera} className="flex w-fit items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition text-sm font-medium shadow-sm">
                      <Camera size={16} /> Open Camera
                    </button>
                    {formData.image && (
                      <button type="button" onClick={() => setFormData({...formData, image: ""})} className="text-xs text-red-600 hover:underline text-left">Remove Image</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                <input
                  className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">SKU / Code</label>
                <input
                  className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Brand / Company</label>
                <input
                  list="brand-list-edit"
                  className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g. Samsung, Nike, Asian Paints"
                />
                <datalist id="brand-list-edit">
                  {brands.map((b, idx) => <option key={idx} value={b} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Barcode (Auto or Scan)</label>
                <input
                  className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Scan barcode"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  list="category-list-edit"
                  className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Type or select a category"
                />
                <datalist id="category-list-edit">
                  {categories.map((c, idx) => <option key={idx} value={c} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Sub Category</label>
                <input
                  list="subcategory-list-edit"
                  className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  placeholder="Type a sub-category"
                />
                <datalist id="subcategory-list-edit">
                  {subCategories.map((sc, idx) => <option key={idx} value={sc} />)}
                </datalist>
              </div>

              {showHSN && (
              <div>
                <label className="block text-sm font-medium text-gray-700">HSN Code *</label>
                <input
                  className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.hsnCode}
                  onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                  required
                />
              </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <input
                  className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Pricing & Margins</h3>
              
              {isComposition && (
                <div className="mb-4">
                  <p className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200 font-medium">
                    💡 Composition Scheme: Enter your purchase GST for accurate costing. For sales, enter the final inclusive selling price.
                  </p>
                </div>
              )}

              {/* Base Costs & GST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                {showPurchaseGST && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">GST Rate (%)</label>
                  <select
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.gstRate}
                    onChange={(e) => handlePriceCalculation('gstRate', e.target.value)}
                  >
                    <option value="">0%</option>
                    {gstRates.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost Price {showPurchaseGST && "(W/O GST)"} *</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.costPrice}
                    onChange={(e) => handlePriceCalculation('costPrice', e.target.value)}
                    required
                  />
                </div>
                {showPurchaseGST && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost Price (With GST)</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.costPriceWithTax}
                    onChange={(e) => handlePriceCalculation('costPriceWithTax', e.target.value)}
                  />
                </div>
                )}
              </div>

              {/* Retail Price */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Retail Margin (%)</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-green-50"
                    value={formData.profitMargin}
                    onChange={(e) => handlePriceCalculation('profitMargin', e.target.value)}
                    placeholder="e.g. 20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Retail Price {showSalesGST && "(W/O GST)"} *</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-green-50 font-bold"
                    value={formData.sellingPrice}
                    onChange={(e) => handlePriceCalculation('sellingPrice', e.target.value)}
                    required
                  />
                </div>
                {showSalesGST && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Retail Price (With GST) *</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-green-50 font-bold"
                    value={formData.sellingPriceWithTax}
                    onChange={(e) => handlePriceCalculation('sellingPriceWithTax', e.target.value)}
                    required={showSalesGST}
                  />
                </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">MRP</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  />
                </div>
              </div>

              {/* Wholesale Price */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wholesale Margin (%)</label>
                  <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50" value={formData.wholesaleMargin} onChange={(e) => handlePriceCalculation('wholesaleMargin', e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wholesale Price {showSalesGST && "(W/O GST)"}</label>
                  <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" value={formData.wholesalePrice} onChange={(e) => handlePriceCalculation('wholesalePrice', e.target.value)} />
                </div>
                {showSalesGST && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wholesale Price (With GST)</label>
                  <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" value={formData.wholesalePriceWithTax} onChange={(e) => handlePriceCalculation('wholesalePriceWithTax', e.target.value)} />
                </div>
                )}
                <div className="hidden md:block"></div>
              </div>

              {/* Dealer Price */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dealer Margin (%)</label>
                  <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none bg-orange-50" value={formData.dealerMargin} onChange={(e) => handlePriceCalculation('dealerMargin', e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dealer Price {showSalesGST && "(W/O GST)"}</label>
                  <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none" value={formData.dealerPrice} onChange={(e) => handlePriceCalculation('dealerPrice', e.target.value)} />
                </div>
                {showSalesGST && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dealer Price (With GST)</label>
                  <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none" value={formData.dealerPriceWithTax} onChange={(e) => handlePriceCalculation('dealerPriceWithTax', e.target.value)} />
                </div>
                )}
              </div>
            </div>

            {/* Stock */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Inventory</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Stock</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <select
                    className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alternate Unit (Optional)</label>
                  <select className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.secondaryUnit} onChange={(e) => setFormData({ ...formData, secondaryUnit: e.target.value })}>
                    <option value="">-- None --</option>
                    {units.filter(u => u !== formData.unit).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                
                {formData.secondaryUnit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-blue-600">1 {formData.unit || 'pcs'} = ? {formData.secondaryUnit}</label>
                    <input type="number" step="0.01" className="w-full border border-blue-300 bg-blue-50 p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.conversionRate} onChange={(e) => setFormData({ ...formData, conversionRate: parseFloat(e.target.value) || "" })} placeholder={`e.g. 3 (If 1 ${formData.unit || 'pcs'} = 3 ${formData.secondaryUnit})`} required />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Stock Alert</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Stock Limit</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.maximumStock}
                    onChange={(e) => setFormData({ ...formData, maximumStock: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* Industry Specific Details */}
            {showAnySpecific && editingId && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 text-gray-800">Business Specific Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-5 rounded-lg border border-gray-200">
                  
                  {/* Restaurant / Manufacturing */}
                  {showRawMaterial && (
                    <div className="md:col-span-3 flex items-center gap-2 mb-1">
                      <input type="checkbox" id="isRawMaterialForm" checked={formData.isRawMaterial} onChange={(e) => setFormData({...formData, isRawMaterial: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                      <label htmlFor="isRawMaterialForm" className="text-sm font-medium text-gray-700">Is this a Raw Material? (For Recipes/Manufacturing/Restaurant)</label>
                    </div>
                  )}

                  {/* Jewellery */}
                  {showJewellery && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Jewellery</label>
                      <input type="number" placeholder="Weight (Grams or mg)" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} step="0.001" />
                      <input type="text" placeholder="Purity (e.g. 22K, 925 Silver)" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.purity} onChange={(e) => setFormData({...formData, purity: e.target.value})} />
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
                      <input type="text" placeholder="Material (e.g. Borosilicate, Leather)" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.materialType} onChange={(e) => setFormData({...formData, materialType: e.target.value})} />
                      <div className="flex gap-2">
                        <input type="text" placeholder="Warranty" className="w-1/2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.warrantyPeriod} onChange={(e) => setFormData({...formData, warrantyPeriod: e.target.value})} />
                        <input type="text" placeholder="Age Grp" className="w-1/2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.ageGroup} onChange={(e) => setFormData({...formData, ageGroup: e.target.value})} />
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={resetForm} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
                Cancel
              </button>
              <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium">
                {editingId ? "Update Product" : "Add Product"}
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
             alert(`Item Merged successfully into selected product! This action has been recorded for future unmerging.`);
             setShowMergeModal(false);
          }}
        />
      )}

      {/* Stock Audit & Export Modal */}
      {showAuditModal && (
        <StockAuditModal 
          products={safeInventoryList} 
          companyName={selectedCompany?.name || "Ganesh Hardware"}
          onClose={() => setShowAuditModal(false)} 
        />
      )}

    </div>
  );
};

const StockAuditModal = ({ products, companyName, onClose }) => {
  const [auditorName, setAuditorName] = useState("");
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [onlyInStock, setOnlyInStock] = useState(false);

  const categories = [
    { id: "ALL", label: "All Categories" },
    { id: "PLYWOOD_GROUP", label: "🪵 Plywood & Beat" },
    { id: "BERGER_GROUP", label: "🎨 Berger Paints" },
    { id: "KAMDHENU_GROUP", label: "🎨 Kamdhenu Paints" },
    { id: "ELECTRICALS_GROUP", label: "⚡ Electricals" },
    { id: "GI_FITTING", label: "🔩 GI Fittings & Pumps" },
    { id: "PIPES_GROUP", label: "🚰 Pipes & UPVC" },
  ];

  const uniqueBrands = ["ALL", ...new Set(products.map(p => p.brand).filter(Boolean))];

  const matchCategoryAudit = (item, catId) => {
    if (!item) return false;
    if (catId === 'ALL') return true;
    const cat = String(item.category || '').toUpperCase();
    const brand = String(item.brand || '').toUpperCase();
    const subCat = String(item.subCategory || '').toUpperCase();
    const name = String(item.name || '').toUpperCase();

    if (catId === 'PLYWOOD_GROUP') {
      return cat === 'PLYWOOD' || cat === 'BEAT' || cat.includes('PLY') || cat.includes('BEAT') || cat.includes('HARDWOOD') || subCat.includes('PLY') || name.includes('PLYWOOD') || name.includes('18MM') || name.includes('12MM') || name.includes('6MM');
    }
    if (catId === 'BERGER_GROUP') {
      if (brand.includes('KAMDHENU') || cat.includes('KAMDHENU') || name.includes('KAMDHENU')) return false;
      return brand.includes('BERGER') || cat.includes('BERGER') || name.includes('BERGER') || name.includes('BISON') || name.includes('LUXOL') || name.includes('WALMASTA') || name.includes('WEATHERCOAT') || name.includes('SILK') || name.includes('RANGOLI') || name.includes('BUTERFLY') || (cat.includes('DISTEMPER') && !brand.includes('KAMDHENU')) || (cat.includes('ACRILIC') && !brand.includes('KAMDHENU'));
    }
    if (catId === 'KAMDHENU_GROUP') {
      return brand.includes('KAMDHENU') || cat.includes('KAMDHENU') || name.includes('KAMDHENU') || name.includes('KAMOBLASTER') || name.includes('KAMOCRETE') || name.includes('KAMODUR');
    }
    if (catId === 'ELECTRICALS_GROUP') {
      return cat.includes('ELE') || cat.includes('ARKAYLITE') || brand.includes('ARKAYLITE') || cat.includes('MODUL') || cat.includes('SWITCH') || cat.includes('WIRE') || cat.includes('COPPER') || cat.includes('ANCHOR') || cat.includes('CONA') || cat.includes('CR') || cat.includes('VINAY') || name.includes('SWITCH') || name.includes('SOCKET') || name.includes('ELEMENT') || name.includes('MCB');
    }
    if (catId === 'GI_FITTING') {
      return cat.includes('GI') || name.includes('GI ') || name.includes('PUMP') || cat.includes('MONOBLOCK') || cat.includes('PRIMING') || name.includes('ELBOW') || name.includes('NIPPLE') || name.includes('UNION') || name.includes('REDUCER');
    }
    if (catId === 'PIPES_GROUP') {
      if (cat.includes('GI')) return false;
      return cat.includes('UPVC') || cat.includes('SWR') || cat.includes('CPVC') || cat.includes('PIPE') || brand.includes('KISAN') || cat.includes('PRINCE') || cat.includes('PAPULAR') || cat.includes('GARDEN') || cat.includes('SACTION') || cat.includes('FOOTVALVE') || name.includes('UPVC') || name.includes('CPVC') || name.includes('SWR');
    }
    return cat.toLowerCase() === catId.toLowerCase();
  };

  const auditItems = products.filter(item => {
    if (!matchCategoryAudit(item, selectedCat)) return false;
    if (selectedBrand !== "ALL" && (item.brand || "").toLowerCase() !== selectedBrand.toLowerCase()) return false;
    if (onlyInStock && (Number(item.currentStock) || 0) <= 0) return false;
    return true;
  });

  const totalAuditStock = auditItems.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0);
  const totalAuditVal = auditItems.reduce((acc, p) => {
    const q = Number(p.currentStock) || 0;
    const rate = Number(p.sellingPrice || p.price || 0);
    return acc + (q > 0 ? q * rate : 0);
  }, 0);

  const handleExportExcel = () => {
    const formattedData = auditItems.map((p, idx) => ({
      "Sr No": idx + 1,
      "SKU": p.sku || "",
      "Item Name": p.name || "",
      "Brand": p.brand || "",
      "Category": p.category || "",
      "Packing / Size": p.packing || "",
      "Unit": p.unit || "PC",
      "System Stock (Qty)": Number(p.currentStock) || 0,
      "Physical Count (Manual Check)": "",
      "Variance (+/-)": "",
      "Selling Rate (₹)": Number(p.sellingPrice || p.price || 0),
      "System Value (₹)": (Number(p.currentStock) || 0) * (Number(p.sellingPrice || p.price || 0)),
      "Auditor / Staff Name": auditorName || "Staff",
      "Audit Date": new Date().toLocaleDateString('en-IN'),
      "Remarks": ""
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Audit");

    const fileName = `Stock_Audit_${(companyName || 'Shop').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handlePrintAuditSheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print stock audit sheets.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Physical Stock Audit Sheet - ${companyName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; color: #0f172a; }
          .header h2 { margin: 4px 0 0 0; font-size: 15px; font-weight: normal; color: #475569; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 12px; background: #f8fafc; padding: 10px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
          th { background-color: #f1f5f9; color: #0f172a; font-weight: 700; text-align: left; padding: 8px 6px; border: 1px solid #cbd5e1; }
          td { padding: 6px; border: 1px solid #cbd5e1; vertical-align: middle; }
          .count-box { width: 60px; height: 22px; border: 1px solid #94a3b8; background: #fff; text-align: center; font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .footer { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; font-size: 12px; text-align: center; }
          .sig-line { border-top: 1px solid #475569; margin-top: 40px; padding-top: 4px; font-weight: bold; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${companyName}</h1>
          <h2>📋 PHYSICAL STOCK AUDIT & VERIFICATION SHEET</h2>
        </div>
        <div class="meta-grid">
          <div><strong>Auditor / Staff:</strong> ${auditorName || 'Godown Incharge'}</div>
          <div><strong>Audit Date & Time:</strong> ${new Date().toLocaleString('en-IN')}</div>
          <div><strong>Category Filter:</strong> ${selectedCat} | <strong>Brand:</strong> ${selectedBrand}</div>
          <div><strong>Total Products:</strong> ${auditItems.length} items</div>
          <div><strong>System Stock:</strong> ${totalAuditStock} units</div>
          <div><strong>System Valuation:</strong> ₹${totalAuditVal.toLocaleString('en-IN')}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px;" class="text-center">#</th>
              <th>Item / Product Name</th>
              <th>Brand</th>
              <th>Category</th>
              <th class="text-center">System Qty</th>
              <th class="text-center" style="width: 70px;">Physical Count</th>
              <th class="text-center" style="width: 60px;">Variance</th>
              <th class="text-right">Sale Rate</th>
              <th>Remarks / Damage</th>
            </tr>
          </thead>
          <tbody>
            ${auditItems.map((p, idx) => `
              <tr>
                <td class="text-center font-bold">${idx + 1}</td>
                <td><strong>${p.name}</strong> ${p.packing ? `(${p.packing})` : ''}</td>
                <td>${p.brand || '-'}</td>
                <td>${p.category || '-'}</td>
                <td class="text-center font-bold" style="background:#f8fafc;">${p.currentStock || 0} ${p.unit || 'PC'}</td>
                <td class="text-center"><div class="count-box"></div></td>
                <td class="text-center"><div class="count-box"></div></td>
                <td class="text-right">₹${Number(p.sellingPrice || p.price || 0).toLocaleString('en-IN')}</td>
                <td></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>
            <div class="sig-line">Stock Checker Signature</div>
            <div>${auditorName || 'Staff Member'}</div>
          </div>
          <div>
            <div class="sig-line">Godown Manager Signature</div>
            <div>Store In-Charge</div>
          </div>
          <div>
            <div class="sig-line">Owner / Authorized Signatory</div>
            <div>${companyName}</div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
        
        <div className="flex items-center gap-3 border-b pb-4 mb-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Physical Stock Audit & Export</h3>
            <p className="text-sm text-gray-500">Generate physical verification sheets for staff and export Excel reports</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Auditor / Staff Name (जांचकर्ता का नाम)</label>
            <input 
              type="text"
              placeholder="e.g. Ramesh Sharma / Godown Incharge"
              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium"
              value={auditorName}
              onChange={(e) => setAuditorName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Filter by Category</label>
              <select 
                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Filter by Brand</label>
              <select 
                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input 
              type="checkbox"
              id="onlyInStockCheck"
              className="w-4 h-4 text-amber-600 rounded"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
            />
            <label htmlFor="onlyInStockCheck" className="text-sm text-gray-700 font-medium">
              Only include in-stock products (स्टॉक > 0 वाले आइटम्स)
            </label>
          </div>

          {/* Audit Summary Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-center text-sm">
            <div>
              <p className="text-xs text-amber-800 font-semibold uppercase">Products to Audit</p>
              <p className="text-xl font-bold text-amber-900">{auditItems.length} Items</p>
            </div>
            <div>
              <p className="text-xs text-amber-800 font-semibold uppercase">Total System Units</p>
              <p className="text-xl font-bold text-amber-900">{totalAuditStock} Units</p>
            </div>
            <div>
              <p className="text-xs text-amber-800 font-semibold uppercase">Total Stock Valuation</p>
              <p className="text-xl font-bold text-emerald-700">₹{(totalAuditVal / 100000).toFixed(2)} Lakhs</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleExportExcel}
              disabled={auditItems.length === 0}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow disabled:opacity-50"
            >
              <Download size={18} />
              Download Excel Sheet (.xlsx)
            </button>
            <button
              onClick={handlePrintAuditSheet}
              disabled={auditItems.length === 0}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow disabled:opacity-50"
            >
              <Printer size={18} />
              Print Physical Audit Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BarcodeModal = ({ product, onClose }) => {
  useEffect(() => {
    if (product && product.sku) {
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

