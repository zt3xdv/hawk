import Router from './router.js'

const router = new Router();

router.get('/api/game/servers', async (req, res) => {
  res.json(router.app.hawkServers.map(s => s.getData()));
}).get('/api/game/manifest', async (req, res) => {
  res.json({
    name: "Hawk",
    short_name: "Hawk",
    description: "Hangout game created using Hawk engine.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      },
      {
        src: "/logo.png",
        sizes: "1000x1000",
        type: "image/png"
      }
    ],
    permissions: [
      "notifications"
    ]
  });
});

export default router;
