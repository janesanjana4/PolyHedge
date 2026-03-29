import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/landing.css";
import Constellation from "../components/Constellation";
import Navbar from "../components/Navbar";
import ChatWindow from "../components/ChatWindow";
import { getUser } from "../lib/userSession";

// SlotMachine and WinPopup removed — betting UI not needed for hedge tool
// getUser / patchUser removed — no auth/balance logic on landing
// LBOARD, FEED_USERS, FEED_QS, AVATARS removed — leaderboard & feed removed per spec

import {
  API,
  TICKER,
  CATS,
  V_PROBS,
  V_QS,
  V_CHG,
  V_VOL,
  V_TRD,
} from "../data/constants";

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
  const navigate = useNavigate();

  // balance/streak/betAmount/side/popup/feed/sessionRev all removed — betting state
  const [heroMarket, setHeroMarket] = useState(null);
  const [heroLoading, setHeroLoading] = useState(true);
  const [markets, setMarkets] = useState([]);
  const [catFilter, setCatFilter] = useState("");
  const [vIdx, setVIdx] = useState(0);

  const marketsRef = useRef(null);

  // Intersection observer — kept exactly as original
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

  // Rotating probability visual — kept exactly as original
  useEffect(() => {
    const id = setInterval(
      () => setVIdx((i) => (i + 1) % V_PROBS.length),
      4000,
    );
    return () => clearInterval(id);
  }, []);

  // Hero market — endpoint corrected to /api/hero-market per spec
  useEffect(() => {
    fetch(`${API}/api/hero-market`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.market) setHeroMarket(d.market);
      })
      .catch(() => {})
      .finally(() => setHeroLoading(false));
    loadMarkets("");
  }, []);

  const loadMarkets = async (cat) => {
    const keyword = KEYWORD_MAP[cat] ?? cat;
    try {
      const r = await fetch(
        `${API}/api/markets?limit=6${keyword ? "&keyword=" + encodeURIComponent(keyword) : ""}`,
      );
      const d = await r.json();
      if (d.success) setMarkets(d.markets);
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToMarkets = () =>
    marketsRef.current?.scrollIntoView({ behavior: "smooth" });

  // Probability visual vars — kept exactly as original
  const p = V_PROBS[vIdx];
  const circ = 452.4;

  // Hero market YES/NO derived from API data
  const yesProb = heroMarket
    ? Math.round(
        (heroMarket.outcomePrices?.[0] ?? heroMarket.yesPct / 100 ?? 0.54) *
          100,
      )
    : 54;
  const noProb = 100 - yesProb;

  return (
    <>
      <Constellation />
      {/* WinPopup removed — was betting popup */}
      <Navbar />
      {/* Navbar no longer receives isAuthed/balance — no auth on landing */}

      {/* ── HERO ── */}
      <section className="hero">
        <div>
          <div className="hero-eyebrow">
            Prediction Market Hedge Engine · Est. 2024
          </div>
          {/* hero-title kept, SlotMachine replaced with static hedge headline */}
          <h1 className="hero-title">
            The hedge layer Polymarket
            <br />
            <em style={{ fontStyle: "italic", color: G }}>never built.</em>
          </h1>
          <p className="hero-body">
            Enter any leveraged position. PolyHedge finds the prediction market
            that protects it — combined payoff curves, mispricing detection, and
            K2 AI hedge recommendations.
          </p>
          {/* streak-bar removed — betting UI */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate("/hedge")}
            >
              Analyse & Hedge position
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={scrollToMarkets}
            >
              Browse Markets
            </button>
          </div>
        </div>

        {/* Hero card — shell kept identical, betting internals replaced with clean market data */}
        <div id="hero-market">
          <div className="hero-card">
            {/* card header — identical to original */}
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

            {/* card body — chip selector, YES/NO bet buttons, place-btn all removed */}
            <div style={{ padding: "1.5rem 1.75rem" }}>
              {heroLoading ? (
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
                  Fetching top market from Polymarket…
                </div>
              ) : (
                <>
                  {/* Market question — identical style to original */}
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
                    {heroMarket?.question ??
                      "Will BTC exceed $100K by end of 2025?"}
                  </div>

                  {/* YES / NO probability display — replaces chip + odds-side betting UI */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        className="mono"
                        style={{ fontSize: ".68rem", color: YES }}
                      >
                        YES &nbsp;{yesProb}%
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: ".68rem", color: NO }}
                      >
                        NO &nbsp;{noProb}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: "rgba(248,113,113,.2)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${yesProb}%`,
                          height: "100%",
                          background: `linear-gradient(90deg, ${YES}, ${G})`,
                          borderRadius: 3,
                          transition: "width .8s cubic-bezier(.4,0,.2,1)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Market meta stats */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: ".75rem",
                      marginBottom: "1.25rem",
                      padding: "1rem",
                      background: "rgba(255,255,255,.03)",
                      borderRadius: 8,
                      border: "0.5px solid rgba(255,255,255,.06)",
                    }}
                  >
                    {[
                      {
                        label: "VOLUME",
                        val:
                          heroMarket?.volumeFmt ??
                          (heroMarket?.volume
                            ? `$${(heroMarket.volume / 1e6).toFixed(1)}M`
                            : "—"),
                      },
                      {
                        label: "LIQUIDITY",
                        val: heroMarket?.liquidity
                          ? `$${(heroMarket.liquidity / 1e3).toFixed(0)}K`
                          : "—",
                      },
                      {
                        label: "CLOSES",
                        val: heroMarket?.endDate
                          ? new Date(heroMarket.endDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )
                          : "—",
                      },
                    ].map((item) => (
                      <div key={item.label} style={{ textAlign: "center" }}>
                        <div
                          className="mono"
                          style={{
                            fontSize: ".52rem",
                            color: "var(--cdim)",
                            letterSpacing: 1.5,
                            marginBottom: 4,
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          className="mono"
                          style={{
                            fontSize: ".82rem",
                            color: "var(--cream)",
                            fontWeight: 500,
                          }}
                        >
                          {item.val}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA replacing place-btn */}
                  <button
                    type="button"
                    className="place-btn"
                    onClick={() => {
                      const u = getUser();

                      if (!u) {
                        navigate("/signup");
                        return;
                      }

                      navigate("/hedge");
                    }}
                  >
                    ⬡ &nbsp;Hedge This Market
                  </button>
                </>
              )}
            </div>

            {/* card footer — AVATARS / "betting now" removed, replaced with clean source label */}
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
              <Link
                to="/sector"
                className="mono"
                style={{ fontSize: ".68rem", color: G, textDecoration: "none" }}
              >
                Browse all markets →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER — kept exactly as original ── */}
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

      {/* ── MARKETS — kept, BET YES/NO replaced with Analyze → ── */}
      <section id="markets" ref={marketsRef}>
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
            <div className="sec-label">Live Markets</div>
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
                {/* category pill — identical to original */}
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
                {/* question — identical to original */}
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
                {/* prob bar — identical to original */}
                <div className="m-bar-wrap">
                  <div className="m-bar" style={{ width: m.yesPct + "%" }} />
                </div>
                {/* prob + vol row — identical to original */}
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
                {/* BET YES / BET NO replaced with single Analyze → per spec */}
                <Link
                  to={`/sector?sector=${(m.category || "").toLowerCase()}`}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: ".6rem 1rem",
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: ".72rem",
                    letterSpacing: ".08em",
                    color: G,
                    border: `0.5px solid ${BW}`,
                    borderRadius: 6,
                    textDecoration: "none",
                    transition: "background .2s, border-color .2s",
                    background: "rgba(198,161,91,.05)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(198,161,91,.12)";
                    e.currentTarget.style.borderColor = G;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(198,161,91,.05)";
                    e.currentTarget.style.borderColor = BW;
                  }}
                >
                  Analyze →
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS — structure kept identical, content updated to hedge workflow ── */}
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
              Hedge positions
              <br />
              <em style={{ fontStyle: "italic", color: G }}>with precision</em>
            </h2>
            <p
              style={{
                fontSize: ".9rem",
                color: "var(--cdim)",
                lineHeight: 1.8,
                marginBottom: "2.5rem",
              }}
            >
              PolyHedge maps your leveraged exposure onto Polymarket's
              prediction contracts — so you're protected whether the market
              moves for you or against you.
            </p>
            {/* Steps — same structure/className as original, content changed per spec */}
            {[
              [
                "01",
                "Enter your position",
                "Input your leveraged trade — asset, direction, size, entry price, and leverage. PolyHedge models your full exposure curve instantly.",
              ],
              [
                "02",
                "Pick your Polymarket hedge",
                "Our engine scans live prediction markets for contracts that pay out when your trade goes wrong. One click to apply the hedge.",
              ],
              [
                "03",
                "Read your payoff curve",
                "Visualize hedged vs unhedged scenarios across every price level. K2 AI flags mispricing and optimizes your hedge ratio.",
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

          {/* Rotating probability visual — kept exactly as original, pixel-for-pixel */}
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
                ["Unique traders", V_TRD[vIdx], null],
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

      {/* ── STATS — kept exactly as original, replaces leaderboard per spec ── */}
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

      {/* ── CATEGORIES — kept exactly as original ── */}
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

      {/* ── CTA — structure kept identical, copy + button updated per spec ── */}
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
          Your position. Your hedge.
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
          Your position.
          <br />
          <em style={{ fontStyle: "italic", color: G }}>Your hedge.</em>
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
          Built to protect.
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
          PolyHedge turns Polymarket's prediction contracts into a live hedge
          layer for your leveraged positions. Enter your trade, find your hedge,
          read your payoff curve.
        </p>
        {/* email input row removed, single button per spec */}
        <button
          type="button"
          className="btn-primary"
          style={{ fontSize: "1rem", padding: ".9rem 2.5rem" }}
          onClick={() => navigate("/hedge", { state: { market: heroMarket } })}
        >
          Analyze & Hedge Position
        </button>
      </section>

      {/* ── FOOTER — kept exactly as original ── */}
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
          PolyHedge
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
          ©️ 2025 PolyHedge · All rights reserved
        </div>
      </footer>

      <ChatWindow />
    </>
  );
}
