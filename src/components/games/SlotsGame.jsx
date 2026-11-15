import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/slots.css";

const INITIAL_REELS = ["❔", "❔", "❔"];
const SYMBOLS = ["🍒","🍋","🍇","🔔","💎","7️⃣","⭐","🍀"];

export default function SlotsGame({ onCoinsChange }) {
  const navigate = useNavigate();

  const [reels, setReels] = useState(INITIAL_REELS);
  const [coins, setCoins] = useState(null);
  const [loadingCoins, setLoadingCoins] = useState(true);

  const [message, setMessage] = useState("Click SPIN to play!");
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastPayout, setLastPayout] = useState(0);
  const [error, setError] = useState(null);

  const intervalsRef = useRef([null, null, null]);

  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setCoins(data.coins);
        setLoadingCoins(false);
      })
      .catch((err) => {
        console.error("Slots: error loading profile:", err);
        setLoadingCoins(false);
      });

    return () => {
      // cleanup any timers if user leaves page mid-spin
      intervalsRef.current.forEach((id) => id && clearInterval(id));
    };
  }, []);

  const randSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  const startReelSpin = (reelIndex, speedMs) => {
    intervalsRef.current[reelIndex] = setInterval(() => {
      setReels((prev) => {
        const next = [...prev];
        next[reelIndex] = randSymbol();
        return next;
      });
    }, speedMs);
  };

  const stopReel = (reelIndex, finalSymbol) => {
    const id = intervalsRef.current[reelIndex];
    if (id) clearInterval(id);
    intervalsRef.current[reelIndex] = null;

    setReels((prev) => {
      const next = [...prev];
      next[reelIndex] = finalSymbol;
      return next;
    });
  };

  async function handleSpin() {
    if (isSpinning) return;

    setIsSpinning(true);
    setError(null);
    setLastPayout(0);
    setMessage("Spinning… 🎰");

    // Start spinning all reels fast
    startReelSpin(0, 70);
    startReelSpin(1, 70);
    startReelSpin(2, 70);

    try {
      // Get the TRUE result from backend immediately
      const res = await fetch("/api/slots/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      // If backend says NO_COINS or error, stop animation and show message
      if (!res.ok) {
        intervalsRef.current.forEach((id) => id && clearInterval(id));
        intervalsRef.current = [null, null, null];

        if (data.error === "NO_COINS") setMessage("You're out of coins. 😢");
        else setMessage("Something went wrong. Try again.");

        if (typeof data.coins === "number") {
          setCoins(data.coins);
          onCoinsChange?.(data.coins);
        }

        setIsSpinning(false);
        return;
      }

      // Update coins right away (so header updates instantly)
      if (typeof data.coins === "number") {
        setCoins(data.coins);
        onCoinsChange?.(data.coins);
      }

      // Slowdown vibe: slightly slow the intervals after a short burst
      setTimeout(() => {
        // restart intervals slower (optional)
        intervalsRef.current.forEach((id) => id && clearInterval(id));
        startReelSpin(0, 110);
        startReelSpin(1, 110);
        startReelSpin(2, 110);
      }, 500);

      // Staggered stopping like a real machine
      const [r0, r1, r2] = data.result;

      setTimeout(() => stopReel(0, r0), 1000);
      setTimeout(() => stopReel(1, r1), 1450);
      setTimeout(() => stopReel(2, r2), 1900);

      // After final reel stops, show final messaging/payout
      setTimeout(() => {
        setLastPayout(data.payout);

        if (data.payout === 50) setMessage("JACKPOT! Triple 7s! +50 coins 🎉");
        else if (data.payout === 20) setMessage("Nice! Triple match! +20 coins 🤑");
        else {
          const [a, b, c] = data.result;
          if (a === b || b === c || a === c) setMessage("You hit a pair – close one! 😅 (No payout)");
          else setMessage("No match this time. Try again!");
        }

        setIsSpinning(false);
      }, 2200);
    } catch (err) {
      console.error(err);
      intervalsRef.current.forEach((id) => id && clearInterval(id));
      intervalsRef.current = [null, null, null];
      setError("Server error. Is the backend running on port 3000?");
      setMessage("Unable to connect to server.");
      setIsSpinning(false);
    }
  }

  return (
    <div className="slots-game">
      <h1>Slots</h1>

      <p className="slots-coins">
        Coins: {loadingCoins || coins === null ? "…" : coins}
      </p>

      <div className={`slots-reels ${isSpinning ? "spinning" : ""}`}>
        {reels.map((symbol, i) => (
          <div key={i} className="slots-reel">
            {symbol}
          </div>
        ))}
      </div>

      <button className="slots-spin-btn" onClick={handleSpin} disabled={isSpinning}>
        {isSpinning ? "Spinning..." : "Spin (1 coin)"}
      </button>

      <p className="slots-message">{message}</p>

      {lastPayout > 0 && <p className="slots-payout">You won {lastPayout} coins!</p>}
      {error && <p className="slots-error">{error}</p>}

      <button className="back-button" onClick={() => navigate("/games")}>
        ⬅ Back to Games
      </button>
    </div>
  );
}
