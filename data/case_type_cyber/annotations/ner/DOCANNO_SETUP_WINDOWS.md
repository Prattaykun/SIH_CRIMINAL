# Local Doccano Setup Guide (Windows)

This guide provides instructions to set up Doccano locally on Windows for manual NER annotation of the SIH 26189 dataset.

## Installation and Initialization

Open PowerShell and run the following commands sequentially:

1. **Activate the existing virtual environment:**
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

2. **Install Doccano:**
   ```powershell
   pip install doccano
   ```

3. **Initialize Doccano:**
   ```powershell
   doccano init
   ```

4. **Create a local admin account:**
   *(Do NOT store a real/production password in Git. Use a local demo credential for this prototype.)*
   ```powershell
   doccano createuser --username admin --password "DemoPassword123!" --email admin@example.com --no-input
   ```

5. **Start Doccano server (port 8001 to avoid conflicts with FastAPI):**
   ```powershell
   doccano webserver --port 8001
   ```

6. **Start Doccano Celery worker (in a separate PowerShell window):**
   ```powershell
   .\.venv\Scripts\Activate.ps1
   doccano task
   ```

## Project Setup

1. Open your browser and navigate to `http://localhost:8001`.
2. Log in using the admin credentials you created.
3. Click **Create** to make a new project.
4. Select **Sequence Labeling**.
5. Set the Project Name exactly to: `SIH Investigation NER v1`
6. Check "Allow overlapping entities" if you wish, though guidelines discourage overlap.
7. Click **Save**.

## Adding Labels

Go to **Labels** in the left menu. Add exactly these five labels in this order:
1. `PERSON`
2. `ORGANIZATION`
3. `ADDRESS`
4. `LOCATION`
5. `ROLE`

*(Assign distinct, recognizable colors to each for easier reading.)*

## Importing the Dataset

1. Go to **Dataset** in the left menu.
2. Click **Import Dataset**.
3. Select format: **JSONL**.
4. Choose the generated file: `data/case_type_cyber/annotations/ner/doccano_import.jsonl`.
5. Start the import. (Ensure your Doccano task worker is running if it hangs).

## Annotation Workflow

1. Navigate to **Start Annotation**.
2. Review the document text. Consult `NER_LABEL_GUIDE_V1.md` for boundary and ambiguity rules.
3. Highlight text and select the appropriate label.
4. Mark the document as **Checked** once finished.
5. Move to the next page.

## Exporting Annotations

1. Go to **Dataset**.
2. Click **Export Dataset**.
3. Choose format: **JSONL**.
4. Download and save the exported file to:
   `data/case_type_cyber/annotations/ner/doccano_reviewed_export.jsonl`

## Stopping the Server

Press `Ctrl+C` in your PowerShell windows running the `doccano webserver` and `doccano task`.

## Troubleshooting

- **Port 8001 conflict:** Ensure no other service uses port 8001, or change it via `--port 8002`.
- **Missing venv activation:** If `doccano` is not recognized, ensure you ran `.\.venv\Scripts\Activate.ps1`.
- **Duplicate cases imported:** If you accidentally imported the dataset twice, you must delete the project and recreate it to avoid duplication.
