# CareerCanvas Delivery

1. **Public repository:** https://github.com/danial-maqbool/CareerCanvas
2. **Local directory:** `D:\1 - Personal\Docs\Danial\Masters\MS AI\3rd Sem\Side Projects\Resume Builder`.
3. **Stack:** React 19, TypeScript, Vite, Tailwind CSS, dnd-kit, Zustand, React Hook Form, Zod, TipTap, Recharts, Lucide; Python 3.12 (3.11+ required), FastAPI, Pydantic v2, SQLAlchemy, Alembic, SQLite, Playwright/Chromium, python-docx; pytest, Vitest, Playwright tests.
4. **Architecture:** Local API serves the built SPA; reusable profile items feed independent resume snapshots. Relational records connect document versions and career activity. Ten migrations preserve existing databases. See [architecture](ARCHITECTURE.md).
5. **Features:** 78 documented capability groups, with explicit counting boundaries in [FEATURES.md](FEATURES.md).
6. **Templates:** 12: Classic, Modern, Minimal, Professional, Technical, Executive, Compact, Academic, Creative, Two Column, Developer, Research.
7. **Editing:** Three panels, inline text, rich summary, local content customization, visibility, custom sections, naming, independent duplication, archive/delete, autosave, undo/redo, versions/diffs/restore.
8. **Drag and drop:** Sections, experience bullets, Kanban cards, and dashboard widgets; keyboard alternatives for editor order and dashboard controls, plus application stage selection.
9. **Styling:** Six system-font options, type size, line height, margins, section/bullet spacing, colors/presets, headings, alignment, dates, skill columns/separators, A4/Letter, zoom, fit, and overflow guidance.
10. **PDF:** Implemented selectable-text Chromium export with links, measured pagination, and oversized-content safeguards.
11. **DOCX:** Implemented editable semantic Word export with headings, bullets, links, basic styling, and page settings.
12. **ATS:** Eleven weighted checks: structured text, headings, reading order, image content, email, phone, experience, education, skills, font size, and pages. Application-specific, not employer scoring.
13. **Job match:** Skill/keyword/experience/education/role components, explicit gaps and related evidence, existing profile suggestions, approved independent tailored copies.
14. **AI:** Optional Gemini/Ollama rewrite adapters, consent boundary, original/suggested review, and factual-change flags. Live providers are unverified without configuration; factual checks are heuristics.
15. **AI-disabled mode:** Core editor, exports, versions, libraries, ATS, matching, jobs, interviews, and analytics operate with AI off. All acceptance tests use AI disabled.
16. **Career Profile:** Personal details, experience, education, skills, projects, certifications, publications, achievements, languages, references, portfolio, and completion guidance.
17. **Jobs:** Ten-stage Kanban, details, document associations, timeline, contacts, tasks, follow-ups, notes, tags, and deadlines. Immediate reopen now uses the revision returned by save.
18. **Interviews:** Scheduling, logistics, rounds, interviewers, seven-step preparation, linked STAR stories, and categorized questions.
19. **Analytics:** Submissions, response/interview/offer rates, average response time, sources, roles, months, funnel, and observed outcomes per resume. No causation claim.
20. **Demo:** Fictional Alex Morgan; 26 profile items, four resumes with versions, twelve applications, three interviews, three goals, one letter/contact/STAR story, three questions, five tags.
21. **Automated tests:** 93 backend and 17 frontend tests pass; TypeScript/Vite production build passes.
22. **Playwright:** Final 33-workflow result is recorded in [VALIDATION.md](VALIDATION.md), including console guard and clean-database restart journey.
23. **PDF validation:** Twelve templates plus ten A4/Letter layout cases and overflow rejection. Twenty-four template pages reviewed, zero out-of-page glyphs; text and links inspected programmatically.
24. **DOCX validation:** All template inputs, hidden content, rich text, and letter content inspected; complete-profile sample rendered read-only in Microsoft Word and visually reviewed across three pages.
25. **Responsive validation:** 1920x1080, 1440x900, 1366x768, 1024x768, 768x1024, and 390x844 browser viewports pass. Physical devices are not certified.
26. **Limitations:** Local single-user deployment; English heuristic analysis; incomplete AI factual detection; live providers unverified; DOCX single-column reconstruction; optional photo and DOCX import absent; very large indivisible text needs manual restructuring.
27. **Known bugs:** No unresolved failures in the final tested workflows; this is not a guarantee for arbitrary input or untested platforms. Upstream dependency deprecation/build warnings are documented.
28. **Screenshots:** All twelve required populated PNGs in [screenshots](screenshots/README.md): dashboard, resume_library, resume_editor, template_gallery, ats_analysis, job_match, version_comparison, career_profile, application_kanban, job_detail, interview_prep, career_analytics.
29. **Documentation:** Portfolio README, MIT LICENSE, .env.example, architecture, resume engine, ATS formula, feature inventory, validation, screenshot provenance, and this delivery report.
30. **Main files:** [launcher](../run.py), [API](../backend/app/main.py), [resume model](../backend/app/resume_schemas.py), [editor](../frontend/src/ResumeEditor.tsx), [state](../frontend/src/editor-store.ts), [renderer](../frontend/src/ResumePaper.tsx), [pagination](../frontend/src/pagination.tsx), [templates](../frontend/src/templates.css), [exports](../backend/app/exports.py), [DOCX](../backend/app/docx_export.py), [acceptance](../frontend/tests/acceptance.spec.ts).
31. **Commit history:** Incremental initialization, architecture, profile, library, editor, drag, templates, styling, pagination, PDF, DOCX, versions, achievements, ATS, matching, AI, letters, jobs, interviews, goals, analytics, libraries, commands, backup/themes/tags, polish, demo, validation, and final delivery commits. See [GitHub history](https://github.com/danial-maqbool/CareerCanvas/commits/main/).
32. **Final commit:** Reported in the delivery message; `git rev-parse HEAD` returns the full local hash.
33. **Branch state:** Only `main` is intended locally and remotely. Final delivery verifies a clean working tree and equality of `HEAD` and `origin/main`. Private databases, documents, backups, and credentials are excluded; known secret patterns were checked in tracked files and history.
