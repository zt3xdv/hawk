<a href="https://hawkg.xyz">
  <img width="60px" height="60px" src="https://raw.githubusercontent.com/zt3xdv/hawk/main/assets/logo.svg" align="right" />
</a>

# Hawk

A real-time multiplayer hangout game where you can explore, build, and hang out with friends. Built with HawkEngine and WebSockets.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.0.1--beta-orange.svg)](package.json)

---

## What is Hawk?

Hawk is an online multiplayer game that lets you hang out with friends in a shared virtual world. You can move around, chat with nearby players, and create your own spaces. The party system allows you to create private instances where you and your friends can build and customize maps together.

### Main Features

**Multiplayer**
- Real-time interaction with other players using WebSocket connections
- See and chat with players in your view range
- Smooth movement synchronization with chunk-based rendering

**Party System**
- Create private parties with custom names and descriptions
- Invite friends via invite codes or direct invitations
- Separate party instances with isolated maps
- Customizable member permissions (editing maps, placing tiles, inviting others)
- Save up to 3 different maps per user

**Map Building**
- Place and modify terrain tiles
- Add, move, and delete objects on the map
- Changes sync in real-time to all party members
- Load and save custom maps

**User System**
- User registration and authentication
- Personal profiles with avatars and bios
- Last position saved separately for normal world and parties
- Moderation tools (ban, timeout, hide players)

**Game World**
- Dynamic day/night cycle
- Chunk-based world loading for performance
- Persistent world state

---

## Getting Started

### Requirements

- Node.js 18.x or higher
- npm or pnpm
- Git

### Installation

Clone the repository:
```bash
git clone https://github.com/zt3xdv/hawk.git
cd hawk
```

Install dependencies:
```bash
npm install
```

Configure your server:
```bash
cp config.example.json config.json
```

Edit `config.json` with your settings:
```json
{
  "port": 3000,
  "host": "127.0.0.1:3000",
  "turnstile": {
    "key": "YOUR_TURNSTILE_SITE_KEY",
    "private": "YOUR_TURNSTILE_PRIVATE_KEY"
  },
  "https": {
    "enabled": false,
    "cert": "path/to/cert.pem",
    "key": "path/to/key.pem"
  }
}
```

### Building

For development (faster builds, no minification):
```bash
npm run fast-build
npm run fast-build-engine
```

For production (optimized builds):
```bash
npm run build
npm run build-engine
```

Watch mode (automatically rebuilds on file changes):
```bash
npm run watch
npm run watch-engine
```

### Running

Start the server:
```bash
npm start
```

The game will be available at `http://127.0.0.1:3000` (or your configured host).

---

## Project Structure

```
hawk/
├── src/
│   ├── server/              # Backend logic
│   │   ├── Hawk.js          # Main game server
│   │   ├── PartyManager.js  # Party system management
│   │   ├── ChunkManager.js  # World chunk handling
│   │   └── Socket.js        # WebSocket routing
│   ├── game/                # Client game logic
│   ├── engine/              # Hawk engine code
│   ├── components/          # UI components
│   ├── models/              # Data models (User, Player, etc.)
│   ├── routes/              # Express HTTP routes
│   └── utils/               # Helper functions and constants
├── assets/                  # Images, sprites, audio
├── data/                    # Server data files (users, maps, parties)
├── public/                  # Static public files
├── dist/                    # Compiled output
├── config.json              # Server configuration
└── index.js                 # Application entry point
```

---

## How the Party System Works

Parties are private instances where you and your friends can build together. When you create or join a party, you're put into a separate world instance with its own map and objects.

**Creating a party:**
```javascript
{ type: 'createParty', data: { name: 'My Party', description: 'Come hang out!' } }
```

**Joining via code:**
```javascript
{ type: 'joinPartyByCode', data: { code: 'ABC123' } }
```

**Inviting players:**
```javascript
{ type: 'inviteToParty', data: { playerId: 'player-id' } }
```

The party owner can control permissions for each member. Members can have permission to edit the map, place tiles, or invite other players.

Party maps are saved separately for each user. You can save up to 3 different maps and load them later.

---

## Configuration Options

### Server Settings

| Option | Description | Default |
|--------|-------------|---------|
| `port` | Port the server listens on | `3000` |
| `host` | Public hostname (used in WebSocket URLs) | `127.0.0.1:3000` |
| `turnstile.key` | Cloudflare Turnstile site key for bot protection | - |
| `turnstile.private` | Cloudflare Turnstile secret key | - |
| `https.enabled` | Whether to use HTTPS | `false` |
| `https.cert` | Path to SSL certificate file | - |
| `https.key` | Path to SSL key file | - |

### Game Constants

You can customize game behavior by editing `src/utils/Constants.js`:

- Party name/description length limits
- Maximum elements per party map
- Player view ranges
- Development mode settings

---

## WebSocket API

### Client to Server Events

**Authentication**
- `login` - Log in with username and password

**Movement & Interaction**
- `playerMovement` - Update your position
- `chat` - Send a chat message
- `typing` - Notify others you're typing

**Map Editing**
- `createElement` - Add an object to the map
- `deleteElement` - Remove an object
- `moveElement` - Move an object
- `setTile` - Place or modify a tile

**Party Management**
- `createParty` - Create a new party
- `leaveParty` - Leave current party
- `joinPartyByCode` - Join using invite code
- `inviteToParty` - Invite another player
- `acceptPartyInvite` - Accept an invitation
- `setPartyPermission` - Change member permissions (owner only)
- `kickPartyMember` - Remove a member (owner only)

**Map Persistence**
- `savePartyMap` - Save current party map to a slot
- `loadPartyMap` - Load a saved map
- `getPartyMapSlots` - Get list of saved maps

### Server to Client Events

**Connection**
- `connected` - Connection established
- `loggedIn` - Login successful

**World State**
- `chunks` - Load map chunks
- `tiles` - Load tile data
- `time` - Current in-game time

**Players**
- `addPlayer` - A player entered your view
- `removePlayer` - A player left your view
- `playerMoved` - A player moved

**Chat**
- `chatmessage` - Chat message from another player
- `typing` - Someone is typing

**Map Changes**
- `createElement` - Object added
- `deleteElement` - Object removed
- `moveElement` - Object moved
- `setTile` - Tile changed

**Party Events**
- `partyCreated` - Party successfully created
- `partyJoined` - You joined a party
- `partyLeft` - You left a party
- `partyMemberJoined` - Someone joined your party
- `partyMemberLeft` - Someone left your party
- `partyPermissionUpdated` - Member permissions changed
- `partyMapSaved` - Map saved successfully
- `partyMapLoaded` - Map loaded successfully
- `partyMapSlots` - Your saved map slots

**Errors**
- `loginError` - Login failed
- `partyError` - Party operation failed

For detailed event schemas, see [PARTY_SYSTEM_BACKEND.md](PARTY_SYSTEM_BACKEND.md).

---

## Development

### Build System

The project uses Rollup for bundling. There are two main build targets:

**App Build** (`app.build.js`)
- Bundles client-side code and UI components
- Output: `dist/bundle.js`

**Engine Build** (`engine.build.js`)
- Bundles the Hawk game engine
- Output: `dist/engine.js`

Build modes:
- `npm run build` - Production build with minification
- `npm run fast-build` - Development build without minification
- `npm run watch` - Watch mode that rebuilds on changes

### Adding New Features

**Server-side features:**
Edit files in `src/server/`. The main server is in `Hawk.js`, which handles WebSocket connections and game logic.

**Client-side features:**
Edit files in `src/game/` for game logic or `src/engine/` for engine-level changes.

**UI components:**
Add new components in `src/components/`. They'll be automatically bundled.

**HTTP routes:**
Add Express routes in `src/routes/`.

### Data Storage

User data, maps, and parties are stored as JSON files in the `data/` directory:
- `data/users.json` - User accounts
- `data/map.json` - Main world map
- `data/tiles.json` - Main world tiles
- `data/party.json` - Active parties
- `data/parties/[user-id]/slots.json` - User's saved party maps

---

## Tech Stack

**Backend**
- Node.js & Express for HTTP server
- WebSocket (ws) for real-time communication
- bcrypt for password hashing
- MessagePack for efficient binary serialization

**Frontend**
- HawkEngine for game rendering
- Vanilla JavaScript (no framework)
- Custom UI components

**Build Tools**
- Rollup for bundling
- Terser for minification
- Chokidar for file watching

**Security**
- Cloudflare Turnstile for bot protection
- bcrypt password hashing
- Input validation and sanitization

---

## Contributing

Contributions are welcome. If you want to help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Make your changes
4. Commit (`git commit -m 'Add new feature'`)
5. Push to your fork (`git push origin feature/new-feature`)
6. Open a Pull Request

Please make sure your code follows the existing style and test your changes before submitting.

---

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

---

## Links

- Website: [hawkg.xyz](https://hawkg.xyz)
- Repository: [github.com/zt3xdv/hawk](https://github.com/zt3xdv/hawk)
- Issues: [github.com/zt3xdv/hawk/issues](https://github.com/zt3xdv/hawk/issues)
- Pull Requests: [github.com/zt3xdv/hawk/pulls](https://github.com/zt3xdv/hawk/pulls)

---

Made by [tsumugi_dev](https://github.com/zt3xdv)
