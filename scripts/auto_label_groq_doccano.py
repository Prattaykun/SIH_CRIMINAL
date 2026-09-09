import os
import json
import time
import re
from groq import Groq

def main():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("ERROR: GROQ_API_KEY environment variable is not set.")
        return
        
    model_name = os.environ.get("GROQ_MODEL", "groq/compound")
    client = Groq(api_key=api_key)
    
    in_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_import.jsonl")
    out_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_auto_labeled_groq.jsonl")
    
    if not os.path.exists(in_path):
        print(f"ERROR: Input file not found at {in_path}")
        return
        
    with open(in_path, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]
        
    print(f"Loaded {len(records)} records from {in_path}")
    print(f"Using model {model_name}")
    
    system_prompt = (
        "You are an AI specialized in named entity extraction. "
        "You always output strictly valid JSON with a root object containing an 'entities' array. "
        "Do NOT output markdown wrappers like ```json, just the raw JSON object."
    )
    
    labeled_records = []
    
    for i, record in enumerate(records):
        text = record.get("text", "")
        
        user_prompt = f"""Extract entities from the text below.
Restrict labels strictly to ONLY these: PERSON, ORGANIZATION, ADDRESS, LOCATION, ROLE.
DO NOT label phone numbers, account numbers, dates, amounts, UPI IDs, emails, vehicle numbers, or case IDs.

You must provide exact character offsets for each entity. The 'start' is the 0-based inclusive index, and the 'end' is the 0-based exclusive index of the entity text within the given text.

Output JSON schema:
{{
  "entities": [
    {{"label": "LABEL_NAME", "text": "extracted text", "start": integer, "end": integer}}
  ]
}}

Text to analyze:
{text}
"""
        
        try:
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                model=model_name,
                temperature=0.0
            )
            
            result_text = response.choices[0].message.content
            
            # Strip markdown if present
            result_text = re.sub(r'^\s*```(?:json)?', '', result_text)
            result_text = re.sub(r'```\s*$', '', result_text)
            result_text = result_text.strip()
            
            parsed = json.loads(result_text)
            
            # Convert standard JSON entity array back to Doccano format [start, end, label]
            doccano_entities = []
            for ent in parsed.get("entities", []):
                doccano_entities.append([ent["start"], ent["end"], ent["label"]])
                
            record["entities"] = doccano_entities
            
        except Exception as e:
            print(f"Warning: Error processing record {i}: {e}")
            # Gracefully handle the error by writing empty entities and keeping original data
            record["entities"] = []
            
        labeled_records.append(record)
        
        # Progress indication
        if (i + 1) % 10 == 0:
            print(f"Processed {i + 1}/{len(records)} records...")
            
        # Rate limit pacing
        time.sleep(0.4)
        
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for rec in labeled_records:
            f.write(json.dumps(rec) + "\n")
            
    print(f"Finished processing {len(records)} records.")
    print(f"Output written to {out_path}")

if __name__ == "__main__":
    main()
