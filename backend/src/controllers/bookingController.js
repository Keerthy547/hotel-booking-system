import { z } from "zod";

import {
  createBookingHold,
  BookingError,
} from "../services/bookingService.js";

import {
  getMyBookings as fetchMyBookings,
} from "../services/bookingHistoryService.js";

// Validate that the date is a real calendar date.
const isValidDate = (value) => {
  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

const bookingSchema = z.object({
  hotelId: z.string().regex(/^[0-9a-fA-F]{24}$/),

  roomTypeId: z.string().uuid(),

  checkIn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isValidDate, "Invalid check-in date."),

  checkOut: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isValidDate, "Invalid check-out date."),

  guests: z.number().int().min(1).max(20),

  rooms: z.number().int().min(1).max(10),
});

// GET /api/bookings/my-bookings
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await fetchMyBookings(req.user.userId);

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Fetching booking history failed:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve your bookings.",
    });
  }
};

// POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    const parsed = bookingSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking details.",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const idempotencyKey = req.get("Idempotency-Key");

    if (
      typeof idempotencyKey !== "string" ||
      idempotencyKey.length < 8 ||
      idempotencyKey.length > 100 ||
      !/^[A-Za-z0-9_-]+$/.test(idempotencyKey)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid Idempotency-Key header containing 8–100 letters, numbers, underscores or hyphens is required.",
      });
    }

    const result = await createBookingHold({
      userId: req.user.userId,
      ...parsed.data,
      idempotencyKey,
    });

    return res.status(result.idempotent ? 200 : 201).json({
      success: true,
      message: result.idempotent
        ? "Existing booking request retrieved."
        : "Room inventory held successfully. Complete payment within 15 minutes.",
      data: result.booking,
    });
  } catch (error) {
    console.error("Booking creation failed:", error);

    if (error instanceof BookingError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not create booking.",
    });
  }
};