/**
 * RHODES AGI WebSocket Connection Manager
 * Isolated module to handle connection logic
 */

class ConnectionManager {
    constructor(options) {
        this.SERVER = options.SERVER;
        this.TOKEN = options.TOKEN;
        this.USER_TOKEN = options.USER_TOKEN;
        this.CLIENT_ID = options.CLIENT_ID;
        this.TAB_ID = options.TAB_ID;
        this.wantsNewRhodes = options.wantsNewRhodes;
        this.resumeSessionId = options.resumeSessionId;
        this.sharedQA = options.sharedQA;
        this.SYSTEM_INFO = options.SYSTEM_INFO;
        this.authModal = options.authModal;
        this.chat = options.chat;
        
        // State
        this.ws = null;
        this.IS_GUEST = true;
        this.GUEST_MESSAGES_REMAINING = 3;
        this.RHODES_ID = null;
        this.CURRENT_USERNAME = null;
        this.autoGuestAttempted = false;
        
        // Bind methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.setStatus = options.setStatus;
        this.addMsg = options.addMsg;
        this.addMsgStreaming = options.addMsgStreaming;
        this.updateStreamingMsg = options.updateStreamingMsg;
        this.hideLoading = options.hideLoading;
        this.showLoading = options.showLoading;
        this.generateUUID = options.generateUUID;
        this.maskPasswords = options.maskPasswords;
        this.showToast = options.showToast;
        
        // Debug
        this.debug = options.debug || false;
    }
    
    connect() {
        console.log('ConnectionManager.connect() called, SERVER:', this.SERVER);
        
        // Skip connection if viewing shared Q&A
        if (this.sharedQA) return;
        
        const hasUserToken = this.USER_TOKEN && this.USER_TOKEN.length > 10;
        const hasToken = this.TOKEN && this.TOKEN.length > 10;
        console.log('Token check - USER_TOKEN length:', this.USER_TOKEN?.length || 0, 'hasUserToken:', hasUserToken);
        console.log('Token check - TOKEN length:', this.TOKEN?.length || 0, 'hasToken:', hasToken);
        
        // Auto-connect as guest or with saved credentials
        if (this.authModal) this.authModal.style.display = 'none';
        this.setStatus(false, 'CONNECTING');
        
        try {
            this.ws = new WebSocket(this.SERVER);
            console.log('WebSocket created successfully for:', this.SERVER);
            console.log('WebSocket readyState after creation:', this.ws.readyState);
            
            // Debug: log readyState after 2 seconds
            setTimeout(() => {
                console.log('WebSocket readyState after 2s:', this.ws?.readyState, 'url:', this.SERVER);
                if (this.ws?.readyState === WebSocket.CONNECTING) {
                    console.log('WebSocket stuck in CONNECTING state - possible network issue');
                }
            }, 2000);
        } catch (error) {
            console.error('WebSocket constructor failed:', error);
            this.setStatus(false, 'WS CONSTRUCTION FAILED');
            // Show auth modal immediately
            setTimeout(() => {
                if (this.authModal) this.authModal.style.display = 'flex';
            }, 500);
            return;
        }
        
        // Connection timeout: if WebSocket doesn't open within 5 seconds, show auth modal
        const connectionTimeout = setTimeout(() => {
            console.log('WebSocket connection timeout - onopen not called within 5s');
            if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
                console.log('WebSocket state:', this.ws.readyState, 'forcing auth modal');
                this.setStatus(false, 'CONNECTION TIMEOUT');
                if (this.authModal) this.authModal.style.display = 'flex';
                // Show debug button
                const debugBtn = document.getElementById('debug-btn');
                if (debugBtn) debugBtn.style.display = 'inline';
                // Auto-select guest tab as fallback and connect automatically
                setTimeout(() => {
                    const guestTab = document.querySelector('[data-tab="guest"]');
                    if (guestTab) guestTab.click();
                    // Wait for tab switch then click guest connect button
                    setTimeout(() => {
                        const guestConnectBtn = document.getElementById('guest-connect-btn');
                        if (guestConnectBtn) guestConnectBtn.click();
                    }, 200);
                }, 100);
            }
        }, 5000);
        
        this.ws.onopen = () => {
            clearTimeout(connectionTimeout);
            // Hide debug button on successful connection
            const debugBtn = document.getElementById('debug-btn');
            if (debugBtn) debugBtn.style.display = 'none';
            console.log('WebSocket opened, sending auth request');
            // Get saved session ID for auto-resume
            const savedSessionId = localStorage.getItem('rhodes_session_id') || '';
            
            this.ws.send(JSON.stringify({
                msg_type: 'auth_request',
                msg_id: this.generateUUID(),
                timestamp: new Date().toISOString(),
                payload: {
                    client_id: this.CLIENT_ID,
                    tab_id: this.TAB_ID,
                    token: hasToken ? this.TOKEN : '',
                    user_token: hasUserToken ? this.USER_TOKEN : '',
                    resume_session: (hasUserToken && !this.wantsNewRhodes) ? savedSessionId : '',
                    client_version: '3.0.0',
                    platform: 'web',
                    hostname: location.hostname,
                    system: {
                        browser: this.SYSTEM_INFO.browser.name,
                        browser_engine: this.SYSTEM_INFO.browser.engine,
                        os: this.SYSTEM_INFO.os.name,
                        os_version: this.SYSTEM_INFO.os.version || null,
                        os_distro: this.SYSTEM_INFO.os.distro || null,
                        is_mobile: this.SYSTEM_INFO.isMobile,
                        user_agent: navigator.userAgent
                    }
                }
            }));
        };
        
        this.ws.onmessage = (e) => {
            // TODO: Move message handling logic here
            // For now, forward to existing handler
            if (window.handleWebSocketMessage) {
                window.handleWebSocketMessage(e);
            } else {
                console.error('No message handler registered');
            }
        };
        
        this.ws.onclose = (event) => {
            clearTimeout(connectionTimeout);
            console.log('WebSocket closed, code:', event.code, 'reason:', event.reason, 'wasClean:', event.wasClean);
            console.log('WebSocket closed, reconnecting in 3s');
            this.setStatus(false, 'DISCONNECTED');
            // Show debug button
            const debugBtn = document.getElementById('debug-btn');
            if (debugBtn) debugBtn.style.display = 'inline';
            setTimeout(() => this.connect(), 3000);
        };
        
        this.ws.onerror = (error) => {
            clearTimeout(connectionTimeout);
            console.log('WebSocket error event:', error);
            console.log('WebSocket readyState:', this.ws?.readyState);
            this.setStatus(false, 'ERROR');
            // Show debug button
            const debugBtn = document.getElementById('debug-btn');
            if (debugBtn) debugBtn.style.display = 'inline';
            setTimeout(() => this.connect(), 5000);
        };
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    
    sendMessage(content, attachments = [], model = null) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.log('Cannot send message: WebSocket not open');
            return false;
        }
        
        this.ws.send(JSON.stringify({
            msg_type: 'user_message',
            msg_id: this.generateUUID(),
            timestamp: new Date().toISOString(),
            payload: {
                content,
                model,
                attachments,
                audio_output: typeof VoiceChat !== 'undefined' && VoiceChat.voiceEnabled,
                stream: true
            }
        }));
        return true;
    }
    
    getWebSocket() {
        return this.ws;
    }
    
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
    
    getConnectionState() {
        return this.ws ? this.ws.readyState : -1;
    }
}

// Export for use in main script
window.ConnectionManager = ConnectionManager;