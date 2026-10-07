#!/usr/bin/env python3
"""
Parse pages/Front/Kalendar.tex (the fixed Sanctorale - one entry per
calendar date, independent of the year) into data/kalendar.json.

Output:
{
  "1-1": [{"name": "Circumcision of Our Lord,", "rank": "2nd Double", "redLetter": true, "note": "(Octave Day of Christmas)"}, ...],
  ...
  "12-31": [...]
}

Rows in the source longtable look like:
  1&{\color{RubricRed}Circumcision of Our Lord,} \textit{\nth{2} Double}\\
  &(Octave Day of Christmas)\\
A blank first cell continues the same calendar date with another
commemoration/note.
"""
import json
import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[3] / "book-of-common-prayer-main" / "pages" / "Front" / "Kalendar.tex"
OUT = Path(__file__).resolve().parent.parent / "data" / "kalendar.json"

MONTHS = {
    "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
    "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12,
}

MONTH_HEADER_RE = re.compile(r"\\textsc\{([A-Za-z]+)\}")
NTH_RE = re.compile(r"\\nth\{(\d+)\}")


def ordinal(n: int) -> str:
    n = int(n)
    if 10 <= n % 100 <= 20:
        suf = "th"
    else:
        suf = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suf}"


def clean_text(s: str) -> str:
    red_letter = "\\color{RubricRed}" in s
    s = re.sub(r"\\color\{[^}]*\}", "", s)
    s = NTH_RE.sub(lambda m: ordinal(m.group(1)), s)
    s = re.sub(r"\\textit\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\textsc\{([^}]*)\}", r"\1", s)
    s = s.replace("\\&", "&")
    s = s.replace("\\,", " ")
    s = re.sub(r"\\[a-zA-Z]+", "", s)
    s = s.replace("{", "").replace("}", "")
    s = re.sub(r"\s+", " ", s).strip()
    return s, red_letter


RANK_WORDS = [
    "1st Double", "2nd Double", "Greater Double", "Double", "Semidouble",
    "Memorial", "Simple", "Commemoration", "1st Vigil", "2nd Vigil", "Vigil",
]


def split_name_and_rank(cleaned: str):
    # Rank is usually the trailing clause after the last comma, matching a
    # known rank word - but some entries have extra trailing text after
    # the rank itself (e.g. "Christmas Day, 1st Double, 3rd Octave"), so
    # we look for the first rank word occurring anywhere (checked in order
    # from most to least specific, so "1st Double" wins over bare "Double"),
    # rather than requiring it to be the literal end of the string. Any
    # text after the matched rank (like ", 3rd Octave") is kept as part of
    # the name's trailing description rather than discarded.
    # A rank word can't be the very first thing in the string - some
    # entries (e.g. "Commemoration of St. Peter, Commemoration") use a
    # rank word as part of the descriptive name too, so a match at
    # position 0 is skipped in favor of the real (later) rank marker.
    best = None
    fallback = None
    for rank in RANK_WORDS:
        for m in re.finditer(r"\b" + re.escape(rank) + r"\b", cleaned):
            if m.start() == 0:
                if fallback is None or m.start() < fallback[0].start():
                    fallback = (m, rank)
                continue
            if best is None or m.start() < best[0].start():
                best = (m, rank)
    if best is None:
        best = fallback
    if best:
        m, rank = best
        name = cleaned[: m.start()].strip().rstrip(",").strip()
        trailing = cleaned[m.end():].strip().lstrip(",").strip()
        if trailing:
            name = f"{name} ({trailing})" if name else trailing
        return name, rank
    return cleaned.strip(), None


def main():
    lines = SRC.read_text(encoding="utf-8").split("\n")
    kalendar = {}

    cur_month = None
    cur_day = None

    row_re = re.compile(r"^([^&]*)&(.*?)\\\\\s*$")

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("%"):
            continue

        m_month = MONTH_HEADER_RE.search(line)
        if m_month and "SetCell" in line:
            name = m_month.group(1)
            if name in MONTHS:
                cur_month = MONTHS[name]
                cur_day = None
                continue

        m_row = row_re.match(line)
        if not m_row or cur_month is None:
            continue

        day_cell, entry_cell = m_row.group(1).strip(), m_row.group(2).strip()
        if day_cell:
            try:
                cur_day = int(day_cell)
            except ValueError:
                continue
        if cur_day is None:
            continue

        cleaned, red_letter = clean_text(entry_cell)
        if not cleaned:
            continue

        key = f"{cur_month}-{cur_day}"
        kalendar.setdefault(key, [])

        if cleaned.startswith("(") and cleaned.endswith(")"):
            # A parenthetical note (e.g. "(Octave Day of Christmas)",
            # "(Earliest Date of Septuagesima)") - attach to the previous
            # entry for this date if one exists, else store as a bare note.
            if kalendar[key]:
                kalendar[key][-1]["note"] = cleaned
            else:
                kalendar[key].append({"name": None, "rank": None, "redLetter": False, "note": cleaned})
            continue

        name, rank = split_name_and_rank(cleaned)
        kalendar[key].append({"name": name, "rank": rank, "redLetter": red_letter, "note": None})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(kalendar, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(kalendar)} calendar dates to {OUT}")


if __name__ == "__main__":
    main()
