import Modal from './Modal.js';
import { escapeHtml, getAuth, apiPost } from '../utils/Utils.js';
import { API } from '../../utils/Constants.js';

export default class PlayerInfoModal extends Modal {
    constructor(container, scene) {
        super(container, 'Player Info', scene);
        this.currentPlayer = null;
        this.currentUserData = null;
    }

    async showPlayer(playerId, playerData) {
        this.currentPlayer = playerId;
        this.currentUserData = playerData;
        
        const auth = getAuth();
        
        // Check if this is the current user - don't show own player info
        try {
            const currentUserProfile = await apiPost('/api/auth/profile', { username: auth.username });
            if (currentUserProfile && currentUserProfile.id === playerId) {
                return; // Don't show modal for own player
            }
        } catch (error) {
            console.error('Error checking current user:', error);
        }
        
        let userProfile = null;
        
        this.body.innerHTML = `<div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.7);">Loading player information...</div>`;
        this.toggle();
        
        try {
            userProfile = await apiPost('/api/auth/profile', { username: playerData.username });
        } catch (error) {
            console.error('Error fetching player profile:', error);
        }

        if (!userProfile || userProfile.valid === false) {
            this.body.innerHTML = `<div style="padding: 20px; text-align: center; color: #f44336;">Error loading player information</div>`;
            return;
        }
        
        console.log(userProfile);

        const isModerator = await this.checkIfModerator(auth.username);
        
        this.renderPlayerInfo(userProfile, playerData, auth, isModerator);
    }

    async checkIfModerator(username) {
        try {
            const auth = getAuth();
            const response = await fetch(`/api/auth/roles?username=${encodeURIComponent(auth.username)}&password=${encodeURIComponent(auth.password)}`);
            const data = await response.json();
            
            if (data.error || !data.roles) return false;
            
            return data.roles.includes('moderator') ||
                   data.roles.includes('admin') ||
                   data.roles.includes('superadmin');
        } catch (error) {
            return false;
        }
    }

    renderPlayerInfo(profile, playerData, auth, isModerator) {
        const displayName = escapeHtml(profile.display_name || profile.username || 'Unknown');
        const username = escapeHtml(profile.username || 'unknown');
        const bio = escapeHtml(profile.bio || 'This player has not set a bio yet.');
        const avatar = profile.avatar || profile.game?.avatar || playerData?.avatar || '';
        const userId = profile.id || 'N/A';

        this.body.innerHTML = `
            <div class="player-info-container">
                <div class="player-info-header">
                    ${avatar ? `<img src="${avatar}" class="player-info-avatar" alt="Avatar" />` : '<div class="player-info-avatar-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>'}
                    <div class="player-info-details">
                        <h2 class="player-info-name">${displayName}</h2>
                        <p class="player-info-username">@${username}</p>
                        <p class="player-info-id">ID: ${escapeHtml(userId)}</p>
                        ${profile.roles && profile.roles.length > 0 ? `
                            <div class="player-info-roles">
                                ${profile.roles.map(role => `<span class="player-role-badge ${role}">${escapeHtml(role)}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="player-info-section">
                    <h3>About</h3>
                    <p class="player-bio-text">${bio}</p>
                </div>

                <div class="player-info-section">
                    <div class="player-action-buttons">
                        <button id="sendFriendRequestBtn" class="player-action-btn primary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="20" y1="8" x2="20" y2="14"></line>
                                <line x1="23" y1="11" x2="17" y2="11"></line>
                            </svg>
                            Send Friend Request
                        </button>
                    </div>
                </div>

                ${isModerator ? `
                    <div class="player-info-section player-info-moderation">
                        <div class="player-action-buttons moderation">
                            <button id="timeoutPlayerBtn" class="player-action-btn warning">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                Timeout (Mute)
                            </button>
                            
                            <button id="banPlayerBtn" class="player-action-btn danger">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                                </svg>
                                Ban Player
                            </button>

                            <button id="kickPlayerBtn" class="player-action-btn warning">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <line x1="18" y1="8" x2="23" y2="13"></line>
                                    <line x1="23" y1="8" x2="18" y2="13"></line>
                                </svg>
                                Kick
                            </button>
                        </div>
                    </div>
                ` : ''}

                <div id="actionResult" class="player-action-result"></div>
            </div>
        `;

        this.attachEventListeners(profile, auth, isModerator);
    }

    attachEventListeners(profile, auth, isModerator) {
        const sendFriendBtn = document.getElementById('sendFriendRequestBtn');
        const resultDiv = document.getElementById('actionResult');

        const checkAuth = () => {
            if (!auth || !auth.username || !auth.password) {
                this.showResult(resultDiv, 'You must be logged in to perform this action', 'error');
                return false;
            }
            return true;
        };

        if (sendFriendBtn) {
            sendFriendBtn.addEventListener('click', async () => {
                if (!checkAuth()) return;
                
                try {
                    const result = await apiPost(API.friendsSend, {
                        ...auth,
                        targetUsername: profile.username
                    });
                    
                    if (result.error) {
                        this.showResult(resultDiv, result.error, 'error');
                    } else {
                        this.showResult(resultDiv, result.message || 'Friend request sent!', 'success');
                    }
                } catch (error) {
                    this.showResult(resultDiv, error.error || error.message || 'Error sending friend request', 'error');
                }
            });
        }

        if (isModerator) {
            const timeoutBtn = document.getElementById('timeoutPlayerBtn');
            const banBtn = document.getElementById('banPlayerBtn');
            const kickBtn = document.getElementById('kickPlayerBtn');

            if (timeoutBtn) {
                timeoutBtn.addEventListener('click', async () => {
                    if (!checkAuth()) return;
                    
                    const reason = prompt('Enter timeout reason:') || 'No reason provided';
                    const duration = prompt('Enter duration (5min, 1hour, 1day):', '5min') || '5min';
                    
                    try {
                        const result = await apiPost('/api/moderation/timeout', {
                            ...auth,
                            targetId: profile.id,
                            duration,
                            reason
                        });
                        if (result.success) {
                            this.showResult(resultDiv, `Player timed out for ${duration}`, 'success');
                        } else {
                            this.showResult(resultDiv, result.error || 'Error timing out player', 'error');
                        }
                    } catch (error) {
                        this.showResult(resultDiv, error.message || 'Error timing out player', 'error');
                    }
                });
            }

            if (banBtn) {
                banBtn.addEventListener('click', async () => {
                    if (!checkAuth()) return;
                    
                    const reason = prompt('Enter ban reason:') || 'No reason provided';
                    const confirm = window.confirm(`Are you sure you want to PERMANENTLY ban ${profile.username}?\n\nReason: ${reason}`);
                    
                    if (!confirm) return;

                    try {
                        const result = await apiPost('/api/moderation/ban', {
                            ...auth,
                            targetId: profile.id,
                            reason
                        });
                        if (result.success) {
                            this.showResult(resultDiv, 'Player banned successfully', 'success');
                        } else {
                            this.showResult(resultDiv, result.error || 'Error banning player', 'error');
                        }
                    } catch (error) {
                        this.showResult(resultDiv, error.message || 'Error banning player', 'error');
                    }
                });
            }

            if (kickBtn) {
                kickBtn.addEventListener('click', async () => {
                    if (!checkAuth()) return;
                    
                    const confirm = window.confirm(`Are you sure you want to kick ${profile.username} from the server?`);
                    
                    if (!confirm) return;

                    try {
                        const result = await apiPost('/api/moderation/kick', {
                            ...auth,
                            targetId: profile.id
                        });
                        if (result.success) {
                            this.showResult(resultDiv, 'Player kicked successfully', 'success');
                        } else {
                            this.showResult(resultDiv, result.error || 'Error kicking player', 'error');
                        }
                    } catch (error) {
                        this.showResult(resultDiv, error.message || 'Error kicking player', 'error');
                    }
                });
            }
        }
    }

    showResult(element, message, type) {
        element.textContent = message;
        element.className = `player-action-result ${type}`;
    }
}
