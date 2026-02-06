"""
Research Engine - Core research orchestration and web search integration
Performs deep investigations and gathers information from multiple sources
"""
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import time
from urllib.parse import quote_plus, urlparse
import re

class ResearchEngine:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
    
    def research(self, topic: str, max_sources: int = 15) -> Dict:
        """
        Perform comprehensive research on a topic
        Returns structured research data
        """
        print(f"🔍 Starting research on: {topic}")
        
        # Generate search queries
        queries = self._generate_queries(topic)
        
        # Gather sources from multiple searches
        all_sources = []
        for query in queries[:3]:  # Use top 3 queries
            sources = self._web_search(query, limit=5)
            all_sources.extend(sources)
            time.sleep(0.5)  # Rate limiting
        
        # Remove duplicates and rank sources
        unique_sources = self._deduplicate_sources(all_sources)
        ranked_sources = self._rank_sources(unique_sources)[:max_sources]
        
        # Extract content from top sources
        enriched_sources = []
        for source in ranked_sources[:10]:  # Extract content from top 10
            content = self._extract_content(source['url'])
            source['content'] = content
            source['word_count'] = len(content.split()) if content else 0
            enriched_sources.append(source)
            time.sleep(0.3)  # Rate limiting
        
        # Compile research data
        research_data = {
            'topic': topic,
            'queries_used': queries[:3],
            'sources': enriched_sources,
            'total_sources': len(enriched_sources),
            'key_facts': self._extract_key_facts(enriched_sources),
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        print(f"✅ Research complete: {len(enriched_sources)} sources analyzed")
        return research_data
    
    def _generate_queries(self, topic: str) -> List[str]:
        """Generate multiple search queries for comprehensive research"""
        queries = [
            topic,  # Original topic
            f"{topic} analysis",
            f"{topic} overview",
            f"{topic} latest news",
            f"{topic} expert opinion"
        ]
        return queries
    
    def _web_search(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Perform web search using DuckDuckGo HTML search
        Returns list of search results
        """
        try:
            # Use DuckDuckGo HTML search (no API key required)
            url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code != 200:
                print(f"⚠️  Search failed with status {response.status_code}")
                return []
            
            soup = BeautifulSoup(response.text, 'html.parser')
            results = []
            
            # Parse search results
            for result in soup.find_all('div', class_='result')[:limit]:
                try:
                    title_elem = result.find('a', class_='result__a')
                    snippet_elem = result.find('a', class_='result__snippet')
                    
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                        url = title_elem.get('href', '')
                        snippet = snippet_elem.get_text(strip=True) if snippet_elem else ''
                        
                        # Clean up DuckDuckGo redirect URL
                        if url.startswith('//duckduckgo.com/l/?'):
                            continue
                        
                        results.append({
                            'title': title,
                            'url': url,
                            'snippet': snippet,
                            'source': urlparse(url).netloc
                        })
                except Exception as e:
                    continue
            
            return results
            
        except Exception as e:
            print(f"⚠️  Search error: {str(e)}")
            return []
    
    def _extract_content(self, url: str) -> Optional[str]:
        """Extract main text content from a webpage"""
        try:
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script in soup(['script', 'style', 'nav', 'footer', 'header']):
                script.decompose()
            
            # Get text from paragraphs
            paragraphs = soup.find_all('p')
            text = ' '.join([p.get_text(strip=True) for p in paragraphs])
            
            # Clean up text
            text = re.sub(r'\s+', ' ', text)
            
            # Limit to first 1000 words
            words = text.split()[:1000]
            return ' '.join(words)
            
        except Exception as e:
            print(f"⚠️  Content extraction failed for {url}: {str(e)}")
            return None
    
    def _deduplicate_sources(self, sources: List[Dict]) -> List[Dict]:
        """Remove duplicate sources based on URL"""
        seen_urls = set()
        unique = []
        
        for source in sources:
            url = source.get('url', '')
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique.append(source)
        
        return unique
    
    def _rank_sources(self, sources: List[Dict]) -> List[Dict]:
        """Rank sources by credibility and relevance"""
        # Simple credibility scoring based on domain
        trusted_domains = [
            'edu', 'gov', 'org', 'nytimes.com', 'bbc.com', 'reuters.com',
            'theguardian.com', 'wsj.com', 'economist.com', 'nature.com',
            'sciencedirect.com', 'wikipedia.org'
        ]
        
        for source in sources:
            domain = source.get('source', '').lower()
            score = 0.5  # Base score
            
            # Boost for trusted domains
            for trusted in trusted_domains:
                if trusted in domain:
                    score += 0.3
                    break
            
            # Boost for having content
            if source.get('content'):
                score += 0.2
            
            source['credibility'] = min(score, 1.0)
        
        # Sort by credibility
        return sorted(sources, key=lambda x: x.get('credibility', 0), reverse=True)
    
    def _extract_key_facts(self, sources: List[Dict]) -> List[str]:
        """Extract key facts from sources"""
        facts = []
        
        for source in sources[:5]:  # Use top 5 sources
            snippet = source.get('snippet', '')
            if snippet and len(snippet) > 50:
                facts.append(snippet)
        
        return facts[:10]  # Return top 10 facts
