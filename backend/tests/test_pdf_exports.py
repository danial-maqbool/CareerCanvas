import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from io import BytesIO

import httpx
import pytest
from pypdf import PdfReader

from backend.app.config import ROOT
from backend.app.resume_schemas import TEMPLATES


@pytest.fixture(scope='module')
def live_export_server(tmp_path_factory):
    if not (ROOT/'frontend/dist/index.html').exists():
        pytest.skip('Build frontend before running browser export integration tests')
    directory=tmp_path_factory.mktemp('export-server')
    with socket.socket() as sock:
        sock.bind(('127.0.0.1',0))
        port=sock.getsockname()[1]
    env={**os.environ,'DATABASE_URL':f'sqlite:///{directory/"export.db"}','PORT':str(port),'AI_ENABLED':'false'}
    log=(directory/'server.log').open('w')
    process=subprocess.Popen([sys.executable,str(ROOT/'run.py')],cwd=ROOT,env=env,stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
    client=httpx.Client(base_url=f'http://127.0.0.1:{port}',timeout=90)
    try:
        for _ in range(100):
            try:
                if client.get('/api/health').status_code==200:break
            except httpx.HTTPError:pass
            time.sleep(.1)
        else:raise RuntimeError('Isolated export server did not start')
        assert client.post('/api/demo/profile').status_code==201
        yield client
    finally:
        client.close();process.terminate();process.wait(timeout=10);log.close()


@pytest.mark.parametrize('template',TEMPLATES)
def test_pdf_contains_text_sections_links_and_correct_pagination(live_export_server,template):
    client=live_export_server
    profile=client.get('/api/profile').json()
    resume=client.post('/api/resumes',json={'name':f'{template} PDF validation','template':template,'selected_ids':[i['id'] for i in profile['items'] if i['kind'] in ['experience','education','projects','skills','certifications']]}).json()
    response=client.post(f'/api/resumes/{resume["id"]}/export/pdf')
    assert response.status_code==200,response.text
    reader=PdfReader(BytesIO(response.content))
    text='\n'.join(page.extract_text() for page in reader.pages)
    for expected in ['Alex Morgan','alex.morgan@example.com','Northstar Labs','Lakeview','Python','Signal']:
        assert expected in text,(template,expected,text)
    assert len(reader.pages)==int(response.headers['X-CareerCanvas-Pages'])
    assert all(len(page.extract_text().strip())>40 for page in reader.pages)
    for page in reader.pages:
        assert abs(float(page.mediabox.width)-595.28)<2
        assert abs(float(page.mediabox.height)-841.89)<2
    uris=[str(annotation.get_object().get('/A',{}).get('/URI','')) for page in reader.pages for annotation in page.get('/Annots',[])]
    assert 'mailto:alex.morgan@example.com' in uris
    assert 'https://example.com/signal' in uris
    output=ROOT/'data/validation/pdf'
    output.mkdir(parents=True,exist_ok=True)
    (output/f'{template.lower().replace(" ","-")}.pdf').write_bytes(response.content)
