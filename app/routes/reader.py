import os

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TextModel, Vocabulary
from app.translator import translate_word

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")


@router.get("/reader/api/translate")
def api_translate(word: str, db: Session = Depends(get_db)):
    translation = translate_word(word)

    entry = db.query(Vocabulary).filter(Vocabulary.word == word.lower()).first()
    if entry:
        entry.click_count += 1
        entry.translation = translation
    else:
        entry = Vocabulary(word=word.lower(), translation=translation, click_count=1)
        db.add(entry)
    db.commit()

    return JSONResponse({"word": word, "translation": translation})


@router.get("/uploads/{filename}")
def serve_upload(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404)
    return FileResponse(path, media_type="application/pdf")


@router.get("/reader/{text_id}", response_class=HTMLResponse)
def reader(text_id: int, request: Request, db: Session = Depends(get_db)):
    text = db.query(TextModel).filter(TextModel.id == text_id).first()
    if not text:
        raise HTTPException(status_code=404, detail="Texto não encontrado")
    template = "reader_pdf.html" if text.pdf_path else "reader.html"
    return templates.TemplateResponse(request, template, {"text": text})
