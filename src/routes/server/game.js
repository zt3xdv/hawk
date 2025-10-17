import Router from './router.js'

const router = new Router();

router.get('/api/game/servers', async (req, res) => {
  res.json(router.app.hawkServers.map(s => s.getData()));
});

export default router;
