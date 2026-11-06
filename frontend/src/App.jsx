import { Link, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import HotelDetails from "./pages/HotelDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import MyBookings from "./pages/MyBookings";

import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { getHotels } from "./services/hotelService";

import {
  Search,
  MapPin,
  CalendarDays,
  Users,
  Heart,
  Star,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Sparkles,
} from "lucide-react";

import "./App.css";

// Hotel categories
const categories = [
  "All stays",
  "Beachfront",
  "Luxury",
  "City Hotels",
  "Resorts",
];

// Format prices using Indian Rupees
const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

// Homepage
function HomePage({ hotels, loading, error }) {
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2 Guests");

  const [activeCategory, setActiveCategory] = useState("All stays");
  const [searchQuery, setSearchQuery] = useState("");

  const [favorites, setFavorites] = useState([]);
  const [mobileMenu, setMobileMenu] = useState(false);

  // Authentication
  const { user, isAuthenticated, logout } = useAuth();

  // Filter hotels based on category and destination
  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) => {
      const matchesCategory =
        activeCategory === "All stays" ||
        hotel.category === activeCategory;

      const query = searchQuery.toLowerCase().trim();

      const matchesDestination =
        !query ||
        hotel.name.toLowerCase().includes(query) ||
        hotel.location.toLowerCase().includes(query) ||
        hotel.category.toLowerCase().includes(query);

      return matchesCategory && matchesDestination;
    });
  }, [hotels, activeCategory, searchQuery]);

  // Handle search
  const handleSearch = () => {
    setSearchQuery(destination.trim());
    setActiveCategory("All stays");

    document
      .getElementById("featured-hotels")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Add or remove favorites
  const toggleFavorite = (id) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  return (
    <div className="app">
      {/* Navigation */}
      <header className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">S</span>

          <span>
            StayScape<span className="brand-dot">.</span>
          </span>
        </Link>

        <nav className={mobileMenu ? "nav-links open" : "nav-links"}>
          <a
            href="#featured-hotels"
            onClick={() => setMobileMenu(false)}
          >
            Explore stays
          </a>

          <a
            href="#about"
            onClick={() => setMobileMenu(false)}
          >
            About us
          </a>

          <a
            href="#footer"
            onClick={() => setMobileMenu(false)}
          >
            Contact
          </a>

          {/* Mobile account links */}
          {isAuthenticated ? (
            <>
              <Link
                to="/bookings"
                onClick={() => setMobileMenu(false)}
              >
                My Bookings
              </Link>

              <Link
                to="/profile"
                onClick={() => setMobileMenu(false)}
              >
                My account
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenu(false)}
            >
              Sign in
            </Link>
          )}
        </nav>

        {/* Desktop navigation actions */}
        <div className="nav-actions">
          <button className="host-button" type="button">
            List your property
          </button>

          {isAuthenticated ? (
            <>
              <Link to="/bookings" className="login-button">
                My Bookings
              </Link>

              <Link to="/profile" className="login-button">
                Hi, {user.name.split(" ")[0]}
              </Link>

              <button
                className="host-button"
                type="button"
                onClick={logout}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="login-button">
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="mobile-menu-button"
          type="button"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle navigation"
          aria-expanded={mobileMenu}
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>
      </header>

      <main>
        {/* Hero section */}
        <section className="hero">
          <div className="hero-overlay"></div>

          <div className="hero-content">
            <div className="hero-eyebrow">
              <Sparkles size={15} />
              <span>EXPERIENCE THE EXTRAORDINARY</span>
            </div>

            <h1>
              Discover India,
              <br />
              <span>stay somewhere special.</span>
            </h1>

            <p className="hero-description">
              Discover thoughtfully selected stays across India,
              exceptional places and experiences that make every
              journey special.
            </p>

            {/* Search panel */}
            <div className="search-panel">
              <div className="search-field destination-field">
                <MapPin size={20} />

                <div>
                  <label htmlFor="destination">DESTINATION</label>

                  <input
                    id="destination"
                    placeholder="City, state or hotel"
                    value={destination}
                    onChange={(event) =>
                      setDestination(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="search-field">
                <CalendarDays size={19} />

                <div>
                  <label htmlFor="checkin">CHECK IN</label>

                  <input
                    id="checkin"
                    type="date"
                    value={checkIn}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(event) => {
                      setCheckIn(event.target.value);

                      if (
                        checkOut &&
                        event.target.value >= checkOut
                      ) {
                        setCheckOut("");
                      }
                    }}
                  />
                </div>
              </div>

              <div className="search-field">
                <CalendarDays size={19} />

                <div>
                  <label htmlFor="checkout">CHECK OUT</label>

                  <input
                    id="checkout"
                    type="date"
                    min={
                      checkIn ||
                      new Date().toISOString().split("T")[0]
                    }
                    value={checkOut}
                    onChange={(event) =>
                      setCheckOut(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="search-field guest-field">
                <Users size={20} />

                <div>
                  <label htmlFor="guests">GUESTS</label>

                  <select
                    id="guests"
                    value={guests}
                    onChange={(event) =>
                      setGuests(event.target.value)
                    }
                  >
                    <option>1 Guest</option>
                    <option>2 Guests</option>
                    <option>3 Guests</option>
                    <option>4 Guests</option>
                    <option>5+ Guests</option>
                  </select>
                </div>

                <ChevronDown size={15} />
              </div>

              <button
                className="search-button"
                type="button"
                onClick={handleSearch}
              >
                <Search size={19} />
                <span>Search</span>
              </button>
            </div>

            <div className="hero-note">
              Curated stays across India. Meaningful experiences.
              Unforgettable journeys.
            </div>
          </div>
        </section>

        {/* Featured hotels */}
        <section
          className="featured-section"
          id="featured-hotels"
        >
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                HANDPICKED FOR YOU
              </span>

              <h2>Exceptional stays across India.</h2>

              <p>
                Explore places that offer more than just a room
                for the night.
              </p>
            </div>

            <a href="#featured-hotels" className="view-all">
              Explore all stays
              <ArrowRight size={17} />
            </a>
          </div>

          {/* Categories */}
          <div className="category-list">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  activeCategory === category
                    ? "category-button active"
                    : "category-button"
                }
                onClick={() => {
                  setActiveCategory(category);
                  setSearchQuery("");
                  setDestination("");
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Hotel cards */}
          <div className="hotel-grid">
            {loading ? (
              <div className="empty-state">
                <h3>Loading stays...</h3>
                <p>
                  Discovering exceptional stays across India.
                </p>
              </div>
            ) : error ? (
              <div className="empty-state">
                <h3>Unable to load stays</h3>
                <p>{error}</p>
              </div>
            ) : filteredHotels.length > 0 ? (
              filteredHotels.map((hotel) => (
                <article
                  className="hotel-card"
                  key={hotel.id}
                >
                  <div className="hotel-image-wrapper">
                    <Link to={`/hotels/${hotel.id}`}>
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                      />
                    </Link>

                    <span className="hotel-tag">
                      {hotel.category}
                    </span>

                    <button
                      type="button"
                      className={
                        favorites.includes(hotel.id)
                          ? "favorite-button favorited"
                          : "favorite-button"
                      }
                      onClick={() =>
                        toggleFavorite(hotel.id)
                      }
                      aria-label={
                        favorites.includes(hotel.id)
                          ? `Remove ${hotel.name} from favorites`
                          : `Add ${hotel.name} to favorites`
                      }
                    >
                      <Heart
                        size={19}
                        fill={
                          favorites.includes(hotel.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>

                  <div className="hotel-info">
                    <div className="hotel-location">
                      <MapPin size={14} />
                      {hotel.location}
                    </div>

                    <div className="hotel-title-row">
                      <h3>
                        <Link to={`/hotels/${hotel.id}`}>
                          {hotel.name}
                        </Link>
                      </h3>

                      <span className="rating">
                        <Star
                          size={14}
                          fill="currentColor"
                        />
                        {hotel.rating}
                      </span>
                    </div>

                    <p className="hotel-description">
                      {hotel.description}
                    </p>

                    <div className="hotel-card-bottom">
                      <span className="review-count">
                        {hotel.reviews} demo reviews
                      </span>

                      <div className="hotel-price">
                        <strong>
                          {formatINR(hotel.price)}
                        </strong>

                        <span> / night</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <h3>No stays found</h3>

                <p>
                  Try another Indian destination or category.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setDestination("");
                    setActiveCategory("All stays");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          <p className="catalog-disclaimer">
            *Illustrative demo prices and review counts. Not live
            rates, availability, or verified customer reviews.
          </p>
        </section>

        {/* About section */}
        <section className="about-section" id="about">
          <div>
            <span className="section-eyebrow">
              THE STAYSCAPE DIFFERENCE
            </span>

            <h2>
              Travel beautifully. Stay meaningfully.
            </h2>

            <p>
              We believe the right stay can transform an ordinary
              trip into an extraordinary memory. Discover places
              selected for their character, comfort and exceptional
              hospitality across India.
            </p>
          </div>

          <div className="about-stat">
            <span>01</span>

            <strong>Thoughtfully curated</strong>

            <p>
              Stays chosen with comfort and quality in mind.
            </p>
          </div>

          <div className="about-stat">
            <span>02</span>

            <strong>Made for discovery</strong>

            <p>
              Find destinations and experiences worth exploring.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer" id="footer">
        <Link to="/" className="brand footer-brand">
          <span className="brand-icon">S</span>

          <span>
            StayScape<span className="brand-dot">.</span>
          </span>
        </Link>

        <p>Find your place. Make your stay.</p>

        <span className="copyright">
          © 2026 StayScape. All rights reserved.
        </span>
      </footer>
    </div>
  );
}

// Application routes
function App() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getHotels();
        setHotels(data);
      } catch (err) {
        console.error("Failed to load hotels:", err);

        setError(
          "We couldn't connect to our hotel service. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHotels();
  }, []);

  return (
    <Routes>
      {/* Homepage */}
      <Route
        path="/"
        element={
          <HomePage
            hotels={hotels}
            loading={loading}
            error={error}
          />
        }
      />

      {/* Hotel details */}
      <Route
        path="/hotels/:id"
        element={
          <HotelDetails
            hotels={hotels}
            loading={loading}
          />
        }
      />

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/bookings" element={<MyBookings />} />
      </Route>

      {/* Unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;