import Router from './router.js';
import UserModel from '../../models/UserModel.js';
import ModerationModel from '../../models/ModerationModel.js';

const router = new Router();

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

        const hasPermission = user.roles && (
            user.roles.includes('moderator') || 
            user.roles.includes('admin') || 
            user.roles.includes('superadmin')
        );
        
        if (!hasPermission) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        if (!password === user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const result = await ModerationModel.banPlayer(targetId, user.id, reason);
        res.json(result);
    } catch (error) {
        console.error('Error banning player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}).post('/api/moderation/unban', async (req, res) => {
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

        const hasPermission = user.roles && (
            user.roles.includes('moderator') || 
            user.roles.includes('admin') || 
            user.roles.includes('superadmin')
        );
        
        if (!hasPermission) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        if (!password === user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const result = await ModerationModel.unbanPlayer(targetId);
        res.json(result);
    } catch (error) {
        console.error('Error unbanning player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}).post('/api/moderation/timeout', async (req, res) => {
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

        const hasPermission = user.roles && (
            user.roles.includes('moderator') || 
            user.roles.includes('admin') || 
            user.roles.includes('superadmin')
        );
        
        if (!hasPermission) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        if (!password === user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const result = await ModerationModel.timeoutPlayer(targetId, user.id, duration, reason);
        res.json(result);
    } catch (error) {
        console.error('Error timing out player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}).post('/api/moderation/kick', async (req, res) => {
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

        const hasPermission = user.roles && (
            user.roles.includes('moderator') || 
            user.roles.includes('admin') || 
            user.roles.includes('superadmin')
        );
        
        if (!hasPermission) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        if (!password === user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        let kicked = false;
        for (const server of router.app.hawkServers) {
            if (server.kickPlayer(targetId)) {
                kicked = true;
            }
        }

        if (kicked) {
            res.json({ success: true, message: 'Player has been kicked from all servers' });
        } else {
            res.json({ success: true, message: 'Player is not currently connected to any server' });
        }
    } catch (error) {
        console.error('Error kicking player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}).post('/api/moderation/check-status', async (req, res) => {
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

export default router;
