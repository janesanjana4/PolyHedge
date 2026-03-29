import { useState, useEffect, useCallback } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  getUser,
  patchUser,
  clearUser,
  SECTOR_LABELS,
  SECTOR_TO_PAGE,
} from "../lib/userSession";
import { clearAuthTokens } from "../lib/authSession";
import { API } from "../data/constants";

const G = "#c6a15b";
const G2 = "#e2bc72";
const YES = "#34d399";
const NO = "#f87171";
const CREAM = "#ede8d9";
const DIM = "#8c8676";
const CARD = {
  background: "#0d0d18",
  border: "0.5px solid rgba(198,161,91,0.28)",
  padding: "1.35rem 1.5rem",
};
const LABEL = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: ".58rem",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: DIM,
  margin: "0 0 1rem",
  fontWeight: 400,
};

function fmtMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}

function runPaperRound({ user, market, side, stake }) {
  if (!market || stake <= 0 || stake > user.balance) return null;
  const pct = side === "yes" ? market.yesPct : market.noPct;
  if (!pct || pct <= 0) return null;
  const potentialPayout = stake / (pct / 100);
  const win = Math.random() < 0.52;
  const delta = win ? potentialPayout - stake : -stake;
  const balance = Math.max(0, user.balance + delta);
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: new Date().toISOString(),
    win,
    side,
    stake,
    delta,
    question: market.question,
  };
  const activity = [entry, ...user.activity].slice(0, 40);
  patchUser({
    balance,
    wins: user.wins + (win ? 1 : 0),
    losses: user.losses + (win ? 0 : 1),
    streak: win ? user.streak + 1 : 0,
    activity,
  });
  return { win, delta };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [, bump] = useState(0);
  const refresh = useCallback(() => bump((x) => x + 1), []);
  const user = getUser();

  const [hero, setHero] = useState(null);
  const [heroErr, setHeroErr] = useState(null);
  const [stake, setStake] = useState(25);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/markets/hero`);
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.market) setHero(data.market);
        else setHeroErr("No live market returned.");
      } catch {
        if (!cancelled) setHeroErr("API unreachable — run `node server.js` from the repo root.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  const onPaperBet = (side) => {
    const r = runPaperRound({ user, market: hero, side, stake });
    if (r) {
      setLastResult(r);
      refresh();
    }
  };

  const addWatchlist = () => {
    if (!hero?.id) return;
    if (user.watchlist.some((w) => w.id === hero.id)) return;
    patchUser({
      watchlist: [
        {
          id: hero.id,
          question: hero.question,
          yesPct: hero.yesPct,
          noPct: hero.noPct,
        },
        ...user.watchlist,
      ].slice(0, 8),
    });
    refresh();
  };

  const removeWatchlist = (id) => {
    patchUser({ watchlist: user.watchlist.filter((w) => w.id !== id) });
    refresh();
  };

  const winRate =
    user.wins + user.losses > 0
      ? Math.round((100 * user.wins) / (user.wins + user.losses))
      : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07070d",
        color: CREAM,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 300,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "1.25rem 2rem",
          borderBottom: "0.5px solid rgba(198,161,91,0.22)",
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            color: CREAM,
            fontFamily: "'Cormorant Garamond', 'Cormorant Garant', Georgia, serif",
            fontSize: "1.15rem",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: G,
            }}
          />
          Poly Hedge
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Link
            to="/"
            style={{ color: DIM, textDecoration: "none", fontSize: ".85rem" }}
          >
            Markets
          </Link>
          <Link
            to="/hedge-calculator"
            style={{ color: DIM, textDecoration: "none", fontSize: ".85rem" }}
          >
            Hedge calculator
          </Link>
          <Link
            to="/sector"
            style={{ color: DIM, textDecoration: "none", fontSize: ".85rem" }}
          >
            Sectors
          </Link>
          <button
            type="button"
            onClick={() => {
              clearAuthTokens();
              clearUser();
              navigate("/signup");
            }}
            style={{
              background: "transparent",
              border: "0.5px solid rgba(255,255,255,0.12)",
              color: DIM,
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: ".75rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Sign out
          </button>
        </nav>
      </header>

      <main
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "2.5rem 1.5rem 3rem",
        }}
      >
        <p
          style={{
            fontFamily: "'Cormorant Garamond', 'Cormorant Garant', Georgia, serif",
            fontSize: "2rem",
            fontWeight: 300,
            margin: "0 0 0.35rem",
            lineHeight: 1.15,
          }}
        >
          Welcome back,{" "}
          <em style={{ color: G2, fontStyle: "italic" }}>{user.firstName}</em>
        </p>
        <p style={{ color: DIM, fontSize: ".9rem", marginBottom: "1.75rem" }}>
          Local profile{" "}
          <span
            style={{
              color: G,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: ".82rem",
            }}
          >
            @{user.username}
          </span>
          {" · "}
          paper trading & watchlist stay in this browser until you add auth.
        </p>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            marginBottom: "1rem",
          }}
        >
          <section style={CARD}>
            <h2 style={LABEL}>Paper balance</h2>
            <p
              style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "1.65rem",
                color: YES,
                fontWeight: 500,
              }}
            >
              {fmtMoney(user.balance)}
            </p>
          </section>
          <section style={CARD}>
            <h2 style={LABEL}>Streak</h2>
            <p
              style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "1.65rem",
                color: G2,
                fontWeight: 500,
              }}
            >
              {user.streak} win{user.streak === 1 ? "" : "s"} in a row
            </p>
          </section>
          <section style={CARD}>
            <h2 style={LABEL}>Paper record</h2>
            <p
              style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "1.65rem",
                color: CREAM,
                fontWeight: 500,
              }}
            >
              {user.wins}W · {user.losses}L
              {winRate != null && (
                <span style={{ color: DIM, fontSize: ".75rem", marginLeft: 8 }}>
                  ({winRate}% wins)
                </span>
              )}
            </p>
          </section>
          <section style={CARD}>
            <h2 style={LABEL}>Account</h2>
            <dl style={{ margin: 0, fontSize: ".8rem" }}>
              <dt style={{ color: DIM, fontSize: ".65rem", marginBottom: 3 }}>
                Email
              </dt>
              <dd style={{ margin: "0 0 .5rem", wordBreak: "break-all" }}>
                {user.email}
              </dd>
              <dt style={{ color: DIM, fontSize: ".65rem", marginBottom: 3 }}>
                Member since
              </dt>
              <dd style={{ margin: 0 }}>
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </dd>
            </dl>
          </section>
        </div>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "1fr 1fr",
            alignItems: "start",
          }}
          className="dash-grid"
        >
          <section style={{ ...CARD, gridColumn: "1 / -1" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: "1rem",
              }}
            >
              <h2 style={{ ...LABEL, marginBottom: 0 }}>Live spotlight</h2>
              {hero && (
                <button
                  type="button"
                  onClick={addWatchlist}
                  disabled={user.watchlist.some((w) => w.id === hero.id)}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: ".58rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "8px 14px",
                    border: `0.5px solid ${user.watchlist.some((w) => w.id === hero.id) ? "rgba(52,211,153,.4)" : "rgba(198,161,91,.35)"}`,
                    background: user.watchlist.some((w) => w.id === hero.id)
                      ? "rgba(52,211,153,.08)"
                      : "rgba(198,161,91,.08)",
                    color: user.watchlist.some((w) => w.id === hero.id) ? YES : G,
                    cursor: user.watchlist.some((w) => w.id === hero.id)
                      ? "default"
                      : "pointer",
                  }}
                >
                  {user.watchlist.some((w) => w.id === hero.id)
                    ? "On watchlist"
                    : "+ Watchlist"}
                </button>
              )}
            </div>
            {heroErr && (
              <p style={{ color: NO, fontSize: ".85rem", margin: 0 }}>{heroErr}</p>
            )}
            {hero && (
              <>
                <p
                  style={{
                    fontSize: "1.05rem",
                    lineHeight: 1.45,
                    margin: "0 0 1rem",
                    color: CREAM,
                  }}
                >
                  {hero.question}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    flexWrap: "wrap",
                    marginBottom: "1rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: ".8rem",
                  }}
                >
                  <span style={{ color: YES }}>YES {hero.yesPct}%</span>
                  <span style={{ color: NO }}>NO {hero.noPct}%</span>
                  {hero.volumeFmt && (
                    <span style={{ color: DIM }}>Vol {hero.volumeFmt}</span>
                  )}
                </div>
                <p style={{ ...LABEL, marginBottom: 8 }}>Practice stake</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: "1rem" }}>
                  {[10, 25, 50, 100].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setStake(a)}
                      style={{
                        padding: "8px 14px",
                        border:
                          stake === a
                            ? "0.5px solid rgba(198,161,91,.6)"
                            : "0.5px solid rgba(255,255,255,.1)",
                        background: stake === a ? "rgba(198,161,91,.12)" : "transparent",
                        color: stake === a ? G2 : DIM,
                        cursor: "pointer",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: ".68rem",
                      }}
                    >
                      ${a}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => onPaperBet("yes")}
                    disabled={stake > user.balance}
                    style={{
                      flex: "1 1 140px",
                      padding: "12px 16px",
                      border: "none",
                      background: YES,
                      color: "#07070d",
                      fontWeight: 600,
                      cursor: stake > user.balance ? "not-allowed" : "pointer",
                      opacity: stake > user.balance ? 0.45 : 1,
                      fontSize: ".78rem",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Paper YES · {fmtMoney(stake)}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPaperBet("no")}
                    disabled={stake > user.balance}
                    style={{
                      flex: "1 1 140px",
                      padding: "12px 16px",
                      border: "none",
                      background: NO,
                      color: "#07070d",
                      fontWeight: 600,
                      cursor: stake > user.balance ? "not-allowed" : "pointer",
                      opacity: stake > user.balance ? 0.45 : 1,
                      fontSize: ".78rem",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Paper NO · {fmtMoney(stake)}
                  </button>
                </div>
                {stake > user.balance && (
                  <p style={{ color: NO, fontSize: ".75rem", margin: "10px 0 0" }}>
                    Stake exceeds balance — you are tapped out on paper funds.
                  </p>
                )}
                {lastResult && (
                  <p
                    style={{
                      margin: "12px 0 0",
                      fontSize: ".85rem",
                      color: lastResult.win ? YES : NO,
                    }}
                  >
                    Last round: {lastResult.win ? "Win" : "Loss"}{" "}
                    {lastResult.delta >= 0 ? "+" : ""}
                    {fmtMoney(lastResult.delta)}
                  </p>
                )}
              </>
            )}
          </section>

          <section style={CARD}>
            <h2 style={LABEL}>Your sectors</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {user.sectors.map((id) => {
                const page = SECTOR_TO_PAGE[id] || "all";
                return (
                  <Link
                    key={id}
                    to={`/sector?sector=${page}`}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: ".62rem",
                      letterSpacing: "0.06em",
                      padding: "8px 12px",
                      border: "0.5px solid rgba(198,161,91,0.35)",
                      color: G,
                      background: "rgba(198,161,91,.06)",
                      textDecoration: "none",
                    }}
                  >
                    {SECTOR_LABELS[id] || id} →
                  </Link>
                );
              })}
            </div>
          </section>

          <section style={CARD}>
            <h2 style={LABEL}>Watchlist ({user.watchlist.length})</h2>
            {user.watchlist.length === 0 ? (
              <p style={{ margin: 0, fontSize: ".82rem", color: DIM }}>
                Add the spotlight market or note tickers from Sectors.
              </p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {user.watchlist.map((w) => (
                  <li
                    key={w.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: "0.5px solid rgba(255,255,255,.06)",
                      fontSize: ".82rem",
                    }}
                  >
                    <span style={{ lineHeight: 1.4 }}>{w.question}</span>
                    <button
                      type="button"
                      onClick={() => removeWatchlist(w.id)}
                      style={{
                        flexShrink: 0,
                        background: "transparent",
                        border: "0.5px solid rgba(248,113,113,.35)",
                        color: NO,
                        fontSize: ".62rem",
                        padding: "4px 8px",
                        cursor: "pointer",
                        textTransform: "uppercase",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={{ ...CARD, gridColumn: "1 / -1" }}>
            <h2 style={LABEL}>Paper activity</h2>
            {user.activity.length === 0 ? (
              <p style={{ margin: 0, fontSize: ".82rem", color: DIM }}>
                Run a YES or NO practice round on the spotlight to log outcomes here.
              </p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {user.activity.slice(0, 12).map((a) => (
                  <li
                    key={a.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "0.5px solid rgba(255,255,255,.06)",
                      fontSize: ".78rem",
                    }}
                  >
                    <span style={{ color: a.win ? YES : NO, fontWeight: 600 }}>
                      {a.win ? "WIN" : "LOSS"}
                    </span>
                    <span style={{ color: DIM, lineHeight: 1.4 }}>
                      {a.side?.toUpperCase()} {fmtMoney(a.stake)} ·{" "}
                      {(a.question || "").slice(0, 70)}
                      {(a.question || "").length > 70 ? "…" : ""}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: a.delta >= 0 ? YES : NO,
                      }}
                    >
                      {a.delta >= 0 ? "+" : ""}
                      {fmtMoney(a.delta)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <style>{`
          @media (max-width: 720px) {
            .dash-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link
            to="/"
            style={{
              display: "inline-block",
              background: G,
              color: "#07070d",
              textDecoration: "none",
              padding: "14px 22px",
              fontSize: ".8rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            ⬡ Full markets view
          </Link>
          <button
            type="button"
            onClick={() => {
              clearAuthTokens();
              clearUser();
              navigate("/signup");
            }}
            style={{
              display: "inline-block",
              border: "0.5px solid rgba(255,255,255,0.15)",
              color: DIM,
              background: "transparent",
              cursor: "pointer",
              padding: "13px 20px",
              fontSize: ".78rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            New local profile
          </button>
        </div>
      </main>
    </div>
  );
}
