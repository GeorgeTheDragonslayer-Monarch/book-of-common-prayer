#!/usr/bin/env python3
"""
Parse pages/Propers/PropSeas.tex (Temporale) and pages/Propers/PropTime.tex
(Sanctorale) for the FULL set of variable Mass propers - not just the
Collect (which parse_collects_temporale.py / parse_collects_sanctorale.py
already extracted) but also the Introit, Epistle (citation + text),
Gradual/Alleluia/Tract, Gospel (citation + text), Offertory, Secret,
Communion, and Postcommunion for each Sunday/season-day (Temporale) and
each fixed feast with full propers (Sanctorale).

This supersedes the two Collect-only scripts: it writes the same output
files (data/collects-temporale.json, data/collects-sanctorale.json) with
the same keys (periodKey / "M-D"). The Collect itself keeps its original
field names ("text" / "secondaryText" - not "collectText") so every
existing reader of these two files - collectOfDay, findTransferredFeast,
and the Mattins/Evensong templates in js/app.js - keeps working
unchanged; the other proper parts are added under their own new field
names alongside it (see extract_entry_parts below for the exact keys).

Structure per Mass (both files): a boundary macro (\\feastday{} in both;
\\seasonSubsection{}{}{} additionally marks each Temporale entry, then
\\feastdate{}{} additionally marks each Sanctorale entry) is followed by
a sequence of the following macros, in this order when present:
  \\introit                                  -> \\lett{}{}-led paragraph
                                                  (field: "introit")
  \\collect                                  -> \\lett{}{}-led paragraph
                                                  (+ optional secondary)
                                                  (fields: "text" /
                                                  "secondaryText")
  \\readingcitation{Epistle}{cite}           -> \\lett{}{}-led paragraph
                                                  (fields:
                                                  "epistleCitation" /
                                                  "epistleText")
  \\gradall{gradual text}{alleluia text}     -> two brace arguments
                                                  (fields: "gradual" /
                                                  "gradualAlleluia")
  \\tract{tract text}                        -> one brace argument
                                                  (field: "tract";
                                                  Septuagesima-season
                                                  alternate to the Alleluia
                                                  half of \\gradall)
  \\alleluia{alleluia text}                  -> one brace argument
                                                  (field: "alleluia";
                                                  Eastertide "Greater
                                                  Alleluia" alternate to
                                                  the whole \\gradall)
  \\readingcitation{Gospel}{cite}            -> \\lett{}{}-led paragraph
                                                  (fields: "gospelCitation"
                                                  / "gospelText")
  \\offertory{text}                          -> one brace argument
                                                  (field: "offertory")
  \\secret                                   -> \\lett{}{}-led paragraph
                                                  (+ optional secondary)
                                                  (fields: "secretText" /
                                                  "secretSecondaryText")
  \\communion{text}                          -> one brace argument
                                                  (field: "communion")
  \\postcommunion                            -> \\lett{}{}-led paragraph
                                                  (+ optional secondary)
                                                  (fields:
                                                  "postcommunionText" /
                                                  "postcommunionSecondaryText")

Not every Mass has every part (a few Votive-adjacent or partial entries
in these files only give a Collect, e.g.), and \\tract/\\alleluia are
genuinely optional extras alongside \\gradall (present on roughly half
of entries, per the "After Septuagesima..."/"In Eastertide..." rubrics
that introduce them) - all absent parts are simply omitted from that
entry's JSON object.

Multi-Mass Sanctorale entries (a handful of major feasts print more than
one full Mass, e.g. Christmas Day's Night/Dawn/Day Masses) are handled
the same way the existing Collect-only parser already did: last full
Mass under a repeated \\feastday{}/\\feastdate{} wins, since that's the
one actually treated as "the" Mass elsewhere in this Prayer Book's own
cross-references.
"""
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[3] / "book-of-common-prayer-main"
PROPSEAS = REPO / "pages" / "Propers" / "PropSeas.tex"
PROPTIME = REPO / "pages" / "Propers" / "PropTime.tex"
LECTIONARY = Path(__file__).resolve().parent.parent / "data" / "lectionary-temporale.json"
OUT_TEMPORALE = Path(__file__).resolve().parent.parent / "data" / "collects-temporale.json"
OUT_SANCTORALE = Path(__file__).resolve().parent.parent / "data" / "collects-sanctorale.json"

MONTHS = {
    "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
    "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12,
}

PERIOD_KEY_ALIASES = {
    "St. John": "St. John Evangelist",
    "Most Holy Name": "Most Holy Name of Jesus",
    "Ascension Sunday": "Sunday within Ascension Octave",
    "Divine Compassion": "Compassion of Our Lord",
    "Sunday before Advent": "Sunday Next before Advent",
}

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
    s = re.sub(r"\\textsc\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\divineName\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\label\{[^}]*\}", "", s)
    s = re.sub(r"\\vr\{[^}]*\}", "", s)
    s = s.replace("\\&", "&")
    s = s.replace("\\ae", "\u00e6").replace("\\AE", "\u00c6")
    s = re.sub(r"\\[a-zA-Z]+", "", s)
    s = s.replace("{", "").replace("}", "")
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()


BOUNDARY_RE = re.compile(
    r"^\s*\\(begin\{rubric\}|readingcitation|introit|collect|secret|postcommunion|communion|offertory|"
    r"gradall|gradtr|tract|alleluia|feastday|feastdate|seasonSubsection|seasonalFestival|"
    r"seasonalFestivalDateNoHead|festival|clearpage)"
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


def extract_lett_paragraph(lines, start_idx, n):
    """lines[start_idx] is a bare marker line (\\introit, \\collect,
    \\secret, \\postcommunion). Captures the paragraph, and - for
    \\collect/\\secret/\\postcommunion only - a possible second
    \\lett{}{} paragraph immediately following (a built-in secondary
    commemoration baked into the same Mass; see ROADMAP.md).
    Returns (text, secondary_text_or_None, next_i).

    NOTE ON FIELD NAMING: the Collect specifically keeps the field names
    "text"/"secondaryText" (not "collectText"/"collectSecondaryText")
    in the calling code below - collectOfDay, findTransferredFeast, and
    the Office templates in js/app.js already read collectsTemporaleData/
    collectsSanctoraleData entries by exactly those two field names, and
    this parser's whole point is to enrich those same two JSON files
    in place without disturbing anything already depending on them."""
    i = start_idx + 1
    i = _skip_non_content(lines, i, n)
    text, i = _capture_paragraph(lines, i, n)
    if text is None:
        return None, None, i
    j = _skip_non_content(lines, i, n)
    secondary, j2 = _capture_paragraph(lines, j, n)
    if secondary is not None:
        i = j2
    return text, secondary, i


def extract_brace_args(lines, start_idx, n, nargs):
    """lines[start_idx] contains a macro like \\gradall{...}{...} or
    \\offertory{...}. Joins lines from start_idx forward (the macro's
    arguments may wrap across several source lines) and does a
    brace-depth scan to pull out `nargs` balanced {...} groups
    immediately following the macro name. Returns (list_of_arg_texts,
    next_i) where next_i is the line index just after the line on which
    the last closing brace was found."""
    buf = []
    j = start_idx
    while j < n:
        buf.append(lines[j])
        joined = "\n".join(buf)
        # Find the macro name at the start (skip leading whitespace),
        # then attempt to pull `nargs` brace groups from what follows.
        m = re.match(r"^\s*\\[a-zA-Z]+", joined)
        if not m:
            return [], start_idx + 1
        pos = m.end()
        args = []
        ok = True
        for _ in range(nargs):
            # skip whitespace/newlines between arguments
            while pos < len(joined) and joined[pos] in " \t\n":
                pos += 1
            if pos >= len(joined) or joined[pos] != "{":
                ok = False
                break
            depth = 0
            arg_start = pos
            while pos < len(joined):
                if joined[pos] == "{":
                    depth += 1
                elif joined[pos] == "}":
                    depth -= 1
                    if depth == 0:
                        pos += 1
                        break
                pos += 1
            else:
                # ran out of buffered text before braces balanced -
                # need another source line
                ok = False
                break
            args.append(joined[arg_start + 1:pos - 1])
        if ok and len(args) == nargs:
            # figure out which line index we ended on
            consumed_newlines = joined[:pos].count("\n")
            next_i = start_idx + consumed_newlines + 1
            cleaned = [clean_text(a) for a in args]
            return cleaned, next_i
        j += 1
    return [], n


def extract_entry_parts(lines, entry_start, entry_end):
    """Extract every proper part found between lines[entry_start:entry_end]
    (the span belonging to one Mass). Returns a dict with whichever of
    introit/text/secondaryText/epistleCitation/epistleText/
    gradual/gradualAlleluia/tract/alleluia/gospelCitation/gospelText/
    offertory/secretText/secretSecondaryText/communion/postcommunionText/
    postcommunionSecondaryText are present. ("text"/"secondaryText" here
    are the Collect - see module docstring's field-naming note.)"""
    parts = {}
    i = entry_start
    n = entry_end
    while i < n:
        line = lines[i]
        stripped = line.strip()
        if not stripped or stripped.startswith("%"):
            i += 1
            continue

        if re.match(r"^\\introit\b", stripped):
            text, _, ni = extract_lett_paragraph(lines, i, n)
            if text and "introit" not in parts:
                parts["introit"] = text
            i = ni
            continue

        if re.match(r"^\\collect\b", stripped):
            text, secondary, ni = extract_lett_paragraph(lines, i, n)
            # First-wins, not last-wins: a handful of entries (the
            # Ember Wednesday/Saturday prophecies chiefly) print several
            # \collect macros in a row, one per Old Testament lesson,
            # all said together rather than being alternatives - this
            # site's data model only has room for one Collect per key,
            # so the first (the one actually headed "The Collect" in the
            # source, with the others being supplementary prophecy
            # collects) is kept, matching what "the Collect" means
            # everywhere else in this pipeline.
            if text and "text" not in parts:
                parts["text"] = text
                if secondary:
                    parts["secondaryText"] = secondary
            i = ni
            continue

        m = re.match(r"^\\readingcitation\{(Epistle|Gospel)\}\{([^}]*)\}", stripped)
        if m:
            kind, cite = m.group(1), m.group(2)
            text, _, ni = extract_lett_paragraph(lines, i, n)
            citKey = "epistleCitation" if kind == "Epistle" else "gospelCitation"
            if text and citKey not in parts:
                if kind == "Epistle":
                    parts["epistleCitation"] = cite
                    parts["epistleText"] = text
                else:
                    parts["gospelCitation"] = cite
                    parts["gospelText"] = text
            i = ni
            continue

        if re.match(r"^\\gradall\b", stripped):
            args, ni = extract_brace_args(lines, i, n, 2)
            if len(args) == 2 and "gradual" not in parts:
                parts["gradual"] = args[0]
                parts["gradualAlleluia"] = args[1]
            i = ni
            continue

        # \gradtr{gradual text}{tract text} - a second two-brace-argument
        # Gradual macro, distinct from \gradall, used on the great
        # Sundays of Septuagesimatide/Lent/Passiontide (and a handful of
        # Sanctorale Masses that share their propers) where the classical
        # source gives both a Gradual and its paired Tract outright,
        # rather than a Gradual+Alleluia pair. Maps directly onto the
        # same "gradual"/"tract" fields the season-aware Gradual/Tract
        # picker (gradualOfDay in js/app.js) already reads.
        if re.match(r"^\\gradtr\b", stripped):
            args, ni = extract_brace_args(lines, i, n, 2)
            if len(args) == 2:
                if "gradual" not in parts:
                    parts["gradual"] = args[0]
                if "tract" not in parts:
                    parts["tract"] = args[1]
            i = ni
            continue

        if re.match(r"^\\tract\b", stripped):
            args, ni = extract_brace_args(lines, i, n, 1)
            if len(args) == 1 and "tract" not in parts:
                parts["tract"] = args[0]
            i = ni
            continue

        if re.match(r"^\\alleluia\b", stripped):
            args, ni = extract_brace_args(lines, i, n, 1)
            if len(args) == 1 and "alleluia" not in parts:
                parts["alleluia"] = args[0]
            i = ni
            continue

        if re.match(r"^\\offertory\b", stripped):
            args, ni = extract_brace_args(lines, i, n, 1)
            if len(args) == 1 and "offertory" not in parts:
                parts["offertory"] = args[0]
            i = ni
            continue

        if re.match(r"^\\secret\b", stripped):
            text, secondary, ni = extract_lett_paragraph(lines, i, n)
            if text and "secretText" not in parts:
                parts["secretText"] = text
                if secondary:
                    parts["secretSecondaryText"] = secondary
            i = ni
            continue

        if re.match(r"^\\communion\b", stripped):
            args, ni = extract_brace_args(lines, i, n, 1)
            if len(args) == 1 and "communion" not in parts:
                parts["communion"] = args[0]
            i = ni
            continue

        if re.match(r"^\\postcommunion\b", stripped):
            text, secondary, ni = extract_lett_paragraph(lines, i, n)
            if text and "postcommunionText" not in parts:
                parts["postcommunionText"] = text
                if secondary:
                    parts["postcommunionSecondaryText"] = secondary
            i = ni
            continue

        i += 1

    return parts


def parse_temporale():
    lectionary_periods = set(json.load(open(LECTIONARY, encoding="utf-8")).keys())
    lines = PROPSEAS.read_text(encoding="utf-8").split("\n")
    n = len(lines)

    # Find every \feastday{} line - each starts a new entry, ending at
    # the next \feastday{} (or EOF).
    boundaries = []
    for i, line in enumerate(lines):
        m = re.search(r"\\feastday\{([^}]*)\}", line)
        if m:
            boundaries.append((i, m.group(1).strip()))

    entries = {}
    whitsun_emberday_keys = ["Ember Wednesday", "Ember Friday", "Ember Saturday"]
    whitsun_emberday_seen = 0

    for idx, (start, feastday) in enumerate(boundaries):
        end = boundaries[idx + 1][0] if idx + 1 < len(boundaries) else n
        parts = extract_entry_parts(lines, start + 1, end)
        if not parts:
            continue
        if feastday == "Whitsun Emberday" and whitsun_emberday_seen < len(whitsun_emberday_keys):
            period_key = whitsun_emberday_keys[whitsun_emberday_seen]
            whitsun_emberday_seen += 1
        else:
            period_key = PERIOD_KEY_ALIASES.get(feastday, feastday)
        if period_key in lectionary_periods:
            entries[period_key] = parts

    missing = sorted(lectionary_periods - set(entries.keys()))
    n_with_collect = sum(1 for e in entries.values() if "text" in e)
    n_with_introit = sum(1 for e in entries.values() if "introit" in e)
    n_with_epistle = sum(1 for e in entries.values() if "epistleText" in e)
    n_with_gospel = sum(1 for e in entries.values() if "gospelText" in e)
    OUT_TEMPORALE.parent.mkdir(parents=True, exist_ok=True)
    OUT_TEMPORALE.write_text(json.dumps(entries, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[Temporale] Wrote {len(entries)} entries to {OUT_TEMPORALE}")
    print(f"[Temporale]   with Collect: {n_with_collect}, Introit: {n_with_introit}, Epistle: {n_with_epistle}, Gospel: {n_with_gospel}")
    print(f"[Temporale] {len(missing)} Lectionary periods with no entry found: {missing}")


def parse_sanctorale():
    lines = PROPTIME.read_text(encoding="utf-8").split("\n")
    n = len(lines)

    # Each entry is bounded by \feastdate{D}{Month} (the more reliably
    # parsable per-entry marker - see original script's docstring), with
    # \feastday{Name} appearing shortly before it.
    date_boundaries = []
    cur_feastday = None
    for i, line in enumerate(lines):
        m_fd = re.match(r"^\\feastday\{([^}]*)\}", line)
        if m_fd:
            cur_feastday = m_fd.group(1).strip().replace("\\&", "&")
            continue
        m_date = re.match(r"^\\feastdate\{(\d+)(?:/\d+)?\}\{([A-Za-z]+)\}", line)
        if m_date:
            day = int(m_date.group(1))
            month = MONTHS.get(m_date.group(2))
            if month:
                date_boundaries.append((i, f"{month}-{day}", cur_feastday))

    entries = {}
    for idx, (start, date_key, feastday) in enumerate(date_boundaries):
        end = date_boundaries[idx + 1][0] if idx + 1 < len(date_boundaries) else n
        parts = extract_entry_parts(lines, start + 1, end)
        if not parts:
            continue
        parts["name"] = feastday
        entries[date_key] = parts

    n_with_collect = sum(1 for e in entries.values() if "text" in e)
    n_with_introit = sum(1 for e in entries.values() if "introit" in e)
    n_with_epistle = sum(1 for e in entries.values() if "epistleText" in e)
    n_with_gospel = sum(1 for e in entries.values() if "gospelText" in e)
    OUT_SANCTORALE.parent.mkdir(parents=True, exist_ok=True)
    OUT_SANCTORALE.write_text(json.dumps(entries, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[Sanctorale] Wrote {len(entries)} entries to {OUT_SANCTORALE}")
    print(f"[Sanctorale]   with Collect: {n_with_collect}, Introit: {n_with_introit}, Epistle: {n_with_epistle}, Gospel: {n_with_gospel}")


if __name__ == "__main__":
    parse_temporale()
    parse_sanctorale()
