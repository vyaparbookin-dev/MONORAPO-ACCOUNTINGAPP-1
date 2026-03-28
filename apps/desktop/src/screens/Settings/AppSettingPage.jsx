import React, { useState, useEffect } from 'react';
import { useCompany } from "../../contexts/CompanyContext";
import api from "../../services/api";
import { dbService } from "../../services/dbService";
import { auditService } from "../../services/auditService";
import { syncQueue } from "@repo/shared";

const AppSettingPage = () => {
  const { selectedCompany, refetchCompanies } = useCompany();
  const [theme, setTheme] = useState('light');
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [invoiceThemeColor, setInvoiceThemeColor] = useState('#007bff'); // Default blue
  const [invoiceTemplateType, setInvoiceTemplateType] = useState('classic'); // Default classic
  const [plan, setPlan] = useState('free');
  const [freeBillCount, setFreeBillCount] = useState(0);
  const [maxFreeBills, setMaxFreeBills] = useState(50);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState(null);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });

  useEffect(() => {
    if (selectedCompany?.logo) {
      setLogoPreview(selectedCompany.logo);
    }
    setInvoiceThemeColor(selectedCompany?.invoiceThemeColor || '#007bff');
    setInvoiceTemplateType(selectedCompany?.invoiceTemplateType || 'classic');
    setPlan(selectedCompany?.plan || 'free');
    setFreeBillCount(selectedCompany?.freeBillCount || 0);
    setMaxFreeBills(selectedCompany?.maxFreeBills || 50);
    setSubscriptionExpiresAt(selectedCompany?.subscriptionExpiresAt ? new Date(selectedCompany.subscriptionExpiresAt) : null);
  }, [selectedCompany]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("File size should be less than 2MB");
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications((prev) => ({ ...prev, [name]: checked }));
  };

  const handleInvoiceThemeColorChange = (e) => {
    setInvoiceThemeColor(e.target.value);
  };

  const handleInvoiceTemplateTypeChange = (e) => {
    setInvoiceTemplateType(e.target.value);
  };

  const handleSaveChanges = async () => {
    if (!selectedCompany) return alert("No company selected.");
    setSaving(true);
    try {
      // Payload for local DB and sync queue
      const payload = { logo: logoPreview, theme, notifications, invoiceThemeColor, invoiceTemplateType };
      const syncPayload = { logo: logoPreview, invoiceThemeColor, invoiceTemplateType };
      
      // 1. Save Locally
      if (dbService.updateCompany) await dbService.updateCompany(selectedCompany._id, payload);
      
      // 2. Audit & Sync
      await auditService.logAction('UPDATE', 'company_settings', { _id: selectedCompany._id }, { logo: logoPreview ? 'Updated' : 'Unchanged', theme, invoiceThemeColor, invoiceTemplateType });
      await syncQueue.enqueue({ entityId: selectedCompany._id, entity: 'company', method: 'PUT', url: `/api/company/${selectedCompany._id}`, data: syncPayload });

      alert("Settings saved successfully!");
      refetchCompanies();
    } catch (error) {
      console.error(error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">App Settings</h2>

      {/* Company Logo Settings */}
      <div className="mb-6 border-b pb-6">
        <h3 className="text-lg font-semibold mb-2">Company Logo</h3>
        <p className="text-gray-600 mb-4 text-sm">Upload your company logo to display on PDF Invoices.</p>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs text-gray-400 text-center px-2">No Logo</span>
            )}
          </div>
          <div>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            <p className="text-xs text-gray-500 mt-2">Recommended: Square image, max 2MB.</p>
          </div>
        </div>
      </div>

      {/* Invoice Customization Settings */}
      <div className="mb-6 border-b pb-6">
        <h3 className="text-lg font-semibold mb-2">Invoice Customization</h3>
        <p className="text-gray-600 mb-4 text-sm">Customize the look and feel of your PDF invoices.</p>
        
        <div className="mb-4">
          <label htmlFor="invoiceThemeColor" className="block text-sm font-medium text-gray-700 mb-2">Theme Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="invoiceThemeColor"
              name="invoiceThemeColor"
              value={invoiceThemeColor}
              onChange={handleInvoiceThemeColorChange}
              className="w-10 h-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
            />
            <span className="text-gray-700">{invoiceThemeColor}</span>
          </div>
        </div>

        <div>
          <label htmlFor="invoiceTemplateType" className="block text-sm font-medium text-gray-700 mb-2">Invoice Template</label>
          <select
            id="invoiceTemplateType"
            name="invoiceTemplateType"
            value={invoiceTemplateType}
            onChange={handleInvoiceTemplateTypeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
      </div>

      {/* Subscription & Plan Settings */}
      <div className="mb-6 border-b pb-6">
        <h3 className="text-lg font-semibold mb-2">Subscription & Plan</h3>
        <p className="text-gray-600 mb-4 text-sm">Manage your current plan and upgrade for more features.</p>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Current Plan:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${plan === 'premium' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {plan.toUpperCase()}
            </span>
          </div>
          {plan === 'free' && (
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Bills Created:</span>
              <span className="ml-2 text-gray-800">{freeBillCount} / {maxFreeBills}</span>
              {freeBillCount >= maxFreeBills && (
                <p className="text-red-600 text-xs mt-1 font-semibold">Free bill limit reached! Upgrade to continue creating bills.</p>
              )}
            </div>
          )}
          {plan === 'premium' && subscriptionExpiresAt && (
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">Expires On:</span>
              <span className="ml-2 text-gray-800">{subscriptionExpiresAt.toLocaleDateString()}</span>
            </div>
          )}
          {plan === 'free' && (
            <button onClick={handleUpgradeToPremium} className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50">
              Upgrade to Premium (₹999/year)
            </button>
          )}
        </div>
      </div>

      {/* Theme Settings */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Theme</h3>
        <div className="flex items-center space-x-4">
          <label>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={handleThemeChange}
              className="mr-2"
            />
            Light
          </label>
          <label>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={handleThemeChange}
              className="mr-2"
            />
            Dark
          </label>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Notifications</h3>
        <div className="flex flex-col space-y-2">
          <label>
            <input
              type="checkbox"
              name="email"
              checked={notifications.email}
              onChange={handleNotificationChange}
              className="mr-2"
            />
            Email Notifications
          </label>
          <label>
            <input
              type="checkbox"
              name="sms"
              checked={notifications.sms}
              onChange={handleNotificationChange}
              className="mr-2"
            />
            SMS Notifications
          </label>
          <label>
            <input
              type="checkbox"
              name="push"
              checked={notifications.push}
              onChange={handleNotificationChange}
              className="mr-2"
            />
            Push Notifications
          </label>
        </div>
      </div>

      <button onClick={handleSaveChanges} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
};

export default AppSettingPage;
