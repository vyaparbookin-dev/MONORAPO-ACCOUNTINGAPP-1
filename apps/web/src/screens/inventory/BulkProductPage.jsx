import React, { useState } from "react";
import { Upload } from "lucide-react";
import api from "../../services/api";

const BulkProductPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post("/inventory/bulk-upload", formData);
      alert("Products uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to upload products.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Bulk Product Upload</h2>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => setFile(e.target.files[0])}
          className="hidden"
          id="bulk-upload"
        />
        <label htmlFor="bulk-upload" className="cursor-pointer flex flex-col items-center">
          <Upload size={48} className="text-gray-400 mb-2" />
          <span className="text-gray-600">Click to upload CSV or Excel</span>
        </label>
        {file && <p className="mt-2 text-sm text-green-600">{file.name}</p>}
      </div>
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {uploading ? "Uploading..." : "Upload Products"}
      </button>
    </div>
  );
};

export default BulkProductPage;