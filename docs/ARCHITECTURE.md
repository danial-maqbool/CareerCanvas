# CareerCanvas architecture

Status: initial design contract; implementation pending.

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

## Export pipeline

Render semantic HTML through Chromium for selectable-text PDFs. Generate editable DOCX documents with python-docx. Validate versioned JSON backups before restoration and exclude credentials.

## AI assistance

AI remains optional and disabled by default. External requests contain only necessary text. Proposed rewrites require original/suggested review and factual-change checks before acceptance.
