def make_resume(client):
    client.post("/api/demo/profile")
    profile = client.get("/api/profile").json()
    response = client.post(
        "/api/resumes",
        json={
            "name": "AI Engineer Resume",
            "target_role": "AI Engineer",
            "selected_ids": [
                i["id"] for i in profile["items"] if i["kind"] != "references"
            ],
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def update_payload(resume):
    return {
        key: resume[key]
        for key in ["name", "revision", "target_role", "archived", "document"]
    }


def test_independent_document_duplicate_and_archive(client):
    original = make_resume(client)
    copy = client.post(f"/api/resumes/{original['id']}/duplicate").json()
    assert copy["id"] != original["id"]
    assert copy["document"] == original["document"]
    payload = update_payload(copy)
    payload["name"] = "Research Resume"
    payload["document"]["personal"]["full_name"] = "Custom Name"
    payload["archived"] = True
    assert client.put(f"/api/resumes/{copy['id']}", json=payload).status_code == 200
    assert (
        client.get(f"/api/resumes/{original['id']}").json()["document"]
        == original["document"]
    )
    assert client.get("/api/profile").json()["personal"]["full_name"] == "Alex Morgan"
    assert client.delete(f"/api/resumes/{copy['id']}").status_code == 204
    assert len(client.get("/api/resumes").json()) == 1


def test_optimistic_save_and_template_preservation(client):
    resume = make_resume(client)
    content = resume["document"]["sections"]
    for template in ["Classic", "Technical", "Modern"]:
        payload = update_payload(resume)
        payload["document"]["template"] = template
        saved = client.put(f"/api/resumes/{resume['id']}", json=payload)
        assert saved.status_code == 200
        assert saved.json()["document"]["sections"] == content
        assert (
            client.put(f"/api/resumes/{resume['id']}", json=payload).status_code == 409
        )
        resume = saved.json()


def test_profile_deletion_does_not_remove_resume_content(client):
    resume = make_resume(client)
    for item in client.get("/api/profile").json()["items"]:
        client.delete(f"/api/profile/items/{item['id']}")
    assert (
        client.get(f"/api/resumes/{resume['id']}").json()["document"]
        == resume["document"]
    )


def test_missing_selection_and_style_safety(client):
    assert (
        client.post(
            "/api/resumes", json={"name": "Bad", "selected_ids": ["missing"]}
        ).status_code
        == 422
    )
    resume = make_resume(client)
    payload = update_payload(resume)
    payload["document"]["style"]["font_size"] = 4
    assert client.put(f"/api/resumes/{resume['id']}", json=payload).status_code == 422
