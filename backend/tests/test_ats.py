from copy import deepcopy
from backend.app.ats import analyze_ats
from backend.tests.test_resumes import make_resume, update_payload

def test_good_and_missing_contact_scores(client):
    resume=make_resume(client);doc=resume['document']
    assert analyze_ats(doc,2)['score']==100
    missing=deepcopy(doc);missing['personal']['email']=''
    assert analyze_ats(missing,2)['score']==85
    hidden=deepcopy(doc);hidden['personal']['hidden_fields']=['email','phone']
    assert analyze_ats(hidden,2)['score']==80

def test_bad_columns_images_font_headings_and_pages(client):
    doc=make_resume(client)['document'];doc['template']='Two Column';doc['style']['font_size']=9;doc['sections'][0]['heading']='My Awesome Journey';doc['critical_content_in_images']=True
    result=analyze_ats(doc,4)
    assert result['score']==60
    assert {c['key'] for c in result['checks'] if not c['passed']}=={'columns','font','headings','images','pages'}

def test_analysis_is_invalidated_by_edits(client):
    r=make_resume(client);path=f'/api/resumes/{r["id"]}'
    assert client.post(path+'/ats',json={'page_count':2}).json()['score']==100
    assert client.get(path+'/ats').json()['score']==100
    payload=update_payload(r);payload['document']['personal']['email']=''
    client.put(path,json=payload)
    assert client.get(path+'/ats').json() is None
    assert client.delete(path).status_code==204
