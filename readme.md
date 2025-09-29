# Hawk

Hangout game using Hawk engine.
Ah yes chatgpt is my sugar :wah:

---

## Quick Start

1. Clone:
```bash
git clone https://github.com/zt3xdv/hawk.git
cd hawk
```

2. Install:
```bash
npm install
```

3. Startup config;
```bash
cp config.example.json config.json
```

4. Build
```bash
# For development
npm run fast-build

# For production
npm run build
```

5. Run:
```bash
npm run start
```

Edit /src/utils/Constants.js to modify dev mode to add debugging and map editor.

---

## License

Apache License 2.0

---

## TODO

Aw man...

- [x] ID System: Use id instead of username for identify accounts.
- [x] Friends system: Add friends requests (needs id system for security).
- [x] Building: Add a public map editor.
- [ ] Islands: Separate world per player.
- [x] Editor: Map editor.
- [x] Tiled map: Use tiled (mapeditor) maps instead of generating images using hash (in progress)...

---