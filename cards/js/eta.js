/* RhodesCards — ETA / Remaining Time estimate during review */

RC._etaTimes = [];

RC.updateETA = function() {
    var remaining = RC.reviewQueue.length - RC.reviewIndex;
    var el = document.getElementById('reviewETA');
    if (!el) return;
    if (remaining <= 0) { el.textContent = ''; return; }

    // Use session average if we have data, else default 8s/card
    var avg = 8;
    if (RC._etaTimes.length > 0) {
        var sum = 0;
        for (var i = 0; i < RC._etaTimes.length; i++) sum += RC._etaTimes[i];
        avg = sum / RC._etaTimes.length;
    }

    var totalSec = Math.round(avg * remaining);
    var text;
    if (totalSec < 60) {
        text = '~' + totalSec + 's left';
    } else {
        var mins = Math.round(totalSec / 60);
        text = '~' + mins + ' min left';
    }
    el.textContent = text;
};

RC.recordCardTime = function(ms) {
    var sec = ms / 1000;
    // Cap at 60s to avoid outliers skewing average
    if (sec > 60) sec = 60;
    RC._etaTimes.push(sec);
    // Keep rolling window of last 20 cards
    if (RC._etaTimes.length > 20) RC._etaTimes.shift();
};

RC.resetETA = function() {
    RC._etaTimes = [];
};
