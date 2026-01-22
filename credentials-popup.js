// Credentials popup - model triggers, user submits, model never sees value

window.RhodesCredentials = {
    show: function(options) {
        // options: { label, service, hint, callback_id }
        const modal = document.createElement('div');
        modal.id = 'credentials-modal';
        modal.innerHTML = 
            '<div class="cred-overlay">' +
            '<div class="cred-popup">' +
            '<h3>🔐 Credential Required</h3>' +
            '<p class="cred-hint">' + (options.hint || 'Rhodes needs a credential to proceed.') + '</p>' +
            '<div class="cred-field">' +
            '<label>Service: <strong>' + (options.service || 'Unknown') + '</strong></label>' +
            '</div>' +
            '<div class="cred-field">' +
            '<label>' + (options.label || 'Token/Key') + '</label>' +
            '<input type="password" id="cred-value" placeholder="Paste your token here..." autocomplete="off">' +
            '<button type="button" onclick="this.previousElementSibling.type = this.previousElementSibling.type === 'password' ? 'text' : 'password'">👁</button>' +
            '</div>' +
            '<div class="cred-field">' +
            '<label>Notes (optional)</label>' +
            '<input type="text" id="cred-notes" placeholder="e.g., expires 2026-12">' +
            '</div>' +
            '<p class="cred-privacy">🔒 This value is encrypted and <strong>never shown to the model</strong>. Only you and admin can access it.</p>' +
            '<div class="cred-buttons">' +
            '<button class="cred-cancel" onclick="RhodesCredentials.cancel()">Cancel</button>' +
            '<button class="cred-submit" onclick="RhodesCredentials.submit()">Submit Securely</button>' +
            '</div>' +
            '</div>' +
            '</div>';
        document.body.appendChild(modal);
        document.getElementById('cred-value').focus();
        
        this._options = options;
    },
    
    submit: async function() {
        const value = document.getElementById('cred-value').value.trim();
        const notes = document.getElementById('cred-notes').value.trim();
        
        if (!value) {
            alert('Please enter a value');
            return;
        }
        
        try {
            const resp = await fetch('/api/credentials/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('rhodes_token') ? 'Bearer ' + localStorage.getItem('rhodes_token') : ''
                },
                body: JSON.stringify({
                    label: this._options.label || 'Token',
                    service: this._options.service || 'unknown',
                    value: value,
                    notes: notes
                })
            });
            
            const result = await resp.json();
            
            if (result.success) {
                // Notify model that credential was submitted (but not the value!)
                if (this._options.callback_id && window.sendMessage) {
                    window.sendMessage('[CREDENTIAL_SUBMITTED] ' + this._options.service + ' credential stored as ID ' + result.id);
                }
                this.close();
            } else {
                alert('Error: ' + (result.error || 'Unknown error'));
            }
        } catch (e) {
            alert('Failed to submit: ' + e.message);
        }
    },
    
    cancel: function() {
        if (this._options.callback_id && window.sendMessage) {
            window.sendMessage('[CREDENTIAL_CANCELLED] User cancelled credential submission');
        }
        this.close();
    },
    
    close: function() {
        const modal = document.getElementById('credentials-modal');
        if (modal) modal.remove();
        this._options = null;
    }
};

// CSS for the popup
const credStyle = document.createElement('style');
credStyle.textContent = ;
document.head.appendChild(credStyle);
