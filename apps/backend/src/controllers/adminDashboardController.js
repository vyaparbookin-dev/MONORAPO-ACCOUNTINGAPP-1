import Company from "../model/company.js";
import User from "../model/user.js";
import Bill from "../model/bill.js";
import Product from "../model/product.js";
import Party from "../model/party.js";
import Expense from "../model/expenses.js";
import AiUsage from "../model/aiUsage.js";

export const getAdminMetrics = async (req, res) => {
  try {
    const [
      totalCompanies,
      totalUsers,
      companies,
      totalAiUsage,
      aiLogs,
      totalBills,
      totalProducts,
      totalParties,
      totalExpenses
    ] = await Promise.all([
      Company.countDocuments(),
      User.countDocuments(),
      Company.find().populate('user', 'name email phone').sort({ createdAt: -1 }),
      AiUsage.aggregate([
        { $group: { _id: null, totalTokens: { $sum: "$totalTokens" }, totalCost: { $sum: "$costInr" }, count: { $sum: 1 } } }
      ]),
      AiUsage.find().populate('companyId', 'name').sort({ createdAt: -1 }).limit(15),
      Bill.countDocuments(),
      Product.countDocuments(),
      Party.countDocuments(),
      Expense.countDocuments()
    ]);

    // Plan Distribution Calculation
    let tier1Offline = 0;
    let tier2Hybrid = 0;
    let tier3Pro = 0;

    companies.forEach(c => {
      const plan = (c.planType || c.plan || 'pro').toLowerCase();
      if (plan === 'offline' || plan === 'tier1') tier1Offline++;
      else if (plan === 'hybrid' || plan === 'tier2') tier2Hybrid++;
      else tier3Pro++;
    });

    // Storage Usage Estimation (approx 2KB per doc)
    const totalDocs = totalBills + totalProducts + totalParties + totalExpenses;
    const estimatedStorageMB = parseFloat(((totalDocs * 2.5) / 1024).toFixed(2));
    const estimatedStorageGB = parseFloat((estimatedStorageMB / 1024).toFixed(3));

    // SaaS Revenue Estimation
    const estimatedAnnualRevenue = (tier1Offline * 299) + (tier2Hybrid * 599) + (tier3Pro * 2999);

    res.json({
      success: true,
      data: {
        summary: {
          totalCompanies,
          totalUsers,
          planDistribution: {
            offline: tier1Offline,
            hybrid: tier2Hybrid,
            pro: tier3Pro
          },
          aiMetrics: {
            totalTokensUsed: totalAiUsage[0]?.totalTokens || 0,
            totalCostInr: totalAiUsage[0]?.totalCost || 0,
            totalQueries: totalAiUsage[0]?.count || 0
          },
          storageMetrics: {
            totalDocuments: totalDocs,
            estimatedStorageMB,
            estimatedStorageGB,
            averagePerCompanyKB: totalCompanies > 0 ? Math.round((totalDocs * 2.5) / totalCompanies) : 0
          },
          saasRevenue: {
            estimatedAnnualRevenue,
            discountsGiven20Percent: Math.round(companies.length * 0.3 * 400) // approx
          }
        },
        companies: companies.map(c => ({
          _id: c._id,
          name: c.name,
          ownerName: c.user?.name || 'Owner',
          phone: c.phone || c.user?.phone || 'N/A',
          planType: c.planType || (c.plan === 'free' ? 'offline' : 'pro'),
          aiTokensUsed: c.aiTokensUsed || 0,
          createdAt: c.createdAt,
          gstNumber: c.gstNumber || 'Unregistered'
        })),
        recentAiLogs: aiLogs
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCompanyPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { planType, aiTokensMonthlyLimit } = req.body;

    const company = await Company.findByIdAndUpdate(
      id,
      { 
        $set: { 
          planType, 
          aiTokensMonthlyLimit: aiTokensMonthlyLimit || 50000 
        } 
      },
      { new: true }
    );

    if (!company) return res.status(404).json({ success: false, message: "Company not found" });

    res.json({ success: true, message: "Plan updated successfully", company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
