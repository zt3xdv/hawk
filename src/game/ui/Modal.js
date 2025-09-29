class Modal {
  constructor(domElement, title, scene = null, opts = { showHeader: true }) {
    this.scene = scene;
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    
    this.modal = document.createElement('div');
    this.modal.className = 'modal-container';
    
    const header = document.createElement('div');
    header.className = 'modal-header';
    
    const h2 = document.createElement('p');
    h2.textContent = title;
    
    header.appendChild(h2);
    
    this.closeBtn = document.createElement('button');
    this.closeBtn.className = 'modal-close';
    this.closeBtn.innerHTML = '&times;';
    this.closeBtn.addEventListener('click', () => this.toggle());
    
    header.appendChild(this.closeBtn);
    
    this.body = document.createElement('div');
    this.body.className = 'modal-body';
    
    if (opts.showHeader) {
      this.modal.append(header, this.body);
    } else {
      this.modal.append(this.body);
    }
    this.overlay.appendChild(this.modal);
    domElement.appendChild(this.overlay);
    
    this.isOpen = false;
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.overlay.style.display = this.isOpen ? 'flex' : 'none';
    
    if (this.scene) this.scene.inputManager.joystickModalEnable(this.isOpen);
  }
}

export default Modal;
