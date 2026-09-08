from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from .config import ROOT, Settings
from .database import build_engine, session_factory


def create_app(settings: Settings | None = None):
    settings = settings or Settings()
    engine = build_engine(settings.database_url)

    @asynccontextmanager
    async def lifespan(app):
        yield
        engine.dispose()

    app = FastAPI(title='CareerCanvas', version='0.1.0', lifespan=lifespan)
    app.state.settings = settings
    app.state.engine = engine
    app.state.sessions = session_factory(engine)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=['127.0.0.1', 'localhost', 'testserver'])

    @app.middleware('http')
    async def local_origin(request: Request, call_next):
        origin = request.headers.get('origin')
        if request.method not in {'GET', 'HEAD', 'OPTIONS'} and origin:
            from urllib.parse import urlparse
            if urlparse(origin).netloc != request.headers.get('host'):
                from fastapi.responses import JSONResponse
                return JSONResponse({'detail': 'Cross-origin writes are disabled'}, status_code=403)
        response = await call_next(request)
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Referrer-Policy'] = 'no-referrer'
        return response

    @app.get('/api/health')
    def health():
        with engine.connect() as connection:
            connection.execute(text('SELECT 1'))
        return {'status': 'ok', 'storage': 'local', 'ai_enabled': settings.ai_enabled}

    from .profile import router as profile_router
    from .demo import router as demo_router
    app.include_router(profile_router)
    app.include_router(demo_router)
    from .resumes import router as resume_router
    app.include_router(resume_router)
    from .exports import router as export_router
    app.include_router(export_router)
    from .versions import router as version_router
    app.include_router(version_router)

    dist = ROOT / 'frontend/dist'
    if (dist / 'assets').exists():
        app.mount('/assets', StaticFiles(directory=dist / 'assets'), name='assets')

    @app.get('/{path:path}', include_in_schema=False)
    def frontend(path: str):
        if path.startswith('api/') or not (dist / 'index.html').exists():
            raise HTTPException(404, 'Build the frontend with npm run build in frontend/')
        return FileResponse(dist / 'index.html')

    return app
