// casino_backend/routes/keno.js
import { Router } from "express";

const router = Router();

// Same payout table used on the frontend
const PAYOUT_TABLE = {
    0: 0,
    1: 0,
    2: 1,   // break even
    3: 3,
    4: 15,
    5: 50,
};

router.post("/result", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "NOT_LOGGED_IN" });
        }

        const userId = req.user.id;
        const { bet, hits } = req.body;
        const numericBet = Number(bet);
        const numericHits = Number(hits);

        if (!Number.isInteger(numericBet) || numericBet < 1) {
            return res.status(400).json({ error: "INVALID_BET" });
        }

        if (!Number.isInteger(numericHits) || numericHits < 0 || numericHits > 5) {
            return res.status(400).json({ error: "INVALID_HIT_COUNT" });
        }

        // Get user from DB
        const user = await req.db.get(
            "SELECT coins FROM users WHERE id = ?",
            [userId]
        );

        if (!user || user.coins < numericBet) {
            return res.status(400).json({ error: "INSUFFICIENT_COINS", coins: user?.coins ?? 0 });
        }

        let coins = user.coins;

        // Deduct bet at start (same as Blackjack)
        coins -= numericBet;

        // Determine winnings
        const multiplier = PAYOUT_TABLE[numericHits] ?? 0;
        const winnings = numericBet * multiplier;

        // Add winnings back
        coins += winnings;

        // Save updated coins
        await req.db.run(
            "UPDATE users SET coins = ? WHERE id = ?",
            [coins, userId]
        );

        return res.json({ coins, winnings, hits: numericHits });

    } catch (err) {
        console.error("Keno backend error:", err);
        return res.status(500).json({ error: "SERVER_ERROR" });
    }
});

export default router;
