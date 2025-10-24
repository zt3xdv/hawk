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
