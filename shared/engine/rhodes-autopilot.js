/**
 * Rhodes Universal Language Engine - Autopilot ("Just Continue") Module
 * State machine: IDLE -> DIALOGUE_1 -> DIALOGUE_2 -> DRILLS -> TRANSITIONING -> loop
 * User never navigates — hits one button, dialogue plays twice, drills start, next unit auto-advances.
 */

const RhodesAutopilot = {
  // State
  state: 'IDLE',
  active: false,
  currentUnitIndex: 0,
  unitOrder: [],
  abortController: null,
  _currentLineAudio: null,
  _escapeHandler: null,
  _phoneticsData: null,
  _phoneticsPromise: null,

  // =============================================
  // CORE API
  // =============================================

  start() {
    if (this.active) return;

    this.active = true;
    this.state = 'IDLE';
    this.abortController = new AbortController();

    this._loadPhonetics();
    this.buildUnitOrder();
    if (this.unitOrder.length === 0) {
      alert('No units with drills available.');
      this.active = false;
      return;
    }

    const saved = this.loadSavedPosition();
    if (saved !== null && saved < this.unitOrder.length) {
      this.currentUnitIndex = saved;
    } else {
      this.currentUnitIndex = this.findFirstIncompleteUnit();
    }

    // Global Escape handler (works during dialogue phase too, not just drills)
    this._escapeHandler = (e) => {
      if (e.key === 'Escape' && this.active) {
        e.preventDefault();
        e.stopPropagation();
        this.stop();
      }
    };
    document.addEventListener('keydown', this._escapeHandler, true);

    this.showActiveIndicator();

    const el = (id) => document.getElementById(id);
    if (el('linearView')) el('linearView').style.display = 'none';
    if (el('srsView')) el('srsView').style.display = 'none';
    if (el('autopilotSection')) el('autopilotSection').style.display = 'none';

    if (typeof RhodesVoice !== 'undefined' && RhodesVoice.handsFreeMode) {
      RhodesVoice.handsFreeMode = false;
      const cb = document.getElementById('handsFreeMode');
      if (cb) cb.checked = false;
    }

    this.processUnit(this.unitOrder[this.currentUnitIndex]);
  },

  stop() {
    if (!this.active) return;

    this.active = false;
    this.state = 'IDLE';

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Remove global escape handler
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler, true);
      this._escapeHandler = null;
    }

    this._stopLineAudio();
    if (typeof RhodesAudio !== 'undefined') RhodesAudio.stopAll();
    speechSynthesis.cancel();

    this.hideActiveIndicator();
    this.hideTransitionOverlay();
    this.hideFocusedDialogue();

    this.savePosition();

    this._showChrome();

    const el = (id) => document.getElementById(id);
    if (el('drillView')) el('drillView').classList.remove('active', 'fullscreen');
    if (el('unitDetailView')) el('unitDetailView').style.display = 'none';
    if (el('linearView')) el('linearView').style.display = 'block';
    if (el('autopilotSection')) el('autopilotSection').style.display = 'block';

    RhodesEngine.updateStatsBar();
    RhodesEngine.renderUnits();
    this.updateButtonLabel();
  },

  onDrillsComplete() {
    if (!this.active) return false;

    this._showChrome();

    const el = (id) => document.getElementById(id);
    if (el('drillView')) el('drillView').classList.remove('active', 'fullscreen');

    RhodesEngine.updateStatsBar();
    RhodesEngine.renderUnits();

    this.advanceToNextUnit();
    return true;
  },

  // =============================================
  // FLOW CONTROL
  // =============================================

  async processUnit(unitId) {
    if (!this.active) return;

    const cfg = window.COURSE_CONFIG;
    const unit = cfg.units?.find(u => u.id === unitId);
    if (!unit) { this.advanceToNextUnit(); return; }

    this.updateIndicatorUnit(unit);

    const hasDialogue = unit.dialogue && unit.dialogue.length > 0;

    if (hasDialogue) {
      // Hide unit detail view — we show our own focused dialogue
      const el = (id) => document.getElementById(id);
      if (el('unitDetailView')) el('unitDetailView').style.display = 'none';

      // Play 1 — show dialogue, no phonetics
      this.state = 'DIALOGUE_1';
      await this.showFocusedDialogue(unit, unitId, 1);
      if (!this.active) return;

      // Overlay stays visible — bridge plays over it
      await this.sleep(800);
      if (!this.active) return;

      // Bridge narration — phonetics inject mid-audio for units 1-8
      await this._playBridgeWithPhonetics(unitId, unit);
      if (!this.active) return;

      await this.sleep(500);
      if (!this.active) return;

      // Play 2 — replay lines on the SAME overlay (phonetics already visible)
      this.state = 'DIALOGUE_2';
      this._updatePlayLabel(2);
      // Reset all line highlights for fresh play
      const dialogue = unit.dialogue || [];
      this._highlightLine(-1, dialogue.length);
      await this._playDialogueLines(dialogue, unitId);
      if (!this.active) return;

      this.hideFocusedDialogue();

      await this.sleep(1000);
      if (!this.active) return;
    }

    // Start drills — clean view, no header/mode clutter
    this.state = 'DRILLS';
    this._hideChrome();

    const unitDrills = RhodesEngine.drillsData?.drills?.filter(d => d.unit === unitId) || [];
    if (unitDrills.length === 0) {
      this.advanceToNextUnit();
      return;
    }

    RhodesEngine.loadUnitDrills(unitId);
  },

  async advanceToNextUnit() {
    this.state = 'TRANSITIONING';
    this.currentUnitIndex++;

    if (this.currentUnitIndex >= this.unitOrder.length) {
      this.currentUnitIndex = 0;
    }

    this.savePosition();

    const nextUnitId = this.unitOrder[this.currentUnitIndex];
    const cfg = window.COURSE_CONFIG;
    const nextUnit = cfg.units?.find(u => u.id === nextUnitId);

    this.showTransitionOverlay(nextUnit);

    await this.sleep(2500);
    if (!this.active) return;

    this.hideTransitionOverlay();

    this.processUnit(nextUnitId);
  },

  // =============================================
  // FOCUSED DIALOGUE VIEW
  // =============================================

  /**
   * Show full-screen focused dialogue. Plays each line with highlight tracking.
   * Returns a promise that resolves when all lines finish.
   * User can click any line to replay it.
   */
  async showFocusedDialogue(unit, unitId, playNumber) {
    this.hideFocusedDialogue();

    const cfg = window.COURSE_CONFIG;
    const dialogue = unit.dialogue || [];
    if (dialogue.length === 0) return;

    const unitNum = String(unitId).padStart(2, '0');
    const titleTarget = unit.title_target || unit.title_fr || '';
    const titleSource = unit.title_source || unit.title_en || '';

    // Build the overlay
    const overlay = document.createElement('div');
    overlay.id = 'dialogueFocusView';
    overlay.className = 'dialogue-focus-overlay';

    let linesHtml = '';
    for (let i = 0; i < dialogue.length; i++) {
      const line = dialogue[i];
      const targetText = this._getLineTarget(line);
      const sourceText = this._getLineSource(line);
      const speaker = line.speaker || '';
      linesHtml += `
        <div class="dialogue-focus-line" data-line-index="${i}" id="dfLine${i}">
          <div class="dialogue-focus-speaker">${speaker}</div>
          <div class="dialogue-focus-target">${targetText}</div>
          <div class="dialogue-focus-source">${sourceText}</div>
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="dialogue-focus-container">
        <div class="dialogue-focus-header">
          <div class="dialogue-focus-unit">UNIT ${unitId}: ${titleTarget}</div>
          <div class="dialogue-focus-play-label">
            <span class="autopilot-pulse"></span>
            Listening (${playNumber}/2)
          </div>
        </div>
        <div class="dialogue-focus-lines" id="dialogueFocusLines">
          ${linesHtml}
        </div>
        <div class="dialogue-focus-footer">
          <span style="opacity:0.5;">Click any line to replay</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Wire click handlers for replay
    const lineEls = overlay.querySelectorAll('.dialogue-focus-line');
    lineEls.forEach((el, idx) => {
      el.addEventListener('click', () => {
        this._replayLine(unit, unitId, idx);
      });
    });

    // Speak unit intro announcement before lines play
    await this._speakIntro(unitId, titleSource, playNumber);
    if (!this.active) return;

    // Play through all lines sequentially with highlighting
    await this._playDialogueLines(dialogue, unitId);
  },

  hideFocusedDialogue() {
    const el = document.getElementById('dialogueFocusView');
    if (el) el.remove();
  },

  /**
   * Play dialogue lines one by one, highlighting each as it plays.
   */
  async _playDialogueLines(dialogue, unitId) {
    const unitNum = String(unitId).padStart(2, '0');

    for (let i = 0; i < dialogue.length; i++) {
      if (!this.active) return;

      // Highlight current line
      this._highlightLine(i, dialogue.length);

      // Play this line
      await this._playOneLine(dialogue[i], unitId, i);
      if (!this.active) return;

      // Brief pause between lines
      await this.sleep(400);
    }

    // Dim all lines at end
    this._highlightLine(-1, dialogue.length);
  },

  _highlightLine(activeIndex, totalLines) {
    for (let i = 0; i < totalLines; i++) {
      const el = document.getElementById(`dfLine${i}`);
      if (!el) continue;
      el.classList.remove('active', 'heard');
      if (i === activeIndex) {
        el.classList.add('active');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (i < activeIndex) {
        el.classList.add('heard');
      }
    }
  },

  /**
   * Play a single dialogue line — try per-line MP3, fall back to TTS.
   * Uses async/await to avoid callback race conditions.
   */
  async _playOneLine(line, unitId, lineIndex) {
    const cfg = window.COURSE_CONFIG;
    const unitNum = String(unitId).padStart(2, '0');
    const lineNum = String(lineIndex).padStart(2, '0');
    const text = this._getLineTarget(line);

    if (!text) return;

    // Build possible audio paths (deduped)
    const seen = new Set();
    const paths = [];
    const addPath = (p) => { if (!seen.has(p)) { seen.add(p); paths.push(p); } };

    if (cfg.audio?.dialogues) {
      addPath(`${cfg.audio.dialogues}unit${unitNum}_line${lineNum}.mp3`);
    }
    addPath(`audio/dialogues/formal/unit${unitNum}_line${lineNum}.mp3`);
    addPath(`audio/dialogues/informal/unit${unitNum}_line${lineNum}.mp3`);
    addPath(`audio/unit${unitNum}_line${lineNum}.mp3`);

    // Try each MP3 path sequentially
    for (const path of paths) {
      if (!this.active) return;
      const result = await this._tryPlayAudio(path);
      if (result === 'played') return;
      if (result === 'aborted') return;
      // 'error' → try next path
    }

    // All MP3 paths failed — TTS fallback
    if (!this.active) return;
    await this._ttsLineAsync(text, cfg?.langCode || 'fr-FR');
  },

  /**
   * Attempt to play a single audio file. Returns 'played', 'error', or 'aborted'.
   * Only one resolution path can fire — no race conditions.
   */
  _tryPlayAudio(path) {
    return new Promise((resolve) => {
      let resolved = false;
      const done = (result) => { if (!resolved) { resolved = true; resolve(result); } };

      const audio = new Audio();
      this._currentLineAudio = audio;

      audio.onended = () => {
        this._currentLineAudio = null;
        done('played');
      };

      audio.onerror = () => {
        this._currentLineAudio = null;
        done('error');
      };

      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', () => {
          audio.pause();
          this._currentLineAudio = null;
          done('aborted');
        }, { once: true });
      }

      audio.src = path;
      audio.play().catch(() => {
        this._currentLineAudio = null;
        done('error');
      });
    });
  },

  /**
   * Play pre-generated ElevenLabs intro MP3 before dialogue.
   * Unit 1 gets the long welcome; other units get short "Unit X" intro.
   * Falls back to TTS only if MP3 doesn't exist.
   */
  async _speakIntro(unitId, titleSource, playNumber) {
    if (playNumber !== 1) return;

    const unitNum = String(unitId).padStart(2, '0');
    const path = `audio/intro/unit${unitNum}.mp3`;

    const result = await this._tryPlayAudio(path);
    if (result === 'played' || result === 'aborted') return;

    // Fallback to browser TTS if MP3 missing
    const text = `Unit ${unitId}. Please listen to this conversation and familiarize yourself with its sounds.`;
    await this._ttsLineAsync(text, 'en-US');
  },

  /**
   * Bridge narration between play 1 and play 2.
   * Units 1-8: full bridge with phonetics injected mid-audio.
   * Units 9+: short "Now listen again."
   */
  async _playBridgeWithPhonetics(unitId, unit) {
    const unitNum = String(unitId).padStart(2, '0');

    if (unitId <= 8) {
      // Preload phonetics
      await this._loadPhonetics();
      const phonetics = this._getPhonetics(unitId);

      // Start bridge audio (don't await — we inject phonetics mid-playback)
      const bridgePath = `audio/intro/bridge_unit${unitNum}.mp3`;
      const bridgePromise = this._tryPlayAudio(bridgePath).then(result => {
        if (result !== 'played' && result !== 'aborted') {
          // TTS fallback — inject phonetics after 2s, then speak
          return this._ttsLineAsync(
            "That was an earful. Now look at the words that just appeared on the screen. " +
            "These are the French words you just heard, written in English sounds. " +
            "Don't try to pronounce them yet, but keep track, and imagine yourself pronouncing them. " +
            "Now listen again.", 'en-US');
        }
      });

      // ~2s in, narrator says "look at the words" — inject phonetics now
      await this.sleep(2000);
      if (this.active && phonetics) {
        this._injectPhonetics(unit, phonetics);
      }

      // Wait for bridge audio to finish
      await bridgePromise;
    } else {
      // Short bridge for later chapters
      const path = `audio/intro/bridge_short.mp3`;
      const result = await this._tryPlayAudio(path);
      if (result !== 'played' && result !== 'aborted') {
        await this._ttsLineAsync('Now listen again.', 'en-US');
      }
    }
  },

  /**
   * Inject phonetic approximations into the existing dialogue overlay with fade-in.
   */
  _injectPhonetics(unit, phonetics) {
    const dialogue = unit.dialogue || [];
    for (let i = 0; i < dialogue.length; i++) {
      const lineEl = document.getElementById(`dfLine${i}`);
      if (!lineEl || !phonetics[i]) continue;
      // Don't double-inject
      if (lineEl.querySelector('.dialogue-focus-phonetic')) continue;

      const phoneticEl = document.createElement('div');
      phoneticEl.className = 'dialogue-focus-phonetic phonetic-fade-in';
      phoneticEl.textContent = phonetics[i];

      // Insert after target text, before source text
      const sourceEl = lineEl.querySelector('.dialogue-focus-source');
      if (sourceEl) {
        lineEl.insertBefore(phoneticEl, sourceEl);
      } else {
        lineEl.appendChild(phoneticEl);
      }
    }
  },

  /** Update the "Listening (X/2)" label on the existing overlay */
  _updatePlayLabel(playNumber) {
    const label = document.querySelector('.dialogue-focus-play-label');
    if (label) {
      label.innerHTML = `<span class="autopilot-pulse"></span> Listening (${playNumber}/2)`;
    }
  },

  /** Promise-based TTS fallback */
  _ttsLineAsync(text, langCode) {
    return new Promise((resolve) => {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 0.85;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', () => {
          speechSynthesis.cancel();
          resolve();
        }, { once: true });
      }

      speechSynthesis.speak(utterance);
    });
  },

  _stopLineAudio() {
    if (this._currentLineAudio) {
      this._currentLineAudio.pause();
      this._currentLineAudio.src = '';
      this._currentLineAudio = null;
    }
    speechSynthesis.cancel();
  },

  /**
   * Replay a single line when user clicks it (outside of the sequential flow).
   */
  _replayLine(unit, unitId, lineIndex) {
    const line = unit.dialogue?.[lineIndex];
    if (!line) return;

    // Stop any current playback
    this._stopLineAudio();

    // Highlight this line
    this._highlightLine(lineIndex, unit.dialogue.length);

    // Play it
    this._playOneLine(line, unitId, lineIndex).then(() => {
      // After replay, un-highlight (back to heard state)
      const el = document.getElementById(`dfLine${lineIndex}`);
      if (el) {
        el.classList.remove('active');
        el.classList.add('heard');
      }
    });
  },

  // =============================================
  // PHONETIC APPROXIMATIONS
  // =============================================

  /** Load phonetics data from JSON file (once, with dedup) */
  async _loadPhonetics() {
    if (this._phoneticsData) return;
    if (this._phoneticsPromise) return this._phoneticsPromise;
    this._phoneticsPromise = (async () => {
      try {
        const resp = await fetch('data/phonetics.json');
        if (resp.ok) {
          this._phoneticsData = await resp.json();
          console.log('Loaded phonetics:', Object.keys(this._phoneticsData).length, 'units');
        }
      } catch (e) {
        console.warn('No phonetics data available');
      }
    })();
    return this._phoneticsPromise;
  },

  /** Get phonetics array for a unit, or null */
  _getPhonetics(unitId) {
    if (!this._phoneticsData) return null;
    return this._phoneticsData[String(unitId)] || null;
  },

  // =============================================
  // UNIT ORDER & PROGRESS
  // =============================================

  buildUnitOrder() {
    const cfg = window.COURSE_CONFIG;
    const units = cfg.units || [];

    this.unitOrder = [];
    for (const unit of units) {
      if (unit.noDrills) continue;
      if (RhodesEngine.drillsData) {
        const unitDrills = RhodesEngine.drillsData.drills.filter(d => d.unit === unit.id);
        if (unitDrills.length === 0) continue;
      }
      this.unitOrder.push(unit.id);
    }
  },

  findFirstIncompleteUnit() {
    for (let i = 0; i < this.unitOrder.length; i++) {
      const progress = RhodesEngine.getUnitProgress(this.unitOrder[i]);
      if (progress < 100) return i;
    }
    return 0;
  },

  // =============================================
  // STORAGE
  // =============================================

  _storageKey() {
    return (window.COURSE_CONFIG?.storage?.progress || 'rhodes_course') + '_autopilot';
  },

  savePosition() {
    try {
      localStorage.setItem(this._storageKey(), JSON.stringify({
        unitIndex: this.currentUnitIndex,
        unitId: this.unitOrder[this.currentUnitIndex],
        timestamp: Date.now()
      }));
    } catch (e) {}
  },

  loadSavedPosition() {
    try {
      const saved = JSON.parse(localStorage.getItem(this._storageKey()));
      if (!saved) return null;
      if (saved.unitId !== undefined) {
        const idx = this.unitOrder.indexOf(saved.unitId);
        if (idx !== -1) return idx;
      }
      return saved.unitIndex ?? null;
    } catch (e) { return null; }
  },

  // =============================================
  // UTILITY
  // =============================================

  /** Get the dialogue target-language field key (fr, it, de, es, ru) from config */
  _getLangKey() {
    const cfg = window.COURSE_CONFIG;
    return (cfg?.langCode || 'fr-FR').split('-')[0];
  },

  /** Get target text from a dialogue line using the config's language key */
  _getLineTarget(line) {
    const key = this._getLangKey();
    return line[key] || line.target || line.fr || '';
  },

  /** Get source text from a dialogue line */
  _getLineSource(line) {
    return line.en || line.source || '';
  },

  sleep(ms) {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          resolve();
        }, { once: true });
      }
    });
  },

  // =============================================
  // UI
  // =============================================

  /** Hide header, mode selector, stats bar during drills for clean autopilot view */
  _hideChrome() {
    const hide = (sel) => { const el = document.querySelector(sel); if (el) el.style.display = 'none'; };
    hide('.header-wrapper');
    hide('.mode-selector');
    hide('#stats-bar');
    hide('#authSection');
    // Scroll to top so drill view is at top of page
    window.scrollTo(0, 0);
  },

  /** Restore header, mode selector, stats bar */
  _showChrome() {
    const show = (sel, d) => { const el = document.querySelector(sel); if (el) el.style.display = d || ''; };
    show('.header-wrapper');
    show('.mode-selector');
    show('#stats-bar');
  },

  showActiveIndicator() {
    this.hideActiveIndicator();

    const bar = document.createElement('div');
    bar.id = 'autopilotBar';
    bar.innerHTML = `
      <div class="autopilot-bar">
        <span class="autopilot-pulse"></span>
        <span>AUTOPILOT</span>
        <span id="autopilotUnitInfo" style="opacity:0.8;"></span>
        <button id="stopAutopilotBtn" class="btn" style="padding:4px 14px;font-size:14px;border-color:white;color:white;background:rgba(255,255,255,0.15);">STOP</button>
      </div>
    `;
    document.body.prepend(bar);

    document.getElementById('stopAutopilotBtn').onclick = () => this.stop();

    document.body.style.paddingTop = '44px';
  },

  hideActiveIndicator() {
    const bar = document.getElementById('autopilotBar');
    if (bar) bar.remove();
    document.body.style.paddingTop = '';
  },

  updateIndicatorUnit(unit) {
    const info = document.getElementById('autopilotUnitInfo');
    if (info && unit) {
      info.textContent = `Unit ${unit.id}: ${unit.title_target || unit.title_fr || ''}`;
    }
  },

  showTransitionOverlay(unit) {
    this.hideTransitionOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'autopilotTransition';

    const titleTarget = unit?.title_target || unit?.title_fr || '';
    const titleSource = unit?.title_source || unit?.title_en || '';

    overlay.innerHTML = `
      <div class="autopilot-transition">
        <div class="autopilot-transition-icon">&gt;&gt;</div>
        <div class="autopilot-transition-text">UNIT ${unit?.id || '?'}</div>
        <div class="autopilot-transition-title">${titleTarget}</div>
        <div class="autopilot-transition-sub">${titleSource}</div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  hideTransitionOverlay() {
    const el = document.getElementById('autopilotTransition');
    if (el) el.remove();
  },

  updateButtonLabel() {
    const btn = document.getElementById('justContinueBtn');
    if (!btn) return;

    this.buildUnitOrder();
    const saved = this.loadSavedPosition();
    const cfg = window.COURSE_CONFIG;

    if (saved !== null && saved < this.unitOrder.length) {
      const unitId = this.unitOrder[saved];
      const unit = cfg.units?.find(u => u.id === unitId);
      if (unit) {
        btn.innerHTML = `JUST CONTINUE<br><span style="font-size:14px;letter-spacing:0;opacity:0.8;">from Unit ${unit.id}: ${unit.title_target || unit.title_fr || ''}</span>`;
        return;
      }
    }

    const firstIncomplete = this.findFirstIncompleteUnit();
    if (this.unitOrder.length > 0) {
      const unitId = this.unitOrder[firstIncomplete];
      const unit = cfg.units?.find(u => u.id === unitId);
      if (unit) {
        btn.innerHTML = `JUST CONTINUE<br><span style="font-size:14px;letter-spacing:0;opacity:0.8;">Unit ${unit.id}: ${unit.title_target || unit.title_fr || ''}</span>`;
        return;
      }
    }

    btn.textContent = 'JUST CONTINUE';
  }
};

window.RhodesAutopilot = RhodesAutopilot;
