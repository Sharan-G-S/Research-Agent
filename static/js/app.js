// Research Agent - Frontend Application
class ResearchAgent {
    constructor() {
        this.currentReport = null;
        this.reports = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadReports();
    }

    setupEventListeners() {
        // Research form submission
        const form = document.getElementById('research-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.startResearch();
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle?.addEventListener('click', () => this.toggleTheme());

        // Export buttons
        document.getElementById('export-html')?.addEventListener('click', () => this.exportReport('html'));
        document.getElementById('export-markdown')?.addEventListener('click', () => this.exportReport('markdown'));
    }

    async startResearch() {
        const topicInput = document.getElementById('topic-input');
        const topic = topicInput.value.trim();

        if (!topic) {
            this.showError('Please enter a research topic');
            return;
        }

        // Disable form
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>🔍</span> Researching...';

        // Show progress
        this.showProgress();

        try {
            // Call research API
            const response = await fetch('/api/research', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ topic })
            });

            if (!response.ok) {
                throw new Error('Research failed');
            }

            const data = await response.json();

            if (data.success) {
                // Hide progress
                this.hideProgress();

                // Display report
                this.displayReport(data.report);

                // Clear input
                topicInput.value = '';

                // Reload reports list
                this.loadReports();

                // Show success message
                this.showSuccess('Research completed successfully!');
            } else {
                throw new Error(data.error || 'Research failed');
            }

        } catch (error) {
            console.error('Research error:', error);
            this.showError(error.message);
            this.hideProgress();
        } finally {
            // Re-enable form
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>🔍</span> Start Research';
        }
    }

    showProgress() {
        const container = document.getElementById('progress-container');
        container.classList.add('active');

        // Simulate progress steps
        const steps = ['search', 'extract', 'analyze', 'write'];
        let currentStep = 0;

        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                const stepEl = document.getElementById(`step-${steps[currentStep]}`);
                stepEl.classList.add('active');

                if (currentStep > 0) {
                    const prevStepEl = document.getElementById(`step-${steps[currentStep - 1]}`);
                    prevStepEl.classList.remove('active');
                    prevStepEl.classList.add('completed');
                }

                currentStep++;
            } else {
                clearInterval(interval);
            }
        }, 2000);

        this.progressInterval = interval;
    }

    hideProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        const container = document.getElementById('progress-container');
        container.classList.remove('active');

        // Reset steps
        const steps = document.querySelectorAll('.progress-step');
        steps.forEach(step => {
            step.classList.remove('active', 'completed');
        });
    }

    displayReport(report) {
        this.currentReport = report;

        // Update report display
        document.getElementById('report-title').textContent = report.title;
        document.getElementById('report-summary').textContent = report.summary;
        document.getElementById('report-word-count').textContent = report.word_count;
        document.getElementById('report-source-count').textContent = report.sources.length;

        // Format and display content
        const contentEl = document.getElementById('report-content');
        contentEl.innerHTML = this.formatContent(report.content);

        // Display sources
        const sourcesList = document.getElementById('sources-list');
        sourcesList.innerHTML = report.sources.map((source, index) => `
            <li class="source-item">
                <div>
                    <a href="${source.url}" target="_blank" class="source-link">
                        ${index + 1}. ${source.title}
                    </a>
                    <div class="source-domain">${source.source}</div>
                </div>
            </li>
        `).join('');

        // Show report display
        document.getElementById('report-display').classList.add('active');

        // Scroll to report
        document.getElementById('report-display').scrollIntoView({ behavior: 'smooth' });
    }

    formatContent(content) {
        // Convert markdown-style formatting to HTML
        let html = content;

        // Headers
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Paragraphs
        const paragraphs = html.split('\n\n');
        html = paragraphs.map(p => {
            if (p.startsWith('<h')) {
                return p;
            }
            return `<p>${p}</p>`;
        }).join('\n');

        return html;
    }

    async loadReports() {
        try {
            const response = await fetch('/api/reports');
            const data = await response.json();

            if (data.success) {
                this.reports = data.reports;
                this.renderReportsList();
            }
        } catch (error) {
            console.error('Failed to load reports:', error);
        }
    }

    renderReportsList() {
        const listEl = document.getElementById('reports-list');

        if (this.reports.length === 0) {
            listEl.innerHTML = '<div class="empty-state">No reports yet</div>';
            return;
        }

        listEl.innerHTML = this.reports.map(report => `
            <li class="report-item" onclick="agent.loadReport(${report.id})">
                <div class="report-item-title">${report.title}</div>
                <div class="report-item-meta">
                    <span>${report.word_count} words</span>
                    <span>${new Date(report.created_at).toLocaleDateString()}</span>
                </div>
            </li>
        `).join('');
    }

    async loadReport(reportId) {
        try {
            const response = await fetch(`/api/reports/${reportId}`);
            const data = await response.json();

            if (data.success) {
                this.displayReport(data.report);
            }
        } catch (error) {
            console.error('Failed to load report:', error);
            this.showError('Failed to load report');
        }
    }

    async exportReport(format) {
        if (!this.currentReport) {
            this.showError('No report to export');
            return;
        }

        try {
            const response = await fetch(`/api/export/${this.currentReport.id}/${format}`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_${this.currentReport.id}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                this.showSuccess(`Report exported as ${format.toUpperCase()}`);
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export report');
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize app
let agent;
document.addEventListener('DOMContentLoaded', () => {
    agent = new ResearchAgent();

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
});

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
