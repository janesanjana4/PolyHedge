import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { saveUser, getUser } from "../lib/userSession";
import { signupWithAuth0 } from "../lib/authApi";
import {
  PH_AUTH_SURVEY_FONTS,
  PH_AUTH_SURVEY_CSS,
} from "../styles/phAuthSurveyStyles";

const SECTORS = [
  { id: "finance", label: "Finance", icon: "📈" },
  { id: "politics", label: "Politics", icon: "🏛️" },
  { id: "technology", label: "Technology", icon: "💻" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "science", label: "Science", icon: "🧬" },
  { id: "geopolitics", label: "Geopolitics", icon: "🌍" },
  { id: "culture", label: "Culture", icon: "🎬" },
  { id: "health", label: "Health", icon: "🏥" },
];

const STEPS = ["Identity", "Account", "Interests", "Terms", "Secure"];

function validateUsername(val) {
  if (!val) return "Username is required";
  if (val.length < 3) return "Minimum 3 characters";
  if (!/^[a-zA-Z0-9\-\.]+$/.test(val))
    return "Only letters, numbers, - and . allowed";
  if (/^[\-\.]/.test(val) || /[\-\.]$/.test(val))
    return "Cannot start or end with - or .";
  return null;
}

function validateEmail(val) {
  if (!val) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
    return "Enter a valid email address";
  return null;
}

function validatePasswordPair(password, confirm) {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password !== confirm) return "Passwords do not match";
  return null;
}

export default function PolyHedgeSurvey() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (getUser()) navigate("/dashboard", { replace: true });
  }, [navigate]);
  const [animKey, setAnimKey] = useState(0);
  const [done, setDone] = useState(false);
  const [signupError, setSignupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    sectors: [],
    termsTrading: false,
    termsAge: false,
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (touched[k]) validate({ ...form, [k]: v }, k);
  };

  const touch = (k) => {
    setTouched((t) => ({ ...t, [k]: true }));
    validate(form, k);
  };

  const validate = (data, field) => {
    const errs = { ...errors };
    if (field === "firstName" || !field) {
      errs.firstName = data.firstName.trim() ? null : "First name is required";
    }
    if (field === "lastName" || !field) {
      errs.lastName = data.lastName.trim() ? null : "Last name is required";
    }
    if (field === "email" || !field) {
      errs.email = validateEmail(data.email);
    }
    if (field === "username" || !field) {
      errs.username = validateUsername(data.username);
    }
    setErrors(errs);
    return errs;
  };

  const toggleSector = (id) => {
    set(
      "sectors",
      form.sectors.includes(id)
        ? form.sectors.filter((s) => s !== id)
        : [...form.sectors, id],
    );
  };

  const canAdvance = () => {
    if (step === 0) {
      return (
        form.firstName.trim() &&
        form.lastName.trim() &&
        !validateEmail(form.email)
      );
    }
    if (step === 1) {
      return !validateUsername(form.username);
    }
    if (step === 2) {
      return form.sectors.length > 0;
    }
    if (step === 3) {
      return form.termsTrading && form.termsAge;
    }
    if (step === 4) {
      return (
        form.password.length >= 8 && form.confirmPassword === form.password
      );
    }
    return true;
  };

  const next = async () => {
    setSignupError(null);
    const errs = validate(form, null);
    if (step === 0) {
      setTouched({ firstName: true, lastName: true, email: true });
      if (errs.firstName || errs.lastName || errs.email) return;
    }
    if (step === 1) {
      setTouched((t) => ({ ...t, username: true }));
      if (errs.username) return;
    }
    if (step < 4) {
      if (step === 3 && (!form.termsTrading || !form.termsAge)) return;
      setAnimKey((k) => k + 1);
      setStep((s) => s + 1);
      return;
    }
    if (step === 4) {
      if (submitting) return;
      const pe = validatePasswordPair(form.password, form.confirmPassword);
      if (pe) {
        setSignupError(pe);
        return;
      }
      setSubmitting(true);
      try {
        await signupWithAuth0({
          email: form.email.trim(),
          password: form.password,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          username: form.username,
          sectors: form.sectors,
        });
        saveUser({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          username: form.username,
          sectors: form.sectors,
        });
        setDone(true);
      } catch (e) {
        setSignupError(e.message || "Signup failed");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const back = () => {
    if (step > 0) {
      setAnimKey((k) => k + 1);
      setStep((s) => s - 1);
    }
  };

  const progress = ((step + (done ? 1 : 0)) / STEPS.length) * 100;

  return (
    <>
      <style>
        {PH_AUTH_SURVEY_FONTS}
        {PH_AUTH_SURVEY_CSS}
      </style>
      <div className="ph-survey-root">
        <div className="ph-card">
          {/* Header */}
          <div className="ph-card-header">
            <div className="ph-logo">
              <div className="ph-logo-dot" />
              Poly Hedge
            </div>
            <div className="ph-steps">
              {STEPS.map((label, i) => (
                <div key={label} className="ph-step-item">
                  <div className="ph-step-dot-wrap">
                    <div
                      className={`ph-step-dot${done || i < step ? " done" : i === step ? " active" : ""}`}
                    >
                      {done || i < step ? "✓" : i + 1}
                    </div>
                    <span
                      className={`ph-step-label${done || i < step ? " done" : i === step ? " active" : ""}`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`ph-step-line${done || i < step ? " done" : ""}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="ph-progress-bar">
            <div
              className="ph-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Body */}
          {!done ? (
            <div key={animKey} className="slide-enter">
              <div className="ph-card-body">
                {step === 0 && (
                  <Step0
                    form={form}
                    errors={errors}
                    touched={touched}
                    set={set}
                    touch={touch}
                  />
                )}
                {step === 1 && (
                  <Step1
                    form={form}
                    errors={errors}
                    touched={touched}
                    set={set}
                    touch={touch}
                  />
                )}
                {step === 2 && (
                  <Step2 form={form} toggleSector={toggleSector} />
                )}
                {step === 3 && <Step3 form={form} set={set} />}
                {step === 4 && <Step4Password form={form} set={set} />}
              </div>
              {signupError && step === 4 && (
                <div
                  style={{
                    padding: "0 2rem 0.75rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.65rem",
                    color: "var(--no)",
                    letterSpacing: "0.04em",
                    lineHeight: 1.5,
                  }}
                >
                  ⚠ {signupError}
                </div>
              )}
              <div className="ph-card-footer">
                <button
                  type="button"
                  className="ph-btn-ghost"
                  onClick={() => (step === 0 ? navigate("/") : back())}
                >
                  {step === 0 ? "← Go back" : "← Back"}
                </button>
                <button
                  type="button"
                  className="ph-btn-primary"
                  onClick={() => void next()}
                  disabled={!canAdvance() || submitting}
                >
                  {step === 4
                    ? submitting
                      ? "Creating…"
                      : "⬡  Create account"
                    : "Continue →"}
                </button>
              </div>
            </div>
          ) : (
            <SuccessScreen
              form={form}
              onGoToDashboard={() => navigate("/dashboard")}
            />
          )}
          {!done && (
            <p className="ph-auth-switch">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function Step0({ form, errors, touched, set, touch }) {
  return (
    <>
      <p className="ph-step-title">
        Who are <em>you?</em>
      </p>
      <p className="ph-step-sub">
        Tell us a little about yourself to get started.
      </p>
      <div className="ph-row">
        <div className="ph-field">
          <label className="ph-label">
            First Name <span className="ph-required">*</span>
          </label>
          <input
            className={`ph-input${touched.firstName ? (errors.firstName ? " error" : " valid") : ""}`}
            placeholder=""
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            onBlur={() => touch("firstName")}
          />
          {touched.firstName && errors.firstName && (
            <p className="ph-error-msg">⚠ {errors.firstName}</p>
          )}
        </div>
        <div className="ph-field">
          <label className="ph-label">
            Last Name <span className="ph-required">*</span>
          </label>
          <input
            className={`ph-input${touched.lastName ? (errors.lastName ? " error" : " valid") : ""}`}
            placeholder=""
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            onBlur={() => touch("lastName")}
          />
          {touched.lastName && errors.lastName && (
            <p className="ph-error-msg">⚠ {errors.lastName}</p>
          )}
        </div>
      </div>
      <div className="ph-field">
        <label className="ph-label">
          Email Address <span className="ph-required">*</span>
        </label>
        <div className="ph-input-wrap">
          <input
            className={`ph-input${touched.email ? (errors.email ? " error" : " valid") : ""}`}
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => touch("email")}
          />
          {touched.email && !errors.email && form.email && (
            <span className="ph-input-icon" style={{ color: "var(--yes)" }}>
              ✓
            </span>
          )}
        </div>
        {touched.email && errors.email && (
          <p className="ph-error-msg">⚠ {errors.email}</p>
        )}
        {!errors.email && !touched.email && (
          <p className="ph-hint">
            We'll use this to send your account confirmation.
          </p>
        )}
      </div>
    </>
  );
}

function Step1({ form, errors, touched, set, touch }) {
  const err = validateUsername(form.username);
  const isValid = form.username.length >= 3 && !err;

  return (
    <>
      <p className="ph-step-title">
        Pick your <em>handle.</em>
      </p>
      <p className="ph-step-sub">
        This is how the market sees you. Choose wisely.
      </p>
      <div className="ph-field">
        <label className="ph-label">
          Username <span className="ph-required">*</span>
        </label>
        <div className="ph-input-wrap">
          <span className="ph-input-prefix">@</span>
          <input
            className={`ph-input has-prefix${touched.username ? (errors.username ? " error" : isValid ? " valid" : "") : ""}`}
            placeholder="phantom_x"
            value={form.username}
            maxLength={32}
            onChange={(e) => set("username", e.target.value.toLowerCase())}
            onBlur={() => touch("username")}
          />
          {touched.username && isValid && (
            <span className="ph-input-icon" style={{ color: "var(--yes)" }}>
              ✓
            </span>
          )}
        </div>
        <p className="ph-char-count">{form.username.length} / 32</p>

        {touched.username && errors.username && (
          <p className="ph-error-msg">⚠ {errors.username}</p>
        )}

        {!touched.username ||
          (!errors.username && (
            <p className="ph-hint">
              Min. 3 characters · Letters, numbers, - and . only
            </p>
          ))}

        {isValid && (
          <div className="ph-username-status" style={{ color: "var(--yes)" }}>
            ✓ @{form.username} is available
          </div>
        )}
      </div>

      <div
        style={{
          background: "var(--bg3)",
          border: "0.5px solid var(--border)",
          padding: "0.875rem 1rem",
          marginTop: "0.5rem",
        }}
      >
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--gold)",
            marginBottom: "6px",
          }}
        >
          Username rules
        </p>
        {[
          ["Minimum 3 characters", form.username.length >= 3],
          [
            "No spaces or special characters",
            form.username.length > 0 &&
              /^[a-zA-Z0-9\-\.]*$/.test(form.username),
          ],
          ["Only - and . as special chars", true],
          [
            "Cannot start or end with - or .",
            form.username.length > 0 &&
              !/^[\-\.]/.test(form.username) &&
              !/[\-\.]$/.test(form.username),
          ],
        ].map(([rule, ok]) => (
          <div
            key={rule}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "3px 0",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.62rem",
              color:
                form.username.length === 0
                  ? "var(--cream-dim)"
                  : ok
                    ? "var(--yes)"
                    : "var(--no)",
            }}
          >
            <span>{form.username.length === 0 ? "·" : ok ? "✓" : "✗"}</span>
            {rule}
          </div>
        ))}
      </div>
    </>
  );
}

function Step2({ form, toggleSector }) {
  return (
    <>
      <p className="ph-step-title">
        What moves <em>you?</em>
      </p>
      <p className="ph-step-sub">
        Pick the markets you want to follow. Select at least one.
      </p>
      <div className="ph-sectors-grid">
        {SECTORS.map((s) => (
          <button
            key={s.id}
            className={`ph-sector-btn${form.sectors.includes(s.id) ? " selected" : ""}`}
            onClick={() => toggleSector(s.id)}
          >
            <span className="ph-sector-icon">{s.icon}</span>
            <span>{s.label}</span>
            <span className="ph-sector-check">
              {form.sectors.includes(s.id) ? "✓" : ""}
            </span>
          </button>
        ))}
      </div>
      {form.sectors.length > 0 && (
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
            color: "var(--gold)",
            marginTop: "0.75rem",
            letterSpacing: "0.08em",
          }}
        >
          {form.sectors.length} sector{form.sectors.length !== 1 ? "s" : ""}{" "}
          selected
        </p>
      )}
    </>
  );
}

function Step3({ form, set }) {
  return (
    <>
      <p className="ph-step-title">
        Almost <em>there.</em>
      </p>
      <p className="ph-step-sub">
        Review the terms before placing your first bet.
      </p>

      <div className="ph-terms-box">
        <p className="ph-terms-text">
          <span className="ph-terms-highlight">
            "By trading, you agree to the Terms of Use
          </span>{" "}
          and attest you are not a U.S. person, are not located in the U.S. and
          are not the resident of or located in a restricted jurisdiction.{" "}
          <span className="ph-terms-highlight">"</span>
        </p>
      </div>

      <div
        className={`ph-checkbox-row${form.termsTrading ? " checked" : ""}`}
        onClick={() => set("termsTrading", !form.termsTrading)}
      >
        <div className={`ph-checkbox${form.termsTrading ? " checked" : ""}`}>
          {form.termsTrading && "✓"}
        </div>
        <p className="ph-checkbox-label">
          I agree to the <strong>Terms of Use</strong> and confirm I am not a
          U.S. person and am not located in a restricted jurisdiction.
        </p>
      </div>

      <div
        className={`ph-checkbox-row${form.termsAge ? " checked" : ""}`}
        onClick={() => set("termsAge", !form.termsAge)}
      >
        <div className={`ph-checkbox${form.termsAge ? " checked" : ""}`}>
          {form.termsAge && "✓"}
        </div>
        <p className="ph-checkbox-label">
          I am <strong>18 years of age or older</strong> and I accept the{" "}
          <strong>Privacy Policy</strong>.
        </p>
      </div>

      {(!form.termsTrading || !form.termsAge) && (
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
            color: "var(--cream-dim)",
            marginTop: "0.25rem",
            letterSpacing: "0.06em",
            opacity: 0.7,
          }}
        >
          Both agreements required to continue.
        </p>
      )}
    </>
  );
}

function Step4Password({ form, set }) {
  const mismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;
  const weak = form.password.length > 0 && form.password.length < 8;

  return (
    <>
      <p className="ph-step-title">
        Set your <em>password.</em>
      </p>
      <p className="ph-step-sub">
        This secures your Auth0 account. We never store your password in the
        browser.
      </p>
      <div className="ph-field">
        <label className="ph-label">
          Password <span className="ph-required">*</span>
        </label>
        <input
          className={`ph-input${weak ? " error" : form.password.length >= 8 ? " valid" : ""}`}
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
        />
        {weak && <p className="ph-error-msg">⚠ Use at least 8 characters</p>}
      </div>
      <div className="ph-field">
        <label className="ph-label">
          Confirm password <span className="ph-required">*</span>
        </label>
        <input
          className={`ph-input${mismatch ? " error" : form.confirmPassword && !mismatch && form.password.length >= 8 ? " valid" : ""}`}
          type="password"
          autoComplete="new-password"
          placeholder="Repeat password"
          value={form.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
        />
        {mismatch && <p className="ph-error-msg">⚠ Passwords do not match</p>}
      </div>
    </>
  );
}

function SuccessScreen({ form, onGoToDashboard }) {
  return (
    <div className="ph-success slide-enter">
      <div className="ph-success-icon">✓</div>
      <p className="ph-success-title">
        Welcome, <em>{form.firstName}.</em>
      </p>
      <p className="ph-success-sub">
        Your account has been created. Your first bet awaits — the market is
        live.
      </p>

      <div
        style={{
          background: "var(--bg3)",
          border: "0.5px solid var(--border-warm)",
          padding: "1rem",
          marginBottom: "1.25rem",
          textAlign: "left",
        }}
      >
        <div className="ph-summary-row">
          <span className="ph-summary-key">Name</span>
          <span className="ph-summary-val">
            {form.firstName} {form.lastName}
          </span>
        </div>
        <div className="ph-summary-row">
          <span className="ph-summary-key">Email</span>
          <span className="ph-summary-val">{form.email}</span>
        </div>
        <div className="ph-summary-row">
          <span className="ph-summary-key">Handle</span>
          <span
            className="ph-summary-val"
            style={{
              color: "var(--gold)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.8rem",
            }}
          >
            @{form.username}
          </span>
        </div>
        <div className="ph-summary-row">
          <span className="ph-summary-key">Sectors</span>
          <div style={{ textAlign: "right", maxWidth: "260px" }}>
            {form.sectors.map((s) => (
              <span key={s} className="ph-tag">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="ph-summary-row">
          <span className="ph-summary-key">Starting balance</span>
          <span
            className="ph-summary-val"
            style={{
              color: "var(--yes)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            $1,000.00
          </span>
        </div>
      </div>

      <button
        className="ph-btn-primary"
        style={{ width: "100%" }}
        type="button"
        onClick={onGoToDashboard}
      >
        ⬡ Open your dashboard
      </button>
    </div>
  );
}
