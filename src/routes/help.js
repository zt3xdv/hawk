import { DISCORD_SERVER } from "../utils/Constants.js";
import Cache from '../utils/Cache.js';

const html = `
  <div class="auth">
<div class="header">
  <h3><canv-icon src="${Cache.getBlob('assets/icons/info.png').dataUrl}"></canv-icon>Help</h3>
  <span class="description">Help and controls of Hawk.</span>
</div>
<hr>
  <p>Our help page, check <a href="/about">about page</a> for more info.</p>
  
  <h3>Contact</h3>
  <p>You can contact us on <strong>Discord</strong> <a href="${DISCORD_SERVER}">here</a>.</p>
  
  <h3>Controls</h3>
  <p>
    <strong>PC:</strong> Use the <span class="highlight">W</span><span class="highlight">A</span><span class="highlight">S</span><span class="highlight">D</span> keys for movement.
  </p>
  <p>
    <strong>Mobile:</strong> Use the dynamic joystick on the screen for movement.
  </p>

  <h3>Commands</h3>
  <p>You can use commands by typing <span class="highlight">/</span>.</p>
  <p>List of commands will be automatically displayed when typing <span class="highlight">/</span></p>
  </div>
`;

function render() {
  const app = document.getElementById('app');
  app.innerHTML = html;
}

export const options = { title: "Help", auth: false, description: "Controls, and some help." };

export { html, render };
