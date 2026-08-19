# Classical NLP Studio

Text analysis platform: paste text, run a classical NLP pipeline (tokenize, POS, NER, sentiment, TF-IDF, keywords), and optionally save results to MongoDB.

## Stack

- **Frontend:** Next.js
- **Backend:** FastAPI
- **NLP:** spaCy, NLTK (VADER), scikit-learn
- **DB:** MongoDB (optional history)

## Run the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/health`
