# CareerCanvas

A local-first visual resume builder and career management workspace.

## Development status

The MIT-licensed application is under active development. The foundation and reusable Career Profile are implemented. Profile, Skills, Achievements, and Portfolio views support persistent editing; remaining workspace modules are still being implemented. See [validation](docs/VALIDATION.md) for bounded test evidence.

## Product scope

CareerCanvas separates a reusable Career Profile from independent resume documents. Planned capabilities include a visual editor, twelve distinct templates, PDF and DOCX export, version history, transparent ATS checks, job matching, cover letters, application tracking, interview preparation, goals, and career analytics.

## Privacy

Career information stays local by default. User resumes, imported documents, databases, exports, credentials, and application records must never be committed. Optional external AI requires explicit enablement and review of proposed edits.

## Stack

React, TypeScript, Vite, Tailwind CSS, dnd-kit, Zustand, React Hook Form, Zod, TipTap, and Recharts; Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy, Alembic, and SQLite. Chromium generates text-based PDF exports; python-docx generates editable Word documents.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Resume engine](docs/RESUME_ENGINE.md)
- [ATS analysis](docs/ATS_ANALYSIS.md)

## Installation

Use Python 3.11 or newer and Node.js 22 or newer. On Windows:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-lock.txt
cd frontend
npm.cmd ci
npm.cmd run build
cd ..
.\.venv\Scripts\python.exe run.py
```

Open http://127.0.0.1:8000. Startup applies Alembic migrations automatically without resetting existing data. Optional configuration is documented in `.env.example`; copy it to `.env` if needed. The default database is in the ignored `data/` directory.

For development, run `.venv/Scripts/python.exe -m uvicorn backend.app.main:create_app --factory --host 127.0.0.1 --port 8000` and `npm run dev` inside `frontend/` in separate terminals. Apply migrations first with `.venv/Scripts/python.exe -m alembic upgrade head`.

## Testing

```powershell
.\.venv\Scripts\python.exe -m pytest
cd frontend
npm.cmd test
npm.cmd run build
```

Backend tests use isolated temporary databases. Never use a personal workspace database as a test fixture.

Verified product capabilities, screenshots, and export validation results will be added as implementation progresses.

## Demo

Choose **Load Demo Career** in an empty workspace to load fictional AI/software engineer Alex Morgan: two experiences, two education records, twelve skills, three projects, a certification, two achievements, one publication, one language, and two portfolio entries. Demo loading refuses to replace existing profile data. No real personal information is included.
