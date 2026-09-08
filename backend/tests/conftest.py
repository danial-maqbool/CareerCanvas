import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient

from backend.app.config import ROOT, Settings
from backend.app.main import create_app


@pytest.fixture
def client(tmp_path):
    url = f'sqlite:///{tmp_path / "workspace.db"}'
    config = Config(str(ROOT / 'alembic.ini'))
    config.attributes['database_url'] = url
    command.upgrade(config, 'head')
    with TestClient(create_app(Settings(database_url=url))) as instance:
        yield instance
