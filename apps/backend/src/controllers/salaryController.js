import Salary from "../model/salary.js";
import { logActivity } from "../utils/logger.js";

export const addSalary = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }
    const salaryData = { ...req.body, companyId: req.companyId };
    const salary = new Salary(salaryData);
    await salary.save();
    
    // Audit Trail
    await logActivity(req, `Added Salary record for amount ₹${salary.amount || 0}`);
    
    res.status(201).json({ success: true, salary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listSalaries = async (req, res) => {
  try {
    if (!req.companyId) {
      return res.status(400).json({ success: false, message: "Company ID is missing" });
    }

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = { companyId: req.companyId, isDeleted: false };

    // Fetch data and count in parallel for speed
    const [salaries, totalSalaries] = await Promise.all([
      Salary.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Salary.countDocuments(filter)
    ]);

    res.json({ 
      success: true, 
      salaries,
      pagination: { total: totalSalaries, page, limit, totalPages: Math.ceil(totalSalaries / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Soft delete a salary record
export const deleteSalary = async (req, res) => {
  try {
    const salary = await Salary.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { isDeleted: true },
      { new: true }
    );
    
    if (!salary) return res.status(404).json({ success: false, error: "Salary record not found" });
    
    await logActivity(req, `Deleted Salary record (ID: ${req.params.id})`);
    
    res.json({ success: true, message: "Salary record deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};