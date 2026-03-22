/* RhodesCards — Hierarchical Tag System
   Tree view, color-coding, pinning, tag management. */

RC.tagTree = {};
RC.tagColors = {};
RC.pinnedTags = [];

RC.loadTagSettings = function() {
    try {
        var c = localStorage.getItem('rc_tag_colors');
        if (c) RC.tagColors = JSON.parse(c);
        var p = localStorage.getItem('rc_pinned_tags');
        if (p) RC.pinnedTags = JSON.parse(p);
    } catch (e) {}
};

RC.saveTagColors = function() {
    localStorage.setItem('rc_tag_colors', JSON.stringify(RC.tagColors));
};

RC.savePinnedTags = function() {
    localStorage.setItem('rc_pinned_tags', JSON.stringify(RC.pinnedTags));
};

RC.buildTagTree = function(tags) {
    var tree = {};
    for (var i = 0; i < tags.length; i++) {
        var parts = tags[i].tag.split('::');
        var node = tree;
        for (var j = 0; j < parts.length; j++) {
            var part = parts[j];
            if (!node[part]) node[part] = { _count: 0, _fullPath: parts.slice(0, j + 1).join('::'), _children: {} };
            if (j === parts.length - 1) node[part]._count = tags[i].count;
            node = node[part]._children;
        }
    }
    return tree;
};

RC.renderTagTree = function(tree, depth) {
    depth = depth || 0;
    var html = '';
    var entries = Object.keys(tree).sort(function(a, b) {
        // Pinned first
        var aPin = RC.pinnedTags.indexOf(tree[a]._fullPath) !== -1;
        var bPin = RC.pinnedTags.indexOf(tree[b]._fullPath) !== -1;
        if (aPin && !bPin) return -1;
        if (!aPin && bPin) return 1;
        return a.localeCompare(b);
    });

    for (var i = 0; i < entries.length; i++) {
        var key = entries[i];
        var node = tree[key];
        var fullPath = node._fullPath;
        var color = RC.tagColors[fullPath] || 'var(--text)';
        var isPinned = RC.pinnedTags.indexOf(fullPath) !== -1;
        var hasChildren = Object.keys(node._children).length > 0;
        var indent = depth * 16;

        html += '<div class="tag-tree-item" style="padding-left:' + indent + 'px">'
            + (hasChildren ? '<span class="tag-tree-toggle" onclick="this.parentElement.classList.toggle(\'collapsed\')">&#9662;</span>' : '<span style="width:12px;display:inline-block"></span>')
            + (isPinned ? '<span style="color:var(--yellow);font-size:0.7rem">&#9733; </span>' : '')
            + '<span class="tag-tree-name" style="color:' + color + '" onclick="RC.applyTagFilter(\'' + RC.esc(fullPath) + '\')">' + RC.esc(key) + '</span>'
            + '<span class="tag-tree-count">' + (node._count || '') + '</span>'
            + '<span class="tag-tree-actions">'
            + '<button onclick="event.stopPropagation();RC.togglePinTag(\'' + RC.esc(fullPath) + '\')" title="Pin" class="tag-action-btn">' + (isPinned ? '&#9733;' : '&#9734;') + '</button>'
            + '<button onclick="event.stopPropagation();RC.cycleTagColor(\'' + RC.esc(fullPath) + '\', this)" title="Color" class="tag-action-btn">&#9679;</button>'
            + '</span></div>';

        if (hasChildren) {
            html += '<div class="tag-tree-children">' + RC.renderTagTree(node._children, depth + 1) + '</div>';
        }
    }
    return html;
};

RC.togglePinTag = function(tag) {
    var idx = RC.pinnedTags.indexOf(tag);
    if (idx !== -1) RC.pinnedTags.splice(idx, 1);
    else RC.pinnedTags.push(tag);
    RC.savePinnedTags();
    RC.refreshTagSidebar();
};

RC.TAG_COLORS = ['var(--text)', 'var(--red)', 'var(--orange)', 'var(--yellow)', 'var(--green)', 'var(--cyan)', 'var(--blue)', 'var(--magenta)'];

RC.cycleTagColor = function(tag) {
    var current = RC.tagColors[tag] || RC.TAG_COLORS[0];
    var idx = RC.TAG_COLORS.indexOf(current);
    var next = RC.TAG_COLORS[(idx + 1) % RC.TAG_COLORS.length];
    if (next === RC.TAG_COLORS[0]) delete RC.tagColors[tag];
    else RC.tagColors[tag] = next;
    RC.saveTagColors();
    RC.refreshTagSidebar();
};

RC.refreshTagSidebar = async function() {
    var container = document.getElementById('browseTagSidebar');
    if (!container) return;
    try {
        var deckParam = RC.currentDeckId ? '?deck_id=' + RC.currentDeckId : '';
        var data = await RC.api('GET', '/tags' + deckParam);
        if (!data.tags || !data.tags.length) {
            container.innerHTML = '<div style="color:var(--dim);padding:8px;font-size:0.85rem">No tags</div>';
            return;
        }
        RC.loadTagSettings();
        var tree = RC.buildTagTree(data.tags);
        container.innerHTML = RC.renderTagTree(tree);
    } catch (e) {
        container.innerHTML = '';
    }
};
