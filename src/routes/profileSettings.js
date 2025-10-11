import { toBase64, loadImageFromDataUrl, fitAndDrawImageToCanvas, validateAndConvertImage, postJson, escapeHtml } from "../utils/Utils.js";
import Cache from '../utils/Cache.js';

export async function renderProfileSettings() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="auth">
  <div class="header">
    <h3><canv-icon src="${Cache.getBlob('assets/icons/control.png').dataUrl}"></canv-icon>Profile Settings</h3>
    <span class="description">Edit/Modify your profile with ease.</span>
  </div>
  <hr>

      <div class="header-row" id="headerRow">
        <div class="avatar-wrap"><canvas id="settingsAvatarPreview" width=128 height=128></canvas></div>
        <div class="header-meta">
          <div id="settingsUsername" class="username"></div>
          <div id="settingsDisplayName" class="displayname"></div>
          <div id="settingsId" class="id">ID: —</div>
        </div>
      </div>

      <div class="profile-grid">
        <div class="profile-section">
          <label for="settingsDisplayNameInput">Display name</label>
          <input id="settingsDisplayNameInput" type="text" />
          <button id="settingsSaveDisplayName" class="btn mini">Save</button>
          <div id="settingsDisplayNameMsg" class="message" aria-live="polite"></div>
        </div>

        <div class="profile-section">
          <label for="settingsUsernameInput">Username</label>
          <input id="settingsUsernameInput" type="text" />
          <button id="settingsSaveUsername" class="btn mini">Save</button>
          <div id="settingsUsernameMsg" class="message" aria-live="polite"></div>
        </div>

        <div class="profile-section">
          <label for="settingsPasswordInput">Password</label>
          <input id="settingsPasswordInput" type="password" />
          <button id="settingsSavePassword" class="btn mini">Save</button>
          <div id="settingsPasswordMsg" class="message" aria-live="polite"></div>
        </div>

        <div class="profile-section">
          <label for="settingsBioInput">Bio</label>
          <input id="settingsBioInput" type="bio" />
          <button id="settingsSaveBio" class="btn mini">Save</button>
          <div id="settingsBioMsg" class="message" aria-live="polite"></div>
        </div>

        <div class="avatar-block">
          <div class="avatar-row" style="margin-top:8px;">
            <canvas id="settingsAvatarPreviewSmall" width="128" height="128"></canvas>
            <div>
              <input id="settingsAvatarInput" type="file" accept="image/*" />
              <button id="settingsUploadAvatar" class="uploadBtn">Upload avatar</button>
              <div id="settingsAvatarMsg" class="message" aria-live="polite"></div>
            </div>
          </div>
        </div>

        <div id="profileActions" style="margin-top:40px; display: flex; gap: 5px;">
          <a class="btn mini" href="/profile">Back to profile</a>
        </div>
      </div>
    </div>
  `;

  // element refs
  const get = id => document.getElementById(id);
  const settingsAvatarPreview = get("settingsAvatarPreview");
  const settingsAvatarPreviewSmall = get("settingsAvatarPreviewSmall");
  const settingsUsernameEl = get("settingsUsername");
  const settingsDisplayNameEl = get("settingsDisplayName");
  const settingsIdEl = get("settingsId");
  const settingsDisplayNameInput = get("settingsDisplayNameInput");
  const settingsSaveDisplayName = get("settingsSaveDisplayName");
  const settingsDisplayNameMsg = get("settingsDisplayNameMsg");
  const settingsUsernameInput = get("settingsUsernameInput");
  const settingsSaveUsername = get("settingsSaveUsername");
  const settingsUsernameMsg = get("settingsUsernameMsg");
  const settingsPasswordInput = get("settingsPasswordInput");
  const settingsSavePassword = get("settingsSavePassword");
  const settingsPasswordMsg = get("settingsPasswordMsg");
  const settingsBioInput = get("settingsBioInput");
  const settingsSaveBio = get("settingsSaveBio");
  const settingsBioMsg = get("settingsBioMsg");
  const settingsAvatarInput = get("settingsAvatarInput");
  const settingsUploadAvatar = get("settingsUploadAvatar");
  const settingsAvatarMsg = get("settingsAvatarMsg");

  const ctxMain = settingsAvatarPreview.getContext("2d");
  const ctxSmall = settingsAvatarPreviewSmall.getContext("2d");
  ctxMain.clearRect(0,0,settingsAvatarPreview.width, settingsAvatarPreview.height);
  ctxSmall.clearRect(0,0,settingsAvatarPreviewSmall.width, settingsAvatarPreviewSmall.height);

  function showMessage(el, msg, isError = false) {
    el.textContent = msg;
    el.style.color = isError ? "crimson" : "";
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

  async function loadHeader(checkResult) {
    if (!checkResult) return;
    const id = checkResult.id;
    const uname = checkResult.username || localStorage.getItem("username") || "";
    const dname = checkResult.displayName || localStorage.getItem("display_name") || "";
    settingsUsernameEl.textContent = escapeHtml(uname);
    settingsDisplayNameEl.textContent = escapeHtml(dname);
    settingsIdEl.textContent = `ID: ${escapeHtml(String(id))}`;
    if (id) {
      try {
        const res = await fetch(`/api/pavatar/${encodeURIComponent(id)}`);
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const imgEl = new Image();
          imgEl.src = url;
          imgEl.onload = () => {
            fitAndDrawImageToCanvas(imgEl, settingsAvatarPreview, Math.min(settingsAvatarPreview.width, settingsAvatarPreview.height));
            fitAndDrawImageToCanvas(imgEl, settingsAvatarPreviewSmall, Math.min(settingsAvatarPreviewSmall.width, settingsAvatarPreviewSmall.height));
            setTimeout(() => URL.revokeObjectURL(url), 60000);
          };
        } else {
          ctxMain.clearRect(0,0,settingsAvatarPreview.width, settingsAvatarPreview.height);
          ctxSmall.clearRect(0,0,settingsAvatarPreviewSmall.width, settingsAvatarPreviewSmall.height);
        }
      } catch {
        ctxMain.clearRect(0,0,settingsAvatarPreview.width, settingsAvatarPreview.height);
        ctxSmall.clearRect(0,0,settingsAvatarPreviewSmall.width, settingsAvatarPreviewSmall.height);
      }
    }
  }

  async function handleFieldSave({ key, inputEl, msgEl, successLocalKey }) {
    const currentUsername = localStorage.getItem("username");
    const currentPassword = localStorage.getItem("password");
    const value = inputEl.value;
    if (!currentUsername || !currentPassword) {
      showMessage(msgEl, "Credentials not stored locally.", true);
      return;
    }
    try {
      const res = await postJson("/api/user/edit", {
        username: currentUsername,
        password: currentPassword,
        key,
        value,
      });
      showMessage(msgEl, (res && (res.message || res.success)) || "Done");
      if (successLocalKey) localStorage.setItem(successLocalKey, value);
      const fresh = await authCheck();
      if (fresh) {
        if (fresh.displayName) {
          settingsDisplayNameInput.value = fresh.displayName;
          localStorage.setItem("display_name", fresh.displayName);
        }
        if (fresh.username) {
          settingsUsernameInput.value = fresh.username;
          localStorage.setItem("username", fresh.username);
        }
        await loadHeader(fresh);
      }
    } catch (err) {
      showMessage(msgEl, err.message || "Error", true);
    }
  }

  // Reuse same click binder
  settingsSaveDisplayName.addEventListener("click", () =>
    handleFieldSave({ key: "displayName", inputEl: settingsDisplayNameInput, msgEl: settingsDisplayNameMsg, successLocalKey: "display_name" })
  );
  settingsSaveUsername.addEventListener("click", () =>
    handleFieldSave({ key: "username", inputEl: settingsUsernameInput, msgEl: settingsUsernameMsg, successLocalKey: "username" })
  );
  settingsSavePassword.addEventListener("click", () =>
    handleFieldSave({ key: "password", inputEl: settingsPasswordInput, msgEl: settingsPasswordMsg })
  );
  settingsSaveBio.addEventListener("click", () =>
    handleFieldSave({ key: "bio", inputEl: settingsBioInput, msgEl: settingsBioMsg })
  );

  settingsAvatarInput.addEventListener("change", async (e) => {
    settingsAvatarMsg.textContent = "";
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await toBase64(file);
      const img = await loadImageFromDataUrl(dataUrl);
      fitAndDrawImageToCanvas(img, settingsAvatarPreview, Math.min(settingsAvatarPreview.width, settingsAvatarPreview.height));
      fitAndDrawImageToCanvas(img, settingsAvatarPreviewSmall, Math.min(settingsAvatarPreviewSmall.width, settingsAvatarPreviewSmall.height));
    } catch (err) {
      showMessage(settingsAvatarMsg, err.message || "Error processing image", true);
    }
  });

  settingsUploadAvatar.addEventListener("click", async () => {
    showMessage(settingsAvatarMsg, "Uploading...");
    settingsUploadAvatar.disabled = true;
    try {
      const file = settingsAvatarInput.files && settingsAvatarInput.files[0];
      if (!file) throw new Error("Please select an image first");
      const base64 = await validateAndConvertImage(file);
      const username = localStorage.getItem("username");
      const password = localStorage.getItem("password");
      const res = await postJson("/api/pavatar", { image: base64, username, password });
      showMessage(settingsAvatarMsg, (res && (res.message || "Avatar uploaded successfully")) || "Avatar uploaded");
      const fresh = await authCheck();
      if (fresh) {
        if (fresh.displayName) localStorage.setItem("display_name", fresh.displayName);
        if (fresh.username) localStorage.setItem("username", fresh.username);
        await loadHeader(fresh);
      }
    } catch (err) {
      showMessage(settingsAvatarMsg, err.message || "Upload error", true);
    } finally {
      settingsUploadAvatar.disabled = false;
    }
  });

  (async () => {
    const fresh = await authCheck();
    if (fresh) {
      if (fresh.displayName) {
        settingsDisplayNameInput.value = fresh.displayName;
        localStorage.setItem("display_name", fresh.displayName);
      }
      if (fresh.username) {
        settingsUsernameInput.value = fresh.username;
        localStorage.setItem("username", fresh.username);
      }
      await loadHeader(fresh);
    } else {
      const storedName = localStorage.getItem("display_name") || "";
      const storedUsername = localStorage.getItem("username") || "";
      settingsDisplayNameInput.value = storedName;
      settingsUsernameInput.value = storedUsername;
      settingsUsernameEl.textContent = escapeHtml(storedUsername || "Username");
      settingsDisplayNameEl.textContent = escapeHtml(storedName || "Display name");
    }
  })();
}
