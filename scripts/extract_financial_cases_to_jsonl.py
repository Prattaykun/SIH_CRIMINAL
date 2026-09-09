import os
import json
import PyPDF2
import glob

def main():
    raw_dir = os.path.join("data", "case_type_financial", "raw")
    pdf_files = glob.glob(os.path.join(raw_dir, "**", "*.pdf"), recursive=True)
    
    out_path = os.path.join("data", "case_type_financial", "ner", "financial_cases_raw.jsonl")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    
    records = []
    for pdf_path in pdf_files:
        case_id = os.path.basename(os.path.dirname(pdf_path))
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text and text.strip():
                    records.append({
                        "text": text.strip(),
                        "meta": {
                            "case_id": case_id,
                            "page_number": i + 1
                        }
                    })
                    
    with open(out_path, "w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec) + "\n")
            
    print(f"Extracted {len(records)} pages from {len(pdf_files)} PDFs to {out_path}")

if __name__ == "__main__":
    main()
