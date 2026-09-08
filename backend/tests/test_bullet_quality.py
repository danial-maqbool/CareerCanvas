from backend.app.bullet_quality import assess_bullet

def test_weak_and_evidence_based_bullets():
    weak=assess_bullet('Worked on API development.')
    strong=assess_bullet('Developed 14 REST endpoints used by three internal services.')
    assert weak['score']==0
    assert strong['score']==100
    assert not assess_bullet('Built a reliable document parser for the research team.')['checks'][3]['passed']
