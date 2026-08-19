from sklearn.feature_extraction.text import TfidfVectorizer


def ranked_terms(sentences: list[str]) -> list[dict]:
    corpus = [s.strip() for s in sentences if s and s.strip()]
    if not corpus:
        return []
    vec = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=50)
    try:
        matrix = vec.fit_transform(corpus)
    except ValueError:
        return []
    scores = matrix.mean(axis=0).A1
    names = vec.get_feature_names_out()
    ranked = sorted(zip(names, scores), key=lambda item: item[1], reverse=True)
    return [
        {"term": term, "score": round(float(score), 4)}
        for term, score in ranked
        if score > 0
    ]
