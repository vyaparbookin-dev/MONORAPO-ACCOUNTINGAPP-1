import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcryptjs from "bcryptjs";

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Import models
import User from "./src/model/user.js";
import Bill from "./src/model/bill.js";
import Product from "./src/model/product.js";
import Company from "./src/model/company.js";
import Expance from "./src/model/expance.js";
import Salary from "./src/model/salary.js";
import Laterpad from "./src/model/laterpad.js";
import Party from "./src/model/party.js";

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to MongoDB
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vyapar_local";
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Bill.deleteMany({});
    await Product.deleteMany({});
    await Company.deleteMany({});
    await Expance.deleteMany({});
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
      plan: "free", // Default to free plan
      freeBillCount: 0,
      maxFreeBills: 50, // Set free bill limit
    });
    console.log("✅ Created company");

    // Create demo user
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

    // Create demo party (customer)
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

    // Create demo products
    const products = await Product.create([
      {
        name: "Laptop",
        sku: "LAP001",
        companyId: company._id,
        quantity: 10,
        price: 50000,
        category: "Electronics",
        description: "High-performance laptop",
      },
      {
        name: "Mouse",
        sku: "MOU001",
        companyId: company._id,
        quantity: 50,
        price: 500,
        category: "Accessories",
        description: "Wireless mouse",
      },
      {
        name: "Keyboard",
        sku: "KEY001",
        companyId: company._id,
        quantity: 30,
        price: 1500,
        category: "Accessories",
        description: "Mechanical keyboard",
      },
    ]);
    console.log("✅ Created demo products");

    // Create demo bills
    const bills = await Bill.create([
      {
        billNumber: "INV001",
        companyId: company._id,
        customerName: "John Doe",
        partyId: party._id,
        items: [
          { productId: products[0]._id, quantity: 1, price: 50000 },
        ],
        total: 50000,
        tax: 9000,
        status: "issued",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        billNumber: "INV002",
        companyId: company._id,
        customerName: "Jane Smith",
        partyId: party._id,
        items: [
          { productId: products[1]._id, quantity: 5, price: 500 },
          { productId: products[2]._id, quantity: 2, price: 1500 },
        ],
        total: 5500,
        tax: 990,
        status: "draft",
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
    ]);
    console.log("✅ Created demo bills");

    // Create demo expenses
    const expenses = await Expance.create([
      {
        title: "Office Rent - January",
        companyId: company._id,
        category: "Rent",
        description: "Office rent for January",
        amount: 50000,
        date: new Date(),
      },
      {
        title: "Electricity Bill - January",
        companyId: company._id,
        category: "Utilities",
        description: "Electricity bill",
        amount: 5000,
        date: new Date(),
      },
    ]);
    console.log("✅ Created demo expenses");

    // Create demo salaries
    const salaries = await Salary.create([
      {
        employeeName: "Raj Kumar",
        companyId: company._id,
        position: "Manager",
        amount: 35000,
        month: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
        isPaid: false,
      },
      {
        employeeName: "Priya Singh",
        companyId: company._id,
        position: "Developer",
        amount: 40000,
        month: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
        isPaid: true,
      },
    ]);
    console.log("✅ Created demo salaries");

    // Create demo late payments
    const latepayments = await Laterpad.create([
      {
        companyId: company._id,
        title: "Late Payment - INV001",
        billNumber: "INV001",
        customerName: "John Doe",
        amount: 59000,
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days late
      },
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
