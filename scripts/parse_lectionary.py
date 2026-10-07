#!/usr/bin/env python3
"""
Parse pages/Lectionary/Lectionary.tex "Proper of Season" longtable into
data/lectionary-temporale.json.

Output shape:
{
  "Advent I": {
    "Sunday": {
        "evensongI":  {"psalms": "36,57", "lesson1": "...", "lesson2": "..."} | null,
        "mattins":    {...} | null,
        "evensongII": {...} | null
    },
    "Monday":   {"mattins": {...}, "evensongII": {...}},
    "Tuesday":  {...},
    ...
  },
  "Advent II": {...},
  ...
}

Section headers ("\\SetCell[c=4]{l} \\textsc{Advent I}\\\\") start a new
named period (usually a Sunday/major feast); sub-headers in \\textit{}
("\\SetCell[c=4]{l} \\textit{Monday}\\\\") start a weekday within that
period, defaulting back to "Sunday" until a weekday header appears.
"""
import json
import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[3] / "book-of-common-prayer-main" / "pages" / "Lectionary" / "Lectionary.tex"
OUT = Path(__file__).resolve().parent.parent / "data" / "lectionary-temporale.json"

SECTION_RE = re.compile(r"\\SetCell\[c=4\]\{l\}\s*\\textsc\{([^}]*)\}")
WEEKDAY_RE = re.compile(r"\\SetCell\[c=4\]\{l\}\s*\\textit\{([^}]*)\}")
ROW_RE = re.compile(
    r"^\\hspace\{1em\}\s*(.+?)&(.*?)&(.*?)&(.*?)\\\\\s*$"
)
EVENSONG_RE = re.compile(r"\\evensong\{(I{1,2})\}")

# A handful of source rows don't fit the generic 4-column regex:
#  - two use an escaped "\&" *inside* a cell to join two non-contiguous
#    readings (e.g. "Gn 9:20 \& 11:1-9"), which the naive split-on-&
#    misreads as a column boundary;
#  - five use "\SetCell[c=2]{l} A \hspace{Nem} B" to merge two columns
#    into one cell (A and B separated by the \hspace, not by &), which
#    the regex captures as a single messy field and leaves the other
#    column empty/None.
# Rather than rewrite the row-splitter to handle two rare multi-line/
# merged-cell shapes correctly in general (high risk of regressing the
# ~1394 rows that already parse cleanly), these 6 rows are corrected by
# a manual lookup, keyed by (period, weekday, hour_key), applied after
# the main parse. Source line numbers in pages/Lectionary/Lectionary.tex
# as of this writing: 56, 401, 763, 955, 1021, 1085, 1325.
MANUAL_ROW_FIXES = {
    ("Advent II", "Saturday", "mattins"): {
        "psalms": None, "lesson1": "Gn 9:20 & 11:1-9", "lesson2": "Mk 8:1-21",
    },
    ("Trinity VIII", "Wednesday", "evensongII"): {
        "psalms": None, "lesson1": "Zech 11 & 13:7-end", "lesson2": "1 Cor 3",
    },
    ("Septuagesima", "Wednesday", "evensongII"): {
        "psalms": None, "lesson1": "2 Chron 19:4-end,20:30-end", "lesson2": "Mt 6:1-18",
    },
    ("Sunday within Ascension Octave", "Wednesday", "mattins"): {
        "psalms": None, "lesson1": "Num 26:1-4,52-56,63-end; 27:12", "lesson2": "Heb 10:1-34",
    },
    ("Trinity V", "Thursday", "evensongII"): {
        "psalms": None, "lesson1": "Neh 12:27-31,37-40,43-end", "lesson2": "1 Thess 4:1-12",
    },
    ("Trinity XI", "Sunday", "evensongII"): {
        "psalms": "54,55", "lesson1": "Gn 24:1-38,50-54,61-end", "lesson2": "Mt 19:1-9",
    },
    ("Trinity XXI", "Sunday", "mattins"): {
        "psalms": "120,121,122", "lesson1": "Wis 3:1-9", "lesson2": "Rev 21:1-7,10-11a,22-end",
    },
}


def clean(s: str) -> str:
    s = s.strip()
    s = re.sub(r"\\textsc\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\textit\{([^}]*)\}", r"\1", s)
    s = s.replace("\\&", "&")
    s = s.strip()
    return s


def hour_key(hour_raw: str):
    m = EVENSONG_RE.search(hour_raw)
    if m:
        return "evensongI" if m.group(1) == "I" else "evensongII"
    h = clean(hour_raw)
    if h.lower() == "mattins":
        return "mattins"
    return h.lower().replace(" ", "_")


def main():
    lines = SRC.read_text(encoding="utf-8").split("\n")
    data = {}

    cur_section = None
    cur_weekday = "Sunday"

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("%"):
            continue

        m_sec = SECTION_RE.search(line)
        if m_sec:
            cur_section = clean(m_sec.group(1))
            data.setdefault(cur_section, {})
            cur_weekday = "Sunday"
            continue

        m_wd = WEEKDAY_RE.search(line)
        if m_wd and cur_section is not None:
            cur_weekday = clean(m_wd.group(1))
            data[cur_section].setdefault(cur_weekday, {})
            continue

        m_row = ROW_RE.match(line)
        if m_row and cur_section is not None:
            hour_raw, psalms, lesson1, lesson2 = m_row.groups()
            key = hour_key(hour_raw)
            psalms = clean(psalms)
            lesson1 = clean(lesson1)
            lesson2 = clean(lesson2)
            entry = {
                "psalms": None if psalms in ("-", "") else psalms,
                "lesson1": None if lesson1 in ("-", "") else lesson1,
                "lesson2": None if lesson2 in ("-", "") else lesson2,
            }
            data[cur_section].setdefault(cur_weekday, {})[key] = entry
            continue

    n_fixed = 0
    for (period, weekday, hour), fixed_entry in MANUAL_ROW_FIXES.items():
        if period in data and weekday in data[period]:
            data[period][weekday][hour] = fixed_entry
            n_fixed += 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    n_periods = len(data)
    n_rows = sum(len(days) for days in data.values())
    print(f"Wrote {n_periods} periods / {n_rows} weekday entries to {OUT}")
    print(f"Applied {n_fixed}/{len(MANUAL_ROW_FIXES)} manual row fixes (see MANUAL_ROW_FIXES)")


if __name__ == "__main__":
    main()
