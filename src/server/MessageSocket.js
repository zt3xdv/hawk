import UserModel from '../models/UserModel.js';

export default class MessageSocket {
  constructor(socketServer) {
    this.socketServer = socketServer;
    this.clients = new Map();
    this.wss = this.socketServer.route('/ws/messages');

    this.wss.on('connection', (ws) => {
      let userId = null;

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === 'auth') {
            const { username, password } = message;
            if (!username || !password) {
              ws.close();
              return;
            }

            await UserModel.loadUsers();
            const user = UserModel.getUserByUsername(username.toLowerCase().trim());
            
            if (!user || user.password !== password) {
              ws.close();
              return;
            }

            userId = user.id;
            this.clients.set(userId, ws);

            ws.send(JSON.stringify({
              type: 'auth_success',
              userId: user.id
            }));
          }

          if (message.type === 'new_message' && userId) {
            const { toUserId, message: messageData } = message;
            const recipientWs = this.clients.get(toUserId);

            if (recipientWs && recipientWs.readyState === 1) {
              recipientWs.send(JSON.stringify({
                type: 'new_message',
                fromUserId: userId,
                message: messageData
              }));
            }
          }

          if (message.type === 'mark_read' && userId) {
            const { otherUserId, messageIds } = message;
            const recipientWs = this.clients.get(otherUserId);

            if (recipientWs && recipientWs.readyState === 1) {
              recipientWs.send(JSON.stringify({
                type: 'messages_read',
                readByUserId: userId,
                messageIds
              }));
            }
          }

          if (message.type === 'viewing_chat' && userId) {
            const { otherUserId } = message;
            const recipientWs = this.clients.get(otherUserId);

            if (recipientWs && recipientWs.readyState === 1) {
              recipientWs.send(JSON.stringify({
                type: 'user_viewing',
                userId
              }));
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        if (userId) {
          this.clients.delete(userId);
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }
}
