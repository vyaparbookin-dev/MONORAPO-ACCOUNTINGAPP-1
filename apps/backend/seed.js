import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcryptjs from "bcryptjs";

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

// ============================================================
// 🛑 SAFETY GUARD — DO NOT REMOVE
// This script permanently deletes all data in the target database
// before inserting demo data. It must NEVER be allowed to run
// against a real/production MongoDB Atlas cluster.
//
// This guard hard-blocks the script unless:
//   1. MONGO_URI is completely unset (falls back to local Mongo), OR
//   2. MONGO_URI explicitly points to localhost/127.0.0.1, OR
//   3. You pass --i-know-what-i-am-doing as a command-line flag
//      AND set ALLOW_SEED_ON_REMOTE=true in the environment.
// ============================================================
const rawUri = process.env.MONGO_URI || "";
const isLocalUri = /^mongodb:\/\/(127\.0\.0\.1|localhost)/.test(rawUri) || rawUri === "";
const forceFlag = process.argv.includes("--i-know-what-i-am-doing");
const forceEnv = process.env.ALLOW_SEED_ON_REMOTE === "true";

if (!isLocalUri && !(forceFlag && forceEnv)) {
  console.error("\n🛑 REFUSING TO RUN: MONGO_URI does not point to localhost.");
  console.error("   This script deletes ALL data (users, products, bills, companies, etc.)");
  console.error("   before inserting demo data. Running it against a remote/production");
  console.error("   database would permanently destroy real data.");
  console.error("\n   Detected MONGO_URI host (redacted):",
    rawUri ? rawUri.replace(/\/\/.*@/, "//<redacted>@").split("/")[2] : "(not set)");
  console.error("\n   If you are ABSOLUTELY SURE you want to seed a remote database,");
  console.error("   re-run with both of the following:");
  console.error("     ALLOW_SEED_ON_REMOTE=true node seed.js --i-know-what-i-am-doing\n");
  process.exit(1);
}
// ============================================================

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to MongoDB
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vyapar_local";
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // Import models (moved here so the safety guard above runs first,
    // before any model/connection code executes)
    const { default: User } = await import("./src/model/user.js");
    const { default: Bill } = await import("./src/model/bill.js");
    const { default: Product } = await import("./src/model/product.js");
    const { default: Company } = await import("./src/model/company.js");
    const { default: Expense } = await import("./src/model/expenses.js");
    const { default: Salary } = await import("./src/model/salary.js");
    const { default: Laterpad } = await import("./src/model/laterpad.js");
    const { default: Party } = await import("./src/model/party.js");

    // Clear existing data
    await User.deleteMany({});
    await Bill.deleteMany({});
    await Product.deleteMany({});
    await Company.deleteMany({});
    await Expense.deleteMany({});
    await Salary.deleteMany({});
    await Laterpad.deleteMany({});
    await Party.deleteMany({});
    console.log("🗑️  Cleared existing data");

    // Create demo company
    const company = await Company.create({
      name: "Demo Business Pvt. Ltd.",
      email: "company@demo.com",
      phone: "9876543210",
      address: "123 Business St, City",
      gstNumber: "18AABCT1234H1Z0",
      panNumber: "AAAPA1234A",
      plan: "free",
      freeBillCount: 0,
      maxFreeBills: 50,
    });
    console.log("✅ Created company");

    const hashedPassword = await bcryptjs.hash("ak@7828289433", 10);
    const user = await User.create({
      name: "Ankush Bani",
      email: "ankush.bani@gmail.com",
      phone: "7828289433",
      password: hashedPassword,
      company: company._id,
      role: "admin",
    });
    console.log("✅ Created demo user");

    const party = await Party.create({
      name: "John Doe",
      companyId: company._id,
      mobileNumber: "9988776655",
      address: "456 Customer Lane",
      partyType: "customer",
      gstNumber: "29ABCDE1234F1Z5",
      creditLimit: 10000,
      currentBalance: 500
    });
    console.log("✅ Created demo party");

    const products = await Product.create([
      { name: "Laptop", sku: "LAP001", companyId: company._id, quantity: 10, price: 50000, category: "Electronics", description: "High-performance laptop" },
      { name: "Mouse", sku: "MOU001", companyId: company._id, quantity: 50, price: 500, category: "Accessories", description: "Wireless mouse" },
      { name: "Keyboard", sku: "KEY001", companyId: company._id, quantity: 30, price: 1500, category: "Accessories", description: "Mechanical keyboard" },
    ]);
    console.log("✅ Created demo products");

    const bills = await Bill.create([
      { billNumber: "INV001", companyId: company._id, customerName: "John Doe", partyId: party._id, items: [{ productId: products[0]._id, quantity: 1, price: 50000 }], total: 50000, tax: 9000, status: "issued", dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      { billNumber: "INV002", companyId: company._id, customerName: "Jane Smith", partyId: party._id, items: [{ productId: products[1]._id, quantity: 5, price: 500 }, { productId: products[2]._id, quantity: 2, price: 1500 }], total: 5500, tax: 990, status: "draft", dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
    ]);
    console.log("✅ Created demo bills");

    const expenses = await Expense.create([
      { title: "Office Rent - January", companyId: company._id, category: "Rent", description: "Office rent for January", amount: 50000, date: new Date() },
      { title: "Electricity Bill - January", companyId: company._id, category: "Utilities", description: "Electricity bill", amount: 5000, date: new Date() },
    ]);
    console.log("✅ Created demo expenses");

    const salaries = await Salary.create([
      { employeeName: "Raj Kumar", companyId: company._id, position: "Manager", amount: 35000, month: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }), isPaid: false },
      { employeeName: "Priya Singh", companyId: company._id, position: "Developer", amount: 40000, month: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }), isPaid: true },
    ]);
    console.log("✅ Created demo salaries");

    const latepayments = await Laterpad.create([
      { companyId: company._id, title: "Late Payment - INV001", billNumber: "INV001", customerName: "John Doe", amount: 59000, dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    ]);
    console.log("✅ Created demo late payments");

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📝 Demo Login Credentials:");
    console.log("Email: ankush.bani@gmail.com");
    console.log("Password: ak@7828289433");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    process.exit(1);
  }
};

seedDatabase();