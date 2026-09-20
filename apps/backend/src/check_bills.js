import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/accounting';

async function main() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB!");
  
  const Bill = mongoose.model('Bill', new mongoose.Schema({ companyId: String, totalAmount: Number, billNumber: String, isDeleted: Boolean }, { strict: false }));
  
  const counts = await Bill.aggregate([
    { $group: { _id: "$companyId", count: { $sum: 1 }, totalSales: { $sum: "$totalAmount" } } }
  ]);
  
  console.log("Bills by Company ID:", JSON.stringify(counts, null, 2));
  
  const sampleBills = await Bill.find({}).sort({ _id: -1 }).limit(10).lean();
  console.log("Sample Bills:", JSON.stringify(sampleBills.map(b => ({ id: b._id, billNumber: b.billNumber, totalAmount: b.totalAmount, companyId: b.companyId, date: b.date || b.createdAt })), null, 2));
  
  await mongoose.disconnect();
}

main().catch(err => console.error(err));
