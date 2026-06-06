from sqlalchemy import Column, Integer, String, Text
from database import Base


class Component(Base):
    __tablename__ = "components"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    version = Column(String, nullable=False)
    owner = Column(String, nullable=False)
    license = Column(String, nullable=False)
    risk_level = Column(String, nullable=False)
    review_status = Column(String, nullable=False)
    last_updated = Column(String, nullable=False)
    notes = Column(Text, nullable=True)