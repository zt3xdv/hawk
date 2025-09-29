import Player from '../entities/Player.js';
import { getAuth } from '../utils/Utils.js';
import { pack, unpack } from 'msgpackr';

export default class NetworkManager {
  constructor(scene) {
    this.scene = scene;
    this.players = {};
    this.ws = null;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket("/ws");

    this.ws.addEventListener('open', () => {});
    this.ws.addEventListener('message', async (evt) => {
      let msg;
      let buffer;
      try {
        buffer = await event.data.arrayBuffer();
        msg = unpack(buffer);
      } catch (e) { return; }
      const { type, data } = msg;
      switch (type) {
        case 'addPlayer':
          this.addPlayer(data);
          break;
        case 'loggedIn':
          this.scene.connectingOverlay.remove();
          this.scene.inputManager.hud.container.style.display = "block";

          Object.values(data.players).forEach(p => this.addPlayer(p));
          this.scene.player = this.addPlayer(data.player);
          this.scene.physics.add.collider(this.scene.player.sprite, this.scene.collisionGroup);

          this.scene.cameras.main.startFollow(this.scene.player.sprite, true, 0.1, 0.1, 0.5, 0.5);
          this.scene.cameras.main.roundPixels = true;
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
          if (this.players[data.id]) this.players[data.id].setPosition(data.x, data.y, true);
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
          this.scene.errorModal.throwError(data.message);
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
        case 'map':
          this.scene.mapObjects.loadJsonMap(data.map);
          break;
        default:
          // unknown type
      }
    });

    this.ws.addEventListener('close', () => {
      this.scene.errorModal.throwError("Disconnected from server.");
    });

    this.ws.addEventListener('error', () => {});
  }

  send(type, data) {
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
    this.send('camerarange', range);
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
