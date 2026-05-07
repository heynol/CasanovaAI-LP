import fitz # PyMuPDF

def extract_text(pdf_path, txt_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    with open(txt_path, "w") as f:
        f.write(text)

extract_text("./Legal/casanova-ai-privacy-policy.pdf", "src/assets/legal/pp.txt")
extract_text("./Legal/casanova-ai-terms-of-service.pdf", "src/assets/legal/tos.txt")
