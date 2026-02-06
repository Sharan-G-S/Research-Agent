# 🗞️ Research Agent

# Sharan G S
A professional research agent that combines web search capabilities with journalistic writing to produce **NYT-style investigative reports**.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0.0-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

- **🔍 Deep Web Research**: Intelligent multi-source web search with query expansion
- **✍️ NYT-Style Writing**: Professional journalistic article generation
- **📊 Source Analysis**: Automatic credibility scoring and ranking
- **🎨 Modern UI**: Beautiful, responsive interface with dark mode
- **📤 Export Options**: Export reports as HTML, Markdown, or PDF
- **💾 Report History**: Save and retrieve past research reports

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sharan-G-S/Research-Agent.git
   cd Research-Agent
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Open in browser**
   ```
   http://localhost:5000
   ```

## 📖 Usage

### Starting a Research

1. Enter your research topic in the input field
2. Click "Start Research"
3. Watch the progress as the agent:
   - 🔍 Searches multiple sources
   - 📊 Extracts relevant content
   - 🧠 Analyzes information
   - ✍️ Writes a professional report

4. Review the generated NYT-style article
5. Export as HTML or Markdown

### Example Topics

- "Climate Change Impact on Agriculture"
- "Artificial Intelligence in Healthcare"
- "Renewable Energy Trends 2026"
- "Quantum Computing Breakthroughs"
- "Space Exploration Developments"

## 🏗️ Architecture

```
Research Agent/
├── app.py                  # Flask application & API endpoints
├── research_engine.py      # Web search & content extraction
├── journalist.py           # NYT-style article generation
├── database.py            # SQLite database management
├── config.py              # Application configuration
├── requirements.txt       # Python dependencies
├── static/
│   ├── css/
│   │   └── style.css     # Modern design system
│   └── js/
│       └── app.js        # Frontend logic
└── templates/
    └── index.html        # Main application page
```

## 🔧 Configuration

Edit `config.py` to customize:

- **Research Settings**: Max sources, timeout, etc.
- **Writing Parameters**: Word count, style preferences
- **Export Options**: Available formats
- **Database Path**: SQLite database location

## 🎨 Features in Detail

### Research Engine
- Multi-query search strategy
- DuckDuckGo integration (no API key required)
- Intelligent source deduplication
- Credibility-based ranking
- Content extraction from web pages

### Journalist Module
- NYT-style article structure
- Professional tone and language
- Proper source citations
- Executive summaries
- Markdown to HTML conversion

### User Interface
- Clean, modern design
- Dark mode support
- Real-time progress tracking
- Responsive layout
- Smooth animations

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/research` | POST | Start new research |
| `/api/reports` | GET | Get all reports |
| `/api/reports/<id>` | GET | Get specific report |
| `/api/reports/<id>` | DELETE | Delete report |
| `/api/search?q=query` | GET | Search reports |
| `/api/export/<id>/<format>` | GET | Export report |

## 🛠️ Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: SQLite
- **Web Scraping**: BeautifulSoup4, Requests
- **Styling**: Custom CSS with modern design system
- **Fonts**: Inter (Sans), Merriweather (Serif)

## 📝 Report Structure

Each generated report includes:

1. **Compelling Headline**: NYT-style title
2. **Executive Summary**: Key findings overview
3. **Background & Context**: Topic introduction
4. **Key Findings**: Bullet-point highlights
5. **Expert Analysis**: In-depth examination
6. **Broader Implications**: Impact assessment
7. **Conclusion**: Summary and outlook
8. **Sources & References**: Full citation list

## 🔒 Privacy & Data

- All research is performed locally
- No external API keys required (uses DuckDuckGo)
- Reports stored in local SQLite database
- No user tracking or analytics

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by The New York Times' investigative journalism
- Built with modern web technologies
- Designed for researchers, journalists, and curious minds

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Made with 💚 from Sharan G S
