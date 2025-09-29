import fs from 'fs/promises';
import { uuid } from '../utils/Utils.js';
import UserModel from './UserModel.js';

class FriendsModel {
  static requests = []; // { id, requesterId, requestedId, status, createdAt, updatedAt }
  static DATA_PATH = './data/friends.json';
  // status: 'pending' | 'accepted' | 'denied' | 'cancelled'

  // Carga desde archivo (y valida estructura)
  static async load() {
    try {
      const data = await fs.readFile(this.DATA_PATH, 'utf8');
      const json = JSON.parse(data);
      // normalizar
      this.requests = Array.isArray(json.requests) ? json.requests : [];
    } catch (err) {
      // si no existe archivo, inicializa vacío
      if (err.code === 'ENOENT') {
        this.requests = [];
        await this.save();
      } else {
        console.error('Error loading friends data:', err);
      }
    }
  }

  static async save() {
    try {
      const payload = { requests: this.requests };
      await fs.writeFile(this.DATA_PATH, JSON.stringify(payload, null, 2));
    } catch (err) {
      console.error('Error saving friends data:', err);
    }
  }

  // Crea una solicitud de amistad. Devuelve la solicitud o lanza Error.
  static async request(requesterId, requestedId) {
    // validar usuarios distintos
    if (requesterId === requestedId) throw new Error('Cannot send friend request to yourself.');
    const requester = UserModel.getUserById(requesterId);
    const requested = UserModel.getUserById(requestedId);
    if (!requester || !requested) throw new Error('Requester or requested user not found.');

    // comprobar si ya son amigos (es decir, existe solicitud acceptada entre ellos)
    if (this.areFriends(requesterId, requestedId)) throw new Error('Users are already friends.');

    // comprobar solicitudes existentes pendientes entre ambos
    const existing = this.requests.find(r =>
      ((r.requesterId === requesterId && r.requestedId === requestedId) ||
       (r.requesterId === requestedId && r.requestedId === requesterId)) &&
      r.status === 'pending'
    );
    if (existing) throw new Error('There is already a pending request between these users.');

    const req = {
      id: uuid(),
      requesterId,
      requestedId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.requests.push(req);
    await this.save();
    return req;
  }

  // Acepta una solicitud por id
  static async acceptRequest(requestId) {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Friend request not found.');
    if (req.status !== 'pending') throw new Error('Only pending requests can be accepted.');

    req.status = 'accepted';
    req.updatedAt = new Date().toISOString();
    await this.save();
    return req;
  }

  // Niega una solicitud por id
  static async denyRequest(requestId) {
    const index = this.requests.findIndex(r => r.id === requestId);
    if (index !== -1) this.requests.splice(index, 1);
    await this.save();
    return true;
  }

  // Cancela una solicitud pendiente (por el que la creó)
  static async cancelRequest(requestId, requesterId = null) {
    const index = this.requests.findIndex(r => r.id === requestId);
    if (index !== -1) this.requests.splice(index, 1);
    await this.save();
    return true;
  }

  // Remueve una amistad ya aceptada entre dos usuarios
  static async removeFriend(userId, friendId) {
    // buscar la solicitud aceptada entre ambos y marcar como cancelled (o eliminar)
    const idx = this.requests.findIndex(r =>
      ((r.requesterId === userId && r.requestedId === friendId) ||
       (r.requesterId === friendId && r.requestedId === userId)) &&
      r.status === 'accepted'
    );
    if (idx === -1) throw new Error('Friend relationship not found.');
    // eliminar la relación (o marcar como cancelled/removed)
    this.requests.splice(idx, 1);
    await this.save();
    return true;
  }

  // Devuelve todas las solicitudes (pendientes/aceptadas/denegadas) relacionadas con userId
  static getRequestsForUser(userId) {
    return this.requests.filter(r => r.requesterId == userId && r.status === 'pending');
  }

  // Devuelve sólo solicitudes pendientes dirigidas a userId (inbox)
  static getPendingRequestsForUser(userId) {
    return this.requests.filter(r => r.requestedId == userId && r.status === 'pending');
  }

  // Devuelve lista de amigos (user objects) para userId — requiere carga de usuarios en UserModel
  static getFriends(userId) {
    const accepted = this.requests.filter(r =>
      (r.requesterId === userId || r.requestedId === userId) && r.status === 'accepted'
    );
    const friendIds = accepted.map(r => (r.requesterId === userId ? r.requestedId : r.requesterId));
    // mapear a objetos de usuario
    return friendIds.map(id => UserModel.getUserById(id)).filter(Boolean);
  }

  // Helper simple
  static areFriends(a, b) {
    return this.requests.some(r =>
      ((r.requesterId === a && r.requestedId === b) || (r.requesterId === b && r.requestedId === a)) &&
      r.status === 'accepted'
    );
  }

  // Buscar solicitud por id
  static getRequestById(requestId) {
    return this.requests.find(r => r.id === requestId) || null;
  }
}

export default FriendsModel;
