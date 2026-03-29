import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SimulateModal from "../components/SimulateModal";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { getUser } from "../lib/userSession";
import { useNavigate } from "react-router-dom";

const G = "#c6a15b";
const YES_C = "#34d399";
const NO_C = "#f87171";
const BLUE = "#60a5fa";
const API = import.meta.env.VITE_API_URL || "";

// ── Payoff math ───────────────────────────────────────────────────────────────
function calcPayoff(positions) {
  return Array.from({ length: 101 }, (_, p) => {
    const prob = p / 100;
    let total = 0;
    positions.forEach((pos) => {
      if (!pos.active || !pos.stake || !pos.yesPct) return;
      const price = Math.max(pos.yesPct, 1) / 100;
      const payout = pos.stake / price;
      const profit = payout - pos.stake;
      if (pos.side === "yes") {
        total += prob * profit - (1 - prob) * pos.stake;
      } else {
        const noPrice = 1 - price;
        const noPayout = pos.stake / noPrice;
        const noProfit = noPayout - pos.stake;
        total += (1 - prob) * noProfit - prob * pos.stake;
      }
    });
    return { prob: p, combined: parseFloat(total.toFixed(2)) };
  });
}

function calcIndividual(pos, label) {
  return Array.from({ length: 101 }, (_, p) => {
    const prob = p / 100;
    const price = Math.max(pos.yesPct, 1) / 100;
    let ev = 0;
    if (pos.side === "yes") {
      const profit = pos.stake / price - pos.stake;
      ev = prob * profit - (1 - prob) * pos.stake;
    } else {
      const noPrice = 1 - price;
      const noProfit = pos.stake / noPrice - pos.stake;
      ev = (1 - prob) * noProfit - prob * pos.stake;
    }
    return { prob: p, [label]: parseFloat(ev.toFixed(2)) };
  });
}

function mergeData(combined, p1Data, p2Data) {
  return combined.map((d, i) => ({
    ...d,
    pos1: p1Data[i]?.pos1 ?? 0,
    pos2: p2Data[i]?.pos2 ?? 0,
  }));
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
const HedgeTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(198,161,91,.3)",
        padding: "10px 14px",
        borderRadius: 6,
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: ".68rem",
      }}
    >
      <div style={{ color: "#666", marginBottom: 6 }}>
        Resolution prob = {label}%
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {p.value >= 0 ? "+" : ""}${p.value}
        </div>
      ))}
    </div>
  );
};

// ── K2 Hedge Analysis ─────────────────────────────────────────────────────────
function K2HedgeAnalysis({ position, hedge }) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!position?.stake || !hedge?.id) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setAnalysis("");

      try {
        const res = await fetch(`${API}/api/hedge-analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            position: {
              entry: 2400,
              leverage: 10,
              size: position.stake,
              side: position.side,
              hedgeBudget:
                hedge.yesPct < 30
                  ? parseFloat((position.stake * 0.05).toFixed(2))
                  : parseFloat((position.stake * 0.08).toFixed(2)),
            },
            market: hedge,
          }),
        });
        const d = await res.json();
        if (!cancelled) {
          setAnalysis(d.analysis || "");
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setAnalysis("K2 analysis unavailable right now.");
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [hedge?.id, position?.stake, position?.side, hedge]);

  if (loading)
    return (
      <div
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: ".65rem",
          color: "#555",
          letterSpacing: ".04em",
        }}
      >
        ⬡ K2 is analyzing this hedge…
      </div>
    );

  if (!analysis) return null;

  const lines = analysis.split("\n").filter((l) => l.trim().length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".45rem" }}>
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: ".65rem",
            color: i === lines.length - 1 ? G : "#999",
            lineHeight: 1.75,
            fontWeight: i === lines.length - 1 ? 600 : 400,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

// ── Live Hedge Markets from Polymarket ────────────────────────────────────────
function LiveHedgeMarkets({ side, onApply, selectedId }) {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const r = await fetch(
          `${API}/api/hedge-markets?asset=ETH&direction=${side}`,
        );
        const d = await r.json();
        if (!cancelled) {
          setMarkets(Array.isArray(d) ? d : []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [side]);

  if (loading)
    return (
      <div
        style={{
          border: "1px solid rgba(198,161,91,.15)",
          borderRadius: 8,
          padding: "1rem 1.25rem",
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: ".62rem",
          color: "#555",
          letterSpacing: ".08em",
        }}
      >
        ⬡ Scanning Polymarket for hedge candidates…
      </div>
    );

  if (!markets.length) return null;

  return (
    <div
      style={{
        border: "1px solid rgba(198,161,91,.2)",
        borderRadius: 8,
        overflow: "hidden",
        background: "rgba(198,161,91,.02)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: ".7rem 1.25rem",
          borderBottom: "1px solid rgba(198,161,91,.1)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: ".58rem",
          letterSpacing: ".15em",
          textTransform: "uppercase",
          color: G,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: YES_C,
            display: "inline-block",
            animation: "pdot 1.5s ease-in-out infinite",
          }}
        />
        Live hedge candidates · Polymarket
      </div>

      {/* Market rows */}
      {markets.slice(0, 4).map((m, i) => {
        const isSelected = selectedId === m.id;
        return (
          <div
            key={m.id}
            onClick={() => onApply(m)}
            style={{
              padding: ".85rem 1.25rem",
              borderBottom:
                i < Math.min(markets.length, 4) - 1
                  ? "1px solid rgba(255,255,255,.04)"
                  : "none",
              cursor: "pointer",
              background: isSelected ? "rgba(198,161,91,.07)" : "transparent",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              transition: "background .15s",
            }}
            onMouseEnter={(e) => {
              if (!isSelected)
                e.currentTarget.style.background = "rgba(198,161,91,.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isSelected
                ? "rgba(198,161,91,.07)"
                : "transparent";
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: ".62rem",
                  color: isSelected ? "#ddd" : "#aaa",
                  marginBottom: 3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {m.question}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: ".57rem",
                  color: "#444",
                }}
              >
                {m.volumeFmt} vol
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: ".88rem",
                  fontWeight: 600,
                  color: YES_C,
                }}
              >
                {m.yesPct}%
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: ".55rem",
                  color: isSelected ? G : "#444",
                  marginTop: 2,
                }}
              >
                {isSelected ? "✓ applied" : "click to apply"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Position input ────────────────────────────────────────────────────────────
function PositionInput({ pos, index, onChange, onToggle }) {
  const color = index === 0 ? YES_C : BLUE;
  return (
    <div
      style={{
        border: `1px solid ${pos.active ? color + "40" : "rgba(255,255,255,.06)"}`,
        borderRadius: 8,
        padding: "1.25rem",
        background: pos.active ? `${color}06` : "transparent",
        transition: "all .2s",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: ".65rem",
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color,
          }}
        >
          Position {index + 1}
          {index === 1 && (
            <span style={{ color: "#555", fontWeight: 400, marginLeft: 8 }}>
              · hedge
            </span>
          )}
        </span>
        <button
          onClick={onToggle}
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: ".58rem",
            padding: "2px 10px",
            borderRadius: 20,
            border: `1px solid ${pos.active ? color + "60" : "rgba(255,255,255,.1)"}`,
            background: pos.active ? `${color}15` : "transparent",
            color: pos.active ? color : "#555",
            cursor: "pointer",
          }}
        >
          {pos.active ? "ON" : "OFF"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: ".75rem",
        }}
      >
        {/* Market question */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: ".58rem",
              color: "#555",
              letterSpacing: ".08em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: ".3rem",
            }}
          >
            Market
          </label>
          <input
            value={pos.question}
            onChange={(e) => onChange("question", e.target.value)}
            placeholder={
              index === 0
                ? "e.g. Will BTC exceed $100K?"
                : "Select from candidates below or type"
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 4,
              padding: "7px 10px",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: ".65rem",
              color: "#ccc",
              outline: "none",
            }}
          />
        </div>

        {/* YES % */}
        <div>
          <label
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: ".58rem",
              color: "#555",
              letterSpacing: ".08em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: ".3rem",
            }}
          >
            Current YES %
          </label>
          <input
            type="number"
            min="1"
            max="99"
            value={pos.yesPct}
            onChange={(e) =>
              onChange("yesPct", parseFloat(e.target.value) || 0)
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 4,
              padding: "7px 10px",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: ".65rem",
              color: YES_C,
              outline: "none",
            }}
          />
        </div>

        {/* Stake */}
        <div>
          <label
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: ".58rem",
              color: "#555",
              letterSpacing: ".08em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: ".3rem",
            }}
          >
            Stake ($)
          </label>
          <input
            type="number"
            min="1"
            value={pos.stake}
            onChange={(e) => onChange("stake", parseFloat(e.target.value) || 0)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 4,
              padding: "7px 10px",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: ".65rem",
              color: G,
              outline: "none",
            }}
          />
        </div>

        {/* Side */}
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: ".5rem" }}>
          {["yes", "no"].map((s) => (
            <button
              key={s}
              onClick={() => onChange("side", s)}
              style={{
                flex: 1,
                padding: "6px",
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: ".62rem",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                border: `1px solid ${pos.side === s ? (s === "yes" ? YES_C : NO_C) : "rgba(255,255,255,.08)"}`,
                background:
                  pos.side === s
                    ? s === "yes"
                      ? "rgba(52,211,153,.12)"
                      : "rgba(248,113,113,.12)"
                    : "transparent",
                color: pos.side === s ? (s === "yes" ? YES_C : NO_C) : "#555",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {s === "yes" ? "YES ▲" : "NO ▼"}
            </button>
          ))}
        </div>
      </div>

      {/* Position summary */}
      {pos.active && pos.stake > 0 && pos.yesPct > 0 && (
        <div
          style={{
            marginTop: ".75rem",
            paddingTop: ".75rem",
            borderTop: "1px solid rgba(255,255,255,.05)",
            display: "flex",
            gap: "1.5rem",
          }}
        >
          {[
            [
              "Payout if win",
              `$${(pos.stake / (Math.max(pos.yesPct, 1) / 100)).toFixed(2)}`,
              YES_C,
            ],
            ["Max loss", `-$${pos.stake}`, NO_C],
            ["Implied odds", `${pos.yesPct}%`, G],
          ].map(([label, val, col]) => (
            <div key={label}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: ".55rem",
                  color: "#555",
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                  marginBottom: ".15rem",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: ".75rem",
                  fontWeight: 600,
                  color: col,
                }}
              >
                {val}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ data, positions }) {
  const evValues = data.map((d) => d.combined);
  const maxEV = Math.max(...evValues);
  const minEV = Math.min(...evValues);
  const totalStake = positions
    .filter((p) => p.active)
    .reduce((s, p) => s + (p.stake || 0), 0);
  const breakevens = data
    .filter(
      (d, i) =>
        i > 0 && Math.sign(data[i - 1].combined) !== Math.sign(d.combined),
    )
    .map((d) => d.prob);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1px",
        background: "rgba(255,255,255,.04)",
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: "1.5rem",
      }}
    >
      {[
        ["Best Case", `+$${maxEV.toFixed(2)}`, YES_C],
        ["Worst Case", `$${minEV.toFixed(2)}`, NO_C],
        ["Total Stake", `$${totalStake.toFixed(2)}`, G],
        [
          "Breakeven(s)",
          breakevens.length
            ? breakevens.map((b) => `${b}%`).join(", ")
            : "None",
          BLUE,
        ],
      ].map(([label, val, color]) => (
        <div
          key={label}
          style={{ background: "rgba(10,10,10,.9)", padding: "1rem 1.25rem" }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: ".57rem",
              color: "#555",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              marginBottom: ".3rem",
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: ".9rem",
              fontWeight: 600,
              color,
            }}
          >
            {val}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HedgeCalculator() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState([
    { question: "", yesPct: 60, stake: 100, side: "yes", active: true },
    { question: "", yesPct: 40, stake: 100, side: "no", active: true },
  ]);
  const [selectedHedge, setSelectedHedge] = useState(null);
  const [showExecution, setShowExecution] = useState(false);
  const [showSimulate, setShowSimulate] = useState(false);

  function updatePos(index, field, value) {
    setPositions((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  }
  function togglePos(index) {
    setPositions((prev) =>
      prev.map((p, i) => (i === index ? { ...p, active: !p.active } : p)),
    );
  }

  // Apply a live Polymarket market as the hedge (Position 2)
  function applyHedge(market) {
    setSelectedHedge(market);
    updatePos(1, "question", market.question);
    updatePos(1, "yesPct", market.yesPct);
    updatePos(1, "side", "yes");
    updatePos(1, "active", true);
  }

  const activePosCount = positions.filter(
    (p) => p.active && p.stake > 0 && p.yesPct > 0,
  ).length;
  const combinedData = calcPayoff(positions.filter((p) => p.active));
  const p1Data = positions[0].active
    ? calcIndividual(positions[0], "pos1")
    : combinedData.map((d) => ({ prob: d.prob, pos1: 0 }));
  const p2Data = positions[1].active
    ? calcIndividual(positions[1], "pos2")
    : combinedData.map((d) => ({ prob: d.prob, pos2: 0 }));
  const chartData = mergeData(combinedData, p1Data, p2Data);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg, #0a0a0a)",
        padding: "0 0 4rem",
      }}
    >
      {/* Back */}
      <div style={{ padding: "1.25rem 2rem 0" }}>
        <Link
          to="/sector"
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
          onMouseEnter={(e) => (e.currentTarget.style.color = G)}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
        >
          ← Back to Markets
        </Link>
      </div>

      {/* Header */}
      <div style={{ padding: "2rem 2rem 0" }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: ".6rem",
            letterSpacing: ".2em",
            textTransform: "uppercase",
            color: G,
            marginBottom: ".5rem",
          }}
        >
          Advanced Tools · Polymarket Live Data
        </div>
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 400,
            color: "var(--cream, #f5f0e8)",
            margin: "0 0 .5rem",
            lineHeight: 1.1,
          }}
        >
          Hedge <em style={{ color: G }}>Calculator</em>
        </h1>
        <p
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: ".72rem",
            color: "#555",
            margin: 0,
          }}
        >
          Build a two-position hedge strategy. Select a live Polymarket contract
          as your hedge — see combined payoff instantly.
        </p>
      </div>

      <div
        style={{
          padding: "2rem",
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* ── Left: Inputs ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Position 1 — your main bet */}
          <PositionInput
            pos={positions[0]}
            index={0}
            onChange={(f, v) => updatePos(0, f, v)}
            onToggle={() => togglePos(0)}
          />

          {/* ── LIVE HEDGE CANDIDATES FROM POLYMARKET ── */}
          <LiveHedgeMarkets
            side={positions[0].side}
            onApply={applyHedge}
            selectedId={selectedHedge?.id}
          />

          {/* Position 2 — auto-populated from hedge selection, or manual */}
          <PositionInput
            pos={positions[1]}
            index={1}
            onChange={(f, v) => updatePos(1, f, v)}
            onToggle={() => togglePos(1)}
          />

          {/* ── K2 ANALYSIS — shows when hedge is selected ── */}
          {selectedHedge && (
            <div
              style={{
                border: "1px solid rgba(198,161,91,.2)",
                borderRadius: 8,
                padding: "1rem 1.25rem",
                background: "rgba(198,161,91,.04)",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: ".6rem",
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: G,
                  marginBottom: ".6rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                ⬡ K2 hedge analysis
              </div>
              <K2HedgeAnalysis position={positions[0]} hedge={selectedHedge} />
            </div>
          )}

          {/* Static hedge suggestion when no market selected yet */}
          {!selectedHedge && activePosCount === 2 && (
            <div
              style={{
                border: "1px solid rgba(198,161,91,.15)",
                borderRadius: 8,
                padding: "1rem 1.25rem",
                background: "rgba(198,161,91,.04)",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: ".62rem",
                  color: G,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  marginBottom: ".5rem",
                }}
              >
                ⬡ Hedge Suggestion
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: ".65rem",
                  color: "#888",
                  lineHeight: 1.7,
                }}
              >
                {(() => {
                  const p1 = positions[0],
                    p2 = positions[1];
                  const totalRisk = (p1.stake || 0) + (p2.stake || 0);
                  const ratio = p1.stake / Math.max(p2.stake, 1);
                  if (ratio > 2)
                    return `Position 1 is ${ratio.toFixed(1)}× larger. Consider increasing Position 2 stake to balance risk.`;
                  if (ratio < 0.5)
                    return `Position 2 is ${(1 / ratio).toFixed(1)}× larger. Consider increasing Position 1 stake to balance risk.`;
                  return `Positions are roughly balanced. Total risk exposure: $${totalRisk.toFixed(2)}. Review the payoff chart for breakeven points.`;
                })()}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Chart ── */}
        <div>
          {activePosCount > 0 ? (
            <>
              <StatsBar data={combinedData} positions={positions} />

              <div
                style={{
                  marginBottom: "1rem",
                  display: "flex",
                  gap: "1rem",
                }}
              >
                <button
                  onClick={() => {
                    const u = getUser();

                    if (!u) {
                      navigate("/signup");
                      return;
                    }

                    setShowExecution(true);
                  }}
                  style={{
                    flex: 1,
                    padding: ".9rem",
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: ".7rem",
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    background: "#c6a15b",
                    color: "#0a0a0a",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  ⬡ Execute Hedge
                </button>

                <button
                  onClick={() => {
                      const u = getUser();
                      if (!u) {
                        navigate("/signup");
                        return;
                      }
                      setShowSimulate(true);
                    }}
                  style={{
                    flex: 1,
                    padding: ".9rem",
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: ".7rem",
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    background: "rgba(198,161,91,.08)",
                    color: "#c6a15b",
                    border: "1px solid rgba(198,161,91,.3)",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Simulate Strategy
                </button>
              </div>

              <div
                style={{
                  border: "1px solid rgba(255,255,255,.06)",
                  borderRadius: 8,
                  padding: "1.5rem",
                  background: "rgba(10,10,10,.8)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: ".68rem",
                        letterSpacing: ".12em",
                        textTransform: "uppercase",
                        color: G,
                        marginBottom: ".2rem",
                      }}
                    >
                      Combined Payoff
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: ".58rem",
                        color: "#555",
                      }}
                    >
                      Expected profit/loss at each resolution probability
                    </div>
                  </div>
                  {selectedHedge && (
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: ".58rem",
                        color: YES_C,
                        background: "rgba(52,211,153,.08)",
                        border: "1px solid rgba(52,211,153,.2)",
                        padding: "3px 10px",
                        borderRadius: 20,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: YES_C,
                          display: "inline-block",
                        }}
                      />
                      Live hedge applied
                    </div>
                  )}
                </div>

                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="combGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={G} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={G} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="p1Grad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={YES_C}
                          stopOpacity={0.08}
                        />
                        <stop offset="95%" stopColor={YES_C} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="p2Grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BLUE} stopOpacity={0.08} />
                        <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="rgba(255,255,255,.04)"
                      strokeDasharray="4 4"
                    />
                    <XAxis
                      dataKey="prob"
                      tickFormatter={(v) => `${v}%`}
                      tick={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 10,
                        fill: "#444",
                      }}
                      axisLine={{ stroke: "rgba(255,255,255,.08)" }}
                      tickLine={false}
                      interval={9}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${v}`}
                      tick={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 10,
                        fill: "#444",
                      }}
                      axisLine={false}
                      tickLine={false}
                      width={58}
                    />
                    <Tooltip content={<HedgeTooltip />} />
                    <ReferenceLine
                      y={0}
                      stroke="rgba(255,255,255,.15)"
                      strokeDasharray="4 4"
                    />
                    <Legend
                      formatter={(value) => (
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: ".6rem",
                            color: "#666",
                          }}
                        >
                          {value}
                        </span>
                      )}
                      wrapperStyle={{ paddingTop: "1rem" }}
                    />
                    {positions[0].active && (
                      <Area
                        type="monotone"
                        dataKey="pos1"
                        name="Position 1"
                        stroke={YES_C}
                        strokeWidth={1.5}
                        fill="url(#p1Grad)"
                        dot={false}
                        strokeDasharray="4 3"
                      />
                    )}
                    {positions[1].active && (
                      <Area
                        type="monotone"
                        dataKey="pos2"
                        name={
                          selectedHedge ? "Hedge (Polymarket)" : "Position 2"
                        }
                        stroke={BLUE}
                        strokeWidth={1.5}
                        fill="url(#p2Grad)"
                        dot={false}
                        strokeDasharray="4 3"
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="combined"
                      name="Combined"
                      stroke={G}
                      strokeWidth={2.5}
                      fill="url(#combGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: G, stroke: "none" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div
                style={{
                  marginTop: ".75rem",
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: ".57rem",
                  color: "#333",
                  letterSpacing: ".04em",
                }}
              >
                Dashed lines = individual positions · Solid gold = combined
                payoff · Not financial advice.
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 300,
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: ".7rem",
                color: "#444",
              }}
            >
              Enable at least one position to see the payoff chart.
            </div>
          )}
        </div>
      </div>
      {showExecution && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          
          <div
            style={{
              width: 420,
              background: "#0d0d0d",
              border: "1px solid rgba(198,161,91,.3)",
              borderRadius: 10,
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: ".7rem",
                color: "#c6a15b",
                marginBottom: "1rem",
              }}
            >
              ⬡ Hedge Execution Preview
            </div>

            <div
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: ".65rem",
                color: "#aaa",
                lineHeight: 1.6,
                marginBottom: "1.25rem",
              }}
            >
              Strategy will place a hedge using selected Polymarket contract.
              <br />
              <br />
              This simulates execution — no real funds used.
            </div>

            <button
              onClick={() => setShowExecution(false)}
              style={{
                width: "100%",
                padding: ".8rem",
                background: "#c6a15b",
                color: "#0a0a0a",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Confirm Execution (Mock)
            </button>
          </div>
        </div>
      )}
      {/* ← ADD HERE */}
      {showSimulate && (
        <SimulateModal
          positions={positions}
          onClose={() => setShowSimulate(false)}
        />
      )}
    </div>
  );
}
