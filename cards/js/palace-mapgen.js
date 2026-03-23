/**
 * RhodesCards Memory Palace — BSP Map Generator
 * Procedurally generates 2D dungeon maps with rooms, corridors, and loci.
 */
(function() {
    'use strict';

    var MG = {
        /**
         * Generate a palace map.
         * @param {number} lociCount - desired number of loci
         * @param {string} [seed] - optional seed for reproducibility
         * @returns {{ map: number[], width: number, height: number, sprites: object[], spawn: number[], rooms: object[] }}
         */
        generate: function(lociCount, seed) {
            lociCount = Math.max(4, Math.min(200, lociCount || 20));

            // Scale map size to loci count
            var baseSize = Math.max(32, Math.min(96, Math.floor(8 + lociCount * 1.5)));
            // Make odd for cleaner walls
            var w = baseSize | 1;
            var h = baseSize | 1;

            // Seeded RNG
            var rng = this._rng(seed || ('palace_' + Date.now()));

            // Start with all walls
            var map = new Array(w * h);
            for (var i = 0; i < map.length; i++) map[i] = 1; // stone walls

            // BSP split
            var rooms = [];
            this._bsp({ x: 1, y: 1, w: w - 2, h: h - 2 }, rooms, rng, 0, Math.max(4, Math.ceil(Math.log2(lociCount))));

            // Carve rooms
            for (var ri = 0; ri < rooms.length; ri++) {
                var rm = rooms[ri];
                // Random wall type per room (1-5)
                rm.wallType = 1 + Math.floor(rng() * 5);
                for (var ry = rm.y; ry < rm.y + rm.h; ry++) {
                    for (var rx = rm.x; rx < rm.x + rm.w; rx++) {
                        map[ry * w + rx] = 0; // floor
                    }
                }
                // Set walls around room to room's wall type
                for (var ry = rm.y - 1; ry <= rm.y + rm.h; ry++) {
                    for (var rx = rm.x - 1; rx <= rm.x + rm.w; rx++) {
                        if (ry < 0 || ry >= h || rx < 0 || rx >= w) continue;
                        if (map[ry * w + rx] !== 0) {
                            map[ry * w + rx] = rm.wallType;
                        }
                    }
                }
            }

            // Connect rooms with corridors (connect each room to the next)
            for (var i = 0; i < rooms.length - 1; i++) {
                var a = rooms[i], b = rooms[i + 1];
                var ax = Math.floor(a.x + a.w / 2), ay = Math.floor(a.y + a.h / 2);
                var bx = Math.floor(b.x + b.w / 2), by = Math.floor(b.y + b.h / 2);
                this._corridor(map, w, h, ax, ay, bx, by, rng);
            }
            // Extra corridors for loops (connect some non-adjacent rooms)
            for (var i = 0; i < Math.floor(rooms.length / 3); i++) {
                var ai = Math.floor(rng() * rooms.length);
                var bi = Math.floor(rng() * rooms.length);
                if (ai !== bi) {
                    var a = rooms[ai], b = rooms[bi];
                    this._corridor(map, w, h, Math.floor(a.x + a.w/2), Math.floor(a.y + a.h/2),
                        Math.floor(b.x + b.w/2), Math.floor(b.y + b.h/2), rng);
                }
            }

            // Place loci sprites in rooms
            var sprites = [];
            var lociPerRoom = Math.ceil(lociCount / rooms.length);
            var placed = 0;
            var markerTypes = ['orb', 'pedestal', 'frame', 'statue', 'glow'];
            var locusLabels = ['Altar', 'Pedestal', 'Painting', 'Figure', 'Crystal', 'Torch', 'Tablet', 'Globe', 'Mirror', 'Relic'];

            for (var ri = 0; ri < rooms.length && placed < lociCount; ri++) {
                var rm = rooms[ri];
                var count = Math.min(lociPerRoom, lociCount - placed);
                for (var li = 0; li < count; li++) {
                    // Place near walls for visual interest
                    var lx, ly, attempts = 0;
                    do {
                        lx = rm.x + 1 + rng() * (rm.w - 2);
                        ly = rm.y + 1 + rng() * (rm.h - 2);
                        attempts++;
                    } while (map[Math.floor(ly) * w + Math.floor(lx)] !== 0 && attempts < 20);

                    sprites.push({
                        x: lx,
                        y: ly,
                        type: markerTypes[placed % markerTypes.length],
                        data: {
                            label: 'Room ' + (ri + 1) + ': ' + locusLabels[placed % locusLabels.length],
                            card_ids: [],
                            room: ri
                        }
                    });
                    placed++;
                }
            }

            // Spawn in first room center
            var spawn = [rooms[0].x + rooms[0].w / 2, rooms[0].y + rooms[0].h / 2];

            return { map: map, width: w, height: h, sprites: sprites, spawn: spawn, rooms: rooms };
        },

        // ── BSP recursive split ──
        _bsp: function(rect, rooms, rng, depth, maxDepth) {
            if (depth >= maxDepth || rect.w < 6 || rect.h < 6) {
                // Leaf — place room
                var padding = 1;
                var rw = Math.max(3, Math.floor(rect.w * (0.5 + rng() * 0.4)) - padding * 2);
                var rh = Math.max(3, Math.floor(rect.h * (0.5 + rng() * 0.4)) - padding * 2);
                var rx = rect.x + padding + Math.floor(rng() * (rect.w - rw - padding * 2));
                var ry = rect.y + padding + Math.floor(rng() * (rect.h - rh - padding * 2));
                if (rx < 1) rx = 1; if (ry < 1) ry = 1;
                rooms.push({ x: rx, y: ry, w: rw, h: rh });
                return;
            }

            // Split horizontally or vertically
            var splitH = (rect.w > rect.h) ? false : (rect.h > rect.w) ? true : rng() > 0.5;

            if (splitH) {
                var split = Math.floor(rect.h * (0.35 + rng() * 0.3));
                this._bsp({ x: rect.x, y: rect.y, w: rect.w, h: split }, rooms, rng, depth + 1, maxDepth);
                this._bsp({ x: rect.x, y: rect.y + split, w: rect.w, h: rect.h - split }, rooms, rng, depth + 1, maxDepth);
            } else {
                var split = Math.floor(rect.w * (0.35 + rng() * 0.3));
                this._bsp({ x: rect.x, y: rect.y, w: split, h: rect.h }, rooms, rng, depth + 1, maxDepth);
                this._bsp({ x: rect.x + split, y: rect.y, w: rect.w - split, h: rect.h }, rooms, rng, depth + 1, maxDepth);
            }
        },

        // ── Corridor carving ──
        _corridor: function(map, w, h, x1, y1, x2, y2, rng) {
            var x = x1, y = y1;
            // L-shaped corridor: horizontal then vertical (or vice versa)
            var hFirst = rng() > 0.5;
            if (hFirst) {
                while (x !== x2) { x += (x2 > x) ? 1 : -1; if (x >= 0 && x < w && y >= 0 && y < h) map[y * w + x] = 0; }
                while (y !== y2) { y += (y2 > y) ? 1 : -1; if (x >= 0 && x < w && y >= 0 && y < h) map[y * w + x] = 0; }
            } else {
                while (y !== y2) { y += (y2 > y) ? 1 : -1; if (x >= 0 && x < w && y >= 0 && y < h) map[y * w + x] = 0; }
                while (x !== x2) { x += (x2 > x) ? 1 : -1; if (x >= 0 && x < w && y >= 0 && y < h) map[y * w + x] = 0; }
            }
        },

        // ── Seeded PRNG (mulberry32) ──
        _rng: function(seed) {
            var h = 0;
            for (var i = 0; i < seed.length; i++) {
                h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
            }
            var s = h >>> 0;
            return function() {
                s |= 0; s = s + 0x6D2B79F5 | 0;
                var t = Math.imul(s ^ s >>> 15, 1 | s);
                t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
                return ((t ^ t >>> 14) >>> 0) / 4294967296;
            };
        },

        // ── Pre-built templates (seed + config) ──
        templates: [
            { id: 'roman_villa',    name: 'Roman Villa',     desc: 'Spacious rooms around a courtyard', loci: 24, seed: 'roman_villa_v1',    mapSize: 48 },
            { id: 'library_tower',  name: 'Library Tower',   desc: 'Dense maze of chambers and passages', loci: 30, seed: 'library_tower_v1',  mapSize: 56 },
            { id: 'museum_hall',    name: 'Museum Gallery',  desc: 'Long corridors with alcove rooms',   loci: 20, seed: 'museum_hall_v1',    mapSize: 40 },
            { id: 'catacombs',      name: 'Catacombs',       desc: 'Winding tunnels and dark chambers',  loci: 16, seed: 'catacombs_v1',      mapSize: 36 },
            { id: 'sky_palace',     name: 'Sky Palace',      desc: 'Expansive open chambers',            loci: 18, seed: 'sky_palace_v1',     mapSize: 42 },
            { id: 'grand_estate',   name: 'Grand Estate',    desc: 'Massive palace with many wings',     loci: 50, seed: 'grand_estate_v1',   mapSize: 72 },
        ],

        generateFromTemplate: function(templateId) {
            var t = this.templates.find(function(tmpl) { return tmpl.id === templateId; });
            if (!t) t = this.templates[0];
            return this.generate(t.loci, t.seed);
        }
    };

    RC.PalaceMapGen = MG;
})();
