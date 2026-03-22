/* RhodesCards — Shared utilities */

var RC = window.RC || {};

RC.STATE_NAMES = ['New', 'Learning', 'Review', 'Relearning'];

RC._debounceTimers = {};

RC.esc = function(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
};

RC.toast = function(msg, type) {
    type = type || 'success';
    var el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 3000);
};

RC.debounce = function(fn, ms) {
    var key = fn.name || 'default';
    return function() {
        var args = arguments;
        var self = this;
        clearTimeout(RC._debounceTimers[key]);
        RC._debounceTimers[key] = setTimeout(function() { fn.apply(self, args); }, ms);
    };
};

RC.formatDue = function(dueStr) {
    if (!dueStr) return '-';
    var due = new Date(dueStr);
    var now = new Date();
    var diff = (due - now) / 86400000;
    if (diff < 0) return '<span style="color:var(--red)">Overdue</span>';
    if (diff < 1) return '<span style="color:var(--orange)">Today</span>';
    if (diff < 2) return 'Tomorrow';
    if (diff < 30) return Math.round(diff) + 'd';
    if (diff < 365) return Math.round(diff / 30) + 'mo';
    return Math.round(diff / 365) + 'y';
};

window.RC = RC;
