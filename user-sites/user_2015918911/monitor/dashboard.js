/**
 * Server Monitoring Dashboard - Frontend
 * Pure JavaScript, no external libraries
 * Uses Canvas for real-time charts
 */

// Configuration
const WS_URL = 'ws://' + window.location.hostname + ':8900';
const MAX_DATA_POINTS = 60;

// Data buffers for charts
const dataBuffers = {
    cpu: new Array(MAX_DATA_POINTS).fill(0),
    memory: new Array(MAX_DATA_POINTS).fill(0),
    disk: new Array(MAX_DATA_POINTS).fill(0),
    networkRecv: new Array(MAX_DATA_POINTS).fill(0),
    networkSent: new Array(MAX_DATA_POINTS).fill(0)
};

// Alert thresholds
let thresholds = {
    cpu: 80,
    memory: 85,
    disk: 90
};

// WebSocket connection
let ws = null;
let reconnectInterval = null;

// Chart colors
const CHART_COLORS = {
    cpu: '#00ff88',
    memory: '#00d4ff',
    disk: '#ffaa00',
    networkRecv: '#00ff88',
    networkSent: '#ff4444',
    grid: '#333',
    background: '#0a0a0a'
};

function connectWebSocket() {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    
    try {
        ws = new WebSocket(WS_URL);
        
        ws.onopen = () => {
            console.log('WebSocket connected');
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';
            
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleMessage(data);
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        };
        
        ws.onclose = () => {
            console.log('WebSocket disconnected');
            statusDot.classList.remove('connected');
            statusText.textContent = 'Disconnected - Reconnecting...';
            scheduleReconnect();
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            statusText.textContent = 'Connection Error';
        };
        
    } catch (e) {
        console.error('Error creating WebSocket:', e);
        scheduleReconnect();
    }
}

function scheduleReconnect() {
    if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
            console.log('Attempting to reconnect...');
            connectWebSocket();
        }, 3000);
    }
}

function handleMessage(data) {
    if (data.type === 'stats') {
        updateDashboard(data);
    } else if (data.type === 'history') {
        if (data.data && data.data.length > 0) {
            dataBuffers.cpu = data.data.map(d => d.system.cpu.percent);
            dataBuffers.memory = data.data.map(d => d.system.memory.percent);
            dataBuffers.disk = data.data.map(d => d.system.disk.percent);
            dataBuffers.networkRecv = data.data.map(d => d.system.network.recv_rate);
            dataBuffers.networkSent = data.data.map(d => d.system.network.sent_rate);
            
            while (dataBuffers.cpu.length < MAX_DATA_POINTS) {
                dataBuffers.cpu.unshift(0);
                dataBuffers.memory.unshift(0);
                dataBuffers.disk.unshift(0);
                dataBuffers.networkRecv.unshift(0);
                dataBuffers.networkSent.unshift(0);
            }
        }
    } else if (data.type === 'thresholds_updated') {
        thresholds = data.thresholds;
    }
}

function updateDashboard(data) {
    const system = data.system;
    const processes = data.processes;
    const logs = data.logs;
    
    if (data.thresholds) {
        thresholds = data.thresholds;
    }
    
    updateMetric('cpu', system.cpu.percent, system.cpu.count);
    updateMetric('memory', system.memory.percent, null, system.memory.used_gb, system.memory.total_gb);
    updateMetric('disk', system.disk.percent, null, system.disk.used_gb, system.disk.total_gb);
    
    document.getElementById('net-recv').textContent = system.network.recv_rate.toFixed(2);
    document.getElementById('net-sent').textContent = system.network.sent_rate.toFixed(2);
    
    dataBuffers.cpu.push(system.cpu.percent);
    dataBuffers.cpu.shift();
    dataBuffers.memory.push(system.memory.percent);
    dataBuffers.memory.shift();
    dataBuffers.disk.push(system.disk.percent);
    dataBuffers.disk.shift();
    dataBuffers.networkRecv.push(system.network.recv_rate);
    dataBuffers.networkRecv.shift();
    dataBuffers.networkSent.push(system.network.sent_rate);
    dataBuffers.networkSent.shift();
    
    drawChart('cpu-chart', dataBuffers.cpu, CHART_COLORS.cpu, 100);
    drawChart('memory-chart', dataBuffers.memory, CHART_COLORS.memory, 100);
    drawChart('disk-chart', dataBuffers.disk, CHART_COLORS.disk, 100);
    drawNetworkChart();
    
    updateAlerts(system.alerts);
    updateProcessList(processes);
    updateLogs(logs);
}

function updateMetric(type, value, extra1, extra2, extra3) {
    const valueEl = document.getElementById(type + '-value');
    const panel = document.getElementById(type + '-panel');
    
    valueEl.textContent = value.toFixed(1) + '%';
    
    valueEl.classList.remove('warning', 'alert');
    panel.classList.remove('alert');
    
    if (value > thresholds[type]) {
        valueEl.classList.add('alert');
        panel.classList.add('alert');
    } else if (value > thresholds[type] * 0.8) {
        valueEl.classList.add('warning');
    }
    
    if (type === 'cpu' && extra1) {
        document.getElementById('cpu-cores').textContent = extra1;
    } else if (type === 'memory' && extra2 && extra3) {
        document.getElementById('memory-used').textContent = extra2;
        document.getElementById('memory-total').textContent = extra3;
    } else if (type === 'disk' && extra2 && extra3) {
        document.getElementById('disk-used').textContent = extra2;
        document.getElementById('disk-total').textContent = extra3;
    }
}

function drawChart(canvasId, data, color, maxValue) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    
    ctx.fillStyle = CHART_COLORS.background;
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = CHART_COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();
    
    if (data.length > 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const stepX = width / (MAX_DATA_POINTS - 1);
        
        data.forEach((value, index) => {
            const x = index * stepX;
            const y = height - (value / maxValue) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = color + '33';
        ctx.fill();
    }
    
    ctx.fillStyle = color;
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    const currentValue = data[data.length - 1] || 0;
    ctx.fillText(currentValue.toFixed(1), width - 5, 15);
}

function drawNetworkChart() {
    const canvas = document.getElementById('network-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    
    const allValues = [...dataBuffers.networkRecv, ...dataBuffers.networkSent];
    const maxValue = Math.max(1, ...allValues) * 1.2;
    
    ctx.fillStyle = CHART_COLORS.background;
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = CHART_COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();
    
    drawNetworkLine(ctx, dataBuffers.networkRecv, CHART_COLORS.networkRecv, maxValue, width, height);
    drawNetworkLine(ctx, dataBuffers.networkSent, CHART_COLORS.networkSent, maxValue, width, height);
    
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = CHART_COLORS.networkRecv;
    ctx.fillText('▼ Recv', 5, 12);
    ctx.fillStyle = CHART_COLORS.networkSent;
    ctx.fillText('▲ Sent', 50, 12);
}

function drawNetworkLine(ctx, data, color, maxValue, width, height) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const stepX = width / (MAX_DATA_POINTS - 1);
    
    data.forEach((value, index) => {
        const x = index * stepX;
        const y = height - (value / maxValue) * height;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
}

function updateAlerts(alerts) {
    const container = document.getElementById('alerts-container');
    const panel = document.getElementById('alerts-panel');
    
    if (!alerts || alerts.length === 0) {
        container.innerHTML = '<span class="no-alerts">No active alerts</span>';
        panel.classList.remove('alert');
        return;
    }
    
    panel.classList.add('alert');
    container.innerHTML = alerts.map(alert => 
        `<div class="alert-item">${alert.type.toUpperCase()}: ${alert.message}</div>`
    ).join('');
}

function updateProcessList(processes) {
    const tbody = document.getElementById('process-list-body');
    
    if (!processes || processes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No process data available</td></tr>';
        return;
    }
    
    tbody.innerHTML = processes.map(proc => {
        const cpuClass = proc.cpu > 50 ? 'cpu-high' : '';
        return `
            <tr>
                <td>${proc.pid}</td>
                <td>${proc.name}</td>
                <td class="${cpuClass}">${proc.cpu}%</td>
                <td>${proc.memory}%</td>
            </tr>
        `;
    }).join('');
}

function updateLogs(logs) {
    const viewer = document.getElementById('log-viewer');
    
    if (!logs || logs.length === 0) {
        viewer.innerHTML = '<div class="log-entry">No log entries</div>';
        return;
    }
    
    viewer.innerHTML = logs.map(log => {
        let logClass = '';
        const lowerLog = log.toLowerCase();
        if (lowerLog.includes('error') || lowerLog.includes('fail') || lowerLog.includes('critical')) {
            logClass = 'error';
        } else if (lowerLog.includes('warning') || lowerLog.includes('warn')) {
            logClass = 'warning';
        } else if (lowerLog.includes('info')) {
            logClass = 'info';
        }
        return `<div class="log-entry ${logClass}">${escapeHtml(log)}</div>`;
    }).join('');
    
    viewer.scrollTop = viewer.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateThresholds() {
    const cpuThreshold = parseFloat(document.getElementById('cpu-threshold').value);
    const memoryThreshold = parseFloat(document.getElementById('memory-threshold').value);
    const diskThreshold = parseFloat(document.getElementById('disk-threshold').value);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            action: 'update_thresholds',
            thresholds: {
                cpu: cpuThreshold,
                memory: memoryThreshold,
                disk: diskThreshold
            }
        }));
    }
}

function init() {
    drawChart('cpu-chart', dataBuffers.cpu, CHART_COLORS.cpu, 100);
    drawChart('memory-chart', dataBuffers.memory, CHART_COLORS.memory, 100);
    drawChart('disk-chart', dataBuffers.disk, CHART_COLORS.disk, 100);
    drawNetworkChart();
    
    connectWebSocket();
    
    window.addEventListener('resize', () => {
        drawChart('cpu-chart', dataBuffers.cpu, CHART_COLORS.cpu, 100);
        drawChart('memory-chart', dataBuffers.memory, CHART_COLORS.memory, 100);
        drawChart('disk-chart', dataBuffers.disk, CHART_COLORS.disk, 100);
        drawNetworkChart();
    });
}

document.addEventListener('DOMContentLoaded', init);
