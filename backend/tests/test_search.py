def test_global_search_categories(client):
    client.post('/api/applications',json={'company':'DistinctCedar','role':'Engineer'})
    client.post('/api/career/contacts',json={'title':'DistinctCedar contact'})
    client.post('/api/career/stories',json={'title':'DistinctCedar story'})
    client.post('/api/profile/items',json={'kind':'skills','data':{'name':'DistinctCedar skill'}})
    found=client.get('/api/search?q=DistinctCedar').json()
    assert {r['kind'] for r in found}=={'applications','contacts','stories','profile'}
    assert client.get('/api/search?q=').json()==[]
