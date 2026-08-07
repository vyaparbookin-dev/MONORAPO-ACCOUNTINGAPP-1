import React, { useState, useEffect } from "react";
import api from "../../services/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    name: "",
    gstNumber: "",
    upiId: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        setSettings(res.data || res || {});
      } catch (error) {
        console.error("Failed to load settings", error);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/settings/update", settings);
      setSettings(res.data || res);
      alert("Settings updated successfully!");
    } catch (error) {
      alert("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Company Settings</h2>
      
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
        
        <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
          <label className="block text-sm font-bold text-blue-900 mb-2">Merchant UPI ID (For QR Code Payments)</label>
          <input 
            type="text" 
            name="upiId"
            value={settings.upiId || ""} 
            onChange={handleChange}
            className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g., merchant@sbi or 9876543210@paytm"
          />
          <p className="text-xs text-blue-700 mt-2 font-medium">
            * This UPI ID will be used to generate Dynamic QR codes directly on your invoices.
          </p>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full md:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}