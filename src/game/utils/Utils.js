import Cache from "../../utils/Cache.js";

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
      key: "grass",
      url: Cache.getBlob("assets/game/grass.png").dataUrl,
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
