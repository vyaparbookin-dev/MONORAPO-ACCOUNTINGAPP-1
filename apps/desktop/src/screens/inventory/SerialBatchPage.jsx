import React from "react";
import { Layers } from "lucide-react";

const SerialBatchPage = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <Layers className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Serial & Batch Management</h1>
          <p className="text-gray-500 text-sm">Manage product serial numbers, batch numbers, and expiry dates here.</p>
        </div>
      </div>
      
      <div className="mt-8 p-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300 text-center flex flex-col items-center justify-center">
        <Layers className="text-gray-300 mb-4" size={48} />
        <h3 className="text-lg font-bold text-gray-700">Feature Coming Soon</h3>
        <p className="text-gray-500 max-w-md mt-2">We are currently building the advanced Serial, IMEI, and Batch tracking system for Desktop. Stay tuned!</p>
      </div>
    </div>
  );
};

export default SerialBatchPage;