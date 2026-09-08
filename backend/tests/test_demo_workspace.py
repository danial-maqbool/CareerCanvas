def test_complete_demo_workspace(client):
    response=client.post('/api/demo/workspace');assert response.status_code==201,response.text
    assert response.json()['resumes']==4
    assert len(client.get('/api/applications').json())==12
    assert len(client.get('/api/career/interviews').json())==3
    assert len(client.get('/api/career/stories').json())==1
    resumes=client.get('/api/resumes').json();assert len({r['document']['template'] for r in resumes})==4
    assert any(len(client.get('/api/resumes/'+r['id']+'/versions').json())==2 for r in resumes)
    analytics=client.get('/api/analytics').json();assert analytics['sent']==10 and analytics['offers']==2
    assert client.post('/api/demo/workspace').status_code==409
    backup=client.get('/api/workspace/backup').json();assert client.post('/api/workspace/restore/preview',json=backup).status_code==200
