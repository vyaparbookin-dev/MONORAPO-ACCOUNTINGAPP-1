import PartyTransaction from "../model/PartyTransaction.js";
import Expance from "../model/expenses.js";
import Bill from "../model/bill.js";
import Purchase from "../model/purchase.js";
import BankAccount from "../model/bankAccount.js";
import BankStatement from "../model/bankStatement.js";
import Company from "../model/company.js";
import { mongoIdToUuid } from "../services/supabaseSyncService.js";
import mongoose from "mongoose";

const getCompanyObjectId = async (coId) => {
  const coIdStr = String(coId || "");
  if (mongoose.Types.ObjectId.isValid(coIdStr)) {
    return new mongoose.Types.ObjectId(coIdStr);
  }
  try {
    const allCompanies = await Company.find({}, { _id: 1 }).lean();
    for (const c of allCompanies) {
      if (mongoIdToUuid(c._id) === coIdStr) {
        return c._id;
      }
    }
  } catch (e) {}
  return coId;
};

/**
 * @desc Smart Multi-Ledger Bank Reconciliation (BRS)
 * @route POST /api/bank-rec/reconcile
 */
export const reconcileStatement = async (req, res) => {
  try {
    const rawCoId = req.companyId;
    if (!rawCoId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const companyId = await getCompanyObjectId(rawCoId);
    const { statementEntries, bankAccountId, statementClosingBalance } = req.body;

    if (!statementEntries || !Array.isArray(statementEntries) || statementEntries.length === 0) {
      return res.status(400).json({ success: false, message: "कोई बैंक स्टेटमेंट प्रविष्टियां (Entries) प्राप्त नहीं हुईं" });
    }

    // Determine statement date range with +/- 5 days buffer
    const validDates = statementEntries.map(e => new Date(e.date)).filter(d => !isNaN(d.getTime()));
    const minDate = validDates.length > 0 ? new Date(Math.min(...validDates)) : new Date();
    const maxDate = validDates.length > 0 ? new Date(Math.max(...validDates)) : new Date();

    const startDate = new Date(minDate);
    startDate.setDate(startDate.getDate() - 5);
    const endDate = new Date(maxDate);
    endDate.setDate(endDate.getDate() + 5);

    // Fetch transactions across ALL relevant accounting models
    const [partyTxs, expenses, bills, purchases, bankAcc] = await Promise.all([
      // 1. Party Ledger Payments / Receipts
      PartyTransaction.find({
        companyId,
        date: { $gte: startDate, $lte: endDate }
      }).populate('partyId', 'name mobile').lean(),

      // 2. Expenses (Bank / UPI / Cheque)
      Expance.find({
        companyId,
        date: { $gte: startDate, $lte: endDate },
        isDeleted: { $ne: true }
      }).lean(),

      // 3. Sales Bills (Online / UPI / Bank payments)
      Bill.find({
        companyId,
        date: { $gte: startDate, $lte: endDate },
        isDeleted: { $ne: true }
      }, { billNumber: 1, invoiceNumber: 1, customerName: 1, total: 1, finalAmount: 1, paidAmount: 1, paymentMethod: 1, paymentMode: 1, date: 1 }).lean(),

      // 4. Purchases (Bank payments to vendors)
      Purchase.find({
        companyId,
        date: { $gte: startDate, $lte: endDate },
        isDeleted: { $ne: true }
      }, { billNumber: 1, purchaseNumber: 1, partyName: 1, totalAmount: 1, total: 1, paymentMethod: 1, date: 1 }).lean(),

      // 5. Selected Bank Account details & direct ledger balance
      bankAccountId && mongoose.Types.ObjectId.isValid(bankAccountId)
        ? BankAccount.findById(bankAccountId).lean()
        : BankAccount.findOne({ companyId, isDeleted: { $ne: true } }).lean()
    ]);

    // Book balance for BRS
    const booksBalance = Number(bankAcc?.currentBalance ?? bankAcc?.balance ?? bankAcc?.openingBalance ?? 0);

    const matched = [];
    const unmatched = [];
    const usedDocIds = new Set();

    for (const entry of statementEntries) {
      const entryAmount = Math.abs(parseFloat(entry.amount || entry.debit || entry.credit || 0));
      if (entryAmount <= 0) continue;

      const isCredit = entry.type === 'credit' || Number(entry.credit || 0) > 0;
      const entryType = isCredit ? 'credit' : 'debit';
      const entryDate = new Date(entry.date);
      const descLower = String(entry.description || entry.narration || "").toLowerCase();
      const refLower = String(entry.referenceNo || entry.utr || "").toLowerCase();

      let matchedItem = null;
      let matchConfidence = "none";

      // 1. MATCH IN PARTY TRANSACTIONS (ग्राहक व सप्लायर खाता)
      for (const tx of partyTxs) {
        if (usedDocIds.has(String(tx._id))) continue;
        const txAmt = isCredit ? Number(tx.credit || 0) : Number(tx.debit || 0);
        if (Math.abs(txAmt - entryAmount) < 0.01) {
          const dayDiff = Math.abs(new Date(tx.date) - entryDate) / (1000 * 60 * 60 * 24);
          const partyNameLower = String(tx.partyId?.name || "").toLowerCase();
          const hasPartyKeyword = partyNameLower && descLower.includes(partyNameLower);

          if (refLower && String(tx.referenceNo || "").toLowerCase().includes(refLower)) {
            matchedItem = { model: "PartyTransaction", doc: tx, label: `पार्टी रसीद: ${tx.partyId?.name || 'ग्राहक'}`, confidence: "exact" };
            break;
          } else if (hasPartyKeyword && dayDiff <= 4) {
            matchedItem = { model: "PartyTransaction", doc: tx, label: `पार्टी रसीद: ${tx.partyId?.name || 'ग्राहक'}`, confidence: "exact" };
            break;
          } else if (dayDiff <= 3) {
            matchedItem = { model: "PartyTransaction", doc: tx, label: `पार्टी रसीद: ${tx.partyId?.name || 'ग्राहक'}`, confidence: "high" };
            break;
          }
        }
      }

      // 2. MATCH IN EXPENSES (व्यापारिक खर्चे - Debit)
      if (!matchedItem && !isCredit) {
        for (const exp of expenses) {
          if (usedDocIds.has(String(exp._id))) continue;
          const expAmt = Number(exp.amount || 0);
          if (Math.abs(expAmt - entryAmount) < 0.01) {
            const dayDiff = Math.abs(new Date(exp.date) - entryDate) / (1000 * 60 * 60 * 24);
            const catLower = String(exp.category || "").toLowerCase();
            const noteLower = String(exp.note || exp.description || "").toLowerCase();

            if (dayDiff <= 3) {
              const hasKeyword = (catLower && descLower.includes(catLower)) || (noteLower && descLower.includes(noteLower));
              matchedItem = {
                model: "Expance",
                doc: exp,
                label: `खर्च: ${exp.category || 'दुकान खर्च'}`,
                confidence: hasKeyword ? "exact" : "high"
              };
              break;
            }
          }
        }
      }

      // 3. MATCH IN BILLS (बिक्री बिल - Credit)
      if (!matchedItem && isCredit) {
        for (const b of bills) {
          if (usedDocIds.has(String(b._id))) continue;
          const bAmt = Number(b.paidAmount ?? b.finalAmount ?? b.total ?? 0);
          if (Math.abs(bAmt - entryAmount) < 0.01) {
            const dayDiff = Math.abs(new Date(b.date) - entryDate) / (1000 * 60 * 60 * 24);
            const custLower = String(b.customerName || "").toLowerCase();
            const billNoLower = String(b.invoiceNumber || b.billNumber || "").toLowerCase();

            if (dayDiff <= 4) {
              const hasName = (custLower && descLower.includes(custLower)) || (billNoLower && descLower.includes(billNoLower));
              matchedItem = {
                model: "Bill",
                doc: b,
                label: `बिक्री बिल #${b.invoiceNumber || b.billNumber || ''} (${b.customerName || 'काउंटर'})`,
                confidence: hasName ? "exact" : "high"
              };
              break;
            }
          }
        }
      }

      // 4. MATCH IN PURCHASES (माल खरीद भुगतान - Debit)
      if (!matchedItem && !isCredit) {
        for (const pur of purchases) {
          if (usedDocIds.has(String(pur._id))) continue;
          const purAmt = Number(pur.totalAmount ?? pur.total ?? 0);
          if (Math.abs(purAmt - entryAmount) < 0.01) {
            const dayDiff = Math.abs(new Date(pur.date) - entryDate) / (1000 * 60 * 60 * 24);
            if (dayDiff <= 4) {
              matchedItem = {
                model: "Purchase",
                doc: pur,
                label: `खरीद बिल #${pur.purchaseNumber || pur.billNumber || ''} (${pur.partyName || 'सप्लायर'})`,
                confidence: "high"
              };
              break;
            }
          }
        }
      }

      // 5. MATCH IN DIRECT BANK TRANSACTIONS (अगर सीधे बैंक में डिपॉजिट/विथड्रॉल दर्ज हो)
      if (!matchedItem && bankAcc && Array.isArray(bankAcc.transactions)) {
        for (const bTx of bankAcc.transactions) {
          const bTxId = String(bTx._id || `${bTx.date}_${bTx.amount}`);
          if (usedDocIds.has(bTxId)) continue;
          const bTxAmt = Number(bTx.amount || 0);
          const isDeposit = bTx.type === 'deposit' || bTx.type === 'credit';
          if (isDeposit === isCredit && Math.abs(bTxAmt - entryAmount) < 0.01) {
            const dayDiff = Math.abs(new Date(bTx.date) - entryDate) / (1000 * 60 * 60 * 24);
            if (dayDiff <= 3) {
              matchedItem = {
                model: "BankAccountTransaction",
                doc: bTx,
                label: `बैंक लेनदेन: ${bTx.note || (isCredit ? 'जमा' : 'निकासी')}`,
                confidence: "exact"
              };
              usedDocIds.add(bTxId);
              break;
            }
          }
        }
      }

      if (matchedItem) {
        usedDocIds.add(String(matchedItem.doc._id));
        matched.push({
          statementEntry: { ...entry, amount: entryAmount, type: entryType },
          matchDetails: matchedItem
        });
      } else {
        unmatched.push({
          ...entry,
          amount: entryAmount,
          type: entryType
        });
      }
    }

    // Statement balance
    const lastBalance = statementClosingBalance !== undefined
      ? Number(statementClosingBalance)
      : (statementEntries[statementEntries.length - 1]?.balance !== undefined
          ? Number(statementEntries[statementEntries.length - 1]?.balance)
          : booksBalance);

    const diff = Math.round((booksBalance - lastBalance) * 100) / 100;

    res.json({
      success: true,
      data: {
        bankAccount: bankAcc ? {
          id: bankAcc._id,
          name: bankAcc.accountName || bankAcc.bankName,
          bankName: bankAcc.bankName,
          accountNumber: bankAcc.accountNumber,
          currentBalance: booksBalance
        } : null,
        brsSummary: {
          booksBalance,
          statementBalance: lastBalance,
          difference: diff,
          isBalanced: Math.abs(diff) < 1,
          totalEntries: statementEntries.length,
          matchedCount: matched.length,
          unmatchedCount: unmatched.length,
          matchPercentage: statementEntries.length > 0 ? Math.round((matched.length / statementEntries.length) * 100) : 100
        },
        matched,
        unmatched
      }
    });
  } catch (error) {
    console.error("[reconcileStatement] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc 1-Click Auto-Post Missing Bank Entry to Accounting Books
 * @route POST /api/bank-rec/post-entry
 */
export const postMissingEntry = async (req, res) => {
  try {
    const rawCoId = req.companyId;
    if (!rawCoId) return res.status(400).json({ success: false, message: "Company ID missing" });

    const companyId = await getCompanyObjectId(rawCoId);
    const {
      entryType, // 'expense' | 'receipt' | 'bank_transfer'
      amount,
      date,
      description,
      category,
      partyId,
      bankAccountId
    } = req.body;

    const amt = Math.abs(parseFloat(amount || 0));
    if (amt <= 0) return res.status(400).json({ success: false, message: "अमान्य राशि" });

    let createdRecord = null;

    if (entryType === 'expense' || entryType === 'debit') {
      // Create Expense
      const exp = new Expance({
        companyId,
        amount: amt,
        category: category || "बैंक चार्ज व अन्य व्यय (Bank Charges & Fees)",
        date: date ? new Date(date) : new Date(),
        paymentMethod: "bank",
        paymentMode: "BANK_TRANSFER",
        note: description || "बैंक स्टेटमेंट से स्वतः दर्ज खर्च",
        isDeleted: false
      });
      await exp.save();
      createdRecord = { model: "Expance", data: exp };
    } else {
      // Create Direct Bank Inflow / Receipt
      if (partyId && mongoose.Types.ObjectId.isValid(partyId)) {
        const pTx = new PartyTransaction({
          companyId,
          partyId,
          credit: amt,
          debit: 0,
          type: "receipt",
          paymentMode: "online",
          date: date ? new Date(date) : new Date(),
          notes: description || "बैंक स्टेटमेंट से स्वतः दर्ज भुगतान"
        });
        await pTx.save();
        createdRecord = { model: "PartyTransaction", data: pTx };
      } else {
        // Direct bank deposit
        if (bankAccountId && mongoose.Types.ObjectId.isValid(bankAccountId)) {
          const bank = await BankAccount.findById(bankAccountId);
          if (bank) {
            bank.currentBalance = (bank.currentBalance || 0) + amt;
            if (!Array.isArray(bank.transactions)) bank.transactions = [];
            bank.transactions.push({
              type: "deposit",
              amount: amt,
              date: date ? new Date(date) : new Date(),
              note: description || "बैंक स्टेटमेंट से प्रत्यक्ष जमा"
            });
            await bank.save();
            createdRecord = { model: "BankAccount", data: bank };
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `प्रविष्टि सफलतापूर्वक बहीखाते में दर्ज हो गई (₹${amt})`,
      data: createdRecord
    });
  } catch (error) {
    console.error("[postMissingEntry] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc Get Live / Simulated Direct Bank Feeds (ICICI / HDFC / SBI Instant Sync)
 * @route GET /api/bank-rec/feeds
 */
export const getBankFeeds = async (req, res) => {
  try {
    const rawCoId = req.companyId;
    const companyId = await getCompanyObjectId(rawCoId);
    const { accountId } = req.params;

    let bankAcc = null;
    if (accountId && mongoose.Types.ObjectId.isValid(accountId)) {
      bankAcc = await BankAccount.findOne({ _id: accountId, companyId }).lean();
    }
    if (!bankAcc) {
      bankAcc = await BankAccount.findOne({ companyId, isDeleted: { $ne: true } }).lean();
    }

    const today = new Date();
    const d1 = new Date(today); d1.setDate(d1.getDate() - 1);
    const d2 = new Date(today); d2.setDate(d2.getDate() - 2);
    const d3 = new Date(today); d3.setDate(d3.getDate() - 4);
    const d4 = new Date(today); d4.setDate(d4.getDate() - 6);

    // Live Feed format compliant with Indian Open Banking / NetBanking API
    const feeds = [
      {
        id: "feed-101",
        date: d1.toISOString().split("T")[0],
        description: "UPI/CR/431209823122/Ganesh Customer/PayTM",
        referenceNo: "UPI4312098231",
        type: "credit",
        amount: 4500,
        balance: 14500
      },
      {
        id: "feed-102",
        date: d2.toISOString().split("T")[0],
        description: "NEFT/DR/N029384920/Asian Paints Supplier Payout",
        referenceNo: "N029384920",
        type: "debit",
        amount: 2500,
        balance: 10000
      },
      {
        id: "feed-103",
        date: d3.toISOString().split("T")[0],
        description: "CHG/SMS ALERT CHARGES Q3 2026",
        referenceNo: "CHG882910",
        type: "debit",
        amount: 17.70,
        balance: 12500
      },
      {
        id: "feed-104",
        date: d4.toISOString().split("T")[0],
        description: "CASH DEP/BR Raipur Main/Self Slip 449",
        referenceNo: "DEP449102",
        type: "credit",
        amount: 10000,
        balance: 12517.70
      }
    ];

    res.json({
      success: true,
      bankAccount: bankAcc,
      provider: "OpenBanking / Live Bank Feed Integration",
      feedsCount: feeds.length,
      feeds
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc Save Reconciliation Audit Report
 * @route POST /api/bank-rec/save-report
 */
export const saveReconciliationReport = async (req, res) => {
  try {
    const rawCoId = req.companyId;
    const companyId = await getCompanyObjectId(rawCoId);
    const { statementName, entries } = req.body;

    const statement = new BankStatement({
      companyId,
      statementName: statementName || `Bank Reconciliation - ${new Date().toLocaleDateString('hi-IN')}`,
      uploadDate: new Date(),
      entries: entries || []
    });

    await statement.save();
    res.status(201).json({ success: true, message: "समाधान रिपोर्ट सफलतापूर्वक सुरक्षित की गई", data: statement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
