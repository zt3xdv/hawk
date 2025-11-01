import { escapeHtml, apiPost } from '../game/utils/Utils.js';
import Cache from '../utils/Cache.js';

const html = `
  <div class="dms-container">
    <div class="dms-header">
      <h2>Direct Messages</h2>
      <button class="btn btn-primary" id="new-conversation">
        <canv-icon src="${Cache.getBlob('assets/icons/createintegration.png').dataUrl}"></canv-icon>
        New Conversation
      </button>
    </div>
    <div id="conversations-list" class="conversations-list">
      <div class="loading">
        <span class="loader"></span> Loading conversations...
      </div>
    </div>
  </div>
`;

function render() {
  const app = document.getElementById('app');
  app.innerHTML = html;

  const conversationsList = document.getElementById('conversations-list');
  const newConversationBtn = document.getElementById('new-conversation');

  async function loadConversations() {
    try {
      const username = localStorage.getItem('username');
      const password = localStorage.getItem('password');

      if (!username || !password) {
        conversationsList.innerHTML = '<div class="error">Please log in first.</div>';
        return;
      }

      const response = await apiPost('/api/messages/conversations', {
        username,
        password
      });

      if (response.conversations && response.conversations.length > 0) {
        conversationsList.innerHTML = '';
        response.conversations.forEach(conv => {
          const convEl = createConversationElement(conv);
          conversationsList.appendChild(convEl);
        });
      } else {
        conversationsList.innerHTML = '<div class="empty-state">No conversations yet. Start a new conversation!</div>';
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      conversationsList.innerHTML = '<div class="error">Failed to load conversations.</div>';
    }
  }

  function createConversationElement(conv) {
    const div = document.createElement('div');
    div.className = 'conversation-item' + (conv.unreadCount > 0 ? ' unread' : '');
    
    const timeStr = formatTime(conv.lastMessage.timestamp);
    const messagePreview = conv.lastMessage.fromMe 
      ? `You: ${conv.lastMessage.content}` 
      : conv.lastMessage.content;

    div.innerHTML = `
      <div class="conversation-avatar">
        <img src="/api/pavatar/${conv.userId}" alt="${escapeHtml(conv.displayName)}">
      </div>
      <div class="conversation-info">
        <div class="conversation-header">
          <span class="conversation-name">${escapeHtml(conv.displayName)}</span>
          <span class="conversation-time">${timeStr}</span>
        </div>
        <div class="conversation-preview">
          ${escapeHtml(messagePreview.substring(0, 100))}${messagePreview.length > 100 ? '...' : ''}
        </div>
      </div>
      ${conv.unreadCount > 0 ? `<div class="unread-badge">${conv.unreadCount}</div>` : ''}
    `;

    div.addEventListener('click', () => {
      window.router.navigateTo(`/dms/${conv.userId}`);
    });

    return div;
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  }

  newConversationBtn.addEventListener('click', () => {
    showNewConversationModal();
  });

  async function showNewConversationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>New Conversation</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="friends-list-header">
            <h4>Your Friends</h4>
          </div>
          <div id="friends-list-container">
            <div class="loading">
              <span class="loader"></span> Loading friends...
            </div>
          </div>
          <div class="pagination-controls" id="pagination-controls" style="display: none;">
            <button class="btn btn-secondary" id="prev-page" disabled>Previous</button>
            <span id="page-info">Page 1</span>
            <button class="btn btn-secondary" id="next-page">Next</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancel-modal">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('#cancel-modal');
    const friendsListContainer = modal.querySelector('#friends-list-container');
    const paginationControls = modal.querySelector('#pagination-controls');
    const prevPageBtn = modal.querySelector('#prev-page');
    const nextPageBtn = modal.querySelector('#next-page');
    const pageInfo = modal.querySelector('#page-info');

    let allFriends = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    const closeModal = () => {
      modal.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    async function loadFriends() {
      try {
        const username = localStorage.getItem('username');
        const password = localStorage.getItem('password');

        if (!username || !password) {
          friendsListContainer.innerHTML = '<div class="error">Please log in first.</div>';
          return;
        }

        const response = await apiPost('/api/friends/list', {
          username,
          password
        });

        allFriends = response.friends || [];
        
        if (allFriends.length === 0) {
          friendsListContainer.innerHTML = '<div class="empty-state">No friends yet. Add some friends first!</div>';
          return;
        }

        renderFriendsPage();
      } catch (error) {
        console.error('Error loading friends:', error);
        friendsListContainer.innerHTML = '<div class="error">Failed to load friends.</div>';
      }
    }

    function renderFriendsPage() {
      const totalPages = Math.ceil(allFriends.length / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const friendsToShow = allFriends.slice(startIndex, endIndex);

      friendsListContainer.innerHTML = '';
      
      friendsToShow.forEach(friend => {
        const friendItem = document.createElement('div');
        friendItem.className = 'friend-item';
        friendItem.innerHTML = `
          <div class="friend-info">
            <img src="/api/pavatar/${friend.id}" alt="${escapeHtml(friend.display_name)}" class="friend-avatar">
            <div class="friend-details">
              <div class="friend-name">${escapeHtml(friend.display_name)}</div>
              <div class="friend-username">@${escapeHtml(friend.username)}</div>
            </div>
          </div>
          <button class="btn btn-primary btn-start-chat" data-user-id="${friend.id}">
            Start Chat
          </button>
        `;
        
        const startChatBtn = friendItem.querySelector('.btn-start-chat');
        startChatBtn.addEventListener('click', () => {
          closeModal();
          window.router.navigateTo(`/dms/${friend.id}`);
        });

        friendsListContainer.appendChild(friendItem);
      });

      if (totalPages > 1) {
        paginationControls.style.display = 'flex';
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
      } else {
        paginationControls.style.display = 'none';
      }
    }

    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderFriendsPage();
      }
    });

    nextPageBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(allFriends.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderFriendsPage();
      }
    });

    loadFriends();
  }

  loadConversations();
}

export const options = { title: "Messages", auth: true, description: "Send and receive direct messages with other users." };

export { html, render };
