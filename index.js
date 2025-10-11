import http from 'http';
import express from 'express';
import path from 'path';
import authRoutes from './src/routes/server/auth.js';
import friendsRoutes from './src/routes/server/friends.js';
import gameRoutes from './src/routes/server/game.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { log, generateOgUrl } from './src/utils/Utils.js';
import HawkServer from './src/server/Hawk.js';
import config from './config.json' with { type: 'json' };
import { readFile } from 'fs/promises';
import { routes } from './src/routes/list.js';
import { SERVERS } from './src/utils/Constants.js';
import SocketServer from './src/server/Socket.js';
import satori from 'satori';
import pkg from 'canvas-image';
import fs from 'fs';
import svg2png from 'svg2png';
const { loadImage } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const socketServer = new SocketServer({ server });
app.hawkServers = [];

SERVERS.forEach(s => {
  const svr = new HawkServer(socketServer, s);
  app.hawkServers.push(svr);
});

app.disable('x-powered-by');

app.use(express.static(join(__dirname, 'public')));
app.use(express.static(join(__dirname, 'dist')));

authRoutes.setApp(app);
friendsRoutes.setApp(app);
gameRoutes.setApp(app);

app.get('/og', async (req, res) => {
  try {
    const title = String(req.query.title || '').slice(0, 140);
    const desc = String(req.query.desc || '').slice(0, 300);

    const logoPath = path.join(__dirname, 'public', 'logo.png');
    if (!fs.existsSync(logoPath)) return res.status(500).send('Internal error.');
    const logoBuffer = await fs.promises.readFile(logoPath);
    const logoDataUrl = 'data:image/png;base64,' + logoBuffer.toString('base64');

    const fontPath = path.join(__dirname, 'fonts', 'Inter-Regular.ttf');
    if (!fs.existsSync(fontPath)) return res.status(500).send('Internal error.');
    const fontData = await fs.promises.readFile(fontPath);

    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            width: 1200,
            height: 630,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#121212',
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: 48,
            boxSizing: 'border-box',
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 16,
                  maxWidth: 1000,
                },
                children: [
                  { type: 'h1', props: { style: { margin: 0, fontSize: 64, lineHeight: 1.05, fontWeight: 700, color: '#fff', textAlign: 'left' }, children: title } },
                  { type: 'p',  props: { style: { margin: 0, fontSize: 28, lineHeight: 1.2, color: '#999', textAlign: 'left' }, children: desc } },
                ],
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  position: 'relative',
                  width: '100%',
                  height: 0,
                },
                children: [
                  {
                    type: 'img',
                    props: {
                      src: logoDataUrl,
                      style: {
                        position: 'absolute',
                        right: 48,
                        bottom: 48,
                        width: 160,
                        height: 160,
                        objectFit: 'contain',
                        borderRadius: 12,
                      },
                      alt: 'logo',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        width: 1200,
        height: 630,
        fonts: [{ name: 'Inter', data: fontData, weight: 400, style: 'normal' }],
        loadImage,
      }
    );

    const svgBuffer = Buffer.from(svg, 'utf8');

    const pngBuffer = await svg2png(svgBuffer, { width: 1200, height: 630 });

    res.set('Content-Type', 'image/png');
    res.send(pngBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal error.');
  }
});
app.get(/.*/, async (req, res) => {
  try {
    const htmlPath = path.join(__dirname, 'index.html');
    let htmlContent = await readFile(htmlPath, 'utf8');

    const route = routes[req.path] || routes["404"];
    htmlContent = htmlContent.replace('route_description', route?.description || "Sign up and join our community!");
    htmlContent = htmlContent.replace('route_title', route?.title ? ('Hawk - ' + route.title) : 'Hawk');
    htmlContent = htmlContent.replace('route_ogimage', route?.title ? generateOcUrl("?title=" + route.title + "&description=" + route.description) : generateOcUrl());
    
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);

  } catch (error) {
    console.error("Error processing files:", error);
    res.status(500).send("Internal server error");
  }
});

server.listen(config.port, () => {
  log("http", "HTTP server listening on port " + config.port);
});
