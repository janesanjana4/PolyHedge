import { Link } from "react-router-dom";

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

export default function Navbar({ isAuthed, balance }) {
  const links = ["Markets", "Leaderboard", "How It Works", "Categories"];
  const dashTo = isAuthed ? "/dashboard" : "/signup";

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
      <div className="nav-actions">
        <div
          className={`nav-bal mono${!isAuthed ? " nav-bal--guest" : ""}`}
        >
          {isAuthed ? `Balance: $${balance.toFixed(2)}` : "Balance: TBD"}
        </div>
        <Link
          to={dashTo}
          className="nav-profile"
          aria-label={isAuthed ? "Open dashboard" : "Sign up to get started"}
          title={isAuthed ? "Dashboard" : "Create account"}
        >
          <ProfileIcon />
        </Link>
        <Link to={dashTo} className="nav-cta">
          Dashboard
        </Link>
      </div>
    </nav>
  );
}
