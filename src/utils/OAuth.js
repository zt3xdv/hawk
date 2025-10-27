import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as DiscordStrategy } from 'passport-discord';
import UserModel from '../models/UserModel.js';
import config from '../../config.json' with { type: 'json' };
import https from 'https';
import http from 'http';

async function downloadImageAsDataURL(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        resolve(null);
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          const base64 = buffer.toString('base64');
          const mimeType = response.headers['content-type'] || 'image/png';
          const dataURL = `data:${mimeType};base64,${base64}`;
          resolve(dataURL);
        } catch (error) {
          console.error('Error converting image to dataURL:', error);
          resolve(null);
        }
      });
    }).on('error', (error) => {
      console.error('Error downloading image:', error);
      resolve(null);
    });
  });
}

function setupOAuth() {
  if (config.oauth?.google?.enabled) {
    passport.use(new GoogleStrategy({
      clientID: config.oauth.google.clientId,
      clientSecret: config.oauth.google.clientSecret,
      callbackURL: config.oauth.google.callbackURL
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        await UserModel.loadUsers();
        let user = UserModel.getUserByOAuthId('google', profile.id);
        let isNewUser = false;
        
        if (!user) {
          const username = `google_${profile.id}`;
          const displayName = profile.displayName || profile.emails?.[0]?.value.split('@')[0] || username;
          const avatarUrl = profile.photos?.[0]?.value || '';
          const avatar = avatarUrl ? await downloadImageAsDataURL(avatarUrl) : null;
          
          user = await UserModel.createOAuthUser(displayName, username, 'google', profile.id, {
            email: profile.emails?.[0]?.value,
            avatar
          });
          isNewUser = true;
        }
        
        user.isNewUser = isNewUser;
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  if (config.oauth?.discord?.enabled) {
    passport.use(new DiscordStrategy({
      clientID: config.oauth.discord.clientId,
      clientSecret: config.oauth.discord.clientSecret,
      callbackURL: config.oauth.discord.callbackURL,
      scope: ['identify', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        await UserModel.loadUsers();
        let user = UserModel.getUserByOAuthId('discord', profile.id);
        let isNewUser = false;
        
        if (!user) {
          const username = `discord_${profile.id}`;
          const displayName = profile.username || username;
          const avatarUrl = profile.avatar 
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : '';
          const avatar = avatarUrl ? await downloadImageAsDataURL(avatarUrl) : null;
          
          user = await UserModel.createOAuthUser(displayName, username, 'discord', profile.id, {
            email: profile.email,
            avatar
          });
          isNewUser = true;
        }
        
        user.isNewUser = isNewUser;
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }
}

export default setupOAuth;
