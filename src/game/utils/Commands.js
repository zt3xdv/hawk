class Commands {
  static commands = [
    {
      name: 'rand',
      id: '/rand',
      description: 'Random integer between two numbers: /rand min max',
      execute: (scene, chatlog, args) => {
        if (!args || args.length < 2) {
          chatlog.send('Usage: /rand min max', true);
          return;
        }
        const a = Number(args[0]);
        const b = Number(args[1]);
        if (!Number.isFinite(a) || !Number.isFinite(b)) {
          chatlog.send('Both min and max must be valid numbers.', true);
          return;
        }
        let min = Math.ceil(Math.min(a, b));
        let max = Math.floor(Math.max(a, b));
        const val = Math.floor(Math.random() * (max - min + 1)) + min;
        chatlog.send("Random number between " + String(min) + " and " + String(max) + ": " + String(val), true);
      }
    },
    {
      name: 'randf',
      id: '/randf',
      description: 'Random float between two numbers: /randf min max',
      execute: (scene, chatlog, args) => {
        if (!args || args.length < 2) {
          chatlog.send('Usage: /randf min max', true);
          return;
        }
        const a = Number(args[0]);
        const b = Number(args[1]);
        if (!Number.isFinite(a) || !Number.isFinite(b)) {
          chatlog.send('Both min and max must be valid numbers.', true);
          return;
        }
        const min = Math.min(a, b);
        const max = Math.max(a, b);
        const val = Math.random() * (max - min) + min;
        chatlog.send("Random float between " + String(min) + " and " + String(max) + ": " + String(val), true);
      }
    },
    {
      name: 'choose',
      id: '/choose',
      description: 'Choose one item from a list: /choose option1 option2 ...',
      execute: (scene, chatlog, args) => {
        if (!args || args.length === 0) {
          chatlog.send('Usage: /choose option1 option2 ...', true);
          return;
        }
        const pick = args[Math.floor(Math.random() * args.length)];
        chatlog.send("Choose \"" + pick + "\"", true);
      }
    },
    {
      name: 'time',
      id: '/time',
      description: 'Show current local date/time',
      execute: (scene, chatlog, args) => {
        const now = new Date();
        chatlog.send(now.toString(), true);
      }
    }
  ];

  static parseArgs(text) {
    if (!text || typeof text !== 'string') return [];
    const withoutCmd = text.trim().split(' ').slice(1).join(' ');
    const args = [];
    const re = /"([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'|(\S+)/g;
    let match;
    while ((match = re.exec(withoutCmd)) !== null) {
      if (match[1] !== undefined) args.push(match[1].replace(/\\(["'\\])/g, '$1'));
      else if (match[3] !== undefined) args.push(match[3].replace(/\\(["'\\])/g, '$1'));
      else if (match[5] !== undefined) args.push(match[5]);
    }
    return args;
  }

  static isCommand(text) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    if (!trimmed.startsWith('/')) return false;
    const cmd = trimmed.split(' ')[0];
    return Commands.commands.some(c => c.id === cmd);
  }

  static handleCommand(message, scene, chatlog) {
    if (!Commands.isCommand(message)) return false;

    const cmdId = message.split(' ')[0];
    const command = Commands.commands.find(c => c.id === cmdId);
    if (!command) return false;

    const finalArgs = Commands.parseArgs(message);

    try {
      command.execute(scene, chatlog, finalArgs);
      return true;
    } catch (err) {
      console.error('Command error:', err);
      chatlog.send('Command execution error.', true);
      return false;
    }
  }
}

export default Commands;
