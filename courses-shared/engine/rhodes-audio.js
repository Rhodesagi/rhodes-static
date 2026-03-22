/**
 * Rhodes Universal Language Engine - Audio Module
 * Handles: AudioFeedback tones, MP3 playback, TTS fallback, dialogue playback
 * Reads config from window.COURSE_CONFIG
 */

const RhodesAudio = {
  // Web Audio API feedback tones
  ctx: null,
  currentAudio: null,
  audioFallbackUsed: false,
  audioEndCallback: null,
  dialogueAudio: null,
  _voiceCache: {},

  // Select best available voice for a language code
  getBestVoice(langCode) {
    if (this._voiceCache[langCode]) return this._voiceCache[langCode];
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;
    const lang = langCode.split('-')[0];
    const matches = voices.filter(v => v.lang.startsWith(lang));
    if (!matches.length) return null;
    // Prefer enhanced/premium voices, then non-default local voices
    const premium = matches.find(v => /premium|enhanced|natural|neural/i.test(v.name));
    if (premium) { this._voiceCache[langCode] = premium; return premium; }
    const local = matches.find(v => v.localService && !v.name.includes('Compact'));
    if (local) { this._voiceCache[langCode] = local; return local; }
    this._voiceCache[langCode] = matches[0];
    return matches[0];
  },

  initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.ctx;
  },

  correct() {
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.warn('Audio feedback unavailable:', e.message);
    }
  },

  incorrect() {
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn('Audio feedback unavailable:', e.message);
    }
  },

  // CDN URL builder
  cdnUrl(path) {
    const cfg = window.COURSE_CONFIG;
    const baseUrl = cfg?.cdn?.baseUrl || '';
    const version = cfg?.audio?.version || '1.0.0';
    if (!baseUrl) return path;
    return `${baseUrl}${path}?v=${version}`;
  },

  // Fetch with CDN first, local fallback
  async fetchWithFallback(cdnPath, localPath) {
    const cfg = window.COURSE_CONFIG;
    const baseUrl = cfg?.cdn?.baseUrl || '';
    if (!baseUrl) return fetch(localPath || cdnPath);
    try {
      const response = await fetch(this.cdnUrl(cdnPath));
      if (response.ok) return response;
      throw new Error(`CDN returned ${response.status}`);
    } catch (e) {
      console.warn('CDN fetch failed, trying local fallback:', e.message);
      return fetch(localPath || cdnPath);
    }
  },

  // Play drill audio - MP3 with TTS fallback
  playAudio(lang, drills, drillIndex, audioMapping, drillDirection, handsFreeMode, onComplete) {
    const cfg = window.COURSE_CONFIG;
    const langCode = lang === 'fr' ? (cfg?.langCode || 'fr-FR') : 'en-GB';

    // Stop ALL audio first
    speechSynthesis.cancel();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    this.audioFallbackUsed = false;
    this.audioEndCallback = onComplete || null;

    const drill = drills?.[drillIndex];
    if (!drill) {
      if (this.audioEndCallback) this.audioEndCallback();
      return;
    }

    const audioFileId = audioMapping ? audioMapping[drill.id] : null;

    const useTTSFallback = () => {
      if (this.audioFallbackUsed) return;
      this.audioFallbackUsed = true;
      this.currentAudio = null;

      const text = lang === 'fr'
        ? document.getElementById('promptFr')?.textContent
        : document.getElementById('promptEn')?.textContent;
      if (!text) {
        if (this.audioEndCallback) this.audioEndCallback();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 0.92;
      const voice = this.getBestVoice(langCode);
      if (voice) utterance.voice = voice;
      utterance.onend = () => { if (this.audioEndCallback) this.audioEndCallback(); };
      speechSynthesis.speak(utterance);
    };

    if (!audioFileId) {
      useTTSFallback();
      return;
    }

    const audioDrillsPath = cfg?.audio?.drills || 'audio/drills/';
    const audioFile = this.cdnUrl(`${audioDrillsPath}${audioFileId}_${lang}.mp3`);

    this.currentAudio = new Audio();
    this.currentAudio.oncanplaythrough = () => {
      if (!this.audioFallbackUsed) {
        this.currentAudio.play().catch(() => {});
      }
    };
    this.currentAudio.onended = () => { if (this.audioEndCallback) this.audioEndCallback(); };
    this.currentAudio.onerror = useTTSFallback;
    this.currentAudio.src = audioFile;

    setTimeout(() => {
      if (!this.audioFallbackUsed && this.currentAudio && this.currentAudio.readyState < 3) {
        useTTSFallback();
      }
    }, 1000);
  },

  // Play unit dialogue audio
  playDialogue(unitData, currentUnit) {
    const cfg = window.COURSE_CONFIG;
    if (!unitData) return;

    if (this.dialogueAudio) {
      this.dialogueAudio.pause();
      this.dialogueAudio = null;
    }

    const unitNum = String(currentUnit).padStart(2, '0');
    const dialoguesPath = cfg?.audio?.dialogues || 'audio/';
    const audioPath = this.cdnUrl(`${dialoguesPath}unit${unitNum}_dialogue.mp3`);

    this.dialogueAudio = new Audio(audioPath);
    this.dialogueAudio.onerror = () => {
      const langCode = cfg?.langCode || 'fr-FR';
      const voice = this.getBestVoice(langCode);
      let index = 0;
      const dialogue = unitData.dialogue || [];
      function speakNext() {
        if (index >= dialogue.length) return;
        const line = dialogue[index];
        const text = line.fr || line.target || '';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.rate = 0.88;
        if (voice) utterance.voice = voice;
        utterance.onend = () => { index++; setTimeout(speakNext, 400); };
        speechSynthesis.speak(utterance);
      }
      speakNext();
    };
    this.dialogueAudio.play();
  },

  // Promise-based dialogue playback for autopilot
  playDialogueAsync(unitData, currentUnit) {
    return new Promise((resolve) => {
      const cfg = window.COURSE_CONFIG;
      if (!unitData) { resolve(); return; }

      if (this.dialogueAudio) {
        this.dialogueAudio.pause();
        this.dialogueAudio = null;
      }

      const unitNum = String(currentUnit).padStart(2, '0');
      const dialoguesPath = cfg?.audio?.dialogues || 'audio/';
      const audioPath = this.cdnUrl(`${dialoguesPath}unit${unitNum}_dialogue.mp3`);

      this.dialogueAudio = new Audio(audioPath);

      this.dialogueAudio.onended = () => {
        this.dialogueAudio = null;
        resolve();
      };

      this.dialogueAudio.onerror = () => {
        // TTS fallback with completion tracking
        this.dialogueAudio = null;
        const langCode = cfg?.langCode || 'fr-FR';
        const voice = this.getBestVoice(langCode);
        let index = 0;
        const dialogue = unitData.dialogue || [];

        if (dialogue.length === 0) { resolve(); return; }

        function speakNext() {
          if (index >= dialogue.length) { resolve(); return; }
          const line = dialogue[index];
          const text = line.fr || line.target || '';
          if (!text) { index++; speakNext(); return; }
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = langCode;
          utterance.rate = 0.88;
          if (voice) utterance.voice = voice;
          utterance.onend = () => { index++; setTimeout(speakNext, 400); };
          utterance.onerror = () => { index++; setTimeout(speakNext, 400); };
          speechSynthesis.speak(utterance);
        }
        speakNext();
      };

      this.dialogueAudio.play().catch(() => {
        this.dialogueAudio.onerror();
      });
    });
  },

  // Stop all audio
  stopAll() {
    speechSynthesis.cancel();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    if (this.dialogueAudio) {
      this.dialogueAudio.pause();
      this.dialogueAudio = null;
    }
  }
};

window.RhodesAudio = RhodesAudio;
