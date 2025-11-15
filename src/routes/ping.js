import { DISCORD_SERVER, API } from "../utils/Constants.js";
import Cache from '../utils/Cache.js';
import { apiGet } from '../utils/Utils.js';

const html = `
  <div class="auth">
    <div class="header">
      <h3><canv-icon id="ping-icon"></canv-icon>Ping</h3>
      <span class="description">Ping check</span>
    </div>
    <hr>
    <p>Check your ping between you and <strong>Hawk</strong> servers.</p>
    <br>
    <p id="ping-result"><i>Your result will appear here.</i></p>
    <br>
    <button class="btn" id="ping-button">Check your ping</button>
    <small>The result can not be same as play ping. It also depends of device speed.</small>
  </div>
`;

function render() {
  const app = document.getElementById('app');
  app.innerHTML = html;

  // Set icon data URLs
  document.getElementById('ping-icon').src = Cache.getBlob('assets/icons/pings.png').dataUrl;

  const pingButton = document.getElementById('ping-button');
  const pingResult = document.getElementById('ping-result');

  pingButton.addEventListener('click', async () => {
    const startTime = new Date().getTime();
    try {
      const response = await apiGet(API.gameServers);
      const endTime = new Date().getTime();
      const pingTime = endTime - startTime;
      const icon = document.createElement('canv-icon');
      if (pingTime < 100) {
      icon.src = Cache.getBlob('assets/icons/goodping.png').dataUrl;
      } else if (pingTime < 300) {
      icon.src = Cache.getBlob('assets/icons/idelping.png').dataUrl;
      } else {
      icon.src = Cache.getBlob('assets/icons/badping.png').dataUrl;
      }
      pingResult.innerHTML = '';
      pingResult.appendChild(icon);
      pingResult.appendChild(document.createTextNode(` Ping: ${pingTime} ms`));
    } catch (error) {
      pingResult.innerText = 'Error checking your ping';
    }
  });
}

export const options = { title: "Ping", auth: false, description: "Check the ping between you and Hawk servers." };

export { html, render };
