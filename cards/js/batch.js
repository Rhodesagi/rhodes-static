/* RhodesCards — Batch editing: select multiple cards + bulk actions */

RC._batchSelected = new Set();
RC._batchMode = false;

RC.toggleBatchMode = function() {
    RC._batchMode = !RC._batchMode;
    RC._batchSelected.clear();
    RC._renderBatchUI();
    RC.loadBrowse();
};

RC._renderBatchUI = function() {
    var bar = document.getElementById('batchBar');
    if (!bar) return;
    if (!RC._batchMode) {
        bar.style.display = 'none';
        return;
    }
    bar.style.display = 'flex';
    RC._updateBatchCount();
};

RC._updateBatchCount = function() {
    var countEl = document.getElementById('batchCount');
    if (countEl) countEl.textContent = RC._batchSelected.size + ' selected';
    var actions = document.getElementById('batchActions');
    if (actions) actions.style.opacity = RC._batchSelected.size > 0 ? '1' : '0.4';
};

RC.batchToggleCard = function(cardId, ev) {
    if (ev) ev.stopPropagation();
    if (RC._batchSelected.has(cardId)) {
        RC._batchSelected.delete(cardId);
    } else {
        RC._batchSelected.add(cardId);
    }
    // Update checkbox visual
    var cb = document.getElementById('batch-cb-' + cardId);
    if (cb) cb.checked = RC._batchSelected.has(cardId);
    RC._updateBatchCount();
};

RC.batchSelectAll = function() {
    var checkboxes = document.querySelectorAll('.batch-checkbox');
    var allChecked = RC._batchSelected.size > 0 && checkboxes.length === RC._batchSelected.size;
    if (allChecked) {
        // Deselect all
        RC._batchSelected.clear();
        checkboxes.forEach(function(cb) { cb.checked = false; });
    } else {
        // Select all visible
        checkboxes.forEach(function(cb) {
            var id = parseInt(cb.dataset.cardId);
            RC._batchSelected.add(id);
            cb.checked = true;
        });
    }
    RC._updateBatchCount();
};

RC.batchSelectAllPages = async function() {
    if (!RC.currentDeckId) return;
    var q = document.getElementById('browseSearch').value.trim();
    try {
        // Fetch all card IDs (up to 500)
        var data = await RC.api('GET', '/decks/' + RC.currentDeckId + '/browse?page=1&per_page=500' + (q ? '&q=' + encodeURIComponent(q) : ''));
        RC._batchSelected.clear();
        data.cards.forEach(function(c) { RC._batchSelected.add(c.card_id); });
        // Update visible checkboxes
        document.querySelectorAll('.batch-checkbox').forEach(function(cb) {
            cb.checked = RC._batchSelected.has(parseInt(cb.dataset.cardId));
        });
        RC._updateBatchCount();
        RC.toast(RC._batchSelected.size + ' cards selected');
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC._doBatchAction = async function(action, value) {
    if (RC._batchSelected.size === 0) {
        RC.toast('No cards selected', 'error');
        return;
    }
    try {
        var body = { card_ids: Array.from(RC._batchSelected), action: action };
        if (value !== undefined) body.value = value;
        var result = await RC.api('POST', '/batch', body);
        RC.toast(result.action + ': ' + result.affected + ' affected');
        RC._batchSelected.clear();
        RC._updateBatchCount();
        RC.loadBrowse();
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC.batchSuspend = function() { RC._doBatchAction('suspend'); };
RC.batchUnsuspend = function() { RC._doBatchAction('unsuspend'); };
RC.batchBury = function() { RC._doBatchAction('bury'); };

RC.batchSetFlag = function() {
    var flag = prompt('Flag number (0-7, 0=remove):');
    if (flag === null) return;
    flag = parseInt(flag);
    if (isNaN(flag) || flag < 0 || flag > 7) { RC.toast('Invalid flag', 'error'); return; }
    RC._doBatchAction('set_flag', flag);
};

RC.batchAddTag = function() {
    var tag = prompt('Tag to add:');
    if (!tag || !tag.trim()) return;
    RC._doBatchAction('add_tag', tag.trim());
};

RC.batchRemoveTag = function() {
    var tag = prompt('Tag to remove:');
    if (!tag || !tag.trim()) return;
    RC._doBatchAction('remove_tag', tag.trim());
};

RC.batchMoveDeck = async function() {
    try {
        var data = await RC.api('GET', '/decks');
        var decks = data.decks || [];
        var options = decks.filter(function(d) { return d.id !== RC.currentDeckId; })
            .map(function(d) { return d.id + ': ' + d.name; }).join('\n');
        if (!options) { RC.toast('No other decks', 'error'); return; }
        var input = prompt('Move to deck (enter ID):\n' + options);
        if (!input) return;
        var deckId = parseInt(input);
        if (isNaN(deckId)) { RC.toast('Invalid deck ID', 'error'); return; }
        RC._doBatchAction('move_deck', deckId);
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC.batchDelete = function() {
    if (!confirm('Delete ' + RC._batchSelected.size + ' cards? This cannot be undone.')) return;
    RC._doBatchAction('delete');
};

/* Helper: generate checkbox cell HTML for a card row */
RC._batchCheckboxCell = function(cardId) {
    if (!RC._batchMode) return '';
    var checked = RC._batchSelected.has(cardId) ? ' checked' : '';
    return '<td style="width:30px;text-align:center;padding:4px">'
        + '<input type="checkbox" class="batch-checkbox" id="batch-cb-' + cardId + '" '
        + 'data-card-id="' + cardId + '"' + checked
        + ' onclick="RC.batchToggleCard(' + cardId + ', event)">'
        + '</td>';
};

/* Helper: generate the select-all header cell */
RC._batchHeaderCell = function() {
    if (!RC._batchMode) return '';
    return '<th style="width:30px;text-align:center;padding:4px">'
        + '<input type="checkbox" onclick="RC.batchSelectAll()" title="Select all on page">'
        + '</th>';
};
