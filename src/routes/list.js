export const routes = {
'/login':            { auth: false, title: 'Login', description: 'Sign in to your Hawk account.' },
'/register':         { auth: false, title: 'Register', description: 'Create a Hawk account and join the community.' },
'/dashboard':        { auth: true,  title: 'Dashboard', description: 'Sign in, and play on the community.' },
'/avatar':           { auth: true,  title: 'Avatar', description: 'Customize your in-game avatar with a custom image.' },
'/profile':          { auth: true,  title: 'Profile', description: 'View and edit your public profile.' },
'/profile-settings': { auth: true,  title: 'Profile Settings', description: 'Manage data and security settings.' },
'/people':           { auth: true,  title: 'People', description: 'Manage friends, and send game invites.' },
'/about':            { auth: false,  title: 'About', description: 'Overview of Hawk, its mission, and team.' },
'/help':             { auth: false,  title: 'Help', description: 'Controls, and some help.' },
'/privacypolicy':    { auth: false,  title: 'Privacy Policy', description: 'Details on how Hawk collects, uses, and protects data.' },
'/termsofservice':   { auth: false,  title: 'Terms Of Service', description: 'Rules and legal terms governing use of Hawk.' },
  '/404':              { auth: false, title: '404', description: 'This page has not found.' },
  '/ping':              { auth: false, title: 'Ping', description: 'Check the ping between you and Hawk servers.' },
  
  '/':                 { redirect: '/dashboard' },
};
