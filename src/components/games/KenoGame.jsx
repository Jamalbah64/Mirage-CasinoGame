import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/gameScreen.css";
import "../../styles/kenoGame.css";

// Payout multipliers based on hits (for 5 picks)
const PAYOUT_TABLE = {
  0: 0,
  1: 0,
  2: 1,   // break even
  3: 3,
  4: 15,
  5: 50,
};

export default function KenoGame({ onCoinsChange }) {
  const navigate = useNavigate();

  // Coins synced with backend (like Blackjack)
  const [coins, setCoins] = useState(null);
  const [loadingCoins, setLoadingCoins] = useState(true);

  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [hits, setHits] = useState(0);
  const [message, setMessage] = useState("");
  const [gamePlayed, setGamePlayed] = useState(false);

  const [betAmount, setBetAmount] = useState(10);
  const [lastWin, setLastWin] = useState(0);

  const MAX_PICKS = 5;
  const TOTAL_NUMBERS = 40;
  const DRAW_COUNT = 10;

  const allNumbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);

  // Load initial coin balance (same pattern as Blackjack)
  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setCoins(data.coins);
        setLoadingCoins(false);
      })
      .catch((err) => {
        console.error("Error loading profile for Keno:", err);
        setLoadingCoins(false);
      });
  }, []);

  const handleNumberClick = (number) => {
    if (gamePlayed) return;

    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== number));
    } else {
      if (selectedNumbers.length >= MAX_PICKS) {
        setMessage(`You can only pick ${MAX_PICKS} numbers.`);
        return;
      }
      setSelectedNumbers([...selectedNumbers, number]);
      setMessage("");
    }
  };

  const generateDraw = () => {
    const pool = [...allNumbers];
    const result = [];

    while (result.length < DRAW_COUNT) {
      const idx = Math.floor(Math.random() * pool.length);
      result.push(pool[idx]);
      pool.splice(idx, 1);
    }

    return result;
  };

  const startGame = () => {
    if (selectedNumbers.length !== MAX_PICKS) {
      setMessage(`Please select exactly ${MAX_PICKS} numbers to play.`);
      return;
    }

    if (betAmount <= 0) {
      setMessage("Bet must be at least 1 coin.");
      return;
    }

    if (betAmount > coins) {
      setMessage("You don't have enough coins for that bet.");
      return;
    }

    const draw = generateDraw();
    setDrawnNumbers(draw);

    const hitCount = selectedNumbers.filter((n) => draw.includes(n)).length;
    setHits(hitCount);
    setGamePlayed(true);

    const multiplier = PAYOUT_TABLE[hitCount] ?? 0;
    const winnings = betAmount * multiplier;
    setLastWin(winnings);

    // Build message for the round
    if (multiplier === 0) {
      if (hitCount === 0) {
        setMessage(`No hits this time. You lost ${betAmount} coins. 😅 Try again!`);
      } else {
        setMessage(
          `You hit ${hitCount} number${hitCount > 1 ? "s" : ""}, but no payout. You lost ${betAmount} coins.`
        );
      }
    } else if (multiplier === 1) {
      setMessage(
        `You hit 2 numbers and broke even! You got your ${winnings} coins back.`
      );
    } else {
      setMessage(
        `🎉 You hit ${hitCount} numbers! You won ${winnings} coins (×${multiplier} your bet).`
      );
    }

    // Tell backend to update coins and send back new total
    fetch("/api/keno/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ bet: betAmount, hits: hitCount }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.coins === "number") {
          setCoins(data.coins);
          onCoinsChange?.(data.coins);
        } else {
          console.warn("Keno result missing coins in response:", data);
        }
      })
      .catch((err) => {
        console.error("Error updating Keno result:", err);
      });
  };

  const resetGame = () => {
    setSelectedNumbers([]);
    setDrawnNumbers([]);
    setHits(0);
    setMessage("");
    setGamePlayed(false);
    setLastWin(0);
  };

  const getCellClassName = (number) => {
    const isSelected = selectedNumbers.includes(number);
    const isDrawn = drawnNumbers.includes(number);
    const isHit = isSelected && isDrawn;

    let className = "keno-cell";
    if (isSelected) className += " selected";
    if (isDrawn) className += " drawn";
    if (isHit) className += " hit";
    return className;
  };

  const changeBet = (delta) => {
    if (gamePlayed) return;

    setBetAmount((prev) => {
      const maxAllowed = Math.max(1, coins ?? 1);
      let next = prev + delta;

      if (next < 1) next = 1;
      if (next > maxAllowed) next = maxAllowed;

      return next;
    });
  };

  if (loadingCoins || coins === null) {
    return (
      <div className="game-page">
        <h2>🎲 Keno</h2>
        <h3>Loading coins...</h3>
      </div>
    );
  }

  return (
    <div className="game-page">
      <h2>🎲 Keno</h2>

      <div className="keno-header">
        <div>
          <strong>Pick {MAX_PICKS} numbers</strong> from 1–{TOTAL_NUMBERS}.
        </div>
        <div>
          Selected: <strong>{selectedNumbers.length}</strong> / {MAX_PICKS}
        </div>
        {gamePlayed && (
          <div>
            Hits: <strong>{hits}</strong> / {MAX_PICKS}
          </div>
        )}
      </div>

      {/* Main layout: grid left, betting panel right */}
      <div className="keno-main">
        {/* LEFT: Number grid + drawn numbers */}
        <div className="keno-grid-wrapper">
          <div className="keno-grid">
            {allNumbers.map((number) => (
              <button
                key={number}
                className={getCellClassName(number)}
                onClick={() => handleNumberClick(number)}
              >
                {number}
              </button>
            ))}
          </div>

          {drawnNumbers.length > 0 && (
            <div className="keno-drawn">
              <h3>Drawn Numbers:</h3>
              <div className="keno-drawn-list">
                {drawnNumbers.map((n) => (
                  <span
                    key={n}
                    className={
                      selectedNumbers.includes(n)
                        ? "drawn-number hit"
                        : "drawn-number"
                    }
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Betting panel */}
        <div className="keno-bet-panel">
          <h3 className="keno-bet-title">Betting</h3>

          <div className="keno-balance">
            Balance: <span className="keno-balance-value">{coins}</span> coins
          </div>

          <div className="keno-bet-controls">
            <span className="keno-bet-label">Bet per round:</span>
            <div className="keno-bet-buttons-row">
              <button
                className="keno-bet-btn"
                onClick={() => changeBet(-5)}
                disabled={gamePlayed || betAmount <= 1}
              >
                -5
              </button>
              <button
                className="keno-bet-btn"
                onClick={() => changeBet(-1)}
                disabled={gamePlayed || betAmount <= 1}
              >
                -1
              </button>

              <span className="keno-bet-amount">{betAmount}</span>

              <button
                className="keno-bet-btn"
                onClick={() => changeBet(1)}
                disabled={gamePlayed || betAmount >= coins}
              >
                +1
              </button>
              <button
                className="keno-bet-btn"
                onClick={() => changeBet(5)}
                disabled={gamePlayed || betAmount + 5 > coins}
              >
                +5
              </button>
            </div>
          </div>

          <div className="keno-actions">
            {!gamePlayed ? (
              <button
                className="game-button keno-action-button"
                onClick={startGame}
                disabled={
                  selectedNumbers.length !== MAX_PICKS ||
                  betAmount <= 0 ||
                  betAmount > coins
                }
              >
                🎯 Draw Numbers
              </button>
            ) : (
              <button
                className="game-button keno-action-button"
                onClick={resetGame}
              >
                🔁 Play Again
              </button>
            )}

            {gamePlayed && (
              <p className="keno-last-win">
                Last result:{" "}
                {lastWin > 0 ? `+${lastWin} coins` : `- ${betAmount} coins`}
              </p>
            )}
          </div>

          <button
            className="back-button keno-back-inline"
            onClick={() => navigate("/games")}
          >
            ⬅ Back to Games
          </button>
        </div>
      </div>

      {message && <p className="keno-message">{message}</p>}
    </div>
  );
}
