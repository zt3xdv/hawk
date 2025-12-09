import { DISCORD_SERVER } from "../utils/Constants.js";
import Cache from '../utils/Cache.js';

const html = `
  <div class="landing-wrapper">
    <section class="hero-section">
      <div class="engine-tag">Powered by <strong>Hawk Engine</strong></div>
      <h1 class="hero-title">Where the World Hangs Out</h1>
      <p class="hero-subtitle">
        Dive into a seamless web universe. Connect with friends, meet new people, and create your own story in real-time.
      </p>

      <div class="auth-container">
        <div class="auth">
          <a class="btn" href="/auth">Join now!</a>
        </div>
      </div>
    </section>

    <section class="features-grid">
      <div class="feature-card">
        <span class="icon"><canv-icon id="people-icon"></canv-icon></span>
        <h3>Find Your Tribe</h3>
        <p>Whether across the street or across the ocean, make meaningful connections. Build your friends list and hang out instantly.</p>
      </div>
      <div class="feature-card">
        <span class="icon"><canv-icon id="message-icon"></canv-icon></span>
        <h3>Live Conversations</h3>
        <p>Express yourself without limits. Experience smooth, low-latency chats designed for keeping the conversation flowing.</p>
      </div>
      <div class="feature-card">
        <span class="icon"><canv-icon id="globe-icon"></canv-icon></span>
        <h3>Explore Together</h3>
        <p>Wander through beautifully crafted digital spaces. A lightweight experience accessible directly from your browser.</p>
      </div>
    </section>
  </div>
`;

function render() {
  const app = document.getElementById('app');
  app.innerHTML = html;
  
  document.getElementById('people-icon').src = Cache.getBlob('assets/icons/people.png').dataUrl;
  document.getElementById('message-icon').src = Cache.getBlob('assets/icons/message.png').dataUrl;
  document.getElementById('globe-icon').src = Cache.getBlob('assets/icons/globe.png').dataUrl;
}

export const options = { 
  title: "Home", 
  auth: false, 
  description: "Welcome to Hawk, a web hangout game created using Hawk engine." 
};

export { html, render };
