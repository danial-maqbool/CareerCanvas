from io import BytesIO
import json
from pathlib import Path
from threading import BoundedSemaphore
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from playwright.sync_api import sync_playwright
from sqlalchemy.orm import Session

from .dependencies import session
from .models import AuditEvent
from .resumes import require_resume

router = APIRouter(prefix='/api/resumes', tags=['Export'])
export_slots = BoundedSemaphore(2)


def render_pdf(url: str, page_size: str):
    with export_slots, sync_playwright() as playwright:
        try:
            browser = playwright.chromium.launch()
        except Exception:
            browser = playwright.chromium.launch(channel='chrome')
        try:
            page = browser.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            # Export never loads third-party assets, even if content contains links.
            from urllib.parse import urlparse
            origin = urlparse(url).netloc
            page.route('**/*', lambda route: route.continue_() if urlparse(route.request.url).netloc == origin else route.abort())
            page.goto(url, wait_until='networkidle', timeout=30000)
            page.locator('[data-pagination-ready="true"]').wait_for(timeout=30000)
            page.evaluate('document.fonts.ready')
            if errors:
                raise RuntimeError('Document rendering failed')
            expected_pages = int(page.locator('[data-page-count]').get_attribute('data-page-count'))
            content = page.pdf(format=page_size, print_background=True, prefer_css_page_size=True, margin={'top':'0','bottom':'0','left':'0','right':'0'}, tagged=True)
            return content, expected_pages
        finally:
            browser.close()


@router.post('/{resume_id}/export/pdf')
def export_pdf(resume_id: str, request: Request, db: Session = Depends(session)):
    resume = require_resume(db, resume_id)
    try:
        content, pages = render_pdf(f'http://127.0.0.1:{request.app.state.settings.port}/print/{resume.id}', resume.document['style']['page_size'])
    except Exception as error:
        raise HTTPException(503, 'PDF rendering failed. Install Chromium with python -m playwright install chromium, or install Google Chrome, and keep the local server running.') from error
    db.add(AuditEvent(action='PDF Exported', entity_id=resume.id))
    db.commit()
    return Response(content, media_type='application/pdf', headers={'Content-Disposition':f"attachment; filename*=UTF-8''{quote(resume.name, safe='')}.pdf",'X-CareerCanvas-Pages':str(pages),'Cache-Control':'no-store'})


@router.get('/{resume_id}/export/json')
def export_json(resume_id: str, db: Session = Depends(session)):
    resume = require_resume(db, resume_id)
    payload = {'format':'CareerCanvas Resume','version':1,'name':resume.name,'purpose':resume.purpose,'target_role':resume.target_role,'document':resume.document}
    return Response(json.dumps(payload, ensure_ascii=False, indent=2),media_type='application/json',headers={'Content-Disposition':f"attachment; filename*=UTF-8''{quote(resume.name, safe='')}.json",'Cache-Control':'no-store'})
