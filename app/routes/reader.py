from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Book, VocabularyEntry
from app.translator import translate

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/reader/{book_id}", response_class=HTMLResponse)
def reader(book_id: int, request: Request, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    return templates.TemplateResponse("reader.html", {"request": request, "book": book})


@router.post("/reader/translate")
def translate_word(payload: dict, db: Session = Depends(get_db)):
    word = payload.get("word", "")
    book_id = payload.get("book_id")
    context = payload.get("context", "")
    translation = translate(word)

    entry = VocabularyEntry(word=word, translation=translation, context=context, book_id=book_id)
    db.add(entry)
    db.commit()

    return JSONResponse({"word": word, "translation": translation})
