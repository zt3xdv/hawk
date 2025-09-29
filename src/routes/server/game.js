import Router from './router.js';

const router = new Router();

router.get('/api/game/assets', async (req, res) => {
  res.json({ error: "deprecated" });
});

export default router;
