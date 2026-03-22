import sys
html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>COVID‑19 Style Epidemic Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
            color: #f0f0f0;
            min-height: 100vh;
            padding: 20px;
            overflow-x: hidden;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        h1 {
            font-size: 2.5rem;
            margin-bottom: 8px;
            background: linear-gradient(90deg, #00dbde, #fc00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .subtitle {
            font-size: 1rem;
            opacity: 0.8;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.5;
        }

        .dashboard {
            display: grid;
            grid-template-columns: 280px 1fr;
            gap: 30px;
            max-width: 1600px;
            margin: 0 auto;
        }

        @media (max-width: 1100px) {
            .dashboard {
                grid-template-columns: 1fr;
            }
        }

        /* Sidebar */
        .sidebar {
            background: rgba(20, 20, 40, 0.7);
            border-radius: 20px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(100, 100, 255, 0.2);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .sidebar h2 {
            font-size: 1.3rem;
            margin-bottom: 20px;
            color: #6ee7b7;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .sidebar h2::before {
            content: '⚙️';
        }

        .country-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 30px;
            max-height: 400px;
            overflow-y: auto;
            padding-right: 10px;
        }

        .country-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 15px;
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
        }

        .country-item:hover {
            background: rgba(255,255,255,0.1);
            border-color: rgba(100, 150, 255, 0.3);
        }

        .country-item input {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .country-color {
            width: 24px;
            height: 4px;
            border-radius: 2px;
        }

        .country-name {
            flex: 1;
            font-weight: 500;
        }

        .country-total {
            font-size: 0.9rem;
            opacity: 0.8;
        }

        /* Controls */
        .controls {
            margin-top: 30px;
        }

        .control-group {
            margin-bottom: 25px;
        }

        .control-group h3 {
            font-size: 1rem;
            margin-bottom: 12px;
            color: #93c5fd;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .slider-container {
            background: rgba(0,0,0,0.3);
            border-radius: 10px;
            padding: 15px;
        }

        .date-slider {
            width: 100%;
            height: 8px;
            -webkit-appearance: none;
            background: linear-gradient(90deg, #00dbde, #fc00ff);
            border-radius: 4px;
            outline: none;
            margin-bottom: 15px;
        }

        .date-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            border: 3px solid #00dbde;
        }

        .date-display {
            display: block;
            text-align: center;
            font-size: 1.2rem;
            font-weight: bold;
            color: #00dbde;
        }

        .buttons {
            display: flex;
            gap: 12px;
            margin-top: 20px;
        }

        .btn {
            flex: 1;
            padding: 14px;
            border: none;
            border-radius: 10px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 1rem;
        }

        .btn-primary {
            background: linear-gradient(90deg, #00dbde, #0093e9);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 147, 233, 0.4);
        }

        .btn-secondary {
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
        }

        .btn-secondary:hover {
            background: rgba(255,255,255,0.2);
        }

        /* Main charts */
        .main {
            display: flex;
            flex-direction: column;
            gap: 30px;
        }

        .chart-container {
            background: rgba(20, 20, 40, 0.7);
            border-radius: 20px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(100, 100, 255, 0.2);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
        }

        .chart-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #f8fafc;
        }

        .chart-actions {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .toggle {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 30px;
        }

        .toggle input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #334155;
            border-radius: 34px;
            transition: .4s;
        }

        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            border-radius: 50%;
            transition: .4s;
        }

        input:checked + .toggle-slider {
            background-color: #00dbde;
        }

        input:checked + .toggle-slider:before {
            transform: translateX(30px);
        }

        .toggle-label {
            margin-left: 70px;
            font-weight: 500;
        }

        .canvas-wrapper {
            position: relative;
            width: 100%;
            height: 400px;
        }

        canvas {
            border-radius: 12px;
            background: rgba(0, 0, 0, 0.3);
            display: block;
        }

        /* Bottom charts grid */
        .bottom-charts {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }

        @media (max-width: 900px) {
            .bottom-charts {
                grid-template-columns: 1fr;
            }
        }

        .bottom-charts .canvas-wrapper {
            height: 350px;
        }

        /* Map grid */
        .map-grid {
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            grid-template-rows: repeat(6, 1fr);
            gap: 4px;
            width: 100%;
            height: 100%;
        }

        .map-cell {
            border-radius: 4px;
            transition: all 0.3s;
            position: relative;
            cursor: pointer;
        }

        .map-cell:hover {
            transform: scale(1.05);
            z-index: 10;
            box-shadow: 0 0 15px rgba(255,255,255,0.3);
        }

        .map-cell-label {
            position: absolute;
            top: 2px;
            left: 2px;
            font-size: 10px;
            color: white;
            text-shadow: 0 1px 2px black;
            pointer-events: none;
        }

        /* Footer */
        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 0.9rem;
            opacity: 0.7;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }

        /* Animation for line chart */
        @keyframes pulse {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
        }

        .pulse {
            animation: pulse 2s infinite;
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #00dbde, #fc00ff);
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌍 COVID‑19 Style Epidemic Dashboard</h1>
        <p class="subtitle">Interactive visualization of simulated epidemic data across 10 countries. Use the slider to scrub through time, toggle countries, and switch between linear and logarithmic scales.</p>
    </div>

    <div class="dashboard">
        <!-- Sidebar -->
        <div class="sidebar">
            <h2>Dashboard Controls</h2>
            
            <div class="country-list" id="countryList">
                <!-- Country checkboxes will be inserted here -->
            </div>

            <div class="controls">
                <div class="control-group">
                    <h3>📅 Time Scrubber</h3>
                    <div class="slider-container">
                        <input type="range" class="date-slider" id="dateSlider" min="0" max="364" value="364">
                        <span class="date-display" id="dateDisplay">Day 364 (Dec 31)</span>
                    </div>
                </div>

                <div class="control-group">
                    <h3>📊 Scale Mode</h3>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <label class="toggle">
                            <input type="checkbox" id="logToggle">
                            <span class="toggle-slider"></span>
                        </label>
                        <span class="toggle-label" id="scaleLabel">Linear Scale</span>
                    </div>
                    <p style="margin-top: 10px; font-size: 0.9rem; opacity: 0.8;">Logarithmic scale helps visualize exponential growth.</p>
                </div>

                <div class="buttons">
                    <button class="btn btn-primary" id="playBtn">
                        <span id="playIcon">▶️</span>
                        <span id="playText">Play</span>
                    </button>
                    <button class="btn btn-secondary" id="resetBtn">
                        🔄 Reset
                    </button>
                </div>
            </div>
        </div>

        <!-- Main content -->
        <div class="main">
            <!-- Line chart -->
            <div class="chart-container">
                <div class="chart-header">
                    <span class="chart-title">📈 Daily New Cases Over Time</span>
                    <div class="chart-actions">
                        <span style="opacity: 0.8; font-size: 0.9rem;">Animation:</span>
                        <label class="toggle">
                            <input type="checkbox" id="animationToggle" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                <div class="canvas-wrapper">
                    <canvas id="lineChart"></canvas>
                </div>
            </div>

            <!-- Bottom charts -->
            <div class="bottom-charts">
                <!-- Bar chart -->
                <div class="chart-container">
                    <div class="chart-header">
                        <span class="chart-title">📊 Total Cases by Country</span>
                    </div>
                    <div class="canvas-wrapper">
                        <canvas id="barChart"></canvas>
                    </div>
                </div>

                <!-- World map grid -->
                <div class="chart-container">
                    <div class="chart-header">
                        <span class="chart-title">🗺️ Global Severity Heatmap</span>
                    </div>
                    <div class="canvas-wrapper">
                        <canvas id="mapChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Simulated epidemic data for demonstration purposes. Built with pure HTML5 Canvas • No external libraries • Data updates in real‑time</p>
        <p style="margin-top: 5px;">Drag the slider or press Play to animate the pandemic progression.</p>
    </div>

    <script>
        // ====================
        // Configuration
        // ====================
        const COUNTRIES = [
            { name: 'United States', color: '#FF6B6B', row: 2, col: 2, population: 331e6 },
            { name: 'China', color: '#4ECDC4', row: 2, col: 7, population: 1439e6 },
            { name: 'Brazil', color: '#FFE66D', row: 5, col: 3, population: 213e6 },
            { name: 'India', color: '#95E1D3', row: 3, col: 6, population: 1380e6 },
            { name: 'Russia', color: '#F38181', row: 1, col: 6, population: 146e6 },
            { name: 'Germany', color: '#AA96DA', row: 1, col: 4, population: 83e6 },
            { name: 'Japan', color: '#FCBAD3', row: 2, col: 8, population: 126e6 },
            { name: 'United Kingdom', color: '#A8D8EA', row: 1, col: 3, population: 67e6 },
            { name: 'France', color: '#FFD93D', row: 1, col: 3, population: 65e6 },
            { name: 'Italy', color: '#6BCB77', row: 2, col: 4, population: 60e6 }
        ];

        const DAYS = 365;
        const GRID_ROWS = 6;
        const GRID_COLS = 10;

        // ====================
        // Data Generation
        // ====================
        function generateEpidemicData() {
            const data = {};
            const startDate = new Date(2023, 0, 1); // Jan 1, 2023

            COUNTRIES.forEach(country => {
                const cases = [];
                const totalCases = [];
                let cumulative = 0;

                // Epidemiological parameters
                const peakDay = 80 + Math.random() * 120;
                const peakIntensity = 0.001 + Math.random() * 0.005; // fraction of population
                const spread = 30 + Math.random() * 40;
                const secondWave = Math.random() > 0.7;
                const secondPeakDay = peakDay + 90 + Math.random() * 60;
                const secondIntensity = peakIntensity * (0.3 + Math.random() * 0.5);

                for (let day = 0; day < DAYS; day++) {
                    // Double sigmoid to simulate waves
                    let daily = 0;
                    const firstWave = peakIntensity * Math.exp(-Math.pow(day - peakDay, 2) / (2 * spread * spread));
                    daily += firstWave;

                    if (secondWave) {
                        const secondWaveVal = secondIntensity * Math.exp(-Math.pow(day - secondPeakDay, 2) / (2 * spread * spread));
                        daily += secondWaveVal;
                    }

                    // Weekly seasonality
                    const seasonality = 1 + 0.3 * Math.sin(day * 2 * Math.PI / 7);
                    daily *= seasonality;

                    // Noise
                    daily *= (0.8 + Math.random() * 0.4);

                    // Convert to absolute cases
                    const absolute = Math.round(daily * country.population);
                    cases.push(Math.max(0, absolute));
                    cumulative += absolute;
                    totalCases.push(cumulative);
                }

                data[country.name] = { daily: cases, total: totalCases };
            });

            return data;
        }

        // ====================
        // State
        // ====================
        let epidemicData = generateEpidemicData();
        let currentDay = DAYS - 1;
        let isPlaying = false;
        let animationId = null;
        let isLogScale = false;
        let selectedCountries = COUNTRIES.map(c => c.name); // all selected initially

        // ====================
        // DOM Elements
        // ====================
        const lineCanvas = document.getElementById('lineChart');
        const barCanvas = document.getElementById('barChart');
        const mapCanvas = document.getElementById('mapChart');
        const dateSlider = document.getElementById('dateSlider');
        const dateDisplay = document.getElementById('dateDisplay');
        const playBtn = document.getElementById('playBtn');
        const playIcon = document.getElementById('playIcon');
        const playText = document.getElementById('playText');
        const resetBtn = document.getElementById('resetBtn');
        const logToggle = document.getElementById('logToggle');
        const scaleLabel = document.getElementById('scaleLabel');
        const animationToggle = document.getElementById('animationToggle');
        const countryList = document.getElementById('countryList');

        // ====================
        // Canvas Setup
        // ====================
        function setupCanvas(canvas) {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            return { ctx, width: rect.width, height: rect.height };
        }

        // ====================
        // Drawing Functions
        // ====================
        function drawLineChart() {
            const { ctx, width, height } = setupCanvas(lineCanvas);
            ctx.clearRect(0, 0, width, height);

            const padding = { top: 40, right: 30, bottom: 60, left: 70 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;

            // Determine Y scale
            let maxDaily = 0;
            selectedCountries.forEach(name => {
                maxDaily = Math.max(maxDaily, epidemicData[name].daily[currentDay]);
            });

            if (isLogScale) {
                maxDaily = Math.log10(Math.max(1, maxDaily));
            }

            // Grid
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            const gridLines = 8;
            for (let i = 0; i <= gridLines; i++) {
                const y = padding.top + (chartHeight * (1 - i / gridLines));
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(padding.left + chartWidth, y);
                ctx.stroke();

                // Y labels
                let value;
                if (isLogScale) {
                    value = Math.pow(10, maxDaily * (i / gridLines)).toLocaleString();
                } else {
                    value = Math.round(maxDaily * (i / gridLines)).toLocaleString();
                }
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '12px monospace';
                ctx.textAlign = 'right';
                ctx.fillText(value, padding.left - 10, y + 4);
            }

            // X axis labels (months)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let i = 0; i < 12; i++) {
                const x = padding.left + (chartWidth * i / 11);
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(months[i], x, height - padding.bottom + 20);
            }

            // Axes
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(padding.left, padding.top);
            ctx.lineTo(padding.left, padding.top + chartHeight);
            ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
            ctx.stroke();

            // Draw lines for each selected country
            selectedCountries.forEach(name => {
                const country = COUNTRIES.find(c => c.name === name);
                const data = epidemicData[name].daily;
                const maxVal = Math.max(...data);
                const logMax = Math.log10(Math.max(1, maxVal));

                ctx.strokeStyle = country.color;
                ctx.lineWidth = 3;
                ctx.lineJoin = 'round';
                ctx.beginPath();

                for (let day = 0; day <= currentDay; day++) {
                    let value = data[day];
                    if (isLogScale) {
                        value = Math.log10(Math.max(1, value));
                    }
                    const x = padding.left + (chartWidth * day / (DAYS - 1));
                    const y = padding.top + chartHeight - (chartHeight * (value / (isLogScale ? logMax : maxVal)));

                    if (day === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();

                // Current day marker
                const currentValue = data[currentDay];
                let currentY = padding.top + chartHeight;
                if (currentValue > 0) {
                    let val = isLogScale ? Math.log10(currentValue) : currentValue;
                    currentY = padding.top + chartHeight - (chartHeight * (val / (isLogScale ? logMax : maxVal)));
                }
                const currentX = padding.left + (chartWidth * currentDay / (DAYS - 1));
                ctx.fillStyle = country.color;
                ctx.beginPath();
                ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(currentValue.toLocaleString(), currentX, currentY - 12);
            });

            // Title
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Daily New Cases ' + (isLogScale ? '(Log Scale)' : '(Linear Scale)'), padding.left, padding.top - 10);
        }

        function drawBarChart() {
            const { ctx, width, height } = setupCanvas(barCanvas);
            ctx.clearRect(0, 0, width, height);

            const padding = { top: 40, right: 20, bottom: 80, left: 100 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;

            // Determine max total
            let maxTotal = 0;
            selectedCountries.forEach(name => {
                maxTotal = Math.max(maxTotal, epidemicData[name].total[currentDay]);
            });

            if (isLogScale) {
                maxTotal = Math.log10(Math.max(1, maxTotal));
            }

            const barCount = selectedCountries.length;
            const barWidth = Math.min(40, chartWidth / (barCount * 1.5));
            const spacing = (chartWidth - barCount * barWidth) / (barCount + 1);

            // Draw bars
            selectedCountries.forEach((name, idx) => {
                const country = COUNTRIES.find(c => c.name === name);
                const total = epidemicData[name].total[currentDay];
                let value = total;
                if (isLogScale) {
                    value = Math.log10(Math.max(1, total));
                }

                const x = padding.left + spacing + idx * (barWidth + spacing);
                const barHeight = (value / maxTotal) * chartHeight;
                const y = padding.top + chartHeight - barHeight;

                // Bar
                ctx.fillStyle = country.color;
                ctx.fillRect(x, y, barWidth, barHeight);

                // Shadow effect
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(x + 4, y + 4, barWidth, barHeight);

                // Value label
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(total.toLocaleString(), x + barWidth / 2, y - 8);

                // Country label
                ctx.save();
                ctx.translate(x + barWidth / 2, padding.top + chartHeight + 25);
                ctx.rotate(-Math.PI / 4);
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.font = '11px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(country.name, 0, 0);
                ctx.restore();
            });

            // Axes
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(padding.left, padding.top);
            ctx.lineTo(padding.left, padding.top + chartHeight);
            ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
            ctx.stroke();

            // Title
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Cumulative Cases by Country', padding.left, padding.top - 10);
        }

        function drawMap() {
            const { ctx, width, height } = setupCanvas(mapCanvas);
            ctx.clearRect(0, 0, width, height);

            const padding = 20;
            const cellSize = Math.min((width - 2 * padding) / GRID_COLS, (height - 2 * padding) / GRID_ROWS);
            const offsetX = (width - GRID_COLS * cellSize) / 2;
            const offsetY = (height - GRID_ROWS * cellSize) / 2;

            // Draw grid background
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            for (let row = 0; row < GRID_ROWS; row++) {
                for (let col = 0; col < GRID_COLS; col++) {
                    const x = offsetX + col * cellSize;
                    const y = offsetY + row * cellSize;
                    ctx.fillRect(x, y, cellSize, cellSize);
                }
            }

            // Determine max severity for coloring
            let maxSeverity = 0;
            COUNTRIES.forEach(country => {
                const severity = epidemicData[country.name].daily[currentDay] / country.population;
                maxSeverity = Math.max(maxSeverity, severity);
            });

            // Draw countries
            COUNTRIES.forEach(country => {
                const severity = epidemicData[country.name].daily[currentDay] / country.population;
                const intensity = Math.min(1, severity / maxSeverity);
                const x = offsetX + (country.col - 1) * cellSize;
                const y = offsetY + (country.row - 1) * cellSize;

                // Color gradient from green to red
                const r = Math.round(255 * intensity);
                const g = Math.round(255 * (1 - intensity));
                const b = 50;
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, y, cellSize, cellSize);

                // Border
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, cellSize, cellSize);

                // Country label
                ctx.fillStyle = intensity > 0.5 ? 'white' : 'black';
                ctx.font = 'bold ' + Math.max(10, cellSize * 0.4) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const label = country.name.substring(0, 3).toUpperCase();
                ctx.fillText(label, x + cellSize / 2, y + cellSize / 2);
            });

            // Legend
            const legendWidth = 200;
            const legendHeight = 20;
            const legendX = width - legendWidth - 20;
            const legendY = 20;
            const gradient = ctx.createLinearGradient(legendX, legendY, legendX + legendWidth, legendY);
            gradient.addColorStop(0, 'green');
            gradient.addColorStop(0.5, 'yellow');
            gradient.addColorStop(1, 'red');
            ctx.fillStyle = gradient;
            ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Low', legendX, legendY + legendHeight + 15);
            ctx.fillText('High', legendX + legendWidth, legendY + legendHeight + 15);
            ctx.textAlign = 'left';
            ctx.fillText('Infection rate per capita', legendX, legendY - 8);
        }

        // ====================
        // UI Rendering
        // ====================
        function renderCountryList() {
            countryList.innerHTML = '';
            COUNTRIES.forEach(country => {
                const total = epidemicData[country.name].total[currentDay];
                const div = document.createElement('div');
                div.className = 'country-item';
                div.innerHTML = `
                    <input type="checkbox" id="check_${country.name}" ${selectedCountries.includes(country.name) ? 'checked' : ''}>
                    <div class="country-color" style="background: ${country.color};"></div>
                    <div class="country-name">${country.name}</div>
                    <div class="country-total">${total.toLocaleString()}</div>
                `;
                div.querySelector('input').addEventListener('change', (e) => {
                    if (e.target.checked) {
                        if (!selectedCountries.includes(country.name)) {
                            selectedCountries.push(country.name);
                        }
                    } else {
                        const idx = selectedCountries.indexOf(country.name);
                        if (idx > -1) selectedCountries.splice(idx, 1);
                    }
                    redrawAll();
                });
                countryList.appendChild(div);
            });
        }

        function updateDateDisplay() {
            const date = new Date(2023, 0, currentDay + 1);
            const options = { month: 'short', day: 'numeric' };
            dateDisplay.textContent = `Day ${currentDay + 1} (${date.toLocaleDateString('en-US', options)})`;
            dateSlider.value = currentDay;
        }

        function redrawAll() {
            drawLineChart();
            drawBarChart();
            drawMap();
            renderCountryList();
        }

        // ====================
        // Animation
        // ====================
        function playAnimation() {
            if (!isPlaying) return;
            currentDay = (currentDay + 1) % DAYS;
            updateDateDisplay();
            redrawAll();
            if (animationToggle.checked) {
                animationId = setTimeout(playAnimation, 100);
            } else {
                animationId = null;
            }
        }

        function togglePlay() {
            isPlaying = !isPlaying;
            if (isPlaying) {
                playIcon.textContent = '⏸️';
                playText.textContent = 'Pause';
                playAnimation();
            } else {
                playIcon.textContent = '▶️';
                playText.textContent = 'Play';
                if (animationId) {
                    clearTimeout(animationId);
                    animationId = null;
                }
            }
        }

        // ====================
        // Event Listeners
        // ====================
        dateSlider.addEventListener('input', (e) => {
            currentDay = parseInt(e.target.value);
            updateDateDisplay();
            redrawAll();
        });

        playBtn.addEventListener('click', togglePlay);

        resetBtn.addEventListener('click', () => {
            currentDay = 0;
            updateDateDisplay();
            redrawAll();
        });

        logToggle.addEventListener('change', (e) => {
            isLogScale = e.target.checked;
            scaleLabel.textContent = isLogScale ? 'Logarithmic Scale' : 'Linear Scale';
            redrawAll();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            redrawAll();
        });

        // ====================
        // Initialization
        // ====================
        function init() {
            updateDateDisplay();
            renderCountryList();
            redrawAll();
        }

        // Start
        init();
    </script>
</body>
</html>"""

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)
print("Dashboard written successfully.")
