/**
 * RhodesCards Memory Palace — Orchestrator (Three.js 3D)
 * Handles palace list view, create flow, enter/exit, save, and AI fill.
 */
(function() {
    "use strict";

    const Palace = {
        currentPalace: null,
        mode: "walk", // "walk" | "build"
        _decks: [],

        // ── Palace list view ──
        async loadPalaceList() {
            const res = await RC.api("GET", "/palaces");
            return (res && res.palaces) ? res.palaces : [];
        },

        async showPalaceList() {
            const list = document.getElementById("palace-list");
            if (!list) return;
            list.innerHTML = "<div class=\"empty-state\"><p>Loading...</p></div>";
            let palaces = [];
            try { palaces = await this.loadPalaceList(); }
            catch (e) { list.innerHTML = "<div class=\"empty-state\"><p>Failed to load.</p></div>"; return; }

            if (!palaces.length) {
                this._showCreateView(list);
                return;
            }
            let html = "<div class=\"palace-grid\">";
            palaces.forEach(p => {
                html += "<div class=\"palace-card\" onclick=\"RC.Palace.enter(" + p.id + ")\">" +
                    "<div class=\"palace-name\">" + RC.esc(p.name) + "</div>" +
                    "<div class=\"palace-meta\">" + (p.loci_count || 0) + " loci</div>" +
                    "<button class=\"btn-icon\" onclick=\"event.stopPropagation();RC.Palace.askDelete(" + p.id + ",\x27" + RC.esc(p.name) + "\x27)\">&times;</button>" +
                    "</div>";
            });
            html += "</div>";
            html += "<div style=\"margin-top:20px\"><button class=\"btn btn-primary\" onclick=\"RC.Palace._showCreateView()\">+ New Palace</button></div>";
            list.innerHTML = html;
        },

        _showCreateView(container) {
            container = container || document.getElementById("palace-list");
            let html = "<h3>Choose a Template</h3><div class=\"palace-templates\">";
            RC.PalaceTemplates.catalog.forEach(t => {
                html += "<div class=\"palace-template-card\" onclick=\"RC.Palace._createFromTemplate(\x27" + t.id + "\x27)\" style=\"border-left:4px solid " + t.preview + "\">" +
                    "<div class=\"template-name\">" + RC.esc(t.name) + "</div>" +
                    "<div class=\"template-desc\">" + RC.esc(t.desc) + "</div>" +
                    "<div class=\"template-loci\">" + t.loci + " loci</div></div>";
            });
            html += "</div>";
            html += "<h3 style=\"margin-top:24px\">Or Generate a Custom Palace</h3><div class=\"palace-custom-form\">" +
                "<label>Name</label><input type=\"text\" id=\"customPalaceName\" class=\"modal-input\" placeholder=\"e.g. Anatomy Hall\">" +
                "<label>How many loci?</label><input type=\"number\" id=\"customLociCount\" class=\"modal-input\" value=\"20\" min=\"4\" max=\"200\">" +
                "<div class=\"loci-hint\">Each locus holds one or more flashcards.</div>" +
                "<button class=\"btn btn-primary\" onclick=\"RC.Palace._createCustom()\">Generate</button></div>";
            html += "<div style=\"margin-top:16px\"><button class=\"btn\" onclick=\"RC.Palace.showPalaceList()\">&larr; Back to list</button></div>";
            container.innerHTML = html;
        },

        async _createFromTemplate(templateId) {
            RC.toast("Creating palace...");
            const data = RC.PalaceTemplates.generate(templateId);
            const tName = (RC.PalaceTemplates.catalog.find(t => t.id === templateId) || {}).name || "Palace";
            const res = await RC.api("POST", "/palaces", { name: tName, spawn_point: data.spawn_point });
            if (!res || !res.id) { RC.toast("Create failed"); return; }
            await RC.api("PUT", "/palaces/" + res.id + "/bulk", {
                spawn_point: data.spawn_point,
                surfaces: data.surfaces,
                connectors: data.connectors,
                loci: data.loci
            });
            this.enter(res.id);
        },

        async _createCustom() {
            const name = (document.getElementById("customPalaceName").value || "Custom Palace").trim();
            const count = parseInt(document.getElementById("customLociCount").value || "20", 10);
            RC.toast("Generating palace...");
            const data = RC.PalaceGenerator.generate(count);
            const res = await RC.api("POST", "/palaces", { name: name, spawn_point: data.spawn_point });
            if (!res || !res.id) { RC.toast("Create failed"); return; }
            await RC.api("PUT", "/palaces/" + res.id + "/bulk", {
                spawn_point: data.spawn_point,
                surfaces: data.surfaces,
                connectors: data.connectors,
                loci: data.loci
            });
            this.enter(res.id);
        },

        askDelete(id, name) {
            document.getElementById("palaceDeleteModal").style.display = "flex";
            document.getElementById("palaceDeleteName").textContent = name;
            this._pendingDelete = id;
        },
        _cancelDelete() {
            document.getElementById("palaceDeleteModal").style.display = "none";
            this._pendingDelete = null;
        },
        async _confirmDelete() {
            if (!this._pendingDelete) return;
            await RC.api("DELETE", "/palaces/" + this._pendingDelete);
            this._cancelDelete();
            this.showPalaceList();
            RC.toast("Palace deleted");
        },

        // ── Enter / exit a palace ──
        async enter(palaceId) {
            RC.showView("palace");
            const res = await RC.api("GET", "/palaces/" + palaceId);
            if (!res || !res.palace) { RC.toast("Failed to load palace"); return; }
            this.currentPalace = res.palace;
            document.getElementById("palace-name").textContent = res.palace.name;

            // Init Three.js renderer
            if (!RC.PalaceRenderer.scene) {
                RC.PalaceRenderer.init("palace-canvas");
            }
            // Build the scene
            RC.PalaceRenderer.buildScene(res.surfaces || [], res.connectors || [], res.loci || []);

            // Init walker if not already
            if (!RC.PalaceWalker.controls) {
                RC.PalaceWalker.init(RC.PalaceRenderer.camera, RC.PalaceRenderer.renderer.domElement);
            }
            // Place camera at spawn
            const spawn = (res.palace.spawn_point && res.palace.spawn_point.position) || [0, 1.6, 3];
            RC.PalaceWalker.controls.getObject().position.set(spawn[0], spawn[1], spawn[2]);

            // Start animation loop
            RC.PalaceRenderer.animate();
            this.setMode("walk");
        },

        exit() {
            if (RC.PalaceWalker && RC.PalaceWalker.controls) RC.PalaceWalker.unlock();
            if (RC.PalaceRenderer && RC.PalaceRenderer.dispose) RC.PalaceRenderer.dispose();
            if (RC.PalaceWalker && RC.PalaceWalker.dispose) RC.PalaceWalker.dispose();
            if (RC.PalaceBuilder && RC.PalaceBuilder.disable) RC.PalaceBuilder.disable();
            this.currentPalace = null;
            RC.showView("palaces");
        },

        setMode(mode) {
            this.mode = mode;
            document.querySelectorAll(".mode-btn").forEach(b => {
                b.classList.toggle("active", b.dataset.mode === mode);
            });
            if (mode === "build") {
                if (RC.PalaceWalker.controls && RC.PalaceWalker.controls.isLocked) RC.PalaceWalker.unlock();
                if (RC.PalaceBuilder && RC.PalaceBuilder.enable) RC.PalaceBuilder.enable();
            } else {
                if (RC.PalaceBuilder && RC.PalaceBuilder.disable) RC.PalaceBuilder.disable();
            }
        },

        async savePalace() {
            if (!this.currentPalace) return;
            const data = RC.PalaceRenderer.exportSceneData();
            await RC.api("PUT", "/palaces/" + this.currentPalace.id + "/bulk", {
                spawn_point: this.currentPalace.spawn_point,
                surfaces: data.surfaces,
                connectors: data.connectors,
                loci: data.loci
            });
            RC.toast("Palace saved");
        },

        // ── AI Fill (generate loci from a deck) ──
        async openGenerateModal() {
            if (!this.currentPalace) return;
            const modal = document.getElementById("palaceGenerateModal");
            const sel = document.getElementById("palaceGenDeck");
            sel.innerHTML = "<option>Loading...</option>";
            modal.style.display = "flex";
            try {
                const res = await RC.api("GET", "/decks");
                this._decks = (res && res.decks) ? res.decks : [];
            } catch (e) { this._decks = []; }
            if (!this._decks.length) {
                sel.innerHTML = "<option value=\"\">(No decks)</option>";
                return;
            }
            sel.innerHTML = this._decks.map(d =>
                "<option value=\"" + d.id + "\">" + RC.esc(d.name) + " (" + (d.card_count || d.total_cards || 0) + ")</option>"
            ).join("");
            document.getElementById("palaceGenStatus").textContent = "";
            document.getElementById("palaceGenBtn").disabled = false;
        },
        _cancelGenerate() {
            document.getElementById("palaceGenerateModal").style.display = "none";
        },
        async _confirmGenerate() {
            if (!this.currentPalace) return;
            const sel = document.getElementById("palaceGenDeck");
            const deckId = parseInt(sel.value, 10);
            const mode = document.querySelector("input[name=palaceGenMode]:checked").value;
            const limit = parseInt(document.getElementById("palaceGenLimit").value || "60", 10);
            if (!deckId) { RC.toast("Pick a deck"); return; }
            const btn = document.getElementById("palaceGenBtn");
            const status = document.getElementById("palaceGenStatus");
            btn.disabled = true;
            status.textContent = "Calling Rhodes... this may take 15-60s depending on card count.";
            try {
                const res = await RC.api("POST", "/palaces/" + this.currentPalace.id + "/generate-loci", {
                    deck_id: deckId, mode: mode, limit: limit
                });
                if (!res || res.error) {
                    status.textContent = "Error: " + (res && res.error ? res.error : "unknown");
                    btn.disabled = false;
                    return;
                }
                status.textContent = "Generated " + res.generated + " images. " +
                    (res.mode === "rebind" ? (res.loci_updated + " loci updated.") : (res.loci_created + " loci created."));
                // Reload palace to pick up new loci
                const full = await RC.api("GET", "/palaces/" + this.currentPalace.id);
                if (full && full.palace) {
                    this.currentPalace = full.palace;
                    RC.PalaceRenderer.buildScene(full.surfaces || [], full.connectors || [], full.loci || []);
                }
                setTimeout(() => this._cancelGenerate(), 1500);
                RC.toast("AI fill complete: " + res.generated + " loci");
            } catch (e) {
                status.textContent = "Error: " + e.message;
                btn.disabled = false;
            }
        }
    };

    RC.Palace = Palace;
})();
