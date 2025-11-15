import fs from 'fs/promises';
import { uuid } from '../utils/Utils.js';
import UserModel from './UserModel.js';

class FriendsModel {
  static requests = [];
  static DATA_PATH = './data/friends.json';
  
  static async load() {
    try {
      const data = await fs.readFile(this.DATA_PATH, 'utf8');
      const json = JSON.parse(data);

      this.requests = Array.isArray(json.requests) ? json.requests : [];
    } catch (err) {
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

  static async request(requesterId, requestedId) {
    if (requesterId === requestedId) throw new Error('Cannot send friend request to yourself.');
    const requester = UserModel.getUserById(requesterId);
    const requested = UserModel.getUserById(requestedId);
    if (!requester || !requested) throw new Error('Requester or requested user not found.');

    if (this.areFriends(requesterId, requestedId)) throw new Error('Users are already friends.');

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

  static async acceptRequest(requestId) {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Friend request not found.');
    if (req.status !== 'pending') throw new Error('Only pending requests can be accepted.');

    req.status = 'accepted';
    req.updatedAt = new Date().toISOString();
    await this.save();
    return req;
  }

  static async denyRequest(requestId) {
    const index = this.requests.findIndex(r => r.id === requestId);
    if (index !== -1) this.requests.splice(index, 1);
    await this.save();
    return true;
  }

  static async cancelRequest(requestId, requesterId = null) {
    const index = this.requests.findIndex(r => r.id === requestId);
    if (index !== -1) this.requests.splice(index, 1);
    await this.save();
    return true;
  }

  static async removeFriend(userId, friendId) {
    const idx = this.requests.findIndex(r =>
      ((r.requesterId === userId && r.requestedId === friendId) ||
       (r.requesterId === friendId && r.requestedId === userId)) &&
      r.status === 'accepted'
    );
    if (idx === -1) throw new Error('Friend relationship not found.');
    this.requests.splice(idx, 1);
    await this.save();
    return true;
  }

  static getRequestsForUser(userId) {
    return this.requests.filter(r => r.requesterId == userId && r.status === 'pending');
  }

  static getPendingRequestsForUser(userId) {
    return this.requests.filter(r => r.requestedId == userId && r.status === 'pending');
  }

  static getFriends(userId) {
    const accepted = this.requests.filter(r =>
      (r.requesterId === userId || r.requestedId === userId) && r.status === 'accepted'
    );
    const friendIds = accepted.map(r => (r.requesterId === userId ? r.requestedId : r.requesterId));
    return friendIds.map(id => UserModel.getUserById(id)).filter(Boolean);
  }

  static areFriends(a, b) {
    return this.requests.some(r =>
      ((r.requesterId === a && r.requestedId === b) || (r.requesterId === b && r.requestedId === a)) &&
      r.status === 'accepted'
    );
  }

  static getRequestById(requestId) {
    return this.requests.find(r => r.id === requestId) || null;
  }
}

export default FriendsModel;
