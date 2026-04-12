// Bantu Maximizer - Core Game Logic
// Uses break_infinity.js for large number precision

(function() {
    'use strict';
    
    // Game state
    const state = {
        population: new Decimal(0),
        food: new Decimal(0),
        tools: new Decimal(0),
        knowledge: new Decimal(0),
        culture: new Decimal(0),
        
        // Production rates per second
        popRate: new Decimal(0),
        foodRate: new Decimal(0),
        toolsRate: new Decimal(0),
        knowledgeRate: new Decimal(0),
        cultureRate: new Decimal(0),
        
        // Manual click values
        manualFood: new Decimal(1),
        manualTools: new Decimal(0.5),
        manualKnowledge: new Decimal(0.1),
        manualCulture: new Decimal(0.05),
        manualPop: new Decimal(1),
        
        // Buildings owned
        buildings: {
            hut: 0,
            farm: 0,
            workshop: 0,
            school: 0,
            hospital: 0,
            university: 0,
            monument: 0,
            city: 0
        },
        
        // Upgrades purchased
        upgrades: [],
        
        // Statistics
        totalPopulation: new Decimal(0),
        maxPopulation: new Decimal(0),
        startTime: Date.now(),
        lastSave: Date.now(),
        
        // Prestige
        prestigeCount: 0,
        prestigePoints: new Decimal(0)
    };
    
    // Building definitions
    const buildings = {
        hut: {
            name: 'Hut',
            description: 'Basic shelter for your people',
            cost: { food: 10, tools: 5 },
            produces: { pop: 0.1 },
            baseCost: { food: 10, tools: 5 }
        },
        farm: {
            name: 'Farm',
            description: 'Grows food to sustain population',
            cost: { tools: 15, knowledge: 5 },
            produces: { food: 1 },
            baseCost: { tools: 15, knowledge: 5 }
        },
        workshop: {
            name: 'Workshop',
            description: 'Crafts tools for construction',
            cost: { food: 50, knowledge: 20 },
            produces: { tools: 0.5 },
            baseCost: { food: 50, knowledge: 20 }
        },
        school: {
            name: 'School',
            description: 'Teaches the young',
            cost: { food: 100, tools: 50, culture: 10 },
            produces: { knowledge: 0.3 },
            baseCost: { food: 100, tools: 50, culture: 10 }
        },
        hospital: {
            name: 'Hospital',
            description: 'Heals the sick, saves lives',
            cost: { tools: 200, knowledge: 100, culture: 25 },
            produces: { pop: 0.3 },
            baseCost: { tools: 200, knowledge: 100, culture: 25 }
        },
        university: {
            name: 'University',
            description: 'Advanced learning institution',
            cost: { food: 1000, tools: 500, knowledge: 300, culture: 100 },
            produces: { knowledge: 1, culture: 0.2 },
            baseCost: { food: 1000, tools: 500, knowledge: 300, culture: 100 }
        },
        monument: {
            name: 'Monument',
            description: 'Inspires cultural greatness',
            cost: { food: 2000, tools: 1000, knowledge: 500, culture: 200 },
            produces: { culture: 0.5 },
            baseCost: { food: 2000, tools: 1000, knowledge: 500, culture: 200 }
        },
        city: {
            name: 'Great City',
            description: 'A center of civilization',
            cost: { food: 5000, tools: 3000, knowledge: 2000, culture: 1000, pop: 1000 },
            produces: { pop: 1, food: 2, tools: 1, knowledge: 0.5, culture: 0.3 },
            baseCost: { food: 5000, tools: 3000, knowledge: 2000, culture: 1000, pop: 1000 }
        }
    };
    
    // Upgrade definitions
    const upgradesList = [
        {
            id: 'agriculture',
            name: 'Agriculture',
            description: 'Farms produce 50% more food',
            cost: { knowledge: 50 },
            effect: () => { game.multipliers.food *= 1.5; },
            requires: () => state.buildings.farm >= 5
        },
        {
            id: 'toolmaking',
            name: 'Advanced Toolmaking',
            description: 'Workshops produce 50% more tools',
            cost: { knowledge: 100, tools: 50 },
            effect: () => { game.multipliers.tools *= 1.5; },
            requires: () => state.buildings.workshop >= 5
        },
        {
            id: 'literacy',
            name: 'Literacy Program',
            description: 'Schools produce 50% more knowledge',
            cost: { knowledge: 200, culture: 50 },
            effect: () => { game.multipliers.knowledge *= 1.5; },
            requires: () => state.buildings.school >= 3
        },
        {
            id: 'medicine',
            name: 'Modern Medicine',
            description: 'Hospitals produce 100% more population growth',
            cost: { knowledge: 500, culture: 100 },
            effect: () => { game.multipliers.pop *= 1.5; },
            requires: () => state.buildings.hospital >= 3
        },
        {
            id: 'architecture',
            name: 'Great Architecture',
            description: 'All buildings 20% more efficient',
            cost: { knowledge: 1000, culture: 500, tools: 500 },
            effect: () => { 
                game.multipliers.food *= 1.2;
                game.multipliers.tools *= 1.2;
                game.multipliers.knowledge *= 1.2;
                game.multipliers.culture *= 1.2;
                game.multipliers.pop *= 1.2;
            },
            requires: () => state.buildings.monument >= 2
        },
        {
            id: 'automation',
            name: 'Automation',
            description: 'Manual gathering is twice as effective',
            cost: { knowledge: 2000, tools: 1000 },
            effect: () => {
                state.manualFood *= 2;
                state.manualTools *= 2;
                state.manualKnowledge *= 2;
                state.manualCulture *= 2;
            },
            requires: () => state.buildings.university >= 2
        },
        {
            id: 'space_exploration',
            name: 'Space Exploration',
            description: 'Unlocks the stars',
            cost: { knowledge: 10000, culture: 5000, tools: 5000 },
            effect: () => { game.unlocked.space = true; },
            requires: () => state.buildings.city >= 5
        }
    ];
    
    // Multipliers
    const game = {
        multipliers: {
            food: 1,
            tools: 1,
            knowledge: 1,
            culture: 1,
            pop: 1
        },
        unlocked: {
            space: false
        },
        lastFrame: 0,
        saveKey: 'bantu_maximizer_save'
    };
    
    // DOM element cache
    const ui = {};
    
    // Utility functions
    function formatNumber(num) {
        if (num instanceof Decimal) {
            num = num.toNumber();
        }
        if (num >= 1e9) return num.toExponential(2).replace('+', '');
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k';
        return Math.floor(num).toString();
    }
    
    function formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    
    // Calculate building cost with scaling
    function getBuildingCost(type) {
        const building = buildings[type];
        const count = state.buildings[type];
        const multiplier = Math.pow(1.15, count);
        
        const cost = {};
        for (const [resource, amount] of Object.entries(building.baseCost)) {
            cost[resource] = Math.floor(amount * multiplier);
        }
        return cost;
    }
    
    // Check if player can afford something
    function canAfford(cost) {
        for (const [resource, amount] of Object.entries(cost)) {
            const current = resource === 'pop' ? state.population : state[resource];
            if (current.lessThan(amount)) return false;
        }
        return true;
    }
    
    // Deduct resources
    function deductResources(cost) {
        for (const [resource, amount] of Object.entries(cost)) {
            if (resource === 'pop') {
                state.population = state.population.minus(amount);
            } else {
                state[resource] = state[resource].minus(amount);
            }
        }
    }
    
    // Calculate production rates
    function updateRates() {
        state.foodRate = new Decimal(0);
        state.toolsRate = new Decimal(0);
        state.knowledgeRate = new Decimal(0);
        state.cultureRate = new Decimal(0);
        state.popRate = new Decimal(0);
        
        for (const [type, count] of Object.entries(state.buildings)) {
            if (count === 0) continue;
            const building = buildings[type];
            const produces = building.produces;
            
            if (produces.food) state.foodRate = state.foodRate.plus(produces.food * count * game.multipliers.food);
            if (produces.tools) state.toolsRate = state.toolsRate.plus(produces.tools * count * game.multipliers.tools);
            if (produces.knowledge) state.knowledgeRate = state.knowledgeRate.plus(produces.knowledge * count * game.multipliers.knowledge);
            if (produces.culture) state.cultureRate = state.cultureRate.plus(produces.culture * count * game.multipliers.culture);
            if (produces.pop) state.popRate = state.popRate.plus(produces.pop * count * game.multipliers.pop);
        }
    }
    
    // Build a building
    function build(type) {
        const cost = getBuildingCost(type);
        if (!canAfford(cost)) {
            showMessage('Not enough resources!');
            return;
        }
        
        deductResources(cost);
        state.buildings[type]++;
        updateRates();
        renderBuildings();
        renderUpgrades();
        showMessage(`${buildings[type].name} built!`);
    }
    
    // Buy an upgrade
    function buyUpgrade(upgrade) {
        if (state.upgrades.includes(upgrade.id)) return;
        if (!canAfford(upgrade.cost)) {
            showMessage('Not enough resources!');
            return;
        }
        
        deductResources(upgrade.cost);
        state.upgrades.push(upgrade.id);
        upgrade.effect();
        updateRates();
        renderUpgrades();
        showMessage(`${upgrade.name} researched!`);
    }
    
    // Manual gathering
    function manualGather(type) {
        switch(type) {
            case 'food':
                state.food = state.food.plus(state.manualFood);
                break;
            case 'tools':
                if (state.food.lessThan(0.5)) {
                    showMessage('Need food to craft tools!');
                    return;
                }
                state.food = state.food.minus(0.5);
                state.tools = state.tools.plus(state.manualTools);
                break;
            case 'knowledge':
                state.knowledge = state.knowledge.plus(state.manualKnowledge);
                break;
            case 'culture':
                if (state.knowledge.lessThan(0.5)) {
                    showMessage('Need knowledge to create art!');
                    return;
                }
                state.knowledge = state.knowledge.minus(0.5);
                state.culture = state.culture.plus(state.manualCulture);
                break;
            case 'pop':
                if (state.food.lessThan(5)) {
                    showMessage('Need food to sustain population growth!');
                    return;
                }
                state.food = state.food.minus(5);
                state.population = state.population.plus(state.manualPop);
                state.totalPopulation = state.totalPopulation.plus(state.manualPop);
                if (state.population.greaterThan(state.maxPopulation)) {
                    state.maxPopulation = new Decimal(state.population);
                }
                break;
        }
        updateUI();
    }
    
    // Show temporary message
    let messageTimeout;
    function showMessage(msg) {
        const statusEl = document.getElementById('save-status');
        statusEl.textContent = msg;
        statusEl.className = 'show';
        clearTimeout(messageTimeout);
        messageTimeout = setTimeout(() => {
            statusEl.className = '';
        }, 2000);
    }
    
    // Render functions
    function renderBuildings() {
        const container = document.getElementById('buildings-list');
        container.innerHTML = '';
        
        for (const [type, building] of Object.entries(buildings)) {
            const count = state.buildings[type];
            const cost = getBuildingCost(type);
            const affordable = canAfford(cost);
            
            const div = document.createElement('div');
            div.className = `building-card ${affordable ? 'affordable' : 'unaffordable'}`;
            div.innerHTML = `
                <div class="building-header">
                    <span class="building-name">${building.name}</span>
                    <span class="building-count">${count}</span>
                </div>
                <div class="building-desc">${building.description}</div>
                <div class="building-cost">${formatCost(cost)}</div>
                <div class="building-produces">Produces: ${formatProduces(building.produces)}</div>
            `;
            div.onclick = () => build(type);
            container.appendChild(div);
        }
    }
    
    function formatCost(cost) {
        return Object.entries(cost)
            .map(([r, a]) => `${formatNumber(a)} ${r}`)
            .join(', ');
    }
    
    function formatProduces(produces) {
        return Object.entries(produces)
            .map(([r, a]) => `+${a}/sec ${r}`)
            .join(', ');
    }
    
    function renderUpgrades() {
        const container = document.getElementById('upgrades-list');
        container.innerHTML = '';
        
        for (const upgrade of upgradesList) {
            if (state.upgrades.includes(upgrade.id)) {
                const div = document.createElement('div');
                div.className = 'upgrade-card purchased';
                div.innerHTML = `
                    <div class="upgrade-name">${upgrade.name} ✓</div>
                    <div class="upgrade-desc">${upgrade.description}</div>
                `;
                container.appendChild(div);
                continue;
            }
            
            if (!upgrade.requires()) continue;
            
            const affordable = canAfford(upgrade.cost);
            const div = document.createElement('div');
            div.className = `upgrade-card ${affordable ? 'affordable' : 'unaffordable'}`;
            div.innerHTML = `
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-desc">${upgrade.description}</div>
                <div class="upgrade-cost">${formatCost(upgrade.cost)}</div>
            `;
            div.onclick = () => buyUpgrade(upgrade);
            container.appendChild(div);
        }
    }
    
    function updateUI() {
        document.getElementById('population-count').textContent = formatNumber(state.population);
        document.getElementById('population-rate').textContent = `+${formatNumber(state.popRate)}/sec`;
        
        document.getElementById('food-count').textContent = formatNumber(state.food);
        document.getElementById('food-rate').textContent = `+${formatNumber(state.foodRate)}/sec`;
        
        document.getElementById('tools-count').textContent = formatNumber(state.tools);
        document.getElementById('tools-rate').textContent = `+${formatNumber(state.toolsRate)}/sec`;
        
        document.getElementById('knowledge-count').textContent = formatNumber(state.knowledge);
        document.getElementById('knowledge-rate').textContent = `+${formatNumber(state.knowledgeRate)}/sec`;
        
        document.getElementById('culture-count').textContent = formatNumber(state.culture);
        document.getElementById('culture-rate').textContent = `+${formatNumber(state.cultureRate)}/sec`;
        
        document.getElementById('time-played').textContent = formatTime(Date.now() - state.startTime);
        document.getElementById('total-population').textContent = formatNumber(state.totalPopulation);
        document.getElementById('max-population').textContent = formatNumber(state.maxPopulation);
        
        renderBuildings();
    }
    
    // Game loop
    function gameLoop(timestamp) {
        if (!game.lastFrame) game.lastFrame = timestamp;
        const deltaTime = (timestamp - game.lastFrame) / 1000; // Convert to seconds
        game.lastFrame = timestamp;
        
        if (deltaTime > 0 && deltaTime < 1) { // Sanity check
            // Apply production
            state.food = state.food.plus(state.foodRate.times(deltaTime));
            state.tools = state.tools.plus(state.toolsRate.times(deltaTime));
            state.knowledge = state.knowledge.plus(state.knowledgeRate.times(deltaTime));
            state.culture = state.culture.plus(state.cultureRate.times(deltaTime));
            
            // Population growth
            const popGrowth = state.popRate.times(deltaTime);
            if (popGrowth.greaterThan(0)) {
                state.population = state.population.plus(popGrowth);
                state.totalPopulation = state.totalPopulation.plus(popGrowth);
                if (state.population.greaterThan(state.maxPopulation)) {
                    state.maxPopulation = new Decimal(state.population);
                }
            }
            
            // Food consumption (1 food per 10 population per second)
            const consumption = state.population.times(0.1).times(deltaTime);
            state.food = state.food.minus(consumption);
            
            // Prevent negative food
            if (state.food.lessThan(0)) state.food = new Decimal(0);
        }
        
        updateUI();
        requestAnimationFrame(gameLoop);
    }
    
    // Save system with error handling
    function saveGame() {
        try {
            const saveData = {
                population: state.population.toString(),
                food: state.food.toString(),
                tools: state.tools.toString(),
                knowledge: state.knowledge.toString(),
                culture: state.culture.toString(),
                buildings: state.buildings,
                upgrades: state.upgrades,
                totalPopulation: state.totalPopulation.toString(),
                maxPopulation: state.maxPopulation.toString(),
                startTime: state.startTime,
                lastSave: Date.now(),
                prestigeCount: state.prestigeCount,
                prestigePoints: state.prestigePoints.toString(),
                multipliers: game.multipliers,
                manualValues: {
                    food: state.manualFood,
                    tools: state.manualTools,
                    knowledge: state.manualKnowledge,
                    culture: state.manualCulture,
                    pop: state.manualPop
                }
            };
            
            const serialized = JSON.stringify(saveData);
            
            // Check quota before saving
            if (serialized.length > 5000000) {
                showMessage('Save too large! Please export.');
                return false;
            }
            
            localStorage.setItem(game.saveKey, serialized);
            state.lastSave = Date.now();
            showMessage('Game saved!');
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            showMessage('Save failed - try exporting instead');
            return false;
        }
    }
    
    function loadGame() {
        try {
            const serialized = localStorage.getItem(game.saveKey);
            if (!serialized) {
                // First time - calculate offline from start time
                state.lastSave = Date.now();
                return false;
            }
            
            let saveData;
            try {
                saveData = JSON.parse(serialized);
            } catch (e) {
                console.error('Corrupted save:', e);
                showMessage('Save corrupted - starting fresh');
                localStorage.removeItem(game.saveKey);
                return false;
            }
            
            // Restore state
            state.population = new Decimal(saveData.population || 0);
            state.food = new Decimal(saveData.food || 0);
            state.tools = new Decimal(saveData.tools || 0);
            state.knowledge = new Decimal(saveData.knowledge || 0);
            state.culture = new Decimal(saveData.culture || 0);
            state.buildings = saveData.buildings || {};
            state.upgrades = saveData.upgrades || [];
            state.totalPopulation = new Decimal(saveData.totalPopulation || 0);
            state.maxPopulation = new Decimal(saveData.maxPopulation || 0);
            state.startTime = saveData.startTime || Date.now();
            state.lastSave = saveData.lastSave || Date.now();
            state.prestigeCount = saveData.prestigeCount || 0;
            state.prestigePoints = new Decimal(saveData.prestigePoints || 0);
            
            if (saveData.multipliers) {
                game.multipliers = saveData.multipliers;
            }
            
            if (saveData.manualValues) {
                state.manualFood = saveData.manualValues.food || 1;
                state.manualTools = saveData.manualValues.tools || 0.5;
                state.manualKnowledge = saveData.manualValues.knowledge || 0.1;
                state.manualCulture = saveData.manualValues.culture || 0.05;
                state.manualPop = saveData.manualValues.pop || 1;
            }
            
            // Apply saved upgrades
            for (const upgradeId of state.upgrades) {
                const upgrade = upgradesList.find(u => u.id === upgradeId);
                if (upgrade) upgrade.effect();
            }
            
            // Calculate offline progress
            const offlineTime = (Date.now() - state.lastSave) / 1000;
            if (offlineTime > 5) { // Only if more than 5 seconds
                updateRates();
                
                const maxOffline = 86400; // Cap at 24 hours
                const effectiveTime = Math.min(offlineTime, maxOffline);
                
                state.food = state.food.plus(state.foodRate.times(effectiveTime));
                state.tools = state.tools.plus(state.toolsRate.times(effectiveTime));
                state.knowledge = state.knowledge.plus(state.knowledgeRate.times(effectiveTime));
                state.culture = state.culture.plus(state.cultureRate.times(effectiveTime));
                
                const popGrowth = state.popRate.times(effectiveTime);
                if (popGrowth.greaterThan(0)) {
                    state.population = state.population.plus(popGrowth);
                    state.totalPopulation = state.totalPopulation.plus(popGrowth);
                }
                
                const consumption = state.population.times(0.1).times(effectiveTime);
                state.food = state.food.minus(consumption);
                if (state.food.lessThan(0)) state.food = new Decimal(0);
                
                showMessage(`Welcome back! ${formatTime(offlineTime * 1000)} of progress calculated`);
            }
            
            updateRates();
            return true;
        } catch (e) {
            console.error('Load failed:', e);
            showMessage('Load failed - starting fresh');
            return false;
        }
    }
    
    function exportSave() {
        const serialized = localStorage.getItem(game.saveKey);
        if (!serialized) {
            showMessage('No save to export');
            return;
        }
        
        const blob = new Blob([serialized], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bantu-maximizer-save.json';
        a.click();
        URL.revokeObjectURL(url);
        showMessage('Save exported!');
    }
    
    function importSave(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = e.target.result;
                JSON.parse(data); // Validate JSON
                localStorage.setItem(game.saveKey, data);
                location.reload();
            } catch (err) {
                showMessage('Invalid save file');
            }
        };
        reader.readAsText(file);
    }
    
    function resetGame() {
        if (!confirm('Are you sure? All progress will be lost!')) return;
        localStorage.removeItem(game.saveKey);
        location.reload();
    }
    
    // Initialize
    function init() {
        // Cache DOM elements
        ui.population = document.getElementById('population-count');
        ui.food = document.getElementById('food-count');
        ui.tools = document.getElementById('tools-count');
        ui.knowledge = document.getElementById('knowledge-count');
        ui.culture = document.getElementById('culture-count');
        
        // Load game
        loadGame();
        
        // Setup event listeners - both click and touch
        const birthBtn = document.getElementById('birth-btn');
        const gatherFoodBtn = document.getElementById('gather-food-btn');
        const craftToolsBtn = document.getElementById('craft-tools-btn');
        const studyBtn = document.getElementById('study-btn');
        const createArtBtn = document.getElementById('create-art-btn');
        
        function addTouchHandler(element, callback) {
            element.addEventListener('click', callback);
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                callback();
            });
        }
        
        addTouchHandler(birthBtn, () => manualGather('pop'));
        addTouchHandler(gatherFoodBtn, () => manualGather('food'));
        addTouchHandler(craftToolsBtn, () => manualGather('tools'));
        addTouchHandler(studyBtn, () => manualGather('knowledge'));
        addTouchHandler(createArtBtn, () => manualGather('culture'));
        
        // Save controls
        document.getElementById('save-btn').addEventListener('click', saveGame);
        document.getElementById('export-btn').addEventListener('click', exportSave);
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        document.getElementById('import-file').addEventListener('change', (e) => {
            if (e.target.files[0]) importSave(e.target.files[0]);
        });
        document.getElementById('reset-btn').addEventListener('click', resetGame);
        
        // Auto-save every 30 seconds
        setInterval(saveGame, 30000);
        
        // Initial render
        renderBuildings();
        renderUpgrades();
        updateRates();
        updateUI();
        
        // Start game loop
        requestAnimationFrame(gameLoop);
    }
    
    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();