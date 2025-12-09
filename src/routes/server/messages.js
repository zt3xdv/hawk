import Router from './router.js';
import UserModel from '../../models/UserModel.js';
import MessageModel from '../../models/MessageModel.js';
import { MESSAGE } from '../../utils/Constants.js';

const router = new Router();

function normalizeUsername(value = '') {
  return (typeof value === 'string' ? value.trim().toLowerCase() : '');
}

async function authenticate(username, password) {
    if (!username || !password) return null;
    
    const normUsername = normalizeUsername(username);
    await UserModel.loadUsers();
    const user = UserModel.getUserByUsername(normUsername);
    if (!user) return null;

    const match = password === user.password;
    if (!match) return null;

    return user;
}

router.post('/api/messages/conversations', async (req, res) => {
    await router.parse(req, res);
    const { username, password } = req.body;
    
    const user = await authenticate(username, password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    await MessageModel.loadMessages();
    const conversations = MessageModel.getConversations(user.id);
    
    const conversationsWithUsers = await Promise.all(
        conversations.map(async (conv) => {
            const otherUser = UserModel.getUserById(conv.userId);
            let online = false;

            for (const srv of router.app.hawkServers) {
              const player = Object.values(srv.players).find(p => p.uuid === otherUser.id);
              if (player && player.loggedIn) {
                online = srv.data.id;
                break;
              }
            }

            if (!online && router.app.presenceSocket && router.app.presenceSocket.isUserOnlineWeb(otherUser.id)) {
              online = 'web';
            }
            
            return {
                userId: conv.userId,
                username: otherUser?.username || 'Unknown',
                displayName: otherUser?.displayName || 'Unknown',
                online,
                lastMessage: {
                    content: conv.lastMessage.content,
                    timestamp: conv.lastMessage.timestamp,
                    fromMe: conv.lastMessage.fromId === user.id
                },
                unreadCount: conv.unreadCount
            };
        })
    );

    res.json({ conversations: conversationsWithUsers });
}).post('/api/messages/get', async (req, res) => {
    await router.parse(req, res);
    const { username, password, otherUserId } = req.body;
    
    const user = await authenticate(username, password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (!otherUserId) {
        return res.status(400).json({ error: 'Missing otherUserId.' });
    }

    await MessageModel.loadMessages();
    const messages = MessageModel.getMessagesBetween(user.id, otherUserId);
    
    await MessageModel.markAsRead(user.id, otherUserId);

    const formattedMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp,
        fromMe: msg.fromId === user.id,
        read: msg.read
    }));

    res.json({ messages: formattedMessages });
}).post('/api/messages/send', async (req, res) => {
    await router.parse(req, res);
    const { username, password, toUserId, content } = req.body;
    
    const user = await authenticate(username, password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (!toUserId || !content) {
        return res.status(400).json({ error: 'Missing toUserId or content.' });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'Content cannot be empty.' });
    }

    if (content.length > MESSAGE.MAX) {
        return res.status(400).json({ error: `Message too long (max ${MESSAGE.MAX} characters).` });
    }

    const toUser = UserModel.getUserById(toUserId);
    if (!toUser) {
        return res.status(404).json({ error: 'User not found.' });
    }

    await MessageModel.loadMessages();
    const message = await MessageModel.createMessage(user.id, toUserId, content.trim());

    res.json({
        message: 'Message sent successfully.',
        messageData: {
            id: message.id,
            content: message.content,
            timestamp: message.timestamp,
            fromMe: true
        }
    });
}).post('/api/messages/unread-count', async (req, res) => {
    await router.parse(req, res);
    const { username, password } = req.body;
    
    const user = await authenticate(username, password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    await MessageModel.loadMessages();
    const unreadCount = MessageModel.getUnreadCount(user.id);

    res.json({ unreadCount });
});

export default router;
