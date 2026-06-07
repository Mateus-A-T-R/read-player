from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.database import Base


class TextModel(Base):
    __tablename__ = "texts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    pdf_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Vocabulary(Base):
    __tablename__ = "vocabulary"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(255), nullable=False, unique=True, index=True)
    translation = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="new")
    click_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
