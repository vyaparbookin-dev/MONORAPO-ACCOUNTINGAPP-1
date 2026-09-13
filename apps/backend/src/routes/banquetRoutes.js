import express from "express";
import {
  getHalls,
  createHall,
  getBookings,
  checkSlotAvailability,
  createBooking,
  updateBooking,
  getCalendarMatrix,
  generateKitchenIndent
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

export default router;
