import { hexToRgb } from '../utils/Utils.js';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

export default class CanvIcon extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['src', 'color'];
  }

  get src() {
    return this.getAttribute('src');
  }

  set src(value) {
    this.setAttribute('src', value);
  }

  get color() {
    return this.getAttribute('color');
  }

  set color(value) {
    this.setAttribute('color', value);
  }

  connectedCallback() {
    const src = this.getAttribute('src');
    if (src) {
      this.processImage(src);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src' && newValue && newValue !== oldValue) {
      this.processImage(newValue);
    } else if (name === 'color' && newValue !== oldValue) {
      const src = this.getAttribute('src');
      if (src) {
        this.processImage(src);
      }
    }
  }

  processImage(src) {
    const color = this.getAttribute('color');

    const img = document.createElement('img');
    img.src = src;
    img.style.width = '2em';
    img.style.height = '2em';
    img.style.verticalAlign = 'middle';
    img.style.marginRight = '5px';

    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(img);

    img.onload = () => {
      canvas.width = 128;
      canvas.height = 128;
      ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < pixels.data.length; i += 4) {
        const lightness = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3;
        pixels.data[i + 3] = lightness < 64 ? 0 : 255;
      }
      ctx.putImageData(pixels, 0, 0);

      if (color) {
        const [r, g, b] = hexToRgb(color);
        const recolor = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < recolor.data.length; i += 4) {
          if (recolor.data[i + 3] > 0) {
            recolor.data[i] = r;
            recolor.data[i + 1] = g;
            recolor.data[i + 2] = b;
          }
        }
        ctx.putImageData(recolor, 0, 0);
      }

      const newImg = document.createElement('img');
      newImg.src = canvas.toDataURL();
      newImg.style.width = '2em';
      newImg.style.height = '2em';
      newImg.style.verticalAlign = 'middle';
      newImg.style.marginRight = '5px';
      this.shadowRoot.innerHTML = '';
      this.shadowRoot.appendChild(newImg);
    };
  }
}