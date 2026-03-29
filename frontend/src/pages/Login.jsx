import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PH_AUTH_SURVEY_FONTS,
  PH_AUTH_SURVEY_CSS,
} from "../styles/phAuthSurveyStyles";
import { loginWithAuth0 } from "../lib/authApi";
import { setAuthTokens } from "../lib/authSession";
import { getUser, mergeProfileAfterLogin } from "../lib/userSession";

function validateEmail(val) {
  if (!val) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
    return "Enter a valid email address";
  return null;
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (getUser()) navigate("/dashboard", { replace: true });
  }, [navigate]);

  const emailErr = touched.email ? validateEmail(email) : null;
  const canSubmit =
    !validateEmail(email) && password.length > 0 && !submitting;

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setTouched({ email: true });
    if (validateEmail(email) || !password) return;
    setSubmitting(true);
    try {
      const data = await loginWithAuth0({
        email: email.trim(),
        password,
      });
      if (data.tokens) setAuthTokens(data.tokens);
      mergeProfileAfterLogin(data.profile || {});
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setFormError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>
        {PH_AUTH_SURVEY_FONTS}
        {PH_AUTH_SURVEY_CSS}
      </style>
      <div className="ph-survey-root">
        <div className="ph-card">
          <div className="ph-card-header">
            <div className="ph-logo">
              <div className="ph-logo-dot" />
              Poly Hedge
            </div>
            <p className="ph-step-title" style={{ marginBottom: "0.35rem" }}>
              Welcome <em>back.</em>
            </p>
            <p className="ph-step-sub" style={{ marginBottom: 0 }}>
              Sign in with the email and password you used at signup.
            </p>
          </div>

          <div className="ph-login-progress" />

          <form className="slide-enter" onSubmit={(e) => void submit(e)}>
            <div className="ph-card-body">
              <div className="ph-field">
                <label className="ph-label" htmlFor="login-email">
                  Email <span className="ph-required">*</span>
                </label>
                <input
                  id="login-email"
                  className={`ph-input${touched.email ? (emailErr ? " error" : email ? " valid" : "") : ""}`}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                />
                {touched.email && emailErr && (
                  <p className="ph-error-msg">⚠ {emailErr}</p>
                )}
              </div>
              <div className="ph-field">
                <label className="ph-label" htmlFor="login-password">
                  Password <span className="ph-required">*</span>
                </label>
                <input
                  id="login-password"
                  className="ph-input"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {formError && (
                <p className="ph-error-msg" style={{ marginBottom: "0.5rem" }}>
                  ⚠ {formError}
                </p>
              )}
            </div>
            <div className="ph-card-footer">
              <Link to="/" className="ph-btn-ghost" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                ← Home
              </Link>
              <button
                type="submit"
                className="ph-btn-primary"
                disabled={!canSubmit}
              >
                {submitting ? "Signing in…" : "⬡  Sign in"}
              </button>
            </div>
          </form>

          <p className="ph-auth-switch">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </>
  );
}
