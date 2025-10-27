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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Dashboard</span>
      </a>
      <a href="/people" class="nav-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span>People</span>
      </a>
      <a href="/dms" class="nav-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Dashboard</span>
          </a>
        </div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-category">
          <div class="dropdown-category-title">Social</div>
          <a href="/profile" class="dropdown-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Profile</span>
          </a>
          <a href="/people" class="dropdown-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>People</span>
          </a>
          <a href="/dms" class="dropdown-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Messages</span>
          </a>
        </div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-category">
          <div class="dropdown-category-title">Customize</div>
          <a href="/avatar" class="dropdown-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>Avatar</span>
          </a>
          <a href="/profile-settings" class="dropdown-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m5.196-13.196l-4.242 4.242m-2.828 2.828l-4.242 4.242M23 12h-6m-6 0H1m18.196 5.196l-4.242-4.242m-2.828-2.828l-4.242-4.242"></path>
            </svg>
            <span>Settings</span>
          </a>
        </div>
        <div class="dropdown-divider"></div>
        <a id="logoutBtn" class="dropdown-item dropdown-item-danger">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Logout</span>
        </a>
        ` : `
        <div class="dropdown-category">
          <div class="dropdown-category-title">Get Started</div>
          <a href="/auth" class="dropdown-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            <span>Auth</span>
          </a>
        </div>
        <div class="dropdown-divider"></div>
        `}
        <div class="dropdown-category">
          <div class="dropdown-category-title">Info</div>
          <a href="/about" class="dropdown-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>About</span>
          </a>
          <a href="/help" class="dropdown-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
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
