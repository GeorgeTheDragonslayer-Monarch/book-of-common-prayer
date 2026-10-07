"""
Extraction helper for pages/HolyMass/Mass.tex (the Ordinary of the Mass).

Unlike the Office Hours/Litanies (regular, repetitive shapes that could be
split by a single mechanical rule), Mass.tex mixes plain paragraphs,
\\rubric/\\secrubric blocks, \\elcol/\\elcoldent bilingual pairs, a Ten
Commandments call-and-response list, a \\paracol "Deacon present / Deacon
absent" alternative, and a hand-laid-out \\minipage apparatus in the Canon
(main prayer text in a wide column, lettered ceremonial notes in a narrow
side column) - too irregular for one mechanical section-builder the way
the Psalter or Kalendar were. This script does NOT try to auto-assemble
the final data/mass-ordinary.json; it extracts and macro-cleans every
raw chunk (a \\subsection/\\subsubsection heading, a rubric/secrubric
block, an elcol/elcoldent pair, or a plain paragraph) *in source order*
and prints them so they can be reviewed and hand-assembled into the
final JSON's section list - the same two-phase approach already used for
the Great Litany and Litany of the Saints, just with an automated first
pass given this file's much larger size (1059 lines).

Macro handling notes (see BookOfCommonPrayer.tex for definitions):
  - \\lett{X}{Y} (drop cap) -> XY, reusing fix_lett_macro's spacing
    heuristic from parse_collects_temporale.py.
  - \\blackrubric{X} -> X (just changes print colour, not content).
  - \\inrub{X}, \\margcolrub{N}{X}, \\marglatincolrub{N}{X},
    \\margrub{N}{X}, \\margrubleft{N}{X} -> " (X)" inline. All four are
    self-contained inline ceremonial notes (the printed book puts X in
    the margin next to a superscript letter N; this site has no margin,
    so the note is folded inline as a parenthetical instead, the same
    treatment already used for \\inrub elsewhere in the Office).
  - \\ding{64} / \\ding{66} -> "✠" (a sign-of-the-cross mark, often
    embedded mid-word in the traditional Missal typesetting to show
    exactly which syllable is spoken while making a small cross - kept
    at the exact character position it appears in the source).
  - {\\ae}/{\\AE} -> æ/Æ; \\textit{}/\\emph{}/\\textsc{} -> inner text
    only (this JSON pipeline doesn't model inline emphasis); \\smash{X}
    -> X; \\centerline{X} -> X.
  - \\elcoldent is content-identical to \\elcol (only its LaTeX layout
    differs - a paracol dual-column instead of elcol's own layout), so
    both are extracted the same way.
"""
import re
import sys
import json

sys.path.insert(0, "scripts")
from parse_collects_temporale import fix_lett_macro  # reuse, don't reimplement

SRC = "/sessions/pensive-gracious-brahmagupta/mnt/book-of-common-prayer-main/pages/HolyMass/Mass.tex"


def find_balanced(s, start):
    """s[start] must be '{'. Returns (content, end_index_after_closing_brace)."""
    assert s[start] == "{"
    depth = 0
    i = start
    while i < len(s):
        if s[i] == "{":
            depth += 1
        elif s[i] == "}":
            depth -= 1
            if depth == 0:
                return s[start + 1 : i], i + 1
        i += 1
    raise ValueError("unbalanced braces from index %d" % start)


def strip_macro_with_arg(s, name):
    """Replace \\name{...} with just the inner content, handling nested braces."""
    pat = "\\" + name + "{"
    while True:
        idx = s.find(pat)
        if idx == -1:
            return s
        inner, end = find_balanced(s, idx + len(pat) - 1)
        s = s[:idx] + inner + s[end:]


def strip_macro_2arg_as_paren(s, name):
    """Replace \\name{N}{text} with ' (text)' - drops the numeric first arg."""
    pat = "\\" + name + "{"
    while True:
        idx = s.find(pat)
        if idx == -1:
            return s
        _num, end1 = find_balanced(s, idx + len(pat) - 1)
        if end1 >= len(s) or s[end1] != "{":
            # malformed / unexpected shape - bail out to avoid corrupting text
            raise ValueError("expected second {} after \\%s at %d" % (name, idx))
        text, end2 = find_balanced(s, end1)
        s = s[:idx] + " (" + text.strip() + ")" + s[end2:]
    return s


def strip_macro_1arg_as_paren(s, name):
    pat = "\\" + name + "{"
    while True:
        idx = s.find(pat)
        if idx == -1:
            return s
        inner, end = find_balanced(s, idx + len(pat) - 1)
        s = s[:idx] + " (" + inner.strip() + ")" + s[end:]


def clean_text(s):
    if s is None:
        return s
    # \lett{X}{Y} is a drop-cap macro whose Y argument can itself contain
    # nested braces (\lett{G}{l\smash{ó}ria}, bon{\ae} elsewhere) -
    # fix_lett_macro's regex only handles a flat {[^}]*} second group
    # (same limitation already documented/fixed for the Athanasian Creed
    # parser), so flatten every nested-brace macro that can appear
    # *inside* a \lett argument before calling it.
    s = strip_macro_with_arg(s, "smash")
    s = s.replace("{\\ae}", "æ").replace("{\\AE}", "Æ")
    # fix_lett_macro's "does the rest start uppercase" heuristic only
    # special-cases "O" (the vocative) as a standalone word; this file
    # also has \lett{I}{believe} and \lett{I}{will} where "I" is the
    # standalone pronoun (needs a space), alongside \lett{I}{n} -> "In"
    # and \lett{I}{t} -> "It" where it's a genuine letter-continuation
    # (no space) - the default the shared heuristic already gets right.
    # Resolved here rather than editing the shared O-only heuristic,
    # since every other page using \lett{I}{...} is already-verified
    # continuation text (In/Intreat/Intend/Inclina/etc.).
    s = s.replace("\\lett{I}{believe}", "I believe")
    s = s.replace("\\lett{I}{will}", "I will")
    s = fix_lett_macro(s)
    s = strip_macro_with_arg(s, "blackrubric")
    s = strip_macro_1arg_as_paren(s, "inrub")
    s = strip_macro_1arg_as_paren(s, "vr")  # scripture citation, e.g. \vr{Matt. 11:28} -> " (Matt. 11:28)"
    s = re.sub(r"\(p\. \\pageref\{[^}]*\}\)", "", s)  # print-only page cross-reference, meaningless on this site
    s = strip_macro_2arg_as_paren(s, "margcolrub")
    s = strip_macro_2arg_as_paren(s, "marglatincolrub")
    s = strip_macro_2arg_as_paren(s, "margrub")
    s = strip_macro_2arg_as_paren(s, "margrubleft")
    s = s.replace("{\\ding{64}}", "✠").replace("\\ding{64}", "✠")
    s = s.replace("{\\ding{66}}", "✠").replace("\\ding{66}", "✠")
    s = strip_macro_with_arg(s, "textit")
    s = strip_macro_with_arg(s, "emph")
    s = strip_macro_with_arg(s, "textsc")
    s = strip_macro_with_arg(s, "small")
    s = strip_macro_with_arg(s, "large")
    s = strip_macro_with_arg(s, "centerline")
    s = re.sub(r"\\vspace\{[^}]*\}", "", s)
    s = re.sub(r"\\setlength\{[^}]*\}\{[^}]*\}", "", s)
    s = re.sub(r"\\thispagestyle\{[^}]*\}", "", s)
    s = re.sub(r"\\label\{[^}]*\}", "", s)
    s = re.sub(r"\\leftskip=\S+", "", s)
    s = s.replace("\\clearpage", "").replace("\\vfill", "").replace("\\hfill", "")
    s = s.replace("\\noindent", "").replace("\\indent", "").replace("\\par", " ")
    s = s.replace("\\sloppy", "").replace("\\fussy", "")
    s = s.replace("\\centering", "").replace("\\itshape", "").replace("~", " ")
    s = s.replace("\\&", "&")
    s = s.replace("\\begin{center}", "").replace("\\end{center}", "")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r" *\n *", "\n", s)
    s = re.sub(r"\n{2,}", "\n", s)
    s = s.strip()
    return s


def main():
    text = open(SRC, encoding="utf-8").read()
    # Drop fully commented-out lines (the Exhortations block, disabled
    # multicols/rubric alternates, etc.) before anything else - a '%'
    # anywhere else mid-line is a real LaTeX comment-to-end-of-line too.
    lines = []
    for line in text.split("\n"):
        # crude but sufficient here: this file doesn't use \% (escaped
        # percent) anywhere, verified by grep before writing this.
        idx = line.find("%")
        if idx != -1:
            line = line[:idx]
        lines.append(line)
    text = "\n".join(lines)

    # Control points this pass understands. Anything NOT matched by one
    # of these (plain running prose - the actual prayer/Ordinary text,
    # e.g. the Collect for Purity, the Roman Canon body, the Confession)
    # is collected as TEXT blocks, split into paragraphs on blank lines
    # (LaTeX's own paragraph-break convention) before cleaning, so each
    # paragraph comes out as its own list entry rather than one run-on
    # blob. \minipage/\paracol/\begin{center}/\multicols and similar
    # pure-layout environments are deliberately NOT special-cased here -
    # their \begin{...}/\end{...} lines get swallowed into the
    # surrounding TEXT/RUBRIC content as plain text (harmless leftover
    # noise flagged for manual review) since their actual prayer content
    # still flows through as normal paragraphs; the few spots that use
    # them for real structure (the Canon's lettered ceremonial notes,
    # the Deacon/Priest alternative) are irregular enough that they're
    # deliberately reviewed and hand-assembled anyway - see the
    # docstring at the top of this file.
    control_re = re.compile(
        r"\\(subsection|subsubsection)\{"
        r"|\\begin\{(rubric|secrubric)\}"
        r"|\\elcol(dent)?\{"
    )

    def flush_text(buf, out):
        raw = "".join(buf)
        for para in re.split(r"\n\s*\n", raw):
            cleaned = clean_text(para)
            if cleaned:
                out.append(("TEXT", cleaned))
        buf.clear()

    out = []
    buf = []
    i = 0
    n = len(text)
    while i < n:
        m = control_re.match(text, i)
        if not m:
            buf.append(text[i])
            i += 1
            continue
        flush_text(buf, out)
        if m.group(1):  # subsection/subsubsection
            inner, end = find_balanced(text, m.end() - 1)
            out.append(("HEADING", m.group(1), clean_text(inner)))
            i = end
        elif m.group(2):  # rubric/secrubric
            envname = m.group(2)
            close = "\\end{%s}" % envname
            close_idx = text.index(close, m.end())
            body = text[m.end():close_idx]
            out.append(("RUBRIC", envname, clean_text(body)))
            i = close_idx + len(close)
        else:  # elcol / elcoldent
            eng, end1 = find_balanced(text, m.end() - 1)
            # The two \elcol arguments are often written on separate
            # lines for a long bilingual block (see the Gloria, Nicene
            # Creed, Last Gospel) - skip whitespace before checking for
            # the Latin argument's opening brace, or a multi-line English
            # argument silently loses its Latin counterpart.
            j = end1
            while j < n and text[j] in " \t\n":
                j += 1
            if j < n and text[j] == "{":
                lat, end2 = find_balanced(text, j)
            else:
                lat, end2 = None, end1
            out.append(("ELCOL", clean_text(eng), clean_text(lat)))
            i = end2
    flush_text(buf, out)

    for item in out:
        print(json.dumps(item, ensure_ascii=False))


if __name__ == "__main__":
    main()
