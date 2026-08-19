from contextlib import asynccontextmanager
from functools import lru_cache

import spacy
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

SPACY_MODEL = "en_core_web_sm"


@lru_cache(maxsize=1)
def get_nlp():
    return spacy.load(SPACY_MODEL)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    get_nlp()
    yield


app = FastAPI(title="Classical NLP Studio", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TokenizeIn(BaseModel):
    text: str = Field(..., min_length=1)


@app.get("/health")
def health():
    nlp = get_nlp()
    return {
        "status": "ok",
        "spacy_loaded": nlp is not None,
        "model": SPACY_MODEL,
    }


@app.post("/tokenize")
def tokenize(body: TokenizeIn):
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text must not be empty")
    doc = get_nlp()(text)
    return {
        "tokens": [t.text for t in doc if not t.is_space],
        "sentences": [s.text for s in doc.sents],
    }
