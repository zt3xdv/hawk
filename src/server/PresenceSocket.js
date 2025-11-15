import UserModel from '../models/UserModel.js';

export default class PresenceSocket {
  constructor(socketServer) {
    this.socketServer = socketServer;
    this.wss = socketServer.route('/ws/presence');
    this.onlineUsers = new Map(); // userId -> { ws, username, lastSeen }

    this.wss.on('connection', (ws) => {
      let userId = null;
      let username = null;

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());

          if (data.type === 'auth') {
            const { username: authUsername, password } = data;
            
            if (!authUsername || !password) {
              ws.close();
              return;
            }

            await UserModel.loadUsers();
            const user = UserModel.getUserByUsername(authUsername);

            if (!user || user.password !== password) {
              ws.close();
              return;
            }

            userId = user.id;
            username = authUsername;

            this.onlineUsers.set(userId, {
              ws,
              username,
              lastSeen: Date.now()
            });

            ws.send(JSON.stringify({
              type: 'auth_success',
              message: 'Authenticated successfully'
            }));

          } else if (data.type === 'heartbeat') {
            if (userId && this.onlineUsers.has(userId)) {
              this.onlineUsers.get(userId).lastSeen = Date.now();
            }
          }
        } catch (error) {
          console.error('Error processing presence message:', error);
        }
      });

      ws.on('close', () => {
        if (userId) {
          this.onlineUsers.delete(userId);
        }
      });

      ws.on('error', (error) => {
        console.error('Presence WebSocket error:', error);
        if (userId) {
          this.onlineUsers.delete(userId);
        }
      });
    });

    // Clean up stale connections every 30 seconds
    setInterval(() => {
      const now = Date.now();
      for (const [userId, data] of this.onlineUsers.entries()) {
        if (now - data.lastSeen > 60000) { // 1 minute timeout
          data.ws.close();
          this.onlineUsers.delete(userId);
        }
      }
    }, 30000);
  }

  isUserOnlineWeb(userId) {
    return this.onlineUsers.has(userId);
  }

  getOnlineWebUsers() {
    return Array.from(this.onlineUsers.keys());
  }
}
