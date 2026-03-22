/* RhodesCards — Add card form with frozen fields */

RC.showAdd = function() {
    RC.updateAddFormHints();
    RC.showView('add');
    // Apply frozen fields (keep values for frozen ones, clear others)
    RC.loadFrozenFields();
    var fields = ['addFront', 'addBack', 'addTags'];
    for (var i = 0; i < fields.length; i++) {
        if (!RC.frozenFields[fields[i]]) {
            document.getElementById(fields[i]).value = '';
        }
    }
    RC.applyFrozenFields();
    RC.initMediaHandlers('addFront');
    RC.initMediaHandlers('addBack');
    document.getElementById('addFront').focus();
};

RC.updateAddFormHints = function() {
    var type = document.getElementById('addType').value;
    var frontLabel = document.getElementById('addFrontLabel');
    var backLabel = document.getElementById('addBackLabel');
    var clozeHelp = document.getElementById('clozeHelp');

    if (type === 'cloze') {
        frontLabel.textContent = 'TEXT (use {{c1::answer}} for cloze)';
        backLabel.textContent = 'EXTRA (optional notes)';
        clozeHelp.style.display = 'block';
    } else if (type === 'type_answer') {
        frontLabel.textContent = 'QUESTION';
        backLabel.textContent = 'ANSWER (user types this)';
        clozeHelp.style.display = 'none';
    } else {
        frontLabel.textContent = 'FRONT';
        backLabel.textContent = 'BACK';
        clozeHelp.style.display = 'none';
    }
};

RC.addCard = async function(andNext) {
    var front = document.getElementById('addFront').value.trim();
    var back = document.getElementById('addBack').value.trim();
    var cardType = document.getElementById('addType').value;

    if (!front) return RC.toast('Front/text required', 'error');
    if (cardType !== 'cloze' && !back) return RC.toast('Back/answer required', 'error');
    if (cardType === 'cloze' && !/\{\{c\d+::/.test(front)) return RC.toast('Cloze text must contain {{c1::answer}} deletions', 'error');

    var tags = document.getElementById('addTags').value.split(',').map(function(t) { return t.trim(); }).filter(Boolean);

    try {
        await RC.api('POST', '/notes', {
            deck_id: RC.currentDeckId,
            card_type: cardType,
            fields: { front: front, back: back },
            tags: tags,
        });
        RC.toast('Card added');
        if (andNext) {
            RC.clearFrozenOnAdd();
            document.getElementById('addFront').focus();
        } else {
            RC.showDeckDetail(RC.currentDeckId);
        }
    } catch (e) { RC.toast(e.message, 'error'); }
};
