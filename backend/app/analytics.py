from collections import Counter
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from .dependencies import session
from .applications import JobApplication, ApplicationHistory
from .resume_models import Resume
from .models import AuditEvent, iso

router = APIRouter(prefix="/api", tags=["Observed career analytics"])


@router.get("/analytics")
def analytics(db: Session = Depends(session)):
    jobs = db.scalars(select(JobApplication)).all()
    events = db.scalars(
        select(ApplicationHistory).order_by(ApplicationHistory.created_at)
    ).all()
    histories = {j.id: [] for j in jobs}
    for h in events:
        histories[h.application_id].append(h)

    def reached(j, stages):
        return j.status in stages or any(h.stage in stages for h in histories[j.id])

    interview_stages = {
        "Interview",
        "Technical Interview",
        "Final Interview",
        "Offer",
        "Accepted",
    }
    response_stages = interview_stages | {"Screening", "Rejected"}
    submitted = [
        j
        for j in jobs
        if j.data.get("application_date") or reached(j, {"Applied"} | response_stages)
    ]
    responses = [j for j in submitted if reached(j, response_stages)]
    interviews = [j for j in submitted if reached(j, interview_stages)]
    offers = [j for j in submitted if reached(j, {"Offer", "Accepted"})]
    durations = []
    for j in submitted:
        applied = next(
            (h.created_at for h in histories[j.id] if h.stage == "Applied"), None
        )
        if not applied and j.data.get("application_date"):
            try:
                applied = datetime.fromisoformat(j.data["application_date"])
            except ValueError:
                pass
        response = next(
            (h.created_at for h in histories[j.id] if h.stage in response_stages), None
        )
        if applied and response:
            days = (
                response.replace(tzinfo=None) - applied.replace(tzinfo=None)
            ).total_seconds() / 86400
            if days >= 0:
                durations.append(days)

    def grouped(field):
        return [
            {"name": name or "Unspecified", "value": count}
            for name, count in Counter(
                (j.role if field == "role" else j.data.get(field, ""))
                for j in submitted
            ).most_common()
        ]

    months = Counter(
        (j.data.get("application_date") or iso(j.created_at))[:7] for j in submitted
    )
    performance = []
    for r in db.scalars(select(Resume)):
        linked = [j for j in submitted if j.resume_id == r.id]
        if linked:
            performance.append(
                {
                    "id": r.id,
                    "name": r.name,
                    "applications": len(linked),
                    "responses": sum(j in responses for j in linked),
                    "interviews": sum(j in interviews for j in linked),
                    "offers": sum(j in offers for j in linked),
                }
            )
    n = len(submitted)
    return {
        "sent": n,
        "responses": len(responses),
        "interviews": len(interviews),
        "offers": len(offers),
        "response_rate": round(100 * len(responses) / n, 1) if n else 0,
        "interview_rate": round(100 * len(interviews) / n, 1) if n else 0,
        "offer_rate": round(100 * len(offers) / n, 1) if n else 0,
        "average_response_days": round(sum(durations) / len(durations), 1)
        if durations
        else None,
        "source": grouped("source"),
        "role": grouped("role"),
        "months": [{"name": m, "value": months[m]} for m in sorted(months)],
        "pipeline": [
            {"name": s, "value": sum(j.status == s for j in jobs)}
            for s in [
                "Interested",
                "Applied",
                "Screening",
                "Interview",
                "Technical Interview",
                "Final Interview",
                "Offer",
                "Accepted",
                "Rejected",
                "Withdrawn",
            ]
        ],
        "funnel": [
            {"name": "Saved", "value": len(jobs)},
            {"name": "Applied", "value": n},
            {"name": "Screening / response", "value": len(responses)},
            {"name": "Interview", "value": len(interviews)},
            {"name": "Offer", "value": len(offers)},
        ],
        "resume_performance": performance,
        "methodology": "Observed outcomes, not causation. Rates use submitted applications as denominator. A recorded screening, interview, offer, acceptance or rejection counts as a response. Earlier reached stages remain counted after later transitions. Response time uses the first recorded response after application; missing timestamps are excluded.",
    }


@router.get("/activity")
def activity(db: Session = Depends(session)):
    return [
        {
            "id": e.id,
            "action": e.action,
            "entity_id": e.entity_id,
            "created_at": iso(e.created_at),
        }
        for e in db.scalars(
            select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(50)
        )
    ]
