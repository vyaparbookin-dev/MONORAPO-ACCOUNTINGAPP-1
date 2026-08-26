import React, { useState, useEffect } from 'react';
import { User, KeyRound, Shield, CheckCircle, AlertCircle, Eye, EyeOff, Save } from 'lucide-react';
import api from '../../services/api';

const ProfilePage = () => {
  const [user, setUser] = useState({ name: '', email: '', role: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          name: parsed.name || '',
          email: parsed.email || '',
          role: parsed.role || 'admin'
        });
      } catch (e) {}
    }
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });

    if (!newPassword || newPassword.length < 4) {
      setStatusMsg({ type: 'error', text: 'नया Password कम से कम 4 अक्षरों का होना चाहिए।' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'नया Password और Confirm Password मैच नहीं कर रहे हैं।' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });

      setStatusMsg({
        type: 'success',
        text: res?.data?.message || res?.message || 'Password सफलतापूर्वक बदल गया है!'
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password Change Error:', err);
      setStatusMsg({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Password बदलने में त्रुटि आई।'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-bold border border-white/30">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name || 'User Profile'}</h1>
            <p className="text-blue-100 text-sm">{user.email}</p>
            <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/40 border border-blue-300/30 uppercase tracking-wider">
              Role: {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMsg.text && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle className="text-emerald-600 shrink-0" size={20} />
          ) : (
            <AlertCircle className="text-rose-600 shrink-0" size={20} />
          )}
          <p className="text-sm font-medium">{statusMsg.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <User className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">खाता विवरण (Account Info)</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">पूरा नाम (Full Name)</label>
            <input
              type="text"
              value={user.name}
              disabled
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">ईमेल पता (Email)</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">अधिकार (Role)</label>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-800 font-bold text-sm">
              <Shield size={16} className="text-blue-600" />
              <span className="capitalize">{user.role} (पूर्ण नियंत्रण / Full Access)</span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <KeyRound className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">पासवर्ड बदलें (Change Password)</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                वर्तमान पासवर्ड (Current Password)
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="पुराना Password डालें (Default: 123456)"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                नया पासवर्ड (New Password)
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="कम से कम 4 अक्षरों का नया password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                पासवर्ड की पुष्टि (Confirm New Password)
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="नया password दोबारा डालें"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-md hover:from-indigo-700 hover:to-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'अपडेट हो रहा है...' : 'पासवर्ड सेव करें (Update Password)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
