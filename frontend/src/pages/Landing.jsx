import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../styles/landing.css";
import Constellation from "../components/Constellation";
import SlotMachine from "../components/SlotMachine";
import WinPopup from "../components/WinPopup";
import Navbar from "../components/Navbar";
import ChatWindow from "../components/ChatWindow";


import {
  API,
  TICKER,
  LBOARD,
  CATS,
  FEED_USERS,
  FEED_QS,
  V_PROBS,
  V_QS,
  V_CHG,
  V_VOL,
  V_TRD,
  AVATARS,
} from "../data/constants";
import { getUser, patchUser } from "../lib/userSession";

const G = "#c6a15b";
const GB = "#e2bc72";
const GD = "#7a6238";
const YES = "#34d399";
const NO = "#f87171";
const BW = "rgba(198,161,91,0.28)";

const KEYWORD_MAP = {
  "": "",
  politics: "president",
  finance: "fed",
  crypto: "bitcoin",
  sports: "win",
};

export default function Landing() {
  const [sessionRev, setSessionRev] = useState(0);
  const [balance, setBalance] = useState(0);
  const [streak, setStreak] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [side, setSide] = useState(null);
  const [heroMarket, setHeroMarket] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [catFilter, setCatFilter] = useState("");
  const [popup, setPopup] = useState(null);
  const [vIdx, setVIdx] = useState(0);
  const [feed, setFeed] = useState([]);
  const popupTimer = useRef(null);

  useEffect(() => {
    const bump = () => setSessionRev((n) => n + 1);
    window.addEventListener("storage", bump);
    window.addEventListener("focus", bump);
    return () => {
      window.removeEventListener("storage", bump);
      window.removeEventListener("focus", bump);
    };
  }, []);

  useEffect(() => {
    const u = getUser();
    if (u) {
      setBalance(u.balance);
      setStreak(u.streak ?? 0);
    } else {
      setBalance(0);
      setStreak(0);
      setSide(null);
    }
  }, [sessionRev]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e, i) => {
          if (e.isIntersecting)
            setTimeout(() => e.target.classList.add("visible"), i * 80);
        }),
      { threshold: 0.1 },
    );
    document.querySelectorAll(".fade-in").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  });

  useEffect(() => {
    const addItem = () =>
      setFeed((f) => {
        const u = FEED_USERS[Math.floor(Math.random() * FEED_USERS.length)];
        const q = FEED_QS[Math.floor(Math.random() * FEED_QS.length)];
        const s = Math.random() > 0.5 ? "yes" : "no";
        const a = (Math.random() * 490 + 10).toFixed(0);
        return [{ u, q, s, a }, ...f].slice(0, 7);
      });
    addItem();
    addItem();
    addItem();
    const id = setInterval(addItem, 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(
      () => setVIdx((i) => (i + 1) % V_PROBS.length),
      4000,
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch(`${API}/api/markets/hero`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setHeroMarket(d.market);
      })
      .catch(() => {});
    loadMarkets("");
  }, []);

  const loadMarkets = async (cat) => {
    const keyword = KEYWORD_MAP[cat] ?? cat;
    try {
      const r = await fetch(
        `${API}/api/markets?limit=6${keyword ? "&keyword=" + encodeURIComponent(keyword) : ""}`,
      );
      const d = await r.json();
      console.log("response:", d); // ← add here
      if (d.success) setMarkets(d.markets);
    } catch (err) {
      console.error(err);
    }
  };

  const showPopup = (msg, sub, win) => {
    clearTimeout(popupTimer.current);
    setPopup({ msg, sub, win });
    popupTimer.current = setTimeout(() => setPopup(null), 5000);
  };

  const placeBet = () => {
    const u = getUser();
    if (!u) {
      showPopup(
        "Sign up to place bets.",
        "Create a free account to get a balance and wager.",
        false,
      );
      return;
    }
    if (!side) {
      showPopup("Pick YES or NO first.", "↑ Choose your side above", false);
      return;
    }
    if (betAmount <= 0) {
      showPopup("Set a stake first.", "↑ Choose a chip above", false);
      return;
    }
    if (betAmount > u.balance) {
      showPopup(
        "Insufficient balance.",
        `You have $${u.balance.toFixed(2)}`,
        false,
      );
      return;
    }
    const m = heroMarket || { yesPct: 50, noPct: 50 };
    const prob = side === "yes" ? m.yesPct / 100 : m.noPct / 100;
    const payout = parseFloat((betAmount / prob).toFixed(2));
    const win = Math.random() < 0.58;
    const newBalance = u.balance - betAmount + (win ? payout : 0);
    const newStreak = win ? (u.streak ?? 0) + 1 : 0;
    setBalance(newBalance);
    setStreak(newStreak);
    patchUser({
      balance: newBalance,
      streak: newStreak,
      wins: (u.wins ?? 0) + (win ? 1 : 0),
      losses: (u.losses ?? 0) + (win ? 0 : 1),
    });
    showPopup(
      win ? "You called it right!" : "Better luck next time.",
      win
        ? `+$${(payout - betAmount).toFixed(2)} profit`
        : "Stake has been settled.",
      win,
    );
  };

  const quickBet = () => {
    const u = getUser();
    if (!u) {
      showPopup(
        "Sign up to bet on markets.",
        "Use Get Started — create an account in under a minute.",
        false,
      );
      return;
    }
    if (betAmount <= 0 || betAmount > u.balance) {
      showPopup("Set a stake first.", "↑ Scroll up to pick a chip", false);
      return;
    }
    const win = Math.random() < 0.6;
    const newBalance = u.balance - betAmount + (win ? betAmount * 1.7 : 0);
    const newStreak = win ? (u.streak ?? 0) + 1 : 0;
    setBalance(newBalance);
    setStreak(newStreak);
    patchUser({
      balance: newBalance,
      streak: newStreak,
      wins: (u.wins ?? 0) + (win ? 1 : 0),
      losses: (u.losses ?? 0) + (win ? 0 : 1),
    });
    showPopup(
      win ? "Winner!" : "No luck this time.",
      win ? `+$${(betAmount * 0.7).toFixed(2)} profit` : "Stake settled",
      win,
    );
  };

  const p = V_PROBS[vIdx],
    circ = 452.4;

  const user = getUser();
  const isAuthed = !!user;

  const scrollToHeroMarket = () => {
    document.getElementById("hero-market")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Constellation />
      <WinPopup data={popup} />
      <Navbar isAuthed={isAuthed} balance={balance} />

      {/* HERO */}
      <section className="hero">
        <div>
          <div className="hero-eyebrow">Prediction Markets · Est. 2024</div>
          <h1 className="hero-title">
            Your insight.
            <br />
            Your edge.
            <br />
            <SlotMachine />
          </h1>
          <p className="hero-body">
            Poly Hedge is where knowledge becomes currency. Trade the
            probability of real-world outcomes — politics, finance, sports,
            science. If you're right, you win.
          </p>
          <div className="streak-bar">
            <span
              className="mono"
              style={{
                fontSize: ".62rem",
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--cdim)",
              }}
            >
              Win streak
            </span>
            <div style={{ display: "flex", gap: 3 }}>
              {Array.from({ length: 7 }, (_, i) => (
                <span
                  key={i}
                  className={`flame${i < streak ? " lit" : ""}`}
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  🔥
                </span>
              ))}
            </div>
            <span
              className="mono"
              style={{
                fontSize: "1rem",
                fontWeight: 500,
                color: G,
                marginLeft: "auto",
              }}
            >
              {streak} win{streak !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button type="button" className="btn-primary" onClick={scrollToHeroMarket}>
              Place Your Bet
            </button>

            <Link
              to={isAuthed ? "/dashboard" : "/signup"}
              className="btn-ghost"
            >
              Get Started
            </Link>
          </div>
        </div>

        <div id="hero-market">
          <div className="hero-card">
            <div
              style={{
                padding: "1.25rem 1.75rem 1rem",
                borderBottom: `0.5px solid ${BW}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: ".6rem",
                  letterSpacing: ".15em",
                  textTransform: "uppercase",
                  color: G,
                }}
              >
                {heroMarket
                  ? `${heroMarket.category || "Live"} · Polymarket`
                  : "Loading market…"}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: ".6rem",
                  color: YES,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: YES,
                    display: "inline-block",
                    animation: "pdot 1.5s ease-in-out infinite",
                  }}
                />
                Live
              </span>
            </div>

            <div style={{ padding: "1.5rem 1.75rem" }}>
              <div
                className="serif"
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 400,
                  lineHeight: 1.3,
                  color: "var(--cream)",
                  marginBottom: "1.25rem",
                }}
              >
                {heroMarket
                  ? heroMarket.question
                  : "Fetching top market from Polymarket…"}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginBottom: "1.25rem",
                  flexWrap: "wrap",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: ".6rem",
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    color: "var(--cdim)",
                  }}
                >
                  Stake:
                </span>
                {[10, 25, 50, 100].map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`chip${betAmount === a ? " active" : ""}`}
                    onClick={() => setBetAmount(a)}
                  >
                    ${a}
                  </button>
                ))}
                <input
                  className="chip-custom"
                  type="number"
                  placeholder="other"
                  onChange={(e) =>
                    setBetAmount(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: ".75rem",
                  marginBottom: "1rem",
                }}
              >
                {["yes", "no"].map((s) => (
                  <div
                    key={s}
                    className={`odds-side ${s}${side === s ? " sel" : ""}`}
                    onClick={() => setSide(s)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSide(s);
                      }
                    }}
                  >
                    <div
                      className="mono"
                      style={{
                        fontSize: ".6rem",
                        letterSpacing: ".12em",
                        textTransform: "uppercase",
                        marginBottom: 4,
                        color: s === "yes" ? YES : NO,
                      }}
                    >
                      {s.toUpperCase()}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: "1.7rem",
                        fontWeight: 500,
                        color: "var(--cream)",
                      }}
                    >
                      {heroMarket
                        ? heroMarket[s === "yes" ? "yesPct" : "noPct"] + "%"
                        : "—"}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: ".68rem",
                        color: "var(--cdim)",
                        marginTop: 2,
                      }}
                    >
                      {heroMarket && betAmount > 0
                        ? `Win $${(betAmount / (heroMarket[s === "yes" ? "yesPct" : "noPct"] / 100)).toFixed(2)}`
                        : "Select amount"}
                    </div>
                    <div
                      className="odds-bg"
                      style={{
                        background: s === "yes" ? YES : NO,
                        width: heroMarket
                          ? (s === "yes"
                              ? heroMarket.yesPct
                              : heroMarket.noPct) + "%"
                          : "50%",
                      }}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="place-btn"
                onClick={placeBet}
              >
                ⬡ &nbsp;Place Your Bet
              </button>
              {!isAuthed && (
                <p
                  className="mono"
                  style={{
                    fontSize: ".58rem",
                    letterSpacing: ".05em",
                    color: "var(--cdim)",
                    margin: "12px 0 0",
                    lineHeight: 1.5,
                    textAlign: "center",
                    opacity: 0.85,
                  }}
                >
                  Bets settle on your paper balance after{" "}
                  <Link
                    to="/signup"
                    style={{ color: G, textDecoration: "underline" }}
                  >
                    sign up
                  </Link>
                  . You can explore stakes and sides now.
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 1.75rem",
                borderTop: "0.5px solid rgba(255,255,255,.06)",
              }}
            >
              <div
                className="mono"
                style={{ fontSize: ".7rem", color: "var(--cdim)" }}
              >
                Volume:{" "}
                <span style={{ color: G, fontWeight: 500 }}>
                  {heroMarket ? heroMarket.volumeFmt : "—"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: ".72rem",
                  color: "var(--cdim)",
                }}
              >
                <div style={{ display: "flex" }}>
                  {AVATARS.map(({ bg, c, t }) => (
                    <div
                      key={t}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: "1.5px solid var(--bg2)",
                        marginLeft: t === "AK" ? 0 : -6,
                        background: bg,
                        color: c,
                        fontSize: 9,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 500,
                      }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
                betting now
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...TICKER, ...TICKER].map((x, i) => (
            <span
              key={i}
              className="mono"
              style={{
                fontSize: ".7rem",
                letterSpacing: ".05em",
                color: "var(--cdim)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
              }}
            >
              <span>{x.l}</span>
              <span style={{ color: G }}>{x.v}</span>
              <span style={{ color: x.u ? YES : NO }}>{x.u ? "▲" : "▼"}</span>
            </span>
          ))}
        </div>
      </div>

      {/* MARKETS */}
      <section id="markets">
        <div
          className="fade-in"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "2.5rem",
          }}
        >
          <div>
            <div className="sec-label">Live Bets</div>
            <div className="sec-title">
              Trending <em style={{ fontStyle: "italic", color: G }}>now</em>
            </div>
          </div>
          <div style={{ display: "flex", gap: ".5rem" }}>
            {[
              ["", "All"],
              ["politics", "Politics"],
              ["finance", "Finance"],
              ["crypto", "Crypto"],
              ["sports", "Sports"],
            ].map(([val, label]) => (
              <button
                key={val}
                className={`filter-btn${catFilter === val ? " active" : ""}`}
                onClick={() => {
                  setCatFilter(val);
                  loadMarkets(val);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="markets-grid fade-in">
          {markets.length === 0 ? (
            <div
              style={{
                gridColumn: "1/-1",
                padding: "3rem",
                textAlign: "center",
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: ".75rem",
                color: "var(--cdim)",
              }}
            >
              ⬡ Loading markets…
            </div>
          ) : (
            markets.map((m, i) => (
              <div key={i} className="market-card">
                <div
                  className="mono"
                  style={{
                    fontSize: ".6rem",
                    letterSpacing: ".15em",
                    textTransform: "uppercase",
                    color: "var(--cdim)",
                    marginBottom: ".75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: G,
                      display: "inline-block",
                    }}
                  />
                  {m.category || "General"}
                </div>
                <div
                  className="serif"
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 400,
                    lineHeight: 1.35,
                    color: "var(--cream)",
                    marginBottom: "1.1rem",
                    minHeight: "2.7rem",
                  }}
                >
                  {m.question}
                </div>
                <div className="m-bar-wrap">
                  <div className="m-bar" style={{ width: m.yesPct + "%" }} />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: ".9rem",
                  }}
                >
                  <div
                    className="mono"
                    style={{ fontSize: "1.05rem", fontWeight: 500, color: G }}
                  >
                    {m.yesPct}% YES
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: ".68rem", color: "var(--cdim)" }}
                  >
                    {m.volumeFmt} vol
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: ".5rem",
                  }}
                >
                  <button
                    type="button"
                    className="m-bet-yes"
                    onClick={() => quickBet(i, "yes")}
                  >
                    Bet YES ▲
                  </button>
                  <button
                    type="button"
                    className="m-bet-no"
                    onClick={() => quickBet(i, "no")}
                  >
                    Bet NO ▼
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* LEADERBOARD */}
      <section id="leaderboard" className="lb-section">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          <div className="fade-in">
            <div className="sec-label">Top Bettors</div>
            <div className="sec-title">
              This Week's{" "}
              <em style={{ fontStyle: "italic", color: G }}>leaderboard</em>
            </div>
            <table className="lb-table">
              <thead>
                <tr>
                  {["#", "Bettor", "Streak", "Return", "Volume"].map((h, i) => (
                    <th key={h} style={i === 4 ? { textAlign: "right" } : {}}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LBOARD.map((r) => (
                  <tr key={r.rank}>
                    <td
                      style={{
                        color: r.rank === 1 ? GB : G,
                        fontWeight: 500,
                        width: 32,
                      }}
                    >
                      {r.rank === 1 ? "◆" : r.rank}
                    </td>
                    <td
                      style={{ color: "var(--cream)", letterSpacing: ".04em" }}
                    >
                      {r.name}
                    </td>
                    <td>
                      🔥 <span style={{ color: G }}>{r.streak}</span>
                    </td>
                    <td style={{ color: YES, fontWeight: 500 }}>{r.ret}</td>
                    <td style={{ textAlign: "right" }}>{r.vol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="fade-in">
            <div className="sec-label" style={{ marginBottom: "1rem" }}>
              Activity Feed
            </div>
            <div className="bet-feed">
              <div
                style={{
                  padding: "1rem 1.25rem",
                  borderBottom: "0.5px solid rgba(255,255,255,.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: ".62rem",
                    letterSpacing: ".15em",
                    textTransform: "uppercase",
                    color: G,
                  }}
                >
                  Live Bets
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: ".6rem",
                    color: YES,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: YES,
                      display: "inline-block",
                      animation: "pdot 1.5s ease-in-out infinite",
                    }}
                  />
                  Live
                </span>
              </div>
              {feed.map((f, i) => (
                <div key={i} className="feed-item">
                  <span
                    className="mono"
                    style={{ fontSize: ".68rem", color: "var(--cdim)" }}
                  >
                    {f.u}
                  </span>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: ".62rem",
                        fontWeight: 500,
                        padding: "3px 8px",
                        background:
                          f.s === "yes"
                            ? "rgba(52,211,153,.1)"
                            : "rgba(248,113,113,.1)",
                        color: f.s === "yes" ? YES : NO,
                        border: `0.5px solid ${f.s === "yes" ? "rgba(52,211,153,.2)" : "rgba(248,113,113,.2)"}`,
                      }}
                    >
                      {f.s.toUpperCase()}
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: ".65rem", color: "var(--cdim)" }}
                    >
                      {f.q}
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: ".7rem", color: G, fontWeight: 500 }}
                    >
                      ${f.a}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        style={{
          background: "var(--bg2)",
          borderTop: `0.5px solid ${BW}`,
          borderBottom: `0.5px solid ${BW}`,
        }}
      >
        <div className="how-grid">
          <div className="fade-in">
            <div className="sec-label">How It Works</div>
            <h2 className="sec-title">
              Bets that
              <br />
              <em style={{ fontStyle: "italic", color: G }}>reward clarity</em>
            </h2>
            <p
              style={{
                fontSize: ".9rem",
                color: "var(--cdim)",
                lineHeight: 1.8,
                marginBottom: "2.5rem",
              }}
            >
              Every outcome has a price. The crowd sets the odds — your edge is
              knowing better than the crowd.
            </p>
            {[
              [
                "01",
                "Pick your market",
                "Browse live questions from Polymarket across politics, finance, crypto, and sports.",
              ],
              [
                "02",
                "Set your stake & place your bet",
                "Choose YES or NO, set your amount, and lock it in. K2 AI gives you instant analysis.",
              ],
              [
                "03",
                "Collect your winnings",
                "Correct bets pay $1.00 per share at resolution. Your foresight is your fortune.",
              ],
            ].map(([n, title, desc]) => (
              <div key={n} className="step">
                <div
                  className="mono"
                  style={{ fontSize: ".7rem", color: G, paddingTop: 3 }}
                >
                  {n}
                </div>
                <div>
                  <div
                    className="serif"
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 400,
                      color: "var(--cream)",
                      marginBottom: ".5rem",
                    }}
                  >
                    {title}
                  </div>
                  <div
                    style={{
                      fontSize: ".88rem",
                      lineHeight: 1.7,
                      color: "var(--cdim)",
                    }}
                  >
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="fade-in">
            <div className="prob-visual">
              <div
                className="serif"
                style={{
                  fontSize: "1rem",
                  fontStyle: "italic",
                  color: "var(--cdim)",
                  textAlign: "center",
                  marginBottom: "1.5rem",
                  lineHeight: 1.5,
                }}
              >
                {V_QS[vIdx]}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "2rem",
                }}
              >
                <svg
                  width="180"
                  height="180"
                  viewBox="0 0 180 180"
                  style={{ overflow: "visible" }}
                >
                  <circle
                    fill="none"
                    stroke="rgba(255,255,255,.06)"
                    strokeWidth="6"
                    cx="90"
                    cy="90"
                    r="72"
                  />
                  <circle
                    fill="none"
                    stroke={NO}
                    strokeWidth="6"
                    strokeLinecap="round"
                    cx="90"
                    cy="90"
                    r="72"
                    strokeDasharray="452.4"
                    strokeDashoffset="0"
                    transform="rotate(-90 90 90)"
                  />
                  <circle
                    fill="none"
                    stroke={G}
                    strokeWidth="6"
                    strokeLinecap="round"
                    cx="90"
                    cy="90"
                    r="72"
                    strokeDasharray="452.4"
                    strokeDashoffset={circ - (circ * p) / 100}
                    transform="rotate(-90 90 90)"
                    style={{
                      transition:
                        "stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)",
                    }}
                  />
                  <text
                    fontFamily="'JetBrains Mono',monospace"
                    fontSize="32"
                    fontWeight="500"
                    fill={G}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    x="90"
                    y="85"
                  >
                    {p}%
                  </text>
                  <text
                    fontSize="10.4"
                    fill={GD}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="'JetBrains Mono',monospace"
                    letterSpacing="1.6"
                    x="90"
                    y="108"
                  >
                    YES
                  </text>
                </svg>
              </div>
              {[
                ["Implied probability", p + "%", true],
                ["24h change", V_CHG[vIdx], V_CHG[vIdx].startsWith("+")],
                ["Total volume", V_VOL[vIdx], null],
                ["Unique bettors", V_TRD[vIdx], null],
                ["Closes", "Dec 31, 2025", null],
              ].map(([label, val, up]) => (
                <div key={label} className="prob-row">
                  <span
                    className="mono"
                    style={{ color: "var(--cdim)", letterSpacing: ".05em" }}
                  >
                    {label}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontWeight: 500,
                      color:
                        up === true ? YES : up === false ? NO : "var(--cream)",
                    }}
                  >
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-section fade-in">
        <div className="stats-grid">
          {[
            ["$847M+", "Total Volume"],
            ["2,400+", "Active Markets"],
            ["92K", "Active Bettors"],
            ["98%", "Resolution Accuracy"],
          ].map(([n, l]) => (
            <div key={l} className="stat-item">
              <div
                className="serif"
                style={{
                  fontSize: "3rem",
                  fontWeight: 300,
                  color: "var(--cream)",
                  lineHeight: 1,
                  marginBottom: ".5rem",
                }}
              >
                {n}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: ".65rem",
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "var(--cdim)",
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES — fixed: <a href> → <Link to> for client-side routing */}
      <section id="categories">
        <div className="fade-in">
          <div className="sec-label">Explore</div>
          <h2 className="sec-title">
            Market <em style={{ fontStyle: "italic", color: G }}>categories</em>
          </h2>
          <div className="cats-grid">
            {CATS.map((c) => (
              <Link
                key={c.label}
                className="cat-pill"
                to={`/sector?sector=${c.label.toLowerCase()}`}
              >
                <span style={{ fontSize: "1.1rem" }}>{c.icon}</span>
                <span
                  style={{
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: ".82rem",
                    color: "var(--cream)",
                    flex: 1,
                  }}
                >
                  {c.label}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: ".6rem",
                    color: "var(--cdim)",
                    background: "rgba(255,255,255,.06)",
                    padding: "2px 7px",
                    borderRadius: 20,
                  }}
                >
                  {c.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section fade-in">
        <div
          className="mono"
          style={{
            fontSize: ".7rem",
            letterSpacing: ".28em",
            textTransform: "uppercase",
            color: G,
            marginBottom: "1.5rem",
          }}
        >
          The odds are live. The time is now.
        </div>
        <h2
          className="serif"
          style={{
            fontSize: "clamp(2.8rem,5vw,5rem)",
            fontWeight: 300,
            lineHeight: 1.08,
            color: "var(--cream)",
            marginBottom: ".75rem",
          }}
        >
          Your call.
          <br />
          <em style={{ fontStyle: "italic", color: G }}>Your winnings.</em>
        </h2>
        <span
          className="serif"
          style={{
            display: "block",
            fontSize: "clamp(3.5rem,7vw,7rem)",
            fontWeight: 500,
            fontStyle: "italic",
            color: GB,
            textShadow: "0 0 80px rgba(226,188,114,.22)",
            marginBottom: "2rem",
            lineHeight: 1,
          }}
        >
          Place Your Bet.
        </span>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--cdim)",
            maxWidth: 500,
            margin: "0 auto 3rem",
            lineHeight: 1.8,
          }}
        >
          Join thousands of bettors turning market insight into paper returns.
          Sign up for a local profile — $1,000 virtual credits unlock betting
          on the landing page and your dashboard.
        </p>
        <div className="cta-input-row">
          <input
            className="cta-input"
            type="email"
            placeholder="Enter your email to start betting"
          />
          <Link
            to={isAuthed ? "/dashboard" : "/signup"}
            className="cta-submit"
          >
            {isAuthed ? "Dashboard" : "Get Started"}
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div
          className="serif"
          style={{
            fontSize: "1.1rem",
            fontWeight: 500,
            color: "var(--cdim)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: G,
              opacity: 0.6,
            }}
          />
          Poly Hedge
        </div>
        <ul className="footer-links">
          {["Markets", "Terms", "Privacy", "Docs", "Blog", "Discord"].map(
            (l) => (
              <li key={l}>
                <a href="#">{l}</a>
              </li>
            ),
          )}
        </ul>
        <div
          className="mono"
          style={{ fontSize: ".65rem", color: "var(--cdim)", opacity: 0.5 }}
        >
          ©️ 2025 Poly Hedge · All rights reserved
        </div>
      </footer>
      <ChatWindow />
    </>
  );
}
