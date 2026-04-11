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
                desc: 'Sun-drenched Mediterranean villa urbana with peristyle courtyard, triclinium, bath, and cypress garden',
                spawn_point: { position: [0, 1.6, 45], rotation_y: 180 },
                scale: 1.0,
            },
            environment: {
                hdri: 'assets/hdri/circus_maximus_2_2k.hdr',
                hdri_intensity: 1.1,
                hdri_as_background: true,
                fog: { color: 0xd4c8a8, near: 150, far: 400 },
                sun: { position: [80, 120, 40], intensity: 2.8, color: 0xffeedd, cast_shadow: true, shadow_bounds: 100 },
                ambient: { intensity: 0.15 },
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
                    roughness_scale: 0.9,
                    metalness: 0,
                },
                grass_field: {
                    albedo: 'assets/textures/grass_field/albedo_2k.jpg',
                    normal: 'assets/textures/grass_field/normal_2k.jpg',
                    roughness: 'assets/textures/grass_field/roughness_2k.jpg',
                    ao: 'assets/textures/grass_field/ao_2k.jpg',
                    repeat: [10, 10],
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
                },
            },
            surfaces: [
                // ============================================================
                // PERISTYLE COURTYARD (center, open-air, 20m x 20m)
                // Courtyard floor
                { type: 'floor', transform: {position:[0,0,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:22, height:22, depth:0.3}, material: 'marble_white', label: 'Peristyle courtyard floor' },
                // Courtyard low perimeter walls (stylobate) — thin strips around edges, knee-high
                { type: 'wall', transform: {position:[0,0.5,11.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:22, height:1, depth:0.3}, material: 'travertine_stone', label: 'Courtyard south stylobate' },
                { type: 'wall', transform: {position:[0,0.5,-11.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:22, height:1, depth:0.3}, material: 'travertine_stone', label: 'Courtyard north stylobate' },
                { type: 'wall', transform: {position:[11.1,0.5,0], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:22, height:1, depth:0.3}, material: 'travertine_stone', label: 'Courtyard east stylobate' },
                { type: 'wall', transform: {position:[-11.1,0.5,0], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:22, height:1, depth:0.3}, material: 'travertine_stone', label: 'Courtyard west stylobate' },

                // ---- FOUNTAIN (programmatic) at courtyard center ----
                // Outer basin — wide shallow disc
                { type: 'floor', transform: {position:[0,0.2,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:5, height:5, depth:0.4}, material: 'travertine_stone', label: 'Fountain outer basin' },
                // Water disc (bronze_trim as fake water)
                { type: 'floor', transform: {position:[0,0.42,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:4.6, height:4.6, depth:0.05}, material: 'bronze_trim', label: 'Fountain water surface' },
                // Inner basin rim
                { type: 'floor', transform: {position:[0,0.6,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:2.2, height:2.2, depth:0.35}, material: 'marble_white', label: 'Fountain inner basin' },
                // Central column
                { type: 'wall', transform: {position:[0,1.4,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:0.5, height:2.2, depth:0.5}, material: 'marble_white', label: 'Fountain column' },
                // Top disk
                { type: 'floor', transform: {position:[0,2.6,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:1.4, height:1.4, depth:0.2}, material: 'bronze_trim', label: 'Fountain top disc' },

                // ============================================================
                // ATRIUM (south side, entry hall, 20m x 14m)
                { type: 'floor', transform: {position:[0,0,20], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:20, height:14, depth:0.3}, material: 'marble_white', label: 'Atrium floor' },
                // Atrium north wall (separates atrium from courtyard, has central doorway — model as two wall segments)
                { type: 'wall', transform: {position:[-7,2.5,13.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:6, height:5, depth:0.3}, material: 'plaster_cream', label: 'Atrium north wall (west)' },
                { type: 'wall', transform: {position:[7,2.5,13.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:6, height:5, depth:0.3}, material: 'plaster_cream', label: 'Atrium north wall (east)' },
                // Atrium south wall (with doorway split) — faces garden
                { type: 'wall', transform: {position:[-7,2.5,27], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:6, height:5, depth:0.3}, material: 'travertine_stone', label: 'Atrium south wall (west)' },
                { type: 'wall', transform: {position:[7,2.5,27], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:6, height:5, depth:0.3}, material: 'travertine_stone', label: 'Atrium south wall (east)' },
                // Atrium east and west walls
                { type: 'wall', transform: {position:[10.1,2.5,20], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'plaster_cream', label: 'Atrium east wall' },
                { type: 'wall', transform: {position:[-10.1,2.5,20], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'plaster_cream', label: 'Atrium west wall' },
                // Atrium ceiling (with central opening — compluvium — model with two plates)
                { type: 'ceiling', transform: {position:[-6,5,20], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:8, height:14, depth:0.15}, material: 'oak_beam_dark', label: 'Atrium ceiling west' },
                { type: 'ceiling', transform: {position:[6,5,20], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:8, height:14, depth:0.15}, material: 'oak_beam_dark', label: 'Atrium ceiling east' },
                // Atrium roof (terracotta, slight pitch)
                { type: 'roof', transform: {position:[0,5.6,20], rotation:[0.05,0,0], scale:[1,1,1]},
                  dimensions: {width:21, height:15, depth:0.2}, material: 'terracotta_tile', label: 'Atrium roof' },

                // ============================================================
                // TRICLINIUM (east side dining room, 16m x 16m)
                { type: 'floor', transform: {position:[22,0,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:16, height:16, depth:0.3}, material: 'oak_plank_warm', label: 'Triclinium floor' },
                // Triclinium west wall (separates from courtyard) — has doorway
                { type: 'wall', transform: {position:[14.1,2.5,-5], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:6, height:5, depth:0.3}, material: 'plaster_cream', label: 'Triclinium west wall (north)' },
                { type: 'wall', transform: {position:[14.1,2.5,5], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:6, height:5, depth:0.3}, material: 'plaster_cream', label: 'Triclinium west wall (south)' },
                // Triclinium east wall (exterior)
                { type: 'wall', transform: {position:[30.1,2.5,0], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:16, height:5, depth:0.3}, material: 'travertine_stone', label: 'Triclinium east wall' },
                // Triclinium north and south walls
                { type: 'wall', transform: {position:[22,2.5,-8.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:16, height:5, depth:0.3}, material: 'plaster_cream', label: 'Triclinium north wall' },
                { type: 'wall', transform: {position:[22,2.5,8.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:16, height:5, depth:0.3}, material: 'plaster_cream', label: 'Triclinium south wall' },
                // Triclinium ceiling
                { type: 'ceiling', transform: {position:[22,5,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:16, height:16, depth:0.15}, material: 'oak_beam_dark', label: 'Triclinium ceiling beams' },
                // Triclinium roof
                { type: 'roof', transform: {position:[22,5.6,0], rotation:[0,0,0.05], scale:[1,1,1]},
                  dimensions: {width:17, height:17, depth:0.2}, material: 'terracotta_tile', label: 'Triclinium roof' },

                // ============================================================
                // CUBICULUM (bedroom, west-north, 12m x 12m)
                { type: 'floor', transform: {position:[-20,0,-8], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:12, height:12, depth:0.3}, material: 'oak_plank_warm', label: 'Cubiculum floor' },
                // Walls
                { type: 'wall', transform: {position:[-14.1,2.5,-8], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Cubiculum east wall' },
                { type: 'wall', transform: {position:[-26.1,2.5,-8], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'travertine_stone', label: 'Cubiculum west wall' },
                { type: 'wall', transform: {position:[-20,2.5,-14.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Cubiculum north wall' },
                { type: 'wall', transform: {position:[-20,2.5,-1.9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:12, height:5, depth:0.3}, material: 'plaster_cream', label: 'Cubiculum south wall' },
                { type: 'ceiling', transform: {position:[-20,5,-8], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:12, height:12, depth:0.15}, material: 'oak_beam_dark', label: 'Cubiculum ceiling' },
                { type: 'roof', transform: {position:[-20,5.6,-8], rotation:[0,0,-0.05], scale:[1,1,1]},
                  dimensions: {width:13, height:13, depth:0.2}, material: 'terracotta_tile', label: 'Cubiculum roof' },

                // ============================================================
                // TABLINUM (study/office, north side, 16m x 10m)
                { type: 'floor', transform: {position:[0,0,-18], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:16, height:10, depth:0.3}, material: 'oak_plank_warm', label: 'Tablinum floor' },
                // Tablinum south wall (separates from courtyard) — doorway in middle
                { type: 'wall', transform: {position:[-5.5,2.5,-13.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:5, height:5, depth:0.3}, material: 'plaster_cream', label: 'Tablinum south wall (west)' },
                { type: 'wall', transform: {position:[5.5,2.5,-13.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:5, height:5, depth:0.3}, material: 'plaster_cream', label: 'Tablinum south wall (east)' },
                { type: 'wall', transform: {position:[0,2.5,-23.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:16, height:5, depth:0.3}, material: 'travertine_stone', label: 'Tablinum north wall' },
                { type: 'wall', transform: {position:[8.1,2.5,-18], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:10, height:5, depth:0.3}, material: 'plaster_cream', label: 'Tablinum east wall' },
                { type: 'wall', transform: {position:[-8.1,2.5,-18], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:10, height:5, depth:0.3}, material: 'plaster_cream', label: 'Tablinum west wall' },
                { type: 'ceiling', transform: {position:[0,5,-18], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:16, height:10, depth:0.15}, material: 'oak_beam_dark', label: 'Tablinum ceiling' },
                { type: 'roof', transform: {position:[0,5.6,-18], rotation:[0.05,0,0], scale:[1,1,1]},
                  dimensions: {width:17, height:11, depth:0.2}, material: 'terracotta_tile', label: 'Tablinum roof' },

                // ============================================================
                // BATH COMPLEX (far west, 14m x 14m)
                { type: 'floor', transform: {position:[-26,0,10], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:14, depth:0.3}, material: 'marble_white', label: 'Bath floor' },
                // Walls (travertine stone — bath complex)
                { type: 'wall', transform: {position:[-19.1,2.5,10], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'travertine_stone', label: 'Bath east wall' },
                { type: 'wall', transform: {position:[-33.1,2.5,10], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'travertine_stone', label: 'Bath west wall' },
                { type: 'wall', transform: {position:[-26,2.5,3.1], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'travertine_stone', label: 'Bath south wall' },
                { type: 'wall', transform: {position:[-26,2.5,16.9], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:5, depth:0.3}, material: 'travertine_stone', label: 'Bath north wall' },
                { type: 'ceiling', transform: {position:[-26,5,10], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:14, height:14, depth:0.15}, material: 'oak_beam_dark', label: 'Bath ceiling' },
                { type: 'roof', transform: {position:[-26,5.6,10], rotation:[0,0,-0.05], scale:[1,1,1]},
                  dimensions: {width:15, height:15, depth:0.2}, material: 'terracotta_tile', label: 'Bath roof' },
                // Bath pool — sunk slightly, bronze_trim for fake water
                { type: 'floor', transform: {position:[-26,0.25,10], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:7, height:4.5, depth:0.1}, material: 'bronze_trim', label: 'Bath pool water' },
                // Pool rim (thin travertine strip around pool — use 4 small walls)
                { type: 'wall', transform: {position:[-26,0.35,7.5], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:7.4, height:0.5, depth:0.3}, material: 'travertine_stone', label: 'Bath pool rim south' },
                { type: 'wall', transform: {position:[-26,0.35,12.5], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:7.4, height:0.5, depth:0.3}, material: 'travertine_stone', label: 'Bath pool rim north' },
                { type: 'wall', transform: {position:[-29.7,0.35,10], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:5, height:0.5, depth:0.3}, material: 'travertine_stone', label: 'Bath pool rim west' },
                { type: 'wall', transform: {position:[-22.3,0.35,10], rotation:[0,1.5708,0], scale:[1,1,1]},
                  dimensions: {width:5, height:0.5, depth:0.3}, material: 'travertine_stone', label: 'Bath pool rim east' },

                // ============================================================
                // GARDEN (outside, south of atrium, 40m x 25m)
                { type: 'floor', transform: {position:[0,0,42], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:60, height:35, depth:0.3}, material: 'grass_field', label: 'Garden lawn' },
                // Garden gravel path down center
                { type: 'floor', transform: {position:[0,0.05,42], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:3, height:30, depth:0.05}, material: 'travertine_stone', label: 'Garden main path' },

                // ============================================================
                // EXTERIOR OUTER GROUND (keeps villa grounded)
                { type: 'floor', transform: {position:[0,-0.05,0], rotation:[0,0,0], scale:[1,1,1]},
                  dimensions: {width:90, height:90, depth:0.2}, material: 'grass_field', label: 'Outer ground plane' },
            ],
            props: [
                // ============================================================
                // PERISTYLE COLUMNS — 12 columns around courtyard (3 per side at edges)
                // South side (z=10)
                { glb: 'assets/props/kenney/fantasy_town_kit/pillar-stone.glb',
                  transform: {position:[-9,0,10], rotation:[0,0,0], scale:[2.5,2.5,2.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle column S1' },
                { glb: 'assets/props/kenney/fantasy_town_kit/pillar-stone.glb',
                  transform: {position:[0,0,10], rotation:[0,0,0], scale:[2.5,2.5,2.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle column S2' },
                { glb: 'assets/props/kenney/fantasy_town_kit/pillar-stone.glb',
                  transform: {position:[9,0,10], rotation:[0,0,0], scale:[2.5,2.5,2.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle column S3' },
                // North side (z=-10)
                { glb: 'assets/props/kenney/fantasy_town_kit/pillar-stone.glb',
                  transform: {position:[-9,0,-10], rotation:[0,0,0], scale:[2.5,2.5,2.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle column N1' },
                { glb: 'assets/props/kenney/fantasy_town_kit/pillar-stone.glb',
                  transform: {position:[0,0,-10], rotation:[0,0,0], scale:[2.5,2.5,2.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle column N2' },
                { glb: 'assets/props/kenney/fantasy_town_kit/pillar-stone.glb',
                  transform: {position:[9,0,-10], rotation:[0,0,0], scale:[2.5,2.5,2.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle column N3' },
                // East side (x=10)
                { glb: 'assets/props/kenney/fantasy_town_kit/pillar-stone.glb',
                  transform: {position:[10,0,-5], rotation:[0,0,0], scale:[2.5,2.5,2.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle column E1' },
                { glb: 'assets/props/kenney/fantasy_town_kit/pillar-stone.glb',
                  transform: {position:[10,0,0], rotation:[0,0,0], scale:[2.5,2.5,2.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle column E2' },
                { glb: 'assets/props/kenney/fantasy_town_kit/pillar-stone.glb',
                  transform: {position:[10,0,5], rotation:[0,0,0], scale:[2.5,2.5,2.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle column E3' },
                // West side (x=-10)
                { glb: 'assets/props/kenney/fantasy_town_kit/pillar-stone.glb',
                  transform: {position:[-10,0,-5], rotation:[0,0,0], scale:[2.5,2.5,2.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle column W1' },
                { glb: 'assets/props/kenney/fantasy_town_kit/pillar-stone.glb',
                  transform: {position:[-10,0,0], rotation:[0,0,0], scale:[2.5,2.5,2.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle column W2' },
                { glb: 'assets/props/kenney/fantasy_town_kit/pillar-stone.glb',
                  transform: {position:[-10,0,5], rotation:[0,0,0], scale:[2.5,2.5,2.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle column W3' },

                // Peristyle garden bushes (around courtyard inside edges)
                { glb: 'assets/props/kenney/nature_kit/plant_bushLarge.glb',
                  transform: {position:[-6,0,6], rotation:[0,0,0], scale:[1.8,1.8,1.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle bush NW-ish' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushLarge.glb',
                  transform: {position:[6,0,6], rotation:[0,0.5,0], scale:[1.8,1.8,1.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle bush NE-ish' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushLarge.glb',
                  transform: {position:[-6,0,-6], rotation:[0,1.2,0], scale:[1.8,1.8,1.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle bush SW-ish' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushLarge.glb',
                  transform: {position:[6,0,-6], rotation:[0,2.1,0], scale:[1.8,1.8,1.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle bush SE-ish' },
                { glb: 'assets/props/kenney/nature_kit/flower_redA.glb',
                  transform: {position:[-4,0.3,3.5], rotation:[0,0,0], scale:[1.5,1.5,1.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle red flowers' },
                { glb: 'assets/props/kenney/nature_kit/flower_yellowA.glb',
                  transform: {position:[4,0.3,3.5], rotation:[0,0,0], scale:[1.5,1.5,1.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Peristyle yellow flowers' },

                // ============================================================
                // ATRIUM PROPS
                { glb: 'assets/props/kenney/nature_kit/campfire_bricks.glb',
                  transform: {position:[-5,0,18], rotation:[0,0,0], scale:[1.5,1.5,1.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Atrium brazier' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: {position:[5,0,18], rotation:[0,0,0], scale:[2.0,2.0,2.0]},
                  cast_shadow: true, receive_shadow: true, label: 'Atrium urn east' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: {position:[-8,0,22], rotation:[0,0,0], scale:[2.0,2.0,2.0]},
                  cast_shadow: true, receive_shadow: true, label: 'Atrium urn SW' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: {position:[8,0,22], rotation:[0,0,0], scale:[2.0,2.0,2.0]},
                  cast_shadow: true, receive_shadow: true, label: 'Atrium urn SE' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: {position:[-8,0,16], rotation:[0,0,0], scale:[1.2,1.2,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Atrium lantern west' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: {position:[8,0,16], rotation:[0,0,0], scale:[1.2,1.2,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Atrium lantern east' },

                // ============================================================
                // TRICLINIUM PROPS (dining room)
                { glb: 'assets/props/kenney/furniture_kit/tableRound.glb',
                  transform: {position:[22,0,0], rotation:[0,0,0], scale:[2.2,2.0,2.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium dining table' },
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: {position:[22,0,4], rotation:[0,0,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium couch south' },
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: {position:[22,0,-4], rotation:[0,3.1416,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium couch north' },
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: {position:[26,0,0], rotation:[0,1.5708,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium couch east' },
                { glb: 'assets/props/kenney/food_kit/plate-dinner.glb',
                  transform: {position:[21,1.0,0], rotation:[0,0,0], scale:[1.0,1.0,1.0]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium plate' },
                { glb: 'assets/props/kenney/food_kit/bowl.glb',
                  transform: {position:[22.5,1.0,0.5], rotation:[0,0,0], scale:[1.0,1.0,1.0]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium bowl' },
                { glb: 'assets/props/kenney/food_kit/grapes.glb',
                  transform: {position:[22,1.0,-0.8], rotation:[0,0,0], scale:[1.2,1.2,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium grapes' },
                { glb: 'assets/props/kenney/food_kit/loaf-round.glb',
                  transform: {position:[23,1.0,-0.2], rotation:[0,0,0], scale:[1.0,1.0,1.0]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium bread' },
                { glb: 'assets/props/kenney/food_kit/wine-red.glb',
                  transform: {position:[21.5,1.0,-0.5], rotation:[0,0,0], scale:[1.0,1.0,1.0]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium wine' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: {position:[28,0,6], rotation:[0,0,0], scale:[1.2,1.2,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium corner lamp' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: {position:[28,0,-6], rotation:[0,0,0], scale:[1.2,1.2,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Triclinium corner lamp 2' },

                // ============================================================
                // CUBICULUM PROPS (bedroom)
                { glb: 'assets/props/kenney/furniture_kit/bedSingle.glb',
                  transform: {position:[-22,0,-11], rotation:[0,0,0], scale:[1.8,1.8,1.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Cubiculum bed' },
                { glb: 'assets/props/kenney/furniture_kit/pillow.glb',
                  transform: {position:[-22,1.5,-12.5], rotation:[0,0,0], scale:[1.5,1.5,1.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Cubiculum pillow' },
                { glb: 'assets/props/kenney/mini_dungeon/chest.glb',
                  transform: {position:[-17,0,-11], rotation:[0,-1.5708,0], scale:[2.0,2.0,2.0]},
                  cast_shadow: true, receive_shadow: true, label: 'Cubiculum chest' },
                { glb: 'assets/props/kenney/furniture_kit/lampRoundTable.glb',
                  transform: {position:[-17,0,-6], rotation:[0,0,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Cubiculum lamp' },
                { glb: 'assets/props/kenney/furniture_kit/sideTable.glb',
                  transform: {position:[-17,0,-6], rotation:[0,0,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Cubiculum side table' },

                // ============================================================
                // TABLINUM PROPS (study)
                { glb: 'assets/props/kenney/furniture_kit/desk.glb',
                  transform: {position:[0,0,-18], rotation:[0,0,0], scale:[2.0,2.0,2.0]},
                  cast_shadow: true, receive_shadow: true, label: 'Tablinum desk' },
                { glb: 'assets/props/kenney/furniture_kit/chairDesk.glb',
                  transform: {position:[0,0,-16], rotation:[0,3.1416,0], scale:[1.5,1.5,1.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Tablinum chair' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',
                  transform: {position:[-6,0,-22], rotation:[0,0,0], scale:[1.8,1.8,1.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Tablinum scroll rack (west)' },
                { glb: 'assets/props/kenney/furniture_kit/bookcaseOpen.glb',
                  transform: {position:[6,0,-22], rotation:[0,0,0], scale:[1.8,1.8,1.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Tablinum scroll rack (east)' },
                { glb: 'assets/props/kenney/furniture_kit/books.glb',
                  transform: {position:[0,1.3,-18.5], rotation:[0,0.3,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Tablinum scrolls on desk' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: {position:[6,0,-14], rotation:[0,0,0], scale:[1.2,1.2,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Tablinum lamp' },

                // ============================================================
                // BATH PROPS
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: {position:[-26,0,5.5], rotation:[0,0,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Bath bench south' },
                { glb: 'assets/props/kenney/furniture_kit/bench.glb',
                  transform: {position:[-26,0,14.5], rotation:[0,3.1416,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Bath bench north' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: {position:[-31,0,5], rotation:[0,0,0], scale:[1.8,1.8,1.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Bath oil urn west' },
                { glb: 'assets/props/kenney/nature_kit/pot_large.glb',
                  transform: {position:[-31,0,15], rotation:[0,0,0], scale:[1.8,1.8,1.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Bath oil urn east' },
                { glb: 'assets/props/kenney/holiday_kit/lantern.glb',
                  transform: {position:[-21,0,5], rotation:[0,0,0], scale:[1.2,1.2,1.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Bath lantern' },

                // ============================================================
                // GARDEN PROPS — cypress (tall pines as stand-ins), rocks, shrine
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallA.glb',
                  transform: {position:[-15,0,32], rotation:[0,0,0], scale:[2.8,3.6,2.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden cypress W1' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallB.glb',
                  transform: {position:[-15,0,42], rotation:[0,0.7,0], scale:[2.8,3.6,2.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden cypress W2' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallC.glb',
                  transform: {position:[-15,0,52], rotation:[0,1.5,0], scale:[2.8,3.6,2.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden cypress W3' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallA.glb',
                  transform: {position:[15,0,32], rotation:[0,0.3,0], scale:[2.8,3.6,2.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden cypress E1' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallB.glb',
                  transform: {position:[15,0,42], rotation:[0,1.1,0], scale:[2.8,3.6,2.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden cypress E2' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallC.glb',
                  transform: {position:[15,0,52], rotation:[0,2.0,0], scale:[2.8,3.6,2.8]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden cypress E3' },
                // Garden bushes
                { glb: 'assets/props/kenney/nature_kit/plant_bushLarge.glb',
                  transform: {position:[-8,0,35], rotation:[0,0,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden bush W' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushLarge.glb',
                  transform: {position:[8,0,35], rotation:[0,0.8,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden bush E' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushLarge.glb',
                  transform: {position:[-8,0,48], rotation:[0,1.4,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden bush SW' },
                { glb: 'assets/props/kenney/nature_kit/plant_bushLarge.glb',
                  transform: {position:[8,0,48], rotation:[0,2.2,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden bush SE' },
                // Garden rocks
                { glb: 'assets/props/kenney/nature_kit/rock_largeA.glb',
                  transform: {position:[-20,0,45], rotation:[0,0,0], scale:[2.0,2.0,2.0]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden rock west' },
                { glb: 'assets/props/kenney/nature_kit/rock_largeB.glb',
                  transform: {position:[20,0,45], rotation:[0,1.2,0], scale:[2.0,2.0,2.0]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden rock east' },
                // Garden shrine = statue_columnDamaged + statue_head on top (composed)
                { glb: 'assets/props/kenney/nature_kit/statue_column.glb',
                  transform: {position:[0,0,55], rotation:[0,0,0], scale:[2.2,2.2,2.2]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden shrine column' },
                { glb: 'assets/props/kenney/nature_kit/statue_head.glb',
                  transform: {position:[0,3.2,55], rotation:[0,0,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden shrine bust' },
                // Garden flowers at shrine base
                { glb: 'assets/props/kenney/nature_kit/flower_redB.glb',
                  transform: {position:[-1.5,0,54], rotation:[0,0,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Shrine flowers red' },
                { glb: 'assets/props/kenney/nature_kit/flower_yellowB.glb',
                  transform: {position:[1.5,0,54], rotation:[0,0,0], scale:[1.4,1.4,1.4]},
                  cast_shadow: true, receive_shadow: true, label: 'Shrine flowers yellow' },
                // Garden hedges lining main path
                { glb: 'assets/props/kenney/fantasy_town_kit/hedge-large.glb',
                  transform: {position:[-3,0,30], rotation:[0,0,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden hedge W1' },
                { glb: 'assets/props/kenney/fantasy_town_kit/hedge-large.glb',
                  transform: {position:[3,0,30], rotation:[0,0,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden hedge E1' },
                { glb: 'assets/props/kenney/fantasy_town_kit/hedge-large.glb',
                  transform: {position:[-3,0,38], rotation:[0,0,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden hedge W2' },
                { glb: 'assets/props/kenney/fantasy_town_kit/hedge-large.glb',
                  transform: {position:[3,0,38], rotation:[0,0,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden hedge E2' },
                { glb: 'assets/props/kenney/fantasy_town_kit/hedge-large.glb',
                  transform: {position:[-3,0,46], rotation:[0,0,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden hedge W3' },
                { glb: 'assets/props/kenney/fantasy_town_kit/hedge-large.glb',
                  transform: {position:[3,0,46], rotation:[0,0,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden hedge E3' },
                // Garden additional pines (far back & sides)
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallD.glb',
                  transform: {position:[-25,0,55], rotation:[0,0.5,0], scale:[2.5,3.2,2.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden cypress far W' },
                { glb: 'assets/props/kenney/nature_kit/tree_pineTallD.glb',
                  transform: {position:[25,0,55], rotation:[0,1.8,0], scale:[2.5,3.2,2.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden cypress far E' },
                // Small rocks scattered
                { glb: 'assets/props/kenney/nature_kit/rock_smallA.glb',
                  transform: {position:[-12,0,50], rotation:[0,0.4,0], scale:[1.5,1.5,1.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden small rock 1' },
                { glb: 'assets/props/kenney/nature_kit/rock_smallB.glb',
                  transform: {position:[12,0,50], rotation:[0,1.1,0], scale:[1.5,1.5,1.5]},
                  cast_shadow: true, receive_shadow: true, label: 'Garden small rock 2' },

                // ============================================================
                // EXTERIOR DECOR — potted plants flanking atrium entry
                { glb: 'assets/props/kenney/furniture_kit/pottedPlant.glb',
                  transform: {position:[-2,0,27.5], rotation:[0,0,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Entry potted plant W' },
                { glb: 'assets/props/kenney/furniture_kit/pottedPlant.glb',
                  transform: {position:[2,0,27.5], rotation:[0,0,0], scale:[1.6,1.6,1.6]},
                  cast_shadow: true, receive_shadow: true, label: 'Entry potted plant E' },
            ],
            connectors: [],
            loci: [
                // ---- COURTYARD / FOUNTAIN (5) ----
                { position:[0, 1.8, 0], marker_type: 'glow', label: 'Fountain center (locus 1)' },
                { position:[-9, 1.5, -9], marker_type: 'orb', label: 'Peristyle NW corner (locus 2)' },
                { position:[9, 1.5, -9], marker_type: 'orb', label: 'Peristyle NE corner (locus 3)' },
                { position:[-9, 1.5, 9], marker_type: 'orb', label: 'Peristyle SW corner (locus 4)' },
                { position:[9, 1.5, 9], marker_type: 'orb', label: 'Peristyle SE corner (locus 5)' },

                // ---- TRICLINIUM (5) ----
                { position:[22, 1.3, 0], marker_type: 'pedestal', label: 'Triclinium dining table (locus 6)' },
                { position:[22, 1.3, 4], marker_type: 'pedestal', label: 'Triclinium south couch (locus 7)' },
                { position:[22, 1.3, -4], marker_type: 'pedestal', label: 'Triclinium north couch (locus 8)' },
                { position:[26, 1.3, 0], marker_type: 'pedestal', label: 'Triclinium east couch (locus 9)' },
                { position:[28, 1.5, -6], marker_type: 'frame', label: 'Triclinium wall mural (locus 10)' },

                // ---- CUBICULUM (3) ----
                { position:[-22, 1.5, -11], marker_type: 'pedestal', label: 'Cubiculum bed (locus 11)' },
                { position:[-17, 1.2, -11], marker_type: 'orb', label: 'Cubiculum chest (locus 12)' },
                { position:[-20, 2.8, -14], marker_type: 'frame', label: 'Cubiculum window (locus 13)' },

                // ---- TABLINUM (3) ----
                { position:[0, 1.4, -18], marker_type: 'pedestal', label: 'Tablinum desk (locus 14)' },
                { position:[-6, 1.8, -22], marker_type: 'frame', label: 'Tablinum scroll rack W (locus 15)' },
                { position:[6, 1.8, -22], marker_type: 'frame', label: 'Tablinum scroll rack E (locus 16)' },

                // ---- BATH (4) ----
                { position:[-26, 1.2, 10], marker_type: 'glow', label: 'Bath pool center (locus 17)' },
                { position:[-26, 1.3, 5.5], marker_type: 'pedestal', label: 'Bath south bench (locus 18)' },
                { position:[-26, 1.3, 14.5], marker_type: 'pedestal', label: 'Bath north bench (locus 19)' },
                { position:[-31, 1.5, 10], marker_type: 'orb', label: 'Bath oil urns (locus 20)' },

                // ---- ATRIUM (4) ----
                { position:[0, 1.5, 27], marker_type: 'door', label: 'Atrium doorway (locus 21)' },
                { position:[-5, 1.3, 18], marker_type: 'glow', label: 'Atrium brazier (locus 22)' },
                { position:[-10, 2.5, 20], marker_type: 'frame', label: 'Atrium west mural (locus 23)' },
                { position:[10, 2.5, 20], marker_type: 'frame', label: 'Atrium east mural (locus 24)' },

                // ---- GARDEN (4) ----
                { position:[-15, 3, 42], marker_type: 'statue', label: 'Garden cypress west (locus 25)' },
                { position:[15, 3, 42], marker_type: 'statue', label: 'Garden cypress east (locus 26)' },
                { position:[0, 2.5, 55], marker_type: 'statue', label: 'Garden shrine bust (locus 27)' },
                { position:[0, 1.2, 42], marker_type: 'pedestal', label: 'Garden path center (locus 28)' },
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
                spawn_point: { position: [0, 1.6, 12], rotation_y: 180 },
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
                // CENTRAL SPIRAL STAIR COLUMN — programmatic stacked treads
                // A thin square central column of marble with treads spiraling around it.
                // Column occupies ~(1x1x24m), treads radiate out 1.5m at steps of 15deg and 0.25m rise.
                // We place 24 treads per floor × 3 floor transitions = 72 step surfaces.
                // For template brevity we cycle 24 steps per transition.
                // ========================================================
                // Central column of marble
                { type: 'wall', transform: { position: [0, 12, 0], rotation: [0, 0, 0], scale: [1,1,1] },
                  dimensions: { width: 1.0, height: 24, depth: 1.0 }, material: 'marble_white', label: 'Stair central column' },

                // F1 -> F2 spiral (24 steps, y=0.25..6.0, angle 0..2*360)
                { type: 'floor', transform: { position: [ 1.70, 0.25,  0.00], rotation: [0, 0.0000, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 01' },
                { type: 'floor', transform: { position: [ 1.64, 0.50,  0.44], rotation: [0, 0.2618, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 02' },
                { type: 'floor', transform: { position: [ 1.47, 0.75,  0.85], rotation: [0, 0.5236, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 03' },
                { type: 'floor', transform: { position: [ 1.20, 1.00,  1.20], rotation: [0, 0.7854, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 04' },
                { type: 'floor', transform: { position: [ 0.85, 1.25,  1.47], rotation: [0, 1.0472, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 05' },
                { type: 'floor', transform: { position: [ 0.44, 1.50,  1.64], rotation: [0, 1.3090, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 06' },
                { type: 'floor', transform: { position: [ 0.00, 1.75,  1.70], rotation: [0, 1.5708, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 07' },
                { type: 'floor', transform: { position: [-0.44, 2.00,  1.64], rotation: [0, 1.8326, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 08' },
                { type: 'floor', transform: { position: [-0.85, 2.25,  1.47], rotation: [0, 2.0944, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 09' },
                { type: 'floor', transform: { position: [-1.20, 2.50,  1.20], rotation: [0, 2.3562, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 10' },
                { type: 'floor', transform: { position: [-1.47, 2.75,  0.85], rotation: [0, 2.6180, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 11' },
                { type: 'floor', transform: { position: [-1.64, 3.00,  0.44], rotation: [0, 2.8798, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 12' },
                { type: 'floor', transform: { position: [-1.70, 3.25,  0.00], rotation: [0, 3.1416, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 13' },
                { type: 'floor', transform: { position: [-1.64, 3.50, -0.44], rotation: [0, 3.4034, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 14' },
                { type: 'floor', transform: { position: [-1.47, 3.75, -0.85], rotation: [0, 3.6652, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 15' },
                { type: 'floor', transform: { position: [-1.20, 4.00, -1.20], rotation: [0, 3.9270, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 16' },
                { type: 'floor', transform: { position: [-0.85, 4.25, -1.47], rotation: [0, 4.1888, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 17' },
                { type: 'floor', transform: { position: [-0.44, 4.50, -1.64], rotation: [0, 4.4506, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 18' },
                { type: 'floor', transform: { position: [ 0.00, 4.75, -1.70], rotation: [0, 4.7124, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 19' },
                { type: 'floor', transform: { position: [ 0.44, 5.00, -1.64], rotation: [0, 4.9742, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 20' },
                { type: 'floor', transform: { position: [ 0.85, 5.25, -1.47], rotation: [0, 5.2360, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 21' },
                { type: 'floor', transform: { position: [ 1.20, 5.50, -1.20], rotation: [0, 5.4978, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 22' },
                { type: 'floor', transform: { position: [ 1.47, 5.75, -0.85], rotation: [0, 5.7596, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 23' },
                { type: 'floor', transform: { position: [ 1.64, 6.00, -0.44], rotation: [0, 6.0214, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F1-2 step 24' },

                // F2 -> F3 spiral (12 treads, coarser — 0.5m rise)
                { type: 'floor', transform: { position: [ 1.70, 6.50,  0.00], rotation: [0, 0.0000, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F2-3 step 01' },
                { type: 'floor', transform: { position: [ 1.47, 7.00,  0.85], rotation: [0, 0.5236, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F2-3 step 02' },
                { type: 'floor', transform: { position: [ 0.85, 7.50,  1.47], rotation: [0, 1.0472, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F2-3 step 03' },
                { type: 'floor', transform: { position: [ 0.00, 8.00,  1.70], rotation: [0, 1.5708, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F2-3 step 04' },
                { type: 'floor', transform: { position: [-0.85, 8.50,  1.47], rotation: [0, 2.0944, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F2-3 step 05' },
                { type: 'floor', transform: { position: [-1.47, 9.00,  0.85], rotation: [0, 2.6180, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F2-3 step 06' },
                { type: 'floor', transform: { position: [-1.70, 9.50,  0.00], rotation: [0, 3.1416, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F2-3 step 07' },
                { type: 'floor', transform: { position: [-1.47,10.00, -0.85], rotation: [0, 3.6652, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F2-3 step 08' },
                { type: 'floor', transform: { position: [-0.85,10.50, -1.47], rotation: [0, 4.1888, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F2-3 step 09' },
                { type: 'floor', transform: { position: [ 0.00,11.00, -1.70], rotation: [0, 4.7124, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F2-3 step 10' },
                { type: 'floor', transform: { position: [ 0.85,11.50, -1.47], rotation: [0, 5.2360, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F2-3 step 11' },
                { type: 'floor', transform: { position: [ 1.47,12.00, -0.85], rotation: [0, 5.7596, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F2-3 step 12' },

                // F3 -> F4 spiral (12 treads)
                { type: 'floor', transform: { position: [ 1.70,12.50,  0.00], rotation: [0, 0.0000, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F3-4 step 01' },
                { type: 'floor', transform: { position: [ 1.47,13.00,  0.85], rotation: [0, 0.5236, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F3-4 step 02' },
                { type: 'floor', transform: { position: [ 0.85,13.50,  1.47], rotation: [0, 1.0472, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F3-4 step 03' },
                { type: 'floor', transform: { position: [ 0.00,14.00,  1.70], rotation: [0, 1.5708, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F3-4 step 04' },
                { type: 'floor', transform: { position: [-0.85,14.50,  1.47], rotation: [0, 2.0944, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F3-4 step 05' },
                { type: 'floor', transform: { position: [-1.47,15.00,  0.85], rotation: [0, 2.6180, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F3-4 step 06' },
                { type: 'floor', transform: { position: [-1.70,15.50,  0.00], rotation: [0, 3.1416, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F3-4 step 07' },
                { type: 'floor', transform: { position: [-1.47,16.00, -0.85], rotation: [0, 3.6652, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F3-4 step 08' },
                { type: 'floor', transform: { position: [-0.85,16.50, -1.47], rotation: [0, 4.1888, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F3-4 step 09' },
                { type: 'floor', transform: { position: [ 0.00,17.00, -1.70], rotation: [0, 4.7124, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F3-4 step 10' },
                { type: 'floor', transform: { position: [ 0.85,17.50, -1.47], rotation: [0, 5.2360, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F3-4 step 11' },
                { type: 'floor', transform: { position: [ 1.47,18.00, -0.85], rotation: [0, 5.7596, 0], scale: [1,1,1] }, dimensions: { width: 1.4, height: 0.9, depth: 0.15 }, material: 'marble_white', label: 'Stair F3-4 step 12' },
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
                spawn_point: { position: [0, 1.6, 55], rotation_y: 180 },
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
                spawn_point: { position: [0, 1.6, 30], rotation_y: 180 },
                scale: 1.0,
            },
            environment: {
                hdri: 'assets/hdri/drachenfels_cellar_2k.hdr',
                hdri_intensity: 0.25,
                hdri_as_background: true,
                fog: { color: 0x0a0808, near: 3, far: 30 },
                sun: { position: [0, 40, 0], intensity: 0.1, color: 0xffeedd, cast_shadow: false, shadow_bounds: 40 },
                ambient: { intensity: 0.02 },
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
                spawn_point: { position: [0, 1.6, 12], rotation_y: 180 },
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
