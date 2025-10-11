class Alerts {
    static queue = [];
    static isShowing = false;

    static add(title, html, callback) {
        this.queue.push({ title, html, callback });
        this.showNext();
    }

    static showNext() {
        if (this.isShowing || this.queue.length === 0) return;

        const alert = this.queue.shift();
        this.isShowing = true;

        const alertElement = document.createElement('div');
        alertElement.className = 'alert';
        alertElement.innerHTML = `
            <h3 class="title">${alert.title}</h3>
            <div class="content">${alert.html}</div>
            <button class="btn close-btn">Accept</button>
        `;

        document.body.appendChild(alertElement);

        const closeButton = alertElement.querySelector('.close-btn');
        closeButton.addEventListener('click', () => {
            if (alert.callback) {
              alert.callback();
            } else {
             this.closeAlert(alertElement);
            }
        });
    }

    static closeAlert(alertElement) {
        alertElement.classList.add('fade-out');
        alertElement.addEventListener('transitionend', () => {
            alertElement.remove();
            this.isShowing = false;
            this.showNext();
        });
    }
}

export default Alerts;