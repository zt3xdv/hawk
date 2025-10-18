import { DISCORD_SERVER, CONTRIBUTORS } from "../utils/Constants.js";
import Cache from '../utils/Cache.js';

export function renderAbout() {
  let contributorsHTML = "";
  
  CONTRIBUTORS.forEach(c => {
    contributorsHTML += `<div class="contributor">
      <span>${c.name} <span class="accent">@${c.username}</span></span>
      <br>
      <small>Role: <span class="accent">${c.role}</span></small>
    </div><br>`;
  });
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth">
  <div class="header">
    <h3><canv-icon src="${Cache.getBlob('assets/icons/info.png').dataUrl}"></canv-icon>About</h3>
    <span class="description">About Hawk.</span>
  </div>
  <hr>
    <p>A game written in <strong>Javascript</strong> using Hawk engine, check <a href="/help">help page</a> for controls and more.</p>
    
    <h2>Contact</h2>
    <p>You can contact us on <strong>Discord</strong> <a href="${DISCORD_SERVER}">here</a>.</p>
    
    <h2>Team</h2>
    <p>Our team has <strong>${CONTRIBUTORS.length}</strong> contributor(s). You can be one by joining our Discord Server and contributing!</p>
    ${contributorsHTML}
    </div>
  `;
}
