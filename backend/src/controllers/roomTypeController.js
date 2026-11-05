import { pool } from "../config/db.js";

// GET /api/hotels/:hotelId/rooms
export const getRoomTypesByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    // Validate MongoDB hotel ID
    if (!/^[0-9a-fA-F]{24}$/.test(hotelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel ID",
      });
    }

    const result = await pool.query(
      `SELECT
        id,
        hotel_mongo_id,
        name,
        description,
        capacity,
        total_rooms,
        price_per_night_paise
      FROM room_types
      WHERE hotel_mongo_id = $1
      ORDER BY price_per_night_paise ASC`,
      [hotelId]
    );

    const roomTypes = result.rows.map((room) => ({
      id: room.id,
      hotelId: room.hotel_mongo_id,
      name: room.name,
      description: room.description,
      capacity: room.capacity,
      totalRooms: room.total_rooms,
      pricePerNightINR:
        Number(room.price_per_night_paise) / 100,
    }));

    return res.status(200).json({
      success: true,
      count: roomTypes.length,
      data: roomTypes,
    });
  } catch (error) {
    console.error("Error fetching room types:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch room types",
    });
  }
};