# CareerCanvas

**One career profile. Many tailored resumes. A workspace for everything that comes next.**

CareerCanvas is an MIT-licensed, local-first visual resume editor and career management application. Build reusable career content, import existing resumes, compose independent resume versions, run ATS-readiness checks, export documents, and track applications through interviews and offers.

![CareerCanvas dashboard with fictional data](docs/screenshots/dashboard.png)

## Overview

A single-user desktop web application with a local SQLite database, 13 workspace areas, 12 distinct templates, and 80 documented capability groups. All committed screenshots and demo records are fictional.

## Why CareerCanvas

Your career history is broader than any one application. Store experience, skills, projects, and achievements once; select and customize a different subset for each resume. Editing one resume never rewrites the source profile or sibling documents. Application history connects the exact resume version used with observed outcomes.

This project demonstrates advanced frontend interaction, document parsing and generation, drag-and-drop editing, state management, template systems, career data modeling, versioning, ATS analysis, data visualization, and human-controlled AI assistance.

## Features

- Visual resume library: naming, duplication, archive, primary selection, thumbnails, versions, and exports.
- Three-panel editor: inline text, rich summaries, section and bullet reordering, live pagination, and bounded one-page fitting.
- Local PDF, DOCX, and TXT resume import with review, source evidence, duplicate handling, and Career Profile mapping.
- Direct uploaded-resume ATS review with document inspection and an extracted-text view before any CareerCanvas rebuild.
- Reusable profile, skills, achievements, experience, education, projects, certifications, publications, languages, references, and portfolio.
- Transparent ATS checks and job matching; reviewed tailored copies preserve originals.
- Cover letters, application Kanban, contacts, follow-ups, interviews, STAR stories, question bank, goals, and analytics.
- Rearrangeable dashboard, search, command palette, quick add, themes, tags, and validated workspace backup/restore.

See the [numbered capability inventory](docs/FEATURES.md), [resume import guide](docs/RESUME_IMPORT.md), [validation report](docs/VALIDATION.md), and [complete delivery report](docs/DELIVERY.md).

## Screenshots

| Resume workspace | Career workspace |
| --- | --- |
| [Resume library](docs/screenshots/resume_library.png) | [Career profile](docs/screenshots/career_profile.png) |
| [Interactive editor](docs/screenshots/resume_editor.png) | [Application Kanban](docs/screenshots/application_kanban.png) |
| [Template gallery](docs/screenshots/template_gallery.png) | [Job detail](docs/screenshots/job_detail.png) |
| [ATS analysis](docs/screenshots/ats_analysis.png) | [Interview preparation](docs/screenshots/interview_prep.png) |
| [Job matching](docs/screenshots/job_match.png) | [Career analytics](docs/screenshots/career_analytics.png) |
| [Version comparison](docs/screenshots/version_comparison.png) | [Dashboard](docs/screenshots/dashboard.png) |

## Interactive Resume Editor

![Three-panel editor](docs/screenshots/resume_editor.png)

A paginated paper document sits between section controls and selected content/style properties. Edit visible text inline, format summaries with TipTap, reorder bullets and sections using drag handles or keyboard controls, and hide content without deleting it. Custom sections can be duplicated.

Zustand maintains undo/redo history. A serialized, 700 ms debounced autosave persists edits with revision conflict detection. Ctrl+S, Ctrl+Z, Ctrl+Shift+Z, and Ctrl+K support common workflows. Mobile panels become drawers, with an independently zoomable paper preview.

## Template System

**Classic, Modern, Minimal, Professional, Technical, Executive, Compact, Academic, Creative, Two Column, Developer, and Research.**

Templates differ in heading treatments, alignment, type hierarchy, rails, and column layout. Filter the gallery and preview your data before applying a template. Switching presentation preserves content. Customize system fonts, type size, line height, margins, section/bullet spacing, headings, alignment, dates, and three colors. A4 and US Letter are supported.

## Career Profile

The profile is reusable source material rather than a resume. Structured drawers manage personal information and ten content categories. Completion guidance focuses on useful essentials; references default to excluded. Achievements can be reused, skills have categories and learning metadata, and portfolio records hold project/research/demo links. Public GitHub repository import previews retrieved metadata before adding a project.

## Resume Import & Direct ATS Review

Use **Import Resume** from Dashboard or Career Profile to process a PDF, DOCX, or TXT resume locally. CareerCanvas detects common sections, proposes personal and career-profile fields, shows confidence and source evidence, and requires review before it writes anything. Likely duplicates support explicit **Keep existing**, **Merge**, **Replace existing**, or **Import as new** actions.

Use **Upload Resume for ATS Review** from Dashboard or Resumes to inspect an existing file directly. The review checks extractable text, contact details, standard sections, page count, likely reading-order complexity, image-based risk, and document structure. The **Extracted Text** tab shows what the parser can actually read. Detected web links remain clickable. The same upload can then be imported into Career Profile or converted into an editable CareerCanvas resume without uploading it again.

Normal digital PDFs use selectable-text extraction. Image-only/scanned PDFs are detected and flagged; automatic OCR is not bundled. DOCX parsing reads paragraphs, tables, and hyperlinks and warns when much of the content is stored in tables. The original uploaded file is processed in memory by the local server and is not retained by this workflow. See [Resume Import & Direct ATS Review](docs/RESUME_IMPORT.md).

## ATS Analysis

Eleven deterministic checks cover structured text, headings, reading order, critical image content, contact details, experience, education, skills, readable type, and page count. Findings explain severity and weight; edits invalidate stale results. Direct uploaded-file review uses corresponding file-level evidence instead of requiring a CareerCanvas document first.

**CareerCanvas ATS Readiness Score is an application-specific heuristic. It is not a score returned by a real employer ATS.** See the [complete formula and limitations](docs/ATS_ANALYSIS.md).

## Job Tailoring

Paste a job description to extract skills, responsibilities, experience requirements, education, and keywords. Matched, missing, and related skills remain distinct. A transparent score combines applicable skill, keyword, experience, education, and role components. Suggestions reference existing profile evidence. Review the selection and approve a new tailored copy; missing skills are never silently added.

Optional Gemini and local Ollama adapters propose clearer, stronger, shorter, or more technical wording. AI is disabled by default. Gemini requires per-request consent. Original and suggested text remain separate; detected factual changes block acceptance until resolved. These checks assist human review and cannot prove factual equivalence. Live providers require your configuration and were not certified by mocked provider tests.

## Job Application Tracker

![Application Kanban](docs/screenshots/application_kanban.png)

Move applications through Interested, Applied, Screening, Interview, Technical Interview, Final Interview, Offer, Rejected, Withdrawn, and Accepted. Detail drawers store company, role, source, compensation, dates, job description, document versions, contacts, tasks, and follow-ups. Changes create a timeline. Interview preparation combines a seven-step checklist, STAR stories, and categorized questions.

## Career Analytics

Charts use persisted records: submissions, response/interview/offer rates, average response time, sources, roles, months, funnel progression, and outcomes by resume. These are **observed application outcomes**, not evidence that a resume caused success. Goals track dates, milestones, and progress. Dashboard widgets can be reordered, hidden, resized, or reset.

## Export System

- **PDF:** Chromium prints the shared HTML/CSS renderer with selectable text, hyperlinks, explicit page sizes, and measured boundaries. Indivisible oversized content produces guidance instead of a clipped export.
- **DOCX:** python-docx creates editable headings, paragraphs, native bullets, and links. Fonts, colors, and page settings are retained in a single-column Word layout; pagination can differ from PDF.
- **JSON:** Export/import individual CareerCanvas resumes or a complete versioned workspace. Restore validates schemas and relationships, requires review, and creates a pre-restore safety backup. API keys are excluded.

## Architecture

React 19, TypeScript, Vite, Tailwind CSS, dnd-kit, Zustand, React Hook Form, Zod, TipTap, Recharts, and Lucide form the frontend. Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy, Alembic, and SQLite provide the local API and storage. Playwright/Chromium and python-docx produce documents. pypdf and python-docx provide local resume-file parsing.

SQL relationships connect profiles, resumes, immutable versions, jobs, histories, letters, interviews, and contacts. Validated JSON models extensible career items and independent resume snapshots. Ten Alembic migrations run at startup. See [architecture](docs/ARCHITECTURE.md), [resume engine](docs/RESUME_ENGINE.md), and [resume import architecture](docs/RESUME_IMPORT.md).

## Installation

Requirements: Python 3.11+ and Node.js 22+. Validated on Windows with Python 3.12 and Node.js 24.

```powershell
git clone https://github.com/danial-maqbool/CareerCanvas.git
cd CareerCanvas
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-lock.txt
.\.venv\Scripts\python.exe -m playwright install chromium
cd frontend
npm.cmd ci
npm.cmd run build
cd ..
python run.py
```

Open [CareerCanvas locally](http://127.0.0.1:8000). The launcher uses the project virtual environment, applies migrations, and serves the built frontend. Existing databases are preserved. On macOS/Linux use `python3 -m venv .venv`, `.venv/bin/python`, and `npm`; those platforms have not received the original Windows acceptance run.

Copy `.env.example` to `.env` only for custom configuration. Defaults: loopback hosting, `data/careercanvas.db`, and AI disabled. Optional providers require `AI_ENABLED`, `AI_PROVIDER`, and the relevant model/key. Gemini model availability is not assumed or hardcoded.

Development: apply migrations with `.venv/Scripts/python.exe -m alembic upgrade head`; run `.venv/Scripts/python.exe -m uvicorn backend.app.main:create_app --factory --host 127.0.0.1 --port 8000` and, separately, `npm run dev` inside `frontend`.

## Demo

Choose **Load Demo Career** in an empty workspace. Fictional Alex Morgan has 26 profile items: two experiences, two education records, twelve skills, three projects, one certification, two achievements, one publication, one language, and two portfolio entries. The demo also includes four independent resumes with versions, twelve applications, three interviews, three goals, one letter, one contact, one STAR story, three questions, and five tags. Loading refuses to overwrite existing workspace data.

Open **AI Engineer — Focused**, switch templates, move a section, edit a bullet, run ATS, export, and inspect the job tracker. The fictional AI Engineer job demonstrates missing Kubernetes evidence without adding a fabricated claim.

## Testing

```powershell
.\.venv\Scripts\python.exe -m pytest -q
cd frontend
npm.cmd test
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

The original Windows acceptance passed **93 backend tests, 17 frontend tests, and 33 Playwright workflows**, with no browser console errors in those workflows. Resume-import regression tests and a dedicated browser workflow were added with this extension and are also executed by [CareerCanvas CI](.github/workflows/ci.yml). Browser tests use isolated servers and temporary databases. Export tests reopen files and inspect text, sections, links, and pagination. See [validation details](docs/VALIDATION.md).

## Privacy

Data stays in local SQLite by default. No telemetry or external fonts are required. Databases, imports, backups, PDFs, DOCX files, and credentials are ignored by Git. Resume-file import is processed locally and the original file is not retained by the import workflow. External AI sends selected text only after consent; GitHub import is user initiated. Backups exclude API keys. Committed seed data and screenshots are fictional.

This is a single-user app for a trusted device. Loopback hosting, host validation, and cross-origin write rejection are implemented. Hosted multi-user authentication and encrypted-at-rest storage are not included.

## Limitations

- ATS and job matching are English-oriented heuristics, not employer scoring or qualification verification.
- AI factual checks are incomplete; review every suggestion. Live Gemini/Ollama calls remain unverified without provider configuration.
- Automatic OCR for scanned/image-only resumes is not bundled. CareerCanvas detects the condition and asks for a text-based file or local OCR output.
- DOCX export is a single-column editable reconstruction, not exact PDF template reproduction. DOCX **resume import** is supported for content extraction and ATS review; exact source-layout reproduction is not.
- Very large indivisible text needs manual restructuring; fitting never deletes content or reduces body text below 10 pt.
- Optional photo support is not implemented; CareerCanvas JSON import and backup restore preserve native application data.
- GitHub import has mocked API coverage; live availability depends on connectivity and rate limits.
- Responsive checks cover six browser viewports, not physical devices. Tested workflows do not guarantee defect-free behavior for every arbitrary resume format.

## Project Structure

```text
backend/app/          API, resume import, validated models, exports, analysis, demo
backend/migrations/   Ten incremental Alembic migrations
backend/tests/        Isolated pytest, import, and document tests
frontend/src/         Workspace, resume import, editor, templates, styles, state
frontend/tests/       Isolated Playwright journeys and viewport tests
frontend/scripts/     Guarded fictional screenshot capture
scripts/              PDF inspection and Word rendering helpers
docs/                 Architecture, resume import, engine, ATS, features, validation
docs/screenshots/     Twelve fictional portfolio screenshots
data/                 Ignored private storage and artifacts
run.py                Environment bootstrap, migrations, server
```

## License

[MIT](LICENSE), copyright 2026 Danial Maqbool.
