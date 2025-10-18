import { join } from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import UserModel from '../models/UserModel.js';
import PlayerModel from '../models/PlayerModel.js';
import { log, uuid } from '../utils/Utils.js';
import { DEV } from '../utils/Constants.js';
import { pack, unpack } from 'msgpackr';

class HawkServer {
  constructor(server, serverData) {
    this.path = '/ws/game/' + serverData.id + '/';
    this.wss = server.route(this.path);

    this.players = {};
    this.map = [];

    this.time = 720;
    this.__counterStarted = false;

    this.dev = DEV;
    this.data = serverData;

    this.create();
  }
  
  getData() {
    return {
      ...this.data,
      players: Object.keys(this.players).length,
      path: this.path
    };
  }

  _distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _sanitizePlayer(player) {
    return {
      id: player.id,
      username: player.username,
      display_name: player.display_name,
      x: player.x,
      y: player.y,
      avatar: player.avatar ?? undefined
    };
  }

  _send(ws, type, data) {
    try { ws.send(pack({ type, data })); } catch (e) {}
  }

  _sendPlayerTo(targetWs, player) {
    this._send(targetWs, 'addPlayer', this._sanitizePlayer(player));
  }

  _removePlayerFrom(targetWs, playerId) {
    this._send(targetWs, 'removePlayer', playerId);
  }

  _isVisibleTo(source, target) {
    if (!source || !target || !source.loggedIn || !target.loggedIn) return false;
    const d = this._distance(source, target);
    return d <= target.viewRange;
  }

  _recalcVisibilityFor(playerId) {
    const p = this.players[playerId];
    if (!p || !p.loggedIn) return;

    p.visible = p.visible || new Set();

    for (const [otherId, other] of Object.entries(this.players)) {
      if (otherId === playerId) continue;
      if (!other.loggedIn) continue;

      other.visible = other.visible || new Set();

      const otherSeesP = this._isVisibleTo(p, other);
      const pSeesOther = this._isVisibleTo(other, p);

      if (otherSeesP && !other.visible.has(playerId)) {
        const sockOther = other.ws;
        if (sockOther && sockOther.readyState === WebSocket.OPEN) this._sendPlayerTo(sockOther, p);
        other.visible.add(playerId);
      }
      if (!otherSeesP && other.visible.has(playerId)) {
        const sockOther = other.ws;
        if (sockOther && sockOther.readyState === WebSocket.OPEN) this._removePlayerFrom(sockOther, playerId);
        other.visible.delete(playerId);
      }

      if (pSeesOther && !p.visible.has(otherId)) {
        const sockP = p.ws;
        if (sockP && sockP.readyState === WebSocket.OPEN) this._sendPlayerTo(sockP, other);
        p.visible.add(otherId);
      }
      if (!pSeesOther && p.visible.has(otherId)) {
        const sockP = p.ws;
        if (sockP && sockP.readyState === WebSocket.OPEN) this._removePlayerFrom(sockP, otherId);
        p.visible.delete(otherId);
      }
    }
  }

  _broadcastMovement(playerId) {
    const p = this.players[playerId];
    if (!p || !p.loggedIn) return;
    for (const viewerId of p.visible) {
      const viewer = this.players[viewerId];
      const sockViewer = viewer?.ws;
      if (sockViewer && sockViewer.readyState === WebSocket.OPEN) {
        this._send(sockViewer, 'playerMoved', { id: p.id, x: p.x, y: p.y });
      }
    }
  }

  async create() {
    const startMs = Date.now();

    if (!this.__counterStarted) {
      this.__counterStarted = true;
      setInterval(() => {
        if (this.time >= 1440) this.time = 0;
        else this.time += 1;
      }, 1000);
    }

    const DATA_DIR = 'data';
    const MAP_FILE = join(DATA_DIR, 'map.json');

    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }

    try {
      const content = await fs.readFile(MAP_FILE, 'utf8');
      this.map = JSON.parse(content);
    } catch (err) {
      this.map = [];
    }

    this.wss.on('connection', (ws, req) => {
      const socketId = uuid(); // usa uuid() desde Utils.js
      ws._id = socketId;

      this.players[socketId] = new PlayerModel({ id: socketId });
      this.players[socketId].ws = ws;

      this._send(ws, 'connected', { id: socketId });

      ws.on('message', async (raw) => {
        let msg;
        try { msg = unpack(raw); } catch (e) { return; }
        const { type, data } = msg;

        if (type === 'login') {
          const { username, password, range } = data || {};
          const clientRange = Number(range) || 200;

          await UserModel.loadUsers();
          const user = UserModel.getUserByUsername(username);
          if (!user || user.password !== password) {
            this._send(ws, 'loginError', { error: 'Invalid username or password.' });
            return ws.close();
          }

          const p = this.players[socketId];
          p.uuid = user.id;
          p.display_name = user.displayName;
          p.username = username;
          const { x = 0, y = 0 } = user.game?.lastPosition ?? {};
          p.x = (x !== 0) ? x : 312;
          p.y = (y !== 0) ? y : 536;

          p.loggedIn = true;
          p.viewRange = clientRange;
          p.avatar = user.game?.avatar ?? null;
          p.visible = p.visible || new Set();

          p.loadedChunks = p.loadedChunks || new Set();
          p.seenChunks = p.seenChunks || new Set();

          this._send(ws, 'map', { map: this.map });

          const nearby = {};
          for (const [otherId, other] of Object.entries(this.players)) {
            if (otherId === socketId) continue;
            if (!other.loggedIn) continue;

            const d = this._distance(p, other);
            const pSeesOther = d <= p.viewRange;
            const otherSeesP = d <= other.viewRange;

            if (pSeesOther) {
              nearby[otherId] = this._sanitizePlayer(other);
              p.visible.add(otherId);
            }

            if (otherSeesP) {
              other.visible = other.visible || new Set();
              if (!other.visible.has(socketId)) {
                other.visible.add(socketId);
                const sockOther = other.ws;
                if (sockOther && sockOther.readyState === WebSocket.OPEN) this._sendPlayerTo(sockOther, p);
              }
            }
          }

          this._send(ws, 'loggedIn', { player: p, players: nearby });
          this._send(ws, 'time', { time: this.time });
          return;
        }

        if (type === 'camerarange') {
          const p = this.players[socketId];
          if (!p || !p.loggedIn) return;
          const newRange = Number(data?.range);
          if (!Number.isFinite(newRange) || newRange <= 0) return;
          p.viewRange = newRange;
          this._recalcVisibilityFor(socketId);
          return;
        }

        if (type === 'playerMovement') {
          const p = this.players[socketId];
          if (!p || !p.loggedIn) return;
          p.x = data.x;
          p.y = data.y;
          this._recalcVisibilityFor(socketId);
          this._broadcastMovement(socketId);
          return;
        }

        if (type === 'chat') {
          if (!data?.message) return;
          const p = this.players[socketId];
          if (!p || !p.loggedIn) return;
          
          log('chat-' + this.data.id, `${p.username}: ${data.message}`);

          const payload = { ...data, user: p.username, id: socketId };

          for (const viewerId of p.visible) {
            const viewer = this.players[viewerId];
            const sockViewer = viewer?.ws;
            if (sockViewer && sockViewer.readyState === WebSocket.OPEN) this._send(sockViewer, 'chatmessage', payload);
          }

          this._send(ws, 'chatmessage', payload);
          return;
        }

        if (type === 'typing') {
          const p = this.players[socketId];
          if (!p || !p.loggedIn) return;
          const payload = { ...data, id: socketId };
          for (const viewerId of p.visible) {
            const viewer = this.players[viewerId];
            const sockViewer = viewer?.ws;
            if (sockViewer && sockViewer.readyState === WebSocket.OPEN) this._send(sockViewer, 'typing', payload);
          }
          this._send(ws, 'typing', payload);
          return;
        }

        if (this.dev && type === 'createElement') {
          const p = this.players[socketId];
          if (!p || !p.loggedIn) return;
          
          for (const viewerId of p.visible) {
            const viewer = this.players[viewerId];
            const sockViewer = viewer?.ws;
            if (sockViewer && sockViewer.readyState === WebSocket.OPEN) this._send(sockViewer, 'createElement', data);
          }
          this.map.push(data);
          await fs.writeFile(MAP_FILE, JSON.stringify(this.map, null, 2), 'utf8');
          return;
        }
        if (this.dev && type === 'deleteElement') {
          const p = this.players[socketId];
          if (!p || !p.loggedIn) return;
          
          for (const viewerId of p.visible) {
            const viewer = this.players[viewerId];
            const sockViewer = viewer?.ws;
            if (sockViewer && sockViewer.readyState === WebSocket.OPEN) this._send(sockViewer, 'deleteElement', data);
          }
          const index = this.map.findIndex(item => item.options?.serverId === data.options?.serverId);
          if (index > -1) this.map.splice(index, 1);
          await fs.writeFile(MAP_FILE, JSON.stringify(this.map, null, 2), 'utf8');
          return;
        }
        if (this.dev && type === 'moveElement') {
          const p = this.players[socketId];
          if (!p || !p.loggedIn) return;
          
          for (const viewerId of p.visible) {
            const viewer = this.players[viewerId];
            const sockViewer = viewer?.ws;
            if (sockViewer && sockViewer.readyState === WebSocket.OPEN) this._send(sockViewer, 'moveElement', data);
          }
          const index = this.map.findIndex(item => item.options?.serverId === data.options?.serverId);
          if (index > -1) {
            const el = this.map[index];
            el.x = data.x;
            el.y = data.y;
          }
          await fs.writeFile(MAP_FILE, JSON.stringify(this.map, null, 2), 'utf8');
          return;
        }
      });

      ws.on('close', async () => {
        const p = this.players[socketId];
        if (p) {
          const user = UserModel.getUserByUsername(p.username);
          if (user) {
            user.game = user.game || {};
            user.game.lastPosition = { x: p.x, y: p.y };
            await UserModel.saveUsers();
          }

          for (const viewerId of p.visible) {
            const viewer = this.players[viewerId];
            const sockViewer = viewer?.ws;
            if (sockViewer && sockViewer.readyState === WebSocket.OPEN) this._send(sockViewer, 'removePlayer', socketId);
            const other = this.players[viewerId];
            if (other && other.visible) other.visible.delete(socketId);
          }

          for (const other of Object.values(this.players)) {
            if (other && other.visible) other.visible.delete(socketId);
          }

          delete this.players[socketId];
        }
      });

      ws.on('error', (err) => {
        log('server-' + this.data.id, 'WebSocket error for ' + socketId + ': ' + String(err));
      });
    });
  }
}

export default HawkServer;
