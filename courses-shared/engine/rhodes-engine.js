/**
 * Rhodes Universal Language Engine - Core Engine
 * Orchestrates: init, loadCourse, drill loop, events, rendering
 * All language-specific data comes from window.COURSE_CONFIG
 */

const RhodesEngine = {
  // State
  courseData: null,
  drillsData: null,
  audioMapping: null,
  currentMode: 'linear',
  currentUnit: null,
  currentDrillIndex: 0,
  currentDrills: [],
  register: 'formal',
  drillMode: 'translate',
  drillDirection: 'en-fr',
  sessionCorrect: 0,
  sessionTotal: 0,
  retryMode: false,
  retryExpected: '',
  // Substitution drill cue tracking
  currentCueIndex: 0,
  // Minimal pair tracking
  _minimalPairTarget: null,

  // Config-driven (fallbacks for backward compat)
  get REVIEW_UNITS() {
    return this.cfg().reviewUnits || [6, 12, 18, 24];
  },

  // =============================================
  // CONFIG HELPERS
  // =============================================

  cfg() { return window.COURSE_CONFIG || {}; },

  // Get the target-language text from a drill item
  getTarget(drill) {
    const cfg = this.cfg();
    const fields = cfg.fields || {};
    if (this.register === 'informal' && fields.targetInformal) {
      const val = drill[fields.targetInformal];
      if (val) return val;
    }
    return drill[fields.target || fields.targetFormal || 'french_formal'] ||
           drill[fields.targetFormal || 'french_formal'] ||
           drill.french || drill.target || '';
  },

  // Get source (English) text
  getSource(drill) {
    const fields = this.cfg().fields || {};
    return drill[fields.source || 'english'] || drill.english || '';
  },

  // Convert formal to informal
  convertToInformal(text) {
    const fn = this.cfg().convertToInformal;
    return fn ? fn(text) : text;
  },

  // =============================================
  // CDN / DATA LOADING
  // =============================================

  cdnUrl(path) { return RhodesAudio.cdnUrl(path); },

  async fetchWithFallback(path) { return RhodesAudio.fetchWithFallback(path); },

  // =============================================
  // INITIALIZATION
  // =============================================

  async loadCourse() {
    const cfg = this.cfg();

    try {
      await RhodesStorage.init();
      console.log('Storage initialized');
      if (typeof RhodesLinear !== 'undefined') {
        await RhodesLinear.init({ units: [] });
        console.log('RhodesLinear initialized');
      }
    } catch (initErr) {
      console.error('Init error:', initErr);
      const grid = document.getElementById('unitsGrid');
      if (grid) grid.innerHTML = `<div style="color:red;padding:20px;">Init Error: ${initErr.message}</div>`;
    }

    this.renderUnits();

    try {
      const dataPath = cfg.data?.drills || 'data/drills.json';
      console.log('Loading drills from', dataPath);
      const drillsRes = await this.fetchWithFallback(dataPath);
      this.drillsData = await drillsRes.json();
      console.log('Loaded drills:', this.drillsData.total_drills || this.drillsData.drills?.length);

      // Load audio mapping if configured
      if (cfg.features?.hasAudioMapping !== false && cfg.data?.audioMapping) {
        try {
          const mappingRes = await this.fetchWithFallback(cfg.data.audioMapping);
          this.audioMapping = await mappingRes.json();
          console.log('Loaded audio mapping:', Object.keys(this.audioMapping).length);
        } catch (e) {
          console.warn('Audio mapping not found, using TTS fallback');
          this.audioMapping = null;
        }
      }

      // Initialize SRS (include canonical metadata)
      if (typeof RhodesSRS !== 'undefined' && this.drillsData?.drills) {
        const meta = {};
        for (const d of this.drillsData.drills) {
          if (d.disabledReason) continue; // Skip disabled drills
          meta[d.id] = {
            pos_pattern: d.pos_pattern, commonality: d.commonality, unit: d.unit,
            is_canonical: d.is_canonical, pattern_group: d.pattern_group
          };
        }
        RhodesSRS.initializeCards(meta);
        await RhodesSRS.loadAnalytics();
        console.log('SRS initialized, analytics:', RhodesSRS.analytics?.responses?.length || 0);
      }

      // Initialize auth
      if (typeof FSI_Auth !== 'undefined') {
        await FSI_Auth.init();
        console.log('Auth:', FSI_Auth.isConfigured?.() ? 'enabled' : 'local only');
      }

      this.updateSRSStats();
      this.loadProgress();
      this.renderUnits();
      this.updateStatsBar();

      // Initialize autopilot button label
      if (typeof RhodesAutopilot !== 'undefined') {
        RhodesAutopilot.buildUnitOrder();
        RhodesAutopilot.updateButtonLabel();
      }
    } catch (err) {
      console.error('Failed to load drills:', err);
      const grid = document.getElementById('unitsGrid');
      if (grid) {
        grid.insertAdjacentHTML('afterbegin', `
          <div style="grid-column: 1/-1; padding: 20px; background: #f8d7da; border: 2px solid #dc3545; margin-bottom: 15px;">
            <strong>Failed to load course data</strong><br><br>
            Error: ${err.message || 'Network request failed'}<br><br>
            <button onclick="location.reload()" style="padding: 8px 16px; cursor: pointer; background: var(--accent-primary); color: white; border: none; font-family: inherit;">Retry</button>
          </div>
        `);
      }
    }
  },

  // =============================================
  // UNIT RENDERING
  // =============================================

  renderUnits() {
    const grid = document.getElementById('unitsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const cfg = this.cfg();
    const units = cfg.units || [];

    // Group by volume (config-driven)
    const volumes = cfg.volumes || null;
    let lastVolume = null;
    for (const unit of units) {
      let volume, volumeLabel;
      if (volumes) {
        // Find which volume this unit belongs to
        const vol = volumes.find(v => v.units && v.units.includes(unit.id));
        volume = vol ? vol.name : null;
        volumeLabel = vol ? vol.name : null;
      } else {
        volume = unit.volume || (unit.id <= 12 ? 1 : 2);
        volumeLabel = `VOLUME ${volume}: Units ${volume === 1 ? '1-12' : '13-24'}`;
      }
      if (volume !== lastVolume) {
        const header = document.createElement('h3');
        header.textContent = volumeLabel || `VOLUME ${volume}`;
        header.style.cssText = 'grid-column: 1/-1; margin: ' + (lastVolume !== null ? '20px' : '10px') + ' 0 10px 0;';
        grid.appendChild(header);
        lastVolume = volume;
      }

      const progress = this.getUnitProgress(unit.id);
      const card = document.createElement('div');
      card.className = 'unit-card' + (progress === 100 ? ' completed' : '');
      const titleTarget = unit.title_target || unit.title_fr || '';
      const titleSource = unit.title_source || unit.title_en || '';
      card.innerHTML = `
        <div class="unit-number">UNIT ${unit.id}</div>
        <div class="unit-title">${titleTarget}</div>
        <div style="font-size: 14px; color: #666;">${titleSource}</div>
        <div class="unit-progress">
          <div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
          <div class="progress-text">${progress}%</div>
        </div>
      `;
      card.onclick = () => this.openUnit(unit.id);
      grid.appendChild(card);
    }
  },

  getUnitProgress(unitId) {
    if (!this.drillsData?.drills) return 0;
    const unitDrills = this.drillsData.drills.filter(d => d.unit === unitId);
    if (unitDrills.length === 0) return 0;
    const storageKey = this.cfg().storage?.progress || 'rhodes_course_progress';
    const progress = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const cards = progress.cards || {};
    const unitProg = progress.unitProgress?.[unitId] || {};
    const seenIds = new Set(unitProg.seenIds || []);
    const completed = unitDrills.filter(d => cards[d.id] || seenIds.has(d.id)).length;
    return Math.round((completed / unitDrills.length) * 100);
  },

  loadProgress() {
    const storageKey = this.cfg().storage?.progress || 'rhodes_course_progress';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        console.log('Loaded progress:', Object.keys(progress.cards || {}).length, 'cards reviewed');
      } catch (e) { console.warn('Failed to load progress:', e); }
    }
    // Trigger Firestore sync if signed in
    if (typeof FSI_Auth !== 'undefined' && FSI_Auth.isSignedIn()) {
      FSI_Auth.syncProgressFromFirestore();
    }
  },

  updateStatsBar() {
    if (!this.drillsData?.drills) return;
    const storageKey = this.cfg().storage?.progress || 'rhodes_course_progress';
    const progress = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const cards = progress.cards || {};
    const seenCount = Object.keys(cards).length;
    const totalUnits = this.cfg().units?.length || 24;

    let unitsComplete = 0;
    for (let i = 1; i <= totalUnits; i++) {
      if (this.getUnitProgress(i) === 100) unitsComplete++;
    }

    const stats = progress.stats || {};
    const totalReviews = stats.totalReviews || 0;
    const totalLapses = Object.values(cards).reduce((sum, c) => sum + (c.lapses || 0), 0);
    const accuracy = totalReviews > 0 ? Math.round(((totalReviews - totalLapses) / totalReviews) * 100) : 0;

    const el = (id) => document.getElementById(id);
    if (el('unitsComplete')) el('unitsComplete').textContent = unitsComplete;
    if (el('vocabLearned')) el('vocabLearned').textContent = seenCount;
    if (el('currentStreak')) el('currentStreak').textContent = stats.streak || 0;
    if (el('accuracy')) el('accuracy').textContent = accuracy;
  },

  // =============================================
  // MODE SWITCHING
  // =============================================

  setMode(mode) {
    this.currentMode = mode;
    const el = (id) => document.getElementById(id);
    el('linearModeBtn')?.classList.toggle('active', mode === 'linear');
    el('srsModeBtn')?.classList.toggle('active', mode === 'srs');
    if (el('linearView')) el('linearView').style.display = mode === 'linear' ? 'block' : 'none';
    if (el('srsView')) el('srsView').style.display = mode === 'srs' ? 'block' : 'none';
    if (el('unitDetailView')) el('unitDetailView').style.display = 'none';
    el('drillView')?.classList.remove('active');
    if (mode === 'srs') {
      this.updateSRSStats();
      const srsView = el('srsView');
      if (srsView) window.scrollTo({ top: srsView.getBoundingClientRect().top + window.pageYOffset, behavior: 'smooth' });
    } else {
      this.renderUnits();
      const statsBar = document.querySelector('.stats-bar');
      if (statsBar) window.scrollTo({ top: statsBar.getBoundingClientRect().top + window.pageYOffset, behavior: 'smooth' });
    }
  },

  setRegister(reg) {
    this.register = reg;
    document.getElementById('formalBtn')?.classList.toggle('active', reg === 'formal');
    document.getElementById('informalBtn')?.classList.toggle('active', reg === 'informal');
    this.updateDrillDisplay();
  },

  setDirection(dir) {
    this.drillDirection = dir;
    document.querySelectorAll('.direction-btn').forEach(b => b.classList.remove('active'));
    const btnMap = { 'en-fr': 'btn-en-fr', 'fr-en': 'btn-fr-en', 'fr-fr-text': 'btn-fr-fr-text', 'fr-fr-dictation': 'btn-fr-fr-dictation' };
    document.getElementById(btnMap[dir])?.classList.add('active');
    const input = document.getElementById('userInput');
    if (input) {
      if (dir === 'fr-en') input.placeholder = 'Type English translation...';
      else if (dir === 'fr-fr-dictation') input.placeholder = 'Type what you hear...';
      else input.placeholder = `Type your answer in ${this.cfg().displayName || 'target language'}...`;
    }
    this.updateDrillDisplay();
  },

  setDrillMode(mode) {
    this.drillMode = mode;
    document.getElementById('repeatBtn')?.classList.toggle('active', mode === 'repeat');
    document.getElementById('translateBtn')?.classList.toggle('active', mode === 'translate');
    this.updateDrillDisplay();
  },

  // =============================================
  // UNIT DETAIL VIEW
  // =============================================

  openUnit(unitId) {
    this.currentUnit = unitId;
    const cfg = this.cfg();
    const unit = cfg.units?.find(u => u.id === unitId);
    if (!unit) return;

    const el = (id) => document.getElementById(id);
    const titleTarget = unit.title_target || unit.title_fr || '';
    if (el('unitDetailTitle')) el('unitDetailTitle').textContent = `UNIT ${unitId}: ${titleTarget}`;

    // Render dialogue
    const dialogue = unit.dialogue || [];
    const dialogueHtml = dialogue.map(line => {
      const targetText = line.fr || line.ru || line.target || '';
      const sourceText = line.en || line.source || '';
      return `<div style="margin-bottom: 10px;">
        <strong style="color: var(--accent-primary);">${line.speaker}:</strong>
        <span style="color: #000;">${targetText}</span><br>
        <span style="color: #666; font-size: 14px;">${sourceText}</span>
      </div>`;
    }).join('');
    if (el('dialogueContent')) el('dialogueContent').innerHTML = dialogueHtml;

    // Render grammar
    const grammarSection = el('grammarIntroContent')?.parentElement;
    if (unit.grammar && unit.grammar.length > 0) {
      const grammarHtml = unit.grammar.map(g => `
        <div style="margin-bottom: 12px;">
          <strong style="color: #8B4513;">${g.title}</strong>
          <div style="margin-top: 4px;">${g.desc}</div>
        </div>
      `).join('');
      if (el('grammarIntroContent')) el('grammarIntroContent').innerHTML = grammarHtml;
      if (grammarSection) grammarSection.style.display = 'block';
    } else {
      if (grammarSection) grammarSection.style.display = 'none';
    }

    // Drill count
    const unitDrills = this.drillsData ? this.drillsData.drills.filter(d => d.unit === unitId && !d.disabledReason) : [];
    const drillsSection = el('startDrillsBtn')?.parentElement;
    if (unit.noDrills || unitDrills.length === 0) {
      if (drillsSection) drillsSection.style.display = 'none';
    } else {
      if (drillsSection) drillsSection.style.display = 'block';
      if (el('drillCount')) el('drillCount').textContent = unitDrills.length;
    }

    if (el('linearView')) el('linearView').style.display = 'none';
    if (el('srsView')) el('srsView').style.display = 'none';
    if (el('unitDetailView')) el('unitDetailView').style.display = 'block';
  },

  closeUnitDetail() {
    const el = (id) => document.getElementById(id);
    if (el('unitDetailView')) el('unitDetailView').style.display = 'none';
    if (el('linearView')) el('linearView').style.display = 'block';
  },

  playDialogue() {
    const cfg = this.cfg();
    const unit = cfg.units?.find(u => u.id === this.currentUnit);
    if (unit) RhodesAudio.playDialogue(unit, this.currentUnit);
  },

  // =============================================
  // DRILL LOADING
  // =============================================

  startUnitDrills() { this.loadUnitDrills(this.currentUnit); },

  startDialogueDrills() {
    const cfg = this.cfg();
    const unit = cfg.units?.find(u => u.id === this.currentUnit);
    if (!unit?.dialogue) { alert('No dialogue available for this unit.'); return; }

    this.currentDrills = unit.dialogue.map((line, index) => ({
      id: `dialogue_${this.currentUnit}_${index}`,
      type: 'DIALOGUE',
      target: line.fr || line.ru || line.target || '',
      french: line.fr || line.ru || line.target || '',
      english: `${line.speaker}: ${line.en || line.source || ''}`,
      speaker: line.speaker,
      commonality: 1.0
    }));
    this.currentDrillIndex = 0;
    this.sessionCorrect = 0;
    this.sessionTotal = 0;
    document.getElementById('unitDetailView').style.display = 'none';
    this.showDrill();
  },

  loadUnitDrills(unitId) {
    if (!this.drillsData) { console.error('Drills data not loaded'); return; }
    const unitDrills = this.drillsData.drills.filter(d => d.unit === unitId && !d.disabledReason);
    if (unitDrills.length === 0) { alert(`No drills available for Unit ${unitId} yet.`); return; }

    const storageKey = this.cfg().storage?.progress || 'rhodes_course_progress';
    const progress = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const cards = progress.cards || {};
    const fields = this.cfg().fields || {};

    this.currentDrills = unitDrills.map(d => ({
      ...d,
      target: d[fields.target || fields.targetFormal || 'french_formal'] || d.french || '',
      french: d[fields.target || fields.targetFormal || 'french_formal'] || d.french || '',
      seen: !!cards[d.id]
    }));
    this.currentDrills.sort((a, b) => {
      if (a.seen !== b.seen) return a.seen ? 1 : -1;
      return (b.commonality || 0) - (a.commonality || 0);
    });

    this.currentDrillIndex = 0;
    this.sessionCorrect = 0;
    this.sessionTotal = 0;
    document.getElementById('unitDetailView').style.display = 'none';
    this.showDrill();
  },

  // =============================================
  // SRS SESSION
  // =============================================

  updateSRSStats() {
    const stats = RhodesStorage.getStats();
    const activeDrills = this.drillsData?.drills?.filter(d => !d.disabledReason) || [];
    const totalDrills = activeDrills.length || 0;
    const newCards = totalDrills - stats.total;
    const el = (id) => document.getElementById(id);
    if (el('dueToday')) el('dueToday').textContent = stats.dueToday || 0;
    if (el('newCards')) el('newCards').textContent = newCards > 0 ? newCards : 0;
    if (el('reviewCards')) el('reviewCards').textContent = (stats.learning || 0) + (stats.review || 0);
    if (el('masteredCards')) el('masteredCards').textContent = stats.mastered || 0;

    // Canonical stats (if RhodesSRS has canonical data)
    if (typeof RhodesSRS !== 'undefined') {
      const srsStats = RhodesSRS.getStats();
      if (srsStats.totalCanonicals > 0) {
        if (el('canonicalsMastered')) el('canonicalsMastered').textContent = `${srsStats.graduatedCanonicals}/${srsStats.totalCanonicals}`;
        if (el('groupsMastered')) el('groupsMastered').textContent = `${srsStats.groupsMastered}/${srsStats.totalGroups}`;
        if (el('canonicalStats')) el('canonicalStats').style.display = 'grid';
      }
    }

    if (this.sessionTotal > 0) {
      const acc = Math.round((this.sessionCorrect / this.sessionTotal) * 100);
      if (el('accuracy')) el('accuracy').textContent = acc;
    }
  },

  hasCompletedUnit1() {
    if (!this.drillsData?.drills) return false;
    const storageKey = this.cfg().storage?.progress || 'rhodes_course_progress';
    const progress = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const cards = progress.cards || {};
    const unit1Drills = this.drillsData.drills.filter(d => d.unit === 1 && !d.disabledReason);
    const seenCount = unit1Drills.filter(d => cards[d.id]).length;
    return seenCount >= unit1Drills.length * 0.8;
  },

  startSRSSession() {
    if (!this.drillsData) { alert('Drills not loaded.'); return; }
    const cfg = this.cfg();
    const fields = cfg.fields || {};
    const now = new Date();
    const unit1Complete = this.hasCompletedUnit1();
    const srsMaxUnit = cfg.srsMaxUnit || 12;
    const srsMaxCards = cfg.srs?.maxCards || 20;

    this.currentDrills = this.drillsData.drills.filter(d => d.unit <= srsMaxUnit && !d.disabledReason).map(d => {
      const card = RhodesStorage.getCard(d.id);
      return {
        ...d,
        target: d[fields.target || fields.targetFormal || 'french_formal'] || d.french || '',
        french: d[fields.target || fields.targetFormal || 'french_formal'] || d.french || '',
        isReviewUnit: this.REVIEW_UNITS.includes(d.unit),
        srsState: card.state,
        srsDue: card.due ? new Date(card.due) : null,
        srsReps: card.reps || 0
      };
    });

    this.currentDrills = this.currentDrills.filter(d => {
      if (d.srsState === 'new') return true;
      if (d.srsState === 'mastered') return false;
      if (d.srsDue && d.srsDue <= now) return true;
      return false;
    });

    this.currentDrills.sort((a, b) => {
      if (a.srsState === 'new' && b.srsState !== 'new') return -1;
      if (b.srsState === 'new' && a.srsState !== 'new') return 1;
      if (a.srsState === 'new' && b.srsState === 'new') {
        const aScore = (a.commonality || 0) + (a.isReviewUnit ? -0.1 : 0);
        const bScore = (b.commonality || 0) + (b.isReviewUnit ? -0.1 : 0);
        return bScore - aScore;
      }
      return (a.srsDue || 0) - (b.srsDue || 0);
    });

    this.currentDrills = this.currentDrills.slice(0, srsMaxCards);
    if (this.currentDrills.length === 0) {
      const stats = RhodesStorage.getStats();
      alert(stats.total > 0 && stats.dueToday === 0
        ? `All caught up! ${stats.total} cards reviewed.\nNext reviews due tomorrow.`
        : 'No cards available!');
      return;
    }

    this.currentDrillIndex = 0;
    this.sessionCorrect = 0;
    this.sessionTotal = 0;
    this.currentMode = 'srs';
    document.getElementById('srsView').style.display = 'none';
    this.showDrill();
  },

  // =============================================
  // DRILL DISPLAY
  // =============================================

  showDrill() {
    document.getElementById('drillView')?.classList.add('active');
    if (document.getElementById('linearView')) document.getElementById('linearView').style.display = 'none';
    this.updateDrillDisplay();
  },

  updateDrillDisplay() {
    const drill = this.currentDrills[this.currentDrillIndex];
    if (!drill) return;

    // Skip disabled drills that slipped through
    if (drill.disabledReason) {
      console.warn('Skipping disabled drill:', drill.id, drill.disabledReason);
      this.nextDrill();
      return;
    }

    // Skip drills with no content (empty target AND empty source)
    const drillTarget = this.getTarget(drill);
    const drillSource = this.getSource(drill);
    const drillType = (drill.type || '').toLowerCase();
    if (!drillTarget && !drillSource && drillType !== 'cultural_note' && drillType !== 'minimal_pair') {
      console.warn('Skipping empty drill:', drill.id);
      this.nextDrill();
      return;
    }

    // Skip broken substitution/transformation drills (no model AND no cues)
    if ((drillType === 'substitution' || drillType === 'fsi_substitution' ||
         drillType === 'transformation' || drillType === 'fsi_transformation') &&
        !drill.model_sentence && (!drill.cues || drill.cues.length === 0)) {
      console.warn('Skipping broken structured drill:', drill.id, drillType);
      this.nextDrill();
      return;
    }

    this.retryMode = false;
    this.retryExpected = '';
    this.currentCueIndex = 0;
    this._minimalPairTarget = null;
    const checkBtn = document.getElementById('checkBtn');
    if (checkBtn) checkBtn.textContent = 'CHECK';

    if (typeof RhodesSRS !== 'undefined') RhodesSRS.startPromptTimer?.();

    const el = (id) => document.getElementById(id);
    if (el('drillType')) el('drillType').textContent = (drill.type || '').toUpperCase();
    if (el('drillProgress')) el('drillProgress').textContent = `${this.currentDrillIndex + 1} / ${this.currentDrills.length}`;

    // Hide all special drill areas
    this._hideAllDrillAreas();

    // Clean up dictation-prominent from previous drill
    document.getElementById('playFrBtn')?.classList.remove('dictation-prominent');

    const input = el('userInput');
    if (input) { input.value = ''; input.className = ''; }
    el('feedback')?.classList.remove('show', 'success', 'error');
    if (checkBtn) checkBtn.style.display = 'inline-block';
    const nextBtn = el('nextBtn');
    if (nextBtn) nextBtn.style.display = 'none';

    // Show input area by default (some types will hide it)
    const inputArea = document.querySelector('.input-area');
    if (inputArea) inputArea.style.display = 'block';

    // Type-aware dispatch
    const drillType = (drill.type || '').toLowerCase();
    switch (drillType) {
      case 'fsi_substitution': case 'substitution':
        this._renderSubstitutionDrill(drill); break;
      case 'fsi_transformation': case 'transformation':
        this._renderTransformationDrill(drill); break;
      case 'fsi_response': case 'response':
        this._renderResponseDrill(drill); break;
      case 'fill_blank':
        this._renderFillBlankDrill(drill); break;
      case 'cultural_note':
        this._renderCulturalNote(drill); break;
      case 'minimal_pair':
        this._renderMinimalPairDrill(drill); break;
      case 'pronunciation':
        this._renderPronunciationDrill(drill); break;
      default:
        this._renderSentenceDrill(drill); break;
    }

    if (input) input.focus();

    // Trigger hands-free if active
    if (RhodesVoice?.handsFreeMode) {
      setTimeout(() => RhodesVoice.startHandsFreeFlow(), 500);
    }
  },

  /**
   * Hide all special drill type areas
   */
  _hideAllDrillAreas() {
    const ids = ['modelSentenceArea', 'cueArea', 'fillBlankArea', 'culturalNoteArea', 'minimalPairArea'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    }
  },

  /**
   * Default sentence drill — preserves original updateDrillDisplay behavior exactly
   */
  _renderSentenceDrill(drill) {
    const el = (id) => document.getElementById(id);

    let targetText = drill.target || drill.french || '';
    if (this.register === 'informal') targetText = this.convertToInformal(targetText);

    const promptTarget = el('promptFr');
    const promptSource = el('promptEn');

    if (promptTarget) promptTarget.textContent = targetText;
    if (promptSource) promptSource.textContent = drill.english || this.getSource(drill) || '(translate)';

    const grammarHints = el('grammarHints');
    if (this.drillMode === 'translate') {
      if (this.drillDirection === 'fr-en') {
        if (promptTarget) { promptTarget.style.display = 'block'; promptTarget.style.fontSize = '20px'; }
        if (promptSource) { promptSource.textContent = '(Type in English)'; promptSource.style.display = 'block'; promptSource.style.fontSize = '12px'; promptSource.style.color = '#666'; }
        if (!RhodesVoice?.handsFreeMode) {
          setTimeout(() => RhodesAudio.playAudio('fr', this.currentDrills, this.currentDrillIndex, this.audioMapping, this.drillDirection, false), 300);
        }
      } else if (this.drillDirection === 'fr-fr-text') {
        if (promptTarget) { promptTarget.style.display = 'block'; promptTarget.style.fontSize = '20px'; }
        if (promptSource) { promptSource.textContent = '(Type what you hear)'; promptSource.style.display = 'block'; promptSource.style.fontSize = '12px'; promptSource.style.color = '#666'; }
        if (!RhodesVoice?.handsFreeMode) {
          setTimeout(() => RhodesAudio.playAudio('fr', this.currentDrills, this.currentDrillIndex, this.audioMapping, this.drillDirection, false), 300);
        }
      } else if (this.drillDirection === 'fr-fr-dictation') {
        if (promptTarget) { promptTarget.style.display = 'none'; }
        if (promptSource) { promptSource.innerHTML = '\uD83C\uDFA7 Listen and type what you hear'; promptSource.style.display = 'block'; promptSource.style.fontSize = '18px'; promptSource.style.color = 'var(--accent-primary)'; }
        const playBtn = document.getElementById('playFrBtn');
        if (playBtn) playBtn.classList.add('dictation-prominent');
        if (!RhodesVoice?.handsFreeMode) {
          setTimeout(() => RhodesAudio.playAudio('fr', this.currentDrills, this.currentDrillIndex, this.audioMapping, this.drillDirection, false), 300);
        }
      } else if (drill.english || this.getSource(drill)) {
        if (promptSource) { promptSource.style.display = 'block'; promptSource.style.fontSize = '20px'; promptSource.style.color = '#333'; }
        if (promptTarget) promptTarget.style.display = 'none';
      } else {
        if (promptSource) { promptSource.textContent = '(Type the sentence below)'; promptSource.style.display = 'block'; promptSource.style.fontSize = '14px'; promptSource.style.color = '#333'; }
        if (promptTarget) { promptTarget.style.display = 'block'; promptTarget.style.fontSize = '20px'; }
      }
      if (grammarHints) grammarHints.style.display = 'none';
    } else {
      if (promptTarget) { promptTarget.style.display = 'block'; promptTarget.style.fontSize = '22px'; }
      if (promptSource) { promptSource.style.display = 'block'; promptSource.style.fontSize = '14px'; }
      if (grammarHints) grammarHints.style.display = 'none';
    }
  },

  /**
   * Substitution drill — model sentence + cue, user types substituted sentence
   */
  _renderSubstitutionDrill(drill) {
    const el = (id) => document.getElementById(id);
    const promptTarget = el('promptFr');
    const promptSource = el('promptEn');

    // Hide standard prompts
    if (promptTarget) promptTarget.style.display = 'none';
    if (promptSource) { promptSource.textContent = 'Substitute the cue into the sentence:'; promptSource.style.display = 'block'; promptSource.style.fontSize = '14px'; promptSource.style.color = '#666'; }

    // Show model sentence
    const modelArea = el('modelSentenceArea');
    if (modelArea) {
      modelArea.textContent = drill.model_sentence || drill.target || drill.french || '';
      modelArea.style.display = 'block';
    }

    // Show cue
    const cueArea = el('cueArea');
    const cues = drill.cues || [];
    if (cueArea && cues.length > 0) {
      cueArea.textContent = cues[this.currentCueIndex] || cues[0];
      cueArea.style.display = 'block';
    }
  },

  /**
   * Transformation drill — model sentence + instruction
   */
  _renderTransformationDrill(drill) {
    const el = (id) => document.getElementById(id);
    const promptTarget = el('promptFr');
    const promptSource = el('promptEn');

    if (promptTarget) promptTarget.style.display = 'none';
    if (promptSource) { promptSource.textContent = 'Transform the sentence:'; promptSource.style.display = 'block'; promptSource.style.fontSize = '14px'; promptSource.style.color = '#666'; }

    const modelArea = el('modelSentenceArea');
    if (modelArea) {
      modelArea.textContent = drill.model_sentence || drill.target || drill.french || '';
      modelArea.style.display = 'block';
    }

    const cueArea = el('cueArea');
    const cues = drill.cues || [];
    if (cueArea && cues.length > 0) {
      cueArea.textContent = cues[0];
      cueArea.style.display = 'block';
    }
  },

  /**
   * Response drill — show stimulus, user types response
   */
  _renderResponseDrill(drill) {
    const el = (id) => document.getElementById(id);
    const promptTarget = el('promptFr');
    const promptSource = el('promptEn');

    if (promptTarget) promptTarget.style.display = 'none';
    if (promptSource) { promptSource.textContent = 'Respond appropriately:'; promptSource.style.display = 'block'; promptSource.style.fontSize = '14px'; promptSource.style.color = '#666'; }

    const modelArea = el('modelSentenceArea');
    if (modelArea) {
      modelArea.textContent = drill.model_sentence || drill.english || this.getSource(drill) || '';
      modelArea.style.display = 'block';
    }

    if (!RhodesVoice?.handsFreeMode) {
      setTimeout(() => RhodesAudio.playAudio('fr', this.currentDrills, this.currentDrillIndex, this.audioMapping, this.drillDirection, false), 300);
    }
  },

  /**
   * Fill-in-the-blank drill
   */
  _renderFillBlankDrill(drill) {
    const el = (id) => document.getElementById(id);
    const promptTarget = el('promptFr');
    const promptSource = el('promptEn');

    if (promptTarget) promptTarget.style.display = 'none';
    if (promptSource) { promptSource.textContent = 'Fill in the blank:'; promptSource.style.display = 'block'; promptSource.style.fontSize = '14px'; promptSource.style.color = '#666'; }

    const fillArea = el('fillBlankArea');
    if (fillArea) {
      const template = drill.blank_template || '';
      fillArea.innerHTML = template.replace(/___/g, '<span class="blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>');
      fillArea.style.display = 'block';
    }

    // Show English hint below if available
    if (drill.english) {
      if (promptSource) { promptSource.textContent = drill.english; promptSource.style.display = 'block'; promptSource.style.fontSize = '14px'; promptSource.style.color = '#666'; }
    }
  },

  /**
   * Cultural note — read-only, no input
   */
  _renderCulturalNote(drill) {
    const el = (id) => document.getElementById(id);
    const promptTarget = el('promptFr');
    const promptSource = el('promptEn');

    if (promptTarget) promptTarget.style.display = 'none';
    if (promptSource) promptSource.style.display = 'none';

    // Hide input area
    const inputArea = document.querySelector('.input-area');
    if (inputArea) inputArea.style.display = 'none';
    const checkBtn = el('checkBtn');
    if (checkBtn) checkBtn.style.display = 'none';

    const noteArea = el('culturalNoteArea');
    if (noteArea) {
      const noteText = noteArea.querySelector('.cultural-note-text');
      if (noteText) {
        noteText.innerHTML = `<strong>${drill.target || drill.french || ''}</strong>` +
          (drill.english ? `<br><br>${drill.english}` : '');
      }
      noteArea.style.display = 'block';

      // Set up Continue button
      const continueBtn = noteArea.querySelector('.cultural-note-continue');
      if (continueBtn) {
        continueBtn.onclick = () => {
          // Mark as seen in SRS (no rating needed)
          if (typeof RhodesSRS !== 'undefined') {
            RhodesSRS.processReview(drill.id, RhodesSRS.Rating.Easy, null);
            RhodesSRS.saveCards();
          }
          RhodesStorage.reviewCard(drill.id, 4);
          RhodesStorage.setUnitProgress(this.currentUnit, this.currentDrillIndex, drill.id);
          this.nextDrill();
        };
      }
    }
  },

  /**
   * Minimal pair drill — play audio, user selects which word
   */
  _renderMinimalPairDrill(drill) {
    const el = (id) => document.getElementById(id);
    const promptTarget = el('promptFr');
    const promptSource = el('promptEn');

    if (promptTarget) promptTarget.style.display = 'none';
    if (promptSource) { promptSource.textContent = 'Which word do you hear?'; promptSource.style.display = 'block'; promptSource.style.fontSize = '18px'; promptSource.style.color = 'var(--accent-primary)'; }

    // Hide text input, show pair buttons
    const inputArea = document.querySelector('.input-area');
    if (inputArea) inputArea.style.display = 'none';
    const checkBtn = el('checkBtn');
    if (checkBtn) checkBtn.style.display = 'none';

    const pairArea = el('minimalPairArea');
    if (pairArea) {
      const pairA = drill.pair_a || '';
      const pairB = drill.pair_b || '';

      // Randomly select target
      this._minimalPairTarget = Math.random() < 0.5 ? 'a' : 'b';
      const targetWord = this._minimalPairTarget === 'a' ? pairA : pairB;

      const btnA = pairArea.querySelector('.pair-a');
      const btnB = pairArea.querySelector('.pair-b');
      if (btnA) { btnA.textContent = pairA; btnA.className = 'pair-option pair-a'; }
      if (btnB) { btnB.textContent = pairB; btnB.className = 'pair-option pair-b'; }

      // Show IPA if available
      const ipaArea = pairArea.querySelector('.pair-ipa');
      if (ipaArea) {
        const ipaA = drill.ipa_a || '';
        const ipaB = drill.ipa_b || '';
        ipaArea.innerHTML = ipaA || ipaB ? `/${ipaA}/ &nbsp;&nbsp; vs &nbsp;&nbsp; /${ipaB}/` : '';
      }

      // Show English approximation if available
      const approxArea = pairArea.querySelector('.pair-english-approx');
      if (approxArea) {
        approxArea.textContent = drill.english_approx || '';
      }

      // Wire up click handlers
      const handlePairClick = (choice) => {
        const correct = choice === this._minimalPairTarget;
        const chosenBtn = choice === 'a' ? btnA : btnB;
        const correctBtn = this._minimalPairTarget === 'a' ? btnA : btnB;

        if (correct) {
          chosenBtn.classList.add('correct');
          this.sessionCorrect++;
          this.sessionTotal++;
          RhodesAudio.correct();
          if (typeof RhodesSRS !== 'undefined') {
            RhodesSRS.processReview(drill.id, RhodesSRS.Rating.Good, null);
            RhodesSRS.saveCards();
          }
          RhodesStorage.reviewCard(drill.id, 3);
          RhodesStorage.setUnitProgress(this.currentUnit, this.currentDrillIndex, drill.id);
          setTimeout(() => this.nextDrill(), 1000);
        } else {
          chosenBtn.classList.add('incorrect');
          correctBtn.classList.add('correct');
          this.sessionTotal++;
          RhodesAudio.incorrect();
          if (typeof RhodesSRS !== 'undefined') {
            RhodesSRS.processReview(drill.id, RhodesSRS.Rating.Again, null);
            RhodesSRS.saveCards();
          }
          RhodesStorage.reviewCard(drill.id, 1);
          setTimeout(() => this.nextDrill(), 2000);
        }
      };

      if (btnA) btnA.onclick = () => handlePairClick('a');
      if (btnB) btnB.onclick = () => handlePairClick('b');

      pairArea.style.display = 'block';

      // Play the target word audio
      // Use TTS for the target word
      setTimeout(() => {
        const lang = this.cfg().langCode || 'fr-FR';
        if ('speechSynthesis' in window) {
          const utt = new SpeechSynthesisUtterance(targetWord);
          utt.lang = lang;
          utt.rate = 0.9;
          speechSynthesis.speak(utt);
        }
      }, 500);
    }
  },

  /**
   * Pronunciation drill — show text + IPA + English approx, dictation mode
   */
  _renderPronunciationDrill(drill) {
    const el = (id) => document.getElementById(id);
    const promptTarget = el('promptFr');
    const promptSource = el('promptEn');

    let targetText = drill.target || drill.french || '';

    // Show target text
    if (promptTarget) { promptTarget.textContent = targetText; promptTarget.style.display = 'block'; promptTarget.style.fontSize = '22px'; }

    // Show IPA and English approximation below
    let sourceHtml = '';
    if (drill.ipa) sourceHtml += `<span style="font-family:'Noto Sans',sans-serif;color:var(--accent-primary);">/${drill.ipa}/</span>`;
    if (drill.english_approx) sourceHtml += (sourceHtml ? '<br>' : '') + `<span style="color:#666;font-size:14px;">${drill.english_approx}</span>`;
    if (drill.english) sourceHtml += (sourceHtml ? '<br>' : '') + `<span style="color:#888;font-size:13px;">${drill.english}</span>`;

    if (promptSource) {
      if (sourceHtml) { promptSource.innerHTML = sourceHtml; promptSource.style.display = 'block'; }
      else { promptSource.textContent = '(Type what you hear)'; promptSource.style.display = 'block'; promptSource.style.fontSize = '14px'; }
    }

    // Auto-play audio
    if (!RhodesVoice?.handsFreeMode) {
      setTimeout(() => RhodesAudio.playAudio('fr', this.currentDrills, this.currentDrillIndex, this.audioMapping, this.drillDirection, false), 300);
    }
  },

  // =============================================
  // ANSWER CHECKING
  // =============================================

  checkAnswer() {
    const input = document.getElementById('userInput');
    const drill = this.currentDrills[this.currentDrillIndex];
    if (!drill) return;

    // Cultural notes have no check — skip
    if ((drill.type || '').toLowerCase() === 'cultural_note') return;
    // Minimal pairs are handled by button clicks — skip
    if ((drill.type || '').toLowerCase() === 'minimal_pair') return;

    let expected;
    const drillType = (drill.type || '').toLowerCase();
    const hasExpectedResponses = drill.expected_responses && drill.expected_responses.length > 0;

    // Fill-blank uses blank_answer
    if (drillType === 'fill_blank' && drill.blank_answer) {
      expected = drill.blank_answer;
    }
    // Substitution uses expected_responses[cueIndex]
    else if ((drillType === 'fsi_substitution' || drillType === 'substitution') && hasExpectedResponses) {
      expected = drill.expected_responses[this.currentCueIndex] || drill.expected_responses[0];
    }
    // Transformation uses expected_responses[0]
    else if ((drillType === 'fsi_transformation' || drillType === 'transformation') && hasExpectedResponses) {
      expected = drill.expected_responses[0];
    }
    // Response drills: accept any expected_response
    else if ((drillType === 'fsi_response' || drillType === 'response') && hasExpectedResponses) {
      // Check against each valid response, pick best match
      const userVal = input.value.trim();
      let bestMatch = null;
      for (const resp of drill.expected_responses) {
        const result = RhodesError.classify(userVal, resp);
        if (result.correct) { bestMatch = resp; break; }
        if (!bestMatch) bestMatch = resp;
      }
      expected = bestMatch || drill.expected_responses[0];
    }
    // Standard sentence drill
    else if (this.drillDirection === 'fr-en') {
      expected = drill.english || this.getSource(drill);
    } else {
      expected = drill.target || drill.french || this.getTarget(drill);
      if (this.register === 'informal') expected = this.convertToInformal(expected);
    }

    const result = RhodesError.classify(input.value, expected);
    const el = (id) => document.getElementById(id);
    const feedback = el('feedback');
    const feedbackTitle = el('feedbackTitle');
    const feedbackDetail = el('feedbackDetail');
    const drillLink = el('drillLink');
    const checkBtn = el('checkBtn');
    const nextBtn = el('nextBtn');

    // Retry mode
    if (this.retryMode) {
      if (result.correct) {
        input.className = 'correct';
        feedback.className = 'feedback show success';
        feedbackTitle.textContent = 'Correct!';
        feedbackDetail.textContent = expected;
        if (drillLink) drillLink.style.display = 'none';
        RhodesAudio.correct();
        this.retryMode = false;
        this.retryExpected = '';
        if (checkBtn) checkBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        setTimeout(() => this.nextDrill(), 1000);
      } else {
        RhodesAudio.incorrect();
        input.value = '';
        input.className = '';
        feedback.className = 'feedback show error';
        feedbackTitle.textContent = 'Try again';
        feedbackDetail.textContent = 'Type: ' + expected;
      }
      return;
    }

    if (result.correct) {
      input.className = 'correct';
      feedback.className = 'feedback show success';
      if (drillLink) drillLink.style.display = 'none';

      if (result.accentWarning && this.drillDirection !== 'fr-fr-dictation') {
        feedbackTitle.textContent = 'Correct!';
        feedbackDetail.innerHTML = `<span style="color: #856404;">Watch accents:</span> <strong>${expected}</strong>`;
        feedback.className = 'feedback show success accent-warning';
      } else {
        feedbackTitle.textContent = 'Correct!';
        feedbackDetail.textContent = expected;
      }

      RhodesAudio.correct();
      this.sessionCorrect++;
      this.sessionTotal++;

      const rating = typeof RhodesSRS !== 'undefined' ? RhodesSRS.Rating.Good : 3;
      if (typeof RhodesSRS !== 'undefined') {
        RhodesSRS.processReview(drill.id, rating, null);
        RhodesSRS.saveCards();
        RhodesSRS.logResponse?.({
          cardId: drill.id, unit: drill.unit || this.currentUnit, drillType: drill.type,
          promptEn: drill.english, expectedFr: expected, userAnswer: input.value,
          correct: true, grade: rating, errors: [], mode: this.currentMode, register: this.register
        });
      }
      if (typeof FSI_Auth !== 'undefined') {
        FSI_Auth.saveResponse?.({ cardId: drill.id, unit: drill.unit || this.currentUnit, expected, userAnswer: input.value, correct: true });
      }
      RhodesStorage.reviewCard(drill.id, rating);
      RhodesStorage.setUnitProgress(this.currentUnit, this.currentDrillIndex, drill.id);

      // Substitution: advance to next cue instead of next drill
      const dt = (drill.type || '').toLowerCase();
      if ((dt === 'fsi_substitution' || dt === 'substitution') &&
          drill.cues && this.currentCueIndex < drill.cues.length - 1) {
        this.currentCueIndex++;
        setTimeout(() => {
          const cueArea = document.getElementById('cueArea');
          if (cueArea) cueArea.textContent = drill.cues[this.currentCueIndex];
          const inp = document.getElementById('userInput');
          if (inp) { inp.value = ''; inp.className = ''; inp.focus(); }
          document.getElementById('feedback')?.classList.remove('show', 'success', 'error');
        }, 800);
        return;
      }

      setTimeout(() => this.nextDrill(), 1000);
    } else {
      input.className = 'incorrect';
      feedback.className = 'feedback show error';
      this.sessionTotal++;
      RhodesAudio.incorrect();

      const rating = typeof RhodesSRS !== 'undefined' ? RhodesSRS.errorToRating(result.errors) : 1;
      feedbackTitle.textContent = 'Incorrect';

      const userAnswer = input.value.trim() || '(empty)';
      const diff = RhodesUI.highlightDiff(userAnswer, expected);
      let detailHtml = `
        <div style="margin-bottom: 12px; padding: 10px; background: #ffebee; border-left: 4px solid #dc3545;">
          <div style="font-size: 12px; color: #999; margin-bottom: 4px;">YOU WROTE:</div>
          <div style="font-size: 20px;">${diff.userHighlighted}</div>
        </div>
        <div style="padding: 10px; background: #e8f5e9; border-left: 4px solid #28a745;">
          <div style="font-size: 12px; color: #999; margin-bottom: 4px;">CORRECT:</div>
          <div style="font-size: 20px;">${diff.expectedHighlighted}</div>
        </div>
      `;

      const verbHint = RhodesUI.getVerbHintForError(expected, input.value);
      if (verbHint) detailHtml += `<div style="margin-top: 12px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; font-size: 14px;"><strong>Conjugation:</strong> ${verbHint}</div>`;
      const confusionHint = RhodesUI.getConfusionHint(expected, input.value);
      if (confusionHint) detailHtml += `<div style="margin-top: 12px; padding: 10px; background: #e3f2fd; border-left: 4px solid #2196f3; font-size: 14px;"><strong>Word Confusion:</strong> ${confusionHint}</div>`;

      feedbackDetail.innerHTML = detailHtml;
      if (drillLink) drillLink.style.display = 'none';

      if (typeof RhodesSRS !== 'undefined') {
        RhodesSRS.processReview(drill.id, rating, result.errors);
        RhodesSRS.saveCards();
        RhodesSRS.logResponse?.({
          cardId: drill.id, unit: drill.unit || this.currentUnit, drillType: drill.type,
          promptEn: drill.english, expectedFr: expected, userAnswer: input.value,
          correct: false, grade: rating, errors: result.errors?.map(e => ({ type: e.type })) || [],
          mode: this.currentMode, register: this.register
        });
      }
      if (typeof FSI_Auth !== 'undefined') {
        FSI_Auth.saveResponse?.({ cardId: drill.id, unit: drill.unit || this.currentUnit, expected, userAnswer: input.value, correct: false, errorType: result.primaryError?.type });
      }
      RhodesStorage.reviewCard(drill.id, rating);

      // Re-queue wrong drill in SRS mode
      if (this.currentMode === 'srs' && rating === RhodesSRS?.Rating?.Again) {
        const wrongDrill = { ...drill, wrongCount: (drill.wrongCount || 0) + 1 };
        const insertAt = Math.min(this.currentDrillIndex + 3 + Math.floor(Math.random() * 3), this.currentDrills.length);
        this.currentDrills.splice(insertAt, 0, wrongDrill);
      }

      this.retryMode = true;
      this.retryExpected = expected;
      input.value = '';
      input.className = '';
      if (checkBtn) checkBtn.textContent = 'RETRY';
    }
  },

  // Voice answer checking (called from RhodesVoice)
  checkVoiceAnswer(spoken, expected) {
    const result = RhodesVoice.fuzzyMatch(spoken, expected);
    const drill = this.currentDrills[this.currentDrillIndex];
    const el = (id) => document.getElementById(id);

    if (result.match) {
      el('userInput').value = expected;
      el('voiceStatus').textContent = `Correct! (${result.score}%)`;
      el('voiceStatus').style.color = '#28a745';
      el('userInput').className = 'correct';
      const feedback = el('feedback');
      feedback.className = 'feedback show success';
      el('feedbackTitle').textContent = 'Correct!';
      el('feedbackDetail').textContent = expected;
      this.sessionCorrect++;
      this.sessionTotal++;

      const rating = typeof RhodesSRS !== 'undefined' ? RhodesSRS.Rating.Good : 3;
      if (typeof RhodesSRS !== 'undefined') { RhodesSRS.processReview(drill.id, rating, null); RhodesSRS.saveCards(); }
      RhodesStorage.reviewCard(drill.id, rating);
      RhodesStorage.setUnitProgress(this.currentUnit, this.currentDrillIndex, drill.id);

      if (RhodesVoice.handsFreeMode) {
        RhodesAudio.playAudio('fr', this.currentDrills, this.currentDrillIndex, this.audioMapping, this.drillDirection, true, () => {
          setTimeout(() => { this.nextDrill(); setTimeout(() => RhodesVoice.startHandsFreeFlow(), 300); }, 300);
        });
      } else { setTimeout(() => this.nextDrill(), 1500); }
    } else {
      el('voiceStatus').textContent = `Try again (${result.score}%)`;
      el('voiceStatus').style.color = '#dc3545';
      const feedback = el('feedback');
      feedback.className = 'feedback show error';
      el('feedbackTitle').textContent = 'Not quite';
      el('feedbackDetail').innerHTML = `You said: "${spoken}"<br>Expected: "${expected}"`;
      this.sessionTotal++;

      const rating = typeof RhodesSRS !== 'undefined' ? RhodesSRS.Rating.Again : 1;
      if (typeof RhodesSRS !== 'undefined') { RhodesSRS.processReview(drill.id, rating, null); RhodesSRS.saveCards(); }
      RhodesStorage.reviewCard(drill.id, rating);

      if (this.currentMode === 'srs') {
        const wrongDrill = { ...drill, wrongCount: (drill.wrongCount || 0) + 1 };
        const insertAt = Math.min(this.currentDrillIndex + 3 + Math.floor(Math.random() * 3), this.currentDrills.length);
        this.currentDrills.splice(insertAt, 0, wrongDrill);
      }

      if (RhodesVoice.handsFreeMode) {
        setTimeout(() => {
          RhodesAudio.playAudio('fr', this.currentDrills, this.currentDrillIndex, this.audioMapping, this.drillDirection, true, () => {
            setTimeout(() => RhodesVoice.startListening(), 300);
          });
        }, 1500);
      }
    }
  },

  // =============================================
  // NAVIGATION
  // =============================================

  nextDrill() {
    this.currentDrillIndex++;
    if (this.currentDrillIndex >= this.currentDrills.length) {
      // Autopilot handles completion if active
      if (typeof RhodesAutopilot !== 'undefined' && RhodesAutopilot.active && RhodesAutopilot.onDrillsComplete()) {
        return;
      }
      this.closeDrill();
      const acc = this.sessionTotal > 0 ? Math.round((this.sessionCorrect / this.sessionTotal) * 100) : 0;
      alert(`Session Complete!\n\nCorrect: ${this.sessionCorrect}/${this.sessionTotal}\nAccuracy: ${acc}%`);
    } else {
      this.updateDrillDisplay();
    }
  },

  showHint() {
    const drill = this.currentDrills[this.currentDrillIndex];
    if (!drill) return;
    let expected = drill.target || drill.french || '';
    if (this.register === 'informal') expected = this.convertToInformal(expected);
    if (this.drillDirection === 'fr-fr-dictation') {
      const firstWord = expected.split(/\s+/)[0] || expected.substring(0, 5);
      alert('Hint: ' + firstWord + ' ...');
    } else {
      alert('Hint: ' + expected.substring(0, Math.min(10, expected.length)) + '...');
    }
  },

  skipDrill() { this.nextDrill(); },

  closeDrill() {
    // If autopilot active and user manually closes, stop autopilot
    if (typeof RhodesAutopilot !== 'undefined' && RhodesAutopilot.active) {
      RhodesAutopilot.stop();
      return;
    }
    document.getElementById('drillView')?.classList.remove('active', 'fullscreen');
    this.updateStatsBar();
    if (this.currentMode === 'srs') {
      document.getElementById('srsView').style.display = 'block';
      this.updateSRSStats();
    } else if (this.currentUnit) {
      document.getElementById('unitDetailView').style.display = 'block';
      this.renderUnits();
    } else {
      document.getElementById('linearView').style.display = 'block';
      this.renderUnits();
    }
  },

  toggleFullscreen() {
    const drillView = document.getElementById('drillView');
    const btn = document.getElementById('fullscreenBtn');
    drillView?.classList.toggle('fullscreen');
    if (btn) btn.textContent = drillView?.classList.contains('fullscreen') ? '\u2715' : '\u26F6';
  },

  // =============================================
  // EXPORT / IMPORT
  // =============================================

  exportProgress() {
    const data = RhodesStorage.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const lang = this.cfg().lang || 'course';
    a.download = `rhodes_${lang}_progress_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importProgress(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (RhodesStorage.import(e.target.result)) {
        alert('Progress imported successfully! Refreshing...');
        location.reload();
      } else {
        alert('Import failed - invalid file format');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  },

  // =============================================
  // EVENT BINDING
  // =============================================

  bindEvents() {
    const el = (id) => document.getElementById(id);
    const on = (id, event, fn) => { const e = el(id); if (e) e.addEventListener(event, fn); };

    on('exportBtn', 'click', () => this.exportProgress());
    on('importBtn', 'click', () => el('importFile')?.click());
    on('importFile', 'change', (e) => this.importProgress(e));
    on('linearModeBtn', 'click', () => this.setMode('linear'));
    on('srsModeBtn', 'click', () => this.setMode('srs'));
    on('startSRSBtn', 'click', () => this.startSRSSession());
    on('closeUnitBtn', 'click', () => this.closeUnitDetail());
    on('playDialogueBtn', 'click', () => this.playDialogue());
    on('practiceDialogueBtn', 'click', () => this.startDialogueDrills());
    on('startDrillsBtn', 'click', () => this.startUnitDrills());
    on('playFrBtn', 'click', () => RhodesAudio.playAudio('fr', this.currentDrills, this.currentDrillIndex, this.audioMapping, this.drillDirection, false));
    on('playEnBtn', 'click', () => RhodesAudio.playAudio('en', this.currentDrills, this.currentDrillIndex, this.audioMapping, this.drillDirection, false));
    on('fullscreenBtn', 'click', () => this.toggleFullscreen());
    on('closeDrillBtn', 'click', () => this.closeDrill());
    on('formalBtn', 'click', () => this.setRegister('formal'));
    on('informalBtn', 'click', () => this.setRegister('informal'));
    on('repeatBtn', 'click', () => this.setDrillMode('repeat'));
    on('translateBtn', 'click', () => this.setDrillMode('translate'));
    on('micBtn', 'click', () => RhodesVoice.toggle());
    on('hintBtn', 'click', () => this.showHint());
    on('skipBtn', 'click', () => this.skipDrill());
    on('checkBtn', 'click', () => this.checkAnswer());
    on('nextBtn', 'click', () => this.nextDrill());
    on('justContinueBtn', 'click', () => { if (typeof RhodesAutopilot !== 'undefined') RhodesAutopilot.start(); });

    // Direction buttons
    on('btn-en-fr', 'click', () => this.setDirection('en-fr'));
    on('btn-fr-en', 'click', () => this.setDirection('fr-en'));
    on('btn-fr-fr-text', 'click', () => this.setDirection('fr-fr-text'));
    on('btn-fr-fr-dictation', 'click', () => this.setDirection('fr-fr-dictation'));

    // Accent keyboard
    document.querySelectorAll('.accent-key').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const char = btn.dataset.char;
        const input = el('userInput');
        if (input && char) {
          const start = input.selectionStart;
          const end = input.selectionEnd;
          input.value = input.value.substring(0, start) + char + input.value.substring(end);
          input.selectionStart = input.selectionEnd = start + char.length;
          input.focus();
        }
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!el('drillView')?.classList.contains('active')) return;
      if (e.key === 'Enter') {
        if (el('nextBtn')?.style.display !== 'none') this.nextDrill();
        else this.checkAnswer();
      } else if (e.key === 'Tab') { e.preventDefault(); this.showHint(); }
      else if (e.key === 'Escape') {
        if (typeof RhodesAutopilot !== 'undefined' && RhodesAutopilot.active) RhodesAutopilot.stop();
        else this.closeDrill();
      }
    });

    // Voice setup
    RhodesVoice.setupHandsFreeMode();
    RhodesVoice.init();
  },

  // =============================================
  // APPLY THEME FROM CONFIG
  // =============================================

  applyTheme() {
    const cfg = this.cfg();
    const theme = cfg.theme || {};
    const root = document.documentElement;

    if (theme.accentPrimary) root.style.setProperty('--accent-primary', theme.accentPrimary);
    if (theme.accentLight) root.style.setProperty('--accent-light', theme.accentLight);
    if (theme.flagColors) {
      const [c1, c2, c3] = theme.flagColors;
      if (c1) root.style.setProperty('--flag-color-1', c1);
      if (c2) root.style.setProperty('--flag-color-2', c2);
      if (c3) root.style.setProperty('--flag-color-3', c3);
    }

    // Set page title
    if (cfg.courseName) document.title = cfg.courseName;

    // Set header — new 3-part layout (flag / name / subtitle) or legacy single titleDisplay
    const titleFlag = document.getElementById('titleFlag');
    const titleName = document.getElementById('titleName');
    const titleSub = document.getElementById('titleSub');
    if (titleFlag && titleName && cfg.titleFlagHtml) {
      titleFlag.innerHTML = cfg.titleFlagHtml;
      titleName.innerHTML = cfg.titleNameHtml || '';
      if (titleSub) titleSub.innerHTML = cfg.titleSubHtml || '';
    } else {
      // Legacy fallback
      const titleDisplay = document.getElementById('titleDisplay');
      if (titleDisplay && cfg.titleHtml) {
        titleDisplay.innerHTML = cfg.titleHtml;
      }
    }

    // Set total units in stats
    const totalUnits = cfg.units?.length || 24;
    const unitsTotal = document.querySelector('.stat strong + span + span') || null;
    // Update /X display
    document.querySelectorAll('.stat').forEach(stat => {
      const text = stat.textContent;
      if (text.includes('/24')) stat.innerHTML = stat.innerHTML.replace('/24', '/' + totalUnits);
    });

    // Hide features not enabled
    if (!cfg.features?.hasRegisterToggle) {
      document.querySelectorAll('.register-toggle').forEach(el => { if (el.querySelector('#formalBtn')) el.style.display = 'none'; });
    }
    if (!cfg.features?.hasDirectionToggle) {
      const dirToggle = document.querySelector('.direction-toggle');
      if (dirToggle) dirToggle.style.display = 'none';
    }
  },

  // =============================================
  // BOOT
  // =============================================

  init() {
    this.applyTheme();
    this.bindEvents();
    this.loadCourse();
  }
};

window.RhodesEngine = RhodesEngine;

// Boot on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  RhodesEngine.init();
});
