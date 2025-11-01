import fs from 'fs/promises';

class ModerationModel {
    static DATA_PATH = './data/moderation.json';
    static banList = [];
    static timeoutList = [];

    static TIMEOUT_DURATIONS = {
        '5min': 5 * 60 * 1000,
        '1hour': 60 * 60 * 1000,
        '1day': 24 * 60 * 60 * 1000,
        '1week': 7 * 24 * 60 * 60 * 1000,
        'permanent': -1
    };

    static async loadData() {
        try {
            const data = await fs.readFile(this.DATA_PATH, 'utf8');
            const jsonData = JSON.parse(data);
            this.banList = jsonData.banList || [];
            this.timeoutList = jsonData.timeoutList || [];
            this.cleanExpired();
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.banList = [];
                this.timeoutList = [];
                await this.saveData();
            } else {
                console.error('Error loading moderation data:', error);
            }
        }
    }

    static async saveData() {
        try {
            const jsonData = {
                banList: this.banList,
                timeoutList: this.timeoutList
            };
            await fs.writeFile(this.DATA_PATH, JSON.stringify(jsonData, null, 2));
        } catch (error) {
            console.error('Error saving moderation data:', error);
        }
    }

    static cleanExpired() {
        const now = Date.now();
        this.timeoutList = this.timeoutList.filter(t => t.expiresAt > now);
    }

    static async banPlayer(targetId, moderatorId, reason = 'No reason provided') {
        const existing = this.banList.find(b => b.targetId === targetId);
        if (existing) {
            return { success: false, error: 'User already banned' };
        }

        this.banList.push({
            targetId,
            moderatorId,
            reason,
            createdAt: Date.now()
        });

        await this.saveData();
        return { success: true };
    }

    static async unbanPlayer(targetId) {
        this.banList = this.banList.filter(b => b.targetId !== targetId);
        await this.saveData();
        return { success: true };
    }

    static isBanned(userId) {
        return this.banList.some(b => b.targetId === userId);
    }

    static async timeoutPlayer(targetId, moderatorId, duration = '5min', reason = 'No reason provided') {
        const durationMs = this.TIMEOUT_DURATIONS[duration] || this.TIMEOUT_DURATIONS['5min'];
        const expiresAt = Date.now() + durationMs;

        this.timeoutList = this.timeoutList.filter(t => t.targetId !== targetId);

        this.timeoutList.push({
            targetId,
            moderatorId,
            reason,
            duration,
            createdAt: Date.now(),
            expiresAt
        });

        await this.saveData();
        return { success: true, expiresAt };
    }

    static isTimedOut(userId) {
        this.cleanExpired();
        return this.timeoutList.some(t => 
            t.targetId === userId && t.expiresAt > Date.now()
        );
    }
    
    static getUserBan(userId) {
        return this.banList.find(b => b.targetId === userId);
    }

    static getUserTimeout(userId) {
        this.cleanExpired();
        return this.timeoutList.find(t => t.targetId === userId && t.expiresAt > Date.now());
    }
}

export default ModerationModel;
