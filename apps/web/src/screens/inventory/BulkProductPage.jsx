import React, { useState } from "react";
import { Upload, Download, ArrowRight, Settings2, FileSpreadsheet, History, Undo2, X, Trash2 } from "lucide-react";
import api from "../../services/api";
import * as XLSX from "xlsx";

const SYSTEM_FIELDS = [
  { key: "name", label: "Item Name (*Required)" },
  { key: "sku", label: "Item Code / SKU" },
  { key: "barcode", label: "Barcode" },
  { key: "category", label: "Category / Group" },
  { key: "subCategory", label: "Sub Category" },
  { key: "brand", label: "Company / Brand" },
  { key: "hsnCode", label: "HSN Code" },
  { key: "packing", label: "Packing (e.g. ML, 10x10)" },
  { key: "unit", label: "Unit 1 (e.g. PCS)" },
  { key: "secondaryUnit", label: "Unit 2 (e.g. CRT, BOX)" },
  { key: "conversionRate", label: "Conversion (e.g. 12)" },
  { key: "dpl", label: "DPL (Company Rate)" },
  { key: "costPrice", label: "P.Cost (Without GST)" },
  { key: "costPriceWithTax", label: "P.Cost (With GST)" },
  { key: "sellingPrice", label: "Rate 1 (Selling Price)" },
  { key: "wholesalePrice", label: "Rate 2 (Wholesale)" },
  { key: "dealerPrice", label: "Rate 3 (Dealer)" },
  { key: "mrp", label: "MRP" },
  { key: "discount", label: "Discount %" },
  { key: "secondaryDiscount", label: "Scheme Discount %" },
  { key: "cashDiscount", label: "Cash Discount % (CD)" },
  { key: "gstRate", label: "GST %" },
  { key: "currentStock", label: "Opening Stock" },
  { key: "minimumStock", label: "Min Quantity" },
  { key: "maximumStock", label: "Max Quantity" }
];

const BulkProductPage = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [uploading, setUploading] = useState(false);
  const [warnings, setWarnings] = useState([]);

  const [showUndoModal, setShowUndoModal] = useState(false);
  const [undoTimeframe, setUndoTimeframe] = useState("1");
  const [recentProducts, setRecentProducts] = useState([]);
  const [undoLoading, setUndoLoading] = useState(false);

  const fetchRecentProducts = async (timeframe) => {
    try {
      const res = await api.get('/api/inventory').catch(()=>({data:[]}));
      const allProds = res.data?.products || res.data || [];
      const safeProds = Array.isArray(allProds) ? allProds : [];
      const hours = parseFloat(timeframe);
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      const recent = safeProds.filter(p => p.createdAt && new Date(p.createdAt) >= cutoff);
      setRecentProducts(recent);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmUndo = async () => {
    if (recentProducts.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete these ${recentProducts.length} products?`)) return;
    setUndoLoading(true);
    try {
      for (let i = 0; i < recentProducts.length; i += 20) {
        const chunk = recentProducts.slice(i, i + 20);
        await Promise.all(chunk.map(item => api.delete(`/api/inventory/${item._id}`).catch(() => null)));
      }
      alert(`Successfully deleted ${recentProducts.length} products!`);
      setShowUndoModal(false);
    } catch(err) {
      alert("Error undoing products.");
    } finally {
      setUndoLoading(false);
    }
  };

  const handleFileParse = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      
      // Use header: "A" to force Excel column letters (A, B, C) as keys
      const rawData = XLSX.utils.sheet_to_json(ws, { header: "A", defval: "" });
      
      if (rawData.length > 1) {
        const excelHeaders = rawData[0]; // Row 1 (Headers)
        const firstDataRow = rawData[1]; // Row 2 (Sample Data)
        // Empty rows ko ignore karne ka bulletproof logic
        const actualData = rawData.slice(1).filter(row => Object.values(row).some(val => val !== "")); 
        
        const fileColumns = Object.keys(excelHeaders);
        const enhancedHeaders = fileColumns.map(col => ({
          key: col,
          label: `Col ${col}: ${excelHeaders[col] || 'Empty'}`,
          sample: firstDataRow[col] ? String(firstDataRow[col]).substring(0, 20) : ""
        }));

        setHeaders(enhancedHeaders);
        setData(actualData);

        // Smart auto-guess initial mapping
        const initialMapping = {};
        SYSTEM_FIELDS.forEach(field => {
          const matchedCol = fileColumns.find(col => {
            const hText = String(excelHeaders[col]).toLowerCase().trim();
            
            if (hText === field.key.toLowerCase()) return true;
            if (field.key === 'name' && ((hText.includes('item') && hText.includes('name')) || hText === 'product' || hText === 'product name')) return true;
            if (field.key === 'category' && (hText.includes('category') || hText.includes('group'))) return true;
            if (field.key === 'brand' && (hText.includes('brand') || hText.includes('company') || hText.includes('manufacturer'))) return true;
            if (field.key === 'unit' && (hText.includes('unit') && (!hText.includes('2') && !hText.includes('secondary')) || hText === 'uom')) return true;
            if (field.key === 'mrp' && (hText.includes('mrp') || hText.includes('maximum retail price'))) return true;
            if (field.key === 'gstRate' && (hText.includes('gst') || hText.includes('tax') || hText === 'gst %' || hText === 'gst%')) return true;
            if (field.key === 'costPriceWithTax' && (hText.includes('cost') || hText.includes('landing') || hText.includes('purchase rate')) && (hText.includes('with gst') || hText.includes('inc') || hText.includes('tax') || hText.includes('+'))) return true;
            if (field.key === 'costPrice' && (hText.includes('cost') || hText.includes('p.cost') || hText.includes('landing') || hText.includes('purchase rate') || hText.includes('cost price')) && !hText.includes('with gst') && !hText.includes('inc') && !hText.includes('tax') && !hText.includes('+')) return true;
            if (field.key === 'sellingPrice' && (hText.includes('selling') || hText.includes('rate 1') || hText.includes('sale price') || hText.includes('selling price') || hText === 'rate1' || hText.includes('retail price'))) return true;
            if (field.key === 'wholesalePrice' && (hText.includes('wholesale') || hText.includes('rate 2') || hText === 'rate2')) return true;
            if (field.key === 'dealerPrice' && (hText.includes('dealer') || hText.includes('rate 3') || hText === 'rate3')) return true;
            if (field.key === 'currentStock' && (hText.includes('stock') || hText.includes('opening') || hText.includes('current stock'))) return true;
            if (field.key === 'minimumStock' && (hText.includes('min') || hText.includes('minimum') || hText.includes('safety stock'))) return true;
            if (field.key === 'maximumStock' && (hText.includes('max') || hText.includes('maximum'))) return true;
            if (field.key === 'secondaryUnit' && (hText.includes('unit') && (hText.includes('2') || hText.includes('secondary')) || hText.includes('alt'))) return true;
            if (field.key === 'conversionRate' && (hText.includes('conversion') || hText.includes('conversion rate'))) return true;
            if (field.key === 'hsnCode' && (hText.includes('hsn') || hText.includes('code'))) return true;
            if (field.key === 'sku' && (hText.includes('sku') || hText.includes('code') || hText.includes('item code'))) return true;
            if (field.key === 'barcode' && hText.includes('barcode')) return true;
            if (field.key === 'dpl' && hText.includes('dpl')) return true;
            if (field.key === 'packing' && hText.includes('pack')) return true;
            if (field.key === 'discount' && hText.includes('discount') && !hText.includes('scheme') && !hText.includes('cash') && !hText.includes('cd')) return true;
            if (field.key === 'secondaryDiscount' && (hText.includes('scheme') || hText.includes('secondary') || hText.includes('+'))) return true;
            if (field.key === 'cashDiscount' && (hText.includes('cash') || hText.includes('cd'))) return true;
            return false;
          });
          if (matchedCol) initialMapping[field.key] = matchedCol;
        });
        
        setMapping(initialMapping);
        setStep(2);
      } else {
        alert("No data found in the Excel file!");
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleUpload = async () => {
    if (data.length === 0) return;
    setUploading(true);
    try {
      const res = await api.post("/inventory/import", { products: data, mapping });
      if (res.data?.warnings?.length > 0) setWarnings(res.data.warnings);
      alert(res.data?.message || `Successfully processed ${data.length} products!`);
      setStep(1);
      setFile(null);
      setData([]);
      setMapping({});
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || error.message || "Failed to upload products. Please check the file format.");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {"Item Name": "Example Product", "Item Code": "ITM-001", "Barcode": "890123456789", "Category": "Electronics", "Sub Category": "Accessories",
      "Brand": "Samsung", "HSN Code": "8517", "Packing": "10x10", "Unit": "pcs", "Unit-2": "box", "Conversion Rate": 10, "DPL (Company Rate)": 900,
      "P.Cost (Without GST)": 1000, "P.Cost (With GST)": 1180, "Selling Price": 1500, "Wholesale Price": 1400, "Dealer Price": 1350, "MRP": 1999, "Discount": 5, "Scheme Discount": 2, "Cash Discount": 1, "GST %": 18,
      "Opening Stock": 50, "Minimum Stock": 5, "Maximum Stock": 100}
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Product_Upload_Template.xlsx");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="text-green-600" /> Bulk Product Upload
          </h1>
          <p className="text-sm text-gray-500 mt-1">Upload and map your Excel/CSV data manually.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setShowUndoModal(true); fetchRecentProducts("1"); }} className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg hover:bg-orange-100 text-sm font-semibold border border-orange-200 transition">
            <History size={16} /> Undo Last Upload
          </button>
          <button onClick={downloadTemplate} className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 text-sm font-semibold border border-blue-200 transition">
            <Download size={16} /> Download Template
          </button>
        </div>
      </div>

      {step === 1 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center shadow-sm">
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileParse}
            className="hidden"
            id="bulk-upload"
          />
          <label htmlFor="bulk-upload" className="cursor-pointer flex flex-col items-center">
            <div className="bg-blue-50 p-4 rounded-full mb-4">
              <Upload size={40} className="text-blue-600" />
            </div>
            <span className="text-lg font-semibold text-gray-700">Click to select CSV or Excel file</span>
            <span className="text-sm text-gray-500 mt-2">We will let you map the columns manually in the next step.</span>
          </label>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
            <Settings2 className="text-blue-600" size={20} />
            <h3 className="font-bold text-gray-800">Map Your Columns</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-2">System ne automatically columns match karne ki koshish ki hai.</p>
            <p className="text-sm text-red-600 font-medium mb-6">* Agar koi field galat map hui hai (e.g. Duplicate names ki wajah se), toh aap use Dropdown se manually sahi kar sakte hain.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 mb-6">
              {SYSTEM_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-100">
                  <label className="text-sm font-medium text-gray-700 w-1/2">{field.label}</label>
                  <select
                    className="w-1/2 border p-2 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={mapping[field.key] || ""}
                    onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                  >
                    <option value="">-- Skip / Not Available --</option>
                    {headers.map(h => (
                      <option key={h.key} value={h.key}>{h.label} {h.sample ? `(Ex: ${h.sample})` : ''}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center border-t pt-4 mt-6">
              <button onClick={() => { 
                setStep(1); 
                setFile(null); 
                if (document.getElementById('bulk-upload')) document.getElementById('bulk-upload').value = null; 
              }} className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
                Cancel & Back
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
              >
                {uploading ? "Importing..." : "Confirm & Import Data"} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
            <AlertCircle size={20} /> Upload Report & Auto-Resolved Conflicts ({warnings.length})
          </h4>
          <ul className="list-disc pl-5 text-sm text-yellow-700 max-h-40 overflow-y-auto space-y-1">
            {warnings.map((warn, i) => <li key={i}>{warn}</li>)}
          </ul>
        </div>
      )}

      {/* Undo Modal */}
      {showUndoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden text-left">
            <div className="p-4 border-b flex justify-between items-center bg-orange-50">
              <h3 className="font-bold text-orange-700 flex items-center gap-2"><Undo2 size={20}/> Undo Recent Upload</h3>
              <button onClick={() => setShowUndoModal(false)} className="text-orange-400 hover:text-orange-700"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Select a timeframe to find and delete products that were uploaded by mistake.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
                <select className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-orange-500" value={undoTimeframe} onChange={(e) => { setUndoTimeframe(e.target.value); fetchRecentProducts(e.target.value); }}>
                  <option value="0.25">Last 15 Minutes</option>
                  <option value="1">Last 1 Hour</option>
                  <option value="4">Last 4 Hours</option>
                  <option value="24">Last 24 Hours</option>
                </select>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-800">Found: {recentProducts.length} Products</h4>
                {recentProducts.length > 0 && (
                  <ul className="text-sm text-gray-600 mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {recentProducts.slice(0, 5).map(p => <li key={p._id}>• {p.name} (SKU: {p.sku})</li>)}
                    {recentProducts.length > 5 && <li className="font-medium">... and {recentProducts.length - 5} more</li>}
                  </ul>
                )}
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setShowUndoModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
                <button onClick={handleConfirmUndo} disabled={recentProducts.length === 0 || undoLoading} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {undoLoading ? "Deleting..." : <><Trash2 size={18}/> Delete {recentProducts.length}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkProductPage;