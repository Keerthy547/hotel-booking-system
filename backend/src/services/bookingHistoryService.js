import { pool } from "../config/db.js";
import Hotel from "../models/Hotel.js";

const formatDatabaseDate = (value) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
};

const paiseToINR = (value) => Number(value) / 100;

export const getMyBookings = async (userId) => {
  // Retrieve the user's bookings and related payment/room information.
  const result = await pool.query(
    `SELECT
       b.id AS booking_id,
       b.booking_reference,
       b.status AS booking_status,
       b.check_in,
       b.check_out,
       b.guests,
       b.subtotal_paise,
       b.tax_paise,
       b.total_paise,
       b.hold_expires_at,
       b.created_at AS booking_created_at,

       bi.id AS booking_item_id,
       bi.quantity,
       bi.price_per_night_paise,
       bi.nights,
       bi.line_total_paise,

       rt.id AS room_type_id,
       rt.hotel_mongo_id,
       rt.name AS room_name,
       rt.description AS room_description,
       rt.capacity AS room_capacity,

       p.id AS payment_id,
       p.status AS payment_status,
       p.amount_paise AS payment_amount_paise,
       p.currency AS payment_currency,
       p.created_at AS payment_created_at

     FROM bookings b

     INNER JOIN booking_items bi
       ON bi.booking_id = b.id

     INNER JOIN room_types rt
       ON rt.id = bi.room_type_id

     LEFT JOIN payments p
       ON p.booking_id = b.id

     WHERE b.user_mongo_id = $1

     ORDER BY b.created_at DESC, bi.id ASC`,
    [userId]
  );

  if (result.rows.length === 0) {
    return [];
  }

  // Collect distinct MongoDB hotel IDs.
  const hotelIds = [
    ...new Set(result.rows.map((row) => row.hotel_mongo_id)),
  ];

  // Retrieve hotel information from MongoDB.
  const hotels = await Hotel.find({
    _id: { $in: hotelIds },
  })
    .select("name location address imageUrl category")
    .lean();

  const hotelMap = new Map(
    hotels.map((hotel) => [hotel._id.toString(), hotel])
  );

  // Group booking items under their respective bookings.
  const bookingsMap = new Map();

  for (const row of result.rows) {
    if (!bookingsMap.has(row.booking_id)) {
      bookingsMap.set(row.booking_id, {
        id: row.booking_id,
        bookingReference: row.booking_reference,
        status: row.booking_status,

        checkIn: formatDatabaseDate(row.check_in),
        checkOut: formatDatabaseDate(row.check_out),

        guests: Number(row.guests),

        subtotalINR: paiseToINR(row.subtotal_paise),
        taxINR: paiseToINR(row.tax_paise),
        totalINR: paiseToINR(row.total_paise),

        currency: "INR",

        holdExpiresAt: row.hold_expires_at,
        createdAt: row.booking_created_at,

        payment: row.payment_id
          ? {
              id: row.payment_id,
              status: row.payment_status,
              amountINR: paiseToINR(
                row.payment_amount_paise
              ),
              currency: row.payment_currency,
              createdAt: row.payment_created_at,
            }
          : null,

        items: [],
      });
    }

    const hotel = hotelMap.get(row.hotel_mongo_id);

    bookingsMap.get(row.booking_id).items.push({
      bookingItemId: row.booking_item_id,

      hotel: hotel
        ? {
            id: hotel._id.toString(),
            name: hotel.name,
            location: hotel.location,
            address: hotel.address,
            image: hotel.imageUrl,
            category: hotel.category,
          }
        : null,

      room: {
        id: row.room_type_id,
        name: row.room_name,
        description: row.room_description,
        capacity: Number(row.room_capacity),
        quantity: Number(row.quantity),
        pricePerNightINR: paiseToINR(
          row.price_per_night_paise
        ),
        nights: Number(row.nights),
        totalINR: paiseToINR(row.line_total_paise),
      },
    });
  }

  return Array.from(bookingsMap.values());
};