def test_backup_roundtrip_and_rejection(client):
    client.post('/api/demo/profile')
    profile=client.get('/api/profile').json()
    resume=client.post('/api/resumes',json={'name':'Backup resume','selected_ids':[i['id'] for i in profile['items']]}).json()
    client.post('/api/applications',json={'company':'Backup Cedar','role':'Engineer','resume_id':resume['id']})
    backup=client.get('/api/workspace/backup').json()
    assert backup['format']=='CareerCanvas Backup' and 'api_key' not in str(backup).lower()
    assert client.post('/api/workspace/restore/preview',json=backup).status_code==200
    assert client.post('/api/workspace/restore',json={'backup':backup}).status_code==422
    client.post('/api/career/goals',json={'title':'Temporary test goal'})
    restored=client.post('/api/workspace/restore',json={'backup':backup,'approved':True})
    assert restored.status_code==200,restored.text
    assert client.get('/api/career/goals').json()==[]
    assert client.get('/api/resumes').json()[0]['document']==resume['document']
    assert client.get('/api/applications').json()[0]['resume_id']==resume['id']
    import copy
    bad=copy.deepcopy(backup);bad['tables']['job_applications'][0]['resume_id']='missing'
    assert client.post('/api/workspace/restore',json={'backup':bad,'approved':True}).status_code==422
    assert len(client.get('/api/applications').json())==1
    export=client.get('/api/resumes/'+resume['id']+'/export/json').json()
    imported=client.post('/api/workspace/import-resume',json=export)
    assert imported.status_code==201 and imported.json()['id']!=resume['id']
    assert imported.json()['document']==resume['document']

def test_tags_delete_keeps_records_and_preferences(client):
    tag=client.post('/api/tags',json={'name':'Remote'}).json()
    client.post('/api/applications',json={'company':'Keep me','role':'Engineer','data':{'tags':['Remote']}})
    assert client.put('/api/tags/'+tag['id'],json={'name':'Flexible','color':'#123456'}).status_code==200
    assert client.get('/api/applications').json()[0]['data']['tags']==['Flexible']
    client.delete('/api/tags/'+tag['id'])
    assert client.get('/api/applications').json()[0]['company']=='Keep me'
    assert client.get('/api/applications').json()[0]['data']['tags']==[]
    p=client.get('/api/preferences').json();p['theme']='Dark';p['widgets'].reverse();p['widgets'][0]['visible']=False
    assert client.put('/api/preferences',json=p).status_code==200
    assert client.get('/api/preferences').json()==p
