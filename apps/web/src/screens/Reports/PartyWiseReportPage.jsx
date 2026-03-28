import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

const PartyWiseReportPage = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/reports/partywise");
      const d = response.data || response;
      setReport(Array.isArray(d) ? d : []);
    } catch (error) {
      console.error("Error fetching partywise report:", error);
      alert("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="partywise-report-page">
      {loading && <Loader />}
      <h2>Party Wise Report</h2>
      <table>
        <thead>
          <tr>
            <th>Party Name</th>
            <th>Total Purchase</th>
            <th>Total Sales</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {report.map((item) => (
            <tr key={item._id}>
              <td>{item.partyName}</td>
              <td>{item.totalPurchase}</td>
              <td>{item.totalSales}</td>
              <td>{item.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PartyWiseReportPage;