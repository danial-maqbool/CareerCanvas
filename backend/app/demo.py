"""Explicitly fictional career data. Loading never replaces an existing profile."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .dependencies import session
from .models import AuditEvent
from .profile import get_profile
from .profile_models import CareerItem
from .profile_schemas import ItemInput, PersonalDetails

router = APIRouter(prefix='/api/demo', tags=['Fictional demo'])

PERSONAL = {
    'full_name': 'Alex Morgan', 'professional_title': 'AI & Software Engineer',
    'email': 'alex.morgan@example.com', 'phone': '+1 202 555 0147',
    'city': 'Austin', 'country': 'United States',
    'github': 'https://github.com', 'portfolio': 'https://example.com/alex',
    'linkedin': 'https://www.linkedin.com',
    'summary': 'Software engineer building thoughtful AI products and dependable developer tools. Experienced in retrieval systems, Python services, and accessible React interfaces. I turn complex technical problems into clear, useful experiences.',
}

ITEMS = [
    {'kind': 'experience', 'data': {'company': 'Northstar Labs (fictional)', 'position': 'AI Software Engineer', 'location': 'Austin · Hybrid', 'start_date': '2023-06', 'current': True, 'description': 'Building practical AI systems with a small, cross-functional product team.', 'technologies': ['Python', 'FastAPI', 'React', 'Docker'], 'bullets': [{'text': 'Built a retrieval evaluation pipeline covering 1,200 test queries, improving answer relevance by 24%.'}, {'text': 'Developed 14 REST endpoints used by three internal services, with automated contract tests.'}, {'text': 'Reduced document processing time by 35% through parallel OCR workers and resilient task queues.'}]}},
    {'kind': 'experience', 'data': {'company': 'Fieldwork Studio (fictional)', 'position': 'Software Engineer', 'location': 'Remote', 'start_date': '2021-08', 'end_date': '2023-05', 'technologies': ['TypeScript', 'React', 'PostgreSQL'], 'bullets': [{'text': 'Delivered an accessible analytics workspace for 200 internal users using React and TypeScript.'}, {'text': 'Improved API response time by 40% by profiling SQL queries and introducing targeted indexes.'}]}},
    {'kind': 'education', 'data': {'institution': 'Lakeview Institute of Technology (fictional)', 'degree': 'M.S.', 'field': 'Computer Science', 'start_date': '2021', 'end_date': '2023', 'gpa': '3.8 / 4.0', 'courses': ['Machine Learning', 'Information Retrieval', 'Distributed Systems']}},
    {'kind': 'education', 'data': {'institution': 'Westbridge University (fictional)', 'degree': 'B.S.', 'field': 'Software Engineering', 'start_date': '2017', 'end_date': '2021'}},
    {'kind': 'projects', 'data': {'name': 'Signal — Retrieval Evaluation', 'role': 'Creator & Engineer', 'description': 'A reproducible evaluation workbench for retrieval-augmented generation systems.', 'url': 'https://example.com/signal', 'github': 'https://github.com', 'technologies': ['Python', 'RAG', 'PyTorch'], 'bullets': [{'text': 'Designed a benchmark suite comparing six retrieval strategies across 1,200 annotated queries.'}]}},
    {'kind': 'projects', 'data': {'name': 'ClearNote — Document Intelligence', 'role': 'Full-stack Engineer', 'description': 'An accessible document workspace that pairs OCR extraction with transparent source references.', 'url': 'https://example.com/clearnote', 'technologies': ['FastAPI', 'React', 'OCR'], 'bullets': [{'text': 'Created a source-linked review flow that reduced manual document checking time by 30%.'}]}},
    {'kind': 'projects', 'data': {'name': 'Trailhead — Developer Portal', 'role': 'Frontend Engineer', 'description': 'A searchable developer portal with live API documentation and keyboard-first navigation.', 'technologies': ['TypeScript', 'React', 'SQL']}},
    {'kind': 'certifications', 'data': {'name': 'Applied Machine Learning Certificate', 'issuer': 'Lakeview Continuing Education (fictional)', 'date': '2024-03', 'credential_id': 'DEMO-ML-2024'}},
    {'kind': 'achievements', 'data': {'statement': 'Reduced document processing time by 35% through parallel OCR workers and resilient task queues.', 'company': 'Northstar Labs (fictional)', 'skills': ['Python', 'OCR'], 'metric': '35% faster processing', 'category': 'Engineering impact', 'tags': ['Performance', 'Automation']}},
    {'kind': 'achievements', 'data': {'statement': 'Mentored four junior engineers through weekly code reviews and paired system design sessions.', 'company': 'Northstar Labs (fictional)', 'skills': ['Mentoring'], 'metric': '4 engineers', 'category': 'Leadership'}},
    {'kind': 'publications', 'data': {'title': 'Evaluating Retrieval Quality in Small Knowledge Bases', 'authors': 'Alex Morgan, Riley Chen', 'venue': 'Lakeview Student Research Symposium (fictional)', 'year': '2023', 'description': 'A student study of retrieval evaluation methods on synthetic document collections.'}},
    {'kind': 'languages', 'data': {'language': 'English', 'proficiency': 'Native'}},
    {'kind': 'portfolio', 'data': {'title': 'Signal — Retrieval Evaluation', 'kind': 'Project', 'description': 'A clear view into retrieval quality, from baseline to benchmark.', 'skills': ['Python', 'RAG', 'PyTorch'], 'url': 'https://example.com/signal', 'tags': ['AI', 'Open source']}},
    {'kind': 'portfolio', 'data': {'title': 'ClearNote — Document Intelligence', 'kind': 'Demo', 'description': 'Human-reviewed document intelligence with source-linked extraction.', 'skills': ['FastAPI', 'React'], 'url': 'https://example.com/clearnote', 'tags': ['Product', 'Full stack']}},
]
for name, category in [('Python','Programming'),('TypeScript','Programming'),('SQL','Databases'),('React','Frameworks'),('FastAPI','Frameworks'),('PyTorch','AI / ML'),('RAG','AI / ML'),('Docker','DevOps'),('PostgreSQL','Databases'),('Git','DevOps'),('Information Retrieval','AI / ML'),('Mentoring','Business')]:
    ITEMS.append({'kind': 'skills', 'data': {'name': name, 'category': category, 'level': 'Proficient'}})


@router.post('/profile', status_code=201)
def load_demo(db: Session = Depends(session)):
    profile = get_profile(db)
    if any(value for key, value in profile.personal.items() if key != 'hidden_fields') or db.scalar(select(CareerItem.id).where(CareerItem.profile_id == profile.id).limit(1)):
        raise HTTPException(409, 'Demo loading requires an empty profile. Existing career data was preserved.')
    profile.personal = PersonalDetails(**PERSONAL).model_dump()
    for raw in ITEMS:
        item = ItemInput(**raw)
        db.add(CareerItem(profile_id=profile.id, kind=item.kind, data=item.data))
    db.add(AuditEvent(action='Fictional Demo Career Loaded', entity_id=profile.id))
    db.commit()
    return {'message': 'Fictional demo career loaded', 'items': len(ITEMS)}
