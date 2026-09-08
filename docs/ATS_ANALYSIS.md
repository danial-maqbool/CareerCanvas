# ATS analysis

**CareerCanvas ATS Readiness Score is an application-specific heuristic. It is not a score returned by a real employer ATS.** It does not predict hiring outcomes.

## CareerCanvas resume formula

Each passing check earns its full weight. A failing check earns zero. The score is the sum of earned weights out of 100. No external service or AI is involved.

| Check | Weight | Passing condition | Failure severity |
| --- | ---: | --- | --- |
| Structured text | 10 | Visible structured text exceeds 30 characters | High |
| Standard headings | 10 | Visible headings match the standard vocabulary in `backend/app/ats.py` | Medium |
| Simple reading order | 10 | Single-column template and no multicolumn sections | Medium |
| Critical content is text | 5 | No critical-content-in-images marker in analyzed source | High |
| Contact email | 15 | Visible email matches a basic address pattern | High |
| Contact phone | 5 | Visible phone has at least seven digits | Medium |
| Experience | 10 | Visible experience section has at least one item | Medium |
| Education | 10 | Visible education section has at least one item | Medium |
| Skills | 10 | Visible skills section has at least one item | Medium |
| Readable body font | 10 | Body size is at least 10 pt | Medium |
| Reasonable page count | 5 | Measured preview has one or two pages | Low |

Page count is measured using the same layout as PDF generation. Results are tied to the resume revision; later edits invalidate them. The library displays only current-revision scores.

## Direct uploaded-resume review

CareerCanvas can also review a **PDF, DOCX, or TXT file directly**. The file does not need to be rebuilt in the editor first. The uploaded-file score uses corresponding file-level evidence and keeps the same 100-point weight structure:

| Uploaded-file check | Weight | Evidence |
| --- | ---: | --- |
| Extractable text | 10 | Parser reads more than a minimal amount of text |
| Standard headings | 10 | Experience, Education, and Skills headings are detected |
| Simple reading order | 10 | No strong multi-column/table-heavy signal is detected |
| Critical content is extractable text | 5 | File is not classified as image-only/scanned and has enough text |
| Contact email | 15 | Email is detected in extracted text |
| Contact phone | 5 | Phone-like token with at least seven digits is detected; common year ranges are explicitly excluded |
| Experience | 10 | Experience heading is detected |
| Education | 10 | Education heading is detected |
| Skills | 10 | Skills heading is detected |
| Readable text density | 10 | Extracted text density is sufficient and the file is not classified as scanned |
| Reasonable page count | 5 | PDF/TXT view is one or two pages where page metadata is available |

The direct review also reports extracted-text length, images, links, tables, page count where available, detected sections, parser warnings, and likely reading-order complexity. The **Extracted Text** view shows what CareerCanvas can actually read. Detected HTTP/HTTPS links are rendered as links in the review interface.

DOCX pagination is not inferred by `python-docx`; the direct DOCX parser therefore uses structural checks rather than claiming exact Word pagination. PDF page count comes from `pypdf`.

See [Resume Import & Direct ATS Review](RESUME_IMPORT.md) for the complete workflow.

## Interpretation and limitations

- Structured text is a model/file check. PDF integration tests separately verify selectable text and hyperlinks.
- Image-only/scanned PDFs are detected by the import workflow, but automatic OCR is not bundled. Use a text-based PDF or local OCR output before relying on the extracted text.
- Two-column formats can suit direct sharing. The reading-order check cautions about parsing complexity, not guaranteed rejection.
- Long academic CVs and applicants without conventional education or experience can legitimately lose points. The score does not determine qualification.
- Contact checks establish plausible syntax, not reachability or ownership.
- Resume extraction is deterministic and English-oriented. Review every proposed field before importing it into Career Profile.

## Achievement feedback

Four checks each contribute 25 points: a recognized leading action verb; at least seven words without a vague opening; a result-related phrase; and a digit or small written number. These are writing prompts, not proof of impact. Add only substantiated metrics.

## Job matching

Job matching is separate from formatting readiness. It uses an explicit skill vocabulary, a small synonym map, and known profile skill names. It extracts required/preferred skills by line context, responsibility lines, numeric years requirements, education lines, and non-stopword keywords. Review the original job description for requirements the extractor misses.

The normalized score is a weighted average of applicable components: skill coverage 50, keyword coverage 20, experience duration 15, education evidence 10, and role-word overlap 5. Unspecified components are excluded from the denominator. Experience duration merges overlapping employment months; it does not establish relevance or seniority. Education evidence checks whether education is present, not whether a degree satisfies a requirement. Role-word matching is lexical rather than semantic.

Related skills are displayed separately and never counted as equivalent. Profile suggestions quote existing evidence. Users review a selectable content list and explicitly approve creation of a new resume copy. Missing skills never become profile or resume claims automatically. Existing customized items are retained when selected, and the source document stays unchanged.
