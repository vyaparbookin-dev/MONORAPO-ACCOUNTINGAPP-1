import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { SettingsContext } from "../../contexts/SettingsContext";
// import ToggleSwitch from "../../components/ToggleSwitch"; // This component is not used here, removing the import to fix the build error.
const AppSettings = () => {
  const settings = [
    { name: "Profile", path: "/profile" },
    { name: "Cloud Sync", path: "/cloudsync" },
    { name: "WhatsApp Settings", path: "/settings/whatsapp" },
    { name: "Billing Settings", path: "/settings/billing" },
    { name: "Security Log", path: "/security" },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">App Settings</h2>
      <ul className="space-y-2">
        {settings.map((s) => (
          <li key={s.path}>
            <Link
              to={s.path}
              className="block p-3 border rounded hover:bg-gray-100"
            >
              {s.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t pt-4">
        <h3 className="text-lg font-semibold mb-3">Billing Experience</h3>
        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
          <div>
            <h4 className="font-medium">Enable Live Customer Insights</h4>
            <p className="text-sm text-gray-500">Show last purchase details on billing screen when a customer is selected.</p>
          </div>
          <p>Coming Soon</p>
        </div>
      </div>
    </div>
  );
};

export default AppSettings;