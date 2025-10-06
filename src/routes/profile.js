import { postJson, escapeHtml } from "../utils/Utils.js";

export async function renderProfile() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div style="width: 100%;">
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
    if (profileActions) profileActions.style.display = "";
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
      const data = await postJson("/api/auth/check", { username, password });
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
    try {
      const res = await fetch(`/api/pavatar/${encodeURIComponent(id)}`);
      if (!res.ok) { profileAvatar.src = ""; return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      profileAvatar.src = url;
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      profileAvatar.src = "";
    }
  }

  async function loadProfileById(id) {
    try {
      const data = await postJson("/api/auth/profile", { id });
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
    // Determine if URL provides an id parameter
    const urlId = getQueryParam("id");

    // First, check authenticated session (used to know current user's id)
    const fresh = await authCheck();
    const currentUserId = fresh && fresh.id ? String(fresh.id) : null;

    if (urlId) {
      // If loading someone else's profile via ?id=..., try to load that profile
      const byId = await loadProfileById(urlId);
      if (byId) {
        // If the profile loaded belongs to current user, show edit buttons; otherwise hide them
        if (currentUserId && String(byId.id || urlId) === currentUserId) {
          showEditButtons();
        } else {
          hideEditButtons();
        }
        return;
      }
      // If loading by id failed, continue to fallback to authenticated profile (if any)
    }

    // No ?id or loading by id failed — show authenticated user's profile if available
    if (fresh) {
      const uname = fresh.username || localStorage.getItem("username") || "";
      const dname = fresh.displayName || localStorage.getItem("display_name") || "";
      showBasicData(uname, dname, fresh.id, fresh.bio);
      if (fresh.id) await loadAvatar(fresh.id);
      // keep local cache in sync
      if (fresh.username) localStorage.setItem("username", fresh.username);
      if (fresh.displayName) localStorage.setItem("display_name", fresh.displayName);
      // Authenticated user is viewing their own profile — show edit buttons
      showEditButtons();
    } else {
      // Not authenticated and no profile loaded — show placeholders and hide edit buttons
      showBasicData("", "", "—", "");
      hideEditButtons();
    }
  })();
}
