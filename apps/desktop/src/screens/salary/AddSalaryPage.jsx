import React, { useState } from "react";
import axios from "axios";
import Loader from "../../components/Loader";

const AddScreen = () => {
  const [employee, setEmployee] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/api/salary", { employee, amount });
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