import { Router } from 'express';
import passport from 'passport';

const router = Router();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';

// Kick off Google login
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google redirects back here
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${frontendUrl}/`,
    session: true
  }),
  (req, res) => {
    // On success, redirect to games page on frontend
    res.redirect(`${frontendUrl}/games`);
  }
);

// Logout
router.post('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });
});

export default router;
