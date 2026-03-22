/* RhodesCards — Card Info popup during review */

RC.showCardInfo = async function() {
    var card = RC.reviewQueue[RC.reviewIndex];
    if (!card) return;

    var modal = document.getElementById('cardInfoModal');
    if (!modal) return;
    var body = document.getElementById('cardInfoBody');
    body.innerHTML = '<div style="text-align:center;padding:20px;color:var(--dim)">Loading...</div>';
    modal.style.display = 'flex';

    try {
        var info = await RC.api('GET', '/cards/' + card.card_id + '/info');
        RC._renderCardInfo(info, body);
    } catch (e) {
        body.innerHTML = '<div style="color:var(--red);padding:20px">Failed to load: ' + RC.esc(e.message) + '</div>';
    }
};

RC._renderCardInfo = function(info, body) {
    var STATE = ['New', 'Learning', 'Review', 'Relearning'];
    var RATING = ['', 'Again', 'Hard', 'Good', 'Easy'];
    var RATING_COLOR = ['', 'var(--red)', 'var(--orange)', 'var(--green)', 'var(--blue, #4488ff)'];

    var created = info.created_at ? new Date(info.created_at).toLocaleDateString() : '-';
    var lastReview = info.last_review ? new Date(info.last_review).toLocaleDateString() : 'Never';
    var due = info.due ? new Date(info.due).toLocaleDateString() : '-';

    var html = '<table class="ci-table">';
    html += RC._ciRow('State', STATE[info.state] || info.state);
    html += RC._ciRow('Interval', info.interval_days ? info.interval_days.toFixed(1) + ' days' : '-');
    html += RC._ciRow('Stability', info.stability != null ? info.stability.toFixed(2) : '-');
    html += RC._ciRow('Difficulty', info.difficulty != null ? info.difficulty.toFixed(2) : '-');
    html += RC._ciRow('Reviews', info.reps || 0);
    html += RC._ciRow('Lapses', info.lapses || 0);
    html += RC._ciRow('Due', due);
    html += RC._ciRow('Last Review', lastReview);
    html += RC._ciRow('Created', created);
    html += RC._ciRow('Card Type', info.card_type || 'basic');
    if (info.tags && info.tags.length) {
        html += RC._ciRow('Tags', info.tags.map(function(t) { return '<span class="ci-tag">' + RC.esc(t) + '</span>'; }).join(' '));
    }
    if (info.suspended) html += RC._ciRow('Status', '<span style="color:var(--yellow)">Suspended</span>');
    if (info.flag > 0) html += RC._ciRow('Flag', info.flag);
    html += '</table>';

    // Review history
    if (info.history && info.history.length) {
        html += '<h4 style="margin:16px 0 8px;color:var(--fg)">Review History</h4>';
        html += '<div class="ci-history">';
        html += '<table class="ci-hist-table">';
        html += '<thead><tr><th>Date</th><th>Rating</th><th>Time</th><th>Interval</th><th>State</th></tr></thead><tbody>';
        for (var i = 0; i < info.history.length; i++) {
            var h = info.history[i];
            var date = h.reviewed_at ? new Date(h.reviewed_at).toLocaleDateString() : '-';
            var time = h.response_ms ? (h.response_ms / 1000).toFixed(1) + 's' : '-';
            var ivl = h.interval_after ? h.interval_after.toFixed(1) + 'd' : '-';
            var rating = RATING[h.rating] || h.rating;
            var rColor = RATING_COLOR[h.rating] || 'var(--fg)';
            html += '<tr>'
                + '<td>' + date + '</td>'
                + '<td style="color:' + rColor + ';font-weight:600">' + rating + '</td>'
                + '<td>' + time + '</td>'
                + '<td>' + ivl + '</td>'
                + '<td>' + (STATE[h.state_after] || h.state_after) + '</td>'
                + '</tr>';
        }
        html += '</tbody></table></div>';
    } else {
        html += '<p style="color:var(--dim);margin-top:16px">No review history yet.</p>';
    }

    body.innerHTML = html;
};

RC._ciRow = function(label, value) {
    return '<tr><td class="ci-label">' + label + '</td><td class="ci-value">' + value + '</td></tr>';
};

RC.closeCardInfo = function() {
    var modal = document.getElementById('cardInfoModal');
    if (modal) modal.style.display = 'none';
};
