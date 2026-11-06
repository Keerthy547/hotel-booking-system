import { randomBytes } from "node:crypto";
import { pool } from "../config/db.js";

const formatDatabaseDate = (value) =>
  String(value).slice(0, 10);

const HOLD_DURATION_MINUTES = 15;

class BookingError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const getIndiaToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const getDateDifference = (start, end) => {
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);

  return (endTime - startTime) / 86400000;
};

const generateBookingReference = () =>
  `STY${randomBytes(5).toString("hex").toUpperCase()}`;

const getExistingBooking = async (userId, idempotencyKey) => {
  const result = await pool.query(
    `SELECT
       b.id,
       b.booking_reference,
       b.status,
       b.check_in,
       b.check_out,
       b.guests,
       b.subtotal_paise,
       b.tax_paise,
       b.total_paise,
       b.hold_expires_at,
       bi.room_type_id,
       bi.quantity
     FROM bookings b
     JOIN booking_items bi ON bi.booking_id = b.id
     WHERE b.user_mongo_id = $1
       AND b.idempotency_key = $2`,
    [userId, idempotencyKey]
  );

  return result.rows;
};

export const createBookingHold = async ({
  userId,
  hotelId,
  roomTypeId,
  checkIn,
  checkOut,
  guests,
  rooms,
  idempotencyKey,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check whether this request was already processed.
    const existing = await client.query(
      `SELECT
         b.id,
         b.booking_reference,
         b.status,
         b.check_in,
         b.check_out,
         b.guests,
         b.subtotal_paise,
         b.tax_paise,
         b.total_paise,
         b.hold_expires_at,
         bi.room_type_id,
         bi.quantity
       FROM bookings b
       JOIN booking_items bi ON bi.booking_id = b.id
       WHERE b.user_mongo_id = $1
         AND b.idempotency_key = $2
       FOR UPDATE OF b`,
      [userId, idempotencyKey]
    );

    if (existing.rows.length > 0) {
      const booking = existing.rows[0];

      const sameRequest =
        formatDatabaseDate(booking.check_in) === checkIn &&
        formatDatabaseDate(booking.check_out) === checkOut &&
        Number(booking.guests) === guests &&
        Number(booking.quantity) === rooms &&
        booking.room_type_id === roomTypeId;

      if (!sameRequest) {
        throw new BookingError(
          "This idempotency key was already used for a different booking.",
          409
        );
      }

      await client.query("COMMIT");

      return {
        idempotent: true,
        booking: {
          id: booking.id,
          bookingReference: booking.booking_reference,
          status: booking.status,
          checkIn,
          checkOut,
          guests: booking.guests,
          rooms: booking.quantity,
          subtotalINR: Number(booking.subtotal_paise) / 100,
          taxINR: Number(booking.tax_paise) / 100,
          totalINR: Number(booking.total_paise) / 100,
          holdExpiresAt: booking.hold_expires_at,
        },
      };
    }

    // Validate that the check-in date is not in the past in India.
    if (checkIn < getIndiaToday()) {
      throw new BookingError("Check-in date cannot be in the past.");
    }

    const nights = getDateDifference(checkIn, checkOut);

    if (!Number.isInteger(nights) || nights <= 0) {
      throw new BookingError("Invalid booking date range.");
    }

    // Verify room type and hotel relationship.
    const roomResult = await client.query(
      `SELECT
         id,
         hotel_mongo_id,
         name,
         capacity,
         price_per_night_paise
       FROM room_types
       WHERE id = $1
         AND hotel_mongo_id = $2
       FOR SHARE`,
      [roomTypeId, hotelId]
    );

    if (roomResult.rows.length === 0) {
      throw new BookingError(
        "The selected room type does not belong to this hotel.",
        404
      );
    }

    const roomType = roomResult.rows[0];

    if (roomType.capacity * rooms < guests) {
      throw new BookingError(
        "The selected rooms cannot accommodate the requested number of guests."
      );
    }

    const pricePerNight = Number(roomType.price_per_night_paise);
    const subtotalPaise = pricePerNight * nights * rooms;

    if (
      !Number.isSafeInteger(subtotalPaise) ||
      subtotalPaise > 2147483647
    ) {
      throw new BookingError("Booking amount exceeds the supported limit.");
    }

    // Lock all inventory rows in chronological order.
    const inventoryResult = await client.query(
      `SELECT stay_date, available_rooms
       FROM room_inventory
       WHERE room_type_id = $1
         AND stay_date >= $2::DATE
         AND stay_date < $3::DATE
       ORDER BY stay_date
       FOR UPDATE`,
      [roomTypeId, checkIn, checkOut]
    );

    if (inventoryResult.rows.length !== nights) {
      throw new BookingError(
        "Inventory is unavailable for one or more selected dates.",
        409
      );
    }

    const unavailableDate = inventoryResult.rows.find(
      (row) => Number(row.available_rooms) < rooms
    );

    if (unavailableDate) {
      throw new BookingError(
        "Not enough rooms are available for your selected dates.",
        409
      );
    }

    // Reduce inventory for every night in the stay.
    for (const inventory of inventoryResult.rows) {
      const updateResult = await client.query(
        `UPDATE room_inventory
         SET available_rooms = available_rooms - $1
         WHERE room_type_id = $2
           AND stay_date = $3
           AND available_rooms >= $1`,
        [rooms, roomTypeId, inventory.stay_date]
      );

      if (updateResult.rowCount !== 1) {
        throw new BookingError(
          "Room availability changed. Please try again.",
          409
        );
      }
    }

    // Tax remains zero until the StayScape GST pricing policy is defined.
    const taxPaise = 0;
    const totalPaise = subtotalPaise + taxPaise;

    const bookingReference = generateBookingReference();

    const bookingResult = await client.query(
      `INSERT INTO bookings (
         booking_reference,
         user_mongo_id,
         status,
         check_in,
         check_out,
         guests,
         subtotal_paise,
         tax_paise,
         total_paise,
         hold_expires_at,
         idempotency_key
       )
       VALUES (
         $1, $2, 'pending_payment',
         $3, $4, $5, $6, $7, $8,
         NOW() + ($9 * INTERVAL '1 minute'),
         $10
       )
       RETURNING id, booking_reference, status, hold_expires_at`,
      [
        bookingReference,
        userId,
        checkIn,
        checkOut,
        guests,
        subtotalPaise,
        taxPaise,
        totalPaise,
        HOLD_DURATION_MINUTES,
        idempotencyKey,
      ]
    );

    const booking = bookingResult.rows[0];

    await client.query(
      `INSERT INTO booking_items (
         booking_id,
         room_type_id,
         quantity,
         price_per_night_paise,
         nights,
         line_total_paise
       )
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        booking.id,
        roomTypeId,
        rooms,
        pricePerNight,
        nights,
        subtotalPaise,
      ]
    );

    await client.query("COMMIT");

    return {
      idempotent: false,
      booking: {
        id: booking.id,
        bookingReference: booking.booking_reference,
        status: booking.status,
        hotelId,
        roomTypeId,
        roomName: roomType.name,
        checkIn,
        checkOut,
        nights,
        guests,
        rooms,
        pricePerNightINR: pricePerNight / 100,
        subtotalINR: subtotalPaise / 100,
        taxINR: taxPaise / 100,
        totalINR: totalPaise / 100,
        currency: "INR",
        holdExpiresAt: booking.hold_expires_at,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    // A concurrent request may have created the same idempotency key.
    if (error.code === "23505") {
      const existing = await getExistingBooking(userId, idempotencyKey);

      if (existing.length > 0) {
        const booking = existing[0];

        const sameRequest =
          formatDatabaseDate(booking.check_in) === checkIn &&
    formatDatabaseDate(booking.check_out) === checkOut &&
          booking.guests === guests &&
          booking.quantity === rooms &&
          booking.room_type_id === roomTypeId;

        if (!sameRequest) {
          throw new BookingError(
            "This idempotency key was already used for a different booking.",
            409
          );
        }

        return {
          idempotent: true,
          booking: {
            id: booking.id,
            bookingReference: booking.booking_reference,
            status: booking.status,
            checkIn,
            checkOut,
            guests: booking.guests,
            rooms: booking.quantity,
            subtotalINR: Number(booking.subtotal_paise) / 100,
            taxINR: Number(booking.tax_paise) / 100,
            totalINR: Number(booking.total_paise) / 100,
            holdExpiresAt: booking.hold_expires_at,
          },
        };
      }
    }

    throw error;
  } finally {
    client.release();
  }
};

export { BookingError };