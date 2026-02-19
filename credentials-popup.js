// Credentials popup - model triggers, user submits, model never sees value

window.RhodesCredentials = {
    show: function(options) {
        // options: { service, fields (array or single label), hint, callback_id }
        // fields can be: "email,password" or ["email", "password"] or just "token"
        let fields = options.fields || options.label || 'token';
        if (typeof fields === 'string') {
            fields = fields.split(',').map(f => f.trim());
        }

        const modal = document.createElement('div');
        modal.id = 'credentials-modal';

        let fieldsHtml = '';
        for (const field of fields) {
            const isSecret = field.toLowerCase().includes('password') ||
                           field.toLowerCase().includes('token') ||
                           field.toLowerCase().includes('key') ||
                           field.toLowerCase().includes('secret');
            const inputType = isSecret ? 'password' : 'text';
            const placeholder = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');

            fieldsHtml += `
                <div class="cred-field">
                    <label>${placeholder}</label>
                    <div style="display: flex; gap: 4px;">
                        <input type="${inputType}" id="cred-${field}" class="cred-input" data-field="${field}" placeholder="Enter ${placeholder.toLowerCase()}..." autocomplete="off" style="flex: 1;">
                        ${isSecret ? '<button type="button" class="cred-toggle" onclick="this.previousElementSibling.type = this.previousElementSibling.type === \'password\' ? \'text\' : \'password\'">👁</button>' : ''}
                    </div>
                </div>
            `;
        }

        modal.innerHTML =
            '<div class="cred-overlay">' +
            '<div class="cred-popup">' +
            '<h3>🔐 Credentials Required</h3>' +
            '<p class="cred-hint">' + (options.hint || 'Rhodes needs credentials to proceed.') + '</p>' +
            '<div class="cred-service">' +
            '<label>Service: <strong>' + (options.service || 'Unknown') + '</strong></label>' +
            '</div>' +
            fieldsHtml +
            '<p class="cred-privacy">🔒 These values are encrypted and <strong>never shown to the model</strong>. Only you can access them.</p>' +
            '<div class="cred-buttons">' +
            '<button class="cred-cancel" onclick="RhodesCredentials.cancel()">Cancel</button>' +
            '<button class="cred-submit" onclick="RhodesCredentials.submit()">Save Securely</button>' +
            '</div>' +
            '</div>' +
            '</div>';
        document.body.appendChild(modal);

        // Focus first input
        const firstInput = modal.querySelector('.cred-input');
        if (firstInput) firstInput.focus();

        // Enter key submits
        modal.querySelectorAll('.cred-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.submit();
            });
        });

        this._options = options;
        this._fields = fields;
    },

    submit: async function() {
        const inputs = document.querySelectorAll('#credentials-modal .cred-input');
        const values = {};
        let hasValue = false;

        for (const input of inputs) {
            const field = input.dataset.field;
            const value = input.value.trim();
            if (value) {
                values[field] = value;
                hasValue = true;
            }
        }

        if (!hasValue) {
            alert('Please enter at least one value');
            return;
        }

        try {
            // Store each field separately
            for (const [field, value] of Object.entries(values)) {
                const resp = await fetch('/api/credentials/store', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('rhodes_token') ? 'Bearer ' + localStorage.getItem('rhodes_token') : ''
                    },
                    body: JSON.stringify({
                        service: this._options.service || 'unknown',
                        field: field,
                        value: value
                    })
                });

                const result = await resp.json();
                if (!result.success) {
                    alert('Error saving ' + field + ': ' + (result.error || 'Unknown error'));
                    return;
                }
            }

            // Notify model that credentials were submitted (but not the values!)
            const fieldNames = Object.keys(values).join(', ');
            const notifyMsg = '[CREDENTIAL_SUBMITTED] ' + this._options.service + ' credentials stored: ' + fieldNames + '. Please proceed with the task.';

            const input = document.getElementById('input') || document.querySelector('textarea[id*="input"]');
            const sendBtn = document.getElementById('send-btn') || document.querySelector('button[id*="send"]');

            if (input && sendBtn) {
                input.value = notifyMsg;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                setTimeout(() => {
                    sendBtn.click();
                }, 100);
            } else {
                if (window.ws && window.ws.readyState === WebSocket.OPEN) {
                    window.ws.send(JSON.stringify({
                        msg_type: 'user_message',
                        msg_id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        payload: { content: notifyMsg }
                    }));
                }
            }

            this.close();
        } catch (e) {
            alert('Failed to submit: ' + e.message);
        }
    },

    manage: async function() {
        // Management UI: list stored services/fields, allow deletion
        const modal = document.createElement('div');
        modal.id = 'credentials-modal';

        const token = localStorage.getItem('rhodes_token');
        if (!token) {
            modal.innerHTML =
                '<div class="cred-overlay">' +
                '<div class="cred-popup">' +
                '<h3>🔐 Stored Credentials</h3>' +
                '<p class="cred-hint">You must be logged in to manage credentials.</p>' +
                '<div class="cred-buttons">' +
                '<button class="cred-cancel" onclick="RhodesCredentials.close()">Close</button>' +
                '</div>' +
                '</div>' +
                '</div>';
            document.body.appendChild(modal);
            return;
        }

        // Show loading state
        modal.innerHTML =
            '<div class="cred-overlay">' +
            '<div class="cred-popup">' +
            '<h3>🔐 Stored Credentials</h3>' +
            '<p class="cred-hint">Loading...</p>' +
            '</div>' +
            '</div>';
        document.body.appendChild(modal);

        try {
            const resp = await fetch('/api/credentials/status', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await resp.json();

            if (data.error) {
                modal.querySelector('.cred-hint').textContent = 'Error: ' + data.error;
                return;
            }

            const services = data.services || {};
            const serviceNames = Object.keys(services);

            let listHtml = '';
            if (serviceNames.length === 0) {
                listHtml = '<p class="cred-hint">No credentials stored yet.</p>' +
                    '<p class="cred-hint" style="font-size: 12px;">Credentials are requested automatically when Rhodes needs them for a task, ' +
                    'or you can add them manually below.</p>';
            } else {
                for (const svc of serviceNames) {
                    const fields = services[svc];
                    let fieldItems = '';
                    for (const f of fields) {
                        fieldItems +=
                            '<div class="cred-manage-field">' +
                            '<span class="cred-field-name">' + f + '</span>' +
                            '<button class="cred-delete-btn" onclick="RhodesCredentials.deleteField(\'' +
                                svc.replace(/'/g, "\\'") + '\', \'' + f.replace(/'/g, "\\'") + '\', this)">Delete</button>' +
                            '</div>';
                    }
                    listHtml +=
                        '<div class="cred-manage-service">' +
                        '<div class="cred-manage-service-header">' +
                        '<strong>' + svc + '</strong>' +
                        '<button class="cred-delete-btn cred-delete-svc" onclick="RhodesCredentials.deleteService(\'' +
                            svc.replace(/'/g, "\\'") + '\', this)">Delete All</button>' +
                        '</div>' +
                        '<div class="cred-manage-fields">' + fieldItems + '</div>' +
                        '</div>';
                }
            }

            // Add credential form
            const addHtml =
                '<div class="cred-manage-add">' +
                '<h4>Add Credential</h4>' +
                '<div class="cred-field"><label>Service</label>' +
                '<input type="text" id="cred-add-service" class="cred-input" placeholder="e.g. twitter, substack..."></div>' +
                '<div class="cred-field"><label>Field</label>' +
                '<input type="text" id="cred-add-field" class="cred-input" placeholder="e.g. email, password, api_key..."></div>' +
                '<div class="cred-field"><label>Value</label>' +
                '<input type="password" id="cred-add-value" class="cred-input" placeholder="Enter value..."></div>' +
                '<button class="cred-submit" style="width: 100%; margin-top: 8px;" onclick="RhodesCredentials.addManual()">Add</button>' +
                '</div>';

            modal.querySelector('.cred-popup').innerHTML =
                '<h3>🔐 Stored Credentials</h3>' +
                '<div class="cred-manage-list">' + listHtml + '</div>' +
                addHtml +
                '<div class="cred-buttons" style="margin-top: 16px;">' +
                '<button class="cred-cancel" onclick="RhodesCredentials.close()">Close</button>' +
                '</div>';

        } catch (e) {
            modal.querySelector('.cred-hint').textContent = 'Failed to load: ' + e.message;
        }
    },

    addManual: async function() {
        const service = (document.getElementById('cred-add-service').value || '').trim().toLowerCase().replace(/\s+/g, '_');
        const field = (document.getElementById('cred-add-field').value || '').trim().toLowerCase().replace(/\s+/g, '_');
        const value = (document.getElementById('cred-add-value').value || '').trim();

        if (!service || !field || !value) {
            alert('All three fields are required');
            return;
        }

        const token = localStorage.getItem('rhodes_token');
        try {
            const resp = await fetch('/api/credentials/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ service, field, value })
            });
            const result = await resp.json();
            if (result.success) {
                this.close();
                this.manage(); // Refresh
            } else {
                alert('Error: ' + (result.error || 'Unknown'));
            }
        } catch (e) {
            alert('Failed: ' + e.message);
        }
    },

    deleteField: async function(service, field, btn) {
        if (!confirm('Delete ' + service + '/' + field + '?')) return;
        const token = localStorage.getItem('rhodes_token');
        try {
            const resp = await fetch('/api/credentials/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ service, field })
            });
            const result = await resp.json();
            if (result.success) {
                // Remove the field row from DOM
                const row = btn.closest('.cred-manage-field');
                if (row) row.remove();
                // If no more fields in this service, remove the service block
                const svcBlock = btn.closest('.cred-manage-service');
                if (svcBlock && svcBlock.querySelectorAll('.cred-manage-field').length === 0) {
                    svcBlock.remove();
                }
            } else {
                alert('Error: ' + (result.error || 'Unknown'));
            }
        } catch (e) {
            alert('Failed: ' + e.message);
        }
    },

    deleteService: async function(service, btn) {
        if (!confirm('Delete ALL credentials for ' + service + '?')) return;
        const token = localStorage.getItem('rhodes_token');
        try {
            const resp = await fetch('/api/credentials/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ service })
            });
            const result = await resp.json();
            if (result.success) {
                const svcBlock = btn.closest('.cred-manage-service');
                if (svcBlock) svcBlock.remove();
            } else {
                alert('Error: ' + (result.error || 'Unknown'));
            }
        } catch (e) {
            alert('Failed: ' + e.message);
        }
    },

    cancel: function() {
        console.log('[CREDENTIAL_CANCELLED] User cancelled credential submission for ' + (this._options?.service || 'unknown'));
        this.close();
    },

    close: function() {
        const modal = document.getElementById('credentials-modal');
        if (modal) modal.remove();
        this._options = null;
        this._fields = null;
    }
};

// CSS for the popup
const credStyle = document.createElement('style');
credStyle.textContent = `
.cred-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}
.cred-popup {
    background: #1a1a1a;
    border: 1px solid #0f0;
    border-radius: 8px;
    padding: 24px;
    max-width: 420px;
    width: 90%;
    font-family: monospace;
    max-height: 85vh;
    overflow-y: auto;
}
.cred-popup h3 {
    margin: 0 0 16px 0;
    color: #0f0;
}
.cred-popup h4 {
    margin: 16px 0 8px 0;
    color: #0f0;
    font-size: 13px;
    border-top: 1px solid #333;
    padding-top: 12px;
}
.cred-hint {
    color: #888;
    font-size: 14px;
    margin-bottom: 16px;
}
.cred-service {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #333;
}
.cred-service label {
    color: #888;
    font-size: 12px;
}
.cred-service strong {
    color: #0f0;
}
.cred-field {
    margin-bottom: 14px;
}
.cred-field label {
    display: block;
    color: #0f0;
    margin-bottom: 6px;
    font-size: 13px;
}
.cred-field input {
    width: 100%;
    padding: 10px;
    background: #000;
    border: 1px solid #333;
    color: #fff;
    font-family: monospace;
    box-sizing: border-box;
    border-radius: 4px;
}
.cred-field input:focus {
    border-color: #0f0;
    outline: none;
}
.cred-toggle {
    padding: 10px 12px;
    background: #333;
    border: 1px solid #333;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}
.cred-toggle:hover {
    background: #444;
}
.cred-privacy {
    font-size: 11px;
    color: #666;
    margin: 16px 0;
    padding: 10px;
    background: #111;
    border-radius: 4px;
}
.cred-buttons {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 20px;
}
.cred-buttons button {
    padding: 10px 20px;
    font-family: monospace;
    cursor: pointer;
    border-radius: 4px;
    font-size: 13px;
}
.cred-cancel {
    background: transparent;
    color: #888;
    border: 1px solid #555;
}
.cred-cancel:hover {
    border-color: #888;
}
.cred-submit {
    background: #0f0;
    color: #000;
    border: 1px solid #0f0;
    font-weight: bold;
}
.cred-submit:hover {
    background: #0c0;
}
/* Management UI styles */
.cred-manage-list {
    margin-bottom: 8px;
}
.cred-manage-service {
    margin-bottom: 12px;
    border: 1px solid #333;
    border-radius: 4px;
    overflow: hidden;
}
.cred-manage-service-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #111;
}
.cred-manage-service-header strong {
    color: #0f0;
    font-size: 14px;
}
.cred-manage-fields {
    padding: 0 12px;
}
.cred-manage-field {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-top: 1px solid #222;
}
.cred-field-name {
    color: #aaa;
    font-size: 13px;
}
.cred-delete-btn {
    background: transparent;
    color: #f44;
    border: 1px solid #f44;
    padding: 3px 10px;
    font-family: monospace;
    font-size: 11px;
    cursor: pointer;
    border-radius: 3px;
}
.cred-delete-btn:hover {
    background: #f44;
    color: #000;
}
.cred-delete-svc {
    font-size: 10px;
    padding: 2px 8px;
}
.cred-manage-add {
    margin-top: 8px;
}
`;
document.head.appendChild(credStyle);
