import { escapeHtml, getAuth, apiPost, qs, qsa } from '../game/utils/Utils.js';
import { API } from '../utils/Constants.js';
import Cache from '../utils/Cache.js';

const html = `
<div class="auth" id="people-container">
<div class="header">
  <h3><canv-icon src="${Cache.getBlob('assets/icons/people.png').dataUrl}"></canv-icon>People</h3>
  <span class="description">Search friends and manage friend requests.</span>
          <div class="friends-actions">
            <button id="refreshBtn" class="friends-ghost">Refresh</button>
            <button id="closeBtn" class="friends-ghost" style="display:none">Close</button>
          </div>
</div>
<hr>
    <aside class="friends-sidebar mini">
      <div class="friends-card" style="padding-bottom:10px">
        <div style="margin-top:10px">
          <div class="small" style="color:rgba(255,255,255,0.7)">Search friends by username</div>
          <div class="friends-send-row">
            <input id="searchUsername" class="friends-input" placeholder="Search username..." />
            <button id="searchBtn" class="friends-primary">Search</button>
          </div>
          <div id="searchResult" class="friends-empty" style="margin-top:8px"></div>
        </div>
      </div>

      <div class="friends-card">
        <div id="accountInfo" style="margin-top:8px;color:rgba(255,255,255,0.8)"></div>
      </div>
    </aside>

    <section>
      <div id="incomingSection" class="friends-card" style="margin-bottom:16px">
        <h4 style="margin:0 0 12px 0;color:rgba(255,255,255,0.9)">Incoming Requests</h4>
        <div id="incomingPanel"></div>
      </div>

      <div class="friends-card">
        <h4 style="margin:0 0 12px 0;color:rgba(255,255,255,0.9)">Friends</h4>
        <div id="friendsPanel"></div>
        <div id="friendsPagination" style="margin-top:12px;display:flex;justify-content:center;gap:8px;align-items:center"></div>
      </div>
    </section>
    </div>
`;

function render(dom, mini = false, closeBtn = false) {
  const app = dom || document.getElementById('app');
  app.innerHTML = html;

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
  const accountInfo = document.getElementById('accountInfo');
  if (!auth.username || !auth.password) {
    accountInfo.innerText = 'Not authenticated. Please log in.';
  } else {
    accountInfo.innerHTML = `<div><strong>@${escapeHtml(auth.username)}</strong></div><div class="accent small">Your username</div>`;
  }

  let allFriends = [];
  let allIncoming = [];
  let currentPage = 1;
  const itemsPerPage = 10;

async function loadAll() {
  setLoadingStates();
  if (!auth.username || !auth.password) {
    showEmptyStates('Not authenticated. Please log in.');
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

  function setLoadingStates() {
    document.getElementById('friendsPanel').innerHTML = `<div class="friends-empty">Loading friends...</div>`;
    document.getElementById('incomingPanel').innerHTML = `<div class="friends-empty">Loading incoming...</div>`;
  }

  function showEmptyStates(msg) {
    document.getElementById('friendsPanel').innerHTML = `<div class="friends-empty">${escapeHtml(msg)}</div>`;
    document.getElementById('incomingPanel').innerHTML = `<div class="friends-empty">${escapeHtml(msg)}</div>`;
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
      panel.append(childEmpty('No incoming requests.'));
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
    const wrapper = document.createElement('div'); wrapper.className = 'friends-row';
    const left = document.createElement('div');
    left.innerHTML = `<div class="friends-name">${escapeHtml(f.display_name || f.username || 'Unnamed')}</div><div class="friends-meta">@${escapeHtml(f.username)} · ID ${escapeHtml(String(f.id))}</div>`;
    const controls = document.createElement('div'); controls.className = 'friends-controls';
    const removeBtn = document.createElement('button'); removeBtn.className = 'friends-ghost'; removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', async ()=>{ await removeFriend(f.username); });
    controls.appendChild(removeBtn);
    wrapper.appendChild(left); wrapper.appendChild(controls);
    return wrapper;
  }

  async function renderIncomingRow(r) {
    const wrapper = document.createElement('div'); wrapper.className = 'friends-row';
    const left = document.createElement('div');
    const who = r.requesterId;
    const whoData = await apiPost("/api/auth/profile", { id: who });
    const whoName = whoData.username || "Unknown";
    
    left.innerHTML = `<div class="friends-name">From ${escapeHtml(String(whoName))}</div><div class="friends-meta">Request ID: ${escapeHtml(String(r.id || ''))}</div>`;
    const controls = document.createElement('div'); controls.className = 'friends-controls';
    const acceptBtn = document.createElement('button'); acceptBtn.className = 'friends-primary'; acceptBtn.textContent = 'Accept';
    const denyBtn = document.createElement('button'); denyBtn.className = 'friends-ghost'; denyBtn.textContent = 'Deny';
    acceptBtn.addEventListener('click', async ()=>{ await acceptRequest(r.id); });
    denyBtn.addEventListener('click', async ()=>{ await denyRequest(r.id); });
    controls.appendChild(acceptBtn); controls.appendChild(denyBtn);
    wrapper.appendChild(left); wrapper.appendChild(controls);
    return wrapper;
  }

  async function searchUser(username) {
    const resultDiv = document.getElementById('searchResult');
    if (!username) {
      resultDiv.innerHTML = '';
      return;
    }

    resultDiv.innerHTML = '<div class="friends-empty">Searching...</div>';

    try {
      const userData = await apiPost("/api/auth/profile", { username });
      
      if (!userData || !userData.username) {
        resultDiv.innerHTML = '<div class="friends-empty">User not found.</div>';
        return;
      }

      const isFriend = allFriends.some(f => f.username === userData.username);
      
      if (isFriend) {
        resultDiv.innerHTML = `
          <div class="friends-row">
            <div>
              <div class="friends-name">${escapeHtml(userData.display_name || userData.username)}</div>
              <div class="friends-meta">@${escapeHtml(userData.username)} · Already a friend</div>
            </div>
          </div>
        `;
      } else {
        resultDiv.innerHTML = `
          <div class="friends-row">
            <div>
              <div class="friends-name">${escapeHtml(userData.display_name || userData.username)}</div>
              <div class="friends-meta">@${escapeHtml(userData.username)}</div>
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

  loadAll();
}

export const options = { title: "People", auth: true, description: "Manage friends, and send game invites." };

export { html, render };
