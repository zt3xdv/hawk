import { renderLogin } from './login.js';
import { renderRegister } from './register.js';
import { renderDashboard } from './dashboard.js';
import { renderAbout } from './about.js';
import { renderProfile } from './profile.js';
import { renderProfileSettings } from './profileSettings.js';
import { renderAvatar } from './avatar.js';
import { renderPeople } from './people.js';
import { renderTermsOfService } from './termsofservice.js';
import { renderPrivacyPolicy } from './ppolicy.js';

export const routes = {
'/login':            { fn: renderLogin,    auth: false, title: 'Login', description: 'Sign in to your Hawk account.' },
'/register':         { fn: renderRegister, auth: false, title: 'Register', description: 'Create a Hawk account and join the community.' },
'/dashboard':        { fn: renderDashboard, auth: true,  title: 'Dashboard', description: 'Sign in, and play on the community.' },
'/avatar':           { fn: renderAvatar, auth: true,  title: 'Avatar', description: 'Customize your in-game avatar with a custom image.' },
'/profile':          { fn: renderProfile, auth: true,  title: 'Profile', description: 'View and edit your public profile.' },
'/profile-settings': { fn: renderProfileSettings, auth: true,  title: 'Profile Settings', description: 'Manage data and security settings.' },
'/people':           { fn: renderPeople, auth: true,  title: 'People', description: 'Manage friends, and send game invites.' },
'/about':            { fn: renderAbout, auth: false,  title: 'About', description: 'Overview of Hawk, its mission, and team.' },
'/privacypolicy':    { fn: renderPrivacyPolicy, auth: false,  title: 'Privacy Policy', description: 'Details on how Hawk collects, uses, and protects data.' },
'/termsofservice':   { fn: renderTermsOfService, auth: false,  title: 'Terms Of Service', description: 'Rules and legal terms governing use of Hawk.' },
  '/':                 {},
  
  '/404':              { fn: () => {}, auth: false, title: '404', description: 'This page has not found.' },
};

export function getPathFromLocation() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return '/' + (parts.length ? parts[parts.length - 1] : '');
}

function upsertMeta({ selector, tagName = 'meta', attributes = {} }) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(tagName);
    document.head.appendChild(el);
  }
  Object.keys(attributes).forEach(key => {
    if (key === 'textContent') {
      el.textContent = attributes[key];
    } else {
      el.setAttribute(key, attributes[key]);
    }
  });
  return el;
}

export function setPageMetadata(route = {}) {
  const title = route.title || 'Hawk';
  const description = route.description || 'Sign up and join our community!';
  const thumbnail = route.thumbnailUrl || '/icon.png';
  const url = window.location.href;

  document.title = title;

  upsertMeta({
    selector: 'meta[name="description"]',
    attributes: { name: 'description', content: description }
  });

  upsertMeta({
    selector: 'meta[property="og:title"]',
    attributes: { property: 'og:title', content: title }
  });
  upsertMeta({
    selector: 'meta[property="og:description"]',
    attributes: { property: 'og:description', content: description }
  });
  upsertMeta({
    selector: 'meta[property="og:image"]',
    attributes: { property: 'og:image', content: thumbnail }
  });
  upsertMeta({
    selector: 'meta[property="og:url"]',
    attributes: { property: 'og:url', content: url }
  });
  upsertMeta({
    selector: 'meta[property="og:type"]',
    attributes: { property: 'og:type', content: 'website' }
  });

  upsertMeta({
    selector: 'meta[name="twitter:card"]',
    attributes: { name: 'twitter:card', content: 'summary_large_image' }
  });
  upsertMeta({
    selector: 'meta[name="twitter:title"]',
    attributes: { name: 'twitter:title', content: title }
  });
  upsertMeta({
    selector: 'meta[name="twitter:description"]',
    attributes: { name: 'twitter:description', content: description }
  });
  upsertMeta({
    selector: 'meta[name="twitter:image"]',
    attributes: { name: 'twitter:image', content: thumbnail }
  });
}

