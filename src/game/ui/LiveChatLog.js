class LiveChatLog {
  constructor(domElement) {
    this.container = domElement;
    this.messages = [];
    this.maxMessages = 10;
    this.displayTime = 5000;
  }

  add(htmlMessage) {
    const msg = document.createElement('div');
    msg.className = 'live-chat-message';
    msg.innerHTML = htmlMessage;

    this.container.appendChild(msg);
    this.messages.push(msg);

    if (this.messages.length > this.maxMessages) {
      const old = this.messages.shift();
      this._removeMessage(old);
    }

    setTimeout(() => {
      this._removeMessage(msg);
      this.messages = this.messages.filter(m => m !== msg);
    }, this.displayTime);
  }

  _removeMessage(messageElement) {
    if (this.container.contains(messageElement)) {
      this.container.removeChild(messageElement);
    }
  }
}

export default LiveChatLog;
