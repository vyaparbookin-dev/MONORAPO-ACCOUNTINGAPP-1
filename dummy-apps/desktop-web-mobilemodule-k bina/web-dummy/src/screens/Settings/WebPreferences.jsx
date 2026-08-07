import React, { useState } from 'react';

const WebPreferencesPage = () => {
  const [preferences, setPreferences] = useState({
    cookies: 'essential',
    localStorage: true,
    autoSignIn: false,
  });

  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveChanges = () => {
    // Logic to save web preferences
    alert('Web preferences saved!');
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Web Preferences</h2>

      {/* Cookie Preferences */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Cookie Settings</h3>
        <p className="text-gray-600 mb-2">
          Select which cookies you want to enable.
        </p>
        <select
          name="cookies"
          value={preferences.cookies}
          onChange={handlePreferenceChange}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="essential">Essential Cookies Only</option>
          <option value="analytics">Essential & Analytics Cookies</option>
          <option value="all">All Cookies</option>
        </select>
      </div>

      {/* Local Storage Preferences */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Local Storage</h3>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="localStorage"
            checked={preferences.localStorage}
            onChange={handlePreferenceChange}
            className="mr-2"
          />
          <span>Enable local storage for faster experience</span>
        </label>
      </div>

      {/* Auto Sign-In */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Auto Sign-In</h3>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="autoSignIn"
            checked={preferences.autoSignIn}
            onChange={handlePreferenceChange}
            className="mr-2"
          />
          <span>Keep me signed in on this device</span>
        </label>
      </div>

      <button
        onClick={handleSaveChanges}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Save Preferences
      </button>
    </div>
  );
};

export default WebPreferencesPage;
