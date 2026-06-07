from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import VocabularyEntry

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/vocabulary", response_class=HTMLResponse)
def vocabulary(request: Request, db: Session = Depends(get_db)):
    entries = db.query(VocabularyEntry).order_by(VocabularyEntry.created_at.desc()).all()
    return templates.TemplateResponse("vocabulary.html", {"request": request, "entries": entries})


@router.post("/vocabulary/delete/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(VocabularyEntry).filter(VocabularyEntry.id == entry_id).first()
    if entry:
        db.delete(entry)
        db.commit()
    return RedirectResponse("/vocabulary", status_code=303)
