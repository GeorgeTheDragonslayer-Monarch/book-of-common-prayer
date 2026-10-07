#!/usr/bin/env python3
"""
Parse pages/Psalter/Psal.tex into data/psalter.json

Structure produced:
{
  "psalms": {
    "1": {"title": "Beatus vir, qui non abiit, &c.", "verses": ["...", ...]},
    ...
  },
  "monthlyCycle": {
    "1": {"morning": [1,2,3,4,5], "evening": [6,7,8]},
    ...
    "30": {...}
  }
}

Psalm 119 is printed across several days, split into its traditional 22
lettered portions (each its own \\subsection, but sharing the same
"Psalm 119" \\fancyhead marker with a verse-number suffix, e.g.
"Psalm 119:33"). We use that \\fancyhead line - present after every
\\subsection in the file - as the authoritative "a new psalm/portion
starts here" signal, and append (never overwrite) verses onto the
running psalm entry, so Psalm 119's 176 verses get reassembled in the
correct order across its multiple day-portions.
"""
import json
import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[3] / "book-of-common-prayer-main" / "pages" / "Psalter" / "Psal.tex"
OUT = Path(__file__).resolve().parent.parent / "data" / "psalter.json"

DAY_RE = re.compile(r"\\section\*\{Day (\d+)\. (Morning|Evening) Prayer\}")
SUBSECTION_START_RE = re.compile(r"\\subsection\{")
FANCYHEAD_PSALM_RE = re.compile(r"\\fancyhead\[RE,LO\]\{Psalm (\d+)(?::\d+)?\}")


def find_balanced(s: str, start: int) -> int:
    """Given s[start] == '{', return the index of its matching closing
    brace, respecting nesting (e.g. \\textit{...} inside \\subsection{...}).
    Returns -1 if unbalanced."""
    assert s[start] == "{"
    depth = 0
    i = start
    while i < len(s):
        if s[i] == "{":
            depth += 1
        elif s[i] == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


# \lett{X}{rest} is the dropcap macro that splits a verse's first word
# into its capital first letter and the remainder, e.g. \lett{B}{ehold,}
# for "Behold,". Normally the two pieces glue back together with NO space
# (they're one word). But when the "letter" is actually a standalone word
# on its own - the pronoun "I" or the interjection "O" - a space is
# required, and the generic no-space rule would wrongly produce "Iwill"
# or "Ogive". Enumerated exhaustively from every \lett{...}{...} pair that
# actually occurs in Psal.tex (verified via grep), rather than guessed
# heuristically, since e.g. \lett{I}{n} -> "In" and \lett{O}{ut} -> "Out"
# are real single words that must NOT get a space.
LETT_SPACE_PAIRS = {
    ("I", "am"), ("I", "call"), ("I", "cried"), ("I", "deal"), ("I", "hate"),
    ("I", "said,"), ("I", "waited"), ("I", "was"), ("I", "will"),
    ("O", "God,"), ("O", "Lord,"), ("O", "Lord"), ("O", "be"), ("O", "clap"),
    ("O", "come,"), ("O", "consider"), ("O", "do"), ("O", "give"), ("O", "hear"),
    ("O", "how"), ("O", "praise"), ("O", "sing"), ("O", "think"),
}


def fix_lett(s: str) -> str:
    def repl(m):
        letter, rest = m.group(1), m.group(2)
        sep = " " if (letter, rest) in LETT_SPACE_PAIRS else ""
        return f"{letter}{sep}{rest}"
    return re.sub(r"\\lett\{([^}]*)\}\{([^}]*)\}", repl, s)


def clean_text(s: str) -> str:
    s = s.replace("\\par", "")
    s = s.replace("~:", " :")
    s = s.replace("\\&", "&")
    s = s.replace("\\ae", "æ").replace("\\AE", "Æ")
    s = re.sub(r"\\psanum\{\d+\}", "", s)
    s = fix_lett(s)
    s = re.sub(r"\\emph\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\textit\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\[a-zA-Z]+", "", s)  # strip any remaining control words
    s = s.replace("{", "").replace("}", "")
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()


def split_into_verses(raw: str):
    parts = re.split(r"(\\psanum\{\d+\})", raw)
    verses, current = [], ""
    for part in parts:
        if part.startswith("\\psanum"):
            if current.strip():
                verses.append(current)
            current = ""
        else:
            current += part
    if current.strip():
        verses.append(current)
    return [clean_text(v) for v in verses if clean_text(v)]


def main():
    lines = SRC.read_text(encoding="utf-8").split("\n")

    psalms = {}          # num(str) -> {"title": str, "verses": [str]}
    monthly_cycle = {}   # day(str) -> {"morning": [int], "evening": [int]}

    cur_day = None
    cur_slot = None       # "Morning" | "Evening"
    cur_psalm_num = None
    pending_title = None  # title text captured from \subsection, applied on next fancyhead
    buffer_verse = ""

    def flush_verse_buffer():
        nonlocal buffer_verse
        if buffer_verse.strip() and cur_psalm_num is not None:
            entry = psalms.setdefault(str(cur_psalm_num), {"title": "", "verses": []})
            entry["verses"].extend(split_into_verses(buffer_verse))
        buffer_verse = ""

    for raw_line in lines:
        line = raw_line.strip()
        if line.startswith("%"):
            continue
        if not line:
            continue

        m_day = DAY_RE.search(line)
        if m_day:
            flush_verse_buffer()
            cur_day = int(m_day.group(1))
            cur_slot = m_day.group(2)
            continue

        m_sub = SUBSECTION_START_RE.search(line)
        if m_sub and "\\fancyhead" not in line:
            # Title text (works for both "Psalm N. \textit{Title}" and
            # continuation portions like "\subsection{Legem pone}").
            # Use real brace-matching (not a naive [^}]* regex) since the
            # title itself commonly contains a nested \textit{...} whose
            # own closing brace would otherwise truncate the capture.
            open_idx = m_sub.end() - 1
            close_idx = find_balanced(line, open_idx)
            if close_idx != -1:
                flush_verse_buffer()
                title = line[open_idx + 1:close_idx]
                title = re.sub(r"\\textit\{([^}]*)\}", r"\1", title)
                title = title.replace("\\&", "&").strip()
                pending_title = title
                continue

        m_fh = FANCYHEAD_PSALM_RE.search(line)
        if m_fh:
            flush_verse_buffer()
            cur_psalm_num = int(m_fh.group(1))
            entry = psalms.setdefault(str(cur_psalm_num), {"title": "", "verses": []})
            if not entry["title"] and pending_title:
                entry["title"] = pending_title
            pending_title = None
            if cur_day is not None:
                slot_key = "morning" if cur_slot == "Morning" else "evening"
                day_entry = monthly_cycle.setdefault(str(cur_day), {"morning": [], "evening": []})
                if not day_entry[slot_key] or day_entry[slot_key][-1] != cur_psalm_num:
                    day_entry[slot_key].append(cur_psalm_num)
            continue

        if line.startswith("\\fancyhead") or line.startswith("\\clearpage") or line.startswith("\\newpage"):
            continue

        if "\\lett{" in line or "\\secondline{" in line or "\\thirdline{" in line or "\\psanum{" in line:
            buffer_verse += " " + line
            continue
        # anything else (stray text/comments) is ignored

    flush_verse_buffer()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"psalms": psalms, "monthlyCycle": monthly_cycle}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    total_verses = sum(len(p["verses"]) for p in psalms.values())
    print(f"Wrote {len(psalms)} psalms ({total_verses} verses total) and {len(monthly_cycle)} days of monthly cycle to {OUT}")


if __name__ == "__main__":
    main()
