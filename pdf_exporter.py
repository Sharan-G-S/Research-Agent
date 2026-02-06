"""
PDF Export Module - Generate professional PDF reports
Uses ReportLab to create beautifully formatted PDF documents
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from datetime import datetime
import os

class PDFExporter:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Create custom paragraph styles for the report"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='ReportTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='ReportSubtitle',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))
        
        # Summary style
        self.styles.add(ParagraphStyle(
            name='ReportSummary',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#334155'),
            spaceAfter=16,
            spaceBefore=10,
            leftIndent=20,
            rightIndent=20,
            alignment=TA_JUSTIFY,
            fontName='Helvetica-Oblique',
            leading=16
        ))
        
        # Section heading style
        self.styles.add(ParagraphStyle(
            name='ReportSectionHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=10,
            spaceBefore=16,
            fontName='Helvetica-Bold'
        ))
        
        # Body text style
        self.styles.add(ParagraphStyle(
            name='ReportBody',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=12,
            alignment=TA_JUSTIFY,
            fontName='Times-Roman',
            leading=14
        ))
        
        # Source style
        self.styles.add(ParagraphStyle(
            name='ReportSource',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#475569'),
            spaceAfter=6,
            leftIndent=10,
            fontName='Helvetica'
        ))
    
    def generate_pdf(self, report: dict, filepath: str) -> str:
        """
        Generate a professional PDF report
        
        Args:
            report: Dictionary containing report data
            filepath: Path where PDF should be saved
        
        Returns:
            Path to generated PDF file
        """
        # Create PDF document
        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Container for PDF elements
        story = []
        
        # Add header with logo/branding
        story.append(self._create_header())
        story.append(Spacer(1, 0.3*inch))
        
        # Add title
        title = Paragraph(report['title'], self.styles['ReportTitle'])
        story.append(title)
        story.append(Spacer(1, 0.1*inch))
        
        # Add metadata
        metadata = f"Generated on {datetime.now().strftime('%B %d, %Y')} | {report['word_count']} words | {len(report.get('sources', []))} sources"
        story.append(Paragraph(metadata, self.styles['ReportSubtitle']))
        story.append(Spacer(1, 0.2*inch))
        
        # Add horizontal line
        story.append(self._create_line())
        story.append(Spacer(1, 0.2*inch))
        
        # Add summary box
        summary_title = Paragraph("<b>Executive Summary</b>", self.styles['Normal'])
        story.append(summary_title)
        summary = Paragraph(report['summary'], self.styles['ReportSummary'])
        story.append(summary)
        story.append(Spacer(1, 0.3*inch))
        
        # Add main content
        content = report['content']
        
        # Parse content and add sections
        sections = content.split('\n\n')
        for section in sections:
            if section.strip():
                # Check if it's a heading
                if section.startswith('## '):
                    heading_text = section.replace('## ', '')
                    story.append(Paragraph(heading_text, self.styles['ReportSectionHeading']))
                elif section.startswith('### '):
                    heading_text = section.replace('### ', '')
                    story.append(Paragraph(f"<b>{heading_text}</b>", self.styles['ReportBody']))
                else:
                    # Regular paragraph
                    # Handle bold text
                    formatted_text = section.replace('**', '<b>').replace('**', '</b>')
                    para = Paragraph(formatted_text, self.styles['ReportBody'])
                    story.append(para)
        
        # Add sources section
        if report.get('sources'):
            story.append(Spacer(1, 0.3*inch))
            story.append(self._create_line())
            story.append(Spacer(1, 0.2*inch))
            story.append(Paragraph("Sources & References", self.styles['ReportSectionHeading']))
            story.append(Spacer(1, 0.1*inch))
            
            for i, source in enumerate(report['sources'], 1):
                source_text = f"{i}. <b>{source['title']}</b><br/>"
                source_text += f"   <i>{source.get('source', 'Unknown')}</i><br/>"
                source_text += f"   <link href='{source['url']}'>{source['url']}</link>"
                story.append(Paragraph(source_text, self.styles['ReportSource']))
                story.append(Spacer(1, 0.05*inch))
        
        # Add footer
        story.append(Spacer(1, 0.3*inch))
        story.append(self._create_line())
        footer_text = "Generated by Research Agent - NYT-Style Investigative Reports"
        story.append(Paragraph(footer_text, self.styles['ReportSubtitle']))
        
        # Build PDF
        doc.build(story, onFirstPage=self._add_page_number, onLaterPages=self._add_page_number)
        
        return filepath
    
    def _create_header(self):
        """Create header with branding"""
        header_text = "🗞️ <b>RESEARCH AGENT</b>"
        return Paragraph(header_text, self.styles['ReportSubtitle'])
    
    def _create_line(self):
        """Create a horizontal line"""
        from reportlab.platypus import HRFlowable
        return HRFlowable(
            width="100%",
            thickness=1,
            color=colors.HexColor('#e2e8f0'),
            spaceBefore=5,
            spaceAfter=5
        )
    
    def _add_page_number(self, canvas, doc):
        """Add page numbers to each page"""
        page_num = canvas.getPageNumber()
        text = f"Page {page_num}"
        canvas.saveState()
        canvas.setFont('Helvetica', 9)
        canvas.setFillColor(colors.HexColor('#94a3b8'))
        canvas.drawRightString(7.5*inch, 0.5*inch, text)
        canvas.restoreState()
