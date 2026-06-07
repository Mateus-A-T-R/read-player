from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.database import Base, engine
from app.routes import library, reader, vocabulary

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Read Player")

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(library.router)
app.include_router(reader.router)
app.include_router(vocabulary.router)
