"""
SIH-26189: Auto-label Doccano JSONL using Gemini API.

Environment variables required:
  GEMINI_API_KEY   - Google AI Studio API key

Usage:
  python scripts/auto_label_vertex_doccano.py
"""

import os
import json
import time
from google import genai
from google.genai import types

INPUT_PATH = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_import.jsonl")
OUTPUT_PATH = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_auto_labeled_vertex.jsonl")
ALLOWED_LABELS = {"PERSON", "ORGANIZATION", "ADDRESS", "LOCATION", "ROLE"}

SYSTEM_PROMPT = """You are an expert Named Entity Recognition (NER) system
specialised in Indian legal documents, cybercrime case files, FIR reports,
witness statements, bank-transaction narratives, and surveillance records.

Your task is to extract entities from the given text and return them as
**strict JSON only** — no explanation, no markdown, no extra text.

Extract entities for EXACTLY these five label types:
  PERSON        – real individual names (not pronouns, not roles alone)
  ORGANIZATION  – companies, banks, government agencies, courts, police units
  ADDRESS       – street-level postal addresses or specific premises
  LOCATION      – cities, states, countries, districts, landmarks, areas
  ROLE          – job titles, designations, occupational roles

Rules:
  1. Character offsets are (start inclusive, end exclusive) into the original text.
  2. The "text" field MUST be the exact substring at text[start:end].
  3. Do NOT label phone numbers, account numbers, dates, currency amounts,
     UPI IDs, email addresses, vehicle registration numbers, or case IDs.
  4. If no entities are found, return {"entities": []}.
  5. No overlapping spans.

Output format (JSON only, nothing else):
{
  "entities": [
    {"label": "PERSON", "text": "<exact substring>", "start": 0, "end": 10}
  ]
}"""

USER_PROMPT_TEMPLATE = "Extract entities from the following text as JSON:\n\n{text}"

def _strip_markdown(text: str) -> str:
    if not text: return ""
    text = text.strip()
    if text.startswith("```json"): text = text[7:]
    elif text.startswith("```"): text = text[3:]
    if text.endswith("```"): text = text[:-3]
    return text.strip()

def call_gemini_ner(client: genai.Client, text: str) -> list[dict]:
    response = client.models.generate_content(
        model='gemini-3.6-flash',
        contents=USER_PROMPT_TEMPLATE.format(text=text),
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.0,
            response_mime_type='application/json'
        )
    )
    raw = _strip_markdown(response.text)
    
    try:
        data = json.loads(raw)
    except Exception as e:
        print(f"Failed to parse JSON: {e}")
        return []

    entities: list[dict] = data.get("entities", [])
    validated: list[dict] = []
    
    for ent in entities:
        label = str(ent.get("label", "")).strip().upper()
        start = int(ent.get("start", -1))
        end = int(ent.get("end", -1))
        ent_text = str(ent.get("text", ""))

        if label not in ALLOWED_LABELS: continue
        if start < 0 or end <= start or end > len(text): continue
        
        actual_snippet = text[start:end]
        if actual_snippet != ent_text: ent_text = actual_snippet

        validated.append({"label": label, "text": ent_text, "start": start, "end": end})

    return validated

def doccano_record(record: dict, entities: list[dict]) -> dict:
    new_record = record.copy()
    new_record["entities"] = [[ent["start"], ent["end"], ent["label"]] for ent in entities]
    return new_record

def main() -> None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not set.")
        return

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    with open(INPUT_PATH, "r", encoding="utf-8") as fh:
        records = [json.loads(line) for line in fh if line.strip()]

    total = len(records)
    client = genai.Client()
    out_records, processed, errors = [], 0, 0

    for idx, record in enumerate(records):
        text: str = record.get("text", "")
        if not text.strip(): continue

        try:
            entities = call_gemini_ner(client, text)
            new_record = doccano_record(record, entities)
        except Exception as exc:
            print(f"  [ERROR] record {idx}: {exc}")
            new_record = doccano_record(record, [])
            errors += 1

        out_records.append(new_record)
        processed += 1
        if processed % 10 == 0: print(f"  Processed {processed}/{total} records ...")
        
        # Adding a 4-second delay between requests to avoid hitting the 15 Requests Per Minute free-tier quota limits
        time.sleep(4)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as fh:
        for rec in out_records:
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")

    print(f"\nAuto-labeling complete. Output: {OUTPUT_PATH}")

if __name__ == "__main__": main()
