import nipplejs from '../../nipple/index.js';
import ChatBoxComponent from '../ui/components/ChatBox/ChatBoxComponent.js';
import OptionsComponent from '../ui/components/Options/OptionsComponent.js';
import ZoomComponent from '../ui/components/Zoom/ZoomComponent.js';
import AccComponent from '../ui/components/Acc/AccComponent.js';
import Hud from '../ui/hud/Hud.js';
import Modal from '../ui/Modal.js';
import OptionsModal from '../ui/OptionsModal.js';
import PeopleModal from '../ui/PeopleModal.js';
import PlayerInfoModal from '../ui/PlayerInfoModal.js';
import MapObjectManager from './MapObjectManager.js';
import TextureExtractor from '../utils/TextureExtractor.js';
import { id } from '../utils/Utils.js';

export default class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.keys = scene.input.keyboard.addKeys('W,A,S,D,SHIFT');
    this.inputVector = { x: 0, y: 0 };
    this.isRunning = false;
    this.lastJoystickValue = true;
    this.joystickOptions = {
      zone: document.getElementById('game-container'),
      mode: 'dynamic',
      size: 100,
      color: 'black',
      fadeTime: 120,
    };
    
    this.categoryConfig = {
      special: {
        icon: 'assets/icons/generalinfo.png',
        description: 'Portals and special items.'
      },
      plants: {
        icon: 'assets/icons/plant.png',
        description: 'Trees, flowers, and natural things.'
      },
      props: {
        icon: 'assets/icons/fire.png',
        description: 'Barrels, boxes, and more props.'
      },
      building: {
        icon: 'assets/icons/generalinfo.png',
        description: 'Buildings, houses, and moee.'
      }
    };

    this.inputVector = { x: 0, y: 0 };
    this._createJoystick();
    
    this.optionsModal = new OptionsModal(document.getElementById("game-container"), this.scene);
    this.editorModal = new Modal(document.getElementById("game-container"), "Editor", this.scene);
    this.peopleModal = new PeopleModal(document.getElementById("game-container"), this.scene);
    this.playerInfoModal = new PlayerInfoModal(document.getElementById("game-container"), this.scene);
    this.setupEditorModal(this.editorModal);
    
    this.hud = new Hud(document.getElementById("game-container"), {
      components: [
        { type: ChatBoxComponent, options: { scene, network: scene.networkManager } },
        { type: OptionsComponent, options: { scene } },
        { type: ZoomComponent, options: {
            onZoomIn: () => scene.zoomIn(),
            onZoomOut: () => scene.zoomOut()
          }
        },
        { type: AccComponent, options: { scene } }
      ]
    });
    
    setTimeout(() => this.updateEditorVisibility(), 100);
    
    this.scene.events.on('objectCreated', () => {
      if (this.currentEditorMode === 'move') {
        this.setupMoveMode();
      }
      if (this.currentEditorMode === 'delete') {
        this.setupDeleteMode();
      }
    });
  }
  
  _createJoystick() {
    this.joystick = nipplejs.create(this.joystickOptions);
    this.joystickRunThreshold = 0.7;
    this.joystickRunning = false;

    this.moveHandler = (evt, data) => {
      const rawX = data.vector.x;
      const rawY = -data.vector.y;
      
      const deadzone = 0.2;
      const magnitude = Math.sqrt(rawX * rawX + rawY * rawY);
      
      if (magnitude < deadzone) {
        this.inputVector.x = 0;
        this.inputVector.y = 0;
      } else {
        this.inputVector.x = rawX;
        this.inputVector.y = rawY;
      }
      
      const distance = data.distance || 0;
      const maxDistance = this.joystickOptions.size / 2;
      const normalized = maxDistance > 0 ? distance / maxDistance : 0;
      
      this.joystickRunning = normalized > this.joystickRunThreshold;
    };
    this.endHandler = () => {
      this.inputVector.x = 0;
      this.inputVector.y = 0;
      this.joystickRunning = false;
    };

    this.joystick.on('move', this.moveHandler);
    this.joystick.on('end', this.endHandler);
  }

  setKeysStatus(status) {
    if (!status) {
      this.scene.input.keyboard.disableGlobalCapture();
    } else {
      this.scene.input.keyboard.enableGlobalCapture();
    }
    
    for (const k in this.keys) {
      if (this.keys[k]) {
        this.keys[k].enabled = status;
      }
    }
  }

  joystickSetEnabled(enabled, logLast = true) {
    if (logLast) this.lastJoystickValue = enabled;
    if (enabled) {
      if (!this.joystick) {
        this._createJoystick();
      }
    } else {
      if (this.joystick) {
        this.joystick.destroy();
        this.joystick = null;
        document.querySelectorAll('.nipple')[0]?.remove();
      }
      this.inputVector.x = 0;
      this.inputVector.y = 0;
    }
  }
  
  joystickModalEnable(modalValue) {
    if (modalValue == true) {
      this.joystickSetEnabled(false, false);
    } else {
      this.joystickSetEnabled(this.lastJoystickValue, false);
    }
  }

  setupEditorModal(modal) {
    const self = this;
    this.currentEditorMode = 'idle';
    this.selectedElement = null;
    this.selectedTileType = 'grass';
    this.draggedObject = null;
    this.dragOffset = { x: 0, y: 0 };
       
    modal.body.innerHTML = '';
  
    const modesContainer = document.createElement('div');
    modesContainer.className = 'editor-modes-container';
    modesContainer.innerHTML = `
      <div class="editor-section">
        <h3>Editor Mode</h3>
        <div class="mode-buttons">
          <button class="mode-btn active" data-mode="idle">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Idle</span>
          </button>
          <button class="mode-btn" data-mode="move">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"></path>
            </svg>
            <span>Move</span>
          </button>
          <button class="mode-btn" data-mode="elements">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <span>Elements</span>
          </button>
          <button class="mode-btn" data-mode="tiles">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Tiles</span>
          </button>
          <button class="mode-btn" data-mode="delete">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </div>
    `;
    
    modal.body.appendChild(modesContainer);
    
    const modeButtons = modesContainer.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        self.currentEditorMode = mode;
        
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        self.updateEditorCursor();
        self.updateEditorContent(modal);
        self.setupMoveMode();
        self.setupDeleteMode();
      });
    });
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'editor-content-container';
    modal.body.appendChild(contentContainer);
    
    this.updateEditorContent(modal);
  }
  
  updateEditorCursor() {
    const canvas = this.scene.game.canvas;
    const cursors = {
      idle: 'default',
      move: 'grab',
      elements: 'crosshair',
      tiles: 'crosshair',
      delete: 'pointer'
    };
    canvas.style.cursor = cursors[this.currentEditorMode] || 'default';
  }
  
  setupMoveMode() {
    const self = this;
    
    if (!this.scene.mapObjects || !this.scene.mapObjects.list) return;
    
    if (this.currentEditorMode === 'move') {
      this.scene.mapObjects.list.forEach(obj => {
        if (obj.image && !obj.image.getData('moveEnabled')) {
          obj.image.setInteractive({ draggable: true });
          obj.image.setData('moveEnabled', true);
        }
      });
    } else {
      this.scene.mapObjects.list.forEach(obj => {
        if (obj.image && obj.image.getData('moveEnabled')) {
          obj.image.disableInteractive();
          obj.image.removeAllListeners('pointerdown');
          obj.image.removeAllListeners('drag');
          obj.image.removeAllListeners('dragend');
          obj.image.setData('moveEnabled', false);
          obj.image.setAlpha(1);
        }
      });
      
      if (this.draggedObject) {
        this.draggedObject.image.setAlpha(1);
        this.draggedObject = null;
      }
    }
    
    if (this.currentEditorMode !== 'move') return;
    
    const moveObjects = this.scene.mapObjects.list.filter(obj => obj.image);
    
    moveObjects.forEach(obj => {
      obj.image.removeAllListeners('pointerdown');
      obj.image.removeAllListeners('drag');
      obj.image.removeAllListeners('dragend');
      
      obj.image.on('pointerdown', function(pointer) {
        self.draggedObject = obj;
        obj.image.setAlpha(0.6);
        self.scene.game.canvas.style.cursor = 'grabbing';
        
        const originX = (typeof obj.image.originX === 'number') ? obj.image.originX : 0.5;
        const originY = (typeof obj.image.originY === 'number') ? obj.image.originY : 0.5;
        const elemTopLeftX = obj.image.x - obj.image.displayWidth * originX;
        const elemTopLeftY = obj.image.y - obj.image.displayHeight * originY;
        
        self.dragOffset.x = pointer.worldX - elemTopLeftX;
        self.dragOffset.y = pointer.worldY - elemTopLeftY;
      });
      
      obj.image.on('drag', function(pointer) {
        if (!self.draggedObject || self.draggedObject !== obj) return;
        
        const targetTopLeftX = pointer.worldX - self.dragOffset.x;
        const targetTopLeftY = pointer.worldY - self.dragOffset.y;
        
        const originX = (typeof obj.image.originX === 'number') ? obj.image.originX : 0.5;
        const originY = (typeof obj.image.originY === 'number') ? obj.image.originY : 0.5;
        
        const newX = targetTopLeftX + obj.image.displayWidth * originX;
        const newY = targetTopLeftY + obj.image.displayHeight * originY;
        
        obj.setPosition(Math.floor(newX), Math.floor(newY));
      });
      
      obj.image.on('dragend', function(pointer) {
        if (self.draggedObject === obj) {
          obj.image.setAlpha(1);
          self.scene.game.canvas.style.cursor = 'grab';
          self.scene.networkManager.emitMoveElement(obj);
          self.draggedObject = null;
        }
      });
    });
  }
  
  setupDeleteMode() {
    const self = this;
    
    if (!this.scene.mapObjects || !this.scene.mapObjects.list) return;
    
    if (this.currentEditorMode === 'delete') {
      this.scene.mapObjects.list.forEach(obj => {
        if (obj.image && !obj.image.getData('deleteEnabled')) {
          obj.image.setInteractive();
          obj.image.setData('deleteEnabled', true);
        }
      });
    } else {
      this.scene.mapObjects.list.forEach(obj => {
        if (obj.image && obj.image.getData('deleteEnabled')) {
          obj.image.disableInteractive();
          obj.image.removeAllListeners('pointerdown');
          obj.image.removeAllListeners('pointerover');
          obj.image.removeAllListeners('pointerout');
          obj.image.setData('deleteEnabled', false);
          obj.image.setAlpha(1);
        }
      });
    }
    
    if (this.currentEditorMode !== 'delete') return;
    
    const deleteObjects = this.scene.mapObjects.list.filter(obj => obj.image);
    
    deleteObjects.forEach(obj => {
      obj.image.removeAllListeners('pointerdown');
      obj.image.removeAllListeners('pointerover');
      obj.image.removeAllListeners('pointerout');
      
      obj.image.on('pointerover', function() {
        obj.image.setAlpha(0.5);
        obj.image.setTint(0xff6666);
      });
      
      obj.image.on('pointerout', function() {
        obj.image.setAlpha(1);
        obj.image.clearTint();
      });
      
      obj.image.on('pointerdown', function() {
        obj.image.clearTint();
        self.scene.networkManager.emitDeleteElement(obj);
        self.scene.mapObjects.destroy(obj);
      });
    });
  }
  
  updateEditorContent(modal) {
    const contentContainer = modal.body.querySelector('.editor-content-container');
    if (!contentContainer) return;
    
    contentContainer.innerHTML = '';
    
    if (this.currentEditorMode === 'idle') {
      contentContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">Select a mode to start editing</p>';
    } else if (this.currentEditorMode === 'move') {
      contentContainer.innerHTML = '<p style="text-align: center; color: #4a9eff; padding: 20px;">Click and drag elements to move them</p>';
    } else if (this.currentEditorMode === 'elements') {
      this.showElementsEditor(contentContainer);
    } else if (this.currentEditorMode === 'tiles') {
      this.showTilesEditor(contentContainer);
    } else if (this.currentEditorMode === 'delete') {
      contentContainer.innerHTML = '<p style="text-align: center; color: #ff4a4a; padding: 20px;">Click on elements to delete them</p>';
    }
  }
  
  showElementsEditor(container) {
    const self = this;
    const categoriesContainer = document.createElement('div');
    categoriesContainer.className = 'categories-container';
  
    const categories = {};
    MapObjectManager.objects.forEach(obj => {
      const type = obj.getType();
      const cat = obj.category;
      if (!categories[cat]) {
        const cfg = this.categoryConfig[cat] || { icon: '', description: '', color: '#999' };
        categories[cat] = { config: cfg, items: [] };
      }
      categories[cat].items.push(
        {
          ...obj,
          icon: TextureExtractor.getTexture(self.scene, obj.getTexture(), type.uvStartPx.u, type.uvStartPx.v, type.widthPx, type.heightPx)
        }
      );
    });
  
    Object.entries(categories).forEach(([catName, catData]) => {
      const { icon, description, color } = catData.config;
      const count = catData.items.length;
  
      const catCard = document.createElement('div');
      catCard.className = 'category-card';
      catCard.style.borderColor = color;
      catCard.innerHTML = `
        <div class="category-header">
          <div class="title">
            <img src="${icon}" class="category-icon">
            <h2>${catName}</h2>
          </div>
        </div>
        <p>${description}</p>
        <p><b>Items:</b> ${count}</p>
        <button class="open-category-btn">Open Category</button>
      `;
  
      catCard.querySelector('button').addEventListener('click', () => {
        showCategoryView(catName, catData);
      });
  
      categoriesContainer.appendChild(catCard);
    });
  
    container.appendChild(categoriesContainer);
  
    function showCategoryView(name, { config, items }) {
      container.innerHTML = '';
  
      const header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML = `
        <div class="title">
          <img src="${config.icon}" class="category-icon">
          <h2>${name}</h2>
        </div>
      `;
      container.appendChild(header);
  
      const list = document.createElement('div');
      list.className = 'object-list';
  
      items.forEach(obj => {
        const card = document.createElement('div');
        card.className = 'object-card';
        card.innerHTML = `
          <div class="object-header">
            <img src="${obj.icon}">
          </div>
          <div class="object-footer">
            <h3>${obj.name}</h3>
            <button></button>
          </div>
        `;
        
        const selectBtn = card.querySelector("button");
        selectBtn.textContent = self.selectedElement === obj.id ? "Selected ✓" : "Select";
        if (self.selectedElement === obj.id) {
          card.classList.add('selected');
        }
        
        selectBtn.addEventListener('click', (ev) => {
          self.selectedElement = obj.id;
          
          list.querySelectorAll('.object-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          
          list.querySelectorAll('button').forEach(b => b.textContent = "Select");
          selectBtn.textContent = "Selected ✓";
        });
        list.appendChild(card);
      });
  
      container.appendChild(list);
  
      const backBtn = document.createElement('button');
      backBtn.className = 'back-to-categories-btn';
      backBtn.textContent = 'Back';
      backBtn.addEventListener('click', () => {
        container.innerHTML = '';
        container.appendChild(categoriesContainer);
      });
      header.appendChild(backBtn);
    }
  }
  
  showTilesEditor(container) {
    const self = this;
    container.innerHTML = `
      <div class="editor-section">
        <h4>Select Tile Type</h4>
        <div class="tile-type-buttons">
          <button class="tile-type-btn ${self.selectedTileType === 'grass' ? 'active' : ''}" data-type="grass">
            <div class="tile-preview tile-grass"></div>
            <span>Grass</span>
          </button>
          <button class="tile-type-btn ${self.selectedTileType === 'dirt' ? 'active' : ''}" data-type="dirt">
            <div class="tile-preview tile-dirt"></div>
            <span>Dirt</span>
          </button>
        </div>
      </div>
    `;
    
    const tileTypeButtons = container.querySelectorAll('.tile-type-btn');
    tileTypeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        self.selectedTileType = type;
        
        tileTypeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }
  
  handleEditorClick(worldX, worldY) {
    if (this.currentEditorMode === 'elements' && this.selectedElement && this.scene.dev) {
      this.placeElement(worldX, worldY);
    } else if (this.currentEditorMode === 'tiles' && this.scene.dev) {
      this.paintTile(worldX, worldY);
    }
  }
  
  placeElement(worldX, worldY) {
    if (!this.selectedElement) return;
    if (!this.scene.dev) return;
    
    const serverId = id(64);
    const element = this.scene.mapObjects.create(
      this.selectedElement,
      this.scene,
      Math.floor(worldX),
      Math.floor(worldY),
      { serverId }
    );
    
    this.scene.networkManager.emitCreateElement(element);
  }
  
  paintTile(worldX, worldY) {
    if (!this.scene.tileManager) return;
    if (!this.scene.dev) return;
    
    const tileData = this.scene.tileManager.setTile(worldX, worldY, this.selectedTileType);
    
    if (tileData) {
      this.scene.networkManager.send('setTile', tileData);
    }
  }
  
  updateEditorVisibility() {
    const editorBtn = document.querySelector('[data-modal="editor"]');
    
    if (editorBtn) {
      if (this.scene.dev) {
        editorBtn.style.display = 'flex';
      } else {
        editorBtn.style.display = 'none';
        if (this.editorModal.isOpen) {
          this.editorModal.close();
        }
      }
    }
    
    if (this.scene.dev) {
      this.setupMoveMode();
      this.setupDeleteMode();
    }
  }
  
  getDirection() {
    let x = 0, y = 0;
    if (this.keys.A.isDown) x = -1;
    if (this.keys.D.isDown) x = 1;
    if (this.keys.W.isDown) y = -1;
    if (this.keys.S.isDown) y = 1;
    
    const keyboardRunning = this.keys.SHIFT.isDown;
    const usingKeyboard = x !== 0 || y !== 0;
    
    this.isRunning = usingKeyboard ? keyboardRunning : this.joystickRunning;
    
    return (x || y) 
      ? { x, y, running: this.isRunning } 
      : { ...this.inputVector, running: this.isRunning };
  }
}
