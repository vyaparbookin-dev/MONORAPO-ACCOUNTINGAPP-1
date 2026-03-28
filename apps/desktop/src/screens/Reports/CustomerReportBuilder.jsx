import React, { useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

const CustomerReportBuilder = () => {
  const [customerId, setCustomerId] = useState("");
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/reports/customer/${customerId}`);
      const d = response.data || response;
      setReport(Array.isArray(d) ? d : []);
    } catch (error) {
      console.error("Error fetching customer report:", error);
      alert("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-report-builder">
      {loading && <Loader />}
      <h2>Customer Report</h2>
      <input
        type="text"
        placeholder="Enter Customer ID"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
      />
      <button onClick={fetchReport}>Fetch Report</button>

      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {report.map((item) => (
            <tr key={item._id}>
              <td>{item.invoiceNo}</td>
              <td>{new Date(item.date).toLocaleDateString()}</td>
              <td>{item.amount}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerReportBuilder;