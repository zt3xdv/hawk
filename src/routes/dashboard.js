import Game from "../game/Game.js";
import Preview from "../game/Preview.js";
import { escapeHtml, apiGet } from '../game/utils/Utils.js';
import { requestInstall, isInstalled } from '../utils/Utils.js';
import { DISCORD_SERVER } from '../utils/Constants.js';
import Cache from '../utils/Cache.js';

export function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = `
<div class="auth">
  <div class="main-header">
    <button class="btn" id="discord">
      <span><canv-icon src="${Cache.getBlob('assets/icons/flag.png').dataUrl}"></canv-icon>Join our <strong>Discord</strong> server</span>
    </button>
    <button class="btn" id="support">
      <span><canv-icon src="${Cache.getBlob('assets/icons/kofi.png').dataUrl}"></canv-icon>Become a <strong>supporter</strong>!</span>
    </button>
    <button class="btn" id="install">
      <span><canv-icon src="${Cache.getBlob('assets/icons/createintegration.png').dataUrl}"></canv-icon>Install <strong>Hawk</strong> App</span>
    </button>
  </div>
  <hr>
  <div style="margin-bottom: 10px;" id="preview"></div>
  <button class="btn" id="play">
    <div id="play-button">
    <div id="title">
      <div class="btn-text" style="display:none">Play on <strong id="server-name"></strong></div>
      <div class="btn-spinner">Loading... <span class="loader"></span></div>
    </div>
    <div id="server-dropdown">
      <div class="hamburger-menu">
        <span class="bar bar1"></span>
        <span class="bar bar2"></span>
        <span class="bar bar3"></span>
      </div>
    </div>
    </div>
  </button>
  <div id="server-dropdown-menu"></div>
  <hr>
  <div class="card" style="margin-top:14px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:13px;color:var(--muted)">Server rules</div>
      </div>
      <div style="color:var(--muted);font-size:13px">#rules</div>
    </div>

    <ul id="ruleList" style="margin:12px 0 0 0;padding:0;list-style:none;display:grid;gap:8px"></ul>
  </div>
</div>
  `;

  const previewEl = document.getElementById('preview');
  const preview = new Preview(previewEl);

  const discordBtn = document.getElementById('discord');
  const installBtn = document.getElementById('install');
  const playBtnTitle = document.getElementById('title');
  const btnText = playBtnTitle.querySelector('.btn-text');
  const btnSpinner = playBtnTitle.querySelector('.btn-spinner');
  
  const ruleList = document.querySelector('#ruleList');
  
  const serverDropdownBtn = document.querySelector('#server-dropdown');
  const serverDropdownMenu = document.querySelector('#server-dropdown-menu');
  const hamburger = serverDropdownBtn.querySelector('.hamburger-menu');
  const serverNameText = document.querySelector('#server-name');

  let playDisabled = true;
  let rulesHtml = "";

  function setBtnLoading(loading) {
    if (loading) {
      playBtnTitle.classList.add('loading');
      btnText.style.display = 'none';
      btnSpinner.style.display = 'flex';
    } else {
      playBtnTitle.classList.remove('loading');
      btnText.style.display = 'flex';
      btnSpinner.style.display = 'none';
    }
  }

  function openGame() {
    playDisabled = true;
    setBtnLoading(true);
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.style.display = 'none';
    document.body.appendChild(gameContainer);
    const game = new Game(gameContainer);
    game.game.events.on('gameLoad', () => {
      gameContainer.style.display = 'block';
      preview.game.destroy();
      setBtnLoading(false);
      for (let i = document.body.children.length - 1; i >= 0; i--) {
        const child = document.body.children[i];
        if (child !== gameContainer) {
          document.body.removeChild(child);
        }
      }
      game._onResize();
    });
  }

  function toggleServerMenu() {
    const isOpen = serverDropdownMenu.style.display === 'block';
    serverDropdownMenu.style.display = isOpen ? 'none' : 'block';
    hamburger.className = isOpen ? 'hamburger-menu' : 'hamburger-menu open';
  }

  function closeServerMenu() {
    serverDropdownMenu.style.display = 'none';
    hamburger.className = 'hamburger-menu';
  }
  
  function applyRules(rules) {
    ruleList.innerHTML = "";
    rules.forEach((rule) => {
      ruleList.innerHTML += `<li style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:8px;background:rgba(255,255,255,0.01)">
        <div>
          <div style="font-weight:600">${rule.title}</div>
          <div style="font-size:12px;color:var(--muted)">${rule.description}</div>
        </div>
      </li>`;
    });
  }

  discordBtn.addEventListener('click', () => {
    location.href = DISCORD_SERVER;
  });
  
  installBtn.style.display = isInstalled() ? installBtn.style.display : "none";
  installBtn.addEventListener('click', () => {
    requestInstall();
  });

  playBtnTitle.addEventListener('click', () => {
    if (playDisabled) return;
    openGame();
  });

  serverDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleServerMenu();
  });

  document.addEventListener('click', closeServerMenu);

  apiGet('/api/game/servers').then((servers) => {
    if (!servers || servers.length === 0) {
      playDisabled = true;
      setBtnLoading(false);
      return;
    }
    const defaultServer = servers[0];
    serverNameText.innerHTML = escapeHtml(defaultServer.name);
    localStorage.setItem('server', JSON.stringify(defaultServer));
    applyRules(defaultServer.rules);
    servers.forEach((server) => {
      const s = document.createElement('div');
      s.className = 'item';
      s.innerHTML = `
        <div class="header">
          <span class="name">${escapeHtml(server.name)}</span>
          <span class="players">${server.players} players online</span>
        </div>
        <div class="content">
          <span class="description">${escapeHtml(server.description || '')}</span>
        </div>
      `;
      s.addEventListener('click', () => {
        serverNameText.innerHTML = escapeHtml(server.name);
        localStorage.setItem('server', JSON.stringify(server));
        applyRules(server.rules);
      });
      serverDropdownMenu.appendChild(s);
    });
    playDisabled = false;
    setBtnLoading(false);
  }).catch(() => {
    playDisabled = true;
    setBtnLoading(false);
  });
}
