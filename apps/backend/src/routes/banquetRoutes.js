import express from "express";
import {
  getHalls,
  createHall,
  getBookings,
  checkSlotAvailability,
  createBooking,
  updateBooking,
  getCalendarMatrix,
  generateKitchenIndent,
  lookupCustomerHistory,
  savePlateAudit,
  recordEventExpense,
  cancelBookingWithRefund,
  getInquiries,
  createInquiry,
  updateInquiry
} from "../controllers/banquetController.js";

const router = express.Router();

// Hall registry routes
router.get("/halls", getHalls);
router.post("/halls", createHall);

// Booking & Slot Locking routes
router.get("/bookings", getBookings);
router.post("/bookings", createBooking);
router.put("/bookings/:id", updateBooking);
router.get("/check-slot", checkSlotAvailability);
router.get("/calendar", getCalendarMatrix);

// Kitchen Raw Material Indent
router.post("/bookings/:bookingId/kitchen-indent", generateKitchenIndent);

// Customer Diner & Banquet History Lookup
router.get("/customer-history", lookupCustomerHistory);

// Plate Audit & Host Sign-Off
router.post("/bookings/:bookingId/plate-audit", savePlateAudit);

// Event Dedicated Expenses (Groceries, Gas Cylinders, External Freelancers)
router.post("/bookings/:bookingId/record-expense", recordEventExpense);

// Cancellation & Refund
router.post("/bookings/:bookingId/cancel", cancelBookingWithRefund);

// Inquiry & Leads CRM
router.get("/inquiries", getInquiries);
router.post("/inquiries", createInquiry);
router.put("/inquiries/:id", updateInquiry);

export default router;
