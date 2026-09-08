# Resume engine

Status: implementation pending.

## Section model

A resume owns ordered sections and content items independent of its source Career Profile. Hidden sections retain their content. References default to excluded. Items and bullets require stable identifiers for editing and reordering.

## Templates and layout

The required gallery comprises Classic, Modern, Minimal, Professional, Technical, Executive, Compact, Academic, Creative, Two Column, Developer, and Research. These must have materially distinct layouts, not merely different colors. Presentation changes must never mutate document content.

## Page sizing and pagination

Support A4 and US Letter with explicit paper boundaries. Detect overflow and undesirable item splits. One-page fitting must use bounded typography and spacing adjustments without deleting content.

## PDF export

Use Chromium print rendering with semantic text, hyperlinks, explicit page dimensions, and controlled breaks. Validate extracted text, page count, links, and rendered output for every template.

## DOCX export

Use python-docx for editable headings, paragraphs, bullets, dates, and hyperlinks. Validate document structure and expected text; document any presentation differences from PDF.

## JSON and versions

Use a versioned JSON format for document backups and validated imports. Immutable version snapshots support content comparison and nondestructive restoration.
