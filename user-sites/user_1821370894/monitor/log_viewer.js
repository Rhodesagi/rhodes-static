/**
 * System log viewer.
 */
class LogViewer {
    constructor() {
        this.logContainer = document.getElementById('log-viewer');
        this.maxLines = 100;
        this.init();
    }
    
    init() {
        this.clearLogs();
    }
    
    addLogEntries(lines) {
        if (!lines || lines.length === 0) return;
        
        // Remove "Loading..." message if present
        if (this.logContainer.children.length === 1 && 
            this.logContainer.children[0].textContent.includes('Loading')) {
            this.logContainer.innerHTML = '';
        }
        
        lines.forEach(line => {
            const entry = this.createLogEntry(line);
            this.logContainer.appendChild(entry);
        });
        
        // Trim excess lines
        while (this.logContainer.children.length > this.maxLines) {
            this.logContainer.removeChild(this.logContainer.firstChild);
        }
        
        // Scroll to bottom
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
    
    createLogEntry(text) {
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.textContent = text;
        
        // Apply styling based on log content
        const lowerText = text.toLowerCase();
        if (lowerText.includes('error') || lowerText.includes('fail') || lowerText.includes('crit')) {
            div.classList.add('error');
        } else if (lowerText.includes('warn') || lowerText.includes('alert')) {
            div.classList.add('warning');
        } else if (lowerText.includes('info') || lowerText.includes('notice')) {
            div.classList.add('info');
        }
        
        return div;
    }
    
    clearLogs() {
        this.logContainer.innerHTML = '<div class="log-entry">Log cleared. Waiting for new entries...</div>';
    }
}

// Initialize log viewer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.LogViewer = new LogViewer();
});
