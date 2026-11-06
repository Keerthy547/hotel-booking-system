import { useState } from "react";

import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import "./Login.css";

function Login() {
  const {
    login,
    isAuthenticated,
    authLoading,
  } = useAuth();

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Wait until session restoration is complete
  if (authLoading) {
    return (
      <div className="auth-loading">
        Loading...
      </div>
    );
  }

  // Already logged-in users should go to the homepage
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await login(formData);

      // Always redirect to the StayScape homepage after login
      navigate("/", { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to sign in. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">

      <Link to="/" className="auth-back-link">
        <ArrowLeft size={17} />
        Back to StayScape
      </Link>

      <section className="auth-card">

        <Link to="/" className="auth-brand">
          <span className="brand-icon">S</span>
          StayScape<span>.</span>
        </Link>

        <div className="auth-heading">

          <span className="auth-eyebrow">
            WELCOME BACK
          </span>

          <h1>Sign in to your account.</h1>

          <p>
            Continue discovering exceptional stays across India.
          </p>

        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <label htmlFor="email">
            EMAIL ADDRESS
          </label>

          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <label htmlFor="password">
            PASSWORD
          </label>

          <div className="password-input-wrapper">

            <LockKeyhole size={17} />

            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>

          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>

        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register">
            Create one
          </Link>
        </p>

      </section>

    </main>
  );
}

export default Login;