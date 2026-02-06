"""
Keyword Extractor Module
Extracts and categorizes important keywords from research reports
"""
import re
from collections import Counter
from typing import List, Dict, Tuple

class KeywordExtractor:
    """Extract and categorize keywords from text"""
    
    # Common stop words to filter out
    STOP_WORDS = {
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
        'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
        'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
        'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
        'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
        'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
        'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
        'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
        'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
        'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did',
        'having', 'may', 'such', 'being', 'through', 'where', 'much', 'should', 'those',
        'very', 'own', 'while', 'here', 'each', 'does', 'both', 'few', 'under', 'until',
        'more', 'many', 'must', 'before', 'between', 'same', 'during', 'without', 'however',
        'why', 'let', 'great', 'since', 'provide', 'every', 'still', 'around', 'another',
        'came', 'three', 'state', 'never', 'become', 'against', 'last', 'might', 'us',
        'something', 'fact', 'though', 'less', 'public', 'put', 'thing', 'almost', 'hand',
        'enough', 'far', 'took', 'head', 'yet', 'government', 'system', 'better', 'set',
        'told', 'nothing', 'end', 'why', 'called', 'didn', 'eyes', 'find', 'going', 'made',
        'may', 'part', 'place', 'case', 'point', 'asked', 'seem', 'felt', 'high', 'too',
        'report', 'article', 'investigation', 'examines', 'comprehensive', 'analysis',
        'research', 'study', 'findings', 'conclusion', 'background', 'context', 'implications',
        'developments', 'aspects', 'drawing', 'sources', 'expert', 'observers', 'alike',
        'stakeholders', 'monitoring', 'situation', 'continues', 'evolve', 'understanding',
        'dynamics', 'crucial', 'informed', 'decision', 'making', 'strategic', 'planning',
        'reveals', 'represents', 'complex', 'multifaceted', 'topic', 'requires', 'careful',
        'consideration', 'multiple', 'perspectives'
    }
    
    def extract_keywords(self, text: str, top_n: int = 20) -> Dict[str, List[str]]:
        """
        Extract keywords from text and categorize them
        
        Args:
            text: Input text to extract keywords from
            top_n: Number of top keywords to return
            
        Returns:
            Dictionary with categorized keywords
        """
        # Clean and tokenize text
        words = self._tokenize(text)
        
        # Extract entities (proper nouns - capitalized words)
        entities = self._extract_entities(text)
        
        # Extract technical terms (multi-word phrases)
        technical_terms = self._extract_technical_terms(text)
        
        # Extract important single words
        keywords = self._extract_important_words(words, top_n)
        
        # Remove entities and technical terms from keywords to avoid duplication
        entity_words = set(' '.join(entities).lower().split())
        technical_words = set(' '.join(technical_terms).lower().split())
        keywords = [k for k in keywords if k.lower() not in entity_words and k.lower() not in technical_words]
        
        return {
            'keywords': keywords[:top_n],
            'entities': entities[:10],
            'technical': technical_terms[:10]
        }
    
    def _tokenize(self, text: str) -> List[str]:
        """Tokenize text into words"""
        # Remove special characters but keep hyphens in words
        text = re.sub(r'[^\w\s-]', ' ', text)
        # Split into words
        words = text.split()
        # Filter out stop words and short words
        words = [w for w in words if len(w) > 2 and w.lower() not in self.STOP_WORDS]
        return words
    
    def _extract_entities(self, text: str) -> List[str]:
        """Extract proper nouns (capitalized words/phrases)"""
        # Find sequences of capitalized words
        pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b'
        entities = re.findall(pattern, text)
        
        # Count occurrences
        entity_counts = Counter(entities)
        
        # Filter out single-letter words and common words
        filtered_entities = [
            entity for entity, count in entity_counts.items()
            if len(entity) > 2 and entity.lower() not in self.STOP_WORDS and count >= 2
        ]
        
        # Sort by frequency
        sorted_entities = sorted(
            filtered_entities,
            key=lambda x: entity_counts[x],
            reverse=True
        )
        
        return sorted_entities
    
    def _extract_technical_terms(self, text: str) -> List[str]:
        """Extract technical multi-word phrases"""
        # Common technical term patterns
        patterns = [
            r'\b[A-Z]{2,}\b',  # Acronyms (AI, ML, etc.)
            r'\b\w+(?:-\w+)+\b',  # Hyphenated terms
        ]
        
        technical = []
        for pattern in patterns:
            matches = re.findall(pattern, text)
            technical.extend(matches)
        
        # Count and filter
        tech_counts = Counter(technical)
        filtered_tech = [
            term for term, count in tech_counts.items()
            if len(term) > 1 and count >= 2
        ]
        
        # Sort by frequency
        sorted_tech = sorted(
            filtered_tech,
            key=lambda x: tech_counts[x],
            reverse=True
        )
        
        return sorted_tech
    
    def _extract_important_words(self, words: List[str], top_n: int) -> List[str]:
        """Extract important single words based on frequency"""
        # Count word frequencies
        word_counts = Counter(word.lower() for word in words)
        
        # Get most common words
        common_words = word_counts.most_common(top_n * 2)  # Get extra to filter
        
        # Filter and return
        important = []
        seen = set()
        
        for word, count in common_words:
            if word not in seen and len(word) > 3 and count >= 2:
                # Capitalize first letter for display
                important.append(word.capitalize())
                seen.add(word)
                
            if len(important) >= top_n:
                break
        
        return important
    
    def get_highlight_data(self, text: str) -> Dict:
        """
        Get all data needed for highlighting
        
        Returns:
            Dictionary with keywords and their categories
        """
        extracted = self.extract_keywords(text)
        
        # Combine all keywords with their types
        highlight_map = {}
        
        for keyword in extracted['keywords']:
            highlight_map[keyword.lower()] = 'keyword'
        
        for entity in extracted['entities']:
            highlight_map[entity.lower()] = 'entity'
        
        for tech in extracted['technical']:
            highlight_map[tech.lower()] = 'technical'
        
        return {
            'extracted': extracted,
            'highlight_map': highlight_map
        }
