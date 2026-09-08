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

## Phase 7 — section and bullet dragging

- Production build and four frontend unit tests: PASS.
- Pointer drag of Projects above Experience, keyboard drag of achievement bullets, and persistence after reload: PASS.
- Existing editor workflow: PASS. Browser keyboard tests wait for the drag layout to be measured before issuing movement.
- Explicit move-up/down controls remain available. Dragging starts only from dedicated handles after an activation threshold.

## Phase 8 — templates

- Twelve template content-contract tests: PASS; 16 frontend unit tests total.
- Production build: PASS.
- Browser: Classic → Technical → Modern preserves sections and personal content; all twelve gallery cards and category filters verified.
- Four-step creation wizard with visual template selection: PASS in the library regression workflow.
- Populated template gallery screenshot inspected. PDF layout validation remains a later export gate.

## Phase 9 — design controls

- Sixteen frontend tests and production build: PASS.
- Browser: font, point size, primary color, long date formatting, US Letter selection, and persistence: PASS.
- Six system-font choices, six color/type presets, bounded spacing and type controls, heading styles, and header alignment implemented.

## Phase 10 — measured pagination

- Browser long-experience fixture: PASS, all 35 numbered bullets retained, multiple nonblank pages, A4 and Letter heights bounded.
- Live editor regression: PASS. Styling persistence: PASS after waiting for the asynchronous save-and-close operation to finish.
- Sixteen frontend tests and production build: PASS.
- Pagination measures escaped React markup with the actual template CSS and splits long bullet collections or long descriptions. Oversized indivisible content is retained and reported as a warning.
- One-page fitting applies bounded spacing/type reductions; it does not promise that arbitrarily long content can fit a single readable page.
