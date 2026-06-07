import io
import os
import uuid

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TextModel

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


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
    pdf_path = None

    if file and file.filename:
        raw = await file.read()
        if file.filename.lower().endswith(".pdf"):
            filename = f"{uuid.uuid4().hex}.pdf"
            filepath = os.path.join(UPLOAD_DIR, filename)
            with open(filepath, "wb") as f:
                f.write(raw)
            pdf_path = filename

            reader = PdfReader(io.BytesIO(raw))
            content = "\n\n".join(page.extract_text() or "" for page in reader.pages)
        else:
            content = raw.decode("utf-8")

    text = TextModel(title=title, content=content, pdf_path=pdf_path)
    db.add(text)
    db.commit()
    return RedirectResponse("/library", status_code=303)


@router.post("/library/delete/{text_id}")
def delete_text(text_id: int, db: Session = Depends(get_db)):
    text = db.query(TextModel).filter(TextModel.id == text_id).first()
    if text:
        if text.pdf_path:
            path = os.path.join(UPLOAD_DIR, text.pdf_path)
            if os.path.isfile(path):
                os.remove(path)
        db.delete(text)
        db.commit()
    return RedirectResponse("/library", status_code=303)
