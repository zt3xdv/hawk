import Cache from "../utils/Cache.js";
import { getAuth, apiPost } from '../game/utils/Utils.js';
import { API } from '../utils/Constants.js';

export function nav() {
  const loggedIn = localStorage.getItem("loggedIn");
  const navEl = document.createElement('nav');
  navEl.className = 'main-nav';
  navEl.innerHTML = `
    <div class="nav-icon">
      <img src="${Cache.getBlob("logo.png").dataUrl}" alt="Hawk" width="auto" height="25">
    </div>
    <p class="nav-title">Hawk</p>
    <div class="nav-dropdown">
      <button id="dropdownBtn">
        ${loggedIn ? `
        <div id="user">
          <img id="pavatar"></img>
          <span class="accent" id="displayName"></span>
        </div>
        ` : ''}
        <div class="hamburger-menu">
          <span class="bar bar1"></span>
          <span class="bar bar2"></span>
          <span class="bar bar3"></span>
        </div>
      </button>
      <div id="dropdownMenu" class="dropdown-menu">
        ${loggedIn ? `
        <li><a href="/dashboard">Dashboard</a></li>
        <hr>
        <li><a href="/profile">Profile</a></li>
        <li><a href="/people">People</a></li>
        <hr>
        <li><a id="logoutBtn">Logout</a></li>
        ` : `
        <li><a href="/login">Login</a></li>
        <li><a href="/register">Register</a></li>
        `}
        <hr>
        <li><a href="/about">About</a></li>
      </div>
    </div>
  `;

  const btn  = navEl.querySelector('#dropdownBtn');
  const menu = navEl.querySelector('#dropdownMenu');
  const hamburger = btn.querySelector('.hamburger-menu');
  
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
      window.location = '/login';
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
