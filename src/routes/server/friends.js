import Router from './router.js';
import UserModel from '../../models/UserModel.js';
import FriendsModel from '../../models/FriendsModel.js';
import { USERNAME, DISPLAY_NAME, PASSWORD } from '../../utils/Constants.js';

const router = new Router();

// --- Helpers ---
function inRange(value = '', min, max) {
  return typeof value === 'string' && value.length >= min && value.length <= max;
}

const USERNAME_RE = /^[A-Za-z0-9_]+$/;
function normalizeUsername(value = '') {
  return (typeof value === 'string' ? value.trim().toLowerCase() : '');
}
function validUsername(value = '') {
  const v = normalizeUsername(value);
  return USERNAME_RE.test(v) && inRange(v, USERNAME.MIN, USERNAME.MAX);
}

// Auth when client sends hashed password
async function authenticate(body) {
  const { username, password } = body || {};
  if (!username || !password) throw { status: 400, json: { error: 'Please fill all fields.' } };
  if (!validUsername(username)) throw { status: 400, json: { error: 'Invalid credentials.' } };

  const normUsername = normalizeUsername(username);
  await UserModel.loadUsers();
  const user = UserModel.getUserByUsername(normUsername);
  if (!user) throw { status: 401, json: { error: 'Invalid credentials.' } };

  // client sends hashed password, compare directly
  if (password !== user.password) throw { status: 401, json: { error: 'Invalid credentials.' } };

  return user;
}

async function ensureLoaded() {
  await UserModel.loadUsers();
  await FriendsModel.load();
}

// --- Routes ---
// All routes use POST { username, password, ... }

router.post('/api/friends/send', async (req, res) => {
  await router.parse(req, res);
  try {
    await ensureLoaded();
    const user = await authenticate(req.body);

    // Accept either targetUsername or targetUserId
    const { targetUsername, targetUserId } = req.body;
    if (!targetUsername && !targetUserId) return res.status(400).json({ error: 'targetUsername or targetUserId required.' });

    let target = null;
    if (targetUserId) {
      target = UserModel.getUserById(targetUserId);
    } else if (targetUsername) {
      const norm = normalizeUsername(targetUsername);
      target = UserModel.getUserByUsername(norm);
    }

    if (!target) return res.status(404).json({ error: 'Target user not found.' });
    if (target.id === user.id) return res.status(400).json({ error: 'Cannot send a friend request to yourself.' });

    try {
      const reqObj = await FriendsModel.request(user.id, target.id);
      return res.status(201).json({ message: 'Friend request sent.', request: reqObj });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Unable to send friend request.' });
    }
  } catch (e) {
    return res.status(e.status || 500).json(e.json || { error: 'Internal error.' });
  }
});

router.post('/api/friends/accept', async (req, res) => {
  await router.parse(req, res);
  try {
    await ensureLoaded();
    const user = await authenticate(req.body);

    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ error: 'requestId required.' });

    const reqObj = FriendsModel.getRequestById(requestId);
    if (!reqObj) return res.status(404).json({ error: 'Friend request not found.' });
    if (reqObj.requestedId !== user.id) return res.status(403).json({ error: 'Not authorized to accept this request.' });

    try {
      const updated = await FriendsModel.acceptRequest(requestId);
      return res.json({ message: 'Friend request accepted.', request: updated });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Unable to accept request.' });
    }
  } catch (e) {
    return res.status(e.status || 500).json(e.json || { error: 'Internal error.' });
  }
});

router.post('/api/friends/deny', async (req, res) => {
  await router.parse(req, res);
  try {
    await ensureLoaded();
    const user = await authenticate(req.body);

    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ error: 'requestId required.' });

    const reqObj = FriendsModel.getRequestById(requestId);
    if (!reqObj) return res.status(404).json({ error: 'Friend request not found.' });
    if (reqObj.requestedId !== user.id) return res.status(403).json({ error: 'Not authorized to deny this request.' });

    try {
      const updated = await FriendsModel.denyRequest(requestId);
      return res.json({ message: 'Friend request denied.', request: updated });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Unable to deny request.' });
    }
  } catch (e) {
    return res.status(e.status || 500).json(e.json || { error: 'Internal error.' });
  }
});

router.post('/api/friends/cancel', async (req, res) => {
  await router.parse(req, res);
  try {
    await ensureLoaded();
    const user = await authenticate(req.body);

    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ error: 'requestId required.' });

    const reqObj = FriendsModel.getRequestById(requestId);
    if (!reqObj) return res.status(404).json({ error: 'Friend request not found.' });
    if (reqObj.requesterId !== user.id) return res.status(403).json({ error: 'Not authorized to cancel this request.' });

    try {
      const updated = await FriendsModel.cancelRequest(requestId, user.id);
      return res.json({ message: 'Friend request cancelled.', request: updated });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Unable to cancel request.' });
    }
  } catch (e) {
    return res.status(e.status || 500).json(e.json || { error: 'Internal error.' });
  }
});

router.post('/api/friends/remove', async (req, res) => {
  await router.parse(req, res);
  try {
    await ensureLoaded();
    const user = await authenticate(req.body);

    const { friendUsername, friendUserId } = req.body;
    if (!friendUsername && !friendUserId) return res.status(400).json({ error: 'friendUsername or friendUserId required.' });

    let friend = null;
    if (friendUserId) friend = UserModel.getUserById(friendUserId);
    else friend = UserModel.getUserByUsername(normalizeUsername(friendUsername));

    if (!friend) return res.status(404).json({ error: 'Friend user not found.' });

    try {
      await FriendsModel.removeFriend(user.id, friend.id);
      return res.json({ message: 'Friend removed.' });
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Unable to remove friend.' });
    }
  } catch (e) {
    return res.status(e.status || 500).json(e.json || { error: 'Internal error.' });
  }
});

router.post('/api/friends/list', async (req, res) => {
  await router.parse(req, res);
  try {
    await ensureLoaded();
    const user = await authenticate(req.body);

    const friends = FriendsModel.getFriends(user.id).map(u => ({
      id: u.id,
      display_name: u.displayName,
      username: u.username
    }));

    return res.json({ friends });
  } catch (e) {
    return res.status(e.status || 500).json(e.json || { error: 'Internal error.' });
  }
});

router.post('/api/friends/requests', async (req, res) => {
  await router.parse(req, res);
  try {
    await ensureLoaded();
    const user = await authenticate(req.body);

    const requests = FriendsModel.getRequestsForUser(user.id);
    return res.json({ requests });
  } catch (e) {
    return res.status(e.status || 500).json(e.json || { error: 'Internal error.' });
  }
});

router.post('/api/friends/pending', async (req, res) => {
  await router.parse(req, res);
  try {
    await ensureLoaded();
    const user = await authenticate(req.body);

    const pending = FriendsModel.getPendingRequestsForUser(user.id);
    return res.json({ pending });
  } catch (e) {
    return res.status(e.status || 500).json(e.json || { error: 'Internal error.' });
  }
});

router.post('/api/friends/status', async (req, res) => {
  await router.parse(req, res);
  try {
    await ensureLoaded();
    const user = await authenticate(req.body);

    const { otherUsername, otherUserId } = req.body;
    if (!otherUsername && !otherUserId) return res.status(400).json({ error: 'otherUsername or otherUserId required.' });

    let other = null;
    if (otherUserId) other = UserModel.getUserById(otherUserId);
    else other = UserModel.getUserByUsername(normalizeUsername(otherUsername));

    if (!other) return res.status(404).json({ error: 'Other user not found.' });

    const reqs = FriendsModel.getRequestsForUser(user.id).filter(r =>
      (r.requesterId === other.id || r.requestedId === other.id)
    );

    if (reqs.length === 0 && !FriendsModel.areFriends(user.id, other.id)) {
      return res.json({ status: 'none' });
    }

    const accepted = reqs.find(r => r.status === 'accepted');
    if (accepted) return res.json({ status: 'friends', request: accepted });

    const pending = reqs.find(r => r.status === 'pending');
    if (pending) return res.json({ status: 'pending', request: pending });

    const denied = reqs.find(r => r.status === 'denied' || r.status === 'cancelled');
    if (denied) return res.json({ status: denied.status, request: denied });

    return res.json({ status: 'unknown' });
  } catch (e) {
    return res.status(e.status || 500).json(e.json || { error: 'Internal error.' });
  }
});

export default router;
