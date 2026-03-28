import React, { useState } from "react";
import api from "../../services/api";

export default function KeyRecoveryPage() {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState("");

  const handleRecover = async () => {
    try {
      const res = await api.post("/api/security/recover-key", { key });
      setStatus(res.message || "Key verified successfully!");
    } catch (err) {
      setStatus("Invalid or expired key.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="bg-white p-6 rounded-xl shadow w-96">
        <h2 className="text-xl mb-4 text-center font-bold">Recover Access Key</h2>
        <input
          type="text"
          placeholder="Enter your recovery key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="border w-full p-2 mb-4 rounded"
        />
        <button onClick={handleRecover} className="bg-green-600 text-white w-full py-2 rounded">
          Verify Key
        </button>
        {status && <p className="mt-4 text-center text-sm">{status}</p>}
      </div>
    </div>
  );
}