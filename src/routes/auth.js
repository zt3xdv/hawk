import Alerts from '../utils/Alerts.js';
import Cache from '../utils/Cache.js';
import { setupTurnstile, apiPost } from '../utils/Utils.js';
import { TURNSTILE, DISPLAY_NAME, USERNAME, PASSWORD, API } from '../utils/Constants.js';

const html = `
<div class="auth">
  <div id="welcome-screen" style="min-height:400px;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity 0.6s ease">
    <div style="text-align:center;font-size:28px;font-weight:600;color:#e5e5e5;letter-spacing:-0.5px;display:flex;gap:10px">
      <span class="word-anim" style="opacity:0;transform:translateY(30px)">Welcome</span>
      <span class="word-anim" style="opacity:0;transform:translateY(30px)">to</span>
      <span class="word-anim" style="opacity:0;transform:translateY(30px)">Hawk</span>
    </div>
  </div>
  <div id="auth-container" style="opacity:0;display:none;transition:opacity 0.6s ease">
    <div class="header">
      <h3><canv-icon id="auth-icon"></canv-icon><span id="auth-title">Login</span></h3>
      <span id="auth-description" class="description">Log in into Hawk.</span>
    </div>
    <hr>
    <div id="oauth-buttons" style="display:none;margin-bottom:16px"></div>
    <div id="oauth-divider" style="display:none;text-align:center;margin:16px 0;color:var(--muted);font-size:13px;position:relative">
      <span style="background:var(--background-color);padding:0 12px;position:relative;z-index:1">OR</span>
      <hr style="position:absolute;top:50%;left:0;right:0;margin:0;z-index:0">
    </div>
    <form id="authForm" class="gap">
      <input type="text" id="display_name" placeholder="Display Name" style="display:none;width:100%;padding:12px 14px;background:var(--surface-color);border:1px solid var(--border-color);border-radius:8px;color:var(--text-color);font-size:14px;transition:all 0.2s">
      <input type="text" id="username" placeholder="Username" required style="width:100%;padding:12px 14px;background:var(--surface-color);border:1px solid var(--border-color);border-radius:8px;color:var(--text-color);font-size:14px;transition:all 0.2s">
      <input type="password" id="password" placeholder="Password" required style="width:100%;padding:12px 14px;background:var(--surface-color);border:1px solid var(--border-color);border-radius:8px;color:var(--text-color);font-size:14px;transition:all 0.2s">
      <div id="turnstile-container"></div>
      <button class="btn" type="submit" id="auth-submit" style="width:100%;padding:12px;background:var(--primary-color);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;margin-top:8px">
        <div id="auth-button" style="display:flex;align-items:center;justify-content:center;gap:8px">
          <div class="btn-text" id="btn-text">Login</div>
          <div class="btn-spinner" style="display:none;align-items:center;gap:8px">Loading... <span class="loader"></span></div>
        </div>
      </button>
      <small class="accent" style="display:block;text-align:center;margin-top:12px">By <span id="auth-action-text">logging in</span> you accept our <a href="/termsofservice">Terms Of Service</a> and <a href="/privacypolicy">Privacy Policy</a></small>
    </form>
    <hr>
    <p id="auth-switch" style="text-align:center;color:var(--muted);font-size:14px"><span id="switch-text">New here?</span> <a href="#" id="toggle-mode" style="color:var(--primary-color);font-weight:500">Register</a></p>
  </div>
</div>
<style>
  @keyframes slideUpWord {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .auth-slide-in {
    animation: slideInUp 0.6s ease-out forwards;
  }
  input:focus {
    outline: none;
    border-color: var(--primary-color);
    background: var(--surface-hover);
  }
  button:hover {
    background: var(--primary-hover);
  }
  .oauth-btn {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--surface-color);
    color: var(--text-color);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .oauth-btn:hover {
    background: var(--surface-hover);
    border-color: var(--primary-color);
  }
  .oauth-btn svg {
    width: 18px;
    height: 18px;
  }
</style>
`;

function render() {
  const app = document.getElementById('app');
  app.innerHTML = html;

  // Set icon data URLs
  document.getElementById('auth-icon').src = Cache.getBlob('assets/icons/Person.png').dataUrl;
  
  const welcomeScreen = document.getElementById('welcome-screen');
  const authContainer = document.getElementById('auth-container');
  const words = document.querySelectorAll('.word-anim');
  
  words.forEach((word, index) => {
    setTimeout(() => {
      word.style.animation = 'slideUpWord 0.4s ease-out forwards';
    }, index * 150);
  });
  
  setTimeout(() => {
    welcomeScreen.style.opacity = '0';
    setTimeout(() => {
      welcomeScreen.style.display = 'none';
      authContainer.style.display = 'block';
      authContainer.classList.add('auth-slide-in');
      setTimeout(() => {
        authContainer.style.opacity = '1';
      }, 50);
    }, 600);
  }, 1500);

  async function checkOAuthStatus() {
    try {
      const response = await fetch('/api/oauth/status');
      const data = await response.json();
      
      const oauthButtonsContainer = document.getElementById('oauth-buttons');
      const oauthDivider = document.getElementById('oauth-divider');
      let hasOAuth = false;

      if (data.google || data.discord) {
        hasOAuth = true;
        let buttonsHTML = '<div class="gap" style="display:flex;flex-direction:column;gap:10px">';
        
        if (data.google) {
          buttonsHTML += `
            <button type="button" class="oauth-btn" onclick="window.location.href='/api/auth/google'">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          `;
        }
        
        if (data.discord) {
          buttonsHTML += `
            <button type="button" class="oauth-btn" onclick="window.location.href='/api/auth/discord'">
              <svg viewBox="0 0 24 24" fill="#5865F2">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Continue with Discord
            </button>
          `;
        }
        
        buttonsHTML += '</div>';
        oauthButtonsContainer.innerHTML = buttonsHTML;
        oauthButtonsContainer.style.display = 'block';
        oauthDivider.style.display = 'block';
      }
    } catch (error) {
      console.error('Error checking OAuth status:', error);
    }
  }

  checkOAuthStatus();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('oauth') === 'success') {
    const username = urlParams.get('username');
    const token = urlParams.get('token');
    
    if (username && token) {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('username', username);
      localStorage.setItem('password', token);
      window.location = '/dashboard';
    }
  } else if (urlParams.get('error')) {
    const error = urlParams.get('error');
    const errorMessages = {
      'google_auth_failed': 'Google authentication failed. Please try again.',
      'discord_auth_failed': 'Discord authentication failed. Please try again.'
    };
    Alerts.add('OAuth Error', errorMessages[error] || 'Authentication failed.');
  }

  let isLoginMode = true;
  const displayNameInput = document.getElementById('display_name');
  const authTitle = document.getElementById('auth-title');
  const authDescription = document.getElementById('auth-description');
  const authIcon = document.getElementById('auth-icon');
  const btnText = document.getElementById('btn-text');
  const authActionText = document.getElementById('auth-action-text');
  const switchText = document.getElementById('switch-text');
  const toggleModeLink = document.getElementById('toggle-mode');
  const authForm = document.getElementById('authForm');
  const btnSpinner = document.querySelector('.btn-spinner');

  function setBtnLoading(loading) {
    if (loading) {
      btnText.style.display = 'none';
      btnSpinner.style.display = 'flex';
    } else {
      btnText.style.display = 'block';
      btnSpinner.style.display = 'none';
    }
  }

  function toggleMode(e) {
    if (e) e.preventDefault();
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
      authTitle.textContent = 'Login';
      authDescription.textContent = 'Log in into Hawk.';
      authIcon.setAttribute('src', Cache.getBlob('assets/icons/Person.png').dataUrl);
      btnText.textContent = 'Login';
      authActionText.textContent = 'logging in';
      switchText.textContent = 'New here?';
      toggleModeLink.textContent = 'Register';
      displayNameInput.style.display = 'none';
      displayNameInput.removeAttribute('required');
    } else {
      authTitle.textContent = 'Register';
      authDescription.textContent = 'Create a new account.';
      authIcon.setAttribute('src', Cache.getBlob('assets/icons/unbanmember.png').dataUrl);
      btnText.textContent = 'Register';
      authActionText.textContent = 'creating a account your';
      switchText.textContent = 'Already have a account?';
      toggleModeLink.textContent = 'Login';
      displayNameInput.style.display = 'block';
      displayNameInput.setAttribute('required', 'required');
    }
    
    authForm.reset();
    if (window.turnstile && TURNSTILE) {
      window.turnstile.reset();
    }
  }

  toggleModeLink.addEventListener('click', toggleMode);
  
  if (TURNSTILE) {
    setupTurnstile((token) => {
      window.turnstileToken = token;
    });
  }

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

  authForm.addEventListener('submit', async e => {
    e.preventDefault();
    setBtnLoading(true);

    const username = e.target.username.value.trim();
    const password = e.target.password.value;

    if (isLoginMode) {
      try {
        const data = await apiPost(API.login, { username, password, turnstile: window.turnstileToken });
        if (data.error) {
          setBtnLoading(false);
          Alerts.add("Login error", data.error);
        } else {
          localStorage.setItem('loggedIn', 'true');
          localStorage.setItem('username', data.username);
          localStorage.setItem('password', data.password);
          window.location = '/dashboard';
        }
      } catch (err) {
        setBtnLoading(false);
        Alerts.add('Network error', err.message);
      }
    } else {
      const display_name = e.target.display_name.value.trim();

      if (!window.turnstileToken && TURNSTILE) {
        setBtnLoading(false);
        Alerts.add('Validation error', "Please complete captcha");
        return;
      }

      if (!validateField('display_name', display_name)) {
        setBtnLoading(false);
        Alerts.add('Validation error', validationMessage('display_name'));
        return;
      }
      if (!validateField('username', username)) {
        setBtnLoading(false);
        Alerts.add('Validation error', validationMessage('username'));
        return;
      }
      if (!validateField('password', password)) {
        setBtnLoading(false);
        Alerts.add('Validation error', validationMessage('password'));
        return;
      }

      try {
        const data = await apiPost(API.register, { display_name, username, password, turnstile: window.turnstileToken });
        if (data.error) {
          setBtnLoading(false);
          Alerts.add('Register error', data.error || 'Unknown error.<br>This maybe is a mistake, please contact an administrator.');
        } else {
          try {
            const loginData = await apiPost(API.login, { username, password, turnstile: window.turnstileToken });
            if (loginData.error) {
              setBtnLoading(false);
              Alerts.add('Registered', 'Successfully registered! Please login.');
              setTimeout(() => {
                toggleMode();
              }, 1500);
            } else {
              localStorage.setItem('loggedIn', 'true');
              localStorage.setItem('username', loginData.username);
              localStorage.setItem('password', loginData.password);
              window.location = '/dashboard';
            }
          } catch (loginErr) {
            setBtnLoading(false);
            Alerts.add('Registered', 'Successfully registered! Please login.');
            setTimeout(() => {
              toggleMode();
            }, 1500);
          }
        }
      } catch (err) {
        setBtnLoading(false);
        Alerts.add('Network error', err.message);
      }
    }
  });
}

export const options = { title: "Auth", auth: false, description: "Choose your authentication method." };

export { html, render };
