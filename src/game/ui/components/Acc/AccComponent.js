import HudComponent from '../../hud/HudComponent.js';
import Cache from '../../../../utils/Cache.js';

export default class AccComponent extends HudComponent {
  constructor({ scene, onClickMe, onClickPeople }) {
    super('acc');
    this.onClickMe = onClickMe;
    this.onClickPeople = onClickPeople;
    this.scene = scene;
    
    this.peopleVisible = false;
  }

  render(parent) {
    this.el = document.createElement('div');
    this.el.className = 'acc-container';

    const btnMe = document.createElement('button');
    btnMe.innerHTML = '<img src="' + Cache.getBlob("assets/icons/Person.png").dataUrl + '">';
    btnMe.className = 'acc-button';
    btnMe.onclick = this.onClickMe;

    const btnPeople = document.createElement('button');
    btnPeople.innerHTML = '<img src="' + Cache.getBlob("assets/icons/people.png").dataUrl + '">';
    btnPeople.className = 'acc-button';
    btnPeople.onclick = () => this.togglePeople();

    this.peopleContainer = document.createElement('div');
    this.peopleContainer.className = 'people-container';
    this.peopleContainer.style.display = 'none';
    
    const peopleHeader = document.createElement('div');
    peopleHeader.innerHTML = "<div class=\"header-brand\"><img src='" + Cache.getBlob('assets/icons/people.png').dataUrl + "'>People</div><button class=\"header-button\"><img src='" + Cache.getBlob('assets/icons/friends.png').dataUrl + "'></button>";
    peopleHeader.className = 'people-header';
    
    peopleHeader.querySelector("button").addEventListener("click", () => {
      this.scene.inputManager.peopleModal.toggle();
    });
    
    this.peopleList = document.createElement('ul');
    this.peopleList.className = "people-list";
    
    this.peopleContainer.appendChild(peopleHeader);
    this.peopleContainer.appendChild(this.peopleList);

    this.el.appendChild(btnMe);
    this.el.appendChild(btnPeople);
    parent.appendChild(this.el);
    parent.appendChild(this.peopleContainer);
  }
  
  togglePeople() {
    this.peopleVisible = !this.peopleVisible;
    
    this.peopleContainer.style.display = (this.peopleVisible ? "block" : "none");
    
    if (this.peopleVisible) {
      const players = this.scene.networkManager.players;
      if (players != {}) {
        this.peopleList.innerHTML = "";
        
        Object.values(players).forEach(player => {
          const li = document.createElement('li');
          
          const header = document.createElement('div');
          header.className = "people-user-header";
          
          const avatar = document.createElement('img');
          avatar.src = player.avatar || "logo.png";
          
          const name = document.createElement('p');
          name.innerText = player.display_name + (player.id == this.scene.player.id ? " (you)" : "");
          
          const id = document.createElement('p');
          id.className = "accent";
          id.innerText = "@" + player.username;
          
          header.appendChild(avatar);
          header.appendChild(name);
          
          li.appendChild(header);
          li.appendChild(id);
          this.peopleList.appendChild(li);
        });
      } else {
        this.peopleList.innerHTML = "<small class='accent'>There are no people nearby.</small>";
      }
    }
  }
}
