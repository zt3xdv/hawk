export default class HudComponent {
  constructor(name) {
    this.name = name;
    this.el = null;
  }

  render(parent) {}

  toggle() {
    if (!this.el) return;
    const isHidden = this.el.style.display === 'none';
    this.el.style.display = isHidden ? '' : 'none';
  }
  
  close() {
    const isHidden = true;
    this.el.style.display = isHidden ? '' : 'none';
  }
}
