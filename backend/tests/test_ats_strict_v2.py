from backend.tests.test_resume_import import STANDARD_TEXT, docx_bytes, encoded, encoded_bytes


def test_uploaded_resume_uses_stricter_breakdown(client):
    response = client.post(
        "/api/import/preview",
        json={"filename": "resume.txt", "content_base64": encoded(STANDARD_TEXT)},
    )
    assert response.status_code == 200, response.text
    result = response.json()["ats"]
    assert result["check_count"] >= 14
    assert set(result["categories"]) == {"parseability", "content", "readability"}
    assert result["raw_score"] >= result["score"]
    assert any(check["key"] == "impact" for check in result["checks"])
    assert any(check["key"] == "actions" for check in result["checks"])


def test_uploaded_resume_missing_email_is_capped(client):
    text = STANDARD_TEXT.replace("alex.morgan@example.com\n", "")
    result = client.post(
        "/api/import/preview",
        json={"filename": "missing_email.txt", "content_base64": encoded(text)},
    ).json()["ats"]
    assert result["score"] <= 79
    assert any(cap["cap"] == 79 for cap in result["score_caps"])
    email = next(check for check in result["checks"] if check["key"] == "email")
    assert email["passed"] is False


def test_table_heavy_docx_loses_reading_order_points(client):
    normal = client.post(
        "/api/import/preview",
        json={"filename": "normal.docx", "content_base64": encoded_bytes(docx_bytes(STANDARD_TEXT))},
    ).json()["ats"]
    table = client.post(
        "/api/import/preview",
        json={
            "filename": "table.docx",
            "content_base64": encoded_bytes(docx_bytes(STANDARD_TEXT, use_table=True)),
        },
    ).json()["ats"]
    normal_columns = next(check for check in normal["checks"] if check["key"] == "columns")
    table_columns = next(check for check in table["checks"] if check["key"] == "columns")
    assert table_columns["earned"] < normal_columns["earned"]
