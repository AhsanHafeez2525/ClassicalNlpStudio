import re

_NOISE = re.compile(r"^[\d\W_]+$")
_KEEP_POS = {"NOUN", "PROPN", "NUM"}


def _display_term(term: str, doc) -> str:
    lowered = term.lower()
    for token in doc:
        if not token.is_space and token.text.lower() == lowered:
            return token.text
    return term


def extract(tfidf_rows: list[dict], doc, min_k: int = 8, max_k: int = 12) -> list[str]:
    keep = {
        token.text.lower()
        for token in doc
        if not token.is_space and token.pos_ in _KEEP_POS and any(ch.isalpha() for ch in token.text)
    }
    picked: list[str] = []
    seen: set[str] = set()

    def add(term: str) -> bool:
        label = _display_term(term, doc)
        key = label.lower()
        if key in seen:
            return False
        seen.add(key)
        picked.append(label)
        return True

    def usable(term: str) -> bool:
        if not term or _NOISE.match(term.replace(" ", "")):
            return False
        return any(ch.isalpha() for ch in term)

    def content_term(term: str) -> bool:
        parts = term.split()
        return bool(parts) and all(part in keep for part in parts)

    unigrams = [row["term"] for row in tfidf_rows if " " not in row["term"]]
    ngrams = [row["term"] for row in tfidf_rows if " " in row["term"]]

    for term in unigrams:
        if usable(term) and content_term(term):
            add(term)
        if len(picked) >= max_k:
            return picked

    for term in ngrams:
        if usable(term) and content_term(term):
            add(term)
        if len(picked) >= max_k:
            return picked

    if len(picked) < min_k:
        for term in unigrams + ngrams:
            if usable(term):
                add(term)
            if len(picked) >= min(min_k, max_k):
                break

    return picked[:max_k]
