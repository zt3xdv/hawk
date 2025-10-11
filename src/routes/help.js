import { DISCORD_SERVER } from "../utils/Constants.js";
import Cache from '../utils/Cache.js';

export function renderHelp() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth">
  <div class="header">
    <h3><canv-icon src="${Cache.getBlob('assets/icons/info.png').dataUrl}"></canv-icon>Help</h3>
    <span class="description">Help and controls of Hawk.</span>
  </div>
  <hr>
    <p>Our help page, check <a href="/about">about page</a> for more info.</p>
    
    <h2>Contact</h2>
    <p>You can contact us on <strong>Discord</strong> <a href="${DISCORD_SERVER}">here</a>.</p>
    
    <h2>Controls</h2>
    <p>
      <strong>PC:</strong> Use the <span class="highlight">W</span><span class="highlight">A</span><span class="highlight">S</span><span class="highlight">D</span> keys for movement.
    </p>
    <p>
      <strong>Mobile:</strong> Use the dynamic joystick on the screen for movement.
    </p>
    </div>
  `;
}
