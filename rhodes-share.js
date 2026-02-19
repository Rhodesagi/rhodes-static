// Extracted from rhodes.js: share modal + Q/A sharing subsystem

window.installRhodesShareUi = function installRhodesShareUi(deps) {
    if (!deps || window.__rhodesShareUiInstalled) return;
    window.__rhodesShareUiInstalled = true;

    const showToast = deps.showToast || function() {};
    const isV2Path = () => (window.location.pathname === '/v2' || window.location.pathname.startsWith('/v2/'));
    const apiBase = () => (isV2Path() ? '/v2/api' : '/api');
    const shareBase = () => (isV2Path() ? '/v2' : '');

    function toBase64Unicode(s) {
        try {
            return btoa(unescape(encodeURIComponent(String(s || ''))));
        } catch (_) {
            return btoa(String(s || ''));
        }
    }

    async function copyOrPrompt(url, copiedMsg) {
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(url);
                showToast(copiedMsg || 'Share link copied!');
                return;
            }
        } catch (_) {}

        // Clipboard often fails on Safari/iOS unless it's synchronous in a user gesture.
        // Prompt fallback is ugly but reliable.
        showToast('Share link created (copy manually)');
        try { prompt('Share link:', url); } catch (_) {}
    }

    window.showShareOptions = function(qaId) {
        const msgEl = document.querySelector('[data-qa-id="' + qaId + '"]');
        if (!msgEl) return;

        let modal = document.getElementById('share-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'share-modal';
            modal.innerHTML = `
                <div class="share-modal-content" style="max-width:400px;">
                    <h3 style="margin-top:0;color:var(--cyan);">Share Options</h3>

                    <div style="margin:15px 0;padding:10px;background:rgba(0,255,255,0.1);border-radius:4px;">
                        <label style="font-size:12px;color:var(--dim);display:block;margin-bottom:4px;">Names/usernames/emails to redact (comma-separated):</label>
                        <input type="text" id="share-redact-custom" placeholder="e.g. John, john@email.com, johndoe123"
                            style="width:100%;padding:8px;background:var(--bg);border:1px solid var(--dim);border-radius:4px;color:var(--fg);">
                        <div style="font-size:10px;color:var(--dim);margin-top:4px;">Leave empty for no redaction</div>
                    </div>

                    <div style="margin:15px 0;">
                        <label style="font-size:12px;color:var(--dim);display:block;margin-bottom:4px;">Share scope:</label>
                        <select id="share-scope" style="width:100%;padding:8px;background:var(--bg);border:1px solid var(--dim);border-radius:4px;color:var(--fg);">
                            <option value="full">Full conversation</option>
                            <option value="until">Conversation until this message</option>
                            <option value="single">This message only</option>
                        </select>
                    </div>

                    <button id="share-execute" class="share-option-btn" style="background:var(--green);">Create Share Link</button>
                    <button id="share-cancel" class="share-option-btn" style="background:var(--dim);">Cancel</button>

                    <div id="share-preview" style="margin-top:10px;padding:8px;background:rgba(255,255,255,0.05);border-radius:4px;font-size:11px;display:none;">
                        <strong style="color:var(--cyan);">Share will include:</strong>
                        <div id="share-preview-text" style="margin-top:4px;color:var(--dim);"></div>
                    </div>
                </div>
            `;
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
            const contentEl = modal.querySelector('.share-modal-content');
            contentEl.style.cssText = 'background:var(--bg);padding:20px;border-radius:8px;border:1px solid var(--cyan);max-width:400px;width:90%;';
            const btns = modal.querySelectorAll('.share-option-btn');
            btns.forEach(btn => {
                btn.style.cssText = 'display:block;width:100%;padding:12px;margin:8px 0;background:var(--cyan);color:var(--bg);border:none;border-radius:4px;cursor:pointer;font-size:14px;font-weight:bold;';
            });
            document.body.appendChild(modal);

            const updatePreview = () => {
                const scope = document.getElementById('share-scope').value;
                const redactCustom = document.getElementById('share-redact-custom').value;
                const preview = document.getElementById('share-preview');
                const previewText = document.getElementById('share-preview-text');

                let parts = [];
                if (scope === 'full') parts.push('Full conversation');
                else if (scope === 'until') parts.push('Conversation until selected message');
                else parts.push('Single Q&A pair');

                if (redactCustom.trim()) {
                    const count = redactCustom.split(',').filter(n => n.trim()).length;
                    parts.push(count + ' item(s) to redact');
                }

                previewText.textContent = parts.join(' • ');
                preview.style.display = 'block';
            };

            document.getElementById('share-scope').onchange = updatePreview;
            document.getElementById('share-redact-custom').oninput = updatePreview;
        }

        document.getElementById('share-redact-custom').value = '';
        document.getElementById('share-scope').value = 'full';
        document.getElementById('share-preview').style.display = 'none';

        modal.style.display = 'flex';
        modal.dataset.qaId = qaId;

        document.getElementById('share-execute').onclick = () => {
            const scope = document.getElementById('share-scope').value;
            const redactCustom = document.getElementById('share-redact-custom').value;

            const options = {
                redact_names: redactCustom ? redactCustom.split(',').map(n => n.trim()).filter(n => n) : []
            };

            modal.style.display = 'none';

            if (scope === 'single') {
                window.shareQA(qaId, options);
            } else if (scope === 'until') {
                window.shareConversationUntil(qaId, options);
            } else {
                window.shareFullConversation(options);
            }
        };

        document.getElementById('share-cancel').onclick = () => {
            modal.style.display = 'none';
        };
        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };
    };

    window.shareFullConversation = async function(options = {}) {
        const chat = document.getElementById('chat');
        if (!chat) return;

        const messages = [];
        chat.querySelectorAll('[data-qa-id]').forEach(el => {
            const q = el.dataset.question;
            const a = el.dataset.answer;
            if (q && a) {
                messages.push({ role: 'user', content: q });
                messages.push({ role: 'assistant', content: a });
            }
        });

        if (messages.length === 0) {
            showToast('No messages to share');
            return;
        }

        let data = null;
        try {
            const response = await fetch(apiBase() + '/share-qa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages,
                    redact_names: options.redact_names || [],
                    redact_all_usernames: options.redact_all_usernames || false
                })
            });

            if (response.ok) {
                data = await response.json();
            } else {
                const errText = await response.text().catch(() => '');
                throw new Error('Server error: HTTP ' + response.status + (errText ? (' ' + errText) : ''));
            }
        } catch (e) {
            console.error('Share conversation error:', e);
            showToast('Failed to share conversation');
            return;
        }

        const shareUrl = window.location.origin + shareBase() + '/qa/' + data.id;
        await copyOrPrompt(shareUrl, 'Share link copied! (' + (data.share_type || 'Full') + ')');
    };

    window.shareConversationUntil = async function(qaId, options = {}) {
        const chat = document.getElementById('chat');
        if (!chat) return;

        const messages = [];
        let found = false;

        chat.querySelectorAll('[data-qa-id]').forEach(el => {
            if (found) return;
            const q = el.dataset.question;
            const a = el.dataset.answer;
            if (q && a) {
                messages.push({ role: 'user', content: q });
                messages.push({ role: 'assistant', content: a });
            }
            if (el.dataset.qaId === qaId) found = true;
        });

        if (messages.length === 0) {
            showToast('No messages to share');
            return;
        }

        let data = null;
        try {
            const response = await fetch(apiBase() + '/share-qa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages,
                    redact_names: options.redact_names || [],
                    redact_all_usernames: options.redact_all_usernames || false,
                    share_note: 'Partial conversation (until selected point)'
                })
            });

            if (response.ok) {
                data = await response.json();
            } else {
                const errText = await response.text().catch(() => '');
                throw new Error('Server error: HTTP ' + response.status + (errText ? (' ' + errText) : ''));
            }
        } catch (e) {
            console.error('Share conversation error:', e);
            showToast('Failed to share conversation');
            return;
        }

        const shareUrl = window.location.origin + shareBase() + '/qa/' + data.id;
        await copyOrPrompt(shareUrl, 'Share link copied! (' + (data.share_type || 'Partial') + ')');
    };

    window.shareQA = async function(qaId, options = {}) {
        const msgEl = document.querySelector('[data-qa-id="' + qaId + '"]');
        if (!msgEl) return;

        const question = msgEl.dataset.question;
        const answer = msgEl.dataset.answer;

        try {
            const response = await fetch(apiBase() + '/share-qa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: question,
                    answer: answer,
                    redact_names: options.redact_names || [],
                    redact_all_usernames: options.redact_all_usernames || false
                })
            });

            if (response.ok) {
                const data = await response.json();
                const shareUrl = window.location.origin + shareBase() + '/qa/' + data.id;
                await copyOrPrompt(shareUrl, 'Share link copied! (' + (data.share_type || 'Single Q&A') + ')');
            } else {
                const encoded = toBase64Unicode(JSON.stringify({ q: question, a: answer }));
                const shareUrl = window.location.origin + shareBase() + '/?qa=' + encoded;
                await copyOrPrompt(shareUrl, 'Share link copied (local - no redaction)');
            }
        } catch (e) {
            const encoded = toBase64Unicode(JSON.stringify({ q: question, a: answer }));
            const shareUrl = window.location.origin + shareBase() + '/?qa=' + encodeURIComponent(encoded);
            await copyOrPrompt(shareUrl, 'Share link copied!');
        }
    };
};
