import React, { useRef } from "react";
import api from "../../services/api";

export default function ImportBillPage({ onImport }) {
  const fileRef = useRef();

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await api.post("/api/billing/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    alert("Bills imported successfully!");
    onImport();
  };

  return (
    <div>
      <button
        onClick={() => fileRef.current.click()}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Import Bills
      </button>
      <input
        type="file"
        ref={fileRef}
        className="hidden"
        onChange={handleImport}
      />
    </div>
  );
}