/**
 * RhodesCards Memory Palace — Pre-built Templates (v2, S175)
 * 5 professional-quality templates with PBR materials, HDRI environment
 * lighting, and real CC0 GLB props.
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
            { id: 'roman_villa',   name: 'Roman Villa',     desc: 'Mediterranean villa urbana with peristyle courtyard, triclinium, bath, and cypress garden', loci: 28, preview: '#d4c8a8' },
            { id: 'library_tower', name: 'Library Tower',   desc: 'Four-story octagonal tower of learning with spiral staircase and domed observation room',  loci: 29, preview: '#6a4828' },
            { id: 'museum_hall',   name: 'Museum Gallery',  desc: 'Grand neo-classical gallery with colonnade, 8 alcoves, and octagonal rotunda',             loci: 29, preview: '#e0e4e8' },
            { id: 'catacombs',     name: 'Catacombs',       desc: 'Underground burial network with main corridor, altar chamber, ossuary, and saint crypt',   loci: 28, preview: '#1a1612' },
            { id: 'sky_palace',    name: 'Sky Palace',      desc: 'Austere alpine monastery above the cloud sea, five platforms connected by stone bridges',   loci: 28, preview: '#c8d8e8' },
        ],

        generate(templateId) {
            switch (templateId) {
                case 'roman_villa':   return this._romanVilla();
                case 'library_tower': return this._libraryTower();
                case 'museum_hall':   return this._museumHall();
                case 'catacombs':     return this._catacombs();
                case 'sky_palace':    return this._skyPalace();
                default:              return this._romanVilla();
            }
        },

        // ═══════════════════════════════════════════════════════════
        // 5 template functions follow (agent-authored, S175)
        // ═══════════════════════════════════════════════════════════

    _romanVilla() {
        const t = {
            meta: {
                id: 'roman_villa',
                name: 'Roman Villa',
                desc: 'Sun-drenched Mediterranean villa urbana with columned peristyle, atrium, triclinium, bath and cypress garden',
                // Spawn INSIDE the peristyle, south edge, looking north across the fountain toward the tablinum.
                // User immediately sees columns on all sides + fountain centerpiece.
                spawn_point: { position: [0, 1.6, 9], rotation_y: 0 },
                scale: 1.0,
            },
            environment: {
                hdri: 'assets/hdri/circus_maximus_2_2k.hdr',
                hdri_intensity: 1.15,
                hdri_as_background: true,
                fog: { color: 0xd8cca8, near: 140, far: 420 },
                sun: { position: [70, 120, 50], intensity: 2.8, color: 0xffeedd, cast_shadow: true, shadow_bounds: 110 },
                ambient: { intensity: 0.18 },
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
                    color_tint: 0xf0e6cc, // warm cream wash
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
                    // FIX 1: warm terracotta red-orange tint so roofs read as clay not black.
                    color_tint: 0xd06030,
                },
                grass_field: {
                    albedo: 'assets/textures/grass_field/albedo_2k.jpg',
                    normal: 'assets/textures/grass_field/normal_2k.jpg',
                    roughness: 'assets/textures/grass_field/roughness_2k.jpg',
                    ao: 'assets/textures/grass_field/ao_2k.jpg',
                    // FIX 2: bumped 10x10 -> 20x20 so 90m field no longer shows banding.
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
                // GROUND — 90x90 grass field (fixed tiling)
                { type: 'floor', transform: {position:[0,-0.05,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:90, height:90, depth:0.3}, material: 'grass_field', label: 'Estate ground' },

                // ============================================================
                // PERISTYLE COURTYARD (center, 24m x 24m open-air marble)
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

                // ---- FOUNTAIN (programmatic, 6m outer diameter, dominant centerpiece) ----
                // Outer basin — wide + tall enough to be visible as a ring
                { type: 'floor', transform: {position:[0,0.4,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:6, height:6, depth:0.8}, material: 'travertine_stone', label: 'Fountain outer basin' },
                // Water surface (bronze_trim as fake water)
                { type: 'floor', transform: {position:[0,0.82,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:5.6, height:5.6, depth:0.1}, material: 'bronze_trim', label: 'Fountain water surface' },
                // Mid pedestal ring
                { type: 'floor', transform: {position:[0,1.0,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:2.6, height:2.6, depth:0.5}, material: 'marble_white', label: 'Fountain mid pedestal' },
                // Central column
                { type: 'wall', transform: {position:[0,2.0,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:0.6, height:2.4, depth:0.6}, material: 'marble_white', label: 'Fountain column' },
                // Upper bowl
                { type: 'floor', transform: {position:[0,3.3,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:2.0, height:2.0, depth:0.3}, material: 'travertine_stone', label: 'Fountain upper bowl' },
                // Upper water disk
                { type: 'floor', transform: {position:[0,3.5,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:1.6, height:1.6, depth:0.08}, material: 'bronze_trim', label: 'Fountain upper water' },

                // ============================================================
                // ATRIUM (south hall, 18m x 12m, directly behind spawn)
                { type: 'floor', transform: {position:[0,0.05,22], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:18, height:12, depth:0.3}, material: 'marble_white', label: 'Atrium floor' },
                // Walls — north wall split for doorway to peristyle
                { type: 'wall', transform: {position:[-7,2.5,16.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:4, height:5, depth:0.3}, material: 'plaster_cream', label: 'Atrium north wall (west)' },
                { type: 'wall', transform: {position:[7,2.5,16.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:4, height:5, depth:0.3}, material: 'plaster_cream', label: 'Atrium north wall (east)' },
                // Lintel above doorway
                { type: 'wall', transform: {position:[0,4.5,16.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:10, height:1, depth:0.3}, material: 'travertine_stone', label: 'Atrium north lintel' },
                // South exterior wall — split for front entrance doorway
                { type: 'wall', transform: {position:[-6,2.5,27.9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:6, height:5, depth:0.3}, material: 'travertine_stone', label: 'Atrium south wall (west)' },
                { type: 'wall', transform: {position:[6,2.5,27.9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:6, height:5, depth:0.3}, material: 'travertine_stone', label: 'Atrium south wall (east)' },
                { type: 'wall', transform: {position:[0,4.5,27.9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:6, height:1, depth:0.3}, material: 'travertine_stone', label: 'Atrium south lintel' },
                // East + west walls
                { type: 'wall', transform: {position:[9.1,2.5,22], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Atrium east wall' },
                { type: 'wall', transform: {position:[-9.1,2.5,22], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Atrium west wall' },
                // Ceiling with compluvium split (central opening)
                { type: 'ceiling', transform: {position:[-6,5,22], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:6, height:12, depth:0.15}, material: 'oak_beam_dark', label: 'Atrium ceiling west' },
                { type: 'ceiling', transform: {position:[6,5,22], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:6, height:12, depth:0.15}, material: 'oak_beam_dark', label: 'Atrium ceiling east' },
                // Terracotta roof over atrium
                { type: 'roof', transform: {position:[0,5.6,22], rotation:[0.06,0,0], scale:[1,1,1]},
                  dimensions: {width:19, height:13, depth:0.25}, material: 'terracotta_tile', label: 'Atrium roof' },

                // ============================================================
                // TABLINUM (north-facing study/office, 14m x 8m opposite spawn across fountain)
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
                { type: 'ceiling', transform: {position:[0,5,-18], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:8, depth:0.15}, material: 'oak_beam_dark', label: 'Tablinum ceiling' },
                { type: 'roof', transform: {position:[0,5.6,-18], rotation:[-0.06,0,0], scale:[1,1,1]},
                  dimensions: {width:15, height:9, depth:0.25}, material: 'terracotta_tile', label: 'Tablinum roof' },

                // ============================================================
                // TRICLINIUM (east dining room, 14m x 14m)
                { type: 'floor', transform: {position:[22,0.05,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:14, depth:0.3}, material: 'oak_plank_warm', label: 'Triclinium floor' },
                // West wall (toward courtyard) with doorway
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
                { type: 'ceiling', transform: {position:[22,5,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:14, depth:0.15}, material: 'oak_beam_dark', label: 'Triclinium ceiling beams' },
                { type: 'roof', transform: {position:[22,5.6,0], rotation:[0,0,0.06], scale:[1,1,1]},
                  dimensions: {width:15, height:15, depth:0.25}, material: 'terracotta_tile', label: 'Triclinium roof' },

                // ============================================================
                // CUBICULUM (west bedroom, 12m x 12m)
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
                { type: 'ceiling', transform: {position:[-22,5,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:12, height:12, depth:0.15}, material: 'oak_beam_dark', label: 'Cubiculum ceiling' },
                { type: 'roof', transform: {position:[-22,5.6,0], rotation:[0,0,-0.06], scale:[1,1,1]},
                  dimensions: {width:13, height:13, depth:0.25}, material: 'terracotta_tile', label: 'Cubiculum roof' },

                // ============================================================
                // BATH COMPLEX (north-west, 14m x 8m, simple caldarium/tepidarium)
                { type: 'floor', transform: {position:[-20,0.05,-20], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:8, depth:0.3}, material: 'travertine_stone', label: 'Bath floor' },
                // Sunken pool (emissive fake water inside a basin)
                { type: 'floor', transform: {position:[-20,0.08,-20], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:8, height:4, depth:0.1}, material: 'bronze_trim', label: 'Caldarium pool water' },
                // Walls
                { type: 'wall', transform: {position:[-20,2.5,-16.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'plaster_cream', label: 'Bath south wall' },
                { type: 'wall', transform: {position:[-20,2.5,-23.9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'travertine_stone', label: 'Bath north wall' },
                { type: 'wall', transform: {position:[-13.1,2.5,-20], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:8, height:5, depth:0.3}, material: 'plaster_cream', label: 'Bath east wall' },
                { type: 'wall', transform: {position:[-26.9,2.5,-20], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:8, height:5, depth:0.3}, material: 'travertine_stone', label: 'Bath west wall' },
                { type: 'ceiling', transform: {position:[-20,5,-20], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:8, depth:0.15}, material: 'oak_beam_dark', label: 'Bath ceiling' },
                { type: 'roof', transform: {position:[-20,5.6,-20], rotation:[-0.05,0,0], scale:[1,1,1]},
                  dimensions: {width:15, height:9, depth:0.25}, material: 'terracotta_tile', label: 'Bath roof' },

                // ============================================================
                // GARDEN WALK (travertine path ringing the peristyle)
                { type: 'floor', transform: {position:[0,0.06,35], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:16, height:3, depth:0.15}, material: 'travertine_stone', label: 'South garden path' },
                { type: 'floor', transform: {position:[35,0.06,0], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:16, height:3, depth:0.15}, material: 'travertine_stone', label: 'East garden path' },
                { type: 'floor', transform: {position:[-35,0.06,0], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:16, height:3, depth:0.15}, material: 'travertine_stone', label: 'West garden path' },
                { type: 'floor', transform: {position:[0,0.06,-35], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:16, height:3, depth:0.15}, material: 'travertine_stone', label: 'North garden path' },
            ],
            props: [
                // ============================================================
                // PERISTYLE COLUMNS — the defining feature (FIX 3).
                // 28 classical columns on a 24m x 24m rectangle, spaced ~3.4m apart.
                // Using nature_kit/statue_column.glb, scaled tall to read as proper peristyle.
                // South row (8 columns, toward spawn)
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[-10.5,0.65,11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col S1' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[-7.5,0.65,11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col S2' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[-4.5,0.65,11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col S3' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[-1.5,0.65,11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col S4' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[1.5,0.65,11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col S5' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[4.5,0.65,11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col S6' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[7.5,0.65,11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col S7' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[10.5,0.65,11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col S8' },
                // North row (8 columns)
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[-10.5,0.65,-11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col N1' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[-7.5,0.65,-11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col N2' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[-4.5,0.65,-11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col N3' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[-1.5,0.65,-11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col N4' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[1.5,0.65,-11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col N5' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[4.5,0.65,-11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col N6' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[7.5,0.65,-11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col N7' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[10.5,0.65,-11.7], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col N8' },
                // East row (6 columns, skipping corners already placed)
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[11.7,0.65,-8.0], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col E1' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[11.7,0.65,-4.5], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col E2' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[11.7,0.65,-1.5], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col E3' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[11.7,0.65,1.5], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col E4' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[11.7,0.65,4.5], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col E5' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[11.7,0.65,8.0], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col E6' },
                // West row (6 columns)
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[-11.7,0.65,-8.0], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col W1' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[-11.7,0.65,-4.5], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col W2' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[-11.7,0.65,-1.5], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col W3' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[-11.7,0.65,1.5], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col W4' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[-11.7,0.65,4.5], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col W5' },
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[-11.7,0.65,8.0], rotation:[0,0,0], scale:[1.6,3.0,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle col W6' },

                // ============================================================
                // URNS at selected column bases (decorative clusters)
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
                // CYPRESS TREES (narrow Mediterranean look via tall pines scaled narrow)
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallA.glb',
                  transform: {position:[-38,0,-38], rotation:[0,0,0], scale:[1.2,3.0,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Cypress NW' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallB.glb',
                  transform: {position:[38,0,-38], rotation:[0,0,0], scale:[1.2,3.0,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Cypress NE' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallC.glb',
                  transform: {position:[-38,0,38], rotation:[0,0,0], scale:[1.2,3.0,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Cypress SW' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallD.glb',
                  transform: {position:[38,0,38], rotation:[0,0,0], scale:[1.2,3.0,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Cypress SE' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallA.glb',
                  transform: {position:[-38,0,0], rotation:[0,0,0], scale:[1.2,3.0,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Cypress W' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallB.glb',
                  transform: {position:[38,0,0], rotation:[0,0,0], scale:[1.2,3.0,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Cypress E' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallC.glb',
                  transform: {position:[0,0,-38], rotation:[0,0,0], scale:[1.2,3.0,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Cypress N' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallD.glb',
                  transform: {position:[0,0,38], rotation:[0,0,0], scale:[1.2,3.0,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Cypress S' },

                // ============================================================
                // GARDEN BUSHES + FLOWERS
                { glb: 'assets/props/kenney/nature_kit/plant_bushLarge.glb',
                  transform: {position:[-30,0,15], rotation:[0,0,0], scale:[1.3,1.3,1.3]}, cast_shadow: true, receive_shadow: true, label: 'Bush WS1' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushLarge.glb',
                  transform: {position:[30,0,15], rotation:[0,0,0], scale:[1.3,1.3,1.3]}, cast_shadow: true, receive_shadow: true, label: 'Bush ES1' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushDetailed.glb',
                  transform: {position:[-30,0,-15], rotation:[0,0,0], scale:[1.3,1.3,1.3]}, cast_shadow: true, receive_shadow: true, label: 'Bush WN1' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushDetailed.glb',
                  transform: {position:[30,0,-15], rotation:[0,0,0], scale:[1.3,1.3,1.3]}, cast_shadow: true, receive_shadow: true, label: 'Bush EN1' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushTriangle.glb',
                  transform: {position:[-15,0,30], rotation:[0,0,0], scale:[1.2,1.2,1.2]}, cast_shadow: true, receive_shadow: true, label: 'Bush SW1' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushTriangle.glb',
                  transform: {position:[15,0,30], rotation:[0,0,0], scale:[1.2,1.2,1.2]}, cast_shadow: true, receive_shadow: true, label: 'Bush SE1' },
                { glb: 'assets/props/kenney/nature_kit/flower_redA.glb',
                  transform: {position:[-28,0,8], rotation:[0,0,0], scale:[1.5,1.5,1.5]}, cast_shadow: true, receive_shadow: true, label: 'Flower red W1' },
                { glb: 'assets/props/kenney/nature_kit/flower_redB.glb',
                  transform: {position:[28,0,8], rotation:[0,0,0], scale:[1.5,1.5,1.5]}, cast_shadow: true, receive_shadow: true, label: 'Flower red E1' },
                { glb: 'assets/props/kenney/nature_kit/flower_yellowA.glb',
                  transform: {position:[-28,0,-8], rotation:[0,0,0], scale:[1.5,1.5,1.5]}, cast_shadow: true, receive_shadow: true, label: 'Flower yellow W1' },
                { glb: 'assets/props/kenney/nature_kit/flower_yellowB.glb',
                  transform: {position:[28,0,-8], rotation:[0,0,0], scale:[1.5,1.5,1.5]}, cast_shadow: true, receive_shadow: true, label: 'Flower yellow E1' },
                { glb: 'assets/props/kenney/nature_kit/cactus_short.glb',
                  transform: {position:[-8,0,32], rotation:[0,0,0], scale:[1.3,1.3,1.3]}, cast_shadow: true, receive_shadow: true, label: 'Cactus S1' },
                { glb: 'assets/props/kenney/nature_kit/cactus_short.glb',
                  transform: {position:[8,0,32], rotation:[0,0,0], scale:[1.3,1.3,1.3]}, cast_shadow: true, receive_shadow: true, label: 'Cactus S2' },

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

                // GATE / ENTRANCE STATUES (flanking front of atrium)
                { glb: 'assets/props/kenney/nature_kit/statue_head.glb',
                  transform: {position:[-10,0.08,30], rotation:[0,0,0], scale:[1.5,1.5,1.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Entrance statue W' },
                { glb: 'assets/props/kenney/nature_kit/statue_head.glb',
                  transform: {position:[10,0.08,30], rotation:[0,0,0], scale:[1.5,1.5,1.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Entrance statue E' },
            ],
            connectors: [],
            loci: [
                // Peristyle (6)
                { position: [0, 1.5, 0], marker_type: 'orb', label: '1. Peristyle: central fountain' },
                { position: [-10, 1.5, 10], marker_type: 'pedestal', label: '2. Peristyle: SW corner' },
                { position: [10, 1.5, 10], marker_type: 'pedestal', label: '3. Peristyle: SE corner' },
                { position: [-10, 1.5, -10], marker_type: 'pedestal', label: '4. Peristyle: NW corner' },
                { position: [10, 1.5, -10], marker_type: 'pedestal', label: '5. Peristyle: NE corner' },
                { position: [0, 1.5, -10], marker_type: 'glow', label: '6. Peristyle: north colonnade' },
                // Atrium (5)
                { position: [0, 1.5, 22], marker_type: 'frame', label: '7. Atrium: compluvium center' },
                { position: [-7, 1.5, 20], marker_type: 'orb', label: '8. Atrium: west wall' },
                { position: [7, 1.5, 20], marker_type: 'orb', label: '9. Atrium: east wall' },
                { position: [0, 1.5, 27], marker_type: 'door', label: '10. Atrium: main entrance' },
                { position: [0, 1.5, 16], marker_type: 'statue', label: '11. Atrium: peristyle doorway' },
                // Tablinum (4)
                { position: [0, 1.5, -18], marker_type: 'pedestal', label: '12. Tablinum: scholar desk' },
                { position: [-5, 1.5, -20], marker_type: 'frame', label: '13. Tablinum: west bookcase' },
                { position: [5, 1.5, -20], marker_type: 'frame', label: '14. Tablinum: east bookcase' },
                { position: [0, 1.5, -14], marker_type: 'door', label: '15. Tablinum: peristyle doorway' },
                // Triclinium (5)
                { position: [22, 1.5, 0], marker_type: 'orb', label: '16. Triclinium: dining table' },
                { position: [22, 1.5, -4], marker_type: 'pedestal', label: '17. Triclinium: north couch' },
                { position: [22, 1.5, 4], marker_type: 'pedestal', label: '18. Triclinium: south couch' },
                { position: [26, 1.5, 0], marker_type: 'frame', label: '19. Triclinium: east wall fresco' },
                { position: [15, 1.5, 0], marker_type: 'door', label: '20. Triclinium: peristyle doorway' },
                // Cubiculum (3)
                { position: [-22, 1.5, 0], marker_type: 'orb', label: '21. Cubiculum: bed' },
                { position: [-26, 1.5, 0], marker_type: 'frame', label: '22. Cubiculum: west wall' },
                { position: [-15, 1.5, 0], marker_type: 'door', label: '23. Cubiculum: peristyle doorway' },
                // Bath (3)
                { position: [-20, 1.5, -20], marker_type: 'glow', label: '24. Bath: caldarium pool' },
                { position: [-16, 1.5, -20], marker_type: 'pedestal', label: '25. Bath: tub chamber' },
                { position: [-24, 1.5, -20], marker_type: 'frame', label: '26. Bath: west alcove' },
                // Garden (2)
                { position: [0, 1.5, 35], marker_type: 'statue', label: '27. Garden: south cypress walk' },
                { position: [30, 1.5, 0], marker_type: 'statue', label: '28. Garden: east cypress walk' },
            ],
        };
        return t;
    },
    _libraryTower() {
        // Octagonal tower: 4 floors + observation deck on top.
        // 8 exterior walls (each ~12m wide) arranged around a ~28m-diameter octagon.
        // Interior radius to wall inside face ~13m; interior floor diagonal ~26m across.
        // Floor y: 0 (reading hall), 6 (study), 12 (scriptorium), 18 (observation).
        // The central stair column occupies roughly x=[-2..2], z=[-2..2].

        // --- Helpers we pre-compute at author time (not runtime) ---
        // For each of the 8 octagon sides we store { cx, cz, ry } already resolved.
        // Outer radius r=14 (wall midline); each wall is 12m wide.
        // Vertices angles: k * 45deg, walls bisect vertex edges so center angle = (k+0.5)*45.
        // Result (degrees, rounded for comments):
        //  0: angle  22.5 -> facing outward along +x,+z
        //  1: angle  67.5
        //  2: angle 112.5
        //  3: angle 157.5
        //  4: angle 202.5
        //  5: angle 247.5
        //  6: angle 292.5
        //  7: angle 337.5
        // cx = 14*cos(angle), cz = 14*sin(angle), ry = angle + 90deg (wall faces outward).
        // Pre-resolved positions (meters) with ry in radians:
        const OCTO = [
            { cx:  12.93, cz:   5.36, ry:  1.9635 }, //   22.5°
            { cx:   5.36, cz:  12.93, ry:  2.7489 }, //   67.5°
            { cx:  -5.36, cz:  12.93, ry:  3.5343 }, //  112.5°
            { cx: -12.93, cz:   5.36, ry:  4.3197 }, //  157.5°
            { cx: -12.93, cz:  -5.36, ry:  5.1051 }, //  202.5°
            { cx:  -5.36, cz: -12.93, ry:  5.8905 }, //  247.5°
            { cx:   5.36, cz: -12.93, ry:  0.3927 }, //  292.5° (-67.5°)
            { cx:  12.93, cz:  -5.36, ry:  1.1781 }, //  337.5° (-22.5°)
        ];

        const t = {
            meta: {
                id: 'library_tower',
                name: 'Library Tower',
                desc: 'Octagonal stone tower of old-world learning: four candlelit floors of bookshelves, scriptorium, and an observation dome crowned by a telescope and armillary sphere',
                spawn_point: { position: [0, 1.6, -5], rotation_y: 0 },
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
                    ao: null, // parchment_paper has no AO map in inventory
                    repeat: [2, 2],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                bronze_trim: {
                    albedo: 'assets/textures/bronze_trim/albedo_2k.jpg',
                    normal: 'assets/textures/bronze_trim/normal_2k.jpg',
                    roughness: 'assets/textures/bronze_trim/roughness_2k.jpg',
                    ao: null, // bronze_trim has no AO map in inventory
                    repeat: [2, 2],
                    roughness_scale: 0.4,
                    metalness: 0.8,
                },
            },
            surfaces: [
                // ========================================================
                // EXTERIOR OCTAGONAL SHELL — 8 sandstone walls, full height
                // Each wall: width 12m, height 24m (4 floors of 6m), depth 0.6m.
                // Centered vertically at y=12.
                // ========================================================
                { type: 'wall', transform: { position: [OCTO[0].cx, 12, OCTO[0].cz], rotation: [0, OCTO[0].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 24, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior E' },
                { type: 'wall', transform: { position: [OCTO[1].cx, 12, OCTO[1].cz], rotation: [0, OCTO[1].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 24, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior NE' },
                { type: 'wall', transform: { position: [OCTO[2].cx, 12, OCTO[2].cz], rotation: [0, OCTO[2].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 24, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior NW' },
                { type: 'wall', transform: { position: [OCTO[3].cx, 12, OCTO[3].cz], rotation: [0, OCTO[3].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 24, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior W' },
                { type: 'wall', transform: { position: [OCTO[4].cx, 12, OCTO[4].cz], rotation: [0, OCTO[4].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 24, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior SW' },
                { type: 'wall', transform: { position: [OCTO[5].cx, 12, OCTO[5].cz], rotation: [0, OCTO[5].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 24, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior S (entry)' },
                { type: 'wall', transform: { position: [OCTO[6].cx, 12, OCTO[6].cz], rotation: [0, OCTO[6].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 24, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior SE' },
                { type: 'wall', transform: { position: [OCTO[7].cx, 12, OCTO[7].cz], rotation: [0, OCTO[7].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 24, depth: 0.6 }, material: 'sandstone_wall', label: 'Tower exterior ESE' },

                // Exterior brick accent bands (one between each pair of floors) — thin horizontal courses.
                // Placed slightly outside sandstone plane (depth 0.65) at floor boundaries y=6, 12, 18.
                { type: 'wall', transform: { position: [OCTO[0].cx, 6, OCTO[0].cz], rotation: [0, OCTO[0].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12.2, height: 0.6, depth: 0.65 }, material: 'brick_aged', label: 'Brick course L2/L1 E' },
                { type: 'wall', transform: { position: [OCTO[2].cx, 6, OCTO[2].cz], rotation: [0, OCTO[2].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12.2, height: 0.6, depth: 0.65 }, material: 'brick_aged', label: 'Brick course L2/L1 NW' },
                { type: 'wall', transform: { position: [OCTO[4].cx, 12, OCTO[4].cz], rotation: [0, OCTO[4].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12.2, height: 0.6, depth: 0.65 }, material: 'brick_aged', label: 'Brick course L3/L2 SW' },
                { type: 'wall', transform: { position: [OCTO[6].cx, 18, OCTO[6].cz], rotation: [0, OCTO[6].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 12.2, height: 0.6, depth: 0.65 }, material: 'brick_aged', label: 'Brick course obs/L3 SE' },

                // ========================================================
                // FLOOR 1 — READING HALL (y=0 to y=6)
                // ========================================================
                // Generous oak plank floor (28x28 square inscribed in octagon — corners hidden by walls)
                { type: 'floor', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 28, height: 28, depth: 0.3 }, material: 'oak_plank_warm', label: 'Floor 1 — Reading Hall floor' },
                // Ceiling slab of Floor 1 (becomes Floor 2 structure underside) — oak beam, with central hole for stair
                { type: 'ceiling', transform: { position: [8, 6, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 28, depth: 0.3 }, material: 'oak_beam_dark', label: 'F1 ceiling slab east (stair hole center)' },
                { type: 'ceiling', transform: { position: [-8, 6, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 28, depth: 0.3 }, material: 'oak_beam_dark', label: 'F1 ceiling slab west' },
                { type: 'ceiling', transform: { position: [0, 6, 8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 4, height: 12, depth: 0.3 }, material: 'oak_beam_dark', label: 'F1 ceiling slab north strip' },
                { type: 'ceiling', transform: { position: [0, 6, -8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 4, height: 12, depth: 0.3 }, material: 'oak_beam_dark', label: 'F1 ceiling slab south strip' },
                // Exposed oak ceiling beams F1
                { type: 'ceiling', transform: { position: [0, 5.7, -6], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 24, height: 0.4, depth: 0.4 }, material: 'oak_beam_dark', label: 'F1 beam N' },
                { type: 'ceiling', transform: { position: [0, 5.7, 6], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 24, height: 0.4, depth: 0.4 }, material: 'oak_beam_dark', label: 'F1 beam S' },
                { type: 'ceiling', transform: { position: [-6, 5.7, 0], rotation: [0, 1.5708, 0], scale: [1,1,1] },
                  dimensions: { width: 24, height: 0.4, depth: 0.4 }, material: 'oak_beam_dark', label: 'F1 beam W' },
                { type: 'ceiling', transform: { position: [6, 5.7, 0], rotation: [0, 1.5708, 0], scale: [1,1,1] },
                  dimensions: { width: 24, height: 0.4, depth: 0.4 }, material: 'oak_beam_dark', label: 'F1 beam E' },

                // Interior plaster wainscot ring (thin interior shell on 4 walls only — NE/NW/SW/SE)
                // offsets slightly inside sandstone, height ~5m, sits on floor
                { type: 'wall', transform: { position: [OCTO[1].cx * 0.85, 2.5, OCTO[1].cz * 0.85], rotation: [0, OCTO[1].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 11, height: 5, depth: 0.15 }, material: 'plaster_cream', label: 'F1 interior plaster NE' },
                { type: 'wall', transform: { position: [OCTO[3].cx * 0.85, 2.5, OCTO[3].cz * 0.85], rotation: [0, OCTO[3].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 11, height: 5, depth: 0.15 }, material: 'plaster_cream', label: 'F1 interior plaster NW' },
                { type: 'wall', transform: { position: [OCTO[5].cx * 0.85, 2.5, OCTO[5].cz * 0.85], rotation: [0, OCTO[5].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 11, height: 5, depth: 0.15 }, material: 'plaster_cream', label: 'F1 interior plaster SW' },
                { type: 'wall', transform: { position: [OCTO[7].cx * 0.85, 2.5, OCTO[7].cz * 0.85], rotation: [0, OCTO[7].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 11, height: 5, depth: 0.15 }, material: 'plaster_cream', label: 'F1 interior plaster SE' },

                // ========================================================
                // FLOOR 2 — STUDY (y=6 to y=12)
                // ========================================================
                { type: 'floor', transform: { position: [8, 6.2, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 28, depth: 0.2 }, material: 'oak_plank_warm', label: 'Floor 2 east half' },
                { type: 'floor', transform: { position: [-8, 6.2, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 28, depth: 0.2 }, material: 'oak_plank_warm', label: 'Floor 2 west half' },
                { type: 'floor', transform: { position: [0, 6.2, 8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 4, height: 12, depth: 0.2 }, material: 'oak_plank_warm', label: 'Floor 2 north strip' },
                { type: 'floor', transform: { position: [0, 6.2, -8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 4, height: 12, depth: 0.2 }, material: 'oak_plank_warm', label: 'Floor 2 south strip' },
                // Ceiling of F2
                { type: 'ceiling', transform: { position: [8, 12, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 28, depth: 0.3 }, material: 'oak_beam_dark', label: 'F2 ceiling east' },
                { type: 'ceiling', transform: { position: [-8, 12, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 28, depth: 0.3 }, material: 'oak_beam_dark', label: 'F2 ceiling west' },
                { type: 'ceiling', transform: { position: [0, 12, 8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 4, height: 12, depth: 0.3 }, material: 'oak_beam_dark', label: 'F2 ceiling north strip' },
                { type: 'ceiling', transform: { position: [0, 12, -8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 4, height: 12, depth: 0.3 }, material: 'oak_beam_dark', label: 'F2 ceiling south strip' },

                // ========================================================
                // FLOOR 3 — SCRIPTORIUM / ARCHIVE (y=12 to y=18)
                // ========================================================
                { type: 'floor', transform: { position: [8, 12.2, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 28, depth: 0.2 }, material: 'oak_plank_warm', label: 'Floor 3 east half' },
                { type: 'floor', transform: { position: [-8, 12.2, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 28, depth: 0.2 }, material: 'oak_plank_warm', label: 'Floor 3 west half' },
                { type: 'floor', transform: { position: [0, 12.2, 8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 4, height: 12, depth: 0.2 }, material: 'oak_plank_warm', label: 'Floor 3 north strip' },
                { type: 'floor', transform: { position: [0, 12.2, -8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 4, height: 12, depth: 0.2 }, material: 'oak_plank_warm', label: 'Floor 3 south strip' },
                // Scriptorium accent walls — parchment and brick for a dimmer, older feel
                { type: 'wall', transform: { position: [OCTO[1].cx * 0.85, 15, OCTO[1].cz * 0.85], rotation: [0, OCTO[1].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 11, height: 5, depth: 0.15 }, material: 'parchment_paper', label: 'F3 parchment wall NE' },
                { type: 'wall', transform: { position: [OCTO[3].cx * 0.85, 15, OCTO[3].cz * 0.85], rotation: [0, OCTO[3].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 11, height: 5, depth: 0.15 }, material: 'parchment_paper', label: 'F3 parchment wall NW' },
                { type: 'wall', transform: { position: [OCTO[5].cx * 0.85, 15, OCTO[5].cz * 0.85], rotation: [0, OCTO[5].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 11, height: 5, depth: 0.15 }, material: 'brick_aged', label: 'F3 brick wall SW' },
                { type: 'wall', transform: { position: [OCTO[7].cx * 0.85, 15, OCTO[7].cz * 0.85], rotation: [0, OCTO[7].ry, 0], scale: [1,1,1] },
                  dimensions: { width: 11, height: 5, depth: 0.15 }, material: 'brick_aged', label: 'F3 brick wall SE' },
                // Ceiling of F3 (floor of observation room)
                { type: 'ceiling', transform: { position: [8, 18, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 28, depth: 0.3 }, material: 'oak_beam_dark', label: 'F3 ceiling east' },
                { type: 'ceiling', transform: { position: [-8, 18, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 12, height: 28, depth: 0.3 }, material: 'oak_beam_dark', label: 'F3 ceiling west' },
                { type: 'ceiling', transform: { position: [0, 18, 8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 4, height: 12, depth: 0.3 }, material: 'oak_beam_dark', label: 'F3 ceiling north strip' },
                { type: 'ceiling', transform: { position: [0, 18, -8], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 4, height: 12, depth: 0.3 }, material: 'oak_beam_dark', label: 'F3 ceiling south strip' },

                // ========================================================
                // FLOOR 4 — OBSERVATION ROOM (y=18 to y=24 + dome above)
                // ========================================================
                // Marble observation floor — full octagonal footprint (single slab, walls mask corners)
                { type: 'floor', transform: { position: [0, 18.2, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 26, height: 26, depth: 0.25 }, material: 'marble_white', label: 'F4 observation marble floor' },

                // Faux dome: 3 stacked octagonal-like marble slabs shrinking upward
                { type: 'ceiling', transform: { position: [0, 24, 0], rotation: [0, 0.3927, 0], scale: [1,1,1] },
                  dimensions: { width: 22, height: 22, depth: 0.4 }, material: 'marble_white', label: 'Dome base slab' },
                { type: 'ceiling', transform: { position: [0, 25.5, 0], rotation: [0, 0.3927, 0], scale: [1,1,1] },
                  dimensions: { width: 16, height: 16, depth: 0.4 }, material: 'marble_white', label: 'Dome mid slab' },
                { type: 'ceiling', transform: { position: [0, 27, 0], rotation: [0, 0.3927, 0], scale: [1,1,1] },
                  dimensions: { width: 9, height: 9, depth: 0.4 }, material: 'marble_white', label: 'Dome cap slab' },
                { type: 'ceiling', transform: { position: [0, 28, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 3, height: 3, depth: 0.3 }, material: 'bronze_trim', label: 'Dome bronze oculus cap' },

                // Central pedestal for the armillary sphere (surfaces composite)
                { type: 'floor', transform: { position: [0, 18.6, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 2.0, height: 2.0, depth: 0.8 }, material: 'marble_white', label: 'Armillary pedestal base' },
                { type: 'floor', transform: { position: [0, 19.1, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 0.2 }, material: 'bronze_trim', label: 'Armillary pedestal top' },
                // Armillary sphere approximation: 3 thin bronze rings (boxes rotated)
                { type: 'wall', transform: { position: [0, 20.0, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 0.08 }, material: 'bronze_trim', label: 'Armillary ring A (XY)' },
                { type: 'wall', transform: { position: [0, 20.0, 0], rotation: [0, 1.5708, 0], scale: [1,1,1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 0.08 }, material: 'bronze_trim', label: 'Armillary ring B (YZ)' },
                { type: 'floor', transform: { position: [0, 20.0, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 0.08 }, material: 'bronze_trim', label: 'Armillary ring C (XZ horizon)' },
                { type: 'wall', transform: { position: [0, 20.0, 0], rotation: [0, 0.7854, 0.7854], scale: [1,1,1] },
                  dimensions: { width: 1.5, height: 1.5, depth: 0.06 }, material: 'bronze_trim', label: 'Armillary ring D (ecliptic)' },

                // Telescope on pedestal — offset to +x, aimed at dome oculus
                { type: 'floor', transform: { position: [5, 18.6, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 0.8 }, material: 'marble_white', label: 'Telescope pedestal' },
                { type: 'wall', transform: { position: [5, 20.0, 0], rotation: [0, 0, 0.5236], scale: [1,1,1] },
                  dimensions: { width: 0.3, height: 2.2, depth: 0.3 }, material: 'bronze_trim', label: 'Telescope barrel' },
                { type: 'wall', transform: { position: [5, 20.9, 0], rotation: [0, 0, 0.5236], scale: [1,1,1] },
                  dimensions: { width: 0.4, height: 0.3, depth: 0.4 }, material: 'bronze_trim', label: 'Telescope eyepiece' },
                { type: 'wall', transform: { position: [5, 19.1, 0], rotation: [0, 0, 0.5236], scale: [1,1,1] },
                  dimensions: { width: 0.5, height: 0.5, depth: 0.5 }, material: 'bronze_trim', label: 'Telescope mount yoke' },

                // ========================================================
                // STRAIGHT MARBLE STAIRS (S175 iteration fix — was spiral, was unwalkable)
                // Three east-west flights, 15 steps each, 0.4m rise, 2.8m wide, along z=0.
                // F1->F2 east-bound at z=3 to stay clear of central room
                // F2->F3 west-bound at z=-3 (mirrored to back-and-forth pattern)
                // F3->F4 east-bound at z=3
                // ========================================================

                // F1 -> F2 stair (east-bound)
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

                // F2 -> F3 stair (west-bound)
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

                // F3 -> F4 stair (east-bound)
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
            ],
            props: [
                // ========================================================
                // FLOOR 1 — READING HALL PROPS
                // ========================================================
                // Perimeter bookshelves — two per octagonal side, flush against interior plaster ring
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosedWide.glb', transform: { position: [ 10.5,  0, 4.5], rotation: [0, -0.3927, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F1 bookshelf E1' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosedWide.glb', transform: { position: [ 10.5,  0,-4.5], rotation: [0,  0.3927, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F1 bookshelf E2' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb',    transform: { position: [-10.5,  0, 4.5], rotation: [0,  0.3927, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F1 bookshelf W1' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb',    transform: { position: [-10.5,  0,-4.5], rotation: [0, -0.3927, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F1 bookshelf W2' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',      transform: { position: [  4.5,  0, 10.5], rotation: [0,  3.1416, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F1 bookshelf N1' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',      transform: { position: [ -4.5,  0, 10.5], rotation: [0,  3.1416, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F1 bookshelf N2' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpenLow.glb',   transform: { position: [  4.5,  0,-10.5], rotation: [0,  0,      0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F1 bookshelf S1' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpenLow.glb',   transform: { position: [ -4.5,  0,-10.5], rotation: [0,  0,      0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F1 bookshelf S2' },

                // Central reading desks — 4 around the stair column
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',       transform: { position: [ 5, 0,  5], rotation: [0, -0.7854, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F1 reading desk NE' },
                { glb: 'assets/props/kenney/furniture_kit/chairDesk.glb',  transform: { position: [ 6, 0,  6], rotation: [0, -0.7854 + 3.1416, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F1 reading chair NE' },
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',       transform: { position: [-5, 0,  5], rotation: [0,  0.7854, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F1 reading desk NW' },
                { glb: 'assets/props/kenney/furniture_kit/chairDesk.glb',  transform: { position: [-6, 0,  6], rotation: [0,  0.7854 + 3.1416, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F1 reading chair NW' },
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',       transform: { position: [ 5, 0, -5], rotation: [0,  0.7854 + 3.1416, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F1 reading desk SE' },
                { glb: 'assets/props/kenney/furniture_kit/chairDesk.glb',  transform: { position: [ 6, 0, -6], rotation: [0,  0.7854, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F1 reading chair SE' },
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',       transform: { position: [-5, 0, -5], rotation: [0, -0.7854 + 3.1416, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F1 reading desk SW' },
                { glb: 'assets/props/kenney/furniture_kit/chairDesk.glb',  transform: { position: [-6, 0, -6], rotation: [0, -0.7854, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F1 reading chair SW' },

                { glb: 'assets/props/kenney/furniture_kit/books.glb',         transform: { position: [ 5,  0.9,  5], rotation: [0, 0.5, 0], scale: [1.4, 1.4, 1.4] }, cast_shadow: true, receive_shadow: true, label: 'F1 books on desk NE' },
                { glb: 'assets/props/kenney/furniture_kit/books.glb',         transform: { position: [-5,  0.9,  5], rotation: [0,-0.3, 0], scale: [1.4, 1.4, 1.4] }, cast_shadow: true, receive_shadow: true, label: 'F1 books on desk NW' },
                { glb: 'assets/props/kenney/furniture_kit/lampRoundTable.glb', transform: { position: [ 5,  0.9, -5], rotation: [0, 0,   0], scale: [1.3, 1.3, 1.3] }, cast_shadow: true, receive_shadow: true, label: 'F1 desk lamp SE' },
                { glb: 'assets/props/kenney/furniture_kit/lampRoundTable.glb', transform: { position: [-5,  0.9, -5], rotation: [0, 0,   0], scale: [1.3, 1.3, 1.3] }, cast_shadow: true, receive_shadow: true, label: 'F1 desk lamp SW' },

                { glb: 'assets/props/kenney/furniture_kit/rugRound.glb', transform: { position: [0, 0.02, 0], rotation: [0, 0, 0], scale: [4.0, 4.0, 4.0] }, cast_shadow: false, receive_shadow: true, label: 'F1 central rug' },

                // Central chandelier (polyhaven — textures may default; kept for silhouette)
                { glb: 'assets/props/polyhaven/Chandelier_01/Chandelier_01_2k.gltf', transform: { position: [0, 5.2, 0], rotation: [0, 0, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: false, receive_shadow: false, label: 'F1 central chandelier' },

                // Doorway (entry) on south wall — a doorway frame sitting inside sandstone
                { glb: 'assets/props/kenney/castle_kit/door.glb', transform: { position: [0, 0, 13.0], rotation: [0, 0, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: true, receive_shadow: true, label: 'F1 entry door (south)' },

                // ========================================================
                // FLOOR 2 — STUDY PROPS
                // ========================================================
                // Perimeter bookshelves
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb', transform: { position: [ 10.0, 6.2,  4.0], rotation: [0, -0.3927, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: true, receive_shadow: true, label: 'F2 bookshelf E1' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb', transform: { position: [ 10.0, 6.2, -4.0], rotation: [0,  0.3927, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: true, receive_shadow: true, label: 'F2 bookshelf E2' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',   transform: { position: [-10.0, 6.2,  4.0], rotation: [0,  0.3927, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: true, receive_shadow: true, label: 'F2 bookshelf W1' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',   transform: { position: [-10.0, 6.2, -4.0], rotation: [0, -0.3927, 0], scale: [2.0, 2.0, 2.0] }, cast_shadow: true, receive_shadow: true, label: 'F2 bookshelf W2' },

                // Central ornate study table with chairs
                { glb: 'assets/props/kenney/furniture_kit/tableCross.glb', transform: { position: [ 5, 6.2, 0], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F2 central study table' },
                { glb: 'assets/props/kenney/furniture_kit/chair.glb',      transform: { position: [ 6.8, 6.2,  1.2], rotation: [0, -1.5708, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F2 table chair A' },
                { glb: 'assets/props/kenney/furniture_kit/chair.glb',      transform: { position: [ 6.8, 6.2, -1.2], rotation: [0, -1.5708, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F2 table chair B' },
                { glb: 'assets/props/kenney/furniture_kit/chair.glb',      transform: { position: [ 3.2, 6.2,  1.2], rotation: [0,  1.5708, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F2 table chair C' },
                { glb: 'assets/props/kenney/furniture_kit/books.glb',      transform: { position: [ 5, 7.0, 0], rotation: [0, 0, 0], scale: [1.3, 1.3, 1.3] }, cast_shadow: true, receive_shadow: true, label: 'F2 open folios on table' },

                // Writing desks along W wall
                { glb: 'assets/props/kenney/furniture_kit/deskCorner.glb', transform: { position: [-7, 6.2,  9], rotation: [0, -0.7854, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F2 corner writing desk' },
                { glb: 'assets/props/kenney/furniture_kit/lampSquareTable.glb', transform: { position: [-7, 7.0,  9], rotation: [0, 0, 0], scale: [1.3, 1.3, 1.3] }, cast_shadow: true, receive_shadow: true, label: 'F2 lamp on corner desk' },

                // Lectern (standing reading stand — approximated with sideTable)
                { glb: 'assets/props/kenney/furniture_kit/sideTable.glb', transform: { position: [-7, 6.2, -9], rotation: [0, 0.5, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F2 standing lectern' },
                { glb: 'assets/props/kenney/furniture_kit/books.glb',    transform: { position: [-7, 7.0, -9], rotation: [0, 0.5, 0], scale: [1.3, 1.3, 1.3] }, cast_shadow: true, receive_shadow: true, label: 'F2 lectern book' },

                // F2 rug + chandelier
                { glb: 'assets/props/kenney/furniture_kit/rugRectangle.glb', transform: { position: [5, 6.22, 0], rotation: [0, 0, 0], scale: [3.0, 3.0, 3.0] }, cast_shadow: false, receive_shadow: true, label: 'F2 rug under study table' },
                { glb: 'assets/props/polyhaven/Chandelier_02/Chandelier_02_2k.gltf', transform: { position: [5, 10.5, 0], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: false, receive_shadow: false, label: 'F2 chandelier over study table' },

                // ========================================================
                // FLOOR 3 — SCRIPTORIUM / ARCHIVE PROPS
                // ========================================================
                { glb: 'assets/props/kenney/pirate_kit/chest.glb',          transform: { position: [ 9, 12.2,  6], rotation: [0, -0.7854, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F3 archive chest NE' },
                { glb: 'assets/props/kenney/pirate_kit/chest.glb',          transform: { position: [ 9, 12.2, -6], rotation: [0,  0.7854, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F3 archive chest SE' },
                { glb: 'assets/props/kenney/mini_dungeon/chest.glb',        transform: { position: [-9, 12.2,  6], rotation: [0,  0.7854, 0], scale: [2.2, 2.2, 2.2] }, cast_shadow: true, receive_shadow: true, label: 'F3 archive chest NW' },
                { glb: 'assets/props/kenney/pirate_kit/crate.glb',          transform: { position: [-9, 12.2, -6], rotation: [0, -0.7854, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F3 scroll crate SW' },
                { glb: 'assets/props/kenney/pirate_kit/barrel.glb',         transform: { position: [-10.5, 12.2, 0], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F3 scroll barrel W' },

                // Hooded figure statue (marble bust on pedestal — side table used as pedestal)
                { glb: 'assets/props/kenney/furniture_kit/sideTable.glb',             transform: { position: [ 6, 12.2, 9], rotation: [0, 3.1416, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F3 statue pedestal' },
                { glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf', transform: { position: [ 6, 13.0, 9], rotation: [0, 3.1416, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F3 hooded figure bust' },

                // Writing desks for copying
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',          transform: { position: [ 5, 12.2, -5], rotation: [0, 0.7854, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F3 copyist desk A' },
                { glb: 'assets/props/kenney/furniture_kit/chairDesk.glb',     transform: { position: [ 6, 12.2, -6], rotation: [0, 0.7854 + 3.1416, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F3 copyist chair A' },
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',          transform: { position: [-5, 12.2, -5], rotation: [0,-0.7854, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F3 copyist desk B' },
                { glb: 'assets/props/kenney/furniture_kit/lampRoundTable.glb', transform: { position: [ 5, 13.0, -5], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] }, cast_shadow: true, receive_shadow: true, label: 'F3 copyist lamp A' },
                { glb: 'assets/props/kenney/furniture_kit/lampRoundTable.glb', transform: { position: [-5, 13.0, -5], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] }, cast_shadow: true, receive_shadow: true, label: 'F3 copyist lamp B' },

                // Brazier for archive heat (mini dungeon banner as wall hanging + column as brazier base)
                { glb: 'assets/props/kenney/mini_dungeon/column.glb', transform: { position: [ 10, 12.2,  10], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F3 column brazier base NE' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb', transform: { position: [-10, 12.2,  10], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F3 column brazier base NW' },
                { glb: 'assets/props/kenney/mini_dungeon/banner.glb', transform: { position: [ 0, 13.5, 11.5], rotation: [0, 3.1416, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F3 hanging banner N' },
                { glb: 'assets/props/kenney/mini_dungeon/banner.glb', transform: { position: [ 0, 13.5, -11.5], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F3 hanging banner S' },

                // Chandelier F3
                { glb: 'assets/props/polyhaven/lantern_chandelier_01/lantern_chandelier_01_2k.gltf', transform: { position: [0, 16.5, 0], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: false, receive_shadow: false, label: 'F3 scriptorium chandelier' },

                // ========================================================
                // FLOOR 4 — OBSERVATION PROPS
                // ========================================================
                // Low bookshelves against walls to break up marble
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpenLow.glb', transform: { position: [ 9, 18.2,  6], rotation: [0, -0.3927, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F4 low shelf NE' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpenLow.glb', transform: { position: [ 9, 18.2, -6], rotation: [0,  0.3927, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F4 low shelf SE' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpenLow.glb', transform: { position: [-9, 18.2,  6], rotation: [0,  0.3927, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F4 low shelf NW' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpenLow.glb', transform: { position: [-9, 18.2, -6], rotation: [0, -0.3927, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F4 low shelf SW' },

                // Round celestial charts table
                { glb: 'assets/props/kenney/furniture_kit/tableRound.glb', transform: { position: [-5, 18.2, 0], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] }, cast_shadow: true, receive_shadow: true, label: 'F4 celestial charts table' },
                { glb: 'assets/props/kenney/furniture_kit/books.glb',       transform: { position: [-5, 19.0, 0], rotation: [0, 0.5, 0], scale: [1.3, 1.3, 1.3] }, cast_shadow: true, receive_shadow: true, label: 'F4 star atlas on table' },
                { glb: 'assets/props/kenney/furniture_kit/chair.glb',       transform: { position: [-6.5, 18.2, 0], rotation: [0, 1.5708, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F4 astronomer chair' },
                { glb: 'assets/props/kenney/furniture_kit/chair.glb',       transform: { position: [-3.5, 18.2, 0], rotation: [0,-1.5708, 0], scale: [1.5, 1.5, 1.5] }, cast_shadow: true, receive_shadow: true, label: 'F4 visitor chair' },

                // Potted plants softening the marble
                { glb: 'assets/props/kenney/furniture_kit/pottedPlant.glb', transform: { position: [  9, 18.2,  0], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F4 potted plant E' },
                { glb: 'assets/props/kenney/furniture_kit/pottedPlant.glb', transform: { position: [ -9, 18.2,  9], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] }, cast_shadow: true, receive_shadow: true, label: 'F4 potted plant NW' },
            ],
            connectors: [],
            loci: [
                // Spawn-anchor reading area (floor 1)
                { position: [0, 1.2, 10], marker_type: 'door',     label: 'Library entrance: south doors open on the Reading Hall' },
                { position: [5, 1.1, 5], marker_type: 'frame',    label: 'Reading Hall NE desk: open folio on classical rhetoric' },
                { position: [-5, 1.1, 5], marker_type: 'frame',    label: 'Reading Hall NW desk: geometry diagrams in chalk' },
                { position: [5, 1.1, -5], marker_type: 'frame',    label: 'Reading Hall SE desk: Aristotle open to the Organon' },
                { position: [-5, 1.1, -5], marker_type: 'frame',    label: 'Reading Hall SW desk: annotated Herodotus' },
                { position: [10.5, 1.5, 0], marker_type: 'orb',      label: 'Reading Hall east bookshelves: natural philosophy' },
                { position: [-10.5, 1.5, 0], marker_type: 'orb',      label: 'Reading Hall west bookshelves: medicine & alchemy' },
                { position: [0, 1.5, 10.5], marker_type: 'orb',      label: 'Reading Hall north bookshelves: theology & scripture' },
                { position: [0, 1.5, -10.5], marker_type: 'orb',      label: 'Reading Hall south bookshelves: law & politics' },
                { position: [0, 4.5, 0], marker_type: 'glow',     label: 'Reading Hall chandelier — candlelight locus' },

                // Floor 2 — Study
                { position: [5, 7.2, 0], marker_type: 'pedestal', label: 'Study: central oak table with illuminated atlas' },
                { position: [-7, 7.2, 9], marker_type: 'frame',    label: 'Study: corner writing desk with half-written letter' },
                { position: [-7, 7.2, -9], marker_type: 'frame',    label: 'Study: standing lectern displaying a vellum manuscript' },
                { position: [0, 9.0, 11], marker_type: 'frame',    label: 'Study: map of the known world pinned to the north wall' },
                { position: [11, 9.0, 0], marker_type: 'frame',    label: 'Study: celestial chart on the east wall' },
                { position: [-11, 9.0, 0], marker_type: 'frame',    label: 'Study: anatomical drawings on the west wall' },
                { position: [5, 10.0, 0], marker_type: 'glow',     label: 'Study chandelier — candlelight locus' },

                // Floor 3 — Scriptorium
                { position: [9, 13.0, 6], marker_type: 'pedestal', label: 'Scriptorium: sealed chest of decretals (NE)' },
                { position: [9, 13.0, -6], marker_type: 'pedestal', label: 'Scriptorium: chest of sermons and glosses (SE)' },
                { position: [-9, 13.0, 6], marker_type: 'pedestal', label: 'Scriptorium: iron-bound chest of heretical tracts (NW)' },
                { position: [6, 14.2, 9], marker_type: 'statue',   label: 'Scriptorium: hooded figure bust — the anonymous copyist' },
                { position: [5, 13.0, -5], marker_type: 'frame',    label: 'Scriptorium: copyist desk mid-transcription' },
                { position: [0, 15.8, 0], marker_type: 'glow',     label: 'Scriptorium lantern chandelier — dim candlelight locus' },

                // Floor 4 — Observation
                { position: [0, 20.0, 0], marker_type: 'pedestal', label: 'Observation room: bronze armillary sphere on central pedestal' },
                { position: [5, 20.5, 0], marker_type: 'pedestal', label: 'Observation room: brass telescope on its pedestal' },
                { position: [0, 19.3, 11], marker_type: 'frame',    label: 'Observation window N — looking north over the moors' },
                { position: [11, 19.3, 0], marker_type: 'frame',    label: 'Observation window E — first light at dawn' },
                { position: [0, 19.3, -11], marker_type: 'frame',    label: 'Observation window S — the village below' },
                { position: [-11, 19.3, 0], marker_type: 'frame',    label: 'Observation window W — sunset over the forest' },
            ],
        };
        return t;
    },
    _museumHall() {
        const t = {
            meta: {
                id: 'museum_hall',
                name: 'Museum Hall',
                desc: 'Grand neo-classical gallery — colonnaded marble hall with alcove exhibits and a rear rotunda sculpture',
                spawn_point: { position: [0, 1.6, 40], rotation_y: 180 },
                scale: 1.0,
            },
            environment: {
                hdri: 'assets/hdri/church_museum_2k.hdr',
                hdri_intensity: 1.0,
                hdri_as_background: true,
                fog: { color: 0xe0e4e8, near: 150, far: 300 },
                sun: { position: [0, 100, 0], intensity: 1.8, color: 0xffffee, cast_shadow: true, shadow_bounds: 120 },
                ambient: { intensity: 0.2 },
            },
            materials: {
                marble_white: {
                    albedo: 'assets/textures/marble_white/albedo_2k.jpg',
                    normal: 'assets/textures/marble_white/normal_2k.jpg',
                    roughness: 'assets/textures/marble_white/roughness_2k.jpg',
                    ao: 'assets/textures/marble_white/ao_2k.jpg',
                    repeat: [8, 15],
                    roughness_scale: 0.9,
                    metalness: 0,
                },
                travertine_stone: {
                    albedo: 'assets/textures/travertine_stone/albedo_2k.jpg',
                    normal: 'assets/textures/travertine_stone/normal_2k.jpg',
                    roughness: 'assets/textures/travertine_stone/roughness_2k.jpg',
                    ao: 'assets/textures/travertine_stone/ao_2k.jpg',
                    repeat: [4, 3],
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
                brick_aged: {
                    albedo: 'assets/textures/brick_aged/albedo_2k.jpg',
                    normal: 'assets/textures/brick_aged/normal_2k.jpg',
                    roughness: 'assets/textures/brick_aged/roughness_2k.jpg',
                    ao: 'assets/textures/brick_aged/ao_2k.jpg',
                    repeat: [5, 5],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                parchment_paper: {
                    albedo: 'assets/textures/parchment_paper/albedo_2k.jpg',
                    normal: 'assets/textures/parchment_paper/normal_2k.jpg',
                    roughness: 'assets/textures/parchment_paper/roughness_2k.jpg',
                    ao: null,
                    repeat: [1, 1],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
            },
            surfaces: [
                // ======================= MAIN HALL (100m long, 20m wide, 8m tall) =======================
                // Floor: white marble, full hall footprint extended for rotunda behind
                { type: 'floor', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 100, depth: 0.3 }, material: 'marble_white', label: 'Main hall floor' },

                // Ceiling — broken into 5 oak-coffered bays (each 20m long)
                { type: 'ceiling', transform: { position: [0, 8, -40], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 20, depth: 0.2 }, material: 'oak_beam_dark', label: 'Ceiling bay 1' },
                { type: 'ceiling', transform: { position: [0, 8, -20], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 20, depth: 0.2 }, material: 'oak_beam_dark', label: 'Ceiling bay 2' },
                { type: 'ceiling', transform: { position: [0, 8, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 20, depth: 0.2 }, material: 'oak_beam_dark', label: 'Ceiling bay 3' },
                { type: 'ceiling', transform: { position: [0, 8, 20], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 20, depth: 0.2 }, material: 'oak_beam_dark', label: 'Ceiling bay 4' },
                { type: 'ceiling', transform: { position: [0, 8, 40], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 20, depth: 0.2 }, material: 'oak_beam_dark', label: 'Ceiling bay 5' },

                // Coffered dividers — thin dark oak beams between bays (cross-beams at y=7.8)
                { type: 'ceiling', transform: { position: [0, 7.8, -30], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 0.8, depth: 0.4 }, material: 'oak_beam_dark', label: 'Ceiling cross-beam 1' },
                { type: 'ceiling', transform: { position: [0, 7.8, -10], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 0.8, depth: 0.4 }, material: 'oak_beam_dark', label: 'Ceiling cross-beam 2' },
                { type: 'ceiling', transform: { position: [0, 7.8, 10], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 0.8, depth: 0.4 }, material: 'oak_beam_dark', label: 'Ceiling cross-beam 3' },
                { type: 'ceiling', transform: { position: [0, 7.8, 30], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 20, height: 0.8, depth: 0.4 }, material: 'oak_beam_dark', label: 'Ceiling cross-beam 4' },

                // ======================= WEST WALL (x=-10) with 4 alcoves =======================
                // Wall segments between alcoves (alcoves centered at z = -35, -15, 5, 25; each 5m wide)
                // Each alcove is 5m wide, 4m deep (alcove back at x=-14), main wall at x=-10
                // Travertine wall pieces alternating with sandstone

                // Wall span 1: entrance to alcove 1 (z=45 to z=-32.5) — but break into pieces
                { type: 'wall', transform: { position: [-10, 4, 47.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 5, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'W wall entrance panel' },
                { type: 'wall', transform: { position: [-10, 4, 40], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 8, depth: 0.4 }, material: 'sandstone_wall', label: 'W wall span 1' },
                { type: 'wall', transform: { position: [-10, 4, 30], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'W wall span 2' },
                // Alcove 1 opening at z=25 (no wall between 22.5 and 27.5)
                { type: 'wall', transform: { position: [-10, 4, 15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15, height: 8, depth: 0.4 }, material: 'sandstone_wall', label: 'W wall span 3' },
                // Alcove 2 opening at z=5
                { type: 'wall', transform: { position: [-10, 4, -5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'W wall span 4' },
                // Alcove 3 opening at z=-15
                { type: 'wall', transform: { position: [-10, 4, -25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15, height: 8, depth: 0.4 }, material: 'sandstone_wall', label: 'W wall span 5' },
                // Alcove 4 opening at z=-35
                { type: 'wall', transform: { position: [-10, 4, -45], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'W wall span 6' },

                // ======================= EAST WALL (x=10) with 4 alcoves =======================
                { type: 'wall', transform: { position: [10, 4, 47.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 5, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'E wall entrance panel' },
                { type: 'wall', transform: { position: [10, 4, 40], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 8, depth: 0.4 }, material: 'sandstone_wall', label: 'E wall span 1' },
                { type: 'wall', transform: { position: [10, 4, 30], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'E wall span 2' },
                { type: 'wall', transform: { position: [10, 4, 15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15, height: 8, depth: 0.4 }, material: 'sandstone_wall', label: 'E wall span 3' },
                { type: 'wall', transform: { position: [10, 4, -5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'E wall span 4' },
                { type: 'wall', transform: { position: [10, 4, -25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15, height: 8, depth: 0.4 }, material: 'sandstone_wall', label: 'E wall span 5' },
                { type: 'wall', transform: { position: [10, 4, -45], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'E wall span 6' },

                // ======================= ALCOVE WEST SIDE (4 alcoves each 5m wide × 4m deep) =======================
                // Alcove W1 at z=25 — back wall at x=-14
                { type: 'floor', transform: { position: [-12, 0, 25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.3 }, material: 'marble_white', label: 'W alcove 1 floor' },
                { type: 'wall', transform: { position: [-14, 4, 25], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 5, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'W alcove 1 back' },
                { type: 'wall', transform: { position: [-12, 4, 22.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'W alcove 1 side S' },
                { type: 'wall', transform: { position: [-12, 4, 27.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'W alcove 1 side N' },
                { type: 'ceiling', transform: { position: [-12, 8, 25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.2 }, material: 'oak_beam_dark', label: 'W alcove 1 ceiling' },

                // Alcove W2 at z=5
                { type: 'floor', transform: { position: [-12, 0, 5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.3 }, material: 'marble_white', label: 'W alcove 2 floor' },
                { type: 'wall', transform: { position: [-14, 4, 5], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 5, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'W alcove 2 back' },
                { type: 'wall', transform: { position: [-12, 4, 2.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'W alcove 2 side S' },
                { type: 'wall', transform: { position: [-12, 4, 7.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'W alcove 2 side N' },
                { type: 'ceiling', transform: { position: [-12, 8, 5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.2 }, material: 'oak_beam_dark', label: 'W alcove 2 ceiling' },

                // Alcove W3 at z=-15
                { type: 'floor', transform: { position: [-12, 0, -15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.3 }, material: 'marble_white', label: 'W alcove 3 floor' },
                { type: 'wall', transform: { position: [-14, 4, -15], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 5, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'W alcove 3 back' },
                { type: 'wall', transform: { position: [-12, 4, -17.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'W alcove 3 side S' },
                { type: 'wall', transform: { position: [-12, 4, -12.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'W alcove 3 side N' },
                { type: 'ceiling', transform: { position: [-12, 8, -15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.2 }, material: 'oak_beam_dark', label: 'W alcove 3 ceiling' },

                // Alcove W4 at z=-35
                { type: 'floor', transform: { position: [-12, 0, -35], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.3 }, material: 'marble_white', label: 'W alcove 4 floor' },
                { type: 'wall', transform: { position: [-14, 4, -35], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 5, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'W alcove 4 back' },
                { type: 'wall', transform: { position: [-12, 4, -37.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'W alcove 4 side S' },
                { type: 'wall', transform: { position: [-12, 4, -32.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'W alcove 4 side N' },
                { type: 'ceiling', transform: { position: [-12, 8, -35], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.2 }, material: 'oak_beam_dark', label: 'W alcove 4 ceiling' },

                // ======================= ALCOVE EAST SIDE =======================
                // Alcove E1 at z=25
                { type: 'floor', transform: { position: [12, 0, 25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.3 }, material: 'marble_white', label: 'E alcove 1 floor' },
                { type: 'wall', transform: { position: [14, 4, 25], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 5, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'E alcove 1 back' },
                { type: 'wall', transform: { position: [12, 4, 22.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'E alcove 1 side S' },
                { type: 'wall', transform: { position: [12, 4, 27.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'E alcove 1 side N' },
                { type: 'ceiling', transform: { position: [12, 8, 25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.2 }, material: 'oak_beam_dark', label: 'E alcove 1 ceiling' },

                // Alcove E2 at z=5
                { type: 'floor', transform: { position: [12, 0, 5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.3 }, material: 'marble_white', label: 'E alcove 2 floor' },
                { type: 'wall', transform: { position: [14, 4, 5], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 5, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'E alcove 2 back' },
                { type: 'wall', transform: { position: [12, 4, 2.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'E alcove 2 side S' },
                { type: 'wall', transform: { position: [12, 4, 7.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'E alcove 2 side N' },
                { type: 'ceiling', transform: { position: [12, 8, 5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.2 }, material: 'oak_beam_dark', label: 'E alcove 2 ceiling' },

                // Alcove E3 at z=-15
                { type: 'floor', transform: { position: [12, 0, -15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.3 }, material: 'marble_white', label: 'E alcove 3 floor' },
                { type: 'wall', transform: { position: [14, 4, -15], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 5, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'E alcove 3 back' },
                { type: 'wall', transform: { position: [12, 4, -17.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'E alcove 3 side S' },
                { type: 'wall', transform: { position: [12, 4, -12.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'E alcove 3 side N' },
                { type: 'ceiling', transform: { position: [12, 8, -15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.2 }, material: 'oak_beam_dark', label: 'E alcove 3 ceiling' },

                // Alcove E4 at z=-35
                { type: 'floor', transform: { position: [12, 0, -35], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.3 }, material: 'marble_white', label: 'E alcove 4 floor' },
                { type: 'wall', transform: { position: [14, 4, -35], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 5, height: 8, depth: 0.4 }, material: 'travertine_stone', label: 'E alcove 4 back' },
                { type: 'wall', transform: { position: [12, 4, -37.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'E alcove 4 side S' },
                { type: 'wall', transform: { position: [12, 4, -32.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 8, depth: 0.3 }, material: 'travertine_stone', label: 'E alcove 4 side N' },
                { type: 'ceiling', transform: { position: [12, 8, -35], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 5, depth: 0.2 }, material: 'oak_beam_dark', label: 'E alcove 4 ceiling' },

                // ======================= SOUTH (ENTRANCE) WALL + stairs =======================
                // Entrance wall with grand doorway gap at center (x=-4..4)
                { type: 'wall', transform: { position: [-7, 4, 50], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6, height: 8, depth: 0.5 }, material: 'sandstone_wall', label: 'Entrance wall W' },
                { type: 'wall', transform: { position: [7, 4, 50], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6, height: 8, depth: 0.5 }, material: 'sandstone_wall', label: 'Entrance wall E' },
                // Lintel above doorway
                { type: 'wall', transform: { position: [0, 6.5, 50], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 3, depth: 0.5 }, material: 'sandstone_wall', label: 'Entrance lintel' },

                // Entrance stairs (4 steps) outside hall, z > 50
                { type: 'floor', transform: { position: [0, -0.8, 52], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 1, depth: 0.4 }, material: 'travertine_stone', label: 'Entrance step 1' },
                { type: 'floor', transform: { position: [0, -0.6, 53], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 14, height: 1, depth: 0.4 }, material: 'travertine_stone', label: 'Entrance step 2' },
                { type: 'floor', transform: { position: [0, -0.4, 54], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 16, height: 1, depth: 0.4 }, material: 'travertine_stone', label: 'Entrance step 3' },
                { type: 'floor', transform: { position: [0, -0.2, 55], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 18, height: 1, depth: 0.4 }, material: 'travertine_stone', label: 'Entrance step 4' },

                // ======================= REAR ROTUNDA (octagonal, center at z=-65) =======================
                // Circular floor approximated as an octagon via two rotated squares (here: just a big floor disk as box)
                { type: 'floor', transform: { position: [0, 0, -65], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 24, height: 24, depth: 0.3 }, material: 'marble_white', label: 'Rotunda floor' },
                { type: 'ceiling', transform: { position: [0, 10, -65], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 24, height: 24, depth: 0.3 }, material: 'oak_beam_dark', label: 'Rotunda dome ceiling' },

                // Rotunda perimeter walls — 8 segments (octagon approximation)
                { type: 'wall', transform: { position: [0, 5, -77], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 16, height: 10, depth: 0.5 }, material: 'travertine_stone', label: 'Rotunda N wall' },
                { type: 'wall', transform: { position: [12, 5, -65], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 16, height: 10, depth: 0.5 }, material: 'travertine_stone', label: 'Rotunda E wall' },
                { type: 'wall', transform: { position: [-12, 5, -65], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 16, height: 10, depth: 0.5 }, material: 'travertine_stone', label: 'Rotunda W wall' },
                // Diagonal corners (sandstone accents)
                { type: 'wall', transform: { position: [9, 5, -75], rotation: [0, 45, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 10, depth: 0.5 }, material: 'sandstone_wall', label: 'Rotunda NE diagonal' },
                { type: 'wall', transform: { position: [-9, 5, -75], rotation: [0, -45, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 10, depth: 0.5 }, material: 'sandstone_wall', label: 'Rotunda NW diagonal' },
                { type: 'wall', transform: { position: [9, 5, -55], rotation: [0, -45, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 10, depth: 0.5 }, material: 'sandstone_wall', label: 'Rotunda SE diagonal' },
                { type: 'wall', transform: { position: [-9, 5, -55], rotation: [0, 45, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 10, depth: 0.5 }, material: 'sandstone_wall', label: 'Rotunda SW diagonal' },

                // Central pedestal for rotunda sculpture (big square plinth)
                { type: 'floor', transform: { position: [0, 0.5, -65], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 3, height: 3, depth: 1 }, material: 'basalt_dark', label: 'Rotunda plinth base' },
                { type: 'floor', transform: { position: [0, 1.2, -65], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.4, height: 2.4, depth: 0.4 }, material: 'bronze_trim', label: 'Rotunda plinth cap' },

                // Wall between main hall and rotunda (north end of hall) has a wide doorway opening
                { type: 'wall', transform: { position: [-7, 4, -50], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6, height: 8, depth: 0.5 }, material: 'sandstone_wall', label: 'Rotunda arch W' },
                { type: 'wall', transform: { position: [7, 4, -50], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6, height: 8, depth: 0.5 }, material: 'sandstone_wall', label: 'Rotunda arch E' },
                { type: 'wall', transform: { position: [0, 6.5, -50], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 3, depth: 0.5 }, material: 'sandstone_wall', label: 'Rotunda arch lintel' },

                // ======================= DISPLAY PEDESTALS IN EACH ALCOVE =======================
                // West alcove pedestals (basalt + bronze cap)
                { type: 'floor', transform: { position: [-12, 0.5, 25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 1 }, material: 'basalt_dark', label: 'W alcove 1 pedestal' },
                { type: 'floor', transform: { position: [-12, 1.1, 25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 0.2 }, material: 'bronze_trim', label: 'W alcove 1 pedestal cap' },
                { type: 'floor', transform: { position: [-12, 0.5, 5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 1 }, material: 'basalt_dark', label: 'W alcove 2 pedestal' },
                { type: 'floor', transform: { position: [-12, 1.1, 5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 0.2 }, material: 'bronze_trim', label: 'W alcove 2 pedestal cap' },
                { type: 'floor', transform: { position: [-12, 0.5, -15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 1 }, material: 'basalt_dark', label: 'W alcove 3 pedestal' },
                { type: 'floor', transform: { position: [-12, 1.1, -15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 0.2 }, material: 'bronze_trim', label: 'W alcove 3 pedestal cap' },
                { type: 'floor', transform: { position: [-12, 0.5, -35], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 1 }, material: 'basalt_dark', label: 'W alcove 4 pedestal' },
                { type: 'floor', transform: { position: [-12, 1.1, -35], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 0.2 }, material: 'bronze_trim', label: 'W alcove 4 pedestal cap' },

                // East alcove pedestals
                { type: 'floor', transform: { position: [12, 0.5, 25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 1 }, material: 'basalt_dark', label: 'E alcove 1 pedestal' },
                { type: 'floor', transform: { position: [12, 1.1, 25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 0.2 }, material: 'bronze_trim', label: 'E alcove 1 pedestal cap' },
                { type: 'floor', transform: { position: [12, 0.5, 5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 1 }, material: 'basalt_dark', label: 'E alcove 2 pedestal' },
                { type: 'floor', transform: { position: [12, 1.1, 5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 0.2 }, material: 'bronze_trim', label: 'E alcove 2 pedestal cap' },
                { type: 'floor', transform: { position: [12, 0.5, -15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 1 }, material: 'basalt_dark', label: 'E alcove 3 pedestal' },
                { type: 'floor', transform: { position: [12, 1.1, -15], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 0.2 }, material: 'bronze_trim', label: 'E alcove 3 pedestal cap' },
                { type: 'floor', transform: { position: [12, 0.5, -35], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 1 }, material: 'basalt_dark', label: 'E alcove 4 pedestal' },
                { type: 'floor', transform: { position: [12, 1.1, -35], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 0.2 }, material: 'bronze_trim', label: 'E alcove 4 pedestal cap' },

                // ======================= STATUE PLINTHS FLANKING ENTRANCE =======================
                { type: 'floor', transform: { position: [-6, 0.5, 48], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.6, height: 1.6, depth: 1 }, material: 'basalt_dark', label: 'Entrance statue plinth W' },
                { type: 'floor', transform: { position: [6, 0.5, 48], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.6, height: 1.6, depth: 1 }, material: 'basalt_dark', label: 'Entrance statue plinth E' },
            ],
            props: [
                // ======================= MAIN COLONNADE (2 rows, 10 columns each) =======================
                // West row of columns along x=-8 (just inside west wall), z = 45..-45 (10 columns, 10m spacing)
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-8, 0, 45], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'W col 1' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-8, 0, 35], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'W col 2' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-8, 0, 25], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'W col 3' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-8, 0, 15], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'W col 4' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-8, 0, 5], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'W col 5' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-8, 0, -5], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'W col 6' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-8, 0, -15], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'W col 7' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-8, 0, -25], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'W col 8' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-8, 0, -35], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'W col 9' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-8, 0, -45], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'W col 10' },

                // East row of columns at x=8
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [8, 0, 45], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'E col 1' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [8, 0, 35], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'E col 2' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [8, 0, 25], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'E col 3' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [8, 0, 15], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'E col 4' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [8, 0, 5], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'E col 5' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [8, 0, -5], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'E col 6' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [8, 0, -15], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'E col 7' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [8, 0, -25], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'E col 8' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [8, 0, -35], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'E col 9' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [8, 0, -45], rotation: [0, 0, 0], scale: [2.5, 3.5, 2.5] },
                  cast_shadow: true, receive_shadow: true, label: 'E col 10' },

                // ======================= ROTUNDA COLUMNS (6 around central sculpture) =======================
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [5, 0, -60], rotation: [0, 0, 0], scale: [2.8, 4, 2.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Rotunda col 1' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-5, 0, -60], rotation: [0, 0, 0], scale: [2.8, 4, 2.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Rotunda col 2' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [6, 0, -65], rotation: [0, 0, 0], scale: [2.8, 4, 2.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Rotunda col 3' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-6, 0, -65], rotation: [0, 0, 0], scale: [2.8, 4, 2.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Rotunda col 4' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [5, 0, -70], rotation: [0, 0, 0], scale: [2.8, 4, 2.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Rotunda col 5' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-5, 0, -70], rotation: [0, 0, 0], scale: [2.8, 4, 2.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Rotunda col 6' },

                // ======================= POLYHAVEN MARBLE BUSTS (alcove + rotunda exhibits) =======================
                // Rotunda central sculpture (large)
                { glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf',
                  transform: { position: [0, 1.4, -65], rotation: [0, 0, 0], scale: [3, 3, 3] },
                  cast_shadow: true, receive_shadow: true, label: 'Rotunda central sculpture' },
                // West alcoves — busts on pedestals 1 & 3
                { glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf',
                  transform: { position: [-12, 1.2, 25], rotation: [0, 90, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'W alcove 1 bust' },
                { glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf',
                  transform: { position: [-12, 1.2, -15], rotation: [0, 90, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'W alcove 3 bust' },
                // East alcoves — busts on pedestals 2 & 4
                { glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf',
                  transform: { position: [12, 1.2, 5], rotation: [0, -90, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'E alcove 2 bust' },
                { glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf',
                  transform: { position: [12, 1.2, -35], rotation: [0, -90, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'E alcove 4 bust' },
                // Flanking entrance statues
                { glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf',
                  transform: { position: [-6, 1.3, 48], rotation: [0, 180, 0], scale: [2, 2, 2] },
                  cast_shadow: true, receive_shadow: true, label: 'Entrance bust W' },
                { glb: 'assets/props/polyhaven/marble_bust_01/marble_bust_01_2k.gltf',
                  transform: { position: [6, 1.3, 48], rotation: [0, 180, 0], scale: [2, 2, 2] },
                  cast_shadow: true, receive_shadow: true, label: 'Entrance bust E' },

                // ======================= ARTIFACT DISPLAY PROPS (treasure chests in alcoves 2, 4 west; 1, 3 east) =======================
                { glb: 'assets/props/kenney/pirate_kit/chest.glb',
                  transform: { position: [-12, 1.2, 5], rotation: [0, 90, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'W alcove 2 chest' },
                { glb: 'assets/props/kenney/pirate_kit/chest.glb',
                  transform: { position: [-12, 1.2, -35], rotation: [0, 90, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'W alcove 4 chest' },
                { glb: 'assets/props/kenney/pirate_kit/chest.glb',
                  transform: { position: [12, 1.2, 25], rotation: [0, -90, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'E alcove 1 chest' },
                { glb: 'assets/props/kenney/pirate_kit/chest.glb',
                  transform: { position: [12, 1.2, -15], rotation: [0, -90, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'E alcove 3 chest' },

                // ======================= ACCENT LIGHTING (candles on each pedestal edge) =======================
                // Holiday kit lantern on each alcove pedestal
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-12.5, 1.2, 24.2], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  cast_shadow: false, receive_shadow: true, label: 'W alcove 1 lantern' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-12.5, 1.2, 4.2], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  cast_shadow: false, receive_shadow: true, label: 'W alcove 2 lantern' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-12.5, 1.2, -15.8], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  cast_shadow: false, receive_shadow: true, label: 'W alcove 3 lantern' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-12.5, 1.2, -35.8], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  cast_shadow: false, receive_shadow: true, label: 'W alcove 4 lantern' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [12.5, 1.2, 24.2], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  cast_shadow: false, receive_shadow: true, label: 'E alcove 1 lantern' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [12.5, 1.2, 4.2], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  cast_shadow: false, receive_shadow: true, label: 'E alcove 2 lantern' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [12.5, 1.2, -15.8], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  cast_shadow: false, receive_shadow: true, label: 'E alcove 3 lantern' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [12.5, 1.2, -35.8], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  cast_shadow: false, receive_shadow: true, label: 'E alcove 4 lantern' },

                // ======================= VIEWING BENCHES DOWN THE HALL =======================
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: { position: [0, 0, 38], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Bench 1' },
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: { position: [0, 0, 18], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Bench 2' },
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: { position: [0, 0, -2], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Bench 3' },
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: { position: [0, 0, -22], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Bench 4' },
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: { position: [0, 0, -42], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Bench 5' },

                // ======================= CHANDELIERS (hanging in main hall) =======================
                { glb: 'assets/props/polyhaven/Chandelier_01/Chandelier_01_2k.gltf',
                  transform: { position: [0, 6.5, 30], rotation: [0, 0, 0], scale: [2, 2, 2] },
                  cast_shadow: false, receive_shadow: false, label: 'Hall chandelier 1' },
                { glb: 'assets/props/polyhaven/Chandelier_01/Chandelier_01_2k.gltf',
                  transform: { position: [0, 6.5, 10], rotation: [0, 0, 0], scale: [2, 2, 2] },
                  cast_shadow: false, receive_shadow: false, label: 'Hall chandelier 2' },
                { glb: 'assets/props/polyhaven/Chandelier_01/Chandelier_01_2k.gltf',
                  transform: { position: [0, 6.5, -10], rotation: [0, 0, 0], scale: [2, 2, 2] },
                  cast_shadow: false, receive_shadow: false, label: 'Hall chandelier 3' },
                { glb: 'assets/props/polyhaven/Chandelier_01/Chandelier_01_2k.gltf',
                  transform: { position: [0, 6.5, -30], rotation: [0, 0, 0], scale: [2, 2, 2] },
                  cast_shadow: false, receive_shadow: false, label: 'Hall chandelier 4' },
                // Rotunda chandelier
                { glb: 'assets/props/polyhaven/Chandelier_02/Chandelier_02_2k.gltf',
                  transform: { position: [0, 8, -65], rotation: [0, 0, 0], scale: [2.5, 2.5, 2.5] },
                  cast_shadow: false, receive_shadow: false, label: 'Rotunda chandelier' },

                // ======================= ENTRANCE DOORS =======================
                { glb: 'assets/props/kenney/castle_kit/door.glb',
                  transform: { position: [-2, 0, 50], rotation: [0, 0, 0], scale: [2, 2.5, 1.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Entrance door W leaf' },
                { glb: 'assets/props/kenney/castle_kit/door.glb',
                  transform: { position: [2, 0, 50], rotation: [0, 180, 0], scale: [2, 2.5, 1.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Entrance door E leaf' },

                // ======================= ATMOSPHERIC PLANTS =======================
                { glb: 'assets/props/kenney/furniture_kit/pottedPlant.glb',
                  transform: { position: [-7, 0, 46], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'Potted plant entrance W' },
                { glb: 'assets/props/kenney/furniture_kit/pottedPlant.glb',
                  transform: { position: [7, 0, 46], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'Potted plant entrance E' },
                { glb: 'assets/props/kenney/furniture_kit/pottedPlant.glb',
                  transform: { position: [-7, 0, -46], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'Potted plant rear W' },
                { glb: 'assets/props/kenney/furniture_kit/pottedPlant.glb',
                  transform: { position: [7, 0, -46], rotation: [0, 0, 0], scale: [1.6, 1.6, 1.6] },
                  cast_shadow: true, receive_shadow: true, label: 'Potted plant rear E' },

                // ======================= ALCOVE WALL LAMPS (extra glow) =======================
                { glb: 'assets/props/kenney/furniture_kit/lampWall.glb',
                  transform: { position: [-13.8, 5.5, 25], rotation: [0, 90, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: false, receive_shadow: false, label: 'W alcove 1 wall lamp' },
                { glb: 'assets/props/kenney/furniture_kit/lampWall.glb',
                  transform: { position: [-13.8, 5.5, -15], rotation: [0, 90, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: false, receive_shadow: false, label: 'W alcove 3 wall lamp' },
                { glb: 'assets/props/kenney/furniture_kit/lampWall.glb',
                  transform: { position: [13.8, 5.5, 5], rotation: [0, -90, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: false, receive_shadow: false, label: 'E alcove 2 wall lamp' },
                { glb: 'assets/props/kenney/furniture_kit/lampWall.glb',
                  transform: { position: [13.8, 5.5, -35], rotation: [0, -90, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: false, receive_shadow: false, label: 'E alcove 4 wall lamp' },

                // Rotunda corner plants
                { glb: 'assets/props/kenney/furniture_kit/pottedPlant.glb',
                  transform: { position: [-10, 0, -75], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Rotunda plant NW' },
                { glb: 'assets/props/kenney/furniture_kit/pottedPlant.glb',
                  transform: { position: [10, 0, -75], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Rotunda plant NE' },
            ],
            connectors: [],
            loci: [
                // 8 alcove exhibits × 2 each (pedestal + wall painting) = 16 loci
                // West alcove 1 — bust display + wall frame
                { position: [-12, 2.2, 25], marker_type: 'statue', label: 'W alcove 1: marble bust exhibit' },
                { position: [-13.8, 4, 25], marker_type: 'frame', label: 'W alcove 1: painting on back wall' },
                // West alcove 2 — chest + frame
                { position: [-12, 2.0, 5], marker_type: 'pedestal', label: 'W alcove 2: treasure chest display' },
                { position: [-13.8, 4, 5], marker_type: 'frame', label: 'W alcove 2: painting on back wall' },
                // West alcove 3 — bust + frame
                { position: [-12, 2.2, -15], marker_type: 'statue', label: 'W alcove 3: marble bust exhibit' },
                { position: [-13.8, 4, -15], marker_type: 'frame', label: 'W alcove 3: painting on back wall' },
                // West alcove 4 — chest + frame
                { position: [-12, 2.0, -35], marker_type: 'pedestal', label: 'W alcove 4: artifact display' },
                { position: [-13.8, 4, -35], marker_type: 'frame', label: 'W alcove 4: painting on back wall' },
                // East alcove 1 — chest + frame
                { position: [12, 2.0, 25], marker_type: 'pedestal', label: 'E alcove 1: treasure display' },
                { position: [13.8, 4, 25], marker_type: 'frame', label: 'E alcove 1: painting on back wall' },
                // East alcove 2 — bust + frame
                { position: [12, 2.2, 5], marker_type: 'statue', label: 'E alcove 2: marble bust exhibit' },
                { position: [13.8, 4, 5], marker_type: 'frame', label: 'E alcove 2: painting on back wall' },
                // East alcove 3 — chest + frame
                { position: [12, 2.0, -15], marker_type: 'pedestal', label: 'E alcove 3: artifact display' },
                { position: [13.8, 4, -15], marker_type: 'frame', label: 'E alcove 3: painting on back wall' },
                // East alcove 4 — bust + frame
                { position: [12, 2.2, -35], marker_type: 'statue', label: 'E alcove 4: marble bust exhibit' },
                { position: [13.8, 4, -35], marker_type: 'frame', label: 'E alcove 4: painting on back wall' },

                // Rotunda — central + 4 quadrant points = 5
                { position: [0, 3, -65], marker_type: 'statue', label: 'Rotunda: central marble sculpture' },
                { position: [0, 2, -76], marker_type: 'frame', label: 'Rotunda: north wall painting' },
                { position: [11, 2, -65], marker_type: 'frame', label: 'Rotunda: east wall painting' },
                { position: [-11, 2, -65], marker_type: 'frame', label: 'Rotunda: west wall painting' },
                { position: [0, 8, -65], marker_type: 'glow', label: 'Rotunda: dome skylight' },

                // Main hall special exhibits (3 column-associated points)
                { position: [0, 1.5, 38], marker_type: 'orb', label: 'Hall: grand entrance vista' },
                { position: [0, 1.5, 0], marker_type: 'orb', label: 'Hall: central crossing' },
                { position: [0, 1.5, -38], marker_type: 'orb', label: 'Hall: approach to rotunda' },

                // Entrance flanking busts = 2
                { position: [-6, 2.5, 48], marker_type: 'statue', label: 'Entrance: west guardian bust' },
                { position: [6, 2.5, 48], marker_type: 'statue', label: 'Entrance: east guardian bust' },

                // Chandelier accents = 2
                { position: [0, 6.5, 30], marker_type: 'glow', label: 'Hall chandelier 1 light' },
                { position: [0, 6.5, -30], marker_type: 'glow', label: 'Hall chandelier 4 light' },

                // Entrance door locus = 1
                { position: [0, 1.2, 50], marker_type: 'door', label: 'Main entrance threshold' },
            ],
        };
        return t;
    },
    _catacombs() {
        const t = {
            meta: {
                id: 'catacombs',
                name: 'Catacombs',
                desc: 'Underground burial network of arched corridors, ossuary, altar chamber, and saint crypt',
                spawn_point: { position: [0, 1.6, 15], rotation_y: 180 },
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
            // Layout (plan view, +z is south/spawn, -z is north):
            //
            //                   [Chamber A: altar]        (west branch, x=-20)
            //                          |
            //   (north -30z) ==========+========== (south +30z, spawn)
            //                          |
            //                   [Chamber C: crypt]        (east branch, x=+20)
            //                          |
            //                    [Chamber B: ossuary]     (south-west branch, x=-18, z=+10)
            //
            // Main corridor runs along z-axis from z=+30 (entrance) to z=-30 (dead end),
            // 4m wide (x from -2 to +2), 4m tall ceiling.
            //
            surfaces: [
                // -------- MAIN CORRIDOR --------
                // Floor: 4m wide × 60m long
                { type: 'floor', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 60, depth: 0.3 }, material: 'basalt_dark', label: 'Main corridor floor' },

                // West wall: long wall at x=-2, runs z -30..+30, height 4
                { type: 'wall', transform: { position: [-2, 2, 0], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 60, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Corridor west wall' },

                // East wall: long wall at x=+2, runs z -30..+30, height 4
                { type: 'wall', transform: { position: [2, 2, 0], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 60, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Corridor east wall' },

                // Ceiling (vaulted approximation — flat brick crown)
                { type: 'ceiling', transform: { position: [0, 4, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 60, depth: 0.15 }, material: 'brick_aged', label: 'Corridor vault' },

                // North dead-end cap
                { type: 'wall', transform: { position: [0, 2, -30], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Corridor north cap' },

                // Sarcophagi in wall niches along corridor (compose from boxes)
                // Sarcophagus 1 — west side z=-22 (base + lid)
                { type: 'floor', transform: { position: [-2.5, 0.4, -22], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 2.4, depth: 0.8 }, material: 'travertine_stone', label: 'Sarcophagus W1 base' },
                { type: 'floor', transform: { position: [-2.5, 1.0, -22], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.0, height: 2.2, depth: 0.3 }, material: 'oak_beam_dark', label: 'Sarcophagus W1 lid' },
                // Sarcophagus 2 — east side z=-14
                { type: 'floor', transform: { position: [2.5, 0.4, -14], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 2.4, depth: 0.8 }, material: 'travertine_stone', label: 'Sarcophagus E1 base' },
                { type: 'floor', transform: { position: [2.5, 1.0, -14], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.0, height: 2.2, depth: 0.3 }, material: 'oak_beam_dark', label: 'Sarcophagus E1 lid' },
                // Sarcophagus 3 — west side z=-6
                { type: 'floor', transform: { position: [-2.5, 0.4, -6], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 2.4, depth: 0.8 }, material: 'travertine_stone', label: 'Sarcophagus W2 base' },
                { type: 'floor', transform: { position: [-2.5, 1.0, -6], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.0, height: 2.2, depth: 0.3 }, material: 'oak_beam_dark', label: 'Sarcophagus W2 lid' },
                // Sarcophagus 4 — east side z=+2
                { type: 'floor', transform: { position: [2.5, 0.4, 2], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 2.4, depth: 0.8 }, material: 'travertine_stone', label: 'Sarcophagus E2 base' },
                { type: 'floor', transform: { position: [2.5, 1.0, 2], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.0, height: 2.2, depth: 0.3 }, material: 'oak_beam_dark', label: 'Sarcophagus E2 lid' },

                // -------- CHAMBER A: Altar chamber (west branch, z=-24, x=-20) --------
                // Connection passage from main corridor at z=-24 to chamber at x=-20
                // Opening in corridor west wall — handled by not subtracting since walls overlap conceptually; placed a wide-door label here.
                // Passage floor
                { type: 'floor', transform: { position: [-8, 0, -24], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 3, depth: 0.3 }, material: 'basalt_dark', label: 'Passage A floor' },
                // Passage north wall
                { type: 'wall', transform: { position: [-8, 2, -22.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Passage A N wall' },
                // Passage south wall
                { type: 'wall', transform: { position: [-8, 2, -25.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Passage A S wall' },
                // Passage ceiling
                { type: 'ceiling', transform: { position: [-8, 4, -24], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 3, depth: 0.15 }, material: 'brick_aged', label: 'Passage A vault' },

                // Chamber A floor — 10×10
                { type: 'floor', transform: { position: [-20, 0, -24], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 10, depth: 0.3 }, material: 'cobblestone_old', label: 'Chamber A floor' },
                // Chamber A north wall
                { type: 'wall', transform: { position: [-20, 2, -29], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber A N wall' },
                // Chamber A south wall
                { type: 'wall', transform: { position: [-20, 2, -19], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber A S wall' },
                // Chamber A west wall
                { type: 'wall', transform: { position: [-25, 2, -24], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber A W wall' },
                // Chamber A east wall (between passage) — split into two pieces around opening
                { type: 'wall', transform: { position: [-15, 2, -27], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber A E wall N' },
                { type: 'wall', transform: { position: [-15, 2, -21], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber A E wall S' },
                // Chamber A ceiling (vault)
                { type: 'ceiling', transform: { position: [-20, 4, -24], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 10, depth: 0.15 }, material: 'brick_aged', label: 'Chamber A vault' },

                // Central altar (composed surfaces)
                { type: 'floor', transform: { position: [-20, 0.5, -24], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.0, height: 2.0, depth: 1.0 }, material: 'travertine_stone', label: 'Altar base' },
                { type: 'floor', transform: { position: [-20, 1.1, -24], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.4, height: 2.4, depth: 0.2 }, material: 'bronze_trim', label: 'Altar top' },

                // -------- CHAMBER C: Saint crypt (east branch, z=-24, x=+20) --------
                // Passage
                { type: 'floor', transform: { position: [8, 0, -24], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 3, depth: 0.3 }, material: 'basalt_dark', label: 'Passage C floor' },
                { type: 'wall', transform: { position: [8, 2, -22.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Passage C N wall' },
                { type: 'wall', transform: { position: [8, 2, -25.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Passage C S wall' },
                { type: 'ceiling', transform: { position: [8, 4, -24], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 3, depth: 0.15 }, material: 'brick_aged', label: 'Passage C vault' },

                // Chamber C floor — 10×10
                { type: 'floor', transform: { position: [20, 0, -24], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 10, depth: 0.3 }, material: 'cobblestone_old', label: 'Chamber C floor' },
                // Chamber C walls
                { type: 'wall', transform: { position: [20, 2, -29], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber C N wall' },
                { type: 'wall', transform: { position: [20, 2, -19], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber C S wall' },
                { type: 'wall', transform: { position: [25, 2, -24], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber C E wall' },
                { type: 'wall', transform: { position: [15, 2, -27], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber C W wall N' },
                { type: 'wall', transform: { position: [15, 2, -21], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber C W wall S' },
                // Chamber C ceiling
                { type: 'ceiling', transform: { position: [20, 4, -24], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 10, height: 10, depth: 0.15 }, material: 'brick_aged', label: 'Chamber C vault' },

                // Saint sarcophagus (box composition — elaborate)
                { type: 'floor', transform: { position: [20, 0.4, -24], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.8, height: 4.0, depth: 0.8 }, material: 'travertine_stone', label: 'Saint sarcophagus base' },
                { type: 'floor', transform: { position: [20, 1.0, -24], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.4, height: 3.6, depth: 0.4 }, material: 'travertine_stone', label: 'Saint sarcophagus body' },
                { type: 'floor', transform: { position: [20, 1.5, -24], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.6, height: 3.8, depth: 0.3 }, material: 'oak_beam_dark', label: 'Saint sarcophagus lid' },
                { type: 'floor', transform: { position: [20, 1.8, -24], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.6, height: 2.8, depth: 0.15 }, material: 'bronze_trim', label: 'Saint sarcophagus crown' },

                // -------- CHAMBER B: Ossuary (south-west branch, off corridor at z=+10) --------
                // Passage
                { type: 'floor', transform: { position: [-8, 0, 10], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 3, depth: 0.3 }, material: 'basalt_dark', label: 'Passage B floor' },
                { type: 'wall', transform: { position: [-8, 1.75, 11.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 3.5, depth: 0.3 }, material: 'sandstone_wall', label: 'Passage B N wall' },
                { type: 'wall', transform: { position: [-8, 1.75, 8.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 3.5, depth: 0.3 }, material: 'sandstone_wall', label: 'Passage B S wall' },
                { type: 'ceiling', transform: { position: [-8, 3.5, 10], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 3, depth: 0.15 }, material: 'brick_aged', label: 'Passage B vault' },

                // Chamber B (ossuary) floor — 8×12 (low ceiling 3.5m for oppression)
                { type: 'floor', transform: { position: [-20, 0, 10], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 12, depth: 0.3 }, material: 'basalt_dark', label: 'Chamber B floor' },
                // Walls
                { type: 'wall', transform: { position: [-20, 1.75, 16], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 3.5, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber B S wall' },
                { type: 'wall', transform: { position: [-20, 1.75, 4], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 3.5, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber B N wall' },
                { type: 'wall', transform: { position: [-24, 1.75, 10], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 12, height: 3.5, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber B W wall' },
                { type: 'wall', transform: { position: [-16, 1.75, 14], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 3.5, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber B E wall S' },
                { type: 'wall', transform: { position: [-16, 1.75, 6], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 3.5, depth: 0.3 }, material: 'sandstone_wall', label: 'Chamber B E wall N' },
                // Low ceiling
                { type: 'ceiling', transform: { position: [-20, 3.5, 10], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 12, depth: 0.15 }, material: 'brick_aged', label: 'Chamber B vault' },

                // Ossuary central mass — large stone block
                { type: 'floor', transform: { position: [-20, 0.5, 10], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.4, height: 3.6, depth: 1.0 }, material: 'travertine_stone', label: 'Ossuary central block' },

                // -------- ENTRANCE CHAMBER (south end z=+30..+35) --------
                // The main corridor floor ends at +30. Entry room extends +30 to +38.
                { type: 'floor', transform: { position: [0, 0, 34], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 8, depth: 0.3 }, material: 'cobblestone_old', label: 'Entrance floor' },
                // Entry walls
                { type: 'wall', transform: { position: [-4, 2, 34], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Entry W wall' },
                { type: 'wall', transform: { position: [4, 2, 34], rotation: [0, 90, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Entry E wall' },
                // South wall (where the stairs descend — with door)
                { type: 'wall', transform: { position: [0, 2, 38], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Entry S wall' },
                // Connector wall pieces between entry and corridor (north side of entry, flanking opening)
                { type: 'wall', transform: { position: [-3, 2, 30], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Entry N wall W' },
                { type: 'wall', transform: { position: [3, 2, 30], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2, height: 4, depth: 0.3 }, material: 'sandstone_wall', label: 'Entry N wall E' },
                // Entry ceiling
                { type: 'ceiling', transform: { position: [0, 4, 34], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 8, depth: 0.15 }, material: 'brick_aged', label: 'Entry vault' },
            ],
            // ============================================================
            // PROPS
            // ============================================================
            props: [
                // ---- Main corridor: wall lanterns flanking corridor every ~8m ----
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-1.8, 2.2, -28], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Torch W1' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [1.8, 2.2, -28], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Torch E1' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-1.8, 2.2, -18], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Torch W2' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [1.8, 2.2, -10], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Torch E2' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-1.8, 2.2, -2], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Torch W3' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [1.8, 2.2, 6], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Torch E3' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-1.8, 2.2, 14], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Torch W4' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [1.8, 2.2, 22], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Torch E4' },

                // ---- Corridor columns (mini_dungeon column) along walls ----
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-1.8, 0, -26], rotation: [0, 0, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Column W1' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [1.8, 0, -26], rotation: [0, 0, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Column E1' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-1.8, 0, -10], rotation: [0, 0, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Column W2' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [1.8, 0, -10], rotation: [0, 0, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Column E2' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-1.8, 0, 12], rotation: [0, 0, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Column W3' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [1.8, 0, 12], rotation: [0, 0, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Column E3' },

                // ---- Chamber A: altar chamber — ring of columns + brazier on altar ----
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-23, 0, -21], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar column NW' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-17, 0, -21], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar column NE' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-23, 0, -27], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar column SW' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-17, 0, -27], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar column SE' },
                // Brazier on top of altar
                { glb: 'assets/props/kenney/survival_kit/campfire-stand.glb',
                  transform: { position: [-20, 1.2, -24], rotation: [0, 0, 0], scale: [1.3, 1.3, 1.3] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar brazier' },
                // Flanking urns (barrels as urn stand-in)
                { glb: 'assets/props/kenney/mini_dungeon/barrel.glb',
                  transform: { position: [-22.5, 0, -22.5], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar urn NW' },
                { glb: 'assets/props/kenney/mini_dungeon/barrel.glb',
                  transform: { position: [-17.5, 0, -22.5], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar urn NE' },
                { glb: 'assets/props/kenney/mini_dungeon/barrel.glb',
                  transform: { position: [-22.5, 0, -25.5], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar urn SW' },
                { glb: 'assets/props/kenney/mini_dungeon/barrel.glb',
                  transform: { position: [-17.5, 0, -25.5], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar urn SE' },

                // ---- Chamber B: ossuary — crates/chests along walls (skull pile stand-ins) ----
                { glb: 'assets/props/kenney/mini_dungeon/chest.glb',
                  transform: { position: [-23, 0, 6], rotation: [0, 45, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Ossuary chest W1' },
                { glb: 'assets/props/kenney/mini_dungeon/chest.glb',
                  transform: { position: [-23, 0, 10], rotation: [0, 90, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Ossuary chest W2' },
                { glb: 'assets/props/kenney/mini_dungeon/chest.glb',
                  transform: { position: [-23, 0, 14], rotation: [0, 135, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Ossuary chest W3' },
                { glb: 'assets/props/kenney/pirate_kit/crate.glb',
                  transform: { position: [-17, 0, 6], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Ossuary crate E1' },
                { glb: 'assets/props/kenney/pirate_kit/crate.glb',
                  transform: { position: [-17, 0.6, 6], rotation: [0, 30, 0], scale: [0.8, 0.8, 0.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Ossuary crate E1 stack' },
                { glb: 'assets/props/kenney/pirate_kit/crate.glb',
                  transform: { position: [-17, 0, 14], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Ossuary crate E2' },
                { glb: 'assets/props/kenney/mini_dungeon/barrel.glb',
                  transform: { position: [-20, 0, 14.5], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Ossuary barrel N' },
                { glb: 'assets/props/kenney/mini_dungeon/barrel.glb',
                  transform: { position: [-20, 0, 5.5], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Ossuary barrel S' },
                // Ossuary lanterns
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-23.5, 2.0, 10], rotation: [0, 90, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Ossuary lantern W' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-16.5, 2.0, 10], rotation: [0, -90, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Ossuary lantern E' },

                // ---- Chamber C: saint crypt — candles, hanging lantern, wall inscriptions ----
                { glb: 'assets/props/kenney/holiday_kit/hanukkah-menorah-candles.glb',
                  transform: { position: [18, 1.7, -24], rotation: [0, 0, 0], scale: [0.9, 0.9, 0.9] },
                  cast_shadow: true, receive_shadow: true, label: 'Saint candles NW' },
                { glb: 'assets/props/kenney/holiday_kit/hanukkah-menorah-candles.glb',
                  transform: { position: [22, 1.7, -24], rotation: [0, 180, 0], scale: [0.9, 0.9, 0.9] },
                  cast_shadow: true, receive_shadow: true, label: 'Saint candles NE' },
                { glb: 'assets/props/kenney/holiday_kit/kwanzaa-kinara.glb',
                  transform: { position: [18, 0, -21], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Saint kinara SW' },
                { glb: 'assets/props/kenney/holiday_kit/kwanzaa-kinara.glb',
                  transform: { position: [22, 0, -27], rotation: [0, 180, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Saint kinara SE' },
                { glb: 'assets/props/kenney/holiday_kit/lantern-hanging.glb',
                  transform: { position: [20, 3.6, -24], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Saint hanging lantern' },
                // Corner columns for crypt
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [16.5, 0, -20.5], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Crypt column NW' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [23.5, 0, -20.5], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Crypt column NE' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [16.5, 0, -27.5], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Crypt column SW' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [23.5, 0, -27.5], rotation: [0, 0, 0], scale: [1.8, 1.8, 1.8] },
                  cast_shadow: true, receive_shadow: true, label: 'Crypt column SE' },

                // ---- Entrance room ----
                // Wooden door (south wall)
                { glb: 'assets/props/kenney/castle_kit/door.glb',
                  transform: { position: [0, 0, 37.8], rotation: [0, 0, 0], scale: [1.3, 1.3, 1.3] },
                  cast_shadow: true, receive_shadow: true, label: 'Entrance door' },
                // Descending stairs (inside entry — visual flavor)
                { glb: 'assets/props/kenney/castle_kit/stairs-stone.glb',
                  transform: { position: [0, 0, 35], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Entrance stairs' },
                // Flanking lanterns
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-3.8, 2.2, 34], rotation: [0, 90, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Entry lantern W' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [3.8, 2.2, 34], rotation: [0, -90, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Entry lantern E' },
                // Barrel + chest near entrance
                { glb: 'assets/props/kenney/mini_dungeon/barrel.glb',
                  transform: { position: [-3, 0, 36], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Entry barrel' },
                { glb: 'assets/props/kenney/mini_dungeon/chest.glb',
                  transform: { position: [3, 0, 36], rotation: [0, -45, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Entry chest' },

                // ---- Gates at chamber passage openings ----
                { glb: 'assets/props/kenney/modular_dungeon_kit/gate-metal-bars.glb',
                  transform: { position: [-3, 0, -24], rotation: [0, 90, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Chamber A gate' },
                { glb: 'assets/props/kenney/modular_dungeon_kit/gate-metal-bars.glb',
                  transform: { position: [3, 0, -24], rotation: [0, -90, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Chamber C gate' },
                { glb: 'assets/props/kenney/modular_dungeon_kit/gate.glb',
                  transform: { position: [-3, 0, 10], rotation: [0, 90, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Chamber B gate' },

                // ---- Corridor dead end detail ----
                { glb: 'assets/props/kenney/mini_dungeon/chest.glb',
                  transform: { position: [0, 0, -29], rotation: [0, 180, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Dead-end chest' },
                { glb: 'assets/props/kenney/mini_dungeon/barrel.glb',
                  transform: { position: [-1.2, 0, -29], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Dead-end barrel' },

                // ---- Ossuary hanging lantern in passage ----
                { glb: 'assets/props/kenney/holiday_kit/lantern-hanging.glb',
                  transform: { position: [-8, 3.0, 10], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Passage B hanging lantern' },
            ],
            connectors: [],
            // ============================================================
            // LOCI — 28 total
            // ============================================================
            loci: [
                // Entrance (1-2)
                { position: [0, 1.5, 37], marker_type: 'door', label: 'Catacombs: Wooden descent door' },
                { position: [0, 1.8, 34], marker_type: 'glow', label: 'Catacombs: Entrance lantern glow' },

                // Main corridor torches — glow loci emit point lights (5)
                { position: [-1.5, 2.4, 22], marker_type: 'glow', label: 'Catacombs: Corridor torch W south' },
                { position: [1.5, 2.4, 14], marker_type: 'glow', label: 'Catacombs: Corridor torch E mid-south' },
                { position: [-1.5, 2.4, 6], marker_type: 'glow', label: 'Catacombs: Corridor torch W mid' },
                { position: [1.5, 2.4, -2], marker_type: 'glow', label: 'Catacombs: Corridor torch E mid-north' },
                { position: [-1.5, 2.4, -18], marker_type: 'glow', label: 'Catacombs: Corridor torch W deep' },
                { position: [1.5, 2.4, -26], marker_type: 'glow', label: 'Catacombs: Corridor torch E end' },

                // Sarcophagi in corridor (4)
                { position: [-2.5, 1.4, -6], marker_type: 'pedestal', label: 'Catacombs: Corridor sarcophagus W2' },
                { position: [2.5, 1.4, 2], marker_type: 'pedestal', label: 'Catacombs: Corridor sarcophagus E2' },
                { position: [-2.5, 1.4, -22], marker_type: 'pedestal', label: 'Catacombs: Corridor sarcophagus W1' },
                { position: [2.5, 1.4, -14], marker_type: 'pedestal', label: 'Catacombs: Corridor sarcophagus E1' },

                // Wall inscriptions in corridor (2)
                { position: [-1.85, 2.0, 18], marker_type: 'frame', label: 'Catacombs: Corridor inscription "Memento Mori"' },
                { position: [1.85, 2.0, -12], marker_type: 'frame', label: 'Catacombs: Corridor inscription saints list' },

                // Chamber A — altar chamber (5)
                { position: [-20, 2.0, -24], marker_type: 'glow', label: 'Catacombs: Altar brazier flame' },
                { position: [-23, 1.6, -21], marker_type: 'statue', label: 'Catacombs: Altar column NW carving' },
                { position: [-17, 1.6, -21], marker_type: 'statue', label: 'Catacombs: Altar column NE carving' },
                { position: [-22.5, 1.0, -22.5], marker_type: 'pedestal', label: 'Catacombs: Altar urn NW' },
                { position: [-17.5, 1.0, -25.5], marker_type: 'pedestal', label: 'Catacombs: Altar urn SE' },

                // Chamber B — ossuary (4)
                { position: [-23, 1.3, 6], marker_type: 'orb', label: 'Catacombs: Ossuary skull niche SW' },
                { position: [-23, 1.3, 14], marker_type: 'orb', label: 'Catacombs: Ossuary skull niche NW' },
                { position: [-17, 1.3, 6], marker_type: 'orb', label: 'Catacombs: Ossuary skull niche SE' },
                { position: [-20, 1.8, 10], marker_type: 'pedestal', label: 'Catacombs: Ossuary central block' },

                // Chamber C — saint crypt (5)
                { position: [20, 2.2, -24], marker_type: 'pedestal', label: 'Catacombs: Saint sarcophagus' },
                { position: [18, 2.1, -24], marker_type: 'glow', label: 'Catacombs: Saint candles NW' },
                { position: [22, 2.1, -24], marker_type: 'glow', label: 'Catacombs: Saint candles NE' },
                { position: [15.3, 2.2, -22], marker_type: 'frame', label: 'Catacombs: Crypt parchment west' },
                { position: [24.8, 2.2, -26], marker_type: 'frame', label: 'Catacombs: Crypt parchment east' },
            ],
        };
        return t;
    },
    _skyPalace() {
        const t = {
            meta: {
                id: 'sky_palace',
                name: 'Sky Palace',
                desc: 'Greco-Roman mountain monastery above the clouds at first light',
                spawn_point: { position: [0, 1.6, 0], rotation_y: 180 },
                scale: 1.0,
            },
            environment: {
                hdri: 'assets/hdri/kiara_1_dawn_2k.hdr',
                hdri_intensity: 0.85,
                hdri_as_background: true,
                fog: { color: 0xc8d8e8, near: 100, far: 500 },
                sun: {
                    position: [50, 80, -60],
                    intensity: 1.8,
                    color: 0xffe4c8,
                    cast_shadow: true,
                    shadow_bounds: 150,
                },
                ambient: { intensity: 0.18, color: 0xb8c8e0 },
            },
            materials: {
                marble_white: {
                    albedo: 'assets/textures/marble_white/albedo_2k.jpg',
                    normal: 'assets/textures/marble_white/normal_2k.jpg',
                    roughness: 'assets/textures/marble_white/roughness_2k.jpg',
                    ao: 'assets/textures/marble_white/ao_2k.jpg',
                    repeat: [5, 5],
                    roughness_scale: 0.9,
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
                sandstone_wall: {
                    albedo: 'assets/textures/sandstone_wall/albedo_2k.jpg',
                    normal: 'assets/textures/sandstone_wall/normal_2k.jpg',
                    roughness: 'assets/textures/sandstone_wall/roughness_2k.jpg',
                    ao: 'assets/textures/sandstone_wall/ao_2k.jpg',
                    repeat: [3, 3],
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
                    roughness_scale: 0.5,
                    metalness: 0.9,
                },
                cobblestone_old: {
                    albedo: 'assets/textures/cobblestone_old/albedo_2k.jpg',
                    normal: 'assets/textures/cobblestone_old/normal_2k.jpg',
                    roughness: 'assets/textures/cobblestone_old/roughness_2k.jpg',
                    ao: 'assets/textures/cobblestone_old/ao_2k.jpg',
                    repeat: [3, 5],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                plaster_cream: {
                    albedo: 'assets/textures/plaster_cream/albedo_2k.jpg',
                    normal: 'assets/textures/plaster_cream/normal_2k.jpg',
                    roughness: 'assets/textures/plaster_cream/roughness_2k.jpg',
                    ao: 'assets/textures/plaster_cream/ao_2k.jpg',
                    repeat: [20, 20],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
                basalt_dark: {
                    albedo: 'assets/textures/basalt_dark/albedo_2k.jpg',
                    normal: 'assets/textures/basalt_dark/normal_2k.jpg',
                    roughness: 'assets/textures/basalt_dark/roughness_2k.jpg',
                    ao: 'assets/textures/basalt_dark/ao_2k.jpg',
                    repeat: [4, 4],
                    roughness_scale: 1.0,
                    metalness: 0,
                },
            },
            surfaces: [
                // ============================================================
                // CLOUD DECK - vast white sea below everything
                // ============================================================
                { type: 'floor',
                  transform: { position: [0, -20, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 500, height: 500, depth: 0.5 },
                  material: 'plaster_cream',
                  label: 'Cloud deck sea' },

                // ============================================================
                // CENTRAL PLATFORM - 30x30 marble square
                // ============================================================
                { type: 'floor',
                  transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 30, height: 30, depth: 0.6 },
                  material: 'marble_white',
                  label: 'Central platform floor' },
                // Central platform underside (basalt)
                { type: 'floor',
                  transform: { position: [0, -0.8, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 30.4, height: 30.4, depth: 0.8 },
                  material: 'basalt_dark',
                  label: 'Central platform underside' },

                // Central platform stepped rim (one-step perimeter frame, 4 low walls)
                { type: 'wall',
                  transform: { position: [0, 0.15, 14.85], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 30, height: 0.3, depth: 0.3 },
                  material: 'travertine_stone',
                  label: 'Central rim south' },
                { type: 'wall',
                  transform: { position: [0, 0.15, -14.85], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 30, height: 0.3, depth: 0.3 },
                  material: 'travertine_stone',
                  label: 'Central rim north' },
                { type: 'wall',
                  transform: { position: [14.85, 0.15, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 30, height: 0.3, depth: 0.3 },
                  material: 'travertine_stone',
                  label: 'Central rim east' },
                { type: 'wall',
                  transform: { position: [-14.85, 0.15, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 30, height: 0.3, depth: 0.3 },
                  material: 'travertine_stone',
                  label: 'Central rim west' },

                // Central ceiling (with oculus) - built as 4 slabs framing a 4x4 opening
                // North slab
                { type: 'ceiling',
                  transform: { position: [0, 5, -11], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 30, height: 8, depth: 0.4 },
                  material: 'marble_white',
                  label: 'Central ceiling north' },
                // South slab
                { type: 'ceiling',
                  transform: { position: [0, 5, 11], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 30, height: 8, depth: 0.4 },
                  material: 'marble_white',
                  label: 'Central ceiling south' },
                // East slab (middle strip)
                { type: 'ceiling',
                  transform: { position: [11, 5, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 14, depth: 0.4 },
                  material: 'marble_white',
                  label: 'Central ceiling east' },
                // West slab (middle strip)
                { type: 'ceiling',
                  transform: { position: [-11, 5, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 8, height: 14, depth: 0.4 },
                  material: 'marble_white',
                  label: 'Central ceiling west' },
                // Oculus rim (bronze ring - 4 thin walls around the 4x4 hole)
                { type: 'wall',
                  transform: { position: [0, 5.15, 2], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 0.25, depth: 0.2 },
                  material: 'bronze_trim',
                  label: 'Oculus rim south' },
                { type: 'wall',
                  transform: { position: [0, 5.15, -2], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 0.25, depth: 0.2 },
                  material: 'bronze_trim',
                  label: 'Oculus rim north' },
                { type: 'wall',
                  transform: { position: [2, 5.15, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 0.25, depth: 0.2 },
                  material: 'bronze_trim',
                  label: 'Oculus rim east' },
                { type: 'wall',
                  transform: { position: [-2, 5.15, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 4, height: 0.25, depth: 0.2 },
                  material: 'bronze_trim',
                  label: 'Oculus rim west' },

                // ============================================================
                // CENTRAL ALTAR - composed from primitives (basalt base + marble top + bronze accent)
                // ============================================================
                // Basalt lower base
                { type: 'floor',
                  transform: { position: [0, 0.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 3.2, height: 3.2, depth: 1.0 },
                  material: 'basalt_dark',
                  label: 'Altar basalt base' },
                // Travertine mid
                { type: 'floor',
                  transform: { position: [0, 1.15, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.4, height: 2.4, depth: 0.3 },
                  material: 'travertine_stone',
                  label: 'Altar travertine mid' },
                // Marble top
                { type: 'floor',
                  transform: { position: [0, 1.55, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 2.0, height: 2.0, depth: 0.5 },
                  material: 'marble_white',
                  label: 'Altar marble top' },
                // Bronze sun disk on top
                { type: 'floor',
                  transform: { position: [0, 1.85, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 0.1 },
                  material: 'bronze_trim',
                  label: 'Altar bronze disk' },

                // ============================================================
                // NORTH PLATFORM - Observatory 15x15
                // ============================================================
                { type: 'floor',
                  transform: { position: [0, 0, -45], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15, height: 15, depth: 0.6 },
                  material: 'marble_white',
                  label: 'Observatory floor' },
                { type: 'floor',
                  transform: { position: [0, -0.8, -45], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15.3, height: 15.3, depth: 0.8 },
                  material: 'basalt_dark',
                  label: 'Observatory underside' },
                // Observatory partial shelter - open front (south-facing)
                // Back wall (north)
                { type: 'wall',
                  transform: { position: [0, 2, -51.8], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15, height: 4, depth: 0.3 },
                  material: 'sandstone_wall',
                  label: 'Observatory back wall' },
                // East side wall
                { type: 'wall',
                  transform: { position: [6.8, 2, -48], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 7, height: 4, depth: 0.3 },
                  material: 'sandstone_wall',
                  label: 'Observatory east wall' },
                // West side wall
                { type: 'wall',
                  transform: { position: [-6.8, 2, -48], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 7, height: 4, depth: 0.3 },
                  material: 'sandstone_wall',
                  label: 'Observatory west wall' },
                // Partial shelter roof (covers rear 2/3)
                { type: 'roof',
                  transform: { position: [0, 4.2, -48.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15, height: 8, depth: 0.3 },
                  material: 'oak_beam_dark',
                  label: 'Observatory roof' },

                // Telescope (composed): tripod base + angled bronze barrel
                { type: 'wall',
                  transform: { position: [0, 0.75, -44], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.15, height: 1.5, depth: 0.15 },
                  material: 'bronze_trim',
                  label: 'Telescope tripod leg A' },
                { type: 'wall',
                  transform: { position: [-0.4, 0.75, -43.7], rotation: [0, 0, 0.2], scale: [1, 1, 1] },
                  dimensions: { width: 0.12, height: 1.5, depth: 0.12 },
                  material: 'bronze_trim',
                  label: 'Telescope tripod leg B' },
                { type: 'wall',
                  transform: { position: [0.4, 0.75, -43.7], rotation: [0, 0, -0.2], scale: [1, 1, 1] },
                  dimensions: { width: 0.12, height: 1.5, depth: 0.12 },
                  material: 'bronze_trim',
                  label: 'Telescope tripod leg C' },
                // Telescope barrel (angled upward at ~30deg, pointing NE)
                { type: 'wall',
                  transform: { position: [0, 1.9, -44], rotation: [Math.PI / 6, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.35, height: 0.35, depth: 2.2 },
                  material: 'bronze_trim',
                  label: 'Telescope barrel' },

                // Observatory pedestals for instruments
                { type: 'floor',
                  transform: { position: [-4.5, 0.6, -47], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 1.2 },
                  material: 'travertine_stone',
                  label: 'Instrument pedestal A' },
                { type: 'floor',
                  transform: { position: [4.5, 0.6, -47], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.2, height: 1.2, depth: 1.2 },
                  material: 'travertine_stone',
                  label: 'Instrument pedestal B' },

                // ============================================================
                // EAST PLATFORM - Library Sanctum 15x15 (enclosed)
                // ============================================================
                { type: 'floor',
                  transform: { position: [45, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15, height: 15, depth: 0.6 },
                  material: 'marble_white',
                  label: 'Library floor' },
                { type: 'floor',
                  transform: { position: [45, -0.8, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15.3, height: 15.3, depth: 0.8 },
                  material: 'basalt_dark',
                  label: 'Library underside' },
                // Library walls (enclosed, with doorway gap on west side)
                // North wall
                { type: 'wall',
                  transform: { position: [45, 2.2, -6.8], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15, height: 4.4, depth: 0.4 },
                  material: 'sandstone_wall',
                  label: 'Library north wall' },
                // South wall
                { type: 'wall',
                  transform: { position: [45, 2.2, 6.8], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15, height: 4.4, depth: 0.4 },
                  material: 'sandstone_wall',
                  label: 'Library south wall' },
                // East wall (full)
                { type: 'wall',
                  transform: { position: [51.8, 2.2, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 14, height: 4.4, depth: 0.4 },
                  material: 'sandstone_wall',
                  label: 'Library east wall' },
                // West wall upper lintel (doorway below)
                { type: 'wall',
                  transform: { position: [38.2, 3.8, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 14, height: 1.2, depth: 0.4 },
                  material: 'sandstone_wall',
                  label: 'Library west lintel' },
                // West wall flanking panels (north of doorway)
                { type: 'wall',
                  transform: { position: [38.2, 1.6, -5.25], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 3.5, height: 3.2, depth: 0.4 },
                  material: 'sandstone_wall',
                  label: 'Library west flank N' },
                { type: 'wall',
                  transform: { position: [38.2, 1.6, 5.25], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 3.5, height: 3.2, depth: 0.4 },
                  material: 'sandstone_wall',
                  label: 'Library west flank S' },
                // Library pitched roof (two angled slabs)
                { type: 'roof',
                  transform: { position: [45, 5.2, -3.5], rotation: [Math.PI / 10, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 16, height: 8.5, depth: 0.3 },
                  material: 'oak_beam_dark',
                  label: 'Library roof north pitch' },
                { type: 'roof',
                  transform: { position: [45, 5.2, 3.5], rotation: [-Math.PI / 10, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 16, height: 8.5, depth: 0.3 },
                  material: 'oak_beam_dark',
                  label: 'Library roof south pitch' },

                // ============================================================
                // WEST PLATFORM - Bath / Meditation 15x15
                // ============================================================
                { type: 'floor',
                  transform: { position: [-45, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15, height: 15, depth: 0.6 },
                  material: 'marble_white',
                  label: 'Meditation floor' },
                { type: 'floor',
                  transform: { position: [-45, -0.8, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15.3, height: 15.3, depth: 0.8 },
                  material: 'basalt_dark',
                  label: 'Meditation underside' },
                // Central reflecting pool frame (travertine rim)
                { type: 'wall',
                  transform: { position: [-45, 0.4, -3.1], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6.4, height: 0.4, depth: 0.3 },
                  material: 'travertine_stone',
                  label: 'Pool rim north' },
                { type: 'wall',
                  transform: { position: [-45, 0.4, 3.1], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6.4, height: 0.4, depth: 0.3 },
                  material: 'travertine_stone',
                  label: 'Pool rim south' },
                { type: 'wall',
                  transform: { position: [-41.9, 0.4, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6.4, height: 0.4, depth: 0.3 },
                  material: 'travertine_stone',
                  label: 'Pool rim east' },
                { type: 'wall',
                  transform: { position: [-48.1, 0.4, 0], rotation: [0, Math.PI / 2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6.4, height: 0.4, depth: 0.3 },
                  material: 'travertine_stone',
                  label: 'Pool rim west' },
                // Water surface (bronze as reflective fake)
                { type: 'floor',
                  transform: { position: [-45, 0.35, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 6, height: 6, depth: 0.1 },
                  material: 'bronze_trim',
                  label: 'Pool water surface' },
                // Pool basin (dark basalt below water)
                { type: 'floor',
                  transform: { position: [-45, 0.1, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 5.8, height: 5.8, depth: 0.3 },
                  material: 'basalt_dark',
                  label: 'Pool basin' },

                // ============================================================
                // SOUTH PLATFORM - Garden of Peaks 15x15
                // ============================================================
                { type: 'floor',
                  transform: { position: [0, 0, 45], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15, height: 15, depth: 0.6 },
                  material: 'travertine_stone',
                  label: 'Garden floor' },
                { type: 'floor',
                  transform: { position: [0, -0.8, 45], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 15.3, height: 15.3, depth: 0.8 },
                  material: 'basalt_dark',
                  label: 'Garden underside' },
                // Crystal formation 1 (programmatic: basalt cluster base + rotated bronze octahedron shard)
                { type: 'floor',
                  transform: { position: [-4, 0.5, 41], rotation: [0, 0.4, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.6, height: 1.6, depth: 1.0 },
                  material: 'basalt_dark',
                  label: 'Crystal 1 base' },
                { type: 'wall',
                  transform: { position: [-4, 1.7, 41], rotation: [Math.PI / 4, 0.4, Math.PI / 4], scale: [1, 1, 1] },
                  dimensions: { width: 0.9, height: 0.9, depth: 0.9 },
                  material: 'bronze_trim',
                  label: 'Crystal 1 shard A' },
                { type: 'wall',
                  transform: { position: [-4.3, 2.3, 41.2], rotation: [Math.PI / 3, 0.2, Math.PI / 4], scale: [1, 1, 1] },
                  dimensions: { width: 0.6, height: 0.6, depth: 0.6 },
                  material: 'bronze_trim',
                  label: 'Crystal 1 shard B' },
                // Crystal formation 2
                { type: 'floor',
                  transform: { position: [3.5, 0.5, 46], rotation: [0, -0.3, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.8, height: 1.8, depth: 1.0 },
                  material: 'basalt_dark',
                  label: 'Crystal 2 base' },
                { type: 'wall',
                  transform: { position: [3.5, 2.0, 46], rotation: [Math.PI / 4, -0.3, Math.PI / 4], scale: [1, 1, 1] },
                  dimensions: { width: 1.1, height: 1.1, depth: 1.1 },
                  material: 'bronze_trim',
                  label: 'Crystal 2 shard A' },
                { type: 'wall',
                  transform: { position: [4.2, 2.8, 45.7], rotation: [Math.PI / 3, 0.5, Math.PI / 4], scale: [1, 1, 1] },
                  dimensions: { width: 0.7, height: 0.7, depth: 0.7 },
                  material: 'bronze_trim',
                  label: 'Crystal 2 shard B' },
                // Crystal formation 3
                { type: 'floor',
                  transform: { position: [4.5, 0.5, 41.5], rotation: [0, 0.2, 0], scale: [1, 1, 1] },
                  dimensions: { width: 1.4, height: 1.4, depth: 1.0 },
                  material: 'basalt_dark',
                  label: 'Crystal 3 base' },
                { type: 'wall',
                  transform: { position: [4.5, 1.6, 41.5], rotation: [Math.PI / 4, 0.2, Math.PI / 4], scale: [1, 1, 1] },
                  dimensions: { width: 0.8, height: 0.8, depth: 0.8 },
                  material: 'bronze_trim',
                  label: 'Crystal 3 shard A' },

                // ============================================================
                // BRIDGES - 4 stone bridges connecting central to satellites
                // ============================================================
                // North bridge (central to observatory): from z=-15 to z=-37.5, length 22.5
                { type: 'floor',
                  transform: { position: [0, 0, -26.25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 3, height: 22.5, depth: 0.4 },
                  material: 'cobblestone_old',
                  label: 'North bridge deck' },
                { type: 'wall',
                  transform: { position: [1.55, 0.35, -26.25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.2, height: 0.5, depth: 22.5 },
                  material: 'travertine_stone',
                  label: 'North bridge rail E' },
                { type: 'wall',
                  transform: { position: [-1.55, 0.35, -26.25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.2, height: 0.5, depth: 22.5 },
                  material: 'travertine_stone',
                  label: 'North bridge rail W' },
                // Bridge underside support
                { type: 'floor',
                  transform: { position: [0, -0.6, -26.25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 3.2, height: 22.5, depth: 0.5 },
                  material: 'basalt_dark',
                  label: 'North bridge support' },

                // East bridge (central to library): from x=15 to x=37.5, length 22.5
                { type: 'floor',
                  transform: { position: [26.25, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 22.5, height: 3, depth: 0.4 },
                  material: 'cobblestone_old',
                  label: 'East bridge deck' },
                { type: 'wall',
                  transform: { position: [26.25, 0.35, 1.55], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 22.5, height: 0.5, depth: 0.2 },
                  material: 'travertine_stone',
                  label: 'East bridge rail S' },
                { type: 'wall',
                  transform: { position: [26.25, 0.35, -1.55], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 22.5, height: 0.5, depth: 0.2 },
                  material: 'travertine_stone',
                  label: 'East bridge rail N' },
                { type: 'floor',
                  transform: { position: [26.25, -0.6, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 22.5, height: 3.2, depth: 0.5 },
                  material: 'basalt_dark',
                  label: 'East bridge support' },

                // West bridge (central to meditation): from x=-15 to x=-37.5
                { type: 'floor',
                  transform: { position: [-26.25, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 22.5, height: 3, depth: 0.4 },
                  material: 'cobblestone_old',
                  label: 'West bridge deck' },
                { type: 'wall',
                  transform: { position: [-26.25, 0.35, 1.55], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 22.5, height: 0.5, depth: 0.2 },
                  material: 'travertine_stone',
                  label: 'West bridge rail S' },
                { type: 'wall',
                  transform: { position: [-26.25, 0.35, -1.55], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 22.5, height: 0.5, depth: 0.2 },
                  material: 'travertine_stone',
                  label: 'West bridge rail N' },
                { type: 'floor',
                  transform: { position: [-26.25, -0.6, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 22.5, height: 3.2, depth: 0.5 },
                  material: 'basalt_dark',
                  label: 'West bridge support' },

                // South bridge (central to garden): from z=15 to z=37.5
                { type: 'floor',
                  transform: { position: [0, 0, 26.25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 3, height: 22.5, depth: 0.4 },
                  material: 'cobblestone_old',
                  label: 'South bridge deck' },
                { type: 'wall',
                  transform: { position: [1.55, 0.35, 26.25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.2, height: 0.5, depth: 22.5 },
                  material: 'travertine_stone',
                  label: 'South bridge rail E' },
                { type: 'wall',
                  transform: { position: [-1.55, 0.35, 26.25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 0.2, height: 0.5, depth: 22.5 },
                  material: 'travertine_stone',
                  label: 'South bridge rail W' },
                { type: 'floor',
                  transform: { position: [0, -0.6, 26.25], rotation: [0, 0, 0], scale: [1, 1, 1] },
                  dimensions: { width: 3.2, height: 22.5, depth: 0.5 },
                  material: 'basalt_dark',
                  label: 'South bridge support' },
            ],
            props: [
                // ============================================================
                // CENTRAL PLATFORM COLUMNS - 12 total (3 at each corner)
                // Using mini_dungeon/column.glb, scaled tall
                // ============================================================
                // NE corner cluster (3 columns)
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [13, 0, -13], rotation: [0, 0, 0], scale: [1.2, 1.8, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Col NE-a' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [11, 0, -13], rotation: [0, 0, 0], scale: [1.2, 1.8, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Col NE-b' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [13, 0, -11], rotation: [0, 0, 0], scale: [1.2, 1.8, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Col NE-c' },
                // NW corner
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-13, 0, -13], rotation: [0, 0, 0], scale: [1.2, 1.8, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Col NW-a' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-11, 0, -13], rotation: [0, 0, 0], scale: [1.2, 1.8, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Col NW-b' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-13, 0, -11], rotation: [0, 0, 0], scale: [1.2, 1.8, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Col NW-c' },
                // SE corner
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [13, 0, 13], rotation: [0, 0, 0], scale: [1.2, 1.8, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Col SE-a' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [11, 0, 13], rotation: [0, 0, 0], scale: [1.2, 1.8, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Col SE-b' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [13, 0, 11], rotation: [0, 0, 0], scale: [1.2, 1.8, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Col SE-c' },
                // SW corner
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-13, 0, 13], rotation: [0, 0, 0], scale: [1.2, 1.8, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Col SW-a' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-11, 0, 13], rotation: [0, 0, 0], scale: [1.2, 1.8, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Col SW-b' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-13, 0, 11], rotation: [0, 0, 0], scale: [1.2, 1.8, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Col SW-c' },

                // Altar flanking lanterns
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-2.5, 0, 0], rotation: [0, 0, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar lantern W' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [2.5, 0, 0], rotation: [0, 0, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Altar lantern E' },

                // Central platform stair to south bridge (entry approach)
                { glb: 'assets/props/kenney/castle_kit/stairs-stone.glb',
                  transform: { position: [0, 0, 15.5], rotation: [0, Math.PI, 0], scale: [1.5, 1, 1] },
                  cast_shadow: true, receive_shadow: true, label: 'Central south stair' },
                { glb: 'assets/props/kenney/castle_kit/stairs-stone.glb',
                  transform: { position: [0, 0, -15.5], rotation: [0, 0, 0], scale: [1.5, 1, 1] },
                  cast_shadow: true, receive_shadow: true, label: 'Central north stair' },
                { glb: 'assets/props/kenney/castle_kit/stairs-stone.glb',
                  transform: { position: [15.5, 0, 0], rotation: [0, -Math.PI / 2, 0], scale: [1.5, 1, 1] },
                  cast_shadow: true, receive_shadow: true, label: 'Central east stair' },
                { glb: 'assets/props/kenney/castle_kit/stairs-stone.glb',
                  transform: { position: [-15.5, 0, 0], rotation: [0, Math.PI / 2, 0], scale: [1.5, 1, 1] },
                  cast_shadow: true, receive_shadow: true, label: 'Central west stair' },

                // ============================================================
                // OBSERVATORY PROPS
                // ============================================================
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',
                  transform: { position: [-4.5, 0, -49], rotation: [0, Math.PI / 2, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Observatory desk W' },
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',
                  transform: { position: [4.5, 0, -49], rotation: [0, -Math.PI / 2, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Observatory desk E' },
                { glb: 'assets/props/kenney/furniture_kit/chair.glb',
                  transform: { position: [-3.2, 0, -49], rotation: [0, -Math.PI / 2, 0], scale: [1.1, 1.1, 1.1] },
                  cast_shadow: true, receive_shadow: true, label: 'Observatory chair W' },
                { glb: 'assets/props/kenney/furniture_kit/chair.glb',
                  transform: { position: [3.2, 0, -49], rotation: [0, Math.PI / 2, 0], scale: [1.1, 1.1, 1.1] },
                  cast_shadow: true, receive_shadow: true, label: 'Observatory chair E' },
                { glb: 'assets/props/kenney/holiday_kit/lantern-hanging.glb',
                  transform: { position: [0, 3.8, -48], rotation: [0, 0, 0], scale: [1.3, 1.3, 1.3] },
                  cast_shadow: true, receive_shadow: true, label: 'Observatory hanging lantern' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [-6, 0, -51], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Observatory lantern W' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [6, 0, -51], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Observatory lantern E' },

                // ============================================================
                // LIBRARY SANCTUM PROPS
                // ============================================================
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb',
                  transform: { position: [51, 0, -5], rotation: [0, -Math.PI / 2, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Library bookcase NE' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',
                  transform: { position: [51, 0, -1.5], rotation: [0, -Math.PI / 2, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Library bookcase E-mid' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb',
                  transform: { position: [51, 0, 2], rotation: [0, -Math.PI / 2, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Library bookcase E-S' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',
                  transform: { position: [51, 0, 5.5], rotation: [0, -Math.PI / 2, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Library bookcase SE' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb',
                  transform: { position: [42, 0, -6], rotation: [0, 0, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Library bookcase N-W' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseClosed.glb',
                  transform: { position: [45.5, 0, -6], rotation: [0, 0, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Library bookcase N-E' },
                { glb: 'assets/props/kenney/furniture_kit/benchCushion.glb',
                  transform: { position: [44, 0, 0], rotation: [0, Math.PI / 2, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Library reading bench' },
                { glb: 'assets/props/kenney/holiday_kit/lantern-hanging.glb',
                  transform: { position: [45, 4.5, 0], rotation: [0, 0, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Library hanging lantern' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: { position: [41, 0, 5.5], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Library floor lantern' },

                // ============================================================
                // MEDITATION / BATH PROPS
                // ============================================================
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: { position: [-45, 0, -5], rotation: [0, 0, 0], scale: [1.3, 1.3, 1.3] },
                  cast_shadow: true, receive_shadow: true, label: 'Meditation bench N' },
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: { position: [-45, 0, 5], rotation: [0, Math.PI, 0], scale: [1.3, 1.3, 1.3] },
                  cast_shadow: true, receive_shadow: true, label: 'Meditation bench S' },
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: { position: [-40, 0, 0], rotation: [0, -Math.PI / 2, 0], scale: [1.3, 1.3, 1.3] },
                  cast_shadow: true, receive_shadow: true, label: 'Meditation bench E' },
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: { position: [-50, 0, 0], rotation: [0, Math.PI / 2, 0], scale: [1.3, 1.3, 1.3] },
                  cast_shadow: true, receive_shadow: true, label: 'Meditation bench W' },
                // Corner columns (low marker columns at meditation platform corners)
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-51, 0, -6.5], rotation: [0, 0, 0], scale: [0.9, 1.2, 0.9] },
                  cast_shadow: true, receive_shadow: true, label: 'Meditation col NW' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-39, 0, -6.5], rotation: [0, 0, 0], scale: [0.9, 1.2, 0.9] },
                  cast_shadow: true, receive_shadow: true, label: 'Meditation col NE' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-51, 0, 6.5], rotation: [0, 0, 0], scale: [0.9, 1.2, 0.9] },
                  cast_shadow: true, receive_shadow: true, label: 'Meditation col SW' },
                { glb: 'assets/props/kenney/mini_dungeon/column.glb',
                  transform: { position: [-39, 0, 6.5], rotation: [0, 0, 0], scale: [0.9, 1.2, 0.9] },
                  cast_shadow: true, receive_shadow: true, label: 'Meditation col SE' },

                // ============================================================
                // GARDEN OF PEAKS PROPS
                // ============================================================
                { glb: 'assets/props/kenney/nature_kit/rock_largeA.glb',
                  transform: { position: [-2, 0, 48], rotation: [0, 0.8, 0], scale: [1.5, 1.5, 1.5] },
                  cast_shadow: true, receive_shadow: true, label: 'Garden rock A' },
                { glb: 'assets/props/kenney/nature_kit/rock_largeB.glb',
                  transform: { position: [2, 0, 49], rotation: [0, 1.5, 0], scale: [1.4, 1.4, 1.4] },
                  cast_shadow: true, receive_shadow: true, label: 'Garden rock B' },
                { glb: 'assets/props/kenney/nature_kit/rock_largeC.glb',
                  transform: { position: [-5, 0, 44], rotation: [0, -0.5, 0], scale: [1.3, 1.3, 1.3] },
                  cast_shadow: true, receive_shadow: true, label: 'Garden rock C' },
                { glb: 'assets/props/kenney/nature_kit/stone_tallA.glb',
                  transform: { position: [5, 0, 43], rotation: [0, 0.3, 0], scale: [1.2, 1.4, 1.2] },
                  cast_shadow: true, receive_shadow: true, label: 'Garden tall stone A' },
                { glb: 'assets/props/kenney/nature_kit/stone_tallB.glb',
                  transform: { position: [-1, 0, 43], rotation: [0, -1.2, 0], scale: [1.1, 1.3, 1.1] },
                  cast_shadow: true, receive_shadow: true, label: 'Garden tall stone B' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushLarge.glb',
                  transform: { position: [-6, 0, 46], rotation: [0, 0.2, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Garden bush NW' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushLarge.glb',
                  transform: { position: [6, 0, 48], rotation: [0, 1.0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Garden bush SE' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushSmall.glb',
                  transform: { position: [0, 0, 49], rotation: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
                  cast_shadow: true, receive_shadow: true, label: 'Garden bush small' },
                { glb: 'assets/props/kenney/nature_kit/flower_yellowA.glb',
                  transform: { position: [-3, 0, 47], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: false, receive_shadow: true, label: 'Garden flower A' },
                { glb: 'assets/props/kenney/nature_kit/flower_yellowB.glb',
                  transform: { position: [2, 0, 44], rotation: [0, 0.4, 0], scale: [1.2, 1.2, 1.2] },
                  cast_shadow: false, receive_shadow: true, label: 'Garden flower B' },

                // ============================================================
                // DISTANT MOUNTAIN PEAKS (around perimeter at y=-15)
                // ============================================================
                { glb: 'assets/props/kenney/nature_kit/cliff_large_rock.glb',
                  transform: { position: [140, -15, -80], rotation: [0, 0.8, 0], scale: [12, 18, 12] },
                  cast_shadow: true, receive_shadow: false, label: 'Peak NE' },
                { glb: 'assets/props/kenney/nature_kit/cliff_large_rock.glb',
                  transform: { position: [-140, -15, -80], rotation: [0, -0.6, 0], scale: [14, 20, 14] },
                  cast_shadow: true, receive_shadow: false, label: 'Peak NW' },
                { glb: 'assets/props/kenney/nature_kit/cliff_large_rock.glb',
                  transform: { position: [120, -15, 100], rotation: [0, 1.2, 0], scale: [10, 16, 10] },
                  cast_shadow: true, receive_shadow: false, label: 'Peak SE' },
                { glb: 'assets/props/kenney/nature_kit/cliff_large_rock.glb',
                  transform: { position: [-130, -15, 90], rotation: [0, -1.0, 0], scale: [11, 17, 11] },
                  cast_shadow: true, receive_shadow: false, label: 'Peak SW' },
                { glb: 'assets/props/kenney/nature_kit/cliff_large_rock.glb',
                  transform: { position: [0, -15, -160], rotation: [0, 0.3, 0], scale: [16, 22, 16] },
                  cast_shadow: true, receive_shadow: false, label: 'Peak N-far' },
                { glb: 'assets/props/kenney/nature_kit/cliff_large_rock.glb',
                  transform: { position: [170, -15, 10], rotation: [0, -0.4, 0], scale: [13, 19, 13] },
                  cast_shadow: true, receive_shadow: false, label: 'Peak E-far' },
                { glb: 'assets/props/kenney/nature_kit/cliff_large_rock.glb',
                  transform: { position: [-170, -15, -10], rotation: [0, 1.1, 0], scale: [14, 20, 14] },
                  cast_shadow: true, receive_shadow: false, label: 'Peak W-far' },
                { glb: 'assets/props/kenney/nature_kit/cliff_large_rock.glb',
                  transform: { position: [30, -15, 170], rotation: [0, 0.7, 0], scale: [12, 17, 12] },
                  cast_shadow: true, receive_shadow: false, label: 'Peak S-far' },
                { glb: 'assets/props/kenney/nature_kit/cliff_large_rock.glb',
                  transform: { position: [-80, -15, 150], rotation: [0, -0.9, 0], scale: [10, 15, 10] },
                  cast_shadow: true, receive_shadow: false, label: 'Peak SSW' },
                { glb: 'assets/props/kenney/nature_kit/cliff_large_rock.glb',
                  transform: { position: [85, -15, -140], rotation: [0, 0.5, 0], scale: [11, 16, 11] },
                  cast_shadow: true, receive_shadow: false, label: 'Peak NNE' },
            ],
            connectors: [],
            loci: [
                // CENTRAL PLATFORM (6)
                { position: [0, 2.4, 0], marker_type: 'glow', label: 'Central: altar of first light' },
                { position: [0, 5.5, 0], marker_type: 'glow', label: 'Central: oculus of dawn' },
                { position: [12, 3, -12], marker_type: 'orb', label: 'Central: NE column cluster' },
                { position: [-12, 3, -12], marker_type: 'orb', label: 'Central: NW column cluster' },
                { position: [12, 3, 12], marker_type: 'orb', label: 'Central: SE column cluster' },
                { position: [-12, 3, 12], marker_type: 'orb', label: 'Central: SW column cluster' },

                // OBSERVATORY (5)
                { position: [0, 2, -44], marker_type: 'pedestal', label: 'Observatory: bronze telescope' },
                { position: [-4.5, 1.6, -47], marker_type: 'pedestal', label: 'Observatory: astrolabe pedestal' },
                { position: [4.5, 1.6, -47], marker_type: 'pedestal', label: 'Observatory: armillary pedestal' },
                { position: [-6, 2.5, -51.5], marker_type: 'frame', label: 'Observatory: west star chart' },
                { position: [6, 2.5, -51.5], marker_type: 'frame', label: 'Observatory: east star chart' },

                // LIBRARY SANCTUM (5)
                { position: [51, 2, -5], marker_type: 'orb', label: 'Library: NE shelf of treatises' },
                { position: [51, 2, 1.5], marker_type: 'orb', label: 'Library: E shelf of codices' },
                { position: [43.5, 2, -6], marker_type: 'orb', label: 'Library: N shelf of scrolls' },
                { position: [44, 1.2, 0], marker_type: 'pedestal', label: 'Library: reading bench' },
                { position: [45, 4.3, 0], marker_type: 'glow', label: 'Library: hanging lantern' },

                // MEDITATION / BATH (5)
                { position: [-45, 0.8, 0], marker_type: 'glow', label: 'Meditation: reflecting pool' },
                { position: [-45, 1.0, -5], marker_type: 'pedestal', label: 'Meditation: north bench' },
                { position: [-45, 1.0, 5], marker_type: 'pedestal', label: 'Meditation: south bench' },
                { position: [-40, 1.0, 0], marker_type: 'pedestal', label: 'Meditation: east bench' },
                { position: [-50, 1.0, 0], marker_type: 'pedestal', label: 'Meditation: west bench' },

                // GARDEN OF PEAKS (4)
                { position: [-4, 2.5, 41], marker_type: 'statue', label: 'Garden: obsidian shard cluster I' },
                { position: [3.5, 2.8, 46], marker_type: 'statue', label: 'Garden: obsidian shard cluster II' },
                { position: [4.5, 2.2, 41.5], marker_type: 'statue', label: 'Garden: obsidian shard cluster III' },
                { position: [-5, 1.2, 44], marker_type: 'orb', label: 'Garden: weathered peak stone' },

                // BRIDGES (3 midpoints - enough to punctuate the walk without crowding)
                { position: [0, 1.2, -26], marker_type: 'orb', label: 'North bridge midpoint' },
                { position: [26, 1.2, 0], marker_type: 'orb', label: 'East bridge midpoint' },
                { position: [-26, 1.2, 0], marker_type: 'orb', label: 'West bridge midpoint' },
            ],
        };
        return t;
    }

    };

    RC.PalaceTemplates = PT;
})();
