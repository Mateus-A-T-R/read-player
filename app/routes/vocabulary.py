from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Vocabulary

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


class WordPayload(BaseModel):
    word: str
    translation: str = ""


@router.get("/vocabulary", response_class=HTMLResponse)
def vocabulary(request: Request, db: Session = Depends(get_db)):
    entries = db.query(Vocabulary).order_by(Vocabulary.created_at.desc()).all()
    return templates.TemplateResponse(request, "vocabulary.html", {"entries": entries})


@router.post("/vocabulary/api/save")
def save_word(payload: WordPayload, db: Session = Depends(get_db)):
    entry = db.query(Vocabulary).filter(Vocabulary.word == payload.word.lower()).first()
    if entry:
        entry.click_count += 1
        entry.translation = payload.translation
    else:
        entry = Vocabulary(
            word=payload.word.lower(),
            translation=payload.translation,
            status="new",
            click_count=1,
        )
        db.add(entry)
    db.commit()
    return JSONResponse({"success": True})


@router.post("/vocabulary/api/known")
def mark_known(payload: WordPayload, db: Session = Depends(get_db)):
    entry = db.query(Vocabulary).filter(Vocabulary.word == payload.word.lower()).first()
    if entry:
        entry.status = "known"
        entry.translation = payload.translation
    else:
        entry = Vocabulary(
            word=payload.word.lower(),
            translation=payload.translation,
            status="known",
            click_count=1,
        )
        db.add(entry)
    db.commit()
    return JSONResponse({"success": True})


@router.post("/vocabulary/delete/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(Vocabulary).filter(Vocabulary.id == entry_id).first()
    if entry:
        db.delete(entry)
        db.commit()
    return RedirectResponse("/vocabulary", status_code=303)
