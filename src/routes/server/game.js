import Router from './router.js'
import manifest from '../../../manifest.json' with { type: 'json' };
import config from '../../../config.json' with { type: 'json' };

const router = new Router();

router.get('/api/game/servers', async (req, res) => {
  res.json(router.app.hawkServers.map(s => s.getData()));
}).get('/api/game/manifest', async (req, res) => {
  res.json(manifest);
}).get('/api/game/turnstile', async (req, res) => {
  res.json({ key: config.turnstile.key });
});

export default router;
