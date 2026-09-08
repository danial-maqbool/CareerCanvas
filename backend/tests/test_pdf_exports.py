import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from io import BytesIO

import httpx
import pytest
from pypdf import PdfReader

from backend.app.config import ROOT
from backend.app.resume_schemas import TEMPLATES


@pytest.fixture(scope="module")
def live_export_server(tmp_path_factory):
    if not (ROOT / "frontend/dist/index.html").exists():
        pytest.skip("Build frontend before running browser export integration tests")
    directory = tmp_path_factory.mktemp("export-server")
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    env = {
        **os.environ,
        "DATABASE_URL": f"sqlite:///{directory / 'export.db'}",
        "PORT": str(port),
        "AI_ENABLED": "false",
    }
    log = (directory / "server.log").open("w")
    process = subprocess.Popen(
        [sys.executable, str(ROOT / "run.py")],
        cwd=ROOT,
        env=env,
        stdout=log,
        stderr=log,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
    )
    client = httpx.Client(base_url=f"http://127.0.0.1:{port}", timeout=90)
    try:
        for _ in range(100):
            try:
                if client.get("/api/health").status_code == 200:
                    break
            except httpx.HTTPError:
                pass
            time.sleep(0.1)
        else:
            raise RuntimeError("Isolated export server did not start")
        assert client.post("/api/demo/profile").status_code == 201
        yield client
    finally:
        client.close()
        process.terminate()
        process.wait(timeout=10)
        log.close()


@pytest.mark.parametrize("template", TEMPLATES)
def test_pdf_contains_text_sections_links_and_correct_pagination(
    live_export_server, template
):
    client = live_export_server
    profile = client.get("/api/profile").json()
    resume = client.post(
        "/api/resumes",
        json={
            "name": f"{template} PDF validation",
            "template": template,
            "selected_ids": [
                i["id"]
                for i in profile["items"]
                if i["kind"]
                in ["experience", "education", "projects", "skills", "certifications"]
            ],
        },
    ).json()
    response = client.post(f"/api/resumes/{resume['id']}/export/pdf")
    assert response.status_code == 200, response.text
    reader = PdfReader(BytesIO(response.content))
    text = "\n".join(page.extract_text() for page in reader.pages)
    for expected in [
        "Alex Morgan",
        "alex.morgan@example.com",
        "Northstar Labs",
        "Lakeview",
        "Python",
        "Signal",
    ]:
        assert expected in text, (template, expected, text)
    assert len(reader.pages) == int(response.headers["X-CareerCanvas-Pages"])
    if template == "Academic":
        assert "IV. Projects" in reader.pages[1].extract_text()
        assert "V. Skills" in text
    assert all(len(page.extract_text().strip()) > 40 for page in reader.pages)
    for page in reader.pages:
        assert abs(float(page.mediabox.width) - 595.28) < 2
        assert abs(float(page.mediabox.height) - 841.89) < 2
    uris = [
        str(annotation.get_object().get("/A", {}).get("/URI", ""))
        for page in reader.pages
        for annotation in page.get("/Annots", [])
    ]
    assert "mailto:alex.morgan@example.com" in uris
    assert "https://example.com/signal" in uris
    output = ROOT / "data/validation/pdf"
    output.mkdir(parents=True, exist_ok=True)
    (output / f"{template.lower().replace(' ', '-')}.pdf").write_bytes(response.content)


@pytest.mark.parametrize("page_size", ["A4", "Letter"])
@pytest.mark.parametrize(
    "scenario",
    ["One Page", "Two Pages", "Long Experience", "Many Projects", "Long Skills"],
)
def test_pdf_layout_scenarios(live_export_server, page_size, scenario):
    from copy import deepcopy
    from backend.app.resume_schemas import ResumeDocument, ResumeSection, ResumeItem

    client = live_export_server
    personal = {
        "full_name": "Fictional Layout Engineer",
        "professional_title": "Software Engineer",
        "email": "layout@example.com",
        "phone": "+1 202 555 0123",
        "summary": "Software engineer building reliable systems and clear interfaces.",
    }
    count = 1 if scenario == "One Page" else 2 if scenario == "Two Pages" else 1
    bullets = (
        2
        if scenario == "One Page"
        else 7
        if scenario == "Two Pages"
        else 35
        if scenario == "Long Experience"
        else 2
    )
    experiences = [
        ResumeItem(
            kind="experience",
            data={
                "company": "Fictional Layout Company",
                "position": "Engineer " + str(i),
                "bullets": [
                    {
                        "text": f"Layout bullet {i}-{b}: Developed dependable Python services with automated checks, clear operational documentation, resilient task processing, and careful evaluation of representative workflows across the engineering team."
                    }
                    for b in range(bullets)
                ],
            },
        )
        for i in range(count)
    ]
    projects = [
        ResumeItem(
            kind="projects",
            data={
                "name": f"Layout Project {i:02d}",
                "description": "A fictional project demonstrating repeatable evaluation and dependable service design.",
            },
        )
        for i in range(24 if scenario == "Many Projects" else 1)
    ]
    skills = [
        ResumeItem(kind="skills", data={"name": f"Layout Skill {i:02d}"})
        for i in range(70 if scenario == "Long Skills" else 3)
    ]
    doc = ResumeDocument(
        personal=personal,
        template="Classic",
        sections=[
            ResumeSection(kind="experience", heading="Experience", items=experiences),
            ResumeSection(
                kind="education",
                heading="Education",
                items=[
                    ResumeItem(
                        kind="education",
                        data={
                            "institution": "Fictional Layout University",
                            "degree": "B.S.",
                        },
                    )
                ],
            ),
            ResumeSection(kind="projects", heading="Projects", items=projects),
            ResumeSection(kind="skills", heading="Skills", items=skills),
        ],
    )
    doc.style.page_size = page_size
    if scenario == "Two Pages":
        doc.style.font_size = 11.5
    r = client.post("/api/resumes", json={"name": scenario + " " + page_size}).json()
    update = client.put(
        "/api/resumes/" + r["id"],
        json={
            "name": r["name"],
            "revision": r["revision"],
            "document": doc.model_dump(),
        },
    )
    assert update.status_code == 200, update.text
    response = client.post("/api/resumes/" + r["id"] + "/export/pdf")
    assert response.status_code == 200, response.text
    pdf = PdfReader(BytesIO(response.content))
    text = "\n".join(p.extract_text() for p in pdf.pages)
    assert f"Layout bullet {count - 1}-{bullets - 1}" in text
    assert f"Layout Project {len(projects) - 1:02d}" in text
    assert f"Layout Skill {len(skills) - 1:02d}" in text
    assert len(pdf.pages) == int(response.headers["X-CareerCanvas-Pages"])
    assert all(len(p.extract_text().strip()) > 30 for p in pdf.pages)
    if scenario == "One Page":
        assert len(pdf.pages) == 1
    if scenario == "Two Pages":
        assert len(pdf.pages) == 2
    if scenario in ["Long Experience", "Many Projects"]:
        assert len(pdf.pages) > 1
    width, height = (595.28, 841.89) if page_size == "A4" else (612, 792)
    assert all(
        abs(float(p.mediabox.width) - width) < 2
        and abs(float(p.mediabox.height) - height) < 2
        for p in pdf.pages
    )
    output = ROOT / "data/validation/pdf/scenarios"
    output.mkdir(parents=True, exist_ok=True)
    (
        output / (scenario.lower().replace(" ", "-") + "-" + page_size.lower() + ".pdf")
    ).write_bytes(response.content)


def test_pdf_rejects_oversized_summary_without_losing_content(live_export_server):
    client = live_export_server
    r = client.post("/api/resumes", json={"name": "Oversized summary"}).json()
    r["document"]["personal"]["summary"] = (
        "An intentionally oversized fictional summary. " * 180
    )
    saved = client.put(
        "/api/resumes/" + r["id"],
        json={"name": r["name"], "revision": r["revision"], "document": r["document"]},
    )
    assert saved.status_code == 200
    response = client.post("/api/resumes/" + r["id"] + "/export/pdf")
    assert response.status_code == 422 and "page boundary" in response.text
    assert (
        client.get("/api/resumes/" + r["id"]).json()["document"]["personal"]["summary"]
        == r["document"]["personal"]["summary"].strip()
    )
