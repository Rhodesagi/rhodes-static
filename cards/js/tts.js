/* RhodesCards — Text-to-Speech integration
   Uses Rhodes TTS endpoint (/tts/stream) powered by ElevenLabs.
   Also supports Web Speech API as fallback. */

RC.ttsState = {
    playing: false,
    audio: null,
    autoPlay: false, // auto-read on reveal
};

RC.getTTSSettings = function() {
    try {
        var saved = localStorage.getItem('rc_tts');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { engine: 'elevenlabs', autoPlayFront: false, autoPlayBack: true, rate: 1.0, lang: '' };
};

RC.saveTTSSettings = function(settings) {
    localStorage.setItem('rc_tts', JSON.stringify(settings));
};

RC.speakText = function(text, callback) {
    if (!text || RC.ttsState.playing) return;
    // Strip markdown/HTML
    var clean = text.replace(/\{\{c\d+::([^}]*?)(?:::[^}]*?)?\}\}/g, '$1')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[sound:[^\]]+\]/g, '')
        .replace(/\[video:[^\]]+\]/g, '')
        .replace(/[*_~`#>\[\]]/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\$\$[^$]+\$\$/g, '')
        .replace(/\$[^$]+\$/g, '')
        .trim();
    if (!clean) return;

    var settings = RC.getTTSSettings();

    if (settings.engine === 'browser') {
        RC._speakBrowser(clean, settings, callback);
    } else {
        RC._speakElevenLabs(clean, settings, callback);
    }
};

RC._speakElevenLabs = function(text, settings, callback) {
    RC.ttsState.playing = true;
    var url = '/tts/stream';
    var body = JSON.stringify({ text: text.substring(0, 500), source: 'rhodescards' });

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
    }).then(function(res) {
        if (!res.ok) throw new Error('TTS error');
        return res.blob();
    }).then(function(blob) {
        var audioUrl = URL.createObjectURL(blob);
        var audio = new Audio(audioUrl);
        audio.playbackRate = settings.rate || 1.0;
        RC.ttsState.audio = audio;
        audio.onended = function() {
            RC.ttsState.playing = false;
            URL.revokeObjectURL(audioUrl);
            if (callback) callback();
        };
        audio.onerror = function() {
            RC.ttsState.playing = false;
            URL.revokeObjectURL(audioUrl);
        };
        audio.play().catch(function() { RC.ttsState.playing = false; });
    }).catch(function() {
        RC.ttsState.playing = false;
        // Fallback to browser TTS
        RC._speakBrowser(text, settings, callback);
    });
};

RC._speakBrowser = function(text, settings, callback) {
    if (!('speechSynthesis' in window)) {
        RC.toast('TTS not available in this browser', 'error');
        return;
    }
    RC.ttsState.playing = true;
    var utterance = new SpeechSynthesisUtterance(text.substring(0, 500));
    utterance.rate = settings.rate || 1.0;
    if (settings.lang) utterance.lang = settings.lang;
    utterance.onend = function() {
        RC.ttsState.playing = false;
        if (callback) callback();
    };
    utterance.onerror = function() { RC.ttsState.playing = false; };
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
};

RC.stopTTS = function() {
    if (RC.ttsState.audio) {
        RC.ttsState.audio.pause();
        RC.ttsState.audio = null;
    }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    RC.ttsState.playing = false;
};

RC.ttsButton = function(text) {
    return '<button class="tts-btn" onclick="event.stopPropagation();RC.speakText(\'' + text.replace(/'/g, "\\'").replace(/\n/g, ' ').substring(0, 200) + '\')" title="Read aloud">&#128264;</button>';
};

RC.autoPlayTTS = function(text, isBack) {
    var settings = RC.getTTSSettings();
    if (isBack && settings.autoPlayBack) RC.speakText(text);
    if (!isBack && settings.autoPlayFront) RC.speakText(text);
};
