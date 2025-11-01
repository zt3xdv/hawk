import Router from './router.js';
import UserModel from '../../models/UserModel.js';

const router = new Router();

router.post('/api/admin/users', async (req, res) => {
    try {
        await router.parse(req, res);
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Missing credentials' });
        }

        const user = UserModel.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.roles || !user.roles.includes('superadmin')) {
            return res.status(403).json({ error: 'Access denied. Superadmin only.' });
        }

        await UserModel.loadUsers();
        const users = UserModel.getAllUsers().map(u => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            roles: u.roles || [],
            avatar: u.game?.avatar || null
        }));

        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}).post('/api/admin/set-roles', async (req, res) => {
    try {
        await router.parse(req, res);
        const { username, password, targetId, roles } = req.body;

        if (!username || !password || !targetId || !Array.isArray(roles)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = UserModel.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.roles || !user.roles.includes('superadmin')) {
            return res.status(403).json({ error: 'Access denied. Superadmin only.' });
        }

        const validRoles = ['moderator', 'admin', 'superadmin'];
        const invalidRoles = roles.filter(r => !validRoles.includes(r));
        if (invalidRoles.length > 0) {
            return res.status(400).json({ error: `Invalid roles: ${invalidRoles.join(', ')}` });
        }

        const targetUser = UserModel.getUserById(targetId);
        if (!targetUser) {
            return res.status(404).json({ error: 'Target user not found' });
        }

        targetUser.roles = roles;
        await UserModel.saveUsers();

        res.json({ 
            success: true, 
            message: `Roles updated for ${targetUser.username}`,
            roles: targetUser.roles
        });
    } catch (error) {
        console.error('Error setting roles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}).post('/api/admin/edit-user', async (req, res) => {
    try {
        await router.parse(req, res);
        const { username, password, targetId, displayName, bio, avatar, roles } = req.body;

        if (!username || !password || !targetId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = UserModel.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.roles || !user.roles.includes('superadmin')) {
            return res.status(403).json({ error: 'Access denied. Superadmin only.' });
        }

        const targetUser = UserModel.getUserById(targetId);
        if (!targetUser) {
            return res.status(404).json({ error: 'Target user not found' });
        }

        if (displayName !== undefined) {
            targetUser.displayName = displayName.trim();
        }

        if (bio !== undefined) {
            targetUser.bio = bio.trim();
        }

        if (avatar !== undefined) {
            if (avatar.trim() === '') {
                targetUser.game = targetUser.game || {};
                targetUser.game.avatar = null;
            } else {
                targetUser.game = targetUser.game || {};
                targetUser.game.avatar = avatar.trim();
            }
        }

        if (roles && Array.isArray(roles)) {
            const validRoles = ['moderator', 'admin', 'superadmin'];
            const invalidRoles = roles.filter(r => !validRoles.includes(r));
            if (invalidRoles.length > 0) {
                return res.status(400).json({ error: `Invalid roles: ${invalidRoles.join(', ')}` });
            }
            targetUser.roles = roles;
        }

        await UserModel.saveUsers();

        res.json({ 
            success: true, 
            message: `User ${targetUser.username} updated successfully`
        });
    } catch (error) {
        console.error('Error editing user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
