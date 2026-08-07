import React, { useEffect, useState } from "react";
import { dbService } from "../../services/dbService";

const SalaryList = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalaries();
  }, []);

  const fetchSalaries = async () => {
    try {
      con
      console.error("Error fetching salaries:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="salary-list-page">
      {loading ? (
        <Loader />
      ) : salaries.length === 0 ? (
        <p>No salary records found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map((s) => (
              <tr key={s._id}>
                <td>{s.employee}</td>
                <td>{s.amount}</td>
                <td>{new Date(s.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SalaryList;
