/* RhodesCards — Exam Countdown (stores date in deck settings JSONB) */

RC.showExamCountdown = function(deckId) {
    if (!RC.currentDeck) return;
    var s = RC.currentDeck.settings || {};
    var existing = s.exam_date || '';
    document.getElementById('examDateInput').value = existing;
    document.getElementById('examLabel').value = s.exam_label || 'Exam';
    document.getElementById('examCountdownModal').style.display = 'flex';
};

RC.saveExamDate = async function() {
    var dateVal = document.getElementById('examDateInput').value;
    var label = document.getElementById('examLabel').value.trim() || 'Exam';
    var settings = Object.assign({}, RC.currentDeck.settings || {});
    if (dateVal) {
        settings.exam_date = dateVal;
        settings.exam_label = label;
    } else {
        delete settings.exam_date;
        delete settings.exam_label;
    }
    try {
        await RC.api('PUT', '/decks/' + RC.currentDeckId, { settings: settings });
        RC.currentDeck.settings = settings;
        document.getElementById('examCountdownModal').style.display = 'none';
        RC.toast(dateVal ? 'Exam date saved' : 'Exam date cleared');
        RC.renderCountdownWidget();
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC.clearExamDate = async function() {
    document.getElementById('examDateInput').value = '';
    await RC.saveExamDate();
};

RC.renderCountdownWidget = function() {
    var container = document.getElementById('examCountdownWidget');
    if (!container) return;
    if (!RC.currentDeck || !RC.currentDeck.settings || !RC.currentDeck.settings.exam_date) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }
    var s = RC.currentDeck.settings;
    var examDate = new Date(s.exam_date + 'T00:00:00');
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var diffMs = examDate - now;
    var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    var label = s.exam_label || 'Exam';

    var urgencyClass = '';
    if (diffDays <= 0) urgencyClass = 'countdown-past';
    else if (diffDays <= 3) urgencyClass = 'countdown-urgent';
    else if (diffDays <= 7) urgencyClass = 'countdown-soon';

    var text = '';
    if (diffDays < 0) text = label + ' was ' + Math.abs(diffDays) + ' day' + (Math.abs(diffDays) !== 1 ? 's' : '') + ' ago';
    else if (diffDays === 0) text = label + ' is TODAY';
    else text = diffDays + ' day' + (diffDays !== 1 ? 's' : '') + ' until ' + label;

    var dateStr = examDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    container.style.display = 'flex';
    container.className = 'exam-countdown-widget ' + urgencyClass;
    container.innerHTML = '<div class="countdown-main">'
        + '<span class="countdown-icon">&#128197;</span>'
        + '<span class="countdown-text">' + RC.esc(text) + '</span>'
        + '</div>'
        + '<span class="countdown-date">' + RC.esc(dateStr) + '</span>';
    container.onclick = function() { RC.showExamCountdown(RC.currentDeckId); };
};
