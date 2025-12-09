import { postJson, escapeHtml, apiGet } from "../utils/Utils.js";
import Cache from '../utils/Cache.js';
import { API } from '../utils/Constants.js';

const html = `
  <div class="auth">
<div class="header">
  <h3><canv-icon id="profile-icon"></canv-icon>Profile</h3>
  <span class="description">Main profile.</span>
</div>
<hr>
    <div class="profile-header" style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <img id="profileAvatar" src="/assets/generic-profile.png" width="64" height="64" style="border-radius:50%;object-fit:cover;background:#222;">
      <div>
        <div id="profileUsername" style="font-weight:700;font-size:18px"></div>
        <div id="profileDisplayName" style="color:#666;margin-top:4px"></div>
        <div id="profileId" style="color:#999;font-size:12px;margin-top:6px">ID: —</div>
      </div>
    </div>

    <div>
      <span id="profileFieldBio">No bio.</span>
      <div id="profileLinks" style="display: flex; gap: 5px;"></div>
      <p id="profileActions" style="margin-top:40px; display: flex; gap: 5px;">
        <a class="btn mini" id="editProfileBtn" href="/profile-settings">Edit profile</a>
        <a class="btn mini" id="editAvatarBtn" href="/avatar">Edit in-game avatar</a>
      </p>
    </div>
  </div>
`;

async function render() {
  const app = document.getElementById("app");
  app.innerHTML = html;

  // Set icon data URLs
  document.getElementById('profile-icon').src = Cache.getBlob('assets/icons/Person.png').dataUrl;

  const profileAvatar = document.getElementById("profileAvatar");
  const profileUsername = document.getElementById("profileUsername");
  const profileDisplayName = document.getElementById("profileDisplayName");
  const profileId = document.getElementById("profileId");
  const profileFieldBio = document.getElementById("profileFieldBio");
  const profileLinks = document.getElementById("profileLinks");
  const profileActions = document.getElementById("profileActions");
  const editProfileBtn = document.getElementById("editProfileBtn");
  const editAvatarBtn = document.getElementById("editAvatarBtn");

  function showBasicData(uname, dname, id, bio, oauthProvider = null, oauthId = null) {
    profileUsername.textContent = escapeHtml(uname || "Username");
    profileDisplayName.textContent = escapeHtml(dname || "Display name");
    profileFieldBio.textContent = escapeHtml(bio || "No bio.");
    profileId.textContent = `ID: ${escapeHtml(String(id || "—"))}`;
    
    if (oauthProvider == "discord" && oauthId != null) {
      const discord = document.createElement("a");
      discord.className = "discord-link";
      discord.href = "https://discord.com/users/" + oauthId;
      discord.innerHTML = `<svg viewBox="0 0 24 24" fill="#5865F2">
                             <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                           </svg>`;
      profileLinks.appendChild(discord);
    }
  }

  function hideEditButtons() {
    if (profileActions) profileActions.style.display = "none";
  }
  function showEditButtons() {
    if (profileActions) profileActions.style.display = "flex";
  }

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  async function authCheck() {
    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");
    if (!username || !password) return null;
    try {
      const data = await postJson(API.check, { username, password });
      return data || null;
    } catch {
      return null;
    }
  }

  async function loadAvatar(id) {
    if (!id) {
      profileAvatar.src = "";
      return;
    }
    profileAvatar.src = `${API.pavatar}/${encodeURIComponent(id)}`;
  }

  async function loadProfileById(id) {
    try {
      const data = await postJson(API.profile, { id });
      if (!data) return null;
      const uname = data.username || "";
      const dname = data.displayName || data.display_name || "";
      const bio = data.bio || "";
      showBasicData(uname, dname, data.id || id, bio, data.oauthProvider, data.oauthId);
      if (data.id || id) await loadAvatar(data.id || id);
      return data;
    } catch (e) {
      return null;
    }
  }

  (async () => {
    const urlId = getQueryParam("id");

    const fresh = await authCheck();
    const currentUserId = fresh && fresh.id ? String(fresh.id) : null;

    if (urlId) {
      const byId = await loadProfileById(urlId);
      if (byId) {
        if (currentUserId && String(byId.id || urlId) === currentUserId) {
          showEditButtons();
        } else {
          hideEditButtons();
        }
        return;
      }
    }

    if (fresh) {
      const uname = fresh.username || localStorage.getItem("username") || "";
      const dname = fresh.displayName || localStorage.getItem("display_name") || "";
      showBasicData(uname, dname, fresh.id, fresh.bio);
      if (fresh.id) await loadAvatar(fresh.id);
      if (fresh.username) localStorage.setItem("username", fresh.username);
      if (fresh.displayName) localStorage.setItem("display_name", fresh.displayName);
      showEditButtons();
    } else {
      showBasicData("", "", "—", "");
      hideEditButtons();
    }
  })();
}

export const options = { title: "Profile", auth: false, description: "View and edit your public profile." };

export { html, render };
