/**
 * RhodesCards Memory Palace — Import/Export
 * Save/load palaces as JSON. Share layouts between users.
 */
(function() {
    'use strict';

    const PIO = {
        // ── Export palace as JSON file ──
        exportPalace() {
            if (!RC.Palace.currentPalace) return;
            const data = {
                version: 1,
                name: RC.Palace.currentPalace.name,
                spawn_point: RC.Palace.currentPalace.spawn_point,
                settings: RC.Palace.currentPalace.settings,
                ...RC.PalaceRenderer.exportSceneData()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = (RC.Palace.currentPalace.name || 'palace').replace(/\s+/g, '_') + '.json';
            a.click();
            URL.revokeObjectURL(url);
            RC.toast('Palace exported');
        },

        // ── Import palace from JSON file ──
        importPalace() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    if (!data.version || !data.surfaces) {
                        RC.toast('Invalid palace file');
                        return;
                    }
                    // Create new palace from imported data
                    const res = await RC.api('POST', '/palaces', { name: data.name || 'Imported Palace' });
                    if (!res || !res.id) { RC.toast('Create failed'); return; }

                    // Bulk save the imported data
                    await RC.api('PUT', '/palaces/' + res.id + '/bulk', {
                            name: data.name,
                            spawn_point: data.spawn_point,
                            surfaces: data.surfaces,
                            connectors: data.connectors,
                            loci: data.loci
                        });

                    RC.toast('Palace imported!');
                    RC.Palace.enter(res.id);
                } catch (err) {
                    RC.toast('Import error: ' + err.message);
                }
            };
            input.click();
        },

        // ── Duplicate current palace ──
        async duplicatePalace() {
            if (!RC.Palace.currentPalace) return;
            const sceneData = RC.PalaceRenderer.exportSceneData();
            const res = await RC.api('POST', '/palaces', { name: RC.Palace.currentPalace.name + ' (copy)' });
            if (!res || !res.id) { RC.toast('Duplicate failed'); return; }

            await RC.api('PUT', '/palaces/' + res.id + '/bulk', {
                    spawn_point: RC.Palace.currentPalace.spawn_point,
                    surfaces: sceneData.surfaces,
                    connectors: sceneData.connectors,
                    loci: sceneData.loci.map(l => ({ ...l, card_ids: [] }))
                });

            RC.toast('Palace duplicated');
            RC.Palace.enter(res.id);
        }
    };

    RC.PalaceIO = PIO;
})();
