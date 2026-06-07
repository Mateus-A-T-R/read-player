from fastapi import APIRouter, Request, Depends, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Book

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/", response_class=HTMLResponse)
def index(request: Request, db: Session = Depends(get_db)):
    books = db.query(Book).all()
    return templates.TemplateResponse(request, "index.html", {"books": books})


@router.get("/library", response_class=HTMLResponse)
def library(request: Request, db: Session = Depends(get_db)):
    books = db.query(Book).all()
    return templates.TemplateResponse(request, "library.html", {"books": books})


@router.post("/library/add")
def add_book(
    title: str = Form(...),
    author: str = Form(""),
    language: str = Form("en"),
    content: str = Form(...),
    db: Session = Depends(get_db),
):
    book = Book(title=title, author=author, language=language, content=content)
    db.add(book)
    db.commit()
    return RedirectResponse("/library", status_code=303)


@router.post("/library/delete/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if book:
        db.delete(book)
        db.commit()
    return RedirectResponse("/library", status_code=303)
