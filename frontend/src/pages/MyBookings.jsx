import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  BedDouble,
  Receipt,
  Clock3,
  RefreshCw,
  Hotel,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import { getMyBookings } from "../services/bookingService";

import "./MyBookings.css";

const filters = [
  { label: "All bookings", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
  { label: "Expired / Cancelled", value: "inactive" },
];

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString) =>
  new Date(`${dateString}T00:00:00+05:30`).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }
  );

const getIndiaToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const getBookingCategory = (booking) => {
  if (booking.status === "completed") {
    return "completed";
  }

  if (
    booking.status === "expired" ||
    booking.status === "cancelled"
  ) {
    return "inactive";
  }

  if (booking.status === "pending_payment") {
    return "pending";
  }

  if (
    booking.status === "confirmed" &&
    booking.checkOut <= getIndiaToday()
  ) {
    return "completed";
  }

  if (booking.status === "confirmed") {
    return "upcoming";
  }

  return "all";
};

const getStatusLabel = (status) => {
  const labels = {
    pending_payment: "Pending payment",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    expired: "Expired",
  };

  return labels[status] || status;
};

function BookingCard({ booking }) {
  const firstItem = booking.items?.[0];

  const hotel = firstItem?.hotel;
  const room = firstItem?.room;

  const statusClass = booking.status.replace("_", "-");

  return (
    <article className="booking-card">

      <div className="booking-card-image">
        {hotel?.image ? (
          <img
            src={hotel.image}
            alt={hotel.name || "Hotel"}
          />
        ) : (
          <div className="booking-image-placeholder">
            <Hotel size={38} />
          </div>
        )}
      </div>

      <div className="booking-card-content">

        <div className="booking-card-heading">

          <div>
            <span className="booking-reference">
              BOOKING REF: {booking.bookingReference}
            </span>

            <h2>
              {hotel?.name || "Hotel information unavailable"}
            </h2>

            {hotel?.location && (
              <p className="booking-location">
                <MapPin size={14} />
                {hotel.location}
              </p>
            )}
          </div>

          <span className={`booking-status ${statusClass}`}>
            {getStatusLabel(booking.status)}
          </span>

        </div>

        <div className="booking-details-grid">

          <div className="booking-detail">
            <CalendarDays size={17} />

            <div>
              <span>CHECK-IN</span>
              <strong>{formatDate(booking.checkIn)}</strong>
            </div>
          </div>

          <div className="booking-detail">
            <CalendarDays size={17} />

            <div>
              <span>CHECK-OUT</span>
              <strong>{formatDate(booking.checkOut)}</strong>
            </div>
          </div>

          <div className="booking-detail">
            <BedDouble size={17} />

            <div>
              <span>ROOM</span>
              <strong>{room?.name || "Room"}</strong>
            </div>
          </div>

          <div className="booking-detail">
            <Users size={17} />

            <div>
              <span>GUESTS / ROOMS</span>
              <strong>
                {booking.guests} guests /{" "}
                {booking.items.reduce(
                  (total, item) =>
                    total + Number(item.room?.quantity || 0),
                  0
                )}{" "}
                rooms
              </strong>
            </div>
          </div>

        </div>

        <div className="booking-card-footer">

          <div className="booking-payment-info">
            <Receipt size={16} />

            <span>
              Payment:{" "}
              <strong>
                {booking.payment
                  ? booking.payment.status
                  : "Not initiated"}
              </strong>
            </span>
          </div>

          <div className="booking-total">
            <span>TOTAL AMOUNT</span>
            <strong>{formatINR(booking.totalINR)}</strong>
          </div>

        </div>

      </div>

    </article>
  );
}

function MyBookings() {
  const { user, token } = useAuth();

  const [bookings, setBookings] = useState([]);

  const [activeFilter, setActiveFilter] = useState("all");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyBookings(token);

      setBookings(data);
    } catch (err) {
      console.error("Booking history error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load your bookings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token]);

  const filteredBookings = useMemo(() => {
    if (activeFilter === "all") {
      return bookings;
    }

    return bookings.filter(
      (booking) => getBookingCategory(booking) === activeFilter
    );
  }, [bookings, activeFilter]);

  const getFilterCount = (filter) => {
    if (filter === "all") {
      return bookings.length;
    }

    return bookings.filter(
      (booking) => getBookingCategory(booking) === filter
    ).length;
  };

  return (
    <main className="my-bookings-page">

      <nav className="bookings-navbar">

        <Link to="/" className="details-brand">
          <span className="brand-icon">S</span>
          StayScape.
        </Link>

        <Link to="/" className="back-link">
          <ArrowLeft size={17} />
          Back to stays
        </Link>

      </nav>

      <section className="bookings-container">

        <div className="bookings-heading">

          <div>
            <span className="auth-eyebrow">
              YOUR STAYSCAPE JOURNEY
            </span>

            <h1>My Bookings.</h1>

            <p>
              Welcome back, {user?.name?.split(" ")[0] || "traveler"}.
              Keep track of your stays and travel plans.
            </p>
          </div>

          <button
            type="button"
            className="bookings-refresh-button"
            onClick={fetchBookings}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? "refresh-spinning" : ""}
            />
            Refresh
          </button>

        </div>

        <div className="booking-filter-list">

          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={
                activeFilter === filter.value
                  ? "booking-filter active"
                  : "booking-filter"
              }
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}

              <span>{getFilterCount(filter.value)}</span>
            </button>
          ))}

        </div>

        {loading ? (

          <div className="bookings-message">
            <Clock3 size={30} />
            <h2>Loading your bookings...</h2>
            <p>Retrieving your StayScape reservations.</p>
          </div>

        ) : error ? (

          <div className="bookings-message bookings-error">
            <h2>We couldn't load your bookings.</h2>
            <p>{error}</p>

            <button
              type="button"
              onClick={fetchBookings}
            >
              Try again
            </button>
          </div>

        ) : filteredBookings.length > 0 ? (

          <div className="booking-list">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
              />
            ))}
          </div>

        ) : (

          <div className="bookings-message">
            <div className="bookings-empty-icon">
              <Hotel size={32} />
            </div>

            <h2>
              {bookings.length === 0
                ? "No bookings yet."
                : "No bookings in this category."}
            </h2>

            <p>
              {bookings.length === 0
                ? "Your next memorable stay is waiting to be discovered."
                : "Try another filter to view your bookings."}
            </p>

            {bookings.length === 0 && (
              <Link to="/" className="explore-stays-button">
                Explore stays
              </Link>
            )}

          </div>

        )}

      </section>

    </main>
  );
}

export default MyBookings;