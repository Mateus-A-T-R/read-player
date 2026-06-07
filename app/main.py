from fastapi import Depends, FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import TextModel, Vocabulary
from app.routes import library, reader, vocabulary

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Read Player")

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

app.include_router(library.router)
app.include_router(reader.router)
app.include_router(vocabulary.router)


@app.get("/", response_class=HTMLResponse)
def index(request: Request, db: Session = Depends(get_db)):
    total_texts = db.query(TextModel).count()
    total_words = db.query(Vocabulary).count()
    total_known = db.query(Vocabulary).filter(Vocabulary.status == "known").count()
    total_clicks = db.query(func.sum(Vocabulary.click_count)).scalar() or 0

    return templates.TemplateResponse(request, "index.html", {
        "total_texts": total_texts,
        "total_words": total_words,
        "total_known": total_known,
        "total_clicks": total_clicks,
    })
