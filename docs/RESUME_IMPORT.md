# Resume Import and Direct ATS Review

CareerCanvas can process an existing **PDF, DOCX, or TXT resume** in two ways:

1. **Import Resume** extracts career information for review before adding it to the reusable Career Profile.
2. **Upload Resume for ATS Review** analyzes the uploaded document directly. The resume does not need to be rebuilt in CareerCanvas first.

Both entry points are available from the Dashboard. `Import Resume` is also shown on Career Profile. `Upload Resume for ATS Review` is also shown on Resumes.

## Local processing

The default import path is deterministic and local. The browser reads the selected file and sends it only to the local CareerCanvas FastAPI server. The server parses the content in memory. It does not retain the original file and does not call Gemini or another remote service.

The existing privacy exclusions also ignore `uploads/`, `imports/`, generated PDFs/DOCX files, and local databases.

## Supported files

### PDF

CareerCanvas uses `pypdf` to inspect selectable text, page count, embedded images, links, and likely reading-order complexity. Encrypted PDFs must be unlocked first.

Very sparse or image-only PDFs are flagged as likely scanned. Automatic OCR is not bundled with this workflow. Use a text-based PDF or run local OCR first if important content is missing from the extracted-text view.

### DOCX

CareerCanvas uses `python-docx` to read paragraphs, tables, and hyperlinks. It reports table-heavy documents because complex tables can produce less predictable applicant-tracking-system reading order. The importer applies size limits to the DOCX ZIP package before parsing it.

### TXT

UTF-8 and Windows-1252 text files are supported.

## Career Profile import

The importer detects common headings and heading variants for:

- Summary / Profile
- Experience / Professional Experience / Employment
- Education
- Skills / Technical Skills
- Projects
- Certifications
- Achievements / Awards
- Publications / Research
- Languages
- Portfolio

It then proposes structured Career Profile data. Personal fields include name, professional title, email, phone, city, country, LinkedIn, GitHub, portfolio, website, and summary where supported by the source text.

Each proposed field or item shows the extracted value, confidence, and source evidence. Nothing is written until the user selects the content and chooses **Apply to Career Profile**.

## Duplicate handling

The preview compares imported items with existing Career Profile records. Exact skill names are deduplicated. Experience uses company and role similarity. Other supported categories use stable identifying fields such as project name, certification name/issuer, publication title, or language.

A likely duplicate provides four explicit actions:

- **Keep existing** — preserve the Career Profile record and reuse its ID.
- **Merge missing/list data** — preserve existing scalar values and add missing or new list values.
- **Replace existing** — replace the existing structured record with the reviewed import.
- **Import as new** — create a separate item.

CareerCanvas never silently replaces an existing profile record.

## Direct ATS review

The direct file review reuses the CareerCanvas ATS philosophy but evaluates the uploaded document itself. It checks:

- extractable/selectable text;
- recognizable section headings;
- likely reading-order complexity;
- image-only critical content risk;
- email and phone presence;
- Experience, Education, and Skills sections;
- text density;
- page count.

The screen also shows document metadata, parser warnings, detected sections, and all detected HTTP/HTTPS links as active links.

The **Extracted Text** tab shows what CareerCanvas could read. If visually important content is missing there, a text-based ATS may also have difficulty reading it.

The score remains an application-specific heuristic. It is not a score from an employer ATS and is not a hiring prediction.

## Create an editable CareerCanvas resume

After upload, **Create CareerCanvas Resume** applies the reviewed Career Profile selection once and creates an independent resume snapshot from the selected item IDs. It uses the existing content-safe CareerCanvas resume model and opens the new resume in the visual editor.

It imports content. It does not attempt to clone arbitrary PDF/DOCX visual design.

## Audit history

Approved imports add a CareerCanvas audit event that includes the source filename and counts for added, updated, and skipped records. The source document itself is not stored by this workflow.

## API

- `POST /api/import/preview` — accepts a filename and Base64 file content, then returns document inspection, extracted text, ATS results, proposed profile data, source evidence, and duplicate hints.
- `POST /api/import/apply` — validates the reviewed selection and applies only approved fields and items.

Both endpoints use the same local-origin protections as the rest of CareerCanvas.

## Related documentation

- [README](../README.md)
- [Architecture](ARCHITECTURE.md)
- [ATS analysis](ATS_ANALYSIS.md)
- [Resume engine](RESUME_ENGINE.md)
- [Capability inventory](FEATURES.md)
- [Validation](VALIDATION.md)
- [Privacy and configuration](../.env.example)
