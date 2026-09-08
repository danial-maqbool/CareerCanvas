# Validation Report

Final implementation validation: **2026-09-09**, Windows, Python 3.12, Node.js 24. Portfolio/document review completed 2026-09-09. Validation includes final Academic numbering, Compact link spacing, and immediate application-reopen revision fixes.

## Automated results

| Gate | Result | Evidence and scope |
| --- | --- | --- |
| Backend | PASS: 93 tests | Full pytest run, 106.77 seconds; isolated SQLite databases |
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

Two backend warnings concern upstream Starlette/httpx and AnyIO deprecations. The build reports third-party Zod PURE annotation warnings. These are not application test failures or frontend console errors.

## Integrated career journey

`frontend/tests/acceptance.spec.ts` starts from an empty temporary database and launches the application. It loads the fictional career, edits profile experience, adds a skill/project/achievement, creates and names a resume through the wizard, selects content, and opens the editor. It edits the name inline and summary, adds/reorders bullets, moves Projects above Experience, hides Certifications, switches templates without content changes, changes font/spacing/accent/zoom, and checks measured pages.

The journey runs ATS, fixes a missing email, and verifies the expected 15-point increase. It downloads PDF and DOCX and reopens them programmatically to inspect text, expected sections, and links. It creates v1/v2, compares changes, restores v1 with a safety snapshot, analyzes a fictional job, verifies Kubernetes is not added as a claim, and creates an independent reviewed tailored copy. It tracks stage changes, prepares an interview, creates a goal and letter, checks analytics and Ctrl+K, then restarts the server and verifies persistence.

Separate focused browser workflows cover pointer section/Kanban dragging, keyboard bullet order, refresh persistence, template preservation, version retention, STAR stories, preparation checklists, backup restore, themes, tags, dashboard widgets, and profile libraries. All tests use isolated server/database fixtures, never personal workspace data.

## Responsive results

| Browser viewport | Result |
| --- | --- |
| 1920 x 1080 | PASS |
| 1440 x 900 | PASS |
| 1366 x 768 | PASS |
| 1024 x 768 | PASS |
| 768 x 1024 | PASS |
| 390 x 844 | PASS |

The six-viewport suite visits ten major workspace pages and checks navigation and horizontal overflow. Dedicated editor tests cover mobile drawers and usable preview. These are browser viewport checks, not physical-device certification or an exhaustive accessibility audit. Keyboard alternatives and focus indicators are implemented and exercised by focused workflows.

## ATS, tailoring, and AI boundaries

ATS fixtures cover good/bad content, missing contacts, image-heavy source markers, excessive columns, type size, and page count. Image-heavy fixtures directly exercise the analyzer; image-only resume import is not implemented. The score is a CareerCanvas heuristic, not an employer ATS result.

Matching tests cover aliases, missing skills, existing evidence, reviewed copies, unchanged originals, and overlapping experience dates. Deterministic AI tests cover new factual claims including written numbers; mocked provider tests check configuration and consent boundaries. **Live Gemini and Ollama calls are NOT RUN** without configured credentials/models. GitHub import has mocked API validation; live external availability is not certified.

## Screenshots and reproducibility

All twelve required files are under `docs/screenshots`: dashboard, resume_library, resume_editor, template_gallery, ats_analysis, job_match, version_comparison, career_profile, application_kanban, job_detail, interview_prep, and career_analytics. They were captured from a deliberately seeded fictional workspace and visually inspected. `frontend/scripts/capture-screenshots.mjs` guards the demo identity, resume/job counts, and fictional company names before capture; do not use it against personal records.

Run the commands in the README to reproduce automated checks. Playwright starts its own temporary servers. PDF inspection uses `scripts/inspect_pdf_layouts.py` with Poppler, Pillow, and pdfplumber. `scripts/render_docx_word.ps1` refuses to run if Word is already open, opens its input read-only, and closes without saving. The packaged LibreOffice renderer could not run because LibreOffice was absent; the documented Word fallback supplied visual evidence instead.

## Known limitations and bugs

No known unresolved bugs were found in the validated workflows. This is not a guarantee for arbitrary input or untested environments. English heuristic matching, incomplete AI factual detection, single-user local storage, single-column DOCX reconstruction, very large indivisible text blocks, absent optional photo/DOCX import, and unverified external providers remain documented limitations. Non-Windows platforms and physical mobile devices have not received this acceptance run.
