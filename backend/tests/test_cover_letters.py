from io import BytesIO
from docx import Document
from pypdf import PdfReader

def test_letter_independence_versions_exports(client):
    r=client.post('/api/cover-letters',json={'name':'Cedar introduction','document':{'header':'Alex Morgan','opening':'I build reliable evaluation tools.','experience':'Developed 14 REST endpoints.'}})
    assert r.status_code==201
    original=r.json();id=original['id']
    assert client.post(f'/api/cover-letters/{id}/versions',json={'note':'First draft'}).status_code==201
    copy=client.post(f'/api/cover-letters/{id}/duplicate').json()
    payload={k:v for k,v in copy.items() if k not in ['id','updated_at']};payload['document']['opening']='A different letter.'
    assert client.put('/api/cover-letters/'+copy['id'],json=payload).status_code==200
    assert client.get(f'/api/cover-letters/{id}/versions').json()[0]['snapshot']['document']['opening']==original['document']['opening']
    docx=Document(BytesIO(client.post(f'/api/cover-letters/{id}/export/docx').content))
    assert 'Developed 14 REST endpoints.' in '\n'.join(p.text for p in docx.paragraphs)
    pdf=PdfReader(BytesIO(client.post(f'/api/cover-letters/{id}/export/pdf').content))
    assert 'Alex Morgan' in pdf.pages[0].extract_text()
    assert len(pdf.pages)==1
