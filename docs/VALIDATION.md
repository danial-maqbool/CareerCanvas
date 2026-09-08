# Validation Report

Original full implementation validation: **2026-09-09**, Windows, Python 3.12, Node.js 24. Portfolio/document review completed 2026-09-09. The original acceptance includes Academic numbering, Compact link spacing, immediate application-reopen revision fixes, export inspection, responsive checks, and restart persistence.

The later **resume import + direct uploaded-file ATS extension** adds deterministic parser tests, duplicate/import tests, a browser workflow, and repository-level GitHub Actions validation. The authoritative state of the extension is the latest `main` workflow under [CareerCanvas CI](../.github/workflows/ci.yml).

## Original automated results

| Gate | Result | Evidence and scope |
| --- | --- | --- |
| Backend | PASS: 93 tests | Full Windows pytest run, isolated SQLite databases |
| Frontend | PASS: 17 tests | Vitest: store history/autosave behavior, template content, workspace navigation |
| TypeScript/Vite production build | PASS | Typed production build; separated React, chart, and rich-editor chunks |
| Playwright | PASS: 33 workflows | zero failed, skipped, or flaky tests |
| Browser console | PASS | No page errors or console errors in all 33 guarded workflows |
| PDF templates | PASS: 12 templates | Reopened files contain expected text, sections, links, correct A4 sizing, and measured page count |
| PDF stress layouts | PASS: 10 cases | Five fixtures each on A4 and Letter: one page, two pages, long experience, many projects, long skills |
| Oversized content | PASS | Export rejected with guidance; stored content remains intact |
| PDF glyph geometry | PASS: 24 template pages | Zero glyphs outside page bounds; all pages rendered with Poppler and visually reviewed |
| DOCX | PASS | Twelve templates, hidden content, rich text, and cover letter inspected programmatically |
| Word rendering | PASS with alternate renderer | Three-page complete-profile DOCX opened read-only in Microsoft Word, rendered to PDF/PNG and visually reviewed |
| JSON | PASS | Document import/export and whole-workspace schema/relationship validation, safety backup, invalid-restore preservation |
| Restart persistence | PASS | Integrated journey stops server, verifies it is unreachable, restarts same database, and verifies saved resume/goal |
| Standard launcher | PASS | `python run.py` selects project virtual environment and serves built application |
| Portfolio capture | PASS | Twelve populated fictional screenshots; no browser console errors during capture |

The PDF module contains 23 test cases (12 templates + 10 layouts + 1 overflow rejection). Cover-letter PDF is covered separately. Export tests inspect content rather than only file existence. Generated PDFs/DOCX/QA renders remain in ignored local validation directories.

Two backend warnings concern upstream Starlette/httpx and AnyIO deprecations. The build can report third-party package warnings. These are not application test failures or frontend console errors.

## Resume import and direct ATS extension

`backend/tests/test_resume_import.py` adds isolated coverage for:

- TXT resume preview, section detection, personal-information extraction, skills extraction, and direct ATS output;
- reviewed Career Profile application and persistence;
- repeated import and exact skill duplicate detection;
- explicit **Keep existing** duplicate behavior;
- missing-phone ATS detection, including regression protection so employment/education year ranges such as `2022 - 2024` are not treated as phone numbers;
- DOCX paragraph/table parsing and table-structure metadata;
- image-only/blank PDF classification as scanned with an OCR limitation warning;
- normalized heading aliases such as `PROFESSIONAL EXPERIENCE` and `TECHNICAL SKILLS`.

`frontend/tests/resume-import.spec.ts` starts from an isolated empty database and exercises the user workflow:

```text
Dashboard → Import Resume → Upload → Review → Apply → Career Profile
Resumes → Upload Resume for ATS Review → ATS checks → Extracted Text → Create CareerCanvas Resume
```

The browser test uses an in-memory synthetic TXT resume. It does not use personal user data or an external AI provider.

The extension test matrix is part of [CareerCanvas CI](../.github/workflows/ci.yml), which runs on Linux with Python 3.12 and Node.js 24 and executes backend pytest, frontend unit tests, the production build, and Playwright end-to-end tests. Platform-specific document tests may skip where their declared dependencies or Windows-only behavior do not apply.

## Import safety and privacy validation

The import service enforces:

- PDF, DOCX, and TXT extensions only;
- an 8 MB encoded source-file limit;
- a 100-page PDF limit;
- encrypted-PDF rejection unless an empty-password decrypt succeeds;
- bounded DOCX ZIP expansion before `python-docx` parsing;
- local in-memory processing without writing the original upload to disk;
- Pydantic validation before Career Profile writes;
- explicit review before import;
- explicit duplicate actions: keep, merge, replace, or new;
- existing-record ownership checks before duplicate updates;
- a major-action audit record after approved import;
- existing trusted-host and cross-origin write protections.

Detected HTTP/HTTPS links are returned as structured URLs and rendered as clickable links in the direct ATS review UI.

## Integrated career journey

`frontend/tests/acceptance.spec.ts` starts from an empty temporary database and launches the application. It loads the fictional career, edits profile experience, adds a skill/project/achievement, creates and names a resume through the wizard, selects content, and opens the editor. It edits the name inline and summary, adds/reorders bullets, moves Projects above Experience, hides Certifications, switches templates without content changes, changes font/spacing/accent/zoom, and checks measured pages.

The journey runs ATS, fixes a missing email, and verifies the expected 15-point increase. It downloads PDF and DOCX and reopens them programmatically to inspect text, expected sections, and links. It creates v1/v2, compares changes, restores v1 with a safety snapshot, analyzes a fictional job, verifies Kubernetes is not added as a claim, and creates an independent reviewed tailored copy. It tracks stage changes, prepares an interview, creates a goal and letter, checks analytics and Ctrl+K, then restarts the server and verifies persistence.

Separate focused browser workflows cover pointer section/Kanban dragging, keyboard bullet order, refresh persistence, template preservation, version retention, STAR stories, preparation checklists, backup restore, themes, tags, dashboard widgets, profile libraries, and resume import/direct ATS review. All tests use isolated server/database fixtures, never personal workspace data.

## Responsive results

| Browser viewport | Original result |
| --- | --- |
| 1920 x 1080 | PASS |
| 1440 x 900 | PASS |
| 1366 x 768 | PASS |
| 1024 x 768 | PASS |
| 768 x 1024 | PASS |
| 390 x 844 | PASS |

The original six-viewport suite visits ten major workspace pages and checks navigation and horizontal overflow. Dedicated editor tests cover mobile drawers and usable preview. The new resume-import stylesheet includes responsive breakpoints for compact review, ATS, and profile-mapping layouts. These are browser viewport checks, not physical-device certification or an exhaustive accessibility audit.

## ATS, tailoring, import, and AI boundaries

Native ATS fixtures cover good/bad content, missing contacts, image-heavy source markers, excessive columns, type size, and page count. Uploaded-file ATS adds parser-level extractability, structural, contact, section, text-density, and page checks. Both scores are CareerCanvas heuristics, not employer ATS results.

PDF resume import uses selectable text. Image-only/scanned PDFs are detected, but automatic OCR is not bundled. DOCX resume import reads paragraphs, tables, and hyperlinks; it does not claim exact source pagination or visual reproduction. TXT parsing supports UTF-8 and Windows-1252.

Matching tests cover aliases, missing skills, existing evidence, reviewed copies, unchanged originals, and overlapping experience dates. Deterministic AI tests cover new factual claims including written numbers; mocked provider tests check configuration and consent boundaries. **Live Gemini and Ollama calls are NOT RUN** without configured credentials/models. GitHub import has mocked API validation; live external availability is not certified. Resume import and direct uploaded-file ATS review do not require AI.

## Screenshots and reproducibility

All twelve original required screenshots are under [`docs/screenshots`](screenshots/README.md): dashboard, resume_library, resume_editor, template_gallery, ats_analysis, job_match, version_comparison, career_profile, application_kanban, job_detail, interview_prep, and career_analytics. They were captured from a deliberately seeded fictional workspace and visually inspected. `frontend/scripts/capture-screenshots.mjs` guards the demo identity, resume/job counts, and fictional company names before capture; do not use it against personal records.

Run the commands in the [README](../README.md) to reproduce automated checks. Playwright starts its own temporary servers. PDF inspection uses `scripts/inspect_pdf_layouts.py` with Poppler, Pillow, and pdfplumber. `scripts/render_docx_word.ps1` refuses to run if Word is already open, opens its input read-only, and closes without saving.

## Known limitations

- English-oriented deterministic section and career-field extraction can require manual correction on unusual resumes.
- Automatic OCR for scanned/image-only resumes is not bundled; the condition is detected and shown to the user.
- Direct DOCX review cannot know exact Microsoft Word pagination from `python-docx`; structural evidence remains available.
- The ATS score is an application-specific heuristic and cannot reproduce an employer's private parser or ranking model.
- Optional live Gemini/Ollama behavior remains unverified without provider configuration.
- CareerCanvas remains a local single-user application without hosted multi-user authentication or encryption at rest.
- DOCX **export** remains a single-column editable reconstruction.
- Non-Windows platforms and physical mobile devices have not received the original full acceptance run; GitHub Actions adds Linux regression coverage for the current source tree.
