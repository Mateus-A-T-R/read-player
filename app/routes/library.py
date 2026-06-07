import io

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TextModel

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/library", response_class=HTMLResponse)
def library(request: Request, db: Session = Depends(get_db)):
    texts = db.query(TextModel).order_by(TextModel.created_at.desc()).all()
    return templates.TemplateResponse(request, "library.html", {"texts": texts})


@router.post("/library/add")
async def add_text(
    title: str = Form(...),
    content: str = Form(""),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    if file and file.filename:
        raw = await file.read()
        if file.filename.lower().endswith(".pdf"):
            reader = PdfReader(io.BytesIO(raw))
            content = "\n\n".join(
                page.extract_text() or "" for page in reader.pages
            )
        else:
            content = raw.decode("utf-8")

    text = TextModel(title=title, content=content)
    db.add(text)
    db.commit()
    return RedirectResponse("/library", status_code=303)


@router.post("/library/delete/{text_id}")
def delete_text(text_id: int, db: Session = Depends(get_db)):
    text = db.query(TextModel).filter(TextModel.id == text_id).first()
    if text:
        db.delete(text)
        db.commit()
    return RedirectResponse("/library", status_code=303)
