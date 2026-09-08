import base64
import io

from docx import Document
from pypdf import PdfWriter

from backend.app.resume_import import parse_document, split_sections


STANDARD_TEXT = """Alex Morgan
AI Engineer
alex.morgan@example.com
+1 555 123 4567
https://github.com/alexmorgan
Seattle, USA

Professional Summary
AI engineer focused on reliable production systems.

Experience
AI Engineer | Acme Systems
Jan 2024 - Present
Built FastAPI services used by three internal products.
Reduced model evaluation time by 35 percent.

Education
Example University
MS Artificial Intelligence
2022 - 2024
GPA: 3.9/4.0

Technical Skills
Python, FastAPI, SQL, Docker

Projects
CareerCanvas
Built a local-first resume and career workspace.
"""


def encoded(text: str) -> str:
    return base64.b64encode(text.encode()).decode()


def test_txt_preview_extracts_profile_and_direct_ats(client):
    response = client.post(
        "/api/import/preview",
        json={"filename": "standard_resume.txt", "content_base64": encoded(STANDARD_TEXT)},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["personal"]["email"]["value"] == "alex.morgan@example.com"
    assert data["personal"]["phone"]["value"]
    assert {"experience", "education", "skills", "projects"}.issubset(
        set(data["detected_sections"])
    )
    assert any(
        item["kind"] == "skills" and item["data"]["name"] == "Python"
        for item in data["items"]
    )
    assert data["ats"]["score"] >= 80
    assert not data["ats"]["not_detected"]
    assert "AI engineer focused" in data["extracted_text"]


def test_import_review_applies_then_detects_duplicates(client):
    preview = client.post(
        "/api/import/preview",
        json={"filename": "standard_resume.txt", "content_base64": encoded(STANDARD_TEXT)},
    ).json()
    payload = {
        "filename": preview["filename"],
        "personal": {key: value["value"] for key, value in preview["personal"].items()},
        "personal_selected": {key: True for key in preview["personal"]},
        "items": [
            {
                "temp_id": item["temp_id"],
                "kind": item["kind"],
                "data": item["data"],
                "selected": True,
                "duplicate_id": None,
                "duplicate_action": "new",
            }
            for item in preview["items"]
        ],
    }
    applied = client.post("/api/import/apply", json=payload)
    assert applied.status_code == 200, applied.text
    result = applied.json()
    assert result["items_added"] >= 4
    profile = client.get("/api/profile").json()
    assert profile["personal"]["full_name"] == "Alex Morgan"
    assert any(
        item["kind"] == "skills" and item["data"]["name"] == "Python"
        for item in profile["items"]
    )

    second = client.post(
        "/api/import/preview",
        json={"filename": "standard_resume.txt", "content_base64": encoded(STANDARD_TEXT)},
    ).json()
    python = next(
        item
        for item in second["items"]
        if item["kind"] == "skills" and item["data"]["name"] == "Python"
    )
    assert python["duplicate"]
    assert python["duplicate"]["score"] == 1.0


def test_duplicate_keep_does_not_create_second_skill(client):
    first = client.post(
        "/api/import/preview",
        json={"filename": "standard_resume.txt", "content_base64": encoded(STANDARD_TEXT)},
    ).json()
    item = next(
        x for x in first["items"] if x["kind"] == "skills" and x["data"]["name"] == "Python"
    )
    client.post(
        "/api/import/apply",
        json={
            "filename": first["filename"],
            "personal": {},
            "personal_selected": {},
            "items": [
                {
                    "temp_id": item["temp_id"],
                    "kind": item["kind"],
                    "data": item["data"],
                    "selected": True,
                    "duplicate_id": None,
                    "duplicate_action": "new",
                }
            ],
        },
    )
    second = client.post(
        "/api/import/preview",
        json={"filename": "standard_resume.txt", "content_base64": encoded(STANDARD_TEXT)},
    ).json()
    duplicate = next(
        x for x in second["items"] if x["kind"] == "skills" and x["data"]["name"] == "Python"
    )
    response = client.post(
        "/api/import/apply",
        json={
            "filename": second["filename"],
            "personal": {},
            "personal_selected": {},
            "items": [
                {
                    "temp_id": duplicate["temp_id"],
                    "kind": duplicate["kind"],
                    "data": duplicate["data"],
                    "selected": True,
                    "duplicate_id": duplicate["duplicate"]["id"],
                    "duplicate_action": "keep",
                }
            ],
        },
    )
    assert response.status_code == 200
    assert response.json()["items_skipped"] == 1
    skills = [
        x
        for x in client.get("/api/profile").json()["items"]
        if x["kind"] == "skills" and x["data"]["name"] == "Python"
    ]
    assert len(skills) == 1


def test_missing_phone_is_reported_by_uploaded_ats(client):
    text = STANDARD_TEXT.replace("+1 555 123 4567\n", "")
    data = client.post(
        "/api/import/preview",
        json={"filename": "missing_phone_resume.txt", "content_base64": encoded(text)},
    ).json()
    phone = next(check for check in data["ats"]["checks"] if check["key"] == "phone")
    assert phone["passed"] is False
    assert data["ats"]["score"] < 100


def test_docx_extraction_and_table_warning():
    doc = Document()
    doc.add_paragraph("Alex Morgan")
    doc.add_paragraph("Experience")
    doc.add_paragraph("AI Engineer | Acme Systems")
    doc.add_paragraph("Jan 2024 - Present")
    table = doc.add_table(rows=2, cols=2)
    table.cell(0, 0).text = "Technical Skills"
    table.cell(0, 1).text = "Python, FastAPI, SQL"
    table.cell(1, 0).text = "Education"
    table.cell(1, 1).text = "Example University MS Artificial Intelligence 2022 - 2024"
    stream = io.BytesIO()
    doc.save(stream)
    parsed = parse_document("resume.docx", stream.getvalue())
    assert parsed.format == "DOCX"
    assert "Alex Morgan" in parsed.text
    assert parsed.table_count == 1
    assert parsed.table_text_ratio > 0


def test_scanned_pdf_is_detected_without_cloud_ocr():
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    stream = io.BytesIO()
    writer.write(stream)
    parsed = parse_document("scanned.pdf", stream.getvalue())
    assert parsed.scanned is True
    assert any("OCR" in warning for warning in parsed.warnings)


def test_heading_aliases_are_normalized():
    _, sections, detected = split_sections(
        "Alex Morgan\nPROFESSIONAL EXPERIENCE\nEngineer | Acme\n2023 - 2024\nTECHNICAL SKILLS\nPython"
    )
    assert "experience" in detected
    assert "skills" in detected
    assert sections["skills"] == ["Python"]
