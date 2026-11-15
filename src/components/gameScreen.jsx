import { useNavigate } from "react-router-dom";
import "../styles/GameScreen.css";

export default function GameScreen() {
  const navigate = useNavigate();

  const games = [
    { name: "Slots", path: "/games/slots" },
    { name: "Blackjack", path: "/games/blackjack" },
    { name: "Ride The Bus", path: "/games/ride-the-bus" },
    { name: "Keno", path: "/games/keno" },
  ];

  return (
    <div className="game-screen">
      <h1>Select Your Game</h1>

      <div className="game-grid">
        {games.map((game) => (
          <div
            key={game.name}
            className="game-card"
            onClick={() => navigate(game.path)}
          >
            <h2>{game.name}</h2>
          </div>
        ))}
      </div>

      <button className="back-button" onClick={() => navigate("/")}>
        Back
      </button>
    </div>
  );
}
