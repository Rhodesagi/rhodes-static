/* RhodesCards v4 — SRS Flashcard Client with Cloze + Type-in */

const API = '/api/cards';
let token = null;
let currentDeckId = null;
let currentDeck = null;
let reviewQueue = [];
let reviewIndex = 0;
let reviewRevealed = false;
let sessionStats = { total: 0, correct: 0, again: 0, startTime: 0 };
let browsePage = 1;
let _debounceTimers = {};

// ── Auth ──
function getToken() {
    if (token) return token;
    token = (window.rhodesStorage && window.rhodesStorage.getItem('rhodes_user_token'))
        || sessionStorage.getItem('rhodes_user_token')
        || localStorage.getItem('rhodes_user_token')
        || localStorage.getItem('rhodes_token')
        || localStorage.getItem('auth_token');
    if (!token) {
        const p = new URLSearchParams(location.search);
        token = p.get('token');
        if (token) localStorage.setItem('rhodes_token', token);
    }
    return token;
}

async function api(method, path, body) {
    const t = getToken();
    if (!t) { location.href = '/?redirect=/cards/'; throw new Error('Not authenticated'); }
    const opts = {
        method,
        headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API + path, opts);
    if (res.status === 401) { location.href = '/?redirect=/cards/'; throw new Error('Not authenticated'); }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API error');
    return data;
}

function toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function debounce(fn, ms) {
    const key = fn.name || 'default';
    return function(...args) {
        clearTimeout(_debounceTimers[key]);
        _debounceTimers[key] = setTimeout(() => fn.apply(this, args), ms);
    };
}

const STATE_NAMES = ['New', 'Learning', 'Review', 'Relearning'];

// ── Views ──
function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById('view-' + name);
    if (el) el.classList.add('active');
    if (name === 'decks') loadDecks();
    if (name === 'stats') loadStats();
    if (name === 'import') loadImportLanguages();
}

// ── Decks ──
async function loadDecks() {
    try {
        const data = await api('GET', '/decks');
        const grid = document.getElementById('deckGrid');
        if (!data.decks.length) {
            grid.innerHTML = '<div class="deck-card deck-card-new" onclick="showNewDeckModal()">+ Create Your First Deck</div>';
        } else {
            let html = '';
            for (const d of data.decks) {
                html += '<div class="deck-card" onclick="showDeckDetail(' + d.id + ')">'
                    + '<div class="deck-name">' + esc(d.name) + '</div>'
                    + '<div class="deck-desc">' + esc(d.description || '') + '</div>'
                    + '<div class="deck-badges">'
                    + (d.new_count ? '<span class="badge badge-new">' + d.new_count + ' new</span>' : '')
                    + (d.learning_count ? '<span class="badge badge-learn">' + d.learning_count + ' learning</span>' : '')
                    + (d.review_count ? '<span class="badge badge-review">' + d.review_count + ' due</span>' : '')
                    + '<span class="badge badge-total">' + d.total_cards + ' total</span>'
                    + '</div></div>';
            }
            html += '<div class="deck-card deck-card-new" onclick="showNewDeckModal()">+ New Deck</div>';
            grid.innerHTML = html;
        }
        loadHeaderStats();
    } catch (e) {
        document.getElementById('deckGrid').innerHTML = '<p style="color:var(--red)">Error: ' + esc(e.message) + '</p>';
    }
}

async function loadHeaderStats() {
    try {
        const s = await api('GET', '/stats');
        document.getElementById('headerStreak').textContent = s.streak ? s.streak + ' day streak' : '';
        document.getElementById('headerRetention').textContent = s.total_reviews_30d ? s.retention + '% retention' : '';
    } catch (e) { /* ignore */ }
}

function showNewDeckModal() {
    document.getElementById('newDeckName').value = '';
    document.getElementById('newDeckDesc').value = '';
    document.getElementById('newDeckModal').style.display = 'flex';
    document.getElementById('newDeckName').focus();
}

async function createDeck() {
    const name = document.getElementById('newDeckName').value.trim();
    if (!name) return toast('Deck name required', 'error');
    try {
        await api('POST', '/decks', { name, description: document.getElementById('newDeckDesc').value.trim() });
        document.getElementById('newDeckModal').style.display = 'none';
        toast('Deck created');
        loadDecks();
    } catch (e) { toast(e.message, 'error'); }
}

async function showDeckDetail(deckId) {
    currentDeckId = deckId;
    showView('detail');
    try {
        const data = await api('GET', '/decks');
        currentDeck = data.decks.find(d => d.id === deckId);
        if (!currentDeck) { showView('decks'); return; }
        document.getElementById('detailName').textContent = currentDeck.name;
        const due = currentDeck.due_count;
        document.getElementById('studyBtn').textContent = due > 0 ? 'Study Now (' + due + ')' : 'Nothing Due';
        document.getElementById('studyBtn').disabled = due === 0;
        document.getElementById('detailStats').innerHTML =
            '<span>New: <span class="num">' + currentDeck.new_count + '</span></span>'
            + '<span>Learning: <span class="num">' + currentDeck.learning_count + '</span></span>'
            + '<span>Review: <span class="num">' + currentDeck.review_count + '</span></span>'
            + '<span>Total: <span class="num">' + currentDeck.total_cards + '</span></span>';
    } catch (e) { toast(e.message, 'error'); }
}

async function deleteDeck() {
    if (!confirm('Delete this deck and all its cards? This cannot be undone.')) return;
    try {
        await api('DELETE', '/decks/' + currentDeckId);
        toast('Deck deleted');
        showView('decks');
    } catch (e) { toast(e.message, 'error'); }
}

// ============================================
// REVIEW SESSION — with Cloze + Type-in
// ============================================
async function startReview() {
    if (!currentDeckId) return;
    try {
        const data = await api('GET', '/decks/' + currentDeckId + '/review?limit=20');
        reviewQueue = data.cards;
        if (!reviewQueue.length) { toast('No cards due', 'error'); return; }
        reviewIndex = 0;
        reviewRevealed = false;
        sessionStats = { total: 0, correct: 0, again: 0, startTime: Date.now() };
        showView('review');
        showCurrentCard();
    } catch (e) { toast(e.message, 'error'); }
}

function isCloze(card) {
    return card.card_type === 'cloze' || (card.front && /\{\{c\d+::/.test(card.front));
}

function isTypeIn(card) {
    return card.card_type === 'type_answer' || card.type_answer === true;
}

// Parse cloze: "The {{c1::capital}} of {{c2::France}}" for ordinal N
function renderCloze(text, ordinal, revealed) {
    // ordinal is 0-based from card_ordinal
    const clozeNum = (ordinal || 0) + 1;
    return text.replace(/\{\{c(\d+)::([^}]*?)(?:::([^}]*?))?\}\}/g, function(match, num, answer, hint) {
        if (parseInt(num) === clozeNum) {
            if (revealed) {
                return '<span class="cloze-revealed">' + esc(answer) + '</span>';
            } else {
                return '<span class="cloze-blank">' + (hint ? esc(hint) : '[...]') + '</span>';
            }
        } else {
            // Other cloze deletions shown normally
            return esc(answer);
        }
    });
}

function getClozeAnswer(text, ordinal) {
    const clozeNum = (ordinal || 0) + 1;
    const re = new RegExp('\\{\\{c' + clozeNum + '::([^}]*?)(?:::([^}]*?))?\\}\\}');
    const m = text.match(re);
    return m ? m[1] : '';
}

function showCurrentCard() {
    if (reviewIndex >= reviewQueue.length) { showSessionSummary(); return; }
    const card = reviewQueue[reviewIndex];
    reviewRevealed = false;
    card._showTime = Date.now();

    document.getElementById('reviewCounter').textContent = (reviewIndex + 1) + ' / ' + reviewQueue.length;
    document.getElementById('reviewProgress').style.width = ((reviewIndex / reviewQueue.length) * 100) + '%';

    const cardEl = document.getElementById('reviewCard');
    const actionsEl = document.getElementById('reviewActions');
    actionsEl.innerHTML = '';

    if (isCloze(card)) {
        // Cloze card — show text with blank
        const rendered = renderCloze(card.front, card.card_ordinal, false);
        cardEl.innerHTML = '<div class="card-front">' + rendered + '</div>'
            + '<div class="reveal-prompt">Press Space or tap to reveal</div>';
    } else if (isTypeIn(card)) {
        // Type-in card — show front + input field
        cardEl.innerHTML = '<div class="card-front">' + esc(card.front) + '</div>'
            + '<div class="type-answer-wrap">'
            + '<input type="text" class="type-answer-input" id="typeInput" placeholder="Type your answer..." autocomplete="off" autocapitalize="off" spellcheck="false">'
            + '<div id="typeResult"></div>'
            + '</div>';
        setTimeout(function() {
            var inp = document.getElementById('typeInput');
            if (inp) inp.focus();
        }, 100);
    } else {
        // Basic card — show front
        cardEl.innerHTML = '<div class="card-front">' + esc(card.front) + '</div>'
            + '<div class="reveal-prompt">Press Space or tap to reveal</div>';
    }
}

function revealAnswer() {
    if (reviewRevealed || reviewIndex >= reviewQueue.length) return;
    reviewRevealed = true;
    const card = reviewQueue[reviewIndex];
    const intervals = card.intervals || {};
    const cardEl = document.getElementById('reviewCard');

    if (isCloze(card)) {
        const rendered = renderCloze(card.front, card.card_ordinal, true);
        cardEl.innerHTML = '<div class="card-front">' + rendered + '</div>';
        if (card.back) {
            cardEl.innerHTML += '<div class="card-divider"></div><div class="card-back">' + esc(card.back) + '</div>';
        }
    } else if (isTypeIn(card)) {
        var inp = document.getElementById('typeInput');
        var userAnswer = inp ? inp.value.trim() : '';
        var correctAnswer = card.back || '';
        var isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();

        cardEl.innerHTML = '<div class="card-front">' + esc(card.front) + '</div>'
            + '<div class="card-divider"></div>'
            + '<div class="type-answer-result ' + (isCorrect ? 'correct' : 'incorrect') + '">'
            + (isCorrect
                ? 'Correct!'
                : 'Your answer: ' + esc(userAnswer) + '<span class="expected">Correct: ' + esc(correctAnswer) + '</span>')
            + '</div>';
        card._typeCorrect = isCorrect;
    } else {
        cardEl.innerHTML = '<div class="card-front">' + esc(card.front) + '</div>'
            + '<div class="card-divider"></div>'
            + '<div class="card-back">' + esc(card.back) + '</div>';
    }

    showRatingButtons(intervals);
}

function showRatingButtons(intervals) {
    document.getElementById('reviewActions').innerHTML =
        '<div class="rating-buttons">'
        + '<button class="rating-btn again" onclick="submitRating(1)"><span class="rating-label">Again</span><span class="rating-interval">' + (intervals[1] || '') + '</span></button>'
        + '<button class="rating-btn hard" onclick="submitRating(2)"><span class="rating-label">Hard</span><span class="rating-interval">' + (intervals[2] || '') + '</span></button>'
        + '<button class="rating-btn good" onclick="submitRating(3)"><span class="rating-label">Good</span><span class="rating-interval">' + (intervals[3] || '') + '</span></button>'
        + '<button class="rating-btn easy" onclick="submitRating(4)"><span class="rating-label">Easy</span><span class="rating-interval">' + (intervals[4] || '') + '</span></button>'
        + '</div>';
}

async function submitRating(rating) {
    const card = reviewQueue[reviewIndex];
    const responseMs = Date.now() - (card._showTime || Date.now());

    sessionStats.total++;
    if (rating >= 2) sessionStats.correct++;
    if (rating === 1) sessionStats.again++;

    try {
        const result = await api('POST', '/review', {
            card_id: card.card_id,
            rating,
            response_ms: responseMs,
        });

        if (result.new_state === 1 || result.new_state === 3) {
            const updatedCard = Object.assign({}, card, { state: result.new_state });
            try {
                const fresh = await api('GET', '/decks/' + currentDeckId + '/review?limit=1');
                const found = fresh.cards.find(function(c) { return c.card_id === card.card_id; });
                if (found) updatedCard.intervals = found.intervals;
            } catch (e) { /* use old intervals */ }
            reviewQueue.push(updatedCard);
        }

        reviewIndex++;
        showCurrentCard();
    } catch (e) { toast(e.message, 'error'); }
}

function showSessionSummary() {
    showView('summary');
    const elapsed = Math.round((Date.now() - sessionStats.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const pct = sessionStats.total > 0 ? Math.round(sessionStats.correct / sessionStats.total * 100) : 0;

    document.getElementById('summaryStats').innerHTML =
        '<div class="summary-stat"><div class="num">' + sessionStats.total + '</div><div class="label">Reviews</div></div>'
        + '<div class="summary-stat"><div class="num">' + pct + '%</div><div class="label">Correct</div></div>'
        + '<div class="summary-stat"><div class="num">' + mins + ':' + secs.toString().padStart(2, '0') + '</div><div class="label">Time</div></div>'
        + '<div class="summary-stat"><div class="num">' + sessionStats.again + '</div><div class="label">Again</div></div>';
}

function exitReview() {
    if (sessionStats.total > 0) { showSessionSummary(); }
    else { showDeckDetail(currentDeckId); }
}

// ── Browse ──
function showBrowse() {
    browsePage = 1;
    document.getElementById('browseSearch').value = '';
    showView('browse');
    loadBrowse();
}

async function loadBrowse() {
    if (!currentDeckId) return;
    const q = document.getElementById('browseSearch').value.trim();
    try {
        const data = await api('GET', '/decks/' + currentDeckId + '/browse?page=' + browsePage + '&per_page=50' + (q ? '&q=' + encodeURIComponent(q) : ''));
        const body = document.getElementById('browseBody');
        if (!data.cards.length) {
            body.innerHTML = '<tr><td colspan="6" style="color:var(--dim);text-align:center;padding:32px">No cards found</td></tr>';
        } else {
            body.innerHTML = data.cards.map(function(c) {
                var typeLabel = c.card_type === 'cloze' ? ' [cloze]' : (c.card_type === 'type_answer' ? ' [type]' : '');
                return '<tr>'
                    + '<td>' + esc(c.front.substring(0, 50)) + typeLabel + '</td>'
                    + '<td>' + esc(c.back.substring(0, 50)) + '</td>'
                    + '<td>' + STATE_NAMES[c.state] + '</td>'
                    + '<td>' + formatDue(c.due) + '</td>'
                    + '<td>' + (c.interval_days ? c.interval_days.toFixed(1) + 'd' : '-') + '</td>'
                    + '<td><button class="btn btn-sm btn-danger" onclick="deleteNote(' + c.note_id + ')">Del</button></td>'
                    + '</tr>';
            }).join('');
        }

        const pag = document.getElementById('browsePagination');
        if (data.pages > 1) {
            let html = '';
            for (let i = 1; i <= Math.min(data.pages, 20); i++) {
                html += '<button class="btn btn-sm' + (i === browsePage ? ' btn-primary' : '') + '" onclick="browsePage=' + i + ';loadBrowse()">' + i + '</button>';
            }
            pag.innerHTML = html;
        } else {
            pag.innerHTML = '';
        }
    } catch (e) { toast(e.message, 'error'); }
}

async function deleteNote(noteId) {
    if (!confirm('Delete this card?')) return;
    try {
        await api('DELETE', '/notes/' + noteId);
        toast('Card deleted');
        loadBrowse();
    } catch (e) { toast(e.message, 'error'); }
}

// ── Add Card ──
function showAdd() {
    document.getElementById('addFront').value = '';
    document.getElementById('addBack').value = '';
    document.getElementById('addTags').value = '';
    document.getElementById('addType').value = 'basic';
    updateAddFormHints();
    showView('add');
    document.getElementById('addFront').focus();
}

function updateAddFormHints() {
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
}

async function addCard(andNext) {
    const front = document.getElementById('addFront').value.trim();
    const back = document.getElementById('addBack').value.trim();
    const cardType = document.getElementById('addType').value;

    if (!front) return toast('Front/text required', 'error');
    if (cardType !== 'cloze' && !back) return toast('Back/answer required', 'error');
    if (cardType === 'cloze' && !/\{\{c\d+::/.test(front)) return toast('Cloze text must contain {{c1::answer}} deletions', 'error');

    const tags = document.getElementById('addTags').value.split(',').map(function(t) { return t.trim(); }).filter(Boolean);

    try {
        await api('POST', '/notes', {
            deck_id: currentDeckId,
            card_type: cardType,
            fields: { front: front, back: back },
            tags: tags,
        });
        toast('Card added');
        if (andNext) {
            document.getElementById('addFront').value = '';
            document.getElementById('addBack').value = '';
            document.getElementById('addFront').focus();
        } else {
            showDeckDetail(currentDeckId);
        }
    } catch (e) { toast(e.message, 'error'); }
}

// ── Import ──
async function loadImportLanguages() {
    try {
        const data = await api('GET', '/import/languages');
        const list = document.getElementById('importLangList');
        if (!data.languages.length) {
            list.innerHTML = '<li style="color:var(--dim)">No language courses available.</li>';
            return;
        }
        list.innerHTML = data.languages.map(function(l) {
            return '<li><div><span class="lang-name">' + esc(l.language) + '</span> <span class="drill-count">' + l.drill_count.toLocaleString() + ' drills</span></div>'
                + '<button class="btn btn-sm btn-primary" onclick="importLanguage(\'' + l.language + '\')">Import</button></li>';
        }).join('');
    } catch (e) {
        document.getElementById('importLangList').innerHTML = '<li style="color:var(--red)">Error loading languages</li>';
    }
}

async function importLanguage(lang) {
    if (!confirm('Import ' + lang + ' course drills?')) return;
    const btn = event.target;
    btn.textContent = 'Importing...';
    btn.disabled = true;
    try {
        const data = await api('POST', '/import/lang', { language: lang });
        toast('Imported ' + data.imported.toLocaleString() + ' cards to "' + data.deck_name + '"');
        btn.textContent = 'Done';
    } catch (e) {
        toast(e.message, 'error');
        btn.textContent = 'Import';
        btn.disabled = false;
    }
}

// ── Stats ──
async function loadStats() {
    try {
        const data = await api('GET', '/stats?days=90');
        document.getElementById('statsGrid').innerHTML =
            '<div class="stat-card"><div class="num">' + data.today.reviews + '</div><div class="label">Today</div></div>'
            + '<div class="stat-card"><div class="num">' + data.streak + '</div><div class="label">Day Streak</div></div>'
            + '<div class="stat-card"><div class="num">' + data.retention + '%</div><div class="label">Retention (30d)</div></div>'
            + '<div class="stat-card"><div class="num">' + data.total_reviews_30d + '</div><div class="label">Reviews (30d)</div></div>';

        const hm = document.getElementById('heatmap');
        const dailyMap = {};
        for (const d of data.daily) dailyMap[d.date] = d.reviews;

        let html = '';
        const today = new Date();
        for (let i = 89; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const count = dailyMap[key] || 0;
            let level = '';
            if (count > 0) level = count < 10 ? 'l1' : count < 30 ? 'l2' : count < 60 ? 'l3' : 'l4';
            html += '<div class="heatmap-cell ' + level + '" title="' + key + ': ' + count + ' reviews"></div>';
        }
        hm.innerHTML = html;
    } catch (e) { toast(e.message, 'error'); }
}

// ── Keyboard shortcuts ──
document.addEventListener('keydown', function(e) {
    const view = document.querySelector('.view.active');
    if (!view) return;
    const vid = view.id;

    // Don't capture when typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        // Exception: Enter in type-answer input reveals answer
        if (vid === 'view-review' && e.target.id === 'typeInput' && e.code === 'Enter') {
            e.preventDefault();
            revealAnswer();
        }
        return;
    }

    if (vid === 'view-review') {
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            if (!reviewRevealed) revealAnswer();
        }
        if (reviewRevealed) {
            if (e.key === '1') submitRating(1);
            if (e.key === '2') submitRating(2);
            if (e.key === '3') submitRating(3);
            if (e.key === '4') submitRating(4);
        }
        if (e.code === 'Escape') exitReview();
    }

    if (document.getElementById('newDeckModal').style.display === 'flex' && e.code === 'Enter') {
        createDeck();
    }
});

// ── Helpers ──
function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function formatDue(dueStr) {
    if (!dueStr) return '-';
    const due = new Date(dueStr);
    const now = new Date();
    const diff = (due - now) / 86400000;
    if (diff < 0) return '<span style="color:var(--red)">Overdue</span>';
    if (diff < 1) return '<span style="color:var(--orange)">Today</span>';
    if (diff < 2) return 'Tomorrow';
    if (diff < 30) return Math.round(diff) + 'd';
    if (diff < 365) return Math.round(diff / 30) + 'mo';
    return Math.round(diff / 365) + 'y';
}

// ── File Upload ──
function initUploadZone() {
    const zone = document.getElementById('uploadZone');
    const input = document.getElementById('fileInput');
    if (!zone || !input) return;

    zone.addEventListener('click', function() { input.click(); });
    zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', function() { zone.classList.remove('dragover'); });
    zone.addEventListener('drop', function(e) {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files.length) uploadFile(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', function() {
        if (input.files.length) uploadFile(input.files[0]);
        input.value = '';
    });
}

async function uploadFile(file) {
    const zone = document.getElementById('uploadZone');
    const status = document.getElementById('uploadStatus');
    const deckName = document.getElementById('importDeckName').value.trim();

    zone.classList.add('uploading');
    status.innerHTML = '<div class="upload-progress"><span class="filename">' + esc(file.name) + '</span> uploading...</div>';

    const formData = new FormData();
    formData.append('file', file);
    if (deckName) formData.append('deck_name', deckName);

    try {
        const t = getToken();
        const res = await fetch(API + '/import/file', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + t },
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        const decksInfo = data.decks_created && data.decks_created.length
            ? ' into ' + data.decks_created.map(function(d) { return '"' + d + '"'; }).join(', ')
            : data.deck_name ? ' into "' + data.deck_name + '"' : '';

        status.innerHTML = '<div class="upload-progress"><span class="result">'
            + data.imported + ' cards imported' + decksInfo + '</span>'
            + (data.skipped ? '<br><span style="color:var(--dim)">' + data.skipped + ' skipped</span>' : '')
            + '</div>';
        toast(data.imported + ' cards imported');
    } catch (e) {
        status.innerHTML = '<div class="upload-progress"><span class="error">' + esc(e.message) + '</span></div>';
        toast(e.message, 'error');
    }

    zone.classList.remove('uploading');
}

// ── Init ──
document.addEventListener('DOMContentLoaded', function() {
    initUploadZone();
    if (!getToken()) { location.href = '/?redirect=/cards/'; return; }
    showView('decks');
});
