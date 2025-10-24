import { router } from './router.js';
import Features from './game/device/Features.js';
import Cache from './utils/Cache.js';
import { list } from './utils/Icons.js';
import { ASSETS_VERSION, TIPS } from './utils/ConstantsPackage.js';
import { getRandomFromArray, requestNotificationPermission } from './utils/Utils.js';
import * as Components from './components/components.js';

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredInstallPrompt = e;
});

window.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('Service worker registered sucessfully.');
      })
      .catch(error => {
        console.error('Error registering service worker:', error);
      });
  }

  if (Notification.permission === 'default') {
    // Work in progress...
    // requestNotificationPermission();
  }

  const loading = document.getElementById("loading");
  function randomTip() {
    loading.querySelector("#tip").innerHTML = getRandomFromArray(TIPS);
  }
  const tipInterval = setInterval(() => randomTip(), 5000);
  randomTip();
  
  Components.define();

  let codes = [];
  const f = Features();
  if (!f.canvas) codes.push("2D_CONTEXT_ERROR");
  if (!f.localStorage) codes.push("LOCAL_STORAGE_NOT_FOUND");
  if (!f.webGL) codes.push("WEBGL_CONTEXT_ERROR");
  if (!f.file) codes.push("FILE_SYSTEM_ERROR");

  if (codes.length) {
    const app = document.createElement("main");
    app.id = "app";
    app.className = "when-error";
    app.innerHTML = `
      <main class="main">
        <div class="header">
          <h3>Aw man :(</h3>
        </div>
        <p>Your browser is not compatible with <span class="highlight">Hawk Engine</span>.</p>
        <div class="try-footer">
          <p>You can try:</p>                                                                        
          <p>- <a href="/assets/wah.png">View a cute cat</a>.</p>
        </div>
        <br>
        <small class="accent">${codes.join(", ")}</small>
      </main>
    `;
    document.body.appendChild(app);
    
    loading.classList.add('hidden');
    loading.addEventListener('transitionend', () => {
      clearInterval(tipInterval);
      loading.remove();
    });
  } else {
    await Cache.load(ASSETS_VERSION, [
      "assets/entities/bee.png",
      "assets/fonts/at01.ttf",
      "assets/game/props.png",
      "assets/game/plants.png",
      "assets/game/building.png",
      "assets/game/terrain.png",
      "assets/game/animated.png",
      "assets/game/grass2.png",
      "assets/game/dirt.png",
      "assets/game/grass2_snow.png",
      "assets/game/dirt_snow.png",
      "assets/masks/lightMask.png",
      "assets/masks/flame.png",
      "assets/masks/candle_flame.png",
      "assets/masks/water_foam.png",
      "assets/masks/smoke.png",
      "assets/masks/smoke_ramp.png",
      "assets/masks/lightMask_o.png",
      "assets/tilemap.png",
      "assets/ui/main.png",
      "assets/wah.png",
      "styles/main.css",
      "logo.png",
      "logo.svg",
      "banner.png",
      ...list
    ], (data) => {
      loading.querySelector("#loading-bar div").style.width = data.percentage + "%";
    });
    
    loading.classList.add('hidden');
    loading.addEventListener('transitionend', () => {
      clearInterval(tipInterval);
      loading.remove();
    });
    
    router();
  }
});
