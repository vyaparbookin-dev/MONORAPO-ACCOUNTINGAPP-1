import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Save, AlertCircle } from 'lucide-react';

export default function WhatsappSettingsPage() {
  const [settings, setSettings] = useState({
    enabled: false,
    apiKey: '',
    apiUrl: '',
    senderId: '',
    template: 'Hello {customerName}, your invoice {billNumber} for Rs. {amount} is ready. Thank you for your business, {companyName}.'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch existing settings
    api.get('/settings/whatsapp')
      .then(res => {
        if (res.data?.settings) {
          setSettings(prev => ({ ...prev, ...res.data.settings }));
        }
      })
      .catch(err => console.error("Could not load settings", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/settings/whatsapp', { settings });
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Error saving settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="p-6 text-center">Loading settings...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-2">WhatsApp Automation Settings</h2>
      <p className="text-gray-600 mb-6">Configure your own WhatsApp Business API to send messages automatically.</p>

      <div className="space-y-6">
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
          <label htmlFor="whatsapp-enabled" className="font-semibold text-gray-800">
            Enable Automatic WhatsApp on Bill Save
          </label>
          <input 
            type="checkbox" 
            id="whatsapp-enabled"
            className="toggle toggle-primary"
            checked={settings.enabled}
            onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
          />
        </div>

        {settings.enabled && (
          <div className="space-y-4 border-t pt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint URL</label>
              <input type="url" name="apiUrl" value={settings.apiUrl} onChange={handleInputChange} className="w-full border p-2 rounded-lg" placeholder="e.g., https://api.yourprovider.com/v1/messages" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key / Auth Token</label>
              <input type="password" name="apiKey" value={settings.apiKey} onChange={handleInputChange} className="w-full border p-2 rounded-lg" placeholder="Enter your secret API key" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID / Number</label>
              <input type="text" name="senderId" value={settings.senderId} onChange={handleInputChange} className="w-full border p-2 rounded-lg" placeholder="e.g., 91xxxxxxxxxx or your Sender ID" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Template</label>
              <textarea name="template" value={settings.template} onChange={handleInputChange} className="w-full border p-2 rounded-lg font-mono text-sm" rows="4" />
              <div className="mt-2 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  Use variables: <code className="font-bold">{'{customerName}'}</code>, <code className="font-bold">{'{billNumber}'}</code>, <code className="font-bold">{'{amount}'}</code>, <code className="font-bold">{'{companyName}'}</code>. They will be replaced automatically.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end border-t pt-4">
          <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md inline-flex items-center gap-2 disabled:bg-gray-400">
            <Save size={18} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}