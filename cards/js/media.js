/* RhodesCards — Media upload/display (stub for Phase 1C) */

RC.uploadMedia = async function(file) {
    var formData = new FormData();
    formData.append('file', file);
    try {
        var data = await RC.apiUpload('/media/upload', formData);
        return data.url;
    } catch (e) {
        RC.toast('Upload failed: ' + e.message, 'error');
        return null;
    }
};

RC.initMediaHandlers = function(textareaId) {
    var textarea = document.getElementById(textareaId);
    if (!textarea) return;

    // Paste image handler
    textarea.addEventListener('paste', function(e) {
        var items = e.clipboardData && e.clipboardData.items;
        if (!items) return;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image/') === 0) {
                e.preventDefault();
                var file = items[i].getAsFile();
                RC.uploadMedia(file).then(function(url) {
                    if (url) {
                        var pos = textarea.selectionStart;
                        var text = textarea.value;
                        var insert = '![](' + url + ')';
                        textarea.value = text.substring(0, pos) + insert + text.substring(pos);
                        textarea.selectionStart = textarea.selectionEnd = pos + insert.length;
                        textarea.focus();
                    }
                });
                break;
            }
        }
    });
};
