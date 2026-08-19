def pos_tags(doc) -> list[dict]:
    return [
        {"token": t.text, "pos": t.pos_, "tag": t.tag_}
        for t in doc
        if not t.is_space
    ]
