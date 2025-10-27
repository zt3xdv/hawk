import fs from 'fs/promises';
import { uuid } from '../utils/Utils.js';

class MessageModel {
    static messages = [];
    static DATA_PATH = './data/messages.json';

    constructor(id, fromId, toId, content, timestamp, read = false) {
        this.id = id;
        this.fromId = fromId;
        this.toId = toId;
        this.content = content;
        this.timestamp = timestamp;
        this.read = read;
    }

    static async loadMessages() {
        try {
            const data = await fs.readFile(this.DATA_PATH, 'utf8');
            const jsonData = JSON.parse(data);
            this.messages = jsonData.map(msg => new MessageModel(
                msg.id,
                msg.from_id,
                msg.to_id,
                msg.content,
                msg.timestamp,
                msg.read
            ));
        } catch (err) {
            if (err.code === 'ENOENT') {
                this.messages = [];
                await this.saveMessages();
            } else {
                console.error('Error loading messages from file:', err);
            }
        }
    }

    static async saveMessages() {
        try {
            const jsonData = this.messages.map(msg => ({
                id: msg.id,
                from_id: msg.fromId,
                to_id: msg.toId,
                content: msg.content,
                timestamp: msg.timestamp,
                read: msg.read,
            }));
            await fs.writeFile(this.DATA_PATH, JSON.stringify(jsonData, null, 2));
        } catch (error) {
            console.error('Error saving messages to file:', error);
        }
    }

    static async createMessage(fromId, toId, content) {
        const newMessage = new MessageModel(
            uuid(),
            fromId,
            toId,
            content,
            Date.now(),
            false
        );
        this.messages.push(newMessage);
        await this.saveMessages();
        return newMessage;
    }

    static getConversations(userId) {
        const conversations = new Map();
        
        this.messages.forEach(msg => {
            if (msg.fromId === userId || msg.toId === userId) {
                const otherUserId = msg.fromId === userId ? msg.toId : msg.fromId;
                
                if (!conversations.has(otherUserId)) {
                    conversations.set(otherUserId, {
                        userId: otherUserId,
                        lastMessage: msg,
                        unreadCount: 0
                    });
                } else {
                    const conv = conversations.get(otherUserId);
                    if (msg.timestamp > conv.lastMessage.timestamp) {
                        conv.lastMessage = msg;
                    }
                }
                
                if (msg.toId === userId && !msg.read) {
                    const conv = conversations.get(otherUserId);
                    conv.unreadCount++;
                }
            }
        });

        return Array.from(conversations.values())
            .sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
    }

    static getMessagesBetween(userId1, userId2) {
        return this.messages
            .filter(msg =>
                (msg.fromId === userId1 && msg.toId === userId2) ||
                (msg.fromId === userId2 && msg.toId === userId1)
            )
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    static async markAsRead(userId, otherUserId) {
        let modified = false;
        this.messages.forEach(msg => {
            if (msg.toId === userId && msg.fromId === otherUserId && !msg.read) {
                msg.read = true;
                modified = true;
            }
        });
        if (modified) {
            await this.saveMessages();
        }
    }

    static getUnreadCount(userId) {
        return this.messages.filter(msg => msg.toId === userId && !msg.read).length;
    }
}

export default MessageModel;
