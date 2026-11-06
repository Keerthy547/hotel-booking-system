
import { pool } from "../config/db.js";

const EXPIRATION_INTERVAL_MS = 30 * 1000;
const BATCH_SIZE = 20;

let intervalId = null;
let isRunning = false;

const formatDatabaseDate = (value) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
};

const getNightCount = (checkIn, checkOut) => {
  const start = new Date(
    `${formatDatabaseDate(checkIn)}T00:00:00.000Z`
  );

  const end = new Date(
    `${formatDatabaseDate(checkOut)}T00:00:00.000Z`
  );

  return Math.round(
    (end - start) / (1000 * 60 * 60 * 24)
  );
};

// Find expired bookings and restore their room inventory.
export const expirePendingBookings = async () => {
  if (isRunning) return;

  isRunning = true;

  let client;

  try {
    client = await pool.connect();

    await client.query("BEGIN");

    const expiredBookings = await client.query(
      `SELECT id, check_in, check_out
       FROM bookings
       WHERE status = 'pending_payment'
         AND hold_expires_at <= NOW()
       ORDER BY hold_expires_at
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [BATCH_SIZE]
    );

    for (const booking of expiredBookings.rows) {
      const nights = getNightCount(
        booking.check_in,
        booking.check_out
      );

      if (nights <= 0) {
        throw new Error(
          `Invalid stay dates for booking ${booking.id}`
        );
      }

      const itemsResult = await client.query(
        `SELECT room_type_id, quantity
         FROM booking_items
         WHERE booking_id = $1`,
        [booking.id]
      );

      if (itemsResult.rows.length === 0) {
        throw new Error(
          `No booking items found for booking ${booking.id}`
        );
      }

      // Restore inventory for every room type and every night.
      for (const item of itemsResult.rows) {
        const inventoryResult = await client.query(
          `UPDATE room_inventory
           SET available_rooms = available_rooms + $1
           WHERE room_type_id = $2
             AND stay_date >= $3::date
             AND stay_date < $4::date
             AND available_rooms + $1 <= total_rooms`,
          [
            item.quantity,
            item.room_type_id,
            booking.check_in,
            booking.check_out,
          ]
        );

        if (inventoryResult.rowCount !== nights) {
          throw new Error(
            `Inventory restoration failed for booking ${booking.id}. Expected ${nights} rows, updated ${inventoryResult.rowCount}.`
          );
        }
      }

      // Mark the booking expired after inventory restoration.
      await client.query(
        `UPDATE bookings
         SET status = 'expired',
             updated_at = NOW()
         WHERE id = $1
           AND status = 'pending_payment'`,
        [booking.id]
      );

      console.log(
        `Expired booking ${booking.id}; inventory restored.`
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch((rollbackError) => {
        console.error(
          "Booking expiration rollback failed:",
          rollbackError.message
        );
      });
    }

    console.error(
      "Booking expiration worker failed:",
      error.message
    );
  } finally {
    if (client) {
      client.release();
    }

    isRunning = false;
  }
};

// Start the automatic expiration worker.
export const startBookingExpirationWorker = () => {
  if (intervalId) return;

  console.log("Booking expiration worker started.");

  // Run immediately and then every 30 seconds.
  void expirePendingBookings();

  intervalId = setInterval(() => {
    void expirePendingBookings();
  }, EXPIRATION_INTERVAL_MS);
};

// Stop the worker during server shutdown.
export const stopBookingExpirationWorker = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;

    console.log("Booking expiration worker stopped.");
  }
};
