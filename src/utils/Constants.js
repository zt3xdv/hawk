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

export const MESSAGE = {
  MIN: 0,
  MAX: 1000
};

export const PLAYER_SPEED_WALK = 100;
export const PLAYER_SPEED_RUN = 150;

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
  check: '/api/auth/check',
  login: '/api/auth/login',
  register: '/api/auth/register',
  profile: '/api/auth/profile',
  avatar: '/api/avatar',
  pavatar: '/api/pavatar',
  userEdit: '/api/user/edit',
  gameServers: '/api/game/servers',
  gameTurnstile: '/api/game/turnstile'
};

export const DISCORD_SERVER = "https://discord.gg/P8yrhaeCgy";

export const DEV = false;
export const TURNSTILE = true;

export const CONTRIBUTORS = [
  {
    name: "zt3xdv2",
    username: "tsumugi_dev",
    role: "Main Development"
  },
  {
    name: "Asura",
    username: "asurawhite1",
    role: "Domain gifter :3"
  },
  {
    name: "Alexxx",
    username: "alexonvscode",
    role: "Caddy (reverse proxy) provider"
  },
  {
    name: "Axillux",
    username: "axillux",
    role: "Assets (non-official)"
  },
  {
    name: "Cainos",
    username: "cainos",
    role: "Assets (non-official)"
  },
];

export const BASE_RULES = [
  {
    title: "Use common sense",
    description: "Do not swear."
  },
  {
    title: "Account Limit",
    description: "Do not create more than one account."
  },
  {
    title: "Hack/Exploits",
    description: "Do not use any hack/exploit such as auto write."
  },
  {
    title: "Rules",
    description: "Follow all rules or you will be permanently banned/timeout."
  },
];

export const SERVERS = [
  {
    id: "spanish",
    name: "Spanish",
    description: "Server in Spanish.",
    rules: BASE_RULES
  },
  {
    id: "english",
    name: "English",
    description: "Server in English.",
    rules: BASE_RULES
  }
];

export const TIPS = [
  "You can change your in-game avatar in profile page",
  "You can change your username in profile page",
];

export const ROLES = {
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin'
};

export const ROLE_PERMISSIONS = {
  moderator: ['kick', 'timeout', 'ban'],
  admin: ['kick', 'timeout', 'ban', 'unban'],
  superadmin: ['kick', 'timeout', 'ban', 'unban', 'edit_map']
};
