// src/components/SimulateModal.jsx
import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, CartesianGrid,
} from "recharts";

const G     = "#c6a15b";
const YES_C = "#34d399";
const NO_C  = "#f87171";
const BLUE  = "#60a5fa";

function calcPayoff(positions) {
  return Array.from({ length: 101 }, (_, p) => {
    const prob = p / 100;
    let total = 0;
    positions.forEach((pos) => {
      if (!pos.active || !pos.stake || !pos.yesPct) return;
      const price  = Math.max(pos.yesPct, 1) / 100;
      const payout = pos.stake / price;
      const profit = payout - pos.stake;
      if (pos.side === "yes") {
        total += prob * profit - (1 - prob) * pos.stake;
      } else {
        const noPrice  = 1 - price;
        const noPayout = pos.stake / noPrice;
        const noProfit = noPayout - pos.stake;
        total += (1 - prob) * noProfit - prob * pos.stake;
      }
    });
    return { prob: p, ev: parseFloat(total.toFixed(2)) };
  });
}

const SimTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div style={{ background: "#0d0d0d", border: `1px solid ${val >= 0 ? "rgba(52,211,153,.3)" : "rgba(248,113,113,.3)"}`, padding: "8px 12px", borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: ".68rem" }}>
      <div style={{ color: "#666", marginBottom: 2 }}>Resolution = {label}%</div>
      <div style={{ color: val >= 0 ? YES_C : NO_C, fontWeight: 600 }}>{val >= 0 ? "+" : ""}${val}</div>
    </div>
  );
};

export default function SimulateModal({ positions, onClose }) {
  const [simPos, setSimPos] = useState(
    positions.map((p) => ({ ...p }))
  );

  function updateSim(index, field, value) {
    setSimPos((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  const data     = useMemo(() => calcPayoff(simPos), [simPos]);
  const evValues = data.map((d) => d.ev);
  const maxEV    = Math.max(...evValues);
  const minEV    = Math.min(...evValues);
  const breakevens = data
    .filter((d, i) => i > 0 && Math.sign(data[i - 1].ev) !== Math.sign(d.ev))
    .map((d) => d.prob);

  const scenarios = [
    { label: "Bull case", p1: Math.min(simPos[0].yesPct + 20, 95), p2: Math.max(simPos[1].yesPct - 10, 5) },
    { label: "Base case", p1: simPos[0].yesPct, p2: simPos[1].yesPct },
    { label: "Bear case", p1: Math.max(simPos[0].yesPct - 20, 5), p2: Math.min(simPos[1].yesPct + 10, 95) },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div style={{ width: "min(860px, 95vw)", background: "#0d0d0d", border: "1px solid rgba(198,161,91,.3)", borderRadius: 12, overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem", letterSpacing: ".15em", textTransform: "uppercase", color: G }}>⬡ Strategy Simulator</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem", color: "#555", marginTop: 3 }}>Adjust probabilities to model what-if scenarios</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
        </div>

        <div style={{ overflowY: "auto", padding: "1.5rem" }}>

          {/* Quick scenario buttons */}
          <div style={{ display: "flex", gap: ".6rem", marginBottom: "1.5rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem", color: "#555", alignSelf: "center", marginRight: 4 }}>Quick scenarios:</span>
            {scenarios.map((s) => (
              <button key={s.label} onClick={() => {
                updateSim(0, "yesPct", s.p1);
                updateSim(1, "yesPct", s.p2);
              }} style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: ".62rem", padding: "4px 12px",
                borderRadius: 20, cursor: "pointer",
                border: "1px solid rgba(198,161,91,.25)",
                background: "rgba(198,161,91,.06)", color: G,
              }}>
                {s.label}
              </button>
            ))}
            <button onClick={() => setSimPos(positions.map((p) => ({ ...p })))} style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: ".62rem", padding: "4px 12px",
              borderRadius: 20, cursor: "pointer", marginLeft: "auto",
              border: "1px solid rgba(255,255,255,.08)",
              background: "transparent", color: "#555",
            }}>
              Reset
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>

            {/* Left: sliders */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {simPos.map((pos, i) => (
                <div key={i} style={{ border: `1px solid ${i === 0 ? "rgba(52,211,153,.2)" : "rgba(96,165,250,.2)"}`, borderRadius: 8, padding: "1.25rem" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".65rem", letterSpacing: ".1em", textTransform: "uppercase", color: i === 0 ? YES_C : BLUE, marginBottom: "1rem" }}>
                    Position {i + 1}{i === 1 ? " · hedge" : ""}
                  </div>

                  {pos.question && (
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem", color: "#666", marginBottom: ".75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {pos.question}
                    </div>
                  )}

                  {/* YES % slider */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".58rem", color: "#555", textTransform: "uppercase", letterSpacing: ".06em" }}>YES Probability</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".72rem", fontWeight: 600, color: YES_C }}>{pos.yesPct}%</span>
                    </div>
                    <input type="range" min="1" max="99" value={pos.yesPct}
                      onChange={(e) => updateSim(i, "yesPct", parseInt(e.target.value))}
                      style={{ width: "100%", accentColor: i === 0 ? YES_C : BLUE }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".55rem", color: "#333" }}>1%</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".55rem", color: "#333" }}>99%</span>
                    </div>
                  </div>

                  {/* Stake slider */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".58rem", color: "#555", textTransform: "uppercase", letterSpacing: ".06em" }}>Stake</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".72rem", fontWeight: 600, color: G }}>${pos.stake}</span>
                    </div>
                    <input type="range" min="10" max="1000" step="10" value={pos.stake}
                      onChange={(e) => updateSim(i, "stake", parseInt(e.target.value))}
                      style={{ width: "100%", accentColor: G }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".55rem", color: "#333" }}>$10</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".55rem", color: "#333" }}>$1000</span>
                    </div>
                  </div>

                  {/* Position stats */}
                  <div style={{ marginTop: ".75rem", paddingTop: ".75rem", borderTop: "1px solid rgba(255,255,255,.04)", display: "flex", gap: "1rem" }}>
                    {[
                      ["Max win", `+$${(pos.stake / (Math.max(pos.yesPct, 1) / 100) - pos.stake).toFixed(0)}`, YES_C],
                      ["Max loss", `-$${pos.stake}`, NO_C],
                    ].map(([label, val, color]) => (
                      <div key={label}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".55rem", color: "#555", textTransform: "uppercase", marginBottom: ".15rem" }}>{label}</div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".75rem", fontWeight: 600, color }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: live chart + stats */}
            <div>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "rgba(255,255,255,.04)", borderRadius: 8, overflow: "hidden", marginBottom: "1.25rem" }}>
                {[
                  ["Best Case", `+$${maxEV.toFixed(2)}`, YES_C],
                  ["Worst Case", `$${minEV.toFixed(2)}`, NO_C],
                  ["Breakeven", breakevens.length ? breakevens.map(b => `${b}%`).join(", ") : "None", G],
                  ["Total Stake", `$${simPos.filter(p => p.active).reduce((s, p) => s + p.stake, 0)}`, BLUE],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ background: "rgba(10,10,10,.9)", padding: ".9rem 1rem" }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".55rem", color: "#555", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".2rem" }}>{label}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".82rem", fontWeight: 600, color }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div style={{ border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, padding: "1.25rem", background: "rgba(255,255,255,.01)" }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".65rem", letterSpacing: ".1em", textTransform: "uppercase", color: G, marginBottom: "1rem" }}>
                  Combined Payoff
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={G} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={G} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="4 4" />
                    <XAxis dataKey="prob" tickFormatter={(v) => `${v}%`}
                      tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: "#444" }}
                      axisLine={{ stroke: "rgba(255,255,255,.08)" }} tickLine={false} interval={19} />
                    <YAxis tickFormatter={(v) => `$${v}`}
                      tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: "#444" }}
                      axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<SimTooltip />} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,.15)" strokeDasharray="4 4" />
                    {breakevens.map((b) => (
                      <ReferenceLine key={b} x={b} stroke={G} strokeDasharray="4 4" strokeWidth={1.2}
                        label={{ value: `${b}%`, fill: G, fontSize: 9, fontFamily: "'JetBrains Mono',monospace" }} />
                    ))}
                    <Area type="monotone" dataKey="ev" stroke={G} strokeWidth={2}
                      fill="url(#simGrad)" dot={false} activeDot={{ r: 3, fill: G, stroke: "none" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ marginTop: ".6rem", fontFamily: "'JetBrains Mono',monospace", fontSize: ".55rem", color: "#333" }}>
                Drag sliders to simulate — chart updates live. Not financial advice.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}