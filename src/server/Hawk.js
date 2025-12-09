import { join } from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import UserModel from '../models/UserModel.js';
import PlayerModel from '../models/PlayerModel.js';
import ModerationModel from '../models/ModerationModel.js';
import { log, uuid } from '../utils/Utils.js';
import { DEV } from '../utils/Constants.js';
import { pack, unpack } from 'msgpackr';
import ChunkManager from './ChunkManager.js';

class HawkServer {
  constructor(server, serverData) {
    this.path = '/ws/game/' + serverData.id + '/';
    this.wss = server.route(this.path);

    this.players = {};
    this.map = [];
    this.mapObjects = {};
    this.tiles = [];

    this.chunkManager = new ChunkManager(512);

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
      if (!viewer) continue;
      
      const sockViewer = viewer?.ws;
      if (sockViewer && sockViewer.readyState === WebSocket.OPEN) {
        this._send(sockViewer, 'playerMoved', { id: p.id, x: p.x, y: p.y });
      }
    }
  }

  kickPlayer(userId) {
    for (const [socketId, player] of Object.entries(this.players)) {
      if (player.uuid === userId) {
        const ws = player.ws;
        if (ws && ws.readyState === WebSocket.OPEN) {
          this._send(ws, 'kicked', { reason: 'You have been kicked by a moderator' });
          ws.close();
        }
        return true;
      }
    }
    return false;
  }



  async create() {
    const startMs = Date.now();

    if (!this.__counterStarted) {
      this.__counterStarted = true;
      setInterval(() => {
        if (this.time >= 1440) this.time = 0;
        else this.time += 0.5;
      }, 1000);
    }

    const DATA_DIR = 'data';
    const MAP_FILE = join(DATA_DIR, 'map.json');
    const TILES_FILE = join(DATA_DIR, 'tiles.json');

    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }

    try {
      const content = await fs.readFile(MAP_FILE, 'utf8');
      this.map = JSON.parse(content);
      
      this.map.forEach((obj, index) => {
        const objId = obj.options?.serverId || `obj_${index}`;
        obj.options = obj.options || {};
        obj.options.serverId = objId;
        this.mapObjects[objId] = obj;
        this.chunkManager.addObjectToChunk(objId, obj.x, obj.y);
      });
    } catch (err) {
      this.map = [];
    }
    
    try {
      const tilesContent = await fs.readFile(TILES_FILE, 'utf8');
      this.tiles = JSON.parse(tilesContent);
    } catch (err) {
      this.tiles = [];
    }

    this.wss.on('connection', (ws, req) => {
      const socketId = uuid();
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
            this._send(ws, 'loginError', { error: 'Invalid credentials.' });
            return ws.close();
          }

          if (ModerationModel.isBanned(user.id)) {
            const ban = ModerationModel.getUserBan(user.id);
            this._send(ws, 'loginError', { error: `You are banned. Reason: ${ban.reason}` });
            return ws.close();
          }

          const p = this.players[socketId];
          p.uuid = user.id;
          p.display_name = user.displayName;
          p.username = username;
          p.roles = user.roles || [];
          
          const positionData = user.game?.lastPosition ?? {};
          const { x = 0, y = 0 } = positionData;
          p.x = (x !== 0) ? x : 512;
          p.y = (y !== 0) ? y : 512;

          p.loggedIn = true;
          p.viewRange = clientRange;
          p.avatar = user.game?.avatar ?? null;
          p.visible = p.visible || new Set();

          p.loadedChunks = new Set();
          p.currentChunk = null;

          const playerChunk = this.chunkManager.addPlayerToChunk(socketId, p.x, p.y);
          p.currentChunk = playerChunk;

          const visibleChunks = this.chunkManager.getVisibleChunks(p.x, p.y, p.viewRange);
          const chunksData = [];
          const nearby = {};

          for (const chunkKey of visibleChunks) {
            p.loadedChunks.add(chunkKey);
            const chunkData = this.chunkManager.getChunkData(chunkKey, this.mapObjects);
            
            for (const playerId of chunkData.players) {
              if (playerId === socketId) continue;
              const other = this.players[playerId];
              if (other && other.loggedIn) {
                nearby[playerId] = this._sanitizePlayer(other);
                p.visible.add(playerId);
                
                other.visible = other.visible || new Set();
                if (!other.visible.has(socketId)) {
                  other.visible.add(socketId);
                  const sockOther = other.ws;
                  if (sockOther && sockOther.readyState === WebSocket.OPEN) {
                    this._sendPlayerTo(sockOther, p);
                  }
                }
              }
            }
            
            chunksData.push(chunkData);
          }

          this._send(ws, 'chunks', { chunks: chunksData });
          this._send(ws, 'tiles', { tiles: this.tiles });
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
          
          const oldChunk = p.currentChunk;
          const newChunk = this.chunkManager.getChunkKey(p.x, p.y);
          
          if (oldChunk !== newChunk) {
            this.chunkManager.removePlayerFromChunk(socketId, oldChunk);
            this.chunkManager.addPlayerToChunk(socketId, p.x, p.y);
            p.currentChunk = newChunk;
            
            const visibleChunks = this.chunkManager.getVisibleChunks(p.x, p.y, p.viewRange);
            const newChunks = visibleChunks.filter(key => !p.loadedChunks.has(key));
            const removedChunks = Array.from(p.loadedChunks).filter(key => !visibleChunks.includes(key));
            
            if (newChunks.length > 0) {
              const chunksData = newChunks.map(key => {
                p.loadedChunks.add(key);
                return this.chunkManager.getChunkData(key, this.mapObjects);
              });
              this._send(ws, 'loadChunks', { chunks: chunksData });
            }
            
            if (removedChunks.length > 0) {
              removedChunks.forEach(key => p.loadedChunks.delete(key));
              this._send(ws, 'unloadChunks', { chunks: removedChunks });
            }
          }
          
          this._recalcVisibilityFor(socketId);
          this._broadcastMovement(socketId);
          return;
        }

        if (type === 'chat') {
          if (!data?.message) return;
          const p = this.players[socketId];
          if (!p || !p.loggedIn) return;
          
          if (ModerationModel.isTimedOut(p.uuid)) {
            const timeout = ModerationModel.getUserTimeout(p.uuid);
            const remaining = Math.ceil((timeout.expiresAt - Date.now()) / 1000 / 60);
            this._send(ws, 'chatmessage', { message: `You are timed out for ${remaining} more minutes. Reason: ${timeout.reason}`, isCommandResponse: false, user: p.username, id: socketId });
            log('chat-' + this.data.id, `${p.username} (timeout ${remaining}m): ${data.message}`);
            return;
          }
          
          log('chat-' + this.data.id, `${p.username}: ${data.message}`);

          const payload = { ...data, user: p.username, id: socketId };

          for (const viewerId of p.visible) {
            const viewer = this.players[viewerId];
            if (!viewer) continue;
            
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

        if (type === 'createElement') {
          const p = this.players[socketId];
          if (!p || !p.loggedIn) return;
          
          const canEditMap = this.dev || (p.roles && p.roles.includes('superadmin'));
          if (!canEditMap) return;
          
          const objId = data.options?.serverId || uuid();
          data.options = data.options || {};
          data.options.serverId = objId;
          
          this.mapObjects[objId] = data;
          this.chunkManager.addObjectToChunk(objId, data.x, data.y);
          
          for (const viewerId of p.visible) {
            const viewer = this.players[viewerId];
            const sockViewer = viewer?.ws;
            if (sockViewer && sockViewer.readyState === WebSocket.OPEN) {
              this._send(sockViewer, 'createElement', data);
            }
          }
          
          this.map.push(data);
          await fs.writeFile(MAP_FILE, JSON.stringify(this.map, null, 2), 'utf8');
          return;
        }

        if (type === 'deleteElement') {
          const p = this.players[socketId];
          if (!p || !p.loggedIn) return;
          
          const canEditMap = this.dev || (p.roles && p.roles.includes('superadmin'));
          if (!canEditMap) return;
          
          const objId = data.options?.serverId;
          if (objId && this.mapObjects[objId]) {
            const obj = this.mapObjects[objId];
            const chunkKey = this.chunkManager.getChunkKey(obj.x, obj.y);
            this.chunkManager.removeObjectFromChunk(objId, chunkKey);
            delete this.mapObjects[objId];
          }
          
          for (const viewerId of p.visible) {
            const viewer = this.players[viewerId];
            const sockViewer = viewer?.ws;
            if (sockViewer && sockViewer.readyState === WebSocket.OPEN) {
              this._send(sockViewer, 'deleteElement', data);
            }
          }
          
          const index = this.map.findIndex(item => item.options?.serverId === objId);
          if (index > -1) this.map.splice(index, 1);
          await fs.writeFile(MAP_FILE, JSON.stringify(this.map, null, 2), 'utf8');
          return;
        }

        if (type === 'moveElement') {
          const p = this.players[socketId];
          if (!p || !p.loggedIn) return;
          
          const canEditMap = this.dev || (p.roles && p.roles.includes('superadmin'));
          if (!canEditMap) return;
          
          const objId = data.options?.serverId;
          if (objId && this.mapObjects[objId]) {
            const obj = this.mapObjects[objId];
            const oldChunkKey = this.chunkManager.getChunkKey(obj.x, obj.y);
            const newChunkKey = this.chunkManager.getChunkKey(data.x, data.y);
            
            if (oldChunkKey !== newChunkKey) {
              this.chunkManager.removeObjectFromChunk(objId, oldChunkKey);
              this.chunkManager.addObjectToChunk(objId, data.x, data.y);
            }
            
            obj.x = data.x;
            obj.y = data.y;
          }
          
          for (const viewerId of p.visible) {
            const viewer = this.players[viewerId];
            const sockViewer = viewer?.ws;
            if (sockViewer && sockViewer.readyState === WebSocket.OPEN) {
              this._send(sockViewer, 'moveElement', data);
            }
          }
          
          const index = this.map.findIndex(item => item.options?.serverId === objId);
          if (index > -1) {
            const el = this.map[index];
            el.x = data.x;
            el.y = data.y;
          }
          await fs.writeFile(MAP_FILE, JSON.stringify(this.map, null, 2), 'utf8');
          return;
        }
        
        if (type === 'setTile') {
          const p = this.players[socketId];
          if (!p || !p.loggedIn) return;
          
          const canEditMap = this.dev || (p.roles && p.roles.includes('superadmin'));
          if (!canEditMap) return;
          
          const { x, y, type: tileType } = data;
          if (typeof x !== 'number' || typeof y !== 'number' || !tileType) return;
          
          const existingIndex = this.tiles.findIndex(t => t.x === x && t.y === y);
          if (existingIndex > -1) {
            this.tiles[existingIndex].type = tileType;
          } else {
            this.tiles.push({ x, y, type: tileType });
          }
          
          for (const viewerId of p.visible) {
            const viewer = this.players[viewerId];
            const sockViewer = viewer?.ws;
            if (sockViewer && sockViewer.readyState === WebSocket.OPEN) {
              this._send(sockViewer, 'setTile', data);
            }
          }
          
          const TILES_FILE = join(DATA_DIR, 'tiles.json');
          await fs.writeFile(TILES_FILE, JSON.stringify(this.tiles, null, 2), 'utf8');
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

          if (p.currentChunk) {
            this.chunkManager.removePlayerFromChunk(socketId, p.currentChunk);
          }

          for (const viewerId of p.visible) {
            const viewer = this.players[viewerId];
            const sockViewer = viewer?.ws;
            if (sockViewer && sockViewer.readyState === WebSocket.OPEN) {
              this._send(sockViewer, 'removePlayer', socketId);
            }
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
