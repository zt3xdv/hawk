import Alerts from '../utils/Alerts.js';
import Cache from '../utils/Cache.js';
import { setupTurnstile } from '../utils/Utils.js';
import { TURNSTILE } from '../utils/Constants.js';

export function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="auth">
  <div class="header">
    <h3><canv-icon src="${Cache.getBlob('assets/icons/Person.png').dataUrl}"></canv-icon>Login</h3>
    <span class="description">Log in into Hawk.</span>
  </div>
  <hr>
  <form id="loginForm" class="gap">
    <input type="text" id="username" placeholder="Username" required>
    <input type="password" id="password" placeholder="Password" required>
    <br>
    <div id="turnstile-container"></div>
    <br>
    <button class="btn" type="submit">Login</button>
    <br>
    <small class="accent">By logging in you accept our <a href="/termsofservice">Terms Of Service</a> and <a href="/privacypolicy">Privacy Policy</a></small>
  </form>
  <hr>
  <p>New here? <a href="/register">Register</a></p>
  </div>
  `;
  
  if (TURNSTILE) {
    setupTurnstile((token) => {
      window.turnstileToken = token;
    });
  }

  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password, turnstile: window.turnstileToken })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('username', data.username);
      localStorage.setItem('password', data.password);
      window.location = '/dashboard';
    } else {
      Alerts.add("Login error", data.error);
    }
  });
}
