import { DISCORD_SERVER, API } from "../utils/Constants.js";
import Cache from '../utils/Cache.js';
import { apiGet } from '../utils/Utils.js';

const html = `
  <div class="auth">
    <div class="header">
      <h3><canv-icon src="${Cache.getBlob('assets/icons/pings.png').dataUrl}"></canv-icon>Ping</h3>
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

  const pingButton = document.getElementById('ping-button');
  const pingResult = document.getElementById('ping-result');

  pingButton.addEventListener('click', async () => {
    const startTime = new Date().getTime();
    try {
      const response = await apiGet(API.gameServers);
      const endTime = new Date().getTime();
      const pingTime = endTime - startTime;
      let pingLevel;
      if (pingTime < 100) {
        pingLevel = `<canv-icon src="${Cache.getBlob('assets/icons/goodping.png').dataUrl}"></canv-icon>`;
      } else if (pingTime < 300) {
        pingLevel = `<canv-icon src="${Cache.getBlob('assets/icons/idelping.png').dataUrl}"></canv-icon>`;
      } else {
        pingLevel = `<canv-icon src="${Cache.getBlob('assets/icons/badping.png').dataUrl}"></canv-icon>`;
      }
      pingResult.innerHTML = `${pingLevel} Ping: ${pingTime} ms`;
    } catch (error) {
      pingResult.innerText = 'Error checking your ping';
    }
  });
}

export const options = { title: "Ping", auth: false, description: "Check the ping between you and Hawk servers." };

export { html, render };
