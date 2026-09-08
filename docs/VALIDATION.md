# Validation record

Only results actually run are recorded as passing. Product acceptance remains incomplete until all requested workflows have evidence.

## Phase 2 — foundation

- Frontend unit test: PASS (1 test).
- TypeScript and Vite production build: PASS.
- Playwright shell navigation and horizontal overflow: PASS at 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, and 390×844 (6 tests).
- Uncaught browser page errors during these shell checks: none.
- Desktop screenshot manually inspected at 1366 pixels wide.
- Private database, environment, import/export, and dependency paths: ignored by Git.
- Backend migration repeatability, data preservation, health, unknown API, Host validation, and cross-origin rejection: PASS (2 tests). Two upstream deprecation warnings are reported by the HTTP test client.

Shell tests do not establish acceptance of resume editing, exports, or other product workflows. Their screenshots are local test artifacts, not the final populated portfolio screenshots.

## Phase 3 — Career Profile

- Backend: PASS, 31 tests total covering all demo item types, CRUD, validation, persistence, completion, and nondestructive demo loading.
- Frontend unit test and production build: PASS.
- Browser CRUD and reload persistence: PASS (1 workflow). Six shell viewport tests also passed against FastAPI. A required-label test selector was corrected before the workflow passed.

## Phase 4 — independent resumes and library

- Backend: PASS, 35 tests total, including immutable source separation, duplication, archive/delete, optimistic revisions, template content preservation, and bounded typography.
- Frontend unit test and production build: PASS.
- Browser library workflow: create, name, duplicate, rename, archive, delete, reload.
- Fixed separator whitespace normalization discovered by the content-preservation test and action-menu dismissal discovered by browser testing.

## Phases 5–6 — state and live editor

- Frontend unit tests: PASS (4 total), including undo/redo, failed-save retention, and revision handling.
- Production build: PASS.
- Browser: PASS for inline name editing, immediate summary preview, section visibility/order, autosave, undo/redo, reload persistence, and mobile properties drawer.
- Resume Library regression workflow: PASS.
- Desktop and 390×844 editor screenshots visually inspected. Pagination and drag handles are subsequent phases.
