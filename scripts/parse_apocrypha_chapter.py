#!/usr/bin/env python3
"""
Parses one raw eng-kjv (ebible.org) chapter page (saved as plain text,
exactly as returned by the web_fetch tool) into {verse_num: verse_text}.

Expected raw-text shape (Haiola-generated ebible.org pages, converted to
markdown/plain-text by the fetch tool):

    - [BookName](...)
    - [<](...)
    - [N](...)
    - [>](...)

    <book title line - ONLY present on each book's chapter 1>

    <chapter number, alone on its own line>

    <verse text - all verses of the chapter run together in one
     paragraph, each verse's text immediately preceded by its bare
     verse number and a space, e.g. "1 In the first year ... 2 And it
     came to pass ...">

    - [BookName](...)
    ...
    (footer / copyright lines)

Strategy: find the line that is *exactly* the chapter number (as its own
line), take everything after it up to the next line starting with "- [",
and split that blob into verses by searching for each expected verse
number in sequence (1, 2, 3, ...) as a standalone token. This is a
plain-text-Bible-dump parsing pattern used earlier in this project for
data/kjv.json - same core idea, adapted to this book-per-page HTML dump
instead of a whole-book JSON file.
"""
import re
import sys


def parse_chapter_page(raw_text: str, chapter_num: int) -> dict:
    lines = raw_text.split("\n")
    start_idx = None
    for i, line in enumerate(lines):
        if line.strip() == str(chapter_num):
            start_idx = i
    if start_idx is None:
        raise ValueError(f"Could not find standalone chapter-number line '{chapter_num}'")

    body_lines = []
    for line in lines[start_idx + 1:]:
        stripped = line.strip()
        if stripped.startswith("- ["):
            break
        # Full-line editorial annotations, e.g. "[PLACED IN THE GREEK
        # AFTER CHAP. 4.17 OF THE HEBREW]" (seen in the Esther Greek
        # Additions) - not verse text, drop entirely.
        if re.match(r"^\[.*\]$", stripped):
            continue
        body_lines.append(line)
    blob = " ".join(l.strip() for l in body_lines if l.strip())
    blob = re.sub(r"\s+", " ", blob).strip()
    if not blob:
        raise ValueError("Empty verse blob after chapter heading")

    # Sequential verse-number split.
    verses = {}
    positions = []  # (verse_num, start_index_of_number_token)
    v = 1
    search_from = 0
    while True:
        # verse token: the number appears either at the very start of the
        # blob (verse 1) or preceded by whitespace, and is followed by
        # whitespace.
        pattern = re.compile(r"(?:(?<=^)|(?<=\s))" + str(v) + r"(?=\s)")
        m = pattern.search(blob, search_from)
        if not m:
            break
        positions.append((v, m.start(), m.end()))
        search_from = m.end()
        v += 1
        if v > 300:  # safety cap - no Apocrypha chapter is this long
            break

    if not positions:
        raise ValueError("No verse markers found at all")

    for idx, (vnum, tok_start, tok_end) in enumerate(positions):
        text_start = tok_end
        text_end = positions[idx + 1][1] if idx + 1 < len(positions) else len(blob)
        text = blob[text_start:text_end].strip()
        if text:
            verses[str(vnum)] = text

    return verses


if __name__ == "__main__":
    # CLI for spot-testing: parse_apocrypha_chapter.py <rawfile> <chapternum>
    path, chnum = sys.argv[1], int(sys.argv[2])
    raw = open(path, encoding="utf-8").read()
    result = parse_chapter_page(raw, chnum)
    print(f"Parsed {len(result)} verses")
    for k in sorted(result.keys(), key=int):
        print(k, ":", result[k][:80])
