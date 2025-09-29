import HudComponent from '../../hud/HudComponent.js';
import LiveChatLog from '../../LiveChatLog.js';
import Options from '../../../utils/Options.js';
import Commands from '../../../utils/Commands.js';
import Cache from '../../../../utils/Cache.js';

export default class ChatBoxComponent extends HudComponent {
  constructor({ scene, network, minChars = 1, maxChars = 75 }) {
    super('chatbox');
    this.minChars = minChars;
    this.maxChars = maxChars;
    this.visible = false;
    this.logVisible = false;
    this.scene = scene;
    this.network = network;
    this.suggestIndex = -1;

    this.isTyping = false;
    this.typingTimeout = null;
    this.TYPING_DELAY = 5000;
  }

  render(parent) {
    this.el = document.createElement('div');
    this.el.className = 'chatbox-container';

    const btnToggle = document.createElement('button');
    btnToggle.className = 'chatbox-button';
    btnToggle.innerHTML = '<img src="' + Cache.getBlob("assets/icons/message.png").dataUrl + '" alt="Chat">';
    btnToggle.addEventListener('click', () => this.toggleBox());
    this.el.appendChild(btnToggle);
    
    const btnToggleLog = document.createElement('button');
    btnToggleLog.className = 'chatbox-log-button';
    btnToggleLog.innerHTML = '<img src="' + Cache.getBlob("assets/icons/list.png").dataUrl + '" alt="Chat List">';
    btnToggleLog.addEventListener('click', () => this.toggleLogBox());
    this.el.appendChild(btnToggleLog);

    this.chatBox = document.createElement('div');
    this.chatBox.className = 'chatbox-box';
    this.chatBox.style.display = 'none';
    
    this.chatBoxLog = document.createElement('div');
    this.chatBoxLog.className = 'chatbox-log-box';
    this.chatBoxLog.style.display = 'none';

    this.textarea = document.createElement('input');
    this.textarea.className = 'chatbox-input';
    this.textarea.setAttribute('placeholder', 'Write your message...');
    this.textarea.setAttribute('maxlength', this.maxChars);
    this.chatBox.appendChild(this.textarea);

    this.suggestBox = document.createElement('div');
    this.suggestBox.className = 'chatbox-suggest';
    this.suggestBox.style.display = 'none';
    this.suggestBox.setAttribute('role', 'listbox');
    this.chatBox.appendChild(this.suggestBox);

    this.charCounter = document.createElement('div');
    this.charCounter.className = 'chatbox-counter';
    this.updateCounter();
    this.chatBox.appendChild(this.charCounter);

    const btnSend = document.createElement('button');
    btnSend.className = 'chatbox-send';
    btnSend.innerHTML = '<img src="' + Cache.getBlob("assets/icons/rightarrow.png").dataUrl + '">';
    btnSend.disabled = true;
    btnSend.addEventListener('click', () => this.handleSend());
    this.chatBox.appendChild(btnSend);

    this.textarea.addEventListener('input', () => {
      const len = this.textarea.value.trim().length;
      btnSend.disabled = len < this.minChars;
      this.updateCounter();
      this.updateSuggestions();

      this._onUserTyping();
    });
    
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleSend();
      }
    });

    const el = document.getElementById('chat-log');
    this.lchatlog = new LiveChatLog(parent);

    this.el.appendChild(this.chatBox);
    this.el.appendChild(this.chatBoxLog);
    parent.appendChild(this.el);
  }

  _emitTyping(state) {
    this.scene.networkManager.emitTyping(state);
  }

  _onUserTyping() {
    if (!this.isTyping) {
      this.isTyping = true;
      this._emitTyping(true);
    }

    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
      this._emitTyping(false);
      this.typingTimeout = null;
    }, this.TYPING_DELAY);
  }

  _stopTypingImmediate() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
    if (this.isTyping) {
      this.isTyping = false;
      this._emitTyping(false);
    }
  }

  toggleBox() {
    this.visible = !this.visible;
    this.chatBox.style.display = this.visible ? 'flex' : 'none';
    if (this.visible) {
      this.textarea.focus();
    } else {
      this._stopTypingImmediate();
      this.textarea.value = "";
    }
    
    this.scene.inputManager.setKeysStatus(!this.visible);
  }
  
  toggleLogBox() {
    this.logVisible = !this.logVisible;
    this.chatBoxLog.style.display = this.logVisible ? 'flex' : 'none';
  }

  updateCounter() {
    const len = this.textarea.value.length;
    this.charCounter.textContent = `${len}/${this.maxChars}`;
  }

  handleSend() {
    const message = this.textarea.value.trim();
    if (message.length >= this.minChars && message.length <= this.maxChars) {
      this.send(message);
      this.textarea.value = '';
      this.updateCounter();
      this.chatBox.style.display = 'none';
      this.visible = false;
      this.hideSuggestions();

      this._stopTypingImmediate();
    }
  }
  
  send(message, isCommandResponse = false) {
    if (Commands.isCommand(message)) {
      Commands.handleCommand(message, this.scene, this);
    } else {
      this.scene.networkManager.emitChatMessage(message, isCommandResponse);
    }
  }
  
  addMessage(user, message, isCommandResponse) {
    const span = document.createElement("span");
    span.className = "chatbox-log-message";
    
    const time = document.createElement("span");
    time.textContent = this.scene.lightManager.getTimeF();
    time.className = "timestamp";
    
    const name = document.createElement("span");
    name.textContent = user;
    name.className = "name";
    
    const messages = document.createElement("span");
    messages.textContent = message;
    messages.className = "message";
    if (isCommandResponse) messages.style.color = "yellow";
    
    span.appendChild(time);
    span.appendChild(name);
    span.appendChild(messages);
    
    if (Options.get("topleftchatlog")) this.lchatlog.add(span.innerHTML);
    this.chatBoxLog.appendChild(span);
  }

  updateSuggestions() {
    const v = this.textarea.value;
    if (!v.startsWith('/')) {
      this.hideSuggestions();
      return;
    }
    const query = v.slice(1).toLowerCase();
    const all = Commands.commands || [];
    const matches = all.filter(c => {
      const name = (c.name || '').toLowerCase();
      const id = (c.id || '').toLowerCase();
      return name.includes(query) || id.includes(query);
    });
    if (!matches.length) {
      this.hideSuggestions();
      return;
    }
    this.suggestBox.innerHTML = '';
    matches.slice(0, 8).forEach((cmd, idx) => {
      const item = document.createElement('div');
      item.className = 'chatbox-suggest-item';
      item.setAttribute('role', 'option');
      item.textContent = `/${cmd.name} — ${cmd.description || ''}`;
      item.addEventListener('click', (ev) => {
        ev.preventDefault();
        this.applySuggestion(cmd);
      });
      this.suggestBox.appendChild(item);
    });
    this.suggestIndex = -1;
    this.updateSuggestHighlight();
    this.suggestBox.style.display = 'block';
  }

  applySuggestion(cmd) {
    this.textarea.value = `/${cmd.name} `;
    this.updateCounter();
    this.hideSuggestions();
    this.textarea.focus();

    this._onUserTyping();
  }

  hideSuggestions() {
    if (!this.suggestBox) return;
    this.suggestBox.style.display = 'none';
    this.suggestBox.innerHTML = '';
    this.suggestIndex = -1;
  }

  updateSuggestHighlight() {
    const items = Array.from(this.suggestBox.querySelectorAll('.chatbox-suggest-item'));
    items.forEach((it, i) => {
      if (i === this.suggestIndex) {
        it.classList.add('active');
        it.scrollIntoView({ block: 'nearest' });
      } else {
        it.classList.remove('active');
      }
    });
  }
}
