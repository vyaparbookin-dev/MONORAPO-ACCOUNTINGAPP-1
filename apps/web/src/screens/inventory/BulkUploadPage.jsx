import React, { useState } from "react";
import * as XLSX from "xlsx";
import api from "../../services/api";
import { Upload, Download, ArrowRight, Settings2, FileSpreadsheet, CheckCircle, AlertCircle, History, Undo2, X, Trash2 } from "lucide-react";

const SYSTEM_FIELDS = [
  { key: "name", label: "Item Name (*Required)" },
  { key: "sku", label: "Item Code / SKU" },
  { key: "barcode", label: "Barcode" },
  { key: "category", label: "Category / Group" },
  { key: "subCategory", label: "Sub Category" },
  { key: "brand", label: "Company / Brand" },
  { key: "hsnCode", label: "HSN Code" },
  { key: "unit", label: "Unit (e.g. PCS)" },
  { key: "secondaryUnit", label: "Unit-2 (Alt Unit)" },
  { key: "conversionRate", label: "Conversion Rate" },
  { key: "costPrice", label: "Cost Price / DPL" },
  { key: "sellingPrice", label: "Rate 1 (Selling Price)" },
  { key: "wholesalePrice", label: "Rate 2 (Wholesale)" },
  { key: "dealerPrice", label: "Rate 3 (Dealer)" },
  { key: "mrp", label: "MRP" },
  { key: "gstRate", label: "GST %" },
  { key: "currentStock", label: "Opening Stock" },
  { key: "minimumStock", label: "Min Quantity" },
  { key: "maximumStock", label: "Max Quantity" }
];

export default function BulkUploadPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
        const actualData = rawData.slice(1); // Data starting from Row 2
        
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
            const hText = String(excelHeaders[col]).toLowerCase();
            return hText.includes(field.key.toLowerCase()) || 
            (field.key === 'category' && hText.includes('group')) ||
            (field.key === 'costPrice' && hText.includes('dpl')) ||
            (field.key === 'sellingPrice' && hText.includes('rate 1')) ||
            (field.key === 'currentStock' && hText.includes('opening')) ||
            (field.key === 'packing' && hText.includes('pack')) ||
            (field.key === 'name' && hText.includes('item'));
          });
          if (matchedCol) initialMapping[field.key] = matchedCol;
        });
        
        setMapping(initialMapping);
        setStep(2);
      } else {
        setMessage({ type: "error", text: "No data found in the Excel file!" });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    if (data.length === 0) return;
    setUploading(true);
    try {
      // Backend API endpoint for bulk upload
      const res = await api.post("/inventory/import", { products: data, mapping });
      setMessage({ type: "success", text: res.data?.message || `Successfully processed ${data.length} products!` });
      setStep(1);
      setData([]);
      setMapping({});
    } catch (err) {
      setMessage({ type: "error", text: "Upload failed. Please check the file format." });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [{
      "item-code": "ITM-001", "item name": "Example Product", "barcode": "890123456789", "group": "Electronics",
      "company": "Samsung", "hsn code": "8517", "unit": "pcs", "unit-2": "box", "conversionunit -1": 10,
      "costPrice": 1000, "rate 1": 1500, "rate 2": 1400, "rate 3": 1350, "mrp": 1999, "gst": 18,
      "opening stock": 50, "miniqua": 5, "max.qua": 100
    }];
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
        <div className="bg-white p-12 rounded-xl shadow-sm border-2 border-dashed border-gray-300 text-center">
          <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" id="fileUpload" />
          <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center justify-center gap-4">
            <div className="bg-blue-50 p-4 rounded-full">
              <Upload size={40} className="text-blue-600" />
            </div>
            <p className="text-lg font-semibold text-gray-700">Click to select CSV or Excel file</p>
            <p className="text-sm text-gray-500">We will let you map the columns manually in the next step.</p>
          </label>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
            <Settings2 className="text-blue-600" size={20} />
            <h3 className="font-bold text-gray-800">Map Your Columns</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-6">Please match your Excel column names to our System fields. Skip the ones you don't have.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 mb-6">
              {SYSTEM_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-100">
                  <label className="text-sm font-medium text-gray-700 w-1/2">{field.label}</label>
                  <select className="w-1/2 border p-2 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={mapping[field.key] || ""} onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}>
                    <option value="">-- Skip / Not Available --</option>
                    {headers.map(h => <option key={h.key} value={h.key}>{h.label} {h.sample ? `(Ex: ${h.sample})` : ''}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Data Preview */}
            <div className="mt-6 border-t pt-4">
              <h4 className="font-bold text-gray-800 mb-3">Data Preview (First 5 Rows)</h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>{SYSTEM_FIELDS.filter(f => mapping[f.key]).map(field => <th key={field.key} className="p-2 font-semibold text-gray-600 text-left whitespace-nowrap">{field.label.replace(' (*Required)', '')}</th>)}</tr>
                  </thead>
                  <tbody className="bg-white">
                    {data.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b last:border-0">
                        {SYSTEM_FIELDS.filter(f => mapping[f.key]).map(field => <td key={field.key} className="p-2 text-gray-700 whitespace-nowrap">{String(row[mapping[field.key]] ?? '')}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center border-t pt-4 mt-6">
              <button onClick={() => { 
                setStep(1); 
                setFile(null);
                if (document.getElementById('fileUpload')) document.getElementById('fileUpload').value = null; 
              }} className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium">Cancel & Back</button>
              <button onClick={handleUpload} disabled={uploading} className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:bg-gray-400">
                {uploading ? "Importing..." : "Confirm & Import Data"} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
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
}