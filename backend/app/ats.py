import re
from collections import defaultdict

from fastapi import APIRouter, Depends
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .analysis_models import Analysis
from .dependencies import session
from .profile_schemas import StrictModel
from .resumes import require_resume

STANDARD = {
    "summary",
    "profile",
    "professional summary",
    "experience",
    "work experience",
    "professional experience",
    "education",
    "skills",
    "technical skills",
    "projects",
    "certifications",
    "publications",
    "achievements",
    "awards",
    "languages",
    "references",
    "portfolio",
    "research",
    "volunteering",
    "leadership",
    "courses",
    "teaching",
}

ACTION_VERBS = {
    "achieved", "automated", "built", "created", "delivered", "designed", "developed",
    "drove", "engineered", "established", "implemented", "improved", "increased", "launched",
    "led", "managed", "optimized", "reduced", "resolved", "scaled", "shipped", "streamlined",
    "trained", "validated", "deployed", "integrated", "migrated", "owned", "published", "researched",
}
METRIC_RE = re.compile(
    r"(?:\b\d+(?:\.\d+)?\s*(?:%|percent(?:age)?)|\$\s?\d|\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b|"
    r"\b\d+(?:\.\d+)?\s*(?:users?|customers?|clients?|requests?|queries?|records?|documents?|"
    r"models?|services?|endpoints?|hours?|days?|weeks?|months?|seconds?|minutes?|x)\b)",
    re.I,
)
DATE_RE = re.compile(
    r"(?:\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|"
    r"aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4}\b|"
    r"\b(?:19|20)\d{2}\b|\bpresent\b|\bcurrent\b)",
    re.I,
)

CATEGORY_LABELS = {
    "parseability": "Parsing & contact",
    "content": "Content strength",
    "readability": "Readability",
}


def document_text(doc):
    p = doc["personal"]
    hidden = p.get("hidden_fields", [])
    text = [
        str(value)
        for key, value in p.items()
        if key not in hidden and isinstance(value, str)
    ]
    for section in doc["sections"]:
        if not section["visible"]:
            continue
        text.append(section["heading"])
        for item in section["items"]:
            for key, value in item["data"].items():
                if key in {
                    "notes",
                    "learning_notes",
                    "level",
                    "target_level",
                    "target_date",
                    "thumbnail",
                    "tags",
                    "category",
                }:
                    continue
                if isinstance(value, str):
                    text.append(value)
                elif isinstance(value, list):
                    text.extend(
                        str(v.get("text", "")) if isinstance(v, dict) else str(v)
                        for v in value
                    )
    return "\n".join(text)


def _resume_bullets(doc):
    bullets: list[str] = []
    for section in doc["sections"]:
        if not section.get("visible") or section.get("kind") not in {"experience", "projects", "achievements"}:
            continue
        for item in section.get("items", []):
            data = item.get("data", {})
            raw = data.get("bullets", [])
            if isinstance(raw, list):
                bullets.extend(
                    str(entry.get("text", "")).strip() if isinstance(entry, dict) else str(entry).strip()
                    for entry in raw
                )
            if section.get("kind") == "achievements" and data.get("statement"):
                bullets.append(str(data["statement"]).strip())
    return [bullet for bullet in bullets if bullet]


def _starts_with_action(text: str) -> bool:
    first = re.sub(r"^[^A-Za-z]+", "", text).split(maxsplit=1)[0].lower() if text.strip() else ""
    return first in ACTION_VERBS


def _ratio_earned(weight: int, ratio: float, full_at: float) -> float:
    if full_at <= 0:
        return float(weight)
    return round(weight * min(max(ratio, 0.0) / full_at, 1.0), 1)


def _categories(checks: list[dict]) -> dict:
    totals: dict[str, dict[str, float | str]] = defaultdict(lambda: {"earned": 0.0, "possible": 0.0})
    for check in checks:
        bucket = totals[check["category"]]
        bucket["earned"] = float(bucket["earned"]) + float(check["earned"])
        bucket["possible"] = float(bucket["possible"]) + float(check["weight"])
    result = {}
    for key, values in totals.items():
        possible = float(values["possible"])
        earned = round(float(values["earned"]), 1)
        result[key] = {
            "label": CATEGORY_LABELS.get(key, key.title()),
            "earned": earned,
            "possible": int(possible),
            "score": round(earned / possible * 100) if possible else 0,
        }
    return result


def _score_caps(*, text_ok: bool, email_ok: bool, phone_ok: bool, has_core_evidence: bool, image_safe: bool) -> list[dict]:
    caps: list[dict] = []
    if not text_ok:
        caps.append({"cap": 35, "reason": "Too little machine-readable text was available."})
    if not image_safe:
        caps.append({"cap": 49, "reason": "Critical information may depend on images instead of text."})
    if not email_ok and not phone_ok:
        caps.append({"cap": 69, "reason": "Both primary contact methods are missing or hidden."})
    elif not email_ok:
        caps.append({"cap": 79, "reason": "A valid visible email address is missing."})
    if not has_core_evidence:
        caps.append({"cap": 69, "reason": "No Experience or Projects evidence is present."})
    return caps


def analyze_ats(doc, page_count=1, purpose="General Resume"):
    personal = doc["personal"]
    hidden = personal.get("hidden_fields", [])
    sections = [s for s in doc["sections"] if s["visible"] and s.get("items")]
    kinds = {s["kind"] for s in sections}
    max_columns = max(
        [2 if doc["template"] in ["Two Column", "Creative", "Executive"] else 1]
        + [s.get("columns", 1) for s in sections]
    )
    text = document_text(doc).strip()
    bullets = _resume_bullets(doc)
    checks: list[dict] = []

    def add(key, label, weight, earned, severity, message, category, detail=""):
        earned = round(max(0.0, min(float(earned), float(weight))), 1)
        if earned >= weight - 0.05:
            status = "PASS"
        elif earned > 0:
            status = "WARN"
        else:
            status = "FAIL"
        checks.append(
            {
                "key": key,
                "label": label,
                "weight": weight,
                "earned": earned,
                "passed": status == "PASS",
                "status": status,
                "severity": severity,
                "message": message,
                "detail": detail,
                "category": category,
            }
        )

    text_ok = len(text) >= 250
    add(
        "text",
        "Machine-readable text",
        6,
        6 if text_ok else 3 if len(text) >= 80 else 0,
        "HIGH",
        "Keep essential resume content as real selectable text.",
        "parseability",
        f"{len(text):,} visible text characters analyzed.",
    )

    standard_count = sum(s["heading"].strip().lower() in STANDARD for s in sections)
    heading_ratio = standard_count / max(len(sections), 1)
    add(
        "headings",
        "Recognizable section headings",
        7,
        _ratio_earned(7, heading_ratio, 1.0),
        "MEDIUM",
        "Use familiar headings such as Experience, Education, Skills, Projects, and Certifications.",
        "parseability",
        f"{standard_count} of {len(sections)} populated section headings use recognized names.",
    )

    column_points = 8 if max_columns == 1 else 3 if max_columns == 2 else 0
    add(
        "columns",
        "Predictable reading order",
        8,
        column_points,
        "HIGH" if max_columns > 1 else "LOW",
        "A single-column layout is the safest choice for unknown ATS parsers.",
        "parseability",
        f"Maximum detected layout: {max_columns} column{'s' if max_columns != 1 else ''}.",
    )

    image_safe = not doc.get("critical_content_in_images", False)
    add(
        "images",
        "Critical content remains text",
        4,
        4 if image_safe else 0,
        "HIGH",
        "Do not place essential qualifications or contact details only inside images.",
        "parseability",
    )

    email_ok = (
        "email" not in hidden
        and bool(re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", personal.get("email", "")))
    )
    add(
        "email",
        "Visible contact email",
        15,
        15 if email_ok else 0,
        "HIGH",
        "Add a valid visible email address. Missing email is treated as a critical readiness issue.",
        "parseability",
    )

    phone_ok = "phone" not in hidden and len(re.sub(r"\D", "", personal.get("phone", ""))) >= 7
    add(
        "phone",
        "Visible contact phone",
        5,
        5 if phone_ok else 0,
        "MEDIUM",
        "Add a visible phone number when appropriate for the application.",
        "parseability",
    )

    has_experience = "experience" in kinds
    has_projects = "projects" in kinds
    evidence_points = 7 if has_experience else 5 if has_projects else 0
    add(
        "experience",
        "Relevant evidence section",
        7,
        evidence_points,
        "HIGH",
        "Include Experience when available. Strong Projects can partially support early-career resumes.",
        "content",
        "Experience detected." if has_experience else "Projects detected without Experience." if has_projects else "No Experience or Projects section detected.",
    )

    add(
        "education",
        "Education evidence",
        5,
        5 if "education" in kinds else 0,
        "MEDIUM",
        "Include Education when it is relevant to the target role or career stage.",
        "content",
    )

    skill_count = sum(len(s.get("items", [])) for s in sections if s.get("kind") == "skills")
    skill_points = 5 if skill_count >= 5 else 3 if skill_count >= 2 else 1 if skill_count == 1 else 0
    add(
        "skills",
        "Useful skills coverage",
        5,
        skill_points,
        "MEDIUM",
        "Use a focused Skills section with several concrete, truthful skills relevant to your work.",
        "content",
        f"{skill_count} skill entr{'y' if skill_count == 1 else 'ies'} detected.",
    )

    if bullets:
        metric_ratio = sum(bool(METRIC_RE.search(b)) for b in bullets) / len(bullets)
        action_ratio = sum(_starts_with_action(b) for b in bullets) / len(bullets)
        length_ratio = sum(8 <= len(b.split()) <= 35 for b in bullets) / len(bullets)
    else:
        metric_ratio = action_ratio = length_ratio = 0.0
    add(
        "impact",
        "Evidence of measurable impact",
        7,
        _ratio_earned(7, metric_ratio, 0.5),
        "MEDIUM",
        "Where facts support it, use numbers, percentages, scale, time saved, or other measurable outcomes.",
        "content",
        f"{round(metric_ratio * 100)}% of achievement bullets contain a measurable signal." if bullets else "No achievement bullets were detected.",
    )
    add(
        "actions",
        "Action-oriented achievement bullets",
        5,
        _ratio_earned(5, action_ratio, 0.7),
        "MEDIUM",
        "Start most achievement bullets with a specific action verb and state what you changed or delivered.",
        "content",
        f"{round(action_ratio * 100)}% of achievement bullets start with a recognized action verb." if bullets else "No achievement bullets were detected.",
    )

    dated_items = 0
    total_dated_candidates = 0
    for section in sections:
        if section.get("kind") not in {"experience", "education", "projects", "certifications", "publications"}:
            continue
        for item in section.get("items", []):
            data = item.get("data", {})
            total_dated_candidates += 1
            if any(str(data.get(key, "")).strip() for key in ("start_date", "end_date", "date", "year")):
                dated_items += 1
    date_ratio = dated_items / max(total_dated_candidates, 1)
    add(
        "dates",
        "Date coverage",
        4,
        _ratio_earned(4, date_ratio, 0.8) if total_dated_candidates else 0,
        "LOW",
        "Add dates to time-based experience, education, project, certification, and publication entries where appropriate.",
        "content",
        f"{dated_items} of {total_dated_candidates} time-based entries include dates.",
    )

    font_size = float(doc["style"]["font_size"])
    font_points = 6 if font_size >= 10.5 else 4 if font_size >= 10 else 2 if font_size >= 9.5 else 0
    add(
        "font",
        "Readable body font",
        6,
        font_points,
        "MEDIUM",
        "Use 10.5 pt or larger when possible. Do not compress text until it becomes hard to read.",
        "readability",
        f"Current body size: {font_size:g} pt.",
    )

    academic = "academic" in purpose.lower() or "research" in purpose.lower()
    if academic:
        page_points = 4 if 1 <= page_count <= 4 else 2 if page_count == 5 else 0
        page_message = "Academic CVs can be longer, but keep each page purposeful and easy to scan."
    else:
        page_points = 4 if 1 <= page_count <= 2 else 2 if page_count == 3 else 0
        page_message = "For most industry resumes, keep the document focused to one or two pages."
    add(
        "pages",
        "Appropriate page count",
        4,
        page_points,
        "LOW",
        page_message,
        "readability",
        f"Measured page count: {page_count}.",
    )

    add(
        "bullet_length",
        "Scannable bullet length",
        6,
        _ratio_earned(6, length_ratio, 0.8) if bullets else 0,
        "MEDIUM",
        "Keep most achievement bullets concise enough to scan, typically about 8–35 words.",
        "readability",
        f"{round(length_ratio * 100)}% of achievement bullets are within the target range." if bullets else "No achievement bullets were detected.",
    )

    chars_per_page = len(text) / max(page_count, 1)
    if 900 <= chars_per_page <= 5000:
        density_points = 6
    elif 500 <= chars_per_page <= 6500:
        density_points = 3
    else:
        density_points = 0
    add(
        "density",
        "Balanced text density",
        6,
        density_points,
        "LOW",
        "Avoid extremely sparse pages and pages packed with too much text. Use the preview to keep information easy to scan.",
        "readability",
        f"About {round(chars_per_page):,} visible characters per page.",
    )

    raw_score = round(sum(float(c["earned"]) for c in checks))
    has_core_evidence = has_experience or has_projects
    caps = _score_caps(
        text_ok=text_ok,
        email_ok=email_ok,
        phone_ok=phone_ok,
        has_core_evidence=has_core_evidence,
        image_safe=image_safe,
    )
    score = min([raw_score] + [int(cap["cap"]) for cap in caps])
    return {
        "score": int(score),
        "raw_score": int(raw_score),
        "checks": checks,
        "categories": _categories(checks),
        "score_caps": caps,
        "page_count": page_count,
        "columns": max_columns,
        "check_count": len(checks),
        "disclaimer": "CareerCanvas ATS Readiness Score is an application-specific heuristic. It is not a score returned by a real employer ATS and does not predict hiring outcomes.",
    }


def analyze_uploaded_resume(parsed, detected: list[str], personal: dict[str, dict]) -> dict:
    """Stricter file-level ATS review used by the resume-import workflow."""
    checks: list[dict] = []
    detected_set = set(detected)
    text = parsed.text.strip()
    lines = [re.sub(r"^[\s•●▪◦·*-]+", "", re.sub(r"\s+", " ", line)).strip() for line in text.splitlines() if line.strip()]
    content_lines = [line for line in lines if len(line.split()) >= 5 and len(line) <= 280]
    metric_ratio = sum(bool(METRIC_RE.search(line)) for line in content_lines) / max(len(content_lines), 1)
    action_ratio = sum(_starts_with_action(line) for line in content_lines) / max(len(content_lines), 1)
    date_count = len(DATE_RE.findall(text))

    def add(key, label, weight, earned, severity, message, category, detail=""):
        earned = round(max(0.0, min(float(earned), float(weight))), 1)
        status = "PASS" if earned >= weight - 0.05 else "WARN" if earned > 0 else "FAIL"
        checks.append({
            "key": key,
            "label": label,
            "weight": weight,
            "earned": earned,
            "passed": status == "PASS",
            "status": status,
            "severity": severity,
            "message": message,
            "detail": detail,
            "category": category,
        })

    text_ok = len(text) >= 250 and not parsed.scanned
    add("text", "Extractable text", 8, 8 if text_ok else 3 if len(text) >= 80 else 0, "HIGH", "Use a text-based PDF/DOCX so ATS parsers can read the resume.", "parseability", f"{len(text):,} characters extracted.")
    core_headings = {"experience", "education", "skills"}
    heading_ratio = len(core_headings & detected_set) / len(core_headings)
    add("headings", "Core standard headings", 8, _ratio_earned(8, heading_ratio, 1.0), "HIGH", "Use clear Experience, Education, and Skills headings.", "parseability", f"Detected: {', '.join(detected) if detected else 'none'}.")
    add("columns", "Predictable reading order", 10, 10 if not parsed.likely_multi_column else 3, "HIGH", "Complex columns and table-heavy layouts can change parser reading order.", "parseability")
    image_safe = not parsed.scanned and len(text) >= 120
    add("images", "Critical content is extractable", 6, 6 if image_safe else 0, "HIGH", "Important content should not exist only inside images.", "parseability")
    email_ok = "email" in personal
    phone_ok = "phone" in personal and len(re.sub(r"\D", "", personal["phone"]["value"])) >= 7
    add("email", "Contact email", 12, 12 if email_ok else 0, "HIGH", "Add a valid visible email address.", "parseability")
    add("phone", "Contact phone", 4, 4 if phone_ok else 0, "MEDIUM", "Add a visible phone number when appropriate.", "parseability")
    has_exp = "experience" in detected_set
    has_projects = "projects" in detected_set
    add("experience", "Experience or project evidence", 8, 8 if has_exp else 5 if has_projects else 0, "HIGH", "Use clear Experience or strong Projects evidence.", "content")
    add("education", "Education section", 6, 6 if "education" in detected_set else 0, "MEDIUM", "Use a clear Education section when relevant.", "content")
    add("skills", "Skills section", 6, 6 if "skills" in detected_set else 0, "MEDIUM", "Use a clear Skills or Technical Skills section.", "content")
    add("impact", "Measurable evidence", 8, _ratio_earned(8, metric_ratio, 0.18), "MEDIUM", "Use substantiated numbers or scale in achievement statements where possible.", "content", f"{round(metric_ratio * 100)}% of substantial lines contain a measurable signal.")
    add("actions", "Action-oriented statements", 6, _ratio_earned(6, action_ratio, 0.18), "MEDIUM", "Start achievement statements with specific action verbs.", "content", f"{round(action_ratio * 100)}% of substantial lines start with a recognized action verb.")
    add("dates", "Time context", 5, 5 if date_count >= 3 else 3 if date_count >= 1 else 0, "LOW", "Include dates for time-based experience and education entries.", "content", f"{date_count} date signals detected.")
    chars_per_page = len(text) / max(parsed.page_count, 1)
    density = 7 if 900 <= chars_per_page <= 5000 else 4 if 500 <= chars_per_page <= 6500 else 0
    add("density", "Readable text density", 7, density, "MEDIUM", "Very sparse or overloaded pages can indicate parser-unfriendly structure.", "readability", f"About {round(chars_per_page):,} characters per parsed page.")
    page_points = 6 if 1 <= parsed.page_count <= 2 else 3 if parsed.page_count == 3 else 0
    add("pages", "Focused page count", 6, page_points, "LOW", "Most industry resumes should remain focused to one or two pages.", "readability", f"Parsed page count: {parsed.page_count}.")

    raw_score = round(sum(float(c["earned"]) for c in checks))
    caps = _score_caps(text_ok=text_ok, email_ok=email_ok, phone_ok=phone_ok, has_core_evidence=has_exp or has_projects, image_safe=image_safe)
    score = min([raw_score] + [int(cap["cap"]) for cap in caps])
    warnings = list(parsed.warnings)
    return {
        "score": int(score),
        "raw_score": int(raw_score),
        "checks": checks,
        "categories": _categories(checks),
        "score_caps": caps,
        "page_count": parsed.page_count,
        "columns": 2 if parsed.likely_multi_column else 1,
        "check_count": len(checks),
        "detected_sections": detected,
        "not_detected": [name for name in ("experience", "education", "skills") if name not in detected_set],
        "warnings": warnings,
        "disclaimer": "CareerCanvas ATS Readiness Score is an application-specific heuristic. It is not a score produced by an employer's ATS and does not predict hiring outcomes.",
    }


class ATSInput(StrictModel):
    page_count: int = Field(ge=1, le=100)


router = APIRouter(prefix="/api/resumes", tags=["ATS readiness"])


@router.post("/{resume_id}/ats")
def run_ats(resume_id: str, payload: ATSInput, db: Session = Depends(session)):
    resume = require_resume(db, resume_id)
    result = analyze_ats(resume.document, payload.page_count, resume.purpose)
    db.add(
        Analysis(
            resume_id=resume.id, revision=resume.revision, kind="ats", result=result
        )
    )
    db.commit()
    return result


@router.get("/{resume_id}/ats")
def latest_ats(resume_id: str, db: Session = Depends(session)):
    resume = require_resume(db, resume_id)
    analysis = db.scalar(
        select(Analysis)
        .where(
            Analysis.resume_id == resume.id,
            Analysis.revision == resume.revision,
            Analysis.kind == "ats",
        )
        .order_by(Analysis.created_at.desc())
    )
    return analysis.result if analysis else None
