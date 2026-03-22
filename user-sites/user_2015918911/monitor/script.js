// Real-time monitoring dashboard frontend
// No external libraries - pure JavaScript and Canvas

// Global state
let ws = null;
let reconnectInterval = 3000;
let maxDataPoints = 60;
let dataHistory = {
    cpu: [],
    memory: [],
    disk: [],
    networkSent: [],
    networkRecv: [],
    timestamps: []
};
let lastNetworkStats = { sent: 0, recv: 0 };

// Canvas contexts
const cpuCtx = document.getElementById('cpuChart').getContext('2d');
const memoryCtx = document.getElementById('memoryChart').getContext('2d');
const diskCtx = document.getElementById('diskChart').getContext('2d');
const networkCtx = document.getElementById('networkChart').getContext('2d');

// Initialize canvas
function initCanvas(ctx, color) {
    ctx.canvas.width = ctx.canvas.parentElement.clientWidth;
    ctx.canvas.height = 200;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
}

// Draw line chart
function drawChart(ctx, data, color, threshold = null) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 20;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
        const y = padding + (i * graphHeight / 10);
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
    }
    for (let i = 0; i <= 10; i++) {
        const x = padding + (i * graphWidth / 10);
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
    }
    ctx.stroke();
    
    // Draw threshold line
    if (threshold !== null) {
        const y = height - padding - (threshold * graphHeight / 100);
        ctx.strokeStyle = 'rgba(255, 87, 34, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 87, 34, 0.7)';
        ctx.fillText(`Threshold: ${threshold}%`, width - 100, y - 5);
    }
    
    // Draw data line
    if (data.length < 2) return;
    
    const maxValue = Math.max(...data, 1);
    const xStep = graphWidth / (maxDataPoints - 1);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < data.length; i++) {
        const x = padding + i * xStep;
        const y = height - padding - (data[i] * graphHeight / maxValue);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    // Draw data points
    ctx.fillStyle = color;
    for (let i = 0; i < data.length; i++) {
        const x = padding + i * xStep;
        const y = height - padding - (data[i] * graphHeight / maxValue);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw network chart (two lines: sent and received)
function drawNetworkChart(ctx, sentData, recvData) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 20;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
        const y = padding + (i * graphHeight / 10);
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
    }
    for (let i = 0; i <= 10; i++) {
        const x = padding + (i * graphWidth / 10);
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
    }
    ctx.stroke();
    
    // Find max value for scaling
    const allData = [...sentData, ...recvData];
    const maxValue = Math.max(...allData, 1);
    
    // Draw sent line (blue)
    if (sentData.length >= 2) {
        const xStep = graphWidth / (maxDataPoints - 1);
        ctx.strokeStyle = '#00b4db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < sentData.length; i++) {
            const x = padding + i * xStep;
            const y = height - padding - (sentData[i] * graphHeight / maxValue);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    // Draw received line (green)
    if (recvData.length >= 2) {
        const xStep = graphWidth / (maxDataPoints - 1);
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < recvData.length; i++) {
            const x = padding + i * xStep;
            const y = height - padding - (recvData[i] * graphHeight / maxValue);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    // Legend
    ctx.fillStyle = '#00b4db';
    ctx.fillText('Sent', width - 100, padding + 20);
    ctx.fillStyle = '#00e676';
    ctx.fillText('Received', width - 100, padding + 40);
}

// Update process table
function updateProcessTable(processes) {
    const tbody = document.querySelector('#process-table tbody');
    tbody.innerHTML = '';
    
    processes.forEach(proc => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${proc.pid}</td>
            <td>${proc.name}</td>
            <td>${proc.cpu_percent.toFixed(1)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update log display
function updateLogs(logLines) {
    const container = document.getElementById('log-container');
    container.innerHTML = '';
    
    logLines.forEach(line => {
        const div = document.createElement('div');
        div.className = 'log-line';
        // Simple classification
        if (line.includes('error') || line.includes('Error') || line.includes('ERROR')) {
            div.classList.add('error');
        } else if (line.includes('warning') || line.includes('Warning') || line.includes('WARNING')) {
            div.classList.add('warning');
        } else {
            div.classList.add('info');
        }
        div.textContent = line.length > 120 ? line.substring(0, 120) + '...' : line;
        container.appendChild(div);
    });
}

// Update alerts display
function updateAlerts(alerts) {
    const container = document.getElementById('alerts-container');
    container.innerHTML = '';
    
    if (alerts.cpu) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert cpu';
        alertDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> CPU usage above 80% threshold!';
        container.appendChild(alertDiv);
    }
    if (alerts.memory) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert memory';
        alertDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Memory usage above 85% threshold!';
        container.appendChild(alertDiv);
    }
    if (alerts.disk) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert disk';
        alertDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Disk usage above 90% threshold!';
        container.appendChild(alertDiv);
    }
}

// Update stats display
function updateStatsDisplay(data) {
    // CPU
    document.getElementById('cpu-current').textContent = data.cpu_percent.toFixed(1);
    const cpuMax = Math.max(...dataHistory.cpu, data.cpu_percent);
    document.getElementById('cpu-max').textContent = cpuMax.toFixed(1);
    
    // Memory
    document.getElementById('memory-current').textContent = data.memory_percent.toFixed(1);
    const usedGB = (data.memory_used / 1024**3).toFixed(2);
    const totalGB = (data.memory_total / 1024**3).toFixed(2);
    document.getElementById('memory-used').textContent = usedGB;
    document.getElementById('memory-total').textContent = totalGB;
    
    // Disk
    document.getElementById('disk-current').textContent = data.disk_percent.toFixed(1);
    const diskUsedGB = (data.disk_used / 1024**3).toFixed(2);
    const diskTotalGB = (data.disk_total / 1024**3).toFixed(2);
    document.getElementById('disk-used').textContent = diskUsedGB;
    document.getElementById('disk-total').textContent = diskTotalGB;
    
    // Network
    const sentMB = (data.network_sent / 1024**2).toFixed(2);
    const recvMB = (data.network_recv / 1024**2).toFixed(2);
    document.getElementById('network-sent').textContent = sentMB;
    document.getElementById('network-recv').textContent = recvMB;
    
    // Calculate network rate (difference per second)
    if (lastNetworkStats.sent > 0 && lastNetworkStats.recv > 0) {
        const timeDiff = 2; // assuming 2 seconds between updates
        const sentRate = (data.network_sent - lastNetworkStats.sent) / timeDiff / 1024;
        const recvRate = (data.network_recv - lastNetworkStats.recv) / timeDiff / 1024;
        const totalRate = sentRate + recvRate;
        document.getElementById('network-rate').textContent = totalRate.toFixed(1);
    }
    lastNetworkStats.sent = data.network_sent;
    lastNetworkStats.recv = data.network_recv;
    
    // Update timestamp
    const now = new Date();
    document.getElementById('last-update').textContent = `Last update: ${now.toLocaleTimeString()}`;
    document.getElementById('server-time').textContent = `Server time: ${new Date(data.timestamp * 1000).toLocaleTimeString()}`;
}

// Process incoming data
function processData(data) {
    // Add to history
    dataHistory.cpu.push(data.cpu_percent);
    dataHistory.memory.push(data.memory_percent);
    dataHistory.disk.push(data.disk_percent);
    dataHistory.networkSent.push(data.network_sent / 1024); // Convert to KB for chart scaling
    dataHistory.networkRecv.push(data.network_recv / 1024);
    dataHistory.timestamps.push(data.timestamp);
    
    // Keep only last N points
    if (dataHistory.cpu.length > maxDataPoints) {
        dataHistory.cpu.shift();
        dataHistory.memory.shift();
        dataHistory.disk.shift();
        dataHistory.networkSent.shift();
        dataHistory.networkRecv.shift();
        dataHistory.timestamps.shift();
    }
    
    // Update displays
    updateStatsDisplay(data);
    updateProcessTable(data.processes);
    updateLogs(data.log_lines);
    updateAlerts(data.alerts);
    
    // Redraw charts
    drawChart(cpuCtx, dataHistory.cpu, '#ff4081', 80);
    drawChart(memoryCtx, dataHistory.memory, '#00bcd4', 85);
    drawChart(diskCtx, dataHistory.disk, '#ff9800', 90);
    drawNetworkChart(networkCtx, dataHistory.networkSent, dataHistory.networkRecv);
}

// WebSocket connection
function connectWebSocket() {
    const wsUrl = `ws://${window.location.hostname}:8900`;
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
        const status = document.getElementById('connection-status');
        status.textContent = 'WebSocket: Connected';
        status.className = 'status online';
        reconnectInterval = 3000;
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            processData(data);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected');
        const status = document.getElementById('connection-status');
        status.textContent = 'WebSocket: Disconnected';
        status.className = 'status offline';
        
        // Attempt reconnect
        setTimeout(connectWebSocket, reconnectInterval);
        reconnectInterval = Math.min(reconnectInterval * 1.5, 30000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Initialize dashboard
function initDashboard() {
    // Initialize canvas contexts
    initCanvas(cpuCtx, '#ff4081');
    initCanvas(memoryCtx, '#00bcd4');
    initCanvas(diskCtx, '#ff9800');
    initCanvas(networkCtx, '#00b4db');
    
    // Connect WebSocket
    connectWebSocket();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        initCanvas(cpuCtx, '#ff4081');
        initCanvas(memoryCtx, '#00bcd4');
        initCanvas(diskCtx, '#ff9800');
        initCanvas(networkCtx, '#00b4db');
        
        // Redraw charts with current data
        if (dataHistory.cpu.length > 0) {
            drawChart(cpuCtx, dataHistory.cpu, '#ff4081', 80);
            drawChart(memoryCtx, dataHistory.memory, '#00bcd4', 85);
            drawChart(diskCtx, dataHistory.disk, '#ff9800', 90);
            drawNetworkChart(networkCtx, dataHistory.networkSent, dataHistory.networkRecv);
        }
    });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
