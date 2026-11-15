import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/blackJack.css";

export default function BlackJack({onCoinsChange}) {
  const navigate = useNavigate();

  // Coins synced with backend
  const [coins, setCoins] = useState(null);
  const [loadingCoins, setLoadingCoins] = useState(true);

  const [bet, setBet] = useState(1);
  const MIN_BET = 1;
  const MAX_BET = 25;

  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");

  // Load initial coin balance
  useEffect(() => {
  fetch("/api/profile")
    .then((res) => res.json())
    .then((data) => {
      setCoins(data.coins);
      setLoadingCoins(false);
    })
    .catch((err) => {
      console.error("Error loading profile for Blackjack:", err);
      setLoadingCoins(false);
    });
}, []);

  const createDeck = () => {
    const suits = ["♠", "♥", "♦", "♣"];
    const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
    let newDeck = [];
    for (let suit of suits) {
      for (let val of values) {
        newDeck.push({ suit, value: val });
      }
    }
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const getCardValue = (card) => {
    if (["J", "Q", "K"].includes(card.value)) return 10;
    if (card.value === "A") return 11;
    return Number(card.value);
  };

  const getHandValue = (hand) => {
    let value = hand.reduce((sum, c) => sum + getCardValue(c), 0);
    let aces = hand.filter(c => c.value === "A").length;
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    return value;
  };

  // === Start Game ===
  const startGame = async () => {
    if (coins < bet) {
      setMessage("❌ Not enough coins.");
      return;
    }

    const newDeck = createDeck();
    const player = [newDeck.pop(), newDeck.pop()];
    const dealer = [newDeck.pop(), newDeck.pop()];

    setDeck(newDeck);
    setPlayerHand(player);
    setDealerHand(dealer);
    setMessage("");
    setGameOver(false);

    // If natural blackjack
    const playerValue = getHandValue(player);
    if (playerValue === 21) {
      const res = await fetch("/api/blackjack/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bet, outcome: "blackjack" })
    });

    const data = await res.json();
    setCoins(data.coins);
    if (onCoinsChange) onCoinsChange(data.coins);

    setMessage(`🃏 BLACKJACK! You win ${Math.floor(bet * 2.5)} coins!`);
    setGameOver(true);
    }
  };

  const hit = () => {
    if (gameOver) return;

    const newDeck = [...deck];
    const newCard = newDeck.pop();
    const newHand = [...playerHand, newCard];

    setDeck(newDeck);
    setPlayerHand(newHand);

    if (getHandValue(newHand) > 21) {
      finalizeRound("loss", "💥 You busted! Dealer wins.");
    }
  };

  const stand = () => {
    let newDeck = [...deck];
    let newDealer = [...dealerHand];

    while (getHandValue(newDealer) < 17) {
      newDealer.push(newDeck.pop());
    }

    const playerValue = getHandValue(playerHand);
    const dealerValue = getHandValue(newDealer);

    let outcome = "loss";
    let msg = "💀 Dealer wins!";

    if (dealerValue > 21 || playerValue > dealerValue) {
      outcome = "win";
      msg = `🎉 You win ${bet * 2} coins!`;
    } else if (playerValue === dealerValue) {
      outcome = "push";
      msg = `🤝 Push! Bet returned.`;
    }

    finalizeRound(outcome, msg, newDealer);
  };

  // Finalize and send result to backend
  const finalizeRound = async (outcome, msg, dealer = dealerHand) => {
    setDealerHand(dealer);
    setGameOver(true);
    setMessage(msg);

    const res = await fetch("/api/blackjack/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bet, outcome })
    });

    const data = await res.json();
    setCoins(data.coins);
    if (onCoinsChange) onCoinsChange(data.coins);
  };

  if (loadingCoins) return <h2>Loading coins...</h2>;

  return (
    <div className="game-page">
      <h2>🃏 Blackjack</h2>
      <h3>💰 Coins: {coins}</h3>

      {playerHand.length === 0 && (
        <div className="betting-box">
          <h3>Place Bet (1–25)</h3>
          <input
            type="number"
            value={bet}
            min={1}
            max={25}
            onChange={(e) => setBet(Math.max(1, Math.min(25, Number(e.target.value))))}
          />
          <button className="game-button" onClick={startGame}>
            Start Game (Bet {bet})
          </button>
        </div>
      )}

      {playerHand.length > 0 && (
  <>
    <div className="hands-row">
      <div className="hand dealer-hand">
        <h3>Dealer ({gameOver ? getHandValue(dealerHand) : "?"})</h3>
        <div className="cards">
          {dealerHand.map((card, i) => (
            <div key={i} className="card">
              {gameOver || i === 0 ? `${card.value}${card.suit}` : "🂠"}
            </div>
          ))}
        </div>
      </div>

      <div className="hand player-hand">
        <h3>You ({getHandValue(playerHand)})</h3>
        <div className="cards">
          {playerHand.map((card, i) => (
            <div key={i} className="card">
              {card.value}{card.suit}
            </div>
          ))}
        </div>
      </div>
    </div>

    {!gameOver && (
      <div className="buttons">
        <button className="game-button" onClick={hit}>Hit</button>
        <button className="game-button" onClick={stand}>Stand</button>
      </div>
    )}

    {gameOver && (
      <button
        className="game-button"
        onClick={() => {
          setPlayerHand([]);
          setDealerHand([]);
          setMessage("");
        }}>
        Play Again
      </button>
    )}

    {message && <h3 className="message">{message}</h3>}
  </>
)}

      <button className="back-button" onClick={() => navigate("/games")}>
        ⬅ Back to Games
      </button>
    </div>
  );
}
