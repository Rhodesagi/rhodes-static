/*
 * RHODES Frontend v2 Loader
 *
 * Why this file exists:
 * - `rhodes.monolith.js` became too large to maintain safely.
 * - The runtime has been split into focused part files.
 * - This loader rebuilds the original runtime order, so behavior stays identical.
 *
 * Safety guarantees:
 * - Parts are loaded in a fixed order.
 * - A hard error is thrown if any part is missing.
 * - Loader is idempotent (won't run twice in the same page lifecycle).
 */
(function () {
    'use strict';

    if (window.__RHODES_V2_LOADER_DONE__) {
        return;
    }
    window.__RHODES_V2_LOADER_DONE__ = true;

    var currentScript = document.currentScript;
    var scriptSrc = currentScript && currentScript.src ? currentScript.src : '';
    var qIndex = scriptSrc.indexOf('?');
    var cacheSuffix = qIndex >= 0 ? scriptSrc.slice(qIndex) : '';
    var basePath = scriptSrc ? scriptSrc.slice(0, scriptSrc.lastIndexOf('/') + 1) : '';

    /*
     * Keep this order in sync with the architecture map.
     * Each part is a contiguous slice of the original monolith.
     */
    var parts = [
        'rhodes.part1.bootstrap.js',
        'rhodes.part2.auth-state.js',
        'rhodes.part3.ui-core.js',
        'rhodes.part4.ws-runtime.js',
        'rhodes.part5.projects.js',
        'rhodes.part6.handoff.js',
        'rhodes.part7.sites-terminal.js'
    ];

    function fetchPartSync(url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send(null);
        if (xhr.status >= 200 && xhr.status < 300) {
            return xhr.responseText;
        }
        throw new Error('[RHODES v2 loader] Failed to load ' + url + ' (HTTP ' + xhr.status + ')');
    }

    var combined = '';
    for (var i = 0; i < parts.length; i += 1) {
        var name = parts[i];
        var url = basePath + name + cacheSuffix;
        var source = fetchPartSync(url);
        combined += '\n/* --- BEGIN ' + name + ' --- */\n';
        combined += source;
        combined += '\n/* --- END ' + name + ' --- */\n';
    }

    var runner = document.createElement('script');
    runner.text = combined + '\n//# sourceURL=rhodes.v2.combined.js';
    (document.head || document.documentElement).appendChild(runner);
    if (runner.parentNode) {
        runner.parentNode.removeChild(runner);
    }
})();
