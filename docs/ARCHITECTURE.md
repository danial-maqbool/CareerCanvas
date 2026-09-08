# CareerCanvas architecture

Status: Phase 2 foundation implemented. The document distinguishes the running foundation from contracts for upcoming product modules.

## Frontend

React and TypeScript provide the workspace shell and a three-panel resume editor. Zustand manages active document state; React Hook Form and Zod validate editing forms. dnd-kit supports pointer and keyboard reordering, and Recharts visualizes recorded career activity.

## Resume editor state

Career Profile records are reusable source material. Each resume owns a content snapshot, ordered sections, visibility flags, template identifier, and style settings. Switching templates must preserve all content. Version snapshots remain immutable when restored.

## Autosave

Debounce persisted edits by 500–1000 ms. Report pending, saved, and failed states accurately. Maintain undo and redo independently from saved version history.

## Template engine

Use shared semantic document content with distinct presentation layouts. Keep resume paper print-appropriate in every application theme.

## Backend and database

FastAPI validates requests through Pydantic v2. SQLAlchemy persists related profile, resume, application, interview, goal, tag, and history records in SQLite. Alembic migrations preserve existing user data across schema changes.

The foundation includes the settings and audit-event tables. Product-specific tables arrive in subsequent migrations. `run.py` applies migrations before serving the Vite production build. The app factory accepts an isolated database URL for tests; request handlers use an application-owned SQLAlchemy session factory. SQLite foreign keys and a busy timeout are enabled on each connection.

The server binds to loopback by default, validates the Host header, and refuses cross-origin writes. No telemetry, external fonts, or external AI requests are made by the foundation. It is a single-device application, not a hosted multi-user authentication system.

## Export pipeline

Render semantic HTML through Chromium for selectable-text PDFs. Generate editable DOCX documents with python-docx. Validate versioned JSON backups before restoration and exclude credentials.

## AI assistance

AI remains optional and disabled by default. External requests contain only necessary text. Proposed rewrites require original/suggested review and factual-change checks before acceptance.
