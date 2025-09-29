import fs from 'fs/promises';
import bcrypt from 'bcryptjs';
import { uuid } from '../utils/Utils.js';

class UserModel {
    static users = [];
    static DATA_PATH = './data/users.json';
    static SALT_ROUNDS = 10;

    constructor(id, displayName, username, password, game = {
      lastPosition: {
        x: 0,
        y: 0
      }
    }, avatar, bio) {
        this.id = id;
        this.displayName = displayName;
        this.username = username;
        this.password = password;
        this.game = game;
        this.avatar = avatar;
        this.bio = bio;
    }

    static async loadUsers() {
        try {
            const data = await fs.readFile(this.DATA_PATH, 'utf8');
            const jsonData = JSON.parse(data);
            this.users = jsonData.map(user => new UserModel(user.id, user.display_name, user.username, user.password, user.game, user.avatar, user.bio));
        } catch (error) {
            if (err.code === 'ENOENT') {
                this.users = [];
                await this.saveUsers();
            } else {
                console.error('Error loading users from file:', err);
            }
        }
    }

    static async saveUsers() {
        try {
            const jsonData = this.users.map(user => ({
                id: user.id,
                display_name: user.displayName,
                username: user.username,
                password: user.password,
                game: user.game,
                avatar: user.avatar,
                bio: user.bio,
            }));
            await fs.writeFile(this.DATA_PATH, JSON.stringify(jsonData, null, 2));
        } catch (error) {
            console.error('Error saving users to file:', error);
        }
    }

    static async createUser(displayName, username, password) {
        const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
        const newUser = new UserModel(uuid(), displayName, username, hashedPassword);
        this.users.push(newUser);
        await this.saveUsers();
        return newUser;
    }

    static getUserByUsername(username) {
        return this.users.find(user => user.username === username);
    }
    
    static getUserById(id) {
        return this.users.find(user => user.id === id);
    }

    static async updateUserById(id, newData) {
        const user = this.getUserById(id);
        if (user) {
            Object.assign(user, newData);
            await this.saveUsers();
            return user;
        }
        return null;
    }

    static async updateUser(username, newData) {
        const user = this.getUserByUsername(username);
        if (user) {
            Object.assign(user, newData);
            await this.saveUsers();
            return user;
        }
        return null;
    }
    
    static async updateUserData(username, key, value) {
        const user = this.getUserByUsername(username);
        if (user) {
            user[key] = value;
            await this.saveUsers();
            return user;
        }
        return null;
    }

    static getAllUsers() {
        return this.users;
    }
}

export default UserModel;
