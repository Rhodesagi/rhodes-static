/* RhodesCards — Edit field during review (click to edit, save on blur) */

RC._editingField = null;

RC.enableReviewEdit = function() {
    var card = RC.reviewQueue[RC.reviewIndex];
    if (!card || !card.note_id) return;

    var cardEl = document.getElementById('reviewCard');
    var frontEl = cardEl.querySelector('.card-front');
    var backEl = cardEl.querySelector('.card-back');

    if (frontEl && !frontEl.getAttribute('data-editing')) {
        frontEl.classList.add('rc-editable');
        frontEl.setAttribute('data-field', 'front');
        frontEl.addEventListener('dblclick', RC._handleFieldEdit);
    }
    if (backEl && !backEl.getAttribute('data-editing')) {
        backEl.classList.add('rc-editable');
        backEl.setAttribute('data-field', 'back');
        backEl.addEventListener('dblclick', RC._handleFieldEdit);
    }
};

RC._handleFieldEdit = function(e) {
    e.stopPropagation();
    var el = e.currentTarget;
    var field = el.getAttribute('data-field');
    var card = RC.reviewQueue[RC.reviewIndex];
    if (!card || RC._editingField) return;

    RC._editingField = field;
    el.setAttribute('data-editing', '1');

    // Replace rendered HTML with raw text in a textarea
    var raw = field === 'front' ? card.front : card.back;
    var wrapper = document.createElement('div');
    wrapper.className = 'rc-edit-wrapper';

    var textarea = document.createElement('textarea');
    textarea.className = 'rc-edit-textarea';
    textarea.value = raw;
    textarea.rows = Math.max(3, raw.split('\n').length + 1);

    var btnRow = document.createElement('div');
    btnRow.className = 'rc-edit-btns';
    btnRow.innerHTML = '<button class="btn btn-sm btn-primary" onclick="RC._saveFieldEdit()">Save</button>'
        + '<button class="btn btn-sm" onclick="RC._cancelFieldEdit()">Cancel</button>';

    wrapper.appendChild(textarea);
    wrapper.appendChild(btnRow);

    el.innerHTML = '';
    el.appendChild(wrapper);
    textarea.focus();

    // Save on Ctrl+Enter
    textarea.addEventListener('keydown', function(ev) {
        if (ev.code === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
            ev.preventDefault();
            RC._saveFieldEdit();
        }
        if (ev.code === 'Escape') {
            ev.preventDefault();
            RC._cancelFieldEdit();
        }
        ev.stopPropagation(); // prevent review shortcuts
    });
};

RC._saveFieldEdit = async function() {
    var card = RC.reviewQueue[RC.reviewIndex];
    if (!card || !RC._editingField) return;

    var cardEl = document.getElementById('reviewCard');
    var textarea = cardEl.querySelector('.rc-edit-textarea');
    if (!textarea) return;

    var newVal = textarea.value.trim();
    var field = RC._editingField;

    // Build updated fields
    var fields = { front: card.front, back: card.back };
    fields[field] = newVal;

    try {
        await RC.api('PUT', '/notes/' + card.note_id, {
            fields: fields,
            tags: card.tags || [],
            card_type: card.card_type || 'basic',
        });

        // Update local queue data
        card[field] = newVal;
        RC.toast('Card updated');
    } catch (e) {
        RC.toast('Save failed: ' + e.message, 'error');
    }

    RC._editingField = null;

    // Re-render the card in its current state (revealed or not)
    if (RC.reviewRevealed) {
        RC.reviewRevealed = false; // trick to re-render
        RC.showCurrentCard();
        RC.revealAnswer();
    } else {
        RC.showCurrentCard();
    }
};

RC._cancelFieldEdit = function() {
    RC._editingField = null;
    // Re-render
    if (RC.reviewRevealed) {
        RC.reviewRevealed = false;
        RC.showCurrentCard();
        RC.revealAnswer();
    } else {
        RC.showCurrentCard();
    }
};

// Hook into showCurrentCard to enable editing after render
var _origShowCurrentCard = RC.showCurrentCard;
RC.showCurrentCard = function() {
    _origShowCurrentCard();
    // Enable edit on front after a tick
    setTimeout(RC.enableReviewEdit, 50);
};

// Also hook into revealAnswer to enable editing on back
var _origRevealAnswer = RC.revealAnswer;
RC.revealAnswer = function() {
    _origRevealAnswer();
    setTimeout(RC.enableReviewEdit, 50);
};

// Trigger edit mode from toolbar button or keyboard shortcut
RC._triggerEditMode = function() {
    var cardEl = document.getElementById('reviewCard');
    if (!cardEl) return;
    // Edit front if not revealed, back if revealed (or front if no back)
    var target = RC.reviewRevealed
        ? (cardEl.querySelector('.card-back') || cardEl.querySelector('.card-front'))
        : cardEl.querySelector('.card-front');
    if (target && target.classList.contains('rc-editable')) {
        target.dispatchEvent(new Event('dblclick', { bubbles: true }));
    }
};
