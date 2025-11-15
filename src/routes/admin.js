import { apiPost } from '../game/utils/Utils.js';
import { escapeHtml } from '../game/utils/Utils.js';
import Cache from '../utils/Cache.js';

const html = `
<div class="auth">
  <div class="header">
    <h3><canv-icon id="admin-icon"></canv-icon>Admin Panel</h3>
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
          <label class="checkbox-label">
            <input type="checkbox" name="role" value="developer"> Developer
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

  // Set icon data URLs
  document.getElementById('admin-icon').src = Cache.getBlob('assets/icons/settings.png').dataUrl;
  
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

export const options = {
  title: 'Admin Panel',
  auth: true,
  superadmin: true,
  description: 'Manage users and permissions'
};

export { html, render };
