"""
Configuration settings for the Research Agent
"""
import os

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = True
    
    # Database settings
    DATABASE_PATH = 'research_agent.db'
    
    # Research settings
    MAX_SEARCH_RESULTS = 10
    MAX_SOURCES_PER_REPORT = 15
    RESEARCH_TIMEOUT = 120  # seconds
    
    # Writing settings
    REPORT_MIN_WORDS = 800
    REPORT_MAX_WORDS = 2000
    WRITING_STYLE = 'journalistic'
    
    # Export settings
    EXPORT_FORMATS = ['html', 'pdf', 'markdown']
    REPORTS_DIR = 'reports'
    
    # API settings (add your own API keys here)
    SEARCH_API_KEY = os.environ.get('SEARCH_API_KEY') or None
    
    @staticmethod
    def init_app(app):
        """Initialize application with config"""
        os.makedirs(Config.REPORTS_DIR, exist_ok=True)
