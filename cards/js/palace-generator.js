/**
 * RhodesCards Memory Palace — Procedural Generator
 * Generates a palace layout for a given number of loci.
 */
(function() {
    'use strict';

    const PG = {
        /**
         * Generate a palace with approximately `count` loci.
         * Returns { surfaces, connectors, loci, spawn_point }
         */
        generate(count) {
            count = Math.max(4, Math.min(200, count || 20));
            var lociPerRoom = 5;
            var numRooms = Math.ceil(count / lociPerRoom);
            // Multi-floor if > 4 rooms
            var roomsPerFloor = Math.min(numRooms, 4);
            var numFloors = Math.ceil(numRooms / roomsPerFloor);

            var S = [], C = [], L = [];
            var roomIndex = 0;
            var lociPlaced = 0;

            // Room placement offsets (corridor layout per floor)
            // Rooms arranged along a corridor: left-right alternating
            var roomOffsets = [
                { x: -6, z: 0 },
                { x: 6, z: 0 },
                { x: -6, z: -10 },
                { x: 6, z: -10 },
            ];

            for (var f = 0; f < numFloors && lociPlaced < count; f++) {
                var floorY = f * 5;

                // Floor corridor
                var corridorLen = Math.min(roomsPerFloor, numRooms - f * roomsPerFloor);
                var corridorZ = corridorLen > 2 ? -5 : 0;
                S.push({
                    type: 'floor',
                    transform: { position: [0, floorY, corridorZ], rotation: [0,0,0], scale: [1,1,1] },
                    dimensions: { width: 3, height: corridorLen > 2 ? 14 : 4 },
                    material: { color: this._floorColor(f) }
                });

                // Rooms on this floor
                for (var r = 0; r < roomsPerFloor && lociPlaced < count; r++) {
                    var offset = roomOffsets[r];
                    var rx = offset.x;
                    var rz = offset.z;
                    var roomW = 6;
                    var roomH = 6;

                    // Room floor
                    S.push({
                        type: 'floor',
                        transform: { position: [rx, floorY, rz], rotation: [0,0,0], scale: [1,1,1] },
                        dimensions: { width: roomW, height: roomH },
                        material: { color: this._roomColor(roomIndex) }
                    });

                    // Room walls (3 sides — opening toward corridor)
                    var halfW = roomW / 2;
                    var halfH = roomH / 2;
                    // Back wall
                    S.push({
                        type: 'wall',
                        transform: { position: [rx, floorY + 1.5, rz - halfH], rotation: [0,0,0], scale: [1,1,1] },
                        dimensions: { width: roomW, height: 3 },
                        material: { color: this._wallColor(roomIndex) }
                    });
                    // Side walls
                    S.push({
                        type: 'wall',
                        transform: { position: [rx - halfW, floorY + 1.5, rz], rotation: [0,90,0], scale: [1,1,1] },
                        dimensions: { width: roomH, height: 3 },
                        material: { color: this._wallColor(roomIndex) }
                    });
                    S.push({
                        type: 'wall',
                        transform: { position: [rx + halfW, floorY + 1.5, rz], rotation: [0,90,0], scale: [1,1,1] },
                        dimensions: { width: roomH, height: 3 },
                        material: { color: this._wallColor(roomIndex) }
                    });

                    // Place loci inside room
                    var roomLoci = Math.min(lociPerRoom, count - lociPlaced);
                    var lociPositions = this._distributeLoci(rx, floorY, rz, roomW, roomH, roomLoci);
                    var markers = ['pedestal', 'frame', 'orb', 'statue', 'glow'];

                    for (var li = 0; li < roomLoci; li++) {
                        L.push({
                            position: lociPositions[li],
                            marker_type: markers[li % markers.length],
                            marker_settings: {},
                            card_ids: [],
                            label: 'Room ' + (roomIndex + 1) + ', Spot ' + (li + 1)
                        });
                        lociPlaced++;
                    }

                    roomIndex++;
                }

                // Stairs to next floor
                if (f < numFloors - 1) {
                    C.push({
                        type: 'stairs',
                        from_point: { position: [0, floorY, 2] },
                        to_point: { position: [0, floorY + 5, 0] },
                        path_points: [],
                        material: { color: '#777777' },
                        speed: 1.0
                    });
                }
            }

            return {
                surfaces: S,
                connectors: C,
                loci: L,
                spawn_point: { position: [0, 1.6, 3] }
            };
        },

        _distributeLoci(cx, y, cz, w, h, count) {
            // Place loci around room perimeter
            var positions = [];
            var hw = w / 2 - 0.5;
            var hh = h / 2 - 0.5;
            // Candidate positions around the wall
            var candidates = [
                [cx - hw + 1, y + 1, cz - hh + 0.5],   // back-left
                [cx, y + 0.8, cz - hh + 0.5],            // back-center
                [cx + hw - 1, y + 1, cz - hh + 0.5],    // back-right
                [cx - hw + 0.5, y + 1, cz],              // left-center
                [cx + hw - 0.5, y + 1, cz],              // right-center
                [cx - hw + 1, y + 0.5, cz + hh - 0.5],  // front-left
                [cx, y + 0.8, cz + hh - 0.5],            // front-center
                [cx + hw - 1, y + 0.5, cz + hh - 0.5],  // front-right
            ];
            for (var i = 0; i < count && i < candidates.length; i++) {
                positions.push(candidates[i]);
            }
            return positions;
        },

        // Color palettes
        _floorColor(floor) {
            var colors = ['#555566', '#4a4a5a', '#3f3f4f', '#353545'];
            return colors[floor % colors.length];
        },
        _roomColor(room) {
            var colors = ['#6B5B45', '#4a5B6B', '#5B4a5B', '#5B6B4a', '#6B4a4a', '#4a6B5B'];
            return colors[room % colors.length];
        },
        _wallColor(room) {
            var colors = ['#8B7B65', '#6a7B8B', '#7B6a7B', '#7B8B6a', '#8B6a6a', '#6a8B7B'];
            return colors[room % colors.length];
        }
    };

    RC.PalaceGenerator = PG;
})();
