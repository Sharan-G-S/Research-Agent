"""
Research Agent - Flask Application
Main application with API endpoints
"""
from flask import Flask, render_template, request, jsonify, send_file
from research_engine import ResearchEngine
from journalist import Journalist
from database import Database
from config import Config
import os
import markdown
from datetime import datetime

app = Flask(__name__)
app.config.from_object(Config)
Config.init_app(app)

# Initialize components
research_engine = ResearchEngine()
journalist = Journalist()
db = Database()

@app.route('/')
def index():
    """Main application page"""
    return render_template('index.html')

@app.route('/api/research', methods=['POST'])
def research():
    """
    Initiate research on a topic
    POST body: { "topic": "research topic" }
    """
    try:
        data = request.get_json()
        topic = data.get('topic', '').strip()
        
        if not topic:
            return jsonify({'error': 'Topic is required'}), 400
        
        # Perform research
        research_data = research_engine.research(topic)
        
        # Generate report
        report = journalist.write_report(research_data)
        
        # Save to database
        report_id = db.save_report(
            topic=topic,
            title=report['title'],
            content=report['content'],
            summary=report['summary'],
            sources=report['sources'],
            word_count=report['word_count']
        )
        
        # Return report with ID
        return jsonify({
            'success': True,
            'report_id': report_id,
            'report': {
                'id': report_id,
                'title': report['title'],
                'summary': report['summary'],
                'content': report['content'],
                'word_count': report['word_count'],
                'sources': report['sources']
            }
        })
        
    except Exception as e:
        print(f"❌ Research error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """Get all reports"""
    try:
        reports = db.get_all_reports()
        return jsonify({'success': True, 'reports': reports})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/<int:report_id>', methods=['GET'])
def get_report(report_id):
    """Get specific report by ID"""
    try:
        report = db.get_report(report_id)
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        return jsonify({'success': True, 'report': report})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/<int:report_id>', methods=['DELETE'])
def delete_report(report_id):
    """Delete a report"""
    try:
        success = db.delete_report(report_id)
        if success:
            return jsonify({'success': True, 'message': 'Report deleted'})
        else:
            return jsonify({'error': 'Report not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search_reports():
    """Search reports by topic or title"""
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify({'error': 'Query parameter required'}), 400
        
        reports = db.search_reports(query)
        return jsonify({'success': True, 'reports': reports})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/<int:report_id>/<format>', methods=['GET'])
def export_report(report_id, format):
    """
    Export report in specified format
    Formats: html, markdown, pdf
    """
    try:
        report = db.get_report(report_id)
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        # Create exports directory
        export_dir = os.path.join(Config.REPORTS_DIR, 'exports')
        os.makedirs(export_dir, exist_ok=True)
        
        filename = f"report_{report_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if format == 'markdown':
            filepath = os.path.join(export_dir, f"{filename}.md")
            content = f"# {report['title']}\n\n"
            content += f"**Summary:** {report['summary']}\n\n"
            content += f"{report['content']}\n\n"
            content += "## Sources\n\n"
            for i, source in enumerate(report['sources'], 1):
                content += f"{i}. [{source['title']}]({source['url']})\n"
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return send_file(filepath, as_attachment=True, download_name=f"{filename}.md")
        
        elif format == 'html':
            filepath = os.path.join(export_dir, f"{filename}.html")
            html = journalist.format_for_display(report)
            
            # Wrap in full HTML document
            full_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{report['title']}</title>
    <style>
        body {{ font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }}
        h1 {{ font-size: 2.5em; margin-bottom: 10px; }}
        .summary {{ font-size: 1.2em; font-style: italic; margin: 20px 0; padding: 15px; background: #f5f5f5; }}
        .metadata {{ color: #666; margin: 10px 0; }}
        .content {{ margin: 30px 0; }}
        h2 {{ margin-top: 30px; }}
        .sources {{ margin-top: 40px; border-top: 2px solid #333; padding-top: 20px; }}
    </style>
</head>
<body>
    {html}
</body>
</html>"""
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(full_html)
            
            return send_file(filepath, as_attachment=True, download_name=f"{filename}.html")
        
        else:
            return jsonify({'error': 'Unsupported format. Use: html, markdown'}), 400
        
    except Exception as e:
        print(f"❌ Export error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'Research Agent'})

if __name__ == '__main__':
    print("🚀 Starting Research Agent...")
    print("📍 Access at: http://localhost:5000")
    app.run(debug=True, port=5000)
