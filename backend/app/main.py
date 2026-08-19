import os
from contextlib import asynccontextmanager
from functools import lru_cache

import nltk
import spacy
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.nlp.pipeline import (
    ner_result,
    pos_result,
    sentiment_result,
    tokenize_result,
)
from app.routers import analyze as analyze_router

SPACY_MODEL = "en_core_web_sm"


@lru_cache(maxsize=1)
def get_nlp():
    return spacy.load(SPACY_MODEL)


def ensure_nltk() -> None:
    checks = (
        ("vader_lexicon", "sentiment/vader_lexicon.zip"),
        ("punkt", "tokenizers/punkt"),
        ("punkt_tab", "tokenizers/punkt_tab"),
    )
    for package, resource in checks:
        try:
            nltk.data.find(resource)
        except LookupError:
            nltk.download(package, quiet=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_nltk()
    nlp = get_nlp()
    app.state.nlp = nlp
    yield


app = FastAPI(title="Classical NLP Studio", lifespan=lifespan)

_frontend_origin = os.getenv("FRONTEND_ORIGIN", "").rstrip("/")
_allow_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]
if _frontend_origin:
    _allow_origins.append(_frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router.router)


class TextIn(BaseModel):
    text: str


@app.get("/health")
def health():
    nlp = get_nlp()
    return {
        "status": "ok",
        "spacy_loaded": nlp is not None,
        "model": SPACY_MODEL,
    }


@app.post("/tokenize")
def tokenize(body: TextIn):
    return tokenize_result(get_nlp(), body.text)


@app.post("/pos")
def pos_route(body: TextIn):
    return pos_result(get_nlp(), body.text)


@app.post("/ner")
def ner_route(body: TextIn):
    return ner_result(get_nlp(), body.text)


@app.post("/sentiment")
def sentiment_route(body: TextIn):
    return sentiment_result(body.text)
