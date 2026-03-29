import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "../styles/sector.css";
import MarketCharts from "../components/MarketCharts";
import CrossMarketScanner from "../components/CrossMarketScanner";
import ChatWindow from "../components/ChatWindow";

const API_BASE = "http://localhost:3001";
const G        = "#c6a15b";
const YES_C    = "#34d399";
const NO_C     = "#f87171";

const SECTORS = [
  { key: "all",      label: "All",      keyword: "",          icon: "⬡" },
  { key: "politics", label: "Politics", keyword: "president", icon: "🏛️" },
  { key: "finance",  label: "Finance",  keyword: "fed",       icon: "📈" },
  { key: "crypto",   label: "Crypto",   keyword: "bitcoin",   icon: "₿" },
  { key: "sports",   label: "Sports",   keyword: "nba",       icon: "⚽" },
  { key: "tech",     label: "Tech",     keyword: "ai",        icon: "💻" },
];

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── AI Insight Button + Dropdown ──────────────────────────────────────────────
function AIInsightButton({ market }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [error, setError]     = useState(null);
  const ref                   = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function fetchInsight() {
    if (insight) { setOpen(true); return; } // already fetched
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_BASE}/api/analyze-bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: market.question,
          yesPct:   market.yesPct,
          side:     "yes",
          amount:   100,
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) setInsight(data.analysis);
      else setError("No analysis returned.");
    } catch {
      setError("Server offline — run: node server.js");
    }
    setLoading(false);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); fetchInsight(); }}
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: ".6rem",
          letterSpacing: ".08em",
          textTransform: "uppercase",
          padding: "5px 10px",
          borderRadius: 4,
          border: `1px solid rgba(198,161,91,.3)`,
          background: "rgba(198,161,91,.06)",
          color: G,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          transition: "all .15s",
          width: "100%",
          justifyContent: "center",
          marginTop: ".5rem",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(198,161,91,.12)"; e.currentTarget.style.borderColor = G; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(198,161,91,.06)"; e.currentTarget.style.borderColor = "rgba(198,161,91,.3)"; }}
      >
        ⬡ K2 AI Insight
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 320,
            background: "#0d0d0d",
            border: "1px solid rgba(198,161,91,.3)",
            borderRadius: 8,
            padding: "1rem 1.25rem",
            zIndex: 200,
            boxShadow: "0 8px 32px rgba(0,0,0,.6)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".75rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".62rem", letterSpacing: ".12em", textTransform: "uppercase", color: G }}>
              ⬡ K2 AI Insight
            </span>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: ".8rem", padding: 0 }}>✕</button>
          </div>

          {/* Market context */}
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem", color: "#666", marginBottom: ".75rem", paddingBottom: ".75rem", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <span style={{ color: YES_C }}>{market.yesPct}% YES</span>
            <span style={{ color: "#444", margin: "0 6px" }}>·</span>
            <span>{market.volumeFmt} vol</span>
            <span style={{ color: "#444", margin: "0 6px" }}>·</span>
            <span>Closes {formatDate(market.endDate)}</span>
          </div>

          {/* Content */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: ".65rem", color: "#555", padding: ".5rem 0" }}>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⬡</span>
              Analyzing market…
            </div>
          )}
          {error && (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".65rem", color: NO_C }}>{error}</div>
          )}
          {insight && !loading && (
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".65rem", color: "#bbb", lineHeight: 1.7 }}>
              {insight}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: ".75rem", paddingTop: ".6rem", borderTop: "1px solid rgba(255,255,255,.04)", fontFamily: "'JetBrains Mono',monospace", fontSize: ".55rem", color: "#333" }}>
            AI analysis only. Not financial advice.
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Market Card ───────────────────────────────────────────────────────────────
function MarketCard({ market, sectorKey, isSelected, onClick }) {
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(market.yesPct), 80);
    return () => clearTimeout(t);
  }, [market.yesPct]);

  return (
    <div
      className={`s-card${isSelected ? " s-card--selected" : ""}`}
      onClick={onClick}
      style={{
        cursor: "pointer",
        border: isSelected ? "1px solid rgba(198,161,91,.6)" : undefined,
        boxShadow: isSelected ? "0 0 0 1px rgba(198,161,91,.15)" : undefined,
      }}
    >
      <div className="s-card-cat">{market.category || sectorKey}</div>
      <div className="s-card-q">{market.question}</div>
      <div className="s-prob-bar-wrap">
        <div className="s-prob-bar" style={{ width: `${barWidth}%` }} />
      </div>
      <div className="s-card-stats">
        <span className="s-prob-num">{market.yesPct}% YES</span>
        <span className="s-vol">{market.volumeFmt} vol</span>
      </div>
      <div className="s-card-footer">
        <span className="s-card-end">Closes {formatDate(market.endDate)}</span>
        <div className="s-yes-no">
          <button className="s-yn-btn s-yn-yes" onClick={(e) => e.stopPropagation()}>YES ▲</button>
          <button className="s-yn-btn s-yn-no" onClick={(e) => e.stopPropagation()}>NO ▼</button>
        </div>
      </div>

      {/* AI Insight button */}
      <AIInsightButton market={market} />

      <div style={{
        marginTop: ".5rem", textAlign: "center",
        fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem",
        letterSpacing: ".1em", textTransform: "uppercase",
        color: isSelected ? "rgba(198,161,91,.7)" : "rgba(198,161,91,.35)",
      }}>
        {isSelected ? "▲ collapse" : "▼ view charts"}
      </div>
    </div>
  );
}

// ── Chat Window ───────────────────────────────────────────────────────────────
<ChatWindow />
// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Sector() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSector, setActiveSector] = useState(searchParams.get("sector") || "all");
  const [markets, setMarkets]           = useState([]);
  const [status, setStatus]             = useState("loading");
  const [apiBadge, setApiBadge]         = useState({ text: "⬡ Fetching…", cls: "" });
  const [chatOpen, setChatOpen]         = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);

  const sector = SECTORS.find((s) => s.key === activeSector) || SECTORS[0];
  const COLS   = 3;

  const loadMarkets = useCallback(async (sectorKey) => {
    const sec     = SECTORS.find((s) => s.key === sectorKey) || SECTORS[0];
    const keyword = sec.keyword;
    const apiUrl  = `${API_BASE}/api/markets?limit=12${keyword ? "&keyword=" + encodeURIComponent(keyword) : ""}`;

    setStatus("loading"); setMarkets([]); setSelectedMarket(null);
    setApiBadge({ text: "⬡ Fetching…", cls: "" });

    try {
      const res  = await fetch(apiUrl);
      const data = await res.json();
      const raw  = JSON.stringify(data, null, 2);
      if (!data.success) { setApiBadge({ text: `✗ ${data.error || "API error"}`, cls: "err" }); setStatus("error"); return; }
      const list = data.markets || [];
      if (!list.length) { setApiBadge({ text: "✗ No markets returned", cls: "err" }); setStatus("empty"); return; }
      setApiBadge({ text: `✓ ${list.length} markets loaded`, cls: "ok" });
      setMarkets(list);
      setStatus("ok");
    } catch (err) {
      setApiBadge({ text: "✗ Server offline", cls: "err" });
      setStatus("error");
    }
  }, []);

  useEffect(() => { loadMarkets(activeSector); }, [activeSector, loadMarkets]);

  function switchSector(key) { setActiveSector(key); setSearchParams({ sector: key }); }
  function handleCardClick(market) { setSelectedMarket((prev) => prev?.id === market.id ? null : market); }

  return (
    <>
      <div style={{ padding: "1.25rem 2rem 0" }}>
        <Link to="/"
          style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem", letterSpacing: ".1em", color: "#666", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
          onMouseEnter={(e) => e.currentTarget.style.color = G}
          onMouseLeave={(e) => e.currentTarget.style.color = "#666"}
        >
          ← Back to Home
        </Link>
      </div>
      <div style={{ padding: ".5rem 2rem 0" }}>
        <Link to="/hedge-calculator"
          style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem", letterSpacing: ".1em", color: "#666", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
          onMouseEnter={(e) => e.currentTarget.style.color = G}
          onMouseLeave={(e) => e.currentTarget.style.color = "#666"}
        >
          ⬡ Hedge Calculator
        </Link>
      </div>
      <div className="s-header">
        <div className="s-eyebrow">Live Data · Polymarket API</div>
        <h1 className="s-h1">Sector: <em>{sector.label}</em></h1>
        <div className="s-status-row">
          <div className="s-badge"><span className="s-live-dot" />Live · Polymarket Gamma API</div>
          <div className={`s-api-badge ${apiBadge.cls}`}>{apiBadge.text}</div>
        </div>
      </div>

      <div className="s-tabs">
        {SECTORS.map((s) => (
          <button key={s.key} className={`s-tab${activeSector === s.key ? " active" : ""}`} onClick={() => switchSector(s.key)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div className="s-grid-wrap">
        <div className="s-grid-meta">
          <span>
            {status === "loading" && "Loading markets…"}
            {status === "ok"      && `${markets.length} live markets`}
            {status === "empty"   && "0 markets"}
            {status === "error"   && "Server offline"}
          </span>
          {status === "ok" && <span className="s-grid-src">Source: gamma-api.polymarket.com</span>}
        </div>

        {status === "ok" && <CrossMarketScanner markets={markets} />}

        <div className="s-grid">
          {status === "loading" && <div className="s-loading"><span className="s-spinner" />Calling Polymarket API…</div>}
          {status === "error"   && <div className="s-loading s-loading--error">⬡ Server offline — run: node server.js</div>}
          {status === "empty"   && <div className="s-loading s-loading--error">No markets found for this sector.</div>}
          {status === "ok" && (() => {
            const rows = [];
            for (let i = 0; i < markets.length; i += COLS) rows.push(markets.slice(i, i + COLS));
            return rows.map((row, rowIdx) => (
              <React.Fragment key={rowIdx}>
                {row.map((m, i) => (
                  <MarketCard key={m.id || i} market={m} sectorKey={activeSector}
                    isSelected={selectedMarket?.id === m.id}
                    onClick={() => handleCardClick(m)} />
                ))}
                {row.some((m) => m.id === selectedMarket?.id) && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <MarketCharts market={selectedMarket} />
                  </div>
                )}
              </React.Fragment>
            ));
          })()}
        </div>
      </div>
      <ChatWindow />
    </>
  );
}