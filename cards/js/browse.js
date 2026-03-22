/* RhodesCards — Card browser + editor + advanced search */

RC.browsePage = 1;

RC.showBrowse = function() {
    RC.browsePage = 1;
    document.getElementById('browseSearch').value = '';
    RC.showView('browse');
    RC.loadBrowse();
    RC.loadBrowseTags();
    RC.refreshTagSidebar();
};

RC.loadBrowseTags = async function() {
    if (!RC.currentDeckId) return;
    try {
        var data = await RC.api('GET', '/tags?deck_id=' + RC.currentDeckId);
        var tagBar = document.getElementById('browseTagBar');
        if (!tagBar) return;
        if (!data.tags || !data.tags.length) {
            tagBar.innerHTML = '';
            return;
        }
        tagBar.innerHTML = data.tags.slice(0, 20).map(function(t) {
            return '<button class="tag-chip" onclick="RC.applyTagFilter(\'' + RC.esc(t.tag) + '\')">'
                + RC.esc(t.tag) + ' <span class="tag-count">' + t.count + '</span></button>';
        }).join('');
    } catch (e) { /* ignore */ }
};

RC.applyTagFilter = function(tag) {
    var input = document.getElementById('browseSearch');
    var val = input.value.trim();
    if (val) val += ' ';
    input.value = val + 'tag:' + tag;
    RC.browsePage = 1;
    RC.loadBrowse();
};

RC.loadBrowse = async function() {
    if (!RC.currentDeckId) return;
    var head = document.getElementById('browseHead');
    if (head) {
        var baseTh = '<th>Front</th><th>Back</th><th>State</th><th>Due</th><th>Interval</th><th>Tags</th><th></th>';
        head.innerHTML = RC._batchHeaderCell() + baseTh;
    }
    var q = document.getElementById('browseSearch').value.trim();
    try {
        var data = await RC.api('GET', '/decks/' + RC.currentDeckId + '/browse?page=' + RC.browsePage + '&per_page=50' + (q ? '&q=' + encodeURIComponent(q) : ''));
        var body = document.getElementById('browseBody');
        if (!data.cards.length) {
            body.innerHTML = '<tr><td colspan="' + (RC._batchMode ? 8 : 7) + '" style="color:var(--dim);text-align:center;padding:32px">No cards found</td></tr>';
        } else {
            var FLAG_COLORS = ['', '#ff4444', '#ff8800', '#00ff66', '#4488ff', '#ff66cc', '#00cccc', '#aa66ff'];
            body.innerHTML = data.cards.map(function(c) {
                var typeLabel = c.card_type === 'cloze' ? ' [cloze]' : (c.card_type === 'type_answer' ? ' [type]' : (c.card_type === 'reverse' ? ' [rev]' : ''));
                var statusBadges = '';
                if (c.suspended) statusBadges += '<span style="color:var(--yellow);font-size:0.75rem" title="Suspended">S</span> ';
                if (c.buried_until) statusBadges += '<span style="color:var(--dim);font-size:0.75rem" title="Buried">B</span> ';
                if (c.flag > 0) statusBadges += '<span style="color:' + FLAG_COLORS[c.flag] + ';font-size:0.9rem" title="Flag ' + c.flag + '">&#9873;</span> ';
                return '<tr onclick="RC.openCardEditor(' + c.note_id + ')" style="cursor:pointer' + (c.suspended ? ';opacity:0.5' : '') + '">'
                    + RC._batchCheckboxCell(c.card_id)
                    + '<td>' + statusBadges + RC.esc(c.front.substring(0, 50)) + typeLabel + '</td>'
                    + '<td>' + RC.esc(c.back.substring(0, 50)) + '</td>'
                    + '<td>' + RC.STATE_NAMES[c.state] + '</td>'
                    + '<td>' + RC.formatDue(c.due) + '</td>'
                    + '<td>' + (c.interval_days ? c.interval_days.toFixed(1) + 'd' : '-') + '</td>'
                    + '<td>' + (c.tags && c.tags.length ? RC.esc(c.tags.join(', ')) : '-') + '</td>'
                    + '<td>'
                    + '<button class="btn btn-sm" onclick="event.stopPropagation();RC.toggleSuspend(' + c.card_id + ')" title="' + (c.suspended ? 'Unsuspend' : 'Suspend') + '" style="padding:4px 8px">' + (c.suspended ? 'U' : 'S') + '</button>'
                    + '<button class="btn btn-sm btn-danger" onclick="event.stopPropagation();RC.deleteNote(' + c.note_id + ')" style="padding:4px 8px;margin-left:4px">X</button>'
                    + '</td>'
                    + '</tr>';
            }).join('');
        }

        // Pagination
        var pag = document.getElementById('browsePagination');
        if (data.pages > 1) {
            var html = '';
            if (RC.browsePage > 1) {
                html += '<button class="btn btn-sm" onclick="RC.browsePage=' + (RC.browsePage - 1) + ';RC.loadBrowse()">&laquo;</button>';
            }
            var startPage = Math.max(1, RC.browsePage - 5);
            var endPage = Math.min(data.pages, startPage + 9);
            for (var i = startPage; i <= endPage; i++) {
                html += '<button class="btn btn-sm' + (i === RC.browsePage ? ' btn-primary' : '') + '" onclick="RC.browsePage=' + i + ';RC.loadBrowse()">' + i + '</button>';
            }
            if (RC.browsePage < data.pages) {
                html += '<button class="btn btn-sm" onclick="RC.browsePage=' + (RC.browsePage + 1) + ';RC.loadBrowse()">&raquo;</button>';
            }
            html += '<span style="color:var(--dim);font-size:0.8rem;margin-left:8px">' + data.total + ' cards</span>';
            pag.innerHTML = html;
        } else {
            pag.innerHTML = data.total > 0 ? '<span style="color:var(--dim);font-size:0.8rem">' + data.total + ' cards</span>' : '';
        }
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC.deleteNote = async function(noteId) {
    if (!confirm('Delete this card?')) return;
    try {
        await RC.api('DELETE', '/notes/' + noteId);
        RC.toast('Card deleted');
        RC.loadBrowse();
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC.toggleSuspend = async function(cardId) {
    try {
        var result = await RC.api('POST', '/cards/' + cardId + '/suspend');
        RC.toast(result.suspended ? 'Suspended' : 'Unsuspended');
        RC.loadBrowse();
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC.buryCard = async function(cardId) {
    try {
        await RC.api('POST', '/cards/' + cardId + '/bury');
        RC.toast('Buried until tomorrow');
        RC.loadBrowse();
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC.flagCard = async function(cardId, flag) {
    try {
        await RC.api('POST', '/cards/' + cardId + '/flag', { flag: flag });
        RC.toast(flag > 0 ? 'Flagged' : 'Flag removed');
        RC.loadBrowse();
    } catch (e) { RC.toast(e.message, 'error'); }
};

// ── Card Editor Modal ──

RC.openCardEditor = async function(noteId) {
    try {
        var data = await RC.api('GET', '/decks/' + RC.currentDeckId + '/browse?per_page=100&q=');
        var card = null;
        for (var i = 0; i < data.cards.length; i++) {
            if (data.cards[i].note_id === noteId) {
                card = data.cards[i];
                break;
            }
        }
        if (!card) {
            RC.toast('Card not found', 'error');
            return;
        }

        document.getElementById('editNoteId').value = noteId;
        document.getElementById('editFront').value = card.front;
        document.getElementById('editBack').value = card.back;
        document.getElementById('editTags').value = (card.tags || []).join(', ');
        document.getElementById('editType').value = card.card_type || 'basic';

        // Init media handlers on editor textareas
        RC.initMediaHandlers('editFront');
        RC.initMediaHandlers('editBack');

        RC.updateEditPreview();
        document.getElementById('editModal').style.display = 'flex';
        document.getElementById('editFront').focus();
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC.updateEditPreview = function() {
    var front = document.getElementById('editFront').value;
    var back = document.getElementById('editBack').value;
    var preview = document.getElementById('editPreview');
    preview.innerHTML = '<div class="preview-label">FRONT</div>'
        + '<div class="preview-content">' + RC.renderCardContent(front) + '</div>'
        + '<hr style="border-color:var(--border);margin:12px 0">'
        + '<div class="preview-label">BACK</div>'
        + '<div class="preview-content">' + RC.renderCardContent(back) + '</div>';
    RC.renderMath(preview);
};

RC.saveCardEdit = async function() {
    var noteId = document.getElementById('editNoteId').value;
    var front = document.getElementById('editFront').value.trim();
    var back = document.getElementById('editBack').value.trim();
    var tags = document.getElementById('editTags').value.split(',').map(function(t) { return t.trim(); }).filter(Boolean);
    var cardType = document.getElementById('editType').value;

    if (!front) { RC.toast('Front is required', 'error'); return; }

    try {
        await RC.api('PUT', '/notes/' + noteId, {
            fields: { front: front, back: back },
            tags: tags,
            card_type: cardType,
        });
        RC.toast('Card updated');
        document.getElementById('editModal').style.display = 'none';
        RC.loadBrowse();
    } catch (e) { RC.toast(e.message, 'error'); }
};
