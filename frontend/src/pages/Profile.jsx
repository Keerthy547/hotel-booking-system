
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Mail, Phone, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <main className="profile-page">
      <nav className="profile-navbar">
        <Link to="/" className="details-brand">
          <span className="brand-icon">S</span>
          StayScape.
        </Link>

        <Link to="/" className="back-link">
          <ArrowLeft size={17} />
          Back to stays
        </Link>
      </nav>

      <section className="profile-container">
        <span className="auth-eyebrow">YOUR STAYSCAPE ACCOUNT</span>
        <h1>Welcome, {user?.name}.</h1>
        <p className="profile-subtitle">
          Manage your account information and explore your next stay.
        </p>

        <div className="profile-card">
          <div className="profile-avatar">
            <UserRound size={32} />
          </div>

          <h2>{user?.name}</h2>
          <span className="profile-role">
            {user?.role === "customer" ? "StayScape Member" : user?.role}
          </span>

          <div className="profile-divider" />

          <div className="profile-detail">
            <Mail size={19} />
            <div>
              <span>EMAIL ADDRESS</span>
              <strong>{user?.email}</strong>
            </div>
          </div>

          <div className="profile-detail">
            <Phone size={19} />
            <div>
              <span>PHONE NUMBER</span>
              <strong>{user?.phone || "Not provided"}</strong>
            </div>
          </div>

          <button
            type="button"
            className="profile-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </section>
    </main>
  );
}

export default Profile;
