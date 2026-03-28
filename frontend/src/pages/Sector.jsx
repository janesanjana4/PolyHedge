import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import "../styles/sector.css";

const API_BASE = "http://localhost:3001";

const SECTORS = [
  { key: "all", label: "All", keyword: "", icon: "⬡" },
  { key: "politics", label: "Politics", keyword: "election", icon: "🏛️" },
  { key: "finance", label: "Finance", keyword: "fed rate", icon: "📈" },
  { key: "crypto", label: "Crypto", keyword: "bitcoin", icon: "₿" },
  { key: "sports", label: "Sports", keyword: "nba", icon: "⚽" },
  { key: "tech", label: "Tech", keyword: "ai", icon: "💻" },
];

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Market Card ──────────────────────────────────────────────────────────────
// Backend already normalizes: { id, question, yesPct, volumeFmt, endDate, category }

function MarketCard({ market, sectorKey }) {
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(market.yesPct), 80);
    return () => clearTimeout(t);
  }, [market.yesPct]);

  return (
    <div className="s-card">
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
          <button className="s-yn-btn s-yn-yes">YES ▲</button>
          <button className="s-yn-btn s-yn-no">NO ▼</button>
        </div>
      </div>
    </div>
  );
}

// ── Chat Window ──────────────────────────────────────────────────────────────

function ChatWindow({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 0,
      type: "ai",
      html: `Hey — tell me your market view and I'll find the alpha. Try: <strong>"I think the Fed cuts rates before July"</strong>`,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function push(html, type) {
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), type, html },
    ]);
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    push(text, "user");

    // add thinking placeholder
    const thinkId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: thinkId, type: "thinking", html: "⬡ Analyzing…" },
    ]);

    try {
      // 1. find relevant markets
      const mRes = await fetch(
        `${API_BASE}/api/markets?keyword=${encodeURIComponent(text)}&limit=3`,
      );
      const mData = await mRes.json();
      const markets = mData.markets || [];

      if (!markets.length) {
        setMessages((prev) => prev.filter((m) => m.id !== thinkId));
        push(
          "No matching Polymarket markets found. Try a different topic.",
          "ai",
        );
        setSending(false);
        return;
      }

      // 2. get AI analysis on top market
      const top = markets[0];
      const aRes = await fetch(`${API_BASE}/api/analyze-bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: top.question,
          yesPct: top.yesPct,
          side: "yes",
          amount: 100,
        }),
      });
      const aData = await aRes.json();

      const list = markets
        .map(
          (m) =>
            `<strong>${m.question}</strong> — ${m.yesPct}% YES · ${m.volumeFmt}`,
        )
        .join("<br>");

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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className={`s-chat-window${isOpen ? " open" : ""}`}>
      <div className="s-chat-head">
        <span className="s-chat-head-title">K2 Alpha Analyst</span>
        <button className="s-chat-close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="s-chat-hint">Ask about any market or your trade idea</div>
      <div className="s-chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`s-msg ${msg.type}`}
            dangerouslySetInnerHTML={{ __html: msg.html }}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="s-chat-input-row">
        <textarea
          ref={inputRef}
          className="s-chat-input"
          rows={1}
          placeholder="Your market view…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className="s-chat-send" onClick={send} disabled={sending}>
          ASK
        </button>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function Sector() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSector, setActiveSector] = useState(
    searchParams.get("sector") || "all",
  );
  const [markets, setMarkets] = useState([]);
  const [status, setStatus] = useState("loading"); // "loading" | "ok" | "empty" | "error"
  const [apiBadge, setApiBadge] = useState({ text: "⬡ Fetching…", cls: "" });
  const [rawUrl, setRawUrl] = useState("—");
  const [rawBody, setRawBody] = useState("Waiting for response…");
  const [chatOpen, setChatOpen] = useState(false);

  const sector = SECTORS.find((s) => s.key === activeSector) || SECTORS[0];

  const loadMarkets = useCallback(async (sectorKey) => {
    const sec = SECTORS.find((s) => s.key === sectorKey) || SECTORS[0];
    const keyword = sec.keyword;
    const apiUrl = `${API_BASE}/api/markets?limit=12${keyword ? "&keyword=" + encodeURIComponent(keyword) : ""}`;

    setStatus("loading");
    setMarkets([]);
    setRawUrl(apiUrl);
    setRawBody("Calling API…");
    setApiBadge({ text: "⬡ Fetching…", cls: "" });

    try {
      const res = await fetch(apiUrl);
      const data = await res.json();

      // show raw response (truncated)
      const raw = JSON.stringify(data, null, 2);
      setRawBody(
        raw.length > 900
          ? raw.slice(0, 900) + `\n\n… (${raw.length - 900} more chars)`
          : raw,
      );

      // server.js always returns { success, count, markets }
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

  useEffect(() => {
    loadMarkets(activeSector);
  }, [activeSector, loadMarkets]);

  function switchSector(key) {
    setActiveSector(key);
    setSearchParams({ sector: key });
  }

  return (
    <>
      {/* ── Header ── */}
      <div className="s-header">
        <div className="s-eyebrow">Live Data · Polymarket API</div>
        <h1 className="s-h1">
          Sector: <em>{sector.label}</em>
        </h1>
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
          <button
            key={s.key}
            className={`s-tab${activeSector === s.key ? " active" : ""}`}
            onClick={() => switchSector(s.key)}
          >
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
          {status === "ok" && (
            <span className="s-grid-src">Source: gamma-api.polymarket.com</span>
          )}
        </div>

        <div className="s-grid">
          {status === "loading" && (
            <div className="s-loading">
              <span className="s-spinner" />
              Calling Polymarket API…
            </div>
          )}
          {status === "error" && (
            <div className="s-loading s-loading--error">
              ⬡ Server offline — run: node server.js
            </div>
          )}
          {status === "empty" && (
            <div className="s-loading s-loading--error">
              No markets found for this sector.
            </div>
          )}
          {status === "ok" &&
            markets.map((m, i) => (
              <MarketCard key={m.id || i} market={m} sectorKey={activeSector} />
            ))}
        </div>
      </div>

      {/* ── Floating Chat ── */}
      <div className="s-chat-bubble">
        <ChatWindow isOpen={chatOpen} onClose={() => setChatOpen(false)} />
        <button
          className="s-chat-toggle"
          onClick={() => setChatOpen((v) => !v)}
          title="Ask K2 Analyst"
        >
          ⬡
        </button>
      </div>
    </>
  );
}
