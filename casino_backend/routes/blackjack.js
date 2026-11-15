// casino_backend/routes/blackjack.js
import { Router } from 'express';

const router = Router();

router.post("/result", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "NOT_LOGGED_IN" });
        }

        const userId = req.user.id;
        const { bet, outcome } = req.body;
        const numericBet = Number(bet);

        if (!Number.isInteger(numericBet) || numericBet < 1) {
            return res.status(400).json({ error: "INVALID_BET" });
        }

        // Get user coins
        const user = await req.db.get(
            "SELECT coins FROM users WHERE id = ?",
            [userId]
        );

        if (!user || user.coins < numericBet) {
            return res.status(400).json({ error: "INSUFFICIENT_COINS", coins: user?.coins ?? 0 });
        }

        let coins = user.coins;

        // Deduct bet at start of round
        coins -= numericBet;

        // Apply outcome payouts
        if (outcome === "blackjack") {
            coins += Math.floor(numericBet * 2.5);
        } else if (outcome === "win") {
            coins += numericBet * 2;
        } else if (outcome === "push") {
            coins += numericBet; // refund
        }

        // Update DB
        await req.db.run(
            "UPDATE users SET coins = ? WHERE id = ?",
            [coins, userId]
        );

        return res.json({ coins });

    } catch (err) {
        console.error("Blackjack backend error:", err);
        return res.status(500).json({ error: "SERVER_ERROR" });
    }
});

export default router;
