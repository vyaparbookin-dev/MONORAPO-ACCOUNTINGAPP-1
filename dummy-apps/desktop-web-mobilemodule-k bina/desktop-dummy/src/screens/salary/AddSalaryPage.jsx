import React, { useState } from "react";
import Loader from "../../components/Loader";
import { dbService } from "../../services/dbService";

const AddScreen = () => {
  const [employee, setEmployee] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newId = `SAL-${Date.now()}`;
      await dbService.saveSalary({ uuid: newId, employeeName: employee, amount: Number(amount), date: new Date().toISOString() });
      alert("Salary added successfully");
      setEmployee("");
      setAmount("");
    } catch (error) {
      console.error("Error adding salary:", error);
      alert("Failed to add salary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="salary-add-page">
      {loading && <Loader />}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Employee Name:</label>
          <input
            type="text"
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Amount:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add Salary</button>
      </form>
    </div>
  );
};

export default AddScreen