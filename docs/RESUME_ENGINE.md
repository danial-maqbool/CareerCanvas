# Resume Engine

## Section model

A resume owns personal information, ordered sections, stable item IDs, source IDs, visibility flags, a template key, and styles. Content is copied from selected profile records and remains independent thereafter. Sections include header, summary, experience, education, projects, skills, certifications, publications, achievements, languages, references, portfolio, and custom content. References default to hidden. Hiding fields or sections retains all enclosed content. Drag operations use dedicated handles; buttons and keyboard controls provide alternatives. Reordering persists in the document snapshot.

## Templates and layout

| Template | Presentation |
| --- | --- |
| Classic | Centered serif introduction and traditional ruled headings |
| Modern | Strong left-aligned introduction and restrained accent rules |
| Minimal | Open whitespace and widely spaced small headings |
| Professional | Solid accent heading bars and a contact band |
| Technical | Technical hierarchy with timeline-style item rails |
| Executive | Serif introduction with section labels in a separate rail |
| Compact | Dense hierarchy and reduced visual spacing |
| Academic | Centered scholarly introduction and numbered section headings |
| Creative | High-contrast introduction and paired content columns |
| Two Column | Main narrative column with a supporting skills rail |
| Developer | Monospace accents and code-comment-inspired headings |
| Research | Serif scholarly typography and italic section hierarchy |

Shared semantic content renders through different CSS structures. Template selection cannot modify content. Gallery filters and previews use current career data. Tests switch Classic to Technical to Modern and compare content; all twelve templates render expected contact, experience, education, skills, and project text.

## Styles

System fonts include Arial, Calibri, Georgia, Times New Roman, Verdana, and System Sans. Controls cover body size, line height, margins, section spacing, bullet spacing, heading style, alignment, date format, primary/secondary/text colors, and professional presets. Fonts require no runtime downloads. Skills have section-level columns, separators, heading, and visibility settings; spacing is controlled by document styles.

## Page sizing and pagination

A4 uses 210 x 297 mm; US Letter uses 8.5 x 11 inches. Real paper boundaries and page numbers remain visible at independent zoom levels (50%, 75%, 100%, 125%, fit width, fit page). Mobile editing panels become drawers.

The browser measures escaped React markup in an offscreen node with identical fonts, sizes, and template CSS. Ordinary items move as units. Oversized bullet collections and descriptions split into continuation fragments for rendering, without mutating stored source text. The Two Column layout measures its supporting rail separately. Repeated sections continue across pages; they never silently disappear.

Indivisible oversized text remains present with a warning. Users can shorten content or adjust spacing. Fit to One Page performs at most eight bounded adjustments: minimum 10 pt body type, 10 mm margin, 6 px section spacing, 1 px bullet spacing, and 1.2 line height. If content still needs multiple pages, the UI says so. It never removes content to meet a page target.

## PDF export

The backend opens `/print/{resume_id}` on the local application. It uses installed Playwright Chromium, with an installed Google Chrome fallback. Third-party requests are blocked. It waits for fonts and measured pagination, verifies no page content exceeds its frame, then prints tagged PDF with selectable text and link annotations. A semaphore permits two concurrent exports. Page count is checked after printing. Oversized indivisible content returns HTTP 422 guidance instead of a clipped PDF; browser failures return a distinct service error.

Twelve template PDFs are reopened with pypdf to inspect text, headings, expected content, links, page size, nonblank pages, and agreement with the measured preview. Ten further layout cases cover A4/Letter and one-page, two-page, long-experience, many-project, and long-skill inputs. A separate oversized-content test verifies rejection without source deletion. The final template set contains 24 pages; glyph-bound inspection found zero out-of-page glyphs, and all pages were visually reviewed after Poppler rendering.

## DOCX export

python-docx creates editable paragraphs, native Word bullets, heading styles, and hyperlink relationships. It retains selected fonts, body size, colors, margins, and page dimensions. Hidden content is excluded; source data is preserved. Rich summary bold, italic, and bullets become Word formatting. Ordinary entries use keep-with-next to avoid detached links.

DOCX intentionally reconstructs a single-column editable document rather than reproducing every PDF template. Word font substitution and pagination can differ by machine. Long entries can flow over pages. Tests inspect all twelve template inputs plus hidden and rich-text content. Microsoft Word read-only rendering and Poppler were used to inspect the three-page complete-profile sample; LibreOffice was unavailable on the validation machine.

## JSON import/export

Individual documents use the `CareerCanvas Resume` format and schema version 1. Imports validate the document and create a new independent resume. Complete workspace backups are separate and include relational career activity. Version compatibility and relationships are checked before restore, with an automatic safety backup and transactional replacement. API keys are excluded.

## Versions

Creating a version captures document content, style, name, and note in an immutable snapshot. Comparison traverses nested content and reports additions, removals, and modifications, including summary, sections, skills, projects, and bullets. Restore saves the current state as a new safety version before applying the selected snapshot. Newer versions remain available. Undo/redo provides recent local editing history separately from these durable versions.
