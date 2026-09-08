def test_github_import_restricts_url_and_preserves_metadata(client, monkeypatch):
    assert (
        client.post(
            "/api/import/github-preview",
            json={"url": "http://localhost:8000/api/profile"},
        ).status_code
        == 422
    )
    import httpx

    def get(url, **kwargs):
        if url.endswith("/languages"):
            return httpx.Response(200, json={"Python": 100, "TypeScript": 200})
        return httpx.Response(
            200,
            json={
                "name": "Example",
                "description": "Exact source description",
                "language": "Python",
                "topics": ["evaluation"],
                "stargazers_count": 4,
                "html_url": "https://github.com/demo/example",
                "private": False,
            },
        )

    monkeypatch.setattr(httpx, "get", get)
    result = client.post(
        "/api/import/github-preview", json={"url": "https://github.com/demo/example"}
    ).json()
    assert result["description"] == "Exact source description" and result[
        "languages"
    ] == ["Python", "TypeScript"]
    assert client.get("/api/profile").json()["items"] == []
