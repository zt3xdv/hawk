class ChunkManager {
  constructor(chunkSize = 512) {
    this.chunkSize = chunkSize;
    this.chunks = new Map();
  }

  getChunkKey(x, y) {
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkY = Math.floor(y / this.chunkSize);
    return `${chunkX},${chunkY}`;
  }

  getChunkCoords(x, y) {
    return {
      chunkX: Math.floor(x / this.chunkSize),
      chunkY: Math.floor(y / this.chunkSize)
    };
  }

  getChunk(chunkKey) {
    if (!this.chunks.has(chunkKey)) {
      this.chunks.set(chunkKey, {
        players: new Set(),
        objects: new Set(),
        key: chunkKey
      });
    }
    return this.chunks.get(chunkKey);
  }

  getChunkByCoords(x, y) {
    const key = this.getChunkKey(x, y);
    return this.getChunk(key);
  }

  addPlayerToChunk(playerId, x, y) {
    const key = this.getChunkKey(x, y);
    const chunk = this.getChunk(key);
    chunk.players.add(playerId);
    return key;
  }

  removePlayerFromChunk(playerId, chunkKey) {
    const chunk = this.chunks.get(chunkKey);
    if (chunk) {
      chunk.players.delete(playerId);
      if (chunk.players.size === 0 && chunk.objects.size === 0) {
        this.chunks.delete(chunkKey);
      }
    }
  }

  addObjectToChunk(objectId, x, y) {
    const key = this.getChunkKey(x, y);
    const chunk = this.getChunk(key);
    chunk.objects.add(objectId);
    return key;
  }

  removeObjectFromChunk(objectId, chunkKey) {
    const chunk = this.chunks.get(chunkKey);
    if (chunk) {
      chunk.objects.delete(objectId);
      if (chunk.players.size === 0 && chunk.objects.size === 0) {
        this.chunks.delete(chunkKey);
      }
    }
  }

  getVisibleChunks(x, y, viewDistance) {
    const { chunkX, chunkY } = this.getChunkCoords(x, y);
    const chunkRadius = Math.ceil(viewDistance / this.chunkSize);
    
    const visibleChunks = [];
    
    for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
      for (let dy = -chunkRadius; dy <= chunkRadius; dy++) {
        const key = `${chunkX + dx},${chunkY + dy}`;
        visibleChunks.push(key);
      }
    }
    
    return visibleChunks;
  }

  getChunkData(chunkKey, objectsData = {}) {
    const chunk = this.chunks.get(chunkKey);
    if (!chunk) {
      return {
        key: chunkKey,
        players: [],
        objects: []
      };
    }

    const objects = [];
    for (const objectId of chunk.objects) {
      if (objectsData[objectId]) {
        objects.push(objectsData[objectId]);
      }
    }

    return {
      key: chunkKey,
      players: Array.from(chunk.players),
      objects: objects
    };
  }

  getAllChunks() {
    return Array.from(this.chunks.keys());
  }

  getChunkInfo() {
    const info = {};
    for (const [key, chunk] of this.chunks.entries()) {
      info[key] = {
        players: chunk.players.size,
        objects: chunk.objects.size
      };
    }
    return info;
  }
}

export default ChunkManager;
