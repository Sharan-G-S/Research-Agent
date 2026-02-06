// Research Agent - Frontend Application
class ResearchAgent {
    constructor() {
        this.currentReport = null;
        this.reports = [];
        this.highlightsEnabled = false;
        this.keywords = null;
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
        document.getElementById('export-pdf')?.addEventListener('click', () => this.exportReport('pdf'));

        // Comparison modal
        document.getElementById('compare-btn')?.addEventListener('click', () => this.openComparisonModal());
        document.getElementById('modal-close')?.addEventListener('click', () => this.closeComparisonModal());
        document.getElementById('modal-overlay')?.addEventListener('click', () => this.closeComparisonModal());
        document.getElementById('start-comparison')?.addEventListener('click', () => this.compareReports());
        document.getElementById('back-to-selector')?.addEventListener('click', () => this.backToSelector());

        // Keyword highlighting
        document.getElementById('toggle-highlights')?.addEventListener('click', () => this.toggleHighlights());
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
            setTimeout(() =\u003e notification.remove(), 300);
        }, 3000);
    }

    // Comparison functionality
    openComparisonModal() {
        if (this.reports.length < 2) {
            this.showError('Need at least 2 reports to compare');
            return;
        }

        const modal = document.getElementById('comparison-modal');
        modal.classList.add('active');

        // Populate checkboxes
        this.renderComparisonCheckboxes();
    }

    closeComparisonModal() {
        const modal = document.getElementById('comparison-modal');
        modal.classList.remove('active');

        // Reset view
        document.getElementById('comparison-selector').style.display = 'block';
        document.getElementById('comparison-view').style.display = 'none';
    }

    renderComparisonCheckboxes() {
        const container = document.getElementById('report-checkboxes');
        container.innerHTML = this.reports.map(report => `
            <label class="report-checkbox-item">
                <input type="checkbox" value="${report.id}" onchange="agent.updateComparisonSelection()">
                <div class="report-checkbox-label">
                    <strong>${report.title}</strong>
                    <small>${report.word_count} words • ${new Date(report.created_at).toLocaleDateString()}</small>
                </div>
            </label>
        `).join('');
    }

    updateComparisonSelection() {
        const checkboxes = document.querySelectorAll('#report-checkboxes input[type="checkbox"]:checked');
        const button = document.getElementById('start-comparison');

        // Update button state
        button.disabled = checkboxes.length < 2 || checkboxes.length > 4;

        // Update visual feedback
        document.querySelectorAll('.report-checkbox-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    async compareReports() {
        const checkboxes = document.querySelectorAll('#report-checkboxes input[type="checkbox"]:checked');
        const reportIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

        try {
            const response = await fetch('/api/compare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ report_ids: reportIds })
            });

            if (!response.ok) {
                throw new Error('Comparison failed');
            }

            const data = await response.json();

            if (data.success) {
                this.displayComparison(data.comparison);
            } else {
                throw new Error(data.error || 'Comparison failed');
            }

        } catch (error) {
            console.error('Comparison error:', error);
            this.showError(error.message);
        }
    }

    displayComparison(comparison) {
        // Hide selector, show comparison view
        document.getElementById('comparison-selector').style.display = 'none';
        document.getElementById('comparison-view').style.display = 'block';

        // Display stats
        const statsContainer = document.getElementById('comparison-stats');
        statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="stat-value">${comparison.count}</span>
                <span class="stat-label">Reports</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${comparison.total_words}</span>
                <span class="stat-label">Total Words</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${comparison.total_sources}</span>
                <span class="stat-label">Total Sources</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${comparison.avg_word_count}</span>
                <span class="stat-label">Avg Words/Report</span>
            </div>
        `;

        // Display reports side-by-side
        const gridContainer = document.getElementById('comparison-grid');
        gridContainer.innerHTML = comparison.reports.map(report => `
            <div class="comparison-card">
                <div class="comparison-card-header">
                    <h3>${report.title}</h3>
                    <div class="comparison-card-meta">
                        <span>📝 ${report.word_count} words</span>
                        <span>📚 ${report.sources.length} sources</span>
                    </div>
                </div>
                
                <div class="comparison-card-summary">
                    ${report.summary}
                </div>
                
                <div class="comparison-card-content">
                    ${this.formatContent(report.content)}
                </div>
                
                <div class="comparison-card-sources">
                    <h4>Sources (${report.sources.length})</h4>
                    <ul>
                        ${report.sources.slice(0, 3).map(s => `
                            <li>${s.title}</li>
                        `).join('')}
                        ${report.sources.length > 3 ? `<li>... and ${report.sources.length - 3} more</li>` : ''}
                    </ul>
                </div>
            </div>
        `).join('');
    }

    backToSelector() {
        document.getElementById('comparison-selector').style.display = 'block';
        document.getElementById('comparison-view').style.display = 'none';
    }

    // Keyword Highlighting functionality
    async toggleHighlights() {
        if (!this.currentReport) {
            this.showError('No report to highlight');
            return;
        }

        this.highlightsEnabled = !this.highlightsEnabled;
        const btnText = document.getElementById('highlight-btn-text');

        if (this.highlightsEnabled) {
            // Fetch keywords if not already loaded
            if (!this.keywords) {
                await this.fetchKeywords(this.currentReport.id);
            }

            // Apply highlights
            this.applyHighlights();
            btnText.textContent = 'Disable Highlights';
        } else {
            // Remove highlights
            this.removeHighlights();
            btnText.textContent = 'Enable Highlights';
        }
    }

    async fetchKeywords(reportId) {
        try {
            const response = await fetch(`/api/reports/${reportId}/keywords`);
            const data = await response.json();

            if (data.success) {
                this.keywords = {
                    keywords: data.keywords || [],
                    entities: data.entities || [],
                    technical: data.technical || []
                };
            } else {
                throw new Error('Failed to fetch keywords');
            }
        } catch (error) {
            console.error('Keyword fetch error:', error);
            this.showError('Failed to load keywords');
        }
    }

    applyHighlights() {
        if (!this.keywords) return;

        const contentEl = document.getElementById('report-content');
        const summaryEl = document.getElementById('report-summary');

        // Store original content if not already stored
        if (!this.originalContent) {
            this.originalContent = contentEl.innerHTML;
            this.originalSummary = summaryEl.textContent;
        }

        // Apply highlights to content
        let highlightedContent = this.originalContent;
        let highlightedSummary = this.originalSummary;

        // Highlight entities (proper nouns) - blue
        this.keywords.entities.forEach(entity => {
            const regex = new RegExp(`\\b(${this.escapeRegex(entity)})\\b`, 'gi');
            highlightedContent = highlightedContent.replace(regex, '<span class="entity-highlight">$1</span>');
            highlightedSummary = highlightedSummary.replace(regex, '<span class="entity-highlight">$1</span>');
        });

        // Highlight technical terms - pink
        this.keywords.technical.forEach(term => {
            const regex = new RegExp(`\\b(${this.escapeRegex(term)})\\b`, 'gi');
            highlightedContent = highlightedContent.replace(regex, '<span class="technical-highlight">$1</span>');
            highlightedSummary = highlightedSummary.replace(regex, '<span class="technical-highlight">$1</span>');
        });

        // Highlight keywords - yellow
        this.keywords.keywords.forEach(keyword => {
            const regex = new RegExp(`\\b(${this.escapeRegex(keyword)})\\b`, 'gi');
            highlightedContent = highlightedContent.replace(regex, '<span class="keyword-highlight">$1</span>');
            highlightedSummary = highlightedSummary.replace(regex, '<span class="keyword-highlight">$1</span>');
        });

        // Update DOM
        contentEl.innerHTML = highlightedContent;
        summaryEl.innerHTML = highlightedSummary;
    }

    removeHighlights() {
        if (!this.originalContent) return;

        const contentEl = document.getElementById('report-content');
        const summaryEl = document.getElementById('report-summary');

        // Restore original content
        contentEl.innerHTML = this.originalContent;
        summaryEl.textContent = this.originalSummary;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
