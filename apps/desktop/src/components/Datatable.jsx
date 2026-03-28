import React from "react";

const DataTable = ({ columns, data, onRowClick }) => {
  // Use a unique key from the data if available, otherwise fall back to index
  const getRowKey = (row, index) => row._id || row.id || index;

  return (
    <div className="overflow-x-auto shadow-md border rounded-xl">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`text-left px-4 py-3 font-semibold text-gray-700 text-xs uppercase ${col.headerClassName || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, i) => (
              <tr
                key={getRowKey(row, i)}
                className={`border-t hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col, j) => (
                  <td key={j} className={`px-4 py-3 text-gray-600 text-sm ${col.cellClassName || ''}`}>
                    {col.cell ? col.cell(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                No Data Available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;