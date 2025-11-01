import Player from '../entities/Player.js';
import { getAuth } from '../utils/Utils.js';
import { pack, unpack } from 'msgpackr';

export default class NetworkManager {
  constructor(scene) {
    this.scene = scene;
    this.players = {};
    this.ws = null;
    this.myId = null;
    this.connect();
    this.last = { type: null, data: null };
    this.messageQueue = [];
    this.processingQueue = false;
  }

  connect() {
    this.server = JSON.parse(localStorage.getItem("server"));
    this.ws = new WebSocket(this.server.path);

    this.ws.addEventListener('open', () => {});
    this.ws.addEventListener('message', async (evt) => {
      let msg;
      let buffer;
      try {
        buffer = await evt.data.arrayBuffer();
        msg = unpack(buffer);
      } catch (e) { return; }
      
      this.messageQueue.push(msg);
      if (!this.processingQueue) {
        this.processMessageQueue();
      }
    });
    this.ws.addEventListener('close', () => {
      this.scene.errorModal.throwError("Disconnected from server.<br></br>Websocket closed connection.");
    });
  }
  
  processMessageQueue() {
    this.processingQueue = true;
    
    const processNext = () => {
      if (this.messageQueue.length === 0) {
        this.processingQueue = false;
        return;
      }
      
      const msg = this.messageQueue.shift();
      const { type, data } = msg;
      this.last = { type, data };
      
      switch (type) {
        case 'addPlayer':
          this.addPlayer(data);
          break;
        case 'loggedIn':
          this.scene.connectingOverlay.remove();
          this.scene.inputManager.hud.container.style.display = "block";

          Object.values(data.players).forEach(p => this.addPlayer(p));
          this.scene.player = this.addPlayer(data.player);
          this.myId = data.player.id;
          this.scene.physics.add.collider(this.scene.player.sprite, this.scene.collisionGroup);

          this.scene.cameras.main.startFollow(this.scene.player.sprite, true, 0.1, 0.1, 0.5, 0.5);
          this.scene.cameras.main.roundPixels = true;
          
          const playerRoles = data.player.roles || [];
          this.scene.canEditMap = playerRoles.includes('superadmin');
          this.scene.inputManager.updateEditorVisibility();
          break;
        case 'chatmessage':
          if (!this.players[data.id]) return;
          this.players[data.id].say(data.message, data.isCommandResponse);
          this.scene.inputManager.hud.getComponent("chatbox").addMessage(data.user, data.message, data.isCommandResponse);
          break;
        case 'localBubble':
          this.scene.player.say(data.message, data.isCommandResponse);
          break;
        case 'playerMoved':
          if (!this.scene.player || data.id == this.scene.player.id) return;
          const p = this.players[data.id];
          if (p) p.setPosition(data.x, data.y, true);
          break;
        case 'removePlayer':
          if (this.players[data]) {
            this.players[data].destroy();
            delete this.players[data];
          }
          break;
        case 'time':
          this.scene.lightManager.timeSeconds = data.time;
          break;
        case 'connected':
          this.send('login', {
            ...getAuth(),
            range: this.scene.getCameraInfo().maxSize
          });
          break;
        case 'loginError':
          this.scene.connectingOverlay.textString = data.error;
          this.scene.connectingOverlay.show();
          break;
        case 'disconnect':
          this.scene.errorModal.throwError("Disconnected from server.");
          break;
        case 'kick':
          this.scene.errorModal.throwError("You are kicked from this server.<br>" + data);
          break;
        case 'typing':
          if (!this.players[data.id]) return;
          this.players[data.id].chat.setTyping(data.status || false);
          break;
        case 'chunks':
          if (data.chunks && Array.isArray(data.chunks)) {
            this.scene.mapObjects.loadChunksData(data.chunks);
          }
          break;
          
        case 'loadChunks':
          if (data.chunks && Array.isArray(data.chunks)) {
            this.scene.mapObjects.loadChunksData(data.chunks);
          }
          break;
          
        case 'unloadChunks':
          if (data.chunks && Array.isArray(data.chunks)) {
            this.scene.mapObjects.unloadChunksData(data.chunks);
          }
          break;
          
        case 'tiles':
          if (data.tiles && Array.isArray(data.tiles)) {
            this.scene.tileManager.loadTilesFromData(data.tiles);
            this.scene.tileManager.create();
          }
          break;
          
        case 'setTile':
          if (this.scene.tileManager && data.x !== undefined && data.y !== undefined && data.type) {
            this.scene.tileManager.tiles[data.x][data.y] = { type: data.type };
            this.scene.tileManager.renderTile(data.x, data.y);
            this.scene.tileManager.updateTexture();
          }
          break;
          
        case 'map':
          this.scene.mapObjects.loadJsonMap(data.map);
          break;
          
        case 'createElement':
          this.scene.mapObjects.create(data.id, this.scene, data.x, data.y, data.options);
          break;
        case 'deleteElement':
          this.scene.mapObjects.destroyByServerId(data.options?.serverId);
          break;
        case 'moveElement':
          this.scene.mapObjects.moveByServerId(data.options?.serverId, data.x, data.y);
          break;
        
        default:
          // unknown type
      }
      
      requestAnimationFrame(processNext);
    };
    
    processNext();
  }

  send(type, data) {
    this.last = { type, data };
    const payload = pack({ type, data });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    }
  }

  addPlayer({ id, uuid, username, display_name, x, y, avatar }) {
    return this.players[id] = new Player(this.scene, id, uuid, username, display_name, x, y, avatar);
  }

  emitChatMessage(message, isCommandResponse = false) {
    this.send('chat', { message, isCommandResponse });
  }

  emitExportElements(elements) {
    this.send('exportElements', elements);
  }

  emitRange(range) {
    this.send('camerarange', { range });
  }

  emitMovement(x, y) {
    this.send('playerMovement', { x, y });
  }

  // EDITOR MODE
  emitCreateElement(obj) {
    this.send('createElement', this.scene.mapObjects.exportElement(obj));
  }

  emitDeleteElement(obj) {
    this.send('deleteElement', this.scene.mapObjects.exportElement(obj));
  }

  emitMoveElement(obj) {
    this.send('moveElement', this.scene.mapObjects.exportElement(obj));
  }

  emitTyping(t) {
    this.send('typing', { status: t });
  }
}
