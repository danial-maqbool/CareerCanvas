def test_observed_analytics_and_goals(client):
    jobs=[]
    for company in ['A','B','C']:
        jobs.append(client.post('/api/applications',json={'company':company,'role':'AI Engineer','data':{'source':'Referral'}}).json())
    a,b,c=jobs
    for job,stages in [(a,['Applied','Interview','Offer','Rejected']),(b,['Applied'])]:
        for stage in stages:job=client.patch('/api/applications/'+job['id']+'/stage',json={'status':stage,'revision':job['revision']}).json()
    data=client.get('/api/analytics').json()
    assert data['sent']==2 and data['responses']==1 and data['interviews']==1 and data['offers']==1
    assert data['response_rate']==50 and data['offer_rate']==50
    assert data['source']==[{'name':'Referral','value':2}]
    goal=client.post('/api/career/goals',json={'title':'Build a stronger portfolio','data':{'milestones':[{'text':'Ship a project','done':True},{'text':'Write case study','done':False}]}})
    assert goal.status_code==201
    assert len(client.get('/api/career/goals').json()[0]['data']['milestones'])==2
    assert client.post('/api/career/goals',json={'title':'Invalid','data':{'progress':101}}).status_code==422
