import Modal from "./Modal.js";
import Options from "../utils/Options.js";

class OptionsModal extends Modal {
  constructor(domElement, scene, body = false) {
    super(domElement, "Options", scene, { showHeader: false });
    if (body !== false) this.body = body;
    
    this.categories = this._groupByCategory();
    this._categoriesInfo = {
      general: {
        icon: "assets/icons/generalinfo.png",
        name: "General"
      },
      render: {
        icon: "assets/icons/bright.png",
        name: "Render"
      },
      development: {
        icon: "assets/icons/control.png",
        name: "Development"
      }
    };
    this._originalValues = {};
    this._buildTabs();
    this._buildForms();
    this._bindEvents();
    
    this.scene = scene;
  }

  _groupByCategory() {
    const byCat = {};
    for (const [key, cfg] of Object.entries(Options.schema)) {
      if (cfg.category == "development" && !this.scene.dev) continue;
      const cat = cfg.category || "general";
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push({ name: key, cfg });
    }
    return byCat;
  }

  _buildTabs() {
    this.tabNav = document.createElement("ul");
    this.tabNav.className = "options-tabs";
    Object.keys(this.categories).forEach((cat, idx) => {
      const li = document.createElement("li");
      li.innerHTML = "<img src='" + this._categoriesInfo[cat]?.icon + "'>";
      li.dataset.tab = cat;
      if (idx === 0) li.classList.add("active");
      this.tabNav.append(li);
    });
    this.body.append(this.tabNav);
  }

  _buildForms() {
    this.forms = {};
    Object.entries(this.categories).forEach(([cat, opts], idx) => {
      const form = document.createElement("form");
      form.className = "options-form";
      if (idx !== 0) form.style.display = "none";
      form.dataset.cat = cat;

      opts.forEach(({ name, cfg }) => {
        const wrapper = document.createElement("div");
        wrapper.className = "option-item";

        const label = document.createElement("label");
        label.htmlFor = name;
        label.innerHTML = `${cfg.name}<br><span>${cfg.desc}</span>`;
        label.className = "option-label";
        wrapper.append(label);

        let input;
        const current = Options.get(name);

        switch (cfg.type) {
          case "string":
          case "number":
            input = document.createElement("input");
            input.type = cfg.type === "string" ? "text" : "number";
            if (cfg.min !== undefined) input.min = cfg.min;
            if (cfg.max !== undefined) input.max = cfg.max;
            if (cfg.minLength !== undefined) input.minLength = cfg.minLength;
            if (cfg.maxLength !== undefined) input.maxLength = cfg.maxLength;
            input.value = current;
            break;

          case "boolean":
            input = document.createElement("div");

            const inputBox = document.createElement("input");
            inputBox.type = "checkbox";
            inputBox.className = "ikxBAC";
            inputBox.checked = current;

            input.appendChild(inputBox);

            wrapper.className = "option-item-checkbox";
            break;

          case "select":
            input = document.createElement("select");
            cfg.options.forEach(opt => {
              const o = document.createElement("option");
              o.value = opt;
              o.innerText = opt;
              if (opt === current) o.selected = true;
              input.append(o);
            });
            break;

          case "array":
            input = document.createElement("textarea");
            input.value = JSON.stringify(current);
            break;

          case "object":
            input = document.createElement("textarea");
            input.value = JSON.stringify(current, null, 2);
            break;
        }

        input.id = name;
        wrapper.append(input);
        form.append(wrapper);
      });

      this.forms[cat] = form;
      this.body.append(form);
    });

    const footer = document.createElement("div");
    footer.className = "options-footer";

    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.textContent = "Save";
    btnSave.className = "button-save button-green";
    btnSave.disabled = true;

    const btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.textContent = "Cancel";
    btnCancel.className = "button-cancel button-gray";

    footer.appendChild(btnSave);
    footer.appendChild(btnCancel);
    this.body.append(footer);

    this._btnSave = btnSave;
    this._btnCancel = btnCancel;
  }

  toggle() {
    super.toggle();
    if (this.visible) {
      this._captureOriginalValues();
      this._setSaveDisabled(true);
    }
  }

  _captureOriginalValues() {
    this._originalValues = {};
    for (const form of Object.values(this.forms)) {
      for (const field of form.querySelectorAll("[id]")) {
        const id = field.id;
        if (!id) continue;
        const cfg = Options.schema[id];
        let val;
        if (cfg.type === "boolean") {
          const cb = field.querySelector("input[type=checkbox]");
          val = !!(cb && cb.checked);
        } else if (cfg.type === "number") {
          val = field.value === "" ? null : Number(field.value);
        } else if (cfg.type === "array" || cfg.type === "object") {
          try {
            val = JSON.parse(field.value || (cfg.type === "array" ? "[]" : "{}"));
          } catch {
            val = field.value;
          }
        } else {
          val = field.value;
        }
        if (cfg.type === "object" || cfg.type === "array") {
          try { this._originalValues[id] = JSON.parse(JSON.stringify(val)); } catch { this._originalValues[id] = val; }
        } else {
          this._originalValues[id] = val;
        }
      }
    }
  }

  _setSaveDisabled(state) {
    this._btnSave.disabled = state;
  }

  _bindEvents() {
    this.tabNav.addEventListener("click", e => {
      if (e.target.tagName !== "LI") return;
      const cat = e.target.dataset.tab;
      [...this.tabNav.children].forEach(li => li.classList.toggle("active", li.dataset.tab === cat));
      Object.values(this.forms).forEach(f => {
        f.style.display = f.dataset.cat === cat ? "" : "none";
      });
    });

    this._btnCancel.addEventListener("click", () => {
      this._restoreOriginalValues();
      this.toggle();
    });

    this._btnSave.addEventListener("click", () => {
      try {
        for (const form of Object.values(this.forms)) {
          for (const field of form.querySelectorAll("[id]")) {
            const id = field.id;
            if (!id) continue;
            const cfg = Options.schema[id];
            let val;
            if (cfg.type === "boolean") {
              const cb = field.querySelector("input[type=checkbox]");
              val = !!(cb && cb.checked);
            } else if (cfg.type === "number") {
              val = field.value === "" ? null : Number(field.value);
            } else if (cfg.type === "array" || cfg.type === "object") {
              val = JSON.parse(field.value || (cfg.type === "array" ? "[]" : "{}"));
            } else {
              val = field.value;
            }
            Options.put(id, val);
          }
        }
        this._captureOriginalValues();
        this._setSaveDisabled(true);
        this.toggle();
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    });

    for (const form of Object.values(this.forms)) {
      form.addEventListener("input", () => this._checkForModifications());
      form.addEventListener("change", () => this._checkForModifications());
    }
  }

  _checkForModifications() {
    for (const form of Object.values(this.forms)) {
      for (const field of form.querySelectorAll("[id]")) {
        const id = field.id;
        if (!id) continue;
        const cfg = Options.schema[id];
        let current;
        if (cfg.type === "boolean") {
          const cb = field.querySelector("input[type=checkbox]");
          current = !!(cb && cb.checked);
        } else if (cfg.type === "number") {
          current = field.value === "" ? null : Number(field.value);
        } else if (cfg.type === "array" || cfg.type === "object") {
          try { current = JSON.parse(field.value || (cfg.type === "array" ? "[]" : "{}")); } catch { current = field.value; }
        } else {
          current = field.value;
        }

        const orig = this._originalValues[id];

        const equal = (a, b) => {
          try { return JSON.stringify(a) === JSON.stringify(b); } catch { return a === b; }
        };

        if (!equal(current, orig)) {
          this._setSaveDisabled(false);
          return;
        }
      }
    }
    this._setSaveDisabled(true);
  }

  _restoreOriginalValues() {
    for (const form of Object.values(this.forms)) {
      for (const field of form.querySelectorAll("[id]")) {
        const id = field.id;
        if (!id) continue;
        const cfg = Options.schema[id];
        const orig = this._originalValues[id];
        if (cfg.type === "boolean") {
          const cb = field.querySelector("input[type=checkbox]");
          if (cb) cb.checked = !!orig;
        } else if (cfg.type === "number") {
          field.value = orig === null || orig === undefined ? "" : String(orig);
        } else if (cfg.type === "array" || cfg.type === "object") {
          try { field.value = JSON.stringify(orig, null, cfg.type === "object" ? 2 : 0); } catch { field.value = orig; }
        } else {
          field.value = orig === undefined ? "" : String(orig);
        }
      }
    }
    this._setSaveDisabled(true);
  }
}

export default OptionsModal;
