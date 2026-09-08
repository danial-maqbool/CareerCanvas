import pytest

from backend.app.demo import ITEMS


def test_profile_personal_persists(client):
    profile = client.get("/api/profile").json()
    assert profile["completion"]["score"] == 0
    personal = {
        **profile["personal"],
        "full_name": "Test Person",
        "email": "test@example.com",
    }
    assert client.put("/api/profile/personal", json=personal).status_code == 200
    saved = client.get("/api/profile").json()
    assert saved["personal"]["full_name"] == "Test Person"
    assert saved["completion"]["score"] > 0


@pytest.mark.parametrize("item", ITEMS, ids=lambda item: item["kind"])
def test_typed_library_crud(client, item):
    created = client.post("/api/profile/items", json=item)
    assert created.status_code == 201, created.text
    record = created.json()
    fetched = client.get("/api/profile").json()["items"]
    assert fetched[0]["data"] == record["data"]
    assert (
        client.put(
            f"/api/profile/items/{record['id']}",
            json={"kind": record["kind"], "data": record["data"]},
        ).status_code
        == 200
    )
    assert client.delete(f"/api/profile/items/{record['id']}").status_code == 204
    assert client.get("/api/profile").json()["items"] == []


def test_invalid_career_items_rejected(client):
    assert (
        client.post(
            "/api/profile/items", json={"kind": "skills", "data": {"name": ""}}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/profile/items",
            json={"kind": "experience", "data": {"company": "Test"}},
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/profile/items",
            json={"kind": "skills", "data": {"name": "Python", "unknown": True}},
        ).status_code
        == 422
    )
    assert (
        client.put(
            "/api/profile/personal", json={"website": "javascript:alert(1)"}
        ).status_code
        == 422
    )


def test_demo_is_explicit_and_non_destructive(client):
    assert client.get("/api/profile").json()["items"] == []
    assert client.post("/api/demo/profile").status_code == 201
    profile = client.get("/api/profile").json()
    assert profile["personal"]["full_name"] == "Alex Morgan"
    assert len(profile["items"]) == 26
    assert profile["completion"]["score"] == 100
    assert client.post("/api/demo/profile").status_code == 409
    assert client.get("/api/profile").json() == profile
