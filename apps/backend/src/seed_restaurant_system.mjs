import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { supabase } from './config/supabase.js';

dotenv.config({ path: 'C:/Users/Lenovo1/Desktop/monorapo-accountingapp-1/apps/backend/.env' });

function mongoIdToUuid(mongoId) {
  if (!mongoId) return null;
  const hash = crypto.createHash('md5').update(String(mongoId)).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

const REST_CO_OBJ_ID = new mongoose.Types.ObjectId("6a8314470d93e58ad0920952");
const REST_CO_UUID = mongoIdToUuid("6a8314470d93e58ad0920952");

async function seedRestaurantSystem() {
  console.log("=== SEEDING COMPREHENSIVE 7-DAY LIVE RESTAURANT SYSTEM ===");
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;

  // 1. Create/Update Restaurant Company in MongoDB & Supabase
  const companyDoc = {
    _id: REST_CO_OBJ_ID,
    name: "🍽️ Royal Spice Restaurant & Cafe",
    businessType: "restaurant",
    industryType: "restaurant",
    ownerEmail: "demo@vyaparbook.in",
    email: "demo@vyaparbook.in",
    phone: "9876543210",
    address: "12 Food Street, Connaught Place, New Delhi",
    gstin: "07AAAAA0000A1Z5",
    plan: "pro",
    freeBillCount: 0,
    maxFreeBills: 10000,
    isDemo: true,
    createdAt: new Date(Date.now() - 30 * 86400000),
    updatedAt: new Date()
  };

  await db.collection("companies").updateOne(
    { _id: REST_CO_OBJ_ID },
    { $set: companyDoc },
    { upsert: true }
  );
  console.log("✅ Restaurant Company Saved in MongoDB Atlas:", companyDoc.name);

  if (supabase) {
    try {
      const { error: sbErr } = await supabase.from("companies").upsert({
        id: REST_CO_UUID,
        name: companyDoc.name,
        email: companyDoc.email,
        phone_number: companyDoc.phone,
        gst_number: companyDoc.gstin,
        address: companyDoc.address,
        is_active: true
      });
      if (sbErr) console.warn("Supabase company error:", sbErr.message);
    } catch (e) {
      console.warn("Supabase company error:", e.message);
    }
  }

  // 2. Seed Restaurant Categories
  const categoriesData = [
    { name: "Starters & Snacks", desc: "Tandoori, Crispy & Fried appetisers" },
    { name: "Main Course", desc: "Curries, Gravies & Dal Specialities" },
    { name: "Tandoori Breads", desc: "Naan, Roti, Paratha & Kulcha" },
    { name: "Rice & Dum Biryani", desc: "Basmati Biryanis, Pulao & Steamed Rice" },
    { name: "Pizza & Fast Food", desc: "Wood-fired Pizzas, Burgers & Sandwiches" },
    { name: "Beverages & Shakes", desc: "Mocktails, Coffee, Shakes & Soft Drinks" },
    { name: "Desserts & Sweets", desc: "Ice Creams, Gulab Jamun & Brownies" },
    { name: "Kitchen Raw Materials", desc: "Paneer, Dairy, Spices, Flour & Gas" }
  ];

  const catMap = {};
  for (const c of categoriesData) {
    const existing = await db.collection("categories").findOneAndUpdate(
      { companyId: REST_CO_OBJ_ID, name: c.name },
      { 
        $set: { 
          name: c.name, 
          description: c.desc, 
          companyId: REST_CO_OBJ_ID, 
          isActive: true,
          updatedAt: new Date() 
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    );
    catMap[c.name] = existing._id || existing.value?._id;
  }
  console.log("✅ Restaurant Categories Seeded:", Object.keys(catMap).length);

  // 3. Seed Restaurant Menu Items & Raw Material Products
  const productsList = [
    // --- MAIN COURSE ---
    { name: "🍛 Shahi Paneer Butter Masala", cat: "Main Course", price: 240, cost: 110, stock: 45, unit: "plt", barcode: "890101", veg: true, rating: 4.8 },
    { name: "🍲 Dal Makhani Bukhara", cat: "Main Course", price: 210, cost: 85, stock: 50, unit: "plt", barcode: "890102", veg: true, rating: 4.9 },
    { name: "🥘 Kadhai Paneer Special", cat: "Main Course", price: 250, cost: 115, stock: 35, unit: "plt", barcode: "890103", veg: true, rating: 4.7 },
    { name: "🍗 Butter Chicken Boneless", cat: "Main Course", price: 340, cost: 160, stock: 30, unit: "plt", barcode: "890104", veg: false, rating: 4.9 },
    { name: "🍗 Kadhai Chicken Gravy", cat: "Main Course", price: 320, cost: 150, stock: 25, unit: "plt", barcode: "890105", veg: false, rating: 4.8 },
    { name: "🍄 Mushroom Masala Curry", cat: "Main Course", price: 220, cost: 95, stock: 30, unit: "plt", barcode: "890106", veg: true, rating: 4.6 },

    // --- BREADS ---
    { name: "🫓 Butter Garlic Tandoori Naan", cat: "Tandoori Breads", price: 45, cost: 15, stock: 250, unit: "pcs", barcode: "890107", veg: true, rating: 4.9 },
    { name: "🫓 Plain Butter Naan", cat: "Tandoori Breads", price: 40, cost: 12, stock: 200, unit: "pcs", barcode: "890108", veg: true, rating: 4.7 },
    { name: "🫓 Tandoori Roti with Butter", cat: "Tandoori Breads", price: 20, cost: 6, stock: 300, unit: "pcs", barcode: "890109", veg: true, rating: 4.8 },
    { name: "🫓 Laccha Paratha Crispy", cat: "Tandoori Breads", price: 50, cost: 18, stock: 150, unit: "pcs", barcode: "890110", veg: true, rating: 4.8 },

    // --- RICE & BIRYANI ---
    { name: "🍚 Veg Dum Biryani with Handi Raita", cat: "Rice & Dum Biryani", price: 220, cost: 95, stock: 40, unit: "plt", barcode: "890111", veg: true, rating: 4.9 },
    { name: "🍗 Chicken Dum Biryani Handi", cat: "Rice & Dum Biryani", price: 290, cost: 135, stock: 35, unit: "plt", barcode: "890112", veg: false, rating: 4.9 },
    { name: "🍚 Jeera Fried Rice Bowl", cat: "Rice & Dum Biryani", price: 140, cost: 45, stock: 60, unit: "plt", barcode: "890113", veg: true, rating: 4.7 },

    // --- STARTERS ---
    { name: "🍢 Paneer Tikka Tandoori Dry", cat: "Starters & Snacks", price: 240, cost: 105, stock: 35, unit: "plt", barcode: "890114", veg: true, rating: 4.8 },
    { name: "🌽 Crispy Chilli Babycorn", cat: "Starters & Snacks", price: 190, cost: 80, stock: 30, unit: "plt", barcode: "890115", veg: true, rating: 4.7 },
    { name: "🍗 Tandoori Chicken Half (4 Pcs)", cat: "Starters & Snacks", price: 260, cost: 120, stock: 25, unit: "plt", barcode: "890116", veg: false, rating: 4.9 },
    { name: "🥟 Veg Spring Roll (6 Pcs)", cat: "Starters & Snacks", price: 160, cost: 65, stock: 40, unit: "plt", barcode: "890117", veg: true, rating: 4.6 },

    // --- PIZZA & FAST FOOD ---
    { name: "🍕 Farmhouse Cheese Burst Pizza 8\"", cat: "Pizza & Fast Food", price: 280, cost: 130, stock: 30, unit: "pcs", barcode: "890118", veg: true, rating: 4.8 },
    { name: "🍔 Crispy Veg Supreme Burger", cat: "Pizza & Fast Food", price: 120, cost: 55, stock: 50, unit: "pcs", barcode: "890119", veg: true, rating: 4.7 },
    { name: "🍟 Peri Peri Masala French Fries", cat: "Pizza & Fast Food", price: 100, cost: 35, stock: 60, unit: "plt", barcode: "890120", veg: true, rating: 4.7 },

    // --- BEVERAGES ---
    { name: "🥤 Cold Coffee with Vanilla Ice Cream", cat: "Beverages & Shakes", price: 95, cost: 35, stock: 80, unit: "gls", barcode: "890121", veg: true, rating: 4.9 },
    { name: "🍋 Fresh Lime Soda (Sweet & Salt)", cat: "Beverages & Shakes", price: 60, cost: 15, stock: 90, unit: "gls", barcode: "890122", veg: true, rating: 4.8 },
    { name: "🥭 Alfonso Mango Shake Thick", cat: "Beverages & Shakes", price: 110, cost: 45, stock: 50, unit: "gls", barcode: "890123", veg: true, rating: 4.8 },
    { name: "🍾 Bisleri Packaged Water 1L", cat: "Beverages & Shakes", price: 20, cost: 12, stock: 120, unit: "btl", barcode: "890124", veg: true, rating: 5.0 },

    // --- DESSERTS ---
    { name: "🍨 Gulab Jamun Hot with Rabdi (2 Pcs)", cat: "Desserts & Sweets", price: 80, cost: 30, stock: 45, unit: "plt", barcode: "890125", veg: true, rating: 4.9 },
    { name: "🍰 Sizzling Choco Brownie with Ice Cream", cat: "Desserts & Sweets", price: 150, cost: 65, stock: 35, unit: "plt", barcode: "890126", veg: true, rating: 4.9 },

    // --- KITCHEN RAW MATERIALS (STOCK INVENTORY) ---
    { name: "🥛 Fresh Dairy Paneer (कच्चा माल)", cat: "Kitchen Raw Materials", price: 340, cost: 290, stock: 30, unit: "kg", barcode: "RAW001", veg: true },
    { name: "🧈 Amul Salted Butter 500g (कच्चा माल)", cat: "Kitchen Raw Materials", price: 275, cost: 245, stock: 40, unit: "pcs", barcode: "RAW002", veg: true },
    { name: "🌾 Tandoori Maida Flour 50Kg (कच्चा माल)", cat: "Kitchen Raw Materials", price: 1900, cost: 1650, stock: 6, unit: "bag", barcode: "RAW003", veg: true },
    { name: "🌾 Daawat Biryani Basmati Rice 25Kg", cat: "Kitchen Raw Materials", price: 2800, cost: 2400, stock: 5, unit: "bag", barcode: "RAW004", veg: true },
    { name: "🛢️ Fortune Refined Oil Can 15L", cat: "Kitchen Raw Materials", price: 2100, cost: 1850, stock: 4, unit: "can", barcode: "RAW005", veg: true },
    { name: "🔥 Commercial LPG Cylinder 19Kg", cat: "Kitchen Raw Materials", price: 1950, cost: 1780, stock: 3, unit: "pcs", barcode: "RAW006", veg: true },
    { name: "📦 3-Compartment Food Delivery Meal Box", cat: "Kitchen Raw Materials", price: 15, cost: 11, stock: 400, unit: "pcs", barcode: "RAW007", veg: true }
  ];

  await db.collection("products").deleteMany({ companyId: REST_CO_OBJ_ID });
  const insertedProducts = [];
  for (const p of productsList) {
    const pDoc = {
      name: p.name,
      productName: p.name,
      companyId: REST_CO_OBJ_ID,
      category: p.cat,
      categoryId: catMap[p.cat] || null,
      price: p.price,
      sellingPrice: p.price,
      purchasePrice: p.cost,
      costPrice: p.cost,
      stock: p.stock,
      currentStock: p.stock,
      unit: p.unit,
      barcode: p.barcode,
      rating: p.rating || 4.7,
      isVeg: p.veg !== false,
      isActive: true,
      createdAt: new Date(Date.now() - 15 * 86400000),
      updatedAt: new Date()
    };
    const res = await db.collection("products").insertOne(pDoc);
    insertedProducts.push({ ...pDoc, _id: res.insertedId });
  }
  console.log(`✅ Seeded ${insertedProducts.length} Restaurant Menu Dishes & Raw Materials!`);

  // 4. Seed Parties (Customers & Suppliers)
  await db.collection("parties").deleteMany({ companyId: REST_CO_OBJ_ID });
  const partiesData = [
    { name: "Dine-in Walk-in Guest", mobileNumber: "9876543210", type: "customer", balance: 0 },
    { name: "Rahul Verma (AC Hall Regular)", mobileNumber: "7828289433", type: "customer", balance: 0 },
    { name: "Amit Sharma (Family Table)", mobileNumber: "9826112233", type: "customer", balance: 0 },
    { name: "Pooja Kesharwani", mobileNumber: "9425574230", type: "customer", balance: 0 },
    { name: "🛵 Swiggy Online Delivery", mobileNumber: "9988776655", type: "customer", balance: 0 },
    { name: "🛵 Zomato Online Delivery", mobileNumber: "9988776644", type: "customer", balance: 0 },
    { name: "Amul Dairy Products Distributor", mobileNumber: "9826001122", type: "supplier", balance: -2500 },
    { name: "Metro Cash & Carry Spice Vendor", mobileNumber: "9826003344", type: "supplier", balance: -4800 }
  ];
  const partyMap = {};
  for (const pt of partiesData) {
    const res = await db.collection("parties").insertOne({
      ...pt,
      companyId: REST_CO_OBJ_ID,
      createdAt: new Date(Date.now() - 20 * 86400000),
      updatedAt: new Date()
    });
    partyMap[pt.name] = res.insertedId;
  }
  console.log("✅ Seeded Restaurant Customers & Suppliers:", Object.keys(partyMap).length);

  // 5. Generate 7 Days of Realistic Restaurant Bills & KOTs
  await db.collection("bills").deleteMany({ companyId: REST_CO_OBJ_ID });

  const tablesPool = [
    "Table 1 (Dine-in)", "Table 2 (AC Hall)", "Table 3 (AC Hall)",
    "Table 4 (Garden Family)", "Table 5 (Garden)", "Table 6 (Rooftop View)",
    "🛍️ Parcel Counter", "🛵 Swiggy Delivery", "🛵 Zomato Delivery"
  ];
  const waitersPool = ["Rohan Captain", "Sunil Chef", "Aman Steward", "Deepa Cashier"];
  const paymentModes = ["UPI", "Cash", "Card", "UPI", "Cash"];

  const dishMenu = insertedProducts.filter(p => p.category !== "Kitchen Raw Materials");

  const sevenDaysBills = [];
  let billCounter = 1001;
  let kotCounter = 101;

  // Distribute over last 7 days (from 6 days ago up to today)
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const dayDate = new Date();
    dayDate.setDate(dayDate.getDate() - dayOffset);

    // Number of bills for this day: 7 to 11 bills
    const dailyBillCount = dayOffset === 0 ? 8 : (dayOffset === 1 || dayOffset === 2 ? 11 : 7 + (dayOffset % 3));

    for (let bIdx = 0; bIdx < dailyBillCount; bIdx++) {
      const isDinner = bIdx % 2 === 1;
      const hour = isDinner ? 19 + Math.floor(Math.random() * 4) : 12 + Math.floor(Math.random() * 3);
      const minute = Math.floor(Math.random() * 60);

      const billTime = new Date(dayDate);
      billTime.setHours(hour, minute, Math.floor(Math.random() * 60));

      const selectedTable = tablesPool[bIdx % tablesPool.length];
      const selectedWaiter = waitersPool[bIdx % waitersPool.length];
      const pMode = paymentModes[Math.floor(Math.random() * paymentModes.length)];

      const numItems = 2 + Math.floor(Math.random() * 3);
      const chosenDishes = [];
      for (let k = 0; k < numItems; k++) {
        const dish = dishMenu[(bIdx * 3 + k) % dishMenu.length];
        const qty = dish.category === "Tandoori Breads" ? 2 + Math.floor(Math.random() * 4) : (1 + Math.floor(Math.random() * 2));
        chosenDishes.push({
          productId: dish._id,
          name: dish.name,
          quantity: qty,
          rate: dish.price,
          unit: dish.unit,
          total: dish.price * qty,
          taxable: dish.price * qty
        });
      }

      const subTotal = chosenDishes.reduce((acc, it) => acc + it.total, 0);
      const cgst = Math.round(subTotal * 0.025);
      const sgst = Math.round(subTotal * 0.025);
      const finalAmount = subTotal + cgst + sgst;

      const partyNames = Object.keys(partyMap);
      const pName = selectedTable.includes("Swiggy") ? "🛵 Swiggy Online Delivery" : 
                    selectedTable.includes("Zomato") ? "🛵 Zomato Online Delivery" : 
                    partyNames[bIdx % 4];

      const billDoc = {
        billNumber: `BILL-REST-${billCounter++}`,
        companyId: REST_CO_OBJ_ID,
        partyId: partyMap[pName] || partyMap["Dine-in Walk-in Guest"],
        customerName: pName,
        customerMobile: "9876543210",
        table: selectedTable,
        waiter: selectedWaiter,
        kotNumber: `KOT-${kotCounter++}`,
        date: billTime,
        createdAt: billTime,
        items: chosenDishes,
        total: subTotal,
        tax: cgst + sgst,
        totalAmount: finalAmount,
        finalAmount: finalAmount,
        paymentMethod: pMode.toLowerCase(),
        paymentMode: pMode,
        paymentStatus: "paid",
        status: "paid",
        isDeleted: false
      };

      sevenDaysBills.push(billDoc);
    }
  }

  await db.collection("bills").insertMany(sevenDaysBills);
  const totalSales7Days = sevenDaysBills.reduce((s, b) => s + b.finalAmount, 0);
  console.log(`✅ Seeded ${sevenDaysBills.length} Live Restaurant Bills across 7 Days! Total Sales: ₹${totalSales7Days.toLocaleString()}`);

  // 6. Seed Daily Restaurant Expenses for 7 Days
  await db.collection("expenses").deleteMany({ companyId: REST_CO_OBJ_ID });
  const expensesList = [];
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() - dayOffset);
    expDate.setHours(9, 30, 0);

    expensesList.push({
      companyId: REST_CO_OBJ_ID,
      title: "दूध व ताज़ी सब्जियां (Daily Milk & Veggies)",
      amount: 450 + Math.floor(Math.random() * 300),
      category: "राशन व सब्जी",
      date: expDate,
      description: "Fresh daily dairy and organic vegetables purchase",
      status: "approved",
      isDeleted: false,
      createdAt: expDate
    });

    if (dayOffset === 5 || dayOffset === 2) {
      expensesList.push({
        companyId: REST_CO_OBJ_ID,
        title: "कमर्शियल रसोई गैस सिलेंडर (Commercial LPG)",
        amount: 1780,
        category: "किचन गैस",
        date: expDate,
        description: "19Kg Indane Commercial Cylinder refill",
        status: "approved",
        isDeleted: false,
        createdAt: expDate
      });
    }
  }

  const elecDate = new Date();
  elecDate.setDate(elecDate.getDate() - 3);
  expensesList.push({
    companyId: REST_CO_OBJ_ID,
    title: "दुकान बिजली बिल (Commercial Power)",
    amount: 2400,
    category: "बिजली बिल",
    date: elecDate,
    description: "Commercial power & kitchen refrigeration power",
    status: "approved",
    isDeleted: false,
    createdAt: elecDate
  });

  await db.collection("expenses").insertMany(expensesList);
  console.log(`✅ Seeded ${expensesList.length} Restaurant Expenses across 7 Days!`);

  // 7. Seed Staff Members (Chef, Waiter, Cashier)
  await db.collection("staffs").deleteMany({ companyId: REST_CO_OBJ_ID });
  const staffDocs = [
    {
      companyId: REST_CO_OBJ_ID,
      name: "Rohan Kumar",
      mobileNumber: "9871112233",
      position: "Floor Captain / Lead Waiter",
      role: "waiter",
      wageType: "monthly",
      salary: 16000,
      wageAmount: 16000,
      isActive: true,
      createdAt: new Date(Date.now() - 40 * 86400000)
    },
    {
      companyId: REST_CO_OBJ_ID,
      name: "Sunil Sharma",
      mobileNumber: "9872223344",
      position: "Head Chef (Tandoor & Curry)",
      role: "chef",
      wageType: "monthly",
      salary: 24000,
      wageAmount: 24000,
      isActive: true,
      createdAt: new Date(Date.now() - 40 * 86400000)
    },
    {
      companyId: REST_CO_OBJ_ID,
      name: "Deepa Patel",
      mobileNumber: "9873334455",
      position: "Counter Cashier & POS Operator",
      role: "cashier",
      wageType: "monthly",
      salary: 18000,
      wageAmount: 18000,
      isActive: true,
      createdAt: new Date(Date.now() - 40 * 86400000)
    }
  ];
  await db.collection("staffs").insertMany(staffDocs);
  console.log("✅ Seeded 3 Staff Members (Chef, Captain, Cashier)!");

  console.log("\n==================================================");
  console.log("🎉 100% COMPLETE RESTAURANT SYSTEM SEEDED SUCCESSFULLY!");
  console.log(`- Company: 🍽️ Royal Spice Restaurant & Cafe (_id: ${REST_CO_OBJ_ID})`);
  console.log(`- Products/Dishes: ${insertedProducts.length} items`);
  console.log(`- Total 7-Day Sales: ₹${totalSales7Days.toLocaleString()}`);
  console.log(`- Total 7-Day Bills: ${sevenDaysBills.length}`);
  console.log(`- Expenses: ${expensesList.length}`);
  console.log("==================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

seedRestaurantSystem().catch(err => {
  console.error("FATAL SEED ERROR:", err);
  process.exit(1);
});
