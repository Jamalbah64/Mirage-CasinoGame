// casino_backend/routes/profile.js
import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'NOT_LOGGED_IN' });
    }
    res.json(req.user);
  } catch (err) {
    console.error('PROFILE ERROR:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});


export default router;
