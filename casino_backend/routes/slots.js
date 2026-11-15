// backend/routes/slots.js
import { Router } from "express";

const router = Router();

// Keep your symbols & payouts the same so frontend messages still match
const symbols = ["🍒", "🍋", "🔔", "⭐", "7"];
const STARTING_COINS = 250;
const SPIN_COST = 1;

const JACKPOT_SYMBOL = "7";
const JACKPOT_PAYOUT = 150;  // triple 7s
const TRIPLE_PAYOUT = 25;   // any other triple

// ---- Odds tuning (must sum <= 1, remainder becomes "no match") ----
// Feels more like a slot machine than uniform RNG.
const ODDS = {
  jackpot: 0.004, // 0.4%  ~ 1 in 250
  triple: 0.03,   // 3%    ~ 1 in 33
  pair: 0.25,     // 25%   ~ 1 in 4
  // noMatch = 1 - (jackpot + triple + pair)
};

function randInt(max) {
  return Math.floor(Math.random() * max);
}

function pickFrom(arr) {
  return arr[randInt(arr.length)];
}

function pickDifferent(arr, notThis) {
  let x = pickFrom(arr);
  while (x === notThis) x = pickFrom(arr);
  return x;
}

function generateResultByTier() {
  const r = Math.random();

  const noJackpotSymbols = symbols.filter((s) => s !== JACKPOT_SYMBOL);

  // Jackpot: 7 7 7
  if (r < ODDS.jackpot) {
    return { result: [JACKPOT_SYMBOL, JACKPOT_SYMBOL, JACKPOT_SYMBOL], payout: JACKPOT_PAYOUT };
  }

  // Other triple (not 7)
  if (r < ODDS.jackpot + ODDS.triple) {
    const sym = pickFrom(noJackpotSymbols);
    return { result: [sym, sym, sym], payout: TRIPLE_PAYOUT };
  }

  // Pair (no payout, but feels like a near-miss)
  if (r < ODDS.jackpot + ODDS.triple + ODDS.pair) {
    const pairSym = pickFrom(symbols);
    const otherSym = pickDifferent(symbols, pairSym);

    // Randomize which reel is the odd one
    const oddIndex = randInt(3);
    const result = [pairSym, pairSym, pairSym];
    result[oddIndex] = otherSym;

    return { result, payout: 0 };
  }

  // No match (all different)
  // Ensure 3 different symbols (possible because symbols.length >= 3)
  const a = pickFrom(symbols);
  const b = pickDifferent(symbols, a);
  const c = pickDifferent(symbols, a);
  // make c different from b too
  let c2 = c;
  while (c2 === b) c2 = pickDifferent(symbols, a);
  return { result: [a, b, c2], payout: 0 };
}

router.post("/spin", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "NOT_LOGGED_IN" });
    }

    const userId = req.user.id;

    const user = await req.db.get("SELECT coins FROM users WHERE id = ?", [userId]);
    if (!user) return res.status(401).json({ error: "NOT_LOGGED_IN" });

    const currentCoins = user.coins ?? 0;

    // 2) No coins
    if (currentCoins < SPIN_COST) {
      return res.status(400).json({
        result: null,
        payout: 0,
        coins: currentCoins,
        error: "NO_COINS",
      });
    }

    // 3) Generate result + payout with tuned odds
    const { result, payout } = generateResultByTier();

    // 4) Apply spin cost and payout
    const newCoins = currentCoins - SPIN_COST + payout;

    await req.db.run("UPDATE users SET coins = ? WHERE id = ?", [newCoins, userId]);

    // 5) Record result
    await req.db.run(
      "INSERT INTO game_results (user_id, game, score) VALUES (?, ?, ?)",
      [userId, "slots", payout]
    );

    return res.json({ result, payout, coins: newCoins });
  } catch (err) {
    console.error("Error in /api/slots/spin:", err);
    return res.status(500).json({
      result: null,
      payout: 0,
      coins: null,
      error: "SERVER_ERROR",
    });
  }
});

export default router;
