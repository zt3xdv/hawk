# Hawk

![Version](https://img.shields.io/badge/version-beta-blue)
![License](https://img.shields.io/badge/license-Apache%202.0-green)

**Hawk** is an online multiplayer hangout game built with the Hawk Engine.

## Features

- Real-time multiplayer gameplay
- OAuth authentication (Discord, Google)
- Messaging system
- Friends system
- Moderation tools
- Progressive Web App (PWA)
- Modern and responsive interface

## Technologies

- **Backend**: Node.js, Express
- **WebSockets**: ws
- **Authentication**: Passport.js
- **Bundler**: Rollup
- **Serialization**: MessagePack

## Requirements

- Node.js 18 or higher
- npm or pnpm

## Installation

1. Clone the repository:
```bash
git clone https://github.com/zt3xdv/hawk.git
cd hawk
```

2. Install dependencies:
```bash
npm install
```

3. Set up the configuration file:
```bash
cp config.example.json config.json
```

4. Edit `config.json` with your settings (port, OAuth credentials, HTTPS, etc.)

## Usage

### Development

```bash
# Start server
npm start

# Build client in development mode (watch)
npm run watch

# Build engine in development mode (watch)
npm run watch-engine
```

### Production

```bash
# Full application build
npm run build

# Full engine build
npm run build-engine

# Fast build (without minification)
npm run fast-build
npm run fast-build-engine
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the server |
| `npm run build` | Build application for production |
| `npm run fast-build` | Build application without minification |
| `npm run watch` | Build application in development mode |
| `npm run build-engine` | Build game engine |
| `npm run watch-engine` | Build engine in development mode |

## License

Copyright © 2025 [zt3xdv](https://github.com/zt3xdv)

This project is licensed under the [Apache License 2.0](LICENSE).

## Author

**tsumugi_dev**

- GitHub: [@zt3xdv](https://github.com/zt3xdv)

## Contributing

Contributions, issues and feature requests are welcome.
