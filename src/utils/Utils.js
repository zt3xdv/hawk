
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

export function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const meta = parts[0];
  const base64 = parts[1];
  const isBase64 = meta.indexOf(';base64') !== -1;
  const mimeMatch = meta.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

  let arrayBuffer;
  if (isBase64) {
      const binary = atob(base64);
      const len = binary.length;
      const u8 = new Uint8Array(len);
      for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
      arrayBuffer = u8;
  } else {
      const text = decodeURIComponent(parts[1]);
      const len = text.length;
      const u8 = new Uint8Array(len);
      for (let i = 0; i < len; i++) u8[i] = text.charCodeAt(i);
      arrayBuffer = u8;
  }

  return new Blob([arrayBuffer], { type: mime });
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

export function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (s) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[s];
  });
}
