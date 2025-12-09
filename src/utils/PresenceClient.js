class PresenceClient {
  constructor() {
    this.ws = null;
    this.heartbeatInterval = null;
    this.reconnectTimeout = null;
    this.isAuthenticated = false;
  }

  connect() {
    const username = localStorage.getItem('username');
    const password = localStorage.getItem('password');

    if (!username || !password) {
      return;
    }

    this.disconnect();

    try {
      this.ws = new WebSocket("/ws/presence");

      this.ws.onopen = () => {
        this.ws.send(JSON.stringify({
          type: 'auth',
          username,
          password
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'auth_success') {
            this.isAuthenticated = true;
            this.startHeartbeat();
          }
        } catch (error) {
          console.error('Error processing presence message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Presence WebSocket error:', error);
      };

      this.ws.onclose = () => {
        this.isAuthenticated = false;
        this.stopHeartbeat();
        
        this.reconnectTimeout = setTimeout(() => {
          if (localStorage.getItem('username')) {
            this.connect();
          }
        }, 5000);
      };
    } catch (error) {
      console.error('Error creating presence WebSocket:', error);
    }
  }

  disconnect() {
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isAuthenticated = false;
  }

  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

const presenceClient = new PresenceClient();

if (localStorage.getItem('loggedIn') === 'true') {
  presenceClient.connect();
}

window.addEventListener('storage', (e) => {
  if (e.key === 'loggedIn') {
    if (e.newValue === 'true') {
      presenceClient.connect();
    } else {
      presenceClient.disconnect();
    }
  }
});

window.addEventListener('beforeunload', () => {
  presenceClient.disconnect();
});

export default presenceClient;
