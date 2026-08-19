import re

from fastapi import HTTPException

from app.nlp import ner, pos, sentiment, tokenize

MAX_TEXT_LEN = 10_000
_URL = re.compile(r"https?://\S+", re.IGNORECASE)


def prepare_text(text: str) -> str:
    cleaned = _URL.sub(" ", text)
    return re.sub(r"\s+", " ", cleaned).strip()


def require_text(text: str) -> str:
    prepared = prepare_text(text)
    if not prepared:
        raise HTTPException(status_code=400, detail="text must not be empty")
    if len(prepared) > MAX_TEXT_LEN:
        prepared = prepared[:MAX_TEXT_LEN]
    return prepared


def parse_doc(nlp, text: str):
    prepared = require_text(text)
    return prepared, nlp(prepared)


def tokenize_result(nlp, text: str) -> dict:
    _, doc = parse_doc(nlp, text)
    return {
        "tokens": tokenize.tokens(doc),
        "sentences": tokenize.sentences(doc),
    }


def pos_result(nlp, text: str) -> dict:
    _, doc = parse_doc(nlp, text)
    return {"pos": pos.pos_tags(doc)}


def ner_result(nlp, text: str) -> dict:
    _, doc = parse_doc(nlp, text)
    return {"entities": ner.entities(doc)}


def sentiment_result(text: str) -> dict:
    prepared = require_text(text)
    return {"sentiment": sentiment.analyze(prepared)}


def run_core(nlp, text: str) -> dict:
    prepared, doc = parse_doc(nlp, text)
    return {
        "tokens": tokenize.tokens(doc),
        "sentences": tokenize.sentences(doc),
        "pos": pos.pos_tags(doc),
        "entities": ner.entities(doc),
        "sentiment": sentiment.analyze(prepared),
    }
