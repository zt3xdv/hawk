import fs from 'fs/promises';

class ModerationModel {
    static DATA_PATH = './data/moderation.json';
    static hideList = [];
    static banList = [];
    static timeoutList = [];

    static HIDE_DURATIONS = {
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
            this.hideList = jsonData.hideList || [];
            this.banList = jsonData.banList || [];
            this.timeoutList = jsonData.timeoutList || [];
            this.cleanExpired();
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.hideList = [];
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
                hideList: this.hideList,
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
        this.hideList = this.hideList.filter(h => {
            if (h.expiresAt === -1) return true;
            return h.expiresAt > now;
        });
        this.timeoutList = this.timeoutList.filter(t => t.expiresAt > now);
    }

    static async hidePlayer(userId, targetId, duration = '1hour') {
        const durationMs = this.HIDE_DURATIONS[duration] || this.HIDE_DURATIONS['1hour'];
        const expiresAt = durationMs === -1 ? -1 : Date.now() + durationMs;
        
        this.hideList = this.hideList.filter(h => 
            !(h.userId === userId && h.targetId === targetId)
        );
        
        this.hideList.push({
            userId,
            targetId,
            createdAt: Date.now(),
            expiresAt,
            duration
        });

        this.hideList = this.hideList.filter(h => 
            !(h.userId === targetId && h.targetId === userId)
        );
        
        this.hideList.push({
            userId: targetId,
            targetId: userId,
            createdAt: Date.now(),
            expiresAt,
            duration
        });

        await this.saveData();
        return { success: true, duration, expiresAt };
    }

    static async unhidePlayer(userId, targetId) {
        this.hideList = this.hideList.filter(h => 
            !(h.userId === userId && h.targetId === targetId) &&
            !(h.userId === targetId && h.targetId === userId)
        );
        await this.saveData();
        return { success: true };
    }

    static isHidden(userId, targetId) {
        this.cleanExpired();
        return this.hideList.some(h => 
            (h.userId === userId && h.targetId === targetId) &&
            (h.expiresAt === -1 || h.expiresAt > Date.now())
        );
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
        const durationMs = this.HIDE_DURATIONS[duration] || this.HIDE_DURATIONS['5min'];
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

    static getHiddenPlayers(userId) {
        this.cleanExpired();
        return this.hideList
            .filter(h => h.userId === userId && (h.expiresAt === -1 || h.expiresAt > Date.now()))
            .map(h => ({
                targetId: h.targetId,
                expiresAt: h.expiresAt,
                duration: h.duration
            }));
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
