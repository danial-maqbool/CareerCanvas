from backend.app.ai_assistance import factual_flags


def test_factual_changes_are_flagged():
    flags = factual_flags(
        "Built Python services.",
        "Led 14 Python and Kubernetes services at Acme Labs as Senior Engineer with an MBA in 2026.",
    )
    assert {
        "Number or date",
        "Technology or skill",
        "Qualification",
        "Named entity or job title",
    } <= set(f["kind"] for f in flags)
    assert any(f["value"] == "Kubernetes" for f in flags)
    assert (
        factual_flags("Developed 14 REST endpoints.", "Built 14 REST endpoints.") == []
    )


def test_ai_disabled_does_not_call_external_provider(client, monkeypatch):
    def forbidden(*args, **kwargs):
        raise AssertionError("External request while disabled")

    monkeypatch.setattr("backend.app.ai_assistance.httpx.post", forbidden)
    assert (
        client.post(
            "/api/ai/suggest",
            json={"original": "Built Python services.", "action": "Make Shorter"},
        ).status_code
        == 409
    )
    assert client.get("/api/ai/status").json()["enabled"] is False


def test_gemini_requires_per_action_consent_and_returns_review(client, monkeypatch):
    client.app.state.settings.ai_enabled = True
    client.app.state.settings.gemini_api_key = "test-placeholder"
    client.app.state.settings.gemini_model = "configured-test-model"
    assert (
        client.post(
            "/api/ai/suggest",
            json={"original": "Built services.", "action": "Make Stronger"},
        ).status_code
        == 422
    )

    class Response:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "candidates": [
                    {"content": {"parts": [{"text": "Built 14 Kubernetes services."}]}}
                ]
            }

    captured = []
    monkeypatch.setattr(
        "backend.app.ai_assistance.httpx.post",
        lambda *a, **kw: captured.append(kw) or Response(),
    )
    result = client.post(
        "/api/ai/suggest",
        json={
            "original": "Built services.",
            "action": "Make Stronger",
            "consent_external": True,
        },
    ).json()
    assert result["requires_review"] is True
    assert result["flags"]
    assert captured[0]["json"]["contents"] == [{"parts": [{"text": "Built services."}]}]


def test_written_numbers_are_flagged():
    from backend.app.ai_assistance import factual_flags

    assert {"kind": "Written number", "value": "four"} in factual_flags(
        "Supported three teams.", "Supported four teams."
    )
