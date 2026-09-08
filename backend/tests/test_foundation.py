from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import inspect, text

from backend.app.config import ROOT, Settings
from backend.app.database import build_engine
from backend.app.main import create_app


def test_migration_is_repeatable_and_preserves_settings(tmp_path):
    url = f"sqlite:///{tmp_path / 'test.db'}"
    config = Config(str(ROOT / "alembic.ini"))
    config.attributes["database_url"] = url
    command.upgrade(config, "head")
    engine = build_engine(url)
    with engine.begin() as connection:
        connection.execute(
            text("INSERT INTO settings VALUES ('theme', '{\"mode\":\"dark\"}')")
        )
    command.upgrade(config, "head")
    assert {"settings", "audit_events"}.issubset(inspect(engine).get_table_names())
    with engine.connect() as connection:
        assert "dark" in connection.execute(text("SELECT value FROM settings")).scalar()
    engine.dispose()


def test_local_health_and_unknown_api(tmp_path):
    app = create_app(Settings(database_url=f"sqlite:///{tmp_path / 'health.db'}"))
    with TestClient(app) as client:
        assert client.get("/api/health").json() == {
            "status": "ok",
            "storage": "local",
            "ai_enabled": False,
        }
        assert client.get("/api/not-real").status_code == 404
        assert (
            client.post(
                "/api/test", headers={"origin": "https://example.com"}
            ).status_code
            == 403
        )
        assert (
            client.get("/api/health", headers={"host": "attacker.example"}).status_code
            == 400
        )
