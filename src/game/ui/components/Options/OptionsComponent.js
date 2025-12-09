import HudComponent from '../../hud/HudComponent.js';
import Cache from '../../../../utils/Cache.js';

export default class OptionsComponent extends HudComponent {
  constructor({ scene }) {
    super('options');
    this.options = [
      {
        execute: () => {
          scene.inputManager.optionsModal.toggle();
        },
        html: "<img src='" + Cache.getBlob('assets/icons/control.png').dataUrl + "'>Settings",
        name: "options"
      },
      {
        execute: () => {
          window.location.reload();
        },
        html: "<img src='" + Cache.getBlob('assets/icons/leave.png').dataUrl + "'>Leave",
        name: "leave"
      }
    ];
    
    this.scene = scene;
    this.headerTime = null;
    
    this.scene.lightManager.onTimeChange((lightManager) => {
      if (this.headerTime) {
        this.headerTime.textContent = lightManager.getTimeF();
      }
    });
  }

  render(parent) {
    const btn = document.createElement('button');
    btn.innerHTML = '<img src="' + Cache.getBlob("assets/icons/settings.png").dataUrl + '">';
    btn.className = 'options-button';
    btn.onclick = () => this.toggle();

    this.el = document.createElement('ul');
    this.el.className = 'options-list';
    this.el.style.display = 'none';
    
    const header = document.createElement('div');
    header.innerHTML = "<div class=\"header-brand\"><img src='/logo.png'>Hawk</div>";
    header.className = 'options-header';
    
    this.headerTime = document.createElement('div');
    
    header.appendChild(this.headerTime);
    
    this.el.appendChild(header);

    this.options.forEach(opt => {
      const li = document.createElement('li');
      li.innerHTML = opt.html;
      li.addEventListener('click', () => {
        opt.execute();
      });
      
      this.el.appendChild(li);
    });

    parent.appendChild(btn);
    parent.appendChild(this.el);
  }
}
