/// src/components/Header.jsx
import { Link } from "react-router-dom";
import "../styles/header.css";

export default function Header({ user, onLogout }) {
  return (
    <div className="header-bar">
      
      <div className="left-section">
        <Link to="/profile" className="header-link">👤 {user?.username || "Profile"}</Link>
      </div>

      <div className="center-section">
        <h2>🎰 Mirage Casino</h2>
      </div>

      <div className="right-section">
        <span className="coins">
          🪙 {user?.coins ?? 0} Coins
        </span>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>

    </div>
  );
}
