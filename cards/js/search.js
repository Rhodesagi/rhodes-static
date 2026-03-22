/* RhodesCards — Advanced search parser (Anki-style syntax) */

/**
 * Supported search syntax:
 *   deck:Name           — filter by deck name
 *   tag:vocab           — filter by tag
 *   -tag:excluded       — exclude tag
 *   is:due              — cards due now
 *   is:new              — new cards
 *   is:learn            — learning cards
 *   is:review           — review cards
 *   is:suspended        — suspended cards
 *   is:buried           — buried cards
 *   flag:1              — flagged cards (1-7)
 *   prop:ivl>30         — interval comparison
 *   prop:reps>5         — reps comparison
 *   prop:lapses>3       — lapses comparison
 *   rated:N             — rated in last N days
 *   card_type:cloze     — filter by card type
 *   type:basic          — alias for card_type:
 *   "exact phrase"      — exact text match
 *   free text           — text search
 *
 * The backend handles all parsing — this just sends the raw query.
 * This file provides search suggestions UI.
 */

RC.SEARCH_PREFIXES = [
    { prefix: 'tag:', desc: 'Filter by tag' },
    { prefix: '-tag:', desc: 'Exclude tag' },
    { prefix: 'is:due', desc: 'Cards due now' },
    { prefix: 'is:new', desc: 'New cards' },
    { prefix: 'is:learn', desc: 'Learning cards' },
    { prefix: 'is:review', desc: 'Review cards' },
    { prefix: 'is:suspended', desc: 'Suspended cards' },
    { prefix: 'is:buried', desc: 'Buried cards' },
    { prefix: 'flag:', desc: 'Flag (1-7)' },
    { prefix: 'prop:ivl>', desc: 'Interval > days' },
    { prefix: 'prop:reps>', desc: 'Reps > count' },
    { prefix: 'prop:lapses>', desc: 'Lapses > count' },
    { prefix: 'rated:', desc: 'Rated in last N days' },
    { prefix: 'type:', desc: 'Card type (basic/cloze/reverse/type_answer)' },
];

RC.showSearchHelp = function(inputEl) {
    var existing = document.getElementById('searchSuggestions');
    if (existing) existing.remove();

    var val = inputEl.value;
    var lastToken = val.split(' ').pop().toLowerCase();
    if (!lastToken) return;

    var matches = RC.SEARCH_PREFIXES.filter(function(s) {
        return s.prefix.startsWith(lastToken) && s.prefix !== lastToken;
    });
    if (!matches.length) return;

    var div = document.createElement('div');
    div.id = 'searchSuggestions';
    div.className = 'search-suggestions';
    div.innerHTML = matches.map(function(s) {
        return '<div class="suggestion" data-prefix="' + RC.esc(s.prefix) + '">'
            + '<span class="suggestion-prefix">' + RC.esc(s.prefix) + '</span>'
            + '<span class="suggestion-desc">' + RC.esc(s.desc) + '</span>'
            + '</div>';
    }).join('');

    div.addEventListener('click', function(e) {
        var item = e.target.closest('.suggestion');
        if (!item) return;
        var prefix = item.getAttribute('data-prefix');
        var parts = val.split(' ');
        parts[parts.length - 1] = prefix;
        inputEl.value = parts.join(' ');
        inputEl.focus();
        div.remove();
    });

    inputEl.parentNode.style.position = 'relative';
    inputEl.parentNode.appendChild(div);
};

RC.hideSearchHelp = function() {
    var el = document.getElementById('searchSuggestions');
    if (el) setTimeout(function() { el.remove(); }, 150);
};
