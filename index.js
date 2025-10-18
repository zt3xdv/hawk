import http from 'http';
import express from 'express';
import path from 'path';
import authRoutes from './src/routes/server/auth.js';
import friendsRoutes from './src/routes/server/friends.js';
import gameRoutes from './src/routes/server/game.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { log } from './src/utils/Utils.js';
import HawkServer from './src/server/Hawk.js';
import config from './config.json' with { type: 'json' };
import { readFile } from 'fs/promises';
import { routes } from './src/routes/list.js';
import { SERVERS } from './src/utils/Constants.js';
import SocketServer from './src/server/Socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const socketServer = new SocketServer({ server });
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

app.get(/.*/, async (req, res) => {
  try {
    const htmlPath = path.join(__dirname, 'index.html');
    let htmlContent = await readFile(htmlPath, 'utf8');

    const route = routes[req.path] || routes["404"];
    htmlContent = htmlContent.replaceAll('route_description', route?.description || "Sign up and join our community!");
    htmlContent = htmlContent.replaceAll('route_title', route?.title ? ('Hawk - ' + route.title) : 'Hawk');
    htmlContent = htmlContent.replaceAll('route_ogimage', '/banner.png');
    
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