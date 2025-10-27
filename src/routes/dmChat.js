import { escapeHtml, apiPost } from '../game/utils/Utils.js';
import Cache from '../utils/Cache.js';

export function renderDmChat(userId) {
  const app = document.getElementById('app');
  app.classList.add('no-scroll');
  app.innerHTML = `
    <div class="dm-chat-container">
      <div class="dm-chat-header">
        <button class="btn-back" id="back-to-dms">
          <canv-icon src="${Cache.getBlob('assets/icons/arrowleft.png').dataUrl}"></canv-icon>
        </button>
        <div class="dm-chat-user-info">
          <img class="dm-chat-avatar" id="chat-avatar" src="/api/pavatar/${userId}" alt="User">
          <div>
            <div class="dm-chat-username" id="chat-username">Loading...</div>
            <div class="dm-chat-status">Online</div>
          </div>
        </div>
      </div>
      <div class="dm-chat-messages" id="chat-messages">
        <div class="loading">
          <span class="loader"></span> Loading messages...
        </div>
      </div>
      <div class="dm-chat-input-container">
        <textarea 
          id="message-input" 
          class="dm-chat-input" 
          placeholder="Type a message..."
          rows="1"
        ></textarea>
        <button class="btn btn-primary" id="send-message">
          <canv-icon src="${Cache.getBlob('assets/icons/send.png').dataUrl}"></canv-icon>
          Send
        </button>
      </div>
    </div>
  `;

  const backBtn = document.getElementById('back-to-dms');
  const messagesContainer = document.getElementById('chat-messages');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-message');
  const chatUsername = document.getElementById('chat-username');

  let messages = [];
  let otherUser = null;
  let ws = null;

  backBtn.addEventListener('click', () => {
    if (ws) ws.close();
    app.classList.remove('no-scroll');
    window.router.navigateTo('/dms');
  });

  async function loadUserInfo() {
    try {
      const response = await apiPost('/api/auth/profile', { id: userId });
      if (response.id) {
        otherUser = response;
        chatUsername.textContent = response.displayName;
      } else {
        chatUsername.textContent = 'Unknown User';
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      chatUsername.textContent = 'Unknown User';
    }
  }

  async function loadMessages() {
    try {
      const username = localStorage.getItem('username');
      const password = localStorage.getItem('password');

      if (!username || !password) {
        messagesContainer.innerHTML = '<div class="error">Please log in first.</div>';
        return;
      }

      const response = await apiPost('/api/messages/get', {
        username,
        password,
        otherUserId: userId
      });

      messages = response.messages || [];
      renderMessages();
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
      messagesContainer.innerHTML = '<div class="error">Failed to load messages.</div>';
    }
  }

  function renderMessages() {
    if (messages.length === 0) {
      messagesContainer.innerHTML = '<div class="empty-state">No messages yet. Say hi!</div>';
      return;
    }

    messagesContainer.innerHTML = '';
    messages.forEach(msg => {
      const msgEl = createMessageElement(msg);
      messagesContainer.appendChild(msgEl);
    });
  }

  function createMessageElement(msg) {
    const div = document.createElement('div');
    div.className = 'message' + (msg.fromMe ? ' message-sent' : ' message-received');
    
    const timeStr = formatTime(msg.timestamp);
    
    div.innerHTML = `
      <div class="message-content">
        ${escapeHtml(msg.content)}
      </div>
      <div class="message-time">${timeStr}</div>
    `;

    return div;
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
  }

  async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;

    try {
      const username = localStorage.getItem('username');
      const password = localStorage.getItem('password');

      sendBtn.disabled = true;
      messageInput.disabled = true;

      const response = await apiPost('/api/messages/send', {
        username,
        password,
        toUserId: userId,
        content
      });

      if (response.messageData) {
        messages.push(response.messageData);
        renderMessages();
        scrollToBottom();
        messageInput.value = '';
        
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'new_message',
            toUserId: userId,
            message: response.messageData
          }));
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      sendBtn.disabled = false;
      messageInput.disabled = false;
      messageInput.focus();
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
  });

  function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/messages`;
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      const username = localStorage.getItem('username');
      const password = localStorage.getItem('password');
      
      ws.send(JSON.stringify({
        type: 'auth',
        username,
        password
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message' && data.fromUserId === userId) {
          messages.push({
            id: data.message.id,
            content: data.message.content,
            timestamp: data.message.timestamp,
            fromMe: false,
            read: true
          });
          renderMessages();
          scrollToBottom();
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(() => {
        if (window.location.pathname.startsWith('/dms/')) {
          connectWebSocket();
        }
      }, 5000);
    };
  }

  loadUserInfo();
  loadMessages();
  connectWebSocket();
}
