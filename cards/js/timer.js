/* RhodesCards — Speed Focus Mode + Pomodoro Timer */

// ── Speed Focus (auto-reveal, auto-advance) ──

RC.speedFocus = {
    enabled: false,
    revealMs: 8000,    // auto-reveal after 8s
    advanceMs: 4000,   // auto-advance after 4s (with Good rating)
    timerReveal: null,
    timerAdvance: null,
    timerEl: null,
    startTime: 0,
};

RC.getSpeedSettings = function() {
    try {
        var saved = localStorage.getItem('rc_speed_focus');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { enabled: false, revealMs: 8000, advanceMs: 4000, autoRating: 3 };
};

RC.toggleSpeedFocus = function() {
    var s = RC.getSpeedSettings();
    s.enabled = !s.enabled;
    localStorage.setItem('rc_speed_focus', JSON.stringify(s));
    RC.speedFocus.enabled = s.enabled;
    RC.speedFocus.revealMs = s.revealMs;
    RC.speedFocus.advanceMs = s.advanceMs;
    RC.toast(s.enabled ? 'Speed Focus ON' : 'Speed Focus OFF');
    if (!s.enabled) RC.clearSpeedTimers();
};

RC.startSpeedTimer = function() {
    var s = RC.getSpeedSettings();
    if (!s.enabled) return;
    RC.clearSpeedTimers();
    RC.speedFocus.startTime = Date.now();

    // Show countdown
    var timerEl = document.getElementById('speedTimer');
    if (timerEl) {
        timerEl.style.display = 'block';
        timerEl.style.width = '100%';
        timerEl.style.transition = 'width ' + (s.revealMs / 1000) + 's linear';
        setTimeout(function() { timerEl.style.width = '0%'; }, 50);
    }

    RC.speedFocus.timerReveal = setTimeout(function() {
        if (!RC.reviewRevealed) RC.revealAnswer();
    }, s.revealMs);
};

RC.startAdvanceTimer = function() {
    var s = RC.getSpeedSettings();
    if (!s.enabled) return;

    var timerEl = document.getElementById('speedTimer');
    if (timerEl) {
        timerEl.style.width = '100%';
        timerEl.style.transition = 'width ' + (s.advanceMs / 1000) + 's linear';
        timerEl.style.background = 'var(--green)';
        setTimeout(function() { timerEl.style.width = '0%'; }, 50);
    }

    RC.speedFocus.timerAdvance = setTimeout(function() {
        RC.submitRating(s.autoRating || 3);
    }, s.advanceMs);
};

RC.clearSpeedTimers = function() {
    if (RC.speedFocus.timerReveal) clearTimeout(RC.speedFocus.timerReveal);
    if (RC.speedFocus.timerAdvance) clearTimeout(RC.speedFocus.timerAdvance);
    RC.speedFocus.timerReveal = null;
    RC.speedFocus.timerAdvance = null;
    var timerEl = document.getElementById('speedTimer');
    if (timerEl) {
        timerEl.style.display = 'none';
        timerEl.style.background = 'var(--cyan)';
    }
};

// ── Pomodoro Timer ──

RC.pomodoro = {
    running: false,
    mode: 'work',  // 'work' or 'break'
    workMs: 25 * 60 * 1000,
    breakMs: 5 * 60 * 1000,
    longBreakMs: 15 * 60 * 1000,
    sessionsCompleted: 0,
    timer: null,
    endTime: 0,
};

RC.getPomodoroSettings = function() {
    try {
        var saved = localStorage.getItem('rc_pomodoro');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { workMin: 25, breakMin: 5, longBreakMin: 15, longBreakAfter: 4 };
};

RC.startPomodoro = function() {
    if (RC.pomodoro.running) { RC.stopPomodoro(); return; }

    var s = RC.getPomodoroSettings();
    RC.pomodoro.workMs = s.workMin * 60000;
    RC.pomodoro.breakMs = s.breakMin * 60000;
    RC.pomodoro.longBreakMs = s.longBreakMin * 60000;

    RC.pomodoro.mode = 'work';
    RC.pomodoro.running = true;
    RC.pomodoro.endTime = Date.now() + RC.pomodoro.workMs;

    RC._updatePomodoroDisplay();
    RC.pomodoro.timer = setInterval(RC._updatePomodoroDisplay, 1000);
    RC.toast('Pomodoro started: ' + s.workMin + ' min');
};

RC.stopPomodoro = function() {
    RC.pomodoro.running = false;
    if (RC.pomodoro.timer) clearInterval(RC.pomodoro.timer);
    RC.pomodoro.timer = null;
    var el = document.getElementById('pomodoroDisplay');
    if (el) el.textContent = '';
    RC.toast('Pomodoro stopped');
};

RC._updatePomodoroDisplay = function() {
    var remaining = Math.max(0, RC.pomodoro.endTime - Date.now());
    var mins = Math.floor(remaining / 60000);
    var secs = Math.floor((remaining % 60000) / 1000);

    var el = document.getElementById('pomodoroDisplay');
    if (el) {
        var icon = RC.pomodoro.mode === 'work' ? '&#127813; ' : '&#9749; ';
        el.innerHTML = icon + mins + ':' + secs.toString().padStart(2, '0');
        el.className = 'pomodoro-display ' + RC.pomodoro.mode;
    }

    if (remaining <= 0) {
        clearInterval(RC.pomodoro.timer);
        if (RC.pomodoro.mode === 'work') {
            RC.pomodoro.sessionsCompleted++;
            var s = RC.getPomodoroSettings();
            var isLongBreak = RC.pomodoro.sessionsCompleted % (s.longBreakAfter || 4) === 0;
            RC.pomodoro.mode = 'break';
            RC.pomodoro.endTime = Date.now() + (isLongBreak ? RC.pomodoro.longBreakMs : RC.pomodoro.breakMs);
            RC.toast(isLongBreak ? 'Long break! ' + s.longBreakMin + ' min' : 'Break! ' + s.breakMin + ' min');
        } else {
            RC.pomodoro.mode = 'work';
            RC.pomodoro.endTime = Date.now() + RC.pomodoro.workMs;
            RC.toast('Back to work!');
        }
        RC.pomodoro.timer = setInterval(RC._updatePomodoroDisplay, 1000);
    }
};
