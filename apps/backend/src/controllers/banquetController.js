import BanquetHall from "../model/banquetHall.js";
import BanquetBooking from "../model/banquetBooking.js";

// 1. GET ALL HALLS (Auto-seed if empty)
export const getHalls = async (req, res) => {
  try {
    let halls = await BanquetHall.find({ isActive: true }).sort({ capacitySeated: -1 });

    if (!halls || halls.length === 0) {
      const defaultHalls = [
        {
          name: "Grand Royal Ballroom (सेंट्रल AC)",
          code: "HALL-ROYAL",
          venueType: "hall",
          capacitySeated: 200,
          capacityFloating: 350,
          baseRent: 15000,
          minPaxGuaranteed: 75,
          freeHallMinPax: 75,
          lowPaxHallRent: 12000,
          amenities: ["Central AC", "Bridal Green Room", "Crystal Stage Lighting", "Surround Sound DJ", "Generator Backup", "Valet Parking"]
        },
        {
          name: "Crystal Celebration Lounge (पार्टी हॉल)",
          code: "HALL-CRYSTAL",
          venueType: "hall",
          capacitySeated: 80,
          capacityFloating: 140,
          baseRent: 8000,
          minPaxGuaranteed: 40,
          freeHallMinPax: 50,
          lowPaxHallRent: 7000,
          amenities: ["AC", "Lounge Sofas", "Mood Lighting", "Sound System", "Dedicated Washrooms"]
        },
        {
          name: "Emerald Green Party Lawn (खुला लॉन)",
          code: "LAWN-EMERALD",
          venueType: "lawn",
          capacitySeated: 300,
          capacityFloating: 600,
          baseRent: 20000,
          minPaxGuaranteed: 100,
          freeHallMinPax: 120,
          lowPaxHallRent: 15000,
          amenities: ["Open Air Theme", "Live Tandoor & Chaat Pavilion", "Stage Setup", "Gazebo Seating", "High-Power Flood Lights"]
        }
      ];

      halls = await BanquetHall.insertMany(defaultHalls);
    }

    res.json({ success: true, halls });
  } catch (error) {
    console.error("Error fetching banquet halls:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. CREATE HALL
export const createHall = async (req, res) => {
  try {
    const hall = new BanquetHall(req.body);
    await hall.save();
    res.status(201).json({ success: true, hall });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 3. GET BOOKINGS WITH FILTERS
export const getBookings = async (req, res) => {
  try {
    const { startDate, endDate, status, hallId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (hallId) filter.hallId = hallId;

    if (startDate && endDate) {
      filter.eventDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.eventDate = { $gte: startDate };
    }

    const bookings = await BanquetBooking.find(filter).sort({ eventDate: 1, timeSlot: 1 });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching banquet bookings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. CHECK SLOT AVAILABILITY (Prevent Double Booking)
export const checkSlotAvailability = async (req, res) => {
  try {
    const { eventDate, timeSlot, hallId } = req.query;

    if (!eventDate || !timeSlot || !hallId) {
      return res.status(400).json({ success: false, message: "Date, slot and hallId required" });
    }

    // A slot is locked if an active booking exists for the same hall on that date
    // Note: 'full_day' locks both morning and evening slots!
    const conflictQuery = {
      hallId,
      eventDate,
      status: { $in: ["confirmed", "ongoing", "inquiry"] },
      $or: [
        { timeSlot },
        { timeSlot: "full_day" },
        ...(timeSlot === "full_day" ? [{ timeSlot: "morning" }, { timeSlot: "evening" }] : [])
      ]
    };

    const existingBooking = await BanquetBooking.findOne(conflictQuery);

    if (existingBooking) {
      return res.json({
        available: false,
        lockedBy: {
          bookingNo: existingBooking.bookingNo,
          customerName: existingBooking.customerName,
          customerMobile: existingBooking.customerMobile,
          eventName: existingBooking.eventName,
          timeSlot: existingBooking.timeSlot,
          status: existingBooking.status
        }
      });
    }

    res.json({ available: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. CREATE BANQUET BOOKING
export const createBooking = async (req, res) => {
  try {
    const data = req.body;

    // Strict slot lock verification
    const conflictQuery = {
      hallId: data.hallId,
      eventDate: data.eventDate,
      status: { $in: ["confirmed", "ongoing"] },
      $or: [
        { timeSlot: data.timeSlot },
        { timeSlot: "full_day" },
        ...(data.timeSlot === "full_day" ? [{ timeSlot: "morning" }, { timeSlot: "evening" }] : [])
      ]
    };

    const existing = await BanquetBooking.findOne(conflictQuery);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `यह स्लॉट पहले से ही '${existing.customerName}' (${existing.bookingNo}) के लिए लॉक है! कृपया दूसरा हॉल या तारीख चुनें।`
      });
    }

    // Auto-generate unique booking number
    const count = await BanquetBooking.countDocuments();
    const dateStr = data.eventDate.replace(/-/g, "").slice(2);
    const bookingNo = `BKT-${dateStr}-${(count + 1).toString().padStart(3, "0")}`;

    // Calculate smart financials
    const pax = Number(data.minGuaranteedPax) || 50;
    const plateRate = Number(data.finalRatePerPlate) || Number(data.baseRatePerPlate) || 500;
    const foodCostTotal = pax * plateRate;

    // Minimum plate vs hall rent rule
    let calculatedHallRent = Number(data.hallRent) || 0;
    const freePaxThreshold = Number(data.freeHallMinPax) || 75;
    if (pax >= freePaxThreshold) {
      calculatedHallRent = 0; // Free hall rent!
    }

    // Addons calculation
    const addonsTotal = (data.addons || []).reduce((sum, a) => sum + (a.isIncluded ? Number(a.price || 0) : 0), 0);
    const totalEst = foodCostTotal + calculatedHallRent + addonsTotal;
    const advPaid = Number(data.advancePaid) || 0;
    const balDue = Math.max(0, totalEst - advPaid);

    const booking = new BanquetBooking({
      ...data,
      bookingNo,
      hallRent: calculatedHallRent,
      totalEstimatedAmount: totalEst,
      balanceDue: balDue,
      paymentStatus: advPaid >= totalEst ? "fully_settled" : advPaid > 0 ? "advance_paid" : "unpaid",
      status: data.status || "confirmed"
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: `बैंक्वेट बुकिंग '${bookingNo}' सफलतापूर्वक लॉक व दर्ज हो गई!`,
      booking
    });
  } catch (error) {
    console.error("Error creating banquet booking:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// 6. UPDATE BOOKING OR RECORD SETTLEMENT
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Recalculate balances if advance or final amounts are updated
    if (updates.advancePaid !== undefined || updates.totalEstimatedAmount !== undefined) {
      const tot = Number(updates.totalEstimatedAmount || 0);
      const adv = Number(updates.advancePaid || 0);
      updates.balanceDue = Math.max(0, tot - adv);
      updates.paymentStatus = adv >= tot ? "fully_settled" : adv > 0 ? "advance_paid" : "unpaid";
    }

    updates.updatedAt = new Date();

    const booking = await BanquetBooking.findByIdAndUpdate(id, updates, { new: true });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 7. GET MONTHLY CALENDAR MATRIX
export const getCalendarMatrix = async (req, res) => {
  try {
    const { month, year } = req.query;
    const curYear = Number(year) || new Date().getFullYear();
    const curMonth = Number(month) || (new Date().getMonth() + 1);

    const monthStr = curMonth.toString().padStart(2, "0");
    const startPattern = `${curYear}-${monthStr}-01`;
    const endPattern = `${curYear}-${monthStr}-31`;

    const bookings = await BanquetBooking.find({
      eventDate: { $gte: startPattern, $lte: endPattern },
      status: { $ne: "cancelled" }
    });

    const halls = await BanquetHall.find({ isActive: true });

    res.json({
      success: true,
      year: curYear,
      month: curMonth,
      halls,
      bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. GENERATE KITCHEN INDENT (Central Kitchen Grocery Requisition)
export const generateKitchenIndent = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await BanquetBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const pax = Number(booking.minGuaranteedPax) || 50;

    // Standard Catering Recipe Estimator per 100 pax
    const indentItems = [
      { rawMaterialName: "ताजा पनीर (Fresh Dairy Paneer)", estimatedQty: Math.round(pax * 0.12), unit: "kg", costAllocated: Math.round(pax * 0.12 * 360) },
      { rawMaterialName: "बासमती बिरयानी चावल (Basmati Rice)", estimatedQty: Math.round(pax * 0.08), unit: "kg", costAllocated: Math.round(pax * 0.08 * 95) },
      { rawMaterialName: "शुद्ध देसी घी व बटर (Pure Ghee & Butter)", estimatedQty: Math.round(pax * 0.04), unit: "kg", costAllocated: Math.round(pax * 0.04 * 550) },
      { rawMaterialName: "मैदा व गेहूं आटा (Flour for Naan/Roti)", estimatedQty: Math.round(pax * 0.10), unit: "kg", costAllocated: Math.round(pax * 0.10 * 38) },
      { rawMaterialName: "काली दाल व राजमा (Dal Makhani Raw)", estimatedQty: Math.round(pax * 0.05), unit: "kg", costAllocated: Math.round(pax * 0.05 * 140) },
      { rawMaterialName: "ताजी हरी सब्जियां व सलाद (Veggies & Salad)", estimatedQty: Math.round(pax * 0.15), unit: "kg", costAllocated: Math.round(pax * 0.15 * 50) },
      { rawMaterialName: "कमर्शियल रसोई गैस सिलेंडर (LPG Cylinders)", estimatedQty: pax >= 150 ? 2 : 1, unit: "Cylinder", costAllocated: (pax >= 150 ? 2 : 1) * 1850 }
    ];

    booking.kitchenIndent = indentItems;
    booking.kitchenSyncMode = "shared_restaurant";
    await booking.save();

    res.json({
      success: true,
      message: "केंद्रीय रसोई मांग-पत्र (Kitchen Indent) सफलतापूर्वक जनरेट हो गया!",
      indent: indentItems,
      totalEstimatedRawCost: indentItems.reduce((s, i) => s + i.costAllocated, 0)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
