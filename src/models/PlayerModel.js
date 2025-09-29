import * as Utils from "../utils/Utils.js";

class PlayerModel {
  constructor({ id, uuid, display_name, username, x, y, loggedIn, visible, viewRange, avatar }) {
    this.id = id || Utils.id(32);
    this.display_name = display_name || '';
    this.username = username || '';
    this.x = x || 1000;
    this.y = y || 1000;
    this.loggedIn = loggedIn || false;
    this.visible = visible || new Set();
    this.viewRange = viewRange || 200;
    this.avatar = avatar || null;
    this.uuid = uuid || Utils.uuid();
  }
}

export default PlayerModel;
