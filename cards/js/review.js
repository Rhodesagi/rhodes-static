/* RhodesCards — Review session with undo, TTS, voice, speed focus */

RC.reviewQueue = [];
RC.reviewIndex = 0;
RC.reviewRevealed = false;
RC.sessionStats = { total: 0, correct: 0, again: 0, startTime: 0 };
RC.lastReviewCardId = null;

RC.startReview = async function() {
    if (!RC.currentDeckId) return;
    try {
        var data = await RC.api('GET', '/decks/' + RC.currentDeckId + '/review?limit=20');
        RC.reviewQueue = data.cards;
        if (!RC.reviewQueue.length) { RC.toast('No cards due', 'error'); return; }
        RC.reviewIndex = 0;
        RC.reviewRevealed = false;
        RC.lastReviewCardId = null;
        RC.sessionStats = { total: 0, correct: 0, again: 0, startTime: Date.now() };
        RC.resetETA();
        RC.showView('review');
        RC.showCurrentCard();
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC.isCloze = function(card) {
    return card.card_type === 'cloze' || (card.front && /\{\{c\d+::/.test(card.front));
};

RC.isTypeIn = function(card) {
    return card.card_type === 'type_answer' || card.type_answer === true;
};

RC.showCurrentCard = function() {
    if (RC.reviewIndex >= RC.reviewQueue.length) { RC.showSessionSummary(); return; }
    var card = RC.reviewQueue[RC.reviewIndex];
    RC.reviewRevealed = false;
    card._showTime = Date.now();
    RC.stopTTS();
    RC.clearSpeedTimers();

    document.getElementById('reviewCounter').textContent = (RC.reviewIndex + 1) + ' / ' + RC.reviewQueue.length;
    document.getElementById('reviewProgress').style.width = ((RC.reviewIndex / RC.reviewQueue.length) * 100) + '%';

    var cardEl = document.getElementById('reviewCard');
    var actionsEl = document.getElementById('reviewActions');
    actionsEl.innerHTML = '';

    // Remove any lingering flash class
    cardEl.className = 'review-card';

    var undoHtml = RC.lastReviewCardId ? '<button class="btn btn-sm" onclick="RC.undoReview()" style="position:absolute;right:0;top:0;color:var(--dim)" title="Undo (Z)">Undo</button>' : '';
    var ttsBtn = '<button class="tts-btn" onclick="event.stopPropagation();RC.speakText(RC.reviewQueue[RC.reviewIndex].front)" title="Read aloud">&#128264;</button>';

    if (RC.isCloze(card)) {
        var rendered = RC.renderClozeContent(card.front, card.card_ordinal, false);
        cardEl.innerHTML = undoHtml + '<div class="card-front">' + rendered + '</div>'
            + '<div class="card-tools">' + ttsBtn + '</div>'
            + '<div class="reveal-prompt">Press Space or tap to reveal</div>';
    } else if (RC.isTypeIn(card)) {
        var voiceBtn = (RC.voiceState && RC.voiceState.supported) ? RC.voiceButton('typeInput') : '';
        cardEl.innerHTML = undoHtml + '<div class="card-front">' + RC.renderCardContent(card.front) + '</div>'
            + '<div class="card-tools">' + ttsBtn + '</div>'
            + '<div class="type-answer-wrap">'
            + '<div style="display:flex;gap:8px;align-items:center">'
            + '<input type="text" class="type-answer-input" id="typeInput" placeholder="Type your answer..." autocomplete="off" autocapitalize="off" spellcheck="false">'
            + voiceBtn
            + '</div>'
            + '<div id="typeResult"></div>'
            + '</div>';
        setTimeout(function() { var inp = document.getElementById('typeInput'); if (inp) inp.focus(); }, 100);
    } else {
        cardEl.innerHTML = undoHtml + '<div class="card-front">' + RC.renderCardContent(card.front) + '</div>'
            + '<div class="card-tools">' + ttsBtn + '</div>'
            + '<div class="reveal-prompt">Press Space or tap to reveal</div>';
    }
    RC.renderMath(cardEl);
    RC.autoPlayTTS(card.front, false);
    RC.startSpeedTimer();
    RC.updateETA();
};

RC.revealAnswer = function() {
    if (RC.reviewRevealed || RC.reviewIndex >= RC.reviewQueue.length) return;
    RC.reviewRevealed = true;
    RC.clearSpeedTimers();
    var card = RC.reviewQueue[RC.reviewIndex];
    var intervals = card.intervals || {};
    var cardEl = document.getElementById('reviewCard');
    var ttsBtn = '<button class="tts-btn" onclick="event.stopPropagation();RC.speakText(RC.reviewQueue[RC.reviewIndex].back)" title="Read answer">&#128264;</button>';

    if (RC.isCloze(card)) {
        var rendered = RC.renderClozeContent(card.front, card.card_ordinal, true);
        cardEl.innerHTML = '<div class="card-front">' + rendered + '</div>';
        if (card.back) {
            cardEl.innerHTML += '<div class="card-divider"></div><div class="card-back">' + RC.renderCardContent(card.back) + ttsBtn + '</div>';
        }
    } else if (RC.isTypeIn(card)) {
        var inp = document.getElementById('typeInput');
        var userAnswer = inp ? inp.value.trim() : '';
        var correctAnswer = card.back || '';
        var isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();

        cardEl.innerHTML = '<div class="card-front">' + RC.renderCardContent(card.front) + '</div>'
            + '<div class="card-divider"></div>'
            + '<div class="type-answer-result ' + (isCorrect ? 'correct' : 'incorrect') + '">'
            + (isCorrect
                ? 'Correct!'
                : 'Your answer: ' + RC.esc(userAnswer) + '<span class="expected">Correct: ' + RC.esc(correctAnswer) + '</span>')
            + '</div>';
        card._typeCorrect = isCorrect;
    } else {
        cardEl.innerHTML = '<div class="card-front">' + RC.renderCardContent(card.front) + '</div>'
            + '<div class="card-divider"></div>'
            + '<div class="card-back">' + RC.renderCardContent(card.back) + ttsBtn + '</div>';
    }

    RC.renderMath(cardEl);
    RC.showRatingButtons(intervals);
    RC.autoPlayTTS(card.back, true);
    RC.startAdvanceTimer();
};

RC.showRatingButtons = function(intervals) {
    document.getElementById('reviewActions').innerHTML =
        '<div class="rating-buttons">'
        + '<button class="rating-btn again" onclick="RC.submitRating(1)"><span class="rating-label">Again</span><span class="rating-interval">' + (intervals[1] || '') + '</span></button>'
        + '<button class="rating-btn hard" onclick="RC.submitRating(2)"><span class="rating-label">Hard</span><span class="rating-interval">' + (intervals[2] || '') + '</span></button>'
        + '<button class="rating-btn good" onclick="RC.submitRating(3)"><span class="rating-label">Good</span><span class="rating-interval">' + (intervals[3] || '') + '</span></button>'
        + '<button class="rating-btn easy" onclick="RC.submitRating(4)"><span class="rating-label">Easy</span><span class="rating-interval">' + (intervals[4] || '') + '</span></button>'
        + '</div>';
};

RC.submitRating = async function(rating) {
    RC.clearSpeedTimers();
    var card = RC.reviewQueue[RC.reviewIndex];
    var responseMs = Date.now() - (card._showTime || Date.now());

    RC.sessionStats.total++;
    if (rating >= 2) RC.sessionStats.correct++;
    if (rating === 1) RC.sessionStats.again++;

    // Record time for ETA calculation
    RC.recordCardTime(responseMs);

    // Answer flash
    var flashClass = ['', 'flash-again', 'flash-hard', 'flash-good', 'flash-easy'][rating] || '';
    if (flashClass) {
        var cardEl = document.getElementById('reviewCard');
        cardEl.classList.add(flashClass);
    }

    try {
        var result = await RC.api('POST', '/review', {
            card_id: card.card_id,
            rating: rating,
            response_ms: responseMs,
        });

        RC.lastReviewCardId = card.card_id;

        if (result.new_state === 1 || result.new_state === 3) {
            var updatedCard = Object.assign({}, card, { state: result.new_state });
            try {
                var fresh = await RC.api('GET', '/decks/' + RC.currentDeckId + '/review?limit=1');
                var found = fresh.cards.find(function(c) { return c.card_id === card.card_id; });
                if (found) updatedCard.intervals = found.intervals;
            } catch (e) {}
            RC.reviewQueue.push(updatedCard);
        }

        RC.reviewIndex++;
        RC.showCurrentCard();
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC.undoReview = async function() {
    if (!RC.lastReviewCardId) return;
    try {
        await RC.api('POST', '/review/undo');
        RC.toast('Review undone');
        RC.lastReviewCardId = null;
        RC.sessionStats.total = Math.max(0, RC.sessionStats.total - 1);
        if (RC.reviewIndex > 0) {
            RC.reviewIndex--;
            if (RC.reviewQueue.length > RC.reviewIndex + 1) {
                var lastCard = RC.reviewQueue[RC.reviewQueue.length - 1];
                if (lastCard.card_id === RC.reviewQueue[RC.reviewIndex].card_id) {
                    RC.reviewQueue.pop();
                }
            }
        }
        RC.showCurrentCard();
    } catch (e) { RC.toast(e.message, 'error'); }
};

RC.showSessionSummary = function() {
    RC.clearSpeedTimers();
    RC.stopTTS();
    RC.showView('summary');
    var elapsed = Math.round((Date.now() - RC.sessionStats.startTime) / 1000);
    var mins = Math.floor(elapsed / 60);
    var secs = elapsed % 60;
    var pct = RC.sessionStats.total > 0 ? Math.round(RC.sessionStats.correct / RC.sessionStats.total * 100) : 0;

    document.getElementById('summaryStats').innerHTML =
        '<div class="summary-stat"><div class="num">' + RC.sessionStats.total + '</div><div class="label">Reviews</div></div>'
        + '<div class="summary-stat"><div class="num">' + pct + '%</div><div class="label">Correct</div></div>'
        + '<div class="summary-stat"><div class="num">' + mins + ':' + secs.toString().padStart(2, '0') + '</div><div class="label">Time</div></div>'
        + '<div class="summary-stat"><div class="num">' + RC.sessionStats.again + '</div><div class="label">Again</div></div>';
};

RC.exitReview = function() {
    RC.clearSpeedTimers();
    RC.stopTTS();
    // Exit fullscreen if active
    if (document.fullscreenElement) document.exitFullscreen();
    if (RC.sessionStats.total > 0) { RC.showSessionSummary(); }
    else { RC.showDeckDetail(RC.currentDeckId); }
};
