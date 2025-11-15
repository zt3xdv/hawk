import { DISCORD_SERVER, CONTRIBUTORS } from "../utils/Constants.js";
import Cache from '../utils/Cache.js';

const html = `
  <div class="auth">
<div class="header">
  <h3><canv-icon id="about-icon"></canv-icon>About</h3>
  <span class="description">About Hawk.</span>
</div>
<hr>
  <p>A game written in <strong>Javascript</strong> using Hawk engine, check <a href="/help">help page</a> for controls and more.</p>
  
  <h3>Contact</h3>
  <p>You can contact us on <strong>Discord</strong> <a href="${DISCORD_SERVER}">here</a>.</p>
  
  <h3>Team</h3>
  <p>Our team has <strong>${CONTRIBUTORS.length}</strong> contributor(s). You can be one by joining our Discord Server and contributing!</p>
  <div id="contributors"></div>
  </div>
`;

function render() {
  const app = document.getElementById('app');
  app.innerHTML = html;

  // Set icon data URLs
  document.getElementById('about-icon').src = Cache.getBlob('assets/icons/info.png').dataUrl;

  let contributorsHTML = "";
  CONTRIBUTORS.forEach(c => {
    contributorsHTML += `<div class="contributor">
      <span>${c.name} <span class="accent">@${c.username}</span></span>
      <br>
      <small>Role: <span class="accent">${c.role}</span></small>
    </div><br>`;
  });
  
  document.getElementById('contributors').innerHTML = contributorsHTML;
}

export const options = { title: "About", auth: false, description: "Overview of Hawk, its mission, and team." };

export { html, render };
