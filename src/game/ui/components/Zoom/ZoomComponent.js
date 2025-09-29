import HudComponent from '../../hud/HudComponent.js';
import Cache from '../../../../utils/Cache.js';

export default class ZoomComponent extends HudComponent {
  constructor({ onZoomIn, onZoomOut }) {
    super('zoom');
    this.onZoomIn = onZoomIn;
    this.onZoomOut = onZoomOut;
  }

  render(parent) {
    this.el = document.createElement('div');
    this.el.className = 'zoom-container';

    const btnIn = document.createElement('button');
    btnIn.innerHTML = '<img src="' + Cache.getBlob("assets/icons/plus.png").dataUrl + '">';
    btnIn.className = 'zoom-button';
    btnIn.onclick = this.onZoomIn;

    const btnOut = document.createElement('button');
    btnOut.innerHTML = '<img src="' + Cache.getBlob("assets/icons/hyphen.png").dataUrl + '">';
    btnOut.className = 'zoom-button';
    btnOut.onclick = this.onZoomOut;

    this.el.appendChild(btnIn);
    this.el.appendChild(btnOut);
    parent.appendChild(this.el);
  }
}
