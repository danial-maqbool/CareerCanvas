# ATS analysis

**CareerCanvas ATS Readiness Score is an application-specific heuristic. It is not a score returned by a real employer ATS and does not predict hiring outcomes.**

CareerCanvas uses deterministic local checks. It does not call an external ATS or AI service to calculate the score.

## What changed in the stricter scoring model

The score now evaluates more than basic section presence. It also checks measurable achievement evidence, action-oriented bullets, date coverage, bullet length, text density, parser reading order, and critical contact failures.

Checks can receive **partial credit**. The UI shows the exact earned points for every check. Severe readiness failures can also apply an explicit **score cap** so a resume cannot receive an unrealistically high score after losing only a small number of weighted points.

Examples of caps:

- missing visible email: maximum 79;
- missing both email and phone: maximum 69;
- no Experience or Projects evidence: maximum 69;
- too little machine-readable text: maximum 35;
- critical content that depends on images: maximum 49.

The ATS panel shows both the raw weighted score and the final score when a cap applies.

## Native CareerCanvas resume score

The native resume score contains sixteen checks with a total weight of 100.

| Category | Check | Weight | Full-credit condition |
| --- | --- | ---: | --- |
| Parsing & contact | Machine-readable text | 6 | At least 250 visible text characters |
| Parsing & contact | Recognizable section headings | 7 | All populated section headings use recognized names |
| Parsing & contact | Predictable reading order | 8 | Single-column layout |
| Parsing & contact | Critical content remains text | 4 | No critical-content-in-images marker |
| Parsing & contact | Visible contact email | 15 | Visible email matches a basic address pattern |
| Parsing & contact | Visible contact phone | 5 | Visible phone contains at least seven digits |
| Content strength | Relevant evidence section | 7 | Experience is present; Projects receives partial credit when Experience is absent |
| Content strength | Education evidence | 5 | Populated Education section |
| Content strength | Useful skills coverage | 5 | Five or more concrete skills for full credit |
| Content strength | Evidence of measurable impact | 7 | At least half of achievement bullets contain a measurable signal for full credit |
| Content strength | Action-oriented achievement bullets | 5 | At least 70% of achievement bullets start with a recognized action verb for full credit |
| Content strength | Date coverage | 4 | At least 80% of time-based entries include date information |
| Readability | Readable body font | 6 | 10.5 pt or larger for full credit |
| Readability | Appropriate page count | 4 | One or two pages for normal industry resumes; academic/research purposes allow a wider range |
| Readability | Scannable bullet length | 6 | At least 80% of bullets are about 8–35 words |
| Readability | Balanced text density | 6 | Text density stays inside a broad readable range |

The formula is intentionally transparent. CareerCanvas exposes the point contribution, partial-credit status, category score, evidence detail, and remediation message for each check.

## Direct uploaded-resume review

CareerCanvas can review a **PDF, DOCX, or TXT file directly**. The direct review uses file evidence rather than editor-state assumptions.

The stricter direct review checks:

- extractable text;
- Experience, Education, and Skills heading detection;
- likely multi-column or table-heavy reading order;
- image-only/scanned risk;
- email and phone detection;
- Experience or Projects evidence;
- Education and Skills sections;
- measurable evidence in substantial lines;
- action-oriented statements;
- date signals;
- extracted text density;
- page count where the parser has reliable page metadata.

It uses the same critical score-cap policy as native CareerCanvas resumes. The direct review also reports document metadata, detected links, parser warnings, detected sections, and extracted text.

For DOCX files, `python-docx` does not provide authoritative Microsoft Word pagination. CareerCanvas therefore treats DOCX page count as structural metadata and does not claim exact Word-rendered pagination.

## ATS-safe layout action

The editor provides an explicit **ATS-safe layout** action. It changes formatting only:

- switches high-risk multi-column templates to Professional;
- makes all sections single-column;
- restores standard section headings;
- enforces at least 10.5 pt body text;
- applies conservative line height and margins.

It does **not** rewrite, add, remove, or fabricate career facts. The user can undo the change with the normal editor history.

## Score interpretation

Use these bands as guidance inside CareerCanvas only:

- **90–100:** excellent structural foundation;
- **80–89:** strong, but review remaining warnings;
- **70–79:** usable, but important issues remain;
- **below 70:** revise critical structure, contact, or content issues before sending.

A high score does not mean that a resume matches a job. Job matching is a separate feature.

## Limitations

- Real employer ATS systems use private parsers, ranking logic, and configuration. CareerCanvas cannot reproduce them exactly.
- Two-column resumes are not automatically invalid. CareerCanvas gives them lower parser-safety credit because reading order varies between systems.
- Quantified impact is rewarded only as a writing-quality signal. Never add unsupported metrics to improve the score.
- Long academic CVs can be appropriate. CareerCanvas uses a more permissive page-count rule for academic and research resume purposes.
- Applicants without conventional work experience can receive partial evidence credit from strong Projects.
- Contact checks validate plausible format, not ownership or deliverability.
- Image-only/scanned PDFs are detected, but automatic OCR is not bundled.
- Deterministic English-oriented heading and action-verb rules can miss valid unusual wording.

See [Resume Import & Direct ATS Review](RESUME_IMPORT.md) for file ingestion and direct review details.

## Achievement feedback

Achievement feedback remains separate from the ATS score. It checks action verbs, minimum detail, result language, and measurable signals. These are writing prompts, not proof of impact.

## Job matching

Job matching is separate from ATS readiness. It compares the selected resume and Career Profile against a job description using explicit skill, keyword, experience, education, and role evidence. Missing skills never become profile claims automatically.
