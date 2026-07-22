import os
import time
import uuid
import logging
from fpdf import FPDF
from datetime import datetime
import hashlib

logger = logging.getLogger(__name__)


def cleanup_old_reports(directory: str, max_age_seconds: int = 3600):
    """Delete generated PDF reports older than max_age_seconds (best-effort)."""
    now = time.time()
    try:
        for fname in os.listdir(directory):
            if fname.endswith(".pdf"):
                fpath = os.path.join(directory, fname)
                if os.path.isfile(fpath) and (now - os.path.getmtime(fpath)) > max_age_seconds:
                    os.remove(fpath)
                    logger.debug("Deleted stale report: %s", fname)
    except FileNotFoundError:
        pass
    except Exception as exc:
        logger.warning("Report cleanup error: %s", exc)


def generate_ncrb_report(module_source: str, evidence_data: dict, output_dir: str):
    """
    Generates a simulated NCRB/cybercrime.gov.in incident report as a PDF.
    """
    os.makedirs(output_dir, exist_ok=True)

    # Microsecond precision + short random suffix so two reports generated in
    # the same second don't collide/overwrite each other.
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    report_id = f"NCRB_{module_source.upper()}_{timestamp}_{uuid.uuid4().hex[:6]}"
    filename = f"{report_id}.pdf"
    filepath = os.path.join(output_dir, filename)
    
    # Calculate dummy hash of evidence
    evidence_str = str(evidence_data)
    evidence_hash = hashlib.sha256(evidence_str.encode()).hexdigest()
    
    pdf = FPDF()
    pdf.add_page()
    
    # Header
    pdf.set_font("Helvetica", 'B', 16)
    pdf.cell(0, 10, "OFFICIAL INCIDENT INTELLIGENCE REPORT", ln=True, align="C")
    pdf.set_font("Helvetica", 'I', 10)
    pdf.cell(0, 10, "(Simulated Demo for NCRB Submission Workflow)", ln=True, align="C")
    pdf.ln(10)
    
    # Meta
    pdf.set_font("Helvetica", 'B', 12)
    pdf.cell(50, 10, "Report ID:")
    pdf.set_font("Helvetica", '', 12)
    pdf.cell(0, 10, report_id, ln=True)
    
    pdf.set_font("Helvetica", 'B', 12)
    pdf.cell(50, 10, "Date/Time:")
    pdf.set_font("Helvetica", '', 12)
    pdf.cell(0, 10, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), ln=True)
    
    pdf.set_font("Helvetica", 'B', 12)
    pdf.cell(50, 10, "Module Source:")
    pdf.set_font("Helvetica", '', 12)
    pdf.cell(0, 10, module_source.upper(), ln=True)
    
    pdf.set_font("Helvetica", 'B', 12)
    pdf.cell(50, 10, "Evidence Hash:")
    pdf.set_font("Helvetica", '', 10)
    pdf.cell(0, 10, evidence_hash, ln=True)
    pdf.ln(10)
    
    # Evidence Data
    pdf.set_font("Helvetica", 'B', 14)
    pdf.cell(0, 10, "Evidence Details", ln=True)
    pdf.set_font("Helvetica", '', 11)
    
    for key, value in evidence_data.items():
        pdf.cell(50, 8, f"{key.replace('_', ' ').title()}:")
        pdf.multi_cell(0, 8, str(value))
        
    pdf.ln(20)
    pdf.set_font("Helvetica", 'I', 9)
    pdf.multi_cell(0, 5, "This is an automatically generated intelligence package from Digital Public Safety AI. It contains raw signal data and confidence scores. Not for direct prosecution without manual verification.")
    
    pdf.output(filepath)
    return filepath, report_id
