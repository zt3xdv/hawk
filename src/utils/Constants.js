export const DISPLAY_NAME = {
  MIN: 3,
  MAX: 32
};

export const USERNAME = {
  MIN: 3,
  MAX: 16
};

export const PASSWORD = {
  MIN: 8,
  MAX: 16
};

export const BIO = {
  MIN: 0,
  MAX: 200
};

export const API = {
  friendsList: '/api/friends/list',
  friendsRequests: '/api/friends/requests',
  friendsPending: '/api/friends/pending',
  friendsSend: '/api/friends/send',
  friendsCancel: '/api/friends/cancel',
  friendsAccept: '/api/friends/accept',
  friendsDeny: '/api/friends/deny',
  friendsStatus: '/api/friends/status',
  friendsRemove: '/api/friends/remove',
  check: '/api/auth/check'
};

export const DISCORD_SERVER = "https://discord.gg/P8yrhaeCgy";

export const DEV = false;

export const CONTRIBUTORS = [
  {
    name: "zt3xdv2",
    username: "tsumugi_dev",
    role: "Main Development"
  },
  {
    name: "Asura",
    username: "asurawhite",
    role: "Domain"
  },
  {
    name: "David Dobos",
    username: "wolfypro",
    role: "Just existing (free hosting service 🙏🙏)"
  }
];

export const SERVERS = [
  {
    id: "spanish_portuguese",
    name: "Spanish/Portuguese",
    description: "Spanish/Portuguese server.",
  },
  {
    id: "english",
    name: "English",
    description: "Server in english.",
  }
];
