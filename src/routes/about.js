import { DISCORD_SERVER } from "../utils/Constants.js";

export function renderAbout() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h2>About</h2>
    <p>A game written in <strong>Javascript</strong> using Hawk (based in <a href="https://phaser.io/">Phaser</a>) engine.</p>
    
    <h2>Contact</h2>
    <p>You can contact us on <strong>Discord</strong> <a href="${DISCORD_SERVER}">here</a>.</p>
    
    <h2>Team</h2>
    <p>Our team has <strong>1</strong> contributor(s). You can be one by joining our discord server and contributing!</p>
    <div class="contributor">
      <span>zt3xdv <span class="accent">@tsumugi_dev</span></span>
      <br>
      <small>Role: <span class="accent">Main development</span></small>
    </div>
  `;
}
