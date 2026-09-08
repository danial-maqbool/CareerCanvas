# ATS analysis

**CareerCanvas ATS Readiness Score is an application-specific heuristic. It is not a score returned by a real employer ATS.** It does not predict hiring outcomes.

## Formula

Each passing check earns its full weight. A failing check earns zero. The score is the sum of earned weights out of 100. No external service or AI is involved.

| Check | Weight | Passing condition | Failure severity |
| --- | ---: | --- | --- |
| Structured text | 10 | Visible structured text exceeds 30 characters | High |
| Standard headings | 10 | Visible headings match the standard vocabulary in backend/app/ats.py | Medium |
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

## Interpretation and limitations

- Structured text is a model check. PDF integration tests separately verify selectable text and hyperlinks.
- The editor does not import image-only resumes. The image-heavy fixture exercises the analysis function directly; it does not imply image import support.
- Two-column formats can suit direct sharing. This check cautions about parsing complexity, not guaranteed rejection.
- Long academic CVs and applicants without conventional education or experience can legitimately lose points. The score does not determine qualification.
- Contact checks establish plausible syntax, not reachability or ownership.

## Achievement feedback

Four checks each contribute 25 points: a recognized leading action verb; at least seven words without a vague opening; a result-related phrase; and a digit or small written number. These are writing prompts, not proof of impact. Add only substantiated metrics.

## Job matching

Job matching is separate from formatting readiness. Suggestions must reference existing evidence and never add unverified skills or fabricated experience. Tailoring creates a new copy after review. Match components will be documented with implementation.
