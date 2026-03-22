/* RhodesCards — Rich Text Toolbar for card editor textareas */

RC.toolbarButtons = [
    { label: 'B', title: 'Bold', before: '**', after: '**' },
    { label: 'I', title: 'Italic', before: '*', after: '*' },
    { label: '<u>U</u>', title: 'Underline', before: '<u>', after: '</u>' },
    { label: '~S~', title: 'Strikethrough', before: '~~', after: '~~' },
    { label: '`', title: 'Inline code', before: '`', after: '`' },
    { label: '{}', title: 'Code block', before: '```\n', after: '\n```' },
    { label: 'H', title: 'Heading', before: '## ', after: '' },
    { label: '&#9679;', title: 'Bullet list', before: '- ', after: '', line: true },
    { label: '1.', title: 'Numbered list', before: '1. ', after: '', line: true },
    { label: '>', title: 'Blockquote', before: '> ', after: '', line: true },
    { label: '&#128279;', title: 'Link', before: '[', after: '](url)' },
    { label: '&#128247;', title: 'Image', before: '![', after: '](url)' },
    { label: '$', title: 'Math (inline)', before: '$', after: '$' },
    { label: '$$', title: 'Math (block)', before: '$$\n', after: '\n$$' },
    { label: 'c1', title: 'Cloze deletion', before: '{{c1::', after: '}}' },
    { label: '<mark>H</mark>', title: 'Highlight', before: '<mark>', after: '</mark>' },
];

RC.createToolbar = function(textareaId) {
    var textarea = document.getElementById(textareaId);
    if (!textarea || textarea.dataset.toolbarAttached) return;
    textarea.dataset.toolbarAttached = '1';

    var toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';

    for (var i = 0; i < RC.toolbarButtons.length; i++) {
        (function(btn) {
            var el = document.createElement('button');
            el.type = 'button';
            el.className = 'toolbar-btn';
            el.innerHTML = btn.label;
            el.title = btn.title;
            el.addEventListener('click', function(e) {
                e.preventDefault();
                RC.insertMarkdown(textareaId, btn.before, btn.after, btn.line);
            });
            toolbar.appendChild(el);
        })(RC.toolbarButtons[i]);
    }

    textarea.parentNode.insertBefore(toolbar, textarea);
};

RC.insertMarkdown = function(textareaId, before, after, linePrefix) {
    var ta = document.getElementById(textareaId);
    if (!ta) return;

    var start = ta.selectionStart;
    var end = ta.selectionEnd;
    var text = ta.value;
    var selected = text.substring(start, end);

    var replacement;
    if (linePrefix && !selected) {
        // For line-prefix items with no selection, just insert at line start
        var lineStart = text.lastIndexOf('\n', start - 1) + 1;
        ta.value = text.substring(0, lineStart) + before + text.substring(lineStart);
        ta.selectionStart = ta.selectionEnd = start + before.length;
    } else {
        replacement = before + (selected || 'text') + after;
        ta.value = text.substring(0, start) + replacement + text.substring(end);

        if (selected) {
            ta.selectionStart = start + before.length;
            ta.selectionEnd = start + before.length + selected.length;
        } else {
            // Select the placeholder "text"
            ta.selectionStart = start + before.length;
            ta.selectionEnd = start + before.length + 4;
        }
    }

    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
};

// Attach toolbars to known textareas
RC.initToolbars = function() {
    RC.createToolbar('addFront');
    RC.createToolbar('addBack');
    RC.createToolbar('editFront');
    RC.createToolbar('editBack');
};

// Hook into showAdd to attach toolbars when view appears
var _origShowAdd = RC.showAdd;
RC.showAdd = function() {
    _origShowAdd.apply(this, arguments);
    RC.createToolbar('addFront');
    RC.createToolbar('addBack');
};

// Hook into openCardEditor to attach toolbars when modal appears
var _origOpenEditor = RC.openCardEditor;
RC.openCardEditor = async function() {
    await _origOpenEditor.apply(this, arguments);
    RC.createToolbar('editFront');
    RC.createToolbar('editBack');
};
