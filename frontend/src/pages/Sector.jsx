import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";
import "../styles/sector.css";

const API_BASE = "http://localhost:3001";

const SECTORS = [
  { key: "all", label: "All", keyword: "", icon: "⬡" },
  { key: "politics", label: "Politics", keyword: "president", icon: "🏛️" },
  { key: "finance", label: "Finance", keyword: "fed", icon: "📈" },
  { key: "crypto", label: "Crypto", keyword: "bitcoin", icon: "₿" },
  { key: "sports", label: "Sports", keyword: "nba", icon: "⚽" },
  { key: "tech", label: "Tech", keyword: "ai", icon: "💻" },
];

const G = "#c6a15b";
const YES_C = "#34d399";
const NO_C = "#f87171";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function generatePriceHistory(currentPct) {
  const days = 30;
  const data = [];
  let val = currentPct + (Math.random() * 30 - 15);
  val = Math.min(95, Math.max(5, val));
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    val += (Math.random() - 0.48) * 3;
    val = Math.min(97, Math.max(3, val));
    if (i < 5) val += (currentPct - val) * 0.25;
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      prob: Math.round(val),
    });
  }
  return data;
}

function generatePayoffCurve(yesPct, betAmount = 100) {
  const safePct = Math.max(yesPct, 1); // floor at 1% to avoid divide by zero
  const price = safePct / 100;
  const payout = betAmount / price;
  const profit = payout - betAmount;
  return Array.from({ length: 101 }, (_, p) => {
    const ev = (p / 100) * profit - (1 - p / 100) * betAmount;
    return { prob: p, ev: parseFloat(ev.toFixed(2)) };
  });
}

const PayoffTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div style={{
      background: "#0d0d0d",
      border: `1px solid ${val >= 0 ? "rgba(52,211,153,.3)" : "rgba(248,113,113,.3)"}`,
      padding: "8px 12px", borderRadius: 4,
      fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem",
    }}>
      <div style={{ color: "#666", marginBottom: 2 }}>If YES prob = {label}%</div>
      <div style={{ color: val >= 0 ? YES_C : NO_C, fontWeight: 600 }}>
        {val >= 0 ? "+" : ""}${val} EV
      </div>
    </div>
  );
};

const HistoryTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0d0d0d", border: "1px solid rgba(198,161,91,.3)",
      padding: "8px 12px", borderRadius: 4,
      fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem",
    }}>
      <div style={{ color: "#666", marginBottom: 2 }}>{label}</div>
      <div style={{ color: G, fontWeight: 600 }}>{payload[0].value}% YES</div>
    </div>
  );
};

function MarketCharts({ market }) {
  const [betAmount, setBetAmount] = useState(100);
  const payoffData = generatePayoffCurve(market.yesPct, betAmount);
  const historyData = generatePriceHistory(market.yesPct);
  const breakeven = market.yesPct;

  return (
    <div style={{
      marginTop: "2rem",
      border: "1px solid rgba(198,161,91,0.25)",
      borderRadius: 8,
      background: "rgba(10,10,10,0.9)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "1.25rem 1.75rem", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".75rem", color: G, marginBottom: ".35rem" }}>
          ⬡ {market.question}
        </div>
        <div style={{ display: "flex", gap: ".6rem", fontFamily: "'JetBrains Mono',monospace", fontSize: ".65rem" }}>
          <span style={{ color: YES_C }}>{market.yesPct}% YES</span>
          <span style={{ color: "#444" }}>·</span>
          <span style={{ color: "#666" }}>{market.volumeFmt} vol</span>
          <span style={{ color: "#444" }}>·</span>
          <span style={{ color: "#666" }}>Closes {formatDate(market.endDate)}</span>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>

        {/* Payoff Curve */}
        <div style={{ padding: "1.5rem 1.75rem", borderRight: "1px solid rgba(255,255,255,.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem", letterSpacing: ".12em", textTransform: "uppercase", color: G, marginBottom: ".25rem" }}>
                Payoff Curve
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem", color: "#666" }}>
                Expected profit vs resolution probability
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem", color: "#666" }}>Stake</span>
              {[25, 100, 500].map((a) => (
                <button key={a} onClick={() => setBetAmount(a)} style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: ".62rem",
                  padding: "3px 8px", borderRadius: 20, cursor: "pointer",
                  border: `1px solid ${betAmount === a ? G : "rgba(198,161,91,.25)"}`,
                  background: betAmount === a ? "rgba(198,161,91,.1)" : "transparent",
                  color: betAmount === a ? G : "#666",
                }}>
                  ${a}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            {[
              ["Breakeven", `${breakeven}%`, G],
              ["Max profit", `+$${market.yesPct > 0 ? (betAmount / (market.yesPct / 100) - betAmount).toFixed(0) : "∞"}`, YES_C],
              ["Max loss", `-$${betAmount}`, NO_C],
            ].map(([label, val, color]) => (
              <div key={label}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".58rem", letterSpacing: ".08em", textTransform: "uppercase", color: "#666", marginBottom: ".2rem" }}>{label}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".88rem", fontWeight: 600, color }}>{val}</div>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={payoffData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={YES_C} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={YES_C} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="4 4" />
              <XAxis dataKey="prob" tickFormatter={(v) => `${v}%`}
                tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: "#555" }}
                axisLine={{ stroke: "rgba(255,255,255,.08)" }} tickLine={false} interval={19} />
              <YAxis tickFormatter={(v) => `$${v}`}
                tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: "#555" }}
                axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<PayoffTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,.15)" strokeDasharray="4 4" />
              <ReferenceLine x={breakeven} stroke={G} strokeDasharray="4 4" strokeWidth={1.5}
                label={{ value: `${breakeven}%`, fill: G, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} />
              <Area type="monotone" dataKey="ev" stroke={YES_C} strokeWidth={2}
                fill="url(#profitGrad)" dot={false} activeDot={{ r: 4, fill: YES_C, stroke: "none" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Price History */}
        <div style={{ padding: "1.5rem 1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem", letterSpacing: ".12em", textTransform: "uppercase", color: G, marginBottom: ".25rem" }}>
                Price History
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem", color: "#666" }}>
                YES probability over last 30 days
              </div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".62rem", padding: "4px 10px", border: "1px solid rgba(198,161,91,.2)", color: G, borderRadius: 20 }}>
              30D
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            {[
              ["Current", `${market.yesPct}%`, G],
              ["30D high", `${Math.max(...historyData.map((d) => d.prob))}%`, YES_C],
              ["30D low", `${Math.min(...historyData.map((d) => d.prob))}%`, NO_C],
            ].map(([label, val, color]) => (
              <div key={label}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".58rem", letterSpacing: ".08em", textTransform: "uppercase", color: "#666", marginBottom: ".2rem" }}>{label}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".88rem", fontWeight: 600, color }}>{val}</div>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={G} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={G} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="4 4" />
              <XAxis dataKey="date"
                tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: "#555" }}
                axisLine={{ stroke: "rgba(255,255,255,.08)" }} tickLine={false} interval={6} />
              <YAxis domain={["auto", "auto"]} tickFormatter={(v) => `${v}%`}
                tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: "#555" }}
                axisLine={false} tickLine={false} width={42} />
              <Tooltip content={<HistoryTooltip />} />
              <Area type="monotone" dataKey="prob" stroke={G} strokeWidth={2}
                fill="url(#histGrad)" dot={false} activeDot={{ r: 4, fill: G, stroke: "none" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
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
function ChatWindow({ isOpen, onClose }) {
  const [messages, setMessages] = useState([{
    id: 0, type: "ai",
    html: `Hey — tell me your market view and I'll find the alpha. Try: <strong>"I think the Fed cuts rates before July"</strong>`,
  }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function push(html, type) {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), type, html }]);
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    push(text, "user");
    const thinkId = Date.now();
    setMessages((prev) => [...prev, { id: thinkId, type: "thinking", html: "⬡ Analyzing…" }]);

    try {
      const mRes = await fetch(`${API_BASE}/api/markets?keyword=${encodeURIComponent(text)}&limit=3`);
      const mData = await mRes.json();
      const markets = mData.markets || [];

      if (!markets.length) {
        setMessages((prev) => prev.filter((m) => m.id !== thinkId));
        push("No matching Polymarket markets found. Try a different topic.", "ai");
        setSending(false);
        return;
      }

      const top = markets[0];
      const aRes = await fetch(`${API_BASE}/api/analyze-bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: top.question, yesPct: top.yesPct, side: "yes", amount: 100 }),
      });
      const aData = await aRes.json();
      const list = markets.map((m) => `<strong>${m.question}</strong> — ${m.yesPct}% YES · ${m.volumeFmt}`).join("<br>");

      setMessages((prev) => prev.filter((m) => m.id !== thinkId));
      push(
        `<strong style="color:var(--gold)">Markets found:</strong><br>${list}<br><br>` +
        `<strong style="color:var(--gold)">K2 Analysis:</strong><br>${aData.analysis || "No analysis returned"}`,
        "ai",
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== thinkId));
      push("✗ Server offline — run: node server.js", "ai");
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className={`s-chat-window${isOpen ? " open" : ""}`}>
      <div className="s-chat-head">
        <span className="s-chat-head-title">K2 Alpha Analyst</span>
        <button className="s-chat-close" onClick={onClose}>✕</button>
      </div>
      <div className="s-chat-hint">Ask about any market or your trade idea</div>
      <div className="s-chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`s-msg ${msg.type}`} dangerouslySetInnerHTML={{ __html: msg.html }} />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="s-chat-input-row">
        <textarea ref={inputRef} className="s-chat-input" rows={1}
          placeholder="Your market view…" value={input}
          onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} />
        <button className="s-chat-send" onClick={send} disabled={sending}>ASK</button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Sector() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSector, setActiveSector] = useState(searchParams.get("sector") || "all");
  const [markets, setMarkets] = useState([]);
  const [status, setStatus] = useState("loading");
  const [apiBadge, setApiBadge] = useState({ text: "⬡ Fetching…", cls: "" });
  const [rawUrl, setRawUrl] = useState("—");
  const [rawBody, setRawBody] = useState("Waiting for response…");
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);

  const sector = SECTORS.find((s) => s.key === activeSector) || SECTORS[0];

  const loadMarkets = useCallback(async (sectorKey) => {
    const sec = SECTORS.find((s) => s.key === sectorKey) || SECTORS[0];
    const keyword = sec.keyword;
    const apiUrl = `${API_BASE}/api/markets?limit=12${keyword ? "&keyword=" + encodeURIComponent(keyword) : ""}`;

    setStatus("loading");
    setMarkets([]);
    setSelectedMarket(null);
    setRawUrl(apiUrl);
    setRawBody("Calling API…");
    setApiBadge({ text: "⬡ Fetching…", cls: "" });

    try {
      const res = await fetch(apiUrl);
      const data = await res.json();
      const raw = JSON.stringify(data, null, 2);
      setRawBody(raw.length > 900 ? raw.slice(0, 900) + `\n\n… (${raw.length - 900} more chars)` : raw);

      if (!data.success) {
        setApiBadge({ text: `✗ ${data.error || "API error"}`, cls: "err" });
        setStatus("error");
        return;
      }
      const list = data.markets || [];
      if (!list.length) {
        setApiBadge({ text: "✗ No markets returned", cls: "err" });
        setStatus("empty");
        return;
      }
      setApiBadge({ text: `✓ ${list.length} markets loaded`, cls: "ok" });
      setMarkets(list);
      setStatus("ok");
    } catch (err) {
      setRawBody("Error: " + err.message);
      setApiBadge({ text: "✗ Server offline", cls: "err" });
      setStatus("error");
    }
  }, []);

  useEffect(() => { loadMarkets(activeSector); }, [activeSector, loadMarkets]);

  function switchSector(key) {
    setActiveSector(key);
    setSearchParams({ sector: key });
  }

  function handleCardClick(market) {
    setSelectedMarket((prev) => prev?.id === market.id ? null : market);
  }

  return (
    <>
      {/* ── Back button ── */}
      <div style={{ padding: "1.25rem 2rem 0" }}>
        <Link
          to="/"
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: ".7rem",
            letterSpacing: ".1em",
            color: "#666",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = G}
          onMouseLeave={(e) => e.currentTarget.style.color = "#666"}
        >
          ← Back to Home
        </Link>
      </div>

      {/* ── Header ── */}
      <div className="s-header">
        <div className="s-eyebrow">Live Data · Polymarket API</div>
        <h1 className="s-h1">Sector: <em>{sector.label}</em></h1>
        <div className="s-status-row">
          <div className="s-badge">
            <span className="s-live-dot" />
            Live · Polymarket Gamma API
          </div>
          <div className={`s-api-badge ${apiBadge.cls}`}>{apiBadge.text}</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="s-tabs">
        {SECTORS.map((s) => (
          <button key={s.key} className={`s-tab${activeSector === s.key ? " active" : ""}`}
            onClick={() => switchSector(s.key)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── Raw Panel ── */}
      <div className="s-raw-panel">
        <div className="s-raw-header">
          <span className="s-raw-label">⬡ Raw API Response</span>
          <span className="s-raw-url">{rawUrl}</span>
        </div>
        <div className="s-raw-body">{rawBody}</div>
      </div>

      {/* ── Grid ── */}
      <div className="s-grid-wrap">
        <div className="s-grid-meta">
          <span>
            {status === "loading" && "Loading markets…"}
            {status === "ok" && `${markets.length} live markets`}
            {status === "empty" && "0 markets"}
            {status === "error" && "Server offline"}
          </span>
          {status === "ok" && <span className="s-grid-src">Source: gamma-api.polymarket.com</span>}
        </div>

        <div className="s-grid">
          {status === "loading" && <div className="s-loading"><span className="s-spinner" />Calling Polymarket API…</div>}
          {status === "error" && <div className="s-loading s-loading--error">⬡ Server offline — run: node server.js</div>}
          {status === "empty" && <div className="s-loading s-loading--error">No markets found for this sector.</div>}
          {status === "ok" && (() => {
            const COLS = 4;
            const rows = [];
            for (let i = 0; i < markets.length; i += COLS) {
              rows.push(markets.slice(i, i + COLS));
            }
            return rows.map((row, rowIdx) => (
              <>
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
              </>
            ));
          })()}
        </div>
      </div>

      {/* ── Floating Chat ── */}
      <div className="s-chat-bubble">
        <ChatWindow isOpen={chatOpen} onClose={() => setChatOpen(false)} />
        <button className="s-chat-toggle" onClick={() => setChatOpen((v) => !v)} title="Ask K2 Analyst">⬡</button>
      </div>
    </>
  );
}