# ATS analysis

CareerCanvas ATS Readiness Score is an application-specific heuristic. It is not a score returned by a real employer ATS and does not predict hiring outcomes.

Status: checks and scoring implementation pending. No score is currently validated.

## Required checks

- Selectable document text.
- Standard section headings.
- Column complexity.
- Critical information represented as text rather than images.
- Contact email and phone presence.
- Experience, education, and skills section presence.
- Readable font size.
- Reasonable page count.

Each implemented check will document its exact weight, applicability, severity, and deterministic detection rule here. Tests must cover good, bad, missing-contact, image-heavy, and excessive-column fixtures.

## Job matching

Job matching is separate from formatting readiness. Explain skill, keyword, experience, education, and role components transparently. Suggestions may reference existing profile evidence but must never add unverified skills or fabricate experience. Tailoring creates a new resume copy after review.
