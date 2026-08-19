def tokens(doc) -> list[str]:
    return [t.text for t in doc if not t.is_space]


def sentences(doc) -> list[str]:
    return [s.text for s in doc.sents]
