// src/components/MarketCharts.jsx
import { useState } from "react";
import {
  XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, Area, AreaChart, CartesianGrid,
  BarChart, Bar, Cell,
} from "recharts";
import AlphaSignalPanel from "./AlphaSignalPanel";

const G     = "#c6a15b";
const YES_C = "#34d399";
const NO_C  = "#f87171";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function generatePriceHistory(currentPct) {
  const data = [];
  let val = Math.min(95, Math.max(5, currentPct + (Math.random() * 30 - 15)));
  for (let i = 30; i >= 0; i--) {
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
  const safePct = Math.max(yesPct, 1);
  const payout  = betAmount / (safePct / 100);
  const profit  = payout - betAmount;
  return Array.from({ length: 101 }, (_, p) => ({
    prob: p,
    ev: parseFloat(((p / 100) * profit - (1 - p / 100) * betAmount).toFixed(2)),
  }));
}

function generateOrderbook(yesPct) {
  const midpoint = yesPct / 100;
  const bids = [], asks = [];
  let bidLiq = 0, askLiq = 0;
  for (let i = 0; i < 12; i++) {
    const bidPrice = parseFloat((midpoint - 0.01 * (i + 1) - Math.random() * 0.005).toFixed(3));
    const askPrice = parseFloat((midpoint + 0.01 * (i + 1) + Math.random() * 0.005).toFixed(3));
    bidLiq += Math.round(800 + Math.random() * 4000 * (1 / (i + 1)));
    askLiq += Math.round(800 + Math.random() * 4000 * (1 / (i + 1)));
    bids.push({ price: Math.max(0.01, bidPrice), liquidity: bidLiq, side: "bid" });
    asks.push({ price: Math.min(0.99, askPrice), liquidity: askLiq, side: "ask" });
  }
  return [...bids.reverse(), ...asks];
}

const PayoffTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div style={{ background: "#0d0d0d", border: `1px solid ${val >= 0 ? "rgba(52,211,153,.3)" : "rgba(248,113,113,.3)"}`, padding: "8px 12px", borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem" }}>
      <div style={{ color: "#666", marginBottom: 2 }}>If YES prob = {label}%</div>
      <div style={{ color: val >= 0 ? YES_C : NO_C, fontWeight: 600 }}>{val >= 0 ? "+" : ""}${val} EV</div>
    </div>
  );
};

const HistoryTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d0d0d", border: "1px solid rgba(198,161,91,.3)", padding: "8px 12px", borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem" }}>
      <div style={{ color: "#666", marginBottom: 2 }}>{label}</div>
      <div style={{ color: G, fontWeight: 600 }}>{payload[0].value}% YES</div>
    </div>
  );
};

const OrderbookTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#0d0d0d", border: `1px solid ${d.side === "bid" ? "rgba(52,211,153,.3)" : "rgba(248,113,113,.3)"}`, padding: "8px 12px", borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem" }}>
      <div style={{ color: "#666", marginBottom: 2 }}>{d.side === "bid" ? "BID" : "ASK"} @ {(d.price * 100).toFixed(1)}¢</div>
      <div style={{ color: d.side === "bid" ? YES_C : NO_C, fontWeight: 600 }}>${d.liquidity.toLocaleString()} cumulative</div>
    </div>
  );
};

function ChartCard({ title, sub, children, right }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.06)", borderRadius: 6, padding: "1.25rem 1.5rem", background: "rgba(255,255,255,.01)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase", color: G, marginBottom: ".2rem" }}>{title}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".58rem", color: "#555" }}>{sub}</div>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function StatRow({ items }) {
  return (
    <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", paddingBottom: ".75rem", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
      {items.map(([label, val, color]) => (
        <div key={label}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".56rem", letterSpacing: ".08em", textTransform: "uppercase", color: "#555", marginBottom: ".15rem" }}>{label}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".82rem", fontWeight: 600, color }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

export default function MarketCharts({ market }) {
  if (!market || market.yesPct === undefined) return null;

  const [betAmount, setBetAmount] = useState(100);

  const payoffData  = generatePayoffCurve(market.yesPct, betAmount);
  const historyData = generatePriceHistory(market.yesPct);
  const obData      = generateOrderbook(market.yesPct);
  const breakeven   = market.yesPct;
  const maxProfit   = market.yesPct > 0
    ? (betAmount / (market.yesPct / 100) - betAmount).toFixed(0)
    : "∞";

  return (
    <div style={{ marginTop: "1.5rem", border: "1px solid rgba(198,161,91,0.25)", borderRadius: 8, background: "rgba(10,10,10,0.95)", overflow: "hidden" }}>

      {/* Panel header */}
      <div style={{ padding: "1.25rem 1.75rem", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".75rem", color: G, marginBottom: ".3rem" }}>⬡ {market.question}</div>
          <div style={{ display: "flex", gap: ".6rem", fontFamily: "'JetBrains Mono',monospace", fontSize: ".65rem" }}>
            <span style={{ color: YES_C }}>{market.yesPct}% YES</span>
            <span style={{ color: "#444" }}>·</span>
            <span style={{ color: "#666" }}>{market.volumeFmt} vol</span>
            <span style={{ color: "#444" }}>·</span>
            <span style={{ color: "#666" }}>Closes {formatDate(market.endDate)}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem", color: "#555" }}>Stake</span>
          {[25, 100, 500].map((a) => (
            <button key={a} onClick={() => setBetAmount(a)} style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: ".62rem", padding: "3px 10px", borderRadius: 20, cursor: "pointer",
              border: `1px solid ${betAmount === a ? G : "rgba(198,161,91,.2)"}`,
              background: betAmount === a ? "rgba(198,161,91,.1)" : "transparent",
              color: betAmount === a ? G : "#555",
            }}>${a}</button>
          ))}
        </div>
      </div>

      {/* 3 charts in a row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", background: "rgba(255,255,255,.04)" }}>

        {/* Payoff Curve */}
        <div style={{ background: "rgba(10,10,10,.95)", padding: "1.25rem 1.5rem" }}>
          <ChartCard title="Payoff Curve" sub="Expected profit vs resolution probability">
            <StatRow items={[
              ["Breakeven", `${breakeven}%`, G],
              ["Max profit", `+$${maxProfit}`, YES_C],
              ["Max loss", `-$${betAmount}`, NO_C],
            ]} />
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={payoffData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={YES_C} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={YES_C} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="4 4" />
                <XAxis dataKey="prob" tickFormatter={(v) => `${v}%`} tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: "#444" }} axisLine={{ stroke: "rgba(255,255,255,.06)" }} tickLine={false} interval={24} />
                <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: "#444" }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<PayoffTooltip />} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,.12)" strokeDasharray="4 4" />
                <ReferenceLine x={breakeven} stroke={G} strokeDasharray="4 4" strokeWidth={1.2} />
                <Area type="monotone" dataKey="ev" stroke={YES_C} strokeWidth={1.5} fill="url(#profitGrad)" dot={false} activeDot={{ r: 3, fill: YES_C, stroke: "none" }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Price History */}
        <div style={{ background: "rgba(10,10,10,.95)", padding: "1.25rem 1.5rem", borderLeft: "1px solid rgba(255,255,255,.04)", borderRight: "1px solid rgba(255,255,255,.04)" }}>
          <ChartCard
            title="Price History"
            sub="YES probability over last 30 days"
            right={<div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem", padding: "3px 8px", border: "1px solid rgba(198,161,91,.2)", color: G, borderRadius: 20 }}>30D</div>}
          >
            <StatRow items={[
              ["Current",  `${market.yesPct}%`, G],
              ["30D high", `${Math.max(...historyData.map((d) => d.prob))}%`, YES_C],
              ["30D low",  `${Math.min(...historyData.map((d) => d.prob))}%`, NO_C],
            ]} />
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={historyData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={G} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={G} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="4 4" />
                <XAxis dataKey="date" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: "#444" }} axisLine={{ stroke: "rgba(255,255,255,.06)" }} tickLine={false} interval={9} />
                <YAxis domain={["auto", "auto"]} tickFormatter={(v) => `${v}%`} tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: "#444" }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<HistoryTooltip />} />
                <Area type="monotone" dataKey="prob" stroke={G} strokeWidth={1.5} fill="url(#histGrad)" dot={false} activeDot={{ r: 3, fill: G, stroke: "none" }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Orderbook Depth */}
        <div style={{ background: "rgba(10,10,10,.95)", padding: "1.25rem 1.5rem" }}>
          <ChartCard
            title="Orderbook Depth"
            sub="Cumulative bid/ask liquidity"
            right={
              <div style={{ display: "flex", gap: ".75rem" }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem", color: YES_C }}>▬ Bids</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem", color: NO_C }}>▬ Asks</span>
              </div>
            }
          >
            <StatRow items={[
              ["Mid price", `${market.yesPct}¢`, G],
              ["Bid depth", `$${obData.filter(d => d.side === "bid").slice(-1)[0]?.liquidity.toLocaleString()}`, YES_C],
              ["Ask depth", `$${obData.filter(d => d.side === "ask").slice(-1)[0]?.liquidity.toLocaleString()}`, NO_C],
            ]} />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={obData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,.04)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="price" tickFormatter={(v) => `${(v * 100).toFixed(0)}¢`} tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: "#444" }} axisLine={{ stroke: "rgba(255,255,255,.06)" }} tickLine={false} interval={4} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: "#444" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<OrderbookTooltip />} />
                <ReferenceLine x={market.yesPct / 100} stroke={G} strokeDasharray="4 4" strokeWidth={1.2} />
                <Bar dataKey="liquidity" radius={[2, 2, 0, 0]}>
                  {obData.map((entry, i) => (
                    <Cell key={i} fill={entry.side === "bid" ? "rgba(52,211,153,.5)" : "rgba(248,113,113,.5)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Alpha Signal Panel — sits below the 3 charts */}
      <AlphaSignalPanel market={market} />

    </div>
  );
}