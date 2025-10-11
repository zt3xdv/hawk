import WebSocket, { WebSocketServer } from 'ws';
import { parse } from 'url';

export default class SocketServer {
  constructor({ server }) {
    this.server = server;
    this.routes = new Map();

    this.server.on('upgrade', (req, socket, head) => {
      const pathname = parse(req.url).pathname;
      const wss = this.routes.get(pathname);

      if (wss) {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      } else {
        socket.destroy();
      }
    });
  }

  route(path) {
    if (this.routes.has(path)) {
      return this.routes.get(path);
    }

    const wss = new WebSocketServer({ noServer: true });
    this.routes.set(path, wss);
    return wss;
  }
}
