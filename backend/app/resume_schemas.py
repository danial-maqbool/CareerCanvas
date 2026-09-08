from typing import Annotated, Literal
from uuid import uuid4

from pydantic import Field, StringConstraints, model_validator

from .profile_schemas import ItemInput, PersonalDetails, StrictModel

TEMPLATES = ['Classic','Modern','Minimal','Professional','Technical','Executive','Compact','Academic','Creative','Two Column','Developer','Research']
Template = Literal['Classic','Modern','Minimal','Professional','Technical','Executive','Compact','Academic','Creative','Two Column','Developer','Research']


class ResumeStyle(StrictModel):
    font: Literal['Arial','Calibri','Georgia','Times New Roman','Verdana','System Sans'] = 'Arial'
    font_size: float = Field(default=10.5, ge=9, le=16)
    line_height: float = Field(default=1.4, ge=1.1, le=2)
    margin: float = Field(default=16, ge=8, le=32)
    section_spacing: float = Field(default=14, ge=4, le=32)
    bullet_spacing: float = Field(default=4, ge=0, le=16)
    accent: str = Field(default='#245c4b', pattern=r'^#[0-9a-fA-F]{6}$')
    secondary: str = Field(default='#6b7e74', pattern=r'^#[0-9a-fA-F]{6}$')
    text: str = Field(default='#263832', pattern=r'^#[0-9a-fA-F]{6}$')
    page_size: Literal['A4','Letter'] = 'A4'
    alignment: Literal['left','center'] = 'left'
    heading_style: Literal['uppercase','title','small-caps'] = 'uppercase'
    date_style: Literal['original','short','long'] = 'short'


class ResumeItem(StrictModel):
    id: str = Field(default_factory=lambda: str(uuid4()), max_length=100)
    source_id: str | None = Field(default=None, max_length=100)
    kind: str = Field(max_length=30)
    data: dict

    @model_validator(mode='after')
    def validate_item(self):
        if self.kind == 'custom':
            if set(self.data) - {'title', 'description', 'bullets'}:
                raise ValueError('Unsupported custom item fields')
        else:
            self.data = ItemInput(kind=self.kind, data=self.data).data
        return self


class ResumeSection(StrictModel):
    id: str = Field(default_factory=lambda: str(uuid4()), max_length=100)
    kind: str = Field(max_length=30)
    heading: str = Field(min_length=1, max_length=100)
    visible: bool = True
    columns: int = Field(default=1, ge=1, le=3)
    separator: Annotated[str, StringConstraints(strip_whitespace=False, max_length=10)] = ' · '
    items: list[ResumeItem] = Field(default_factory=list, max_length=200)


class RichMark(StrictModel):
    type: Literal['bold', 'italic']


class RichNode(StrictModel):
    type: Literal['doc', 'paragraph', 'text', 'bulletList', 'orderedList', 'listItem', 'hardBreak']
    text: Annotated[str, StringConstraints(strip_whitespace=False, max_length=50000)] | None = None
    content: list['RichNode'] | None = None
    marks: list[RichMark] | None = None


class ResumeDocument(StrictModel):
    personal: PersonalDetails = Field(default_factory=PersonalDetails)
    sections: list[ResumeSection] = Field(default_factory=list, max_length=50)
    template: Template = 'Modern'
    style: ResumeStyle = Field(default_factory=ResumeStyle)
    summary_rich: RichNode | None = None

    @model_validator(mode='after')
    def unique_ids(self):
        ids = [s.id for s in self.sections]
        if len(ids) != len(set(ids)):
            raise ValueError('Section IDs must be unique')
        for section in self.sections:
            item_ids = [i.id for i in section.items]
            if len(item_ids) != len(set(item_ids)):
                raise ValueError('Item IDs must be unique within a section')
        return self


class CreateResume(StrictModel):
    name: str = Field(min_length=1, max_length=150)
    purpose: str = Field(default='General Resume', max_length=100)
    target_role: str = Field(default='', max_length=200)
    template: Template = 'Modern'
    selected_ids: list[str] = Field(default_factory=list, max_length=1000)


class UpdateResume(StrictModel):
    revision: int = Field(ge=1)
    name: str = Field(min_length=1, max_length=150)
    target_role: str = Field(default='', max_length=200)
    archived: bool = False
    document: ResumeDocument
