/** Shared with Survey.jsx — signup / login visual system */
export const PH_AUTH_SURVEY_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=JetBrains+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
`;

export const PH_AUTH_SURVEY_CSS = `
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

  .ph-auth-switch {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.58rem;
    letter-spacing: 0.08em;
    color: var(--cream-dim);
    text-align: center;
    padding: 0 2rem 1.25rem;
    line-height: 1.65;
  }
  .ph-auth-switch a {
    color: var(--gold);
    text-decoration: none;
  }
  .ph-auth-switch a:hover { color: var(--gold-bright); }

  .ph-login-progress {
    height: 2px;
    background: linear-gradient(90deg, var(--gold-dim), var(--gold-bright));
  }
`;
