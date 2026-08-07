import React from "react";
import { Link } from "react-router-dom";

const AppSettings = () => {
  const settings = [
    { name: "Profile", path: "/profile" },
    { name: "Cloud Sync", path: "/cloudsync" },
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
    </div>
  );
};

export default AppSettings;