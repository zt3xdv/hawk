class Options {
  static schema = {
    topleftchatlog: {
      default: false,
      name: "Top left Chat Log",
      type: 'boolean',
      desc: 'Enable or disable top-left chat log',
      category: 'general'
    },
    use12hFormat: {
      default: false,
      name: "12h time format",
      type: 'boolean',
      desc: 'Use 12h time format (AM/PM)',
      category: 'general'
    },
    quality: {
      default: "high",
      name: "Render Quality",
      type: 'select',
      options: ["high", "medium", "low"],
      desc: 'Requires restart',
      category: 'render'
    },
    debug: {
      default: false,
      name: "Debug mode",
      type: 'boolean',
      desc: 'Requires restart',
      category: 'development'
    },
  };

  static store = Object.fromEntries(
    Object.entries(Options.schema).map(([key, cfg]) => [key, cfg.default])
  );

  static loadFromLocalStorage() {
    const storedOptions = JSON.parse(localStorage.getItem('options'));
    if (storedOptions) {
      for (const key in storedOptions) {
        if (key in Options.store) {
          Options.store[key] = storedOptions[key];
        }
      }
    }
  }

  static saveToLocalStorage() {
    localStorage.setItem('options', JSON.stringify(Options.store));
  }

  static get(optionName) {
    if (!(optionName in Options.store)) {
      throw new Error(`Option "${optionName}" is not defined.`);
    }
    return Options.store[optionName];
  }

  static put(optionName, value) {
    const cfg = Options.schema[optionName];
    if (!cfg) {
      throw new Error(`Option "${optionName}" does not exist.`);
    }
    switch (cfg.type) {
      case 'string':
        if (typeof value !== 'string') throw new Error(`"${optionName}" must be a string.`);
        if (value.length < cfg.minLength || value.length > cfg.maxLength) {
          throw new Error(`"${optionName}" length must be between ${cfg.minLength} and ${cfg.maxLength}.`);
        }
        break;
      case 'number':
        if (typeof value !== 'number') throw new Error(`"${optionName}" must be a number.`);
        if (value < cfg.min || value > cfg.max) {
          throw new Error(`"${optionName}" must be between ${cfg.min} and ${cfg.max}.`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') throw new Error(`"${optionName}" must be a boolean.`);
        break;
      case 'array':
        if (!Array.isArray(value)) throw new Error(`"${optionName}" must be an array.`);
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          throw new Error(`"${optionName}" must be an object.`);
        }
        break;
      case 'select':
        if (!cfg.options.includes(value)) {
          throw new Error(`"${optionName}" must be one of: ${cfg.options.join(', ')}.`);
        }
        break;
      default:
        throw new Error(`Unsupported type for "${optionName}".`);
    }
    Options.store[optionName] = value;
    Options.saveToLocalStorage();
  }

  static resetAll() {
    Options.store = Object.fromEntries(
      Object.entries(Options.schema).map(([key, cfg]) => [key, cfg.default])
    );
    Options.saveToLocalStorage();
  }
}
Options.loadFromLocalStorage();

export default Options;
