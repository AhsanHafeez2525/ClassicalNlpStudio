from nltk.tokenize import word_tokenize


def tokens(doc) -> list[str]:
    return [t.text for t in doc if not t.is_space]


def sentences(doc) -> list[str]:
    return [s.text for s in doc.sents]


def nltk_tokens(text: str) -> list[str]:
    try:
        return word_tokenize(text)
    except LookupError:
        return []
