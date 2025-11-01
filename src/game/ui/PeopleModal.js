import Modal from "./Modal.js";
import Options from "../utils/Options.js";
import { html, render } from "../../routes/people.js";

class PeopleModal extends Modal {
  constructor(domElement, scene) {
    super(domElement, "People", scene, { showHeader: false });

    this.scene = scene;
    this.body.innerHTML = html;
    render(this.body, true, true);
    
    this.body.querySelector("#closeBtn").addEventListener("click", (e) => {
      this.toggle();
    });
  }

  toggle() {
    super.toggle();
  }
}

export default PeopleModal;
