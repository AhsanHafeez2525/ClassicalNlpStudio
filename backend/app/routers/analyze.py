from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.nlp.pipeline import run_analyze

router = APIRouter()


class AnalyzeIn(BaseModel):
    text: str
    save: bool = False


@router.post("/analyze")
def analyze(body: AnalyzeIn, request: Request):
    _ = body.save
    return run_analyze(request.app.state.nlp, body.text)
