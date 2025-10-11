import Cache from '../utils/Cache.js';

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = dataUrl;
  });
}

function resizeImageTo32(img) {
  const TARGET = 32;
  const canvas = document.createElement("canvas");
  canvas.width = TARGET;
  canvas.height = TARGET;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, TARGET, TARGET);
  const aspect = img.width / img.height;
  let drawW = TARGET, drawH = TARGET;
  if (aspect > 1) drawH = TARGET / aspect;
  else if (aspect < 1) drawW = TARGET * aspect;
  const dx = Math.round((TARGET - drawW) / 2);
  const dy = Math.round((TARGET - drawH) / 2);
  ctx.drawImage(img, dx, dy, drawW, drawH);
  return canvas.toDataURL("image/png");
}

export async function validateAndConvertImage(file, { maxBytes = 5_000_000 } = {}) {
  if (!file) throw new Error("No file provided");
  if (typeof file.type !== "string" || !file.type.startsWith("image/")) throw new Error("File is not an image");
  if (file.size && file.size > maxBytes) throw new Error(`File too large (max ${Math.round(maxBytes / 1e6)} MB)`);
  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);
  return resizeImageTo32(img);
}

async function postAvatar(base64Image, username = null, password = null, { timeoutMs = 15000 } = {}) {
  if (!base64Image) throw new Error("No image to upload");
  const payload = { image: base64Image, username: username ?? null, password: password ?? null };
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch("/api/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Upload timed out");
    throw new Error("Network error while uploading avatar");
  } finally {
    clearTimeout(id);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Server error ${res.status}${text ? `: ${text}` : ""}`);
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function renderAvatar() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="auth">
  <div class="header">
    <h3><canv-icon src="${Cache.getBlob('assets/icons/createemoji.png').dataUrl}"></canv-icon>In-Game avatar</h3>
    <span class="description">Modify your in-game avatar.</span>
  </div>
<hr>
      <section class="avatar-section">
        <div class="header-row">
          <div>
            <p id="avatar-desc" class="lead">Upload an avatar for your character.</p>
            <p class="small accent">Accepted: images. Max 5 MB.</p>
          </div>
        </div>

        <label for="avatarInput" class="file-label">
          <input id="avatarInput" type="file" accept="image/*" class="visually-hidden" />
        </label>

        <div class="preview-row" aria-live="polite">
          <canvas id="avatarPreview" width="32" height="32" class="avatar-canvas"></canvas>
          <div class="preview-text">Preview</div>
        </div>

        <div class="controls">
          <button id="uploadAvatarBtn" class="uploadBtn">Upload avatar</button>
          <div id="avatarMessage" class="message"></div>
        </div>
      </section>
    </div>
  `;

  const fileInput = document.getElementById("avatarInput");
  const previewCanvas = document.getElementById("avatarPreview");
  const previewCtx = previewCanvas.getContext("2d");
  const messageEl = document.getElementById("avatarMessage");
  const uploadBtn = document.getElementById("uploadAvatarBtn");

  const drawPreview = (img) => {
    const TARGET = 32;
    previewCtx.clearRect(0, 0, TARGET, TARGET);
    const aspect = img.width / img.height;
    let drawW = TARGET, drawH = TARGET;
    if (aspect > 1) drawH = TARGET / aspect;
    else if (aspect < 1) drawW = TARGET * aspect;
    const dx = Math.round((TARGET - drawW) / 2);
    const dy = Math.round((TARGET - drawH) / 2);
    previewCtx.drawImage(img, dx, dy, drawW, drawH);
  };

  fileInput.addEventListener("change", async (e) => {
    messageEl.textContent = "";
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      const img = await loadImage(dataUrl);
      drawPreview(img);
    } catch (err) {
      messageEl.textContent = err.message || "Error processing image";
      previewCtx.clearRect(0, 0, 32, 32);
    }
  });

  uploadBtn.addEventListener("click", async () => {
    messageEl.textContent = "";
    uploadBtn.disabled = true;
    try {
      const file = fileInput.files && fileInput.files[0];
      if (!file) throw new Error("Please select an image first");
      const base64 = await validateAndConvertImage(file, { maxBytes: 5_000_000 });
      if (!base64) throw new Error("Could not convert image");
      const username = localStorage.getItem("username");
      const password = localStorage.getItem("password");
      await postAvatar(base64, username, password, { timeoutMs: 15000 });
      messageEl.textContent = "Avatar uploaded successfully";
    } catch (err) {
      messageEl.textContent = err.message || "Upload error";
    } finally {
      uploadBtn.disabled = false;
    }
  });
}
