import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveUser, getUser } from "../lib/userSession";
import { signupWithAuth0 } from "../lib/authApi";

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

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=JetBrains+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
`;

const css = `
  :root {
    --bg: #07070D;
    --bg2: #0D0D18;
    --bg3: #111120;
    --cream: #EDE8D9;
    --cream-dim: #8C8676;
    --gold: #C6A15B;
    --gold-bright: #E2BC72;
    --gold-dim: #7A6238;
    --yes: #34D399;
    --no: #F87171;
    --border: rgba(255,255,255,0.06);
    --border-warm: rgba(198,161,91,0.28);
  }

  .ph-survey-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .ph-survey-root {
    background: var(--bg);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    position: relative;
    overflow: hidden;
  }

  .ph-survey-root::before {
    content: '';
    position: fixed;
    top: -20%; left: -10%;
    width: 70%; height: 70%;
    background: radial-gradient(ellipse at top left, rgba(198,161,91,.06) 0%, transparent 65%);
    pointer-events: none;
  }
  .ph-survey-root::after {
    content: '';
    position: fixed;
    bottom: -20%; right: -10%;
    width: 60%; height: 60%;
    background: radial-gradient(ellipse at bottom right, rgba(198,161,91,.04) 0%, transparent 65%);
    pointer-events: none;
  }

  .ph-card {
    background: var(--bg2);
    border: 0.5px solid var(--border-warm);
    width: 100%;
    max-width: 520px;
    position: relative;
    z-index: 1;
    box-shadow: 0 0 80px rgba(198,161,91,.08), inset 0 0 40px rgba(198,161,91,.02);
  }
  .ph-card::before {
    content: '';
    position: absolute;
    top: -0.5px; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold-bright), var(--gold), var(--gold-bright), transparent);
  }

  .ph-card-header {
    padding: 1.75rem 2rem 1.25rem;
    border-bottom: 0.5px solid var(--border-warm);
  }

  .ph-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Cormorant Garant', serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--cream);
    margin-bottom: 1.25rem;
    letter-spacing: 0.02em;
  }
  .ph-logo-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--gold);
    animation: pulse-dot 2.5s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes pulse-dot {
    0%,100% { opacity:1; transform:scale(1) }
    50% { opacity:.5; transform:scale(.7) }
  }

  .ph-steps {
    display: flex;
    align-items: center;
    gap: 0;
  }
  .ph-step-item {
    display: flex;
    align-items: center;
    flex: 1;
  }
  .ph-step-dot-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .ph-step-dot {
    width: 22px; height: 22px;
    border-radius: 50%;
    border: 0.5px solid var(--border-warm);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.58rem;
    color: var(--cream-dim);
    transition: all 0.3s;
    flex-shrink: 0;
  }
  .ph-step-dot.active {
    border-color: var(--gold);
    background: rgba(198,161,91,.12);
    color: var(--gold);
  }
  .ph-step-dot.done {
    border-color: var(--yes);
    background: rgba(52,211,153,.1);
    color: var(--yes);
    font-size: 0.7rem;
  }
  .ph-step-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--cream-dim);
    white-space: nowrap;
    transition: color 0.3s;
  }
  .ph-step-label.active { color: var(--gold); }
  .ph-step-label.done { color: var(--yes); }

  .ph-step-line {
    flex: 1;
    height: 0.5px;
    background: var(--border-warm);
    margin: 0 4px;
    margin-bottom: 18px;
    transition: background 0.3s;
  }
  .ph-step-line.done { background: rgba(52,211,153,.35); }

  .ph-card-body {
    padding: 1.75rem 2rem;
  }

  .ph-step-title {
    font-family: 'Cormorant Garant', serif;
    font-size: 1.65rem;
    font-weight: 300;
    color: var(--cream);
    margin-bottom: 0.25rem;
    line-height: 1.1;
  }
  .ph-step-title em {
    font-style: italic;
    color: var(--gold);
  }
  .ph-step-sub {
    font-size: 0.82rem;
    color: var(--cream-dim);
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }

  .ph-field {
    margin-bottom: 1rem;
  }
  .ph-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.62rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--cream-dim);
    display: block;
    margin-bottom: 6px;
  }
  .ph-label .ph-required {
    color: var(--gold);
    margin-left: 2px;
  }

  .ph-input {
    width: 100%;
    background: var(--bg3);
    border: 0.5px solid var(--border-warm);
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    font-weight: 300;
    padding: 10px 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    appearance: none;
    border-radius: 0;
  }
  .ph-input::placeholder { color: var(--cream-dim); opacity: 0.5; }
  .ph-input:focus {
    border-color: var(--gold-dim);
    box-shadow: 0 0 0 1px rgba(198,161,91,.15);
  }
  .ph-input.error {
    border-color: var(--no);
    box-shadow: 0 0 0 1px rgba(248,113,113,.15);
  }
  .ph-input.valid {
    border-color: rgba(52,211,153,.4);
  }

  .ph-error-msg {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    color: var(--no);
    margin-top: 5px;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .ph-hint {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    color: var(--cream-dim);
    margin-top: 5px;
    letter-spacing: 0.05em;
    opacity: 0.7;
  }

  .ph-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

  .ph-input-wrap { position: relative; }
  .ph-input-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.75rem;
    pointer-events: none;
  }
  .ph-input-prefix {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    color: var(--gold-dim);
    pointer-events: none;
    user-select: none;
  }
  .ph-input.has-prefix { padding-left: 26px; }

  .ph-sectors-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }
  .ph-sector-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 0.5px solid var(--border);
    background: transparent;
    color: var(--cream-dim);
    cursor: pointer;
    transition: all 0.18s;
    text-align: left;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 300;
    border-radius: 0;
  }
  .ph-sector-btn:hover {
    border-color: var(--gold-dim);
    background: rgba(198,161,91,.04);
    color: var(--cream);
  }
  .ph-sector-btn.selected {
    border-color: var(--gold);
    background: rgba(198,161,91,.10);
    color: var(--gold);
  }
  .ph-sector-icon { font-size: 0.9rem; flex-shrink: 0; }
  .ph-sector-check {
    margin-left: auto;
    width: 14px; height: 14px;
    border-radius: 50%;
    border: 0.5px solid var(--gold-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 0.6rem;
    color: transparent;
    transition: all 0.18s;
  }
  .ph-sector-btn.selected .ph-sector-check {
    background: var(--gold);
    border-color: var(--gold);
    color: var(--bg);
  }

  .ph-terms-box {
    background: var(--bg3);
    border: 0.5px solid var(--border-warm);
    padding: 1rem;
    margin-bottom: 1.25rem;
  }
  .ph-terms-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    color: var(--cream-dim);
    line-height: 1.7;
    letter-spacing: 0.02em;
  }
  .ph-terms-highlight {
    color: var(--gold);
    font-style: italic;
    font-family: 'Cormorant Garant', serif;
    font-size: 0.78rem;
  }

  .ph-checkbox-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
    padding: 0.75rem;
    border: 0.5px solid var(--border);
    transition: border-color 0.2s;
    margin-bottom: 0.75rem;
  }
  .ph-checkbox-row:hover { border-color: var(--gold-dim); }
  .ph-checkbox-row.checked { border-color: rgba(52,211,153,.35); background: rgba(52,211,153,.03); }

  .ph-checkbox {
    width: 18px; height: 18px;
    border: 0.5px solid var(--border-warm);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
    transition: all 0.18s;
  }
  .ph-checkbox.checked {
    background: var(--yes);
    border-color: var(--yes);
    color: var(--bg);
  }
  .ph-checkbox-label {
    font-size: 0.8rem;
    color: var(--cream-dim);
    line-height: 1.55;
  }
  .ph-checkbox-label strong {
    color: var(--cream);
    font-weight: 500;
  }
  .ph-checkbox-label a {
    color: var(--gold);
    text-decoration: none;
  }

  .ph-divider {
    height: 0.5px;
    background: var(--border-warm);
    margin: 1.25rem 0;
  }

  .ph-card-footer {
    padding: 1rem 2rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .ph-btn-primary {
    flex: 1;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--bg);
    background: var(--gold);
    border: none;
    padding: 14px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
    border-radius: 0;
  }
  .ph-btn-primary:hover { background: var(--gold-bright); }
  .ph-btn-primary:active { transform: scale(0.98); }
  .ph-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .ph-btn-ghost {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--cream-dim);
    background: none;
    border: 0.5px solid var(--border);
    padding: 13px 22px;
    cursor: pointer;
    transition: all 0.2s;
    border-radius: 0;
  }
  .ph-btn-ghost:hover { border-color: var(--gold-dim); color: var(--gold); }

  .ph-progress-bar {
    height: 2px;
    background: var(--border);
    position: relative;
    overflow: hidden;
  }
  .ph-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold-dim), var(--gold-bright));
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .ph-success {
    padding: 2.5rem 2rem;
    text-align: center;
  }
  .ph-success-icon {
    width: 56px; height: 56px;
    border-radius: 50%;
    background: rgba(52,211,153,.1);
    border: 0.5px solid rgba(52,211,153,.4);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.25rem;
    font-size: 1.4rem;
    color: var(--yes);
  }
  .ph-success-title {
    font-family: 'Cormorant Garant', serif;
    font-size: 2rem;
    font-weight: 300;
    color: var(--cream);
    margin-bottom: 0.5rem;
  }
  .ph-success-title em { font-style: italic; color: var(--gold); }
  .ph-success-sub {
    font-size: 0.85rem;
    color: var(--cream-dim);
    line-height: 1.7;
    max-width: 340px;
    margin: 0 auto 2rem;
  }
  .ph-summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0;
    border-bottom: 0.5px solid var(--border);
    font-size: 0.8rem;
  }
  .ph-summary-row:last-child { border-bottom: none; }
  .ph-summary-key {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--cream-dim);
  }
  .ph-summary-val {
    color: var(--cream);
    font-weight: 400;
    text-align: right;
    max-width: 240px;
    word-break: break-all;
  }
  .ph-tag {
    display: inline-block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.08em;
    padding: 3px 8px;
    border: 0.5px solid var(--border-warm);
    color: var(--gold);
    margin: 2px;
    background: rgba(198,161,91,.06);
  }

  .slide-enter {
    animation: slideIn 0.32s cubic-bezier(0.4,0,0.2,1);
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(18px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .slide-exit {
    animation: slideOut 0.24s cubic-bezier(0.4,0,0.2,1) forwards;
  }
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(-18px); }
  }

  .ph-username-status {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    margin-top: 5px;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .ph-char-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    color: var(--cream-dim);
    text-align: right;
    margin-top: 4px;
    opacity: 0.6;
  }
`;

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
        form.password.length >= 8 &&
        form.confirmPassword === form.password
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
        {FONTS}
        {css}
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
            <SuccessScreen form={form} onGoToDashboard={() => navigate("/dashboard")} />
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
    form.confirmPassword.length > 0 &&
    form.password !== form.confirmPassword;
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
        {weak && (
          <p className="ph-error-msg">⚠ Use at least 8 characters</p>
        )}
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
        {mismatch && (
          <p className="ph-error-msg">⚠ Passwords do not match</p>
        )}
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
