import { renderLogin } from './login.js';
import { renderRegister } from './register.js';
import { renderDashboard } from './dashboard.js';
import { renderAbout } from './about.js';
import { renderHelp } from './help.js';
import { renderProfile } from './profile.js';
import { renderProfileSettings } from './profileSettings.js';
import { renderAvatar } from './avatar.js';
import { renderPeople } from './people.js';
import { renderTermsOfService } from './termsofservice.js';
import { renderPrivacyPolicy } from './ppolicy.js';
import { renderNotFound } from './404.js';
import { renderPing } from './ping.js';
import { routes as baseRoutes } from './list.js';

export const routes = {
  '/login':            { ...(baseRoutes['/login'] || {}),            fn: renderLogin },
  '/register':         { ...(baseRoutes['/register'] || {}),         fn: renderRegister },
  '/dashboard':        { ...(baseRoutes['/dashboard'] || {}),        fn: renderDashboard },
  '/avatar':           { ...(baseRoutes['/avatar'] || {}),           fn: renderAvatar },
  '/profile':          { ...(baseRoutes['/profile'] || {}),          fn: renderProfile },
  '/profile-settings': { ...(baseRoutes['/profile-settings'] || {}), fn: renderProfileSettings },
  '/people':           { ...(baseRoutes['/people'] || {}),           fn: renderPeople },
  '/about':            { ...(baseRoutes['/about'] || {}),            fn: renderAbout },
  '/help':             { ...(baseRoutes['/help'] || {}),             fn: renderHelp },
  '/privacypolicy':    { ...(baseRoutes['/privacypolicy'] || {}),    fn: renderPrivacyPolicy },
  '/termsofservice':   { ...(baseRoutes['/termsofservice'] || {}),   fn: renderTermsOfService },
  '/404':              { ...(baseRoutes['/404'] || {}),              fn: renderNotFound },
  '/ping':             { ...(baseRoutes['/ping'] || {}),             fn: renderPing },
  
  // NOOP
  '/':                 { ...(baseRoutes['/'] || {}) },
};

export function getPathFromLocation() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return '/' + (parts.length ? parts[parts.length - 1] : '');
}
