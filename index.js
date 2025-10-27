import http from 'http';
import https from 'https';
import express from 'express';
import path from 'path';
import authRoutes from './src/routes/server/auth.js';
import friendsRoutes from './src/routes/server/friends.js';
import gameRoutes from './src/routes/server/game.js';
import messagesRoutes from './src/routes/server/messages.js';
import moderationRoutes from './src/routes/server/moderation.js';
import HawkServer from './src/server/Hawk.js';
import SocketServer from './src/server/Socket.js';
import MessageSocket from './src/server/MessageSocket.js';
import ModerationModel from './src/models/ModerationModel.js';
import config from './config.json' with { type: 'json' };
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { log } from './src/utils/Utils.js';
import { readFile } from 'fs/promises';
import { routes } from './src/routes/list.js';
import { SERVERS } from './src/utils/Constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = config.https.enabled ? https.createServer({ cert: config.https.cert, key: config.https.key }, app) : http.createServer(app);
const socketServer = new SocketServer({ server });
const messageSocket = new MessageSocket(socketServer);
app.hawkServers = [];

SERVERS.forEach(s => {
  const srv = new HawkServer(socketServer, s);
  app.hawkServers.push(srv);
});

app.disable('x-powered-by');

app.use(express.static(join(__dirname, 'public')));
app.use(express.static(join(__dirname, 'assets')));
app.use(express.static(join(__dirname, 'dist')));

authRoutes.setApp(app);
friendsRoutes.setApp(app);
gameRoutes.setApp(app);
messagesRoutes.setApp(app);
moderationRoutes.setApp(app);

app.get(/.*/, async (req, res) => {
  try {
    const htmlPath = path.join(__dirname, 'index.html');
    const htmlContentRaw = await readFile(htmlPath, 'utf8');

    const route = routes[req.path] || routes["404"];
    const description = route?.description ? route.description : "Sign up and join our community!";
    const title = route?.title ? ('Hawk - ' + route.title) : 'Hawk';
    const ogImage = '/banner.png';

    const htmlContent = htmlContentRaw
      .replaceAll('route_description', description)
      .replaceAll('route_title', title)
      .replaceAll('route_ogimage', ogImage);

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (error) {
    console.error("Error processing files:", error);
    res.status(500).send("Internal server error");
  }
});

server.listen(config.port, async () => {
  log(config.https.enabled ? "https" : "http", (config.https.enabled ? "HTTPs" : "HTTP") + " server listening on port " + config.port);
  await ModerationModel.loadData();
});