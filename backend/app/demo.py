"""Explicitly fictional career data. Loading never replaces an existing profile."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .dependencies import session
from .models import AuditEvent
from .profile import get_profile
from .profile_models import CareerItem
from .profile_schemas import ItemInput, PersonalDetails

router = APIRouter(prefix="/api/demo", tags=["Fictional demo"])

PERSONAL = {
    "full_name": "Alex Morgan",
    "professional_title": "AI & Software Engineer",
    "email": "alex.morgan@example.com",
    "phone": "+1 202 555 0147",
    "city": "Austin",
    "country": "United States",
    "github": "https://github.com",
    "portfolio": "https://example.com/alex",
    "linkedin": "https://www.linkedin.com",
    "summary": "Software engineer building thoughtful AI products and dependable developer tools. Experienced in retrieval systems, Python services, and accessible React interfaces. I turn complex technical problems into clear, useful experiences.",
}

ITEMS = [
    {
        "kind": "experience",
        "data": {
            "company": "Northstar Labs (fictional)",
            "position": "AI Software Engineer",
            "location": "Austin · Hybrid",
            "start_date": "2023-06",
            "current": True,
            "description": "Building practical AI systems with a small, cross-functional product team.",
            "technologies": ["Python", "FastAPI", "React", "Docker"],
            "bullets": [
                {
                    "text": "Built a retrieval evaluation pipeline covering 1,200 test queries, improving answer relevance by 24%."
                },
                {
                    "text": "Developed 14 REST endpoints used by three internal services, with automated contract tests."
                },
                {
                    "text": "Reduced document processing time by 35% through parallel OCR workers and resilient task queues."
                },
            ],
        },
    },
    {
        "kind": "experience",
        "data": {
            "company": "Fieldwork Studio (fictional)",
            "position": "Software Engineer",
            "location": "Remote",
            "start_date": "2021-08",
            "end_date": "2023-05",
            "technologies": ["TypeScript", "React", "PostgreSQL"],
            "bullets": [
                {
                    "text": "Delivered an accessible analytics workspace for 200 internal users using React and TypeScript."
                },
                {
                    "text": "Improved API response time by 40% by profiling SQL queries and introducing targeted indexes."
                },
            ],
        },
    },
    {
        "kind": "education",
        "data": {
            "institution": "Lakeview Institute of Technology (fictional)",
            "degree": "M.S.",
            "field": "Computer Science",
            "start_date": "2021",
            "end_date": "2023",
            "gpa": "3.8 / 4.0",
            "courses": [
                "Machine Learning",
                "Information Retrieval",
                "Distributed Systems",
            ],
        },
    },
    {
        "kind": "education",
        "data": {
            "institution": "Westbridge University (fictional)",
            "degree": "B.S.",
            "field": "Software Engineering",
            "start_date": "2017",
            "end_date": "2021",
        },
    },
    {
        "kind": "projects",
        "data": {
            "name": "Signal — Retrieval Evaluation",
            "role": "Creator & Engineer",
            "description": "A reproducible evaluation workbench for retrieval-augmented generation systems.",
            "url": "https://example.com/signal",
            "github": "https://github.com",
            "technologies": ["Python", "RAG", "PyTorch"],
            "bullets": [
                {
                    "text": "Designed a benchmark suite comparing six retrieval strategies across 1,200 annotated queries."
                }
            ],
        },
    },
    {
        "kind": "projects",
        "data": {
            "name": "ClearNote — Document Intelligence",
            "role": "Full-stack Engineer",
            "description": "An accessible document workspace that pairs OCR extraction with transparent source references.",
            "url": "https://example.com/clearnote",
            "technologies": ["FastAPI", "React", "OCR"],
            "bullets": [
                {
                    "text": "Created a source-linked review flow that reduced manual document checking time by 30%."
                }
            ],
        },
    },
    {
        "kind": "projects",
        "data": {
            "name": "Trailhead — Developer Portal",
            "role": "Frontend Engineer",
            "description": "A searchable developer portal with live API documentation and keyboard-first navigation.",
            "technologies": ["TypeScript", "React", "SQL"],
        },
    },
    {
        "kind": "certifications",
        "data": {
            "name": "Applied Machine Learning Certificate",
            "issuer": "Lakeview Continuing Education (fictional)",
            "date": "2024-03",
            "credential_id": "DEMO-ML-2024",
        },
    },
    {
        "kind": "achievements",
        "data": {
            "statement": "Reduced document processing time by 35% through parallel OCR workers and resilient task queues.",
            "company": "Northstar Labs (fictional)",
            "skills": ["Python", "OCR"],
            "metric": "35% faster processing",
            "category": "Engineering impact",
            "tags": ["Performance", "Automation"],
        },
    },
    {
        "kind": "achievements",
        "data": {
            "statement": "Mentored four junior engineers through weekly code reviews and paired system design sessions.",
            "company": "Northstar Labs (fictional)",
            "skills": ["Mentoring"],
            "metric": "4 engineers",
            "category": "Leadership",
        },
    },
    {
        "kind": "publications",
        "data": {
            "title": "Evaluating Retrieval Quality in Small Knowledge Bases",
            "authors": "Alex Morgan, Riley Chen",
            "venue": "Lakeview Student Research Symposium (fictional)",
            "year": "2023",
            "description": "A student study of retrieval evaluation methods on synthetic document collections.",
        },
    },
    {"kind": "languages", "data": {"language": "English", "proficiency": "Native"}},
    {
        "kind": "portfolio",
        "data": {
            "title": "Signal — Retrieval Evaluation",
            "kind": "Project",
            "description": "A clear view into retrieval quality, from baseline to benchmark.",
            "skills": ["Python", "RAG", "PyTorch"],
            "url": "https://example.com/signal",
            "tags": ["AI", "Open source"],
        },
    },
    {
        "kind": "portfolio",
        "data": {
            "title": "ClearNote — Document Intelligence",
            "kind": "Demo",
            "description": "Human-reviewed document intelligence with source-linked extraction.",
            "skills": ["FastAPI", "React"],
            "url": "https://example.com/clearnote",
            "tags": ["Product", "Full stack"],
        },
    },
]
for name, category in [
    ("Python", "Programming"),
    ("TypeScript", "Programming"),
    ("SQL", "Databases"),
    ("React", "Frameworks"),
    ("FastAPI", "Frameworks"),
    ("PyTorch", "AI / ML"),
    ("RAG", "AI / ML"),
    ("Docker", "DevOps"),
    ("PostgreSQL", "Databases"),
    ("Git", "DevOps"),
    ("Information Retrieval", "AI / ML"),
    ("Mentoring", "Business"),
]:
    ITEMS.append(
        {
            "kind": "skills",
            "data": {"name": name, "category": category, "level": "Proficient"},
        }
    )


@router.post("/profile", status_code=201)
def load_demo(db: Session = Depends(session)):
    profile = get_profile(db)
    if any(
        value for key, value in profile.personal.items() if key != "hidden_fields"
    ) or db.scalar(
        select(CareerItem.id).where(CareerItem.profile_id == profile.id).limit(1)
    ):
        raise HTTPException(
            409,
            "Demo loading requires an empty profile. Existing career data was preserved.",
        )
    profile.personal = PersonalDetails(**PERSONAL).model_dump()
    for raw in ITEMS:
        item = ItemInput(**raw)
        db.add(CareerItem(profile_id=profile.id, kind=item.kind, data=item.data))
    db.add(AuditEvent(action="Fictional Demo Career Loaded", entity_id=profile.id))
    db.commit()
    return {"message": "Fictional demo career loaded", "items": len(ITEMS)}


@router.post("/workspace", status_code=201)
def load_demo_workspace(db: Session = Depends(session)):
    from copy import deepcopy
    from datetime import timedelta
    from .models import utcnow, identifier, Setting
    from .resume_models import Resume
    from .resume_schemas import ResumeDocument, ResumeSection, ResumeItem
    from .resumes import HEADINGS
    from .versions import capture
    from .applications import JobApplication, ApplicationHistory, JobData
    from .cover_letters import CoverLetter, CoverVersion, LetterDocument
    from .career_activity import (
        Interview,
        InterviewData,
        Contact,
        ContactData,
        Story,
        StoryData,
        Question,
        QuestionData,
        Goal,
        GoalData,
    )
    from .workspace_settings import Tag
    from .job_matching import DEMO_JOB

    profile = get_profile(db)
    if any(v for k, v in profile.personal.items() if k != "hidden_fields") or any(
        db.scalar(select(model.id).limit(1))
        for model in [
            CareerItem,
            Resume,
            JobApplication,
            CoverLetter,
            Interview,
            Contact,
            Story,
            Question,
            Goal,
            Tag,
        ]
    ):
        raise HTTPException(
            409,
            "Load Demo Career requires an empty workspace. Existing records were preserved. Use a separate database to explore the demo.",
        )
    profile.personal = PersonalDetails(**PERSONAL).model_dump()
    items = []
    for raw in ITEMS:
        typed = ItemInput(**raw)
        item = CareerItem(profile_id=profile.id, kind=typed.kind, data=typed.data)
        db.add(item)
        items.append(item)
    db.flush()
    now = utcnow()
    resumes = []
    versions = []
    variants = [
        (
            "AI Engineer — Focused",
            "AI Engineer",
            "Modern",
            {"experience", "education", "projects", "skills", "certifications"},
        ),
        (
            "Software Engineer — Product",
            "Software Engineer",
            "Developer",
            {"experience", "education", "projects", "skills"},
        ),
        (
            "Research CV — Retrieval Systems",
            "Research Engineer",
            "Academic",
            {
                "experience",
                "education",
                "projects",
                "skills",
                "publications",
                "certifications",
                "achievements",
            },
        ),
        (
            "General Resume — 2026",
            "Software Engineer",
            "Classic",
            {
                "experience",
                "education",
                "skills",
                "projects",
                "certifications",
                "languages",
            },
        ),
    ]
    for index, (name, role, template, kinds) in enumerate(variants):
        sections = []
        for kind, heading in HEADINGS.items():
            selected = [i for i in items if i.kind == kind and kind in kinds]
            if index == 0 and kind == "projects":
                selected = selected[:2]
            if index == 1 and kind == "skills":
                selected = [
                    i
                    for i in selected
                    if i.data["name"] not in ["PyTorch", "RAG", "Machine Learning"]
                ]
            sections.append(
                ResumeSection(
                    kind=kind,
                    heading=heading,
                    visible=bool(selected),
                    items=[
                        ResumeItem(source_id=i.id, kind=i.kind, data=deepcopy(i.data))
                        for i in selected
                    ],
                )
            )
        doc = ResumeDocument(
            personal=profile.personal, sections=sections, template=template
        )
        doc.style.font_size = 10.5
        doc.style.margin = 16
        doc.style.section_spacing = 12
        r = Resume(
            profile_id=profile.id,
            name=name,
            purpose="Academic CV" if index == 2 else "General Resume",
            target_role=role,
            document=doc.model_dump(),
            primary=index == 0,
            created_at=now - timedelta(days=30 - index * 3),
            updated_at=now - timedelta(days=index),
        )
        db.add(r)
        db.flush()
        resumes.append(r)
        v = capture(db, r, "Initial curated demo version")
        versions.append(v)
        if index == 0:
            document = deepcopy(r.document)
            document["personal"]["summary"] = (
                "AI software engineer building retrieval evaluation systems and dependable Python services. Experienced in RAG, FastAPI, and accessible product interfaces, with a focus on measurable improvements and clear technical communication."
            )
            r.document = document
            r.revision = 2
            capture(
                db,
                r,
                "Focused the introduction on retrieval evaluation and Python services",
            )
    letter = CoverLetter(
        name="Cedar Analytics — AI Engineer",
        resume_version_id=versions[0].id,
        document=LetterDocument(
            header="Alex Morgan\nalex.morgan@example.com · Austin, United States",
            opening="I am excited to apply for the AI Engineer role at Cedar Analytics. Your focus on dependable information products aligns with the systems I have built at Northstar Labs.",
            experience="At Northstar Labs, I built a retrieval evaluation pipeline covering 1,200 queries and developed 14 REST endpoints for three internal services. These projects taught me to pair careful measurement with a practical product mindset.",
            company_fit="I would bring experience with Python, FastAPI, retrieval evaluation, and accessible interfaces to your team. I am particularly interested in understanding how you evaluate grounded answers and improve the quality of your knowledge systems.",
            closing="Thank you for considering my application. I would welcome the opportunity to discuss my work and learn more about your team.\n\nSincerely,\nAlex Morgan",
            job_description=DEMO_JOB,
        ).model_dump(),
    )
    db.add(letter)
    db.flush()
    db.add(
        CoverVersion(
            cover_id=letter.id,
            note="Reviewed fictional demonstration letter",
            snapshot={"name": letter.name, "document": deepcopy(letter.document)},
        )
    )
    stages = [
        "Interview",
        "Applied",
        "Screening",
        "Offer",
        "Interested",
        "Technical Interview",
        "Applied",
        "Rejected",
        "Final Interview",
        "Accepted",
        "Withdrawn",
        "Interested",
    ]
    companies = [
        "Cedar Analytics",
        "Mosaic Systems",
        "Orbit Research",
        "Juniper Cloud",
        "Atlas Studio",
        "Aster AI",
        "Cobalt Software",
        "Maple Labs",
        "Riverbend Data",
        "Pinecone Studio",
        "Harbor Tools",
        "Lumen Research",
    ]
    jobs = []
    for index, (company, stage) in enumerate(zip(companies, stages)):
        day = now - timedelta(days=12 + index * 6)
        role = (
            "AI Engineer"
            if index % 3 == 0
            else "Software Engineer"
            if index % 3 == 1
            else "Research Engineer"
        )
        data = JobData(
            location=["Austin, TX", "Remote", "Boston, MA"][index % 3],
            work_type="Remote" if index % 2 else "Hybrid",
            url="https://example.com/careers",
            salary_range="$130k – $170k",
            source=["Company website", "Referral", "LinkedIn"][index % 3],
            tags=["Remote" if index % 2 else "Hybrid", "High Priority"]
            if index < 4
            else ["Research" if index % 3 == 2 else "Startup"],
            application_date=day.date().isoformat() if stage != "Interested" else "",
            job_description=DEMO_JOB,
            notes="Fictional opportunity for exploring the CareerCanvas workflow.",
            next_action=[
                "Send a thoughtful follow-up",
                "Review system design examples",
                "Share portfolio case study",
            ][index % 3]
            if index in [0, 1, 2]
            else "",
            deadline=(now + timedelta(days=index % 3 + 1)).date().isoformat()
            if index < 3
            else "",
        ).model_dump()
        j = JobApplication(
            company=company + " (fictional)",
            role=role,
            status=stage,
            data=data,
            resume_id=resumes[index % 3].id,
            resume_version_id=versions[index % 3].id,
            cover_letter_id=letter.id if index == 0 else None,
            created_at=day - timedelta(days=2),
            updated_at=now - timedelta(hours=index * 3),
        )
        db.add(j)
        db.flush()
        jobs.append(j)
        steps = ["Interested"]
        if stage != "Interested":
            steps += ["Applied"]
        if stage in [
            "Screening",
            "Interview",
            "Technical Interview",
            "Final Interview",
            "Offer",
            "Accepted",
        ]:
            steps += ["Screening"]
        if stage in [
            "Interview",
            "Technical Interview",
            "Final Interview",
            "Offer",
            "Accepted",
        ]:
            steps += ["Interview"]
        if stage not in steps:
            steps += [stage]
        for offset, s in enumerate(steps):
            db.add(
                ApplicationHistory(
                    application_id=j.id,
                    stage=s,
                    action="Job saved" if offset == 0 else "Moved to " + s,
                    created_at=day + timedelta(days=offset * 2 - 2),
                )
            )
    story = Story(
        title="Making document processing dependable",
        data=StoryData(
            situation="A document workflow was taking too long and failures were difficult to diagnose.",
            task="Improve processing throughput while making failures recoverable.",
            action="Built parallel OCR workers, introduced resilient queues, and measured processing time across representative documents.",
            result="Reduced document processing time by 35%.",
            skill_ids=[
                i.id
                for i in items
                if i.kind == "skills" and i.data["name"] in ["Python", "Docker"]
            ],
            experience_ids=[i.id for i in items if i.kind == "experience"][:1],
            achievement_ids=[i.id for i in items if i.kind == "achievements"][:1],
        ).model_dump(),
    )
    db.add(story)
    db.flush()
    questions = []
    for title, category, answer in [
        (
            "How would you evaluate a RAG system?",
            "AI / ML",
            "Discuss retrieval relevance, groundedness, test set quality, and failure analysis.",
        ),
        (
            "Tell me about a difficult technical tradeoff.",
            "Behavioral",
            "Use a real STAR example and explain the alternatives.",
        ),
        (
            "How do you design a reliable asynchronous pipeline?",
            "System Design",
            "Cover idempotency, retry policy, backpressure, observability, and recovery.",
        ),
    ]:
        q = Question(
            title=title,
            data=QuestionData(category=category, answer=answer).model_dump(),
        )
        db.add(q)
        questions.append(q)
    db.flush()
    for index, job in enumerate([jobs[0], jobs[5], jobs[8]]):
        data = InterviewData(
            company=job.company,
            role=job.role,
            round=["Technical conversation", "System design", "Team collaboration"][
                index
            ],
            date=(now + timedelta(days=index + 2)).date().isoformat(),
            time=["10:00", "14:30", "11:00"][index],
            interviewers="Jamie Chen · Engineering team (fictional)",
            location="https://example.com/interview",
            notes="Fictional interview. Review the job description and bring two clear examples of your work.",
            story_ids=[story.id],
            question_ids=[q.id for q in questions],
        ).model_dump()
        for task in data["checklist"][: 3 - index]:
            task["done"] = True
        db.add(
            Interview(
                title=job.company.replace(" (fictional)", "") + " · " + data["round"],
                application_id=job.id,
                data=data,
            )
        )
    db.add(
        Contact(
            title="Jamie Chen (fictional)",
            application_id=jobs[0].id,
            data=ContactData(
                company="Cedar Analytics (fictional)",
                role="Technical Recruiter",
                email="jamie.chen@example.com",
                relationship="Recruiter",
                last_contact=(now - timedelta(days=2)).date().isoformat(),
                notes="Fictional contact associated with the AI Engineer opportunity.",
            ).model_dump(),
        )
    )
    for title, days, milestones in [
        (
            "Land a thoughtful AI engineering role",
            60,
            [
                ("Refine focused resume", True),
                ("Publish two case studies", True),
                ("Submit 20 tailored applications", False),
                ("Prepare six STAR stories", False),
            ],
        ),
        (
            "Build a stronger public portfolio",
            45,
            [
                ("Ship retrieval evaluation demo", True),
                ("Write architecture walkthrough", False),
                ("Record a short product demo", False),
            ],
        ),
        (
            "Learn Kubernetes fundamentals",
            90,
            [
                ("Understand workloads and services", True),
                ("Deploy a practice application", False),
                ("Document operational lessons", False),
            ],
        ),
    ]:
        db.add(
            Goal(
                title=title,
                data=GoalData(
                    target_date=(now + timedelta(days=days)).date().isoformat(),
                    milestones=[
                        {"id": identifier(), "text": t, "done": done}
                        for t, done in milestones
                    ],
                    tags=["Career growth"],
                    notes="Fictional goal. Progress is calculated from the milestones below.",
                ).model_dump(),
            )
        )
    for name, color in [
        ("Remote", "#6c8e68"),
        ("Hybrid", "#7993a3"),
        ("High Priority", "#b18c50"),
        ("Research", "#8d82a6"),
        ("Startup", "#8b9c68"),
    ]:
        db.add(Tag(name=name, color=color))
    db.add(Setting(key="demo_workspace", value={"fictional": True}))
    db.add(AuditEvent(action="Fictional Demo Workspace Loaded", entity_id=profile.id))
    db.commit()
    return {
        "message": "Fictional demo workspace loaded",
        "profile_items": len(items),
        "resumes": len(resumes),
        "applications": len(jobs),
        "interviews": 3,
        "goals": 3,
        "cover_letters": 1,
        "contacts": 1,
        "stories": 1,
        "questions": 3,
    }
