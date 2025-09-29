import { escapeHtml, getAuth, apiPost, qs, qsa } from '../game/utils/Utils.js';
import { API } from '../utils/Constants.js';

export function renderPeople(dom, mini = false, closeBtn = false) {
  const app = dom || document.getElementById('app');
  app.innerHTML = `
    ${mini ? '' : '<main class="friends-shell">'}
      <aside class="friends-sidebar${mini ? ' mini' : ''}">
        <div class="friends-card" style="padding-bottom:10px">
          <div class="friends-header">
            <div><strong>People</strong></div>
            <div class="friends-actions">
              <button id="refreshBtn" class="friends-ghost">Refresh</button>
              ${closeBtn ? '<button id="closeBtn" class="friends-ghost">Close</button>' : ''}
            </div>
          </div>
          <div style="margin-top:10px">
            <div class="small" style="color:rgba(255,255,255,0.7)">Send friend request by username</div>
            <div class="friends-send-row">
              <input id="sendUserId" class="friends-input" placeholder="Username, ex cheese72" />
              <button id="sendByIdBtn" class="friends-primary">Send</button>
            </div>
            <div id="sendResult" class="friends-empty" style="margin-top:8px"></div>
          </div>
        </div>

        <div class="friends-card">
          <div id="accountInfo" style="margin-top:8px;color:rgba(255,255,255,0.8)"></div>
        </div>
      </aside>

      <section>
        <div style="margin-bottom:8px">
          <div class="friends-tabs" id="tabs">
            <button class="friends-tab active" data-tab="friends">Friends</button>
            <button class="friends-tab" data-tab="incoming">Incoming</button>
            <button class="friends-tab" data-tab="sent">Sent</button>
          </div>
        </div>

        <div id="panelArea">
          <div id="friendsPanel" class="friends-list friends-card"></div>
          <div id="incomingPanel" class="friends-list friends-card" style="display:none"></div>
          <div id="sentPanel" class="friends-list friends-card" style="display:none"></div>
        </div>
      </section>
    ${mini ? '' : '</main>'}
  `;

  const auth = getAuth();
  const accountInfo = document.getElementById('accountInfo');
  if (!auth.username || !auth.password) {
    accountInfo.innerText = 'Not authenticated. Please log in.';
  } else {
    accountInfo.innerHTML = `<div><strong>@${escapeHtml(auth.username)}</strong></div><div class="accent small">Your username</div>`;
  }

  qsa('#tabs .friends-tab').forEach(tab=>{
    tab.addEventListener('click', ()=>{
      qsa('#tabs .friends-tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const name = tab.dataset.tab;
      ['friends','incoming','sent'].forEach(n=>{
        const el = document.getElementById(n + 'Panel');
        if (el) el.style.display = (n === name) ? '' : 'none';
      });
    });
  });

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
  let sent = [];

  // incoming: ONLY from pVal (prefer pVal.incoming, else pVal.pending)
  if (pVal) {
    if (Array.isArray(pVal.incoming)) {
      incoming = pVal.incoming;
    } else if (Array.isArray(pVal.pending)) {
      // pending represents requests that arrive to the user
      incoming = pVal.pending;
    }
  }

  // sent: ONLY from rVal (prefer rVal.sent, else rVal.requests)
  if (rVal) {
    if (Array.isArray(rVal.sent)) {
      sent = rVal.sent;
    } else if (Array.isArray(rVal.requests)) {
      // requests represents what the user sent
      sent = rVal.requests;
    }
  }

  renderFriends(friends);
  renderIncoming(incoming);
  renderSent(sent);
}

  function setLoadingStates() {
    document.getElementById('friendsPanel').innerHTML = `<div class="friends-empty">Loading friends...</div>`;
    document.getElementById('incomingPanel').innerHTML = `<div class="friends-empty">Loading incoming...</div>`;
    document.getElementById('sentPanel').innerHTML = `<div class="friends-empty">Loading sent...</div>`;
  }

  function showEmptyStates(msg) {
    document.getElementById('friendsPanel').innerHTML = `<div class="friends-empty">${escapeHtml(msg)}</div>`;
    document.getElementById('incomingPanel').innerHTML = `<div class="friends-empty">${escapeHtml(msg)}</div>`;
    document.getElementById('sentPanel').innerHTML = `<div class="friends-empty">${escapeHtml(msg)}</div>`;
  }

  function renderFriends(list) {
    const panel = document.getElementById('friendsPanel');
    panel.innerHTML = '';
    if (!Array.isArray(list) || !list.length) {
      panel.append(childEmpty('No friends yet.'));
      return;
    }
    list.forEach(f => panel.append(renderFriendRow(f)));
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

async function renderSent(list) {
  const panel = document.getElementById('sentPanel');
  panel.innerHTML = '';
  if (!Array.isArray(list) || !list.length) {
    panel.append(childEmpty('No sent requests.'));
    return;
  }
  for (const r of list) {
    panel.append(await renderSentRow(r));
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
    const whoData = await apiPost("/api/auth/data", { id: who });
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

  async function renderSentRow(r) {
    const wrapper = document.createElement('div'); wrapper.className = 'friends-row';
    const left = document.createElement('div');
    const who = r.requestedId;
    const whoData = await apiPost("/api/auth/data", { id: who });
    const whoName = whoData.username || "Unknown";
    
    left.innerHTML = `<div class="friends-name">To ${escapeHtml(String(whoName))}</div><div class="friends-meta">Request ID: ${escapeHtml(String(r.id || ''))}</div>`;
    const controls = document.createElement('div'); controls.className = 'friends-controls';
    const cancelBtn = document.createElement('button'); cancelBtn.className = 'friends-ghost'; cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', async ()=>{ await cancelRequest(r.id); });
    controls.appendChild(cancelBtn);
    wrapper.appendChild(left); wrapper.appendChild(controls);
    return wrapper;
  }

  async function sendById(username) {
    if (!username) return alert('Enter a username.');
    const payload = { ...auth, targetUsername: username };
    const res = await apiPost(API.friendsSend, payload);
    const out = res && (res.error || res.message || JSON.stringify(res));
    document.getElementById('sendResult').innerText = out || 'Sent';
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

  async function cancelRequest(requestId) {
    if (!requestId) return;
    await apiPost(API.friendsCancel, { ...auth, requestId });
    await loadAll();
  }

  async function removeFriend(friendUsername) {
    if (!friendUsername) return;
    await apiPost(API.friendsRemove, { ...auth, friendUsername });
    await loadAll();
  }

  document.getElementById('sendByIdBtn').addEventListener('click', async () => {
    const id = document.getElementById('sendUserId').value.trim();
    if (!id) return;
    await sendById(id);
  });

  document.getElementById('refreshBtn').addEventListener('click', loadAll);

  loadAll();
}
