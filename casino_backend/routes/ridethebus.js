// casino_backend/routes/rideTheBus.js
import { Router } from "express";

const router = Router();

// Total return multipliers by rounds completed
// (Bet is deducted first, then winnings are added back)
const MULTIPLIERS = {
  0: 0,   // lost before completing any round
  1: 2,   // after round 1
  2: 4,   // after round 2
  3: 8,   // after round 3
  4: 20,  // after round 4 (win)
};

router.post("/result", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "NOT_LOGGED_IN" });
    }

    const userId = req.user.id;
    const { bet, outcome, roundsCompleted } = req.body;

    const numericBet = Number(bet);

    if (!numericBet || numericBet < 1) {
      return res.status(400).json({ error: "INVALID_BET" });
    }

    // ✅ Now supports cashout
    if (!["win", "loss", "cashout"].includes(outcome)) {
      return res.status(400).json({ error: "INVALID_OUTCOME" });
    }

    const rc = Number(roundsCompleted);
    if (!Number.isInteger(rc) || rc < 0 || rc > 4) {
      return res.status(400).json({ error: "INVALID_ROUNDS_COMPLETED" });
    }

    // Get user coins
    let user = await req.db.get("SELECT coins FROM users WHERE id = ?", [userId]);

    if (!user || user.coins < numericBet) {
      return res.status(400).json({ error: "INSUFFICIENT_COINS", coins: user?.coins ?? 0 });
    }

    let coins = Number(user.coins) || 0;

    // Deduct bet for this run
    // (Frontend starts a run, then calls /result once at the end: loss/cashout/win)
    coins -= numericBet;

    let winnings = 0;

    if (outcome === "loss") {
      // Lose: no winnings
      winnings = 0;
    } else if (outcome === "cashout") {
      // Cashout: pay based on rounds completed (must be >= 1 to make sense)
      const mult = MULTIPLIERS[rc] ?? 0;
      winnings = numericBet * mult;
    } else if (outcome === "win") {
      // Win should be roundsCompleted 4 (but we’ll allow multiplier lookup safely)
      const mult = MULTIPLIERS[rc] ?? MULTIPLIERS[4];
      winnings = numericBet * mult;
    }

    coins += winnings;

    // Update DB
    await req.db.run("UPDATE users SET coins = ? WHERE id = ?", [coins, userId]);

    // Record result (store winnings as score)
    await req.db.run(
      "INSERT INTO game_results (user_id, game, score) VALUES (?, ?, ?)",
      [userId, "ride_the_bus", winnings]
    );

    return res.json({ coins, winnings, outcome, roundsCompleted: rc });
  } catch (err) {
    console.error("RideTheBus backend error:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

export default router;
