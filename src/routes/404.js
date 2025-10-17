import { DISCORD_SERVER } from "../utils/Constants.js";
import Cache from '../utils/Cache.js';

export function renderNotFound() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth">
  <div class="header">
    <h3><canv-icon src="${Cache.getBlob('assets/icons/endstage.png').dataUrl}"></canv-icon>404 - Not Found</h3>
    <span class="description">Not found</span>
  </div>
  <hr>
    <p>This page was not found.</p>
    <p>If you think this is a mistake, You can contact us on <strong>Discord</strong> <a href="${DISCORD_SERVER}">here</a>.</p>
    
    <a class="btn" href="/dashboard">Go to dashboard</a>
    </div>
  `;
}
