import { postJson, escapeHtml, apiGet } from "../utils/Utils.js";
import Cache from '../utils/Cache.js';
import { API } from '../utils/Constants.js';

const html = `
  <div class="auth">
<div class="header">
  <h3><canv-icon src="${Cache.getBlob('assets/icons/Person.png').dataUrl}"></canv-icon>Profile</h3>
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

  const profileAvatar = document.getElementById("profileAvatar");
  const profileUsername = document.getElementById("profileUsername");
  const profileDisplayName = document.getElementById("profileDisplayName");
  const profileId = document.getElementById("profileId");
  const profileFieldBio = document.getElementById("profileFieldBio");
  const profileActions = document.getElementById("profileActions");
  const editProfileBtn = document.getElementById("editProfileBtn");
  const editAvatarBtn = document.getElementById("editAvatarBtn");

  function showBasicData(uname, dname, id, bio) {
    profileUsername.textContent = escapeHtml(uname || "Username");
    profileDisplayName.textContent = escapeHtml(dname || "Display name");
    profileFieldBio.textContent = escapeHtml(bio || "No bio.");
    profileId.textContent = `ID: ${escapeHtml(String(id || "—"))}`;
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
      showBasicData(uname, dname, data.id || id, bio);
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

export const options = { title: "Profile", auth: true, description: "View and edit your public profile." };

export { html, render };
