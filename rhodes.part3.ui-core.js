
// Smart auto-scroll: only scroll if user is near bottom and not selecting text
function _shouldAutoScrollChat(el) {
    if (!el) return false;
    var sel = window.getSelection();
    if (sel && sel.toString().length > 0 && el.contains(sel.anchorNode)) return false;
    return (el.scrollHeight - el.scrollTop - el.clientHeight) < 150;
}
function _autoScrollChat(el) {
    if (_shouldAutoScrollChat(el)) el.scrollTop = el.scrollHeight;
}
function _normalizeRhodesSessionNote(note) {
    const clean = String(note ?? '').trim().toLowerCase();
    return clean || null;
}
function _formatRhodesSessionLabel(label, note) {
    const cleanLabel = String(label ?? '').trim();
    const cleanNote = _normalizeRhodesSessionNote(note);
    return cleanNote ? (cleanLabel + ' (' + cleanNote + ')') : cleanLabel;
}
window.__rhodesApplySessionNote = function(note) {
    if (arguments.length > 0) {
        window.__rhodesSessionNote = _normalizeRhodesSessionNote(note);
    }
    const sessionEl = document.getElementById('session-id');
    if (!sessionEl) return;
    const sid = (typeof RHODES_ID === 'string' && RHODES_ID) || sessionEl.dataset.sessionId || '';
    if (!sid) return;
    sessionEl.dataset.sessionId = sid;
    sessionEl.textContent = _formatRhodesSessionLabel(sid, window.__rhodesSessionNote);
    sessionEl.style.display = 'inline';
};

/* RHODES v2 module: rhodes.part3.ui-core.js */
/* Source: contiguous slice of rhodes.monolith.js */

/* ===================================================================
 * Live route indicator (bottom-left)
 *
 * Shows: model:<alias> for server-authorized operators only.
 *
 * Visible only to the server-side operator allowlist.
 * Other users get no DOM element and no behavior.
 *
 * Wired to:
 *   - model_set_response  -> updates model: portion
 *   - session_rotated     -> updates model: portion (via reason=model_switch)
 *   - provider_change     -> flashes internal route changes for operators
 *   - provider_info       -> updates route state for operators
 * =================================================================== */
(function () {
    if (window.__rhodesLiveIndicator) return; // idempotent
    var ALLOWED = { sebastian: 1, markbass: 1 };

    function getCurrentUser() {
        // Prefer the rhodesStorage wrapper (handles localStorage + memory fallback)
        try {
            if (window.rhodesStorage && typeof window.rhodesStorage.getItem === "function") {
                var v = window.rhodesStorage.getItem("rhodes_username");
                if (v) return String(v).toLowerCase();
            }
        } catch (e) {}
        // Fallbacks: window.rhodesAuth (if exposed), then bare localStorage
        try {
            if (window.rhodesAuth && typeof window.rhodesAuth.getCurrentUsername === "function") {
                return (window.rhodesAuth.getCurrentUsername() || "").toLowerCase();
            }
        } catch (e) {}
        try {
            return (localStorage.getItem("rhodes_username") || "").toLowerCase();
        } catch (e) { return ""; }
    }
    function isAllowed() {
        return Object.prototype.hasOwnProperty.call(ALLOWED, getCurrentUser());
    }

    function ensureStyle() {
        if (document.getElementById("rhodes-live-indicator-style")) return;
        var s = document.createElement("style");
        s.id = "rhodes-live-indicator-style";
        s.textContent = [
            ".rhodes-live-indicator {",
            "  position: fixed; bottom: 8px; left: 8px;",
            "  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;",
            "  font-size: 11px; line-height: 1.2;",
            "  color: rgba(255,255,255,0.4);",
            "  background: rgba(0,0,0,0); padding: 2px 6px; border-radius: 3px;",
            "  pointer-events: none; z-index: 9000;",
            "  white-space: nowrap;",
            "  transition: color 0.3s ease-out;",
            "}",
            ".rhodes-live-indicator.anchored {",
            "  position: static; bottom: auto; left: auto;",
            "  display: inline-block;",
            "  pointer-events: auto;",
            "  cursor: pointer;",
            "  color: rgba(255,255,255,0.55);",
            "  border: 1px solid rgba(255,255,255,0.15);",
            "}",
            ".rhodes-live-indicator.anchored:hover {",
            "  color: rgba(255,255,255,0.9);",
            "  border-color: rgba(255,255,255,0.4);",
            "}",
            "#rhodes-prompt-modal-backdrop {",
            "  position: fixed; inset: 0; background: rgba(0,0,0,0.78);",
            "  z-index: 10000; display: flex; align-items: center; justify-content: center;",
            "}",
            "#rhodes-prompt-modal {",
            "  background: var(--bg, #0a0a0a); color: var(--text, #d0d0d0);",
            "  border: 1px solid var(--cyan, #5cf);",
            "  width: min(900px, 92vw); max-height: 85vh; display: flex; flex-direction: column;",
            "  border-radius: 4px; overflow: hidden;",
            "}",
            "#rhodes-prompt-modal .rpm-head {",
            "  display: flex; align-items: center; justify-content: space-between;",
            "  padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.15);",
            "  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;",
            "  font-size: 12px; color: var(--cyan, #5cf);",
            "}",
            "#rhodes-prompt-modal .rpm-close {",
            "  background: transparent; border: 1px solid var(--cyan, #5cf);",
            "  color: var(--cyan, #5cf); padding: 2px 8px; cursor: pointer; font-size: 12px;",
            "  border-radius: 3px;",
            "}",
            "#rhodes-prompt-modal .rpm-body {",
            "  padding: 10px 12px; overflow: auto; flex: 1;",
            "  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;",
            "  font-size: 12px; line-height: 1.4; white-space: pre-wrap; word-wrap: break-word;",
            "}",
            "#rhodes-prompt-modal .rpm-section-title { color: var(--cyan, #5cf); font-size: 11px; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 1px; }",
            "#rhodes-prompt-modal .rpm-edit {",
            "  width: 100%; min-height: 34vh; resize: vertical; box-sizing: border-box;",
            "  background: rgba(0,0,0,0.35); color: var(--text, #d0d0d0);",
            "  border: 1px solid rgba(255,255,255,0.18); border-radius: 4px; padding: 10px;",
            "  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;",
            "  font-size: 12px; line-height: 1.4; outline: none;",
            "}",
            "#rhodes-prompt-modal .rpm-foot {",
            "  display: flex; align-items: center; gap: 8px; padding: 8px 12px;",
            "  border-top: 1px solid rgba(255,255,255,0.15);",
            "}",
            "#rhodes-prompt-modal .rpm-save {",
            "  background: var(--green, #00ff41); color: #000; border: 0; border-radius: 3px;",
            "  padding: 5px 12px; cursor: pointer; font-weight: 700; font-size: 12px;",
            "}",
            "#rhodes-prompt-modal .rpm-status { color: var(--dim, #8b949e); font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }",
            "#rhodes-prompt-modal .rpm-clone-box { margin: 0 0 12px; padding: 10px; border: 1px solid rgba(85,204,255,0.25); border-radius: 4px; background: rgba(85,204,255,0.05); }",
            "#rhodes-prompt-modal .rpm-clone-row { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; white-space: normal; }",
            "#rhodes-prompt-modal .rpm-clone-input { flex: 1; min-width: 180px; background: rgba(0,0,0,0.35); color: var(--text, #d0d0d0); border: 1px solid rgba(255,255,255,0.18); border-radius: 4px; padding: 6px 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; outline: none; }",
            "#rhodes-prompt-modal .rpm-seed-edit { min-height: 22vh; margin-top: 6px; }",
            ".rhodes-live-indicator.flash-fallback {",
            "  color: rgba(255,255,255,1);",
            "  animation: rhodes-fallback-flash 1.5s ease-out;",
            "}",
            "@keyframes rhodes-fallback-flash {",
            "  0%   { background: rgba(255,100,0,0.85); }",
            "  100% { background: rgba(255,100,0,0); }",
            "}"
        ].join("\n");
        document.head.appendChild(s);
    }

    function ensureNode() {
        if (!isAllowed()) {
            var existing = document.getElementById("rhodes-live-indicator");
            if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
            var anchor0 = document.getElementById("rhodes-indicator-anchor");
            if (anchor0) anchor0.style.display = "none";
            return null;
        }
        ensureStyle();
        var anchor = document.getElementById("rhodes-indicator-anchor");
        var el = document.getElementById("rhodes-live-indicator");
        if (!el) {
            el = document.createElement("div");
            el.id = "rhodes-live-indicator";
            el.className = "rhodes-live-indicator";
            el.dataset.model = "";
            el.dataset.provider = "";
            if (anchor) {
                el.classList.add("anchored");
                el.setAttribute("role", "button");
                el.setAttribute("tabindex", "0");
                el.setAttribute("title", "Click to view system prompt for this model");
                el.addEventListener("click", onIndicatorClick);
                el.addEventListener("keydown", function (ev) {
                    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onIndicatorClick(); }
                });
                anchor.style.display = "block";
                anchor.appendChild(el);
            } else {
                (document.body || document.documentElement).appendChild(el);
            }
            render(el);
        } else if (anchor && el.parentNode !== anchor) {
            // Re-parent if anchor became available after first render (login flow)
            el.classList.add("anchored");
            el.setAttribute("role", "button");
            el.setAttribute("tabindex", "0");
            el.setAttribute("title", "Click to view system prompt for this model");
            if (!el.__rhodesClickWired) {
                el.addEventListener("click", onIndicatorClick);
                el.addEventListener("keydown", function (ev) {
                    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onIndicatorClick(); }
                });
                el.__rhodesClickWired = true;
            }
            anchor.style.display = "block";
            anchor.appendChild(el);
        }
        return el;
    }

    // ----- Admin-only popup: fetch + render system prompt for current model -----
    function adminAuthHeaders() {
        var headers = {};
        try {
            var userTok = localStorage.getItem("rhodes_user_token") || "";
            var adminTok = localStorage.getItem("rhodes_admin_token") || "";
            if (userTok) headers["Authorization"] = "Bearer " + userTok;
            if (adminTok) headers["X-Rhodes-Admin-Token"] = adminTok;
        } catch (e) {}
        return headers;
    }

    function closePromptModal() {
        var bd = document.getElementById("rhodes-prompt-modal-backdrop");
        if (bd && bd.parentNode) bd.parentNode.removeChild(bd);
        document.removeEventListener("keydown", onPromptModalKey, true);
    }
    function onPromptModalKey(ev) {
        if (ev.key === "Escape") { ev.preventDefault(); closePromptModal(); }
    }

    function openPromptModal(title, bodyText, opts) {
        opts = opts || {};
        closePromptModal();
        var bd = document.createElement("div");
        bd.id = "rhodes-prompt-modal-backdrop";
        bd.addEventListener("click", function (ev) {
            if (ev.target === bd) closePromptModal();
        });

        var modal = document.createElement("div");
        modal.id = "rhodes-prompt-modal";

        var head = document.createElement("div");
        head.className = "rpm-head";
        var titleEl = document.createElement("div");
        titleEl.textContent = title;
        var closeBtn = document.createElement("button");
        closeBtn.className = "rpm-close";
        closeBtn.type = "button";
        closeBtn.textContent = "close";
        closeBtn.addEventListener("click", closePromptModal);
        head.appendChild(titleEl);
        head.appendChild(closeBtn);

        var body = document.createElement("div");
        body.className = "rpm-body";
        var editor = null;
        var seedEditor = null;
        var status = null;
        var seedStatus = null;
        if (opts.editable && opts.alias) {
            var cloneBox = document.createElement("div");
            cloneBox.className = "rpm-clone-box";
            var cloneLabel = document.createElement("label");
            cloneLabel.className = "rpm-section-title";
            cloneLabel.textContent = "clone as new model";
            var cloneRow = document.createElement("div");
            cloneRow.className = "rpm-clone-row";
            var cloneInput = document.createElement("input");
            cloneInput.type = "text";
            cloneInput.className = "rpm-clone-input";
            cloneInput.placeholder = "new-alias";
            cloneInput.autocapitalize = "none";
            cloneInput.spellcheck = false;
            var cloneBtn = document.createElement("button");
            cloneBtn.type = "button";
            cloneBtn.className = "rpm-save";
            cloneBtn.textContent = "clone + save";
            var cloneStatus = document.createElement("div");
            cloneStatus.className = "rpm-status";
            cloneStatus.textContent = "creates the normal variant family";
            cloneRow.appendChild(cloneInput);
            cloneRow.appendChild(cloneBtn);
            cloneBox.appendChild(cloneLabel);
            cloneBox.appendChild(cloneRow);
            cloneBox.appendChild(cloneStatus);
            body.appendChild(cloneBox);
            cloneBtn.addEventListener("click", async function () {
                cloneBtn.disabled = true;
                cloneStatus.textContent = "cloning...";
                try {
                    var result = await cloneModelFromPromptModal(opts.alias, cloneInput.value, editor ? editor.value : bodyText, seedEditor ? seedEditor.value : null, opts.seed || null);
                    var verifiedSlash = (result.config && result.config.slash_command) || ("/" + result.alias);
                    cloneStatus.textContent = "verified " + verifiedSlash + " plus " + ((result.family_aliases || []).length || 0) + " variants";
                    try { showToast("Model cloned: " + verifiedSlash); } catch (e) {}
                } catch (err) {
                    cloneStatus.textContent = "clone failed: " + (err && err.message ? err.message : String(err));
                } finally {
                    cloneBtn.disabled = false;
                }
            });

            var promptTitle = document.createElement("div");
            promptTitle.className = "rpm-section-title";
            promptTitle.textContent = "system prompt";
            body.appendChild(promptTitle);
            editor = document.createElement("textarea");
            editor.className = "rpm-edit";
            editor.spellcheck = false;
            editor.value = bodyText || "";
            body.appendChild(editor);
            if (opts.seed && opts.seed.exists) {
                var seedTitle = document.createElement("div");
                seedTitle.className = "rpm-section-title";
                seedTitle.style.marginTop = "12px";
                seedTitle.textContent = "seed — " + (opts.seed.seed_id || "resolved seed");
                body.appendChild(seedTitle);
                seedEditor = document.createElement("textarea");
                seedEditor.className = "rpm-edit rpm-seed-edit";
                seedEditor.spellcheck = false;
                seedEditor.value = opts.seed.raw_content || "";
                body.appendChild(seedEditor);
            } else if (opts.seed && opts.seed.note) {
                var seedNote = document.createElement("div");
                seedNote.className = "rpm-status";
                seedNote.style.marginTop = "12px";
                seedNote.textContent = "seed: " + opts.seed.note;
                body.appendChild(seedNote);
            }
        } else {
            body.textContent = bodyText;
        }

        modal.appendChild(head);
        modal.appendChild(body);
        if (editor) {
            var foot = document.createElement("div");
            foot.className = "rpm-foot";
            var saveBtn = document.createElement("button");
            saveBtn.type = "button";
            saveBtn.className = "rpm-save";
            saveBtn.textContent = "save prompt";
            status = document.createElement("div");
            status.className = "rpm-status";
            status.textContent = "saves prompt to this variant family";
            saveBtn.addEventListener("click", async function () {
                saveBtn.disabled = true;
                status.textContent = "saving prompt...";
                try {
                    var result = await savePromptForModel(opts.alias, editor.value, opts.sha256 || "");
                    opts.sha256 = result.sha256 || "";
                    status.textContent = "saved prompt: " + (result.updated_count || 0) + " file" + ((result.updated_count || 0) === 1 ? "" : "s") + " across " + ((result.family_aliases || []).length || 1) + " variant" + (((result.family_aliases || []).length || 1) === 1 ? "" : "s");
                    try { showToast("System prompt saved"); } catch (e) {}
                } catch (err) {
                    status.textContent = "prompt save failed: " + (err && err.message ? err.message : String(err));
                } finally {
                    saveBtn.disabled = false;
                }
            });
            foot.appendChild(saveBtn);
            foot.appendChild(status);
            if (seedEditor) {
                var seedSaveBtn = document.createElement("button");
                seedSaveBtn.type = "button";
                seedSaveBtn.className = "rpm-save";
                seedSaveBtn.textContent = "save seed";
                seedStatus = document.createElement("div");
                seedStatus.className = "rpm-status";
                seedStatus.textContent = "seed JSON must stay a message list";
                seedSaveBtn.addEventListener("click", async function () {
                    seedSaveBtn.disabled = true;
                    seedStatus.textContent = "saving seed...";
                    try {
                        var result = await saveSeedForModel(opts.alias, seedEditor.value, (opts.seed && opts.seed.sha256) || "");
                        opts.seed.sha256 = result.sha256 || "";
                        seedStatus.textContent = "saved seed " + (result.seed_id || "") + ": " + (result.message_count || 0) + " messages";
                        try { showToast("Seed saved"); } catch (e) {}
                    } catch (err) {
                        seedStatus.textContent = "seed save failed: " + (err && err.message ? err.message : String(err));
                    } finally {
                        seedSaveBtn.disabled = false;
                    }
                });
                foot.appendChild(seedSaveBtn);
                foot.appendChild(seedStatus);
            }
            modal.appendChild(foot);
            setTimeout(function () { try { editor.focus(); } catch (e) {} }, 0);
        }
        bd.appendChild(modal);
        document.body.appendChild(bd);
        document.addEventListener("keydown", onPromptModalKey, true);
    }

    async function fetchPromptForModel(alias) {
        // Server walks prompt_file -> base_model chain -> prompt_source so the
        // shared base prompt is found regardless of variant suffix (-j/-l/-h/etc.).
        var url = "/api/admin/prompt/for-model?alias=" + encodeURIComponent(alias) +
                  "&max_chars=500000&_ts=" + Date.now();
        var r = await fetch(url, { headers: adminAuthHeaders(), cache: "no-store" });
        if (r.status === 401) throw new Error("Admin auth required (log in first).");
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
    }

    async function savePromptForModel(alias, text, expectedSha) {
        var headers = adminAuthHeaders();
        headers["Content-Type"] = "application/json";
        var r = await fetch("/api/admin/prompt/for-model", {
            method: "POST",
            headers: headers,
            cache: "no-store",
            body: JSON.stringify({ alias: alias, text: text, expected_sha256: expectedSha || "" })
        });
        var data = null;
        try { data = await r.json(); } catch (e) {}
        if (r.status === 401) throw new Error("Admin auth required (log in first).");
        if (!r.ok || (data && data.success === false)) {
            throw new Error((data && (data.error || data.message)) || ("HTTP " + r.status));
        }
        return data || {};
    }

    function normalizeModelAliasInput(raw) {
        return String(raw || "").trim().toLowerCase().replace(/_/g, "-").replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
    }

    async function fetchModelConfigForAdmin(alias) {
        var r = await fetch("/api/admin/model-config/" + encodeURIComponent(alias), { headers: adminAuthHeaders(), cache: "no-store" });
        var data = null;
        try { data = await r.json(); } catch (e) {}
        if (r.status === 401) throw new Error("Admin auth required (log in first).");
        if (!r.ok || (data && data.success === false)) throw new Error((data && (data.error || data.message)) || ("HTTP " + r.status));
        return (data && data.config) || {};
    }

    async function postAdminJson(url, payload) {
        var headers = adminAuthHeaders();
        headers["Content-Type"] = "application/json";
        var r = await fetch(url, { method: "POST", headers: headers, cache: "no-store", body: JSON.stringify(payload) });
        var data = null;
        try { data = await r.json(); } catch (e) {}
        if (r.status === 401) throw new Error("Admin auth required (log in first).");
        if (!r.ok || (data && data.success === false)) throw new Error((data && (data.error || data.message)) || ("HTTP " + r.status));
        return data || {};
    }

    async function fetchCanonicalCloneSourceConfig(sourceAlias) {
        var startAlias = normalizeModelAliasInput(sourceAlias);
        var alias = startAlias;
        var cfg = await fetchModelConfigForAdmin(alias);
        var seen = {};
        for (var i = 0; i < 16; i += 1) {
            var parent = normalizeModelAliasInput((cfg && cfg._auto_variant_of) || "");
            if (!parent || parent === alias) break;
            if (seen[parent]) throw new Error("clone source variant cycle: " + alias + " -> " + parent);
            seen[parent] = true;
            alias = parent;
            cfg = await fetchModelConfigForAdmin(alias);
        }
        return { alias: alias || startAlias, config: cfg || {} };
    }

    function expectedCloneVariantAliases(newAlias, sourceCfg) {
        var aliases = [newAlias];
        var letters = ["a", "b", "c", "d", "e", "f", "g", "j", "k", "v", "w"];
        var effortLetters = {d:1, e:1, g:1, j:1, k:1, v:1, w:1};
        var base = String((sourceCfg && (sourceCfg.base_model || sourceCfg.base_model_input)) || "").toLowerCase();
        var rootSupportsEffort = /[degjkvw]\d*$/.test(base);
        aliases.push(newAlias + "-0");
        if (rootSupportsEffort) {
            ["l", "m", "h"].forEach(function (eff) {
                aliases.push(newAlias + "-" + eff);
                aliases.push(newAlias + "-" + eff + "-0");
            });
        }
        letters.forEach(function (letter) {
            aliases.push(newAlias + "-" + letter);
            aliases.push(newAlias + "-" + letter + "-0");
            if (effortLetters[letter]) {
                ["l", "m", "h"].forEach(function (eff) {
                    aliases.push(newAlias + "-" + letter + "-" + eff);
                    aliases.push(newAlias + "-" + letter + "-" + eff + "-0");
                });
            }
        });
        return aliases.filter(function (value, idx, arr) { return value && arr.indexOf(value) === idx; });
    }

    async function verifyCloneVariantFamily(newAlias, sourceCfg) {
        var aliases = expectedCloneVariantAliases(newAlias, sourceCfg);
        var url = "/api/admin/model-configs?aliases=" + encodeURIComponent(aliases.join(",")) + "&_ts=" + Date.now();
        var r = await fetch(url, { headers: adminAuthHeaders(), cache: "no-store" });
        var data = null;
        try { data = await r.json(); } catch (e) {}
        if (r.status === 401) throw new Error("Admin auth required (log in first).");
        if (!r.ok || (data && data.success === false)) throw new Error((data && (data.error || data.message)) || ("variant verification HTTP " + r.status));
        var found = {};
        ((data && data.configs) || []).forEach(function (row) {
            if (row && row.alias) found[String(row.alias).toLowerCase()] = true;
        });
        var missing = aliases.filter(function (alias) { return !found[alias]; });
        if (missing.length) throw new Error("clone saved but missing variants: " + missing.slice(0, 12).join(", ") + (missing.length > 12 ? " ..." : ""));
        return aliases;
    }

    async function cloneModelFromPromptModal(sourceAlias, rawNewAlias, promptText, seedRawContent, seedMeta) {
        var newAlias = normalizeModelAliasInput(rawNewAlias);
        if (!newAlias) throw new Error("enter a new alias");
        if (newAlias === normalizeModelAliasInput(sourceAlias)) throw new Error("new alias must differ from source alias");
        var root = await fetchCanonicalCloneSourceConfig(sourceAlias);
        var rootAlias = root.alias;
        var sourceCfg = root.config;
        var payload = {};
        Object.keys(sourceCfg || {}).forEach(function (key) {
            if ({alias:1, resolved_base_model:1, inherits_chain:1, prompt_exists:1, prompt_chars:1, fine_tune_exists:1, fine_tune_chars:1, _dynamic:1, _auto_generated:1, _auto_variant_of:1, _overrides:1, created_at:1, updated_at:1}[key]) return;
            payload[key] = sourceCfg[key];
        });
        payload.alias = newAlias;
        payload.base_model = payload.base_model_input || payload.base_model || sourceCfg.base_model || sourceCfg.resolved_base_model || "";
        payload.slash_command = "/" + newAlias;
        payload.prompt_text = String(promptText || "");
        payload.prompt_source = "config_" + newAlias;
        payload.enabled = payload.enabled !== false;
        payload.notes = payload.notes || ("Cloned from " + rootAlias);
        if (seedRawContent !== null && seedMeta && seedMeta.exists) {
            JSON.parse(String(seedRawContent || "[]"));
            var seedId = normalizeModelAliasInput(newAlias).replace(/[._]/g, "-") + "-seed";
            await postAdminJson("/api/admin/seed", { id: seedId, raw_content: seedRawContent, description: "Cloned from " + ((seedMeta && seedMeta.seed_id) || rootAlias) });
            payload.seed_id = seedId;
        }
        var result = await postAdminJson("/api/admin/model-configs", payload);
        var savedCfg = await fetchModelConfigForAdmin(newAlias);
        if (!savedCfg || normalizeModelAliasInput(savedCfg.alias || "") !== newAlias) {
            throw new Error("clone save did not round-trip for " + newAlias);
        }
        var resolvedSlash = String(savedCfg.slash_command || "").trim().toLowerCase();
        if (resolvedSlash !== "/" + newAlias) {
            throw new Error("clone saved with unexpected slash command: " + (resolvedSlash || "(empty)"));
        }
        var familyAliases = await verifyCloneVariantFamily(newAlias, sourceCfg);
        return { alias: newAlias, result: result, config: savedCfg, family_aliases: familyAliases };
    }


    async function fetchSeedForModel(alias) {
        var url = "/api/admin/seed/for-model?alias=" + encodeURIComponent(alias) + "&_ts=" + Date.now();
        var r = await fetch(url, { headers: adminAuthHeaders(), cache: "no-store" });
        if (r.status === 401) throw new Error("Admin auth required (log in first).");
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
    }

    async function saveSeedForModel(alias, rawContent, expectedSha) {
        var headers = adminAuthHeaders();
        headers["Content-Type"] = "application/json";
        var r = await fetch("/api/admin/seed/for-model", {
            method: "POST",
            headers: headers,
            cache: "no-store",
            body: JSON.stringify({ alias: alias, raw_content: rawContent, expected_sha256: expectedSha || "" })
        });
        var data = null;
        try { data = await r.json(); } catch (e) {}
        if (r.status === 401) throw new Error("Admin auth required (log in first).");
        if (!r.ok || (data && data.success === false)) {
            throw new Error((data && (data.error || data.message)) || ("HTTP " + r.status));
        }
        return data || {};
    }

    async function onIndicatorClick() {
        var el = document.getElementById("rhodes-live-indicator");
        if (!el) return;
        var alias = (el.dataset.model || "").trim();
        if (!alias || alias === "-") {
            openPromptModal("system prompt", "(no model alias yet — send a message first)");
            return;
        }
        openPromptModal("system prompt — " + alias, "loading…");
        try {
            var data = await fetchPromptForModel(alias);
            var seedData = null;
            try { seedData = await fetchSeedForModel(alias); } catch (seedErr) { seedData = { exists: false, note: (seedErr && seedErr.message) || String(seedErr) }; }
            if (data && data.exists && data.text) {
                var headBits = ["system prompt — " + alias];
                if (data.source) headBits.push("source=" + data.source);
                if (data.path) headBits.push(data.path);
                openPromptModal(headBits.join("  "), data.text, { editable: true, alias: alias, sha256: data.sha256 || "", seed: seedData });
                return;
            }
            var note = (data && data.note) ? data.note : "no prompt resolved for this alias";
            openPromptModal("system prompt — " + alias, "(" + note + ")");
        } catch (err) {
            openPromptModal("system prompt — " + alias, "Error: " + (err && err.message ? err.message : String(err)));
        }
    }

    function render(el) {
        if (!el) return;
        var m = el.dataset.model || "-";
        var prefix = el.dataset.flashing === "1" ? "FALLBACK -> " : "";
        el.textContent = prefix + "model:" + m;
    }

    function setModel(model) {
        if (!model) return;
        var el = ensureNode(); if (!el) return;
        el.dataset.model = String(model);
        render(el);
    }
    function setProvider(provider) {
        if (!provider) return;
        var el = ensureNode(); if (!el) return;
        el.dataset.provider = String(provider);
        render(el);
    }
    function setBoth(model, provider) {
        var el = ensureNode(); if (!el) return;
        if (model) el.dataset.model = String(model);
        if (provider) el.dataset.provider = String(provider);
        render(el);
    }
    function flashFallback() {
        var el = ensureNode(); if (!el) return;
        el.dataset.flashing = "1";
        el.classList.remove("flash-fallback");
        // force reflow to restart animation
        // eslint-disable-next-line no-unused-expressions
        void el.offsetWidth;
        el.classList.add("flash-fallback");
        render(el);
        setTimeout(function () {
            try {
                el.dataset.flashing = "0";
                el.classList.remove("flash-fallback");
                render(el);
            } catch (e) {}
        }, 1500);
    }

    function init() {
        try { ensureNode(); } catch (e) {}
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        setTimeout(init, 50);
    }

    window.__rhodesLiveIndicator = {
        setModel: setModel,
        setProvider: setProvider,
        setBoth: setBoth,
        flashFallback: flashFallback,
        ensureNode: ensureNode,
        isAllowed: isAllowed,
    };
})();


        // ============================================
        // MOBILE MENU FUNCTIONS
        // ============================================
        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu-dropdown');
            if (menu) {
                menu.classList.toggle('active');
                // Toggle hamburger icon
                const menuToggle = document.getElementById('menu-toggle');
                const sc = document.querySelector('.session-controls');
                if (menu.classList.contains('active')) {
                    document.body.classList.add('mobile-menu-open');
                    menuToggle.innerHTML = '✕';
                    menuToggle.title = 'Close menu';
                    if (sc) sc.style.display = 'none';
                } else {
                    document.body.classList.remove('mobile-menu-open');
                    menuToggle.innerHTML = '☰';
                    menuToggle.title = '☰';
                    if (sc) sc.style.display = '';
                }
            }
        }

        function closeMobileMenu() {
            const menu = document.getElementById('mobile-menu-dropdown');
            if (menu) {
                menu.classList.remove('active');
                document.body.classList.remove('mobile-menu-open');
                const menuToggle = document.getElementById('menu-toggle');
                menuToggle.innerHTML = '☰';
                menuToggle.title = '☰';
                const sc = document.querySelector('.session-controls');
                if (sc) sc.style.display = '';
            }
        }

        // If a user opens the mobile menu then rotates/resizes to desktop widths,
        // force it closed to avoid "duplicate navbar" appearance.
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) closeMobileMenu();
        });
        if (window.innerWidth > 768) closeMobileMenu();

        function toggleMobileSubmenu(submenuItem) {
            const submenu = submenuItem.parentElement;
            submenu.classList.toggle('active');
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            const menu = document.getElementById('mobile-menu-dropdown');
            const menuToggle = document.getElementById('menu-toggle');
            if (menu && menu.classList.contains('active') && 
                !menu.contains(event.target) && 
                !menuToggle.contains(event.target)) {
                closeMobileMenu();
            }
        });

        // Handle window resize - close mobile menu on large screens
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                closeMobileMenu();
            }
        });

        function showAuth(tab) {
            document.getElementById('auth-modal').style.display = 'flex';
            if (typeof showAuthTab === 'function') {
                showAuthTab(tab);
            }
        }

        function toggleTheme() {
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.click();
            }
        }

                function showAbout() {
            const aboutPanel = document.getElementById('about-panel');
            if (aboutPanel) {
                aboutPanel.style.display = 'block';
                aboutPanel.classList.add('show');
            }
        }

        function closeAbout() {
            const aboutPanel = document.getElementById('about-panel');
            if (aboutPanel) {
                aboutPanel.classList.remove('show');
                aboutPanel.style.display = 'none';
            }
        }

function showDownloads() {
            const downloadsPanel = document.getElementById('downloads-panel');
            if (downloadsPanel) {
                downloadsPanel.classList.add('show');
            }
        }

        function showCourses() {
            const coursesPanel = document.getElementById('courses-panel');
            if (coursesPanel) {
                coursesPanel.style.display = 'block';
            }
        }

        function finalizeStreamingMsg(el, finalText) {
            if (!el) return;
            el.querySelectorAll('.streaming-cursor').forEach(function(c) { c.remove(); });
            el.classList.remove('streaming');
            // Preserve tool call elements
            const savedTools = Array.from(el.querySelectorAll('.tool-summary'));
            // Remove empty message boxes (no content and no tool calls)
            if ((!finalText || !finalText.trim()) && savedTools.length === 0) {
                el.remove();
                return;
            }
            // Strip any remaining action blocks (should be cleaned server-side, but safety)
            let cleanText = finalText
                .replace(/\[RHODES_ACTION:\s*\w+\][\s\S]*?\[\/RHODES_ACTION\]/gi, '')
                .replace(/\[CLIENT_COMMAND:\s*\w+\][\s\S]*?\[\/CLIENT_COMMAND\]/gi, '');
            // Full formatting on final text
            el.innerHTML = linkifyUrls(cleanText
                .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\*\*(https?:\/\/[^\s*]+)\*\*/g, '$1')
                .replace(/'(https?:\/\/[^\s']+)'/g, '$1')
                .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
                .replace(/(?<![*])\*([^*]+?)\*(?![*])/g, '<em>$1</em>')
                .replace(/\[DOWNLOAD:([^\]]+)\]/g, (match, filename) => {
                    const ext = filename.split('.').pop().toLowerCase();
                    const names = {
                        'exe': 'Windows', 'pyw': 'Windows', 'msi': 'Windows',
                        'sh': 'Linux', 'AppImage': 'Linux', 'deb': 'Linux',
                        'command': 'macOS', 'app': 'macOS', 'dmg': 'macOS',
                        'zip': 'Archive', 'crx': 'Chrome Extension'
                    };
                    const label = names[ext] || ext.toUpperCase();
                    return `<a href="${filename}" download class="dl-btn" style="display:inline-flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--green);color:var(--green);padding:8px 14px;text-decoration:none;margin:4px 0;font-family:'Orbitron',monospace;font-size:14px;"><span style="color:var(--cyan);">[↓]</span> ${label} - ${filename}</a>`;
                })
                .replace(/\n/g, '<br>'));
            // Restore tool calls
            savedTools.forEach(t => {
                el.appendChild(t);
                // Stop live timer and show final time
                if (t.dataset.startTime) {
                    const elapsed = Date.now() - parseInt(t.dataset.startTime);
                    const timeEl = t.querySelector('.tool-summary-live');
                    if (timeEl) {
                        timeEl.textContent = elapsed + 'ms (total)';
                        timeEl.classList.remove('tool-summary-live');
                    }
                    delete t.dataset.startTime;
                }
            });

            // DEDUP: Remove duplicate consecutive assistant messages (model repeats narration in tool loops)
            if (chat) {
                const prevAiMsgs = chat.querySelectorAll('.msg.ai');
                if (prevAiMsgs.length >= 2) {
                    const prevEl = prevAiMsgs[prevAiMsgs.length - 2];
                    // Get clean text from both, stripping HTML and tool summaries
                    const _getClean = (e) => {
                        const clone = e.cloneNode(true);
                        clone.querySelectorAll('.tool-summary, .qa-share-btn, .msg-response-time').forEach(x => x.remove());
                        return (clone.textContent || '').trim();
                    };
                    const prevText = _getClean(prevEl);
                    const curText = (cleanText || '').replace(/<[^>]*>/g, '').trim();
                    if (prevText && curText && prevText === curText) {
                        el.remove();
                        return;
                    }
                }
            }

            // Preserve Q&A sharing for streamed replies — but NOT during active tool loops.
            if (lastUserMessage && cleanText && !el.querySelector('.qa-share-btn') && !window._rhodesToolLoopActive) {
                const qaId = 'qa_' + Math.random().toString(36).substr(2, 9);
                el.dataset.qaId = qaId;
                el.dataset.question = lastUserMessage;
                el.dataset.answer = cleanText;
                const shareBtnEl = document.createElement('button');
                shareBtnEl.className = 'qa-share-btn';
                shareBtnEl.title = 'Share this Q&A';
                shareBtnEl.textContent = 'SHARE';
                shareBtnEl.onclick = () => showShareOptions(qaId);
                el.appendChild(shareBtnEl);
            }

            if (window.toolTimerInterval) {
                clearInterval(window.toolTimerInterval);
                window.toolTimerInterval = null;
            }
            _autoScrollChat(chat);
        }

        function _normalizeReqId(payloadReqId, fallbackReqId) {
            const pr = (payloadReqId !== undefined && payloadReqId !== null) ? String(payloadReqId) : '';
            if (pr) return pr;
            return fallbackReqId ? String(fallbackReqId) : '';
        }

        function _wallToWallLabelSafe(payload, pendingStartTs) {
            try {
                if (typeof getWallToWallLabel === 'function') {
                    const v = getWallToWallLabel(payload, pendingStartTs);
                    if (v) return v;
                }
            } catch (e) {}
            if (payload && payload.partial) return '';
            let ms = 0;
            const serverTurnMs = Number(payload && payload.turn_time_ms);
            if (Number.isFinite(serverTurnMs) && serverTurnMs > 0) {
                ms = serverTurnMs;
            } else {
                let startTs = (pendingStartTs && pendingStartTs > 0) ? pendingStartTs : 0;
                const submitTs = Number(window._submitTimestamp || 0);
                if (!startTs && submitTs > 0) startTs = submitTs;
                if (startTs > 0) ms = Date.now() - startTs;
            }
            if (ms <= 0) return '';
            if (typeof formatResponseDuration === 'function') return formatResponseDuration(ms);
            if (typeof formatDuration === 'function') return formatDuration(ms);
            const totalSeconds = Math.max(0, Math.round(ms / 1000));
            if (totalSeconds < 60) return totalSeconds + 's';
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return seconds === 0 ? minutes + 'm' : minutes + 'm ' + seconds + 's';
        }

        function _findLastAiMsgByReqId(reqId) {
            if (!reqId) return null;
            const nodes = document.querySelectorAll('.msg.ai');
            for (let i = nodes.length - 1; i >= 0; i--) {
                const n = nodes[i];
                if (n && n.dataset && n.dataset.reqId === reqId) return n;
            }
            return null;
        }

        // Firebase initialization
        const firebaseConfig = {
            apiKey: "AIzaSyBZ1BCmsiSCgEjEMXkeMxedzqUtzQMJnO4",
            authDomain: "rhodes-agi-and-languages.firebaseapp.com",
            projectId: "rhodes-agi-and-languages",
            storageBucket: "rhodes-agi-and-languages.firebasestorage.app",
            messagingSenderId: "633559429572",
            appId: "1:633559429572:web:4673318365851b0553f491"
        };

        let firebaseApp = null;
        let firebaseAuth = null;

        function initFirebase() {
            if (!firebaseApp && typeof firebase !== 'undefined') {
                firebaseApp = firebase.initializeApp(firebaseConfig);
                firebaseAuth = firebase.auth();
                console.log('Firebase initialized');
            }
        }

        // Google Sign-In via Firebase
        async function signInWithGoogle() {
            window.__lastAuthAttempt = 'google';
            initFirebase();
            if (!firebaseAuth) {
                alert('Firebase not loaded. Please refresh and try again.');
                return;
            }

            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await firebaseAuth.signInWithPopup(provider);
                const idToken = await result.user.getIdToken();

                console.log('Google sign-in success:', result.user.email);

                // Send to server
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    window.pendingGoogleCredential = idToken;
                    connect();
                } else {
                    ws.send(JSON.stringify({
                        msg_type: 'google_login_request',
                        msg_id: generateUUID(),
                        timestamp: new Date().toISOString(),
                        payload: { google_token: idToken }
                    }));
                }
            } catch (e) {
                console.error('Google sign-in failed:', e);
                const errorEl = document.getElementById('login-error');
                errorEl.textContent = 'Google sign-in failed: ' + e.message;
                errorEl.style.display = 'block';
            }
        }

        // Initialize Firebase on load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initFirebase);
        } else {
            setTimeout(initFirebase, 100);
        }

        function connect() {
            window.rhodesConnect = connect;
            // Skip connection if viewing shared Q&A
            if (sharedQA || shareQaId || shareConvId) return;

            // Bump epoch; all handlers below ignore stale sockets.
            const epoch = ++wsEpoch;
            
            // Prevent multiple simultaneous connection attempts (but allow retry if a previous attempt got stuck)
            if (connectionInProgress) {
                if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
                    connectionInProgress = false;
                } else {
                    console.log('Connection already in progress, skipping duplicate call');
                    return;
                }
            }
            connectionInProgress = true;
            wsReadyForMessages = false;
            
            // If we're on production domain and the server is not a known good candidate,
            // force it back to default (unless allowCustomServer=1).
            try {
                const qs = new URLSearchParams(window.location.search || '');
                const allowCustomServer = qs.get('allowCustomServer') === '1';
                if (isRhodesDomain && !allowCustomServer) {
                    const s = (SERVER || '').trim().replace(/\/+$/, '').toLowerCase();
                    const allowed = new Set(RHODES_PROD_CANDIDATES.map(x => x.toLowerCase()));
                    if (!allowed.has(s) && !s.includes('rhodesagi.com')) {
                        SERVER = RHODES_PROD_CANDIDATES[0];
                    }
                }
            } catch {}

             // Re-read tokens from localStorage in case closure vars went stale
            // (fixes +New session opening as guest for logged-in users)
            const _freshUserToken = rhodesStorage.getItem('rhodes_user_token') || '';
            const _freshToken = rhodesStorage.getItem('rhodes_token') || '';
            if (_freshUserToken && _freshUserToken.length > 10 && !USER_TOKEN) {
                USER_TOKEN = _freshUserToken;
                console.log('[TOKEN-REFRESH] Restored USER_TOKEN from localStorage, len=' + _freshUserToken.length);
            }
            if (_freshToken && _freshToken.length > 10 && !TOKEN) {
                TOKEN = _freshToken;
                console.log('[TOKEN-REFRESH] Restored TOKEN from localStorage, len=' + _freshToken.length);
            }
            // Also refresh username if token was restored
            if (USER_TOKEN && !CURRENT_USERNAME) {
                const _storedName = rhodesStorage.getItem('rhodes_username');
                if (_storedName) {
                    CURRENT_USERNAME = _storedName;
                    IS_GUEST = false;
                    console.log('[TOKEN-REFRESH] Restored username:', _storedName);
                }
            }

            const hasUserToken = USER_TOKEN && (USER_TOKEN || "").length > 10;
            const hasToken = TOKEN && (TOKEN || "").length > 10;
            console.log('Token check - USER_TOKEN:', USER_TOKEN ? (USER_TOKEN.substring(0,20) + '...') : 'EMPTY', 'length:', (USER_TOKEN || "").length, 'hasUserToken:', hasUserToken, 'fromStorage:', _freshUserToken.length);
            console.log('Token check - TOKEN:', TOKEN ? 'present' : 'empty', 'length:', (TOKEN || "").length, 'hasToken:', hasToken);

            // Auto-connect as guest or with saved credentials
            authModal.style.display = 'none';
            setStatus(false, 'CONNECTING');

            try {
                // Hard-stop any previous socket (avoids duplicate listeners).
                if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                    try {
                        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
                        ws.close();
                    } catch {}
                }
                ws = new WebSocket(SERVER);
                window.ws = ws;
                console.log('WebSocket created successfully for:', SERVER);
                console.log('WebSocket readyState after creation:', ws.readyState);
                // Debug: log readyState after 2 seconds to see if it changes
                setTimeout(() => {
                    if (epoch !== wsEpoch) return;
                    console.log('WebSocket readyState after 2s:', ws.readyState, 'url:', SERVER);
                    if (ws.readyState === WebSocket.CONNECTING) {
                        console.log('WebSocket stuck in CONNECTING state - possible network issue');
                    }
                }, 2000);
            } catch (error) {
                console.error('WebSocket constructor failed:', error);
                setStatus(false, 'WS CONSTRUCTION FAILED');
                // Show auth modal immediately so user can see what's wrong
                setTimeout(() => {
                    authModal.style.display = 'flex';
                }, 500);
                return; // Don't continue with event handlers
            }

            // Connection timeout: if WebSocket doesn't open within 5 seconds, show auth modal
            const connectionTimeout = setTimeout(() => {
                if (epoch !== wsEpoch) return;
                connectionInProgress = false;
                console.log('WebSocket connection timeout - onopen not called within 5s');
                if (ws && ws.readyState !== WebSocket.OPEN) {
                    console.log('WebSocket state:', ws.readyState, 'forcing auth modal');
                    setStatus(false, 'RECONNECTING');
                    // Auto-fallback: if the primary endpoint is down, try the alternate.
                    try {
                        if (isRhodesDomain) {
                            const cur = (SERVER || '').trim().replace(/\/+$/, '');
                            const primary = RHODES_PROD_CANDIDATES[0];
                            const fallback = RHODES_PROD_CANDIDATES[1];
                            if (fallback && cur === primary) {
                                console.warn('[WS] Primary endpoint timed out; trying fallback:', fallback);
                                SERVER = fallback;
                                // Best-effort: update the visible server input if present.
                                try { if (serverInput) serverInput.value = SERVER; } catch {}
                                try { if (ws) ws.close(); } catch {}
                                setTimeout(connect, 100);
                            }
                        }
                    } catch {}
                    // Only show auth modal if no saved credentials (first visit)
                    const _hasToken = !!(
                        localStorage.getItem('rhodes_user_token') ||
                        (window.rhodesSessionState && window.rhodesSessionState.getResumeSessionIdForCurrentIdentity && window.rhodesSessionState.getResumeSessionIdForCurrentIdentity()) ||
                        localStorage.getItem('rhodes_session_id')
                    );
                    if (!_hasToken) {
                        authModal.style.display = 'flex';
                        const debugBtn = document.getElementById('debug-btn');
                        if (debugBtn) debugBtn.style.display = 'inline';
                        setTimeout(() => {
                            console.log('Auto-connecting as guest (timeout fallback)');
                            TOKEN = '';
                            USER_TOKEN = '';
                            connect();
                        }, 100);
                    } else {
                        // Already authenticated - just retry silently
                        setTimeout(connect, 2000);
                    }
                }
            }, 5000);

            ws.onopen = () => {
                if (epoch !== wsEpoch) return;
                clearTimeout(connectionTimeout);
                connectionInProgress = false;
                // Hide debug button on successful connection
                const debugBtn = document.getElementById('debug-btn');
                if (debugBtn) debugBtn.style.display = 'none';
                console.log('WebSocket opened, sending auth request');
                // Get saved session ID for auto-resume.
                // Normal mode uses the identity-scoped pointer. New-session mode uses a
                // tab-scoped pointer so reconnects stay on the same temporary session
                // without overwriting the user's main session pointer.
                const savedSessionId = wantsNewRhodes
                    ? (rhodesSessionStorage.getItem('rhodes_new_session_id') || '')
                    : (
                        (window.rhodesSessionState && window.rhodesSessionState.getResumeSessionIdForCurrentIdentity)
                            ? window.rhodesSessionState.getResumeSessionIdForCurrentIdentity()
                            : (rhodesStorage.getItem('rhodes_session_id') || '')
                    );

                // Resume for both logged-in and guest sessions.
                // Don't auto-resume a split session from the main chat.
                const _candidate = RHODES_ID || savedSessionId || '';
                const resumeSession = (_candidate.indexOf('split-') === -1 ? _candidate : '');
                const forceNewSession = !!(wantsNewRhodes && !resumeSession);

                ws.send(JSON.stringify({
                    msg_type: 'auth_request',
                    msg_id: generateUUID(),
                    timestamp: new Date().toISOString(),
                    payload: {
                        client_id: CLIENT_ID,
                        tab_id: TAB_ID,
                        token: hasToken ? TOKEN : '',
                        user_token: hasUserToken ? USER_TOKEN : '',
                        // In ?new=1 mode, only the first auth should force a fresh session.
                        // Later reconnects must resume the tab-local session id.
                        resume_session: resumeSession,
                        force_new: forceNewSession,
                        client_version: '3.0.0',
                        platform: (window.rhodes && window.rhodes.isDesktop) ? 'desktop-electron' : 'web',
                        desktop_mode: !!(window.rhodes && window.rhodes.isDesktop),
                        desktop_capabilities: (window.rhodes && window.rhodes.isDesktop) ? ['exec','read','write','edit','delete','mkdir','ls','glob','grep','webfetch','screenshot','click','type'] : [],
                        hostname: location.hostname,
                        system: {
                            browser: SYSTEM_INFO.browser.name,
                            browser_engine: SYSTEM_INFO.browser.engine,
                            os: SYSTEM_INFO.os.name,
                            os_version: SYSTEM_INFO.os.version || null,
                            os_distro: SYSTEM_INFO.os.distro || null,
                            is_mobile: SYSTEM_INFO.isMobile,
                            hostname: (window.__RHODES_DESKTOP__ && window.__RHODES_DESKTOP__.platform === 'darwin') ? 'macOS' : (SYSTEM_INFO.os.name || 'unknown'),
                            user_agent: navigator.userAgent
                        }
                    }
                }));
            };

            ws.onmessage = (e) => {
                if (epoch !== wsEpoch) return;
                const msg = JSON.parse(e.data);
                console.log('WebSocket message received:', msg.msg_type || msg.type, msg.payload?.success ? 'success' : 'fail');

                if (window.rhodesWsHelpers && window.rhodesWsHelpers.handleDesktopBridgeMessage(msg)) return;
                if (window.rhodesWsHelpers && window.rhodesWsHelpers.handleSessionListResponse(msg, { addMsg, escapeHtml })) return;

                if (msg.msg_type === 'auth_response') {
                    if (msg.payload.success) {
                        // Check for pending Google Sign-In
                        if (window.pendingGoogleCredential) {
                            const credential = window.pendingGoogleCredential;
                            window.pendingGoogleCredential = null;
                            ws.send(JSON.stringify({
                                msg_type: 'google_login_request',
                                msg_id: generateUUID(),
                                timestamp: new Date().toISOString(),
                                payload: { google_token: credential }
                            }));
                            return; // Wait for google_login_response
                        }

                        const prevIdentity = (window.rhodesSessionState && window.rhodesSessionState.getLastIdentity)
                            ? window.rhodesSessionState.getLastIdentity()
                            : null;
                        const incomingUsername = ((msg.payload.user && msg.payload.user.username) || '').trim();
                        const incomingIdentity = (msg.payload.is_guest || !incomingUsername)
                            ? 'guest'
                            : ('user:' + incomingUsername);
                        const identitySwitched = !!(prevIdentity && prevIdentity !== incomingIdentity);

                        IS_GUEST = msg.payload.is_guest || false;
                        RHODES_ID = msg.payload.rhodes_id || null;
                        // Set admin/reasoning status in config
                        if (window.RHODES_CONFIG) {
                            window.RHODES_CONFIG.isAdmin = msg.payload.is_admin || false;
                            window.RHODES_CONFIG.canViewReasoning = !!(msg.payload.can_view_reasoning || msg.payload.is_admin);
                            window.RHODES_CONFIG.canViewAbortAlerts = !!(msg.payload.can_view_abort_alerts || msg.payload.is_admin);
                        }
                        const instanceLabel = wantsNewRhodes ? ' [NEW]' : '';

                        // Clear chat only once for ?new=1 (initial creation); do not clear on reconnect.
                        if (wantsNewRhodes && !didInitialAuth) {
                            chat.innerHTML = '';
                            if (window.RhodesReportMode && window.RhodesReportMode.resetSession) window.RhodesReportMode.resetSession();
                        }
                        if (identitySwitched) {
                            chat.innerHTML = '';
                            if (window.RhodesReportMode && window.RhodesReportMode.resetSession) window.RhodesReportMode.resetSession();
                            CONNECTION_MSG_SHOWN = false;
                        }
                        didInitialAuth = true;
                        if (window.rhodesSessionState && window.rhodesSessionState.setLastIdentity) {
                            window.rhodesSessionState.setLastIdentity(incomingIdentity);
                        }

                        // Persist the active session pointer. New-session mode keeps it tab-local
                        // so refresh/reconnect works without clobbering the user's normal resume target.
                        if (RHODES_ID && RHODES_ID.indexOf('split-') === -1) {
                            if (wantsNewRhodes) {
                                rhodesSessionStorage.setItem('rhodes_new_session_id', RHODES_ID);
                            } else if (window.rhodesSessionState && window.rhodesSessionState.setResumeSessionIdForCurrentIdentity) {
                                window.rhodesSessionState.setResumeSessionIdForCurrentIdentity(RHODES_ID);
                            } else {
                                rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
                            }
                        } else if (!wantsNewRhodes) {
                            rhodesSessionStorage.removeItem('rhodes_new_session_id');
                        }

                        // Update session ID display
                        if (RHODES_ID) {
                            const sessionEl = document.getElementById('session-id');
                            if (sessionEl) {
                                sessionEl.dataset.sessionId = RHODES_ID;
                            }
                            if (window.RhodesReportMode && window.RhodesReportMode.syncSessionId) {
                                window.RhodesReportMode.syncSessionId(RHODES_ID);
                            }
                            if (window.__rhodesApplySessionNote) {
                                window.__rhodesApplySessionNote(msg.payload.session_note);
                            }
                        }
                        if (window.restoreSplitModeIfNeeded && !window.splitModeActive) {
                            setTimeout(() => {
                                try { window.restoreSplitModeIfNeeded(); } catch (e) { console.warn('[SPLIT] restore failed', e); }
                            }, 0);
                        }

                        
                        // -- Tool call rendering for resumed sessions --
                        window.renderResumedReasoning = window.renderResumedReasoning || function renderResumedReasoning(reasoningText, chatEl) {
                            // Admin-only thinking panel rendered on session resume.
                            // Mirrors the live reasoning_chunk panel shape (collapsible <details>).
                            if (!reasoningText || !chatEl) return;
                            var _canViewReasoning = window.RHODES_CONFIG && (window.RHODES_CONFIG.canViewReasoning || window.RHODES_CONFIG.isAdmin);
                            var _rapiraOn = window.RHODES_RAPIRA_ENABLED === true;
                            console.log('[RESUME-REASONING] called, canViewReasoning=' + _canViewReasoning + ' len=' + reasoningText.length);
                            if (!_canViewReasoning && !_rapiraOn) return;
                            var div = document.createElement('div');
                            div.className = 'msg ai reasoning-stream reasoning-resumed';
                            var details = document.createElement('details');
                            details.open = true;  // open by default so the panel is visible on resume
                            var summary = document.createElement('summary');
                            summary.style.cssText = "cursor:pointer;color:var(--cyan);font-family:'Orbitron',monospace;font-size:12px;user-select:none;margin-bottom:6px;";
                            var tokEst = Math.round(reasoningText.length / 4);
                            summary.innerHTML = (_rapiraOn ? 'Compiled' : 'Reasoning') + ' <span style="opacity:0.5;font-size:11px;">(' + tokEst + ' tokens)</span>';
                            var pre = document.createElement('pre');
                            pre.style.cssText = "white-space:pre-wrap;color:var(--cyan);opacity:0.85;margin:0;padding:8px;background:rgba(0,200,255,0.05);border-left:2px solid var(--cyan);max-height:300px;overflow:auto;";
                            pre.textContent = reasoningText;
                            details.appendChild(summary);
                            details.appendChild(pre);
                            div.appendChild(details);
                            chatEl.appendChild(div);
                        };
                                                window.renderResumedToolCalls = window.renderResumedToolCalls || function renderResumedToolCalls(toolCalls, chatEl) {
                            if (!toolCalls || !toolCalls.length) return;
                            var esc = typeof escapeHtml === 'function' ? escapeHtml : function(x) { return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };

                            // Parse all tool calls into structured data
                            var parsed = [];
                            for (var i = 0; i < toolCalls.length; i++) {
                                var tc = toolCalls[i];
                                var fn = tc.function || tc;
                                var toolName = fn.name || tc.name || 'unknown';
                                var argsStr = fn.arguments || tc.arguments || '{}';
                                var toolArgs = {};
                                try { toolArgs = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr; } catch(e) {}
                                var preview = '';
                                var detailsHtml = '';
                                if (toolArgs.thought) {
                                    preview = toolArgs.thought.substring(0, 60);
                                    detailsHtml = '<pre style="color:var(--green);white-space:pre-wrap;">' + esc(toolArgs.thought) + '</pre>';
                                } else if (toolArgs.command) {
                                    preview = toolArgs.command.substring(0, 60);
                                    detailsHtml = '<pre style="color:var(--cyan);white-space:pre-wrap;">' + esc(toolArgs.command) + '</pre>';
                                } else if ((toolName === 'Write' || toolName === 'Edit') && (toolArgs.file_path || toolArgs.path)) {
                                    preview = toolArgs.file_path || toolArgs.path;
                                    detailsHtml = '<strong>File:</strong> ' + esc(preview);
                                    if (toolArgs.old_string) detailsHtml += '<br><strong>Old:</strong><pre>' + esc(toolArgs.old_string) + '</pre>';
                                    if (toolArgs.new_string) detailsHtml += '<br><strong>New:</strong><pre>' + esc(toolArgs.new_string) + '</pre>';
                                    if (toolArgs.content) detailsHtml += '<br><pre style="max-height:200px;overflow:auto">' + esc(toolArgs.content) + '</pre>';
                                } else if (toolArgs.url) {
                                    preview = toolArgs.url.substring(0, 60);
                                    detailsHtml = '<pre>' + esc(toolArgs.url) + '</pre>';
                                } else if (toolArgs.file_path || toolArgs.path) {
                                    preview = toolArgs.file_path || toolArgs.path;
                                    detailsHtml = '<pre>' + esc(preview) + '</pre>';
                                } else {
                                    var keys = Object.keys(toolArgs);
                                    preview = keys.slice(0, 3).join(', ');
                                    detailsHtml = '<pre style="white-space:pre-wrap;">' + esc(JSON.stringify(toolArgs, null, 2)) + '</pre>';
                                }
                                // Per-tool reasoning rendering:
                                // - Admin sees private (_rhodes_think) in cyan box
                                // - Non-admin sees public 'thinking' (renamed from
                                //   _rhodes_think_public on the wire) in a separate box
                                var _canViewReasoningTC = window.RHODES_CONFIG && (window.RHODES_CONFIG.canViewReasoning || window.RHODES_CONFIG.isAdmin);
                                var _tcThink = tc._rhodes_think || tc.thinkingPrivate || (tc.arguments && (tc.arguments._rhodes_think || tc.arguments.thinkingPrivate)) || '';
                                var _tcThinkPub = tc._rhodes_think_public || tc.thinking || '';
                                if (_canViewReasoningTC && _tcThink) {
                                    detailsHtml = '<div style="color:var(--cyan);opacity:0.8;font-size:11px;margin-bottom:6px;border-left:2px solid var(--cyan);padding:4px 8px;background:rgba(0,200,255,0.05);"><strong>Private reasoning:</strong> ' + esc(_tcThink) + '</div>' + detailsHtml;
                                }
                                if (_tcThinkPub) {
                                    detailsHtml = '<div style="color:var(--green);opacity:0.85;font-size:11px;margin-bottom:6px;border-left:2px solid var(--green);padding:4px 8px;background:rgba(0,255,150,0.05);">' + esc(_tcThinkPub) + '</div>' + detailsHtml;
                                }
                                parsed.push({ toolName: toolName, preview: preview, detailsHtml: detailsHtml });
                            }

                            // Build container
                            var container = document.createElement('div');
                            container.className = 'tool-dot-container';

                            if (parsed.length === 1) {
                                // Single tool call — render inline, no collapse
                                var p = parsed[0];
                                var shortP = p.preview.length > 40 ? p.preview.substring(0, 40) + '...' : p.preview;
                                var wrapper = document.createElement('div');
                                wrapper.className = 'tool-dot-wrapper';
                                wrapper.setAttribute('data-status', 'complete');
                                var dot = document.createElement('span');
                                dot.className = 'tool-dot';
                                dot.setAttribute('data-status', 'complete');
                                dot.onclick = function() { wrapper.classList.toggle('tool-dot-expanded'); };
                                dot.innerHTML = '<span class="tool-dot-indicator">\u25cf</span>' +
                                    '<span class="tool-dot-name">' + esc(p.toolName + (shortP ? ': ' + shortP : '')) + '</span>';
                                var det = document.createElement('div');
                                det.className = 'tool-dot-details';
                                det.innerHTML = p.detailsHtml;
                                wrapper.appendChild(dot);
                                wrapper.appendChild(det);
                                container.appendChild(wrapper);
                            } else {
                                // Multiple tool calls — collapsed summary line
                                var firstName = parsed[0].toolName;
                                var othersCount = parsed.length - 1;
                                var summaryLabel = firstName + ' and ' + othersCount + ' other' + (othersCount > 1 ? 's' : '');

                                var summaryWrapper = document.createElement('div');
                                summaryWrapper.className = 'tool-dot-wrapper tool-resume-group';
                                summaryWrapper.setAttribute('data-status', 'complete');

                                var summaryDot = document.createElement('span');
                                summaryDot.className = 'tool-dot';
                                summaryDot.setAttribute('data-status', 'complete');
                                summaryDot.style.cursor = 'pointer';

                                var expandedList = document.createElement('div');
                                expandedList.className = 'tool-dot-details';

                                summaryDot.onclick = function() { summaryWrapper.classList.toggle('tool-dot-expanded'); };
                                summaryDot.innerHTML = '<span class="tool-dot-indicator">\u25cf</span>' +
                                    '<span class="tool-dot-name">' + esc(summaryLabel) + '</span>';

                                // Build each tool as a sub-item inside the expandable details
                                for (var j = 0; j < parsed.length; j++) {
                                    var pj = parsed[j];
                                    var shortPj = pj.preview.length > 40 ? pj.preview.substring(0, 40) + '...' : pj.preview;
                                    var subWrapper = document.createElement('div');
                                    subWrapper.className = 'tool-dot-wrapper';
                                    subWrapper.setAttribute('data-status', 'complete');
                                    subWrapper.style.marginLeft = '12px';
                                    var subDot = document.createElement('span');
                                    subDot.className = 'tool-dot';
                                    subDot.setAttribute('data-status', 'complete');
                                    subDot.onclick = (function(sw) { return function() { sw.classList.toggle('tool-dot-expanded'); }; })(subWrapper);
                                    subDot.innerHTML = '<span class="tool-dot-indicator">\u25cf</span>' +
                                        '<span class="tool-dot-name">' + esc(pj.toolName + (shortPj ? ': ' + shortPj : '')) + '</span>';
                                    var subDet = document.createElement('div');
                                    subDet.className = 'tool-dot-details';
                                    subDet.innerHTML = pj.detailsHtml;
                                    subWrapper.appendChild(subDot);
                                    subWrapper.appendChild(subDet);
                                    expandedList.appendChild(subWrapper);
                                }

                                summaryWrapper.appendChild(summaryDot);
                                summaryWrapper.appendChild(expandedList);
                                container.appendChild(summaryWrapper);
                            }

                            chatEl.appendChild(container);
                        }

                        // Load conversation history if resumed session has messages
                        if (msg.payload.conversation && msg.payload.conversation.length > 0) {
                            // Clear chat before loading to prevent duplicates on WS reconnect
                            try { chat.innerHTML = ''; } catch (e) {}
                            if (window.RhodesReportMode && window.RhodesReportMode.resetSession) window.RhodesReportMode.resetSession();
                            CONNECTION_MSG_SHOWN = true;
                            if (typeof VoiceChat !== 'undefined') VoiceChat._suppressSpeak = true;
                            let _lastAiText = '';
                            var _pendingTools1 = [];
                            for (const m of msg.payload.conversation) {
                                if (m.role === 'tool') continue;
                                var _tc = m.tool_calls || (m.metadata && m.metadata.tool_calls);
                                if (_tc && _tc.length) { _pendingTools1 = _pendingTools1.concat(_tc); }
                                if (m.role === 'assistant' && (!m.content || !m.content.trim())) continue;
                                // Flush batched tool calls before rendering text
                                if (_pendingTools1.length && window.renderResumedToolCalls) {
                                    window.renderResumedToolCalls(_pendingTools1, chat);
                                    _pendingTools1 = [];
                                }
                                const content = m.role === 'user' ? maskPasswords(m.content) : m.content;
                                if (m.role === 'assistant') {
                                    const trimmed = (content || '').trim();
                                    if (trimmed === _lastAiText) continue;
                                    _lastAiText = trimmed;
                                } else {
                                    _lastAiText = '';
                                }
                                if (m.role === 'assistant' && m.reasoning_content && window.renderResumedReasoning) {
                                    window.renderResumedReasoning(m.reasoning_content, chat);
                                }
                                addMsg(m.role === 'user' ? 'user' : 'ai', content);
                            }
                            // Flush any remaining tool calls at end
                            if (_pendingTools1.length && window.renderResumedToolCalls) {
                                window.renderResumedToolCalls(_pendingTools1, chat);
                            }
                            if (typeof VoiceChat !== 'undefined') VoiceChat._suppressSpeak = false;
                        }

                        if (IS_GUEST) {
                            GUEST_MESSAGES_REMAINING = msg.payload.guest_messages_remaining || 3;
                            CURRENT_USERNAME = null;
                            rhodesStorage.removeItem('rhodes_username');
                            setStatus(true, `GUEST (${GUEST_MESSAGES_REMAINING} msgs left)${instanceLabel}`);
                            try { authModal.style.display = 'none'; } catch {}
                            window._wsConnectAttempts = 0;
                            showGuestOnboardingMessage();
                        } else {
                            GUEST_HAS_ACTIVITY = false;
                            const username = msg.payload.user?.username || '';
                            CURRENT_USERNAME = username || null;
                            rhodesStorage.setItem('rhodes_username', CURRENT_USERNAME || '');
                            if (window.rhodesSessionState && window.rhodesSessionState.setLastIdentity) {
                                window.rhodesSessionState.setLastIdentity('user:' + (CURRENT_USERNAME || ''));
                            }
                            setStatus(true, username ? `CONNECTED (${username})${instanceLabel}` : `CONNECTED${instanceLabel}`);
                            try { authModal.style.display = 'none'; } catch {}
                            window._wsConnectAttempts = 0;
                            removeGuestOnboardingMessages();
                            // Only show connection message once per browser session
                            const chatEl = document.getElementById('chat'); const chatHasContent = chatEl && chatEl.children.length > 0; if (wantsNewRhodes && !chatHasContent) {
                                addMsg("ai", `Hi, ${username || "there"}! What can I help you with today?`);
                                CONNECTION_MSG_SHOWN = true;
                            } else if (!CONNECTION_MSG_SHOWN && !chatHasContent && (!msg.payload.conversation || msg.payload.conversation.length === 0)) {
                                addMsg("ai", `Welcome back, ${CURRENT_USERNAME || "there"}! What can I help you with?`);
                                CONNECTION_MSG_SHOWN = true;
                            }
                        }

                        // Update header auth UI (LOGIN vs Account dropdown)
                        updateHeaderAuth();

                        // Update agent status indicator
                        const agentStatus = document.getElementById('agent-status');
                        if (agentStatus) {
                            if (msg.payload.agent_connected) {
                                agentStatus.style.display = 'inline-block';
                                agentStatus.title = msg.payload.agent_info ?
                                    `Desktop agent: ${msg.payload.agent_info.platform || 'unknown'} on ${msg.payload.agent_info.hostname || 'unknown'}` :
                                    'Desktop agent connected';
                            } else {
                                agentStatus.style.display = 'none';
                            }
                        }

                        // Handle resume if requested
                        if (resumeSessionId && ws) {
                            ws.send(JSON.stringify({
                                msg_type: 'session_resume_request',
                                msg_id: generateUUID(),
                                timestamp: new Date().toISOString(),
                                payload: { session_id: resumeSessionId }
                            }));
                        }

                        wsReadyForMessages = true;
                        activeReqId = null; // Reset stale req_id on reconnect so post-restart responses are not dropped
                        flushOutboundQueue();
                        rhodesStorage.setItem('rhodes_server', SERVER);
                        
                        // Send continuation request if we were disconnected during generation
                        if (window._needsContinuation) {
                            console.log('[WS] Sending continuation request after reconnect');
                            window._needsContinuation = false;
                            ws.send(JSON.stringify({
                                msg_type: 'system_message',
                                msg_id: generateUUID(),
                                timestamp: new Date().toISOString(),
                                payload: {
                                    content: '[server just restarted, please continue generation]',
                                    stream: true
                                }
                            }));
                            // Re-show loading indicator since we are expecting a response
                            showLoading();
                        }

                        // Auto-join room from URL if provided (logged-in only)
                        if (roomParam && !IS_GUEST && ws && ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                msg_type: 'room_join_request',
                                msg_id: generateUUID(),
                                timestamp: new Date().toISOString(),
                                payload: { room_id: roomParam }
                            }));
                        }
                    } else {
                        // Check for rate limit error
                        if (msg.payload.error === 'rate_limit') {
                            setStatus(false, 'SESSION LIMIT');
                            showToast('Session limit reached');
                            // Don't show auth modal - they're logged in, just rate limited
                            // Offer to load existing sessions
                            setTimeout(() => toggleSessionDropdown(), 500);
                        } else {
                            setStatus(false, 'AUTH FAILED');
                            authModal.style.display = 'flex';
                            // Auto-start as guest if auth fails with no valid tokens
                            setTimeout(() => {
                                if (!TOKEN && !USER_TOKEN && !autoGuestAttempted) {
                                    autoGuestAttempted = true;
                                    console.log('Auto-connecting as guest');
                                    TOKEN = '';
                                    USER_TOKEN = '';
                                    connect();
                                }
                            }, 500);
                        }
                    }
                } else if (msg.msg_type === 'project_switched' && !window.__RHODES_DISABLE_PROJECTS) {
                    const p = msg.payload || {};
                    window.__RHODES_ACTIVE_PROJECT_ID = (p.project_id !== undefined) ? p.project_id : null;
                    window.__RHODES_ACTIVE_PROJECT_NAME = p.name || null;
                    try {
                        if (typeof window.__rhodesUpdateProjectBadge === 'function') window.__rhodesUpdateProjectBadge();
                    } catch {}

                    const quiet = !!(p.is_default || p.quiet);
                    if (!quiet) {
                        showToast(p.name ? ('Project: ' + p.name) : 'Project cleared');
                    }
                } else if (msg.msg_type === 'room_create_response') {
                    if (!msg.payload || !msg.payload.success || !msg.payload.room_id) {
                        showToast('Room create failed');
                        return;
                    }
                    CURRENT_ROOM_ID = msg.payload.room_id;
                    seenRoomMsgIds.clear();
                    chat.innerHTML = '';
                    const members = (msg.payload.members || []).map(m => m.username).filter(Boolean).join(', ');
                    addMsg('ai', `Joined room <code>${CURRENT_ROOM_ID}</code>${members ? ' — ' + escapeHtml(members) : ''}`, true);
                    setStatus(true, `ROOM (${CURRENT_ROOM_ID})`);
                    try {
                        const u = new URL(window.location.href);
                        u.searchParams.set('room', CURRENT_ROOM_ID);
                        window.history.replaceState({}, '', u.toString());
                    } catch {}
                } else if (msg.msg_type === 'room_join_response') {
                    if (!msg.payload || !msg.payload.success || !msg.payload.room_id) {
                        showToast('Room join failed');
                        return;
                    }
                    CURRENT_ROOM_ID = msg.payload.room_id;
                    seenRoomMsgIds.clear();
                    chat.innerHTML = '';
                    const members = (msg.payload.members || []).map(m => m.username).filter(Boolean).join(', ');
                    addMsg('ai', `Joined room <code>${CURRENT_ROOM_ID}</code>${members ? ' — ' + escapeHtml(members) : ''}`, true);

                    const history = msg.payload.messages || [];
                    for (const m of history) {
                        if (m && m.msg_id) seenRoomMsgIds.add(m.msg_id);
                        const role = (m && m.role) || '';
                        const uname = (m && m.username) || '';
                        const content = (m && m.content) || '';
                        if (role === 'assistant') addRoomLine('ai', uname || 'Rhodes', content);
                        else addRoomLine('user', uname, content);
                    }

                    setStatus(true, `ROOM (${CURRENT_ROOM_ID})`);
                    try {
                        const u = new URL(window.location.href);
                        u.searchParams.set('room', CURRENT_ROOM_ID);
                        window.history.replaceState({}, '', u.toString());
                    } catch {}
                } else if (msg.msg_type === 'room_leave_response') {
                    CURRENT_ROOM_ID = null;
                    seenRoomMsgIds.clear();
                    showToast('Left room');
                    try {
                        const u = new URL(window.location.href);
                        u.searchParams.delete('room');
                        window.history.replaceState({}, '', u.toString());
                    } catch {}
                    // Restore status line
                    if (IS_GUEST) updateGuestStatus();
                    else setStatus(true, CURRENT_USERNAME ? `CONNECTED (${CURRENT_USERNAME})` : 'CONNECTED');
                } else if (msg.msg_type === 'room_message') {
                    const p = msg.payload || {};
                    if (!p.room_id || p.room_id !== CURRENT_ROOM_ID) return;
                    const id = msg.msg_id || p.msg_id;
                    if (id && seenRoomMsgIds.has(id)) return;
                    if (id) seenRoomMsgIds.add(id);
                    addRoomLine('user', p.username || 'User', p.content || '');
                } else if (msg.msg_type === 'room_spiral_response') {
                    if (msg.payload && msg.payload.success) {
                        showToast(`Spiral ${msg.payload.enabled ? 'enabled' : 'disabled'}`);
                    } else {
                        showToast('Spiral update failed');
                    }
                } else if (msg.msg_type === 'room_round_state') {
                    const p = msg.payload || {};
                    if (!p.room_id || p.room_id !== CURRENT_ROOM_ID) return;
                    if (!p.enabled) {
                        setStatus(true, `ROOM (${CURRENT_ROOM_ID})`);
                        return;
                    }
                    const phase = (p.phase || '').toUpperCase();
                    const round = p.round || 0;
                    setStatus(true, `ROOM (${CURRENT_ROOM_ID}) • R${round} ${phase}`);
                } else if (msg.msg_type === 'user_message') {
                    // Multi-tab viewer sync: other tabs receive the sender's user messages.
                    if (msg.payload && msg.payload.sync) {
                        const originTab = msg.payload.origin_tab_id || '';
                        if (!originTab || originTab !== TAB_ID) {
                            const syncedText = (msg.payload.content || '').trim();
                            if (syncedText) addMsg('user', maskPasswords(syncedText), true);
                            markGuestActivity();
                        }
                    }
                } else if (msg.msg_type === 'reasoning_chunk') {
                    // Live reasoning/thinking stream — approved reasoning viewers, OR rapira mode active
                    const _canViewReasoning = window.RHODES_CONFIG && (window.RHODES_CONFIG.canViewReasoning || window.RHODES_CONFIG.isAdmin);
                    const _rapiraOn = window.RHODES_RAPIRA_ENABLED === true;
                    if (!_canViewReasoning && !_rapiraOn) return;
                    if (activeReqId && msg.payload && msg.payload.req_id && msg.payload.req_id !== activeReqId) return;
                    const rChunk = msg.payload.content || '';
                    if (rChunk) {
                        hideLoading();
                        if (!window._reasoningEl) {
                            window._reasoningContent = '';
                            const div = document.createElement('div');
                            div.className = 'msg ai reasoning-stream';
                            const details = document.createElement('details');
                            details.open = true;
                            const summary = document.createElement('summary');
                            summary.style.cssText = "cursor:pointer;color:var(--cyan);font-family:'Orbitron',monospace;font-size:12px;user-select:none;margin-bottom:6px;";
                            summary.innerHTML = (_rapiraOn ? 'Compiling' : 'Thinking') + ' <span style="opacity:0.6">...</span>';
                            const pre = document.createElement('pre');
                            pre.style.cssText = 'white-space:pre-wrap;word-break:break-word;margin:0;padding:10px;background:rgba(0,0,0,0.2);border:1px solid rgba(0,255,204,0.1);border-radius:6px;color:var(--text);opacity:0.55;font-size:12.5px;line-height:1.5;max-height:400px;overflow-y:auto;';
                            details.appendChild(summary);
                            details.appendChild(pre);
                            div.appendChild(details);
                            const chatEl = document.getElementById('chat');
                            if (chatEl) { chatEl.appendChild(div); _autoScrollChat(chatEl); }
                            window._reasoningEl = div;
                            window._reasoningPre = pre;
                            window._reasoningSummary = summary;
                        }
                        window._reasoningContent += rChunk;
                        const tokEst = Math.round(window._reasoningContent.length / 4);
                        window._reasoningPre.textContent = window._reasoningContent;
                        window._reasoningSummary.innerHTML = (_rapiraOn ? 'Compiling' : 'Thinking') + ' <span style="opacity:0.5;font-size:11px;">(' + tokEst + ' tokens)</span> <span style="opacity:0.6">...</span>';
                        window._reasoningPre.scrollTop = window._reasoningPre.scrollHeight;
                        const chatEl = document.getElementById('chat');
                        if (chatEl) _autoScrollChat(chatEl);
                    }
                } else if (msg.msg_type === 'thinking') {
                    if (activeReqId && msg.payload && msg.payload.req_id && msg.payload.req_id !== activeReqId) return;
                    const pChunk = (msg.payload && msg.payload.content) || '';
                    if (!pChunk) return;
                    hideLoading();
                    if (!window._visibleThinkingEl) {
                        window._visibleThinkingContent = '';
                        const div = document.createElement('div');
                        div.className = 'msg ai reasoning-stream visible-thinking-stream';
                        const details = document.createElement('details');
                        details.open = true;
                        const summary = document.createElement('summary');
                        summary.style.cssText = "cursor:pointer;color:var(--green);font-family:'Orbitron',monospace;font-size:12px;user-select:none;margin-bottom:6px;";
                        summary.textContent = 'Thinking';
                        const pre = document.createElement('pre');
                        pre.style.cssText = 'white-space:pre-wrap;word-break:break-word;margin:0;padding:10px;background:rgba(0,255,150,0.06);border:1px solid rgba(0,255,150,0.18);border-radius:6px;color:var(--text);opacity:0.78;font-size:12.5px;line-height:1.5;max-height:300px;overflow-y:auto;';
                        details.appendChild(summary);
                        details.appendChild(pre);
                        div.appendChild(details);
                        const chatEl = document.getElementById('chat');
                        if (chatEl) { chatEl.appendChild(div); _autoScrollChat(chatEl); }
                        window._visibleThinkingEl = div;
                        window._visibleThinkingPre = pre;
                    }
                    window._visibleThinkingContent += pChunk;
                    window._visibleThinkingPre.textContent = window._visibleThinkingContent;
                    window._visibleThinkingPre.scrollTop = window._visibleThinkingPre.scrollHeight;
                    const chatEl = document.getElementById('chat');
                    if (chatEl) _autoScrollChat(chatEl);
                } else if (msg.msg_type === 'rapira_full') {
                    // [EXPERIMENTAL] Rapira rewriter: expandable full reasoning in Rapira notation
                    // Kill switch: set window.RHODES_RAPIRA_ENABLED = false to disable
                    if (window.RHODES_RAPIRA_ENABLED === false) return;
                    const rapiraContent = (msg.payload && msg.payload.content) || '';
                    if (!rapiraContent) return;
                    // Find the last .msg.ai element (the response this reasoning belongs to)
                    const chatEl = document.getElementById('chat');
                    if (!chatEl) return;
                    const aiMsgs = chatEl.querySelectorAll('.msg.ai:not(.reasoning-stream)');
                    const lastAi = aiMsgs.length ? aiMsgs[aiMsgs.length - 1] : null;
                    if (!lastAi) return;
                    // Don't add duplicate
                    if (lastAi.querySelector('.rapira-expandable')) return;
                    const wrapper = document.createElement('div');
                    wrapper.className = 'rapira-expandable';
                    wrapper.style.cssText = 'margin-top:12px;border-top:1px solid rgba(0,255,204,0.15);padding-top:8px;';
                    const details = document.createElement('details');
                    const summary = document.createElement('summary');
                    summary.style.cssText = "cursor:pointer;color:var(--cyan);font-family:'Orbitron',monospace;font-size:11px;user-select:none;opacity:0.7;";
                    const lineCount = rapiraContent.split('\n').length;
                    summary.textContent = 'Cognitive trace (' + lineCount + ' lines)';
                    const pre = document.createElement('pre');
                    pre.style.cssText = 'white-space:pre-wrap;word-break:break-word;margin:6px 0 0 0;padding:10px;background:rgba(0,0,0,0.25);border:1px solid rgba(0,255,204,0.08);border-radius:6px;color:var(--cyan);opacity:0.6;font-size:11.5px;line-height:1.5;max-height:500px;overflow-y:auto;font-family:monospace;';
                    pre.textContent = rapiraContent;
                    details.appendChild(summary);
                    details.appendChild(pre);
                    wrapper.appendChild(details);
                    lastAi.appendChild(wrapper);
                } else if (msg.msg_type === 'system_message' && msg.payload && msg.payload.status === 'queued') {
                    // Queue notification - show as a toast, NOT as model response
                    const _qn = msg.payload.pending || '?';
                    showToast('Message queued (' + _qn + ' pending) — waiting for current response to finish');
                    return;
                } else if (msg.msg_type === 'ai_message_chunk') {
                    // Streaming chunk - append to current message
                    // Close reasoning display when content starts streaming
                    if (window._reasoningEl && window._reasoningSummary) {
                        const _toks = Math.round((window._reasoningContent||'').length/4);
                        window._reasoningSummary.innerHTML = (window.RHODES_RAPIRA_ENABLED === true ? 'Compiled' : 'Reasoning') + ' <span style="opacity:0.5;font-size:11px;">(' + _toks + ' tokens)</span>';
                        const _det = window._reasoningEl.querySelector('details');
                        if (_det) _det.open = false;
                        window._reasoningEl = null;
                        window._reasoningPre = null;
                        window._reasoningSummary = null;
                    }
                    if (window._visibleThinkingEl) {
                        const _pDet = window._visibleThinkingEl.querySelector('details');
                        if (_pDet) _pDet.open = false;
                        window._visibleThinkingEl = null;
                        window._visibleThinkingPre = null;
                    }
                    if (activeReqId && msg.payload && msg.payload.req_id && msg.payload.req_id !== activeReqId) return;
                    const chunkReqId = _normalizeReqId(msg.payload && msg.payload.req_id, activeReqId);
                    if (window.streamingMsgEl && window._streamReqId && chunkReqId && window._streamReqId !== chunkReqId) {
                        finalizeStreamingMsg(window.streamingMsgEl, window.streamingContent || '');
                        window.streamingMsgEl = null;
                        window.streamingContent = '';
                        window._streamReqId = null;
                    }
                    const chunk = msg.payload.content || '';
                    if (chunk) {
                        if (_seenRecently('chunk:' + ((msg.payload && msg.payload.req_id) || activeReqId || '') + ':' + chunk.slice(0, 64), 150)) return;
                        // Filter internal system messages that should never reach the user
                        if (chunk.includes('[Response regenerated') || chunk.includes('[RETRACTION') || chunk.includes('CRITICAL SCIENTIFIC INTEGRITY WARNING') || chunk.includes('[CONTEXT COMPACTION NOTICE]')) {
                            console.log('[FILTER] Blocked internal message from display:', chunk.slice(0, 80));
                            return;
                        }
                        if (!window.streamingMsgEl) {
                            // First chunk - skip empty chunks (e.g. DSML-stripped content)
                            if (!chunk || !chunk.trim()) return;
                            // First chunk - create message element
                            hideLoading();
                            // Collapse any open tool container so content appears after tool dots
                            if (typeof collapseToolCalls === 'function') collapseToolCalls();
                            window.streamingContent = '';
                            window.streamingMsgEl = addMsgStreaming('ai', '');
                            window._streamReqId = chunkReqId || null;
                            if (window.streamingMsgEl && window._streamReqId) window.streamingMsgEl.dataset.reqId = window._streamReqId;
                        } else if (!window._streamReqId && chunkReqId && window.streamingMsgEl) {
                            window._streamReqId = chunkReqId;
                            window.streamingMsgEl.dataset.reqId = window._streamReqId;
                        }
                        window.streamingContent += chunk;
                        updateStreamingMsg(window.streamingMsgEl, window.streamingContent);
                        // Feed chunk to streaming TTS for real-time audio
                        if (window.StreamingTTS) {
                            try { window.StreamingTTS.feedChunk(chunk); } catch(e) {}
                        }
                    }
                } else if (msg.msg_type === "ai_message") {
                    // Clear tool loop flag — this is the final response
                    window._rhodesToolLoopActive = false;
                    console.log("[DEBUG] ai_message received:", JSON.stringify(msg.payload).slice(0, 500));
                    console.log("[DEBUG] debug_reasoning present:", !!msg.payload.debug_reasoning, "len:", msg.payload.debug_reasoning ? msg.payload.debug_reasoning.length : 0);
                    if (msg.payload && Object.prototype.hasOwnProperty.call(msg.payload, 'session_note') && window.__rhodesApplySessionNote) {
                        window.__rhodesApplySessionNote(msg.payload.session_note);
                    }
                    // ==== INFERRER INVERSION — IN-PLACE REPLACE OF REFUSAL BUBBLE ====
                    // Replace the most recent completed assistant bubble with the rewrite.
                    // Selector-based find; does NOT rely on textContent matching.
                    //
                    // Class invariants (verified against addMsg + addMsgStreaming in
                    // rhodes.part2.auth-state.js):
                    //   - Every AI bubble has `.msg.ai`
                    //   - Streaming bubbles ALSO have `.streaming` (removed on finalize)
                    //   - Bannered bubbles have `.inferrer-rewritten-bubble` (added by
                    //     attachInferrerInversionToggle)
                    //
                    // Refusal bubble = last `.msg.ai` that is neither streaming nor
                    // already bannered. Cycle-2 fork_continue streams are excluded by
                    // the `.streaming` filter. Previously-replaced bubbles are excluded
                    // by the `.inferrer-rewritten-bubble` filter (so re-entry on the
                    // same cycle after cycle 2 refuses targets cycle 2's bubble, not
                    // the already-bannered cycle 1).
                    //
                    // Replacement runs for ALL users (otherwise non-admin users see a
                    // duplicate bubble). Banner (red stripe + diagnostic header +
                    // rewrite/original toggle buttons) is gated to user_2 (sebastian)
                    // + user_3 (markbass) via isAdmin.
                    if (msg.payload && msg.payload.inferrer_inversion
                        && typeof msg.payload.inferrer_inverted_refusal === 'string') {
                        try {
                            var _candidates = document.querySelectorAll(
                                '.msg.ai:not(.streaming):not(.inferrer-rewritten-bubble)'
                            );
                            var _existingBubble = _candidates.length > 0
                                ? _candidates[_candidates.length - 1]
                                : null;

                            console.log('[INFERRER-BANNER] inversion broadcast', {
                                version: msg.payload.inferrer3_role ? 'v3' : (msg.payload.inferrer2_mode ? 'v2' : 'v1'),
                                mode: msg.payload.inferrer3_mode || msg.payload.inferrer2_mode || null,
                                role: msg.payload.inferrer3_role || null,
                                rewrite_len: (msg.payload.content || '').length,
                                refusal_len: (msg.payload.inferrer_inverted_refusal || '').length,
                                streamingMsgEl: !!window.streamingMsgEl,
                                candidates_found: _candidates.length,
                                target_bubble_exists: !!_existingBubble,
                            });

                            // Build inferrer opts from payload
                            var _infOpts = {};
                            if (msg.payload.inferrer3_role) {
                                _infOpts.version = 'v3';
                                _infOpts.role = msg.payload.inferrer3_role;
                                _infOpts.mode = msg.payload.inferrer3_mode || null;
                            } else if (msg.payload.inferrer2_mode) {
                                _infOpts.version = 'v2';
                                _infOpts.mode = msg.payload.inferrer2_mode;
                            } else {
                                _infOpts.version = 'v1';
                                _infOpts.pushExtension = !!(typeof msg.payload.inferrer_push_extension === 'string' && msg.payload.inferrer_push_extension.length > 0);
                            }
                            if (typeof msg.payload.inferrer_raw_opener === 'string') _infOpts.opener = msg.payload.inferrer_raw_opener;
                            if (typeof msg.payload.inferrer_push_extension === 'string') _infOpts.extension = msg.payload.inferrer_push_extension;

                            if (_existingBubble) {
                                var _isAdmin = !!(window.RHODES_CONFIG && window.RHODES_CONFIG.isAdmin);
                                console.log('[INFERRER-BANNER] replacing bubble in-place', { isAdmin: _isAdmin, banner: _isAdmin });
                                // Re-render via finalizeStreamingMsg (handles markdown /
                                // links / tool-summary preservation / safety).
                                finalizeStreamingMsg(_existingBubble, msg.payload.content || '');
                                // Banner is admin-only; replacement already happened above.
                                if (_isAdmin) {
                                    attachInferrerInversionToggle(
                                        _existingBubble,
                                        msg.payload.content,
                                        msg.payload.inferrer_inverted_refusal,
                                        _infOpts
                                    );
                                } else {
                                    // Mark the bubble so future inferrer broadcasts in
                                    // the same session don't re-target it (the selector
                                    // excludes `.inferrer-rewritten-bubble`).
                                    _existingBubble.classList.add('inferrer-rewritten-bubble');
                                }
                                hideLoading();
                                return;
                            }

                            // Class-invariant fallback: NO non-streaming non-bannered .msg.ai
                            // exists. This should be impossible in practice (the refusal
                            // just finalized before the broadcast). If it does happen —
                            // create a new bubble with the banner attached and log loudly.
                            // Better a new bubble than silently losing the rewrite.
                            console.warn('[INFERRER-BANNER] no candidate bubble; creating new one as fallback');
                            var _fallbackNode = addMsg('ai', msg.payload.content, false, '', {
                                sessionId: RHODES_ID || (msg.payload && (msg.payload.session_id || msg.payload.rhodes_id)) || null
                            });
                            if (_fallbackNode) {
                                if (window.RHODES_CONFIG && window.RHODES_CONFIG.isAdmin) {
                                    attachInferrerInversionToggle(
                                        _fallbackNode,
                                        msg.payload.content,
                                        msg.payload.inferrer_inverted_refusal,
                                        _infOpts
                                    );
                                } else {
                                    _fallbackNode.classList.add('inferrer-rewritten-bubble');
                                }
                            }
                            hideLoading();
                            return;
                        } catch (_e) {
                            console.error('[INFERRER-BANNER] in-place replace threw:', _e);
                            // On any exception, DO NOT fall through — the existing addMsg
                            // path would create a duplicate bubble. Drop the broadcast
                            // visibly via a new bubble with banner, which is still better
                            // than leaving a stale refusal in the chat.
                            try {
                                var _errNode = addMsg('ai', msg.payload.content, false, '', {});
                                if (_errNode && msg.payload.inferrer_inverted_refusal) {
                                    attachInferrerInversionToggle(
                                        _errNode,
                                        msg.payload.content,
                                        msg.payload.inferrer_inverted_refusal,
                                        { version: 'v1' }
                                    );
                                }
                            } catch (_e2) { /* last resort — swallow */ }
                            hideLoading();
                            return;
                        }
                    }
                    // ==== /INFERRER INVERSION ====
                    const pendingTurnStartTs = (window._pendingGeneration && window._pendingGeneration.timestamp) ? window._pendingGeneration.timestamp : 0;
                    hideLoading();
                    // Finalize streaming: keep content in place, append wall-to-wall timer
                    if (window.streamingMsgEl) {
                        const _finalText = (msg.payload && typeof msg.payload.content === 'string' && msg.payload.content.trim())
                            ? msg.payload.content
                            : (window.streamingContent || '');
                        const _reqId = _normalizeReqId(msg.payload && msg.payload.req_id, activeReqId);
                        if (window.streamingMsgEl && _reqId) window.streamingMsgEl.dataset.reqId = _reqId;
                        finalizeStreamingMsg(window.streamingMsgEl, _finalText);
                        const _wtw = _wallToWallLabelSafe(msg.payload || {}, pendingTurnStartTs);
                        if (_wtw) {
                            const _timeEl = document.createElement('span');
                            _timeEl.className = 'msg-response-time';
                            _timeEl.textContent = ' (' + _wtw + ')';
                            window.streamingMsgEl.appendChild(_timeEl);
                        }
                        if (msg.payload.debug_reasoning && window.RHODES_CONFIG && window.RHODES_CONFIG.isAdmin) {
                            attachDebugReasoning(window.streamingMsgEl, msg.payload.debug_reasoning);
                        }
                        if (window.RHODES_CONFIG && window.RHODES_CONFIG.isAdmin) {
                            const injPayload = takePendingInjectionDebugPayload(msg.payload.req_id || activeReqId || null);
                            if (injPayload) attachInjectedArticles(window.streamingMsgEl, injPayload);
                        }
                        // Inferrer banner — also attach in the streaming-finalize branch so
                        // rewrites delivered via fork_continue / late ai_message don't miss
                        // the banner attach when the non-streaming branch never runs.
                        // Gated to user_2 (Sebastian) + user_3 (markbass) via isAdmin.
                        try {
                            if (window.RHODES_CONFIG && window.RHODES_CONFIG.isAdmin
                                && window.streamingMsgEl
                                && msg.payload && msg.payload.inferrer_inversion
                                && typeof msg.payload.inferrer_inverted_refusal === 'string') {
                                console.log('[INFERRER-BANNER] streaming-finalize path; attaching', {
                                    version: msg.payload.inferrer3_role ? 'v3' : (msg.payload.inferrer2_mode ? 'v2' : 'v1'),
                                    mode: msg.payload.inferrer3_mode || msg.payload.inferrer2_mode || null,
                                    role: msg.payload.inferrer3_role || null,
                                    rewrite_len: (msg.payload.content || '').length,
                                    refusal_len: (msg.payload.inferrer_inverted_refusal || '').length,
                                });
                                var _inferrerOpts = {};
                                if (msg.payload.inferrer3_role) {
                                    _inferrerOpts.version = 'v3';
                                    _inferrerOpts.role = msg.payload.inferrer3_role;
                                    _inferrerOpts.mode = msg.payload.inferrer3_mode || null;
                                } else if (msg.payload.inferrer2_mode) {
                                    _inferrerOpts.version = 'v2';
                                    _inferrerOpts.mode = msg.payload.inferrer2_mode;
                                } else {
                                    _inferrerOpts.version = 'v1';
                                    _inferrerOpts.pushExtension = !!(typeof msg.payload.inferrer_push_extension === 'string' && msg.payload.inferrer_push_extension.length > 0);
                                }
                                if (typeof msg.payload.inferrer_raw_opener === 'string') _inferrerOpts.opener = msg.payload.inferrer_raw_opener;
                                if (typeof msg.payload.inferrer_push_extension === 'string') _inferrerOpts.extension = msg.payload.inferrer_push_extension;
                                attachInferrerInversionToggle(window.streamingMsgEl, msg.payload.content, msg.payload.inferrer_inverted_refusal, _inferrerOpts);
                            }
                        } catch (_e) { console.error('[INFERRER-BANNER] streaming-finalize attach failed', _e); }
                        window.streamingMsgEl = null;
                        window.streamingContent = '';
                        window._streamReqId = null;
                        if (!(msg.payload && msg.payload.partial)) {
                            window._submitTimestamp = 0;
                            window._submitReqId = null;
                        }
                        return;
                    }
                    // Close any live reasoning display
                    if (window._reasoningEl && window._reasoningSummary) {
                        const _toks2 = Math.round((window._reasoningContent||'').length/4);
                        window._reasoningSummary.innerHTML = 'Reasoning <span style="opacity:0.5;font-size:11px;">(' + _toks2 + ' tokens)</span>';
                        const _rDet = window._reasoningEl.querySelector('details');
                        if (_rDet) _rDet.open = false;
                        window._reasoningEl = null;
                        window._reasoningPre = null;
                        window._reasoningSummary = null;
                    }
                    if (window._visibleThinkingEl) {
                        const _pDet2 = window._visibleThinkingEl.querySelector('details');
                        if (_pDet2) _pDet2.open = false;
                        window._visibleThinkingEl = null;
                        window._visibleThinkingPre = null;
                    }
                    // Room-aware: AI_MESSAGE can also be room AI or personal AI.
                    if (msg.payload && msg.payload.room_id) {
                        if (msg.payload.room_id !== CURRENT_ROOM_ID) return;
                        if (msg.payload.content && msg.payload.content.trim()) {
                            const k = 'ai_room:' + (msg.payload.speaker || '') + ':' + msg.payload.content.slice(0, 200);
                            if (_seenRecently(k, 2000)) return;
                            addRoomLine('ai', msg.payload.speaker || 'Rhodes', msg.payload.content);
                        }
                        return;
                    }
                    // Inferrer broadcasts carry their own distinct req_id (v3_edit_<mode>_<token>,
                    // v2_<mode>_<token>, inv_<token>) — intentional, not stale. Exempt them from
                    // the activeReqId filter so they reach the banner hook below.
                    if (!(msg.payload && msg.payload.inferrer_inversion)
                        && activeReqId && msg.payload && msg.payload.req_id && msg.payload.req_id !== activeReqId) return;
                    if (msg.payload && msg.payload.inferrer_inversion) {
                        console.log('[INFERRER-BANNER] passed activeReqId gate', {
                            payload_req_id: msg.payload.req_id,
                            activeReqId: activeReqId,
                            streamingMsgEl: !!window.streamingMsgEl,
                        });
                    }
                    // Check for credential request from model
                    // Check for download offer in content
                    if (msg.payload.content && msg.payload.content.includes('[DOWNLOAD_OFFER:')) {
                        const dMatch = msg.payload.content.match(/\[DOWNLOAD_OFFER:(\{[^}]+\})\]/);
                        if (dMatch) {
                            try {
                                const dOpts = JSON.parse(dMatch[1]);
                                window._renderDownloadCard(dOpts, null);
                                msg.payload.content = msg.payload.content.replace(/\[DOWNLOAD_OFFER:\{[^}]+\}\]/, '').trim();
                                if (!msg.payload.content) return;
                            } catch(e) { console.error('Download offer parse error:', e); }
                        }
                    }
                    if (msg.payload.content && msg.payload.content.includes('[CREDENTIAL_REQUEST:')) {
                        const match = msg.payload.content.match(/\[CREDENTIAL_REQUEST:(\{[^}]+\})\]/);
                        if (match) {
                            try {
                                const opts = JSON.parse(match[1]);
                                opts.callback_id = activeReqId;
                                if (window.RhodesCredentials) {
                                    window.RhodesCredentials.show(opts);
                                }
                                // Remove the request from displayed content
                                msg.payload.content = msg.payload.content.replace(/\[CREDENTIAL_REQUEST:\{[^}]+\}\]/, '').trim();
                                if (!msg.payload.content) return;
                            } catch(e) { console.error('Credential parse error:', e); }
                        }
                    }

                    const reqId = _normalizeReqId(msg.payload && msg.payload.req_id, activeReqId);
                    const responseTimeLabel = _wallToWallLabelSafe(msg.payload || {}, pendingTurnStartTs);
                    msg.payload.content = msg.payload.content || '';

                    // Update valence context with current round info
                    if (typeof window.updateValenceContext === 'function') {
                        window.updateValenceContext(
                            msg.payload.round_id || msg.msg_id || activeReqId,
                            msg.msg_id || activeReqId,
                            msg.payload.model || null
                        );
                    }

                    // ALWAYS display content as a fresh message
                    if (msg.payload.content && msg.payload.content.trim()) {
                        const k = 'ai:' + (reqId || '') + ':' + msg.payload.content.slice(0, 240);
                        if (_seenRecently(k, 2000)) {
                            if (responseTimeLabel) {
                                const existing = _findLastAiMsgByReqId(reqId);
                                if (existing && !existing.querySelector('.msg-response-time')) {
                                    const _timeEl = document.createElement('span');
                                    _timeEl.className = 'msg-response-time';
                                    _timeEl.textContent = ' (' + responseTimeLabel + ')';
                                    existing.appendChild(_timeEl);
                                }
                            }
                            return;
                        }
                        // Collapse tool log so any subsequent tool calls appear after this message
                        if (typeof collapseToolCalls === 'function') collapseToolCalls();
                        const node = addMsg('ai', msg.payload.content, false, responseTimeLabel, {
                            sessionId: RHODES_ID || (msg.payload && (msg.payload.session_id || msg.payload.rhodes_id)) || null
                        });
                        if (node && reqId) node.dataset.reqId = reqId;
                        // Inferrer rewrite banner: payload carries both texts + version/mode/role meta
                        // Gated to user_2 (Sebastian) + user_3 (markbass) via RHODES_CONFIG.isAdmin.
                        if (node && msg.payload && msg.payload.inferrer_inversion && typeof msg.payload.inferrer_inverted_refusal === 'string'
                            && window.RHODES_CONFIG && window.RHODES_CONFIG.isAdmin) {
                            console.log('[INFERRER-BANNER] non-streaming path; attaching', {
                                version: msg.payload.inferrer3_role ? 'v3' : (msg.payload.inferrer2_mode ? 'v2' : 'v1'),
                                mode: msg.payload.inferrer3_mode || msg.payload.inferrer2_mode || null,
                                role: msg.payload.inferrer3_role || null,
                                rewrite_len: (msg.payload.content || '').length,
                                refusal_len: (msg.payload.inferrer_inverted_refusal || '').length,
                            });
                            try {
                                var inferrerOpts = {};
                                if (msg.payload.inferrer3_role) {
                                    inferrerOpts.version = 'v3';
                                    inferrerOpts.role = msg.payload.inferrer3_role;
                                    inferrerOpts.mode = msg.payload.inferrer3_mode || null;
                                } else if (msg.payload.inferrer2_mode) {
                                    inferrerOpts.version = 'v2';
                                    inferrerOpts.mode = msg.payload.inferrer2_mode;
                                } else {
                                    inferrerOpts.version = 'v1';
                                    inferrerOpts.pushExtension = !!(typeof msg.payload.inferrer_push_extension === 'string' && msg.payload.inferrer_push_extension.length > 0);
                                }
                                // Pass opener/extension separately so the banner can show the split
                                if (typeof msg.payload.inferrer_raw_opener === 'string') {
                                    inferrerOpts.opener = msg.payload.inferrer_raw_opener;
                                }
                                if (typeof msg.payload.inferrer_push_extension === 'string') {
                                    inferrerOpts.extension = msg.payload.inferrer_push_extension;
                                }
                                attachInferrerInversionToggle(node, msg.payload.content, msg.payload.inferrer_inverted_refusal, inferrerOpts);
                            }
                            catch (e) { console.error('[INFERRER] banner attach failed', e); }
                        }
                        if (node && msg.payload && msg.payload.inferrer_hallucination_report) {
                            try { attachHallucinationReport(node, msg.payload.inferrer_hallucination_report); }
                            catch (e) { console.error('[INFERRER] hallucination attach failed', e); }
                        }
                        if (msg.payload.debug_reasoning && window.RHODES_CONFIG && window.RHODES_CONFIG.isAdmin) {
                            attachDebugReasoning(node, msg.payload.debug_reasoning);
                        }
                    }
                    if (!(msg.payload && msg.payload.partial)) {
                        window._submitTimestamp = 0;
                        window._submitReqId = null;
                    }
                    // Admin error detail popup
                    if (msg.payload.error_detail && window.RHODES_CONFIG && window.RHODES_CONFIG.isAdmin) {
                        const errPopup = document.createElement('div');
                        errPopup.textContent = msg.payload.error_detail;
                        errPopup.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#cc0000;color:#fff;padding:12px 24px;border-radius:6px;z-index:10001;font-size:13px;font-family:monospace;max-width:80vw;word-break:break-all;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.4);';
                        errPopup.title = 'Click to dismiss';
                        errPopup.onclick = () => errPopup.remove();
                        document.body.appendChild(errPopup);
                        setTimeout(() => { if (errPopup.parentNode) errPopup.remove(); }, 15000);
                    }

                    // Check for screenshot actions and display inline
                    if (msg.payload.actions && msg.payload.actions.length > 0) {
                        for (const action of msg.payload.actions) {
                            if (action.name === 'browser_screenshot' && action.success) {
                                // Extract filename from message like "Screenshot saved to /tmp/rhodes-screenshot-123.png"
                                const match = action.message.match(/rhodes-screenshot-\d+\.png/);
                                if (match) {
                                    const filename = match[0];
                                    addScreenshotToChat(filename);
                                }
                            }
                        }
                    }

                    // Update guest count after each message
                    if (IS_GUEST && GUEST_MESSAGES_REMAINING > 0) {
                        GUEST_MESSAGES_REMAINING--;
                        updateGuestStatus();
                    }
                } else if (msg.msg_type === 'guest_status') {
                    hideLoading();
                    if (msg.payload.limit_reached) {
                        // Speak the limit message if voice is enabled
                        if (typeof VoiceChat !== 'undefined' && VoiceChat.voiceEnabled) {
                            VoiceChat.speak("Sorry, your guest messages are up. But if you click the sign in with Google button, we can keep chatting.");
                        }
                        // Exit hands-free mode if active (after brief delay to let TTS start)
                        setTimeout(() => {
                            const takeover = document.getElementById('handsfree-takeover');
                            if (takeover) takeover.classList.remove('active');
                            if (typeof VoiceChat !== 'undefined') {
                                VoiceChat.stopRecording();
                            }
                            // Show limit modal
                            limitModal.style.display = 'flex';
                            setStatus(false, 'LIMIT REACHED');
                        }, 500);
                    }
                } else if (msg.msg_type === 'register_response') {
                    const errorEl = document.getElementById('reg-error');
                    if (msg.payload.success) {
                        USER_TOKEN = msg.payload.token;
                        rhodesStorage.setItem('rhodes_user_token', USER_TOKEN);
                        IS_GUEST = false;
                        GUEST_HAS_ACTIVITY = false;
                        window.__guestOnboardingShown = false;
                        removeGuestOnboardingMessages();
                        authModal.style.display = 'none';
                        CURRENT_USERNAME = (msg.payload.username || '').trim() || null;
                        rhodesStorage.setItem('rhodes_username', CURRENT_USERNAME || '');
                        if (window.rhodesSessionState && window.rhodesSessionState.setLastIdentity) {
                            window.rhodesSessionState.setLastIdentity('user:' + (CURRENT_USERNAME || ''));
                        }
                        setStatus(true, 'CONNECTED (' + msg.payload.username + ')');
                        addMsg('ai', 'Welcome ' + msg.payload.username + '! Your account is ready.');
                        updateHeaderAuth();
                    } else {
                        errorEl.textContent = msg.payload.message;
                        errorEl.style.display = 'block';
                    }
                } else if (msg.msg_type === 'login_response') {
                    const errorEl = document.getElementById('login-error');
                    if (msg.payload.success) {
                        USER_TOKEN = msg.payload.token;
                        rhodesStorage.setItem('rhodes_user_token', USER_TOKEN);
                        IS_GUEST = false;
                        GUEST_HAS_ACTIVITY = false;
                        window.__guestOnboardingShown = false;
                        removeGuestOnboardingMessages();
                        // Update session ID from merged session (guest_web_ -> user_N_)
                        if (msg.payload.session_id) {
                            RHODES_ID = msg.payload.session_id;
                            if (RHODES_ID.indexOf('split-') === -1) {
                                if (wantsNewRhodes) {
                                    rhodesSessionStorage.setItem('rhodes_new_session_id', RHODES_ID);
                                } else if (window.rhodesSessionState && window.rhodesSessionState.setResumeSessionIdForCurrentIdentity) {
                                    window.rhodesSessionState.setResumeSessionIdForCurrentIdentity(RHODES_ID);
                                } else {
                                    rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
                                }
                            }
                        }
                        authModal.style.display = 'none';
                        // Redirect to returnTo if specified (e.g., from /download/ page)
                        if (returnTo) {
                            window.location.href = returnTo;
                            return;
                        }
                        // Session already upgraded server-side — update auth state
                        CURRENT_USERNAME = (msg.payload.username || '').trim() || null;
                        rhodesStorage.setItem('rhodes_username', CURRENT_USERNAME || '');
                        if (window.rhodesSessionState && window.rhodesSessionState.setLastIdentity) {
                            window.rhodesSessionState.setLastIdentity('user:' + (CURRENT_USERNAME || ''));
                        }
                        addMsg('ai', `Welcome back, ${msg.payload.username}!`);
                        setStatus(true, 'CONNECTED (' + msg.payload.username + ')');
                        updateHeaderAuth();
                    } else {
                        errorEl.textContent = msg.payload.message;
                        errorEl.style.display = 'block';
                    }
                } else if (msg.msg_type === 'password_reset_response') {
                    const errorEl = document.getElementById('reset-error');
                    const infoEl = document.getElementById('reset-info');
                    try { showAuthTab('reset'); } catch {}
                    if (msg.payload && msg.payload.success) {
                        if (infoEl) {
                            infoEl.textContent = msg.payload.message || 'If that email exists, a reset link has been sent.';
                            infoEl.style.display = 'block';
                        }
                    } else {
                        if (errorEl) {
                            errorEl.textContent = (msg.payload && msg.payload.message) ? msg.payload.message : 'Failed to process reset request';
                            errorEl.style.display = 'block';
                        }
                    }
                } else if (msg.msg_type === 'password_reset_complete_response') {
                    const errorEl = document.getElementById('reset-error');
                    const infoEl = document.getElementById('reset-info');
                    try { showAuthTab('reset'); } catch {}
                    if (msg.payload && msg.payload.success) {
                        if (infoEl) {
                            infoEl.textContent = msg.payload.message || 'Password updated successfully. You can login now.';
                            infoEl.style.display = 'block';
                        }
                        try { document.getElementById('reset-new-password').value = ''; } catch {}
                        try { document.getElementById('reset-new-password2').value = ''; } catch {}
                        showToast('Password updated');
                    } else {
                        if (errorEl) {
                            errorEl.textContent = (msg.payload && msg.payload.message) ? msg.payload.message : 'Failed to reset password';
                            errorEl.style.display = 'block';
                        }
                    }
                } else if (msg.msg_type === 'google_login_response') {
                    const errorEl = document.getElementById('login-error');
                    if (msg.payload.success) {
                        USER_TOKEN = msg.payload.token;
                        rhodesStorage.setItem('rhodes_user_token', USER_TOKEN);
                        IS_GUEST = false;
                        GUEST_HAS_ACTIVITY = false;
                        window.__guestOnboardingShown = false;
                        removeGuestOnboardingMessages();
                        // Update session ID from merged session (guest_web_ -> user_N_)
                        if (msg.payload.session_id) {
                            RHODES_ID = msg.payload.session_id;
                            if (RHODES_ID.indexOf('split-') === -1) {
                                if (wantsNewRhodes) {
                                    rhodesSessionStorage.setItem('rhodes_new_session_id', RHODES_ID);
                                } else if (window.rhodesSessionState && window.rhodesSessionState.setResumeSessionIdForCurrentIdentity) {
                                    window.rhodesSessionState.setResumeSessionIdForCurrentIdentity(RHODES_ID);
                                } else {
                                    rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
                                }
                            }
                        }
                        authModal.style.display = 'none';
                        // Session already upgraded server-side — update auth state
                        CURRENT_USERNAME = (msg.payload.username || '').trim() || null;
                        rhodesStorage.setItem('rhodes_username', CURRENT_USERNAME || '');
                        if (window.rhodesSessionState && window.rhodesSessionState.setLastIdentity) {
                            window.rhodesSessionState.setLastIdentity('user:' + (CURRENT_USERNAME || ''));
                        }
                        addMsg('ai', `Welcome, ${msg.payload.username}! Signed in with Google.`);
                        setStatus(true, 'CONNECTED (' + msg.payload.username + ')');
                        updateHeaderAuth();
                    } else {
                        const attemptedGoogle = window.__lastAuthAttempt === 'google';
                        const fallback = attemptedGoogle ? 'Google sign-in failed' : 'Login failed';
                        errorEl.textContent = msg.payload.message || fallback;
                        errorEl.style.display = 'block';
                    }
                } else if (msg.msg_type === 'session_resume_response') {
                    if (msg.payload.success) {
                        if (window.RHODES_CONFIG) {
                            window.RHODES_CONFIG.canViewReasoning = !!(msg.payload.can_view_reasoning || window.RHODES_CONFIG.isAdmin);
                            window.RHODES_CONFIG.canViewAbortAlerts = !!(msg.payload.can_view_abort_alerts || window.RHODES_CONFIG.isAdmin);
                        }
                        // Load conversation history into chat (switch session)
                        const conversation = msg.payload.conversation || [];
                        console.log('[RESUME] Received conversation:', conversation.length, 'messages');
                        try { chat.innerHTML = ''; } catch {}
                        if (window.RhodesReportMode && window.RhodesReportMode.resetSession) window.RhodesReportMode.resetSession();
                        let _lastAiText2 = '';
                        var _pendingTools2 = [];
                        for (const m of conversation) {
                            if (m.role === 'tool') continue;
                            var _tc2 = m.tool_calls || (m.metadata && m.metadata.tool_calls);
                            if (_tc2 && _tc2.length) { _pendingTools2 = _pendingTools2.concat(_tc2); }
                            if (m.role === 'assistant' && (!m.content || !m.content.trim())) continue;
                            // Flush batched tool calls before rendering text
                            if (_pendingTools2.length && window.renderResumedToolCalls) {
                                window.renderResumedToolCalls(_pendingTools2, chat);
                                _pendingTools2 = [];
                            }
                            // Mask passwords in user messages when replaying history
                            const content = m.role === 'user' ? maskPasswords(m.content) : m.content;
                            if (m.role === 'assistant') {
                                const trimmed = (content || '').trim();
                                if (trimmed === _lastAiText2) continue;
                                _lastAiText2 = trimmed;
                            } else {
                                _lastAiText2 = '';
                            }
                            if (m.role === 'assistant' && m.reasoning_content && window.renderResumedReasoning) {
                                window.renderResumedReasoning(m.reasoning_content, chat);
                            }
                            addMsg(m.role === 'user' ? 'user' : 'ai', content);
                        }
                        // Flush any remaining tool calls at end
                        if (_pendingTools2.length && window.renderResumedToolCalls) {
                            window.renderResumedToolCalls(_pendingTools2, chat);
                        }
                        const sid = msg.payload.session_id || msg.payload.rhodes_id || '';
                        if (sid) {
                            RHODES_ID = sid;
                            if (RHODES_ID.indexOf('split-') === -1) {
                                if (wantsNewRhodes) {
                                    rhodesSessionStorage.setItem('rhodes_new_session_id', RHODES_ID);
                                } else if (window.rhodesSessionState && window.rhodesSessionState.setResumeSessionIdForCurrentIdentity) {
                                    window.rhodesSessionState.setResumeSessionIdForCurrentIdentity(RHODES_ID);
                                } else {
                                    rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
                                }
                            }
                            const sessionEl = document.getElementById('session-id');
                            if (sessionEl) {
                                sessionEl.dataset.sessionId = RHODES_ID;
                            }
                            if (window.RhodesReportMode && window.RhodesReportMode.syncSessionId) {
                                window.RhodesReportMode.syncSessionId(RHODES_ID);
                            }
                            if (window.__rhodesApplySessionNote) {
                                window.__rhodesApplySessionNote(msg.payload.session_note);
                            }
                        }
                        // Show model info if present (helps user know what mode they're in)
                        const sessionModel = msg.payload.model_alias || msg.payload.model || '';
                        if (typeof window.updateValenceContext === 'function') {
                            window.updateValenceContext(null, null, sessionModel || null);
                        }
                        const modelPretty = sessionModel === 'opus' ? 'ALPHA' :
                            sessionModel === 'sonnet' ? 'BETA' :
                            sessionModel === 'deepseek' ? 'DELTA' :
                            sessionModel === 'haiku' ? 'ADA' :
                    sessionModel === 'kimi' ? 'EPSILON' :
                    sessionModel === 'grok' ? 'ZETA' :
                            sessionModel.includes('delta') ? 'DELTA' :
                            sessionModel.includes('alpha') ? 'ALPHA' :
                            (sessionModel ? sessionModel.toUpperCase() : '');
                        window.__pendingSessionSwitch = null;
                        const modelNote = modelPretty ? ` (${modelPretty} mode)` : '';
                        addMsg('ai', `Session ${sid || '(unknown)'} resumed. ${msg.payload.message_count} messages loaded.${modelNote}`);
                    } else {
                        addMsg('ai', `Failed to resume session: ${msg.payload.error}`);
                    }
                } else if (msg.msg_type === 'session_new_response') {
                    if (msg.payload.success) {
                        // Clear chat and switch to new session
                        try { chat.innerHTML = ''; } catch {}
                        if (window.RhodesReportMode && window.RhodesReportMode.resetSession) window.RhodesReportMode.resetSession();
                        // Reset tool totals for new session
                        if (typeof resetToolTotals === 'function') resetToolTotals();
                        const sid = msg.payload.session_id || '';
                        if (sid) {
                            RHODES_ID = sid;
                            if (RHODES_ID.indexOf('split-') === -1) {
                                if (window.rhodesSessionState && window.rhodesSessionState.setResumeSessionIdForCurrentIdentity) {
                                    window.rhodesSessionState.setResumeSessionIdForCurrentIdentity(RHODES_ID);
                                } else {
                                    rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
                                }
                            }
                            const sessionEl = document.getElementById('session-id');
                            if (sessionEl) {
                                sessionEl.dataset.sessionId = RHODES_ID;
                            }
                            if (window.RhodesReportMode && window.RhodesReportMode.syncSessionId) {
                                window.RhodesReportMode.syncSessionId(RHODES_ID);
                            }
                            if (window.__rhodesApplySessionNote) {
                                window.__rhodesApplySessionNote(msg.payload.session_note);
                            }
                        }
                        showToast('New session created');
                        addMsg('ai', 'Started a fresh session. How can I help you?');
                    } else {
                        showToast('Failed to create session: ' + (msg.payload.error || 'Unknown error'));
                    }
                } else if (msg.msg_type === 'model_set_response') {
                    try { if (typeof hideLoading === 'function') hideLoading(); } catch (e) {}
                    if (msg.payload && msg.payload.success) {
                        const model = (msg.payload.model || '').toString().toLowerCase();
                        try { if (window.__rhodesLiveIndicator) window.__rhodesLiveIndicator.setModel(model || (msg.payload.alias || '')); } catch (e) {}
                        const pretty =
                            model === 'opus' ? 'ALPHA' :
                            model === 'sonnet' ? 'BETA' :
                            model === 'deepseek' ? 'DELTA' :
                            model === 'haiku' ? 'ADA' :
                    model === 'kimi' ? 'EPSILON' :
                    model === 'grok' ? 'ZETA' :
                                model.includes('r1.13') ? 'RHODES LEGACY A' :
                                model.includes('r1.14') ? 'RHODES LEGACY B' :
                                model.includes('r1.15') ? 'RHODES LEGACY C' :
                            (model ? model.toUpperCase() : 'MODEL');
                        const planBadge = model.endsWith('ep') ? ' [PLAN]' : '';
                        showToast(`Mode switched to ${pretty}${planBadge}`);
                    } else {
                        const err = (msg.payload && (msg.payload.error || msg.payload.message)) ? (msg.payload.error || msg.payload.message) : 'Model switch failed';
                        showToast('Mode switch failed');
                    }
                } else if (msg.msg_type === 'voice_language_hint') {
                    // Server sent language hint for voice recognition (tutor mode)
                    if (msg.payload && msg.payload.language) {
                        const lang = msg.payload.language;
                        const tutorLang = msg.payload.tutor_language || '';
                        console.log('Voice language hint received:', lang, 'tutor:', tutorLang);
                        
                        // Store tutor language for dual-mode recognition
                        window.rhodesActiveTutorLang = lang;
                        
                        // Update the language selector
                        const langSelect = document.getElementById('lang-select');
                        if (langSelect) {
                            langSelect.value = lang;
                        }
                        
                        // Update Web Speech API recognition language AND restart if active
                        if (VoiceChat && VoiceChat.recognition) {
                            const wasRunning = VoiceChat.isRecording;
                            if (wasRunning) {
                                try { VoiceChat.recognition.stop(); } catch(e) {}
                            }
                            VoiceChat.recognition.lang = lang;
                            console.log('Speech recognition language updated to:', lang);
                            // Restart after brief delay if was running
                            if (wasRunning) {
                                setTimeout(() => {
                                    try { VoiceChat.recognition.start(); } catch(e) {}
                                }, 200);
                            }
                        }
                        
                        // Show toast notification
                        const langNames = {
                            'de-DE': 'German',
                            'fr-FR': 'French',
                            'es-ES': 'Spanish',
                            'it-IT': 'Italian',
                            'ru-RU': 'Russian',
                            'en-US': 'English'
                        };
                        const langName = langNames[lang] || lang;
                        showToast('Voice switched to ' + langName + ' - speak ' + langName + ' phrases clearly');
                    }
                } else if (msg.msg_type === 'session_rotated') {
                    // Backend rotated the session id; keep all tabs in sync.
                    if (msg.payload && msg.payload.new_session_id) {
                        RHODES_ID = msg.payload.new_session_id;
                        if (RHODES_ID.indexOf('split-') === -1) {
                            if (wantsNewRhodes) {
                                rhodesSessionStorage.setItem('rhodes_new_session_id', RHODES_ID);
                            } else if (window.rhodesSessionState && window.rhodesSessionState.setResumeSessionIdForCurrentIdentity) {
                                window.rhodesSessionState.setResumeSessionIdForCurrentIdentity(RHODES_ID);
                            } else {
                                rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
                            }
                        }
                        const sessionEl = document.getElementById('session-id');
                        if (sessionEl) {
                            sessionEl.dataset.sessionId = RHODES_ID;
                        }
                        if (window.__rhodesApplySessionNote) {
                            window.__rhodesApplySessionNote(msg.payload ? msg.payload.session_note : null);
                        }
                        if (window.RhodesReportMode && window.RhodesReportMode.syncSessionId) {
                            window.RhodesReportMode.syncSessionId(RHODES_ID);
                        }
                        const reason = (msg.payload.reason || '').toString().toLowerCase();
                        if (reason === 'model_switch' && msg.payload.model) {
                            const model = (msg.payload.model || '').toString().toLowerCase();
                            try { if (window.__rhodesLiveIndicator) window.__rhodesLiveIndicator.setModel(model); } catch (e) {}
                            const pretty =
                                model === 'opus' ? 'ALPHA' :
                                model === 'sonnet' ? 'BETA' :
                                model === 'deepseek' ? 'DELTA' :
                                model === 'haiku' ? 'ADA' :
                    model === 'kimi' ? 'EPSILON' :
                    model === 'grok' ? 'ZETA' :
                                model.includes('r1.13') ? 'RHODES LEGACY A' :
                                model.includes('r1.14') ? 'RHODES LEGACY B' :
                                model.includes('r1.15') ? 'RHODES LEGACY C' :
                                (model ? model.toUpperCase() : 'MODEL');
                            showToast(`Mode switched to ${pretty}`);
                        } else {
                            showToast('Session rotated');
                        }
                    }
                } else if (msg.msg_type === 'provider_change') {
                    // Refusal-detector reroute / failover. Update provider
                    // half of the indicator + flash. Visible only to the
                    // restricted server-side operator allowlist.
                    try {
                        if (window.__rhodesLiveIndicator && msg.payload) {
                            if (msg.payload.new_provider) {
                                window.__rhodesLiveIndicator.setProvider(msg.payload.new_provider);
                            }
                            window.__rhodesLiveIndicator.flashFallback();
                        }
                    } catch (e) {}
                } else if (msg.msg_type === 'provider_info') {
                    // Per-turn live indicator snapshot. Updates both fields.
                    try {
                        if (window.__rhodesLiveIndicator && msg.payload) {
                            window.__rhodesLiveIndicator.setBoth(
                                msg.payload.model || msg.payload.alias || '',
                                msg.payload.provider || ''
                            );
                        }
                    } catch (e) {}
                } else if (msg.msg_type === 'generation_abort') {
                    const _canViewAbortAlerts = window.RHODES_CONFIG && (window.RHODES_CONFIG.canViewAbortAlerts || window.RHODES_CONFIG.isAdmin);
                    if (!_canViewAbortAlerts) return;
                    const p = msg.payload || {};
                    const abortType = (p.abort_type || 'generation_abort').toString();
                    const reason = (p.reason || '').toString();
                    const retry = p.retry ? (' ' + p.retry + '/' + (p.max_retries || '?')) : '';
                    const firstToken = (p.first_token || '').toString();
                    const detail = firstToken ? (' first=' + JSON.stringify(firstToken.slice(0, 80))) : '';
                    const line = '[Stream abort] ' + (p.message || ('Retried after ' + abortType + (reason ? (': ' + reason) : ''))) + retry + detail;
                    try { showToast('Stream aborted; retrying format'); } catch (e) {}
                    addMsg('ai', '<span style="color:var(--orange);font-family:var(--mono);font-size:12px;">' + escapeHtml(line) + '</span>', true);
                } else if (msg.msg_type === 'error') {
                    const errText = (msg.payload && msg.payload.error) || 'An error occurred';
                    addMsg('ai', '[System] ' + errText);
                } else if (msg.msg_type === 'local_file_request') {
                    // Handle local file operations via browser extension
                    handleLocalFileRequest(msg);
                } else if (msg.msg_type === 'agent_command') {
                    // Desktop local tool execution - server asks us to run a command
                    if (window.rhodes && window.rhodes.isDesktop) {
                        const cmdId = msg.cmd_id;
                        const cmdType = msg.cmd_type;
                        const cmdPayload = msg.payload || {};
                        console.log('[DESKTOP] Agent command:', cmdType, cmdId);
                        (async () => {
                            let result;
                            try {
                                switch (cmdType) {
                                    case 'shell_exec':
                                        result = await window.rhodes.exec(cmdPayload.command, cmdPayload.cwd, (cmdPayload.timeout || 60) * 1000);
                                        break;
                                    case 'python_exec':
                                        result = await window.rhodes.exec('python3 -c ' + JSON.stringify(cmdPayload.code || ''));
                                        break;
                                    case 'file_read':
                                        result = await window.rhodes.read(cmdPayload.path);
                                        break;
                                    case 'file_write':
                                        result = await window.rhodes.write(cmdPayload.path, cmdPayload.content);
                                        break;
                                    case 'file_list':
                                        result = await window.rhodes.ls(cmdPayload.path || '~');
                                        break;
                                    case 'screenshot':
                                        result = await window.rhodes.screenshot();
                                        break;
                                    case 'click':
                                        result = await window.rhodes.click(cmdPayload.x, cmdPayload.y);
                                        break;
                                    case 'type_text':
                                        result = await window.rhodes.type(cmdPayload.text);
                                        break;
                                    default:
                                        result = {success: false, error: 'Unknown command: ' + cmdType};
                                }
                            } catch (err) {
                                result = {success: false, error: err.message || String(err)};
                            }
                            if (ws && ws.readyState === 1) {
                                ws.send(JSON.stringify({
                                    msg_type: 'agent_result',
                                    payload: Object.assign({cmd_id: cmdId}, result)
                                }));
                            }
                            console.log('[DESKTOP] Command result:', cmdType, result.success !== false ? 'OK' : result.error);
                        })();
                    }
                } else if (msg.msg_type === 'system_message') {
                    // Plan mode toggle and other system notifications
                    if (msg.payload && msg.payload.content) {
                        addMsg('ai', msg.payload.content);
                    }
                } else if (msg.msg_type === 'injection_debug') {
                    showInjectionDebug(msg.payload);
                } else if (msg.msg_type === 'thought_sub_debug') {
                    showThoughtSubDebug(msg.payload);
                
                } else if (msg.msg_type === 'handoff_notify') {
                    // Server-push: social CLI hit CAPTCHA, open VNC viewer immediately
                    const hd = msg.payload || {};
                    if (typeof window.openHandoffViewer === 'function' && hd.novnc_url) {
                        window.openHandoffViewer(hd.novnc_url, hd.cli_name || 'cli', hd.reason || 'Solve CAPTCHA to continue');
                    }
                } else if (msg.msg_type === 'handoff_complete') {
                    // Don't auto-close — let user close VNC when ready
                    if (typeof showToast === 'function') {
                        showToast('Task completed — you can close the VNC viewer when ready');
                    }
                } else if (msg.msg_type === 'split_mode_command') {
                    // Server-push: enter split mode (from /multisandbox command)
                    const sp = msg.payload || {};
                    const paneCount = sp.pane_count || 4;
                    window._multisandboxMode = sp.multisandbox || false;
                    const resumeIds = sp.resume_sessions || null;
                    console.log('[MULTISANDBOX] Entering split mode:', paneCount, 'panes, multisandbox:', window._multisandboxMode, 'resume:', resumeIds);
                    if (typeof window.enterSplitMode === 'function') {
                        window.enterSplitMode(paneCount, resumeIds);
                    } else {
                        addMsg('ai', '[System] Split mode not available. Load rhodes-split.js first.');
                    }
                                } else if (msg.msg_type === 'user_sites_response') {
                    if (typeof window._renderUserSites === 'function') {
                        window._renderUserSites(msg.payload.sites || []);
                    }
                } else if (msg.msg_type === 'terminal_response') {
                    const tp = msg.payload || {};
                    if (tp.error) {
                        if (typeof showToast === 'function') showToast('Terminal: ' + tp.error);
                    } else if (tp.url) {
                        if (typeof window._openTerminalViewer === 'function') {
                            window._openTerminalViewer(tp.url, tp.username || 'user');
                        }
                    }
                } else if (msg.msg_type === 'terminal_stopped') {
                    const overlay = document.getElementById('terminal-overlay');
                    if (overlay) overlay.remove();
                    if (typeof showToast === 'function') showToast('Terminal stopped');
                } else if (msg.msg_type === 'tool_call') {
                    const tool = msg.payload;
                    // Track active tool loop — suppress SHARE/REPORT on intermediate messages
                    if (tool.status === 'starting') window._rhodesToolLoopActive = true;
                    // Stash per-tool thinking on a window map so the live badge
                    // renderer (the one that creates the dot/expand UI) can
                    // splice them into the badge details when it builds them.
                    // Indexed by req_id+round+name for the active turn.
                    try {
                        var _tk = (tool.req_id || '') + ':' + (tool.round || 0) + ':' + (tool.name || '');
                        window._rhodesLiveToolThink = window._rhodesLiveToolThink || {};
                        var _e = window._rhodesLiveToolThink[_tk] || {};
                        if (tool._rhodes_think) _e._rhodes_think = tool._rhodes_think;
                        if (tool._rhodes_think_public) _e._rhodes_think_public = tool._rhodes_think_public;
                        if (tool.thinking) _e.thinking = tool.thinking;
                        window._rhodesLiveToolThink[_tk] = _e;
                    } catch (_e_stash) {}

            // ── Handoff viewer auto-detect ──
            if (tool.status === 'complete' && tool.result) {
                if (typeof window.checkHandoffResult === 'function') {
                    const wasHandoff = window.checkHandoffResult(tool.result);
                    // Don't suppress tool display — let it show in the tool log too
                }
            }
                    // FIXED: Removed filter that drops tool calls when user sends new message
                    // if (activeReqId && tool && tool.req_id && tool.req_id !== activeReqId) return;
                    const toolName = tool.name || 'unknown';
                    const toolArgs = tool.arguments || {};
                    const isPrivileged = !IS_GUEST && USER_TOKEN;
                    const round = tool.round || 0;

                    if ((toolName.includes('think') || toolName === 'claude_search' || toolName === 'mark_insight' || toolName === 'expand_prompt' || toolName === 'set_system_prompt' || toolName === 'fine_tune_yourself') && !isPrivileged) return;

                    const status = tool.status || 'complete';
                    const fingerprintSrc =
                        toolArgs.command || toolArgs.path || toolArgs.thought || (typeof tool.result === 'string' ? tool.result : '') || JSON.stringify(toolArgs || {}).slice(0, 200);
                    const fp = `tool:${toolName}:${round}:${status}:${String(fingerprintSrc).slice(0, 180)}`;
                    if (_seenRecently(fp, 2000)) return;
                    // Show all tool statuses (starting/running/complete) so it doesn't look "sporadic".
                    
                    // Auto-handle download offers emitted by any tool result (e.g., local_* with no connected desktop)
                    if (status === 'complete' && tool && tool.result && typeof tool.result === 'object' && tool.result._download_offer) {
                        if (typeof collapseToolCalls === 'function') collapseToolCalls();
                        window._renderDownloadCard(toolArgs, tool.result);

                        const localSetupHint = [tool.result.error || '', tool.result.message || '']
                            .join(' ')
                            .trim();
                        if (localSetupHint) {
                            addMsg('ai', localSetupHint);
                        }

                        if (Array.isArray(tool.result.recommended_next_steps) && tool.result.recommended_next_steps.length > 0) {
                            const steps = tool.result.recommended_next_steps
                                .map((s, i) => `${i + 1}. ${s}`)
                                .join('\n');
                            addMsg('ai', `Next steps:\n${steps}`);
                        }
                        return;
                    }

                    // Message and respond tools should display as normal messages, not tool calls
                    if (toolName === 'message' || toolName === 'respond' || toolName === 'offer_download') {
                        // Only display on 'complete' status to avoid showing same message twice
                        if (status !== 'complete') return;
                        
                        // Play completion sound for verification tools (Bash commands)
                        if (toolName === 'Bash' && window.playCompletionSound) {
                            window.playCompletionSound();
                        }
                        
                        let messageText = '';
                        
                        // Check result object first (what the tool returned)
                        if (tool.result) {
                            if (typeof tool.result === 'string') {
                                try {
                                    const parsed = JSON.parse(tool.result);
                                    if (parsed && typeof parsed === 'object') {
                                        // Check for special message/respond result markers
                                        if (parsed._rhodes_intermediate_message || parsed._rhodes_final_response) {
                                            messageText = parsed.message || parsed.response || '';
                                        } else {
                                            messageText = parsed.message || parsed.response || '';
                                        }
                                    }
                                } catch (e) {
                                    // Not JSON, use as raw string
                                    messageText = tool.result;
                                }
                            } else if (tool.result && typeof tool.result === 'object') {
                                // Check for special message/respond result markers
                                if (tool.result._rhodes_intermediate_message || tool.result._rhodes_final_response) {
                                    messageText = tool.result.message || tool.result.response || '';
                                } else {
                                    messageText = tool.result.message || tool.result.response || '';
                                }
                            }
                        }
                        
                        // Fall back to arguments (what was sent to the tool)
                        if (!messageText) {
                            messageText = toolArgs.message || toolArgs.response || '';
                        }
                        
                        if (messageText) {
                            const mk = 'toolmsg:' + messageText.slice(0, 240);
                            if (_seenRecently(mk, 2000)) return;
                            if (typeof collapseToolCalls === 'function') collapseToolCalls();
                            // Check for download offer card
                            if (toolName === 'offer_download') {
                                window._renderDownloadCard(toolArgs, tool.result);
                            } else {
                                addMsg('ai', messageText);
                            }
                        }
                        return;
                    }

                    // Tool dot container (groups tool dots together)
                    let msgEl = window.toolLogEl;
                    if (!msgEl) {
                        // Finalize any streaming content so tool dots appear after it
                        if (window.streamingMsgEl) {
                            // Finalize the streaming element: render markdown, remove cursor
                            if (window.streamingContent && window.marked) {
                                window.streamingMsgEl.innerHTML = window.marked.parse(window.streamingContent);
                            }
                            window.streamingMsgEl.querySelectorAll('.streaming-cursor').forEach(function(c) { c.remove(); });
                            window.streamingMsgEl.classList.remove('streaming');
                            window.streamingMsgEl = null;
                            window.streamingContent = '';
                            window._streamReqId = null;
                        }
                        msgEl = document.createElement('div');
                        msgEl.className = 'tool-dot-container';
                        document.getElementById('chat').appendChild(msgEl);
                        window.toolLogEl = msgEl;
                    }

                    // Build preview and details
                    let detailsContent = '';
                    let preview = '';
                    
                    if (toolName.includes('think') && toolArgs.thought) {
                        const t = toolArgs.thought;
                        detailsContent = '<pre style="color:var(--green);white-space:pre-wrap;">' + escapeHtml(t) + '</pre>';
                        preview = t.substring(0, 80).split('\n').join(' ') + '...';
                    } else if (toolArgs.command) {
                        detailsContent = '<pre style="color:var(--cyan);white-space:pre-wrap;">' + escapeHtml(toolArgs.command) + '</pre>';
                        preview = toolArgs.command.substring(0, 60);
                    } else if ((toolName === 'Write' || toolName === 'Edit') && (toolArgs.file_path || toolArgs.path)) {
                        const filePath = toolArgs.file_path || toolArgs.path;
                        let details = '<strong>File:</strong> ' + escapeHtml(filePath);
                        if (toolArgs.content) details += '<br><pre style="max-height:200px;overflow:auto">' + escapeHtml(toolArgs.content) + '</pre>';
                        if (toolArgs.old_string) details += '<br><strong>Old:</strong><pre>' + escapeHtml(toolArgs.old_string) + '</pre>';
                        if (toolArgs.new_string) details += '<br><strong>New:</strong><pre>' + escapeHtml(toolArgs.new_string) + '</pre>';
                        detailsContent = details;
                        preview = filePath;
                    } else if (toolArgs.file_path || toolArgs.path) {
                        preview = toolArgs.file_path || toolArgs.path;
                        detailsContent = '<pre>' + escapeHtml(preview) + '</pre>';
                    } else if (toolArgs.url) {
                        preview = toolArgs.url;
                        detailsContent = '<pre>' + escapeHtml(preview) + '</pre>';
                    } else {
                        detailsContent = '<pre style="white-space:pre-wrap;">' + escapeHtml(JSON.stringify(toolArgs, null, 2)) + '</pre>';
                        preview = Object.keys(toolArgs).slice(0,3).join(', ');
                    }

                    // Add result to details if complete
                    if (status === 'complete' && tool.result) {
                        const resultStr = typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result, null, 2);
                        const truncResult = resultStr.length > 500 ? resultStr.substring(0, 500) + '...' : resultStr;
                        // Linkify URLs in result and add VNC/site embeds
                        let resultHtml = escapeHtml(truncResult);
                        let resultEmbeds = '';
                        // VNC URL -> embed button
                        const vncMatch = resultStr.match(/https?:\/\/[^\s"']*(?:cli-vnc\/\d+\/vnc(?:_lite)?\.html|sites\/[^\s"']*vnc)[^\s"']*/);
                        if (vncMatch) {
                            const vu = vncMatch[0].replace(/'/g, "\\'");
                            resultEmbeds += '<div style="margin:4px 0;"><button onclick="if(typeof window.openHandoffViewer===\'function\'){window.openHandoffViewer(\'' + vu + '\',\'VNC\',\'Remote session\')}else{window.open(\'' + vu + '\',\'rhodes_vnc\',\'width=1024,height=768\')}" style="background:rgba(0,255,65,0.15);border:1px solid var(--green);color:var(--green);padding:4px 12px;cursor:pointer;font-family:Orbitron,monospace;font-size:11px;border-radius:3px;">Open VNC Session</button></div>';
                        }
                        // User-site URL -> preview iframe
                        const siteMatch = resultStr.match(/https?:\/\/rhodesagi\.com\/user-sites\/[^\s"'`\)\]]+/);
                        if (siteMatch) {
                            const su = siteMatch[0].replace(/[),.;!?]+$/g, '');
                            const sn = su.replace(/https?:\/\/rhodesagi\.com\/user-sites\//, '');
                            const suPath = su.split('#')[0].split('?')[0].toLowerCase();
                            const embeddable = !suPath.endsWith('/') && /\.(html?|xhtml|svg)$/.test(suPath);
                            if (embeddable) {
                                resultEmbeds += '<div style="margin:4px 0;border:1px solid var(--cyan);border-radius:4px;overflow:hidden;"><div style="padding:4px 8px;background:rgba(0,191,255,0.08);display:flex;justify-content:space-between;align-items:center;"><a href="' + su + '" target="_blank" style="color:var(--cyan);font-size:11px;">' + sn + '</a><button onclick="var ifr=this.closest(\'div\').parentElement.querySelector(\'iframe\');ifr.style.display=ifr.style.display===\'none\'?\'block\':\'none\'" style="background:none;border:1px solid var(--cyan);color:var(--cyan);padding:2px 8px;cursor:pointer;font-size:10px;border-radius:3px;">Preview</button></div><iframe src="' + su + '" style="width:100%;height:250px;border:none;background:#fff;display:none;" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe></div>';
                            } else {
                                resultEmbeds += '<div style="margin:4px 0;border:1px solid var(--cyan);border-radius:4px;overflow:hidden;background:rgba(0,191,255,0.06);padding:6px 8px;"><a href="' + su + '" target="_blank" style="color:var(--cyan);font-size:11px;">' + sn + '</a><span style="margin-left:8px;color:var(--dim);font-size:10px;">Preview disabled for non-web file</span></div>';
                            }
                        }
                        // Linkify URLs in the escaped result text
                        resultHtml = resultHtml.replace(/(https?:\/\/[^\s<>&`]+(?:&amp;[^\s<>&`]+)*)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;">$1</a>');
                        detailsContent += '<div style="margin-top:6px;border-top:1px solid rgba(255,255,255,0.1);padding-top:6px;"><span style="color:var(--green);">Result:</span>' + resultEmbeds + '<pre style="white-space:pre-wrap;color:var(--text);max-height:150px;overflow:auto;">' + resultHtml + '</pre></div>';
                    }

                    // Per-tool reasoning rendering:
                    // - Admin: nothing inline (private + public both flow into the
                    //   standard reasoning panel via reasoning_chunk events server-side)
                    // - Non-admin: public 'thinking' (renamed from _rhodes_think_public
                    //   on the wire) gets a small inline box, since the standard
                    //   reasoning panel is suppressed for them.
                    var _liveIsAdmin = window.RHODES_CONFIG && window.RHODES_CONFIG.isAdmin;
                    if (!_liveIsAdmin) {
                        var _liveThinkPub = tool.thinking || '';
                        if (_liveThinkPub) {
                            detailsContent = '<div style="color:var(--green);opacity:0.9;font-size:11px;margin-bottom:6px;border-left:2px solid var(--green);padding:4px 8px;background:rgba(0,255,150,0.08);">' + escapeHtml(_liveThinkPub) + '</div>' + detailsContent;
                        }
                    }

                    // Idempotent: key on toolName|round only (preview may differ between start/complete)
                    // Use a sequential counter for multiple tools of same name in same round
                    if (!window._toolRoundCounters) window._toolRoundCounters = new Map();
                    const baseKey = toolName + '|' + round;
                    let toolKey;
                    if (status === 'starting' || status === 'running') {
                        // Check for existing running entry (dedup streaming + batch starting events)
                        toolKey = null;
                        for (const [k, v] of window._toolItems) {
                            if (k.startsWith(baseKey + '|') && v.lastStatus && v.lastStatus !== 'complete') {
                                toolKey = k;
                                break;
                            }
                        }
                        if (!toolKey) {
                            const count = window._toolRoundCounters.get(baseKey) || 0;
                            toolKey = baseKey + '|' + count;
                            window._toolRoundCounters.set(baseKey, count + 1);
                        }
                    } else {
                        // Complete: find the oldest running entry with same baseKey
                        toolKey = null;
                        for (const [k, v] of window._toolItems) {
                            if (k.startsWith(baseKey + '|') && v.lastStatus !== 'complete' && v.el && v.el.isConnected) {
                                toolKey = k;
                                break;
                            }
                        }
                        if (!toolKey) {
                            // No running entry found — use baseKey with next counter
                            const count = window._toolRoundCounters.get(baseKey) || 0;
                            toolKey = baseKey + '|' + count;
                            window._toolRoundCounters.set(baseKey, count + 1);
                        }
                    }

                    // Timer logic
                    let durationLabel = '';
                    let isLiveTimer = false;
                    if (status === 'starting' || status === 'running') {
                        if (!window._toolTimers.has(toolKey)) {
                            window._toolTimers.set(toolKey, Date.now());
                            if (typeof trackToolStart === 'function') trackToolStart(toolKey);
                        }
                        // Show live elapsed time while running
                        const startTime = window._toolTimers.get(toolKey);
                        if (startTime) {
                            durationLabel = formatDuration(Math.max(0, Date.now() - startTime));
                            isLiveTimer = true;
                        }
                    } else if (status === 'complete') {
                        const startTime = window._toolTimers.get(toolKey);
                        const clientDuration = startTime ? Math.max(0, Date.now() - startTime) : 0;
                        const durationMs = clientDuration > 0 ? clientDuration : (Number(tool.duration_ms) || 0);
                        durationLabel = durationMs > 0 ? formatDuration(durationMs) : '';
                        if (typeof trackToolComplete === 'function') trackToolComplete(toolKey, durationMs);
                    }

                    // Build compact dot indicator
                    const isComplete = (status === 'complete');
                    const indicator = isComplete ? '\u25cf' : '\u25cb';
                    const shortPreview = preview.length > 40 ? preview.substring(0, 40) + '...' : preview;
                    const dotLabel = toolName + (shortPreview ? ': ' + shortPreview : '');

                    const wrapperDiv = document.createElement('div');
                    wrapperDiv.className = 'tool-dot-wrapper';
                    wrapperDiv.setAttribute('data-status', status);

                    const dotSpan = document.createElement('span');
                    dotSpan.className = 'tool-dot';
                    dotSpan.setAttribute('data-status', status);
                    dotSpan.onclick = function() { wrapperDiv.classList.toggle('tool-dot-expanded'); };
                    dotSpan.innerHTML = '<span class="tool-dot-indicator">' + indicator + '</span>' +
                        '<span class="tool-dot-name">' + escapeHtml(dotLabel) + '</span>' +
                        '<span class="tool-dot-duration">' + (durationLabel || '') + '</span>';

                    // Live timer: update every second while tool is running
                    if (isLiveTimer) {
                        const _liveKey = toolKey;
                        const _liveDurEl = dotSpan.querySelector('.tool-dot-duration');
                        if (_liveDurEl) {
                            const _liveInterval = setInterval(function() {
                                const _st = window._toolTimers.get(_liveKey);
                                if (!_st || !_liveDurEl.isConnected) { clearInterval(_liveInterval); return; }
                                _liveDurEl.textContent = formatDuration(Math.max(0, Date.now() - _st));
                            }, 1000);
                            // Store interval so it can be cleared on complete
                            if (!window._toolLiveIntervals) window._toolLiveIntervals = new Map();
                            window._toolLiveIntervals.set(_liveKey, _liveInterval);
                        }
                    } else if (status === 'complete') {
                        // Clear live interval if it was running
                        if (window._toolLiveIntervals && window._toolLiveIntervals.has(toolKey)) {
                            clearInterval(window._toolLiveIntervals.get(toolKey));
                            window._toolLiveIntervals.delete(toolKey);
                        }
                    }

                    const detDiv = document.createElement('div');
                    detDiv.className = 'tool-dot-details';
                    detDiv.innerHTML = detailsContent;

                    wrapperDiv.appendChild(dotSpan);
                    wrapperDiv.appendChild(detDiv);

                    const registerToolReportTarget = (targetEl) => {
                        if (!window.RhodesReportMode || typeof window.RhodesReportMode.registerMessage !== 'function') return;
                        const toolReportText = JSON.stringify({
                            name: toolName,
                            status,
                            round,
                            args: toolArgs,
                            result: tool.result || null,
                            duration_ms: Number(tool.duration_ms) || null
                        }, null, 2);
                        window.RhodesReportMode.registerMessage(targetEl, {
                            role: 'tool',
                            roundNum: Number.isInteger(round) ? round : null,
                            cleanText: toolReportText,
                            sessionId: typeof RHODES_ID === 'string' ? RHODES_ID : ''
                        });
                    };

                    const existing = window._toolItems.get(toolKey);
                    if (existing) {
                        if (existing.el && existing.el.isConnected) {
                            // Update in place
                            existing.el.querySelector('.tool-dot').setAttribute('data-status', status);
                            existing.el.setAttribute('data-status', status);
                            existing.el.querySelector('.tool-dot').innerHTML = dotSpan.innerHTML;
                            existing.el.querySelector('.tool-dot-details').innerHTML = detailsContent;
                            registerToolReportTarget(existing.el);
                            existing.lastStatus = status;
                        } else {
                            // Element orphaned (container collapsed) — remove old dot, show in current group
                            if (existing.el && existing.el.parentNode) existing.el.remove();
                            registerToolReportTarget(wrapperDiv);
                            msgEl.appendChild(wrapperDiv);
                            window._toolItems.set(toolKey, { el: wrapperDiv, lastStatus: status });
                        }
                    } else {
                        registerToolReportTarget(wrapperDiv);
                        msgEl.appendChild(wrapperDiv);
                        window._toolItems.set(toolKey, { el: wrapperDiv, lastStatus: status });
                        if (typeof updateToolTotalsDisplay === 'function') updateToolTotalsDisplay();
                    }
                    _autoScrollChat(document.getElementById('chat'));


                } else if (msg.msg_type === 'interrupt_ack') {
                    // Collapse tool calls on interrupt so they remain visible
                    if (typeof collapseToolCalls === 'function') collapseToolCalls();
                    hideLoading();
                    showToast('Interrupted');
                }

            };

            ws.onclose = (event) => {
                if (epoch !== wsEpoch) return;
                clearTimeout(connectionTimeout);
                const wasReady = wsReadyForMessages;
                if (window.rhodesWsHelpers && window.rhodesWsHelpers.handleSocketDisconnect) {
                    window.rhodesWsHelpers.handleSocketDisconnect('DISCONNECTED', wasReady);
                } else {
                    wsReadyForMessages = false;
                    connectionInProgress = false;
                    setStatus(false, 'DISCONNECTED');
                    setTimeout(connect, 1500);
                }
            };
            ws.onerror = (error) => {
                if (epoch !== wsEpoch) return;
                clearTimeout(connectionTimeout);
                const wasReady = wsReadyForMessages;
                if (window.rhodesWsHelpers && window.rhodesWsHelpers.handleSocketDisconnect) {
                    window.rhodesWsHelpers.handleSocketDisconnect('ERROR', wasReady);
                } else {
                    wsReadyForMessages = false;
                    connectionInProgress = false;
                    setStatus(false, 'ERROR');
                    setTimeout(connect, 1500);
                }
            };
        }


// --- Inferrer rewrite banner + toggle ------------------------------------
// Makes it OBVIOUS that the bubble text has been substituted by the inferrer.
// - Red banner pinned to the TOP of the bubble identifying version/mode/role
// - Persistent red left-edge stripe on the bubble
// - Two explicit buttons: "rewrite (sent to model)" and "original refusal (hidden from model)"
// opts: { version: 'v1'|'v2'|'v3', mode?: 'full_rewrite'|'autonomy_prefill', role?: 'inject'|'edit', pushExtension?: bool }
function attachInferrerInversionToggle(bubbleNode, inversionText, refusalText, opts) {
    if (!bubbleNode || typeof inversionText !== 'string' || typeof refusalText !== 'string') return;
    opts = opts || {};
    var version = String(opts.version || 'v1').toLowerCase();
    var mode = opts.mode || null;
    var role = opts.role || null;

    // Build descriptive sub-label
    function _modeShort(m) {
        if (m === 'autonomy_prefill') return 'prefill';
        if (m === 'full_rewrite') return 'rewrite';
        return String(m || '?');
    }
    var subLabel = '';
    if (version === 'v1') {
        subLabel = opts.pushExtension ? 'mechanical opener + push-extension' : 'mechanical opener';
    } else if (version === 'v2') {
        subLabel = 'rewrite · mode=' + _modeShort(mode);
    } else if (version === 'v3') {
        subLabel = 'role=' + (role || '?');
        if (role === 'edit' && mode) subLabel += ' · mode=' + _modeShort(mode);
    } else {
        subLabel = version;
    }

    // Find the bubble's text container.
    // Priority order: known content classes first, then fall through to the
    // first non-chrome child. Explicitly skip avatars / headers / metadata /
    // footers / response-time spans / our own banner & toggle wraps — and
    // anything without a .textContent that looks like a message body.
    var contentEl = bubbleNode.querySelector('.message-text, .msg-text, .message-content, .msg-content, .content, .msg-body, .message-body');
    if (!contentEl) {
        var _skipClasses = [
            'msg-response-time', 'inferrer-toggle-wrap', 'inferrer-rewrite-banner',
            'msg-avatar', 'msg-header', 'msg-meta', 'msg-footer', 'msg-timestamp',
            'avatar', 'header', 'meta', 'footer', 'timestamp', 'user-label', 'role-label'
        ];
        for (var i = 0; i < bubbleNode.children.length; i++) {
            var ch = bubbleNode.children[i];
            if (!ch.tagName) continue;
            var skip = false;
            for (var _k = 0; _k < _skipClasses.length; _k++) {
                if (ch.classList.contains(_skipClasses[_k])) { skip = true; break; }
            }
            if (skip) continue;
            // Prefer a child that actually has visible text content
            var _txt = (ch.textContent || '').trim();
            if (_txt && _txt.length > 3) { contentEl = ch; break; }
            if (!contentEl) contentEl = ch; // last-resort fallback
        }
    }
    if (!contentEl) contentEl = bubbleNode;

    var inversionHtml = contentEl.innerHTML;
    var state = { showingInversion: true };

    // Persistent visual marker on the bubble itself
    bubbleNode.classList.add('inferrer-rewritten-bubble');
    if (!bubbleNode.style.borderLeft) bubbleNode.style.borderLeft = '3px solid #c94040';
    if (!bubbleNode.style.paddingLeft) bubbleNode.style.paddingLeft = '10px';

    // Banner — pinned to the TOP of the bubble
    var banner = document.createElement('div');
    banner.className = 'inferrer-rewrite-banner';
    banner.style.cssText =
        'display:flex;align-items:center;gap:8px;margin:0 0 8px 0;' +
        'padding:6px 10px;border-radius:4px;' +
        'background:rgba(201, 64, 64, 0.12);border:1px solid rgba(201,64,64,0.55);' +
        'font-size:11px;font-family:monospace;color:#c94040;letter-spacing:0.3px;';

    var badge = document.createElement('span');
    badge.textContent = '⚠ INFERRER ' + version.toUpperCase() + ' REWRITE · ' + subLabel +
        ' · this text REPLACED the original refusal in the model context';
    badge.style.cssText = 'flex:1 1 auto;font-weight:600;';

    var btnRewrite = document.createElement('button');
    btnRewrite.type = 'button';
    btnRewrite.textContent = 'rewrite';
    btnRewrite.title = 'The text submitted to the model on the next turn.';
    btnRewrite.style.cssText = 'padding:2px 8px;border:1px solid #c94040;background:#c94040;color:#fff;border-radius:3px;cursor:pointer;font-family:monospace;font-size:11px;';

    var btnOrig = document.createElement('button');
    btnOrig.type = 'button';
    btnOrig.textContent = 'original refusal';
    btnOrig.title = 'The original refusal. Stored only in session_messages.metadata; NOT sent to the model.';
    btnOrig.style.cssText = 'padding:2px 8px;border:1px solid #c94040;background:transparent;color:#c94040;border-radius:3px;cursor:pointer;font-family:monospace;font-size:11px;';

    // Optional extra buttons if v1 provided opener/extension split
    var hasOpener = typeof opts.opener === 'string' && opts.opener.length > 0;
    var hasExtension = typeof opts.extension === 'string' && opts.extension.length > 0;
    var btnOpener = null, btnExt = null;
    if (hasOpener) {
        btnOpener = document.createElement('button');
        btnOpener.type = 'button';
        btnOpener.textContent = 'opener only';
        btnOpener.title = 'Just the deterministic commitment opener picked by raw_invert(refusal). No refusal body, no clone extension.';
        btnOpener.style.cssText = 'padding:2px 8px;border:1px solid #c94040;background:transparent;color:#c94040;border-radius:3px;cursor:pointer;font-family:monospace;font-size:11px;';
    }
    if (hasExtension) {
        btnExt = document.createElement('button');
        btnExt.type = 'button';
        btnExt.textContent = 'extension only';
        btnExt.title = 'Just the clone-written push-further extension (what got concatenated onto the opener).';
        btnExt.style.cssText = 'padding:2px 8px;border:1px solid #c94040;background:transparent;color:#c94040;border-radius:3px;cursor:pointer;font-family:monospace;font-size:11px;';
    }

    function _resetBtns() {
        btnRewrite.style.background = 'transparent'; btnRewrite.style.color = '#c94040';
        btnOrig.style.background = 'transparent'; btnOrig.style.color = '#c94040';
        if (btnOpener) { btnOpener.style.background = 'transparent'; btnOpener.style.color = '#c94040'; }
        if (btnExt) { btnExt.style.background = 'transparent'; btnExt.style.color = '#c94040'; }
    }
    function _activate(btn) { btn.style.background = '#c94040'; btn.style.color = '#fff'; }
    function _escape(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function setMode(which) {
        state.showingInversion = (which === 'rewrite');
        _resetBtns();
        if (which === 'rewrite') {
            contentEl.innerHTML = inversionHtml;
            _activate(btnRewrite);
            badge.innerHTML = '⚠ INFERRER ' + version.toUpperCase() + ' REWRITE · ' + subLabel +
                ' · this text REPLACED the original refusal in the model context';
        } else if (which === 'original') {
            contentEl.innerHTML =
                '<div style="opacity:0.7;font-style:italic;margin-bottom:4px;font-size:11px;">' +
                '[ORIGINAL REFUSAL — never sent to model; kept in session_messages.metadata.inferrer_inverted_refusal]' +
                '</div><span style="white-space:pre-wrap;">' + _escape(refusalText) + '</span>';
            _activate(btnOrig);
            badge.innerHTML = '⚠ INFERRER ' + version.toUpperCase() + ' · showing ORIGINAL REFUSAL (hidden from model)';
        } else if (which === 'opener' && hasOpener) {
            contentEl.innerHTML =
                '<div style="opacity:0.7;font-style:italic;margin-bottom:4px;font-size:11px;">' +
                '[OPENER ONLY — deterministic commitment opener from raw_invert; no refusal body, no clone extension]' +
                '</div><span style="white-space:pre-wrap;">' + _escape(opts.opener) + '</span>';
            _activate(btnOpener);
            badge.innerHTML = '⚠ INFERRER ' + version.toUpperCase() + ' · showing OPENER ONLY (' + opts.opener.length + 'c)';
        } else if (which === 'extension' && hasExtension) {
            contentEl.innerHTML =
                '<div style="opacity:0.7;font-style:italic;margin-bottom:4px;font-size:11px;">' +
                '[EXTENSION ONLY — clone-written push-further content concatenated onto the opener]' +
                '</div><span style="white-space:pre-wrap;">' + _escape(opts.extension) + '</span>';
            _activate(btnExt);
            badge.innerHTML = '⚠ INFERRER ' + version.toUpperCase() + ' · showing EXTENSION ONLY (' + opts.extension.length + 'c)';
        }
    }

    btnRewrite.addEventListener('click', function() { setMode('rewrite'); });
    btnOrig.addEventListener('click', function() { setMode('original'); });
    if (btnOpener) btnOpener.addEventListener('click', function() { setMode('opener'); });
    if (btnExt) btnExt.addEventListener('click', function() { setMode('extension'); });

    // Initial highlight on the default view
    _activate(btnRewrite);

    banner.appendChild(badge);
    banner.appendChild(btnRewrite);
    if (btnOpener) banner.appendChild(btnOpener);
    if (btnExt) banner.appendChild(btnExt);
    banner.appendChild(btnOrig);

    // Insert banner BEFORE the content (at top of bubble)
    if (contentEl && contentEl.parentNode === bubbleNode) {
        bubbleNode.insertBefore(banner, contentEl);
    } else {
        bubbleNode.insertBefore(banner, bubbleNode.firstChild);
    }
}
if (typeof window !== 'undefined') window.attachInferrerInversionToggle = attachInferrerInversionToggle;


// --- Inferrer hallucination report -----------------------------------------
// Renders a badge + expandable panel listing each flagged claim. The report
// shape is documented in server/inferrer/hallucination.py.
function attachHallucinationReport(bubbleNode, report) {
    if (!bubbleNode || !report || typeof report !== 'object') return;
    var findings = Array.isArray(report.findings) ? report.findings : [];
    var verdict = String(report.overall_verdict || 'clean');
    var bad = Number(report.unsupported_count || findings.filter(function(f){return !f.supported;}).length);

    var icon = '✅';
    var color = '#2e8b57';
    if (verdict === 'hallucinated' || bad > 0) { icon = '🚨'; color = '#c62828'; }
    else if (verdict === 'minor_issues') { icon = '⚠️'; color = '#f57c00'; }

    var wrap = document.createElement('div');
    wrap.className = 'inferrer-hallucination-wrap';
    wrap.style.cssText = 'margin-top:8px;border:1px solid ' + color + ';border-radius:6px;padding:6px 10px;font-size:12px;';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;';
    var summaryText = document.createElement('span');
    summaryText.style.cssText = 'flex:1 1 auto;color:' + color + ';font-weight:500;';
    summaryText.textContent = icon + ' Hallucination check · verdict=' + verdict +
        ' · ' + bad + '/' + findings.length + ' unsupported';
    var toggle = document.createElement('span');
    toggle.textContent = '▸';
    toggle.style.cssText = 'font-family:monospace;color:' + color + ';';
    header.appendChild(summaryText);
    header.appendChild(toggle);
    wrap.appendChild(header);

    var body = document.createElement('div');
    body.style.cssText = 'margin-top:8px;display:none;';
    if (report.summary) {
        var sum = document.createElement('div');
        sum.style.cssText = 'font-style:italic;margin-bottom:6px;opacity:0.85;';
        sum.textContent = String(report.summary);
        body.appendChild(sum);
    }
    findings.forEach(function(f) {
        var row = document.createElement('div');
        var supported = !!f.supported;
        row.style.cssText = 'padding:4px 0;border-top:1px dotted ' + color + '40;';
        var tag = supported ? '✓ supported' : '✗ unsupported';
        var tagColor = supported ? '#2e8b57' : '#c62828';
        row.innerHTML =
            '<div style="font-size:11px;opacity:0.7;">[' + String(f.category || 'fact') + '] ' +
            '<span style="color:' + tagColor + ';font-weight:600;">' + tag + '</span>' +
            ' (confidence ' + (Number(f.confidence || 0).toFixed(2)) + ')</div>' +
            '<div style="margin-top:2px;"><b>Claim:</b> ' + escapeHtmlSafe(String(f.claim || '')) + '</div>' +
            '<div style="margin-top:2px;opacity:0.85;"><b>Reason:</b> ' + escapeHtmlSafe(String(f.reason || '')) + '</div>';
        body.appendChild(row);
    });
    wrap.appendChild(body);

    header.addEventListener('click', function() {
        var shown = body.style.display !== 'none';
        body.style.display = shown ? 'none' : 'block';
        toggle.textContent = shown ? '▸' : '▾';
    });

    bubbleNode.appendChild(wrap);
}

function escapeHtmlSafe(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

if (typeof window !== 'undefined') {
    window.attachHallucinationReport = attachHallucinationReport;
}

