"""
Journalist Module - NYT-style article generation
Transforms research data into professionally written reports
"""
from typing import Dict, List
import re

class Journalist:
    def __init__(self):
        self.style = 'nyt'
    
    def write_report(self, research_data: Dict) -> Dict:
        """
        Generate a NYT-style article from research data
        Returns structured report with title, content, summary
        """
        topic = research_data['topic']
        sources = research_data['sources']
        key_facts = research_data.get('key_facts', [])
        
        print(f"✍️  Writing NYT-style report on: {topic}")
        
        # Generate title
        title = self._generate_title(topic, sources)
        
        # Generate article sections
        lede = self._write_lede(topic, key_facts, sources)
        body = self._write_body(topic, sources, key_facts)
        conclusion = self._write_conclusion(topic, sources)
        
        # Combine article
        content = f"{lede}\n\n{body}\n\n{conclusion}"
        
        # Generate summary
        summary = self._generate_summary(topic, key_facts)
        
        # Count words
        word_count = len(content.split())
        
        # Prepare source citations
        citations = self._format_citations(sources)
        
        report = {
            'title': title,
            'content': content,
            'summary': summary,
            'word_count': word_count,
            'sources': citations,
            'sections': {
                'lede': lede,
                'body': body,
                'conclusion': conclusion
            }
        }
        
        print(f"✅ Report complete: {word_count} words")
        return report
    
    def _generate_title(self, topic: str, sources: List[Dict]) -> str:
        """Generate a compelling NYT-style headline"""
        # Capitalize properly
        words = topic.split()
        title_words = [w.capitalize() for w in words]
        title = ' '.join(title_words)
        
        # Add context if available
        if sources and len(sources) > 0:
            first_source = sources[0]
            if 'title' in first_source:
                # Extract key phrase from first source
                source_title = first_source['title']
                if ':' in source_title:
                    subtitle = source_title.split(':')[0].strip()
                    return f"{title}: {subtitle}"
        
        return f"An In-Depth Look at {title}"
    
    def _write_lede(self, topic: str, key_facts: List[str], sources: List[Dict]) -> str:
        """Write the opening paragraph (lede) - most important information first"""
        # Use first key fact or create from topic
        if key_facts and len(key_facts) > 0:
            opening = key_facts[0]
        else:
            opening = f"Recent developments in {topic} have drawn significant attention from experts and observers alike."
        
        # Add context
        context = f"This comprehensive investigation examines the key aspects of {topic}, drawing from multiple authoritative sources and expert analyses."
        
        lede = f"{opening}\n\n{context}"
        return lede
    
    def _write_body(self, topic: str, sources: List[Dict], key_facts: List[str]) -> str:
        """Write the main body of the article"""
        paragraphs = []
        
        # Section 1: Background and Context
        paragraphs.append("## Background and Context\n")
        if sources and len(sources) > 0:
            # Use content from first credible source
            for source in sources[:3]:
                if source.get('content'):
                    # Extract first meaningful paragraph
                    content = source['content']
                    sentences = content.split('.')[:4]  # First 4 sentences
                    para = '. '.join(sentences) + '.'
                    paragraphs.append(para)
                    break
        
        # Section 2: Key Findings
        paragraphs.append("\n\n## Key Findings\n")
        if key_facts:
            for i, fact in enumerate(key_facts[:5], 1):
                paragraphs.append(f"**{i}.** {fact}\n")
        
        # Section 3: Expert Analysis
        paragraphs.append("\n## Expert Analysis\n")
        expert_sources = [s for s in sources if any(domain in s.get('source', '') 
                         for domain in ['edu', 'gov', 'expert', 'research'])]
        
        if expert_sources:
            for source in expert_sources[:2]:
                if source.get('snippet'):
                    paragraphs.append(f"{source['snippet']}\n")
        else:
            # Use general sources
            for source in sources[1:3]:
                if source.get('snippet'):
                    paragraphs.append(f"{source['snippet']}\n")
        
        # Section 4: Broader Implications
        paragraphs.append("\n## Broader Implications\n")
        implications = f"The developments in {topic} have far-reaching implications across multiple sectors. "
        implications += "Stakeholders are closely monitoring the situation as it continues to evolve. "
        implications += "Understanding these dynamics is crucial for informed decision-making and strategic planning."
        paragraphs.append(implications)
        
        return '\n'.join(paragraphs)
    
    def _write_conclusion(self, topic: str, sources: List[Dict]) -> str:
        """Write the concluding section"""
        conclusion = f"## Conclusion\n\n"
        conclusion += f"As this investigation reveals, {topic} represents a complex and multifaceted issue that warrants continued attention and analysis. "
        conclusion += f"The evidence gathered from {len(sources)} authoritative sources paints a comprehensive picture of the current landscape. "
        conclusion += "\n\nWhile challenges remain, the path forward requires careful consideration of all stakeholder perspectives and evidence-based decision making. "
        conclusion += "As the situation continues to develop, ongoing research and monitoring will be essential to understanding the full scope and impact."
        
        return conclusion
    
    def _generate_summary(self, topic: str, key_facts: List[str]) -> str:
        """Generate executive summary"""
        summary = f"This investigative report examines {topic} through comprehensive research and analysis. "
        
        if key_facts:
            summary += f"Key findings include: {key_facts[0][:200]}... "
        
        summary += "The report synthesizes information from multiple authoritative sources to provide a balanced and thorough perspective."
        
        return summary
    
    def _format_citations(self, sources: List[Dict]) -> List[Dict]:
        """Format sources for citation"""
        citations = []
        
        for i, source in enumerate(sources, 1):
            citation = {
                'number': i,
                'title': source.get('title', 'Untitled'),
                'url': source.get('url', ''),
                'source': source.get('source', 'Unknown'),
                'credibility': source.get('credibility', 0.5)
            }
            citations.append(citation)
        
        return citations
    
    def format_for_display(self, report: Dict) -> str:
        """Format report for HTML display"""
        html = f"<article class='research-report'>\n"
        html += f"<h1>{report['title']}</h1>\n"
        html += f"<div class='summary'>{report['summary']}</div>\n"
        html += f"<div class='metadata'>Words: {report['word_count']} | Sources: {len(report['sources'])}</div>\n"
        html += f"<div class='content'>{self._markdown_to_html(report['content'])}</div>\n"
        html += f"<div class='sources'><h3>Sources</h3><ol>\n"
        
        for source in report['sources']:
            html += f"<li><a href='{source['url']}' target='_blank'>{source['title']}</a> - {source['source']}</li>\n"
        
        html += "</ol></div>\n</article>"
        
        return html
    
    def _markdown_to_html(self, text: str) -> str:
        """Simple markdown to HTML conversion"""
        # Headers
        text = re.sub(r'^## (.+)$', r'<h2>\1</h2>', text, flags=re.MULTILINE)
        text = re.sub(r'^### (.+)$', r'<h3>\1</h3>', text, flags=re.MULTILINE)
        
        # Bold
        text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
        
        # Paragraphs
        paragraphs = text.split('\n\n')
        html_paragraphs = [f'<p>{p}</p>' if not p.startswith('<h') else p for p in paragraphs if p.strip()]
        
        return '\n'.join(html_paragraphs)
