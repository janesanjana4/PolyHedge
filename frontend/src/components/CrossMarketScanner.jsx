// src/components/CrossMarketScanner.jsx
import { useState } from "react";

const G     = "#c6a15b";
const YES_C = "#34d399";

export default function CrossMarketScanner({ markets }) {
  const [open, setOpen] = useState(true);

  const signals = (markets || [])
    .filter((m) => m && m.yesPct !== undefined)  // guard against undefined markets
    .map((m) => {
      const distFromFair = Math.abs(m.yesPct - 50);
      const volScore     = m.volume || 0;
      const score = distFromFair > 35 && volScore > 10000
        ? "🔴 Extreme"
        : distFromFair > 20
        ? "🟡 Watch"
        : "🟢 Fair";
      const edge = distFromFair > 35 ? (distFromFair - 35).toFixed(1) + "% edge est." : null;
      return { ...m, score, edge, distFromFair };
    })
    .filter((m) => m.distFromFair > 15)
    .sort((a, b) => b.distFromFair - a.distFromFair)
    .slice(0, 5);

  if (!markets?.length) return null;

  return (
    <div style={{ margin: "0 0 2rem", border: "1px solid rgba(198,161,91,.2)", borderRadius: 8, overflow: "hidden", background: "rgba(10,10,10,.8)" }}>
      {/* Header */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{ padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderBottom: open ? "1px solid rgba(255,255,255,.06)" : "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".65rem", letterSpacing: ".15em", textTransform: "uppercase", color: G }}>
            ⬡ Cross-Market Scanner
          </span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem", padding: "2px 8px", borderRadius: 20, background: "rgba(198,161,91,.1)", color: G, border: "1px solid rgba(198,161,91,.2)" }}>
            {signals.length} signal{signals.length !== 1 ? "s" : ""}
          </span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".65rem", color: "#555" }}>
          {open ? "▲ collapse" : "▼ expand"}
        </span>
      </div>

      {open && (
        <>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 120px 100px", padding: ".6rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            {["Market", "YES %", "Volume", "Signal", "Edge Est."].map((h) => (
              <div key={h} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".58rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#444" }}>{h}</div>
            ))}
          </div>

          {signals.length === 0 ? (
            <div style={{ padding: "1.5rem", fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem", color: "#555", textAlign: "center" }}>
              No significant signals in current market set
            </div>
          ) : (
            signals.map((m, i) => (
              <div key={m.id || i} style={{
                display: "grid", gridTemplateColumns: "1fr 80px 80px 120px 100px",
                padding: ".85rem 1.5rem",
                borderBottom: "1px solid rgba(255,255,255,.03)",
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.01)",
              }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".68rem", color: "#ccc", paddingRight: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {m.question}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".72rem", fontWeight: 600, color: m.yesPct > 50 ? YES_C : "#f87171" }}>
                  {m.yesPct}%
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".68rem", color: "#888" }}>
                  {m.volumeFmt}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".68rem" }}>
                  {m.score}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".68rem", color: m.edge ? YES_C : "#555" }}>
                  {m.edge || "—"}
                </div>
              </div>
            ))
          )}

          <div style={{ padding: ".75rem 1.5rem", fontFamily: "'JetBrains Mono',monospace", fontSize: ".58rem", color: "#444", letterSpacing: ".05em" }}>
            Signals based on probability extremes + volume. Not financial advice.
          </div>
        </>
      )}
    </div>
  );
}