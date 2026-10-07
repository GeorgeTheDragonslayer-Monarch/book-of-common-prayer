#!/usr/bin/env python3
"""
Parse pages/Office/Athanasian.tex (the Quicunque Vult) into a bilingual
array of "verse" strings, one chant-pointed line per array entry - the
same convention data/psalter.json already uses (see parse_psalter.py):
no verse numbers shown, the " : " chant-pointing mark kept inline.

The whole Creed is one \\elcol{ENGLISH}{LATIN} macro call. Verse
boundaries are NOT the same between the two languages in this source:
- English marks every verse explicitly with \\psanum{N} (N = 2..28,
  30..41 - the three drop-cap paragraph openers, verses 1/29/42 in this
  book's own numbering, aren't separately marked, since \\lett{}{} is
  itself unambiguous enough as a boundary). This gives 42 English
  verses, split on \\psanum{}/\\lett{} boundaries.
- Latin has no \\psanum markers at all; \\par is the only boundary, and
  in three places one \\par-delimited unit covers what English splits
  into two or three separate numbered verses (each Latin sub-sentence
  is already its own grammatically complete unit - the printed page
  just doesn't give each one its own \\par the way English's \\psanum
  markers do). All three were located by hand, matching Latin content
  against the corresponding English verse(s), and are fixed here by
  inserting an extra \\par at each point (LATIN_PAR_INSERTIONS below)
  before the normal \\par-based split runs - not by special-casing the
  split logic itself, so split_latin() stays as simple as split_english():
    - "...absque dúbio in {\\ae}térnum períbit." / "Fides autem..." -
      splits what covers English v2 from v3.
    - "...Trinitátem in unitáte venerémur." / "Neque confundéntes..." -
      splits English v3 from v4.
    - "...christiána veritáte compéllimur:" / "* ita tres Deos..." -
      splits English v19 ("For like as we are compelled...") from v20
      ("So are we forbidden..."). The Latin's own " * " pointing mark
      at this exact spot becomes the new \\par, so it's replaced (not
      just supplemented) - the "ita" that follows is re-capitalized to
      "Ita" since it now opens its own sentence.
    - "...nihil majus aut minus:" / "* sed totæ tres persónæ..." -
      splits English v25 ("And in this Trinity there is no before or
      after...") from v26 ("But all three Persons are co-eternal...").
      Same " * " -> \\par treatment as above.
  Verified: after these four insertions, both arrays have exactly 42
  entries, and a hand read-through of all 42 pairs (printed by this
  script) confirms each pair is the same verse in both languages, not
  just the same count.
"""
import json
import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[3] / "book-of-common-prayer-main" / "pages" / "Office" / "Athanasian.tex"
OUT = Path(__file__).resolve().parent.parent / "data" / "athanasian-creed.json"

# (unique substring to find, replacement with an extra \par inserted) -
# see module docstring. Each search string is verified unique in the
# source before being applied (main() asserts count==1 for each).
LATIN_PAR_INSERTIONS = [
    ("absque dúbio in {\\ae}térnum períbit.",
     "absque dúbio in {\\ae}térnum períbit.\\par"),
    ("Trinitátem in unitáte venerémur.",
     "Trinitátem in unitáte venerémur.\\par"),
    ("christiána veritáte compéllimur: * ita tres Deos",
     "christiána veritáte compéllimur.\\par Ita tres Deos"),
    ("nihil majus aut minus: * sed tot{\\ae} tres persón{\\ae}",
     "nihil majus aut minus.\\par Sed tot{\\ae} tres persón{\\ae}"),
]


def find_elcol_args(text):
    """Finds \\elcol{ARG1}{ARG2} and returns (arg1, arg2) via manual
    brace matching (arguments contain nested braces, so a regex can't
    safely capture them)."""
    m = re.search(r"\\elcol\{", text)
    if not m:
        raise ValueError("no \\elcol{ found")
    i = m.end()
    depth = 1
    start = i
    while depth > 0:
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
        i += 1
    arg1 = text[start:i - 1]
    j = i
    while text[j] in " \t\n":
        j += 1
    if text[j] != "{":
        raise ValueError(f"expected '{{' for second \\elcol argument, found {text[j]!r}")
    j += 1
    depth = 1
    start2 = j
    while depth > 0:
        if text[j] == "{":
            depth += 1
        elif text[j] == "}":
            depth -= 1
        j += 1
    arg2 = text[start2:j - 1]
    return arg1, arg2


def unwrap_linebreak_macros(s):
    """\\secondline{X} / \\thirdline{X} -> X (printed-page line-wrap
    hints only, not verse boundaries) and \\textls[-5]{X} -> X (a manual
    letter-spacing kern around v15's drop-cap-adjacent text, per the
    source's own "MANUAL ADJUSTMENT" comment - a typographic fix, not
    content). Must run *before* split_english's \\psanum-based split,
    since \\psanum{15} sits nested inside this particular \\textls{} -
    splitting first would tear the macro in half and leave a stray
    "\\textls[-5]{" / "}" pair on either side of the break.
    Uses real brace matching, not a [^{}]*-style regex, because X can
    itself contain braces (\\psanum{2}, {\\ae}, etc) - a naive regex
    stops at the first inner brace and silently fails to unwrap
    anything nested."""
    out = []
    i = 0
    n = len(s)
    while i < n:
        m = re.match(r"\\(secondline|thirdline)\{", s[i:]) or re.match(r"\\textls\[-?\d+\]\{", s[i:])
        if not m:
            out.append(s[i])
            i += 1
            continue
        i += m.end()
        depth = 1
        start = i
        while depth > 0:
            if s[i] == "{":
                depth += 1
            elif s[i] == "}":
                depth -= 1
            i += 1
        out.append(s[start:i - 1])
    return "".join(out)


O_CONTINUATION_FRAGMENTS = {"n", "ut", "ur", "f", "nly", "ther", "pen", "wn", "ver"}


def fix_lett_macro(s):
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


def strip_comments(text):
    lines = [ln for ln in text.split("\n") if not ln.strip().startswith("%")]
    text = "\n".join(lines)
    return re.sub(r"(?<!\\)%.*$", "", text, flags=re.MULTILINE)


def clean_verse(s):
    # Must run before fix_lett_macro: \lett{H}{{\ae}c} nests a brace
    # inside its own second argument, which fix_lett_macro's
    # [^}]*-style regex can't see past - flattening {\ae}/{\AE} to
    # plain æ/Æ first removes that nesting so \lett{}{} parses cleanly.
    s = s.replace("{\\ae}", "\u00e6").replace("{\\AE}", "\u00c6")
    s = fix_lett_macro(s)
    s = s.replace("~", " ")
    s = s.replace("\\par", " ")
    s = re.sub(r"\\psanum\{\d+\}", "", s)
    s = re.sub(r"\\smash\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\{\\ding\{64\}\}", "\u271d", s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def split_english(arg_text):
    text = unwrap_linebreak_macros(arg_text)
    text = strip_comments(text)
    parts = re.split(r"(?=\\psanum\{\d+\})|(?=\\lett\{[A-Za-z]\})", text)
    return [clean_verse(p) for p in parts if clean_verse(p)]


def apply_latin_par_insertions(raw_arg_text):
    text = raw_arg_text
    for find, replace in LATIN_PAR_INSERTIONS:
        count = text.count(find)
        if count != 1:
            raise ValueError(f"expected exactly 1 occurrence of {find!r}, found {count}")
        text = text.replace(find, replace)
    return text


def split_latin(arg_text):
    text = apply_latin_par_insertions(arg_text)
    text = unwrap_linebreak_macros(text)
    text = strip_comments(text)
    units = [u for u in (re.sub(r"\s+", " ", u).strip() for u in text.split("\\par")) if u]
    return [clean_verse(u) for u in units]


def main():
    raw = SRC.read_text(encoding="utf-8")
    english_arg, latin_arg = find_elcol_args(raw)
    english_verses = split_english(english_arg)
    latin_verses = split_latin(latin_arg)

    print(f"English verses: {len(english_verses)}")
    print(f"Latin verses:   {len(latin_verses)}")
    ok = len(english_verses) == len(latin_verses)
    if not ok:
        print("*** MISMATCH - inspect both lists below before trusting the output ***")
    for i, (en, la) in enumerate(zip(english_verses, latin_verses)):
        print(f"{i+1:2}. EN: {en}")
        print(f"    LA: {la}")

    if not ok:
        print("\nNOT writing output - fix the mismatch first.")
        return

    data = {
        "heading": "Athanasian Creed",
        "headingLatin": "Symbolum Athanasianum",
        "verses": english_verses,
        "versesLatin": latin_verses,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {OUT}")


if __name__ == "__main__":
    main()
