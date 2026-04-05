import React, { useState, useEffect } from 'react';
import { useCompany } from "../../contexts/CompanyContext";
import api from "../../services/api";
import { dbService } from "../../services/dbService";
import { auditService } from "../../services/auditService";
import { syncQueue } from "@repo/shared";
import { useNavigate } from "react-router-dom";

const AppSettingPage = () => {
  const { selectedCompany, refetchCompanies } = useCompany();
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [invoiceThemeColor, setInvoiceThemeColor] = useState('#007bff'); // Default blue
  const [invoiceTemplateType, setInvoiceTemplateType] = useState('classic'); // Default classic
  const [plan, setPlan] = useState('free');
  const [freeBillCount, setFreeBillCount] = useState(0);
  const [maxFreeBills, setMaxFreeBills] = useState(50);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState(null);
  const [enableGst, setEnableGst] = useState(true);
  const [showGstModal, setShowGstModal] = useState(false);
  const [gstActionPreference, setGstActionPreference] = useState(null);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });
  
  // WhatsApp States
  const [waStatus, setWaStatus] = useState('disconnected');
  const [waQrCode, setWaQrCode] = useState('');

  useEffect(() => {
    if (selectedCompany?.logo) {
      setLogoPreview(selectedCompany.logo);
    }
    setInvoiceThemeColor(selectedCompany?.invoiceThemeColor || '#007bff');
    setInvoiceTemplateType(selectedCompany?.invoiceTemplateType || 'classic');
    setPlan(selectedCompany?.plan || 'free');
    setFreeBillCount(selectedCompany?.freeBillCount || 0);
    setMaxFreeBills(selectedCompany?.maxFreeBills || 50);
    setEnableGst(
      selectedCompany?.enableGst === true || 
      String(selectedCompany?.enableGst).toLowerCase() === "true"
    );
    setSubscriptionExpiresAt(selectedCompany?.subscriptionExpiresAt ? new Date(selectedCompany.subscriptionExpiresAt) : null);

    // WhatsApp Status Setup (Listens to Electron Main Process)
    if (window.electron && window.electron.whatsapp) {
      window.electron.whatsapp.getStatus().then(setWaStatus);
      window.electron.whatsapp.onStatusChange((status, data) => {
        setWaStatus(status);
        if (status === 'qr') setWaQrCode(data); // data will be base64 image URL of QR
      });
    }
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

  const handleGstToggleChange = (e) => {
    const isChecked = e.target.checked;
    if (!isChecked) {
      setShowGstModal(true);
    } else {
      setEnableGst(true);
      setGstActionPreference(null);
    }
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
      const payload = { logo: logoPreview, theme, notifications, invoiceThemeColor, invoiceTemplateType, enableGst, gstActionPreference };
      const syncPayload = { logo: logoPreview, invoiceThemeColor, invoiceTemplateType, enableGst, gstActionPreference };
      
      // 1. Save Locally
      if (dbService.updateCompany) await dbService.updateCompany(selectedCompany._id, payload);
      
      // 2. Audit & Sync
      await auditService.logAction('UPDATE', 'company_settings', { _id: selectedCompany._id }, { logo: logoPreview ? 'Updated' : 'Unchanged', theme, invoiceThemeColor, invoiceTemplateType, enableGst });
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

  const handleLinkWhatsapp = () => {
    if (!window.electron?.whatsapp) {
      alert("WhatsApp background integration requires the Electron Main Process to be configured.");
      return;
    }
    setWaStatus('initializing');
    window.electron.whatsapp.link();
  };

  const handleUnlinkWhatsapp = () => {
    if (window.electron?.whatsapp) {
      window.electron.whatsapp.unlink();
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

      {/* WhatsApp Auto-Send Integration */}
      <div className="mb-6 border-b pb-6">
        <h3 className="text-lg font-semibold mb-2">WhatsApp Auto-Send (Vyapar Style)</h3>
        <p className="text-gray-600 mb-4 text-sm">Link your WhatsApp to send bills automatically in the background without opening the app.</p>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">Status: 
              <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                waStatus === 'connected' ? 'bg-green-100 text-green-700' :
                waStatus === 'qr' ? 'bg-yellow-100 text-yellow-700' :
                waStatus === 'initializing' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-200 text-gray-700'
              }`}>
                {waStatus.toUpperCase()}
              </span>
            </span>
            
            {waStatus === 'connected' ? (
              <button onClick={handleUnlinkWhatsapp} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-medium border border-red-200">
                Unlink WhatsApp
              </button>
            ) : (
              <button onClick={handleLinkWhatsapp} disabled={waStatus === 'initializing'} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50">
                {waStatus === 'initializing' ? 'Loading QR...' : 'Link WhatsApp'}
              </button>
            )}
          </div>
          
          {waStatus === 'qr' && waQrCode && (
            <div className="mt-4 p-4 bg-white border rounded-lg flex flex-col items-center">
              <p className="text-sm text-gray-600 mb-3 font-semibold">Scan this QR code using your WhatsApp (Linked Devices)</p>
              <img src={waQrCode} alt="WhatsApp QR Code" className="w-48 h-48 border p-2 rounded-lg shadow-sm" />
            </div>
          )}
        </div>
      </div>

      {/* Inventory Management Settings */}
      <div className="mb-6 border-b pb-6">
        <h3 className="text-lg font-semibold mb-2">Inventory Fields (Categories & Brands)</h3>
        <p className="text-gray-600 mb-4 text-sm">Manage your product Categories, Sub-Categories, Brands (Companies), and Units.</p>
        <button 
          onClick={() => navigate('/inventory/categories')}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition shadow-sm"
        >
          Manage Categories, Brands & Units
        </button>
      </div>

      {/* Tax & Compliance Settings */}
      <div className="mb-6 border-b pb-6">
        <h3 className="text-lg font-semibold mb-2">Tax & Compliance</h3>
        <p className="text-gray-600 mb-4 text-sm">Turn off GST if your business issues non-taxable (kacha) bills or estimates.</p>
        <label className="flex items-center cursor-pointer p-4 bg-gray-50 border rounded-lg hover:bg-gray-100 transition">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={enableGst} onChange={handleGstToggleChange} />
            <div className={`block w-10 h-6 rounded-full transition ${enableGst ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${enableGst ? 'translate-x-4' : ''}`}></div>
          </div>
          <span className="ml-3 font-medium text-gray-700">{enableGst ? 'GST Enabled (Pakka Bill)' : 'GST Disabled (Estimate / Kacha Bill)'}</span>
        </label>
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

      {/* GST Disable Preference Modal */}
      {showGstModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Disable GST Settings</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Aap GST band kar rahe hain. Aapke sabhi products ke existing rates ka kya karna hai?
            </p>
            <div className="space-y-4">
              <button
                onClick={() => { setGstActionPreference('keep_final'); setEnableGst(false); setShowGstModal(false); }}
                className="w-full text-left p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
              >
                <p className="font-bold text-gray-800 text-sm">1. Keep Final Rate (Recommended)</p>
                <p className="text-xs text-gray-500 mt-1 mb-2">Aapka final selling price (With GST) ab naya base price ban jayega.</p>
                <p className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block">Example: GST ke sath ₹100 ka tha, toh GST hatne ke baad rate ₹100 hi rahega.</p>
              </button>
              <button
                onClick={() => { setGstActionPreference('keep_base'); setEnableGst(false); setShowGstModal(false); }}
                className="w-full text-left p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
              >
                <p className="font-bold text-gray-800 text-sm">2. Keep Base Rate</p>
                <p className="text-xs text-gray-500 mt-1 mb-2">GST hat jayega aur purana base price hi naya rate ban jayega.</p>
                <p className="text-xs font-mono bg-gray-200 text-gray-800 px-2 py-1 rounded inline-block">Example: Base ₹82 + 18% GST = ₹100 tha, toh ab rate ₹82 ho jayega.</p>
              </button>
            </div>
            <button onClick={() => setShowGstModal(false)} className="mt-6 w-full py-2 text-gray-500 hover:bg-gray-100 font-medium rounded-lg transition">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppSettingPage;
