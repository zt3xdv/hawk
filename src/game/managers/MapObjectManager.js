import Tree from '../objects/Tree.js';
import Rock from '../objects/Rock.js';
import WoodBox from '../objects/WoodBox.js';
import Barrel from '../objects/Barrel.js';
import Lamp from '../objects/Lamp.js';
import RoadLamp from '../objects/RoadLamp.js';
import Bush from '../objects/Bush.js';
import MoreNature from '../objects/MoreNature.js';
import HouseOne from '../objects/building/HouseOne.js';
import Campfire from '../objects/Campfire.js';
import Crate from '../objects/Crate.js';
import Outdoor from '../objects/Outdoor.js';
import Phaser from '../../../dist/engine/main.js';

const CHUNK_SIZE = 500;
const PAD = 64;

export default class MapObjectManager {
  static objects = [
    { name: "Campfire", category: "props", create: (scene, x, y, options) => new Campfire(scene, x, y), id: "campfire", getType: () => Campfire.types?.[0], getTexture: () => Campfire.texture },
    { name: "House 1", category: "building", create: (scene, x, y, options) => new HouseOne(scene, x, y), id: "house_1", getType: () => HouseOne.type, getTexture: () => HouseOne.texture },
  
    { name: "Tree Birch 0", category: "plants", create: (scene, x, y, options) => new Tree(scene, x, y, 0), id: "tree_0", getType: () => Tree.types?.[0], getTexture: () => Tree.texture },
    { name: "Tree Birch 1", category: "plants", create: (scene, x, y, options) => new Tree(scene, x, y, 1), id: "tree_1", getType: () => Tree.types?.[1], getTexture: () => Tree.texture },
    { name: "Tree Birch 2", category: "plants", create: (scene, x, y, options) => new Tree(scene, x, y, 2), id: "tree_2", getType: () => Tree.types?.[2], getTexture: () => Tree.texture },
    { name: "Tree Birch 3", category: "plants", create: (scene, x, y, options) => new Tree(scene, x, y, 3), id: "tree_3", getType: () => Tree.types?.[3], getTexture: () => Tree.texture },
    { name: "Tree Birch 4", category: "plants", create: (scene, x, y, options) => new Tree(scene, x, y, 4), id: "tree_4", getType: () => Tree.types?.[4], getTexture: () => Tree.texture },
    { name: "Autumn Tree Birch 0", category: "plants", create: (scene, x, y, options) => new Tree(scene, x, y, 5), id: "tree_5", getType: () => Tree.types?.[5], getTexture: () => Tree.texture },
    { name: "Autumn Tree Birch 1", category: "plants", create: (scene, x, y, options) => new Tree(scene, x, y, 6), id: "tree_6", getType: () => Tree.types?.[6], getTexture: () => Tree.texture },
    { name: "Autumn Tree Birch 2", category: "plants", create: (scene, x, y, options) => new Tree(scene, x, y, 7), id: "tree_7", getType: () => Tree.types?.[7], getTexture: () => Tree.texture },
    { name: "Autumn Tree Birch 3", category: "plants", create: (scene, x, y, options) => new Tree(scene, x, y, 8), id: "tree_8", getType: () => Tree.types?.[8], getTexture: () => Tree.texture },
    { name: "Autumn Tree Birch 4", category: "plants", create: (scene, x, y, options) => new Tree(scene, x, y, 9), id: "tree_9", getType: () => Tree.types?.[9], getTexture: () => Tree.texture },
  
    { name: "Rock 0", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 0), id: "rock_0", getType: () => Rock.types?.[0], getTexture: () => Rock.texture },
    { name: "Rock 1", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 1), id: "rock_1", getType: () => Rock.types?.[1], getTexture: () => Rock.texture },
    { name: "Rock 2", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 2), id: "rock_2", getType: () => Rock.types?.[2], getTexture: () => Rock.texture },
    { name: "Rock 3", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 3), id: "rock_3", getType: () => Rock.types?.[3], getTexture: () => Rock.texture },
    { name: "Rock 4", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 4), id: "rock_4", getType: () => Rock.types?.[4], getTexture: () => Rock.texture },
    { name: "Rock 5", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 5), id: "rock_5", getType: () => Rock.types?.[5], getTexture: () => Rock.texture },
    { name: "Rock 6", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 6), id: "rock_6", getType: () => Rock.types?.[6], getTexture: () => Rock.texture },
    { name: "Rock 7", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 7), id: "rock_7", getType: () => Rock.types?.[7], getTexture: () => Rock.texture },
    { name: "Rock 8", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 8), id: "rock_8", getType: () => Rock.types?.[8], getTexture: () => Rock.texture },
    { name: "Rock 9", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 9), id: "rock_9", getType: () => Rock.types?.[9], getTexture: () => Rock.texture },
    { name: "Rock 10", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 10), id: "rock_10", getType: () => Rock.types?.[10], getTexture: () => Rock.texture },
    { name: "Rock 11", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 11), id: "rock_11", getType: () => Rock.types?.[11], getTexture: () => Rock.texture },
    { name: "Rock 12", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 12), id: "rock_12", getType: () => Rock.types?.[12], getTexture: () => Rock.texture },
    { name: "Rock 13", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 13), id: "rock_13", getType: () => Rock.types?.[13], getTexture: () => Rock.texture },
    { name: "Rock 14", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 14), id: "rock_14", getType: () => Rock.types?.[14], getTexture: () => Rock.texture },
    { name: "Rock 15", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 15), id: "rock_15", getType: () => Rock.types?.[15], getTexture: () => Rock.texture },
    { name: "Rock 16", category: "props", create: (scene, x, y, options) => new Rock(scene, x, y, 16), id: "rock_16", getType: () => Rock.types?.[16], getTexture: () => Rock.texture },
  
    { name: "WoodBox Large", category: "props", create: (scene, x, y, options) => new WoodBox(scene, x, y, 0), id: "woodbox_0", getType: () => WoodBox.types?.[0], getTexture: () => WoodBox.texture },
    { name: "WoodBox Small", category: "props", create: (scene, x, y, options) => new WoodBox(scene, x, y, 1), id: "woodbox_1", getType: () => WoodBox.types?.[1], getTexture: () => WoodBox.texture },
  
    { name: "Covered WoodBox Large", category: "props", create: (scene, x, y, options) => new WoodBox(scene, x, y, 2), id: "woodbox_2", getType: () => WoodBox.types?.[2], getTexture: () => WoodBox.texture },
    { name: "Covered WoodBox Small", category: "props", create: (scene, x, y, options) => new WoodBox(scene, x, y, 3), id: "woodbox_3", getType: () => WoodBox.types?.[3], getTexture: () => WoodBox.texture },
  
    { name: "Empty Pallet Crate Horizontal", category: "props", create: (scene, x, y, options) => new Crate(scene, x, y, 0), id: "crate_0", getType: () => Crate.types?.[0], getTexture: () => Crate.texture },
    { name: "Empty Pallet Crate Vertical", category: "props", create: (scene, x, y, options) => new Crate(scene, x, y, 1), id: "crate_1", getType: () => Crate.types?.[1], getTexture: () => Crate.texture },
    
    { name: "Apple Pallet Crate Horizontal", category: "props", create: (scene, x, y, options) => new Crate(scene, x, y, 2), id: "crate_2", getType: () => Crate.types?.[2], getTexture: () => Crate.texture },
    { name: "Apple Pallet Crate Vertical", category: "props", create: (scene, x, y, options) => new Crate(scene, x, y, 3), id: "crate_3", getType: () => Crate.types?.[3], getTexture: () => Crate.texture },
    
    { name: "Lemon Pallet Crate Horizontal", category: "props", create: (scene, x, y, options) => new Crate(scene, x, y, 4), id: "crate_4", getType: () => Crate.types?.[4], getTexture: () => Crate.texture },
    { name: "Lemon Pallet Crate Vertical", category: "props", create: (scene, x, y, options) => new Crate(scene, x, y, 5), id: "crate_5", getType: () => Crate.types?.[5], getTexture: () => Crate.texture },

    { name: "Pear Pallet Crate Horizontal", category: "props", create: (scene, x, y, options) => new Crate(scene, x, y, 6), id: "crate_6", getType: () => Crate.types?.[6], getTexture: () => Crate.texture },
    { name: "Pear Pallet Crate Vertical", category: "props", create: (scene, x, y, options) => new Crate(scene, x, y, 7), id: "crate_7", getType: () => Crate.types?.[7], getTexture: () => Crate.texture },

    { name: "Fish Pallet Crate Horizontal", category: "props", create: (scene, x, y, options) => new Crate(scene, x, y, 8), id: "crate_8", getType: () => Crate.types?.[8], getTexture: () => Crate.texture },
    { name: "Fish Pallet Crate Vertical", category: "props", create: (scene, x, y, options) => new Crate(scene, x, y, 9), id: "crate_9", getType: () => Crate.types?.[9], getTexture: () => Crate.texture },

    { name: "Carrot Pallet Crate Horizontal", category: "props", create: (scene, x, y, options) => new Crate(scene, x, y, 10), id: "crate_10", getType: () => Crate.types?.[10], getTexture: () => Crate.texture },
    { name: "Carrot Pallet Crate Vertical", category: "props", create: (scene, x, y, options) => new Crate(scene, x, y, 11), id: "crate_11", getType: () => Crate.types?.[11], getTexture: () => Crate.texture },

    { name: "Cabbage Pallet Crate Horizontal", category: "props", create: (scene, x, y, options) => new Crate(scene, x, y, 12), id: "crate_12", getType: () => Crate.types?.[12], getTexture: () => Crate.texture },
    { name: "Cabbage Pallet Crate Vertical", category: "props", create: (scene, x, y, options) => new Crate(scene, x, y, 13), id: "crate_13", getType: () => Crate.types?.[13], getTexture: () => Crate.texture },
    
    { name: "Lamp", category: "props", create: (scene, x, y, options) => new Lamp(scene, x, y, options), id: "lamp", getType: () => Lamp.type, getTexture: () => Lamp.texture },
  
    { name: "Road Lamp Left", category: "props", create: (scene, x, y, options) => new RoadLamp(scene, x, y, 0), id: "roadlamp_left", getType: () => RoadLamp.types?.[0], getTexture: () => RoadLamp.texture },
    { name: "Road Lamp Right", category: "props", create: (scene, x, y, options) => new RoadLamp(scene, x, y, 1), id: "roadlamp_right", getType: () => RoadLamp.types?.[1], getTexture: () => RoadLamp.texture },
  
    { name: "Autumn Bush 0", category: "plants", create: (scene, x, y, options) => new Bush(scene, x, y, 0), id: "bush_0", getType: () => Bush.types?.[0], getTexture: () => Bush.texture },
    { name: "Autumn Bush 1", category: "plants", create: (scene, x, y, options) => new Bush(scene, x, y, 1), id: "bush_1", getType: () => Bush.types?.[1], getTexture: () => Bush.texture },
    { name: "Autumn Bush 2", category: "plants", create: (scene, x, y, options) => new Bush(scene, x, y, 2), id: "bush_2", getType: () => Bush.types?.[2], getTexture: () => Bush.texture },
    { name: "Autumn Bush 3", category: "plants", create: (scene, x, y, options) => new Bush(scene, x, y, 3), id: "bush_3", getType: () => Bush.types?.[3], getTexture: () => Bush.texture },
    { name: "Autumn Bush 4", category: "plants", create: (scene, x, y, options) => new Bush(scene, x, y, 4), id: "bush_4", getType: () => Bush.types?.[4], getTexture: () => Bush.texture },
    { name: "Autumn Bush 5", category: "plants", create: (scene, x, y, options) => new Bush(scene, x, y, 5), id: "bush_5", getType: () => Bush.types?.[5], getTexture: () => Bush.texture },
    { name: "Autumn Bush 6", category: "plants", create: (scene, x, y, options) => new Bush(scene, x, y, 6), id: "bush_6", getType: () => Bush.types?.[6], getTexture: () => Bush.texture },
    { name: "Bush 0", category: "plants", create: (scene, x, y, options) => new Bush(scene, x, y, 7), id: "bush_7", getType: () => Bush.types?.[7], getTexture: () => Bush.texture },
    { name: "Bush 1", category: "plants", create: (scene, x, y, options) => new Bush(scene, x, y, 8), id: "bush_8", getType: () => Bush.types?.[8], getTexture: () => Bush.texture },
    { name: "Bush 2", category: "plants", create: (scene, x, y, options) => new Bush(scene, x, y, 9), id: "bush_9", getType: () => Bush.types?.[9], getTexture: () => Bush.texture },
    { name: "Bush 3", category: "plants", create: (scene, x, y, options) => new Bush(scene, x, y, 10), id: "bush_10", getType: () => Bush.types?.[10], getTexture: () => Bush.texture },
    { name: "Bush 4", category: "plants", create: (scene, x, y, options) => new Bush(scene, x, y, 11), id: "bush_11", getType: () => Bush.types?.[11], getTexture: () => Bush.texture },
    { name: "Bush 5", category: "plants", create: (scene, x, y, options) => new Bush(scene, x, y, 12), id: "bush_12", getType: () => Bush.types?.[12], getTexture: () => Bush.texture },
    { name: "Bush 6", category: "plants", create: (scene, x, y, options) => new Bush(scene, x, y, 13), id: "bush_13", getType: () => Bush.types?.[13], getTexture: () => Bush.texture },
  
    { name: "Large Cabbage", category: "plants", create: (scene, x, y, options) => new MoreNature(scene, x, y, 0), id: "morenature_0", getType: () => MoreNature.types?.[0], getTexture: () => MoreNature.texture },
    { name: "Medium Cabbage", category: "plants", create: (scene, x, y, options) => new MoreNature(scene, x, y, 1), id: "morenature_1", getType: () => MoreNature.types?.[1], getTexture: () => MoreNature.texture },
    { name: "Small Cabbage", category: "plants", create: (scene, x, y, options) => new MoreNature(scene, x, y, 2), id: "morenature_2", getType: () => MoreNature.types?.[2], getTexture: () => MoreNature.texture },
    { name: "Large Pumpkin", category: "plants", create: (scene, x, y, options) => new MoreNature(scene, x, y, 3), id: "morenature_3", getType: () => MoreNature.types?.[3], getTexture: () => MoreNature.texture },
    { name: "Medium Pumpkin", category: "plants", create: (scene, x, y, options) => new MoreNature(scene, x, y, 4), id: "morenature_4", getType: () => MoreNature.types?.[4], getTexture: () => MoreNature.texture },
    { name: "Small Pumpkin", category: "plants", create: (scene, x, y, options) => new MoreNature(scene, x, y, 5), id: "morenature_5", getType: () => MoreNature.types?.[5], getTexture: () => MoreNature.texture },
    { name: "Large Carrot", category: "plants", create: (scene, x, y, options) => new MoreNature(scene, x, y, 6), id: "morenature_6", getType: () => MoreNature.types?.[6], getTexture: () => MoreNature.texture },
    { name: "Medium Carrot", category: "plants", create: (scene, x, y, options) => new MoreNature(scene, x, y, 7), id: "morenature_7", getType: () => MoreNature.types?.[7], getTexture: () => MoreNature.texture },
    { name: "Small Carrot", category: "plants", create: (scene, x, y, options) => new MoreNature(scene, x, y, 8), id: "morenature_8", getType: () => MoreNature.types?.[8], getTexture: () => MoreNature.texture },
  
    { name: "Barrel", category: "props", create: (scene, x, y, options) => new Barrel(scene, x, y, 0), id: "barrel_0", getType: () => Barrel.types?.[0], getTexture: () => Barrel.texture },
    { name: "Barrel Without Cap", category: "props", create: (scene, x, y, options) => new Barrel(scene, x, y, 1), id: "barrel_1", getType: () => Barrel.types?.[1], getTexture: () => Barrel.texture },
    { name: "Barrel With Water", category: "props", create: (scene, x, y, options) => new Barrel(scene, x, y, 2), id: "barrel_2", getType: () => Barrel.types?.[2], getTexture: () => Barrel.texture },
    { name: "Barrel With Plants", category: "props", create: (scene, x, y, options) => new Barrel(scene, x, y, 3), id: "barrel_3", getType: () => Barrel.types?.[3], getTexture: () => Barrel.texture },
    { name: "Barrel With Props", category: "props", create: (scene, x, y, options) => new Barrel(scene, x, y, 4), id: "barrel_4", getType: () => Barrel.types?.[4], getTexture: () => Barrel.texture },
    { name: "Barrel Sided", category: "props", create: (scene, x, y, options) => new Barrel(scene, x, y, 5), id: "barrel_5", getType: () => Barrel.types?.[5], getTexture: () => Barrel.texture },
    { name: "Barrel Pile", category: "props", create: (scene, x, y, options) => new Barrel(scene, x, y, 6), id: "barrel_6", getType: () => Barrel.types?.[6], getTexture: () => Barrel.texture },
    
    { name: "Bench 1 Horizontal", category: "props", create: (scene, x, y, options) => new Outdoor(scene, x, y, 0), id: "outdoor_0", getType: () => Outdoor.types?.[0], getTexture: () => Outdoor.texture },
    { name: "Bench 1 Vertical 1", category: "props", create: (scene, x, y, options) => new Outdoor(scene, x, y, 1), id: "outdoor_1", getType: () => Outdoor.types?.[1], getTexture: () => Outdoor.texture },
    { name: "Bench 1 Vertical 2", category: "props", create: (scene, x, y, options) => new Outdoor(scene, x, y, 2), id: "outdoor_2", getType: () => Outdoor.types?.[2], getTexture: () => Outdoor.texture },
    
    { name: "Bench 2 Horizontal Large", category: "props", create: (scene, x, y, options) => new Outdoor(scene, x, y, 3), id: "outdoor_3", getType: () => Outdoor.types?.[3], getTexture: () => Outdoor.texture },
    { name: "Bench 2 Horizontal Small", category: "props", create: (scene, x, y, options) => new Outdoor(scene, x, y, 4), id: "outdoor_4", getType: () => Outdoor.types?.[4], getTexture: () => Outdoor.texture },
    { name: "Bench 2 Vertical Large", category: "props", create: (scene, x, y, options) => new Outdoor(scene, x, y, 5), id: "outdoor_5", getType: () => Outdoor.types?.[5], getTexture: () => Outdoor.texture },
    { name: "Bench 2 Vertical Small", category: "props", create: (scene, x, y, options) => new Outdoor(scene, x, y, 6), id: "outdoor_6", getType: () => Outdoor.types?.[6], getTexture: () => Outdoor.texture },
    
    { name: "Table 1 Horizontal", category: "props", create: (scene, x, y, options) => new Outdoor(scene, x, y, 7), id: "outdoor_7", getType: () => Outdoor.types?.[7], getTexture: () => Outdoor.texture },
    { name: "Table 1 Vertical", category: "props", create: (scene, x, y, options) => new Outdoor(scene, x, y, 8), id: "outdoor_8", getType: () => Outdoor.types?.[8], getTexture: () => Outdoor.texture },
    
    { name: "Table 2 Horizontal", category: "props", create: (scene, x, y, options) => new Outdoor(scene, x, y, 9), id: "outdoor_9", getType: () => Outdoor.types?.[9], getTexture: () => Outdoor.texture },
    { name: "Table 2 Vertical", category: "props", create: (scene, x, y, options) => new Outdoor(scene, x, y, 10), id: "outdoor_10", getType: () => Outdoor.types?.[10], getTexture: () => Outdoor.texture },
  ];

  constructor(scene, list = []) {
    this.scene = scene;
    this.list = list;
    this.allElementsByChunk = new Map();
    this.loadedChunks = new Set();
    this.serverIdIndex = new Map();
    this.playerChunk = null;
  }

  loadJsonMap(jsonArray = []) {
    this.allElementsByChunk.clear();
    jsonArray.forEach(el => {
      if (typeof el.x !== 'number' || typeof el.y !== 'number' || !el.id) return;
      const cx = Math.floor(el.x / CHUNK_SIZE);
      const cy = Math.floor(el.y / CHUNK_SIZE);
      const key = `${cx}:${cy}`;
      if (!this.allElementsByChunk.has(key)) this.allElementsByChunk.set(key, []);
      this.allElementsByChunk.get(key).push(el);
    });
    this.playerChunk = null;
  }

  _chunkKey(cx, cy) { return `${cx}:${cy}`; }

  create(id, scene, x, y, options = {}) {
    const type = MapObjectManager.objects.find(obj => obj.id === id);
    if (!type) throw new Error(`Unknown object id: ${id}`);
    const element = type.create(scene, x, y, options);
    element.typeId = id;
    element.typeOptions = options;
    element.serverId = options.serverId;
    if (!element.idBase) element.idBase = `${id}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.list.push(element);
    if (element.serverId) this.serverIdIndex.set(element.serverId, element);
    return element;
  }

  exportElements() {
    return this.list.map(element => ({
      x: element.x,
      y: element.y,
      id: element.typeId,
      options: {
        ...element.typeOptions,
        serverId: element.serverId
      }
    }));
  }

  exportElement(element) {
    return {
      x: element.x,
      y: element.y,
      id: element.typeId,
      options: {
        ...element.typeOptions,
        serverId: element.serverId
      }
    };
  }

  destroy(element) {
    try {
      const index = this.list.findIndex(item => item.idBase === element.idBase);
      if (index > -1) {
        const item = this.list[index];
        if (typeof item.destroy === 'function') {
          try { item.destroy(); } catch (err) {}
        }
        try { if (item.image && typeof item.image.destroy === 'function') item.image.destroy(); } catch(e){}
        this.list.splice(index, 1);
        if (item.serverId) this.serverIdIndex.delete(item.serverId);
      }
    } catch (e) {}
  }
  
  destroyByServerId(serverId) {
    try {
      const index = this.list.findIndex(item => item.serverId == serverId);
      if (index > -1) {
        const item = this.list[index];
        if (typeof item.destroy === 'function') {
          try { item.destroy(); } catch (err) {}
        }
        try { if (item.image && typeof item.image.destroy === 'function') item.image.destroy(); } catch(e){}
        this.list.splice(index, 1);
        if (item.serverId) this.serverIdIndex.delete(item.serverId);
      }
    } catch (e) {}
  }
  
  moveByServerId(serverId, x, y) {
    try {
      const index = this.list.findIndex(item => item.serverId == serverId);
      if (index > -1) {
        const item = this.list[index];
        
        item.setPosition(x, y);
      }
    } catch (e) {}
  }

  destroyAll() {
    if (this.list.length === 0) return;
    const copy = [...this.list];
    copy.forEach(el => this.destroy(el));
  }

  loadChunkByCoords(cx, cy) {
    const key = this._chunkKey(cx, cy);
    if (this.loadedChunks.has(key)) return 0;
    const elements = this.allElementsByChunk.get(key) || [];
    const created = [];
    elements.forEach(el => {
      try {
        if (el.options && el.options.serverId && this.serverIdIndex.has(el.options.serverId)) return;
        const obj = this.create(el.id, this.scene, el.x, el.y, el.options || {});
        created.push(obj);
      } catch (e) {}
    });
    this.loadedChunks.add(key);
    return created.length;
  }

  unloadChunkByCoords(cx, cy) {
    const key = this._chunkKey(cx, cy);
    if (!this.loadedChunks.has(key)) return 0;
    const x0 = cx * CHUNK_SIZE;
    const x1 = (cx + 1) * CHUNK_SIZE;
    const y0 = cy * CHUNK_SIZE;
    const y1 = (cy + 1) * CHUNK_SIZE;
    const toRemove = this.list.filter(item => item.x >= x0 && item.x < x1 && item.y >= y0 && item.y < y1);
    toRemove.forEach(item => this.destroy(item));
    this.loadedChunks.delete(key);
    return toRemove.length;
  }

  _updateChunks() {
    const player = this.scene?.player?.sprite;
    if (!player || typeof player.x !== 'number' || typeof player.y !== 'number') return;
    const pcx = Math.floor(player.x / CHUNK_SIZE);
    const pcy = Math.floor(player.y / CHUNK_SIZE);
    const newPlayerChunk = `${pcx}:${pcy}`;
    if (newPlayerChunk === this.playerChunk) return;
    const desired = new Set();
    const radiusChunks = Math.round(this.scene.getCameraInfo().maxSize / 500);
    for (let dx = -radiusChunks; dx <= radiusChunks; dx++) {
      for (let dy = -radiusChunks; dy <= radiusChunks; dy++) {
        desired.add(this._chunkKey(pcx + dx, pcy + dy));
      }
    }
    for (const k of desired) {
      if (!this.loadedChunks.has(k)) {
        const [cx, cy] = k.split(':').map(Number);
        this.loadChunkByCoords(cx, cy);
      }
    }
    for (const k of Array.from(this.loadedChunks)) {
      if (!desired.has(k)) {
        const [cx, cy] = k.split(':').map(Number);
        this.unloadChunkByCoords(cx, cy);
      }
    }
    this.playerChunk = newPlayerChunk;
  }

  update(scene, time, delta) {
    this._updateChunks();
    const cam = this.scene.cameras.main;
    const view = cam.worldView;
    const viewPadded = new Phaser.Geom.Rectangle(view.x - PAD, view.y - PAD, view.width + PAD * 2, view.height + PAD * 2);
    this.list.forEach(element => {
      if (!element) return;
      const child = element.image || element.sprite || element;
      if (!child || !child.getBounds) return;
      const inView = Phaser.Geom.Intersects.RectangleToRectangle(viewPadded, child.getBounds());
      if (typeof child.setVisible === 'function') child.setVisible(inView);
      if (child.body && typeof child.body.enable !== 'undefined') child.body.enable = inView;
      element.active = inView;
      if (inView && typeof element.update === 'function') {
        try { element.update(time, delta); } catch(e) {}
      }
    });
  }

  loadChunk({ cx, cy }) { return this.loadChunkByCoords(cx, cy); }
  unloadChunk({ cx, cy }) { return this.unloadChunkByCoords(cx, cy); }
  getChunkElements(cx, cy) { return this.allElementsByChunk.get(this._chunkKey(cx, cy)) || []; }
}
