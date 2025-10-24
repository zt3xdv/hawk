import Router from './router.js';
import UserModel from '../../models/UserModel.js';
import bcrypt from 'bcryptjs';
import { DISPLAY_NAME, USERNAME, PASSWORD, BIO, TURNSTILE } from '../../utils/Constants.js';
import { verifyTurnstile } from '../../utils/Utils.js';
import fs from 'fs';
import path from 'path';
import config from '../../../config.json' with { type: 'json' };

const router = new Router();

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

router.post('/api/auth/register', async (req, res) => {
    await router.parse(req, res);
    let { display_name, username, password, turnstile } = req.body;
    if (!TURNSTILE) turnstile = "TOKK853";
    if (!display_name || !username || !password || !turnstile) {
        return res.status(400).json({ error: 'Please fill all fields.' });
    }
    
    if (TURNSTILE) {
      const turnstileVerify = await verifyTurnstile(turnstile, config.turnstile.private);
      if (!turnstileVerify.ok) {
        return res.status(400).json({ error: `Invalid captcha, Try again.` });
      }
    }

    if (!inRange(display_name.trim(), DISPLAY_NAME.MIN, DISPLAY_NAME.MAX)) {
      return res.status(400).json({ error: `Display name must be between ${DISPLAY_NAME.MIN} and ${DISPLAY_NAME.MAX} characters.` });
    }

    if (!validUsername(username)) {
      return res.status(400).json({ error: `Username must be between ${USERNAME.MIN} and ${USERNAME.MAX} characters and contain only letters, numbers and underscore.` });
    }

    if (!inRange(password, PASSWORD.MIN, PASSWORD.MAX)) {
      return res.status(400).json({ error: `Password must be between ${PASSWORD.MIN} and ${PASSWORD.MAX} characters.` });
    }

    const normUsername = normalizeUsername(username);

    await UserModel.loadUsers();
    if (UserModel.getUserByUsername(normUsername)) {
        return res.status(409).json({ error: 'Mmm it seems someone already use this username.' });
    }

    await UserModel.createUser(display_name, normUsername, password);
    res.status(201).json({ message: 'Successfully registered.' });
}).post('/api/auth/login', async (req, res) => {
    await router.parse(req, res);
    let { username, password, turnstile } = req.body;
    if (!TURNSTILE) turnstile = "TOKK853";
    if (!username || !password || !turnstile) {
        return res.status(400).json({ error: 'Please fill all fields.' });
    }
    
    if (TURNSTILE) {
      const turnstileVerify = await verifyTurnstile(turnstile, config.turnstile.private);
      if (!turnstileVerify.ok) {
        return res.status(400).json({ error: `Invalid captcha, Try again.` });
      }
    }

    if (!validUsername(username) || !inRange(password, PASSWORD.MIN, PASSWORD.MAX)) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const normUsername = normalizeUsername(username);

    await UserModel.loadUsers();
    const user = UserModel.getUserByUsername(normUsername);
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

    res.json({
      message: 'Successfully logged in.',
      username: user.username,
      password: user.password
    });
}).post('/api/auth/check', async (req, res) => {
    await router.parse(req, res);
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Please fill all fields.' });
    }

    if (!validUsername(username)) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const normUsername = normalizeUsername(username);

    await UserModel.loadUsers();
    const user = UserModel.getUserByUsername(normUsername);
    if (!user) return res.json({ valid: false });

    try {
      const match = await bcrypt.compare(password, user.password);
      return res.json({ valid: !!match, ...(!!match ? {} : user) });
    } catch (err) {
      console.error('Error comparing password in /api/auth/check:', err);
      return res.status(500).json({ valid: false });
    }
}).post('/api/auth/profile', async (req, res) => {
    await router.parse(req, res);
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: 'Please fill all fields.' });
    }

    await UserModel.loadUsers();
    const user = UserModel.getUserById(id);
    if (!user) return res.json({ valid: false });

    return res.json({
      id: user.id,
      displayName: user.displayName,
      username: user.username,
    });
}).post('/api/avatar', async (req, res) => {
    await router.parse(req, res);
    const { username, password, image } = req.body;
    if (!username || !password || !image) {
        return res.status(400).json({ error: 'Please fill all fields.' });
    }

    if (!validUsername(username)) {
        return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const normUsername = normalizeUsername(username);

    await UserModel.loadUsers();
    const user = UserModel.getUserByUsername(normUsername);
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const match = password === user.password;
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

    try {
        const mergedGame = { ...(user.game || {}), avatar: image };
        await UserModel.updateUser(normUsername, { game: mergedGame });

        return res.json({ message: 'Avatar updated successfully.' });
    } catch (err) {
        console.error('Error updating avatar:', err);
        return res.status(500).json({ error: 'Failed to update avatar.' });
    }
}).post('/api/pavatar', async (req, res) => {
    await router.parse(req, res);
    const { username, password, image } = req.body;
    if (!username || !password || !image) {
        return res.status(400).json({ error: 'Please fill all fields.' });
    }

    if (!validUsername(username)) {
        return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const normUsername = normalizeUsername(username);

    await UserModel.loadUsers();
    const user = UserModel.getUserByUsername(normUsername);
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const match = password === user.password;
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

    try {
        await UserModel.updateUser(normUsername, { avatar: image });

        return res.json({ message: 'Profile Avatar updated successfully.' });
    } catch (err) {
        console.error('Error updating avatar:', err);
        return res.status(500).json({ error: 'Failed to update avatar.' });
    }
}).get('/api/pavatar/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Missing user id.' });
  }
  await UserModel.loadUsers();
  const user = UserModel.getUserById(id);
  if (!user || !user.avatar) {
    try {
      const genericAvatarPath = path.join('assets/assets/generic-profile.png');
      const genericAvatarBuffer = fs.readFileSync(genericAvatarPath);
      res.writeHead(200, {
        'Content-Type': 'image/png',
      });
      return res.end(genericAvatarBuffer);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error loading generic image.' });
    }
  }
  try {
    const mimeType = user.avatar.match(/^data:([^;]+);base64,/)[1];
    const avatar = user.avatar.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(avatar, 'base64');
    res.writeHead(200, {
      'Content-Type': mimeType,
    });
    res.end(buffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error processing avatar.' });
  }
}).post('/api/user/edit', async (req, res) => {
    await router.parse(req, res);
    const { username, password, key, value } = req.body;
    if (!username || !password || !key || !value) {
        return res.status(400).json({ error: 'Please fill all fields.' });
    }

    if (!["bio", "username", "displayName", "password"].includes(key)) {
        return res.status(400).json({ error: 'Invalid key.' });
    }

    if (!validUsername(username)) {
        return res.status(400).json({ error: 'Invalid credentials.' });
    }

    if (key === 'displayName') {
        const display_name = String(value);
        if (!inRange(display_name.trim(), DISPLAY_NAME.MIN, DISPLAY_NAME.MAX)) {
            return res.status(400).json({ error: `Display name must be between ${DISPLAY_NAME.MIN} and ${DISPLAY_NAME.MAX} characters.` });
        }
    } else if (key === 'username') {
        const newUsername = String(value);
        if (!validUsername(newUsername)) {
            return res.status(400).json({ error: `Username must be between ${USERNAME.MIN} and ${USERNAME.MAX} characters and contain only letters, numbers and underscore.` });
        }
    } else if (key === 'password') {
        const newPassword = String(value);
        if (!inRange(newPassword, PASSWORD.MIN, PASSWORD.MAX)) {
            return res.status(400).json({ error: `Password must be between ${PASSWORD.MIN} and ${PASSWORD.MAX} characters.` });
        }
    }  else if (key === 'bio') {
        const newBio = String(value);
        if (!inRange(newBio, BIO.MIN, BIO.MAX)) {
            return res.status(400).json({ error: `Bio must be between ${BIO.MIN} and ${BIO.MAX} characters.` });
        }
    }

    const normUsername = normalizeUsername(username);

    await UserModel.loadUsers();
    const user = UserModel.getUserByUsername(normUsername);
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const match = password === user.password;
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

    if (key === 'username') {
        const targetNorm = normalizeUsername(String(value));
        const existing = UserModel.getUserByUsername(targetNorm);
        if (existing) {
            return res.status(400).json({ error: 'Username already taken.' });
        }
        try {
            await UserModel.updateUserData(normUsername, 'username', targetNorm);
            return res.json({ message: 'Profile updated successfully.' });
        } catch (err) {
            console.error('Error updating username:', err);
            return res.status(500).json({ error: 'Failed to update profile.' });
        }
    }

    try {
        await UserModel.updateUserData(normUsername, key, value);
        return res.json({ message: 'Profile updated successfully.' });
    } catch (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ error: 'Failed to update profile.' });
    }
});

export default router;
