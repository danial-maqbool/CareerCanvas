from copy import deepcopy

from backend.app.ats import analyze_ats
from backend.tests.test_resumes import make_resume, update_payload


def check(result, key):
    return next(item for item in result["checks"] if item["key"] == key)


def test_strict_score_has_breakdown_and_contact_caps(client):
    resume = make_resume(client)
    doc = resume["document"]
    result = analyze_ats(doc, 2)
    assert result["score"] >= 90
    assert result["check_count"] >= 16
    assert set(result["categories"]) == {"parseability", "content", "readability"}
    assert result["raw_score"] >= result["score"]

    missing = deepcopy(doc)
    missing["personal"]["email"] = ""
    missing_result = analyze_ats(missing, 2)
    assert missing_result["score"] <= 79
    assert check(missing_result, "email")["passed"] is False
    assert any(cap["cap"] == 79 for cap in missing_result["score_caps"])

    hidden = deepcopy(doc)
    hidden["personal"]["hidden_fields"] = ["email", "phone"]
    hidden_result = analyze_ats(hidden, 2)
    assert hidden_result["score"] <= 69
    assert any(cap["cap"] == 69 for cap in hidden_result["score_caps"])


def test_strict_score_penalizes_layout_images_font_headings_and_pages(client):
    doc = make_resume(client)["document"]
    doc["template"] = "Two Column"
    doc["style"]["font_size"] = 9
    doc["sections"][0]["heading"] = "My Awesome Journey"
    doc["critical_content_in_images"] = True
    result = analyze_ats(doc, 4)
    assert result["score"] <= 49
    failing = {c["key"] for c in result["checks"] if c["status"] != "PASS"}
    assert {"columns", "font", "headings", "images", "pages"}.issubset(failing)
    assert check(result, "columns")["earned"] < check(result, "columns")["weight"]
    assert any(cap["cap"] == 49 for cap in result["score_caps"])


def test_content_quality_checks_reward_metrics_and_action_verbs(client):
    doc = make_resume(client)["document"]
    strong = analyze_ats(doc, 2)
    assert check(strong, "impact")["earned"] > 0
    assert check(strong, "actions")["earned"] > 0

    weak = deepcopy(doc)
    for section in weak["sections"]:
        if section["kind"] in {"experience", "projects"}:
            for item in section["items"]:
                if "bullets" in item["data"]:
                    item["data"]["bullets"] = [
                        {"id": "weak", "text": "Responsible for various tasks and general team support activities."}
                    ]
    weak_result = analyze_ats(weak, 2)
    assert check(weak_result, "impact")["earned"] < check(strong, "impact")["earned"]
    assert check(weak_result, "actions")["earned"] < check(strong, "actions")["earned"]


def test_analysis_is_invalidated_by_edits(client):
    resume = make_resume(client)
    path = f"/api/resumes/{resume['id']}"
    first = client.post(path + "/ats", json={"page_count": 2})
    assert first.status_code == 200
    assert first.json()["score"] >= 90
    assert client.get(path + "/ats").json()["score"] == first.json()["score"]
    payload = update_payload(resume)
    payload["document"]["personal"]["email"] = ""
    client.put(path, json=payload)
    assert client.get(path + "/ats").json() is None
    assert client.delete(path).status_code == 204
