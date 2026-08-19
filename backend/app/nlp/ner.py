def entities(doc) -> list[dict]:
    return [
        {
            "text": e.text,
            "label": e.label_,
            "start": e.start_char,
            "end": e.end_char,
        }
        for e in doc.ents
    ]
