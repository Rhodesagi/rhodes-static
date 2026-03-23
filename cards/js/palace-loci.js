/**
 * RhodesCards Memory Palace — Loci & Card Binding (Raycaster version)
 * Binds flashcards to spatial loci. Triggers review on interaction.
 */
(function() {
    'use strict';

    var PL = {
        // Called from raycaster interact when locus has cards
        activateLocusRay: function(sprite, index) {
            var cardIds = sprite.data.card_ids || [];
            if (!cardIds.length) return;
            RC.Raycaster.stop();
            if (document.pointerLockElement) document.exitPointerLock();
            this._showReview(sprite, index, cardIds, 0);
        },

        _showReview: function(sprite, index, cardIds, cardIdx) {
            var overlay = document.getElementById('palace-review-overlay');
            overlay.style.display = 'flex';
            overlay.innerHTML = '<div class="palace-review-card loading">Loading card...</div>';

            var self = this;
            RC.api('GET', '/cards/' + cardIds[cardIdx] + '/info').then(function(res) {
                if (!res || res.error) {
                    overlay.innerHTML = '<div class="palace-review-card"><p>Card not found.</p>' +
                        '<button class="btn" onclick="RC.Palace.closeOverlay()">Close</button></div>';
                    return;
                }
                var card = res.card || res;
                var front = card.fields ? card.fields.Front : (card.front || '');
                var back = card.fields ? card.fields.Back : (card.back || '');
                var label = sprite.data.label ? '<div class="locus-label">' + RC.esc(sprite.data.label) + '</div>' : '';
                var progress = cardIds.length > 1 ? '<div class="review-progress">' + (cardIdx+1) + '/' + cardIds.length + '</div>' : '';

                overlay.innerHTML = '<div class="palace-review-card">' + label + progress +
                    '<div class="card-front">' + front + '</div>' +
                    '<div class="card-back" id="palace-card-back" style="display:none">' + back + '</div>' +
                    '<div class="review-actions">' +
                        '<button id="palace-reveal-btn" onclick="document.getElementById(\'palace-card-back\').style.display=\'block\';this.style.display=\'none\';document.getElementById(\'palace-grade-btns\').style.display=\'flex\'" class="btn-reveal">Show Answer</button>' +
                        '<div id="palace-grade-btns" style="display:none;gap:8px;justify-content:center">' +
                            '<button onclick="RC.PalaceLoci._grade(' + card.id + ',1,' + index + ',' + cardIdx + ')" class="btn-again">Again</button>' +
                            '<button onclick="RC.PalaceLoci._grade(' + card.id + ',2,' + index + ',' + cardIdx + ')" class="btn-hard">Hard</button>' +
                            '<button onclick="RC.PalaceLoci._grade(' + card.id + ',3,' + index + ',' + cardIdx + ')" class="btn-good">Good</button>' +
                            '<button onclick="RC.PalaceLoci._grade(' + card.id + ',4,' + index + ',' + cardIdx + ')" class="btn-easy">Easy</button>' +
                        '</div>' +
                        '<button onclick="RC.Palace.closeOverlay()" class="btn-close" style="margin-top:8px">Close</button>' +
                    '</div></div>';
            }).catch(function() {
                overlay.innerHTML = '<div class="palace-review-card"><p>Error loading card.</p>' +
                    '<button class="btn" onclick="RC.Palace.closeOverlay()">Close</button></div>';
            });
        },

        _grade: function(cardId, rating, spriteIndex, cardIdx) {
            RC.api('POST', '/review', { card_id: cardId, rating: rating }).then(function() {
                RC.toast('Reviewed!');
                // Move to next card at this locus or close
                var sprite = RC.Raycaster.sprites[spriteIndex];
                var cardIds = sprite.data.card_ids || [];
                if (cardIdx + 1 < cardIds.length) {
                    RC.PalaceLoci._showReview(sprite, spriteIndex, cardIds, cardIdx + 1);
                } else {
                    RC.Palace.closeOverlay();
                }
            }).catch(function() { RC.toast('Review failed'); });
        },

        // Card binder for raycaster sprites
        openCardBinderRay: function(spriteIndex) {
            var sprite = RC.Raycaster.sprites[spriteIndex];
            var overlay = document.getElementById('palace-review-overlay');
            overlay.style.display = 'flex';
            this._currentBindIndex = spriteIndex;

            overlay.innerHTML = '<div class="palace-review-card card-binder">' +
                '<h3>Bind Cards to ' + RC.esc(sprite.data.label || 'Locus') + '</h3>' +
                '<input type="text" id="card-search-input" class="modal-input" placeholder="Search cards..." oninput="RC.PalaceLoci._searchCards(this.value)">' +
                '<div id="card-search-results" style="max-height:200px;overflow-y:auto;margin:8px 0"></div>' +
                '<div id="bound-cards-list"></div>' +
                '<button class="btn" onclick="RC.Palace.closeOverlay()" style="margin-top:8px">Done</button>' +
            '</div>';

            if (sprite.data.card_ids && sprite.data.card_ids.length) {
                this._showBound(sprite.data.card_ids);
            }
        },

        _searchCards: function(query) {
            if (query.length < 2) { document.getElementById('card-search-results').innerHTML = ''; return; }
            RC.api('GET', '/decks/0/browse?q=' + encodeURIComponent(query)).then(function(res) {
                var cards = (res && res.cards) ? res.cards : [];
                var html = cards.slice(0, 15).map(function(c) {
                    var preview = ((c.fields && c.fields.Front) || c.front || '').substring(0, 60);
                    return '<div class="search-result" onclick="RC.PalaceLoci._bind(' + c.id + ')" style="padding:6px;cursor:pointer;border-bottom:1px solid #333">' +
                        '<span>' + RC.esc(preview) + '</span> <span style="color:var(--accent)">+ Bind</span></div>';
                }).join('');
                document.getElementById('card-search-results').innerHTML = html || '<p style="color:#888">No results</p>';
            }).catch(function() {
                document.getElementById('card-search-results').innerHTML = '<p style="color:#f44">Search error</p>';
            });
        },

        _bind: function(cardId) {
            var sprite = RC.Raycaster.sprites[this._currentBindIndex];
            if (!sprite) return;
            if (!sprite.data.card_ids) sprite.data.card_ids = [];
            if (sprite.data.card_ids.indexOf(cardId) >= 0) { RC.toast('Already bound'); return; }
            sprite.data.card_ids.push(cardId);
            RC.toast('Card bound');
            this._showBound(sprite.data.card_ids);
            // Auto-save
            RC.Palace.savePalace();
        },

        _showBound: function(cardIds) {
            var el = document.getElementById('bound-cards-list');
            if (!el) return;
            el.innerHTML = '<h4 style="margin:8px 0 4px">Bound (' + cardIds.length + ')</h4>' +
                cardIds.map(function(id) {
                    return '<div style="padding:3px 0">Card #' + id +
                        ' <button onclick="RC.PalaceLoci._unbind(' + id + ')" style="color:#f44;border:none;background:none;cursor:pointer">&times;</button></div>';
                }).join('');
        },

        _unbind: function(cardId) {
            var sprite = RC.Raycaster.sprites[this._currentBindIndex];
            if (!sprite) return;
            sprite.data.card_ids = (sprite.data.card_ids || []).filter(function(id) { return id !== cardId; });
            this._showBound(sprite.data.card_ids);
            RC.Palace.savePalace();
        }
    };

    RC.PalaceLoci = PL;
})();
