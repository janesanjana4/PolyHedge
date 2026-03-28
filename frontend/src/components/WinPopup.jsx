/**
 * Floating popup shown after a bet is settled.
 * @param {{ msg: string, sub: string, win: boolean } | null} data
 */
export default function WinPopup({ data }) {
  if (!data) return null;

  return (
    <div className="win-popup">
      <div
        style={{
          fontFamily: "'Cormorant Garant',serif",
          fontSize: "1.15rem",
          fontStyle: "italic",
          color: "var(--cream)",
          marginBottom: 6,
        }}
      >
        {data.msg}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: ".75rem",
          color: data.win ? "var(--yes,#34d399)" : "var(--no,#f87171)",
        }}
      >
        {data.sub}
      </div>
    </div>
  );
}
