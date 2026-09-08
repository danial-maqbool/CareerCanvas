# Architecture

## Frontend

React 19 and TypeScript run in Vite, with Tailwind CSS and component-specific CSS. The workspace exposes Dashboard, Resumes, Career Profile, Applications, Cover Letters, Achievements, Skills, Portfolio, Interviews, Career Goals, Analytics, Templates, and Settings. Recharts reads API-derived statistics; there are no static production analytics values. React Hook Form/Zod validate career forms. Native dialog drawers provide focus containment; visible labels, focus rings, and keyboard alternatives accompany pointer interactions.

## Resume Editor State

`frontend/src/editor-store.ts` owns the active resume snapshot, selected section, save state, and up to 100 undo snapshots. Resume documents contain personal details, ordered sections, independently editable items, source item identifiers, visibility flags, a template key, and style settings. Source IDs preserve provenance; source profile edits do not silently propagate into existing resumes. Template changes only replace presentation settings. TipTap stores a restricted rich-text tree and synchronized plain summary text for matching and analysis.

## Autosave

Edits debounce for 700 ms. Writes are serialized so a slow request cannot overwrite a newer local edit. The server compares the supplied revision with the stored revision and rejects stale writes with HTTP 409. Save indicators distinguish pending, saved, and error states. Export and version actions flush pending edits. Undo/redo is recent editing history; immutable saved versions are a separate durable mechanism.

## Template Engine

`ResumePaper.tsx`, `templates.ts`, and `templates.css` render one validated document through twelve presentation layouts. `PaginatedPaper.tsx` measures real browser markup before allocating pages. The preview and print route share content and styling. A4/Letter paper remains white and print-appropriate in all application themes. See [resume engine](RESUME_ENGINE.md).

## Resume Data Model

Career Profile is reusable source content. Individual resumes are independent snapshots, not live views over the profile. Their section items retain source IDs where applicable but own customized payloads. Hiding retains data; duplication deep-copies it. Resume versions store immutable JSON snapshots and notes. A recursive comparison reports added, removed, and modified values, including reordered arrays. Restoring first creates a safety version and retains every newer snapshot.

## Backend

FastAPI/Pydantic v2 validate requests. An application factory owns the SQLAlchemy engine and session factory, making isolated test databases straightforward. Loopback hosting, trusted-host checks, and cross-origin write rejection protect the intended local single-user workflow. The API is registered before the static SPA fallback. `run.py` selects the local virtual environment, applies Alembic migrations, and serves the built frontend. No database deletion is required for updates.

## Database

SQLite enables foreign keys and a busy timeout. Ten incremental Alembic migrations establish:

1. Settings and major-action audit events.
2. Career profiles and typed career items.
3. Independent resumes.
4. Immutable resume versions.
5. Saved ATS and job-match analyses.
6. Cover letters and letter versions.
7. Job applications and application history.
8. Interviews, contacts, STAR stories, and questions.
9. Career goals.
10. Tags.

Profile items use a profile foreign key, indexed kind, and Pydantic-validated JSON rather than a separate SQL table for each subtype. Resume/letter snapshots similarly use typed JSON for portable independent documents. SQL foreign keys connect jobs to documents/versions and interviews/contacts to applications; deletion policies retain independent records with nullable links where appropriate. STAR and preparation arrays reference validated IDs inside JSON; API deletion unlinks those references without deleting the story. This is an intentional hybrid relational/document model, not an implementation of every suggested table in the product brief.

Application transitions append timeline entries. Analytics use recorded history so a later rejection does not erase a previously reached interview stage. Tags are reusable labels: rename propagates references, and delete removes the label without deleting tagged records. Major actions are audited; individual keystrokes are not.

## Export Pipeline

The PDF endpoint opens a local print route in Playwright Chromium, blocks third-party network requests, waits for fonts and pagination, checks page geometry, and prints tagged selectable text. It verifies resulting page count. Oversized indivisible content returns actionable HTTP 422 guidance. A semaphore bounds concurrent exports. DOCX uses python-docx semantic paragraphs and hyperlinks. JSON exports validate an explicit format/version before import.

Complete workspace backups include profile, resumes and versions, jobs and histories, letters, interviews, contacts, goals, tags, analyses, audit records, and workspace preferences. Credentials are excluded. Restore validates table structure, types, payload schemas, and relationships before writes, requires explicit approval, creates a pre-restore backup, and replaces data transactionally. Validation failure leaves existing data intact.

## AI Assistance

AI is optional and off by default. Gemini requires configured credentials/model and per-request consent; Ollama uses localhost and a configured model. Only selected text is sent. The API returns a suggestion separately from source content. Checks flag new detected numbers (including written numbers), dates, technologies, qualifications, and named entities. The UI blocks acceptance while factual flags remain and allows reject/edit. These heuristics do not guarantee factual equivalence: human review is required. Live provider availability is unverified; deterministic guards and mocked provider flows are tested. No specific Gemini model is hardcoded.

## Tests and Privacy

Pytest uses temporary SQLite databases. Playwright fixtures launch their own servers and restore only isolated test state; the integrated journey verifies restart persistence. The guarded screenshot script requires the fictional demo profile and companies. Private databases/documents/backups and credentials are ignored. There is no telemetry, required external font, automatic resume upload, multi-user authentication, or encryption-at-rest layer.
