import Cache from "../utils/Cache.js";
import { getAuth, apiPost } from '../game/utils/Utils.js';
import { API } from '../utils/Constants.js';

export function nav() {
  const loggedIn = localStorage.getItem("loggedIn");
  const navEl = document.createElement('nav');
  navEl.className = 'main-nav';
  navEl.innerHTML = `
    <div class="nav-brand">
      <div class="nav-icon">
        <img src="${Cache.getBlob("logo.svg").dataUrl}" alt="Hawk" width="auto" height="28">
      </div>
      <p class="nav-title">Hawk</p>
    </div>
    
    ${loggedIn ? `
    <div class="nav-links">
      <a href="/dashboard" class="nav-link">
        <canv-icon id="auth-icon" src="${Cache.getBlob('assets/icons/generalinfo.png').dataUrl}"></canv-icon>
        <span>Dashboard</span>
      </a>
      <a href="/people" class="nav-link">
        <canv-icon id="auth-icon" src="${Cache.getBlob('assets/icons/people.png').dataUrl}"></canv-icon>
        <span>People</span>
      </a>
      <a href="/dms" class="nav-link">
        <canv-icon id="auth-icon" src="${Cache.getBlob('assets/icons/message.png').dataUrl}"></canv-icon>
        <span>Messages</span>
      </a>
    </div>
    ` : ''}
    
    <div class="nav-dropdown">
      <button id="dropdownBtn" class="nav-dropdown-btn">
        ${loggedIn ? `
        <div id="user" class="nav-user">
          <img id="pavatar" class="nav-avatar" alt="Profile"></img>
          <span class="nav-username" id="displayName"></span>
        </div>
        ` : `
        `}
        <div class="hamburger-menu">
          <span class="bar bar1"></span>
          <span class="bar bar2"></span>
          <span class="bar bar3"></span>
        </div>
      </button>
      <div id="dropdownMenu" class="dropdown-menu">
        ${loggedIn ? `
        <div class="dropdown-category">
          <div class="dropdown-category-title">Main</div>
          <a href="/dashboard" class="dropdown-item">
            <canv-icon id="auth-icon" src="${Cache.getBlob('assets/icons/generalinfo.png').dataUrl}"></canv-icon>
            <span>Dashboard</span>
          </a>
        </div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-category">
          <div class="dropdown-category-title">Social</div>
          <a href="/profile" class="dropdown-item">
            <canv-icon id="auth-icon" src="${Cache.getBlob('assets/icons/Person.png').dataUrl}"></canv-icon>
            <span>Profile</span>
          </a>
          <a href="/people" class="dropdown-item">
            <canv-icon id="auth-icon" src="${Cache.getBlob('assets/icons/people.png').dataUrl}"></canv-icon>
            <span>People</span>
          </a>
          <a href="/dms" class="dropdown-item">
            <canv-icon id="auth-icon" src="${Cache.getBlob('assets/icons/message.png').dataUrl}"></canv-icon>
            <span>Messages</span>
          </a>
        </div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-category">
          <div class="dropdown-category-title">Customize</div>
          <a href="/avatar" class="dropdown-item">
            <canv-icon id="auth-icon" src="${Cache.getBlob('assets/icons/createemoji.png').dataUrl}"></canv-icon>
            <span>In-Game avatar</span>
          </a>
          <a href="/profile-settings" class="dropdown-item">
            <canv-icon id="auth-icon" src="${Cache.getBlob('assets/icons/settings.png').dataUrl}"></canv-icon>
            <span>Settings</span>
          </a>
        </div>
        <div class="dropdown-divider"></div>
        <a id="logoutBtn" class="dropdown-item dropdown-item-danger">
          <canv-icon id="auth-icon" src="${Cache.getBlob('assets/icons/leave.png').dataUrl}"></canv-icon>
          <span>Logout</span>
        </a>
        ` : `
        <div class="dropdown-category">
          <div class="dropdown-category-title">Get Started</div>
          <a href="/auth" class="dropdown-item">
            <canv-icon id="auth-icon" src="${Cache.getBlob('assets/icons/join.png').dataUrl}"></canv-icon>
            <span>Auth</span>
          </a>
        </div>
        <div class="dropdown-divider"></div>
        `}
        <div class="dropdown-category">
          <div class="dropdown-category-title">Info</div>
          <a href="/about" class="dropdown-item">
            <canv-icon id="auth-icon" src="${Cache.getBlob('assets/icons/info.png').dataUrl}"></canv-icon>
            <span>About</span>
          </a>
          <a href="/help" class="dropdown-item">
            <canv-icon id="auth-icon" src="${Cache.getBlob('assets/icons/info.png').dataUrl}"></canv-icon>
            <span>Help</span>
          </a>
        </div>
      </div>
    </div>
  `;

  const btn = navEl.querySelector('#dropdownBtn');
  const menu = navEl.querySelector('#dropdownMenu');
  const hamburger = btn ? btn.querySelector('.hamburger-menu') : null;
  
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    
    hamburger.className = menu.style.display === 'block' ? 'hamburger-menu open' : 'hamburger-menu';
  });

  document.addEventListener('click', () => {
    menu.style.display = 'none';
    
    hamburger.className = menu.style.display === 'block' ? 'hamburger-menu open' : 'hamburger-menu';
  });
  
  if (loggedIn) {
    navEl.querySelector('#logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('loggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('password');
      window.location = '/';
    });
    
    apiPost(API.check, getAuth()).then((data) => {
      const displayName = document.getElementById("displayName");
      const pavatar = document.getElementById("pavatar");
      
      displayName.innerText = data.displayName;
      pavatar.src = "/api/pavatar/" + data.id;
    });
  }

  return navEl;
}
