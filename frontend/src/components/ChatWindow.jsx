// src/components/ChatWindow.jsx
import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:3001";
const G = "#c6a15b";

export default function ChatWindow() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([{
    id: 0, type: "ai",
    html: `Hey — tell me your market view and I'll find the alpha. Try: <strong>"I think the Fed cuts rates before July"</strong>`,
  }]);
  const [input, setInput]     = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function push(html, type) {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), type, html }]);
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput(""); setSending(true);
    push(text, "user");
    const thinkId = Date.now();
    setMessages((prev) => [...prev, { id: thinkId, type: "thinking", html: "⬡ Analyzing…" }]);
    try {
      const mRes  = await fetch(`${API_BASE}/api/markets?keyword=${encodeURIComponent(text)}&limit=3`);
      const mData = await mRes.json();
      const mkts  = mData.markets || [];
      if (!mkts.length) {
        setMessages((prev) => prev.filter((m) => m.id !== thinkId));
        push("No matching Polymarket markets found. Try a different topic.", "ai");
        setSending(false); return;
      }
      const top   = mkts[0];
      const aRes  = await fetch(`${API_BASE}/api/analyze-bet`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: top.question, yesPct: top.yesPct, side: "yes", amount: 100 }),
      });
      const aData = await aRes.json();
      const list  = mkts.map((m) => `<strong>${m.question}</strong> — ${m.yesPct}% YES · ${m.volumeFmt}`).join("<br>");
      setMessages((prev) => prev.filter((m) => m.id !== thinkId));
      push(
        `<strong style="color:#c6a15b">Markets found:</strong><br>${list}<br><br>` +
        `<strong style="color:#c6a15b">K2 Analysis:</strong><br>${aData.analysis || "No analysis returned"}`,
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
    <div style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 1000 }}>
      {/* Chat panel */}
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 12px)", right: 0,
          width: 420, height: 560,
          background: "#0d0d0d",
          border: "1px solid rgba(198,161,91,.35)",
          borderRadius: 12,
          display: "flex", flexDirection: "column",
          boxShadow: "0 16px 48px rgba(0,0,0,.7)",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(198,161,91,.05)" }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem", letterSpacing: ".12em", textTransform: "uppercase", color: G }}>K2 Alpha Analyst</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".58rem", color: "#555", marginTop: 2 }}>Ask about any market or trade idea</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "1rem", padding: 0, lineHeight: 1 }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: ".75rem" }}>
            {messages.map((msg) => (
              <div key={msg.id}
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: ".68rem",
                  lineHeight: 1.7,
                  padding: "10px 14px",
                  borderRadius: 8,
                  maxWidth: "90%",
                  alignSelf: msg.type === "user" ? "flex-end" : "flex-start",
                  background: msg.type === "user"
                    ? "rgba(198,161,91,.12)"
                    : msg.type === "thinking"
                    ? "rgba(255,255,255,.03)"
                    : "rgba(255,255,255,.05)",
                  border: msg.type === "user"
                    ? "1px solid rgba(198,161,91,.25)"
                    : "1px solid rgba(255,255,255,.06)",
                  color: msg.type === "user" ? G : msg.type === "thinking" ? "#444" : "#aaa",
                }}
                dangerouslySetInnerHTML={{ __html: msg.html }}
              />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: ".75rem 1rem", borderTop: "1px solid rgba(255,255,255,.06)", display: "flex", gap: ".5rem" }}>
            <textarea
              ref={inputRef}
              rows={2}
              placeholder="Your market view…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              style={{
                flex: 1, resize: "none",
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 6, padding: "8px 10px",
                fontFamily: "'JetBrains Mono',monospace", fontSize: ".68rem", color: "#ccc",
                outline: "none",
              }}
            />
            <button onClick={send} disabled={sending} style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: ".65rem", letterSpacing: ".1em",
              padding: "0 16px", borderRadius: 6, cursor: "pointer",
              background: "rgba(198,161,91,.15)", border: "1px solid rgba(198,161,91,.35)", color: G,
              opacity: sending ? 0.5 : 1,
            }}>
              ASK
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 52, height: 52, borderRadius: "50%",
          background: open ? "rgba(198,161,91,.2)" : "rgba(198,161,91,.12)",
          border: "1px solid rgba(198,161,91,.4)",
          color: G, fontSize: "1.3rem", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,.4)",
          transition: "all .2s",
        }}
        title="Ask K2 Analyst"
      >
        ⬡
      </button>
    </div>
  );
}