import { Link, useParams } from "react-router-dom";
import {
  MapPin,
  Star,
  ArrowLeft,
  Wifi,
  Coffee,
  Users,
  Waves,
  Dumbbell,
  Utensils,
} from "lucide-react";

import "./HotelDetails.css";

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const amenityIcons = {
  "Free Wi-Fi": Wifi,
  Breakfast: Coffee,
  "Swimming pool": Waves,
  "Fitness centre": Dumbbell,
  Dining: Utensils,
  Spa: Users,
  "Sea views": Waves,
  "Lake views": Waves,
  "Nature experiences": Users,
};

function HotelDetails({ hotels, loading }) {
  const { id } = useParams();

  const hotel = hotels.find((item) => item.id === id);
  if (loading) {
  return (
    <div className="hotel-not-found">
      <h2>Loading hotel details...</h2>
    </div>
  );
}

  if (!hotel) {
    return (
      <div className="hotel-not-found">
        <h2>Hotel not found</h2>
        <Link to="/">Back to stays</Link>
      </div>
    );
  }

  return (
    <div className="hotel-details-page">
      <nav className="details-navbar">
        <Link to="/" className="details-brand">
          <span className="brand-icon">S</span>
          StayScape.
        </Link>

        <Link to="/" className="back-link">
          <ArrowLeft size={17} />
          Back to stays
        </Link>
      </nav>

      <main className="hotel-details-container">
        <div className="details-heading">
          <div>
            <span className="details-category">
              {hotel.category}
            </span>

            <h1>{hotel.name}</h1>

            <p className="details-location">
              <MapPin size={17} />
              {hotel.location}
            </p>

            {hotel.address && (
              <p className="details-address">
                {hotel.address}
              </p>
            )}
          </div>

          <div className="details-rating">
            <Star size={17} fill="currentColor" />
            <strong>{hotel.rating}</strong>
            <span>
              ({hotel.reviews} demo reviews)
            </span>
          </div>
        </div>

        <div className="details-image">
          <img
            src={hotel.image}
            alt={hotel.name}
          />
        </div>

        <div className="details-content">
          <section className="details-description">
            <h2>About this stay</h2>

            <p>{hotel.description}</p>

            <h2>What this stay offers</h2>

            <div className="amenities-list">
              {(hotel.amenities || [
                "Free Wi-Fi",
                "Breakfast",
              ]).map((amenity) => {
                const AmenityIcon =
                  amenityIcons[amenity] || Users;

                return (
                  <span key={amenity}>
                    <AmenityIcon size={18} />
                    {amenity}
                  </span>
                );
              })}
            </div>
          </section>

          <aside className="booking-card">
            <p>Illustrative starting price</p>

            <div className="details-price">
              {formatINR(hotel.price)}
              <span> / night*</span>
            </div>

            <button
              className="reserve-button"
              type="button"
              disabled
            >
              Booking coming soon
            </button>

            <p className="booking-note">
              Demo listing only. Live rates, room inventory
              and reservations are not connected yet.
            </p>
          </aside>
        </div>

        <p className="catalog-disclaimer">
          *Illustrative demo price. Actual hotel rates and
          availability may differ. StayScape is not currently
          connected to these properties.
        </p>
      </main>
    </div>
  );
}

export default HotelDetails;