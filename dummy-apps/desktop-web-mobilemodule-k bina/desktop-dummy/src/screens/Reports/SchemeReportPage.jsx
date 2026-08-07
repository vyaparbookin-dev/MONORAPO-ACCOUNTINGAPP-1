import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

const SchemeReportPage = () => {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/reports/scheme");
      const d = response.data || response;
      setReport(Array.isArray(d) ? d : []);
    } catch (error) {
      console.error("Error fetching scheme report:", error);
      alert("Failed to fetch scheme report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="scheme-report-page">
      {loading && <Loader />}
      <h2>Scheme Report</h2>
      <table>
        <thead>
          <tr>
            <th>Scheme Name</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Total Redemptions</th>
          </tr>
        </thead>
        <tbody>
          {report.map((item) => (
            <tr key={item._id}>
              <td>{item.schemeName}</td>
              <td>{new Date(item.startDate).toLocaleDateString()}</td>
              <td>{new Date(item.endDate).toLocaleDateString()}</td>
              <td>{item.totalRedemptions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SchemeReportPage;