import PartyTransaction from "../model/PartyTransaction.js";
import Expance from "../model/expance.js";

export const reconcileStatement = async (req, res) => {
  try {
    const { companyId } = req;
    const { statementEntries } = req.body; // Array of { date, amount, type: 'credit'|'debit', description }

    if (!statementEntries || !Array.isArray(statementEntries) || statementEntries.length === 0) {
      return res.status(400).json({ success: false, message: "No statement entries provided" });
    }

    // Statement ki sabse pehli aur aakhiri date nikalte hain
    const dates = statementEntries.map(e => new Date(e.date));
    const startDate = new Date(Math.min(...dates));
    const endDate = new Date(Math.max(...dates));

    // Date range ko 3 din aage piche badha dete hain taki aage-piche dates (Bank vs App entry) match ho sakein
    startDate.setDate(startDate.getDate() - 3);
    endDate.setDate(endDate.getDate() + 3);

    const [partyTransactions, expenses] = await Promise.all([
      PartyTransaction.find({ companyId, date: { $gte: startDate, $lte: endDate } }).populate('partyId', 'name'),
      Expance.find({ companyId, date: { $gte: startDate, $lte: endDate }, isDeleted: false })
    ]);

    const matched = [];
    const unmatched = [];

    for (const entry of statementEntries) {
      const entryAmount = parseFloat(entry.amount);
      const entryDate = new Date(entry.date);
      let isMatched = false;
      let matchDetails = null;

      // Check in Party Transactions (Udhar/Jama)
      const matchedTx = partyTransactions.find(tx => {
        const txAmount = entry.type === 'credit' ? tx.credit : tx.debit;
        const dateDiff = Math.abs(new Date(tx.date) - entryDate) / (1000 * 60 * 60 * 24); // Difference in days
        return txAmount === entryAmount && dateDiff <= 2; // Exact amount aur 2 din ke andar ho
      });

      if (matchedTx) {
        isMatched = true;
        matchDetails = { model: 'PartyTransaction', data: matchedTx };
      } 
      // Agar debit hai, toh Expance me bhi check karo
      else if (entry.type === 'debit') {
        const matchedExp = expenses.find(exp => exp.amount === entryAmount && (Math.abs(new Date(exp.date) - entryDate) / (1000 * 60 * 60 * 24)) <= 2);
        if (matchedExp) { isMatched = true; matchDetails = { model: 'Expance', data: matchedExp }; }
      }

      if (isMatched) matched.push({ statementEntry: entry, matchDetails });
      else unmatched.push(entry);
    }

    res.json({ success: true, matched, unmatched });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};