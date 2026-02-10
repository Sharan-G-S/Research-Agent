// Research Agent - Frontend Application
class ResearchAgent {
    constructor() {
        this.currentReport = null;
        this.reports = [];
        this.highlightsEnabled = false;
        this.keywords = null;
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.searchTimeout = null;
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

        // Dashboard
        document.getElementById('dashboard-btn')?.addEventListener('click', () => this.openDashboard());
        document.getElementById('dashboard-close')?.addEventListener('click', () => this.closeDashboard());
        document.getElementById('dashboard-overlay')?.addEventListener('click', () => this.closeDashboard());

        // Bookmarking
        document.getElementById('bookmark-btn')?.addEventListener('click', () => this.toggleBookmark());

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterReports(filter);
            });
        });

        // Search
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        document.getElementById('search-clear')?.addEventListener('click', () => {
            this.clearSearch();
        });

        // History
        document.getElementById('history-btn')?.addEventListener('click', () => this.openHistory());
        document.getElementById('history-close')?.addEventListener('click', () => this.closeHistory());
        document.getElementById('history-overlay')?.addEventListener('click', () => this.closeHistory());
        document.getElementById('restore-version-btn')?.addEventListener('click', () => this.restoreVersion());
        document.getElementById('back-to-timeline-btn')?.addEventListener('click', () => this.backToTimeline());
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

        // Update bookmark UI
        this.updateBookmarkUI();

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
            const endpoint = this.currentFilter === 'favorites'
                ? '/api/reports/favorites'
                : '/api/reports';

            const response = await fetch(endpoint);
            const data = await response.json();

            if (data.success || data.reports) {
                this.reports = data.reports || [];
                this.renderReportsList();
            }
        } catch (error) {
            console.error('Failed to load reports:', error);
        }
    }

    renderReportsList() {
        const listEl = document.getElementById('reports-list');

        if (this.reports.length === 0) {
            const emptyMessage = this.currentFilter === 'favorites'
                ? 'No favorite reports yet'
                : 'No reports yet';
            listEl.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
            return;
        }

        listEl.innerHTML = this.reports.map(report => {
            const favoriteClass = report.is_favorite ? 'favorite' : '';
            return `
                <li class="report-item ${favoriteClass}" onclick="agent.loadReport(${report.id})">
                    <div class="report-item-title">${report.title}</div>
                    <div class="report-item-meta">
                        <span>${report.word_count} words</span>
                        <span>${new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                </li>
            `;
        }).join('');
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

    // Dashboard functionality
    async openDashboard() {
        const modal = document.getElementById('dashboard-modal');
        modal.classList.add('active');

        try {
            // Fetch analytics data
            const response = await fetch('/api/analytics');
            const data = await response.json();

            if (data.success) {
                this.renderDashboard(data.analytics);
            } else {
                throw new Error('Failed to load analytics');
            }
        } catch (error) {
            console.error('Dashboard error:', error);
            this.showError('Failed to load dashboard');
        }
    }

    closeDashboard() {
        const modal = document.getElementById('dashboard-modal');
        modal.classList.remove('active');
    }

    renderDashboard(analytics) {
        // Render statistics
        this.renderStatistics(analytics.statistics);

        // Render word cloud
        this.renderWordCloud(analytics.word_cloud);

        // Render topics
        this.renderTopics(analytics.topics);

        // Render top sources
        this.renderTopSources(analytics.top_sources);

        // Render trends
        this.renderTrends(analytics.trends);
    }

    renderStatistics(stats) {
        document.getElementById('stat-total-reports').textContent = stats.total_reports.toLocaleString();
        document.getElementById('stat-total-words').textContent = stats.total_words.toLocaleString();
        document.getElementById('stat-total-sources').textContent = stats.total_sources.toLocaleString();
        document.getElementById('stat-avg-words').textContent = stats.avg_word_count.toLocaleString();
    }

    renderWordCloud(words) {
        const container = document.getElementById('word-cloud');

        if (!words || words.length === 0) {
            container.innerHTML = '<div class="dashboard-empty"><div class="dashboard-empty-icon">☁️</div><p>No word cloud data available</p></div>';
            return;
        }

        container.innerHTML = words.map(item => {
            // Calculate font size based on normalized size (10-40px range)
            const fontSize = Math.max(10, Math.min(40, 10 + (item.size / 100) * 30));
            return `<span class="word-cloud-item" style="font-size: ${fontSize}px" title="${item.count} occurrences">${item.word}</span>`;
        }).join('');
    }

    renderTopics(topics) {
        const container = document.getElementById('topic-list');

        if (!topics || topics.length === 0) {
            container.innerHTML = '<div class="dashboard-empty"><p>No topics available</p></div>';
            return;
        }

        container.innerHTML = topics.map(topic => `
            <div class="topic-item">
                <div class="topic-name">${topic.topic}</div>
                <div class="topic-count">${topic.count}</div>
                <div style="flex: 0 0 100px;">
                    <div class="topic-bar" style="width: ${topic.percentage}%"></div>
                </div>
            </div>
        `).join('');
    }

    renderTopSources(sources) {
        const container = document.getElementById('sources-list');

        if (!sources || sources.length === 0) {
            container.innerHTML = '<div class="dashboard-empty"><p>No sources available</p></div>';
            return;
        }

        container.innerHTML = sources.map(source => `
            <div class="source-item">
                <div class="source-name">${source.source}</div>
                <div class="source-count">${source.count} citations</div>
            </div>
        `).join('');
    }

    renderTrends(trends) {
        const container = document.getElementById('trends-chart');

        if (!trends.reports_over_time || trends.reports_over_time.length === 0) {
            container.innerHTML = '<div class="dashboard-empty"><p>No trend data available</p></div>';
            return;
        }

        // Find max count for scaling
        const maxCount = Math.max(...trends.reports_over_time.map(t => t.count));

        container.innerHTML = trends.reports_over_time.map(trend => {
            const percentage = (trend.count / maxCount) * 100;
            return `
                <div class="trend-item">
                    <div class="trend-date">${this.formatDate(trend.date)}</div>
                    <div class="trend-bar-container">
                        <div class="trend-bar" style="width: ${percentage}%">
                            ${trend.count}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Bookmarking functionality
    async toggleBookmark() {
        if (!this.currentReport) {
            this.showError('No report to bookmark');
            return;
        }

        try {
            const response = await fetch(`/api/reports/${this.currentReport.id}/favorite`, {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                this.currentReport.is_favorite = data.is_favorite ? 1 : 0;
                this.updateBookmarkUI();
                this.loadReports(); // Refresh list to update badges
            }
        } catch (error) {
            console.error('Bookmark error:', error);
            this.showError('Failed to update bookmark');
        }
    }

    updateBookmarkUI() {
        const icon = document.getElementById('bookmark-icon');
        const btn = document.getElementById('bookmark-btn');

        if (this.currentReport && this.currentReport.is_favorite) {
            icon.textContent = '⭐';
            btn.classList.add('active');
            btn.title = 'Remove Bookmark';
        } else {
            icon.textContent = '☆';
            btn.classList.remove('active');
            btn.title = 'Bookmark Report';
        }
    }

    filterReports(filter) {
        this.currentFilter = filter;

        // Update filter button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Reload reports with new filter
        this.loadReports();
    }

    // Search functionality
    async handleSearch(query) {
        this.searchQuery = query.trim();

        // Show/hide clear button
        const clearBtn = document.getElementById('search-clear');
        clearBtn.style.display = this.searchQuery ? 'block' : 'none';

        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch();
        }, 300);
    }

    async performSearch() {
        if (this.searchQuery.length < 2) {
            this.loadReports();
            document.querySelector('.sidebar')?.classList.remove('search-active');
            return;
        }

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(this.searchQuery)}`);
            const data = await response.json();

            if (data.success) {
                this.reports = data.reports;
                this.renderSearchResults();
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    renderSearchResults() {
        const listEl = document.getElementById('reports-list');
        const sidebar = document.querySelector('.sidebar');

        if (this.reports.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <p>No reports found for<br>"${this.searchQuery}"</p>
                </div>
            `;
            sidebar.classList.add('search-active');
            return;
        }

        // Add search results count
        const countHtml = `
            <div class="search-results-count">
                Found ${this.reports.length} result${this.reports.length !== 1 ? 's' : ''}
            </div>
        `;

        const reportsHtml = this.reports.map(report => {
            const favoriteClass = report.is_favorite ? 'favorite' : '';
            const highlightedTitle = this.highlightSearchTerm(report.title);

            return `
                <li class="report-item ${favoriteClass}" onclick="agent.loadReport(${report.id})">
                    <div class="report-item-title">${highlightedTitle}</div>
                    <div class="report-item-meta">
                        <span>${report.word_count} words</span>
                        <span>${new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                </li>
            `;
        }).join('');

        listEl.innerHTML = countHtml + reportsHtml;
        sidebar.classList.add('search-active');
    }

    highlightSearchTerm(text) {
        if (!this.searchQuery) return text;

        const regex = new RegExp(`(${this.escapeRegex(this.searchQuery)})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    clearSearch() {
        this.searchQuery = '';
        document.getElementById('search-input').value = '';
        document.getElementById('search-clear').style.display = 'none';
        document.querySelector('.sidebar')?.classList.remove('search-active');
        this.loadReports();
    }

    // History/Version Control Methods
    async openHistory() {
        if (!this.currentReport) {
            this.showError('No report selected');
            return;
        }

        try {
            const response = await fetch(`/api/reports/${this.currentReport.id}/versions`);
            const data = await response.json();

            if (data.success) {
                this.renderHistoryTimeline(data.versions);
                document.getElementById('history-modal').classList.add('active');
                document.getElementById('history-overlay').classList.add('active');
            }
        } catch (error) {
            console.error('History error:', error);
            this.showError('Failed to load history');
        }
    }

    closeHistory() {
        document.getElementById('history-modal').classList.remove('active');
        document.getElementById('history-overlay').classList.remove('active');
        document.getElementById('history-timeline').style.display = 'block';
        document.getElementById('version-viewer').style.display = 'none';
    }

    renderHistoryTimeline(versions) {
        const timeline = document.getElementById('history-timeline');

        if (versions.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📜</div>
                    <p>No version history yet</p>
                </div>
            `;
            return;
        }

        timeline.innerHTML = versions.map((version, index) => `
            <div class="timeline-item ${index === 0 ? 'current' : ''}" 
                 onclick="agent.viewVersion(${version.id})">
                <div class="timeline-version">
                    Version ${version.version_number}
                    ${index === 0 ? '<span class="badge">Current</span>' : ''}
                </div>
                <div class="timeline-date">
                    ${new Date(version.created_at).toLocaleString()}
                </div>
                ${version.change_description ? `
                    <div class="timeline-description">${version.change_description}</div>
                ` : ''}
                <div class="timeline-stats">
                    <span>📝 ${version.word_count} words</span>
                </div>
            </div>
        `).join('');
    }

    async viewVersion(versionId) {
        try {
            const response = await fetch(`/api/versions/${versionId}`);
            const data = await response.json();

            if (data.success) {
                this.displayVersion(data.version);
            }
        } catch (error) {
            console.error('Version view error:', error);
            this.showError('Failed to load version');
        }
    }

    displayVersion(version) {
        document.getElementById('history-timeline').style.display = 'none';
        document.getElementById('version-viewer').style.display = 'block';

        document.getElementById('version-title').textContent =
            `Version ${version.version_number}: ${version.title}`;
        document.getElementById('version-content').innerHTML = this.formatContent(version.content);

        // Store current version for restore
        this.currentVersion = version;
    }

    async restoreVersion() {
        if (!this.currentVersion || !this.currentReport) return;

        if (!confirm(`Restore to Version ${this.currentVersion.version_number}? Current version will be saved.`)) {
            return;
        }

        try {
            const response = await fetch(
                `/api/reports/${this.currentReport.id}/restore/${this.currentVersion.id}`,
                { method: 'POST' }
            );
            const data = await response.json();

            if (data.success) {
                this.showSuccess('Version restored successfully');
                this.closeHistory();
                this.loadReport(this.currentReport.id);
            }
        } catch (error) {
            console.error('Restore error:', error);
            this.showError('Failed to restore version');
        }
    }

    backToTimeline() {
        document.getElementById('history-timeline').style.display = 'block';
        document.getElementById('version-viewer').style.display = 'none';
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
