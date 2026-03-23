/**
 * RhodesCards Memory Palace — Pre-built Templates
 * Curated environments with loci already placed.
 */
(function() {
    'use strict';

    const PT = {
        catalog: [
            { id: 'roman_villa', name: 'Roman Villa', desc: 'Courtyard with surrounding rooms, columns, and a garden', loci: 24, preview: '#8B7355' },
            { id: 'library_tower', name: 'Library Tower', desc: 'Multi-floor tower with bookshelves and spiral stairs', loci: 30, preview: '#4a3728' },
            { id: 'museum_hall', name: 'Museum Gallery', desc: 'Long corridors with alcoves and display pedestals', loci: 20, preview: '#555566' },
            { id: 'catacombs', name: 'Underground Catacombs', desc: 'Winding tunnels with chambers and glow markers', loci: 16, preview: '#2a2a3a' },
            { id: 'sky_palace', name: 'Sky Palace', desc: 'Floating platforms connected by bridges and portals', loci: 18, preview: '#1a3355' },
        ],

        generate(templateId) {
            switch (templateId) {
                case 'roman_villa': return this._romanVilla();
                case 'library_tower': return this._libraryTower();
                case 'museum_hall': return this._museumHall();
                case 'catacombs': return this._catacombs();
                case 'sky_palace': return this._skyPalace();
                default: return this._romanVilla();
            }
        },

        // ── Helper: make surface ──
        _surf(type, pos, rot, w, h, color) {
            return {
                type: type,
                transform: { position: pos, rotation: rot || [0,0,0], scale: [1,1,1] },
                dimensions: { width: w || 4, height: h || 3 },
                material: { color: color || '#555566' }
            };
        },

        // ── Helper: make locus ──
        _loc(pos, marker, label) {
            return {
                position: pos,
                marker_type: marker || 'orb',
                marker_settings: {},
                card_ids: [],
                label: label || ''
            };
        },

        // ── Helper: make connector ──
        _conn(type, from, to, mat) {
            return {
                type: type,
                from_point: { position: from },
                to_point: { position: to },
                path_points: [],
                material: mat || { color: '#4488ff', opacity: 0.8 },
                speed: 1.0
            };
        },

        // ═══════════════════════════════════════
        // ROMAN VILLA — courtyard + 4 rooms
        // ═══════════════════════════════════════
        _romanVilla() {
            const S = [], C = [], L = [];

            // Central courtyard floor (large)
            S.push(this._surf('floor', [0, 0, 0], [0,0,0], 14, 14, '#9B8B6E'));

            // Courtyard columns (decorative walls as thin pillars) — 8 columns around edge
            var colPositions = [[-5,0,-5],[5,0,-5],[-5,0,5],[5,0,5],[-5,0,0],[5,0,0],[0,0,-5],[0,0,5]];
            colPositions.forEach(function(p) {
                S.push({
                    type: 'wall',
                    transform: { position: [p[0], 1.5, p[2]], rotation: [0,0,0], scale: [1,1,1] },
                    dimensions: { width: 0.3, height: 3 },
                    material: { color: '#CCBBAA' }
                });
            });

            // ── Room 1: Study (North) ──
            S.push(this._surf('floor', [0, 0, -12], [0,0,0], 8, 6, '#6B5B45'));
            S.push(this._surf('wall', [0, 1.5, -15], [0,0,0], 8, 3, '#8B7B65'));   // back wall
            S.push(this._surf('wall', [-4, 1.5, -12], [0,90,0], 6, 3, '#8B7B65')); // left wall
            S.push(this._surf('wall', [4, 1.5, -12], [0,90,0], 6, 3, '#8B7B65'));  // right wall
            // Study loci
            L.push(this._loc([-2, 1, -14], 'frame', 'Study: Left painting'));
            L.push(this._loc([2, 1, -14], 'frame', 'Study: Right painting'));
            L.push(this._loc([0, 0.8, -13], 'pedestal', 'Study: Desk'));
            L.push(this._loc([-3, 1, -12], 'statue', 'Study: Bust'));
            L.push(this._loc([3, 0.5, -11], 'orb', 'Study: Window orb'));
            L.push(this._loc([0, 1, -11], 'door', 'Study: Door'));

            // ── Room 2: Dining Hall (South) ──
            S.push(this._surf('floor', [0, 0, 12], [0,0,0], 10, 6, '#7B6B55'));
            S.push(this._surf('wall', [0, 1.5, 15], [0,0,0], 10, 3, '#8B7B65'));
            S.push(this._surf('wall', [-5, 1.5, 12], [0,90,0], 6, 3, '#8B7B65'));
            S.push(this._surf('wall', [5, 1.5, 12], [0,90,0], 6, 3, '#8B7B65'));
            L.push(this._loc([-3, 0.8, 13], 'pedestal', 'Dining: Left pedestal'));
            L.push(this._loc([3, 0.8, 13], 'pedestal', 'Dining: Right pedestal'));
            L.push(this._loc([0, 1, 14], 'frame', 'Dining: Mural'));
            L.push(this._loc([-4, 1, 12], 'statue', 'Dining: Servant statue'));
            L.push(this._loc([4, 0.5, 14], 'glow', 'Dining: Hearth glow'));
            L.push(this._loc([0, 1, 10], 'door', 'Dining: Entrance'));

            // ── Room 3: Bath (West) ──
            S.push(this._surf('floor', [-12, 0, 0], [0,0,0], 6, 8, '#5577AA'));
            S.push(this._surf('wall', [-15, 1.5, 0], [0,90,0], 8, 3, '#6688BB'));
            S.push(this._surf('wall', [-12, 1.5, -4], [0,0,0], 6, 3, '#6688BB'));
            S.push(this._surf('wall', [-12, 1.5, 4], [0,0,0], 6, 3, '#6688BB'));
            L.push(this._loc([-13, 0.5, -2], 'glow', 'Bath: Pool glow left'));
            L.push(this._loc([-13, 0.5, 2], 'glow', 'Bath: Pool glow right'));
            L.push(this._loc([-11, 1, -3], 'statue', 'Bath: Neptune'));
            L.push(this._loc([-14, 1, 0], 'frame', 'Bath: Mosaic'));
            L.push(this._loc([-10, 1, 0], 'door', 'Bath: Entry'));
            L.push(this._loc([-12, 0.8, 3], 'pedestal', 'Bath: Oil pedestal'));

            // ── Room 4: Garden (East) ──
            S.push(this._surf('floor', [12, 0, 0], [0,0,0], 6, 8, '#447744'));
            L.push(this._loc([11, 0.5, -2], 'orb', 'Garden: Fountain orb'));
            L.push(this._loc([13, 0.5, 2], 'orb', 'Garden: Flower orb'));
            L.push(this._loc([11, 1, 3], 'statue', 'Garden: Venus'));
            L.push(this._loc([13, 0.8, -3], 'pedestal', 'Garden: Sundial'));
            L.push(this._loc([14, 0.5, 0], 'glow', 'Garden: Lantern'));
            L.push(this._loc([10, 1, 0], 'door', 'Garden: Gate'));

            return { surfaces: S, connectors: C, loci: L, spawn_point: { position: [0, 1.6, 0] } };
        },

        // ═══════════════════════════════════════
        // LIBRARY TOWER — 3 floors + stairs
        // ═══════════════════════════════════════
        _libraryTower() {
            const S = [], C = [], L = [];
            var floorY = [0, 4, 8];
            var floorColors = ['#4a3728', '#3a2718', '#2a1708'];
            var wallColor = '#5a4738';
            var locusNum = 1;

            for (var f = 0; f < 3; f++) {
                var y = floorY[f];
                // Floor
                S.push(this._surf('floor', [0, y, 0], [0,0,0], 10, 10, floorColors[f]));
                // 4 walls
                S.push(this._surf('wall', [0, y+1.5, -5], [0,0,0], 10, 3, wallColor));
                S.push(this._surf('wall', [0, y+1.5, 5], [0,0,0], 10, 3, wallColor));
                S.push(this._surf('wall', [-5, y+1.5, 0], [0,90,0], 10, 3, wallColor));
                S.push(this._surf('wall', [5, y+1.5, 0], [0,90,0], 10, 3, wallColor));

                // Loci around room perimeter — 10 per floor
                var positions = [
                    [-3, y+1, -4.5], [0, y+1, -4.5], [3, y+1, -4.5],   // back wall
                    [4.5, y+1, -2], [4.5, y+1, 2],                       // right wall
                    [3, y+1, 4.5], [0, y+1, 4.5], [-3, y+1, 4.5],       // front wall
                    [-4.5, y+1, 2], [-4.5, y+1, -2]                      // left wall
                ];
                var markers = ['frame', 'pedestal', 'frame', 'statue', 'orb', 'frame', 'pedestal', 'frame', 'statue', 'orb'];
                var labels = ['Bookshelf', 'Reading desk', 'Scroll rack', 'Scholar bust', 'Candle', 'Map wall', 'Globe', 'Tapestry', 'Scribe', 'Crystal'];
                positions.forEach(function(p, i) {
                    L.push({
                        position: p,
                        marker_type: markers[i],
                        marker_settings: {},
                        card_ids: [],
                        label: 'Floor ' + (f+1) + ': ' + labels[i]
                    });
                    locusNum++;
                });

                // Stairs to next floor
                if (f < 2) {
                    C.push({
                        type: 'stairs',
                        from_point: { position: [4, y, 4] },
                        to_point: { position: [4, y + 4, 2] },
                        path_points: [],
                        material: { color: '#777777' },
                        speed: 1.0
                    });
                }
            }

            return { surfaces: S, connectors: C, loci: L, spawn_point: { position: [0, 1.6, 3] } };
        },

        // ═══════════════════════════════════════
        // MUSEUM GALLERY — long corridor + alcoves
        // ═══════════════════════════════════════
        _museumHall() {
            const S = [], C = [], L = [];

            // Main corridor
            S.push(this._surf('floor', [0, 0, 0], [0,0,0], 4, 30, '#555566'));
            S.push(this._surf('wall', [-2, 1.5, 0], [0,90,0], 30, 3, '#666677'));
            S.push(this._surf('wall', [2, 1.5, 0], [0,90,0], 30, 3, '#666677'));

            // Alcoves on both sides with loci
            for (var i = 0; i < 10; i++) {
                var z = -12 + i * 2.8;
                var side = (i % 2 === 0) ? -1 : 1;
                // Alcove floor
                S.push(this._surf('floor', [side * 4, 0, z], [0,0,0], 3, 2.5, '#444455'));
                // Alcove back wall
                S.push(this._surf('wall', [side * 5.5, 1.5, z], [0,90,0], 2.5, 3, '#555566'));

                // Loci — 2 per alcove
                L.push(this._loc([side * 4, 0.8, z - 0.5], 'pedestal', 'Alcove ' + (i+1) + ': Display'));
                L.push(this._loc([side * 5, 1.2, z + 0.5], 'frame', 'Alcove ' + (i+1) + ': Painting'));
            }

            return { surfaces: S, connectors: C, loci: L, spawn_point: { position: [0, 1.6, -14] } };
        },

        // ═══════════════════════════════════════
        // CATACOMBS — winding tunnels + chambers
        // ═══════════════════════════════════════
        _catacombs() {
            const S = [], C = [], L = [];

            // Central chamber
            S.push(this._surf('floor', [0, 0, 0], [0,0,0], 6, 6, '#2a2a3a'));
            S.push(this._surf('wall', [0, 1.5, -3], [0,0,0], 6, 3, '#333344'));
            S.push(this._surf('wall', [0, 1.5, 3], [0,0,0], 6, 3, '#333344'));
            S.push(this._surf('wall', [-3, 1.5, 0], [0,90,0], 6, 3, '#333344'));
            S.push(this._surf('wall', [3, 1.5, 0], [0,90,0], 6, 3, '#333344'));
            L.push(this._loc([0, 1, 0], 'glow', 'Central: Altar'));
            L.push(this._loc([-2, 0.8, -2], 'pedestal', 'Central: Urn left'));
            L.push(this._loc([2, 0.8, -2], 'pedestal', 'Central: Urn right'));
            L.push(this._loc([0, 1, -2.5], 'statue', 'Central: Guardian'));

            // North tunnel + chamber
            S.push(this._surf('floor', [0, 0, -8], [0,0,0], 2, 4, '#222233'));
            S.push(this._surf('floor', [0, 0, -14], [0,0,0], 5, 5, '#2a2a3a'));
            S.push(this._surf('wall', [0, 1.5, -16.5], [0,0,0], 5, 3, '#333344'));
            S.push(this._surf('wall', [-2.5, 1.5, -14], [0,90,0], 5, 3, '#333344'));
            S.push(this._surf('wall', [2.5, 1.5, -14], [0,90,0], 5, 3, '#333344'));
            L.push(this._loc([-1.5, 1, -15], 'glow', 'North: Torch left'));
            L.push(this._loc([1.5, 1, -15], 'glow', 'North: Torch right'));
            L.push(this._loc([0, 0.8, -15.5], 'pedestal', 'North: Sarcophagus'));
            L.push(this._loc([0, 1, -13], 'frame', 'North: Inscription'));

            // East tunnel + chamber
            S.push(this._surf('floor', [8, 0, 0], [0,0,0], 4, 2, '#222233'));
            S.push(this._surf('floor', [14, 0, 0], [0,0,0], 5, 5, '#2a2a3a'));
            S.push(this._surf('wall', [16.5, 1.5, 0], [0,90,0], 5, 3, '#333344'));
            S.push(this._surf('wall', [14, 1.5, -2.5], [0,0,0], 5, 3, '#333344'));
            S.push(this._surf('wall', [14, 1.5, 2.5], [0,0,0], 5, 3, '#333344'));
            L.push(this._loc([13, 1, -1.5], 'glow', 'East: Crystal'));
            L.push(this._loc([15, 0.8, 0], 'statue', 'East: Sphinx'));
            L.push(this._loc([13, 1, 1.5], 'orb', 'East: Soul orb'));
            L.push(this._loc([15.5, 1, 1.5], 'frame', 'East: Hieroglyph'));

            return { surfaces: S, connectors: C, loci: L, spawn_point: { position: [0, 1.6, 2] } };
        },

        // ═══════════════════════════════════════
        // SKY PALACE — floating platforms + bridges/portals
        // ═══════════════════════════════════════
        _skyPalace() {
            const S = [], C = [], L = [];

            // Central platform
            S.push(this._surf('floor', [0, 0, 0], [0,0,0], 8, 8, '#1a3355'));
            L.push(this._loc([0, 1, 0], 'glow', 'Center: Nexus crystal'));
            L.push(this._loc([-2, 0.8, -2], 'pedestal', 'Center: Star map'));
            L.push(this._loc([2, 0.8, 2], 'pedestal', 'Center: Compass'));

            // North platform (higher)
            S.push(this._surf('floor', [0, 3, -15], [0,0,0], 6, 6, '#2a4466'));
            L.push(this._loc([-1, 4, -16], 'orb', 'North: Moon orb'));
            L.push(this._loc([1, 4, -16], 'orb', 'North: Sun orb'));
            L.push(this._loc([0, 3.8, -14], 'statue', 'North: Atlas'));
            // Bridge to north
            C.push(this._conn('bridge', [0, 0, -4], [0, 3, -12], { color: '#88aadd', opacity: 0.6 }));

            // East platform (same height)
            S.push(this._surf('floor', [15, 0, 0], [0,0,0], 6, 6, '#2a4466'));
            L.push(this._loc([14, 1, -1], 'frame', 'East: Sky painting'));
            L.push(this._loc([16, 1, 1], 'statue', 'East: Wind figure'));
            L.push(this._loc([14, 0.5, 2], 'glow', 'East: Beacon'));
            // Bridge to east
            C.push(this._conn('bridge', [4, 0, 0], [12, 0, 0], { color: '#88aadd', opacity: 0.6 }));

            // West platform (lower)
            S.push(this._surf('floor', [-15, -2, 0], [0,0,0], 6, 6, '#1a2244'));
            L.push(this._loc([-16, -1, -1], 'orb', 'West: Storm orb'));
            L.push(this._loc([-14, -1.2, 1], 'pedestal', 'West: Thunder stone'));
            L.push(this._loc([-16, -1, 2], 'glow', 'West: Lightning'));
            // Bridge to west
            C.push(this._conn('bridge', [-4, 0, 0], [-12, -2, 0], { color: '#88aadd', opacity: 0.6 }));

            // South platform (far)
            S.push(this._surf('floor', [0, 1, 18], [0,0,0], 6, 6, '#2a4466'));
            L.push(this._loc([-1, 2, 19], 'frame', 'South: Constellation'));
            L.push(this._loc([1, 2, 17], 'statue', 'South: Phoenix'));
            L.push(this._loc([0, 1.5, 20], 'glow', 'South: Portal glow'));
            // Portal from center to south
            C.push(this._conn('portal', [0, 0, 3.5], [0, 1, 15.5], { color: '#ff44ff' }));

            return { surfaces: S, connectors: C, loci: L, spawn_point: { position: [0, 1.6, 0] } };
        }
    };

    RC.PalaceTemplates = PT;
})();
