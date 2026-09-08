# Resume engine

Status: document editing, template rendering, measured pagination, PDF export, editable DOCX, and JSON document export implemented. Version history is a subsequent phase.

## Section model

A resume owns ordered sections and content items independent of its source Career Profile. Hidden sections retain their content. References default to excluded. Items and bullets require stable identifiers for editing and reordering.

## Templates and layout

The required gallery comprises Classic, Modern, Minimal, Professional, Technical, Executive, Compact, Academic, Creative, Two Column, Developer, and Research. These must have materially distinct layouts, not merely different colors. Presentation changes must never mutate document content.

## Page sizing and pagination

Support A4 and US Letter with explicit paper boundaries. Detect overflow and undesirable item splits. One-page fitting must use bounded typography and spacing adjustments without deleting content.

## PDF export

Use Chromium print rendering with semantic text, hyperlinks, explicit page dimensions, and controlled breaks. Validate extracted text, page count, links, and rendered output for every template.

The backend opens the local `/print/{resume_id}` view, blocks third-party requests, waits for measured pagination and local fonts, and produces a tagged PDF. It uses Playwright Chromium or an installed Google Chrome fallback. Export concurrency is bounded at two browsers. The print view reuses the editor's React document and template CSS; it does not photograph the preview.

Pagination measures escaped server-rendered React markup in an offscreen browser node. Items move as units where possible; oversized bullet collections and long descriptions can continue on subsequent pages. Indivisible oversized content remains present with a warning. The Two Column template fills its designated side rail before allocating the main column to subsequent pages.

## DOCX export

Use python-docx for editable headings, paragraphs, bullets, dates, and hyperlinks. Validate document structure and expected text; document any presentation differences from PDF.

DOCX uses semantic Word paragraph styles, native bullet lists, and hyperlink relationships. It retains the selected system font, type size, margins, page size, and colors, while reconstructing content as a single-column document for editability. Ordinary entries use keep-with-next grouping to avoid detached links. Arbitrarily long entries may still flow across Word pages. DOCX page breaks can differ from Chromium PDFs.

## JSON and versions

Use a versioned JSON format for document backups and validated imports. Immutable version snapshots support content comparison and nondestructive restoration.
