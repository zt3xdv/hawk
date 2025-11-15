import Cache from "./Cache.js";

export * from "./Blob.js";

export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getAuth() {
  return {
    username: localStorage.getItem('username'),
    password: localStorage.getItem('password')
  };
}

export function apiPost(path, body) {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(async r => {
    const txt = await r.text();
    try { return JSON.parse(txt); } catch (e) { return { error: 'Invalid JSON response', raw: txt }; }
  });
}

export function apiGet(path) {
  return fetch(path, {
    method: 'GET',
  }).then(async r => {
    const txt = await r.text();
    try { return JSON.parse(txt); } catch (e) { return { error: 'Invalid JSON response', raw: txt }; }
  });
}

export function qs(selector){ return document.querySelector(selector); }
export function qsa(selector){ return Array.from(document.querySelectorAll(selector)); }

export function getAssets() {
  return [
    {
      type: "image",
      key: "lightRadial",
      url: Cache.getBlob("assets/masks/lightMask.png").dataUrl
    },
    {
      type: "image",
      key: "wah",
      url: Cache.getBlob("assets/wah.png").dataUrl
    },
    {
      type: "image",
      key: "props",
      url: Cache.getBlob("assets/game/props.png").dataUrl
    },
    {
      type: "image",
      key: "plants",
      url: Cache.getBlob("assets/game/plants.png").dataUrl
    },
    {
      type: "image",
      key: "building",
      url: Cache.getBlob("assets/game/building.png").dataUrl
    },
    {
      type: "image",
      key: "animated",
      url: Cache.getBlob("assets/game/animated.png").dataUrl
    },
    {
      type: "image",
      key: "tilemap",
      url: Cache.getBlob("assets/tilemap.png").dataUrl
    },
    {
      type: "spritesheet",
      key: "grass2",
      url: Cache.getBlob("assets/game/grass2.png").dataUrl,
      frameConfig: {
        frameWidth: 32,
        frameHeight: 32
      }
    },
    {
      type: "spritesheet",
      key: "dirt",
      url: Cache.getBlob("assets/game/dirt.png").dataUrl,
      frameConfig: {
        frameWidth: 32,
        frameHeight: 32
      }
    },
    {
      type: "spritesheet",
      key: "flame",
      url: Cache.getBlob("assets/masks/flame.png").dataUrl,
      frameConfig: {
        frameWidth: 32,
        frameHeight: 32
      }
    },
    {
      type: "bitmapfont",
      key: "hawkpixelated",
      url: {
        image: Cache.getBlob("assets/fonts/white.png").dataUrl,
        xml: Cache.getBlob("assets/fonts/mappings.xml").dataUrl,
      }
    },
    {
      type: "bitmapfont",
      key: "hawkpixelateddashed",
      url: {
        image: Cache.getBlob("assets/fonts/dashed.png").dataUrl,
        xml: Cache.getBlob("assets/fonts/mappings.xml").dataUrl,
      }
    }
  ];
}

export function loadPack(scene, packArray) {
  const loader = scene.load;

  for (const entry of packArray) {
    const { type, key, url } = entry;
    if (type === 'image') {
      loader.image(key, url);
    } else if (type === 'spritesheet') {
      loader.spritesheet(key, url, entry.frameConfig || {});
    } else if (type === 'audio') {
      loader.audio(key, url);
    } else if (type === 'json') {
      loader.json(key, url);
    } else if (type === 'bitmapfont') {
      loader.bitmapFont(key, url.image, url.xml);
    } else {
      loader.file(key, { type: type || 'image', url });
    }
      
    // TODO add more types
  }
}

export function estimateReadTime(text) {
  const characterCount = text.replace(/\s/g, '').length;
  return Math.min(120000, Math.max(1000, characterCount * 500));
}

export function id(length) {
  let number = '';
  for (let i = 0; i < length; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }
  return number;
}

export function uuid() {
  return id(24);
}

export function now() {
  const d = new Date();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function log(type, message) {
  const reset = '\x1b[0m';
  const typeColor = '\x1b[90m';
  const msgColor = '\x1b[97m';
  const strColor = '\x1b[32m';
  const numColor = '\x1b[33m';

  const coloredStrings = message.replace(/(["'`])(.*?)\1/g, (_, q, inner) => {
    return `${strColor}${q}${inner}${q}${reset}${msgColor}`;
  });

  const coloredAll = coloredStrings.replace(/-?\d+(\.\d+)?/g, (n) => {
    return `${numColor}${n}${reset}${msgColor}`;
  });

  console.log(`${typeColor}${now()} ${type} - ${reset}${msgColor}${coloredAll}${reset}`);
}

export function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

export async function loadImageFromDataUrl(dataUrl) {
  const img = new Image();
  return await new Promise((resolve, reject) => {
    img.onerror = () => reject(new Error("Could not load image"));
    img.onload = () => resolve(img);
    img.src = dataUrl;
  });
}

export function fitAndDrawImageToCanvas(img, canvas, size = 128) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  const aspect = img.width / img.height;
  let drawW = size, drawH = size;
  if (aspect > 1) drawH = size / aspect;
  else if (aspect < 1) drawW = size * aspect;
  const dx = Math.round((size - drawW) / 2);
  const dy = Math.round((size - drawH) / 2);
  ctx.drawImage(img, dx, dy, drawW, drawH);
}

export async function validateAndConvertImage(file) {
  if (!file) throw new Error("No file provided");
  if (!file.type.startsWith("image/")) throw new Error("File is not an image");
  const dataUrl = await toBase64(file);
  const img = await loadImageFromDataUrl(dataUrl);
  if (img.width === 128 && img.height === 128) return dataUrl;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  fitAndDrawImageToCanvas(img, canvas, 128);
  return canvas.toDataURL("image/png");
}

export async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const errMsg = (json && json.error) || text || `HTTP ${res.status}`;
    throw new Error(errMsg);
  }
  return json;
}

export function getRandomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const bigint = parseInt(value, 16);
  return [
    (bigint >> 16) & 255,
    (bigint >> 8) & 255,
    bigint & 255
  ];
}

export function requestNotificationPermission() {
  Notification.requestPermission(permission => {
    if (permission === 'granted') {
      console.log('Notifications enabled');
    } else if (permission === 'denied') {
      console.log('Notifications disabled');
    }
  });
}

export async function requestInstall() {
  if (window.deferredInstallPrompt) {
    window.deferredInstallPrompt.prompt();
    const { outcome } = await window.deferredInstallPrompt.userChoice;
  }
}

export function isInstalled() {
  return window.deferredInstallPrompt;
}

export function whenTurnstileReady() {
  return new Promise((resolve) => {
    if (window.turnstile) return resolve();
    const check = setInterval(() => {
      if (window.turnstile) {
        clearInterval(check);
        resolve();
      }
    }, 50);
  });
}

export async function setupTurnstile(callback = (token) => {}) {
  if (window.turnstileId) window.turnstile.remove(window.turnstileId);
  
  const key = await apiGet("/api/game/turnstile");
  
  await whenTurnstileReady();
  window.turnstileId = window.turnstile.render('#turnstile-container', {
    sitekey: key.key,
    callback,
    theme: "dark",
  });
}

export async function verifyTurnstile(token, secret) {
  if (!token) return { ok: false, error: 'missing_token' };
  if (!secret) return { ok: false, error: 'missing_server_secret' };

  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      timeout: 5000,
    });

    if (!res.ok) return { ok: false, error: `http_${res.status}` };

    const data = await res.json();

    if (data.success) return { ok: true, data };
    return { ok: false, error: 'verification_failed', details: data };
  } catch (err) {
    return { ok: false, error: 'network_error', details: err.message || String(err) };
  }
}
