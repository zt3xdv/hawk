import HudComponent from '../../hud/HudComponent.js';
import Cache from '../../../../utils/Cache.js';
import { getAuth, apiPost } from '../../../utils/Utils.js';
import { API } from '../../../../utils/Constants.js';

export default class AccComponent extends HudComponent {
  constructor({ scene, onClickMe, onClickPeople }) {
    super('acc');
    this.onClickMe = onClickMe;
    this.onClickPeople = onClickPeople;
    this.scene = scene;
    
    this.peopleVisible = false;
    this.friendsData = [];
    this.refreshInterval = null;
  }

  render(parent) {
    const btn = document.createElement('button');
    btn.innerHTML = '<img src="' + Cache.getBlob("assets/icons/friends.png").dataUrl + '">';
    btn.className = 'acc-button';
    btn.onclick = () => this.toggle();

    this.el = document.createElement('ul');
    this.el.className = 'acc-list';
    this.el.style.display = 'none';
    
    const header = document.createElement('div');
    header.innerHTML = "<div class=\"header-brand\"><img src='" + Cache.getBlob('assets/icons/friends.png').dataUrl + "'>Friends</div><button class=\"header-button refresh-btn\">⟳</button>";
    header.className = 'acc-header';
    
    header.querySelector(".refresh-btn").addEventListener("click", () => {
      this.loadFriends();
    });
    
    this.el.appendChild(header);
    
    this.friendsList = document.createElement('div');
    this.friendsList.className = "friends-list";
    
    this.el.appendChild(this.friendsList);

    parent.appendChild(btn);
    parent.appendChild(this.el);
  }
  
  async toggle() {
    this.peopleVisible = !this.peopleVisible;
    
    this.el.style.display = (this.peopleVisible ? "block" : "none");
    
    if (this.peopleVisible) {
      await this.loadFriends();
      
      if (!this.refreshInterval) {
        this.refreshInterval = setInterval(() => {
          if (this.peopleVisible) {
            this.loadFriends();
          }
        }, 5000);
      }
    } else {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    }
  }
  
  async loadFriends() {
    const auth = getAuth();
    if (!auth.username || !auth.password) {
      this.friendsList.innerHTML = "<small class='accent'>Not authenticated</small>";
      return;
    }
    
    try {
      const response = await apiPost(API.friendsList, auth);
      
      if (response.error) {
        this.friendsList.innerHTML = "<small class='accent'>Error loading friends</small>";
        return;
      }
      
      this.friendsData = response.friends || [];
      this.renderFriends();
    } catch (error) {
      this.friendsList.innerHTML = "<small class='accent'>Error loading friends</small>";
    }
  }
  
  renderFriends() {
    this.friendsList.innerHTML = "";
    
    if (this.friendsData.length === 0) {
      this.friendsList.innerHTML = "<small class='accent'>No friends yet</small>";
      return;
    }
    
    this.friendsData.forEach(friend => {
      const li = document.createElement('li');
      
      const header = document.createElement('div');
      header.className = "people-user-header";
      
      const avatar = document.createElement('img');
      avatar.src = friend.avatar || "/api/pavatar/" + friend.id;
      
      const infoContainer = document.createElement('div');
      infoContainer.className = "people-user-info";
      
      const name = document.createElement('p');
      name.className = "people-user-name";
      name.innerText = friend.display_name || friend.username;
      
      const username = document.createElement('p');
      username.className = "accent";
      username.innerText = "@" + friend.username;
      
      const status = document.createElement('div');
      status.className = "friend-status";
      
      const statusDot = document.createElement('span');
      const statusText = document.createElement('span');
      statusText.className = "status-text";
      
      if (friend.online === 'web') {
        statusDot.className = "status-dot online-web";
        statusText.innerText = 'On web';
      } else if (friend.online && friend.online !== false) {
        statusDot.className = "status-dot online";
        statusText.innerText = friend.server ? friend.server.name : 'Online';
      } else {
        statusDot.className = "status-dot offline";
        statusText.innerText = 'Offline';
      }
      
      status.appendChild(statusDot);
      status.appendChild(statusText);
      
      header.appendChild(avatar);
      infoContainer.appendChild(name);
      infoContainer.appendChild(username);
      infoContainer.appendChild(status);
      header.appendChild(infoContainer);
      
      li.appendChild(header);
      this.friendsList.appendChild(li);
    });
  }
  
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}
