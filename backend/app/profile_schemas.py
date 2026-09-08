from typing import Annotated, Literal
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class PersonalDetails(StrictModel):
    full_name: str = Field(default="", max_length=150)
    professional_title: str = Field(default="", max_length=150)
    email: str = Field(default="", max_length=254)
    phone: str = Field(default="", max_length=50)
    city: str = Field(default="", max_length=100)
    country: str = Field(default="", max_length=100)
    linkedin: str = Field(default="", max_length=500)
    github: str = Field(default="", max_length=500)
    portfolio: str = Field(default="", max_length=500)
    website: str = Field(default="", max_length=500)
    summary: str = Field(default="", max_length=10000)
    hidden_fields: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("linkedin", "github", "portfolio", "website")
    @classmethod
    def web_link(cls, value):
        if value and not value.startswith(("https://", "http://")):
            raise ValueError("Use a full http:// or https:// URL")
        return value


class Bullet(StrictModel):
    id: str = Field(default_factory=lambda: str(uuid4()), max_length=100)
    text: str = Field(min_length=1, max_length=3000)


class Experience(StrictModel):
    company: str = Field(min_length=1, max_length=200)
    position: str = Field(min_length=1, max_length=200)
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    current: bool = False
    description: str = Field(default="", max_length=10000)
    bullets: list[Bullet] = Field(default_factory=list, max_length=100)
    technologies: list[str] = Field(default_factory=list, max_length=100)


class Education(StrictModel):
    institution: str = Field(min_length=1, max_length=200)
    degree: str = Field(min_length=1, max_length=200)
    field: str = ""
    start_date: str = ""
    end_date: str = ""
    gpa: str = ""
    location: str = ""
    description: str = ""
    courses: list[str] = Field(default_factory=list)
    honors: list[str] = Field(default_factory=list)


class Skill(StrictModel):
    name: str = Field(min_length=1, max_length=100)
    category: str = Field(default="Other", min_length=1, max_length=100)
    level: Literal["Learning", "Working Knowledge", "Proficient", "Advanced", ""] = ""
    target_level: str = ""
    target_date: str = ""
    learning_notes: str = ""


class Project(StrictModel):
    name: str = Field(min_length=1, max_length=200)
    role: str = ""
    description: str = ""
    start_date: str = ""
    end_date: str = ""
    url: str = ""
    github: str = ""
    technologies: list[str] = Field(default_factory=list)
    bullets: list[Bullet] = Field(default_factory=list)


class Achievement(StrictModel):
    statement: str = Field(min_length=1, max_length=3000)
    company: str = ""
    project: str = ""
    skills: list[str] = Field(default_factory=list)
    metric: str = ""
    category: str = "Impact"
    tags: list[str] = Field(default_factory=list)


class Certification(StrictModel):
    name: str = Field(min_length=1, max_length=200)
    issuer: str = ""
    date: str = ""
    expiry: str = ""
    credential_id: str = ""
    credential_url: str = ""


class Publication(StrictModel):
    title: str = Field(min_length=1, max_length=500)
    authors: str = ""
    venue: str = ""
    year: str = ""
    doi: str = ""
    url: str = ""
    citation: str = ""
    description: str = ""


class Language(StrictModel):
    language: str = Field(min_length=1, max_length=100)
    proficiency: str = ""


class Reference(StrictModel):
    name: str = Field(min_length=1, max_length=200)
    company: str = ""
    role: str = ""
    email: str = ""
    phone: str = ""
    notes: str = ""


class PortfolioItem(StrictModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    kind: str = "Project"
    thumbnail: str = ""
    skills: list[str] = Field(default_factory=list)
    url: str = ""
    github: str = ""
    date: str = ""
    tags: list[str] = Field(default_factory=list)


KINDS = {
    "experience": Experience,
    "education": Education,
    "skills": Skill,
    "projects": Project,
    "achievements": Achievement,
    "certifications": Certification,
    "publications": Publication,
    "languages": Language,
    "references": Reference,
    "portfolio": PortfolioItem,
}
Kind = Literal[
    "experience",
    "education",
    "skills",
    "projects",
    "achievements",
    "certifications",
    "publications",
    "languages",
    "references",
    "portfolio",
]


class ItemInput(StrictModel):
    kind: Kind
    data: dict

    @model_validator(mode="after")
    def validate_data(self):
        self.data = KINDS[self.kind].model_validate(self.data).model_dump()
        return self
