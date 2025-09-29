import Modal from "./Modal.js";

class ErrorModal extends Modal {
  constructor(domElement, scene) {
    super(domElement, "Error", scene);
  }
  
  throwError(error, callback = () => window.location.reload()) {
    this.body.innerHTML = error;
    this.closeBtn.addEventListener('click', callback);
    
    this.toggle();
  }
}

export default ErrorModal;
