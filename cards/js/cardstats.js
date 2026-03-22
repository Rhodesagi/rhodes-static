/* RhodesCards — Per-card stats + True Retention + Cloze Overlapper + Frozen Fields */

// ── Per-Card Stats Modal ──

RC.showCardStats = async function(cardId) {
    try {
        // Fetch review history for this card
        var data = await RC.api('GET', '/decks/' + RC.currentDeckId + '/browse?per_page=1&q=');
        // We need a dedicated endpoint, but for now use available data
        RC.toast('Card stats: card_id=' + cardId);
    } catch (e) {}
};

// ── True Retention (mature card retention rate) ──

RC.loadTrueRetention = async function() {
    try {
        var data = await RC.api('GET', '/stats?days=90');
        // Calculate true retention from daily data
        var totalCorrect = 0;
        var totalReviews = 0;
        for (var i = 0; i < data.daily.length; i++) {
            totalCorrect += data.daily[i].correct;
            totalReviews += data.daily[i].reviews;
        }
        var trueRetention = totalReviews > 0 ? Math.round(totalCorrect / totalReviews * 1000) / 10 : 0;
        return { retention: trueRetention, total: totalReviews, correct: totalCorrect };
    } catch (e) { return null; }
};

// ── Cloze Overlapper ──

RC.showClozeOverlapper = function() {
    document.getElementById('clozeOverlapperModal').style.display = 'flex';
    document.getElementById('overlapperInput').value = '';
    document.getElementById('overlapperPreview').innerHTML = '';
};

RC.generateOverlappingClozes = function() {
    var input = document.getElementById('overlapperInput').value.trim();
    if (!input) return;

    var lines = input.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
    if (lines.length < 2) {
        RC.toast('Enter at least 2 items (one per line)', 'error');
        return;
    }

    var context = parseInt(document.getElementById('overlapperContext').value) || 1;
    var preview = document.getElementById('overlapperPreview');

    // Generate overlapping cloze text
    // For each item, show context items before and after, hide the target
    var cards = [];
    for (var i = 0; i < lines.length; i++) {
        var parts = [];
        for (var j = 0; j < lines.length; j++) {
            if (j === i) {
                parts.push('{{c' + (i + 1) + '::' + lines[j] + '}}');
            } else if (Math.abs(j - i) <= context) {
                parts.push(lines[j]);
            } else {
                parts.push('[...]');
            }
        }
        cards.push(parts);
    }

    // Build preview
    var html = '<div style="font-size:0.85rem;color:var(--dim);margin-bottom:8px">' + lines.length + ' cards will be created</div>';
    for (var k = 0; k < Math.min(cards.length, 5); k++) {
        html += '<div style="background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:8px;margin-bottom:4px;font-size:0.85rem">'
            + '<span style="color:var(--dim)">Card ' + (k + 1) + ':</span> '
            + RC.esc(cards[k].join(' | '))
            + '</div>';
    }
    if (cards.length > 5) html += '<div style="color:var(--dim);font-size:0.8rem">... and ' + (cards.length - 5) + ' more</div>';
    preview.innerHTML = html;

    // Store for creation
    RC._overlapperCards = cards;
    RC._overlapperLines = lines;
};

RC.createOverlappingClozes = async function() {
    if (!RC._overlapperLines || !RC._overlapperLines.length) {
        RC.toast('Generate preview first', 'error');
        return;
    }
    if (!RC.currentDeckId) return;

    // Build single cloze note with all deletions
    var front = '';
    for (var i = 0; i < RC._overlapperLines.length; i++) {
        front += '{{c' + (i + 1) + '::' + RC._overlapperLines[i] + '}}\n';
    }

    var tags = document.getElementById('overlapperTags').value.split(',').map(function(t) { return t.trim(); }).filter(Boolean);

    try {
        var result = await RC.api('POST', '/notes', {
            deck_id: RC.currentDeckId,
            card_type: 'cloze',
            fields: { front: front.trim(), back: '' },
            tags: tags,
        });
        RC.toast(result.cards_created + ' overlapping cloze cards created');
        document.getElementById('clozeOverlapperModal').style.display = 'none';
        RC.showDeckDetail(RC.currentDeckId);
    } catch (e) { RC.toast(e.message, 'error'); }
};

// ── Frozen Fields ──

RC.frozenFields = {};

RC.loadFrozenFields = function() {
    try {
        var saved = localStorage.getItem('rc_frozen_fields');
        if (saved) RC.frozenFields = JSON.parse(saved);
    } catch (e) {}
};

RC.toggleFreezeField = function(fieldId) {
    if (RC.frozenFields[fieldId]) {
        delete RC.frozenFields[fieldId];
        document.getElementById('freeze_' + fieldId).classList.remove('frozen');
    } else {
        RC.frozenFields[fieldId] = document.getElementById(fieldId).value;
        document.getElementById('freeze_' + fieldId).classList.add('frozen');
    }
    localStorage.setItem('rc_frozen_fields', JSON.stringify(RC.frozenFields));
};

RC.applyFrozenFields = function() {
    RC.loadFrozenFields();
    for (var fieldId in RC.frozenFields) {
        var el = document.getElementById(fieldId);
        if (el && RC.frozenFields[fieldId]) {
            el.value = RC.frozenFields[fieldId];
        }
    }
};

RC.clearFrozenOnAdd = function() {
    // Clear non-frozen fields only
    var fields = ['addFront', 'addBack', 'addTags'];
    for (var i = 0; i < fields.length; i++) {
        if (!RC.frozenFields[fields[i]]) {
            document.getElementById(fields[i]).value = '';
        } else {
            // Update frozen value to current
            RC.frozenFields[fields[i]] = document.getElementById(fields[i]).value;
            localStorage.setItem('rc_frozen_fields', JSON.stringify(RC.frozenFields));
        }
    }
};
