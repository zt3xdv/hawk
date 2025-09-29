import Game from "../game/Game.js";
import Preview from "../game/Preview.js";
import { escapeHtml } from '../game/utils/Utils.js';

export function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = `
<main class="main">
  <div class="header">
    <div>
      <h3>Welcome again <span class="wave">👋</span>.</h3>
    </div>
    <div class="actions">
      <button class="btn" id="play">
        <span class="btn-text">Play</span>
        <span class="btn-spinner" aria-hidden="true" style="display:none">Loading... <span class="loader"></span></span>
      </button>
    </div>
  </div>
  
  <div class="card" id="preview" style="display:flex;flex-direction:column;gap:10px">
  </div>
</main>

  <div class="card" style="margin-top:14px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:13px;color:var(--muted)">Server rules</div>
        <div style="font-weight:700">Last update: 23/08/25</div>
      </div>
      <div style="color:var(--muted);font-size:13px">#rules</div>
    </div>

    <ul id="recentList" style="margin:12px 0 0 0;padding:0;list-style:none;display:grid;gap:8px">
      <li style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:8px;background:rgba(255,255,255,0.01)">
        <div>
          <div style="font-weight:600">Use common sense:</div>
          <div style="font-size:12px;color:var(--muted)">Do not swear, bully, etc.</div>
        </div>
      </li>
    </ul>
  </div>
  `;

  const previewEl = document.getElementById('preview');
  const preview = new Preview(previewEl);

  const playBtn = document.getElementById('play');
  const btnText = playBtn.querySelector('.btn-text');
  const btnSpinner = playBtn.querySelector('.btn-spinner');

  function setBtnLoading(loading) {
    if (loading) {
      playBtn.classList.add('loading');
      btnText.style.display = 'none';
      btnSpinner.style.display = 'inline-block';
    } else {
      playBtn.classList.remove('loading');
      btnText.style.display = 'inline';
      btnSpinner.style.display = 'none';
    }
  }

  playBtn.addEventListener('click', () => {
    setBtnLoading(true);

    const gameContainer = document.createElement('div');
    gameContainer.id = "game-container";
    gameContainer.style.display = "none";
    document.body.appendChild(gameContainer);

    const game = new Game(gameContainer);

    game.game.events.on('gameLoad', () => {
      gameContainer.style.display = "block";
      preview.game.destroy();
      setBtnLoading(false);
      for (let i = document.body.children.length - 1; i >= 0; i--) {
        const child = document.body.children[i];
        if (child !== gameContainer) {
          document.body.removeChild(child);
        }
      }
    });
  });
}
