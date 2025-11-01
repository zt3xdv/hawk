import { apiPost } from '../game/utils/Utils.js';
import { escapeHtml } from '../game/utils/Utils.js';
import Cache from '../utils/Cache.js';

const html = `
<div class="auth">
  <div class="header">
    <h3><canv-icon src="${Cache.getBlob('assets/icons/settings.png').dataUrl}"></canv-icon>Admin Panel</h3>
    <span class="description">Manage users and permissions</span>
  </div>
  <hr>
  
  <div class="admin-stats">
    <div class="stat-card">
      <div class="stat-number" id="totalUsers">-</div>
      <div class="stat-label">Total Users</div>
    </div>
    <div class="stat-card">
      <div class="stat-number" id="totalMods">-</div>
      <div class="stat-label">Moderators</div>
    </div>
    <div class="stat-card">
      <div class="stat-number" id="totalAdmins">-</div>
      <div class="stat-label">Admins</div>
    </div>
  </div>

  <div class="admin-section">
    <h3>User Management</h3>
    
    <div class="search-bar">
      <input type="text" id="userSearch" placeholder="Search users by username...">
      <button id="searchBtn" class="btn">Search</button>
      <button id="clearSearchBtn" class="btn btn-secondary">Clear</button>
    </div>

    <div id="userList" class="user-list">
      <p class="loading">Loading users...</p>
    </div>

    <div id="pagination" class="pagination-controls">
      <button id="prevBtn" class="btn btn-secondary">Previous</button>
      <span id="pageInfo">Page 1</span>
      <button id="nextBtn" class="btn btn-secondary">Next</button>
    </div>
  </div>
</div>

<div id="editUserModal" class="modal-overlay hidden">
  <div class="modal-dialog">
    <div class="modal-header">
      <h3>Edit User</h3>
      <button id="closeEditModal" class="close-btn">&times;</button>
    </div>
    <div class="modal-body">
      <div id="editUserInfo"></div>
      
      <div class="form-group">
        <label>Display Name</label>
        <input type="text" id="editDisplayName" class="input">
      </div>
      
      <div class="form-group">
        <label>Username</label>
        <input type="text" id="editUsername" class="input" disabled>
      </div>
      
      <div class="form-group">
        <label>Bio</label>
        <textarea id="editBio" class="input" rows="3"></textarea>
      </div>
      
      <div class="form-group">
        <label>Avatar URL</label>
        <input type="text" id="editAvatar" class="input" placeholder="https://...">
        <small>Leave empty to remove avatar</small>
      </div>
      
      <div class="form-group">
        <label>Roles</label>
        <div class="role-checkboxes">
          <label class="checkbox-label">
            <input type="checkbox" name="role" value="moderator"> Moderator
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="role" value="admin"> Admin
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="role" value="superadmin"> Superadmin
          </label>
        </div>
      </div>
      
      <button id="saveUserBtn" class="btn btn-primary">Save Changes</button>
    </div>
  </div>
</div>
`;

async function render() {
  const app = document.getElementById('app');
  app.innerHTML = html;

  addStyles();

  const username = localStorage.getItem('username');
  const password = localStorage.getItem('password');

  if (!username || !password) {
    app.innerHTML = '<div class="auth"><p class="error">Not authenticated</p></div>';
    return;
  }

  let allUsers = [];
  let filteredUsers = [];
  let currentPage = 1;
  const usersPerPage = 10;
  let currentEditUser = null;

  async function loadUsers() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '<p class="loading">Loading users...</p>';

    try {
      const response = await apiPost('/api/admin/users', { username, password });
      
      if (response.error) {
        userList.innerHTML = `<p class="error">${escapeHtml(response.error)}</p>`;
        return;
      }

      allUsers = response.users || [];
      filteredUsers = allUsers;
      updateStats();
      currentPage = 1;
      displayUsers();
    } catch (error) {
      userList.innerHTML = `<p class="error">${escapeHtml(error.message || 'Error loading users')}</p>`;
    }
  }

  function updateStats() {
    document.getElementById('totalUsers').textContent = allUsers.length;
    
    const mods = allUsers.filter(u => u.roles && u.roles.includes('moderator')).length;
    const admins = allUsers.filter(u => u.roles && (u.roles.includes('admin') || u.roles.includes('superadmin'))).length;
    
    document.getElementById('totalMods').textContent = mods;
    document.getElementById('totalAdmins').textContent = admins;
  }

  function displayUsers() {
    const userList = document.getElementById('userList');
    
    if (filteredUsers.length === 0) {
      userList.innerHTML = '<p class="empty">No users found</p>';
      updatePagination();
      return;
    }

    const startIdx = (currentPage - 1) * usersPerPage;
    const endIdx = startIdx + usersPerPage;
    const pageUsers = filteredUsers.slice(startIdx, endIdx);

    userList.innerHTML = pageUsers.map(user => `
      <div class="user-card" data-user-id="${escapeHtml(user.id)}">
        <div class="user-info">
          <div class="user-avatar">
            ${user.avatar ? `<img src="${escapeHtml(user.avatar)}" alt="Avatar">` : '<div class="avatar-placeholder">?</div>'}
          </div>
          <div class="user-details">
            <h3>${escapeHtml(user.displayName || user.username)}</h3>
            <p class="user-username">@${escapeHtml(user.username)}</p>
            <p class="user-id">ID: ${escapeHtml(user.id)}</p>
          </div>
        </div>
        <div class="user-roles">
          ${user.roles && user.roles.length > 0 
            ? user.roles.map(role => `<span class="role-badge ${role}">${escapeHtml(role)}</span>`).join('') 
            : '<span class="role-badge no-role">No roles</span>'}
        </div>
        <div class="user-actions">
          <button class="btn btn-small edit-user-btn" data-user-id="${escapeHtml(user.id)}">Edit</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.dataset.userId;
        const user = allUsers.find(u => u.id === userId);
        if (user) openEditModal(user);
      });
    });

    updatePagination();
  }

  function updatePagination() {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1} (${filteredUsers.length} users)`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  function openEditModal(user) {
    currentEditUser = user;
    const modal = document.getElementById('editUserModal');
    
    document.getElementById('editDisplayName').value = user.displayName || '';
    document.getElementById('editUsername').value = user.username || '';
    document.getElementById('editBio').value = user.bio || '';
    document.getElementById('editAvatar').value = user.avatar || '';

    const checkboxes = modal.querySelectorAll('input[name="role"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = user.roles && user.roles.includes(checkbox.value);
    });

    modal.classList.remove('hidden');
  }

  function closeEditModal() {
    document.getElementById('editUserModal').classList.add('hidden');
    currentEditUser = null;
  }

  async function saveUser() {
    if (!currentEditUser) return;

    const displayName = document.getElementById('editDisplayName').value;
    const bio = document.getElementById('editBio').value;
    const avatar = document.getElementById('editAvatar').value;
    
    const checkboxes = document.querySelectorAll('input[name="role"]:checked');
    const roles = Array.from(checkboxes).map(cb => cb.value);

    try {
      const response = await apiPost('/api/admin/edit-user', {
        username,
        password,
        targetId: currentEditUser.id,
        displayName,
        bio,
        avatar,
        roles
      });

      if (response.error) {
        alert('Error: ' + response.error);
        return;
      }

      alert('User updated successfully!');
      closeEditModal();
      loadUsers();
    } catch (error) {
      alert('Error updating user: ' + error.message);
    }
  }

  function searchUsers() {
    const search = document.getElementById('userSearch').value.toLowerCase();
    if (!search) {
      filteredUsers = allUsers;
    } else {
      filteredUsers = allUsers.filter(u => 
        u.username.toLowerCase().includes(search) || 
        (u.displayName || '').toLowerCase().includes(search) ||
        u.id.toLowerCase().includes(search)
      );
    }
    currentPage = 1;
    displayUsers();
  }

  document.getElementById('searchBtn').addEventListener('click', searchUsers);
  document.getElementById('clearSearchBtn').addEventListener('click', () => {
    document.getElementById('userSearch').value = '';
    searchUsers();
  });

  document.getElementById('userSearch').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') searchUsers();
  });

  document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      displayUsers();
    }
  });

  document.getElementById('nextBtn').addEventListener('click', () => {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      displayUsers();
    }
  });

  document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
  document.getElementById('saveUserBtn').addEventListener('click', saveUser);

  document.getElementById('editUserModal').addEventListener('click', (e) => {
    if (e.target.id === 'editUserModal') {
      closeEditModal();
    }
  });

  loadUsers();
}

function addStyles() {
  if (document.getElementById('admin-page-styles')) return;

  const style = document.createElement('style');
  style.id = 'admin-page-styles';
  style.textContent = `
    .admin-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }

    .stat-number {
      font-size: 32px;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 13px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .admin-section {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
    }

    .admin-section h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: #fff;
    }

    .search-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }

    .search-bar input {
      flex: 1;
      padding: 10px 15px;
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--text-color);
      font-size: 14px;
    }

    .search-bar input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .user-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .user-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      transition: all 0.2s;
    }

    .user-card:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--border-hover);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .user-avatar {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      font-size: 24px;
      color: var(--muted);
    }

    .user-details {
      flex: 1;
      min-width: 0;
    }

    .user-details h3 {
      margin: 0 0 4px 0;
      font-size: 16px;
      color: #fff;
    }

    .user-username {
      margin: 0 0 2px 0;
      font-size: 13px;
      color: var(--muted);
    }

    .user-id {
      margin: 0;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.3);
      font-family: monospace;
    }

    .user-roles {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .role-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .role-badge.moderator {
      background: rgba(255, 193, 7, 0.2);
      color: #ffc107;
    }

    .role-badge.admin {
      background: rgba(156, 39, 176, 0.2);
      color: #9c27b0;
    }

    .role-badge.superadmin {
      background: rgba(244, 67, 54, 0.2);
      color: #f44336;
    }

    .role-badge.no-role {
      background: rgba(255, 255, 255, 0.05);
      color: var(--muted);
    }

    .user-actions {
      display: flex;
      gap: 8px;
    }

    .btn-small {
      padding: 8px 16px;
      font-size: 13px;
    }

    .btn-primary {
      background: var(--primary-color);
      color: #fff;
    }

    .btn-primary:hover {
      background: var(--primary-hover);
    }

    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-color);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      padding: 10px 0;
    }

    .pagination-controls button {
      padding: 8px 16px;
      font-size: 13px;
    }

    #pageInfo {
      font-size: 13px;
      color: var(--muted);
      min-width: 200px;
      text-align: center;
    }

    .loading, .empty, .error {
      text-align: center;
      padding: 40px 20px;
      color: var(--muted);
    }

    .error {
      color: var(--danger);
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }

    .modal-overlay.hidden {
      display: none;
    }

    .modal-dialog {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h3 {
      margin: 0;
      color: #fff;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 28px;
      color: var(--muted);
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: var(--text-color);
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }

    .form-group small {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: var(--muted);
    }

    .input {
      width: 100%;
      padding: 10px 15px;
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--text-color);
      font-size: 14px;
      font-family: inherit;
    }

    .input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    textarea.input {
      resize: vertical;
      min-height: 80px;
    }

    .role-checkboxes {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: normal;
    }

    .checkbox-label:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .user-card {
        flex-direction: column;
        align-items: stretch;
      }

      .user-actions {
        width: 100%;
      }

      .btn-small {
        width: 100%;
      }

      .admin-stats {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}

export const options = {
  title: 'Admin Panel',
  auth: true,
  superadmin: true,
  description: 'Manage users and permissions'
};

export { html, render };
