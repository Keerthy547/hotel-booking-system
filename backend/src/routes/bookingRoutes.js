import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
  createBooking,
  getMyBookings,
} from "../controllers/bookingController.js";

const router = express.Router();

// Retrieve bookings belonging to the authenticated user.
router.get("/my-bookings", protect, getMyBookings);

// Create a new booking.
router.post("/", protect, createBooking);

export default router;