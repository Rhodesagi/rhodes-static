/**
 * RhodesCards Memory Palace — Loci & Card Binding
 * Binds flashcards to spatial positions. Triggers review when activated.
 */
(function() {
    'use strict';

    const PL = {
        lociData: [],

        init(loci) {
            this.lociData = loci || [];
        },

        // ── Activate a locus (E key or click in build mode) ──

        activateLocus(locusData) {
            if (!locusData) return;
            const cardIds = locusData.card_ids || [];

            if (cardIds.length === 0) {
                // No cards bound — offer to bind
                this._showEmptyLocusDialog(locusData);
                return;
            }

            // Check if any cards are due for review
            this._showLocusReview(locusData, cardIds);
        },

        async _showLocusReview(locusData, cardIds) {
            // Unlock pointer for UI interaction
            RC.PalaceWalker.controls.unlock();

            const overlay = document.getElementById('palace-review-overlay');
            overlay.style.display = 'flex';
            overlay.innerHTML = '<div class="palace-review-card loading">Loading card...</div>';

            // Fetch card data
            try {
                // Use the browse endpoint to get card content
                for (const cardId of cardIds) {
                    const res = await RC.api('GET', '/cards/' + cardId + '/info');
                    if (!res || res.error) continue;

                    const card = res.card || res;
                    overlay.innerHTML = this._renderReviewCard(locusData, card);
                    return;
                }
                overlay.innerHTML = '<div class="palace-review-card"><p>No reviewable cards at this locus.</p>' +
                    '<button onclick="RC.PalaceLoci.closeReview()">Close</button></div>';
            } catch (err) {
                overlay.innerHTML = '<div class="palace-review-card"><p>Error loading card.</p>' +
                    '<button onclick="RC.PalaceLoci.closeReview()">Close</button></div>';
            }
        },

        _renderReviewCard(locusData, card) {
            const label = locusData.label ? '<div class="locus-label">' + RC.esc(locusData.label) + '</div>' : '';
            const front = card.fields?.Front || card.front || '';
            const back = card.fields?.Back || card.back || '';

            return '<div class="palace-review-card">' +
                label +
                '<div class="card-front">' + front + '</div>' +
                '<div class="card-back" id="palace-card-back" style="display:none">' + back + '</div>' +
                '<div class="review-actions">' +
                    '<button onclick="document.getElementById(\'palace-card-back\').style.display=\'block\'; this.style.display=\'none\'" class="btn-reveal">Show Answer</button>' +
                    '<div class="grade-buttons" style="display:none" id="palace-grade-btns">' +
                        '<button onclick="RC.PalaceLoci.grade(' + card.id + ', 1)" class="btn-again">Again</button>' +
                        '<button onclick="RC.PalaceLoci.grade(' + card.id + ', 2)" class="btn-hard">Hard</button>' +
                        '<button onclick="RC.PalaceLoci.grade(' + card.id + ', 3)" class="btn-good">Good</button>' +
                        '<button onclick="RC.PalaceLoci.grade(' + card.id + ', 4)" class="btn-easy">Easy</button>' +
                    '</div>' +
                    '<button onclick="RC.PalaceLoci.closeReview()" class="btn-close">Close</button>' +
                '</div>' +
            '</div>';
        },

        async grade(cardId, rating) {
            try {
                await RC.api('POST', '/review', { card_id: cardId, rating: rating });
                RC.toast('Reviewed!');
            } catch (err) {
                RC.toast('Review failed');
            }
            this.closeReview();
        },

        closeReview() {
            document.getElementById('palace-review-overlay').style.display = 'none';
        },

        // ── Card binding dialog ──

        _showEmptyLocusDialog(locusData) {
            RC.PalaceWalker.controls.unlock();
            const overlay = document.getElementById('palace-review-overlay');
            overlay.style.display = 'flex';
            overlay.innerHTML = '<div class="palace-review-card">' +
                '<h3>Empty Locus</h3>' +
                '<p>' + (locusData.label ? RC.esc(locusData.label) : 'No label') + '</p>' +
                '<p>No cards are bound to this location.</p>' +
                '<button onclick="RC.PalaceLoci.openCardBinder()" class="btn-primary">Bind Cards</button>' +
                '<button onclick="RC.PalaceLoci.closeReview()">Close</button>' +
            '</div>';
        },

        async openCardBinder(locusId) {
            RC.PalaceWalker.controls.unlock();
            const overlay = document.getElementById('palace-review-overlay');
            overlay.style.display = 'flex';
            overlay.innerHTML = '<div class="palace-review-card card-binder">' +
                '<h3>Bind Cards to Locus</h3>' +
                '<input type="text" id="card-search-input" placeholder="Search cards..." oninput="RC.PalaceLoci._searchCards(this.value)">' +
                '<div id="card-search-results"></div>' +
                '<div id="bound-cards-list"></div>' +
                '<button onclick="RC.PalaceLoci.closeReview()">Done</button>' +
            '</div>';

            // Load currently bound cards
            const locus = this.lociData.find(l => l.id === locusId);
            if (locus && locus.card_ids?.length) {
                this._showBoundCards(locus.card_ids);
            }
        },

        async _searchCards(query) {
            if (query.length < 2) {
                document.getElementById('card-search-results').innerHTML = '';
                return;
            }
            try {
                // Search across all decks
                const res = await RC.api('GET', '/decks/0/browse?q=' + encodeURIComponent(query));
                const cards = res.cards || [];
                const html = cards.slice(0, 20).map(c => {
                    const preview = (c.fields?.Front || c.front || '').substring(0, 80);
                    return '<div class="search-result" onclick="RC.PalaceLoci._bindCard(' + c.id + ')">' +
                        '<span class="card-preview">' + RC.esc(preview) + '</span>' +
                        '<span class="bind-btn">+ Bind</span></div>';
                }).join('');
                document.getElementById('card-search-results').innerHTML = html || '<p>No results</p>';
            } catch (err) {
                document.getElementById('card-search-results').innerHTML = '<p>Search error</p>';
            }
        },

        async _bindCard(cardId) {
            if (!RC.PalaceBuilder.selectedObject) return;
            const obj = RC.PalaceBuilder.selectedObject;
            if (obj.userData.dbType !== 'locus') return;
            const d = obj.userData.dbData;
            if (!d.card_ids) d.card_ids = [];
            if (d.card_ids.includes(cardId)) {
                RC.toast('Card already bound');
                return;
            }
            d.card_ids.push(cardId);
            RC.Palace.dirty = true;
            RC.toast('Card bound');
            this._showBoundCards(d.card_ids);
        },

        _showBoundCards(cardIds) {
            const el = document.getElementById('bound-cards-list');
            if (!el) return;
            el.innerHTML = '<h4>Bound cards (' + cardIds.length + ')</h4>' +
                cardIds.map(id => '<div class="bound-card">Card #' + id +
                    ' <button onclick="RC.PalaceLoci._unbindCard(' + id + ')">&times;</button></div>'
                ).join('');
        },

        _unbindCard(cardId) {
            if (!RC.PalaceBuilder.selectedObject) return;
            const d = RC.PalaceBuilder.selectedObject.userData.dbData;
            d.card_ids = (d.card_ids || []).filter(id => id !== cardId);
            RC.Palace.dirty = true;
            this._showBoundCards(d.card_ids);
        }
    };

    RC.PalaceLoci = PL;
})();
