-- ==========================================
-- STAYSCAPE BOOKING SAFETY MIGRATION
-- ==========================================

-- 1. Prevent duplicate booking creation
-- for the same user request.

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS
idx_bookings_user_idempotency
ON bookings(user_mongo_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;


-- 2. One Stripe PaymentIntent per booking.

CREATE UNIQUE INDEX IF NOT EXISTS
idx_payments_one_per_booking
ON payments(booking_id);


-- 3. Store Stripe webhook event IDs.
-- This prevents processing the same event twice.

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    event_id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(120) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 4. Helpful index for finding inventory
-- belonging to a booking's room type and dates.

CREATE INDEX IF NOT EXISTS
idx_booking_items_room_type
ON booking_items(room_type_id);


-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================