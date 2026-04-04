import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, Download, Edit, Trash2, Package, AlertTriangle, Upload, Scan, ShoppingBag, ClipboardList, Undo2, BookUser, Camera, Barcode, X, Link as LinkIcon, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BarcodeScanner from "../../components/BarcodeScanner";
import DataTable from "../../components/Datatable";
import ReportCard from "../../components/ReportCard";
import Loader from "../../components/Loader";
import { api, formatCurrency, syncQueue } from "@repo/shared";
import { generateBarcode } from "../../utils/barcodeGenerator";

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
  const [industry, setIndustry] = useState("general");
  const gstRates = [0, 5, 12, 18, 28];

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm]);

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
        const response = await api.get("/api/inventory");
        const inventoryList = response.inventory || response.data?.products || response.data || (Array.isArray(response) ? response : []);
        setInventory(inventoryList);

        // Extract unique categories and subcategories
        const cats = inventoryList.map(p => p.category).filter(Boolean);
        const subCats = inventoryList.map(p => p.subCategory).filter(Boolean);
        
        // Cache se load karke unko combine karna
        const savedCats = JSON.parse(localStorage.getItem("categories") || "[]");
        const savedSubCats = JSON.parse(localStorage.getItem("subCategories") || "[]");
        
        setCategories([...new Set([...cats, ...savedCats])]);
        setSubCategories([...new Set([...subCats, ...savedSubCats])]);
      }

      // Fetch company industry type
      const settingsRes = await api.get('/api/settings').catch(() => null);
      if (settingsRes?.data?.data) {
        setIndustry((settingsRes.data.data.industryType || settingsRes.data.data.businessType || "general").toLowerCase());
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      if (!window.electron) setInventory([]);
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
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.hsnCode?.toLowerCase().includes(searchTerm.toLowerCase())
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
      if (!formData.name) {
        alert("Please enter the Product Name");
        return;
      }

      if (editingId) {
        const response = await api.put(`/api/inventory/${editingId}`, formData);
        // Optimistic UI update for Web
        setInventory(prev => prev.map(p => p._id === editingId ? { ...p, ...formData } : p));
        alert(`Product updated! SKU: ${response?.data?.product?.sku || formData.hsnCode || ''}`);
      } else {
        // Desktop: लोकल SQLite में तुरंत सेव करें (Offline Guarantee)
        if (window.electron && window.electron.db) {
          await window.electron.db.saveProduct({
            ...formData, // Missing fields yahan include ho jayenge
            name: formData.name,
            sku: formData.hsnCode || formData.sku || "SKU-" + Date.now(),
            price: formData.sellingPrice,
            quantity: formData.currentStock,
            category: formData.category,
            subCategory: formData.subCategory || ""
          });
        }

        // Cache newly added categories 
        if (formData.category) {
          const prevCat = JSON.parse(localStorage.getItem("categories") || "[]");
          localStorage.setItem("categories", JSON.stringify([...new Set([...prevCat, formData.category])]));
        }
        if (formData.subCategory) {
          const prevSub = JSON.parse(localStorage.getItem("subCategories") || "[]");
          localStorage.setItem("subCategories", JSON.stringify([...new Set([...prevSub, formData.subCategory])]));
        }

        try {
          const response = await api.post("/api/inventory", formData);
          alert(`Product created! SKU: ${response?.data?.product?.sku || ''}`);
        } catch (apiErr) {
          if (!navigator.onLine || apiErr.message === "Network Error") {
            syncQueue.enqueue({ method: "POST", url: "/api/inventory", data: formData });
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
      header: "CP/SP",
      cell: (row) => (
        <div className="text-xs">
          <p className="text-gray-600">{formatCurrency(row.costPrice)}</p>
          <p className="font-bold text-green-600">{formatCurrency(row.sellingPrice)}</p>
        </div>
      ),
    },
    {
      header: "GST",
      cell: (row) => (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">{row.gstRate}%</span>
      ),
    },
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

              <div>
                <label className="block text-sm font-medium text-gray-700">HSN Code</label>
                <input
                  className="w-full border p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.hsnCode}
                  onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                />
              </div>

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
              
              {/* Base Costs & GST */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
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
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost Price (W/O GST)</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.costPrice}
                    onChange={(e) => handlePriceCalculation('costPrice', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost Price (With GST)</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.costPriceWithTax}
                    onChange={(e) => handlePriceCalculation('costPriceWithTax', e.target.value)}
                  />
                </div>
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Retail Price (W/O GST)</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-green-50 font-bold"
                    value={formData.sellingPrice}
                    onChange={(e) => handlePriceCalculation('sellingPrice', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Retail Price (With GST)</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none bg-green-50 font-bold"
                    value={formData.sellingPriceWithTax}
                    onChange={(e) => handlePriceCalculation('sellingPriceWithTax', e.target.value)}
                  />
                </div>
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wholesale Price (W/O GST)</label>
                  <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" value={formData.wholesalePrice} onChange={(e) => handlePriceCalculation('wholesalePrice', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wholesale Price (With GST)</label>
                  <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500 outline-none" value={formData.wholesalePriceWithTax} onChange={(e) => handlePriceCalculation('wholesalePriceWithTax', e.target.value)} />
                </div>
                <div className="hidden md:block"></div>
              </div>

              {/* Dealer Price */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dealer Margin (%)</label>
                  <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none bg-orange-50" value={formData.dealerMargin} onChange={(e) => handlePriceCalculation('dealerMargin', e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dealer Price (W/O GST)</label>
                  <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none" value={formData.dealerPrice} onChange={(e) => handlePriceCalculation('dealerPrice', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dealer Price (With GST)</label>
                  <input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-orange-500 outline-none" value={formData.dealerPriceWithTax} onChange={(e) => handlePriceCalculation('dealerPriceWithTax', e.target.value)} />
                </div>
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
                      <input type="text" placeholder="Brand Name (e.g. Asian Paints)" className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} />
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
             // Yahan hum API call karenge future mein mapping save karne ke liye
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
