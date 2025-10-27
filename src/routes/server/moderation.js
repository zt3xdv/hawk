import Router from './router.js';
import UserModel from '../../models/UserModel.js';
import ModerationModel from '../../models/ModerationModel.js';

const router = new Router();

router.post('/api/moderation/hide', async (req, res) => {
    try {
    await router.parse(req, res);
        const { username, password, targetId, duration } = req.body;

        if (!username || !password || !targetId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = UserModel.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const bcrypt = await import('bcryptjs');
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const result = await ModerationModel.hidePlayer(user.id, targetId, duration || '1hour');
        res.json(result);
    } catch (error) {
        console.error('Error hiding player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/api/moderation/unhide', async (req, res) => {
    try {
    await router.parse(req, res);
        const { username, password, targetId } = req.body;

        if (!username || !password || !targetId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = UserModel.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const bcrypt = await import('bcryptjs');
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const result = await ModerationModel.unhidePlayer(user.id, targetId);
        res.json(result);
    } catch (error) {
        console.error('Error unhiding player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/api/moderation/ban', async (req, res) => {
    try {
    await router.parse(req, res);
        const { username, password, targetId, reason } = req.body;

        if (!username || !password || !targetId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = UserModel.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.roles || !user.roles.includes('moderator')) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const bcrypt = await import('bcryptjs');
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const result = await ModerationModel.banPlayer(targetId, user.id, reason);
        res.json(result);
    } catch (error) {
        console.error('Error banning player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/api/moderation/unban', async (req, res) => {
    try {
    await router.parse(req, res);
        const { username, password, targetId } = req.body;

        if (!username || !password || !targetId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = UserModel.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.roles || !user.roles.includes('moderator')) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const bcrypt = await import('bcryptjs');
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const result = await ModerationModel.unbanPlayer(targetId);
        res.json(result);
    } catch (error) {
        console.error('Error unbanning player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/api/moderation/timeout', async (req, res) => {
    try {
    await router.parse(req, res);
        const { username, password, targetId, duration, reason } = req.body;

        if (!username || !password || !targetId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = UserModel.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.roles || !user.roles.includes('moderator')) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const bcrypt = await import('bcryptjs');
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const result = await ModerationModel.timeoutPlayer(targetId, user.id, duration, reason);
        res.json(result);
    } catch (error) {
        console.error('Error timing out player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/api/moderation/kick', async (req, res) => {
    try {
    await router.parse(req, res);
        const { username, password, targetId } = req.body;

        if (!username || !password || !targetId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = UserModel.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.roles || !user.roles.includes('moderator')) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const bcrypt = await import('bcryptjs');
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({ success: true, message: 'Player will be kicked' });
    } catch (error) {
        console.error('Error kicking player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/api/moderation/check-status', async (req, res) => {
    try {
    await router.parse(req, res);
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        const isBanned = ModerationModel.isBanned(userId);
        const isTimedOut = ModerationModel.isTimedOut(userId);
        const ban = ModerationModel.getUserBan(userId);
        const timeout = ModerationModel.getUserTimeout(userId);

        res.json({
            isBanned,
            isTimedOut,
            ban,
            timeout
        });
    } catch (error) {
        console.error('Error checking status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/api/moderation/hidden-players', async (req, res) => {
    try {
    await router.parse(req, res);
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = UserModel.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const bcrypt = await import('bcryptjs');
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const hiddenPlayers = ModerationModel.getHiddenPlayers(user.id);
        res.json({ hiddenPlayers });
    } catch (error) {
        console.error('Error getting hidden players:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
