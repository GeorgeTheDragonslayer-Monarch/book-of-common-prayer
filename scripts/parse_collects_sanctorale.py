#!/usr/bin/env python3
"""
Parse pages/Propers/PropTime.tex (the "Proper of Saints" - the
Sanctorale Mass propers) for the Collect of each fixed feast that has
its own full Mass propers in this edition, and key the result by the
same "M-D" date strings used in data/kalendar.json, so js/app.js's
collectOfDay placeholder can look a fixed-feast Collect up directly by
the resolved date.

Per this file's own header comment, only First and Second Class
Doubles (plus a few Prayer Book Holidays) get full propers here - most
of data/kalendar.json's 267 dates (Memorials, Simples, Semidoubles)
have no entry in this file at all and simply don't get a Sanctorale
Collect from this parser. That's expected, not a bug: this prototype
still has no ranking/precedence engine (see ROADMAP.md), so a
Sanctorale Collect is only ever offered as an option alongside the
Temporale one, never authoritatively chosen.

Each entry starts with a `\festival{Rank}{Date}{Name}{Color}` line,
followed later by `\feastday{ShortName}` and `\feastdate{Day}{Month}`.
This parser keys by \feastdate (Day, Month) rather than \festival's
Date string, since \feastdate is the more consistently machine-parsable
of the two, and matches the "D Month" shape already used elsewhere in
this pipeline (see calendar.js's literal-date fallback).

St. Matthias (24 February in common years, 25 in leap years, per the
old Roman "bissextile" reckoning - the source writes this as
\feastdate{24/25}{February}) is filed under 24 February only, matching
data/kalendar.json's existing (leap-year-unaware) convention.
"""
import json
import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[3] / "book-of-common-prayer-main" / "pages" / "Propers" / "PropTime.tex"
OUT = Path(__file__).resolve().parent.parent / "data" / "collects-sanctorale.json"

MONTHS = {
    "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
    "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12,
}


# Real continuations of a bare "O" drop-cap seen in this book's Collects
# (On, Out, Our, Of, Only, Other, Open...) - a short, closed set. Every
# other \lett{O}{lowercase-word} is the vocative interjection "O" (as in
# "O everlasting God", "O almighty God") and needs a space even though
# the word after it starts lowercase - see parse_collects_temporale.py's
# fix_lett_macro for the full explanation (this is the same fix, applied
# here too since PropTime.tex has the same \lett{O}{...} pattern).
O_CONTINUATION_FRAGMENTS = {"n", "ut", "ur", "f", "nly", "ther", "pen", "wn", "ver"}


def fix_lett_macro(s: str) -> str:
    def repl(m):
        first, rest = m.group(1), m.group(2)
        if first == "O" and rest[:1].islower():
            frag_match = re.match(r"^[a-zA-Z]+", rest)
            frag = frag_match.group(0) if frag_match else rest
            sep = "" if frag in O_CONTINUATION_FRAGMENTS else " "
        else:
            sep = " " if rest[:1].isupper() else ""
        return first + sep + rest
    return re.sub(r"\\lett\{([A-Za-z])\}\{([^}]*)\}", repl, s)


def clean_text(s: str) -> str:
    s = fix_lett_macro(s)
    s = s.replace("\\par", " ")
    s = s.replace("~", " ")
    s = re.sub(r"\\nth\{(\d+)\}", lambda m: m.group(1) + {"1": "st", "2": "nd", "3": "rd"}.get(m.group(1)[-1], "th"), s)
    s = re.sub(r"\\textit\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\emph\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\label\{[^}]*\}", "", s)
    s = re.sub(r"\\vr\{[^}]*\}", "", s)
    s = s.replace("\\&", "&")
    s = s.replace("\\ae", "\u00e6").replace("\\AE", "\u00c6")
    s = re.sub(r"\\[a-zA-Z]+", "", s)
    s = s.replace("{", "").replace("}", "")
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()


BOUNDARY_RE = re.compile(
    r"^\s*\\(begin\{rubric\}|readingcitation|introit|collect|secret|postcommunion|communion|offertory|gradall|feastday|feastdate|festival|clearpage)"
)


def _skip_non_content(lines, i, n):
    while i < n:
        line = lines[i].strip()
        if not line or line.startswith("%"):
            i += 1
            continue
        if re.match(r"^\\label\{[^}]*\}\s*$", line):
            i += 1
            continue
        if re.match(r"^\\(vspace|newcolumn)\{[^}]*\}\s*$", line):
            i += 1
            continue
        break
    return i


def _capture_paragraph(lines, i, n):
    if i >= n or "\\lett{" not in lines[i]:
        return None, i
    collected = []
    while i < n:
        line = lines[i]
        if BOUNDARY_RE.match(line):
            break
        stripped = line.strip()
        if not stripped:
            if collected:
                break
            i += 1
            continue
        if stripped.startswith("%"):
            i += 1
            continue
        # Strip a trailing (unescaped) "%..." LaTeX comment - seen once,
        # on the Transfiguration Collect, where an alternate/extended
        # ending was commented out mid-line rather than on its own line.
        stripped = re.sub(r"(?<!\\)%.*$", "", stripped).rstrip()
        if not stripped:
            i += 1
            continue
        collected.append(stripped)
        i += 1
    if not collected:
        return None, i
    text = clean_text(" ".join(collected))
    text = re.sub(r"\s+", " ", text).strip()
    return text, i


def extract_collect(lines, start_idx):
    """See parse_collects_temporale.py's extract_collect for the full
    explanation of the secondary-paragraph capture (used here for the
    mutual Sts. Peter & Paul commemorations on 25 January / 22 February).
    Returns (text, secondary_text_or_None, next_i)."""
    i = start_idx + 1
    n = len(lines)
    i = _skip_non_content(lines, i, n)
    text, i = _capture_paragraph(lines, i, n)
    if text is None:
        return None, None, i
    j = _skip_non_content(lines, i, n)
    secondary, j2 = _capture_paragraph(lines, j, n)
    if secondary is not None:
        i = j2
    return text, secondary, i


def main():
    lines = SRC.read_text(encoding="utf-8").split("\n")
    collects = {}  # "M-D" -> {"name": feastName, "text": collectText, "secondaryText": optional}

    cur_feastday = None
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]

        m_fd = re.match(r"^\\feastday\{([^}]*)\}", line)
        if m_fd:
            cur_feastday = m_fd.group(1).strip().replace("\\&", "&")
            i += 1
            continue

        m_date = re.match(r"^\\feastdate\{(\d+)(?:/\d+)?\}\{([A-Za-z]+)\}", line)
        if m_date:
            day = int(m_date.group(1))
            month = MONTHS.get(m_date.group(2))
            if month:
                date_key = f"{month}-{day}"
                # Scan forward from here for this entry's \collect (there
                # may be several other propers - introit etc - first).
                j = i + 1
                while j < n and not re.match(r"^\\collect\b", lines[j]) and not re.match(r"^\\feastdate\{", lines[j]):
                    j += 1
                if j < n and re.match(r"^\\collect\b", lines[j]):
                    text, secondary, _ = extract_collect(lines, j)
                    if text:
                        entry = {"name": cur_feastday, "text": text}
                        if secondary:
                            entry["secondaryText"] = secondary
                        collects[date_key] = entry
            i += 1
            continue

        i += 1

    n_secondary = sum(1 for e in collects.values() if "secondaryText" in e)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(collects, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(collects)} Sanctorale Collects to {OUT} ({n_secondary} with a secondary paragraph)")


if __name__ == "__main__":
    main()
