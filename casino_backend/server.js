/* eslint-disable no-undef */
// casino_backend/server.js

import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { init as initDb } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

initDb()
  .then(async (db) => {
    // Attach db to every request
    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    // Passport serialize/deserialize
    passport.serializeUser((user, done) => {
      // store local DB user id in session
      done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await db.get(
          "SELECT id, google_id, username, email, coins FROM users WHERE id = ?",
          [id]
        );
        done(null, user);
      } catch (err) {
        done(err);
      }
    });

    // Google OAuth Strategy
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL:
            process.env.GOOGLE_CALLBACK_URL ||
            "http://localhost:3000/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Find user by google_id
            let user = await db.get(
              "SELECT * FROM users WHERE google_id = ?",
              [profile.id]
            );

            if (!user) {
              // Create if not exists
              const email = profile.emails?.[0]?.value ?? null;
              const username = profile.displayName ?? null;

              const result = await db.run(
                "INSERT INTO users (google_id, username, email, coins) VALUES (?, ?, ?, 250)",
                [profile.id, username, email]
              );

              user = {
                id: result.lastID,
                google_id: profile.id,
                username,
                email,
                coins: 250,
              };
            }

            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );

    // Mount routes
    app.use("/api/auth", (await import("./routes/authGoogle.js")).default);
    app.use("/api/profile", (await import("./routes/profile.js")).default);
    app.use("/api/slots", (await import("./routes/slots.js")).default);
    app.use("/api/blackjack", (await import("./routes/blackjack.js")).default);
    app.use("/api/keno", (await import("./routes/Keno.js")).default);
    app.use("/api/ride-the-bus", (await import("./routes/ridethebus.js")).default);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize DB:", err);
  });
