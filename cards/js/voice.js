/* RhodesCards — Voice Recognition (Web Speech API)
   Speak your answer instead of typing it. */

RC.voiceState = {
    recognition: null,
    listening: false,
    supported: false,
};

RC.initVoice = function() {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        RC.voiceState.supported = false;
        return;
    }
    RC.voiceState.supported = true;
    RC.voiceState.recognition = new SpeechRecognition();
    RC.voiceState.recognition.continuous = false;
    RC.voiceState.recognition.interimResults = true;
    RC.voiceState.recognition.maxAlternatives = 3;
};

RC.startVoiceInput = function(targetId, lang) {
    if (!RC.voiceState.supported) {
        RC.toast('Voice recognition not supported in this browser', 'error');
        return;
    }
    if (RC.voiceState.listening) {
        RC.stopVoiceInput();
        return;
    }

    var target = document.getElementById(targetId);
    if (!target) return;

    RC.voiceState.recognition.lang = lang || 'en-US';
    RC.voiceState.listening = true;

    var btn = document.getElementById('voiceBtn');
    if (btn) btn.classList.add('listening');

    RC.voiceState.recognition.onresult = function(event) {
        var transcript = '';
        for (var i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        target.value = transcript;

        // For type_answer cards, auto-check if final
        if (event.results[event.results.length - 1].isFinal) {
            RC.stopVoiceInput();
            // If in review and it's a type-answer card, auto-reveal
            if (targetId === 'typeInput') {
                setTimeout(function() { RC.revealAnswer(); }, 300);
            }
        }
    };

    RC.voiceState.recognition.onerror = function(event) {
        RC.voiceState.listening = false;
        if (btn) btn.classList.remove('listening');
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
            RC.toast('Voice error: ' + event.error, 'error');
        }
    };

    RC.voiceState.recognition.onend = function() {
        RC.voiceState.listening = false;
        if (btn) btn.classList.remove('listening');
    };

    try {
        RC.voiceState.recognition.start();
    } catch (e) {
        RC.voiceState.listening = false;
        if (btn) btn.classList.remove('listening');
    }
};

RC.stopVoiceInput = function() {
    if (RC.voiceState.recognition && RC.voiceState.listening) {
        RC.voiceState.recognition.stop();
    }
    RC.voiceState.listening = false;
    var btn = document.getElementById('voiceBtn');
    if (btn) btn.classList.remove('listening');
};

RC.voiceButton = function(targetId) {
    if (!RC.voiceState.supported) return '';
    return '<button class="voice-btn" id="voiceBtn" onclick="event.stopPropagation();RC.startVoiceInput(\'' + targetId + '\')" title="Voice input">&#127908;</button>';
};
