import * as authRoute from './auth.js';
import * as dashboardRoute from './dashboard.js';
import * as aboutRoute from './about.js';
import * as helpRoute from './help.js';
import * as profileRoute from './profile.js';
import * as profileSettingsRoute from './profileSettings.js';
import * as avatarRoute from './avatar.js';
import * as peopleRoute from './people.js';
import * as termsofserviceRoute from './termsofservice.js';
import * as ppolicyRoute from './ppolicy.js';
import * as notFoundRoute from './404.js';
import * as pingRoute from './ping.js';
import * as dmsRoute from './dms.js';
import * as adminRoute from './admin.js';
import * as landingRoute from './landing.js';

export const routes = {
  '/auth':             authRoute,
  '/admin':            adminRoute,
  '/dashboard':        dashboardRoute,
  '/avatar':           avatarRoute,
  '/profile':          profileRoute,
  '/profile-settings': profileSettingsRoute,
  '/people':           peopleRoute,
  '/dms':              dmsRoute,
  '/about':            aboutRoute,
  '/help':             helpRoute,
  '/privacypolicy':    ppolicyRoute,
  '/termsofservice':   termsofserviceRoute,
  '/404':              notFoundRoute,
  '/ping':             pingRoute,
  '/':                 landingRoute,
};

export function getPathFromLocation() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return '/' + (parts.length ? parts[parts.length - 1] : '');
}
