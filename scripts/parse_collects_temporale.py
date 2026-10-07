#!/usr/bin/env python3
"""
Parse pages/Propers/PropSeas.tex (the "Proper of Season" - i.e. the
Temporale Mass propers) for the Collect of each Sunday/season-day, and
key the result by the same periodKey strings used in
data/lectionary-temporale.json, so js/app.js's collectOfDay placeholder
can look a Collect up directly by resolved.periodKey.

PropSeas.tex marks the start of each Mass with \\feastday{X} (a short
label, not always identical to the Lectionary's periodKey - e.g. it
says "St. John" where the Lectionary says "St. John Evangelist"). A
PERIOD_KEY_ALIASES table below maps the handful of mismatches. Only
periods that actually appear in data/lectionary-temporale.json are
worth keeping, since collectOfDay is only ever looked up by a resolved
periodKey from that file - so \\feastday{} labels for things the
calendar engine never resolves to (Ember Days, the ferias of Easter
Week, etc, which the Lectionary folds into other periods) are skipped.

Christmas Day has three Masses (Night/Dawn/Day) each with its own
Collect, all three labelled \\feastday{Christmas}; since Morning/Evening
Prayer on Christmas Day would use the Day Mass's Collect (the one
actually printed as "the Collect" throughout the rest of the Prayer
Book's Christmas material), this parser keeps the *last* \\feastday{}
occurrence when a label repeats, not the first.
"""
import json
import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[3] / "book-of-common-prayer-main" / "pages" / "Propers" / "PropSeas.tex"
LECTIONARY = Path(__file__).resolve().parent.parent / "data" / "lectionary-temporale.json"
OUT = Path(__file__).resolve().parent.parent / "data" / "collects-temporale.json"

PERIOD_KEY_ALIASES = {
    "St. John": "St. John Evangelist",
    "Most Holy Name": "Most Holy Name of Jesus",
    "Ascension Sunday": "Sunday within Ascension Octave",
    "Divine Compassion": "Compassion of Our Lord",
    "Sunday before Advent": "Sunday Next before Advent",
}


# Real continuations of a bare "O" drop-cap seen in this book's Collects
# (On, Out, Our, Of, Only, Other, Open...) - a short, closed set. Every
# other \lett{O}{lowercase-word} is the vocative interjection "O" (as in
# "O almighty God", "O merciful Father") and needs a space, even though
# the word after it starts lowercase - which is why the plain
# starts-with-uppercase test below gets this one letter wrong on its own.
O_CONTINUATION_FRAGMENTS = {"n", "ut", "ur", "f", "nly", "ther", "pen", "wn", "ver"}


def fix_lett_macro(s: str) -> str:
    """\\lett{X}{Y} is a drop-cap: X is the enlarged first letter, Y is
    the rest of the text. Usually X+Y forms one word (\\lett{A}{lmighty}
    -> "Almighty", no space), but when the drop-cap letter is itself a
    standalone word - most often the vocative "O" (\\lett{O}{Lord,}) -
    X and Y need a space between them. Detected by whether Y starts with
    an uppercase letter (a new word) vs lowercase (a continuation) - with
    a special-cased exception for bare "O", whose lowercase-word cases
    are almost always the vocative "O", not a continuation (see
    O_CONTINUATION_FRAGMENTS above)."""
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
    r"^\s*\\(begin\{rubric\}|readingcitation|introit|collect|secret|postcommunion|communion|offertory|gradall|feastday|seasonSubsection|seasonalFestival|seasonalFestivalDateNoHead|festival|clearpage)"
)


def _skip_non_content(lines, i, n):
    """Skips blank / comment-only / bare-label / pure-formatting lines
    (\\vspace, \\newcolumn, \\clearpage-adjacent comments), none of which
    carry any actual Collect text."""
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
    """Captures one \\lett{}{}-led paragraph starting at lines[i], up to
    a boundary marker or the first blank line after real content starts.
    Returns (text_or_None, next_i)."""
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
        # Strip a trailing (unescaped) "%..." LaTeX comment - see
        # parse_collects_sanctorale.py's extract_collect for the
        # Transfiguration Collect case this guards against.
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
    """lines[start_idx] is the '\\collect' marker line. Captures the
    Collect's own paragraph, then - if a *second* \\lett{}{} paragraph
    immediately follows after a blank line, before any boundary marker -
    also captures that as a "secondary" paragraph. A handful of entries
    (Christmas I, Trinity I, Conversion of St. Paul, Chair of St. Peter
    at Antioch) have exactly this shape: a built-in commemoration of a
    related feast (the identity of which is resolved at render time in
    app.js by matching the secondary text against other known Collects -
    see ROADMAP.md) baked into the same Mass, not part of the main
    Collect itself.
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
    lectionary_periods = set(json.load(open(LECTIONARY, encoding="utf-8")).keys())

    lines = SRC.read_text(encoding="utf-8").split("\n")
    collects = {}  # periodKey -> text (last-wins on repeat, per Christmas Day note above)
    # "Whitsun Emberday" appears three times in the source, undifferentiated,
    # for the Wednesday/Friday/Saturday Ember Days after Whitsunday - in that
    # written order, which matches the Lectionary's three separate periods.
    whitsun_emberday_keys = ["Ember Wednesday", "Ember Friday", "Ember Saturday"]
    whitsun_emberday_seen = 0

    cur_feastday = None
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        m_fd = re.search(r"\\feastday\{([^}]*)\}", line)
        if m_fd:
            cur_feastday = m_fd.group(1).strip()
            i += 1
            continue
        if re.match(r"^\s*\\collect\b", line) and cur_feastday is not None:
            text, secondary, next_i = extract_collect(lines, i)
            if text:
                if cur_feastday == "Whitsun Emberday" and whitsun_emberday_seen < len(whitsun_emberday_keys):
                    period_key = whitsun_emberday_keys[whitsun_emberday_seen]
                    whitsun_emberday_seen += 1
                else:
                    period_key = PERIOD_KEY_ALIASES.get(cur_feastday, cur_feastday)
                if period_key in lectionary_periods:
                    entry = {"text": text}
                    if secondary:
                        entry["secondaryText"] = secondary
                    collects[period_key] = entry
            i = next_i
            continue
        i += 1

    missing = sorted(lectionary_periods - set(collects.keys()))
    n_secondary = sum(1 for e in collects.values() if "secondaryText" in e)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(collects, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(collects)} Collects to {OUT} ({n_secondary} with a secondary paragraph)")
    print(f"{len(missing)} Lectionary periods with no Collect found: {missing}")


if __name__ == "__main__":
    main()
