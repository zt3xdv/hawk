import nipplejs from '../../nipple/index.js';
import ChatBoxComponent from '../ui/components/ChatBox/ChatBoxComponent.js';
import OptionsComponent from '../ui/components/Options/OptionsComponent.js';
import ZoomComponent from '../ui/components/Zoom/ZoomComponent.js';
import AccComponent from '../ui/components/Acc/AccComponent.js';
import Hud from '../ui/hud/Hud.js';
import Modal from '../ui/Modal.js';
import OptionsModal from '../ui/OptionsModal.js';
import PeopleModal from '../ui/PeopleModal.js';
import MapObjectManager from './MapObjectManager.js';
import TextureExtractor from '../utils/TextureExtractor.js';
import { id } from '../utils/Utils.js';

export default class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.keys = scene.input.keyboard.addKeys('W,A,S,D');
    this.inputVector = { x: 0, y: 0 };
    this.lastJoystickValue = true;
    this.joystickOptions = {
      zone: document.getElementById('game-container'),
      mode: 'dynamic',
      size: 100,
      color: 'black',
      fadeTime: 120,
    };
    
    this.categoryConfig = {
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
  }
  
  _createJoystick() {
    this.joystick = nipplejs.create(this.joystickOptions);

    this.moveHandler = (evt, data) => {
      this.inputVector.x = data.vector.x;
      this.inputVector.y = -data.vector.y;
    };
    this.endHandler = () => {
      this.inputVector.x = 0;
      this.inputVector.y = 0;
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
       
    modal.body.innerHTML = '';
  
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
  
    modal.body.appendChild(categoriesContainer);
  
    function showCategoryView(name, { config, items }) {
      modal.body.innerHTML = '';
  
      const header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML = `
        <div class="title">
          <img src="${config.icon}" class="category-icon">
          <h2>${name}</h2>
        </div>
      `;
      modal.body.appendChild(header);
  
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
        
        const createBtn = card.querySelector("button");
        createBtn.textContent = "Create";
        createBtn.addEventListener('click', (ev) => {
          const serverId = id(64);
          
          self.scene.mapObjects.create(
            obj.id,
            self.scene,
            self.scene.player.sprite.x + 100,
            self.scene.player.sprite.y,
            {
              serverId
            }
          );
          
          self.scene.networkManager.emitCreateElement(self.scene.mapObjects.list[self.scene.mapObjects.list.findIndex(el => el.serverId == serverId)]);
          //self.editorModal.toggle();
        });
        list.appendChild(card);
      });
  
      modal.body.appendChild(list);
  
      const backBtn = document.createElement('button');
      backBtn.className = 'back-to-categories-btn';
      backBtn.textContent = 'Back';
      backBtn.addEventListener('click', () => {
        modal.body.innerHTML = '';
        modal.body.appendChild(categoriesContainer);
      });
      header.appendChild(backBtn);
    }
  }
  
  getDirection() {
    let x = 0, y = 0;
    if (this.keys.A.isDown) x = -1;
    if (this.keys.D.isDown) x = 1;
    if (this.keys.W.isDown) y = -1;
    if (this.keys.S.isDown) y = 1;
    return (x || y) ? { x, y } : this.inputVector;
  }
}
