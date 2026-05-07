import sys
from pypdf import PdfReader

def extract_text(pdf_path, txt_path):
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    with open(txt_path, "w") as f:
        f.write(text)

extract_text("./Legal/casanova-ai-privacy-policy.pdf", "pp.txt")
extract_text("./Legal/casanova-ai-terms-of-service.pdf", "tos.txt")
