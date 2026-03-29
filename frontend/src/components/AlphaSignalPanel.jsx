// src/components/AlphaSignalPanel.jsx

const G     = "#c6a15b";
const YES_C = "#34d399";
const NO_C  = "#f87171";
const WARN  = "#fbbf24";

function computeSignals(market) {
  const { yesPct, volume = 0, liquidity = 0 } = market;

  // ── Signal 1: Distance from fair value (50%) ──
  const distFromFair = Math.abs(yesPct - 50);
  const fairScore    = Math.min(100, Math.round(distFromFair * 2));
  const fairLabel    = distFromFair > 40 ? "Extreme conviction" : distFromFair > 25 ? "Strong lean" : distFromFair > 10 ? "Moderate lean" : "Near fair value";
  const fairColor    = distFromFair > 40 ? NO_C : distFromFair > 25 ? WARN : distFromFair > 10 ? G : YES_C;

  // ── Signal 2: Volume vs liquidity mismatch ──
  const volLiqRatio  = liquidity > 0 ? volume / liquidity : 0;
  const vlScore      = Math.min(100, Math.round(Math.min(volLiqRatio * 10, 100)));
  const vlLabel      = volLiqRatio > 8 ? "High pressure" : volLiqRatio > 4 ? "Elevated activity" : volLiqRatio > 1 ? "Normal flow" : "Low activity";
  const vlColor      = volLiqRatio > 8 ? NO_C : volLiqRatio > 4 ? WARN : volLiqRatio > 1 ? G : "#555";

  // ── Signal 3: Probability extremity ──
  const extremity    = yesPct <= 5 || yesPct >= 95;
  const nearExtreme  = yesPct <= 10 || yesPct >= 90;
  const extScore     = extremity ? 95 : nearExtreme ? 70 : Math.round(distFromFair * 1.5);
  const extLabel     = extremity ? "Near resolved" : nearExtreme ? "High conviction" : distFromFair > 20 ? "Directional" : "Contested";
  const extColor     = extremity ? "#555" : nearExtreme ? WARN : YES_C;

  // ── Signal 4: Liquidity depth ──
  const liqScore     = liquidity < 5000 ? 80 : liquidity < 20000 ? 55 : liquidity < 100000 ? 30 : 10;
  const liqLabel     = liquidity < 5000 ? "Thin — wide spreads" : liquidity < 20000 ? "Light liquidity" : liquidity < 100000 ? "Moderate depth" : "Deep market";
  const liqColor     = liquidity < 5000 ? WARN : liquidity < 20000 ? G : YES_C;

  // ── Composite alpha score (0–100) ──
  const alphaScore = Math.round(
    fairScore * 0.35 +
    vlScore   * 0.25 +
    extScore  * 0.25 +
    liqScore  * 0.15
  );

  const alphaLabel =
    alphaScore >= 70 ? "Strong Alpha" :
    alphaScore >= 45 ? "Moderate Alpha" :
    alphaScore >= 25 ? "Weak Signal" :
    "No Edge";

  const alphaColor =
    alphaScore >= 70 ? YES_C :
    alphaScore >= 45 ? WARN :
    alphaScore >= 25 ? G :
    "#555";

  return {
    alphaScore, alphaLabel, alphaColor,
    signals: [
      {
        key:   "fair",
        label: "Fair Value Distance",
        desc:  "How far the probability sits from 50% — extreme readings often signal mispricing.",
        score: fairScore,
        value: `${distFromFair.toFixed(0)}pts from 50%`,
        badge: fairLabel,
        color: fairColor,
      },
      {
        key:   "vl",
        label: "Volume / Liquidity Pressure",
        desc:  "High trading volume relative to available liquidity signals unusual market activity.",
        score: vlScore,
        value: volLiqRatio > 0 ? `${volLiqRatio.toFixed(1)}× ratio` : "No data",
        badge: vlLabel,
        color: vlColor,
      },
      {
        key:   "ext",
        label: "Probability Extremity",
        desc:  "Markets near 0% or 100% are near resolution — less opportunity but more certainty.",
        score: extScore,
        value: `${yesPct}% YES`,
        badge: extLabel,
        color: extColor,
      },
      {
        key:   "liq",
        label: "Liquidity Depth",
        desc:  "Thin markets have wider spreads and more edge potential, but carry higher risk.",
        score: liqScore,
        value: `$${(liquidity / 1000).toFixed(0)}K depth`,
        badge: liqLabel,
        color: liqColor,
      },
    ],
  };
}

function ScoreBar({ score, color }) {
  return (
    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,.06)", overflow: "hidden", marginTop: ".4rem" }}>
      <div style={{
        height: "100%",
        width: `${score}%`,
        background: color,
        borderRadius: 2,
        opacity: 0.8,
      }} />
    </div>
  );
}

export default function AlphaSignalPanel({ market }) {
  if (!market || market.yesPct === undefined) return null;

  const { alphaScore, alphaLabel, alphaColor, signals } = computeSignals(market);

  const radius = 42;
  const circ   = Math.PI * radius;
  const offset = circ - (circ * alphaScore) / 100;

  return (
    <div style={{
      border: "1px solid rgba(198,161,91,.2)",
      borderRadius: 8,
      background: "rgba(10,10,10,.95)",
      overflow: "hidden",
      marginTop: "1px",
    }}>
      {/* Header */}
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".65rem", letterSpacing: ".15em", textTransform: "uppercase", color: G }}>
          ⬡ Alpha Signal
        </span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem", color: "#555" }}>
          — inconsistency score + edge breakdown
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "190px 1fr" }}>

        {/* Score gauge */}
        <div style={{ padding: "1.5rem 1.25rem", borderRight: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
          <svg width="110" height="64" viewBox="0 0 110 60">
            <path d="M 10 54 A 45 45 0 0 1 100 54" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="8" strokeLinecap="round" />
            <path d="M 10 54 A 45 45 0 0 1 100 54" fill="none" stroke={alphaColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset .8s cubic-bezier(.4,0,.2,1), stroke .4s" }} />
            <text x="55" y="50" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="20" fontWeight="700" fill={alphaColor}>
              {alphaScore}
            </text>
          </svg>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".75rem", fontWeight: 600, color: alphaColor, marginBottom: ".25rem" }}>
              {alphaLabel}
            </div>
            <div style={{ position: "relative", display: "inline-block" }}
                onMouseEnter={(e) => e.currentTarget.querySelector(".alpha-tip").style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.querySelector(".alpha-tip").style.opacity = 0}
                >
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".58rem", color: "#555", letterSpacing: ".08em", textTransform: "uppercase", cursor: "help", borderBottom: "1px dashed #444" }}>
                    Alpha Score / 100 ⓘ
                </div>
                <div className="alpha-tip" style={{
                    opacity: 0, transition: "opacity .2s",
                    position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
                    background: "#111", border: "1px solid rgba(198,161,91,.3)",
                    padding: "10px 14px", borderRadius: 6, width: 220, zIndex: 100,
                    fontFamily: "'JetBrains Mono',monospace", fontSize: ".62rem", color: "#aaa", lineHeight: 1.6,
                    pointerEvents: "none",
                }}>
                    <div style={{ color: "#c6a15b", marginBottom: 4, fontWeight: 600 }}>What is Alpha Score?</div>
                    A 0–100 score measuring how much edge or inconsistency exists in this market. Higher = more potential mispricing. Based on fair value distance, volume pressure, probability extremity, and liquidity depth.
                </div>
                </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: ".3rem", width: "100%", marginTop: ".25rem" }}>
            {[["70+", "Strong", YES_C], ["45–69", "Moderate", WARN], ["25–44", "Weak", G], ["0–24", "No Edge", "#555"]].map(([range, label, color]) => (
              <div key={range} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".57rem", color: "#555" }}>{range}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".57rem", color: "#444", marginLeft: "auto" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signal breakdown */}
        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {signals.map((s) => (
            <div key={s.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ".2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".65rem", color: "#ccc", fontWeight: 500 }}>
                    {s.label}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: ".58rem", color: s.color,
                    padding: "1px 7px", borderRadius: 20,
                    border: `1px solid ${s.color}40`,
                    background: `${s.color}12`,
                  }}>
                    {s.badge}
                  </span>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".65rem", color: s.color, fontWeight: 600, flexShrink: 0, marginLeft: 12 }}>
                  {s.value}
                </span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".58rem", color: "#444", lineHeight: 1.5, marginBottom: ".3rem" }}>
                {s.desc}
              </div>
              <ScoreBar score={s.score} color={s.color} />
            </div>
          ))}

          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".56rem", color: "#333", marginTop: ".25rem", letterSpacing: ".04em" }}>
            Score weights: fair value 35% · vol/liq pressure 25% · extremity 25% · liquidity 15% · Not financial advice.
          </div>
        </div>

      </div>
    </div>
  );
}