import { dataUrlToBlob } from './Utils.js';

export default class Cache {
  static #instance = null;
  static #data = {};
  static #currentVersion = null;
  static #fileList = [];
  static #db = null;
  static #DB_NAME = 'app-cache';
  static #DB_VERSION = 1;
  static #FILES_STORE = 'files';
  static #META_STORE = 'meta';

  static #mimeMap = {
    'html': 'text/html',
    'htm': 'text/html',
    'js': 'application/javascript',
    'mjs': 'application/javascript',
    'css': 'text/css',
    'json': 'application/json',
    'svg': 'image/svg+xml',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'txt': 'text/plain',
    'xml': 'application/xml'
  };

  constructor() {
    if (Cache.#instance) return Cache.#instance;
    Cache.#instance = this;
  }

  // ---------- IndexedDB helpers ----------
  static async #openDB() {
    if (this.#db) return this.#db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.#DB_NAME, this.#DB_VERSION);
      req.onupgradeneeded = (ev) => {
        const db = ev.target.result;
        if (!db.objectStoreNames.contains(this.#FILES_STORE)) {
          db.createObjectStore(this.#FILES_STORE, { keyPath: 'path' });
        }
        if (!db.objectStoreNames.contains(this.#META_STORE)) {
          db.createObjectStore(this.#META_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => {
        this.#db = req.result;
        resolve(this.#db);
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () => {
        // ignore blocked for simplicity
      };
    });
  }

  static async #putFileToDB(path, value /* ArrayBuffer or string */, meta = {}) {
    const db = await this.#openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.#FILES_STORE, 'readwrite');
      const store = tx.objectStore(this.#FILES_STORE);
      const record = { path, value, meta };
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  static async #getFileFromDB(path) {
    const db = await this.#openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.#FILES_STORE, 'readonly');
      const store = tx.objectStore(this.#FILES_STORE);
      const req = store.get(path);
      req.onsuccess = () => resolve(req.result ? req.result.value : undefined);
      req.onerror = () => reject(req.error);
    });
  }

  static async #getAllFilesFromDB() {
    const db = await this.#openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.#FILES_STORE, 'readonly');
      const store = tx.objectStore(this.#FILES_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const arr = req.result || [];
        const map = {};
        for (const r of arr) map[r.path] = r.value;
        resolve(map);
      };
      req.onerror = () => reject(req.error);
    });
  }

  static async #putMeta(key, value) {
    const db = await this.#openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.#META_STORE, 'readwrite');
      const store = tx.objectStore(this.#META_STORE);
      const req = store.put({ key, value });
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  static async #getMeta(key) {
    const db = await this.#openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.#META_STORE, 'readonly');
      const store = tx.objectStore(this.#META_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : undefined);
      req.onerror = () => reject(req.error);
    });
  }

  static async #clearDB() {
    const db = await this.#openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.#FILES_STORE, this.#META_STORE], 'readwrite');
      tx.objectStore(this.#FILES_STORE).clear();
      tx.objectStore(this.#META_STORE).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  // ---------- Utility helpers ----------
  static #arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }

  static #isProbablyBase64(str) {
    if (typeof str !== 'string') return false;
    const s = str.replace(/\s+/g, '');
    if (s.indexOf('\uFFFD') !== -1) return false;
    return s.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(s);
  }

  // ---------- Public API ----------
  // ---------- Public API ----------
  static async load(version, fileList = [], callback = null) {
    if (this.#currentVersion === version) return;
    this.#data = {};
    this.#fileList = [...fileList];

    // Ensure DB open
    try {
      await this.#openDB();
    } catch (e) {
      // If DB unavailable, fall back to in-memory-only behavior
      console.warn('IndexedDB unavailable, falling back to memory-only cache.', e);
      await this.#loadNetworkAndPopulate(version, fileList, false, callback);
      return;
    }

    const storedVersion = await this.#getMeta('version');

    if (storedVersion === version) {
      // load all from DB
      try {
        const map = await this.#getAllFilesFromDB();
        // Only keep requested files (in case DB has extras)
        let loadedCount = 0;
        const totalFiles = fileList.length;
        for (const path of fileList) {
          if (Object.prototype.hasOwnProperty.call(map, path)) {
            this.#data[path] = map[path];
          } else {
            this.#data[path] = null;
          }
          loadedCount++;
          if (callback) {
            const percentage = Math.round((loadedCount / totalFiles) * 100);
            callback({ percentage, file: loadedCount, totalFiles });
          }
        }
        this.#currentVersion = version;
        return;
      } catch (e) {
        // If reading DB fails, fallback to re-downloading
        console.warn('Failed to read cache from DB, reloading from network.', e);
        await this.#loadNetworkAndPopulate(version, fileList, true, callback);
        return;
      }
    } else {
      // Different version: fetch network and populate DB
      await this.#loadNetworkAndPopulate(version, fileList, true, callback);
    }
  }

  static async #loadNetworkAndPopulate(version, fileList, writeToDB = true, callback = null) {
    let loadedCount = 0;
    const totalFiles = fileList.length;

    const promises = fileList.map(async (filePath) => {
      try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const buf = await response.arrayBuffer();
        this.#data[filePath] = buf;
        if (writeToDB) {
          try {
            await this.#putFileToDB(filePath, buf, { fetchedAt: Date.now() });
          } catch (e) {
            console.warn('Failed to write file to DB:', filePath, e);
          }
        }
      } catch (error) {
        // fallback to text
        try {
          const response2 = await fetch(filePath);
          if (!response2.ok) throw new Error('fallback failed');
          const text = await response2.text();
          this.#data[filePath] = text;
          if (writeToDB) {
            try {
              await this.#putFileToDB(filePath, text, { fetchedAt: Date.now() });
            } catch (e) {
              console.warn('Failed to write file to DB (text):', filePath, e);
            }
          }
        } catch (e) {
          this.#data[filePath] = null;
        }
      } finally {
        loadedCount++;
        if (callback) {
          const percentage = Math.round((loadedCount / totalFiles) * 100);
          callback({ percentage, file: loadedCount, totalFiles });
        }
      }
    });

    await Promise.all(promises);

    // Update meta in DB with new version atomically (best-effort)
    if (writeToDB) {
      try {
        await this.#putMeta('version', version);
      } catch (e) {
        console.warn('Failed to write version meta to DB', e);
      }
    } else {
      // If not writing to DB, still don't set DB meta
    }

    this.#currentVersion = version;

    // If writeToDB==true, consider removing DB entries not present in fileList.
  }

  static get(filePath) {
    if (filePath in this.#data) return this.#data[filePath];
    return null;
  }

  static getBlob(filePath, opts = { returnBlob: false }) {
    const content = this.#data[filePath];
    if (content == null) return { dataUrl: null, blob: null };

    const ext = (filePath.split('.').pop() || '').toLowerCase();
    const mime = this.#mimeMap[ext] || 'application/octet-stream';

    if (typeof content === 'string' && content.startsWith('data:')) {
      const dataUrl = content;
      const blob = opts.returnBlob ? dataUrlToBlob(dataUrl) : null;
      return { dataUrl, blob };
    }

    if (content instanceof ArrayBuffer || ArrayBuffer.isView(content)) {
      const buffer = content instanceof ArrayBuffer
        ? content
        : content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength);
      const base64 = Cache.#arrayBufferToBase64(buffer);
      const dataUrl = `data:${mime};base64,${base64}`;
      const blob = opts.returnBlob ? new Blob([buffer], { type: mime }) : null;
      return { dataUrl, blob };
    }

    if (typeof content === 'string') {
      const s = content.trim();
      const unquoted = ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
        ? s.slice(1, -1)
        : s;

      if (unquoted.startsWith('data:')) {
        const dataUrl = unquoted;
        const blob = opts.returnBlob ? dataUrlToBlob(dataUrl) : null;
        return { dataUrl, blob };
      }

      const collapsed = unquoted.replace(/\s+/g, '');
      if (this.#isProbablyBase64(collapsed)) {
        const dataUrl = `data:${mime};base64,${collapsed}`;
        const blob = opts.returnBlob ? dataUrlToBlob(dataUrl) : null;
        return { dataUrl, blob };
      }

      const utf8 = new TextEncoder().encode(unquoted);
      const base64 = Cache.#arrayBufferToBase64(utf8.buffer);
      const dataUrl = `data:${mime};base64,${base64}`;
      const blob = opts.returnBlob ? new Blob([utf8], { type: mime + ';charset=utf-8' }) : null;
      return { dataUrl, blob };
    }

    const json = JSON.stringify(content);
    const utf8 = new TextEncoder().encode(json);
    const base64 = Cache.#arrayBufferToBase64(utf8.buffer);
    const dataUrl = `data:application/json;charset=utf-8;base64,${base64}`;
    const blob = opts.returnBlob ? new Blob([utf8], { type: 'application/json;charset=utf-8' }) : null;
    return { dataUrl, blob };
  }

  static async clear() {
    this.#data = {};
    this.#currentVersion = null;
    this.#fileList = [];
    try {
      await this.#clearDB();
    } catch (e) {
      console.warn('Failed to clear IndexedDB', e);
    }
  }

  static getVersion() {
    return this.#currentVersion;
  }

  static getFileList() {
    return [...this.#fileList];
  }
}
