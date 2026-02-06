"""
Database management for Research Agent
Handles storage and retrieval of research reports
"""
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional
from config import Config

class Database:
    def __init__(self, db_path: str = None):
        self.db_path = db_path or Config.DATABASE_PATH
        self.init_db()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_db(self):
        """Initialize database schema"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Create reports table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                summary TEXT,
                sources TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                word_count INTEGER,
                status TEXT DEFAULT 'completed'
            )
        ''')
        
        # Create sources table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER,
                url TEXT NOT NULL,
                title TEXT,
                snippet TEXT,
                credibility_score REAL,
                FOREIGN KEY (report_id) REFERENCES reports (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def save_report(self, topic: str, title: str, content: str, 
                   summary: str, sources: List[Dict], word_count: int) -> int:
        """Save a research report"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Insert report
        cursor.execute('''
            INSERT INTO reports (topic, title, content, summary, sources, word_count)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (topic, title, content, summary, json.dumps(sources), word_count))
        
        report_id = cursor.lastrowid
        
        # Insert sources
        for source in sources:
            cursor.execute('''
                INSERT INTO sources (report_id, url, title, snippet, credibility_score)
                VALUES (?, ?, ?, ?, ?)
            ''', (report_id, source.get('url'), source.get('title'), 
                  source.get('snippet'), source.get('credibility', 0.5)))
        
        conn.commit()
        conn.close()
        
        return report_id
    
    def get_report(self, report_id: int) -> Optional[Dict]:
        """Get a specific report by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM reports WHERE id = ?', (report_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return None
        
        report = dict(row)
        report['sources'] = json.loads(report['sources']) if report['sources'] else []
        
        conn.close()
        return report
    
    def get_all_reports(self, limit: int = 50) -> List[Dict]:
        """Get all reports, most recent first"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, topic, title, summary, created_at, word_count, status
            FROM reports 
            ORDER BY created_at DESC 
            LIMIT ?
        ''', (limit,))
        
        reports = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return reports
    
    def delete_report(self, report_id: int) -> bool:
        """Delete a report and its sources"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM sources WHERE report_id = ?', (report_id,))
        cursor.execute('DELETE FROM reports WHERE id = ?', (report_id,))
        
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return deleted
    
    def search_reports(self, query: str) -> List[Dict]:
        """Search reports by topic or title"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        search_term = f'%{query}%'
        cursor.execute('''
            SELECT id, topic, title, summary, created_at, word_count
            FROM reports 
            WHERE topic LIKE ? OR title LIKE ?
            ORDER BY created_at DESC
        ''', (search_term, search_term))
        
        reports = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return reports
