from functools import lru_cache

from nltk.sentiment import SentimentIntensityAnalyzer


@lru_cache(maxsize=1)
def get_sia() -> SentimentIntensityAnalyzer:
    return SentimentIntensityAnalyzer()


def analyze(text: str) -> dict:
    scores = get_sia().polarity_scores(text)
    compound = scores["compound"]
    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"
    return {
        "label": label,
        "compound": compound,
        "pos": scores["pos"],
        "neu": scores["neu"],
        "neg": scores["neg"],
    }
