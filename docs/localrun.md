# Local Run Guide

Exact steps used to install dependencies, compile, and run the SIH 26189 stack on Windows (PowerShell) with **Neon PostgreSQL** + **Neo4j Aura**.

> Synthetic / demo only. Do not commit real credentials. Keep secrets in `apps/backend/.env` and `apps/frontend/.env.local` (gitignored).

---

## Prerequisites

| Tool | Used here | Notes |
|------|-----------|--------|
| Python | 3.13.2 | Prefer 3.11–3.12 if possible; see sklearn note below |
| Node.js | v20.17.0 | Repo README prefers v22+; v20 works with engine warnings |
| npm | 10.8.2 | |
| Neon + Neo4j Aura | configured in `.env` | Redis/Celery **not** required for prototype |

---

## 1. Backend — virtualenv & dependencies

From the **repo root** (`SIH_CRIMINAL`):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

### Install packages

`apps/backend/requirements.txt` pins `scikit-learn==1.4.1.post1`, which **has no Python 3.13 wheel** and fails to build without MSVC. On Python 3.13, install the same stack with a newer sklearn:

```powershell
.\.venv\Scripts\pip.exe install `
  "fastapi>=0.110.0" "uvicorn[standard]>=0.28.0" `
  "pydantic>=2.6.0" "pydantic-settings>=2.2.0" `
  "sqlalchemy>=2.0.25" "alembic>=1.13.0" "psycopg2-binary>=2.9.9" `
  "pytest>=8.0.0" "httpx>=0.27.0" "neo4j==5.27.0" "networkx==3.4.2" `
  "python-multipart>=0.0.9" "faker>=24.0.0" "passlib[bcrypt]>=1.7.4" `
  "python-jose[cryptography]>=3.3.0" "jinja2>=3.1.2" `
  "celery>=5.3.6" "redis>=5.0.1" "PyMuPDF>=1.23.0" "python-docx>=1.1.0" `
  "scikit-learn>=1.5.0"
```

On Python 3.11/3.12 you can instead use:

```powershell
.\.venv\Scripts\pip.exe install -r apps\backend\requirements.txt
```

Verify:

```powershell
.\.venv\Scripts\python.exe -c "import fastapi, uvicorn, neo4j, sqlalchemy, alembic, sklearn; print('ok', sklearn.__version__)"
```

### Backend env

Ensure `apps/backend/.env` contains (values from your cloud consoles):

```env
DATABASE_URL=postgresql+psycopg2://USER:PASS@HOST/neondb?sslmode=require
NEO4J_URI=neo4j+s://xxxx.databases.neo4j.io
NEO4J_USER=...
NEO4J_PASSWORD=...
NEO4J_DATABASE=...
FRONTEND_URL=http://localhost:3000
EXTRACTION_PROVIDER=MOCK
```

Notes:

- Use `postgresql+psycopg2://` (SQLAlchemy driver), not bare `postgresql://`.
- App settings load both `.env` and `apps/backend/.env` when started from the repo root.

### Database migrations (Neon)

`alembic.ini` defaults to SQLite; override the URL from `.env`:

```powershell
$env:DATABASE_URL = (Select-String -Path apps\backend\.env -Pattern '^DATABASE_URL=(.+)$').Matches.Groups[1].Value

.\.venv\Scripts\python.exe -c @"
import os
from alembic.config import Config
from alembic import command
cfg = Config('apps/backend/alembic.ini')
cfg.set_main_option('sqlalchemy.url', os.environ['DATABASE_URL'])
command.upgrade(cfg, 'head')
print('ALEMBIC_OK')
"@
```

---

## 2. Frontend — dependencies & compile

```powershell
cd apps\frontend
npm install
```

Create `apps/frontend/.env.local` if missing:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Type-check and production build:

```powershell
npm run type-check
npm run build
```

(`npm run build` also type-checks via Next.js.)

---

## 3. Run both servers

Use **two** terminals from the repo root (activate `.venv` in the backend terminal).

### Backend (port 8000)

```powershell
cd D:\projects\SIH\SIH_CRIMINAL
.\.venv\Scripts\Activate.ps1
python -m uvicorn apps.backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health: http://localhost:8000/api/v1/health  
- Swagger: http://localhost:8000/docs  
- Graph health: http://localhost:8000/api/v1/graph/health  

### Frontend (port 3000)

```powershell
cd D:\projects\SIH\SIH_CRIMINAL\apps\frontend
npm run dev
```

- UI: http://localhost:3000  

Redis / Celery / Docker Postgres / local Neo4j are **optional**. Without Redis, extraction falls back to FastAPI `BackgroundTasks`.

---

## 4. Quick smoke checks

```powershell
# Backend
Invoke-RestMethod http://localhost:8000/api/v1/health
Invoke-RestMethod http://localhost:8000/api/v1/graph/health

# Frontend (expect HTML)
Invoke-WebRequest http://localhost:3000 -UseBasicParsing | Select-Object StatusCode
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `scikit-learn` build / MSVC error on 3.13 | Install `scikit-learn>=1.5.0` as above, or use Python 3.12 |
| Node `EBADENGINE` warnings | Prefer Node 22+; v20.17 often still runs |
| Alembic hits SQLite | Always pass Neon `DATABASE_URL` into `sqlalchemy.url` as shown |
| Neo4j `unavailable` | Confirm Aura instance is running (not paused) and `.env` uses `neo4j+s://` |
| CORS errors | `FRONTEND_URL=http://localhost:3000` in backend `.env` |
| Port in use | Stop the other process or change `--port` / Next port |

---

## What was run in this environment (checklist)

- [x] `python -m venv .venv`
- [x] Backend pip install (with `scikit-learn>=1.5.0` for Py 3.13)
- [x] `npm install` in `apps/frontend`
- [x] `apps/frontend/.env.local` with `NEXT_PUBLIC_API_URL`
- [x] Alembic `upgrade head` against Neon
- [x] `npm run type-check` + `npm run build`
- [x] Backend uvicorn on `:8000`
- [x] Frontend `npm run dev` on `:3000`
