
-- ==========================================
-- STAYSCAPE BOOKING DATABASE
-- PostgreSQL 16
-- Target Market: India
-- Currency: Indian Rupee (INR)
-- ==========================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ==========================================
-- 1. ROOM TYPES
-- ==========================================

CREATE TABLE IF NOT EXISTS room_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hotel_mongo_id VARCHAR(24) NOT NULL,

    name VARCHAR(120) NOT NULL,
    description TEXT,

    capacity INTEGER NOT NULL
        CHECK (capacity > 0),

    total_rooms INTEGER NOT NULL
        CHECK (total_rooms >= 0),

    price_per_night_paise INTEGER NOT NULL
        CHECK (price_per_night_paise >= 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (hotel_mongo_id, name)
);


-- ==========================================
-- 2. ROOM INVENTORY
-- Tracks availability for each room type
-- on each calendar date.
-- ==========================================

CREATE TABLE IF NOT EXISTS room_inventory (
    room_type_id UUID NOT NULL
        REFERENCES room_types(id) ON DELETE RESTRICT,

    stay_date DATE NOT NULL,

    total_rooms INTEGER NOT NULL
        CHECK (total_rooms >= 0),

    available_rooms INTEGER NOT NULL
        CHECK (
            available_rooms >= 0
            AND available_rooms <= total_rooms
        ),

    PRIMARY KEY (room_type_id, stay_date)
);


-- ==========================================
-- 3. BOOKINGS
-- ==========================================

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_reference VARCHAR(20) NOT NULL UNIQUE,

    user_mongo_id VARCHAR(24) NOT NULL,

    status VARCHAR(25) NOT NULL DEFAULT 'pending_payment'
        CHECK (
            status IN (
                'pending_payment',
                'confirmed',
                'cancelled',
                'expired',
                'completed'
            )
        ),

    check_in DATE NOT NULL,
    check_out DATE NOT NULL,

    guests INTEGER NOT NULL
        CHECK (guests > 0),

    subtotal_paise INTEGER NOT NULL
        CHECK (subtotal_paise >= 0),

    tax_paise INTEGER NOT NULL DEFAULT 0
        CHECK (tax_paise >= 0),

    total_paise INTEGER NOT NULL
        CHECK (total_paise >= 0),

    hold_expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (check_out > check_in),

    CHECK (
        total_paise = subtotal_paise + tax_paise
    )
);


-- ==========================================
-- 4. BOOKING ITEMS
-- Stores room and price snapshots.
-- ==========================================

CREATE TABLE IF NOT EXISTS booking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL
        REFERENCES bookings(id) ON DELETE RESTRICT,

    room_type_id UUID NOT NULL
        REFERENCES room_types(id) ON DELETE RESTRICT,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    price_per_night_paise INTEGER NOT NULL
        CHECK (price_per_night_paise >= 0),

    nights INTEGER NOT NULL
        CHECK (nights > 0),

    line_total_paise INTEGER NOT NULL
        CHECK (line_total_paise >= 0),

    UNIQUE (booking_id, room_type_id),

    CHECK (
        line_total_paise =
        quantity * nights * price_per_night_paise
    )
);


-- ==========================================
-- 5. PAYMENTS
-- Stripe payment references only.
-- Never store card numbers or CVV.
-- ==========================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL
        REFERENCES bookings(id) ON DELETE RESTRICT,

    stripe_payment_intent_id VARCHAR(255) UNIQUE,

    amount_paise INTEGER NOT NULL
        CHECK (amount_paise >= 0),

    currency VARCHAR(3) NOT NULL DEFAULT 'INR'
        CHECK (currency = 'INR'),

    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'processing',
                'succeeded',
                'failed',
                'refunded'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==========================================
-- 6. INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_room_types_hotel
    ON room_types(hotel_mongo_id);

CREATE INDEX IF NOT EXISTS idx_room_inventory_date
    ON room_inventory(stay_date);

CREATE INDEX IF NOT EXISTS idx_bookings_user
    ON bookings(user_mongo_id);

CREATE INDEX IF NOT EXISTS idx_bookings_status
    ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_bookings_expiration
    ON bookings(hold_expires_at)
    WHERE status = 'pending_payment';

CREATE INDEX IF NOT EXISTS idx_booking_items_booking
    ON booking_items(booking_id);

CREATE INDEX IF NOT EXISTS idx_payments_booking
    ON payments(booking_id);


-- ==========================================
-- SCHEMA INITIALIZATION COMPLETE
-- ==========================================

