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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

const hawkServer = new HawkServer(server);

app.use(express.static(join(__dirname, 'public')));
app.use(express.static(join(__dirname, 'dist')));

authRoutes.setApp(app);
friendsRoutes.setApp(app);
gameRoutes.setApp(app);
app.get(/.*/, async (req, res) => {
  try {
    // Lee el contenido del archivo JavaScript
    const jsContent = await readFile(path.join(__dirname, 'dist', 'hawk.min.js'), 'utf8');

    // Lee el contenido del archivo HTML
    const htmlPath = path.join(__dirname, 'index.html');
    let htmlContent = await readFile(htmlPath, 'utf8');

    // Reemplaza el marcador de posición con el contenido JavaScript
    const scriptToInject = `<script>${jsContent}</script>`;
    htmlContent = htmlContent.replace('<hawk></hawk>', scriptToInject);

    // Envía la respuesta HTML modificada al cliente
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
