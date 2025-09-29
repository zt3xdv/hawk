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
            <h2>${alert.title}</h2>
            <div>${alert.html}</div>
            <button class="close-btn">Accept</button>
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