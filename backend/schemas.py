from pydantic import BaseModel
from typing import Optional


class ComponentBase(BaseModel):
    name: str
    version: str
    owner: str
    license: str
    risk_level: str
    review_status: str
    last_updated: str
    notes: Optional[str] = None


class ComponentCreate(ComponentBase):
    pass


class ComponentUpdate(ComponentBase):
    pass


class ComponentResponse(ComponentBase):
    id: int

    class Config:
        from_attributes = True