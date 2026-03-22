/* RhodesCards — Card content rendering (Markdown + sanitize + cloze + media) */

// Post-render KaTeX on an element (call after innerHTML is set)
RC.renderMath = function(element) {
    if (!element || typeof renderMathInElement === 'undefined') return;
    try {
        renderMathInElement(element, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true },
            ],
            throwOnError: false,
        });
    } catch (e) { /* ignore KaTeX errors */ }
};

RC.renderCardContent = function(text) {
    if (!text) return '';

    // Convert [hint]...[/hint] to <details> collapsible blocks before Markdown
    text = text.replace(/\[hint(?::([^\]]*))?\]([\s\S]*?)\[\/hint\]/gi, function(match, label, content) {
        var summary = label ? label.trim() : 'Show hint';
        return '<details class="rc-collapsible"><summary>' + summary + '</summary>\n' + content + '\n</details>';
    });

    // Preserve cloze markers from Markdown mangling
    var clozeMap = {};
    var clozeIdx = 0;
    text = text.replace(/\{\{c(\d+)::([^}]*?)(?:::([^}]*?))?\}\}/g, function(match) {
        var key = '\x00CLOZE_' + clozeIdx + '\x00';
        clozeMap[key] = match;
        clozeIdx++;
        return key;
    });

    // Preserve [sound:...] and [video:...] markers
    var mediaMap = {};
    var mediaIdx = 0;
    text = text.replace(/\[(sound|video):([^\]]+)\]/g, function(match) {
        var key = '\x00MEDIA_' + mediaIdx + '\x00';
        mediaMap[key] = match;
        mediaIdx++;
        return key;
    });

    // Parse Markdown
    var html;
    if (typeof marked !== 'undefined') {
        html = marked.parse(text, { breaks: true, gfm: true });
    } else {
        html = RC.esc(text).replace(/\n/g, '<br>');
    }

    // Sanitize
    if (typeof DOMPurify !== 'undefined') {
        html = DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'ul', 'ol', 'li',
                           'h1', 'h2', 'h3', 'h4', 'blockquote', 'img', 'a', 'table', 'thead',
                           'tbody', 'tr', 'th', 'td', 'sup', 'sub', 'hr', 'span', 'div', 'del',
                           'details', 'summary'],
            ALLOWED_ATTR: ['src', 'alt', 'title', 'href', 'class', 'width', 'height', 'target', 'open'],
        });
    }

    // Restore cloze markers
    for (var ck in clozeMap) {
        html = html.replace(ck, clozeMap[ck]);
    }

    // Restore and render media markers
    for (var mk in mediaMap) {
        var mediaMatch = mediaMap[mk].match(/\[(sound|video):([^\]]+)\]/);
        if (mediaMatch) {
            var mediaType = mediaMatch[1];
            var mediaFile = mediaMatch[2];
            if (mediaType === 'sound') {
                html = html.replace(mk, '<audio controls class="card-audio" src="' + RC.esc(mediaFile) + '"></audio>');
            } else {
                html = html.replace(mk, '<video controls class="card-video" src="' + RC.esc(mediaFile) + '"></video>');
            }
        }
    }

    return html;
};

RC.renderCloze = function(text, ordinal, revealed) {
    var clozeNum = (ordinal || 0) + 1;
    // First render markdown for non-cloze parts
    var rendered = text.replace(/\{\{c(\d+)::([^}]*?)(?:::([^}]*?))?\}\}/g, function(match, num, answer, hint) {
        if (parseInt(num) === clozeNum) {
            if (revealed) {
                return '<span class="cloze-revealed">' + RC.renderCardContent(answer) + '</span>';
            } else {
                return '<span class="cloze-blank">' + (hint ? RC.esc(hint) : '[...]') + '</span>';
            }
        } else {
            return RC.renderCardContent(answer);
        }
    });
    // Render the surrounding text as markdown too
    // But we need to avoid double-rendering. Strip cloze first, then render.
    return rendered;
};

RC.renderClozeContent = function(text, ordinal, revealed) {
    if (!text) return '';

    var clozeNum = (ordinal || 0) + 1;

    // Extract cloze markers, process text around them
    var parts = [];
    var lastIdx = 0;
    var regex = /\{\{c(\d+)::([^}]*?)(?:::([^}]*?))?\}\}/g;
    var m;

    while ((m = regex.exec(text)) !== null) {
        // Add text before this match
        if (m.index > lastIdx) {
            parts.push({ type: 'text', content: text.substring(lastIdx, m.index) });
        }
        parts.push({ type: 'cloze', num: parseInt(m[1]), answer: m[2], hint: m[3] || '' });
        lastIdx = m.index + m[0].length;
    }
    if (lastIdx < text.length) {
        parts.push({ type: 'text', content: text.substring(lastIdx) });
    }

    // Rebuild with cloze handling
    var rebuilt = '';
    for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.type === 'text') {
            rebuilt += RC.renderCardContent(p.content);
        } else if (p.type === 'cloze') {
            if (p.num === clozeNum) {
                if (revealed) {
                    rebuilt += '<span class="cloze-revealed">' + RC.esc(p.answer) + '</span>';
                } else {
                    rebuilt += '<span class="cloze-blank">' + (p.hint ? RC.esc(p.hint) : '[...]') + '</span>';
                }
            } else {
                rebuilt += RC.esc(p.answer);
            }
        }
    }
    return rebuilt;
};

RC.getClozeAnswer = function(text, ordinal) {
    var clozeNum = (ordinal || 0) + 1;
    var re = new RegExp('\\{\\{c' + clozeNum + '::([^}]*?)(?:::([^}]*?))?\\}\\}');
    var m = text.match(re);
    return m ? m[1] : '';
};
