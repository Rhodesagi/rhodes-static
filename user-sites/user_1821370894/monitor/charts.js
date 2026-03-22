/**
 * Canvas-based chart rendering.
 */
class ChartRenderer {
    constructor() {
        this.colors = {
            cpu: '#40e0d0',
            memory: '#ff6b6b',
            disk: '#ffd700',
            network: '#51cf66',
            grid: 'rgba(255, 255, 255, 0.1)',
            text: '#e0e0e0',
            background: 'rgba(0, 20, 40, 0.5)'
        };
        
        this.charts = {
            cpu: document.getElementById('cpu-chart'),
            memory: document.getElementById('memory-chart'),
            disk: document.getElementById('disk-chart'),
            network: document.getElementById('network-chart')
        };
        
        this.ctx = {};
        for (const [name, canvas] of Object.entries(this.charts)) {
            if (canvas) {
                this.ctx[name] = canvas.getContext('2d');
                // Ensure canvas dimensions match CSS
                const dpr = window.devicePixelRatio || 1;
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                this.ctx[name].scale(dpr, dpr);
            }
        }
    }

    drawCPUChart(data) {
        this.drawChart('cpu', data, 'CPU Usage (%)', this.colors.cpu, 0, 100);
    }

    drawMemoryChart(data) {
        this.drawChart('memory', data, 'Memory Usage (%)', this.colors.memory, 0, 100);
    }

    drawDiskChart(data) {
        this.drawChart('disk', data, 'Disk Usage (%)', this.colors.disk, 0, 100);
    }

    drawNetworkChart(data) {
        // Find max value for scaling
        const maxVal = data.length > 0 ? Math.max(...data.map(d => d.value)) : 1;
        const maxY = Math.ceil(maxVal * 1.2);
        this.drawChart('network', data, 'Network Traffic (B/s)', this.colors.network, 0, maxY);
    }

    drawChart(chartName, data, title, color, minY = 0, maxY = 100) {
        const canvas = this.charts[chartName];
        const ctx = this.ctx[chartName];
        
        if (!canvas || !ctx) return;
        
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);
        const padding = { top: 30, right: 20, bottom: 30, left: 60 };
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, width, height);
        
        // Chart area
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        // Draw grid
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        
        // Horizontal grid lines
        const gridLinesY = 5;
        for (let i = 0; i <= gridLinesY; i++) {
            const y = padding.top + (i / gridLinesY) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
            
            // Y-axis labels
            const value = maxY - (i / gridLinesY) * (maxY - minY);
            ctx.fillStyle = this.colors.text;
            ctx.font = '12px monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.formatYValue(value, chartName), padding.left - 10, y);
        }
        
        // Vertical grid lines (time)
        const gridLinesX = 10;
        for (let i = 0; i <= gridLinesX; i++) {
            const x = padding.left + (i / gridLinesX) * chartWidth;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, height - padding.bottom);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
        
        // Draw axes
        ctx.strokeStyle = this.colors.text;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, height - padding.bottom);
        ctx.lineTo(width - padding.right, height - padding.bottom);
        ctx.stroke();
        
        // Draw title
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(title, width / 2, 10);
        
        // Draw data points if we have data
        if (data.length > 0) {
            const points = this.calculatePoints(data, padding, chartWidth, chartHeight, minY, maxY);
            
            // Draw line
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
            
            // Draw points
            ctx.fillStyle = color;
            const pointRadius = 3;
            points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Draw current value
            const lastPoint = points[points.length - 1];
            const currentValue = data[data.length - 1].value;
            ctx.fillStyle = color;
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText(this.formatYValue(currentValue, chartName), lastPoint.x + 10, lastPoint.y - 10);
        } else {
            // No data message
            ctx.fillStyle = this.colors.text;
            ctx.font = 'italic 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No data available', width / 2, height / 2);
        }
    }

    calculatePoints(data, padding, chartWidth, chartHeight, minY, maxY) {
        const points = [];
        const dataLen = data.length;
        
        for (let i = 0; i < dataLen; i++) {
            const point = data[i];
            const x = padding.left + (i / (dataLen - 1 || 1)) * chartWidth;
            const yRange = maxY - minY;
            const yValue = point.value;
            // Clamp to minY/maxY
            const clampedY = Math.max(minY, Math.min(maxY, yValue));
            const y = padding.top + chartHeight - ((clampedY - minY) / yRange) * chartHeight;
            
            points.push({ x, y });
        }
        
        return points;
    }

    formatYValue(value, chartName) {
        if (chartName === 'network') {
            if (value === 0) return '0 B/s';
            const k = 1024;
            const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
            const i = Math.floor(Math.log(value) / Math.log(k));
            return parseFloat((value / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }
        return value.toFixed(1) + (chartName === 'cpu' || chartName === 'memory' || chartName === 'disk' ? '%' : '');
    }
}

// Initialize chart renderer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ChartRenderer = new ChartRenderer();
});
