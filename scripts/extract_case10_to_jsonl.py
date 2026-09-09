import os
import json
import PyPDF2

def main():
    pdf_path = os.path.join("data", "case_type_cyber", "raw", "CASE-2026-SYN-CYBER-10", "case_10.pdf")
    out_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "case10_import.jsonl")
    
    if not os.path.exists(pdf_path):
        print(f"ERROR: {pdf_path} not found.")
        return
        
    records = []
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                records.append({
                    "text": text.strip(),
                    "meta": {
                        "case_id": "CASE-2026-SYN-CYBER-10",
                        "page_number": i + 1
                    }
                })
                
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec) + "\n")
            
    print(f"Extracted {len(records)} pages from {pdf_path} to {out_path}")

if __name__ == "__main__":
    main()
