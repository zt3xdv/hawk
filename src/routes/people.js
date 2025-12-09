import { escapeHtml, getAuth, apiPost, qs, qsa } from '../game/utils/Utils.js';
import { API } from '../utils/Constants.js';
import Cache from '../utils/Cache.js';

const html = `
<div class="auth" id="people-container">
<div class="header">
  <h3><canv-icon id="people-icon"></canv-icon>People</h3>
  <span class="description">Search and manage your friends.</span>
  <div class="friends-actions">
    <button id="refreshBtn" class="friends-ghost">Refresh</button>
    <button id="closeBtn" class="friends-ghost" style="display:none">Close</button>
  </div>
</div>
<hr>
<aside class="friends-sidebar mini">
  <div class="friends-card">
    <div class="friends-send-row">
      <input id="searchUsername" class="friends-input" placeholder="Search username..." />
      <button id="searchBtn" class="friends-primary">Search</button>
    </div>
    <div id="searchResult" style="margin-top:8px"></div>
  </div>
</aside>

<section>
  <div class="friends-card">
    <div id="incomingPanel"></div>
    <div id="friendsPanel"></div>
    <div id="friendsPagination" style="margin-top:12px;display:flex;justify-content:center;gap:8px;align-items:center"></div>
  </div>
</section>
</div>
`;

function render(dom, mini = false, closeBtn = false) {
  const app = dom || document.getElementById('app');
  app.innerHTML = html;

  // Set icon data URLs
  document.getElementById('people-icon').src = Cache.getBlob('assets/icons/people.png').dataUrl;

  if (mini) {
    const container = document.getElementById('people-container');
    if (container) container.style.margin = '0 0';
  }

  if (closeBtn) {
    const closeBtnEl = document.getElementById('closeBtn');
    if (closeBtnEl) {
      closeBtnEl.style.display = 'inline-block';
      closeBtnEl.addEventListener('click', () => {
        if (typeof window.renderGame === 'function') {
          window.renderGame();
        }
      });
    }
  }

  const auth = getAuth();

  let allFriends = [];
  let allIncoming = [];
  let currentPage = 1;
  const itemsPerPage = 10;

async function loadAll() {
  if (!auth.username || !auth.password) {
    document.getElementById('friendsPanel').innerHTML = `<div class="friends-empty">Not authenticated. Please log in.</div>`;
    return;
  }

  const [fRes, rRes, pRes] = await Promise.allSettled([
    apiPost(API.friendsList, auth),
    apiPost(API.friendsRequests, auth),
    apiPost(API.friendsPending, auth)
  ]);

  const friends = (fRes.status === 'fulfilled' && fRes.value && fRes.value.friends) ? fRes.value.friends : [];
  const rVal = (rRes.status === 'fulfilled' && rRes.value) ? rRes.value : null;
  const pVal = (pRes.status === 'fulfilled' && pRes.value) ? pRes.value : null;

  let incoming = [];

  if (pVal) {
    if (Array.isArray(pVal.incoming)) {
      incoming = pVal.incoming;
    } else if (Array.isArray(pVal.pending)) {
      incoming = pVal.pending;
    }
  }

  allFriends = friends;
  allIncoming = incoming;
  currentPage = 1;

  renderIncoming(incoming);
  renderFriendsPage();
}

  function renderFriendsPage() {
    const panel = document.getElementById('friendsPanel');
    const paginationDiv = document.getElementById('friendsPagination');
    panel.innerHTML = '';
    paginationDiv.innerHTML = '';

    if (!Array.isArray(allFriends) || !allFriends.length) {
      panel.append(childEmpty('No friends yet.'));
      return;
    }

    const totalPages = Math.ceil(allFriends.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const pageItems = allFriends.slice(startIdx, endIdx);

    pageItems.forEach(f => panel.append(renderFriendRow(f)));

    if (totalPages > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'friends-ghost';
      prevBtn.textContent = 'Previous';
      prevBtn.disabled = currentPage === 1;
      prevBtn.addEventListener('click', () => {
        currentPage--;
        renderFriendsPage();
      });

      const pageInfo = document.createElement('span');
      pageInfo.style.color = 'rgba(255,255,255,0.7)';
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

      const nextBtn = document.createElement('button');
      nextBtn.className = 'friends-ghost';
      nextBtn.textContent = 'Next';
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.addEventListener('click', () => {
        currentPage++;
        renderFriendsPage();
      });

      paginationDiv.appendChild(prevBtn);
      paginationDiv.appendChild(pageInfo);
      paginationDiv.appendChild(nextBtn);
    }
  }

  async function renderIncoming(list) {
    const panel = document.getElementById('incomingPanel');
    panel.innerHTML = '';
    if (!Array.isArray(list) || !list.length) {
      return;
    }
    for (const r of list) {
      panel.append(await renderIncomingRow(r));
    }
  }

  function childEmpty(text) {
    const d = document.createElement('div');
    d.className = 'friends-empty';
    d.textContent = text;
    return d;
  }

  function renderFriendRow(f) {
    const wrapper = document.createElement('div');
    wrapper.className = 'friends-row';
    
    let statusClass = 'offline';
    let statusText = 'Offline';
    
    if (f.online === 'web') {
      statusClass = 'online-web';
      statusText = 'On web';
    } else if (f.online && f.online !== false) {
      statusClass = 'online';
      statusText = f.server ? f.server.name : 'Online';
    }
    
    const avatarUrl = f.avatar || `/api/pavatar/${f.id}`;
    
    wrapper.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex:1">
        <div class="friend-avatar-wrapper">
          <img src="${avatarUrl}" class="friend-avatar" />
          <span class="friend-status-dot ${statusClass}"></span>
        </div>
        <div>
          <div class="user-name-inline">
            <div class="friends-name">${escapeHtml(f.display_name || f.username || 'Unnamed')}</div>
            <div class="friends-meta">(@${escapeHtml(f.username)})</div>
          </div>
          <div class="friends-meta">${statusText}</div>
        </div>
      </div>
      <div class="friends-controls">
        <div class="friend-menu-wrapper">
          <button class="friend-menu-btn">⋮</button>
          <div class="friend-menu-dropdown">
            <button class="friend-menu-item open-dm-btn">Open DM</button>
            <button class="friend-menu-item remove-friend-btn">Remove friend</button>
          </div>
        </div>
      </div>
    `;
    
    const menuBtn = wrapper.querySelector('.friend-menu-btn');
    const menuDropdown = wrapper.querySelector('.friend-menu-dropdown');
    
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.friend-menu-dropdown').forEach(m => {
        if (m !== menuDropdown) m.classList.remove('active');
      });
      menuDropdown.classList.toggle('active');
    });
    
    wrapper.querySelector('.remove-friend-btn').addEventListener('click', async () => {
      menuDropdown.classList.remove('active');
      await removeFriend(f.username);
    });
    
    wrapper.querySelector('.open-dm-btn').addEventListener('click', () => {
      menuDropdown.classList.remove('active');
      if (window.router) {
        window.router.navigateTo(`/dms/${f.id}`);
      } else {
        window.location.href = `/dms/${f.id}`;
      }
    });
    
    return wrapper;
  }

  async function renderIncomingRow(r) {
    const wrapper = document.createElement('div');
    wrapper.className = 'friends-row incoming-request';
    const who = r.requesterId;
    const whoData = await apiPost("/api/auth/profile", { id: who });
    const whoName = whoData.username || "Unknown";
    const avatarUrl = whoData.game?.avatar || `/api/pavatar/${who}`;
    
    wrapper.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex:1">
        <div class="friend-avatar-wrapper">
          <img src="${avatarUrl}" class="friend-avatar" />
          <span class="friend-status-dot pending"></span>
        </div>
        <div>
          <div class="friends-name">${escapeHtml(whoData.display_name || whoName)}</div>
          <div class="friends-meta">@${escapeHtml(whoName)}</div>
          <div class="friends-meta" style="color:#f59e0b">Friend request</div>
        </div>
      </div>
      <div class="friends-controls">
        <button class="friends-primary accept-btn">Accept</button>
        <button class="friends-ghost deny-btn">Deny</button>
      </div>
    `;
    
    wrapper.querySelector('.accept-btn').addEventListener('click', async () => {
      await acceptRequest(r.id);
    });
    wrapper.querySelector('.deny-btn').addEventListener('click', async () => {
      await denyRequest(r.id);
    });
    
    return wrapper;
  }

  async function searchUser(username) {
    const resultDiv = document.getElementById('searchResult');
    if (!username) {
      resultDiv.innerHTML = '';
      return;
    }

    try {
      const userData = await apiPost("/api/auth/profile", { username });
      
      if (!userData || !userData.username) {
        resultDiv.innerHTML = '<div class="friends-empty">User not found.</div>';
        return;
      }

      const isFriend = allFriends.some(f => f.username === userData.username);
      const avatarUrl = userData.game?.avatar || `/api/pavatar/${userData.id}`;
      
      if (isFriend) {
        resultDiv.innerHTML = `
          <div class="friends-row">
            <div style="display:flex;align-items:center;gap:12px;flex:1">
              <div class="friend-avatar-wrapper">
                <img src="${avatarUrl}" class="friend-avatar" />
              </div>
              <div>
                <div class="friends-name">${escapeHtml(userData.display_name || userData.username)}</div>
                <div class="friends-meta">@${escapeHtml(userData.username)}</div>
                <div class="friends-meta" style="color:#4CAF50">Already a friend</div>
              </div>
            </div>
          </div>
        `;
      } else {
        resultDiv.innerHTML = `
          <div class="friends-row">
            <div style="display:flex;align-items:center;gap:12px;flex:1">
              <div class="friend-avatar-wrapper">
                <img src="${avatarUrl}" class="friend-avatar" />
              </div>
              <div>
                <div class="friends-name">${escapeHtml(userData.display_name || userData.username)}</div>
                <div class="friends-meta">@${escapeHtml(userData.username)}</div>
              </div>
            </div>
            <div class="friends-controls">
              <button id="sendRequestBtn" class="friends-primary">Send Request</button>
            </div>
          </div>
        `;

        document.getElementById('sendRequestBtn').addEventListener('click', async () => {
          await sendById(userData.username);
          resultDiv.innerHTML = '<div class="friends-empty">Request sent!</div>';
        });
      }
    } catch (error) {
      resultDiv.innerHTML = '<div class="friends-empty">Error searching user.</div>';
    }
  }

  async function sendById(username) {
    if (!username) return alert('Enter a username.');
    const payload = { ...auth, targetUsername: username };
    const res = await apiPost(API.friendsSend, payload);
    const out = res && (res.error || res.message || JSON.stringify(res));
    document.getElementById('searchResult').innerText = out || 'Sent';
    await loadAll();
  }

  async function acceptRequest(requestId) {
    if (!requestId) return;
    await apiPost(API.friendsAccept, { ...auth, requestId });
    await loadAll();
  }

  async function denyRequest(requestId) {
    if (!requestId) return;
    await apiPost(API.friendsDeny, { ...auth, requestId });
    await loadAll();
  }

  async function removeFriend(friendUsername) {
    if (!friendUsername) return;
    await apiPost(API.friendsRemove, { ...auth, friendUsername });
    await loadAll();
  }

  document.getElementById('searchBtn').addEventListener('click', async () => {
    const username = document.getElementById('searchUsername').value.trim();
    await searchUser(username);
  });

  document.getElementById('searchUsername').addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      const username = document.getElementById('searchUsername').value.trim();
      await searchUser(username);
    }
  });

  document.getElementById('refreshBtn').addEventListener('click', loadAll);

  document.addEventListener('click', () => {
    document.querySelectorAll('.friend-menu-dropdown').forEach(m => {
      m.classList.remove('active');
    });
  });

  loadAll();
}

export const options = { title: "People", auth: true, description: "Manage friends, and send game invites." };

export { html, render };
