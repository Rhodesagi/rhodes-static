/* RhodesCards — File upload + language import */

RC.loadImportLanguages = async function() {
    try {
        var data = await RC.api('GET', '/import/languages');
        var list = document.getElementById('importLangList');
        if (!data.languages.length) {
            list.innerHTML = '<li style="color:var(--dim)">No language courses available.</li>';
            return;
        }
        list.innerHTML = data.languages.map(function(l) {
            return '<li><div><span class="lang-name">' + RC.esc(l.language) + '</span> <span class="drill-count">' + l.drill_count.toLocaleString() + ' drills</span></div>'
                + '<button class="btn btn-sm btn-primary" onclick="RC.importLanguage(\'' + l.language + '\', this)">Import</button></li>';
        }).join('');
    } catch (e) {
        document.getElementById('importLangList').innerHTML = '<li style="color:var(--red)">Error loading languages</li>';
    }
};

RC.importLanguage = async function(lang, btn) {
    if (!confirm('Import ' + lang + ' course drills?')) return;
    btn.textContent = 'Importing...';
    btn.disabled = true;
    try {
        var data = await RC.api('POST', '/import/lang', { language: lang });
        RC.toast('Imported ' + data.imported.toLocaleString() + ' cards to "' + data.deck_name + '"');
        btn.textContent = 'Done';
    } catch (e) {
        RC.toast(e.message, 'error');
        btn.textContent = 'Import';
        btn.disabled = false;
    }
};

RC.initUploadZone = function() {
    var zone = document.getElementById('uploadZone');
    var input = document.getElementById('fileInput');
    if (!zone || !input) return;

    zone.addEventListener('click', function() { input.click(); });
    zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', function() { zone.classList.remove('dragover'); });
    zone.addEventListener('drop', function(e) {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files.length) RC.uploadFile(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', function() {
        if (input.files.length) RC.uploadFile(input.files[0]);
        input.value = '';
    });
};

RC.uploadFile = async function(file) {
    var zone = document.getElementById('uploadZone');
    var status = document.getElementById('uploadStatus');
    var deckName = document.getElementById('importDeckName').value.trim();

    zone.classList.add('uploading');
    status.innerHTML = '<div class="upload-progress"><span class="filename">' + RC.esc(file.name) + '</span> uploading...</div>';

    var formData = new FormData();
    formData.append('file', file);
    if (deckName) formData.append('deck_name', deckName);

    try {
        var data = await RC.apiUpload('/import/file', formData);

        var decksInfo = data.decks_created && data.decks_created.length
            ? ' into ' + data.decks_created.map(function(d) { return '"' + d + '"'; }).join(', ')
            : data.deck_name ? ' into "' + data.deck_name + '"' : '';

        status.innerHTML = '<div class="upload-progress"><span class="result">'
            + data.imported + ' cards imported' + decksInfo + '</span>'
            + (data.skipped ? '<br><span style="color:var(--dim)">' + data.skipped + ' skipped</span>' : '')
            + '</div>';
        RC.toast(data.imported + ' cards imported');
    } catch (e) {
        status.innerHTML = '<div class="upload-progress"><span class="error">' + RC.esc(e.message) + '</span></div>';
        RC.toast(e.message, 'error');
    }

    zone.classList.remove('uploading');
};
