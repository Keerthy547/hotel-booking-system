import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

function Register() {
  const { register, isAuthenticated, authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) {
    return <div className="auth-loading">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  const passwordRules = [
    {
      label: "At least 8 characters",
      valid: formData.password.length >= 8,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(formData.password),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(formData.password),
    },
    {
      label: "One number",
      valid: /\d/.test(formData.password),
    },
    {
      label: "One special character",
      valid: /[^A-Za-z0-9]/.test(formData.password),
    },
  ];

  const passwordStrength = passwordRules.filter(
    (rule) => rule.valid
  ).length;

  const handleChange = (event) => {
    const { name, value } = event.target;

    // Allow only digits in the phone number field.
    const updatedValue =
      name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;

    setFormData((previous) => ({
      ...previous,
      [name]: updatedValue,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setError("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.name.trim().length < 2) {
      newErrors.name = "Name must contain at least 2 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone =
        "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.";
    }

    if (passwordRules.some((rule) => !rule.valid)) {
      newErrors.password = "Please meet all password requirements.";
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone,
        password: formData.password,
      });

      navigate("/profile", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create your account. Please try again."
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

      <section className="auth-card register-card">
        <Link to="/" className="auth-brand">
          <span className="brand-icon">S</span>
          StayScape<span>.</span>
        </Link>

        <div className="auth-heading">
          <span className="auth-eyebrow">YOUR JOURNEY STARTS HERE</span>
          <h1>Create your account.</h1>
          <p>Join StayScape and discover exceptional stays across India.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="name">FULL NAME</label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Your full name"
            value={formData.name}
            onChange={handleChange}
            autoComplete="name"
            maxLength={100}
            required
          />
          {errors.name && (
            <span className="field-error">{errors.name}</span>
          )}

          <label htmlFor="register-email">EMAIL ADDRESS</label>
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
          {errors.email && (
            <span className="field-error">{errors.email}</span>
          )}

          <label htmlFor="phone">PHONE NUMBER</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="10-digit mobile number"
            value={formData.phone}
            onChange={handleChange}
            autoComplete="tel"
            inputMode="numeric"
            maxLength={10}
            required
          />
          <span className="field-hint">Indian mobile number only</span>
          {errors.phone && (
            <span className="field-error">{errors.phone}</span>
          )}

          <label htmlFor="register-password">PASSWORD</label>
          <div className="password-input-wrapper">
            <input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <div className="password-strength">
            <div className="strength-bars">
              {[1, 2, 3, 4, 5].map((bar) => (
                <span
                  key={bar}
                  className={bar <= passwordStrength ? "active" : ""}
                />
              ))}
            </div>
            <span>
              {formData.password.length === 0
                ? "Password strength"
                : passwordStrength <= 2
                  ? "Weak"
                  : passwordStrength <= 4
                    ? "Almost there"
                    : "Strong"}
            </span>
          </div>

          <div className="password-requirements">
            {passwordRules.map((rule) => (
              <div
                key={rule.label}
                className={rule.valid ? "requirement valid" : "requirement"}
              >
                {rule.valid ? <Check size={13} /> : <X size={13} />}
                {rule.label}
              </div>
            ))}
          </div>

          {errors.password && (
            <span className="field-error">{errors.password}</span>
          )}

          <label htmlFor="confirm-password">CONFIRM PASSWORD</label>
          <div className="password-input-wrapper">
            <input
              id="confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowConfirmPassword((previous) => !previous)
              }
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="field-error">{errors.confirmPassword}</span>
          )}

          <button
            type="submit"
            className="auth-submit-button"
            disabled={submitting}
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;