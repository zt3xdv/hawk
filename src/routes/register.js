import Alerts from '../utils/Alerts.js';
import { DISPLAY_NAME, USERNAME, PASSWORD } from '../utils/Constants.js';
import Cache from '../utils/Cache.js';

export function renderRegister() {
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="auth">
  <div class="header">
    <h3><canv-icon src="${Cache.getBlob('assets/icons/unbanmember.png').dataUrl}"></canv-icon>Register</h3>
    <span class="description">Create a new account.</span>
  </div>
  <hr>
  <form id="regForm" class="gap">
    <input type="text" id="display_name" placeholder="Display Name" required>
    <input type="text" id="username" placeholder="Username" required>
    <input type="password" id="password" placeholder="Password" required>
    <br>
    <button class="btn" type="submit">Register</button>
  </form>
  <hr>
  <p>Already have a account? <a href="/login">Login</a></p>
  </div>
  `;

  const form = document.getElementById('regForm');

  function validateField(name, value) {
    switch (name) {
      case 'display_name':
        return value.length >= DISPLAY_NAME.MIN && value.length <= DISPLAY_NAME.MAX;
      case 'username': {
        const okLength = value.length >= USERNAME.MIN && value.length <= USERNAME.MAX;
        const okPattern = /^[A-Za-z0-9_]+$/.test(value);
        return okLength && okPattern;
      }
      case 'password':
        return value.length >= PASSWORD.MIN && value.length <= PASSWORD.MAX;
      default:
        return false;
    }
  }

  function validationMessage(name) {
    switch (name) {
      case 'display_name':
        return `Display name must be between ${DISPLAY_NAME.MIN} and ${DISPLAY_NAME.MAX} characters.`;
      case 'username':
        return `Username must be between ${USERNAME.MIN} and ${USERNAME.MAX} characters and contain only letters, numbers and underscores (a-zA-Z0-9_).`;
      case 'password':
        return `Password must be between ${PASSWORD.MIN} and ${PASSWORD.MAX} characters.`;
      default:
        return 'Invalid field.';
    }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const display_name = e.target.display_name.value.trim();
    const username = e.target.username.value.trim();
    const password = e.target.password.value;

    if (!validateField('display_name', display_name)) {
      Alerts.add('Validation error', validationMessage('display_name'));
      return;
    }
    if (!validateField('username', username)) {
      Alerts.add('Validation error', validationMessage('username'));
      return;
    }
    if (!validateField('password', password)) {
      Alerts.add('Validation error', validationMessage('password'));
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ display_name, username, password })
      });
      const data = await res.json();
      if (res.ok) {
        Alerts.add('Registered', 'Succesfully registered.<br>Login by clicking <a href="/login">here</a>.');
      } else {
        Alerts.add('Register error', data.error || 'Unknown error.<br>This maybe is a mistake, please contact an administrator.');
      }
    } catch (err) {
      Alerts.add('Network error', err.message);
    }
  });
}
