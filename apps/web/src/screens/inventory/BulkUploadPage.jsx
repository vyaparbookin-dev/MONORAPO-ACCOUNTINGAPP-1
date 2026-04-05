import React, { useState } from "react";
import * as XLSX from "xlsx";
import api from "../../services/api";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";

export default function BulkUploadPage() {
  const [data, setData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const parsedData = XLSX.utils.sheet_to_json(ws);
      setData(parsedData);
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    if (data.length === 0) return;
    setUploading(true);
    try {
      // Backend API endpoint for bulk upload
      const res = await api.post("/api/inventory/bulk", { products: data });
      setMessage({ type: "success", text: `Successfully uploaded ${data.length} products!` });
      setData([]);
    } catch (err) {
      setMessage({ type: "error", text: "Upload failed. Please check the file format." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileSpreadsheet className="text-green-600" /> Bulk Product Upload
      </h1>

      <div className="bg-white p-8 rounded-xl shadow-md border border-dashed border-gray-300 text-center">
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          className="hidden"
          id="fileUpload"
        />
        <label
          htmlFor="fileUpload"
          className="cursor-pointer flex flex-col items-center justify-center gap-4"
        >
          <div className="bg-blue-50 p-4 rounded-full">
            <Upload size={32} className="text-blue-600" />
          </div>
          <p className="text-gray-600 font-medium">Click to upload Excel or CSV file</p>
          <p className="text-xs text-gray-400">Columns: Name, Price, SKU, Quantity</p>
        </label>
      </div>

      {data.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Preview ({data.length} items)</h3>
          <div className="bg-gray-50 p-4 rounded border max-h-60 overflow-auto">
            <pre className="text-xs">{JSON.stringify(data.slice(0, 3), null, 2)}...</pre>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            {uploading ? "Uploading..." : "Confirm & Upload to Inventory"}
          </button>
        </div>
      )}

      {message && (
        <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}
    </div>
  );
}