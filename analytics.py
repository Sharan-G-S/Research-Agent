"""
Analytics Module
Provides statistical analysis and insights for research reports
"""
from collections import Counter
from datetime import datetime
import re

class Analytics:
    """Generate analytics and insights from research reports"""
    
    def __init__(self):
        self.stop_words = {
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
            'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
            'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
            'report', 'article', 'investigation', 'research', 'study', 'analysis'
        }
    
    def get_overall_statistics(self, reports):
        """Calculate overall statistics across all reports"""
        if not reports:
            return {
                'total_reports': 0,
                'total_words': 0,
                'total_sources': 0,
                'avg_word_count': 0,
                'avg_sources': 0,
                'date_range': None
            }
        
        total_reports = len(reports)
        total_words = sum(r.get('word_count', 0) for r in reports)
        total_sources = sum(len(r.get('sources', [])) for r in reports)
        
        # Get date range
        dates = [r.get('created_at') for r in reports if r.get('created_at')]
        date_range = None
        if dates:
            dates_sorted = sorted(dates)
            date_range = {
                'first': dates_sorted[0],
                'last': dates_sorted[-1]
            }
        
        return {
            'total_reports': total_reports,
            'total_words': total_words,
            'total_sources': total_sources,
            'avg_word_count': total_words // total_reports if total_reports > 0 else 0,
            'avg_sources': total_sources // total_reports if total_reports > 0 else 0,
            'date_range': date_range
        }
    
    def get_word_cloud_data(self, reports, top_n=50):
        """Generate word frequency data for word cloud"""
        all_words = []
        
        for report in reports:
            # Combine title, summary, and content
            text = f"{report.get('title', '')} {report.get('summary', '')} {report.get('content', '')}"
            
            # Tokenize
            words = re.findall(r'\b[a-z]{4,}\b', text.lower())
            
            # Filter stop words
            words = [w for w in words if w not in self.stop_words]
            all_words.extend(words)
        
        # Count frequencies
        word_counts = Counter(all_words)
        
        # Get top N words with their counts
        top_words = word_counts.most_common(top_n)
        
        # Normalize frequencies for visualization (0-100)
        if top_words:
            max_count = top_words[0][1]
            return [
                {
                    'word': word,
                    'count': count,
                    'size': int((count / max_count) * 100)
                }
                for word, count in top_words
            ]
        
        return []
    
    def get_research_trends(self, reports):
        """Analyze research trends over time"""
        if not reports:
            return {
                'reports_over_time': [],
                'word_count_trend': [],
                'sources_trend': []
            }
        
        # Group by date
        reports_by_date = {}
        for report in reports:
            date = report.get('created_at', '')
            if date:
                # Extract date (YYYY-MM-DD)
                date_key = date.split('T')[0] if 'T' in date else date.split()[0]
                
                if date_key not in reports_by_date:
                    reports_by_date[date_key] = []
                reports_by_date[date_key].append(report)
        
        # Sort by date
        sorted_dates = sorted(reports_by_date.keys())
        
        # Calculate trends
        reports_over_time = []
        word_count_trend = []
        sources_trend = []
        
        for date in sorted_dates:
            day_reports = reports_by_date[date]
            reports_over_time.append({
                'date': date,
                'count': len(day_reports)
            })
            word_count_trend.append({
                'date': date,
                'words': sum(r.get('word_count', 0) for r in day_reports)
            })
            sources_trend.append({
                'date': date,
                'sources': sum(len(r.get('sources', [])) for r in day_reports)
            })
        
        return {
            'reports_over_time': reports_over_time,
            'word_count_trend': word_count_trend,
            'sources_trend': sources_trend
        }
    
    def get_topic_distribution(self, reports, top_n=10):
        """Analyze topic distribution"""
        topics = [r.get('topic', 'Unknown') for r in reports]
        topic_counts = Counter(topics)
        
        top_topics = topic_counts.most_common(top_n)
        
        return [
            {
                'topic': topic,
                'count': count,
                'percentage': round((count / len(reports)) * 100, 1) if reports else 0
            }
            for topic, count in top_topics
        ]
    
    def get_top_sources(self, reports, top_n=10):
        """Find most frequently used sources"""
        all_sources = []
        
        for report in reports:
            sources = report.get('sources', [])
            for source in sources:
                all_sources.append({
                    'title': source.get('title', 'Unknown'),
                    'url': source.get('url', ''),
                    'source': source.get('source', 'Unknown')
                })
        
        # Count by source name
        source_counts = Counter(s['source'] for s in all_sources)
        top_sources = source_counts.most_common(top_n)
        
        return [
            {
                'source': source,
                'count': count
            }
            for source, count in top_sources
        ]
    
    def get_comprehensive_analytics(self, reports):
        """Get all analytics in one call"""
        return {
            'statistics': self.get_overall_statistics(reports),
            'word_cloud': self.get_word_cloud_data(reports),
            'trends': self.get_research_trends(reports),
            'topics': self.get_topic_distribution(reports),
            'top_sources': self.get_top_sources(reports)
        }
