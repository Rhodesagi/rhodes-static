/* RhodesCards — Deck list + detail views with subdeck support */

RC.currentDeckId = null;
RC.currentDeck = null;

RC.loadDecks = async function() {
    try {
        var data = await RC.api('GET', '/decks');
        var grid = document.getElementById('deckGrid');
        if (!data.decks.length) {
            grid.innerHTML = '<div class="deck-card deck-card-new" onclick="RC.showNewDeckModal()">+ Create Your First Deck</div>';
        } else {
            // Build tree: top-level decks + children
            var deckMap = {};
            var topLevel = [];
            for (var i = 0; i < data.decks.length; i++) {
                deckMap[data.decks[i].id] = data.decks[i];
            }
            for (var j = 0; j < data.decks.length; j++) {
                var d = data.decks[j];
                if (!d.parent_id || !deckMap[d.parent_id]) {
                    topLevel.push(d);
                }
            }

            // Get children for a deck
            function getChildren(parentId) {
                return data.decks.filter(function(d) { return d.parent_id === parentId; });
            }

            var html = '';
            for (var k = 0; k < topLevel.length; k++) {
                var d = topLevel[k];
                var children = getChildren(d.id);
                var displayName = d.name.indexOf('::') !== -1 ? d.name.split('::').pop() : d.name;

                html += '<div class="deck-card" onclick="RC.showDeckDetail(' + d.id + ')">'
                    + '<div class="deck-name">' + RC.esc(displayName) + '</div>'
                    + '<div class="deck-desc">' + RC.esc(d.description || '') + '</div>'
                    + '<div class="deck-badges">'
                    + (d.new_count ? '<span class="badge badge-new">' + d.new_count + ' new</span>' : '')
                    + (d.learning_count ? '<span class="badge badge-learn">' + d.learning_count + ' learning</span>' : '')
                    + (d.review_count ? '<span class="badge badge-review">' + d.review_count + ' due</span>' : '')
                    + '<span class="badge badge-total">' + (d.agg_total || d.total_cards) + ' total</span>'
                    + '</div>';

                // Show children inline
                if (children.length) {
                    html += '<div class="subdeck-list">';
                    for (var ci = 0; ci < children.length; ci++) {
                        var child = children[ci];
                        var childName = child.name.indexOf('::') !== -1 ? child.name.split('::').pop() : child.name;
                        html += '<div class="subdeck-item" onclick="event.stopPropagation();RC.showDeckDetail(' + child.id + ')">'
                            + '<span class="subdeck-name">' + RC.esc(childName) + '</span>'
                            + '<span class="subdeck-badges">'
                            + (child.new_count ? '<span class="badge badge-new badge-xs">' + child.new_count + '</span>' : '')
                            + (child.learning_count ? '<span class="badge badge-learn badge-xs">' + child.learning_count + '</span>' : '')
                            + (child.review_count ? '<span class="badge badge-review badge-xs">' + child.review_count + '</span>' : '')
                            + '<span class="badge badge-total badge-xs">' + child.total_cards + '</span>'
                            + '</span></div>';
                    }
                    html += '</div>';
                }

                html += '</div>';
            }
            html += '<div class="deck-card deck-card-new" onclick="RC.showNewDeckModal()">+ New Deck</div>';
            grid.innerHTML = html;
        }
        RC.loadHeaderStats();
    } catch (e) {
        document.getElementById('deckGrid').innerHTML = '<p style="color:var(--red)">Error: ' + RC.esc(e.message) + '</p>';
    }
};

RC.loadHeaderStats = async function() {
    try {
        var s = await RC.api('GET', '/stats');
        document.getElementById('headerStreak').textContent = s.streak ? s.streak + ' day streak' : '';
        document.getElementById('headerRetention').textContent = s.total_reviews_30d ? s.retention + '% retention' : '';
    } catch (e) { /* ignore */ }
};

RC.showNewDeckModal = function() {
    document.getElementById('newDeckName').value = '';
    document.getElementById('newDeckDesc').value = '';
    document.getElementById('newDeckModal').style.display = 'flex';
    document.getElementById('newDeckName').focus();
};

RC.createDeck = async function() {
    var name = document.getElementById('newDeckName').value.trim();
    if (!name) return RC.toast('Deck name required', 'error');
    try {
        await RC.api('POST', '/decks', { name: name, description: document.getElementById('newDeckDesc').value.trim() });
        document.getElementById('newDeckModal').style.display = 'none';
        RC.toast('Deck created');
        RC.loadDecks();
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC.showDeckDetail = async function(deckId) {
    RC.currentDeckId = deckId;
    RC.showView('detail');
    try {
        var data = await RC.api('GET', '/decks');
        RC.currentDeck = data.decks.find(function(d) { return d.id === deckId; });
        if (!RC.currentDeck) { RC.showView('decks'); return; }

        var displayName = RC.currentDeck.name;
        if (displayName.indexOf('::') !== -1) {
            // Show breadcrumb-style path
            var parts = displayName.split('::');
            displayName = parts.join(' > ');
        }
        document.getElementById('detailName').textContent = displayName;

        // Use aggregated counts for parent decks
        var due = RC.currentDeck.due_count;
        var aggTotal = RC.currentDeck.agg_total || RC.currentDeck.total_cards;
        document.getElementById('studyBtn').textContent = due > 0 ? 'Study Now (' + due + ')' : 'Nothing Due';
        document.getElementById('studyBtn').disabled = due === 0;
        document.getElementById('detailStats').innerHTML =
            '<span>New: <span class="num">' + RC.currentDeck.new_count + '</span></span>'
            + '<span>Learning: <span class="num">' + RC.currentDeck.learning_count + '</span></span>'
            + '<span>Review: <span class="num">' + RC.currentDeck.review_count + '</span></span>'
            + '<span>Total: <span class="num">' + aggTotal + '</span></span>';
        if (typeof RC.renderCountdownWidget === 'function') RC.renderCountdownWidget();
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC.deleteDeck = async function() {
    if (!confirm('Delete this deck and all its cards? This cannot be undone.')) return;
    try {
        await RC.api('DELETE', '/decks/' + RC.currentDeckId);
        RC.toast('Deck deleted');
        RC.showView('decks');
    } catch (e) { RC.toast(e.message, 'error'); }
};

// ── Export ──

RC.exportDeck = function(format) {
    if (!RC.currentDeckId) return;
    var url = RC.API_BASE + '/decks/' + RC.currentDeckId + '/export?format=' + format;
    fetch(url, {
        headers: { 'Authorization': 'Bearer ' + RC.getToken() }
    }).then(function(res) {
        if (!res.ok) throw new Error('Export failed');
        var filename = 'deck.' + format;
        var disposition = res.headers.get('Content-Disposition');
        if (disposition) {
            var match = disposition.match(/filename="?([^"]+)"?/);
            if (match) filename = match[1];
        }
        return res.blob().then(function(blob) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
            RC.toast('Exported as ' + format.toUpperCase());
        });
    }).catch(function(e) { RC.toast(e.message, 'error'); });
};

// ── Deck Options ──

RC.showDeckOptions = function() {
    if (!RC.currentDeck) return;
    var s = RC.currentDeck.settings || {};
    document.getElementById('optNewPerDay').value = s.new_cards_per_day || 20;
    document.getElementById('optReviewPerDay').value = s.review_cards_per_day || 200;
    document.getElementById('optRetention').value = s.desired_retention || 0.9;
    document.getElementById('optLearningSteps').value = (s.learning_steps || [1, 10]).join(', ');
    document.getElementById('optRelearningSteps').value = (s.relearning_steps || [10]).join(', ');
    document.getElementById('optMaxInterval').value = s.max_interval_days || 36500;
    document.getElementById('deckOptionsModal').style.display = 'flex';
};

// ── Custom Study (Filtered Decks) ──

RC.showCustomStudy = function() {
    document.getElementById('customFilterQuery').value = '';
    document.getElementById('customFilterLimit').value = '100';
    document.getElementById('customStudyModal').style.display = 'flex';
};

RC.createCustomStudy = async function(preset) {
    var filterQuery = '';
    var limit = 100;

    if (preset === 'custom') {
        filterQuery = document.getElementById('customFilterQuery').value.trim();
        limit = parseInt(document.getElementById('customFilterLimit').value) || 100;
        if (!filterQuery) return RC.toast('Enter a filter query', 'error');
    }

    try {
        var data = await RC.api('POST', '/decks/filtered', {
            name: 'Custom Study - ' + (preset === 'custom' ? filterQuery : preset.replace('_', ' ')),
            filter_query: filterQuery,
            source_deck_id: RC.currentDeckId,
            limit: limit,
            preset: preset !== 'custom' ? preset : '',
        });

        document.getElementById('customStudyModal').style.display = 'none';

        if (data.card_count === 0) {
            RC.toast('No matching cards found', 'error');
            return;
        }

        RC.toast(data.card_count + ' cards matched');

        // Start review with the filtered deck
        RC.currentDeckId = data.deck_id;
        RC._filteredDeckId = data.deck_id;
        var reviewData = await RC.api('GET', '/filtered/' + data.deck_id + '/review?limit=50');
        RC.reviewQueue = reviewData.cards;
        if (!RC.reviewQueue.length) { RC.toast('No cards to review', 'error'); return; }
        RC.reviewIndex = 0;
        RC.reviewRevealed = false;
        RC.lastReviewCardId = null;
        RC.sessionStats = { total: 0, correct: 0, again: 0, startTime: Date.now() };
        RC.showView('review');
        RC.showCurrentCard();
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC.saveDeckOptions = async function() {
    var settings = {
        new_cards_per_day: parseInt(document.getElementById('optNewPerDay').value) || 20,
        review_cards_per_day: parseInt(document.getElementById('optReviewPerDay').value) || 200,
        desired_retention: parseFloat(document.getElementById('optRetention').value) || 0.9,
        learning_steps: document.getElementById('optLearningSteps').value.split(',').map(function(s) { return parseInt(s.trim()); }).filter(function(n) { return !isNaN(n); }),
        relearning_steps: document.getElementById('optRelearningSteps').value.split(',').map(function(s) { return parseInt(s.trim()); }).filter(function(n) { return !isNaN(n); }),
        max_interval_days: parseInt(document.getElementById('optMaxInterval').value) || 36500,
    };
    try {
        await RC.api('PUT', '/decks/' + RC.currentDeckId, { settings: settings });
        RC.toast('Settings saved');
        document.getElementById('deckOptionsModal').style.display = 'none';
        RC.showDeckDetail(RC.currentDeckId);
    } catch (e) { RC.toast(e.message, 'error'); }
};
