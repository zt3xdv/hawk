import { nav } from './components/nav.js';
import Cache from "./utils/Cache.js";
import { DISCORD_SERVER, VERSION, ASSETS_VERSION, API, AUTHOR } from "./utils/ConstantsPackage.js";
import { getAuth, apiPost } from './game/utils/Utils.js';
import { routes, getPathFromLocation } from './routes/routes.js';
import { renderDmChat } from './routes/dmChat.js';

let currentNav = null;
let currentFooter = null;
let mounted = false;

function clearMain() {
  const existing = document.getElementById('app');
  if (existing) existing.innerHTML = '';
}

function insertBeforeFooter(node) {
  const footer = currentFooter || document.querySelector('footer');
  if (footer && footer.parentNode) {
    footer.parentNode.insertBefore(node, footer);
  } else {
    document.body.appendChild(node);
  }
}

function mountShell() {
  if (!mounted) {
    document.body.innerHTML = '';
    currentNav = nav();
    document.body.appendChild(currentNav);

    const main = document.createElement('main');
    main.id = 'app';
    document.body.appendChild(main);

    currentFooter = document.createElement('footer');
    currentFooter.className = 'site-footer';
    currentFooter.innerHTML = `
      <div class="footer-top">
        <div class="brand">
          <img src="${Cache.getBlob("logo.svg").dataUrl}" alt="Logo" class="footer-logo">
          <span class="brand-name">Hawk</span>
        </div>
        <div class="right-side">
        </div>
      </div>
      <div class="footer-bottom">
        <div class="authors">
          © ${new Date().getFullYear()} — ${AUTHOR}
        </div>
        <div class="extras">
          <p>${VERSION} · assets-${ASSETS_VERSION}</p>
          <a href="/termsofservice">Terms Of Service</a> · <a href="/privacypolicy">Privacy Policy</a> · <a href="${DISCORD_SERVER}">Discord</a>
        </div>
      </div>
    `;
    currentFooter.style.marginTop = `170px`;
    document.body.appendChild(currentFooter);

    document.body.addEventListener('click', onBodyClick);
    mounted = true;
  }
}

function onBodyClick(e) {
  if (e.defaultPrevented) return;
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  let a = e.target;
  while (a && a.nodeName !== 'A') a = a.parentElement;
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
  e.preventDefault();
  navigate(href);
}

export function navigate(path) {
  if (!path.startsWith('/')) {
    const base = window.location.pathname.replace(/\/+$/, '');
    path = base + '/' + path;
  }
  window.history.pushState({}, '', path);
  router();
}

window.router = {
  navigateTo: navigate
};

window.addEventListener('popstate', () => {
  router();
});

export function router() {
  const fullPath = window.location.pathname;
  const path = getPathFromLocation();
  let route = routes[path] || {};
  let routeParams = {};

  if (fullPath.startsWith('/dms/') && fullPath !== '/dms') {
    const userId = fullPath.split('/')[2];
    route = { auth: true, title: 'Chat', fn: () => renderDmChat(userId) };
    routeParams.userId = userId;
  }

  const isAuthenticated = !!localStorage.getItem('loggedIn');

  if (path === '/') {
    if (isAuthenticated) {
      window.history.replaceState({}, '', '/dashboard');
    } else {
      window.history.replaceState({}, '', '/auth');
    }
  }

  if (route.redirect) {
    window.history.replaceState({}, '', route.redirect);
    return router();
  }

  if (route.auth && !isAuthenticated) {
    window.history.replaceState({}, '', '/auth');
    return router();
  }

  if (!route.auth && isAuthenticated && path === '/auth') {
    window.history.replaceState({}, '', '/dashboard');
    return router();
  }

  if (!route.fn) {
    window.history.replaceState({}, '', '/404');
    return router();
  }

  document.title = "Hawk - " + route.title;
  const display_name = localStorage.getItem('display_name');

  const appEl = document.getElementById('app');
  if (appEl) appEl.classList.add('hidden');
  
  setTimeout(() => {
    mountShell();
    clearMain();
    
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.remove('no-scroll');
    
    route.fn();
    
    setTimeout(() => {
      if (appEl) appEl.classList.remove('hidden');
    }, 500);
  }, 500);
}
