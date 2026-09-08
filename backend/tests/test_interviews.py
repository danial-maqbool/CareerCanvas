def test_interview_preparation_and_contact_links(client):
    job = client.post(
        "/api/applications", json={"company": "Cedar", "role": "Engineer"}
    ).json()
    story = client.post(
        "/api/career/stories",
        json={
            "title": "Reliable releases",
            "data": {
                "situation": "Slow manual releases",
                "task": "Improve release safety",
                "action": "Built repeatable checks",
                "result": "Fewer failed releases",
            },
        },
    ).json()
    question = client.post(
        "/api/career/questions",
        json={
            "title": "Describe a difficult tradeoff",
            "data": {"category": "Behavioral"},
        },
    ).json()
    response = client.post(
        "/api/career/interviews",
        json={
            "title": "Cedar technical conversation",
            "application_id": job["id"],
            "data": {
                "company": "Cedar",
                "story_ids": [story["id"]],
                "question_ids": [question["id"]],
            },
        },
    )
    assert response.status_code == 201
    row = response.json()
    assert len(row["data"]["checklist"]) == 7
    row["data"]["checklist"][0]["done"] = True
    payload = {k: v for k, v in row.items() if k not in ["id", "updated_at"]}
    assert client.put("/api/career/interviews/" + row["id"], json=payload).json()[
        "data"
    ]["checklist"][0]["done"]
    contact = client.post(
        "/api/career/contacts",
        json={
            "title": "Jamie Recruiter",
            "application_id": job["id"],
            "data": {"company": "Cedar", "email": "jamie@example.test"},
        },
    ).json()
    assert client.delete("/api/career/stories/" + story["id"]).status_code == 204
    assert client.get("/api/career/interviews").json()[0]["data"]["story_ids"] == []
    client.delete("/api/applications/" + job["id"])
    assert client.get("/api/career/contacts").json()[0]["application_id"] is None
    assert client.get("/api/career/interviews").json()[0]["application_id"] is None


def test_deleted_profile_content_unlinks_stories(client):
    skill = client.post(
        "/api/profile/items", json={"kind": "skills", "data": {"name": "Python"}}
    ).json()
    story = client.post(
        "/api/career/stories",
        json={"title": "A reusable story", "data": {"skill_ids": [skill["id"]]}},
    ).json()
    assert client.delete("/api/profile/items/" + skill["id"]).status_code == 204
    result = client.get("/api/career/stories").json()[0]
    assert result["data"]["skill_ids"] == [] and result["title"] == "A reusable story"
