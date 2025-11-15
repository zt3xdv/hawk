import { DISCORD_SERVER } from "../utils/Constants.js";
import Cache from '../utils/Cache.js';

const html = `
  <div class="auth">
<div class="header">
  <h3><canv-icon id="404-icon"></canv-icon>404 - Not Found</h3>
  <span class="description">Not found</span>
</div>
<hr>
  <p>This page was not found.</p>
  <p>If you think this is a mistake, You can contact us on <strong>Discord</strong> <a href="${DISCORD_SERVER}">here</a>.</p>
  
  <a class="btn" href="/dashboard">Go to dashboard</a>
  </div>
`;

function render() {
  const app = document.getElementById('app');
  app.innerHTML = html;

  // Set icon data URLs
  document.getElementById('404-icon').src = Cache.getBlob('assets/icons/endstage.png').dataUrl;
}

export const options = { title: "404", auth: false, description: "This page has not found." };

export { html, render };
