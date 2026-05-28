import React, { useState } from "react";
import { Upload, Download, ArrowRight, Settings2, FileSpreadsheet } from "lucide-react";
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
  { key: "packing", label: "Packing (e.g. 1x10)" },
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

const BulkProductPage = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [uploading, setUploading] = useState(false);

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
      const parsedData = XLSX.utils.sheet_to_json(ws);
      
      if (parsedData.length > 0) {
        const fileHeaders = Object.keys(parsedData[0]);
        setHeaders(fileHeaders);
        setData(parsedData);
        
        // Smart auto-guess initial mapping
        const initialMapping = {};
        SYSTEM_FIELDS.forEach(field => {
          const matchedHeader = fileHeaders.find(h => 
            h.toLowerCase().includes(field.key.toLowerCase()) || 
            (field.key === 'category' && h.toLowerCase().includes('group')) ||
            (field.key === 'costPrice' && h.toLowerCase().includes('dpl')) ||
            (field.key === 'sellingPrice' && h.toLowerCase().includes('rate 1')) ||
            (field.key === 'currentStock' && h.toLowerCase().includes('opening')) ||
            (field.key === 'packing' && h.toLowerCase().includes('pack')) ||
            (field.key === 'name' && h.toLowerCase().includes('item'))
          );
          if (matchedHeader) initialMapping[field.key] = matchedHeader;
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
      alert(res.data?.message || `Successfully processed ${data.length} products!`);
      setStep(1);
      setFile(null);
      setData([]);
      setMapping({});
    } catch (error) {
      console.error(error);
      alert("Failed to upload products. Please check the file format.");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "item-code": "ITM-001", "item name": "Example Product", "barcode": "890123456789", "packing": "1x10", "group": "Electronics",
        "company": "Samsung", "hsn code": "8517", "unit": "pcs", "unit-2": "box", "conversionunit -1": 10,
        "costPrice": 1000, "rate 1": 1500, "rate 2": 1400, "rate 3": 1350, "mrp": 1999, "gst": 18,
        "opening stock": 50, "miniqua": 5, "max.qua": 100
      }
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
        <button onClick={downloadTemplate} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-semibold">
          <Download size={16} /> Download Template
        </button>
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
            <p className="text-sm text-gray-600 mb-6">
              Please match your Excel column names to our System fields. Skip the ones you don't have.
            </p>
            
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
                      <option key={h} value={h}>{h}</option>
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
    </div>
  );
};

export default BulkProductPage;