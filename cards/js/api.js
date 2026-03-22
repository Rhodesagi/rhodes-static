/* RhodesCards — API client */

RC.API_BASE = '/api/cards';
RC.token = null;

RC.getToken = function() {
    if (RC.token) return RC.token;
    RC.token = (window.rhodesStorage && window.rhodesStorage.getItem('rhodes_user_token'))
        || sessionStorage.getItem('rhodes_user_token')
        || localStorage.getItem('rhodes_user_token')
        || localStorage.getItem('rhodes_token')
        || localStorage.getItem('auth_token');
    if (!RC.token) {
        var p = new URLSearchParams(location.search);
        RC.token = p.get('token');
        if (RC.token) localStorage.setItem('rhodes_token', RC.token);
    }
    return RC.token;
};

RC.api = async function(method, path, body) {
    var t = RC.getToken();
    if (!t) { location.href = '/?redirect=/cards/'; throw new Error('Not authenticated'); }
    var opts = {
        method: method,
        headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    var res = await fetch(RC.API_BASE + path, opts);
    if (res.status === 401) { location.href = '/?redirect=/cards/'; throw new Error('Not authenticated'); }
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API error');
    return data;
};

RC.apiUpload = async function(path, formData) {
    var t = RC.getToken();
    if (!t) { location.href = '/?redirect=/cards/'; throw new Error('Not authenticated'); }
    var res = await fetch(RC.API_BASE + path, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + t },
        body: formData,
    });
    if (res.status === 401) { location.href = '/?redirect=/cards/'; throw new Error('Not authenticated'); }
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API error');
    return data;
};
