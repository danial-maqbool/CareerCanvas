from backend.tests.test_resumes import make_resume, update_payload


def test_version_compare_and_nondestructive_restore(client):
    resume=make_resume(client);path=f'/api/resumes/{resume["id"]}'
    v1=client.post(path+'/versions',json={'revision':resume['revision'],'note':'Initial'}).json()
    payload=update_payload(resume);payload['document']['personal']['summary']='A shorter factual summary.'
    updated=client.put(path,json=payload).json()
    v2=client.post(path+'/versions',json={'revision':updated['revision'],'note':'Shortened summary'}).json()
    diff=client.get(path+'/versions/compare',params={'before':v1['id'],'after':v2['id']}).json()
    assert diff['counts']['Modified']==1
    assert diff['changes'][0]['path'].endswith('summary')
    restored=client.post(path+f'/versions/{v1["id"]}/restore',json={'revision':updated['revision']})
    assert restored.status_code==200
    assert restored.json()['document']==v1['snapshot']['document']
    versions=client.get(path+'/versions').json()
    assert len(versions)==3
    assert versions[0]['snapshot']==v2['snapshot']
    assert versions[1]==v2
    assert versions[2]==v1
