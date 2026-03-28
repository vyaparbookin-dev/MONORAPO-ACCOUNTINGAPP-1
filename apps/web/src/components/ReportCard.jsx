import React from "react";

const ReportCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between border border-gray-100">
    <div>
      <h4 className="text-sm text-gray-500">{title}</h4>
      <h2 className="text-2xl font-semibold text-gray-800">{value}</h2>
    </div>
    <div className="text-blue-600 text-3xl">{icon}</div>
  </div>
);

export default ReportCard;