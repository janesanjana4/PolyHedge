export default function Navbar({ balance }) {
  const links = ["Markets", "Leaderboard", "How It Works", "Categories"];
  return (
    <nav className="nav">
      <div className="nav-logo">
        <div className="nav-dot" />
        &nbsp;PolyHedge
      </div>
      <ul className="nav-links">
        {links.map((l) => (
          <li key={l}>
            <a href={`#${l.toLowerCase().replace(/ /g, "-")}`}>{l}</a>
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div className="nav-bal mono">Balance: ${balance.toFixed(2)}</div>
        <button className="nav-cta">Place Your Bet</button>
      </div>
    </nav>
  );
}
