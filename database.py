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
                status TEXT DEFAULT 'completed',
                is_favorite INTEGER DEFAULT 0
            )
        ''')
        
        # Add is_favorite column if it doesn't exist (migration)
        # Check if is_favorite column exists, if not add it
        cursor.execute("PRAGMA table_info(reports)")
        columns = [column[1] for column in cursor.fetchall()]
        if 'is_favorite' not in columns:
            print("🔄 Adding is_favorite column to reports table...")
            cursor.execute('ALTER TABLE reports ADD COLUMN is_favorite INTEGER DEFAULT 0')
            print("✅ is_favorite column added")
        
        # Create report_versions table for version control
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS report_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER NOT NULL,
                version_number INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                summary TEXT,
                sources TEXT,
                word_count INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                change_description TEXT,
                FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE,
                UNIQUE(report_id, version_number)
            )
        ''')
        print("✅ report_versions table ready")
        
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
            SELECT id, topic, title, summary, created_at, word_count, status, is_favorite
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
        """Search reports by topic, title, summary, or content"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        search_term = f'%{query}%'
        cursor.execute('''
            SELECT id, topic, title, summary, created_at, word_count, is_favorite
            FROM reports 
            WHERE topic LIKE ? OR title LIKE ? OR summary LIKE ? OR content LIKE ?
            ORDER BY created_at DESC
        ''', (search_term, search_term, search_term, search_term))
        
        reports = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return reports
    
    def toggle_favorite(self, report_id: int) -> bool:
        """Toggle favorite status of a report"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get current status
        cursor.execute('SELECT is_favorite FROM reports WHERE id = ?', (report_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return False
        
        # Toggle status
        new_status = 0 if row['is_favorite'] else 1
        cursor.execute('UPDATE reports SET is_favorite = ? WHERE id = ?', (new_status, report_id))
        
        conn.commit()
        conn.close()
        
        return True
    
    # Version Control Methods
    def save_report_version(self, report_id: int, change_description: str = None) -> Optional[int]:
        """Save current report state as a new version"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Get current report
            report = self.get_report(report_id)
            if not report:
                conn.close()
                return None
            
            # Get next version number
            cursor.execute('SELECT MAX(version_number) FROM report_versions WHERE report_id = ?', (report_id,))
            max_version = cursor.fetchone()[0] or 0
            next_version = max_version + 1
            
            # Save version
            cursor.execute('''
                INSERT INTO report_versions 
                (report_id, version_number, title, content, summary, sources, word_count, change_description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (report_id, next_version, report['title'], report['content'], 
                  report['summary'], report['sources'], report['word_count'], change_description))
            
            version_id = cursor.lastrowid
            conn.commit()
            print(f"✅ Saved version {next_version} for report {report_id}")
            
            return version_id
        except Exception as e:
            print(f"❌ Error saving version: {str(e)}")
            conn.rollback()
            return None
        finally:
            conn.close()
    
    def get_report_versions(self, report_id: int) -> List[Dict]:
        """Get all versions of a report"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, version_number, title, word_count, created_at, change_description
            FROM report_versions
            WHERE report_id = ?
            ORDER BY version_number DESC
        ''', (report_id,))
        
        versions = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return versions
    
    def get_version_content(self, version_id: int) -> Optional[Dict]:
        """Get full content of a specific version"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM report_versions WHERE id = ?', (version_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return None
        
        version = dict(row)
        version['sources'] = json.loads(version['sources']) if version['sources'] else []
        
        conn.close()
        return version
    
    def restore_version(self, report_id: int, version_id: int) -> bool:
        """Restore a report to a previous version"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Get version content
            version = self.get_version_content(version_id)
            if not version:
                return False
            
            # Save current state as version before restoring
            self.save_report_version(report_id, f"Auto-save before restoring to v{version['version_number']}")
            
            # Update report with version content
            sources_json = json.dumps(version['sources']) if isinstance(version['sources'], list) else version['sources']
            cursor.execute('''
                UPDATE reports
                SET title = ?, content = ?, summary = ?, sources = ?, word_count = ?
                WHERE id = ?
            ''', (version['title'], version['content'], version['summary'], 
                  sources_json, version['word_count'], report_id))
            
            conn.commit()
            print(f"✅ Restored report {report_id} to version {version['version_number']}")
            
            return True
        except Exception as e:
            print(f"❌ Error restoring version: {str(e)}")
            conn.rollback()
            return False
        finally:
            conn.close()

    
    def get_favorite_reports(self, limit: int = 50) -> List[Dict]:
        """Get all favorite reports, most recent first"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, topic, title, summary, created_at, word_count, status, is_favorite
            FROM reports 
            WHERE is_favorite = 1
            ORDER BY created_at DESC 
            LIMIT ?
        ''', (limit,))
        
        reports = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return reports

