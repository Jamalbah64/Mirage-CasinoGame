import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/rideTheBus.css";

export default function RideTheBus({ onCoinsChange }) {
  const navigate = useNavigate();

  // ===== Coins =====
  const [coins, setCoins] = useState(null);
  const [loadingCoins, setLoadingCoins] = useState(true);

  // ===== Betting / Run =====
  const MIN_BET = 1;
  const MAX_BET = 50;

  const [bet, setBet] = useState(5);
  const [runActive, setRunActive] = useState(false);
  const [awaitingDecision, setAwaitingDecision] = useState(false);

  // 0 = none cleared, 1..4 = rounds cleared
  const [completedRounds, setCompletedRounds] = useState(0);

  // round being played (1..4). When awaitingDecision=true, this stores the NEXT round number.
  const [round, setRound] = useState(0);

  // cards[0] after round1, cards[1] after round2, cards[2] after round3, cards[3] after round4
  const [cards, setCards] = useState([]);

  const [deck, setDeck] = useState([]);
  const [message, setMessage] = useState("");

  // multipliers for cashout/win (total return)
  const CASHOUT_MULTIPLIERS = useMemo(
    () => ({ 1: 2, 2: 4, 3: 8, 4: 16 }),
    []
  );

  // ===== Deck helpers =====
  const createDeck = () => {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const values = [
      { label: "Ace", num: 1 },
      { label: "2", num: 2 },
      { label: "3", num: 3 },
      { label: "4", num: 4 },
      { label: "5", num: 5 },
      { label: "6", num: 6 },
      { label: "7", num: 7 },
      { label: "8", num: 8 },
      { label: "9", num: 9 },
      { label: "10", num: 10 },
      { label: "Jack", num: 11 },
      { label: "Queen", num: 12 },
      { label: "King", num: 13 },
    ];

    const d = [];
    for (let s of suits) {
      for (let v of values) d.push({ suit: s, label: v.label, value: v.num });
    }
    return d.sort(() => Math.random() - 0.5);
  };


  const popCardFromDeck = () => {
    const newDeck = [...deck];
    const card = newDeck.pop();
    setDeck(newDeck);
    return card;
  };

  // ===== Load coins =====
  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setCoins(data.coins);
        setLoadingCoins(false);
      })
      .catch((err) => {
        console.error("RideTheBus: error loading profile:", err);
        setLoadingCoins(false);
      });
  }, []);

  // ===== Backend settlement =====
  const settleRun = async (outcome, roundsCompletedFinal) => {
    try {
      const res = await fetch("/api/ride-the-bus/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bet,
          outcome,
          roundsCompleted: roundsCompletedFinal,
        }),
      });

      // if route isn't mounted you get HTML, so guard it:
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Non-JSON response (check backend route mounting)");
      }

      const data = await res.json();

      if (typeof data.coins === "number") {
        setCoins(data.coins);
        onCoinsChange?.(data.coins);
      }

      if (outcome === "cashout") {
        setMessage(`💰 Cashed out! +${data.winnings ?? 0} coins.`);
      } else if (outcome === "win") {
        setMessage(`🏆 You cleared all 4 rounds! +${data.winnings ?? 0} coins!`);
      } else {
        setMessage("💥 You lost the run. Try again!");
      }
    } catch (err) {
      console.error("RideTheBus settle error:", err);
      setMessage("Server error saving result. (Is /api/ride-the-bus mounted?)");
    }
  };

  // ===== Reset =====
  const resetToBetting = (msg = "") => {
    setRunActive(false);
    setAwaitingDecision(false);
    setCompletedRounds(0);
    setRound(0);
    setCards([]);
    setDeck([]);
    setMessage(msg);
  };

  // ===== Start Run =====
  const startRun = () => {
    if (coins == null) return;

    const safeBet = Math.max(MIN_BET, Math.min(MAX_BET, Number(bet) || MIN_BET));
    if (safeBet > coins) {
      setMessage("❌ Not enough coins for that bet.");
      return;
    }

    setBet(safeBet);

    const d = createDeck();
    setDeck(d);
    setCards([]);

    setRunActive(true);
    setAwaitingDecision(false);
    setCompletedRounds(0);
    setRound(1);

    setMessage("🚌 Run started! Round 1: Red or Black?");
  };

  // ===== After round success: pause for Cashout/Next =====
  const markRoundCorrect = (newCompletedRounds, nextRoundNumber) => {
    setCompletedRounds(newCompletedRounds);
    setAwaitingDecision(true);
    setRound(nextRoundNumber);

    const mult = CASHOUT_MULTIPLIERS[newCompletedRounds];
    setMessage(
      `✅ Round ${newCompletedRounds} cleared! Cash out for ${mult}× (return ${bet * mult}) or continue?`
    );
  };

  const handleNextRound = () => {
    setAwaitingDecision(false);
    setMessage(`Round ${round}: Make your guess!`);
  };

  const handleCashOut = async () => {
    const rc = completedRounds;
    setRunActive(false);
    setAwaitingDecision(false);

    await settleRun("cashout", rc);
    resetToBetting("💰 Cashout complete. Place a new bet to play again.");
  };

  // ===== Card rendering helpers =====
  const isRedSuit = (s) => s === "hearts" || s === "diamonds";
  const suitSymbol = (s) => {
    if (s === "hearts") return "♥";
    if (s === "diamonds") return "♦";
    if (s === "clubs") return "♣";
    return "♠";
  };

  // ===== Round 1 =====
  const handleRedBlack = async (guess) => {
    if (!runActive || awaitingDecision || round !== 1) return;

    const card = popCardFromDeck();
    if (!card) return;

    setCards([card]);

    const actual = isRedSuit(card.suit) ? "red" : "black";
    if (actual !== guess) {
      await settleRun("loss", 0);
      resetToBetting(`❌ Wrong! ${card.label}${suitSymbol(card.suit)} was ${actual}.`);
      return;
    }

    markRoundCorrect(1, 2);
  };

  // ===== Round 2 =====
  const handleHigherLower = async (guess) => {
    if (!runActive || awaitingDecision || round !== 2) return;

    const first = cards[0];
    const next = popCardFromDeck();
    if (!first || !next) return;

    setCards([first, next]);

    const correct =
      (guess === "higher" && next.value > first.value) ||
      (guess === "lower" && next.value < first.value);

    if (!correct) {
      await settleRun("loss", 1);
      resetToBetting(`❌ Wrong! Drew ${next.label}${suitSymbol(next.suit)}.`);
      return;
    }

    markRoundCorrect(2, 3);
  };

  // ===== Round 3 =====
  const handleInsideOutside = async (guess) => {
    if (!runActive || awaitingDecision || round !== 3) return;

    const [c1, c2] = cards;
    const next = popCardFromDeck();
    if (!c1 || !c2 || !next) return;

    setCards([c1, c2, next]);

    const min = Math.min(c1.value, c2.value);
    const max = Math.max(c1.value, c2.value);

    // Inside = strictly between (no ties)
    const inside = next.value > min && next.value < max;

    const correct = (inside && guess === "inside") || (!inside && guess === "outside");
    if (!correct) {
      await settleRun("loss", 2);
      resetToBetting(`❌ Wrong! Drew ${next.label}${suitSymbol(next.suit)}.`);
      return;
    }

    markRoundCorrect(3, 4);
  };

  // ===== Round 4 =====
  const handleSuit = async (guess) => {
    if (!runActive || awaitingDecision || round !== 4) return;

    const next = popCardFromDeck();
    if (!next) return;

    setCards((prev) => [...prev, next]);

    if (next.suit !== guess) {
      await settleRun("loss", 3);
      resetToBetting(`❌ Wrong! It was ${next.label}${suitSymbol(next.suit)}.`);
      return;
    }

    // WIN
    setRunActive(false);
    setAwaitingDecision(false);
    setCompletedRounds(4);

    await settleRun("win", 4);
    resetToBetting("🏆 Win! Place a new bet to play again.");
  };

  const cashoutValue =
    completedRounds > 0 ? bet * (CASHOUT_MULTIPLIERS[completedRounds] || 0) : 0;

  if (loadingCoins) {
    return (
      <div className="game-page rtb-page">
        <h2 className="rtb-title">🚌 Ride The Bus</h2>
        <div className="rtb-message-box">
          <p>Loading coins…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page rtb-page">
      <h2 className="rtb-title">🚌 Ride The Bus</h2>

      <div className="rtb-coins">💰 Coins: {coins ?? "…"}</div>

      <div className="rtb-message-box">
        <p>{message || "Place a bet to start."}</p>
        {runActive && <p className="rtb-round">Round {round}</p>}
        {awaitingDecision && completedRounds > 0 && (
          <p className="rtb-subtext">
            Cashout return: <strong>{cashoutValue}</strong> coins
          </p>
        )}
      </div>

      {/* Cards display (persists across rounds) */}
      {cards.length > 0 && (
        <div className="rtb-card-row">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`rtb-card ${isRedSuit(card.suit) ? "red-card" : "black-card"}`}
            >
              <div className="rtb-card-top">{card.label}</div>
              <div className="rtb-card-mid">{suitSymbol(card.suit)}</div>
              <div className="rtb-card-bot">{card.suit}</div>
            </div>
          ))}
        </div>
      )}

      {/* Betting box (only when not in a run) */}
      {!runActive && (
        <div className="betting-box">
          <h3>Place Bet (1–50)</h3>
          <input
            type="number"
            value={bet}
            min={MIN_BET}
            max={MAX_BET}
            onChange={(e) =>
              setBet(Math.max(MIN_BET, Math.min(MAX_BET, Number(e.target.value))))
            }
          />
          <button className="rtb-btn" onClick={startRun}>
            Start Run (Bet {bet})
          </button>
        </div>
      )}

      {/* Decision buttons after each successful round */}
      {runActive && awaitingDecision && (
        <div className="rtb-actions">
          <button className="rtb-btn cashout" onClick={handleCashOut}>
            💰 Cash Out
          </button>
          <button className="rtb-btn next" onClick={handleNextRound}>
            ➡️ Next Round
          </button>
        </div>
      )}

      {/* Round controls */}
      {runActive && !awaitingDecision && round === 1 && (
        <div className="rtb-actions">
          <button className="rtb-btn" onClick={() => handleRedBlack("red")}>
            Red
          </button>
          <button className="rtb-btn" onClick={() => handleRedBlack("black")}>
            Black
          </button>
        </div>
      )}

      {runActive && !awaitingDecision && round === 2 && (
        <div className="rtb-actions">
          <button className="rtb-btn" onClick={() => handleHigherLower("higher")}>
            Higher
          </button>
          <button className="rtb-btn" onClick={() => handleHigherLower("lower")}>
            Lower
          </button>
        </div>
      )}

      {runActive && !awaitingDecision && round === 3 && (
        <div className="rtb-actions">
          <button className="rtb-btn" onClick={() => handleInsideOutside("inside")}>
            Inside
          </button>
          <button className="rtb-btn" onClick={() => handleInsideOutside("outside")}>
            Outside
          </button>
        </div>
      )}

      {runActive && !awaitingDecision && round === 4 && (
        <div className="rtb-actions">
          <button className="rtb-btn hearts" onClick={() => handleSuit("hearts")}>
            Hearts
          </button>
          <button className="rtb-btn diamonds" onClick={() => handleSuit("diamonds")}>
            Diamonds
          </button>
          <button className="rtb-btn clubs" onClick={() => handleSuit("clubs")}>
            Clubs
          </button>
          <button className="rtb-btn spades" onClick={() => handleSuit("spades")}>
            Spades
          </button>
        </div>
      )}

      <button className="back-button" onClick={() => navigate("/games")}>
        ⬅ Back to Games
      </button>
    </div>
  );
}
