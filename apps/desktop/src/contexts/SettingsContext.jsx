import React, { createContext, useState, useEffect } from 'react';

// SettingsContext object is exported for direct consumption
export const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});

  // You can add logic here to load/save settings from/to local storage or Electron's main process
  useEffect(() => {
    // Example: Load settings on app start
  }, []);

  return <SettingsContext.Provider value={{ settings, setSettings }}>{children}</SettingsContext.Provider>;
};