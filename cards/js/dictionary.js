/* RhodesCards — Pop-up Dictionary (double-click/select word in review) */

RC.dictPopup = null;

RC.initDictionary = function() {
    // Listen for double-click on review card content
    document.addEventListener('dblclick', function(e) {
        var reviewCard = document.getElementById('reviewCard');
        if (!reviewCard || !reviewCard.contains(e.target)) return;

        var sel = window.getSelection();
        var word = sel ? sel.toString().trim() : '';
        if (!word || word.length < 2 || word.length > 40 || /\s/.test(word)) return;

        RC.showDictPopup(word, e.clientX, e.clientY);
    });

    // Close popup on click outside
    document.addEventListener('click', function(e) {
        if (RC.dictPopup && !RC.dictPopup.contains(e.target)) {
            RC.closeDictPopup();
        }
    });

    // Close on escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && RC.dictPopup) RC.closeDictPopup();
    });
};

RC.showDictPopup = function(word, x, y) {
    RC.closeDictPopup();

    var popup = document.createElement('div');
    popup.className = 'dict-popup';
    popup.innerHTML = '<div class="dict-header"><span class="dict-word">' + RC.esc(word) + '</span>'
        + '<button class="dict-close" onclick="RC.closeDictPopup()">&times;</button></div>'
        + '<div class="dict-body"><div class="spinner" style="width:16px;height:16px;border-width:2px"></div> Looking up...</div>';

    document.body.appendChild(popup);
    RC.dictPopup = popup;

    // Position near click, keep on screen
    var rect = popup.getBoundingClientRect();
    var left = Math.min(x, window.innerWidth - rect.width - 12);
    var top = y + 20;
    if (top + rect.height > window.innerHeight - 12) top = y - rect.height - 10;
    popup.style.left = Math.max(8, left) + 'px';
    popup.style.top = Math.max(8, top) + 'px';

    RC.fetchDefinition(word);
};

RC.closeDictPopup = function() {
    if (RC.dictPopup) {
        RC.dictPopup.remove();
        RC.dictPopup = null;
    }
};

RC.fetchDefinition = async function(word) {
    try {
        var resp = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word));
        if (!resp.ok) {
            RC.showDictResult(word, null);
            return;
        }
        var data = await resp.json();
        RC.showDictResult(word, data);
    } catch (e) {
        RC.showDictResult(word, null);
    }
};

RC.showDictResult = function(word, data) {
    if (!RC.dictPopup) return;
    var body = RC.dictPopup.querySelector('.dict-body');
    if (!body) return;

    if (!data || !data.length) {
        body.innerHTML = '<div class="dict-no-result">No definition found for "' + RC.esc(word) + '"</div>';
        return;
    }

    var entry = data[0];
    var html = '';

    // Phonetics
    if (entry.phonetic) {
        html += '<div class="dict-phonetic">' + RC.esc(entry.phonetic) + '</div>';
    }
    // Audio button
    var audioUrl = '';
    if (entry.phonetics) {
        for (var i = 0; i < entry.phonetics.length; i++) {
            if (entry.phonetics[i].audio) { audioUrl = entry.phonetics[i].audio; break; }
        }
    }
    if (audioUrl) {
        html += '<button class="btn btn-sm dict-audio-btn" onclick="new Audio(\'' + RC.esc(audioUrl) + '\').play()">&#128264; Play</button>';
    }

    // Meanings (max 3)
    var meanings = entry.meanings || [];
    var shown = 0;
    for (var m = 0; m < meanings.length && shown < 3; m++) {
        var mg = meanings[m];
        html += '<div class="dict-pos">' + RC.esc(mg.partOfSpeech) + '</div>';
        var defs = mg.definitions || [];
        for (var d = 0; d < defs.length && d < 2; d++) {
            html += '<div class="dict-def">' + (d + 1) + '. ' + RC.esc(defs[d].definition) + '</div>';
            if (defs[d].example) {
                html += '<div class="dict-example">"' + RC.esc(defs[d].example) + '"</div>';
            }
        }
        shown++;
    }

    body.innerHTML = html;

    // Reposition if needed
    var rect = RC.dictPopup.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 8) {
        RC.dictPopup.style.top = Math.max(8, window.innerHeight - rect.height - 12) + 'px';
    }
};

// Init on load
RC.initDictionary();
