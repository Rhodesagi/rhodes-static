/* RhodesCards — App init, routing, keyboard dispatch, settings */

RC.showView = function(name) {
    document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
    var el = document.getElementById('view-' + name);
    if (el) el.classList.add('active');
    if (name === 'decks') RC.loadDecks();
    if (name === 'stats') RC.loadStats();
    if (name === 'import') RC.loadImportLanguages();
    if (name === 'palaces') RC.Palace.showPalaceList();
};

// ── Keyboard shortcuts (customizable) ──

RC.DEFAULT_SHORTCUTS = {
    reveal: ['Space', 'Enter'],
    again: ['Digit1', 'Numpad1'],
    hard: ['Digit2', 'Numpad2'],
    good: ['Digit3', 'Numpad3'],
    easy: ['Digit4', 'Numpad4'],
    undo: ['KeyZ'],
    exitReview: ['Escape'],
};

RC.getShortcuts = function() {
    try {
        var saved = localStorage.getItem('rc_shortcuts');
        if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return RC.DEFAULT_SHORTCUTS;
};

RC.saveShortcuts = function(shortcuts) {
    localStorage.setItem('rc_shortcuts', JSON.stringify(shortcuts));
};

RC.matchesShortcut = function(e, action) {
    var shortcuts = RC.getShortcuts();
    var keys = shortcuts[action] || RC.DEFAULT_SHORTCUTS[action] || [];
    return keys.indexOf(e.code) !== -1;
};

document.addEventListener('keydown', function(e) {
    var view = document.querySelector('.view.active');
    if (!view) return;
    var vid = view.id;

    // Don't capture when typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        if (vid === 'view-review' && e.target.id === 'typeInput' && e.code === 'Enter') {
            e.preventDefault();
            RC.revealAnswer();
        }
        return;
    }

    if (vid === 'view-review') {
        if (RC.matchesShortcut(e, 'reveal')) {
            e.preventDefault();
            if (!RC.reviewRevealed) RC.revealAnswer();
        }
        if (RC.reviewRevealed) {
            if (RC.matchesShortcut(e, 'again')) RC.submitRating(1);
            if (RC.matchesShortcut(e, 'hard')) RC.submitRating(2);
            if (RC.matchesShortcut(e, 'good')) RC.submitRating(3);
            if (RC.matchesShortcut(e, 'easy')) RC.submitRating(4);
        }
        if (RC.matchesShortcut(e, 'exitReview')) RC.exitReview();
        if (e.code === 'F11') { e.preventDefault(); RC.toggleFullScreen(); }
        if (RC.matchesShortcut(e, 'undo')) RC.undoReview();
        if (e.code === 'KeyI' && !RC._editingField) { e.preventDefault(); RC.showCardInfo(); }
        if (e.code === 'KeyE' && !RC._editingField) { e.preventDefault(); RC._triggerEditMode(); }
    }

    if (document.getElementById('newDeckModal').style.display === 'flex' && e.code === 'Enter') {
        RC.createDeck();
    }

    // Close modals on Escape
    if (e.code === 'Escape') {
        ['editModal', 'deckOptionsModal', 'shortcutsModal', 'newDeckModal', 'cardInfoModal'].forEach(function(id) {
            var modal = document.getElementById(id);
            if (modal && modal.style.display === 'flex') modal.style.display = 'none';
        });
    }
});

// ── Shortcuts settings modal ──

RC.showShortcutsModal = function() {
    var shortcuts = RC.getShortcuts();
    var actions = [
        { key: 'reveal', label: 'Reveal answer' },
        { key: 'again', label: 'Rate: Again (1)' },
        { key: 'hard', label: 'Rate: Hard (2)' },
        { key: 'good', label: 'Rate: Good (3)' },
        { key: 'easy', label: 'Rate: Easy (4)' },
        { key: 'undo', label: 'Undo review' },
        { key: 'exitReview', label: 'Exit review' },
    ];

    var html = '<div class="shortcuts-list">';
    for (var i = 0; i < actions.length; i++) {
        var a = actions[i];
        var keys = shortcuts[a.key] || [];
        html += '<div class="shortcut-row">'
            + '<span class="shortcut-label">' + RC.esc(a.label) + '</span>'
            + '<input class="shortcut-input" data-action="' + a.key + '" value="' + RC.esc(keys.join(', ')) + '" readonly onclick="RC.captureShortcut(this)">'
            + '</div>';
    }
    html += '</div>';

    var modal = document.getElementById('shortcutsModal');
    if (modal) {
        document.getElementById('shortcutsBody').innerHTML = html;
        modal.style.display = 'flex';
    }
};

RC._captureTarget = null;

RC.captureShortcut = function(input) {
    if (RC._captureTarget) RC._captureTarget.classList.remove('capturing');
    RC._captureTarget = input;
    input.classList.add('capturing');
    input.value = 'Press key...';

    var handler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.code === 'Escape') {
            input.value = '';
            input.classList.remove('capturing');
            RC._captureTarget = null;
            document.removeEventListener('keydown', handler, true);
            return;
        }
        input.value = e.code;
        input.classList.remove('capturing');
        RC._captureTarget = null;
        document.removeEventListener('keydown', handler, true);
    };
    document.addEventListener('keydown', handler, true);
};

RC.saveShortcutsFromModal = function() {
    var inputs = document.querySelectorAll('.shortcut-input');
    var shortcuts = {};
    for (var i = 0; i < inputs.length; i++) {
        var action = inputs[i].getAttribute('data-action');
        var val = inputs[i].value.trim();
        if (val && val !== 'Press key...') {
            shortcuts[action] = val.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        } else {
            shortcuts[action] = RC.DEFAULT_SHORTCUTS[action] || [];
        }
    }
    RC.saveShortcuts(shortcuts);
    RC.toast('Shortcuts saved');
    document.getElementById('shortcutsModal').style.display = 'none';
};

RC.resetShortcuts = function() {
    localStorage.removeItem('rc_shortcuts');
    RC.toast('Shortcuts reset to defaults');
    RC.showShortcutsModal();
};

// ── Theme toggle ──

RC.toggleTheme = function() {
    document.body.classList.toggle('light-mode');
    var isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('rc_theme', isLight ? 'light' : 'dark');
};

RC.loadTheme = function() {
    var theme = localStorage.getItem('rc_theme');
    if (theme === 'light') document.body.classList.add('light-mode');
};

// ── Init ──
document.addEventListener('DOMContentLoaded', function() {
    RC.loadTheme();
    RC.initUploadZone();
    RC.initVoice();
    RC.loadFrozenFields();
    RC.loadTagSettings();
    if (!RC.getToken()) { location.href = '/?redirect=/cards/'; return; }
    RC.showView('decks');

    // Register service worker for offline support
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register('/cards/cards-sw.js', { scope: '/cards/' })
            .then(function(reg) {
                setInterval(function() { reg.update(); }, 3600000);
            })
            .catch(function() {});
    }
});
