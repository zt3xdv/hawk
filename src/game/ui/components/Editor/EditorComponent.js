import HudComponent from '../../hud/HudComponent.js';
import Cache from '../../../../utils/Cache.js';

export default class EditorComponent extends HudComponent {
  constructor({ onEditor }) {
    super('editor');
    this.onEditor = onEditor;
  }

  render(parent) {
    this.el = document.createElement('div');
    this.el.className = 'editorbtn-container';

    const btn = document.createElement('button');
    btn.innerHTML = '<img src="' + Cache.getBlob("assets/icons/box.png").dataUrl + '">';
    btn.className = 'editorbtn-button';
    btn.onclick = this.onEditor;

    this.el.appendChild(btn);
    parent.appendChild(this.el);
  }
}
