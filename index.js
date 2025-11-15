import http from 'http';
import https from 'https';
import express from 'express';
import path from 'path';
import authRoutes from './src/routes/server/auth.js';
import friendsRoutes from './src/routes/server/friends.js';
import gameRoutes from './src/routes/server/game.js';
import messagesRoutes from './src/routes/server/messages.js';
import moderationRoutes from './src/routes/server/moderation.js';
import adminRoutes from './src/routes/server/admin.js';
import HawkServer from './src/server/Hawk.js';
import SocketServer from './src/server/Socket.js';
import MessageSocket from './src/server/MessageSocket.js';
import PresenceSocket from './src/server/PresenceSocket.js';
import ModerationModel from './src/models/ModerationModel.js';
import config from './config.json' with { type: 'json' };
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { log } from './src/utils/Utils.js';

import { SERVERS } from './src/utils/Constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = config.https.enabled ? https.createServer({ cert: config.https.cert, key: config.https.key }, app) : http.createServer(app);
const socketServer = new SocketServer({ server });
const messageSocket = new MessageSocket(socketServer);
const presenceSocket = new PresenceSocket(socketServer);
app.hawkServers = [];
app.presenceSocket = presenceSocket;

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
adminRoutes.setApp(app);

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

server.listen(config.port, async () => {
  log(config.https.enabled ? "https" : "http", (config.https.enabled ? "HTTPs" : "HTTP") + " server listening on port " + config.port);
  await ModerationModel.loadData();
});