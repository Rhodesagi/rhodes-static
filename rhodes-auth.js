// Extracted from rhodes.js: auth/account/session-state UI subsystem

// Global flag set by returning-user detection in rhodes.js
window.__rhodesIsReturningUser = false;

window.installRhodesAuthUi = function installRhodesAuthUi(deps) {
    if (!deps || window.__rhodesAuthUiInstalled) return;
    window.__rhodesAuthUiInstalled = true;

    const rhodesStorage = deps.rhodesStorage;
    const connect = deps.connect;
    const addMsg = deps.addMsg;
    const getWs = deps.getWs;
    const getUserToken = deps.getUserToken;
    const setUserToken = deps.setUserToken;
    const setToken = deps.setToken;
    const isGuest = deps.isGuest;
    const setIsGuest = deps.setIsGuest;
    const getCurrentUsername = deps.getCurrentUsername;
    const setCurrentUsername = deps.setCurrentUsername;

    function showAuthTab(tabName) {
        const authModal = document.getElementById('auth-modal');
        if (authModal) authModal.style.display = 'flex';
        const tabEl = document.querySelector('[data-tab="' + tabName + '"]');
        if (tabEl) tabEl.click();
    }

    function updateHeaderAuth() {
        const currentUsername = getCurrentUsername();
        const guest = isGuest() || !currentUsername;
        console.log('[AUTH-DEBUG] updateHeaderAuth called, IS_GUEST:', guest, 'CURRENT_USERNAME:', currentUsername);

        const loginBtn = document.getElementById('header-login-btn');
        const accountDropdown = document.getElementById('account-dropdown');
        const accountTrigger = document.getElementById('account-trigger');
        const accountUsername = document.getElementById('account-username');

        const mobileLoginLink = document.getElementById('mobile-login-link');
        const mobileAccountMenu = document.getElementById('mobile-account-menu');
        const mobileAccountUsername = document.getElementById('mobile-account-username');
        const mobileNewSession = document.getElementById('mobile-new-session');
        const mobileSessionsList = document.getElementById('mobile-sessions-list');

        const sessionControls = document.querySelector('.session-controls');

        if (guest) {
            document.body.classList.remove('logged-in');
            if (loginBtn && accountDropdown && loginBtn.parentElement === accountDropdown) {
                accountDropdown.parentElement.insertBefore(loginBtn, accountDropdown);
            }
            if (loginBtn) {
                var _ret = window.__rhodesIsReturningUser;
                loginBtn.textContent = _ret ? 'LOGIN' : 'SIGN UP';
                loginBtn.style.display = '';
                loginBtn.style.cssText = 'color:var(--cyan);font-size:15px;font-weight:700;text-decoration:none;';
                loginBtn.onclick = function(e) {
                    e.preventDefault();
                    showAuthTab(_ret ? 'login' : 'register');
                };
            }
            if (accountDropdown) accountDropdown.style.display = 'none';
            if (accountTrigger) accountTrigger.style.display = '';
            if (mobileLoginLink) {
                mobileLoginLink.textContent = window.__rhodesIsReturningUser ? 'LOGIN' : 'SIGN UP';
                mobileLoginLink.style.display = '';
            }
            if (mobileAccountMenu) mobileAccountMenu.style.display = 'none';
            if (sessionControls) sessionControls.style.display = 'none';
            if (mobileNewSession) mobileNewSession.style.display = 'none';
            if (mobileSessionsList) mobileSessionsList.style.display = 'none';
            // No projects management surfaced for guests.
            for (const a of document.querySelectorAll('a[href="/projects.html"]')) a.style.display = 'none';
            return;
        }

        document.body.classList.add('logged-in');
        if (loginBtn && accountDropdown && loginBtn.parentElement !== accountDropdown) {
            accountDropdown.insertBefore(loginBtn, accountDropdown.firstChild);
        }
        if (loginBtn) {
            loginBtn.textContent = String(currentUsername).toUpperCase();
            loginBtn.style.display = '';
            loginBtn.style.cssText = 'color:var(--cyan);font-size:15px;font-weight:700;text-decoration:none;cursor:pointer;';
            loginBtn.onclick = function(e) { e.preventDefault(); };
        }
        if (accountTrigger) accountTrigger.style.display = 'none';
        if (accountDropdown) accountDropdown.style.display = '';
        if (accountUsername) accountUsername.style.display = 'none';
        if (sessionControls) sessionControls.style.display = '';
        if (mobileNewSession) mobileNewSession.style.display = '';
        if (mobileSessionsList) mobileSessionsList.style.display = '';
        if (mobileLoginLink) mobileLoginLink.style.display = 'none';
        if (mobileAccountMenu) mobileAccountMenu.style.display = '';
        if (mobileAccountUsername) mobileAccountUsername.textContent = String(currentUsername).toUpperCase();
        checkAdminStatus();
        // Hide Projects link unless user has at least one project.
        updateProjectsNavVisibility();
    }

    async function updateProjectsNavVisibility() {
        const links = Array.from(document.querySelectorAll('a[href="/projects.html"]'));
        if (!links.length) return;
        // Hide by default; only show if confirmed there are projects.
        for (const a of links) a.style.display = 'none';
        const userToken = getUserToken();
        if (!userToken) {
            return;
        }
        try {
            const resp = await fetch('/api/user/projects', {
                headers: { 'Authorization': 'Bearer ' + userToken }
            });
            const data = await resp.json();
            const hasProjects = !!(data && Array.isArray(data.projects) && data.projects.length > 0);
            for (const a of links) a.style.display = hasProjects ? '' : 'none';
        } catch (e) {
            // Keep hidden on error.
        }
    }

    async function checkAdminStatus() {
        const adminLink = document.getElementById('admin-link');
        const mobileAdminLink = document.getElementById('mobile-admin-link');
        const userToken = getUserToken();
        console.log('[ADMIN-CHECK] Running checkAdminStatus, USER_TOKEN:', userToken ? userToken.substring(0, 10) + '...' : 'NONE');

        try {
            const resp = await fetch('/api/user/is_admin', {
                headers: { 'Authorization': 'Bearer ' + userToken }
            });
            const data = await resp.json();
            const show = data.is_admin ? '' : 'none';
            if (adminLink) adminLink.style.display = show;
            if (mobileAdminLink) mobileAdminLink.style.display = show;

            const voiceBar = document.getElementById('voice-bar');
            const handfreeTakeover = document.getElementById('handsfree-takeover');
            if (voiceBar) voiceBar.style.display = '';
            if (handfreeTakeover) handfreeTakeover.style.display = '';
        } catch (e) {
            if (adminLink) adminLink.style.display = 'none';
            if (mobileAdminLink) mobileAdminLink.style.display = 'none';
        }
    }

    function logout() {
        rhodesStorage.removeItem('rhodes_user_token');
        rhodesStorage.removeItem('rhodes_token');
        setUserToken('');
        setToken('');
        setIsGuest(true);
        setCurrentUsername(null);
        updateHeaderAuth();
        const voiceBar = document.getElementById('voice-bar');
        if (voiceBar) voiceBar.style.display = 'none';
        const ws = getWs();
        if (ws) ws.close();
        if (typeof addMsg === 'function') addMsg('ai', 'You have been logged out.');
        setTimeout(connect, 500);
    }

    window.showAuthTab = showAuthTab;
    window.updateHeaderAuth = updateHeaderAuth;
    window.checkAdminStatus = checkAdminStatus;
    window.logout = logout;

    try {
        const path = (window.location.pathname || '').replace(/\/+$/, '');
        const params = new URLSearchParams(window.location.search || '');
        const token = params.get('token') || '';
        const isReset = path === '/reset-password' || params.get('reset') === '1';
        if (isReset || token) {
            showAuthTab('reset');
            const tokenEl = document.getElementById('reset-token');
            if (tokenEl && token) tokenEl.value = token;
            if (token) {
                window.history.replaceState({}, document.title, '/?reset=1');
            }
        }
    } catch (e) {}
};
