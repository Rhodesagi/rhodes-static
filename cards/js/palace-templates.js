/**
 * RhodesCards Memory Palace — Pre-built Templates (v2, S175)
 * The Rhodes Memory City: one hub + 5 themed wings, each holding 400-1800 loci
 * via procedural helpers. PBR + HDRI + GLB props, fully enclosed interior.
 *
 * Schema: memory/reference-palace-v2-schema.md
 * Renderer: palace-renderer.js (v2, S175)
 *
 * Each template function returns a v2 template object:
 *   { meta, environment, materials, surfaces, props, connectors, loci }
 */
(function() {
    'use strict';

    const PT = {
        catalog: [
            { id: 'forum',         name: 'The Forum',       desc: 'Octagonal marble hub with 5 archways leading to each wing of the Rhodes Memory City',         loci: 28,   preview: '#e8dcc0' },
            { id: 'roman_villa',   name: 'Roman Villa',     desc: 'Mediterranean villa urbana with peristyle courtyard, upper floors, and enclosed cypress grove', loci: 453,  preview: '#d4c8a8' },
            { id: 'library_tower', name: 'Library Tower',   desc: 'Five-story octagonal tower of learning — 1800 shelf loci across 30 bookshelf walls',            loci: 1826, preview: '#6a4828' },
            { id: 'museum_hall',   name: 'Museum Gallery',  desc: 'Grand neoclassical gallery — 140m hall with 40 alcoves and a rear rotunda sculpture',           loci: 504,  preview: '#e0e4e8' },
            { id: 'catacombs',     name: 'Catacombs',       desc: 'Three parallel subterranean corridors with 300 niches and cross-chambers',                       loci: 378,  preview: '#1a1612' },
            { id: 'observatory',   name: 'Observatory',     desc: 'Domed astronomy chamber with star chart walls, constellation ring, and ecliptic floor',          loci: 520,  preview: '#2a3048' },
        ],

        generate(templateId) {
            switch (templateId) {
                case 'forum':         return this._forum();
                case 'roman_villa':   return this._romanVilla();
                case 'library_tower': return this._libraryTower();
                case 'museum_hall':   return this._museumHall();
                case 'catacombs':     return this._catacombs();
                case 'observatory':   return this._observatory();
                default:              return this._forum();
            }
        },

        // ═══════════════════════════════════════════════════════════
        // Procedural locus helpers — call from template functions to
        // generate thousands of loci programmatically. Each returns
        // an array of locus objects that can be spread into loci: [].
        // ═══════════════════════════════════════════════════════════

        /**
         * Grid of loci on a flat wall surface.
         * origin: [x,y,z] of the first locus (typically bottom-left corner of the grid)
         * rightAxis: [dx,dy,dz] unit vector for column direction (along wall)
         * upAxis: [dx,dy,dz] unit vector for row direction (usually [0,1,0])
         * rows, cols: grid dimensions
         * stepRight, stepUp: spacing
         */
        _shelfGrid({ origin, rightAxis, upAxis, rows, cols, stepRight, stepUp, marker, labelPrefix }) {
            const loci = [];
            const ra = rightAxis || [1, 0, 0];
            const ua = upAxis || [0, 1, 0];
            const sr = stepRight || 0.5;
            const su = stepUp || 0.5;
            const m = marker || 'orb';
            const lp = labelPrefix || 'shelf';
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    loci.push({
                        position: [
                            origin[0] + ra[0] * c * sr + ua[0] * r * su,
                            origin[1] + ra[1] * c * sr + ua[1] * r * su,
                            origin[2] + ra[2] * c * sr + ua[2] * r * su,
                        ],
                        marker_type: m,
                        label: `${lp} r${r+1}c${c+1}`,
                        marker_settings: {},
                        card_ids: [],
                    });
                }
            }
            return loci;
        },

        /** Straight line of loci from `start` to `end`, `count` total. */
        _nicheRow({ start, end, count, marker, labelPrefix }) {
            const loci = [];
            const m = marker || 'orb';
            const lp = labelPrefix || 'niche';
            for (let i = 0; i < count; i++) {
                const t = count === 1 ? 0.5 : i / (count - 1);
                loci.push({
                    position: [
                        start[0] + (end[0] - start[0]) * t,
                        start[1] + (end[1] - start[1]) * t,
                        start[2] + (end[2] - start[2]) * t,
                    ],
                    marker_type: m,
                    label: `${lp} ${i+1}`,
                    marker_settings: {},
                    card_ids: [],
                });
            }
            return loci;
        },

        /** Ring of loci around `center` at `radius`, `count` total. */
        _ring({ center, radius, count, y, marker, labelPrefix }) {
            const loci = [];
            const m = marker || 'orb';
            const lp = labelPrefix || 'ring';
            const cy = y != null ? y : center[1];
            for (let i = 0; i < count; i++) {
                const a = (i / count) * Math.PI * 2;
                loci.push({
                    position: [
                        center[0] + Math.cos(a) * radius,
                        cy,
                        center[2] + Math.sin(a) * radius,
                    ],
                    marker_type: m,
                    label: `${lp} ${i+1}`,
                    marker_settings: {},
                    card_ids: [],
                });
            }
            return loci;
        },

        /**
         * Loci stacked along each column in `columnPositions`.
         * columnPositions: array of [x,y,z]
         * perColumn: loci per column
         * heights: optional array of y values (default: 1.5, 3.0, 4.5, ...)
         */
        _columnLoci({ columnPositions, perColumn, heights, marker, labelPrefix }) {
            const loci = [];
            const m = marker || 'orb';
            const lp = labelPrefix || 'col';
            columnPositions.forEach((pos, ci) => {
                for (let i = 0; i < perColumn; i++) {
                    const y = (heights && heights[i] != null) ? heights[i] : (1.5 + i * 1.5);
                    loci.push({
                        position: [pos[0], y, pos[2]],
                        marker_type: m,
                        label: `${lp} ${ci+1}-${i+1}`,
                        marker_settings: {},
                        card_ids: [],
                    });
                }
            });
            return loci;
        },

        /** 2D grid of loci on a floor patch. */
        _floorGrid({ origin, rows, cols, stepX, stepZ, y, marker, labelPrefix }) {
            const loci = [];
            const m = marker || 'orb';
            const lp = labelPrefix || 'floor';
            const cy = y != null ? y : 1.2;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    loci.push({
                        position: [
                            origin[0] + c * stepX,
                            cy,
                            origin[2] + r * stepZ,
                        ],
                        marker_type: m,
                        label: `${lp} r${r+1}c${c+1}`,
                        marker_settings: {},
                        card_ids: [],
                    });
                }
            }
            return loci;
        },

        // ═══════════════════════════════════════════════════════════
        // 7 template functions follow (5 wings + Forum hub + Observatory)
        // ═══════════════════════════════════════════════════════════

    _forum() {
        const t = {
            meta: {
                id: 'forum',
                name: 'The Forum',
                desc: 'Grand octagonal marble rotunda — sacred civic hub at the heart of the Memory City. Five archways lead to the themed wings.',
                spawn_point: { position: [0, 1.6, 2], rotation_y: 180 },
                scale: 1.0,
            },
            environment: {
                hdri: 'assets/hdri/church_museum_2k.hdr',
                hdri_intensity: 0.9,
                hdri_as_background: false,
                fog: { color: 0x1a1612, near: 40, far: 90 },
                sun: { position: [0, 80, 0], intensity: 1.5, color: 0xfff2d8, cast_shadow: true, shadow_bounds: 40 },
                ambient: { intensity: 0.22 },
            },
            materials: {
                marble_white: {
                    albedo: 'assets/textures/marble_white/albedo_2k.jpg',
                    normal: 'assets/textures/marble_white/normal_2k.jpg',
                    roughness: 'assets/textures/marble_white/roughness_2k.jpg',
                    ao: 'assets/textures/marble_white/ao_2k.jpg',
                    repeat: [6, 6],
                    roughness_scale: 0.85,
                    metalness: 0,
                },
                travertine_stone: {
                    albedo: 'assets/textures/travertine_stone/albedo_2k.jpg',
                    normal: 'assets/textures/travertine_stone/normal_2k.jpg',
                    roughness: 'assets/textures/travertine_stone/roughness_2k.jpg',
                    ao: 'assets/textures/travertine_stone/ao_2k.jpg',
                    repeat: [2, 4],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                oak_beam_dark: {
                    albedo: 'assets/textures/oak_beam_dark/albedo_2k.jpg',
                    normal: 'assets/textures/oak_beam_dark/normal_2k.jpg',
                    roughness: 'assets/textures/oak_beam_dark/roughness_2k.jpg',
                    ao: 'assets/textures/oak_beam_dark/ao_2k.jpg',
                    repeat: [3, 3],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                bronze_trim: {
                    albedo: 'assets/textures/bronze_trim/albedo_2k.jpg',
                    normal: 'assets/textures/bronze_trim/normal_2k.jpg',
                    roughness: 'assets/textures/bronze_trim/roughness_2k.jpg',
                    ao: null,
                    repeat: [2, 2],
                    roughness_scale: 0.28,
                    metalness: 0.9,
                },
                basalt_dark: {
                    albedo: 'assets/textures/basalt_dark/albedo_2k.jpg',
                    normal: 'assets/textures/basalt_dark/normal_2k.jpg',
                    roughness: 'assets/textures/basalt_dark/roughness_2k.jpg',
                    ao: 'assets/textures/basalt_dark/ao_2k.jpg',
                    repeat: [2, 2],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                plaster_cream: {
                    albedo: 'assets/textures/plaster_cream/albedo_2k.jpg',
                    normal: 'assets/textures/plaster_cream/normal_2k.jpg',
                    roughness: 'assets/textures/plaster_cream/roughness_2k.jpg',
                    ao: 'assets/textures/plaster_cream/ao_2k.jpg',
                    repeat: [3, 3],
                    roughness_scale: 1.05,
                    metalness: 0,
                },
            },
            surfaces: [
                // ============================================================
                // FLOOR — 34x34 marble slab (octagon inscribed inside)
                // ============================================================
                { type: 'floor', transform: { position: [0, -0.15, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 34, height: 34, depth: 0.3 }, material: 'marble_white', label: 'Forum floor (marble)' },

                // Central circular inlay (approximated as travertine square 6x6) at spawn focal point
                { type: 'floor', transform: { position: [0, 0.01, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6, height: 6, depth: 0.04 }, material: 'travertine_stone', label: 'Central inlay disc' },
                // Bronze ring around inlay (thin outer frame, four strips)
                { type: 'floor', transform: { position: [0, 0.02, 3.1], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6.4, height: 0.2, depth: 0.03 }, material: 'bronze_trim', label: 'Inlay bronze ring N' },
                { type: 'floor', transform: { position: [0, 0.02, -3.1], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6.4, height: 0.2, depth: 0.03 }, material: 'bronze_trim', label: 'Inlay bronze ring S' },
                { type: 'floor', transform: { position: [3.1, 0.02, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.2, height: 6.4, depth: 0.03 }, material: 'bronze_trim', label: 'Inlay bronze ring E' },
                { type: 'floor', transform: { position: [-3.1, 0.02, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.2, height: 6.4, depth: 0.03 }, material: 'bronze_trim', label: 'Inlay bronze ring W' },

                // ============================================================
                // CENTRAL ALTAR — composed stack of boxes at origin
                // ============================================================
                // Basalt plinth (broad base)
                { type: 'floor', transform: { position: [0, 0.12, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.4, height: 2.4, depth: 0.24 }, material: 'basalt_dark', label: 'Altar plinth' },
                // Marble drum (main pedestal)
                { type: 'floor', transform: { position: [0, 0.85, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.0, height: 2.0, depth: 1.2 }, material: 'marble_white', label: 'Altar drum' },
                // Travertine crown (upper ring)
                { type: 'floor', transform: { position: [0, 1.52, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.6, height: 1.6, depth: 0.1 }, material: 'travertine_stone', label: 'Altar crown' },
                // Bronze flame bowl (short cylinder approximated as box)
                { type: 'floor', transform: { position: [0, 1.68, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.1, height: 1.1, depth: 0.2 }, material: 'bronze_trim', label: 'Altar brazier bowl' },
                // Bronze flame neck
                { type: 'floor', transform: { position: [0, 1.92, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.5, height: 0.5, depth: 0.3 }, material: 'bronze_trim', label: 'Altar flame neck' },

                // ============================================================
                // OCTAGONAL WALLS — 8 walls at vertex radius 15m
                // wall_mid radius = 15 * cos(22.5°) = 13.86
                // wall_length = 2 * 15 * sin(22.5°) = 11.48m (use 12 for slight corner overlap)
                // Wall rotation_y (deg) = -(theta_mid + 90) to face inward
                // Wall height = 8, thickness = 0.4
                // ARCH walls split into 3 pieces; BLANK walls are single slabs
                // ============================================================

                // --- W0 (theta=22.5°) BLANK wall (statue alcove) ---
                { type: 'wall', transform: { position: [12.81, 4, 5.30], rotation: [0, -112.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 8, depth: 0.4 }, material: 'marble_white', label: 'Forum wall 0 (statue alcove E)' },

                // --- W1 (theta=67.5°) ARCH → museum_hall ---
                // Left segment (4m)
                { type: 'wall', transform: { position: [7.59, 4, 10.98], rotation: [0, -157.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.4 }, material: 'marble_white', label: 'W1 left (museum)' },
                // Right segment (4m)
                { type: 'wall', transform: { position: [3.02, 4, 14.63], rotation: [0, -157.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.4 }, material: 'marble_white', label: 'W1 right (museum)' },
                // Lintel above arch (4m wide, 2m tall)
                { type: 'wall', transform: { position: [5.30, 7, 12.81], rotation: [0, -157.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 2, depth: 0.4 }, material: 'travertine_stone', label: 'W1 lintel (museum)' },
                // Archway recess (inside, slightly darker) — a thin plaster panel behind arch
                { type: 'wall', transform: { position: [5.88, 3, 14.19], rotation: [0, -157.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 6, depth: 0.1 }, material: 'plaster_cream', label: 'W1 recess (museum)' },

                // --- W2 (theta=112.5°) ARCH → library_tower ---
                { type: 'wall', transform: { position: [-3.02, 4, 14.63], rotation: [0, 157.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.4 }, material: 'marble_white', label: 'W2 left (library)' },
                { type: 'wall', transform: { position: [-7.59, 4, 10.98], rotation: [0, 157.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.4 }, material: 'marble_white', label: 'W2 right (library)' },
                { type: 'wall', transform: { position: [-5.30, 7, 12.81], rotation: [0, 157.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 2, depth: 0.4 }, material: 'travertine_stone', label: 'W2 lintel (library)' },
                { type: 'wall', transform: { position: [-5.88, 3, 14.19], rotation: [0, 157.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 6, depth: 0.1 }, material: 'plaster_cream', label: 'W2 recess (library)' },

                // --- W3 (theta=157.5°) ARCH → observatory ---
                { type: 'wall', transform: { position: [-10.98, 4, 7.59], rotation: [0, 112.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.4 }, material: 'marble_white', label: 'W3 left (observatory)' },
                { type: 'wall', transform: { position: [-14.63, 4, 3.02], rotation: [0, 112.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.4 }, material: 'marble_white', label: 'W3 right (observatory)' },
                { type: 'wall', transform: { position: [-12.81, 7, 5.30], rotation: [0, 112.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 2, depth: 0.4 }, material: 'travertine_stone', label: 'W3 lintel (observatory)' },
                { type: 'wall', transform: { position: [-14.19, 3, 5.88], rotation: [0, 112.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 6, depth: 0.1 }, material: 'plaster_cream', label: 'W3 recess (observatory)' },

                // --- W4 (theta=202.5°) BLANK wall (statue alcove W) ---
                { type: 'wall', transform: { position: [-12.81, 4, -5.30], rotation: [0, 67.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 8, depth: 0.4 }, material: 'marble_white', label: 'Forum wall 4 (statue alcove W)' },

                // --- W5 (theta=247.5°) ARCH → catacombs ---
                { type: 'wall', transform: { position: [-7.59, 4, -10.98], rotation: [0, 22.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.4 }, material: 'marble_white', label: 'W5 left (catacombs)' },
                { type: 'wall', transform: { position: [-3.02, 4, -14.63], rotation: [0, 22.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.4 }, material: 'marble_white', label: 'W5 right (catacombs)' },
                { type: 'wall', transform: { position: [-5.30, 7, -12.81], rotation: [0, 22.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 2, depth: 0.4 }, material: 'travertine_stone', label: 'W5 lintel (catacombs)' },
                { type: 'wall', transform: { position: [-5.88, 3, -14.19], rotation: [0, 22.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 6, depth: 0.1 }, material: 'basalt_dark', label: 'W5 recess (catacombs — darker)' },

                // --- W6 (theta=292.5°) BLANK wall (statue alcove S) ---
                { type: 'wall', transform: { position: [5.30, 4, -12.81], rotation: [0, -22.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 8, depth: 0.4 }, material: 'marble_white', label: 'Forum wall 6 (statue alcove S)' },

                // --- W7 (theta=337.5°) ARCH → roman_villa ---
                { type: 'wall', transform: { position: [14.63, 4, -3.02], rotation: [0, -67.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.4 }, material: 'marble_white', label: 'W7 left (villa)' },
                { type: 'wall', transform: { position: [10.98, 4, -7.59], rotation: [0, -67.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.4 }, material: 'marble_white', label: 'W7 right (villa)' },
                { type: 'wall', transform: { position: [12.81, 7, -5.30], rotation: [0, -67.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 2, depth: 0.4 }, material: 'travertine_stone', label: 'W7 lintel (villa)' },
                { type: 'wall', transform: { position: [14.19, 3, -5.88], rotation: [0, -67.5, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 6, depth: 0.1 }, material: 'plaster_cream', label: 'W7 recess (villa)' },

                // ============================================================
                // TRAVERTINE PILASTERS at each of 8 octagon vertices (radius 15)
                // These are tall thin pillars attached to corners where walls meet
                // ============================================================
                { type: 'wall', transform: { position: [15.0, 4, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.8, height: 8, depth: 0.8 }, material: 'travertine_stone', label: 'Pilaster V0' },
                { type: 'wall', transform: { position: [10.61, 4, 10.61], rotation: [0, 45, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.8, height: 8, depth: 0.8 }, material: 'travertine_stone', label: 'Pilaster V1' },
                { type: 'wall', transform: { position: [0, 4, 15.0], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.8, height: 8, depth: 0.8 }, material: 'travertine_stone', label: 'Pilaster V2' },
                { type: 'wall', transform: { position: [-10.61, 4, 10.61], rotation: [0, 135, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.8, height: 8, depth: 0.8 }, material: 'travertine_stone', label: 'Pilaster V3' },
                { type: 'wall', transform: { position: [-15.0, 4, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.8, height: 8, depth: 0.8 }, material: 'travertine_stone', label: 'Pilaster V4' },
                { type: 'wall', transform: { position: [-10.61, 4, -10.61], rotation: [0, 45, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.8, height: 8, depth: 0.8 }, material: 'travertine_stone', label: 'Pilaster V5' },
                { type: 'wall', transform: { position: [0, 4, -15.0], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.8, height: 8, depth: 0.8 }, material: 'travertine_stone', label: 'Pilaster V6' },
                { type: 'wall', transform: { position: [10.61, 4, -10.61], rotation: [0, 135, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.8, height: 8, depth: 0.8 }, material: 'travertine_stone', label: 'Pilaster V7' },

                // ============================================================
                // COFFERED CEILING — main ceiling slab at y=8.15 plus raised oculus disc
                // ============================================================
                // Main ceiling (opaque)
                { type: 'ceiling', transform: { position: [0, 8.15, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 34, height: 34, depth: 0.3 }, material: 'plaster_cream', label: 'Forum ceiling slab' },
                // Raised oculus disc (marble, y=9 — slightly raised central medallion)
                { type: 'ceiling', transform: { position: [0, 9.0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6, height: 6, depth: 0.2 }, material: 'marble_white', label: 'Central oculus disc' },
                // Bronze ring around oculus
                { type: 'ceiling', transform: { position: [0, 8.95, 3.2], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6.6, height: 0.3, depth: 0.06 }, material: 'bronze_trim', label: 'Oculus ring N' },
                { type: 'ceiling', transform: { position: [0, 8.95, -3.2], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6.6, height: 0.3, depth: 0.06 }, material: 'bronze_trim', label: 'Oculus ring S' },
                { type: 'ceiling', transform: { position: [3.2, 8.95, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.3, height: 6.6, depth: 0.06 }, material: 'bronze_trim', label: 'Oculus ring E' },
                { type: 'ceiling', transform: { position: [-3.2, 8.95, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.3, height: 6.6, depth: 0.06 }, material: 'bronze_trim', label: 'Oculus ring W' },

                // Eight oak-beam coffer ribs radiating outward from the oculus
                // Each rib is a long thin beam from radius ~3.5 to ~14 at y=8.25 (just below ceiling)
                // We rotate each around Y by i*45°. We treat them as wall-type with width=10, depth=0.5, height=0.3
                // placed at their midpoint radius (~8.75)
                { type: 'ceiling', transform: { position: [8.75, 8.3, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10.5, height: 0.6, depth: 0.3 }, material: 'oak_beam_dark', label: 'Coffer rib 0 (E)' },
                { type: 'ceiling', transform: { position: [6.19, 8.3, 6.19], rotation: [0, 45, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10.5, height: 0.6, depth: 0.3 }, material: 'oak_beam_dark', label: 'Coffer rib 1 (NE)' },
                { type: 'ceiling', transform: { position: [0, 8.3, 8.75], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10.5, height: 0.6, depth: 0.3 }, material: 'oak_beam_dark', label: 'Coffer rib 2 (N)' },
                { type: 'ceiling', transform: { position: [-6.19, 8.3, 6.19], rotation: [0, 135, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10.5, height: 0.6, depth: 0.3 }, material: 'oak_beam_dark', label: 'Coffer rib 3 (NW)' },
                { type: 'ceiling', transform: { position: [-8.75, 8.3, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10.5, height: 0.6, depth: 0.3 }, material: 'oak_beam_dark', label: 'Coffer rib 4 (W)' },
                { type: 'ceiling', transform: { position: [-6.19, 8.3, -6.19], rotation: [0, 45, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10.5, height: 0.6, depth: 0.3 }, material: 'oak_beam_dark', label: 'Coffer rib 5 (SW)' },
                { type: 'ceiling', transform: { position: [0, 8.3, -8.75], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10.5, height: 0.6, depth: 0.3 }, material: 'oak_beam_dark', label: 'Coffer rib 6 (S)' },
                { type: 'ceiling', transform: { position: [6.19, 8.3, -6.19], rotation: [0, 135, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10.5, height: 0.6, depth: 0.3 }, material: 'oak_beam_dark', label: 'Coffer rib 7 (SE)' },

                // ============================================================
                // STATUE PEDESTALS — 3 at blank walls (W0 E, W4 W, W6 S)
                // ============================================================
                { type: 'floor', transform: { position: [11.5, 0.55, 4.76], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 1.1 }, material: 'basalt_dark', label: 'Statue pedestal E' },
                { type: 'floor', transform: { position: [-11.5, 0.55, -4.76], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 1.1 }, material: 'basalt_dark', label: 'Statue pedestal W' },
                { type: 'floor', transform: { position: [4.76, 0.55, -11.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 1.1 }, material: 'basalt_dark', label: 'Statue pedestal S' },
            ],
            props: [
                // ============================================================
                // 8 COLUMNS at octagon vertices (interior, radius ~13.5 just inside wall)
                // Using mini_dungeon/column.glb as base; scaled to appear ~7m tall
                // ============================================================
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [13.5, 0, 0], rotation: [0, 0, 0], scale: [3.5, 4.5, 3.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Column V0' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [9.55, 0, 9.55], rotation: [0, 45, 0], scale: [3.5, 4.5, 3.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Column V1' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [0, 0, 13.5], rotation: [0, 90, 0], scale: [3.5, 4.5, 3.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Column V2' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-9.55, 0, 9.55], rotation: [0, 135, 0], scale: [3.5, 4.5, 3.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Column V3' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-13.5, 0, 0], rotation: [0, 180, 0], scale: [3.5, 4.5, 3.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Column V4' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-9.55, 0, -9.55], rotation: [0, 225, 0], scale: [3.5, 4.5, 3.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Column V5' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [0, 0, -13.5], rotation: [0, 270, 0], scale: [3.5, 4.5, 3.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Column V6' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [9.55, 0, -9.55], rotation: [0, 315, 0], scale: [3.5, 4.5, 3.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Column V7' },

                // ============================================================
                // 3 MARBLE BUSTS on statue pedestals at blank walls
                // ============================================================
                { glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf',
                  transform: { position: [11.5, 1.15, 4.76], rotation: [0, 205, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Marble bust E' },
                { glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf',
                  transform: { position: [-11.5, 1.15, -4.76], rotation: [0, 25, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Marble bust W' },
                { glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf',
                  transform: { position: [4.76, 1.15, -11.5], rotation: [0, 115, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Marble bust S' },

                // ============================================================
                // URNS at archway bases (flank each of the 5 archways, 2 per arch)
                // Using nature_kit pot_large.glb
                // Archway at mid (R=13.86). Flanks offset ±2.5m along the wall tangent.
                // Tangent for wall W1 (theta=67.5°): (-sin 67.5°, 0, cos 67.5°) = (-0.9239, 0, 0.3827)
                // ============================================================
                // W1 museum arch — tangent (-0.9239, 0, 0.3827), mid (5.30, 12.81)
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: { position: [7.61, 0, 11.85], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'Urn W1 left' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: { position: [2.99, 0, 13.77], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'Urn W1 right' },

                // W2 library arch — tangent (-0.9239, 0, -0.3827), mid (-5.30, 12.81)
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: { position: [-2.99, 0, 13.77], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'Urn W2 left' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: { position: [-7.61, 0, 11.85], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'Urn W2 right' },

                // W3 observatory arch — mid (-12.81, 5.30), tangent (-0.3827, 0, -0.9239)
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: { position: [-11.85, 0, 7.61], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'Urn W3 left' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: { position: [-13.77, 0, 2.99], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'Urn W3 right' },

                // W5 catacombs arch — mid (-5.30, -12.81), tangent (0.9239, 0, -0.3827)
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: { position: [-7.61, 0, -11.85], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'Urn W5 left' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: { position: [-2.99, 0, -13.77], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'Urn W5 right' },

                // W7 villa arch — mid (12.81, -5.30), tangent (0.3827, 0, 0.9239)
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: { position: [13.77, 0, -2.99], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'Urn W7 left' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: { position: [11.85, 0, -7.61], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'Urn W7 right' },

                // ============================================================
                // FURNITURE benches around perimeter (one beside each blank wall)
                // ============================================================
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: { position: [10.2, 0, 4.22], rotation: [0, -112.5, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Bench E' },
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: { position: [-10.2, 0, -4.22], rotation: [0, 67.5, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Bench W' },
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: { position: [4.22, 0, -10.2], rotation: [0, -22.5, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Bench S' },

                // ============================================================
                // 4 FLOOR LAMPS near spawn to light the altar area at night
                // ============================================================
                { glb: 'assets/props/kenney/furniture_kit/lampSquareFloor.glb',
                  transform: { position: [3.2, 0, 3.2], rotation: [0, 45, 0], scale: [1.3, 1.3, 1.3] },
                  cast_shadow: true, receive_shadow: true, label: 'Floor lamp NE' },
                { glb: 'assets/props/kenney/furniture_kit/lampSquareFloor.glb',
                  transform: { position: [-3.2, 0, 3.2], rotation: [0, 135, 0], scale: [1.3, 1.3, 1.3] },
                  cast_shadow: true, receive_shadow: true, label: 'Floor lamp NW' },
                { glb: 'assets/props/kenney/furniture_kit/lampSquareFloor.glb',
                  transform: { position: [3.2, 0, -3.2], rotation: [0, -45, 0], scale: [1.3, 1.3, 1.3] },
                  cast_shadow: true, receive_shadow: true, label: 'Floor lamp SE' },
                { glb: 'assets/props/kenney/furniture_kit/lampSquareFloor.glb',
                  transform: { position: [-3.2, 0, -3.2], rotation: [0, -135, 0], scale: [1.3, 1.3, 1.3] },
                  cast_shadow: true, receive_shadow: true, label: 'Floor lamp SW' },
            ],
            connectors: [],
            loci: [
                // ============================================================
                // 5 PORTAL DOORS — one in front of each archway, at ~13m radius
                // These are the core hub function: clicking them teleports to the wing
                // ============================================================
                // W1 → museum_hall (theta=67.5°, mid radius 13)
                {
                    position: [4.98, 1.8, 12.01],
                    marker_type: 'door',
                    marker_settings: { portal_target: 'museum_hall' },
                    label: 'Enter the Museum',
                    card_ids: [],
                },
                // W2 → library_tower (theta=112.5°)
                {
                    position: [-4.98, 1.8, 12.01],
                    marker_type: 'door',
                    marker_settings: { portal_target: 'library_tower' },
                    label: 'Enter the Library',
                    card_ids: [],
                },
                // W3 → observatory (theta=157.5°)
                {
                    position: [-12.01, 1.8, 4.98],
                    marker_type: 'door',
                    marker_settings: { portal_target: 'observatory' },
                    label: 'Ascend to the Observatory',
                    card_ids: [],
                },
                // W5 → catacombs (theta=247.5°)
                {
                    position: [-4.98, 1.8, -12.01],
                    marker_type: 'door',
                    marker_settings: { portal_target: 'catacombs' },
                    label: 'Descend to the Catacombs',
                    card_ids: [],
                },
                // W7 → roman_villa (theta=337.5°)
                {
                    position: [12.01, 1.8, -4.98],
                    marker_type: 'door',
                    marker_settings: { portal_target: 'roman_villa' },
                    label: 'Enter the Villa',
                    card_ids: [],
                },

                // ============================================================
                // 5 FRAME LOCI above each archway — act as floating name plaques
                // (rendered as picture-frame quads; serve as the visible labels)
                // ============================================================
                {
                    position: [5.30, 6.4, 12.81],
                    marker_type: 'frame',
                    label: 'MUSEUM HALL',
                    card_ids: [],
                },
                {
                    position: [-5.30, 6.4, 12.81],
                    marker_type: 'frame',
                    label: 'LIBRARY TOWER',
                    card_ids: [],
                },
                {
                    position: [-12.81, 6.4, 5.30],
                    marker_type: 'frame',
                    label: 'OBSERVATORY',
                    card_ids: [],
                },
                {
                    position: [-5.30, 6.4, -12.81],
                    marker_type: 'frame',
                    label: 'CATACOMBS',
                    card_ids: [],
                },
                {
                    position: [12.81, 6.4, -5.30],
                    marker_type: 'frame',
                    label: 'ROMAN VILLA',
                    card_ids: [],
                },

                // ============================================================
                // CENTRAL ALTAR FLAME — a 'glow' locus atop the bronze brazier
                // ============================================================
                {
                    position: [0, 2.3, 0],
                    marker_type: 'glow',
                    label: 'Altar flame (civic hearth)',
                    card_ids: [],
                },

                // ============================================================
                // 3 STATUE FRAME LOCI above each marble bust (engravings)
                // ============================================================
                {
                    position: [12.2, 3.2, 5.05],
                    marker_type: 'frame',
                    label: 'Inscription: PUGNABIMUS',
                    card_ids: [],
                },
                {
                    position: [-12.2, 3.2, -5.05],
                    marker_type: 'frame',
                    label: 'Inscription: MEMORIA',
                    card_ids: [],
                },
                {
                    position: [5.05, 3.2, -12.2],
                    marker_type: 'frame',
                    label: 'Inscription: CIVITAS',
                    card_ids: [],
                },

                // ============================================================
                // 8 COLUMN ORB LOCI — one at ~2.5m height beside each column
                // (distinct 'orb' hero loci at each octagon vertex for navigation cues)
                // ============================================================
                { position: [12.8, 2.6, 0], marker_type: 'orb', label: 'Column V0 orb', card_ids: [] },
                { position: [9.05, 2.6, 9.05], marker_type: 'orb', label: 'Column V1 orb', card_ids: [] },
                { position: [0, 2.6, 12.8], marker_type: 'orb', label: 'Column V2 orb', card_ids: [] },
                { position: [-9.05, 2.6, 9.05], marker_type: 'orb', label: 'Column V3 orb', card_ids: [] },
                { position: [-12.8, 2.6, 0], marker_type: 'orb', label: 'Column V4 orb', card_ids: [] },
                { position: [-9.05, 2.6, -9.05], marker_type: 'orb', label: 'Column V5 orb', card_ids: [] },
                { position: [0, 2.6, -12.8], marker_type: 'orb', label: 'Column V6 orb', card_ids: [] },
                { position: [9.05, 2.6, -9.05], marker_type: 'orb', label: 'Column V7 orb', card_ids: [] },

                // ============================================================
                // 6 PEDESTAL LOCI around the altar rim — civic offerings ring
                // ============================================================
                { position: [2.2, 1.7, 0], marker_type: 'pedestal', label: 'Altar offering E', card_ids: [] },
                { position: [-2.2, 1.7, 0], marker_type: 'pedestal', label: 'Altar offering W', card_ids: [] },
                { position: [0, 1.7, 2.2], marker_type: 'pedestal', label: 'Altar offering N', card_ids: [] },
                { position: [0, 1.7, -2.2], marker_type: 'pedestal', label: 'Altar offering S', card_ids: [] },
                { position: [1.55, 1.7, 1.55], marker_type: 'pedestal', label: 'Altar offering NE', card_ids: [] },
                { position: [-1.55, 1.7, -1.55], marker_type: 'pedestal', label: 'Altar offering SW', card_ids: [] },
            ],
        };
        return t;
    },
    _romanVilla() {
        // -------------------------------------------------------------------
        // SHARED DATA: 28 peristyle column positions (used by both props and
        // _columnLoci so the loci always line up with the visible columns).
        // South row 8 + North row 8 + East row 6 + West row 6 = 28.
        // -------------------------------------------------------------------
        const COL_POS = [
            // South row (8)
            [-10.5, 0, 11.7], [-7.5, 0, 11.7], [-4.5, 0, 11.7], [-1.5, 0, 11.7],
            [ 1.5, 0, 11.7], [ 4.5, 0, 11.7], [ 7.5, 0, 11.7], [10.5, 0, 11.7],
            // North row (8)
            [-10.5, 0, -11.7], [-7.5, 0, -11.7], [-4.5, 0, -11.7], [-1.5, 0, -11.7],
            [ 1.5, 0, -11.7], [ 4.5, 0, -11.7], [ 7.5, 0, -11.7], [10.5, 0, -11.7],
            // East row (6, skip corners)
            [11.7, 0, -8.0], [11.7, 0, -4.5], [11.7, 0, -1.5],
            [11.7, 0,  1.5], [11.7, 0,  4.5], [11.7, 0,  8.0],
            // West row (6, skip corners)
            [-11.7, 0, -8.0], [-11.7, 0, -4.5], [-11.7, 0, -1.5],
            [-11.7, 0,  1.5], [-11.7, 0,  4.5], [-11.7, 0,  8.0],
        ];

        const t = {
            meta: {
                id: 'roman_villa',
                name: 'Roman Villa',
                desc: 'Multi-story Mediterranean villa urbana: enclosed peristyle atrium with oak-coffered ceiling, upper cubicula, triclinium, bath, tablinum study, and a walled cypress grove garden',
                // Spawn INSIDE the peristyle, south edge, looking north across the
                // fountain toward the tablinum doorway — same as current version.
                spawn_point: { position: [0, 1.6, 9], rotation_y: 0 },
                scale: 1.0,
            },
            environment: {
                // The villa is now a fully enclosed interior. HDRI is kept for
                // reflection lighting only; background=false so we don't render
                // the sky through the oculus placeholder.
                hdri: 'assets/hdri/circus_maximus_2_2k.hdr',
                hdri_intensity: 1.1,
                hdri_as_background: false,
                fog: { color: 0x1a120a, near: 180, far: 500 },
                sun: { position: [70, 120, 50], intensity: 1.4, color: 0xffeedd, cast_shadow: true, shadow_bounds: 140 },
                ambient: { intensity: 0.45 },
            },
            materials: {
                marble_white: {
                    albedo: 'assets/textures/marble_white/albedo_2k.jpg',
                    normal: 'assets/textures/marble_white/normal_2k.jpg',
                    roughness: 'assets/textures/marble_white/roughness_2k.jpg',
                    ao: 'assets/textures/marble_white/ao_2k.jpg',
                    repeat: [6, 6],
                    roughness_scale: 0.8,
                    metalness: 0,
                },
                travertine_stone: {
                    albedo: 'assets/textures/travertine_stone/albedo_2k.jpg',
                    normal: 'assets/textures/travertine_stone/normal_2k.jpg',
                    roughness: 'assets/textures/travertine_stone/roughness_2k.jpg',
                    ao: 'assets/textures/travertine_stone/ao_2k.jpg',
                    repeat: [4, 4],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                plaster_cream: {
                    albedo: 'assets/textures/plaster_cream/albedo_2k.jpg',
                    normal: 'assets/textures/plaster_cream/normal_2k.jpg',
                    roughness: 'assets/textures/plaster_cream/roughness_2k.jpg',
                    ao: 'assets/textures/plaster_cream/ao_2k.jpg',
                    repeat: [3, 3],
                    roughness_scale: 1.0,
                    metalness: 0,
                    color_tint: 0xf0e6cc,
                },
                oak_plank_warm: {
                    albedo: 'assets/textures/oak_plank_warm/albedo_2k.jpg',
                    normal: 'assets/textures/oak_plank_warm/normal_2k.jpg',
                    roughness: 'assets/textures/oak_plank_warm/roughness_2k.jpg',
                    ao: 'assets/textures/oak_plank_warm/ao_2k.jpg',
                    repeat: [3, 3],
                    roughness_scale: 0.9,
                    metalness: 0,
                },
                oak_beam_dark: {
                    albedo: 'assets/textures/oak_beam_dark/albedo_2k.jpg',
                    normal: 'assets/textures/oak_beam_dark/normal_2k.jpg',
                    roughness: 'assets/textures/oak_beam_dark/roughness_2k.jpg',
                    ao: 'assets/textures/oak_beam_dark/ao_2k.jpg',
                    repeat: [2, 2],
                    roughness_scale: 0.95,
                    metalness: 0,
                },
                terracotta_tile: {
                    albedo: 'assets/textures/terracotta_tile/albedo_2k.jpg',
                    normal: 'assets/textures/terracotta_tile/normal_2k.jpg',
                    roughness: 'assets/textures/terracotta_tile/roughness_2k.jpg',
                    ao: 'assets/textures/terracotta_tile/ao_2k.jpg',
                    repeat: [5, 5],
                    roughness_scale: 0.85,
                    metalness: 0,
                    color_tint: 0xd06030,
                },
                grass_field: {
                    albedo: 'assets/textures/grass_field/albedo_2k.jpg',
                    normal: 'assets/textures/grass_field/normal_2k.jpg',
                    roughness: 'assets/textures/grass_field/roughness_2k.jpg',
                    ao: 'assets/textures/grass_field/ao_2k.jpg',
                    repeat: [20, 20],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                bronze_trim: {
                    albedo: 'assets/textures/bronze_trim/albedo_2k.jpg',
                    normal: 'assets/textures/bronze_trim/normal_2k.jpg',
                    roughness: 'assets/textures/bronze_trim/roughness_2k.jpg',
                    ao: null,
                    repeat: [1, 1],
                    roughness_scale: 0.35,
                    metalness: 0.9,
                    color_tint: 0xb88844,
                },
            },
            surfaces: [
                // ============================================================
                // EXTERIOR SHELL FLOOR (100m x 100m travertine slab — the villa
                // sits inside an enclosing interior, so this is the base floor)
                { type: 'floor', transform: {position:[0,-0.05,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:100, height:100, depth:0.3}, material: 'travertine_stone', label: 'Villa base floor' },

                // ============================================================
                // PERISTYLE COURTYARD (now an ENCLOSED atrium: 24m x 24m marble
                // floor, oak-beam coffered ceiling at y=8, central oculus)
                { type: 'floor', transform: {position:[0,0.05,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:24, height:24, depth:0.35}, material: 'marble_white', label: 'Peristyle courtyard floor' },
                // Stylobate (raised column base strip) on each side, 0.5m tall
                { type: 'wall', transform: {position:[0,0.35,11.7], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:24, height:0.6, depth:0.5}, material: 'travertine_stone', label: 'Stylobate south' },
                { type: 'wall', transform: {position:[0,0.35,-11.7], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:24, height:0.6, depth:0.5}, material: 'travertine_stone', label: 'Stylobate north' },
                { type: 'wall', transform: {position:[11.7,0.35,0], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:24, height:0.6, depth:0.5}, material: 'travertine_stone', label: 'Stylobate east' },
                { type: 'wall', transform: {position:[-11.7,0.35,0], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:24, height:0.6, depth:0.5}, material: 'travertine_stone', label: 'Stylobate west' },

                // ---- COFFERED OAK-BEAM CEILING over peristyle at y=8 ----
                // Four ring panels surrounding a central 4m x 4m oculus opening.
                { type: 'ceiling', transform: {position:[0,8,9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:24, height:6, depth:0.2}, material: 'oak_beam_dark', label: 'Peristyle ceiling S panel' },
                { type: 'ceiling', transform: {position:[0,8,-9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:24, height:6, depth:0.2}, material: 'oak_beam_dark', label: 'Peristyle ceiling N panel' },
                { type: 'ceiling', transform: {position:[-10,8,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:4, height:12, depth:0.2}, material: 'oak_beam_dark', label: 'Peristyle ceiling W panel' },
                { type: 'ceiling', transform: {position:[10,8,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:4, height:12, depth:0.2}, material: 'oak_beam_dark', label: 'Peristyle ceiling E panel' },
                // Decorative terracotta trim above beams (reads as painted coffer insets)
                { type: 'ceiling', transform: {position:[0,8.22,9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:22, height:5, depth:0.08}, material: 'terracotta_tile', label: 'Peristyle coffer trim S' },
                { type: 'ceiling', transform: {position:[0,8.22,-9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:22, height:5, depth:0.08}, material: 'terracotta_tile', label: 'Peristyle coffer trim N' },

                // ---- FOUNTAIN (6m outer diameter, dominant centerpiece) ----
                { type: 'floor', transform: {position:[0,0.4,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:6, height:6, depth:0.8}, material: 'travertine_stone', label: 'Fountain outer basin' },
                { type: 'floor', transform: {position:[0,0.82,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:5.6, height:5.6, depth:0.1}, material: 'bronze_trim', label: 'Fountain water surface' },
                { type: 'floor', transform: {position:[0,1.0,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:2.6, height:2.6, depth:0.5}, material: 'marble_white', label: 'Fountain mid pedestal' },
                { type: 'wall', transform: {position:[0,2.0,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:0.6, height:2.4, depth:0.6}, material: 'marble_white', label: 'Fountain column' },
                { type: 'floor', transform: {position:[0,3.3,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:2.0, height:2.0, depth:0.3}, material: 'travertine_stone', label: 'Fountain upper bowl' },
                { type: 'floor', transform: {position:[0,3.5,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:1.6, height:1.6, depth:0.08}, material: 'bronze_trim', label: 'Fountain upper water' },

                // ============================================================
                // ATRIUM (south hall, 18m x 12m, two-story)
                { type: 'floor', transform: {position:[0,0.05,22], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:18, height:12, depth:0.3}, material: 'marble_white', label: 'Atrium floor' },
                // Ground-floor walls — north wall split for doorway to peristyle
                { type: 'wall', transform: {position:[-7,2.5,16.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:4, height:5, depth:0.3}, material: 'plaster_cream', label: 'Atrium north wall (west)' },
                { type: 'wall', transform: {position:[7,2.5,16.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:4, height:5, depth:0.3}, material: 'plaster_cream', label: 'Atrium north wall (east)' },
                { type: 'wall', transform: {position:[0,4.5,16.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:10, height:1, depth:0.3}, material: 'travertine_stone', label: 'Atrium north lintel' },
                { type: 'wall', transform: {position:[0,2.5,27.9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:18, height:5, depth:0.3}, material: 'travertine_stone', label: 'Atrium south wall' },
                { type: 'wall', transform: {position:[9.1,2.5,22], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Atrium east wall' },
                { type: 'wall', transform: {position:[-9.1,2.5,22], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Atrium west wall' },
                // Second floor — UPPER ATRIUM slab at y=6
                { type: 'floor', transform: {position:[0,6,22], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:18, height:12, depth:0.25}, material: 'oak_plank_warm', label: 'Upper atrium floor' },
                // Upper walls
                { type: 'wall', transform: {position:[0,8.5,16.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:18, height:5, depth:0.3}, material: 'plaster_cream', label: 'Upper atrium north wall' },
                { type: 'wall', transform: {position:[0,8.5,27.9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:18, height:5, depth:0.3}, material: 'plaster_cream', label: 'Upper atrium south wall' },
                { type: 'wall', transform: {position:[9.1,8.5,22], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Upper atrium east wall' },
                { type: 'wall', transform: {position:[-9.1,8.5,22], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Upper atrium west wall' },
                { type: 'ceiling', transform: {position:[0,11,22], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:18, height:12, depth:0.2}, material: 'oak_beam_dark', label: 'Upper atrium ceiling' },

                // ============================================================
                // TABLINUM (north study, 14m x 8m, two-story)
                { type: 'floor', transform: {position:[0,0.05,-18], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:8, depth:0.3}, material: 'marble_white', label: 'Tablinum floor' },
                { type: 'wall', transform: {position:[-5,2.5,-14.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:4, height:5, depth:0.3}, material: 'plaster_cream', label: 'Tablinum south wall (west)' },
                { type: 'wall', transform: {position:[5,2.5,-14.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:4, height:5, depth:0.3}, material: 'plaster_cream', label: 'Tablinum south wall (east)' },
                { type: 'wall', transform: {position:[0,4.5,-14.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:6, height:1, depth:0.3}, material: 'travertine_stone', label: 'Tablinum south lintel' },
                { type: 'wall', transform: {position:[0,2.5,-21.9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'travertine_stone', label: 'Tablinum north wall' },
                { type: 'wall', transform: {position:[7.1,2.5,-18], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:8, height:5, depth:0.3}, material: 'plaster_cream', label: 'Tablinum east wall' },
                { type: 'wall', transform: {position:[-7.1,2.5,-18], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:8, height:5, depth:0.3}, material: 'plaster_cream', label: 'Tablinum west wall' },
                // Upper tablinum slab at y=6
                { type: 'floor', transform: {position:[0,6,-18], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:8, depth:0.25}, material: 'oak_plank_warm', label: 'Upper tablinum floor' },
                { type: 'wall', transform: {position:[0,8.5,-14.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'plaster_cream', label: 'Upper tablinum south wall' },
                { type: 'wall', transform: {position:[0,8.5,-21.9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'plaster_cream', label: 'Upper tablinum north wall' },
                { type: 'wall', transform: {position:[7.1,8.5,-18], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:8, height:5, depth:0.3}, material: 'plaster_cream', label: 'Upper tablinum east wall' },
                { type: 'wall', transform: {position:[-7.1,8.5,-18], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:8, height:5, depth:0.3}, material: 'plaster_cream', label: 'Upper tablinum west wall' },
                { type: 'ceiling', transform: {position:[0,11,-18], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:8, depth:0.2}, material: 'oak_beam_dark', label: 'Upper tablinum ceiling' },

                // ============================================================
                // TRICLINIUM (east dining room, 14m x 14m)
                { type: 'floor', transform: {position:[22,0.05,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:14, depth:0.3}, material: 'oak_plank_warm', label: 'Triclinium floor' },
                { type: 'wall', transform: {position:[15.1,2.5,-4], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:5, height:5, depth:0.3}, material: 'plaster_cream', label: 'Triclinium west wall (north)' },
                { type: 'wall', transform: {position:[15.1,2.5,4], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:5, height:5, depth:0.3}, material: 'plaster_cream', label: 'Triclinium west wall (south)' },
                { type: 'wall', transform: {position:[15.1,4.5,0], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:4, height:1, depth:0.3}, material: 'travertine_stone', label: 'Triclinium west lintel' },
                { type: 'wall', transform: {position:[28.9,2.5,0], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'travertine_stone', label: 'Triclinium east wall' },
                { type: 'wall', transform: {position:[22,2.5,-7.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'plaster_cream', label: 'Triclinium north wall' },
                { type: 'wall', transform: {position:[22,2.5,7.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'plaster_cream', label: 'Triclinium south wall' },
                { type: 'ceiling', transform: {position:[22,5.2,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:14, depth:0.2}, material: 'oak_beam_dark', label: 'Triclinium ceiling beams' },

                // ============================================================
                // CUBICULUM (west bedroom, 12m x 12m, two-story)
                { type: 'floor', transform: {position:[-22,0.05,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:12, height:12, depth:0.3}, material: 'oak_plank_warm', label: 'Cubiculum floor' },
                { type: 'wall', transform: {position:[-15.1,2.5,-4], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:4, height:5, depth:0.3}, material: 'plaster_cream', label: 'Cubiculum east wall (north)' },
                { type: 'wall', transform: {position:[-15.1,2.5,4], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:4, height:5, depth:0.3}, material: 'plaster_cream', label: 'Cubiculum east wall (south)' },
                { type: 'wall', transform: {position:[-28.1,2.5,0], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'travertine_stone', label: 'Cubiculum west wall' },
                { type: 'wall', transform: {position:[-22,2.5,-6.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Cubiculum north wall' },
                { type: 'wall', transform: {position:[-22,2.5,6.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Cubiculum south wall' },
                // Upper cubiculum slab at y=6
                { type: 'floor', transform: {position:[-22,6,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:12, height:12, depth:0.25}, material: 'oak_plank_warm', label: 'Upper cubiculum floor' },
                { type: 'wall', transform: {position:[-15.1,8.5,0], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Upper cubiculum east wall' },
                { type: 'wall', transform: {position:[-28.1,8.5,0], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Upper cubiculum west wall' },
                { type: 'wall', transform: {position:[-22,8.5,-6.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Upper cubiculum north wall' },
                { type: 'wall', transform: {position:[-22,8.5,6.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Upper cubiculum south wall' },
                { type: 'ceiling', transform: {position:[-22,11,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:12, height:12, depth:0.2}, material: 'oak_beam_dark', label: 'Upper cubiculum ceiling' },

                // ============================================================
                // BATH COMPLEX (north-west, 14m x 8m)
                { type: 'floor', transform: {position:[-20,0.05,-20], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:8, depth:0.3}, material: 'travertine_stone', label: 'Bath floor' },
                { type: 'floor', transform: {position:[-20,0.08,-20], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:8, height:4, depth:0.1}, material: 'bronze_trim', label: 'Caldarium pool water' },
                { type: 'wall', transform: {position:[-20,2.5,-16.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'plaster_cream', label: 'Bath south wall' },
                { type: 'wall', transform: {position:[-20,2.5,-23.9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'travertine_stone', label: 'Bath north wall' },
                { type: 'wall', transform: {position:[-13.1,2.5,-20], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:8, height:5, depth:0.3}, material: 'plaster_cream', label: 'Bath east wall' },
                { type: 'wall', transform: {position:[-26.9,2.5,-20], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:8, height:5, depth:0.3}, material: 'travertine_stone', label: 'Bath west wall' },
                { type: 'ceiling', transform: {position:[-20,5.2,-20], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:8, depth:0.2}, material: 'oak_beam_dark', label: 'Bath ceiling' },

                // ============================================================
                // WEST GARDEN / CYPRESS GROVE (third courtyard, 20m x 24m)
                // The villa's private hortus with a grass patch and rock-ring
                // statue. Enclosed by perimeter walls so it's still "interior"
                // of the overall palace shell.
                { type: 'floor', transform: {position:[-34,0.05,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:20, height:24, depth:0.3}, material: 'grass_field', label: 'West garden lawn' },
                { type: 'floor', transform: {position:[-30,0.08,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:8, height:8, depth:0.1}, material: 'travertine_stone', label: 'West garden central plaza' },
                { type: 'floor', transform: {position:[-30,0.45,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:1.4, height:1.4, depth:0.8}, material: 'marble_white', label: 'West garden plinth' },
                // Perimeter walls enclosing the west garden
                { type: 'wall', transform: {position:[-34,3,-12.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:20, height:6, depth:0.4}, material: 'travertine_stone', label: 'Garden north wall' },
                { type: 'wall', transform: {position:[-34,3,12.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:20, height:6, depth:0.4}, material: 'travertine_stone', label: 'Garden south wall' },
                { type: 'wall', transform: {position:[-44.1,3,0], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:24, height:6, depth:0.4}, material: 'travertine_stone', label: 'Garden west wall' },
                // East wall of garden is shared with cubiculum (already a wall)
                { type: 'ceiling', transform: {position:[-34,9,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:20, height:24, depth:0.25}, material: 'oak_beam_dark', label: 'Garden ceiling' },

                // ============================================================
                // OUTER VILLA SHELL (perimeter walls enclosing everything at
                // y=12, giving the whole thing a single interior envelope)
                { type: 'wall', transform: {position:[0,6,45.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:100, height:12, depth:0.5}, material: 'travertine_stone', label: 'Villa south shell' },
                { type: 'wall', transform: {position:[0,6,-45.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:100, height:12, depth:0.5}, material: 'travertine_stone', label: 'Villa north shell' },
                { type: 'wall', transform: {position:[45.1,6,0], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:90, height:12, depth:0.5}, material: 'travertine_stone', label: 'Villa east shell' },
                { type: 'wall', transform: {position:[-45.1,6,-30], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:30, height:12, depth:0.5}, material: 'travertine_stone', label: 'Villa west shell N' },
                { type: 'wall', transform: {position:[-45.1,6,30], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:30, height:12, depth:0.5}, material: 'travertine_stone', label: 'Villa west shell S' },
                // Upper ceiling over the outer halls (everything except peristyle
                // which has its own coffer and garden which has its own ceiling)
                { type: 'ceiling', transform: {position:[30,12,22], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:30, height:44, depth:0.3}, material: 'oak_beam_dark', label: 'Villa outer ceiling SE' },
                { type: 'ceiling', transform: {position:[-30,12,30], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:30, height:30, depth:0.3}, material: 'oak_beam_dark', label: 'Villa outer ceiling SW' },
                { type: 'ceiling', transform: {position:[30,12,-22], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:30, height:40, depth:0.3}, material: 'oak_beam_dark', label: 'Villa outer ceiling NE' },

                // ============================================================
                // PERISTYLE AMBULATORY (interior walk between columns and rooms)
                { type: 'floor', transform: {position:[0,0.06,14], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:24, height:4, depth:0.15}, material: 'marble_white', label: 'Peristyle south ambulatory' },
                { type: 'floor', transform: {position:[0,0.06,-14], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:24, height:4, depth:0.15}, material: 'marble_white', label: 'Peristyle north ambulatory' },
                { type: 'floor', transform: {position:[14,0.06,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:4, height:24, depth:0.15}, material: 'marble_white', label: 'Peristyle east ambulatory' },
                { type: 'floor', transform: {position:[-14,0.06,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:4, height:24, depth:0.15}, material: 'marble_white', label: 'Peristyle west ambulatory' },
            ],
            props: [
                // ============================================================
                // PERISTYLE COLUMNS (28 visible statue_columns — same list as
                // COL_POS above, driving both visual and locus alignment)
                ...COL_POS.map((p, i) => ({
                    glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                    transform: {position:[p[0], 0.65, p[2]], rotation:[0,0,0], scale:[1.6, 3.0, 1.6]},
                    cast_shadow: true, receive_shadow: true,
                    label: `Peristyle column ${i + 1}`,
                })),

                // ============================================================
                // URNS at corner column bases
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: {position:[-10.5,0.65,10.4], rotation:[0,0,0], scale:[1.3,1.3,1.3]},
                  cast_shadow: true, receive_shadow: true, label: 'Urn SW corner' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: {position:[10.5,0.65,10.4], rotation:[0,0,0], scale:[1.3,1.3,1.3]},
                  cast_shadow: true, receive_shadow: true, label: 'Urn SE corner' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: {position:[-10.5,0.65,-10.4], rotation:[0,0,0], scale:[1.3,1.3,1.3]},
                  cast_shadow: true, receive_shadow: true, label: 'Urn NW corner' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: {position:[10.5,0.65,-10.4], rotation:[0,0,0], scale:[1.3,1.3,1.3]},
                  cast_shadow: true, receive_shadow: true, label: 'Urn NE corner' },
                { glb: 'assets/props/kenney/nature_kit/pot_small.glb',
                  transform: {position:[-10.4,0.65,0], rotation:[0,0,0], scale:[1.3,1.3,1.3]},
                  cast_shadow: true, receive_shadow: true, label: 'Urn west mid' },
                { glb: 'assets/props/kenney/nature_kit/pot_small.glb',
                  transform: {position:[10.4,0.65,0], rotation:[0,0,0], scale:[1.3,1.3,1.3]},
                  cast_shadow: true, receive_shadow: true, label: 'Urn east mid' },

                // ============================================================
                // BRAZIERS inside courtyard
                { glb: 'assets/props/kenney/nature_kit/campfire_bricks.glb',
                  transform: {position:[-6,0.1,6], rotation:[0,0,0], scale:[1.2,1.2,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Brazier SW' },
                { glb: 'assets/props/kenney/nature_kit/campfire_bricks.glb',
                  transform: {position:[6,0.1,6], rotation:[0,0,0], scale:[1.2,1.2,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Brazier SE' },
                { glb: 'assets/props/kenney/nature_kit/campfire_bricks.glb',
                  transform: {position:[-6,0.1,-6], rotation:[0,0,0], scale:[1.2,1.2,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Brazier NW' },
                { glb: 'assets/props/kenney/nature_kit/campfire_bricks.glb',
                  transform: {position:[6,0.1,-6], rotation:[0,0,0], scale:[1.2,1.2,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Brazier NE' },

                // ============================================================
                // MARBLE STAIRS to upper floors
                { glb: 'assets/props/kenney/furniture_kit/stairs.glb',
                  transform: {position:[-6,0.1,16], rotation:[0,3.14159,0], scale:[2.0,2.0,2.0]},
                  cast_shadow: true, receive_shadow: true, label: 'Upper atrium stair' },
                { glb: 'assets/props/kenney/furniture_kit/stairs.glb',
                  transform: {position:[-18,0.1,-4], rotation:[0,1.5708,0], scale:[2.0,2.0,2.0]},
                  cast_shadow: true, receive_shadow: true, label: 'Upper cubiculum stair' },
                { glb: 'assets/props/kenney/furniture_kit/stairs.glb',
                  transform: {position:[-4,0.1,-16], rotation:[0,0,0], scale:[2.0,2.0,2.0]},
                  cast_shadow: true, receive_shadow: true, label: 'Upper tablinum stair' },

                // ============================================================
                // WEST GARDEN GROVE (cypress pines + rocks + bushes)
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallA.glb',
                  transform: {position:[-38,0,-10], rotation:[0,0,0], scale:[1.2,3.0,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Grove cypress NW' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallB.glb',
                  transform: {position:[-38,0,10], rotation:[0,0,0], scale:[1.2,3.0,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Grove cypress SW' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallC.glb',
                  transform: {position:[-38,0,0], rotation:[0,0,0], scale:[1.2,3.0,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Grove cypress W' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallD.glb',
                  transform: {position:[-30,0,-10], rotation:[0,0,0], scale:[1.2,3.0,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Grove cypress NE' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallA.glb',
                  transform: {position:[-30,0,10], rotation:[0,0,0], scale:[1.2,3.0,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Grove cypress SE' },
                { glb: 'assets/props/kenney/nature_kit/statue_obelisk.glb',
                  transform: {position:[-30,1.05,0], rotation:[0,0,0], scale:[1.8,1.8,1.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Grove central statue' },
                { glb: 'assets/props/kenney/nature_kit/rock_largeA.glb',
                  transform: {position:[-36,0,4], rotation:[0,0.7,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Grove rock NW' },
                { glb: 'assets/props/kenney/nature_kit/rock_largeB.glb',
                  transform: {position:[-36,0,-4], rotation:[0,1.2,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Grove rock SW' },
                { glb: 'assets/props/kenney/nature_kit/rock_largeC.glb',
                  transform: {position:[-32,0,8], rotation:[0,2.1,0], scale:[1.3,1.3,1.3]},
                  cast_shadow: true, receive_shadow: true, label: 'Grove rock SE' },
                { glb: 'assets/props/kenney/nature_kit/rock_largeD.glb',
                  transform: {position:[-32,0,-8], rotation:[0,0.3,0], scale:[1.3,1.3,1.3]},
                  cast_shadow: true, receive_shadow: true, label: 'Grove rock NE' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushLarge.glb',
                  transform: {position:[-40,0,6], rotation:[0,0,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Grove bush W1' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushLarge.glb',
                  transform: {position:[-40,0,-6], rotation:[0,0,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Grove bush W2' },
                { glb: 'assets/props/kenney/nature_kit/flower_redA.glb',
                  transform: {position:[-28,0,5], rotation:[0,0,0], scale:[1.5,1.5,1.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Grove flower red' },
                { glb: 'assets/props/kenney/nature_kit/flower_yellowA.glb',
                  transform: {position:[-28,0,-5], rotation:[0,0,0], scale:[1.5,1.5,1.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Grove flower yellow' },

                // ============================================================
                // TRICLINIUM FURNITURE
                { glb: 'assets/props/kenney/furniture_kit/tableCross.glb',
                  transform: {position:[22,0.15,0], rotation:[0,0,0], scale:[1.8,1.8,1.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium table' },
                { glb: 'assets/props/kenney/furniture_kit/benchCushion.glb',
                  transform: {position:[22,0.15,-3], rotation:[0,0,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium couch N' },
                { glb: 'assets/props/kenney/furniture_kit/benchCushion.glb',
                  transform: {position:[22,0.15,3], rotation:[0,3.14159,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium couch S' },
                { glb: 'assets/props/kenney/furniture_kit/benchCushionLow.glb',
                  transform: {position:[25,0.15,0], rotation:[0,1.5708,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium couch E' },
                { glb: 'assets/props/kenney/furniture_kit/lampRoundFloor.glb',
                  transform: {position:[18,0.15,-5], rotation:[0,0,0], scale:[1.3,1.3,1.3]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium lamp NW' },
                { glb: 'assets/props/kenney/furniture_kit/lampRoundFloor.glb',
                  transform: {position:[18,0.15,5], rotation:[0,0,0], scale:[1.3,1.3,1.3]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium lamp SW' },

                // CUBICULUM FURNITURE
                { glb: 'assets/props/kenney/furniture_kit/bedSingle.glb',
                  transform: {position:[-24,0.15,2], rotation:[0,1.5708,0], scale:[1.7,1.7,1.7]},
                  cast_shadow: true, receive_shadow: true, label: 'Cubiculum bed' },
                { glb: 'assets/props/kenney/furniture_kit/sideTable.glb',
                  transform: {position:[-24,0.15,-2], rotation:[0,0,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Cubiculum side table' },
                { glb: 'assets/props/kenney/furniture_kit/rugRectangle.glb',
                  transform: {position:[-20,0.08,0], rotation:[0,0,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: false, receive_shadow: true, label: 'Cubiculum rug' },

                // TABLINUM FURNITURE
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',
                  transform: {position:[0,0.15,-18], rotation:[0,0,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Tablinum desk' },
                { glb: 'assets/props/kenney/furniture_kit/chair.glb',
                  transform: {position:[0,0.15,-16], rotation:[0,3.14159,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Tablinum chair' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb',
                  transform: {position:[-5,0.15,-21], rotation:[0,0,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Tablinum bookcase W' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb',
                  transform: {position:[5,0.15,-21], rotation:[0,0,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Tablinum bookcase E' },

                // ATRIUM FURNITURE
                { glb: 'assets/props/kenney/furniture_kit/rugRectangle.glb',
                  transform: {position:[0,0.08,22], rotation:[0,0,0], scale:[2.0,2.0,2.0]},
                  cast_shadow: false, receive_shadow: true, label: 'Atrium rug' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: {position:[-7,0.08,25], rotation:[0,0,0], scale:[1.3,1.3,1.3]},
                  cast_shadow: true, receive_shadow: true, label: 'Atrium urn SW' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: {position:[7,0.08,25], rotation:[0,0,0], scale:[1.3,1.3,1.3]},
                  cast_shadow: true, receive_shadow: true, label: 'Atrium urn SE' },

                // UPPER ATRIUM FURNITURE
                { glb: 'assets/props/kenney/furniture_kit/bedDouble.glb',
                  transform: {position:[-4,6.15,22], rotation:[0,1.5708,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Upper atrium bed' },
                { glb: 'assets/props/kenney/furniture_kit/chairCushion.glb',
                  transform: {position:[4,6.15,22], rotation:[0,3.14159,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Upper atrium reading chair' },

                // UPPER CUBICULUM FURNITURE
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',
                  transform: {position:[-26,6.15,-3], rotation:[0,1.5708,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Upper cubiculum scroll shelf' },
                { glb: 'assets/props/kenney/furniture_kit/sideTableDrawers.glb',
                  transform: {position:[-22,6.15,3], rotation:[0,0,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Upper cubiculum chest' },

                // UPPER TABLINUM FURNITURE
                { glb: 'assets/props/kenney/furniture_kit/deskCorner.glb',
                  transform: {position:[0,6.15,-18], rotation:[0,0,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Upper tablinum map desk' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpenLow.glb',
                  transform: {position:[-4,6.15,-21], rotation:[0,0,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Upper tablinum shelf' },

                // BATH FURNITURE
                { glb: 'assets/props/kenney/furniture_kit/bathtub.glb',
                  transform: {position:[-16,0.15,-20], rotation:[0,1.5708,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Bath tub 1' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: {position:[-24,0.15,-16.5], rotation:[0,0,0], scale:[1.2,1.2,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Bath urn NW' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: {position:[-24,0.15,-23.5], rotation:[0,0,0], scale:[1.2,1.2,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Bath urn SW' },

                // GATE / ENTRANCE STATUES flanking atrium's south entry
                { glb: 'assets/props/kenney/nature_kit/statue_head.glb',
                  transform: {position:[-8,0.08,26], rotation:[0,0,0], scale:[1.5,1.5,1.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Entrance statue W' },
                { glb: 'assets/props/kenney/nature_kit/statue_head.glb',
                  transform: {position:[8,0.08,26], rotation:[0,0,0], scale:[1.5,1.5,1.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Entrance statue E' },
            ],
            connectors: [],
            loci: [
                // ============================================================
                // HAND-PLACED HERO LOCI (distinct-mesh markers). Keep under ~30
                // of these — rest are procedural orb fields below.
                // ============================================================

                // --- RETURN PORTAL (exactly ONE door near spawn) ---
                {
                    position: [0, 1.5, 7.5],
                    marker_type: 'door',
                    marker_settings: { portal_target: 'forum' },
                    label: 'Return to The Forum',
                    card_ids: [],
                },

                // --- Peristyle hero loci ---
                { position: [0, 1.5, 0], marker_type: 'pedestal', label: 'Peristyle: central fountain' },
                { position: [0, 4.0, 0], marker_type: 'glow', label: 'Peristyle: fountain upper bowl' },
                { position: [-10, 1.5, 10], marker_type: 'pedestal', label: 'Peristyle: SW corner urn' },
                { position: [10, 1.5, 10], marker_type: 'pedestal', label: 'Peristyle: SE corner urn' },
                { position: [-10, 1.5, -10], marker_type: 'pedestal', label: 'Peristyle: NW corner urn' },
                { position: [10, 1.5, -10], marker_type: 'pedestal', label: 'Peristyle: NE corner urn' },
                { position: [0, 7.8, 0], marker_type: 'frame', label: 'Peristyle oculus skylight' },

                // --- Atrium (ground) hero loci ---
                { position: [0, 1.5, 22], marker_type: 'pedestal', label: 'Atrium: center rug' },
                { position: [-7, 1.5, 25], marker_type: 'statue', label: 'Atrium: west urn' },
                { position: [7, 1.5, 25], marker_type: 'statue', label: 'Atrium: east urn' },
                { position: [0, 1.5, 16], marker_type: 'frame', label: 'Atrium: peristyle doorway' },

                // --- Upper atrium hero ---
                { position: [0, 7.5, 22], marker_type: 'pedestal', label: 'Upper atrium: master bed' },
                { position: [-9, 7.5, 22], marker_type: 'frame', label: 'Upper atrium: west fresco' },
                { position: [9, 7.5, 22], marker_type: 'frame', label: 'Upper atrium: east fresco' },

                // --- Tablinum (ground) hero ---
                { position: [0, 1.5, -18], marker_type: 'pedestal', label: 'Tablinum: scholar desk' },
                { position: [-5, 1.5, -21], marker_type: 'frame', label: 'Tablinum: west bookcase' },
                { position: [5, 1.5, -21], marker_type: 'frame', label: 'Tablinum: east bookcase' },
                { position: [0, 1.5, -14], marker_type: 'frame', label: 'Tablinum: peristyle doorway' },

                // --- Upper tablinum hero ---
                { position: [0, 7.5, -18], marker_type: 'pedestal', label: 'Upper tablinum: map desk' },
                { position: [-4, 7.5, -21], marker_type: 'frame', label: 'Upper tablinum: strategy shelf' },

                // --- Triclinium hero ---
                { position: [22, 1.5, 0], marker_type: 'pedestal', label: 'Triclinium: dining table' },
                { position: [22, 1.5, -3], marker_type: 'pedestal', label: 'Triclinium: north couch' },
                { position: [22, 1.5, 3], marker_type: 'pedestal', label: 'Triclinium: south couch' },
                { position: [25, 1.5, 0], marker_type: 'pedestal', label: 'Triclinium: east couch' },
                { position: [15, 1.5, 0], marker_type: 'frame', label: 'Triclinium: peristyle doorway' },

                // --- Cubiculum (ground) hero ---
                { position: [-24, 1.5, 2], marker_type: 'pedestal', label: 'Cubiculum: bed' },
                { position: [-24, 1.5, -2], marker_type: 'pedestal', label: 'Cubiculum: side table' },
                { position: [-15, 1.5, 0], marker_type: 'frame', label: 'Cubiculum: peristyle doorway' },
                { position: [-27, 1.5, 0], marker_type: 'frame', label: 'Cubiculum: west wall fresco' },

                // --- Upper cubiculum hero ---
                { position: [-26, 7.5, -3], marker_type: 'pedestal', label: 'Upper cubiculum: scroll shelf' },
                { position: [-22, 7.5, 3], marker_type: 'pedestal', label: 'Upper cubiculum: chest' },
                { position: [-27, 7.5, 0], marker_type: 'frame', label: 'Upper cubiculum: west fresco' },

                // --- Bath hero ---
                { position: [-20, 1.5, -20], marker_type: 'glow', label: 'Bath: caldarium pool' },
                { position: [-16, 1.5, -20], marker_type: 'pedestal', label: 'Bath: tub chamber' },
                { position: [-24, 1.5, -16.5], marker_type: 'pedestal', label: 'Bath: NW urn' },
                { position: [-24, 1.5, -23.5], marker_type: 'pedestal', label: 'Bath: SW urn' },
                { position: [-20, 1.5, -16], marker_type: 'frame', label: 'Bath: south fresco' },
                { position: [-20, 1.5, -24], marker_type: 'frame', label: 'Bath: north fresco' },

                // --- West garden grove hero ---
                { position: [-30, 1.5, 0], marker_type: 'statue', label: 'Grove: central obelisk' },
                { position: [-30, 1.5, 8], marker_type: 'pedestal', label: 'Grove: south plaza edge' },
                { position: [-30, 1.5, -8], marker_type: 'pedestal', label: 'Grove: north plaza edge' },
                { position: [-38, 1.5, 0], marker_type: 'pedestal', label: 'Grove: west cypress walk' },
                { position: [-15, 1.5, 0], marker_type: 'frame', label: 'Grove: cubiculum entry' },

                // --- Entrance + stair hero ---
                { position: [-8, 1.5, 26], marker_type: 'statue', label: 'Entrance: west guardian' },
                { position: [8, 1.5, 26], marker_type: 'statue', label: 'Entrance: east guardian' },
                { position: [-6, 3.2, 16], marker_type: 'pedestal', label: 'Stair: upper atrium landing' },
                { position: [-18, 3.2, -4], marker_type: 'pedestal', label: 'Stair: upper cubiculum landing' },
                { position: [-4, 3.2, -16], marker_type: 'pedestal', label: 'Stair: upper tablinum landing' },

                // ============================================================
                // PROCEDURAL LOCUS FIELDS — one line per helper call.
                // ============================================================

                // --- Peristyle columns: 28 × 3 heights = 84 orb loci ---
                ...this._columnLoci({
                    columnPositions: COL_POS,
                    perColumn: 3,
                    heights: [1.5, 3.0, 4.5],
                    marker: 'orb',
                    labelPrefix: 'Peristyle column',
                }),

                // --- Triclinium east-wall fresco grid: 4 × 12 = 48 orb loci ---
                ...this._shelfGrid({
                    origin: [28.7, 1.5, -6],
                    rightAxis: [0, 0, 1],
                    upAxis:    [0, 1, 0],
                    rows: 4,
                    cols: 12,
                    stepRight: 1.0,
                    stepUp: 0.8,
                    marker: 'orb',
                    labelPrefix: 'Triclinium fresco',
                }),

                // --- Tablinum scroll shelf grid: 5 × 16 = 80 orb loci ---
                ...this._shelfGrid({
                    origin: [-6.8, 1.0, -21.7],
                    rightAxis: [1, 0, 0],
                    upAxis:    [0, 1, 0],
                    rows: 5,
                    cols: 16,
                    stepRight: 0.85,
                    stepUp: 0.7,
                    marker: 'orb',
                    labelPrefix: 'Tablinum scroll shelf',
                }),

                // --- West garden ring of rocks around central statue: 32 ---
                ...this._ring({
                    center: [-30, 0, 0],
                    radius: 6,
                    count: 32,
                    y: 1.2,
                    marker: 'orb',
                    labelPrefix: 'Garden rock',
                }),

                // --- Upper atrium floor grid: 4 × 4 = 16 ---
                ...this._floorGrid({
                    origin: [-6, 6.5, 18],
                    rows: 4, cols: 4, stepX: 1.0, stepZ: 1.0,
                    y: 6.5,
                    marker: 'orb',
                    labelPrefix: 'Upper atrium',
                }),

                // --- Upper cubiculum floor grid: 4 × 4 = 16 ---
                ...this._floorGrid({
                    origin: [-26, 6.5, -4],
                    rows: 4, cols: 4, stepX: 1.0, stepZ: 1.0,
                    y: 6.5,
                    marker: 'orb',
                    labelPrefix: 'Upper cubiculum',
                }),

                // --- Upper tablinum floor grid: 4 × 4 = 16 ---
                ...this._floorGrid({
                    origin: [-4, 6.5, -21],
                    rows: 4, cols: 4, stepX: 1.0, stepZ: 1.0,
                    y: 6.5,
                    marker: 'orb',
                    labelPrefix: 'Upper tablinum',
                }),

                // --- Niche rows beside each of the 3 stairs (balusters): 3 × 8 = 24 ---
                ...this._nicheRow({
                    start: [-7, 1.5, 13],
                    end:   [-7, 6.0, 18],
                    count: 8,
                    marker: 'orb',
                    labelPrefix: 'Upper atrium stair niche',
                }),
                ...this._nicheRow({
                    start: [-15, 1.5, -4],
                    end:   [-20, 6.0, -4],
                    count: 8,
                    marker: 'orb',
                    labelPrefix: 'Upper cubiculum stair niche',
                }),
                ...this._nicheRow({
                    start: [-4, 1.5, -13],
                    end:   [-4, 6.0, -18],
                    count: 8,
                    marker: 'orb',
                    labelPrefix: 'Upper tablinum stair niche',
                }),

                // --- South-wall atrium fresco strip: 2 × 16 = 32 ---
                ...this._shelfGrid({
                    origin: [-8, 1.2, 27.7],
                    rightAxis: [1, 0, 0],
                    upAxis:    [0, 1, 0],
                    rows: 2,
                    cols: 16,
                    stepRight: 1.0,
                    stepUp: 1.4,
                    marker: 'orb',
                    labelPrefix: 'Atrium south fresco',
                }),

                // --- Cubiculum north-wall scroll shelf: 3 × 10 = 30 ---
                ...this._shelfGrid({
                    origin: [-26.5, 1.0, -5.9],
                    rightAxis: [1, 0, 0],
                    upAxis:    [0, 1, 0],
                    rows: 3,
                    cols: 10,
                    stepRight: 0.9,
                    stepUp: 0.9,
                    marker: 'orb',
                    labelPrefix: 'Cubiculum north shelf',
                }),

                // --- Bath caldarium ring: 16 loci around the pool ---
                ...this._ring({
                    center: [-20, 0, -20],
                    radius: 3.5,
                    count: 16,
                    y: 1.2,
                    marker: 'orb',
                    labelPrefix: 'Bath caldarium ring',
                }),

                // --- North corridor between peristyle and tablinum: 10 niches ---
                ...this._nicheRow({
                    start: [-5, 1.5, -13.5],
                    end:   [5, 1.5, -13.5],
                    count: 10,
                    marker: 'orb',
                    labelPrefix: 'North corridor niche',
                }),
            ],
        };
        return t;
    },
    _libraryTower() {
        // Octagonal tower: 5 floors of bookshelves + dome observation on top floor.
        // 8 exterior walls (each 12m wide) around a r=14 octagon (center-to-wall-midline).
        // Interior floor diagonal ~26m across (octagon inscribed circle diameter ~26).
        // Floor y: 0, 6, 12, 18, 24. Each floor is 6m tall. Total tower height 30m + dome.
        // Straight east-west marble stair between each pair of floors (alternating direction).
        // On every floor, 6 of the 8 walls carry a _shelfGrid(3 rows x 20 cols) of orb loci
        // = 360 loci/floor x 5 floors = 1800 procedural shelf loci.
        // A handful of handcrafted hero loci mark desks, the armillary, the telescope, the
        // return portal, and the central candelabra.

        // --- Pre-resolved octagon geometry (center angles + wall normal rotations) ---
        // Walls bisect vertex edges: center angle of wall k = (k + 0.5) * 45°.
        // cx = 14*cos(angle), cz = 14*sin(angle), ry = angle + pi/2 (so wall face normal points outward).
        const OCTO = [
            { cx:  12.93, cz:   5.36, ry:  1.9635, ang: 0.3927  }, //   22.5°
            { cx:   5.36, cz:  12.93, ry:  2.7489, ang: 1.1781  }, //   67.5°
            { cx:  -5.36, cz:  12.93, ry:  3.5343, ang: 1.9635  }, //  112.5°
            { cx: -12.93, cz:   5.36, ry:  4.3197, ang: 2.7489  }, //  157.5°
            { cx: -12.93, cz:  -5.36, ry:  5.1051, ang: 3.5343  }, //  202.5°
            { cx:  -5.36, cz: -12.93, ry:  5.8905, ang: 4.3197  }, //  247.5°
            { cx:   5.36, cz: -12.93, ry:  0.3927, ang: 5.1051  }, //  292.5°
            { cx:  12.93, cz:  -5.36, ry:  1.1781, ang: 5.8905  }, //  337.5°
        ];

        // Helper: build a _shelfGrid call's origin/rightAxis for a given wall k and floor y.
        // The shelf plane sits just inside the wall (r_inner = 13.6), spans +/-4.5m along
        // the wall tangent, and starts 0.7m above the floor.
        // rightAxis is the unit tangent to the octagon at that wall (perpendicular to normal).
        // tangent = (-sin(ang), 0, cos(ang))
        const _wallShelf = (k, y_floor, labelPrefix) => {
            const o = OCTO[k];
            const r_inner = 13.6;
            const cx = r_inner * Math.cos(o.ang);
            const cz = r_inner * Math.sin(o.ang);
            // tangent (direction along wall length)
            const tx = -Math.sin(o.ang);
            const tz =  Math.cos(o.ang);
            // Grid: 20 cols * 0.45m step = 9m total span, centered on wall midpoint.
            // Start offset = midpoint - tangent * 4.5m
            const half_span = 4.5;
            const ox = cx - tx * half_span;
            const oz = cz - tz * half_span;
            return this._shelfGrid({
                origin: [ox, y_floor + 0.7, oz],
                rightAxis: [tx, 0, tz],
                upAxis: [0, 1, 0],
                rows: 3,
                cols: 20,
                stepRight: 0.45,
                stepUp: 1.4,
                marker: 'orb',
                labelPrefix: labelPrefix,
            });
        };

        // Which 6 walls per floor get shelves. We skip wall 5 (S, entry side) on F1 so the
        // return portal has clearance, and skip one wall per floor for stair/windows.
        // F1 skip: walls 5 (south, door) and 4 (SW, stair landing clearance)
        // F2 skip: walls 0 (E, stair top) and 4 (SW, stair bottom)
        // F3 skip: walls 0 and 4
        // F4 skip: walls 0 and 4
        // F5 skip: walls 0 and 4 (observation windows)
        const SKIP_PER_FLOOR = [
            [4, 5], // F1
            [0, 4], // F2
            [0, 4], // F3
            [0, 4], // F4
            [0, 4], // F5
        ];
        const floorNames = ['Reading Hall', 'Study', 'Scriptorium', 'Upper Archive', 'Observation'];

        // Build all procedural shelf loci (6 walls * 5 floors * 3 rows * 20 cols = 1800)
        const shelfLoci = [];
        for (let f = 0; f < 5; f++) {
            const y_floor = f * 6;
            const skip = SKIP_PER_FLOOR[f];
            for (let k = 0; k < 8; k++) {
                if (skip.includes(k)) continue;
                const lbl = `F${f + 1} ${floorNames[f]} W${k} shelf`;
                shelfLoci.push(..._wallShelf(k, y_floor, lbl));
            }
        }

        const t = {
            meta: {
                id: 'library_tower',
                name: 'Library Tower',
                desc: 'Octagonal stone tower of old-world learning: five candlelit floors of bookshelves and a dome observation chamber crowned by a telescope and armillary sphere',
                spawn_point: { position: [0, 1.6, 0], rotation_y: 0 },
                scale: 1.0,
            },
            environment: {
                hdri: 'assets/hdri/combination_room_2k.hdr',
                hdri_intensity: 0.9,
                hdri_as_background: false,
                sun: { position: [40, 60, 20], intensity: 1.5, color: 0xffeedd, cast_shadow: true, shadow_bounds: 60 },
                ambient: { intensity: 0.2 },
            },
            materials: {
                oak_plank_warm: {
                    albedo: 'assets/textures/oak_plank_warm/albedo_2k.jpg',
                    normal: 'assets/textures/oak_plank_warm/normal_2k.jpg',
                    roughness: 'assets/textures/oak_plank_warm/roughness_2k.jpg',
                    ao: 'assets/textures/oak_plank_warm/ao_2k.jpg',
                    repeat: [4, 4],
                    roughness_scale: 0.9,
                    metalness: 0,
                },
                oak_beam_dark: {
                    albedo: 'assets/textures/oak_beam_dark/albedo_2k.jpg',
                    normal: 'assets/textures/oak_beam_dark/normal_2k.jpg',
                    roughness: 'assets/textures/oak_beam_dark/roughness_2k.jpg',
                    ao: 'assets/textures/oak_beam_dark/ao_2k.jpg',
                    repeat: [3, 3],
                    roughness_scale: 0.85,
                    metalness: 0,
                },
                plaster_cream: {
                    albedo: 'assets/textures/plaster_cream/albedo_2k.jpg',
                    normal: 'assets/textures/plaster_cream/normal_2k.jpg',
                    roughness: 'assets/textures/plaster_cream/roughness_2k.jpg',
                    ao: 'assets/textures/plaster_cream/ao_2k.jpg',
                    repeat: [3, 3],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                sandstone_wall: {
                    albedo: 'assets/textures/sandstone_wall/albedo_2k.jpg',
                    normal: 'assets/textures/sandstone_wall/normal_2k.jpg',
                    roughness: 'assets/textures/sandstone_wall/roughness_2k.jpg',
                    ao: 'assets/textures/sandstone_wall/ao_2k.jpg',
                    repeat: [4, 6],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                brick_aged: {
                    albedo: 'assets/textures/brick_aged/albedo_2k.jpg',
                    normal: 'assets/textures/brick_aged/normal_2k.jpg',
                    roughness: 'assets/textures/brick_aged/roughness_2k.jpg',
                    ao: 'assets/textures/brick_aged/ao_2k.jpg',
                    repeat: [4, 4],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                marble_white: {
                    albedo: 'assets/textures/marble_white/albedo_2k.jpg',
                    normal: 'assets/textures/marble_white/normal_2k.jpg',
                    roughness: 'assets/textures/marble_white/roughness_2k.jpg',
                    ao: 'assets/textures/marble_white/ao_2k.jpg',
                    repeat: [3, 3],
                    roughness_scale: 0.7,
                    metalness: 0,
                },
                parchment_paper: {
                    albedo: 'assets/textures/parchment_paper/albedo_2k.jpg',
                    normal: 'assets/textures/parchment_paper/normal_2k.jpg',
                    roughness: 'assets/textures/parchment_paper/roughness_2k.jpg',
                    ao: null,
                    repeat: [2, 2],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                bronze_trim: {
                    albedo: 'assets/textures/bronze_trim/albedo_2k.jpg',
                    normal: 'assets/textures/bronze_trim/normal_2k.jpg',
                    roughness: 'assets/textures/bronze_trim/roughness_2k.jpg',
                    ao: null,
                    repeat: [2, 2],
                    roughness_scale: 0.4,
                    metalness: 0.8,
                },
            },
            surfaces: [
                // ========================================================
                // EXTERIOR OCTAGONAL SHELL — 8 sandstone walls, full 30m height
                // Each wall: width 12m, height 30m (5 floors of 6m), depth 0.6m.
                // Centered vertically at y=15.
                // ========================================================
                { type: 'wall', transform: { position: [OCTO[0].cx, 15, OCTO[0].cz], rotation: [0, OCTO[0].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 30, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior E' },
                { type: 'wall', transform: { position: [OCTO[1].cx, 15, OCTO[1].cz], rotation: [0, OCTO[1].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 30, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior NE' },
                { type: 'wall', transform: { position: [OCTO[2].cx, 15, OCTO[2].cz], rotation: [0, OCTO[2].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 30, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior NW' },
                { type: 'wall', transform: { position: [OCTO[3].cx, 15, OCTO[3].cz], rotation: [0, OCTO[3].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 30, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior W' },
                { type: 'wall', transform: { position: [OCTO[4].cx, 15, OCTO[4].cz], rotation: [0, OCTO[4].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 30, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior SW' },
                { type: 'wall', transform: { position: [OCTO[5].cx, 15, OCTO[5].cz], rotation: [0, OCTO[5].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 30, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior S (entry)' },
                { type: 'wall', transform: { position: [OCTO[6].cx, 15, OCTO[6].cz], rotation: [0, OCTO[6].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 30, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior SE' },
                { type: 'wall', transform: { position: [OCTO[7].cx, 15, OCTO[7].cz], rotation: [0, OCTO[7].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 30, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior ESE' },

                // Exterior brick accent bands at floor boundaries y=6, 12, 18, 24 (rotated around tower)
                { type: 'wall', transform: { position: [OCTO[0].cx,  6, OCTO[0].cz], rotation: [0, OCTO[0].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12.2, height: 0.6, depth: 0.65 }, material: 'brick_aged', label: 'Brick band F1/F2 E' },
                { type: 'wall', transform: { position: [OCTO[2].cx, 12, OCTO[2].cz], rotation: [0, OCTO[2].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12.2, height: 0.6, depth: 0.65 }, material: 'brick_aged', label: 'Brick band F2/F3 NW' },
                { type: 'wall', transform: { position: [OCTO[4].cx, 18, OCTO[4].cz], rotation: [0, OCTO[4].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12.2, height: 0.6, depth: 0.65 }, material: 'brick_aged', label: 'Brick band F3/F4 SW' },
                { type: 'wall', transform: { position: [OCTO[6].cx, 24, OCTO[6].cz], rotation: [0, OCTO[6].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12.2, height: 0.6, depth: 0.65 }, material: 'brick_aged', label: 'Brick band F4/F5 SE' },

                // ========================================================
                // FLOOR 1 — READING HALL (y=0 to y=6)
                // ========================================================
                { type: 'floor', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 28, depth: 0.3 }, material: 'oak_plank_warm', label: 'F1 Reading Hall floor' },
                // Ceiling of F1 with stair void near z=3
                { type: 'ceiling', transform: { position: [0, 6, -8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 12, depth: 0.3 }, material: 'oak_beam_dark', label: 'F1 ceiling south half' },
                { type: 'ceiling', transform: { position: [-9, 6, 3], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 10, height: 10, depth: 0.3 }, material: 'oak_beam_dark', label: 'F1 ceiling NW (stair W notch)' },
                { type: 'ceiling', transform: { position: [9, 6, 3], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 10, height: 10, depth: 0.3 }, material: 'oak_beam_dark', label: 'F1 ceiling NE (stair E notch)' },
                { type: 'ceiling', transform: { position: [0, 6, 11], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 6, depth: 0.3 }, material: 'oak_beam_dark', label: 'F1 ceiling far north' },
                // Exposed beams F1
                { type: 'ceiling', transform: { position: [0, 5.7, -6], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 24, height: 0.4, depth: 0.4 }, material: 'oak_beam_dark', label: 'F1 beam N' },
                { type: 'ceiling', transform: { position: [0, 5.7, 8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 24, height: 0.4, depth: 0.4 }, material: 'oak_beam_dark', label: 'F1 beam S' },
                { type: 'ceiling', transform: { position: [-10, 5.7, 0], rotation: [0, 1.5708, 0], scale: [1,1,1] },
                  dimensions: { width: 24, height: 0.4, depth: 0.4 }, material: 'oak_beam_dark', label: 'F1 beam W' },
                { type: 'ceiling', transform: { position: [10, 5.7, 0], rotation: [0, 1.5708, 0], scale: [1,1,1] },
                  dimensions: { width: 24, height: 0.4, depth: 0.4 }, material: 'oak_beam_dark', label: 'F1 beam E' },

                // ========================================================
                // FLOOR 2 — STUDY (y=6 to y=12)
                // ========================================================
                { type: 'floor', transform: { position: [0, 6.2, -8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 12, depth: 0.2 }, material: 'oak_plank_warm', label: 'F2 south half' },
                { type: 'floor', transform: { position: [-9, 6.2, 3], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 10, height: 10, depth: 0.2 }, material: 'oak_plank_warm', label: 'F2 NW (stair W notch)' },
                { type: 'floor', transform: { position: [9, 6.2, 3], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 10, height: 10, depth: 0.2 }, material: 'oak_plank_warm', label: 'F2 NE (stair E notch)' },
                { type: 'floor', transform: { position: [0, 6.2, 11], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 6, depth: 0.2 }, material: 'oak_plank_warm', label: 'F2 far north' },
                // F2 ceiling (same layout, flipped stair void to -z side)
                { type: 'ceiling', transform: { position: [0, 12, 8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 12, depth: 0.3 }, material: 'oak_beam_dark', label: 'F2 ceiling north half' },
                { type: 'ceiling', transform: { position: [-9, 12, -3], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 10, height: 10, depth: 0.3 }, material: 'oak_beam_dark', label: 'F2 ceiling SW notch' },
                { type: 'ceiling', transform: { position: [9, 12, -3], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 10, height: 10, depth: 0.3 }, material: 'oak_beam_dark', label: 'F2 ceiling SE notch' },
                { type: 'ceiling', transform: { position: [0, 12, -11], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 6, depth: 0.3 }, material: 'oak_beam_dark', label: 'F2 ceiling far south' },
                // Plaster wainscot ring F2
                { type: 'wall', transform: { position: [OCTO[1].cx * 0.85, 8.5, OCTO[1].cz * 0.85], rotation: [0, OCTO[1].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 11, height: 5, depth: 0.15 }, material: 'plaster_cream', label: 'F2 plaster NE' },
                { type: 'wall', transform: { position: [OCTO[3].cx * 0.85, 8.5, OCTO[3].cz * 0.85], rotation: [0, OCTO[3].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 11, height: 5, depth: 0.15 }, material: 'plaster_cream', label: 'F2 plaster NW' },

                // ========================================================
                // FLOOR 3 — SCRIPTORIUM (y=12 to y=18)
                // ========================================================
                { type: 'floor', transform: { position: [0, 12.2, 8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 12, depth: 0.2 }, material: 'oak_plank_warm', label: 'F3 north half' },
                { type: 'floor', transform: { position: [-9, 12.2, -3], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 10, height: 10, depth: 0.2 }, material: 'oak_plank_warm', label: 'F3 SW notch' },
                { type: 'floor', transform: { position: [9, 12.2, -3], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 10, height: 10, depth: 0.2 }, material: 'oak_plank_warm', label: 'F3 SE notch' },
                { type: 'floor', transform: { position: [0, 12.2, -11], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 6, depth: 0.2 }, material: 'oak_plank_warm', label: 'F3 far south' },
                // F3 ceiling (stair flipped back to +z)
                { type: 'ceiling', transform: { position: [0, 18, -8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 12, depth: 0.3 }, material: 'oak_beam_dark', label: 'F3 ceiling south half' },
                { type: 'ceiling', transform: { position: [-9, 18, 3], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 10, height: 10, depth: 0.3 }, material: 'oak_beam_dark', label: 'F3 ceiling NW notch' },
                { type: 'ceiling', transform: { position: [9, 18, 3], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 10, height: 10, depth: 0.3 }, material: 'oak_beam_dark', label: 'F3 ceiling NE notch' },
                { type: 'ceiling', transform: { position: [0, 18, 11], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 6, depth: 0.3 }, material: 'oak_beam_dark', label: 'F3 ceiling far north' },
                // Parchment accents
                { type: 'wall', transform: { position: [OCTO[1].cx * 0.85, 15, OCTO[1].cz * 0.85], rotation: [0, OCTO[1].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 11, height: 5, depth: 0.15 }, material: 'parchment_paper', label: 'F3 parchment NE' },
                { type: 'wall', transform: { position: [OCTO[3].cx * 0.85, 15, OCTO[3].cz * 0.85], rotation: [0, OCTO[3].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 11, height: 5, depth: 0.15 }, material: 'parchment_paper', label: 'F3 parchment NW' },

                // ========================================================
                // FLOOR 4 — UPPER ARCHIVE (y=18 to y=24)
                // ========================================================
                { type: 'floor', transform: { position: [0, 18.2, -8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 12, depth: 0.2 }, material: 'oak_plank_warm', label: 'F4 south half' },
                { type: 'floor', transform: { position: [-9, 18.2, 3], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 10, height: 10, depth: 0.2 }, material: 'oak_plank_warm', label: 'F4 NW notch' },
                { type: 'floor', transform: { position: [9, 18.2, 3], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 10, height: 10, depth: 0.2 }, material: 'oak_plank_warm', label: 'F4 NE notch' },
                { type: 'floor', transform: { position: [0, 18.2, 11], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 6, depth: 0.2 }, material: 'oak_plank_warm', label: 'F4 far north' },
                // F4 ceiling (stair flipped to -z)
                { type: 'ceiling', transform: { position: [0, 24, 8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 12, depth: 0.3 }, material: 'oak_beam_dark', label: 'F4 ceiling north half' },
                { type: 'ceiling', transform: { position: [-9, 24, -3], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 10, height: 10, depth: 0.3 }, material: 'oak_beam_dark', label: 'F4 ceiling SW notch' },
                { type: 'ceiling', transform: { position: [9, 24, -3], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 10, height: 10, depth: 0.3 }, material: 'oak_beam_dark', label: 'F4 ceiling SE notch' },
                { type: 'ceiling', transform: { position: [0, 24, -11], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 6, depth: 0.3 }, material: 'oak_beam_dark', label: 'F4 ceiling far south' },
                // Plaster + brick accents
                { type: 'wall', transform: { position: [OCTO[5].cx * 0.85, 21, OCTO[5].cz * 0.85], rotation: [0, OCTO[5].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 11, height: 5, depth: 0.15 }, material: 'brick_aged', label: 'F4 brick SW' },
                { type: 'wall', transform: { position: [OCTO[7].cx * 0.85, 21, OCTO[7].cz * 0.85], rotation: [0, OCTO[7].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 11, height: 5, depth: 0.15 }, material: 'brick_aged', label: 'F4 brick SE' },

                // ========================================================
                // FLOOR 5 — OBSERVATION CHAMBER (y=24 to y=30 + dome above)
                // ========================================================
                { type: 'floor', transform: { position: [0, 24.2, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 26, height: 26, depth: 0.25 }, material: 'marble_white', label: 'F5 observation marble floor' },

                // Faux dome: 3 stacked octagonal-like marble slabs shrinking upward
                { type: 'ceiling', transform: { position: [0, 30, 0], rotation: [0, 0.3927, 0], scale: [1,1,1] },
                  dimensions: { width: 22, height: 22, depth: 0.4 }, material: 'marble_white', label: 'Dome base slab' },
                { type: 'ceiling', transform: { position: [0, 31.5, 0], rotation: [0, 0.3927, 0], scale: [1,1,1] },
                  dimensions: { width: 16, height: 16, depth: 0.4 }, material: 'marble_white', label: 'Dome mid slab' },
                { type: 'ceiling', transform: { position: [0, 33, 0], rotation: [0, 0.3927, 0], scale: [1,1,1] },
                  dimensions: { width: 9, height: 9, depth: 0.4 }, material: 'marble_white', label: 'Dome cap slab' },
                { type: 'ceiling', transform: { position: [0, 34, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 3, height: 3, depth: 0.3 }, material: 'bronze_trim', label: 'Dome bronze oculus cap' },

                // Central pedestal for the armillary sphere
                { type: 'floor', transform: { position: [0, 24.6, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 2.0, height: 2.0, depth: 0.8 }, material: 'marble_white', label: 'Armillary pedestal base' },
                { type: 'floor', transform: { position: [0, 25.1, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 0.2 }, material: 'bronze_trim', label: 'Armillary pedestal top' },
                // Armillary sphere: 4 bronze rings
                { type: 'wall', transform: { position: [0, 26.0, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 0.08 }, material: 'bronze_trim', label: 'Armillary ring A (XY)' },
                { type: 'wall', transform: { position: [0, 26.0, 0], rotation: [0, 1.5708, 0], scale: [1,1,1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 0.08 }, material: 'bronze_trim', label: 'Armillary ring B (YZ)' },
                { type: 'floor', transform: { position: [0, 26.0, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 0.08 }, material: 'bronze_trim', label: 'Armillary ring C (XZ horizon)' },
                { type: 'wall', transform: { position: [0, 26.0, 0], rotation: [0, 0.7854, 0.7854], scale: [1,1,1] },
                  dimensions: { width: 1.5, height: 1.5, depth: 0.06 }, material: 'bronze_trim', label: 'Armillary ring D (ecliptic)' },

                // Telescope on pedestal
                { type: 'floor', transform: { position: [5, 24.6, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 0.8 }, material: 'marble_white', label: 'Telescope pedestal' },
                { type: 'wall', transform: { position: [5, 26.0, 0], rotation: [0, 0, 0.5236], scale: [1,1,1] },
                  dimensions: { width: 0.3, height: 2.2, depth: 0.3 }, material: 'bronze_trim', label: 'Telescope barrel' },
                { type: 'wall', transform: { position: [5, 26.9, 0], rotation: [0, 0, 0.5236], scale: [1,1,1] },
                  dimensions: { width: 0.4, height: 0.3, depth: 0.4 }, material: 'bronze_trim', label: 'Telescope eyepiece' },
                { type: 'wall', transform: { position: [5, 25.1, 0], rotation: [0, 0, 0.5236], scale: [1,1,1] },
                  dimensions: { width: 0.5, height: 0.5, depth: 0.5 }, material: 'bronze_trim', label: 'Telescope mount yoke' },

                // ========================================================
                // STRAIGHT MARBLE STAIRS — 4 flights, alternating direction.
                // Pattern kept identical to S175 working version (15 steps, 0.4m rise, 0.72m deep).
                // F1->F2: east-bound at z=3
                // F2->F3: west-bound at z=-3
                // F3->F4: east-bound at z=3
                // F4->F5: west-bound at z=-3  (NEW — added for 5th floor)
                // ========================================================

                // F1 -> F2 stair (east-bound at z=3)
                { type: 'floor', transform: { position: [ -4.67,  0.40,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 01' },
                { type: 'floor', transform: { position: [ -4.00,  0.80,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 02' },
                { type: 'floor', transform: { position: [ -3.33,  1.20,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 03' },
                { type: 'floor', transform: { position: [ -2.67,  1.60,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 04' },
                { type: 'floor', transform: { position: [ -2.00,  2.00,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 05' },
                { type: 'floor', transform: { position: [ -1.33,  2.40,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 06' },
                { type: 'floor', transform: { position: [ -0.67,  2.80,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 07' },
                { type: 'floor', transform: { position: [  0.00,  3.20,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 08' },
                { type: 'floor', transform: { position: [  0.67,  3.60,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 09' },
                { type: 'floor', transform: { position: [  1.33,  4.00,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 10' },
                { type: 'floor', transform: { position: [  2.00,  4.40,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 11' },
                { type: 'floor', transform: { position: [  2.67,  4.80,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 12' },
                { type: 'floor', transform: { position: [  3.33,  5.20,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 13' },
                { type: 'floor', transform: { position: [  4.00,  5.60,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 14' },
                { type: 'floor', transform: { position: [  4.67,  6.00,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F1-2 step 15' },

                // F2 -> F3 stair (west-bound at z=-3)
                { type: 'floor', transform: { position: [  4.67,  6.40, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 01' },
                { type: 'floor', transform: { position: [  4.00,  6.80, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 02' },
                { type: 'floor', transform: { position: [  3.33,  7.20, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 03' },
                { type: 'floor', transform: { position: [  2.67,  7.60, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 04' },
                { type: 'floor', transform: { position: [  2.00,  8.00, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 05' },
                { type: 'floor', transform: { position: [  1.33,  8.40, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 06' },
                { type: 'floor', transform: { position: [  0.67,  8.80, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 07' },
                { type: 'floor', transform: { position: [  0.00,  9.20, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 08' },
                { type: 'floor', transform: { position: [ -0.67,  9.60, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 09' },
                { type: 'floor', transform: { position: [ -1.33, 10.00, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 10' },
                { type: 'floor', transform: { position: [ -2.00, 10.40, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 11' },
                { type: 'floor', transform: { position: [ -2.67, 10.80, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 12' },
                { type: 'floor', transform: { position: [ -3.33, 11.20, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 13' },
                { type: 'floor', transform: { position: [ -4.00, 11.60, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 14' },
                { type: 'floor', transform: { position: [ -4.67, 12.00, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F2-3 step 15' },

                // F3 -> F4 stair (east-bound at z=3)
                { type: 'floor', transform: { position: [ -4.67, 12.40,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 01' },
                { type: 'floor', transform: { position: [ -4.00, 12.80,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 02' },
                { type: 'floor', transform: { position: [ -3.33, 13.20,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 03' },
                { type: 'floor', transform: { position: [ -2.67, 13.60,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 04' },
                { type: 'floor', transform: { position: [ -2.00, 14.00,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 05' },
                { type: 'floor', transform: { position: [ -1.33, 14.40,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 06' },
                { type: 'floor', transform: { position: [ -0.67, 14.80,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 07' },
                { type: 'floor', transform: { position: [  0.00, 15.20,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 08' },
                { type: 'floor', transform: { position: [  0.67, 15.60,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 09' },
                { type: 'floor', transform: { position: [  1.33, 16.00,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 10' },
                { type: 'floor', transform: { position: [  2.00, 16.40,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 11' },
                { type: 'floor', transform: { position: [  2.67, 16.80,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 12' },
                { type: 'floor', transform: { position: [  3.33, 17.20,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 13' },
                { type: 'floor', transform: { position: [  4.00, 17.60,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 14' },
                { type: 'floor', transform: { position: [  4.67, 18.00,  3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F3-4 step 15' },

                // F4 -> F5 stair (west-bound at z=-3) — NEW in the 5-floor rebuild
                { type: 'floor', transform: { position: [  4.67, 18.40, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 01' },
                { type: 'floor', transform: { position: [  4.00, 18.80, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 02' },
                { type: 'floor', transform: { position: [  3.33, 19.20, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 03' },
                { type: 'floor', transform: { position: [  2.67, 19.60, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 04' },
                { type: 'floor', transform: { position: [  2.00, 20.00, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 05' },
                { type: 'floor', transform: { position: [  1.33, 20.40, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 06' },
                { type: 'floor', transform: { position: [  0.67, 20.80, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 07' },
                { type: 'floor', transform: { position: [  0.00, 21.20, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 08' },
                { type: 'floor', transform: { position: [ -0.67, 21.60, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 09' },
                { type: 'floor', transform: { position: [ -1.33, 22.00, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 10' },
                { type: 'floor', transform: { position: [ -2.00, 22.40, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 11' },
                { type: 'floor', transform: { position: [ -2.67, 22.80, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 12' },
                { type: 'floor', transform: { position: [ -3.33, 23.20, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 13' },
                { type: 'floor', transform: { position: [ -4.00, 23.60, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 14' },
                { type: 'floor', transform: { position: [ -4.67, 24.00, -3.00], rotation: [0,0,0], scale: [1,1,1] }, dimensions: { width: 0.72, height: 0.25, depth: 2.80 }, material: 'marble_white', label: 'Stair F4-5 step 15' },
            ],
            props: [
                // ========================================================
                // FLOOR 1 — READING HALL
                // ========================================================
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosedWide.glb', transform: { position: [ 10.5, 0,  4.5], rotation: [0, -0.3927, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F1 bookshelf E1' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosedWide.glb', transform: { position: [ 10.5, 0, -4.5], rotation: [0,  0.3927, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F1 bookshelf E2' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb',     transform: { position: [-10.5, 0,  4.5], rotation: [0,  0.3927, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F1 bookshelf W1' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb',     transform: { position: [-10.5, 0, -4.5], rotation: [0, -0.3927, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F1 bookshelf W2' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',       transform: { position: [  4.5, 0, 10.5], rotation: [0,  3.1416, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F1 bookshelf N1' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',       transform: { position: [ -4.5, 0, 10.5], rotation: [0,  3.1416, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F1 bookshelf N2' },

                // Reading desks + chairs
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',       transform: { position: [ 5, 0,  5], rotation: [0, -0.7854, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F1 reading desk NE' },
                { glb: 'assets/props/kenney/furniture_kit/chairDesk.glb',  transform: { position: [ 6, 0,  6], rotation: [0, -0.7854 + 3.1416, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F1 reading chair NE' },
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',       transform: { position: [-5, 0,  5], rotation: [0,  0.7854, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F1 reading desk NW' },
                { glb: 'assets/props/kenney/furniture_kit/chairDesk.glb',  transform: { position: [-6, 0,  6], rotation: [0,  0.7854 + 3.1416, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F1 reading chair NW' },
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',       transform: { position: [ 5, 0, -5], rotation: [0,  0.7854 + 3.1416, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F1 reading desk SE' },
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',       transform: { position: [-5, 0, -5], rotation: [0, -0.7854 + 3.1416, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F1 reading desk SW' },
                { glb: 'assets/props/kenney/furniture_kit/books.glb',      transform: { position: [ 5, 0.9,  5], rotation: [0, 0.5, 0], scale: [1.4, 1.4, 1.4] }, cast_shadow: true, receive_shadow: true, label: 'F1 books desk NE' },
                { glb: 'assets/props/kenney/furniture_kit/books.glb',      transform: { position: [-5, 0.9,  5], rotation: [0,-0.3, 0], scale: [1.4, 1.4, 1.4] }, cast_shadow: true, receive_shadow: true, label: 'F1 books desk NW' },
                { glb: 'assets/props/kenney/furniture_kit/rugRound.glb',   transform: { position: [0, 0.02, 0], rotation: [0, 0, 0], scale: [4.0, 4.0, 4.0] }, cast_shadow: false, receive_shadow: true, label: 'F1 central rug' },
                { glb: 'assets/props/polyhaven/Chandelier_01/Chandelier_01_2k.gltf', transform: { position: [0, 5.2, 0], rotation: [0, 0, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: false, receive_shadow: false, label: 'F1 central chandelier' },
                { glb: 'assets/props/kenney/castle_kit/door.glb', transform: { position: [0, 0, 13.0], rotation: [0, 0, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: true, receive_shadow: true, label: 'F1 entry door (south)' },

                // ========================================================
                // FLOOR 2 — STUDY
                // ========================================================
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb', transform: { position: [ 10.0, 6.2,  4.0], rotation: [0, -0.3927, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: true, receive_shadow: true, label: 'F2 bookshelf E1' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb', transform: { position: [ 10.0, 6.2, -4.0], rotation: [0,  0.3927, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: true, receive_shadow: true, label: 'F2 bookshelf E2' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',   transform: { position: [-10.0, 6.2,  4.0], rotation: [0,  0.3927, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: true, receive_shadow: true, label: 'F2 bookshelf W1' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',   transform: { position: [-10.0, 6.2, -4.0], rotation: [0, -0.3927, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: true, receive_shadow: true, label: 'F2 bookshelf W2' },
                { glb: 'assets/props/kenney/furniture_kit/tableCross.glb',     transform: { position: [ 5, 6.2, 0], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F2 central study table' },
                { glb: 'assets/props/kenney/furniture_kit/chair.glb',          transform: { position: [ 6.8, 6.2,  1.2], rotation: [0, -1.5708, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F2 table chair A' },
                { glb: 'assets/props/kenney/furniture_kit/chair.glb',          transform: { position: [ 6.8, 6.2, -1.2], rotation: [0, -1.5708, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F2 table chair B' },
                { glb: 'assets/props/kenney/furniture_kit/books.glb',          transform: { position: [ 5, 7.0, 0], rotation: [0, 0, 0], scale: [1.3, 1.3, 1.3] }, cast_shadow: true, receive_shadow: true, label: 'F2 open folios' },
                { glb: 'assets/props/kenney/furniture_kit/deskCorner.glb',     transform: { position: [-7, 6.2,  9], rotation: [0, -0.7854, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F2 corner writing desk' },
                { glb: 'assets/props/kenney/furniture_kit/lampSquareTable.glb', transform: { position: [-7, 7.0,  9], rotation: [0, 0, 0], scale: [1.3, 1.3, 1.3] }, cast_shadow: true, receive_shadow: true, label: 'F2 corner desk lamp' },
                { glb: 'assets/props/kenney/furniture_kit/sideTable.glb',      transform: { position: [-7, 6.2, -9], rotation: [0, 0.5, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F2 standing lectern' },
                { glb: 'assets/props/kenney/furniture_kit/rugRectangle.glb',   transform: { position: [5, 6.22, 0], rotation: [0, 0, 0], scale: [3.0, 3.0, 3.0] }, cast_shadow: false, receive_shadow: true, label: 'F2 rug under study table' },
                { glb: 'assets/props/polyhaven/Chandelier_02/Chandelier_02_2k.gltf', transform: { position: [5, 10.5, 0], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: false, receive_shadow: false, label: 'F2 chandelier' },

                // ========================================================
                // FLOOR 3 — SCRIPTORIUM
                // ========================================================
                { glb: 'assets/props/kenney/pirate_kit/chest.glb',          transform: { position: [ 9, 12.2,  6], rotation: [0, -0.7854, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F3 archive chest NE' },
                { glb: 'assets/props/kenney/pirate_kit/chest.glb',          transform: { position: [ 9, 12.2, -6], rotation: [0,  0.7854, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F3 archive chest SE' },
                { glb: 'assets/props/kenney/mini_dungeon/chest.glb',        transform: { position: [-9, 12.2,  6], rotation: [0,  0.7854, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F3 archive chest NW' },
                { glb: 'assets/props/kenney/pirate_kit/crate.glb',          transform: { position: [-9, 12.2, -6], rotation: [0, -0.7854, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F3 scroll crate SW' },
                { glb: 'assets/props/kenney/furniture_kit/sideTable.glb',   transform: { position: [ 6, 12.2, 9], rotation: [0, 3.1416, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F3 statue pedestal' },
                { glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf', transform: { position: [ 6, 13.0, 9], rotation: [0, 3.1416, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F3 hooded figure bust' },
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',        transform: { position: [ 5, 12.2, -5], rotation: [0, 0.7854, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F3 copyist desk A' },
                { glb: 'assets/props/kenney/furniture_kit/chairDesk.glb',   transform: { position: [ 6, 12.2, -6], rotation: [0, 0.7854 + 3.1416, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F3 copyist chair A' },
                { glb: 'assets/props/kenney/mini_dungeon/banner.glb',       transform: { position: [ 0, 13.5, 11.5], rotation: [0, 3.1416, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F3 hanging banner N' },
                { glb: 'assets/props/polyhaven/lantern_chandelier_01/lantern_chandelier_01_2k.gltf', transform: { position: [0, 16.5, 0], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: false, receive_shadow: false, label: 'F3 lantern chandelier' },

                // ========================================================
                // FLOOR 4 — UPPER ARCHIVE (new for 5-floor rebuild)
                // ========================================================
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',   transform: { position: [ 10.0, 18.2,  4.0], rotation: [0, -0.3927, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: true, receive_shadow: true, label: 'F4 bookshelf E1' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',   transform: { position: [ 10.0, 18.2, -4.0], rotation: [0,  0.3927, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: true, receive_shadow: true, label: 'F4 bookshelf E2' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb', transform: { position: [-10.0, 18.2,  4.0], rotation: [0,  0.3927, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: true, receive_shadow: true, label: 'F4 bookshelf W1' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb', transform: { position: [-10.0, 18.2, -4.0], rotation: [0, -0.3927, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: true, receive_shadow: true, label: 'F4 bookshelf W2' },
                { glb: 'assets/props/kenney/furniture_kit/tableRound.glb',     transform: { position: [ 5, 18.2, 0], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F4 round research table' },
                { glb: 'assets/props/kenney/furniture_kit/chair.glb',          transform: { position: [ 6.5, 18.2, 0], rotation: [0, -1.5708, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F4 research chair E' },
                { glb: 'assets/props/kenney/furniture_kit/chair.glb',          transform: { position: [ 3.5, 18.2, 0], rotation: [0,  1.5708, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F4 research chair W' },
                { glb: 'assets/props/kenney/furniture_kit/books.glb',          transform: { position: [ 5, 19.0, 0], rotation: [0, 0.3, 0], scale: [1.3, 1.3, 1.3] }, cast_shadow: true, receive_shadow: true, label: 'F4 research folios' },
                { glb: 'assets/props/kenney/furniture_kit/rugRectangle.glb',   transform: { position: [5, 18.22, 0], rotation: [0, 0, 0], scale: [3.0, 3.0, 3.0] }, cast_shadow: false, receive_shadow: true, label: 'F4 rug under research table' },
                { glb: 'assets/props/polyhaven/Chandelier_02/Chandelier_02_2k.gltf', transform: { position: [5, 22.5, 0], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: false, receive_shadow: false, label: 'F4 chandelier' },
                { glb: 'assets/props/kenney/mini_dungeon/banner.glb',          transform: { position: [ 0, 19.5, 11.5], rotation: [0, 3.1416, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F4 banner N' },
                { glb: 'assets/props/kenney/mini_dungeon/banner.glb',          transform: { position: [ 0, 19.5, -11.5], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F4 banner S' },

                // ========================================================
                // FLOOR 5 — OBSERVATION CHAMBER
                // ========================================================
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpenLow.glb', transform: { position: [ 9, 24.2,  6], rotation: [0, -0.3927, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F5 low shelf NE' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpenLow.glb', transform: { position: [ 9, 24.2, -6], rotation: [0,  0.3927, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F5 low shelf SE' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpenLow.glb', transform: { position: [-9, 24.2,  6], rotation: [0,  0.3927, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F5 low shelf NW' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpenLow.glb', transform: { position: [-9, 24.2, -6], rotation: [0, -0.3927, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F5 low shelf SW' },
                { glb: 'assets/props/kenney/furniture_kit/tableRound.glb', transform: { position: [-5, 24.2, 0], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F5 celestial charts table' },
                { glb: 'assets/props/kenney/furniture_kit/books.glb',      transform: { position: [-5, 25.0, 0], rotation: [0, 0.5, 0], scale: [1.3, 1.3, 1.3] }, cast_shadow: true, receive_shadow: true, label: 'F5 star atlas' },
                { glb: 'assets/props/kenney/furniture_kit/chair.glb',      transform: { position: [-6.5, 24.2, 0], rotation: [0, 1.5708, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F5 astronomer chair' },
                { glb: 'assets/props/kenney/furniture_kit/pottedPlant.glb', transform: { position: [  9, 24.2,  0], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F5 potted plant E' },
                { glb: 'assets/props/kenney/furniture_kit/pottedPlant.glb', transform: { position: [ -9, 24.2,  9], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F5 potted plant NW' },
            ],
            connectors: [],
            loci: [
                // ================================================================
                // RETURN PORTAL — first locus, at spawn (center of F1), facing south door.
                // ================================================================
                {
                    position: [0, 1.6, -2],
                    marker_type: 'door',
                    marker_settings: { portal_target: 'forum' },
                    label: 'Return to The Forum',
                    card_ids: [],
                },

                // ================================================================
                // HANDCRAFTED HERO LOCI — distinctive desks, busts, armillary, telescope,
                // chandeliers, landing painting. Use rich marker types (pedestal/frame/
                // statue) so they render as individual meshes.
                // ================================================================

                // Floor 1 — Reading Hall heroes
                { position: [ 5,  1.1,  5], marker_type: 'frame',    label: 'F1 NE desk: open folio on classical rhetoric' },
                { position: [-5,  1.1,  5], marker_type: 'frame',    label: 'F1 NW desk: geometry diagrams in chalk' },
                { position: [ 5,  1.1, -5], marker_type: 'frame',    label: 'F1 SE desk: Aristotle open to the Organon' },
                { position: [-5,  1.1, -5], marker_type: 'frame',    label: 'F1 SW desk: annotated Herodotus' },
                { position: [ 0,  4.8,  0], marker_type: 'glow',     label: 'F1 central chandelier — candlelight locus' },

                // Central stair landing — large painting over the F2->F3 landing (west face).
                { position: [-6.5, 9.0, -3], marker_type: 'frame',   label: 'Central stair landing painting — "The Scholars at Chartres"' },

                // Floor 2 — Study heroes
                { position: [ 5,  7.2,  0], marker_type: 'pedestal', label: 'F2 study: central oak table with illuminated atlas' },
                { position: [-7,  7.2,  9], marker_type: 'frame',    label: 'F2 corner writing desk: half-written letter' },
                { position: [-7,  7.2, -9], marker_type: 'frame',    label: 'F2 standing lectern: vellum manuscript' },
                { position: [ 5, 10.3,  0], marker_type: 'glow',     label: 'F2 chandelier — candlelight locus' },

                // Floor 3 — Scriptorium heroes
                { position: [ 9, 13.0,  6], marker_type: 'pedestal', label: 'F3 sealed chest of decretals (NE)' },
                { position: [ 9, 13.0, -6], marker_type: 'pedestal', label: 'F3 chest of sermons and glosses (SE)' },
                { position: [-9, 13.0,  6], marker_type: 'pedestal', label: 'F3 iron-bound chest of heretical tracts (NW)' },
                { position: [ 6, 14.2,  9], marker_type: 'statue',   label: 'F3 hooded figure bust — the anonymous copyist' },
                { position: [ 0, 16.3,  0], marker_type: 'glow',     label: 'F3 lantern chandelier — dim candlelight locus' },

                // Floor 4 — Upper Archive heroes
                { position: [ 5, 19.2,  0], marker_type: 'pedestal', label: 'F4 upper archive: round research table' },
                { position: [ 0, 20.5, 11], marker_type: 'frame',    label: 'F4 north wall banner: research mandates' },
                { position: [ 5, 22.3,  0], marker_type: 'glow',     label: 'F4 chandelier — candlelight locus' },

                // Floor 5 — Observation Chamber heroes
                { position: [ 0, 26.5,  0], marker_type: 'pedestal', label: 'F5 observation: bronze armillary sphere on central pedestal' },
                { position: [ 5, 26.5,  0], marker_type: 'pedestal', label: 'F5 observation: brass telescope aimed at oculus' },
                { position: [-5, 25.0,  0], marker_type: 'frame',    label: 'F5 observation: celestial charts table' },
                { position: [ 0, 25.3, 11], marker_type: 'frame',    label: 'F5 north window — looking north over the moors' },
                { position: [11, 25.3,  0], marker_type: 'frame',    label: 'F5 east window — first light at dawn' },
                { position: [ 0, 25.3,-11], marker_type: 'frame',    label: 'F5 south window — the village below' },
                { position: [-11, 25.3, 0], marker_type: 'frame',    label: 'F5 west window — sunset over the forest' },

                // ================================================================
                // PROCEDURAL SHELF LOCI — 6 walls × 5 floors × 3 rows × 20 cols = 1800 orbs
                // Spread from the pre-built `shelfLoci` array computed at the top of the
                // function. Each is an orb marker labeled by floor/wall/grid coords.
                // ================================================================
                ...shelfLoci,
            ],
        };
        return t;
    },
    _museumHall() {
        // =========================================================================
        // Geometry constants
        // =========================================================================
        // Main hall runs along Z axis: south entrance at z=-70, north rotunda edge at z=+55
        // (Hall 140m long total, rotunda extends beyond north wall)
        // Hall is 30m wide: walls at x=+/-15, alcove backs at x=+/-18
        // Ceiling: 10m
        const HALL_HALF_W = 15;                 // inner wall x distance
        const ALCOVE_BACK = 18;                 // alcove back wall x
        const HALL_Z_S = -70;                   // south entrance wall
        const HALL_Z_N = 55;                    // north wall (rotunda opens north of this)
        const CEIL_Y = 10;
        const ROT_CENTER_Z = 65;                // octagonal rotunda center
        const ROT_RADIUS = 12;

        // 20 alcoves per side, centered along z = -57 .. +51 at 6m spacing
        // Each alcove is 4m wide × 3m deep
        const ALCOVE_COUNT_PER_SIDE = 20;
        const ALCOVE_STEP = 6;                  // z spacing between alcove centers
        const ALCOVE_Z0 = -57;                  // first alcove center z
        const ALCOVE_WIDTH = 4;
        const ALCOVE_DEPTH = 3;

        // Precompute alcove Z centers
        const alcoveZs = [];
        for (let i = 0; i < ALCOVE_COUNT_PER_SIDE; i++) {
            alcoveZs.push(ALCOVE_Z0 + i * ALCOVE_STEP);
        }

        // =========================================================================
        // Surfaces: floor, ceiling bays, long walls (with alcove openings), alcove
        // floors/backs/ceilings, entrance, rotunda.
        // =========================================================================
        const surfaces = [];

        // ---------- Main hall floor (140m long, 30m wide) ----------
        // Split into 7 bays of 20m along z for mesh sanity
        for (let i = 0; i < 7; i++) {
            const cz = HALL_Z_S + 10 + i * 20;
            surfaces.push({
                type: 'floor',
                transform: { position: [0, 0, cz], rotation: [0, 0, 0], scale: [1, 1, 1] },
                dimensions: { width: 30, height: 20, depth: 0.3 },
                material: 'marble_white',
                label: `Main floor bay ${i + 1}`,
            });
        }

        // ---------- Ceiling: coffered oak, 7 bays matching floor ----------
        for (let i = 0; i < 7; i++) {
            const cz = HALL_Z_S + 10 + i * 20;
            surfaces.push({
                type: 'ceiling',
                transform: { position: [0, CEIL_Y, cz], rotation: [0, 0, 0], scale: [1, 1, 1] },
                dimensions: { width: 30, height: 20, depth: 0.3 },
                material: 'oak_beam_dark',
                label: `Coffered ceiling bay ${i + 1}`,
            });
        }
        // Cross-beams between bays
        for (let i = 1; i < 7; i++) {
            const cz = HALL_Z_S + i * 20;
            surfaces.push({
                type: 'ceiling',
                transform: { position: [0, CEIL_Y - 0.3, cz], rotation: [0, 0, 0], scale: [1, 1, 1] },
                dimensions: { width: 30, height: 0.8, depth: 0.5 },
                material: 'oak_beam_dark',
                label: `Ceiling cross-beam ${i}`,
            });
        }

        // ---------- Long walls (west x=-15, east x=+15) broken by alcove openings ----------
        // Each alcove opening spans ALCOVE_WIDTH along z at its center.
        // Generate wall spans between opening edges.
        const openingEdges = [];
        for (const z of alcoveZs) {
            openingEdges.push([z - ALCOVE_WIDTH / 2, z + ALCOVE_WIDTH / 2]);
        }
        // Iterate spans: from HALL_Z_S -> first opening start, between openings, last opening end -> HALL_Z_N
        const buildLongWall = (xSign, mat1, mat2, labelSide) => {
            const x = xSign * HALL_HALF_W;
            let cursor = HALL_Z_S;
            let spanIdx = 0;
            for (let i = 0; i < openingEdges.length; i++) {
                const [openStart, openEnd] = openingEdges[i];
                if (openStart > cursor) {
                    const w = openStart - cursor;
                    const cz = (cursor + openStart) / 2;
                    const mat = (spanIdx % 2 === 0) ? mat1 : mat2;
                    surfaces.push({
                        type: 'wall',
                        transform: { position: [x, CEIL_Y / 2, cz], rotation: [0, 0, 0], scale: [1, 1, 1] },
                        dimensions: { width: w, height: CEIL_Y, depth: 0.5 },
                        material: mat,
                        label: `${labelSide} wall span ${spanIdx + 1}`,
                    });
                    spanIdx++;
                }
                cursor = openEnd;
            }
            if (HALL_Z_N > cursor) {
                const w = HALL_Z_N - cursor;
                const cz = (cursor + HALL_Z_N) / 2;
                const mat = (spanIdx % 2 === 0) ? mat1 : mat2;
                surfaces.push({
                    type: 'wall',
                    transform: { position: [x, CEIL_Y / 2, cz], rotation: [0, 0, 0], scale: [1, 1, 1] },
                    dimensions: { width: w, height: CEIL_Y, depth: 0.5 },
                    material: mat,
                    label: `${labelSide} wall final span`,
                });
            }
        };
        buildLongWall(-1, 'travertine_stone', 'sandstone_wall', 'W');
        buildLongWall(+1, 'travertine_stone', 'sandstone_wall', 'E');

        // ---------- Alcoves: floor, back wall, two side panels, coffered ceiling ----------
        for (let i = 0; i < alcoveZs.length; i++) {
            const z = alcoveZs[i];
            for (const xSign of [-1, +1]) {
                const wallX = xSign * HALL_HALF_W;
                const backX = xSign * ALCOVE_BACK;
                const midX = (wallX + backX) / 2;
                const side = xSign < 0 ? 'W' : 'E';
                const backMat = (i % 2 === 0) ? 'travertine_stone' : 'sandstone_wall';

                // Alcove floor
                surfaces.push({
                    type: 'floor',
                    transform: { position: [midX, 0, z], rotation: [0, 0, 0], scale: [1, 1, 1] },
                    dimensions: { width: ALCOVE_DEPTH, height: ALCOVE_WIDTH, depth: 0.3 },
                    material: 'marble_white',
                    label: `${side} alcove ${i + 1} floor`,
                });
                // Back wall (runs along z axis — rotate 90)
                surfaces.push({
                    type: 'wall',
                    transform: { position: [backX, CEIL_Y / 2, z], rotation: [0, 90, 0], scale: [1, 1, 1] },
                    dimensions: { width: ALCOVE_WIDTH, height: CEIL_Y, depth: 0.4 },
                    material: backMat,
                    label: `${side} alcove ${i + 1} back`,
                });
                // Side panels (runs along x axis, normal along z)
                surfaces.push({
                    type: 'wall',
                    transform: { position: [midX, CEIL_Y / 2, z - ALCOVE_WIDTH / 2], rotation: [0, 0, 0], scale: [1, 1, 1] },
                    dimensions: { width: ALCOVE_DEPTH, height: CEIL_Y, depth: 0.3 },
                    material: 'travertine_stone',
                    label: `${side} alcove ${i + 1} side S`,
                });
                surfaces.push({
                    type: 'wall',
                    transform: { position: [midX, CEIL_Y / 2, z + ALCOVE_WIDTH / 2], rotation: [0, 0, 0], scale: [1, 1, 1] },
                    dimensions: { width: ALCOVE_DEPTH, height: CEIL_Y, depth: 0.3 },
                    material: 'travertine_stone',
                    label: `${side} alcove ${i + 1} side N`,
                });
                // Alcove ceiling
                surfaces.push({
                    type: 'ceiling',
                    transform: { position: [midX, CEIL_Y, z], rotation: [0, 0, 0], scale: [1, 1, 1] },
                    dimensions: { width: ALCOVE_DEPTH, height: ALCOVE_WIDTH, depth: 0.2 },
                    material: 'oak_beam_dark',
                    label: `${side} alcove ${i + 1} ceiling`,
                });
                // Pedestal (basalt + bronze cap) inside each alcove, placed ~0.8m in front of back wall
                const pedX = backX - xSign * 0.8;
                surfaces.push({
                    type: 'floor',
                    transform: { position: [pedX, 0.5, z], rotation: [0, 0, 0], scale: [1, 1, 1] },
                    dimensions: { width: 1.2, height: 1.2, depth: 1 },
                    material: 'basalt_dark',
                    label: `${side} alcove ${i + 1} pedestal`,
                });
                surfaces.push({
                    type: 'floor',
                    transform: { position: [pedX, 1.1, z], rotation: [0, 0, 0], scale: [1, 1, 1] },
                    dimensions: { width: 1.0, height: 1.0, depth: 0.15 },
                    material: 'bronze_trim',
                    label: `${side} alcove ${i + 1} pedestal cap`,
                });
            }
        }

        // ---------- South (entrance) wall with doorway gap ----------
        // Wall segments to left/right of 8m doorway
        surfaces.push({
            type: 'wall',
            transform: { position: [-11, CEIL_Y / 2, HALL_Z_S], rotation: [0, 0, 0], scale: [1, 1, 1] },
            dimensions: { width: 8, height: CEIL_Y, depth: 0.5 },
            material: 'sandstone_wall',
            label: 'Entrance wall W',
        });
        surfaces.push({
            type: 'wall',
            transform: { position: [11, CEIL_Y / 2, HALL_Z_S], rotation: [0, 0, 0], scale: [1, 1, 1] },
            dimensions: { width: 8, height: CEIL_Y, depth: 0.5 },
            material: 'sandstone_wall',
            label: 'Entrance wall E',
        });
        // Lintel
        surfaces.push({
            type: 'wall',
            transform: { position: [0, CEIL_Y - 1.5, HALL_Z_S], rotation: [0, 0, 0], scale: [1, 1, 1] },
            dimensions: { width: 14, height: 3, depth: 0.5 },
            material: 'sandstone_wall',
            label: 'Entrance lintel',
        });

        // ---------- North wall (between hall and rotunda) with archway gap ----------
        surfaces.push({
            type: 'wall',
            transform: { position: [-11, CEIL_Y / 2, HALL_Z_N], rotation: [0, 0, 0], scale: [1, 1, 1] },
            dimensions: { width: 8, height: CEIL_Y, depth: 0.5 },
            material: 'sandstone_wall',
            label: 'Rotunda arch W',
        });
        surfaces.push({
            type: 'wall',
            transform: { position: [11, CEIL_Y / 2, HALL_Z_N], rotation: [0, 0, 0], scale: [1, 1, 1] },
            dimensions: { width: 8, height: CEIL_Y, depth: 0.5 },
            material: 'sandstone_wall',
            label: 'Rotunda arch E',
        });
        surfaces.push({
            type: 'wall',
            transform: { position: [0, CEIL_Y - 1.5, HALL_Z_N], rotation: [0, 0, 0], scale: [1, 1, 1] },
            dimensions: { width: 14, height: 3, depth: 0.5 },
            material: 'sandstone_wall',
            label: 'Rotunda arch lintel',
        });

        // ---------- Octagonal rotunda (center at ROT_CENTER_Z) ----------
        // Big marble floor + dome ceiling
        surfaces.push({
            type: 'floor',
            transform: { position: [0, 0, ROT_CENTER_Z], rotation: [0, 0, 0], scale: [1, 1, 1] },
            dimensions: { width: 28, height: 28, depth: 0.3 },
            material: 'marble_white',
            label: 'Rotunda floor',
        });
        surfaces.push({
            type: 'ceiling',
            transform: { position: [0, CEIL_Y + 2, ROT_CENTER_Z], rotation: [0, 0, 0], scale: [1, 1, 1] },
            dimensions: { width: 28, height: 28, depth: 0.3 },
            material: 'oak_beam_dark',
            label: 'Rotunda dome ceiling',
        });

        // 8 octagon wall segments around rotunda (skip south-facing which opens into hall)
        // Octagon with 8 sides: compute at angles 22.5, 67.5, 112.5, ..., each 45° apart
        const octR = 13; // distance from center
        for (let k = 0; k < 8; k++) {
            const angDeg = 22.5 + k * 45;
            const ang = angDeg * Math.PI / 180;
            // Skip the south-facing segment (the one with center angle pointing toward hall = -z from rotunda center)
            // That's when direction vector points toward -z: angle = 270° ... closest octagon side is centered at 247.5 and 292.5
            // We want an open arch toward -z, so skip angles 247.5 and 292.5
            if (angDeg === 247.5 || angDeg === 292.5) continue;
            const px = Math.sin(ang) * octR;
            const pz = ROT_CENTER_Z - Math.cos(ang) * octR;
            // Wall faces center; rotation_y so wall normal points inward
            // The wall is aligned perpendicular to the radial direction
            const rotY = -angDeg; // wall rotated so its width lies along tangent
            const mat = (k % 2 === 0) ? 'travertine_stone' : 'sandstone_wall';
            surfaces.push({
                type: 'wall',
                transform: { position: [px, (CEIL_Y + 2) / 2, pz], rotation: [0, rotY, 0], scale: [1, 1, 1] },
                dimensions: { width: 10, height: CEIL_Y + 2, depth: 0.5 },
                material: mat,
                label: `Rotunda octagon segment ${k + 1}`,
            });
        }

        // Central rotunda plinth for marble_bust_01
        surfaces.push({
            type: 'floor',
            transform: { position: [0, 0.6, ROT_CENTER_Z], rotation: [0, 0, 0], scale: [1, 1, 1] },
            dimensions: { width: 3, height: 3, depth: 1.2 },
            material: 'basalt_dark',
            label: 'Rotunda central plinth base',
        });
        surfaces.push({
            type: 'floor',
            transform: { position: [0, 1.3, ROT_CENTER_Z], rotation: [0, 0, 0], scale: [1, 1, 1] },
            dimensions: { width: 2.4, height: 2.4, depth: 0.3 },
            material: 'bronze_trim',
            label: 'Rotunda central plinth cap',
        });

        // 6 flanking pedestals in hexagonal arrangement around rotunda center
        const flankPeds = [];
        for (let k = 0; k < 6; k++) {
            const ang = (k * 60 + 30) * Math.PI / 180;
            const r = 5.5;
            const px = Math.sin(ang) * r;
            const pz = ROT_CENTER_Z + Math.cos(ang) * r;
            flankPeds.push([px, pz, k]);
            surfaces.push({
                type: 'floor',
                transform: { position: [px, 0.5, pz], rotation: [0, 0, 0], scale: [1, 1, 1] },
                dimensions: { width: 1.2, height: 1.2, depth: 1 },
                material: 'basalt_dark',
                label: `Rotunda flanking pedestal ${k + 1}`,
            });
            surfaces.push({
                type: 'floor',
                transform: { position: [px, 1.1, pz], rotation: [0, 0, 0], scale: [1, 1, 1] },
                dimensions: { width: 1.0, height: 1.0, depth: 0.15 },
                material: 'bronze_trim',
                label: `Rotunda flanking pedestal ${k + 1} cap`,
            });
        }

        // Entrance stairs (outside south wall)
        for (let i = 0; i < 4; i++) {
            surfaces.push({
                type: 'floor',
                transform: { position: [0, -0.2 - i * 0.2, HALL_Z_S - 2 - i], rotation: [0, 0, 0], scale: [1, 1, 1] },
                dimensions: { width: 14 + i * 2, height: 1, depth: 0.4 },
                material: 'travertine_stone',
                label: `Entrance step ${i + 1}`,
            });
        }

        // Statue plinths flanking the entrance (inside)
        surfaces.push({
            type: 'floor',
            transform: { position: [-8, 0.5, HALL_Z_S + 4], rotation: [0, 0, 0], scale: [1, 1, 1] },
            dimensions: { width: 1.6, height: 1.6, depth: 1 },
            material: 'basalt_dark',
            label: 'Entrance statue plinth W',
        });
        surfaces.push({
            type: 'floor',
            transform: { position: [8, 0.5, HALL_Z_S + 4], rotation: [0, 0, 0], scale: [1, 1, 1] },
            dimensions: { width: 1.6, height: 1.6, depth: 1 },
            material: 'basalt_dark',
            label: 'Entrance statue plinth E',
        });

        // Corner bust pedestals (4 corners of main hall)
        const cornerPedSpots = [
            [-13, HALL_Z_S + 3, 'SW'],
            [13, HALL_Z_S + 3, 'SE'],
            [-13, HALL_Z_N - 3, 'NW'],
            [13, HALL_Z_N - 3, 'NE'],
        ];
        for (const [cx, cz, lbl] of cornerPedSpots) {
            surfaces.push({
                type: 'floor',
                transform: { position: [cx, 0.5, cz], rotation: [0, 0, 0], scale: [1, 1, 1] },
                dimensions: { width: 1.3, height: 1.3, depth: 1 },
                material: 'basalt_dark',
                label: `Corner bust plinth ${lbl}`,
            });
        }

        // =========================================================================
        // Props: columns, chandeliers, busts, chests, banners
        // =========================================================================
        const props = [];

        // Central nave: 2 rows of marble columns at x=+/-6, 16 columns per row
        // Span from z=HALL_Z_S+6 to HALL_Z_N-6 (~113m) with 16 positions → ~7.5m spacing
        const NAVE_COL_COUNT = 16;
        const naveZStart = HALL_Z_S + 6;
        const naveZEnd = HALL_Z_N - 6;
        const naveStep = (naveZEnd - naveZStart) / (NAVE_COL_COUNT - 1);
        for (let i = 0; i < NAVE_COL_COUNT; i++) {
            const cz = naveZStart + i * naveStep;
            for (const xSign of [-1, +1]) {
                props.push({
                    glb: 'assets/props/kenney/mini_dungeon/column.glb',
                    transform: { position: [xSign * 6, 0, cz], rotation: [0, 0, 0], scale: [2.8, 4.5, 2.8] },
                    cast_shadow: true,
                    receive_shadow: true,
                    label: `${xSign < 0 ? 'W' : 'E'} nave col ${i + 1}`,
                });
            }
        }

        // Chandeliers down the center of the nave
        const CHAND_COUNT = 7;
        for (let i = 0; i < CHAND_COUNT; i++) {
            const cz = HALL_Z_S + 10 + i * ((HALL_Z_N - HALL_Z_S - 20) / (CHAND_COUNT - 1));
            props.push({
                glb: 'assets/props/polyhaven/Chandelier_01/Chandelier_01_2k.gltf',
                transform: { position: [0, CEIL_Y - 1.2, cz], rotation: [0, 0, 0], scale: [2.5, 2.5, 2.5] },
                cast_shadow: false,
                receive_shadow: false,
                label: `Nave chandelier ${i + 1}`,
            });
        }

        // Rotunda center: marble bust 01 on central plinth
        props.push({
            glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf',
            transform: { position: [0, 1.45, ROT_CENTER_Z], rotation: [0, 0, 0], scale: [2.5, 2.5, 2.5] },
            cast_shadow: true,
            receive_shadow: true,
            label: 'Rotunda central marble bust',
        });

        // Flanking pedestals: statue_head props
        for (const [px, pz, k] of flankPeds) {
            props.push({
                glb: 'assets/props/kenney/survival_kit/statue_head.glb',
                transform: { position: [px, 1.25, pz], rotation: [0, (k * 60) % 360, 0], scale: [1.2, 1.2, 1.2] },
                cast_shadow: true,
                receive_shadow: true,
                label: `Rotunda flanking statue ${k + 1}`,
            });
        }

        // Rotunda chandelier
        props.push({
            glb: 'assets/props/polyhaven/Chandelier_03/Chandelier_03_2k.gltf',
            transform: { position: [0, CEIL_Y + 0.8, ROT_CENTER_Z], rotation: [0, 0, 0], scale: [4, 4, 4] },
            cast_shadow: false,
            receive_shadow: false,
            label: 'Rotunda grand chandelier',
        });

        // Corner busts
        for (const [cx, cz, lbl] of cornerPedSpots) {
            props.push({
                glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf',
                transform: { position: [cx, 1.25, cz], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                cast_shadow: true,
                receive_shadow: true,
                label: `Corner bust ${lbl}`,
            });
        }

        // Entrance flanking statues (statue_obelisk)
        props.push({
            glb: 'assets/props/kenney/survival_kit/statue_obelisk.glb',
            transform: { position: [-8, 1.25, HALL_Z_S + 4], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
            cast_shadow: true, receive_shadow: true, label: 'Entrance obelisk W',
        });
        props.push({
            glb: 'assets/props/kenney/survival_kit/statue_obelisk.glb',
            transform: { position: [8, 1.25, HALL_Z_S + 4], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
            cast_shadow: true, receive_shadow: true, label: 'Entrance obelisk E',
        });

        // Alcove display items — small vase/chest on each pedestal (40 total)
        for (let i = 0; i < alcoveZs.length; i++) {
            const z = alcoveZs[i];
            for (const xSign of [-1, +1]) {
                const pedX = xSign * ALCOVE_BACK - xSign * 0.8;
                const side = xSign < 0 ? 'W' : 'E';
                // Alternate prop types for visual variety
                const propChoice = (i + (xSign > 0 ? 1 : 0)) % 3;
                if (propChoice === 0) {
                    props.push({
                        glb: 'assets/props/kenney/mini_dungeon/chest.glb',
                        transform: { position: [pedX, 1.3, z], rotation: [0, 90, 0], scale: [0.9, 0.9, 0.9] },
                        cast_shadow: true, receive_shadow: true,
                        label: `${side} alcove ${i + 1} chest`,
                    });
                } else if (propChoice === 1) {
                    props.push({
                        glb: 'assets/props/kenney/survival_kit/statue_head.glb',
                        transform: { position: [pedX, 1.3, z], rotation: [0, xSign < 0 ? 90 : -90, 0], scale: [0.9, 0.9, 0.9] },
                        cast_shadow: true, receive_shadow: true,
                        label: `${side} alcove ${i + 1} head`,
                    });
                } else {
                    props.push({
                        glb: 'assets/props/kenney/survival_kit/statue_block.glb',
                        transform: { position: [pedX, 1.3, z], rotation: [0, 0, 0], scale: [0.9, 0.9, 0.9] },
                        cast_shadow: true, receive_shadow: true,
                        label: `${side} alcove ${i + 1} block`,
                    });
                }
            }
        }

        // Banners hung on some alcove back walls for color
        for (let i = 0; i < alcoveZs.length; i += 4) {
            const z = alcoveZs[i];
            props.push({
                glb: 'assets/props/kenney/mini_dungeon/banner.glb',
                transform: { position: [-ALCOVE_BACK + 0.2, CEIL_Y - 2, z], rotation: [0, 90, 0], scale: [1.3, 1.3, 1.3] },
                cast_shadow: false, receive_shadow: false,
                label: `W alcove ${i + 1} banner`,
            });
            props.push({
                glb: 'assets/props/kenney/mini_dungeon/banner.glb',
                transform: { position: [ALCOVE_BACK - 0.2, CEIL_Y - 2, z], rotation: [0, -90, 0], scale: [1.3, 1.3, 1.3] },
                cast_shadow: false, receive_shadow: false,
                label: `E alcove ${i + 1} banner`,
            });
        }

        // =========================================================================
        // LOCI — procedural + handcrafted
        // =========================================================================
        const proceduralLoci = [];

        // --- 40 alcove shelfGrids (2 rows × 4 cols per alcove = 8 loci × 40 = 320) ---
        for (let i = 0; i < alcoveZs.length; i++) {
            const z = alcoveZs[i];
            for (const xSign of [-1, +1]) {
                const side = xSign < 0 ? 'W' : 'E';
                // Grid sits inside alcove just in front of back wall (0.3m off wall)
                // rightAxis runs along the alcove width (the z direction)
                // upAxis = +y
                // origin = near-back corner of the alcove, bottom-left shelf
                const backX = xSign * ALCOVE_BACK;
                const originX = backX - xSign * 0.25;  // 0.25m off back wall toward hall
                const originZ = z - ((4 - 1) * 0.8) / 2;  // center 4 cols at 0.8m spacing
                const originY = 1.7; // bottom shelf height (above pedestal)
                proceduralLoci.push(
                    ...this._shelfGrid({
                        origin: [originX, originY, originZ],
                        rightAxis: [0, 0, 1],
                        upAxis: [0, 1, 0],
                        rows: 2,
                        cols: 4,
                        stepRight: 0.8,
                        stepUp: 1.1,
                        marker: 'orb',
                        labelPrefix: `${side} alcove ${i + 1} shelf`,
                    })
                );
            }
        }

        // --- Central nave display rows (2 rows × 30 = 60 loci) ---
        proceduralLoci.push(
            ...this._nicheRow({
                start: [-60, 1.3, -2],
                end: [60, 1.3, -2],
                count: 30,
                marker: 'orb',
                labelPrefix: 'Central nave display S',
            })
        );
        proceduralLoci.push(
            ...this._nicheRow({
                start: [-60, 1.3, 2],
                end: [60, 1.3, 2],
                count: 30,
                marker: 'orb',
                labelPrefix: 'Central nave display N',
            })
        );

        // --- Rotunda ring (30 loci around marble bust) ---
        proceduralLoci.push(
            ...this._ring({
                center: [0, 0, ROT_CENTER_Z],
                radius: 8,
                count: 30,
                y: 1.5,
                marker: 'orb',
                labelPrefix: 'Rotunda ring',
            })
        );

        // --- Handcrafted hero loci ---
        const handcraftedLoci = [];

        // Return portal near spawn point
        handcraftedLoci.push({
            position: [0, 1.6, -58],
            marker_type: 'door',
            marker_settings: { portal_target: 'forum' },
            label: 'Return to The Forum',
            card_ids: [],
        });

        // Rotunda central statue locus
        handcraftedLoci.push({
            position: [0, 2.2, ROT_CENTER_Z],
            marker_type: 'statue',
            label: 'Rotunda central marble bust',
            card_ids: [],
        });

        // 6 rotunda flanking pedestal loci
        for (const [px, pz, k] of flankPeds) {
            handcraftedLoci.push({
                position: [px, 1.6, pz],
                marker_type: 'pedestal',
                label: `Rotunda flanking pedestal ${k + 1}`,
                card_ids: [],
            });
        }

        // 4 corner bust loci
        for (const [cx, cz, lbl] of cornerPedSpots) {
            handcraftedLoci.push({
                position: [cx, 1.6, cz],
                marker_type: 'statue',
                label: `Corner bust ${lbl}`,
                card_ids: [],
            });
        }

        // 2 entrance statue loci
        handcraftedLoci.push({
            position: [-8, 1.6, HALL_Z_S + 4],
            marker_type: 'statue',
            label: 'Entrance obelisk W',
            card_ids: [],
        });
        handcraftedLoci.push({
            position: [8, 1.6, HALL_Z_S + 4],
            marker_type: 'statue',
            label: 'Entrance obelisk E',
            card_ids: [],
        });

        // Alcove "frame" (wall painting) loci — one per alcove back wall, 40 total
        for (let i = 0; i < alcoveZs.length; i++) {
            const z = alcoveZs[i];
            for (const xSign of [-1, +1]) {
                const side = xSign < 0 ? 'W' : 'E';
                const backX = xSign * ALCOVE_BACK - xSign * 0.2;
                handcraftedLoci.push({
                    position: [backX, 4.0, z],
                    marker_type: 'frame',
                    label: `${side} alcove ${i + 1} painting`,
                    card_ids: [],
                });
            }
        }

        // Pedestal hero loci — one per alcove pedestal (40 total)
        for (let i = 0; i < alcoveZs.length; i++) {
            const z = alcoveZs[i];
            for (const xSign of [-1, +1]) {
                const side = xSign < 0 ? 'W' : 'E';
                const pedX = xSign * ALCOVE_BACK - xSign * 0.8;
                handcraftedLoci.push({
                    position: [pedX, 1.3, z],
                    marker_type: 'pedestal',
                    label: `${side} alcove ${i + 1} pedestal exhibit`,
                    card_ids: [],
                });
            }
        }

        // =========================================================================
        // Assemble template
        // =========================================================================
        const t = {
            meta: {
                id: 'museum_hall',
                name: 'Museum Hall',
                desc: 'Grand neo-classical gallery — 140m colonnaded marble hall with 40 alcove exhibits and a rear octagonal rotunda',
                spawn_point: { position: [0, 1.6, -60], rotation_y: 180 },
                scale: 1.0,
            },
            environment: {
                hdri: 'assets/hdri/church_museum_2k.hdr',
                hdri_intensity: 1.0,
                hdri_as_background: true,
                fog: { color: 0xe0e4e8, near: 180, far: 360 },
                sun: { position: [0, 120, 0], intensity: 1.8, color: 0xffffee, cast_shadow: true, shadow_bounds: 160 },
                ambient: { intensity: 0.22 },
            },
            materials: {
                marble_white: {
                    albedo: 'assets/textures/marble_white/albedo_2k.jpg',
                    normal: 'assets/textures/marble_white/normal_2k.jpg',
                    roughness: 'assets/textures/marble_white/roughness_2k.jpg',
                    ao: 'assets/textures/marble_white/ao_2k.jpg',
                    repeat: [10, 18],
                    roughness_scale: 0.9,
                    metalness: 0,
                },
                travertine_stone: {
                    albedo: 'assets/textures/travertine_stone/albedo_2k.jpg',
                    normal: 'assets/textures/travertine_stone/normal_2k.jpg',
                    roughness: 'assets/textures/travertine_stone/roughness_2k.jpg',
                    ao: 'assets/textures/travertine_stone/ao_2k.jpg',
                    repeat: [5, 3],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                sandstone_wall: {
                    albedo: 'assets/textures/sandstone_wall/albedo_2k.jpg',
                    normal: 'assets/textures/sandstone_wall/normal_2k.jpg',
                    roughness: 'assets/textures/sandstone_wall/roughness_2k.jpg',
                    ao: 'assets/textures/sandstone_wall/ao_2k.jpg',
                    repeat: [5, 3],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                oak_beam_dark: {
                    albedo: 'assets/textures/oak_beam_dark/albedo_2k.jpg',
                    normal: 'assets/textures/oak_beam_dark/normal_2k.jpg',
                    roughness: 'assets/textures/oak_beam_dark/roughness_2k.jpg',
                    ao: 'assets/textures/oak_beam_dark/ao_2k.jpg',
                    repeat: [4, 4],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                bronze_trim: {
                    albedo: 'assets/textures/bronze_trim/albedo_2k.jpg',
                    normal: 'assets/textures/bronze_trim/normal_2k.jpg',
                    roughness: 'assets/textures/bronze_trim/roughness_2k.jpg',
                    ao: null,
                    repeat: [2, 2],
                    roughness_scale: 0.25,
                    metalness: 0.85,
                },
                basalt_dark: {
                    albedo: 'assets/textures/basalt_dark/albedo_2k.jpg',
                    normal: 'assets/textures/basalt_dark/normal_2k.jpg',
                    roughness: 'assets/textures/basalt_dark/roughness_2k.jpg',
                    ao: 'assets/textures/basalt_dark/ao_2k.jpg',
                    repeat: [2, 2],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
            },
            surfaces: surfaces,
            props: props,
            loci: [
                ...handcraftedLoci,
                ...proceduralLoci,
            ],
        };

        return t;
    },
    _catacombs() {
        const t = {
            meta: {
                id: 'catacombs',
                name: 'Catacombs',
                desc: 'Underground burial network — three parallel arched corridors, altar chamber, saint crypt, and hundreds of wall niches for memory loci',
                spawn_point: { position: [0, 1.6, -35], rotation_y: 0 },
                scale: 1.0,
            },
            environment: {
                hdri: 'assets/hdri/drachenfels_cellar_2k.hdr',
                hdri_intensity: 0.45,
                hdri_as_background: true,
                fog: { color: 0x0a0808, near: 4, far: 40 },
                sun: { position: [0, 40, 0], intensity: 0.15, color: 0xffeedd, cast_shadow: false, shadow_bounds: 40 },
                ambient: { intensity: 0.08 },
            },
            materials: {
                basalt_dark: {
                    albedo: 'assets/textures/basalt_dark/albedo_2k.jpg',
                    normal: 'assets/textures/basalt_dark/normal_2k.jpg',
                    roughness: 'assets/textures/basalt_dark/roughness_2k.jpg',
                    ao: 'assets/textures/basalt_dark/ao_2k.jpg',
                    repeat: [6, 6],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                sandstone_wall: {
                    albedo: 'assets/textures/sandstone_wall/albedo_2k.jpg',
                    normal: 'assets/textures/sandstone_wall/normal_2k.jpg',
                    roughness: 'assets/textures/sandstone_wall/roughness_2k.jpg',
                    ao: 'assets/textures/sandstone_wall/ao_2k.jpg',
                    repeat: [3, 3],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                cobblestone_old: {
                    albedo: 'assets/textures/cobblestone_old/albedo_2k.jpg',
                    normal: 'assets/textures/cobblestone_old/normal_2k.jpg',
                    roughness: 'assets/textures/cobblestone_old/roughness_2k.jpg',
                    ao: 'assets/textures/cobblestone_old/ao_2k.jpg',
                    repeat: [4, 4],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                brick_aged: {
                    albedo: 'assets/textures/brick_aged/albedo_2k.jpg',
                    normal: 'assets/textures/brick_aged/normal_2k.jpg',
                    roughness: 'assets/textures/brick_aged/roughness_2k.jpg',
                    ao: 'assets/textures/brick_aged/ao_2k.jpg',
                    repeat: [4, 4],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                oak_beam_dark: {
                    albedo: 'assets/textures/oak_beam_dark/albedo_2k.jpg',
                    normal: 'assets/textures/oak_beam_dark/normal_2k.jpg',
                    roughness: 'assets/textures/oak_beam_dark/roughness_2k.jpg',
                    ao: 'assets/textures/oak_beam_dark/ao_2k.jpg',
                    repeat: [2, 2],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                bronze_trim: {
                    albedo: 'assets/textures/bronze_trim/albedo_2k.jpg',
                    normal: 'assets/textures/bronze_trim/normal_2k.jpg',
                    roughness: 'assets/textures/bronze_trim/roughness_2k.jpg',
                    ao: null,
                    repeat: [2, 2],
                    roughness_scale: 0.3,
                    metalness: 0.9,
                },
                travertine_stone: {
                    albedo: 'assets/textures/travertine_stone/albedo_2k.jpg',
                    normal: 'assets/textures/travertine_stone/normal_2k.jpg',
                    roughness: 'assets/textures/travertine_stone/roughness_2k.jpg',
                    ao: 'assets/textures/travertine_stone/ao_2k.jpg',
                    repeat: [3, 3],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
            },
            // ============================================================
            // SURFACES
            // ============================================================
            // Plan (+z = south/spawn, -z = north/altar):
            //
            //          Altar chamber (14x14 @ z=-48, x=0)
            //                    |
            //   West corr ====== | ====== Central corr ====== | ====== East corr
            //      x=-12         |           x=0              |          x=+12
            //        |           |             |              |            |
            //        +--- X-corridor N (z=-15) +              |            |
            //        |           |             |              |            |
            //        |           |             |    Saint crypt (10x10 @ z=0, x=+22)
            //        |           |             |              |            |
            //        +--- X-corridor S (z=+15) +              |            |
            //        |           |             |              |            |
            //    (south entrance ends z=+40, spawn at z=-35 just inside)
            //
            surfaces: [
                // ============================================================
                // CENTRAL CORRIDOR (x=0)  -  floor z=-40..+40, walls at x=±2
                // ============================================================
                { type: 'floor', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 80, depth: 0.3 }, material: 'basalt_dark', label: 'Central corridor floor' },
                { type: 'wall', transform: { position: [-2, 2, 0], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 80, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Central corridor W wall' },
                { type: 'wall', transform: { position: [2, 2, 0], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 80, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Central corridor E wall' },
                { type: 'ceiling', transform: { position: [0, 4, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 80, depth: 0.15 }, material: 'brick_aged', label: 'Central corridor vault' },
                // South end cap
                { type: 'wall', transform: { position: [0, 2, 40], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Central corridor S cap' },
                // North cap will open into altar chamber; split wall around opening
                { type: 'wall', transform: { position: [-1.5, 2, -40], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Central corridor N cap W' },
                { type: 'wall', transform: { position: [1.5, 2, -40], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Central corridor N cap E' },

                // ============================================================
                // WEST CORRIDOR (x=-12)
                // ============================================================
                { type: 'floor', transform: { position: [-12, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 80, depth: 0.3 }, material: 'basalt_dark', label: 'West corridor floor' },
                { type: 'wall', transform: { position: [-14, 2, 0], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 80, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'West corridor W wall' },
                { type: 'wall', transform: { position: [-10, 2, 0], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 80, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'West corridor E wall' },
                { type: 'ceiling', transform: { position: [-12, 4, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 80, depth: 0.15 }, material: 'brick_aged', label: 'West corridor vault' },
                { type: 'wall', transform: { position: [-12, 2, 40], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'West corridor S cap' },
                { type: 'wall', transform: { position: [-12, 2, -40], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'West corridor N cap' },

                // ============================================================
                // EAST CORRIDOR (x=+12)
                // ============================================================
                { type: 'floor', transform: { position: [12, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 80, depth: 0.3 }, material: 'basalt_dark', label: 'East corridor floor' },
                { type: 'wall', transform: { position: [10, 2, 0], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 80, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'East corridor W wall' },
                { type: 'wall', transform: { position: [14, 2, 0], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 80, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'East corridor E wall' },
                { type: 'ceiling', transform: { position: [12, 4, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 80, depth: 0.15 }, material: 'brick_aged', label: 'East corridor vault' },
                { type: 'wall', transform: { position: [12, 2, 40], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'East corridor S cap' },
                { type: 'wall', transform: { position: [12, 2, -40], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'East corridor N cap' },

                // ============================================================
                // CROSS CORRIDOR NORTH (z=-15) connects West→Central→East
                // Floor spans x=-10..+10 (width 20), depth 4m (z=-17..-13)
                // ============================================================
                { type: 'floor', transform: { position: [0, 0, -15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 4, depth: 0.3 }, material: 'basalt_dark', label: 'Cross-N floor' },
                { type: 'wall', transform: { position: [0, 2, -17], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Cross-N N wall' },
                { type: 'wall', transform: { position: [0, 2, -13], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Cross-N S wall' },
                { type: 'ceiling', transform: { position: [0, 4, -15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 4, depth: 0.15 }, material: 'brick_aged', label: 'Cross-N vault' },

                // ============================================================
                // CROSS CORRIDOR SOUTH (z=+15)
                // ============================================================
                { type: 'floor', transform: { position: [0, 0, 15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 4, depth: 0.3 }, material: 'basalt_dark', label: 'Cross-S floor' },
                { type: 'wall', transform: { position: [0, 2, 13], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Cross-S N wall' },
                { type: 'wall', transform: { position: [0, 2, 17], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Cross-S S wall' },
                { type: 'ceiling', transform: { position: [0, 4, 15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 4, depth: 0.15 }, material: 'brick_aged', label: 'Cross-S vault' },

                // ============================================================
                // ALTAR CHAMBER (north end of Central, 14x14 at x=0, z=-48)
                // ============================================================
                { type: 'floor', transform: { position: [0, 0, -48], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 14, height: 14, depth: 0.3 }, material: 'cobblestone_old', label: 'Altar chamber floor' },
                { type: 'wall', transform: { position: [0, 2, -55], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 14, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Altar chamber N wall' },
                // Altar S wall split around 2m opening toward central corridor
                { type: 'wall', transform: { position: [-4.5, 2, -41], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 5, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Altar chamber S wall W' },
                { type: 'wall', transform: { position: [4.5, 2, -41], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 5, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Altar chamber S wall E' },
                { type: 'wall', transform: { position: [-7, 2, -48], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 14, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Altar chamber W wall' },
                { type: 'wall', transform: { position: [7, 2, -48], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 14, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Altar chamber E wall' },
                { type: 'ceiling', transform: { position: [0, 4, -48], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 14, height: 14, depth: 0.15 }, material: 'brick_aged', label: 'Altar chamber vault' },
                // Central altar (composed surfaces)
                { type: 'floor', transform: { position: [0, 0.5, -48], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.4, height: 2.4, depth: 1.0 }, material: 'travertine_stone', label: 'Altar base' },
                { type: 'floor', transform: { position: [0, 1.1, -48], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.8, height: 2.8, depth: 0.2 }, material: 'bronze_trim', label: 'Altar top' },

                // ============================================================
                // SAINT CRYPT (off East corridor mid-point, at x=+22, z=0, 10x10)
                // Connecting passage from east corridor (x=14..+17) at z=0
                // ============================================================
                // Passage floor + walls
                { type: 'floor', transform: { position: [18.5, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 9, height: 3, depth: 0.3 }, material: 'basalt_dark', label: 'Crypt passage floor' },
                { type: 'wall', transform: { position: [18.5, 2, 1.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 9, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Crypt passage S wall' },
                { type: 'wall', transform: { position: [18.5, 2, -1.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 9, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Crypt passage N wall' },
                { type: 'ceiling', transform: { position: [18.5, 4, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 9, height: 3, depth: 0.15 }, material: 'brick_aged', label: 'Crypt passage vault' },

                // Crypt chamber (10x10 centered at x=+28, z=0)
                { type: 'floor', transform: { position: [28, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 10, depth: 0.3 }, material: 'cobblestone_old', label: 'Saint crypt floor' },
                { type: 'wall', transform: { position: [28, 2, 5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Saint crypt S wall' },
                { type: 'wall', transform: { position: [28, 2, -5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Saint crypt N wall' },
                { type: 'wall', transform: { position: [33, 2, 0], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Saint crypt E wall' },
                { type: 'wall', transform: { position: [23, 2, 3], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Saint crypt W wall N' },
                { type: 'wall', transform: { position: [23, 2, -3], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Saint crypt W wall S' },
                { type: 'ceiling', transform: { position: [28, 4, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 10, depth: 0.15 }, material: 'brick_aged', label: 'Saint crypt vault' },

                // Saint sarcophagus (composed boxes)
                { type: 'floor', transform: { position: [28, 0.4, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.8, height: 4.0, depth: 0.8 }, material: 'travertine_stone', label: 'Saint sarcophagus base' },
                { type: 'floor', transform: { position: [28, 1.0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.4, height: 3.6, depth: 0.4 }, material: 'travertine_stone', label: 'Saint sarcophagus body' },
                { type: 'floor', transform: { position: [28, 1.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.6, height: 3.8, depth: 0.3 }, material: 'oak_beam_dark', label: 'Saint sarcophagus lid' },
                { type: 'floor', transform: { position: [28, 1.8, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.6, height: 2.8, depth: 0.15 }, material: 'bronze_trim', label: 'Saint sarcophagus crown' },

                // ============================================================
                // CROSS-CORRIDOR SARCOPHAGI (hero handcrafted pieces)
                // ============================================================
                // Cross-N sarcophagi flanking passage
                { type: 'floor', transform: { position: [-6, 0.4, -15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 2.6, depth: 0.8 }, material: 'travertine_stone', label: 'Cross-N sarcophagus W base' },
                { type: 'floor', transform: { position: [-6, 1.0, -15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 2.4, depth: 0.3 }, material: 'oak_beam_dark', label: 'Cross-N sarcophagus W lid' },
                { type: 'floor', transform: { position: [6, 0.4, -15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 2.6, depth: 0.8 }, material: 'travertine_stone', label: 'Cross-N sarcophagus E base' },
                { type: 'floor', transform: { position: [6, 1.0, -15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 2.4, depth: 0.3 }, material: 'oak_beam_dark', label: 'Cross-N sarcophagus E lid' },
                // Cross-S sarcophagi
                { type: 'floor', transform: { position: [-6, 0.4, 15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 2.6, depth: 0.8 }, material: 'travertine_stone', label: 'Cross-S sarcophagus W base' },
                { type: 'floor', transform: { position: [-6, 1.0, 15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 2.4, depth: 0.3 }, material: 'oak_beam_dark', label: 'Cross-S sarcophagus W lid' },
                { type: 'floor', transform: { position: [6, 0.4, 15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 2.6, depth: 0.8 }, material: 'travertine_stone', label: 'Cross-S sarcophagus E base' },
                { type: 'floor', transform: { position: [6, 1.0, 15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 2.4, depth: 0.3 }, material: 'oak_beam_dark', label: 'Cross-S sarcophagus E lid' },
            ],
            // ============================================================
            // PROPS
            // ============================================================
            props: [
                // ---- CENTRAL CORRIDOR torches every ~10m ----
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-1.8, 2.2, -35], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Central torch W-35' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [1.8, 2.2, -25], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Central torch E-25' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-1.8, 2.2, -5], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Central torch W-5' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [1.8, 2.2, 5], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Central torch E+5' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-1.8, 2.2, 25], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Central torch W+25' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [1.8, 2.2, 35], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Central torch E+35' },

                // ---- WEST CORRIDOR torches ----
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-13.8, 2.2, -30], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'West torch W-30' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-10.2, 2.2, -10], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'West torch E-10' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-13.8, 2.2, 10], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'West torch W+10' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-10.2, 2.2, 30], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'West torch E+30' },

                // ---- EAST CORRIDOR torches ----
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [10.2, 2.2, -30], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'East torch W-30' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [13.8, 2.2, -10], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'East torch E-10' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [10.2, 2.2, 10], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'East torch W+10' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [13.8, 2.2, 30], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'East torch E+30' },

                // ---- ALTAR CHAMBER props ----
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-4, 0, -44], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar column SW' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [4, 0, -44], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar column SE' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-4, 0, -52], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar column NW' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [4, 0, -52], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar column NE' },
                { glb: 'assets/props/kenney/survival_kit/campfire-stand.glb',
                  transform: { position: [0, 1.2, -48], rotation: [0, 0, 0], scale: [1.3, 1.3, 1.3] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar brazier' },
                { glb: 'assets/props/kenney/holiday_kit/lantern-hanging.glb',
                  transform: { position: [0, 3.6, -44], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar chamber hanging lantern' },

                // ---- SAINT CRYPT props ----
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [24.5, 0, 3.5], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Crypt column NW' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [31.5, 0, 3.5], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Crypt column NE' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [24.5, 0, -3.5], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Crypt column SW' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [31.5, 0, -3.5], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Crypt column SE' },
                { glb: 'assets/props/kenney/holiday_kit/hanukkah-menorah-candles.glb',
                  transform: { position: [26, 1.7, 0], rotation: [0, 0, 0], scale: [0.9, 0.9, 0.9] },
                  cast_shadow: true, receive_shadow: true, label: 'Saint candles W' },
                { glb: 'assets/props/kenney/holiday_kit/hanukkah-menorah-candles.glb',
                  transform: { position: [30, 1.7, 0], rotation: [0, 180, 0], scale: [0.9, 0.9, 0.9] },
                  cast_shadow: true, receive_shadow: true, label: 'Saint candles E' },
                { glb: 'assets/props/kenney/holiday_kit/kwanzaa-kinara.glb',
                  transform: { position: [26, 0, 3], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Saint kinara SW' },
                { glb: 'assets/props/kenney/holiday_kit/kwanzaa-kinara.glb',
                  transform: { position: [30, 0, -3], rotation: [0, 180, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Saint kinara SE' },
                { glb: 'assets/props/kenney/holiday_kit/lantern-hanging.glb',
                  transform: { position: [28, 3.6, 0], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Saint hanging lantern' },

                // ---- Gates at crypt passage opening ----
                { glb: 'assets/props/kenney/modular_dungeon_kit/gate-metal-bars.glb',
                  transform: { position: [15, 0, 0], rotation: [0, 90, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Crypt entry gate' },

                // ---- Entrance area (spawn, south end of Central) ----
                { glb: 'assets/props/kenney/castle_kit/stairs-stone.glb',
                  transform: { position: [0, 0, 38], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Entrance stairs' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-1.8, 2.2, 37], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Entry lantern W' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [1.8, 2.2, 37], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Entry lantern E' },
                { glb: 'assets/props/kenney/mini_dungeon/barrel.glb',
                  transform: { position: [-1.2, 0, 39], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Entry barrel' },
                { glb: 'assets/props/kenney/mini_dungeon/chest.glb',
                  transform: { position: [1.2, 0, 39], rotation: [0, -45, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Entry chest' },
            ],
            connectors: [],
            // ============================================================
            // LOCI — ~400 total (built procedurally via _nicheRow + _ring + handcrafted)
            // ============================================================
            loci: [
                // ========== RETURN PORTAL (at spawn, just in front) ==========
                {
                    position: [0, 1.5, -33],
                    marker_type: 'door',
                    marker_settings: { portal_target: 'forum' },
                    label: 'Return to The Forum',
                    card_ids: [],
                },

                // ========== HANDCRAFTED HERO LOCI ==========
                // Entrance
                { position: [0, 1.8, 37], marker_type: 'glow', label: 'Catacombs: Entrance lantern glow' },
                { position: [-1.8, 2.2, 37], marker_type: 'glow', label: 'Catacombs: Entry torch W' },
                { position: [1.8, 2.2, 37], marker_type: 'glow', label: 'Catacombs: Entry torch E' },

                // Altar chamber hero loci
                { position: [0, 1.8, -48], marker_type: 'pedestal', label: 'Catacombs: Altar central stone' },
                { position: [0, 2.2, -48], marker_type: 'glow', label: 'Catacombs: Altar brazier flame' },
                { position: [-4, 1.6, -44], marker_type: 'statue', label: 'Catacombs: Altar column SW carving' },
                { position: [4, 1.6, -44], marker_type: 'statue', label: 'Catacombs: Altar column SE carving' },
                { position: [-4, 1.6, -52], marker_type: 'statue', label: 'Catacombs: Altar column NW carving' },
                { position: [4, 1.6, -52], marker_type: 'statue', label: 'Catacombs: Altar column NE carving' },
                { position: [-6, 2.2, -55], marker_type: 'frame', label: 'Catacombs: Altar wall fresco W' },
                { position: [6, 2.2, -55], marker_type: 'frame', label: 'Catacombs: Altar wall fresco E' },
                { position: [0, 3.6, -44], marker_type: 'glow', label: 'Catacombs: Altar hanging lantern' },

                // Saint crypt hero loci
                { position: [28, 2.2, 0], marker_type: 'pedestal', label: 'Catacombs: Saint sarcophagus' },
                { position: [28, 3.6, 0], marker_type: 'glow', label: 'Catacombs: Saint crypt hanging lantern' },
                { position: [24.5, 1.6, 3.5], marker_type: 'statue', label: 'Catacombs: Crypt column NW carving' },
                { position: [31.5, 1.6, 3.5], marker_type: 'statue', label: 'Catacombs: Crypt column NE carving' },
                { position: [24.5, 1.6, -3.5], marker_type: 'statue', label: 'Catacombs: Crypt column SW carving' },
                { position: [31.5, 1.6, -3.5], marker_type: 'statue', label: 'Catacombs: Crypt column SE carving' },
                { position: [32.7, 2.2, 2], marker_type: 'frame', label: 'Catacombs: Crypt parchment N' },
                { position: [32.7, 2.2, -2], marker_type: 'frame', label: 'Catacombs: Crypt parchment S' },

                // Cross-corridor sarcophagi hero loci
                { position: [-6, 1.4, -15], marker_type: 'pedestal', label: 'Catacombs: Cross-N sarcophagus W' },
                { position: [6, 1.4, -15], marker_type: 'pedestal', label: 'Catacombs: Cross-N sarcophagus E' },
                { position: [-6, 1.4, 15], marker_type: 'pedestal', label: 'Catacombs: Cross-S sarcophagus W' },
                { position: [6, 1.4, 15], marker_type: 'pedestal', label: 'Catacombs: Cross-S sarcophagus E' },

                // Cross-corridor wall frames
                { position: [0, 2.2, -16.8], marker_type: 'frame', label: 'Catacombs: Cross-N inscription "Memento Mori"' },
                { position: [0, 2.2, 16.8], marker_type: 'frame', label: 'Catacombs: Cross-S inscription saints list' },

                // ========== CORRIDOR TORCHES (glow loci = point lights) ==========
                // Central corridor torch glows
                { position: [-1.8, 2.4, -35], marker_type: 'glow', label: 'Catacombs: Central torch -35' },
                { position: [1.8, 2.4, -25], marker_type: 'glow', label: 'Catacombs: Central torch -25' },
                { position: [-1.8, 2.4, -5], marker_type: 'glow', label: 'Catacombs: Central torch -5' },
                { position: [1.8, 2.4, 5], marker_type: 'glow', label: 'Catacombs: Central torch +5' },
                { position: [-1.8, 2.4, 25], marker_type: 'glow', label: 'Catacombs: Central torch +25' },
                { position: [1.8, 2.4, 35], marker_type: 'glow', label: 'Catacombs: Central torch +35' },
                // West corridor torch glows
                { position: [-13.8, 2.4, -30], marker_type: 'glow', label: 'Catacombs: West torch -30' },
                { position: [-10.2, 2.4, -10], marker_type: 'glow', label: 'Catacombs: West torch -10' },
                { position: [-13.8, 2.4, 10], marker_type: 'glow', label: 'Catacombs: West torch +10' },
                { position: [-10.2, 2.4, 30], marker_type: 'glow', label: 'Catacombs: West torch +30' },
                // East corridor torch glows
                { position: [10.2, 2.4, -30], marker_type: 'glow', label: 'Catacombs: East torch -30' },
                { position: [13.8, 2.4, -10], marker_type: 'glow', label: 'Catacombs: East torch -10' },
                { position: [10.2, 2.4, 10], marker_type: 'glow', label: 'Catacombs: East torch +10' },
                { position: [13.8, 2.4, 30], marker_type: 'glow', label: 'Catacombs: East torch +30' },
                // Passage torches
                { position: [18.5, 2.4, 0], marker_type: 'glow', label: 'Catacombs: Crypt passage torch' },

                // ========== PROCEDURAL NICHE ROWS — 6 walls × 50 = 300 loci ==========
                // Niches are placed 0.15m inboard of wall plane so they sit inside the corridor.

                // --- CENTRAL CORRIDOR niches (x=0 corridor, walls at x=-2 and x=+2) ---
                ...this._nicheRow({
                    start: [-1.85, 1.8, -38],
                    end:   [-1.85, 1.8,  38],
                    count: 50,
                    marker: 'orb',
                    labelPrefix: 'Central corr W wall niche',
                }),
                ...this._nicheRow({
                    start: [1.85, 1.8, -38],
                    end:   [1.85, 1.8,  38],
                    count: 50,
                    marker: 'orb',
                    labelPrefix: 'Central corr E wall niche',
                }),

                // --- WEST CORRIDOR niches (x=-12 corridor, walls at x=-14 and x=-10) ---
                ...this._nicheRow({
                    start: [-13.85, 1.8, -38],
                    end:   [-13.85, 1.8,  38],
                    count: 50,
                    marker: 'orb',
                    labelPrefix: 'West corr W wall niche',
                }),
                ...this._nicheRow({
                    start: [-10.15, 1.8, -38],
                    end:   [-10.15, 1.8,  38],
                    count: 50,
                    marker: 'orb',
                    labelPrefix: 'West corr E wall niche',
                }),

                // --- EAST CORRIDOR niches (x=+12 corridor, walls at x=+10 and x=+14) ---
                ...this._nicheRow({
                    start: [10.15, 1.8, -38],
                    end:   [10.15, 1.8,  38],
                    count: 50,
                    marker: 'orb',
                    labelPrefix: 'East corr W wall niche',
                }),
                ...this._nicheRow({
                    start: [13.85, 1.8, -38],
                    end:   [13.85, 1.8,  38],
                    count: 50,
                    marker: 'orb',
                    labelPrefix: 'East corr E wall niche',
                }),

                // ========== ALTAR CHAMBER RING — 16 loci around central altar ==========
                ...this._ring({
                    center: [0, 1.5, -48],
                    radius: 3,
                    count: 16,
                    y: 1.5,
                    marker: 'orb',
                    labelPrefix: 'Altar ring',
                }),

                // ========== SAINT CRYPT CANDLES — 20 around sarcophagus ==========
                ...this._ring({
                    center: [28, 1.3, 0],
                    radius: 2.8,
                    count: 20,
                    y: 1.3,
                    marker: 'orb',
                    labelPrefix: 'Saint crypt candle',
                }),
            ],
        };
        return t;
    },
    _observatory() {
        // ----- octagon geometry -----
        // 8 walls, apothem (distance from center to wall face) = 20 * cos(pi/8)
        const R_APOTHEM = 20 * Math.cos(Math.PI / 8); // ≈ 18.478
        const SIDE = 2 * 20 * Math.sin(Math.PI / 8);  // ≈ 15.307
        const WALL_H = 12;

        // Wall index 0 = south (+Z), then rotate counter-clockwise in 45° steps.
        // angle(i) = PI/2 + i * PI/4  (0 = south, 1 = SW, 2 = W, 3 = NW, 4 = N, 5 = NE, 6 = E, 7 = SE)
        const wallAngle = (i) => Math.PI / 2 + i * Math.PI / 4;
        // Outward-facing normal direction for wall i
        const wallOutward = (i) => {
            const a = wallAngle(i);
            return [Math.cos(a), 0, Math.sin(a)];
        };
        // Tangent (along wall chord, rightward when facing inward)
        const wallTangent = (i) => {
            const a = wallAngle(i);
            return [-Math.sin(a), 0, Math.cos(a)];
        };
        // Wall center (world)
        const wallCenter = (i) => {
            const n = wallOutward(i);
            return [R_APOTHEM * n[0], WALL_H / 2, R_APOTHEM * n[2]];
        };

        // Walls 0 (south) and 4 (north) get the archway/decorative uses.
        // Walls 1,2,3,5,6,7 (6 walls) carry star chart shelf grids.
        const CHART_WALLS = [1, 2, 3, 5, 6, 7];

        // Build shelfGrid params for one chart wall.
        // rows 6 × cols 12 = 72 loci per wall × 6 walls = 432 loci.
        const buildChartWall = (i) => {
            const tan = wallTangent(i);
            const out = wallOutward(i);
            // Place the loci on a plane just INSIDE the wall surface (offset 0.4m inward).
            const inset = R_APOTHEM - 0.4;
            const centerX = inset * Math.cos(wallAngle(i));
            const centerZ = inset * Math.sin(wallAngle(i));
            const COLS = 11;
            const ROWS = 6;
            const STEP_R = 0.95;
            const STEP_U = 1.3;
            // Origin = bottom-LEFT corner. Shift back along tangent by (COLS-1)/2 * STEP_R.
            const halfW = ((COLS - 1) * STEP_R) / 2;
            const yBase = 2.4;
            const originX = centerX - tan[0] * halfW;
            const originZ = centerZ - tan[2] * halfW;
            return {
                origin: [originX, yBase, originZ],
                rightAxis: tan,
                upAxis: [0, 1, 0],
                rows: ROWS,
                cols: COLS,
                stepRight: STEP_R,
                stepUp: STEP_U,
                marker: 'orb',
                labelPrefix: `Star chart W${i}`,
            };
        };

        // Stone wall surface entry (a thin box placed along the chord).
        const wallSurface = (i, mat, label) => {
            const c = wallCenter(i);
            const a = wallAngle(i);
            // Box rotation so its width runs along the chord tangent.
            // Default box width is along +X; tangent direction is (-sin a, 0, cos a).
            // Angle of tangent in XZ plane from +X is atan2(cos a, -sin a).
            const rotY = Math.atan2(Math.cos(a), -Math.sin(a));
            return {
                type: 'wall',
                transform: { position: c, rotation: [0, rotY, 0], scale: [1, 1, 1] },
                dimensions: { width: SIDE + 0.2, height: WALL_H, depth: 0.6 },
                material: mat,
                label,
            };
        };

        // Column position at each octagon vertex (between walls).
        const vertexPos = (i) => {
            // Vertices are at angles offset by PI/8 from wall centers.
            const a = wallAngle(i) - Math.PI / 8;
            return [20 * Math.cos(a), 0, 20 * Math.sin(a)];
        };

        const t = {
            meta: {
                id: 'observatory',
                name: 'Observatory Chamber',
                desc: 'Enclosed octagonal astronomical observatory with domed constellation ceiling, central telescope, bronze armillary, and star chart walls.',
                spawn_point: { position: [0, 1.6, -8], rotation_y: 0 },
                scale: 1.0,
            },
            environment: {
                hdri: 'assets/hdri/combination_room_2k.hdr',
                hdri_intensity: 0.8,
                hdri_as_background: false, // enclosed — no visible skybox
                fog: null,
                sun: {
                    position: [0, 40, 0],
                    intensity: 0.6,
                    color: 0xf0e8d0,
                    cast_shadow: true,
                    shadow_bounds: 60,
                },
                ambient: { intensity: 0.35, color: 0xb8c8e0 },
            },
            materials: {
                marble_white: {
                    albedo: 'assets/textures/marble_white/albedo_2k.jpg',
                    normal: 'assets/textures/marble_white/normal_2k.jpg',
                    roughness: 'assets/textures/marble_white/roughness_2k.jpg',
                    ao: 'assets/textures/marble_white/ao_2k.jpg',
                    repeat: [5, 5],
                    roughness_scale: 0.85,
                    metalness: 0,
                },
                travertine_stone: {
                    albedo: 'assets/textures/travertine_stone/albedo_2k.jpg',
                    normal: 'assets/textures/travertine_stone/normal_2k.jpg',
                    roughness: 'assets/textures/travertine_stone/roughness_2k.jpg',
                    ao: 'assets/textures/travertine_stone/ao_2k.jpg',
                    repeat: [4, 4],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                basalt_dark: {
                    albedo: 'assets/textures/basalt_dark/albedo_2k.jpg',
                    normal: 'assets/textures/basalt_dark/normal_2k.jpg',
                    roughness: 'assets/textures/basalt_dark/roughness_2k.jpg',
                    ao: 'assets/textures/basalt_dark/ao_2k.jpg',
                    repeat: [6, 6],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                bronze_trim: {
                    albedo: 'assets/textures/bronze_trim/albedo_2k.jpg',
                    normal: 'assets/textures/bronze_trim/normal_2k.jpg',
                    roughness: 'assets/textures/bronze_trim/roughness_2k.jpg',
                    ao: null,
                    repeat: [2, 2],
                    roughness_scale: 0.45,
                    metalness: 0.92,
                },
                oak_beam_dark: {
                    albedo: 'assets/textures/oak_beam_dark/albedo_2k.jpg',
                    normal: 'assets/textures/oak_beam_dark/normal_2k.jpg',
                    roughness: 'assets/textures/oak_beam_dark/roughness_2k.jpg',
                    ao: 'assets/textures/oak_beam_dark/ao_2k.jpg',
                    repeat: [2, 2],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                sandstone_wall: {
                    albedo: 'assets/textures/sandstone_wall/albedo_2k.jpg',
                    normal: 'assets/textures/sandstone_wall/normal_2k.jpg',
                    roughness: 'assets/textures/sandstone_wall/roughness_2k.jpg',
                    ao: 'assets/textures/sandstone_wall/ao_2k.jpg',
                    repeat: [3, 3],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
            },
            surfaces: [
                // ============================================================
                // FLOOR — two layers: outer basalt ring, inner marble disk,
                // plus bronze ecliptic inlay strips.
                // ============================================================
                // Main marble floor (big square underneath the octagon)
                { type: 'floor',
                  transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 44, height: 44, depth: 0.5 },
                  material: 'marble_white',
                  label: 'Observatory marble floor' },
                // Basalt ring substrate (slightly lower so the marble reads as inlaid)
                { type: 'floor',
                  transform: { position: [0, -0.3, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 46, height: 46, depth: 0.6 },
                  material: 'basalt_dark',
                  label: 'Observatory basalt substrate' },
                // Bronze ecliptic inlay — ring band (approximated by 4 low walls forming a square outline)
                { type: 'wall',
                  transform: { position: [0, 0.27, 7], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 14, height: 0.12, depth: 0.15 },
                  material: 'bronze_trim',
                  label: 'Ecliptic inlay S' },
                { type: 'wall',
                  transform: { position: [0, 0.27, -7], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 14, height: 0.12, depth: 0.15 },
                  material: 'bronze_trim',
                  label: 'Ecliptic inlay N' },
                { type: 'wall',
                  transform: { position: [7, 0.27, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 14, height: 0.12, depth: 0.15 },
                  material: 'bronze_trim',
                  label: 'Ecliptic inlay E' },
                { type: 'wall',
                  transform: { position: [-7, 0.27, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 14, height: 0.12, depth: 0.15 },
                  material: 'bronze_trim',
                  label: 'Ecliptic inlay W' },
                // Diagonal bronze bands of the ecliptic (two rotated thin bars)
                { type: 'wall',
                  transform: { position: [0, 0.27, 0], rotation: [0, Math.PI / 4, 0], scale: [1, 1, 1] },
                  dimensions: { width: 18, height: 0.12, depth: 0.12 },
                  material: 'bronze_trim',
                  label: 'Ecliptic diagonal NE-SW' },
                { type: 'wall',
                  transform: { position: [0, 0.27, 0], rotation: [0, -Math.PI / 4, 0], scale: [1, 1, 1] },
                  dimensions: { width: 18, height: 0.12, depth: 0.12 },
                  material: 'bronze_trim',
                  label: 'Ecliptic diagonal NW-SE' },

                // ============================================================
                // WALLS — 8 octagonal walls (6 star chart + 2 entrance/decor)
                // ============================================================
                wallSurface(0, 'marble_white', 'Wall S (entrance/portal)'),
                wallSurface(1, 'marble_white', 'Wall SW star chart'),
                wallSurface(2, 'marble_white', 'Wall W star chart'),
                wallSurface(3, 'marble_white', 'Wall NW star chart'),
                wallSurface(4, 'marble_white', 'Wall N (decorative)'),
                wallSurface(5, 'marble_white', 'Wall NE star chart'),
                wallSurface(6, 'marble_white', 'Wall E star chart'),
                wallSurface(7, 'marble_white', 'Wall SE star chart'),

                // Travertine base trim running around the walls (approximated by a low octagonal box)
                { type: 'floor',
                  transform: { position: [0, 0.55, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 40, height: 40, depth: 0.3 },
                  material: 'travertine_stone',
                  label: 'Wall base trim platform' },

                // Sandstone exterior shell accent (hidden backing slab, just a hint of texture through joins)
                { type: 'floor',
                  transform: { position: [0, WALL_H + 0.15, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 42, height: 42, depth: 0.3 },
                  material: 'sandstone_wall',
                  label: 'Wall crown ring' },

                // ============================================================
                // DOME — 4 stacked octagonal marble slabs shrinking upward
                // The dome is solid — no sky visible.
                // ============================================================
                // Tier 1 (y = 12 → 13.5, width 40)
                { type: 'ceiling',
                  transform: { position: [0, 12.75, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 40, height: 40, depth: 1.5 },
                  material: 'marble_white',
                  label: 'Dome tier 1' },
                // Tier 2 (y = 13.5 → 15, width 32)
                { type: 'ceiling',
                  transform: { position: [0, 14.25, 0], rotation: [0, Math.PI / 8, 0], scale: [1, 1, 1] },
                  dimensions: { width: 32, height: 32, depth: 1.5 },
                  material: 'marble_white',
                  label: 'Dome tier 2' },
                // Tier 3 (y = 15 → 16.5, width 22)
                { type: 'ceiling',
                  transform: { position: [0, 15.75, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 22, height: 22, depth: 1.5 },
                  material: 'marble_white',
                  label: 'Dome tier 3' },
                // Tier 4 crown (y = 16.5 → 18, width 10) — basalt + bronze capstone
                { type: 'ceiling',
                  transform: { position: [0, 17.25, 0], rotation: [0, Math.PI / 8, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 10, depth: 1.5 },
                  material: 'basalt_dark',
                  label: 'Dome tier 4 crown' },
                { type: 'ceiling',
                  transform: { position: [0, 18.1, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 3, height: 3, depth: 0.3 },
                  material: 'bronze_trim',
                  label: 'Dome capstone' },

                // Radial oak spokes between dome tiers (8 spokes)
                ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                    const a = i * Math.PI / 4;
                    const r = 16;
                    return {
                        type: 'wall',
                        transform: { position: [r * Math.cos(a) * 0.6, 13.5, r * Math.sin(a) * 0.6], rotation: [0, a, 0], scale: [1, 1, 1] },
                        dimensions: { width: 10, height: 0.4, depth: 0.4 },
                        material: 'oak_beam_dark',
                        label: `Dome spoke ${i}`,
                    };
                }),

                // ============================================================
                // CENTRAL MARBLE PEDESTAL for the telescope
                // ============================================================
                { type: 'floor',
                  transform: { position: [0, 0.6, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 4, depth: 1.0 },
                  material: 'marble_white',
                  label: 'Telescope pedestal lower' },
                { type: 'floor',
                  transform: { position: [0, 1.4, 0], rotation: [0, Math.PI / 4, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.8, height: 2.8, depth: 0.6 },
                  material: 'travertine_stone',
                  label: 'Telescope pedestal upper' },
                { type: 'floor',
                  transform: { position: [0, 1.85, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.6, height: 1.6, depth: 0.3 },
                  material: 'bronze_trim',
                  label: 'Telescope mounting plate' },

                // ============================================================
                // ENTRANCE ARCHWAY on south wall (decorative frame only)
                // ============================================================
                { type: 'wall',
                  transform: { position: [-2, 3.0, R_APOTHEM - 0.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.4, height: 6, depth: 0.4 },
                  material: 'travertine_stone',
                  label: 'Arch jamb W' },
                { type: 'wall',
                  transform: { position: [2, 3.0, R_APOTHEM - 0.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.4, height: 6, depth: 0.4 },
                  material: 'travertine_stone',
                  label: 'Arch jamb E' },
                { type: 'wall',
                  transform: { position: [0, 6.3, R_APOTHEM - 0.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4.8, height: 0.6, depth: 0.4 },
                  material: 'bronze_trim',
                  label: 'Arch lintel' },
            ],
            props: [
                // ============================================================
                // 8 COLUMNS at octagon vertices (castle_kit towers repurposed as columns)
                // ============================================================
                ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                    const p = vertexPos(i);
                    return {
                        glb: 'assets/props/kenney/mini_dungeon/column.glb',
                        transform: { position: [p[0], 0, p[2]], rotation: [0, 0, 0], scale: [1.4, 3.0, 1.4] },
                        cast_shadow: true, receive_shadow: true,
                        label: `Vertex column ${i}`,
                    };
                }),

                // Castle-kit tall tower pillars at alternating vertices for extra verticality
                ...[0, 2, 4, 6].map((i) => {
                    const p = vertexPos(i);
                    // pull slightly inward so it doesn't clip the wall
                    const inset = 0.92;
                    return {
                        glb: 'assets/props/kenney/castle_kit/wall-pillar.glb',
                        transform: { position: [p[0] * inset, 0, p[2] * inset], rotation: [0, 0, 0], scale: [1.2, 1.6, 1.2] },
                        cast_shadow: true, receive_shadow: true,
                        label: `Vertex pillar ${i}`,
                    };
                }),

                // ============================================================
                // TELESCOPE on central pedestal (composed from primitives via props)
                // Use a tall pillar + crystal as a stand-in telescope tube + lens.
                // ============================================================
                { glb: 'assets/props/kenney/castle_kit/wall-pillar.glb',
                  transform: { position: [0, 2.0, 0], rotation: [0, 0, Math.PI / 6], scale: [0.5, 1.8, 0.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Telescope tube' },
                { glb: 'assets/props/kenney/platformer_kit/jewel.glb',
                  transform: { position: [0.8, 3.2, 0], rotation: [0, 0, 0], scale: [0.5, 0.5, 0.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Telescope eyepiece lens' },

                // ============================================================
                // ARMILLARY SPHERE + ASTROLABE (two flanking hero instruments)
                // ============================================================
                { glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf',
                  transform: { position: [-6, 0, 0], rotation: [0, Math.PI / 2, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Astronomer bust W (Ptolemy)' },
                { glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf',
                  transform: { position: [6, 0, 0], rotation: [0, -Math.PI / 2, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Astronomer bust E (Hipparchus)' },
                // Armillary sphere (approximated by a crystal cluster on a small pedestal)
                { glb: 'assets/props/kenney/tower_defense_kit/detail-crystal-large.glb',
                  transform: { position: [-8, 0.8, -2], rotation: [0, 0, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Armillary sphere (crystal proxy)' },
                // Astrolabe (smaller crystal)
                { glb: 'assets/props/kenney/tower_defense_kit/detail-crystal.glb',
                  transform: { position: [8, 0.8, -2], rotation: [0, 0.6, 0], scale: [1.3, 1.3, 1.3] },
                  cast_shadow: true, receive_shadow: true, label: 'Astrolabe (crystal proxy)' },

                // ============================================================
                // 4 CORNER BRAZIERS (mini_dungeon stones stand-in)
                // Placed at 4 of the 8 vertices, pulled inward.
                // ============================================================
                ...[1, 3, 5, 7].map((i) => {
                    const p = vertexPos(i);
                    const inset = 0.78;
                    return {
                        glb: 'assets/props/kenney/mini_dungeon/stones.glb',
                        transform: { position: [p[0] * inset, 0, p[2] * inset], rotation: [0, i * Math.PI / 4, 0], scale: [1.2, 1.2, 1.2] },
                        cast_shadow: true, receive_shadow: true,
                        label: `Brazier ${i}`,
                    };
                }),

                // ============================================================
                // READING TABLES + BENCHES around the perimeter (for astronomical charts)
                // Placed inside the room, just off the chart walls.
                // ============================================================
                ...CHART_WALLS.map((i, idx) => {
                    const out = wallOutward(i);
                    const r = R_APOTHEM - 3.5;
                    return {
                        glb: 'assets/props/kenney/furniture_kit/table.glb',
                        transform: {
                            position: [r * out[0], 0, r * out[2]],
                            rotation: [0, Math.atan2(-out[2], -out[0]), 0],
                            scale: [1.1, 1.1, 1.1],
                        },
                        cast_shadow: true, receive_shadow: true,
                        label: `Chart table ${i}`,
                    };
                }),
                ...CHART_WALLS.map((i) => {
                    const out = wallOutward(i);
                    const r = R_APOTHEM - 4.8;
                    return {
                        glb: 'assets/props/kenney/furniture_kit/bench.glb',
                        transform: {
                            position: [r * out[0], 0, r * out[2]],
                            rotation: [0, Math.atan2(-out[2], -out[0]) + Math.PI / 2, 0],
                            scale: [1.1, 1.1, 1.1],
                        },
                        cast_shadow: true, receive_shadow: true,
                        label: `Chart bench ${i}`,
                    };
                }),

                // ============================================================
                // HANGING CHANDELIER in the dome centre
                // ============================================================
                { glb: 'assets/props/polyhaven/lantern_chandelier_01/lantern_chandelier_01_2k.gltf',
                  transform: { position: [0, 10.5, 0], rotation: [0, 0, 0], scale: [2.0, 2.0, 2.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Dome chandelier' },

                // ============================================================
                // 4 SIDE TABLES with bronze astronomical instruments along the cardinal axes
                // (between the central pedestal and the walls)
                // ============================================================
                { glb: 'assets/props/kenney/furniture_kit/sideTable.glb',
                  transform: { position: [0, 0, -12], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'North instrument table' },
                { glb: 'assets/props/kenney/furniture_kit/sideTable.glb',
                  transform: { position: [12, 0, 0], rotation: [0, Math.PI / 2, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'East instrument table' },
                { glb: 'assets/props/kenney/furniture_kit/sideTable.glb',
                  transform: { position: [0, 0, 12], rotation: [0, Math.PI, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'South instrument table' },
                { glb: 'assets/props/kenney/furniture_kit/sideTable.glb',
                  transform: { position: [-12, 0, 0], rotation: [0, -Math.PI / 2, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'West instrument table' },

                // Small crystals on each instrument table (bronze proxies)
                { glb: 'assets/props/kenney/platformer_kit/jewel.glb',
                  transform: { position: [0, 1.2, -12], rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6] },
                  cast_shadow: true, receive_shadow: true, label: 'North instrument jewel' },
                { glb: 'assets/props/kenney/platformer_kit/jewel.glb',
                  transform: { position: [12, 1.2, 0], rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6] },
                  cast_shadow: true, receive_shadow: true, label: 'East instrument jewel' },
                { glb: 'assets/props/kenney/platformer_kit/jewel.glb',
                  transform: { position: [0, 1.2, 12], rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6] },
                  cast_shadow: true, receive_shadow: true, label: 'South instrument jewel' },
                { glb: 'assets/props/kenney/platformer_kit/jewel.glb',
                  transform: { position: [-12, 1.2, 0], rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6] },
                  cast_shadow: true, receive_shadow: true, label: 'West instrument jewel' },
            ],
            connectors: [],
            loci: [
                // ============================================================
                // RETURN PORTAL (mandatory — one only, near spawn)
                // ============================================================
                {
                    position: [0, 1.6, -10],
                    marker_type: 'door',
                    marker_settings: { portal_target: 'forum' },
                    label: 'Return to The Forum',
                    card_ids: [],
                },

                // ============================================================
                // HANDCRAFTED HERO LOCI (~22)
                // ============================================================
                // Central telescope + pedestal
                { position: [0, 2.2, 0], marker_type: 'pedestal', label: 'Central telescope' },
                { position: [0, 3.6, 0], marker_type: 'glow', label: 'Telescope eyepiece' },
                // Astronomer busts
                { position: [-6, 2.0, 0], marker_type: 'statue', label: 'Bust of Ptolemy' },
                { position: [6, 2.0, 0], marker_type: 'statue', label: 'Bust of Hipparchus' },
                // Armillary + astrolabe
                { position: [-8, 2.0, -2], marker_type: 'pedestal', label: 'Bronze armillary sphere' },
                { position: [8, 2.0, -2], marker_type: 'pedestal', label: 'Bronze astrolabe' },
                // Cardinal instrument tables
                { position: [0, 1.4, -12], marker_type: 'pedestal', label: 'North: quadrant & sextant' },
                { position: [12, 1.4, 0], marker_type: 'pedestal', label: 'East: orrery (planetary clock)' },
                { position: [0, 1.4, 12], marker_type: 'pedestal', label: 'South: celestial globe' },
                { position: [-12, 1.4, 0], marker_type: 'pedestal', label: 'West: equatorial ring dial' },
                // Arch + capstone
                { position: [0, 6.3, R_APOTHEM - 0.5], marker_type: 'frame', label: 'Entrance arch (to Forum)' },
                { position: [0, 18.1, 0], marker_type: 'glow', label: 'Dome capstone' },
                { position: [0, 14, 0], marker_type: 'glow', label: 'Dome chandelier' },
                // Ecliptic floor inlay crossing points
                { position: [0, 0.4, 0], marker_type: 'pedestal', label: 'Ecliptic centre (vernal point)' },
                { position: [7, 0.4, 0], marker_type: 'orb', label: 'Ecliptic marker E (summer)' },
                { position: [-7, 0.4, 0], marker_type: 'orb', label: 'Ecliptic marker W (winter)' },
                { position: [0, 0.4, 7], marker_type: 'orb', label: 'Ecliptic marker S (autumn)' },
                { position: [0, 0.4, -7], marker_type: 'orb', label: 'Ecliptic marker N (spring)' },
                // North decorative wall featured element
                { position: [0, 5.0, -(R_APOTHEM - 0.5)], marker_type: 'frame', label: 'North wall: great star map of the Northern Hemisphere' },
                // Vertex column heroes (4 of 8 as hero loci)
                { position: [vertexPos(0)[0], 4.5, vertexPos(0)[2]], marker_type: 'orb', label: 'Column of the South (Crux)' },
                { position: [vertexPos(2)[0], 4.5, vertexPos(2)[2]], marker_type: 'orb', label: 'Column of the West (Lyra)' },
                { position: [vertexPos(4)[0], 4.5, vertexPos(4)[2]], marker_type: 'orb', label: 'Column of the North (Ursa Major)' },
                { position: [vertexPos(6)[0], 4.5, vertexPos(6)[2]], marker_type: 'orb', label: 'Column of the East (Orion)' },

                // ============================================================
                // PROCEDURAL: 6 star chart walls × shelfGrid(6 rows × 12 cols) = 432 loci
                // ============================================================
                ...this._shelfGrid(buildChartWall(1)),
                ...this._shelfGrid(buildChartWall(2)),
                ...this._shelfGrid(buildChartWall(3)),
                ...this._shelfGrid(buildChartWall(5)),
                ...this._shelfGrid(buildChartWall(6)),
                ...this._shelfGrid(buildChartWall(7)),

                // ============================================================
                // PROCEDURAL: constellation ring at dome base (36 loci)
                // ============================================================
                ...this._ring({
                    center: [0, 0, 0],
                    radius: 17,
                    count: 36,
                    y: 11,
                    marker: 'glow',
                    labelPrefix: 'Constellation ring',
                }),

                // ============================================================
                // PROCEDURAL: ecliptic floor grid (8 × 8 = 64 loci)
                // ============================================================
                ...this._floorGrid({
                    origin: [-5.25, 0.35, -5.25],
                    rows: 8,
                    cols: 8,
                    stepX: 1.5,
                    stepZ: 1.5,
                    y: 0.35,
                    marker: 'orb',
                    labelPrefix: 'Ecliptic floor',
                }),
            ],
        };
        return t;
    }

    };

    RC.PalaceTemplates = PT;
})();
