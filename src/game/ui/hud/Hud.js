import HudComponent from './HudComponent.js';

export default class Hud {
  constructor(parentElement, { components = [] }) {
    this.container = document.createElement('div');
    this.container.id = 'game-hud';
    this.container.style.display = "none";
    Object.assign(this.container.style, {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none'
    });
    
    const fps = document.createElement("p");
    fps.innerText = "FPS: 0";
    fps.id = "fps-text";
    this.container.appendChild(fps);
    
    const computed = getComputedStyle(parentElement);
    if (computed.position === 'static') {
      parentElement.style.position = 'relative';
    }

    parentElement.appendChild(this.container);
    this.components = components.map(cfg => {
      const CompClass = cfg.type;
      const comp = new CompClass(cfg.options || {});
      comp.render(this.container);
      return comp;
    });
  }

  getComponent(name) {
    return this.components.find(c => c.name === name);
  }
}
