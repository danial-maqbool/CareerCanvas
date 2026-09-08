# CareerCanvas

A local-first visual resume builder and career management workspace.

## Development status

Repository initialization is in progress. Application functionality and validation are not yet implemented.

## Product scope

CareerCanvas separates a reusable Career Profile from independent resume documents. Planned capabilities include a visual editor, twelve distinct templates, PDF and DOCX export, version history, transparent ATS checks, job matching, cover letters, application tracking, interview preparation, goals, and career analytics.

## Privacy

Career information stays local by default. User resumes, imported documents, databases, exports, credentials, and application records must never be committed. Optional external AI requires explicit enablement and review of proposed edits.

## Intended stack

React, TypeScript, Vite, Tailwind CSS, dnd-kit, Zustand, React Hook Form, Zod, TipTap, and Recharts; Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy, Alembic, and SQLite. Chromium generates text-based PDF exports; python-docx generates editable Word documents.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Resume engine](docs/RESUME_ENGINE.md)
- [ATS analysis](docs/ATS_ANALYSIS.md)

Installation instructions, verified capabilities, screenshots, and test results will be documented as implementation progresses.
