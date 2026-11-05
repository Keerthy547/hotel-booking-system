import { pool } from "../config/db.js";

// GET /api/hotels/:hotelId/availability
export const checkRoomAvailability = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { checkIn, checkOut, guests = 1, rooms = 1 } = req.query;

    // Validate hotel ID
    if (!/^[0-9a-fA-F]{24}$/.test(hotelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel ID",
      });
    }

    // Validate required dates
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Check-in and check-out dates are required",
      });
    }

    // Validate date format
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(checkIn) || !datePattern.test(checkOut)) {
      return res.status(400).json({
        success: false,
        message: "Dates must use YYYY-MM-DD format",
      });
    }

    const startDate = new Date(`${checkIn}T00:00:00Z`);
    const endDate = new Date(`${checkOut}T00:00:00Z`);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate.toISOString().slice(0, 10) !== checkIn ||
      endDate.toISOString().slice(0, 10) !== checkOut ||
      endDate <= startDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range",
      });
    }

    // Validate guests and room quantity
    const guestCount = Number(guests);
    const roomCount = Number(rooms);

    if (
      !Number.isInteger(guestCount) ||
      !Number.isInteger(roomCount) ||
      guestCount < 1 ||
      roomCount < 1 ||
      guestCount > 20 ||
      roomCount > 10
    ) {
      return res.status(400).json({
        success: false,
        message: "Guests must be 1–20 and rooms must be 1–10",
      });
    }

    // Count the nights between check-in and check-out
    const nights = Math.round(
      (endDate.getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Find room types with sufficient capacity and availability
    const result = await pool.query(
      `SELECT
        rt.id,
        rt.name,
        rt.description,
        rt.capacity,
        rt.total_rooms,
        rt.price_per_night_paise,
        MIN(ri.available_rooms) AS available_rooms
      FROM room_types rt
      JOIN room_inventory ri
        ON ri.room_type_id = rt.id
      WHERE rt.hotel_mongo_id = $1
        AND rt.capacity * $2 >= $3
        AND ri.stay_date >= $4::DATE
        AND ri.stay_date < $5::DATE
      GROUP BY
        rt.id,
        rt.name,
        rt.description,
        rt.capacity,
        rt.total_rooms,
        rt.price_per_night_paise
      HAVING
        COUNT(ri.stay_date) = $6
        AND MIN(ri.available_rooms) >= $7
      ORDER BY rt.price_per_night_paise ASC`,
      [
        hotelId,
        roomCount,
        guestCount,
        checkIn,
        checkOut,
        nights,
        roomCount,
      ]
    );

    const availableRooms = result.rows.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      capacity: room.capacity,
      totalRooms: room.total_rooms,
      availableRooms: Number(room.available_rooms),
      pricePerNightINR:
        Number(room.price_per_night_paise) / 100,
      nights,
      totalPriceINR:
        (Number(room.price_per_night_paise) / 100) *
        nights *
        roomCount,
    }));

    return res.status(200).json({
      success: true,
      hotelId,
      checkIn,
      checkOut,
      guests: guestCount,
      rooms: roomCount,
      nights,
      count: availableRooms.length,
      data: availableRooms,
    });
  } catch (error) {
    console.error("Availability check failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check room availability",
    });
  }
};