import re

def process_file(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # Remove header patterns
    # e.g., 24.2.2026, 15.34
    content = re.sub(r'^\d{1,2}\.\d{1,2}\.\d{4},\s\d{1,2}\.\d{2}\n', '', content, flags=re.MULTILINE)
    # e.g., Page X of Y
    content = re.sub(r'^Page \d+ of \d+\n', '', content, flags=re.MULTILINE)
    # e.g., firebasestorage link
    content = re.sub(r'^https://firebasestorage\.googleapis\.com.*?\n', '', content, flags=re.MULTILINE)
    
    # Fix bullet points
    # ● on its own line followed by text. We will change "●\n" to "- "
    content = re.sub(r'^●\s*\n', '- ', content, flags=re.MULTILINE)

    with open(filename, 'w') as f:
        f.write(content)

process_file('/Users/pascal/Documents/GitHub/CasanovaAI-LP/src/assets/legal/pp.txt')
process_file('/Users/pascal/Documents/GitHub/CasanovaAI-LP/src/assets/legal/tos.txt')
print("Done")
