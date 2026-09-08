def test_pipeline_history_and_conflict(client):
    response=client.post('/api/applications',json={'company':'Cedar','role':'AI Engineer'})
    assert response.status_code==201
    job=response.json();id=job['id']
    for stage in ['Applied','Interview','Offer']:
        response=client.patch(f'/api/applications/{id}/stage',json={'status':stage,'revision':job['revision']})
        assert response.status_code==200
        job=response.json()
    assert job['data']['application_date']
    assert [h['stage'] for h in client.get(f'/api/applications/{id}/history').json()]==['Interested','Applied','Interview','Offer']
    assert client.patch(f'/api/applications/{id}/stage',json={'status':'Rejected','revision':1}).status_code==409
    assert client.post('/api/applications',json={'company':'Bad link','role':'Role','resume_id':'missing'}).status_code==422
    assert client.delete(f'/api/applications/{id}').status_code==204
