/**
 * Main dashboard WebSocket client and data manager.
 */
class Dashboard {
    constructor() {
        this.ws = null;
        this.reconnectInterval = 3000;
        this.maxDataPoints = 60; // 2 minutes at 2-second intervals
        this.data = {
            cpu: [],
            memory: [],
            disk: [],
            network: []
        };
        this.currentStats = null;
        this.uptimeStart = Date.now();
        this.init();
    }

    init() {
        this.connectWebSocket();
        this.setupEventListeners();
        this.updateUptime();
        setInterval(() => this.updateUptime(), 1000);
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = 8900;
        const wsUrl = `${protocol}//${host}:${port}`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.updateStatus('connected');
            this.updateConnectionInfo(`Connected to ${wsUrl}`);
        };
        
        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (e) {
                console.error('Failed to parse WebSocket message:', e);
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateStatus('error');
            this.updateConnectionInfo(`Connection error: ${error.message || 'Unknown error'}`);
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket disconnected, attempting reconnect...');
            this.updateStatus('disconnected');
            this.updateConnectionInfo('Disconnected. Reconnecting...');
            setTimeout(() => this.connectWebSocket(), this.reconnectInterval);
        };
    }

    handleMessage(message) {
        const { type, data } = message;
        
        switch (type) {
            case 'stats':
                this.currentStats = data;
                this.updateDataArrays(data);
                this.updateCharts();
                this.updateMetrics();
                this.updateProcessTable(data.processes || []);
                this.checkAlerts(data);
                this.updateLastUpdate();
                break;
                
            case 'log':
                if (window.LogViewer) {
                    window.LogViewer.addLogEntries(data);
                }
                break;
                
            case 'pong':
                // Keep alive response
                break;
                
            default:
                console.log('Unknown message type:', type);
        }
    }

    updateDataArrays(stats) {
        const timestamp = stats.timestamp || Date.now() / 1000;
        
        // CPU
        this.data.cpu.push({
            time: timestamp,
            value: stats.cpu?.total || 0
        });
        if (this.data.cpu.length > this.maxDataPoints) {
            this.data.cpu.shift();
        }
        
        // Memory
        this.data.memory.push({
            time: timestamp,
            value: stats.memory?.percent || 0
        });
        if (this.data.memory.length > this.maxDataPoints) {
            this.data.memory.shift();
        }
        
        // Disk - use first partition percent or average
        let diskPercent = 0;
        if (stats.disk?.partitions?.length > 0) {
            diskPercent = stats.disk.partitions[0].percent;
        }
        this.data.disk.push({
            time: timestamp,
            value: diskPercent
        });
        if (this.data.disk.length > this.maxDataPoints) {
            this.data.disk.shift();
        }
        
        // Network - total bytes per second
        let networkRate = 0;
        if (stats.network?.rates) {
            networkRate = (stats.network.rates.bytes_sent_per_sec || 0) + 
                         (stats.network.rates.bytes_recv_per_sec || 0);
        }
        this.data.network.push({
            time: timestamp,
            value: networkRate
        });
        if (this.data.network.length > this.maxDataPoints) {
            this.data.network.shift();
        }
    }

    updateCharts() {
        if (window.ChartRenderer) {
            window.ChartRenderer.drawCPUChart(this.data.cpu);
            window.ChartRenderer.drawMemoryChart(this.data.memory);
            window.ChartRenderer.drawDiskChart(this.data.disk);
            window.ChartRenderer.drawNetworkChart(this.data.network);
        }
    }

    updateMetrics() {
        if (!this.currentStats) return;
        
        const stats = this.currentStats;
        
        // CPU
        const cpuCurrent = stats.cpu?.total || 0;
        document.getElementById('cpu-current').textContent = `${cpuCurrent.toFixed(1)}%`;
        document.getElementById('cpu-cores').textContent = stats.cpu?.count || 0;
        
        // CPU peak
        const cpuPeak = this.data.cpu.reduce((max, point) => Math.max(max, point.value), 0);
        document.getElementById('cpu-peak').textContent = `${cpuPeak.toFixed(1)}%`;
        
        // Memory
        const mem = stats.memory || {};
        const memUsedGB = (mem.used || 0) / (1024 ** 3);
        const memTotalGB = (mem.total || 1) / (1024 ** 3);
        document.getElementById('mem-used').textContent = `${memUsedGB.toFixed(2)} GB`;
        document.getElementById('mem-total').textContent = `${memTotalGB.toFixed(2)} GB`;
        document.getElementById('mem-percent').textContent = `${(mem.percent || 0).toFixed(1)}%`;
        
        // Disk
        const disk = stats.disk || {};
        let diskUsedGB = 0;
        let diskFreeGB = 0;
        let diskPercent = 0;
        if (disk.partitions && disk.partitions.length > 0) {
            const mainPartition = disk.partitions[0];
            diskUsedGB = (mainPartition.used || 0) / (1024 ** 3);
            diskFreeGB = (mainPartition.free || 0) / (1024 ** 3);
            diskPercent = mainPartition.percent || 0;
        }
        document.getElementById('disk-used').textContent = `${diskUsedGB.toFixed(2)} GB`;
        document.getElementById('disk-free').textContent = `${diskFreeGB.toFixed(2)} GB`;
        
        // Disk I/O rate
        let diskIORate = 0;
        if (disk.io) {
            // Simple: sum read + write bytes (need delta over time, but using rates from backend)
            // For now show total IO
            diskIORate = (disk.io.read_bytes || 0) + (disk.io.write_bytes || 0);
        }
        document.getElementById('disk-io').textContent = this.formatBytes(diskIORate) + '/s';
        
        // Network
        const net = stats.network || {};
        const rates = net.rates || {};
        const inRate = rates.bytes_recv_per_sec || 0;
        const outRate = rates.bytes_sent_per_sec || 0;
        const totalRate = inRate + outRate;
        
        document.getElementById('net-in').textContent = this.formatBytes(inRate) + '/s';
        document.getElementById('net-out').textContent = this.formatBytes(outRate) + '/s';
        document.getElementById('net-total').textContent = this.formatBytes(totalRate) + '/s';
    }

    updateProcessTable(processes) {
        const tbody = document.getElementById('process-body');
        if (!tbody) return;
        
        if (!processes || processes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-message">No process data available</td></tr>';
            return;
        }
        
        let html = '';
        processes.forEach(proc => {
            html += `
                <tr>
                    <td>${proc.pid || '-'}</td>
                    <td>${this.escapeHtml(proc.name || 'unknown')}</td>
                    <td>${(proc.cpu_percent || 0).toFixed(1)}%</td>
                    <td>${(proc.memory_percent || 0).toFixed(1)}%</td>
                    <td>${this.escapeHtml(proc.username || '')}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }

    checkAlerts(stats) {
        const cpuThreshold = parseInt(document.getElementById('cpu-threshold').value) || 80;
        const memThreshold = parseInt(document.getElementById('mem-threshold').value) || 85;
        const diskThreshold = parseInt(document.getElementById('disk-threshold').value) || 90;
        const netThreshold = parseInt(document.getElementById('net-threshold').value) || 100000;
        
        const cpuAlert = document.getElementById('cpu-alert');
        const memAlert = document.getElementById('mem-alert');
        const diskAlert = document.getElementById('disk-alert');
        const netAlert = document.getElementById('net-alert');
        
        // CPU alert
        const cpuPercent = stats.cpu?.total || 0;
        cpuAlert.classList.toggle('alert', cpuPercent > cpuThreshold);
        
        // Memory alert
        const memPercent = stats.memory?.percent || 0;
        memAlert.classList.toggle('alert', memPercent > memThreshold);
        
        // Disk alert
        let diskPercent = 0;
        if (stats.disk?.partitions?.length > 0) {
            diskPercent = stats.disk.partitions[0].percent;
        }
        diskAlert.classList.toggle('alert', diskPercent > diskThreshold);
        
        // Network alert
        let networkRate = 0;
        if (stats.network?.rates) {
            networkRate = (stats.network.rates.bytes_sent_per_sec || 0) + 
                         (stats.network.rates.bytes_recv_per_sec || 0);
        }
        netAlert.classList.toggle('alert', networkRate > netThreshold);
    }

    updateStatus(status) {
        const elem = document.getElementById('ws-status');
        elem.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        elem.className = `status-${status}`;
    }

    updateConnectionInfo(text) {
        const elem = document.getElementById('connection-info');
        if (elem) elem.textContent = text;
    }

    updateLastUpdate() {
        const elem = document.getElementById('last-update');
        const now = new Date();
        elem.textContent = now.toLocaleTimeString();
    }

    updateUptime() {
        const elem = document.getElementById('uptime');
        const uptimeMs = Date.now() - this.uptimeStart;
        const seconds = Math.floor(uptimeMs / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        elem.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    setupEventListeners() {
        // Threshold inputs
        ['cpu-threshold', 'mem-threshold', 'disk-threshold', 'net-threshold'].forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.addEventListener('change', () => {
                    if (this.currentStats) {
                        this.checkAlerts(this.currentStats);
                    }
                });
            }
        });
        
        // Refresh processes button
        const refreshBtn = document.getElementById('refresh-processes');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                // Send ping to request fresh data (server will send stats anyway)
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ type: 'ping' }));
                }
            });
        }
        
        // Clear logs button
        const clearLogsBtn = document.getElementById('clear-logs');
        if (clearLogsBtn && window.LogViewer) {
            clearLogsBtn.addEventListener('click', () => {
                window.LogViewer.clearLogs();
            });
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
