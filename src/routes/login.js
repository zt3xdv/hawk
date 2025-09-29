import Alerts from '../utils/Alerts.js';

export function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
<main class="main">
  <div class="header">
    <h3>Login</h3>
  </div>
  
  <form id="loginForm" class="gap">
    <input type="text" id="username" placeholder="Username" required>
    <input type="password" id="password" placeholder="Password" required>
    <br>
    <button class="btn" type="submit">Login</button>
  </form>
  <p>New here? <a href="/register">register</a></p>
</main>
  `;

  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('username', data.username);
      localStorage.setItem('password', data.password);
      window.location = '/dashboard';
    } else {
      Alerts.add("Error when logging in", data.error);
    }
  });
}
