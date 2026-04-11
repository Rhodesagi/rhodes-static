/**
 * RhodesCards Memory Palace — Loci binding + review (Three.js version)
 * Handles activate-locus → show AI image → reveal card → grade → next.
 */
(function() {
    "use strict";

    const PL = {
        _state: null,

        // Called from walker raycast when user presses E near a locus mesh
        activateLocus(locusData) {
            if (!locusData) return;
            const settings = locusData.marker_settings || {};
            const images = settings.images && settings.images.length
                ? settings.images
                : (settings.image ? [{
                    card_id: (locusData.card_ids || [])[0],
                    image: settings.image,
                    label: locusData.label,
                    marker_type: locusData.marker_type
                }] : []);
            const cardIds = (locusData.card_ids || []).map(x => parseInt(x, 10)).filter(x => !isNaN(x));
            if (!cardIds.length) {
                this._showBinder(locusData);
                return;
            }
            // Unlock pointer so the overlay is usable
            if (RC.PalaceWalker && RC.PalaceWalker.unlock) RC.PalaceWalker.unlock();
            this._state = {
                locus: locusData,
                images: images,
                cardIds: cardIds,
                idx: 0,
                revealed: false
            };
            this._renderReview();
        },

        _renderReview() {
            const s = this._state;
            if (!s) return;
            const overlay = document.getElementById("palace-review-overlay");
            const cid = s.cardIds[s.idx];
            const img = s.images.find(im => im.card_id === cid) || s.images[s.idx] || {};
            const markerName = (img.marker_type || s.locus.marker_type || "orb").toUpperCase();
            const imageText = img.image || "(no mnemonic image — click Fill to generate)";
            const counter = "Card " + (s.idx + 1) + " of " + s.cardIds.length;

            let inner = "<div class=\"locus-panel\">" +
                "<div class=\"locus-header\"><span class=\"locus-marker\">" + markerName + "</span>" +
                "<span class=\"locus-counter\">" + counter + "</span>" +
                "<button class=\"locus-close\" onclick=\"RC.PalaceLoci.close()\">&times;</button></div>" +
                "<div class=\"locus-label\">" + RC.esc(img.label || s.locus.label || "") + "</div>" +
                "<div class=\"locus-image\">" + RC.esc(imageText) + "</div>";

            if (!s.revealed) {
                inner += "<div class=\"locus-cardfront\" id=\"locus-cardfront\">Loading card...</div>" +
                    "<div class=\"locus-actions\"><button class=\"btn btn-primary\" onclick=\"RC.PalaceLoci._reveal()\">Reveal</button></div>";
            } else {
                inner += "<div class=\"locus-cardfront\" id=\"locus-cardfront\">" + (s._front || "") + "</div>" +
                    "<div class=\"locus-cardback\" id=\"locus-cardback\">" + (s._back || "") + "</div>" +
                    "<div class=\"locus-grades\">" +
                    "<button class=\"btn-again\" onclick=\"RC.PalaceLoci._grade(1)\">Again</button>" +
                    "<button class=\"btn-hard\" onclick=\"RC.PalaceLoci._grade(2)\">Hard</button>" +
                    "<button class=\"btn-good\" onclick=\"RC.PalaceLoci._grade(3)\">Good</button>" +
                    "<button class=\"btn-easy\" onclick=\"RC.PalaceLoci._grade(4)\">Easy</button>" +
                    "</div>";
            }
            inner += "</div>";
            overlay.innerHTML = inner;
            overlay.style.display = "flex";
            // Fetch card front
            if (!s.revealed) this._loadCard(cid);
        },

        async _loadCard(cid) {
            try {
                const res = await RC.api("GET", "/cards/" + cid + "/info");
                const fields = (res && res.note && res.note.fields) || {};
                const s = this._state;
                if (!s) return;
                s._front = RC.esc(fields.front || fields.text || fields.q || "(no front)");
                s._back = RC.esc(fields.back || fields.extra || fields.a || "");
                const el = document.getElementById("locus-cardfront");
                if (el) el.innerHTML = s._front;
            } catch (e) { /* ignore */ }
        },

        _reveal() {
            if (!this._state) return;
            this._state.revealed = true;
            this._renderReview();
        },

        async _grade(rating) {
            const s = this._state;
            if (!s) return;
            const cid = s.cardIds[s.idx];
            try {
                await RC.api("POST", "/review", { card_id: cid, rating: rating });
            } catch (e) { RC.toast("Review failed"); }
            s.idx++;
            s.revealed = false;
            if (s.idx >= s.cardIds.length) {
                this.close();
                RC.toast("Locus complete");
            } else {
                this._renderReview();
            }
        },

        close() {
            this._state = null;
            const overlay = document.getElementById("palace-review-overlay");
            if (overlay) { overlay.style.display = "none"; overlay.innerHTML = ""; }
        },

        // ── Manual card-to-locus binder (used when locus has no cards yet) ──
        _showBinder(locusData) {
            if (RC.PalaceWalker && RC.PalaceWalker.unlock) RC.PalaceWalker.unlock();
            const overlay = document.getElementById("palace-review-overlay");
            overlay.innerHTML = "<div class=\"locus-panel\">" +
                "<div class=\"locus-header\">" +
                "<span class=\"locus-marker\">" + (locusData.marker_type || "orb").toUpperCase() + "</span>" +
                "<span class=\"locus-counter\">Empty</span>" +
                "<button class=\"locus-close\" onclick=\"RC.PalaceLoci.close()\">&times;</button></div>" +
                "<div class=\"locus-label\">" + RC.esc(locusData.label || "Empty locus") + "</div>" +
                "<div class=\"locus-image\">This locus has no cards. Use the <b>AI Fill</b> button in the toolbar to generate imagery for a whole deck at once.</div>" +
                "</div>";
            overlay.style.display = "flex";
        }
    };

    RC.PalaceLoci = PL;
})();
