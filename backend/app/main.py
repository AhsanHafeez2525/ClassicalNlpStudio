from contextlib import asynccontextmanager
from functools import lru_cache

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    nlp = get_nlp()
    app.state.nlp = nlp
    yield


app = FastAPI(title="Classical NLP Studio", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
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
