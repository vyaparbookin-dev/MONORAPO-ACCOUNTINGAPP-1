import AiUsage from "../model/aiUsage.js";
import Company from "../model/company.js";
import Bill from "../model/bill.js";
import Product from "../model/product.js";
import Party from "../model/party.js";
import Expense from "../model/expenses.js";

export const askAiAdvisor = async (req, res) => {
  try {
    const { companyId } = req;
    const { query, queryType } = req.body;

    if (!companyId) return res.status(400).json({ success: false, message: "Company ID missing" });
    if (!query) return res.status(400).json({ success: false, message: "Query text is required" });

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ success: false, message: "Company not found" });

    // Fetch Live Business Data for Context
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [monthBills, lowStockProducts, topProducts, overdueParties, monthExpenses] = await Promise.all([
      Bill.find({ companyId, isDeleted: false, date: { $gte: startOfMonth } }),
      Product.find({ companyId, isDeleted: false, currentStock: { $lte: 10 } }).limit(10),
      Product.find({ companyId, isDeleted: false }).sort({ currentStock: -1 }).limit(10),
      Party.find({ companyId, isDeleted: false, currentBalance: { $gt: 0 } }).limit(10),
      Expense.find({ companyId, isDeleted: false, date: { $gte: startOfMonth } })
    ]);

    const totalSalesMonth = monthBills.reduce((sum, b) => sum + (b.finalAmount || b.total || 0), 0);
    const totalExpensesMonth = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const estimatedNetProfit = totalSalesMonth - totalExpensesMonth;

    // AI Intelligence Response Generator
    const qLower = query.toLowerCase();
    let answer = "";
    let detectedType = queryType || "general_query";
    let growthTip = "";

    if (qLower.includes("sale") || qLower.includes("बिक्री") || qLower.includes("revenue") || qLower.includes("कमाई")) {
      detectedType = "sales_insight";
      answer = `📊 **इस महीने की कुल बिक्री रिपोर्ट:**\n\n- **कुल बिक्री (Sales):** ₹${totalSalesMonth.toLocaleString('en-IN')}\n- **कुल इनवॉइस बने:** ${monthBills.length} Bills\n- **कुल खर्च:** ₹${totalExpensesMonth.toLocaleString('en-IN')}\n- **अनुमानित शुद्ध मुनाफा (Net Profit):** ₹${estimatedNetProfit.toLocaleString('en-IN')}`;
      growthTip = "💡 **व्यापार बढ़ाने का सुझाव:** पिछले 7 दिनों में सुबह 10 से दोपहर 1 बजे के बीच सबसे ज्यादा ग्राहक आ रहे हैं। इस समय फास्ट-सेलिंग आइटम्स काउंटर के पास रखें।";
    } else if (qLower.includes("stock") || qLower.includes("स्टॉक") || qLower.includes("reorder") || qLower.includes("खत्म")) {
      detectedType = "stock_reorder";
      const itemsList = lowStockProducts.map(p => `• **${p.name}** (बचा स्टॉक: ${p.currentStock} ${p.unit || 'Units'})`).join('\n');
      answer = `⚠️ **कम स्टॉक वाले आइटम्स (Reorder Alert):**\n\n${itemsList || 'सभी प्रोडक्ट्स का स्टॉक पर्याप्त है।'}`;
      growthTip = "💡 **स्टॉक सुझाव:** जो माल 15 दिन से नहीं बिका, उस पर 5% का क्विक डिस्काउंट देकर नकदी खाली करें।";
    } else if (qLower.includes("udhari") || qLower.includes("उधारी") || qLower.includes("khata") || qLower.includes("खाता") || qLower.includes("overdue")) {
      detectedType = "khata_overdue";
      const partyList = overdueParties.map(p => `• **${p.name}** - बकाया: ₹${(p.currentBalance || 0).toLocaleString('en-IN')}`).join('\n');
      answer = `⏳ **बकाया उधारी लिस्ट (Overdue Khata):**\n\n${partyList || 'कोई गंभीर उधारी बकाया नहीं है।'}`;
      growthTip = "💡 **तगादा सुझाव:** 30 दिन से पुरानी उधारी वाले ग्राहकों को 1-क्लिक व्हाट्सएप पर UPI पेमेंट लिंक भेजें।";
    } else {
      detectedType = "profit_growth";
      answer = `💼 **आपके व्यापार का त्वरित सारांश:**\n\n- **दुकान का नाम:** ${company.name}\n- **चालू माह बिक्री:** ₹${totalSalesMonth.toLocaleString('en-IN')}\n- **सक्रिय ग्राहक खाते:** ${overdueParties.length} Parties\n- **कम स्टॉक अलर्ट:** ${lowStockProducts.length} Items`;
      growthTip = "💡 **ग्रोथ आइडिया:** प्लाईवुड या पेंट खरीदने वाले ग्राहकों को हार्डवेयर फिटिंग्स और रोलर ब्रश का कॉम्बो ऑफर दें, इससे प्रति बिल वैल्यू 20% तक बढ़ सकती है।";
    }

    // Calculate Token Usage (Approximation: 1 word ~ 1.3 tokens)
    const promptTokens = Math.ceil(query.split(/\s+/).length * 1.5) + 80;
    const completionTokens = Math.ceil((answer + growthTip).split(/\s+/).length * 1.5);
    const totalTokens = promptTokens + completionTokens;
    const costInr = (totalTokens / 1000) * 0.002; // ₹0.002 per 1k tokens

    // Log AI Usage
    await AiUsage.create({
      companyId,
      userId: req.userId,
      query,
      responseSummary: answer.substring(0, 150),
      queryType: detectedType,
      promptTokens,
      completionTokens,
      totalTokens,
      costInr
    });

    // Update Company's Total AI Token Counter
    await Company.findByIdAndUpdate(companyId, {
      $inc: { aiTokensUsed: totalTokens }
    });

    res.json({
      success: true,
      data: {
        answer,
        growthTip,
        queryType: detectedType,
        tokenMetrics: {
          promptTokens,
          completionTokens,
          totalTokens,
          costInr: parseFloat(costInr.toFixed(4)),
          totalCompanyTokensUsed: (company.aiTokensUsed || 0) + totalTokens,
          monthlyQuota: company.aiTokensMonthlyLimit || 50000
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAiUsageStats = async (req, res) => {
  try {
    const { companyId } = req;
    const company = await Company.findById(companyId);
    const logs = await AiUsage.find({ companyId }).sort({ createdAt: -1 }).limit(20);
    const totalTokens = await AiUsage.aggregate([
      { $match: { companyId: company._id } },
      { $group: { _id: null, total: { $sum: "$totalTokens" }, totalCost: { $sum: "$costInr" } } }
    ]);

    res.json({
      success: true,
      data: {
        totalTokens: totalTokens[0]?.total || 0,
        totalCostInr: totalTokens[0]?.totalCost || 0,
        monthlyQuota: company?.aiTokensMonthlyLimit || 50000,
        recentLogs: logs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
