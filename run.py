"""Migrate the local database and serve the built application."""
import sys
from pathlib import Path


def main():
    if sys.version_info < (3, 11):
        raise SystemExit('CareerCanvas requires Python 3.11+. On Windows use .venv\\Scripts\\python.exe run.py')
    from alembic import command
    from alembic.config import Config
    import uvicorn
    from backend.app.config import ROOT, Settings
    from backend.app.main import create_app

    if not (ROOT / 'frontend/dist/index.html').exists():
        raise SystemExit('Frontend not built. Run npm install and npm run build inside frontend/.')
    command.upgrade(Config(str(ROOT / 'alembic.ini')), 'head')
    settings = Settings()
    uvicorn.run(create_app(settings), host=settings.host, port=settings.port)


if __name__ == '__main__':
    main()
