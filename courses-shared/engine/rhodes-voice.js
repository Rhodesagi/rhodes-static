/**
 * Rhodes Universal Language Engine - Voice Recognition Module
 * Handles: Speech recognition, hands-free mode
 * Reads language code from window.COURSE_CONFIG.langCode
 */

const RhodesVoice = {
  recognition: null,
  isRecording: false,
  handsFreeMode: false,
  handsFreeActive: false,
  slowMode: false,
  listenTimeout: null,

  // Normalize for fuzzy comparison
  normalizeForComparison(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  },

  // Levenshtein similarity (0-1)
  levenshteinSimilarity(a, b) {
    if (a.length === 0) return b.length === 0 ? 1 : 0;
    if (b.length === 0) return 0;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j-1] === b[i-1] ? 0 : 1;
        matrix[i][j] = Math.min(matrix[i-1][j] + 1, matrix[i][j-1] + 1, matrix[i-1][j-1] + cost);
      }
    }
    return 1 - (matrix[b.length][a.length] / Math.max(a.length, b.length));
  },

  // Fuzzy match for non-native speakers
  fuzzyMatch(spoken, expected) {
    const s = this.normalizeForComparison(spoken);
    const e = this.normalizeForComparison(expected);
    if (s === e) return { match: true, score: 100 };
    const spokenWords = s.split(' ').filter(w => w.length > 0);
    const expectedWords = e.split(' ').filter(w => w.length > 0);
    let matchedWords = 0;
    for (const sw of spokenWords) {
      for (const ew of expectedWords) {
        if (sw === ew || this.levenshteinSimilarity(sw, ew) > 0.6) { matchedWords++; break; }
      }
    }
    const score = (matchedWords / Math.max(spokenWords.length, expectedWords.length)) * 100;
    return { match: score >= 60, score: Math.round(score) };
  },

  // Initialize speech recognition
  init() {
    if (this.recognition) return true;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      const micBtn = document.getElementById('micBtn');
      if (micBtn) micBtn.classList.add('disabled');
      return false;
    }

    const cfg = window.COURSE_CONFIG;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = cfg?.langCode || 'fr-FR';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 5;

    this.recognition.onstart = () => {
      this.isRecording = true;
      const micBtn = document.getElementById('micBtn');
      if (micBtn) micBtn.classList.add('recording');
      const status = document.getElementById('voiceStatus');
      if (status) { status.textContent = 'Listening...'; status.style.color = '#dc3545'; }

      // Adaptive timeout based on expected response length
      const engine = window.RhodesEngine;
      const drill = engine?.currentDrills?.[engine?.currentDrillIndex];
      const expectedLen = drill?.target?.length || drill?.french?.length || 20;
      const baseTime = this.slowMode ? 4000 : 2500;
      const perCharTime = this.slowMode ? 120 : 80;
      const timeout = baseTime + (expectedLen * perCharTime);

      if (this.listenTimeout) clearTimeout(this.listenTimeout);
      this.listenTimeout = setTimeout(() => {
        if (this.isRecording && this.recognition) this.recognition.stop();
      }, timeout);
    };

    this.recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const engine = window.RhodesEngine;
        const drill = engine?.currentDrills?.[engine?.currentDrillIndex];
        const expected = drill?.target || drill?.french || '';

        let bestTranscript = lastResult[0].transcript;
        let bestScore = 0;
        for (let i = 0; i < lastResult.length; i++) {
          const alt = lastResult[i].transcript;
          const result = this.fuzzyMatch(alt, expected);
          if (result.score > bestScore) { bestScore = result.score; bestTranscript = alt; }
        }

        const input = document.getElementById('userInput');
        if (input) input.value = bestTranscript;
        const status = document.getElementById('voiceStatus');
        if (status) {
          status.textContent = `Heard: "${bestTranscript}" (${bestScore}% match)`;
          status.style.color = bestScore >= 60 ? '#28a745' : '#ffc107';
        }

        if (this.handsFreeMode && engine) {
          setTimeout(() => engine.checkVoiceAnswer(bestTranscript, expected), 300);
        }
      } else {
        const status = document.getElementById('voiceStatus');
        if (status) status.textContent = `"${lastResult[0].transcript}"...`;
      }
    };

    this.recognition.onerror = (event) => {
      let msg = '';
      switch (event.error) {
        case 'no-speech': msg = 'No speech heard - try again'; break;
        case 'audio-capture': msg = 'No microphone found'; break;
        case 'not-allowed': msg = 'Mic blocked - allow in browser'; break;
        default: msg = event.error;
      }
      const status = document.getElementById('voiceStatus');
      if (status) { status.textContent = msg; status.style.color = '#dc3545'; }
      this.stopRecording();
      if (this.handsFreeMode && event.error === 'no-speech') {
        setTimeout(() => this.startListening(), 2000);
      }
    };

    this.recognition.onend = () => this.stopRecording();
    return true;
  },

  toggle() {
    if (!this.recognition && !this.init()) {
      alert('Voice not supported. Use Chrome or Edge.');
      return;
    }
    if (this.isRecording) this.recognition.stop();
    else this.startListening();
  },

  startListening() {
    if (!this.recognition) this.init();
    if (this.isRecording) return;

    // Stop all audio before listening
    if (window.RhodesAudio) window.RhodesAudio.stopAll();

    const cfg = window.COURSE_CONFIG;
    const engine = window.RhodesEngine;
    const dir = engine?.drillDirection || 'en-fr';
    this.recognition.lang = dir === 'fr-en' ? 'en-US' : (cfg?.langCode || 'fr-FR');

    const input = document.getElementById('userInput');
    if (input) input.value = '';
    try { this.recognition.start(); }
    catch (e) { setTimeout(() => this.startListening(), 200); }
  },

  stopRecording() {
    this.isRecording = false;
    const micBtn = document.getElementById('micBtn');
    if (micBtn) micBtn.classList.remove('recording');
  },

  // Hands-free flow
  startHandsFreeFlow() {
    if (!this.handsFreeMode) return;
    this.handsFreeActive = true;

    const engine = window.RhodesEngine;
    const drill = engine?.currentDrills?.[engine?.currentDrillIndex];
    if (!drill) { this.handsFreeActive = false; return; }

    const status = document.getElementById('voiceStatus');
    if (status) { status.textContent = 'Playing audio...'; status.style.color = '#666'; }

    const dir = engine?.drillDirection || 'en-fr';
    const promptLang = dir === 'fr-en' ? 'fr' : 'en';
    const responseLang = dir === 'fr-en' ? 'English' : (window.COURSE_CONFIG?.displayName || 'target language');

    window.RhodesAudio?.playAudio(promptLang, engine.currentDrills, engine.currentDrillIndex,
      engine.audioMapping, engine.drillDirection, true, () => {
        if (window.RhodesAudio) window.RhodesAudio.stopAll();
        setTimeout(() => {
          if (status) status.textContent = `Say it in ${responseLang}!`;
          this.startListening();
        }, 300);
      });
  },

  setupHandsFreeMode() {
    const checkbox = document.getElementById('handsFreeMode');
    const slowCheckbox = document.getElementById('slowMode');
    if (slowCheckbox) {
      slowCheckbox.addEventListener('change', (e) => { this.slowMode = e.target.checked; });
    }
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        this.handsFreeMode = e.target.checked;
        if (this.handsFreeMode) {
          if (!this.recognition) this.init();
          const status = document.getElementById('voiceStatus');
          if (status) { status.textContent = 'Hands-free ON'; status.style.color = '#28a745'; }
          if (document.getElementById('drillView')?.classList.contains('active')) {
            this.startHandsFreeFlow();
          }
        } else {
          this.handsFreeActive = false;
          if (this.recognition && this.isRecording) this.recognition.stop();
          const status = document.getElementById('voiceStatus');
          if (status) status.textContent = '';
        }
      });
    }
  }
};

window.RhodesVoice = RhodesVoice;
