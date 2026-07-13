import re
import sys

def format_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
        
    out = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        # Is this line a heading?
        # Uppercase letters, spaces, maybe some numbers and punctuation
        is_heading = False
        upper_stripped = re.sub(r'[^A-Z]', '', line.upper())
        if len(upper_stripped) > 5 and line.upper() == line and not line.startswith('-'):
            is_heading = True
            
        if line.startswith('Last updated') or line == 'PRIVACY NOTICE' or line == 'TERMS AND CONDITIONS':
            is_heading = True
            
        # Is it a new bullet point?
        is_bullet = line.startswith('- ')
        
        # Does the previous line end with sentence-ending punctuation?
        prev_ended_with_punctuation = False
        if out:
            last_out_line = out[-1].strip()
            if re.search(r'[.?!:]$', last_out_line) or last_out_line.startswith('##'):
                prev_ended_with_punctuation = True
            # Also if it's a heading
            
        # Decision:
        if is_heading:
            if out:
                out.append("\n\n")
            out.append(f"## {line}\n\n")
        elif is_bullet:
            if out and not out[-1].endswith('\n\n'):
                out.append("\n\n")
            out.append(f"{line} ")
        else:
            # Normal line
            if prev_ended_with_punctuation and not is_bullet:
                # This should be a new paragraph, unless we are currently inside a bullet point continuation
                # Wait, if we are inside a bullet, and the previous line ended with punctuation... 
                # actually let's just add a newline if it's a new paragraph
                if out and out[-1].startswith('- ') and not prev_ended_with_punctuation:
                    pass
                else:
                    if out and not out[-1].endswith('\n\n'):
                        out.append("\n\n")
            
            # Join line
            out.append(f"{line} ")

    # Clean up double spaces and extra newlines
    result = "".join(out)
    result = re.sub(r' {2,}', ' ', result)
    result = re.sub(r'\n{3,}', '\n\n', result)
    
    with open(filepath, 'w') as f:
        f.write(result.strip() + "\n")

format_file('src/assets/legal/pp.txt')
format_file('src/assets/legal/tos.txt')
print("Formatting complete.")
