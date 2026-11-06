
import { pool } from "../config/db.js";

export class PaymentError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Create or retrieve a payment for a booking.
export const createPayment = async ({ userId, bookingId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const bookingResult = await client.query(
      `SELECT
         id,
         status,
         total_paise,
         hold_expires_at,
         (hold_expires_at > clock_timestamp()) AS hold_valid
       FROM bookings
       WHERE id = $1 AND user_mongo_id = $2
       FOR UPDATE`,
      [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
      throw new PaymentError("Booking not found.", 404);
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== "pending_payment") {
      throw new PaymentError(
        "This booking is not awaiting payment.",
        409
      );
    }

    if (!booking.hold_valid) {
      throw new PaymentError("The booking hold has expired.", 409);
    }

    const existingResult = await client.query(
      `SELECT id, booking_id, amount_paise, currency, status
       FROM payments
       WHERE booking_id = $1
       FOR UPDATE`,
      [bookingId]
    );

    let payment;

    if (existingResult.rows.length > 0) {
      payment = existingResult.rows[0];

      if (payment.status === "succeeded") {
        throw new PaymentError("This booking is already paid.", 409);
      }

      if (payment.status === "processing") {
        throw new PaymentError("Payment is already processing.", 409);
      }

      if (!["pending", "failed"].includes(payment.status)) {
        throw new PaymentError(
          "This payment cannot be retried in its current state.",
          409
        );
      }

      if (Number(payment.amount_paise) !== Number(booking.total_paise)) {
        throw new PaymentError(
          "Payment amount does not match the booking amount.",
          409
        );
      }

      if (payment.status === "failed") {
        await client.query(
          `UPDATE payments
           SET status = 'pending',
               updated_at = NOW()
           WHERE id = $1`,
          [payment.id]
        );

        payment.status = "pending";
      }
    } else {
      const paymentResult = await client.query(
        `INSERT INTO payments (
           booking_id,
           amount_paise,
           currency,
           status
         )
         VALUES ($1, $2, 'INR', 'pending')
         RETURNING id, booking_id, amount_paise, currency, status`,
        [bookingId, booking.total_paise]
      );

      payment = paymentResult.rows[0];
    }

    await client.query("COMMIT");

    return {
      id: payment.id,
      bookingId: payment.booking_id,
      amountPaise: Number(payment.amount_paise),
      amountINR: Number(payment.amount_paise) / 100,
      currency: payment.currency,
      status: payment.status,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

// Simulate payment success or failure.
export const confirmMockPayment = async ({
  userId,
  paymentId,
  outcome,
}) => {
  if (!["success", "failure"].includes(outcome)) {
    throw new PaymentError("Invalid payment outcome.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const paymentResult = await client.query(
      `SELECT
         p.id,
         p.booking_id,
         p.status AS payment_status,
         b.status AS booking_status,
         (b.hold_expires_at > clock_timestamp()) AS hold_valid
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       WHERE p.id = $1
         AND b.user_mongo_id = $2
       FOR UPDATE OF b, p`,
      [paymentId, userId]
    );

    if (paymentResult.rows.length === 0) {
      throw new PaymentError("Payment not found.", 404);
    }

    const payment = paymentResult.rows[0];

    if (payment.payment_status === "succeeded") {
      if (payment.booking_status === "confirmed") {
        await client.query("COMMIT");

        return {
          paymentId,
          paymentStatus: "succeeded",
          bookingStatus: "confirmed",
          message: "Payment was already completed.",
        };
      }

      throw new PaymentError(
        "Payment is already successful but booking needs reconciliation.",
        409
      );
    }

    if (payment.booking_status !== "pending_payment") {
      throw new PaymentError(
        "This booking is no longer awaiting payment.",
        409
      );
    }

    if (!payment.hold_valid) {
      throw new PaymentError("The booking hold has expired.", 409);
    }

    if (payment.payment_status !== "pending") {
      throw new PaymentError(
        "This payment cannot be processed in its current state.",
        409
      );
    }

    if (outcome === "failure") {
      await client.query(
        `UPDATE payments
         SET status = 'failed',
             updated_at = NOW()
         WHERE id = $1`,
        [paymentId]
      );

      await client.query("COMMIT");

      return {
        paymentId,
        paymentStatus: "failed",
        bookingStatus: "pending_payment",
        message: "Simulated payment failed.",
      };
    }

    await client.query(
      `UPDATE payments
       SET status = 'succeeded',
           updated_at = NOW()
       WHERE id = $1`,
      [paymentId]
    );

    await client.query(
      `UPDATE bookings
       SET status = 'confirmed',
           updated_at = NOW()
       WHERE id = $1`,
      [payment.booking_id]
    );

    await client.query("COMMIT");

    return {
      paymentId,
      paymentStatus: "succeeded",
      bookingStatus: "confirmed",
      message: "Payment successful. Booking confirmed!",
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

// Retrieve payment status for the authenticated user.
export const getPaymentStatus = async ({ userId, paymentId }) => {
  const result = await pool.query(
    `SELECT
       p.id,
       p.booking_id,
       p.amount_paise,
       p.currency,
       p.status,
       p.created_at,
       p.updated_at
     FROM payments p
     JOIN bookings b ON b.id = p.booking_id
     WHERE p.id = $1
       AND b.user_mongo_id = $2`,
    [paymentId, userId]
  );

  if (result.rows.length === 0) {
    throw new PaymentError("Payment not found.", 404);
  }

  const payment = result.rows[0];

  return {
    id: payment.id,
    bookingId: payment.booking_id,
    amountINR: Number(payment.amount_paise) / 100,
    currency: payment.currency,
    status: payment.status,
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
  };
};
