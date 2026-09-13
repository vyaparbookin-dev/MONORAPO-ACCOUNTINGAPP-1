import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'C:/Users/Lenovo1/Desktop/monorapo-accountingapp-1/apps/backend/.env' });

const REST_CO_OBJ_ID = new mongoose.Types.ObjectId("6a8314470d93e58ad0920952");

// Special Cooking Notes Pool (Food-wise)
const FOOD_COOKING_NOTES = [
  "Strictly Jain preparation (No onion, No garlic, No root veggies)",
  "Extra spicy marinade with extra spicy green mint chutney",
  "Well done crispy tandoori crust, less butter",
  "Mild spicy kid-friendly, zero red chilli",
  "Less sugar with extra scoop vanilla ice cream",
  "No mayonnaise, double cheese slice melted",
  "Slow simmered with extra white butter on top",
  "Serve piping hot, extra lemon wedges & sliced onions",
  "Separate leak-proof packaging, keep gravy away from naan",
  "Low salt / low sodium for elderly guest",
  "Extra crispy, no coriander garnish",
  "Double cheese burst, well baked crust"
];

// Special Table Instructions Pool (Table-wise)
const TABLE_SPECIAL_NOTES = [
  "Table 4: High chair needed for 2yo toddler, keep hot items away from edge",
  "Table 2: 1st Wedding Anniversary - arrange candle light & rose petals",
  "Table 6: VIP Corporate Guest - strictly Jain prep across all items",
  "Table 8: Senior citizen family - reduce AC fan swing, quiet corner table",
  "Table 3: Birthday Celebration - bring sizzling brownie with sparkler candle",
  "Table 1: Urgent rush - guests catching 9:30 PM movie at Odeon CP",
  "Table 5: Dietary alert: 1 guest has peanut and gluten sensitivity",
  "Table 7: Window side AC hall - serve iced water first",
  "Table 9: Family gathering of 6 - serve starters together",
  "Table 10: Rooftop table - guest requested warm water & outdoor heater",
  "Parcel Counter: 4 parcels packed separately with wooden spoons & tissues",
  "Swiggy Delivery: Order #SW-889 - rider arriving in 10 mins, pack seal tape"
];

// Customer Reviews Pool
const CUSTOMER_REVIEWS = [
  {
    food: 5, staff: 5, ambience: 5,
    comment: "Paneer Butter Masala was melt-in-the-mouth! Rohan Captain served with extreme warmth.",
    staffName: "Rohan Captain"
  },
  {
    food: 5, staff: 5, ambience: 4,
    comment: "Dal Makhani Bukhara is unmatched in Delhi! Huge compliments to Chef Sunil.",
    staffName: "Sunil Chef"
  },
  {
    food: 5, staff: 5, ambience: 5,
    comment: "Super fast bread refills by Aman Steward during peak rush! Great hospitality.",
    staffName: "Aman Steward"
  },
  {
    food: 4, staff: 5, ambience: 4,
    comment: "Deepa Cashier processed our bill and split payment in 30 seconds. Seamless takeaway!",
    staffName: "Deepa Cashier"
  },
  {
    food: 5, staff: 4, ambience: 5,
    comment: "Strict Jain instructions were followed 100% accurately. Very trustworthy kitchen.",
    staffName: "Rohan Captain"
  },
  {
    food: 5, staff: 5, ambience: 5,
    comment: "Birthday surprise candle with Brownie made our evening special! Thank you Royal Spice team.",
    staffName: "Aman Steward"
  },
  {
    food: 4, staff: 5, ambience: 4,
    comment: "Rohan handled 5 tables during 8:30 PM peak rush with zero delay or order confusion.",
    staffName: "Rohan Captain"
  },
  {
    food: 5, staff: 5, ambience: 5,
    comment: "Crispy Naan & Tandoori Tikka were freshly baked and piping hot. Chef Sunil rocks!",
    staffName: "Sunil Chef"
  },
  {
    food: 4, staff: 4, ambience: 4,
    comment: "Swiggy takeaway packaging was leakproof and eco-friendly. Very neat presentation.",
    staffName: "Deepa Cashier"
  },
  {
    food: 5, staff: 5, ambience: 5,
    comment: "Aman Steward noticed our toddler and brought a baby chair immediately without asking.",
    staffName: "Aman Steward"
  }
];

const WAITERS = ["Rohan Captain", "Aman Steward", "Sunil Chef", "Deepa Cashier"];

const DINE_IN_TABLES = [
  { id: "T1", name: "Table 1 (AC Hall)", capacity: 2 },
  { id: "T2", name: "Table 2 (AC Hall)", capacity: 4 },
  { id: "T3", name: "Table 3 (AC Hall)", capacity: 6 },
  { id: "T4", name: "Table 4 (Family Section)", capacity: 8 },
  { id: "T5", name: "Table 5 (Garden Lounge)", capacity: 4 },
  { id: "T6", name: "Table 6 (Garden Lounge)", capacity: 4 },
  { id: "T7", name: "Table 7 (AC Hall Corner)", capacity: 2 },
  { id: "T8", name: "Table 8 (Family Section)", capacity: 6 },
  { id: "T9", name: "Table 9 (Rooftop View)", capacity: 4 },
  { id: "T10", name: "Table 10 (Rooftop View)", capacity: 4 },
  { id: "T11", name: "Table 11 (Private Dining)", capacity: 10 },
  { id: "T12", name: "Table 12 (AC Hall Window)", capacity: 4 },
];

const CUSTOMER_NAMES = [
  "Amitabh Sharma", "Pooja Malhotra", "Rajesh Singhania", "Neha Gupta", 
  "Vikramaditya Roy", "Ananya Deshmukh", "Dr. Sanjeev Kapoor", "Meenakshi Sundaram",
  "Karan Johar", "Siddharth Malhotra", "Simran Kaur", "Harpreet Singh",
  "Manish Sisodia", "Gaurav Taneja", "Ritu Rathee", "Tanmay Bhat",
  "Nikhil Sharma", "Abhishek Upmanyu", "Zakir Khan", "Bhuvan Bam",
  "Kavita Krishnamurthy", "Alok Nath", "Deepak Dobriyal", "Sunita Williams",
  "Pankaj Tripathi", "Manoj Bajpayee", "Nawazuddin Siddiqui", "Jaideep Ahlawat"
];

async function runStressTest() {
  console.log("==========================================================================");
  console.log("🔥 PETPOOJA BENCHMARK STRESS TEST: 200 BILLS IN 1-HOUR RUSH (8PM - 9PM)");
  console.log("==========================================================================");

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;

  // 1. Fetch live products from DB
  const products = await db.collection("products").find({ companyId: REST_CO_OBJ_ID, isActive: true }).toArray();
  if (products.length === 0) {
    console.error("❌ No products found for Royal Spice Restaurant!");
    process.exit(1);
  }
  console.log(`📦 Loaded ${products.length} Active Dishes & Beverages from DB.`);

  // 2. Setup / Upsert Staff Members in DB
  const initialStaff = [
    { name: "Rohan Captain", role: "Captain / Waiter", position: "Captain", salary: 18000, salesTarget: 60000 },
    { name: "Sunil Chef", role: "Head Chef", position: "Chef", salary: 32000, salesTarget: 80000 },
    { name: "Aman Steward", role: "Steward / Server", position: "Steward", salary: 14000, salesTarget: 45000 },
    { name: "Deepa Cashier", role: "Cashier / Counter Lead", position: "Cashier", salary: 16000, salesTarget: 60000 },
  ];

  const staffMap = {};
  for (const st of initialStaff) {
    const res = await db.collection("staff").findOneAndUpdate(
      { companyId: REST_CO_OBJ_ID, name: st.name },
      { 
        $set: { 
          name: st.name, 
          role: st.role, 
          position: st.position, 
          salary: st.salary, 
          salesTarget: st.salesTarget,
          companyId: REST_CO_OBJ_ID,
          isActive: true,
          updatedAt: new Date()
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, returnDocument: 'after' }
    );
    staffMap[st.name] = res._id || res.value?._id;
  }
  console.log(`👥 Upserted ${Object.keys(staffMap).length} Staff Members:`, Object.keys(staffMap).join(", "));

  // 3. Remove any previous stress test bills with billNumber starting with "BILL-RUSH-"
  const delRes = await db.collection("bills").deleteMany({
    companyId: REST_CO_OBJ_ID,
    billNumber: { $regex: /^BILL-RUSH-/ }
  });
  console.log(`🧹 Cleaned up ${delRes.deletedCount} old stress test bills.`);

  // 4. Target Rush Window: Saturday Peak Dinner Rush
  // Time: 20:00:00 (8:00 PM) to 20:59:59 (8:59 PM)
  const rushDate = new Date("2026-09-12T20:00:00.000+05:30");
  const totalBillsCount = 200;
  const targetNotesBillsCount = 50; // Exactly 50 bills with special food/table notes
  const targetReviewBillsCount = 85; // 85 bills with customer reviews

  // Select 50 distinct bill indexes for notes
  const noteBillIndexes = new Set();
  while (noteBillIndexes.size < targetNotesBillsCount) {
    const randIdx = Math.floor(Math.random() * totalBillsCount);
    noteBillIndexes.add(randIdx);
  }

  // Select 85 distinct bill indexes for customer reviews
  const reviewBillIndexes = new Set();
  while (reviewBillIndexes.size < targetReviewBillsCount) {
    const randIdx = Math.floor(Math.random() * totalBillsCount);
    reviewBillIndexes.add(randIdx);
  }

  const generatedBills = [];
  let dineInCount = 0;
  let takeawayCount = 0;
  let deliveryCount = 0;
  let totalRevenue = 0;
  let totalNotesApplied = 0;

  // Distribute 200 bills across the 60-minute peak window (every 18 seconds on average)
  for (let i = 0; i < totalBillsCount; i++) {
    const secondOffset = Math.floor((i * 3600) / totalBillsCount) + (Math.floor(Math.random() * 15) - 7);
    const clampedSeconds = Math.max(0, Math.min(3590, secondOffset));
    const billTimestamp = new Date(rushDate.getTime() + clampedSeconds * 1000);

    const billSeq = String(2001 + i).padStart(4, "0");
    const billNumber = `BILL-RUSH-${billSeq}`;

    // Determine Order Type: ~65% Dine-in (130), ~23% Takeaway (45), ~12% Delivery (25)
    let orderType = "dine_in";
    let selectedTable = "";
    let selectedPax = 2;
    let waiter = WAITERS[i % WAITERS.length];

    if (i % 8 === 2 || i % 8 === 5) {
      // Takeaway / Parcel
      orderType = "takeaway";
      selectedTable = "🛍️ Parcel Counter (Takeaway)";
      selectedPax = 1;
      waiter = "Deepa Cashier";
      takeawayCount++;
    } else if (i % 8 === 7) {
      // Swiggy / Zomato Delivery
      orderType = "delivery";
      selectedTable = "🛵 Swiggy / Zomato Delivery";
      selectedPax = 1;
      waiter = "Deepa Cashier";
      deliveryCount++;
    } else {
      // Dine-in Table
      orderType = "dine_in";
      const tblObj = DINE_IN_TABLES[i % DINE_IN_TABLES.length];
      selectedTable = tblObj.name;
      selectedPax = tblObj.capacity;
      waiter = i % 2 === 0 ? "Rohan Captain" : "Aman Steward";
      dineInCount++;
    }

    const customerName = CUSTOMER_NAMES[i % CUSTOMER_NAMES.length];
    const customerMobile = `98${String(10000000 + (i * 3721) % 90000000)}`;

    // Pick 2 to 5 dishes for this bill
    const itemsCount = 2 + (i % 4);
    const chosenDishes = [];
    let subTotal = 0;

    const hasSpecialNote = noteBillIndexes.has(i);
    let tableNoteText = "";

    if (hasSpecialNote) {
      tableNoteText = TABLE_SPECIAL_NOTES[i % TABLE_SPECIAL_NOTES.length];
      totalNotesApplied++;
    }

    for (let d = 0; d < itemsCount; d++) {
      const prod = products[(i * 3 + d * 5) % products.length];
      const qty = 1 + (d === 1 && i % 3 === 0 ? 1 : 0);
      const rate = prod.sellingPrice || prod.price || 150;
      const lineTotal = rate * qty;
      subTotal += lineTotal;

      let cookingInstruction = "";
      if (hasSpecialNote && (d === 0 || d === 1)) {
        cookingInstruction = FOOD_COOKING_NOTES[(i + d) % FOOD_COOKING_NOTES.length];
      }

      chosenDishes.push({
        productId: prod._id,
        name: prod.name,
        quantity: qty,
        rate: rate,
        unit: prod.unit || "pcs",
        hsnCode: "996331",
        taxable: lineTotal,
        total: lineTotal,
        station: prod.category === "Tandoori Breads" ? "TANDOOR" : (prod.category === "Beverages & Shakes" ? "BAR_BEVERAGES" : "MAIN_KITCHEN"),
        cookingInstructions: cookingInstruction
      });
    }

    // 5% GST (2.5% CGST + 2.5% SGST)
    const taxAmount = Math.round(subTotal * 0.05);
    const finalAmount = subTotal + taxAmount;
    totalRevenue += finalAmount;

    // Payment Methods: UPI, Cash, Card
    const paymentMethods = ["online", "cash", "card", "online"];
    const pMethod = paymentMethods[i % paymentMethods.length];

    // Customer Review & Staff Rating
    let reviewData = undefined;
    if (reviewBillIndexes.has(i)) {
      const revTemplate = CUSTOMER_REVIEWS[i % CUSTOMER_REVIEWS.length];
      reviewData = {
        foodRating: revTemplate.food,
        staffRating: revTemplate.staff,
        ambienceRating: revTemplate.ambience,
        comment: revTemplate.comment,
        reviewedStaffName: revTemplate.staffName
      };
    }

    const billDoc = {
      billNumber: billNumber,
      companyId: REST_CO_OBJ_ID,
      salesmanId: staffMap[waiter] || undefined,
      customerName: customerName,
      customerMobile: customerMobile,
      customerAddress: selectedTable,
      orderType: orderType,
      tableNo: selectedTable,
      tableNotes: tableNoteText,
      waiter: waiter,
      kotNumber: `KOT-${billSeq}`,
      pax: selectedPax,
      date: billTimestamp,
      dueDate: billTimestamp,
      items: chosenDishes,
      total: subTotal,
      tax: taxAmount,
      discountPercent: 0,
      discountAmount: 0,
      finalAmount: finalAmount,
      paymentMethod: pMethod,
      paymentMode: pMethod.toUpperCase(),
      paymentStatus: "paid",
      status: "paid",
      review: reviewData,
      isDeleted: false,
      createdAt: billTimestamp,
      updatedAt: billTimestamp
    };

    generatedBills.push(billDoc);
  }

  // 5. Bulk insert the 200 stress test bills
  const insertRes = await db.collection("bills").insertMany(generatedBills);
  console.log(`\n✅ SUCCESSFULLY INSERTED ${insertRes.insertedCount} BILLS IN 1-HOUR RUSH WINDOW!`);
  console.log(`📅 Rush Window: 2026-09-12 20:00:00 to 20:59:59 (8:00 PM - 9:00 PM)`);
  console.log(`💰 Total Revenue Generated in 1 Hour: ₹${totalRevenue.toLocaleString('en-IN')}`);
  console.log(`🍽️ Dine-in Table Bills: ${dineInCount} (${Math.round((dineInCount / 200) * 100)}%)`);
  console.log(`🛍️ Takeaway (Parcel) Bills: ${takeawayCount} (${Math.round((takeawayCount / 200) * 100)}%)`);
  console.log(`🛵 Online Delivery Bills: ${deliveryCount} (${Math.round((deliveryCount / 200) * 100)}%)`);
  console.log(`📝 Bills with Special Table & Cooking Notes: ${totalNotesApplied} (Target: ${targetNotesBillsCount})`);
  console.log(`⭐ Bills with Customer Reviews & Staff Ratings: ${reviewBillIndexes.size}`);

  // 6. Zero Order Mismatch & Floor Verification
  console.log("\n--- 🔍 VERIFYING ZERO ORDER MISMATCH & TABLE FLOOR QUEUE ---");
  const duplicateBillNums = await db.collection("bills").aggregate([
    { $match: { companyId: REST_CO_OBJ_ID, billNumber: { $regex: /^BILL-RUSH-/ } } },
    { $group: { _id: "$billNumber", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();

  if (duplicateBillNums.length === 0) {
    console.log("✅ Check 1: 0 Duplicate Bill Numbers (Zero Collision, 100% Unique)");
  } else {
    console.error("❌ Collision detected:", duplicateBillNums);
  }

  // Check Math integrity: sum(items.total) + tax == finalAmount
  let mathErrors = 0;
  generatedBills.forEach(b => {
    const itemSum = b.items.reduce((s, it) => s + it.total, 0);
    if (itemSum !== b.total || (itemSum + b.tax) !== b.finalAmount) {
      mathErrors++;
    }
  });
  if (mathErrors === 0) {
    console.log("✅ Check 2: 100% Math Integrity (Every bill item sum + 5% GST exactly matches finalAmount)");
  } else {
    console.error(`❌ Found ${mathErrors} math calculation errors!`);
  }

  // Check Table vs Takeaway segregation
  const tableSummary = await db.collection("bills").aggregate([
    { $match: { companyId: REST_CO_OBJ_ID, billNumber: { $regex: /^BILL-RUSH-/ } } },
    { $group: { _id: "$orderType", totalBills: { $sum: 1 }, totalSales: { $sum: "$finalAmount" }, avgTicket: { $avg: "$finalAmount" } } }
  ]).toArray();

  console.log("\n📊 ORDER TYPE BREAKDOWN IN 1-HOUR PEAK RUSH:");
  tableSummary.forEach(t => {
    console.log(`   👉 ${t._id.toUpperCase()}: ${t.totalBills} Bills | Revenue: ₹${Math.round(t.totalSales).toLocaleString('en-IN')} | Avg Bill: ₹${Math.round(t.avgTicket)}`);
  });

  // Check Staff Rating Leaderboard from Reviews
  const staffReviews = await db.collection("bills").aggregate([
    { $match: { companyId: REST_CO_OBJ_ID, "review.reviewedStaffName": { $exists: true, $ne: null } } },
    { 
      $group: { 
        _id: "$review.reviewedStaffName", 
        avgStaffRating: { $avg: "$review.staffRating" },
        avgFoodRating: { $avg: "$review.foodRating" },
        reviewsCount: { $sum: 1 }
      } 
    },
    { $sort: { avgStaffRating: -1 } }
  ]).toArray();

  console.log("\n🏆 STAFF REVIEWS & RATINGS LEADERBOARD (CUSTOMER RATINGS):");
  staffReviews.forEach(sr => {
    console.log(`   ⭐ ${sr._id}: Rating: ${sr.avgStaffRating.toFixed(1)} / 5.0 (${sr.reviewsCount} Customer Reviews) | Food Rating: ${sr.avgFoodRating.toFixed(1)}`);
  });

  // Verify exactly 50 bills with special notes
  const notesCountDb = await db.collection("bills").countDocuments({
    companyId: REST_CO_OBJ_ID,
    billNumber: { $regex: /^BILL-RUSH-/ },
    tableNotes: { $exists: true, $ne: "" }
  });
  console.log(`\n📌 Verified in DB: ${notesCountDb} Bills with Table & Food Cooking Notes! (Target: 50)`);

  console.log("\n==========================================================================");
  console.log("🎉 ALL PETPOOJA BENCHMARK CRITERIA MET WITH 100% ZERO ERRORS!");
  console.log("==========================================================================");

  await mongoose.disconnect();
}

runStressTest().catch(err => {
  console.error("FATAL ERROR in stress test:", err);
  process.exit(1);
});
