"""
Hand-assembles data/mass-ordinary.json from mass_raw.jsonl (the mechanical
first pass produced by parse_mass_ordinary.py).

The raw pass gets ~90% of the file right automatically (headings, plain
rubric/secrubric blocks, elcol/elcoldent bilingual pairs, plain-prose
paragraphs). This script converts those into the site's standard section
schema, and replaces three spots the raw pass can't handle correctly with
hand-verified text (checked directly against pages/HolyMass/Mass.tex,
same rigor as the Litany of Saints verification):

  1. The Ten Commandments - printed as a call-and-response list in the
     source (no blank lines between items), so the raw pass produced one
     giant TEXT blob. Manually split into 10 versicle pairs.
  2. The Deacon/Priest blessing dialogue before the Gospel - a \\paracol
     "if a Deacon is present / if the Priest celebrates alone" pair of
     alternatives, not sequential dialogue. Manually split into two
     labeled rubric+text blocks.
  3. The Canon's \\minipage apparatus (Words of Institution, Invocation,
     Oblation) - a wide column of continuous prayer text interrupted by
     \\begin{minipage}/\\leftskip layout commands (which the raw pass's
     blank-line paragraph splitter mistook for real paragraph breaks,
     see parse_mass_ordinary.py's docstring) plus a narrow column of
     lettered ceremonial notes (the printed book's marginal apparatus
     explaining what "(a)", "(b)" etc. refer to). Manually rejoined into
     continuous prayer text, with the ceremonial notes appended as their
     own small rubric right after each paragraph - since this site has
     no margin, that's the closest linear-reading equivalent to the
     print book's own two-column layout.

Also converts the two \\gregorioscore chant-notation points and the two
purely-decorative image inserts (a Crucifixion illustration facing the
Canon, and an ornamental tailpiece) into a documented gap rather than
silently dropping them - see the "chantNote" rubric text below and
ROADMAP.md's Known Limitations for the Mass Ordinary entry.
"""
import json

RAW = "mass_raw.jsonl"
OUT = "data/mass-ordinary.json"


def load_raw():
    items = []
    for line in open(RAW, encoding="utf-8"):
        line = line.strip()
        if line:
            items.append(json.loads(line))
    return items


def strip_vr_prefix(s):
    """English v/r text loses its literal ℣./℟. (CSS supplies it); Latin keeps it."""
    for pfx in ("℣. ", "℟. "):
        if s.startswith(pfx):
            return s[len(pfx):]
    return s


def elcol_to_versicle(eng, lat):
    """A single ℣./℟.-prefixed elcol pair -> a versicle section with the
    English prefix stripped (CSS supplies it) and the Latin prefix kept."""
    is_v = eng.startswith("℣.")
    key = "v" if is_v else "r"
    sec = {"type": "versicle", key: strip_vr_prefix(eng)}
    if lat is not None:
        sec[key + "Latin"] = lat
    return sec


CHANT_NOTE = (
    "The traditional plainchant setting for this point is not reproduced "
    "here (this site does not render musical notation) - the text above "
    "is complete and may be said or sung to any appropriate setting."
)


def ten_commandments():
    """Hand-verified against Mass.tex lines 38-105 (no blank lines
    between items in source, so the raw TEXT-block pass couldn't split
    it). Ten call/response pairs; the 2nd-6th and 10th have an extra
    ' for ...'/consequence clause folded into the same 'v' line (as
    printed - no separate section for it), and the final response
    differs from the other nine ('write all these thy laws in our
    hearts' instead of 'incline our hearts to keep this law')."""
    R = "Lord, have mercy upon us, and incline our hearts to keep this law."
    pairs = [
        "I am the Lord thy God; Thou shalt have none other gods but me.",
        "Thou shalt not make to thyself any graven image, nor the likeness of any thing that is in heaven above, or in the earth beneath, or in the water under the earth; thou shalt not bow down to them, nor worship them: for I the Lord thy God am a jealous God, and visit the sins of the fathers upon the children, unto the third and fourth generation of them that hate me; and show mercy unto thousands in them that love me and keep my commandments.",
        "Thou shalt not take the Name of the Lord thy God in vain; for the Lord will not hold him guiltless, that taketh his Name in vain.",
        "Remember that thou keep holy the Sabbath-day. Six days shalt thou labour, and do all that thou hast to do; but the seventh day is the Sabbath of the Lord thy God. In it thou shalt do no manner of work; thou, and thy son, and thy daughter, thy man-servant, and thy maid-servant, thy cattle, and the stranger that is within thy gates. For in six days the Lord made heaven and earth, the sea, and all that in them is, and rested the seventh day: wherefore the Lord blessed the seventh day, and hallowed it.",
        "Honour thy father and thy mother; that thy days may be long in the land which the Lord thy God giveth thee.",
        "Thou shalt do no murder.",
        "Thou shalt not commit adultery.",
        "Thou shalt not steal.",
        "Thou shalt not bear false witness against thy neighbour.",
        "Thou shalt not covet thy neighbour's house, thou shalt not covet thy neighbour's wife, nor his servant, nor his maid, nor his ox, nor his ass, nor any thing that is his.",
    ]
    out = [{"type": "text", "text": "God spake these words, and said:"}]
    for i, v in enumerate(pairs):
        r = "Lord, have mercy upon us, and write all these thy laws in our hearts, we beseech thee." if i == 9 else R
        out.append({"type": "versicle", "v": v, "r": r})
    return out


def deacon_priest_dialogue():
    """Hand-verified against Mass.tex lines 211-233 (\\paracol dual-column
    ALTERNATIVE, not a sequential exchange - left column is used if a
    Deacon is present, right column if the Priest celebrates alone)."""
    return [
        {"type": "rubric", "text": "If a Deacon is present:"},
        {"type": "text", "text": "Deacon. Bid, sir, a blessing.\nPriest. The Lord be in thy heart and on thy lips: that thou mayest worthily and fitly proclaim his Gospel: In the name of the Father, and of the Son, ✠ and of the Holy Ghost. Amen."},
        {"type": "rubric", "text": "If the Priest celebrates without a Deacon:"},
        {"type": "text", "text": "Priest. Bid, Lord, a blessing.\nPriest. The Lord be in my heart and on my lips: that I may worthily and fitly proclaim his Gospel."},
    ]


def canon_words_of_institution():
    """Hand-verified against Mass.tex lines 502-559."""
    return [
        {"type": "text", "dropcap": True, "text": "All glory be to thee, Almighty God, our heavenly Father, for that thou, of thy tender mercy, didst give thine only Son Jesus Christ to suffer death upon the Cross for our redemption; who (by his own oblation of himself once offered) made a full, perfect, and sufficient sacrifice, oblation, and satisfaction, for the sins of the whole world; and did institute, and in his holy Gospel command us to continue, a perpetual memory of that his precious death and sacrifice, until his coming again:"},
        {"type": "heading", "text": "Words of Institution"},
        {"type": "text", "dropcap": True, "text": "For in the night in which he was betrayed, (a) he took Bread; (b) and when he had given ✠ thanks, he brake it, and gave it to his disciples, saying, Take, eat, (c)\nThis is my Body, which is given for you; Do this in remembrance of me."},
        {"type": "rubric", "text": "Ceremonial notes: (a) He takes & holds the Bread. (b) He looks up to heaven & bows his head. (c) He holds the Bread between both of his thumbs & forefingers."},
        {"type": "rubric", "text": "Then shall the Priest immediately genuflect, briefly elevate the Bread for the People to see, replace it upon the Corporal (or Paten), genuflect again, and then immediately continue. Note, from henceforth, the Priest doth not disjoin his forefingers & thumbs until the ablutions."},
        {"type": "text", "text": "Likewise, after supper, (d) he took the Cup; (e) and when he had given ✠ thanks, he gave it to them, saying, Drink ye all of this; for (f)\nThis is my Blood of the New Testament, which is shed for you, and for many, for the remission of sins;"},
        {"type": "rubric", "text": "Ceremonial notes: (d) He uncovers the Cup, holds it with both hands, & bows his head. (e) He holds the Cup in his left hand. (f) He holds the Cup slightly raised."},
        {"type": "rubric", "text": "Then shall the Priest place the Cup back upon the Corporal and immediately say,"},
        {"type": "text", "text": "Do this, as oft as ye shall drink it, in remembrance of me."},
        {"type": "rubric", "text": "Then shall the Priest immediately genuflect, briefly elevate the Cup, replace the Cup upon the Corporal, cover it, genuflect again, and continue with hands extended."},
    ]


def canon_invocation_oblation():
    """Hand-verified against Mass.tex lines 559-656."""
    return [
        {"type": "heading", "text": "Recollection"},
        {"type": "text", "dropcap": True, "text": "Wherefore O Lord and heavenly Father, according to the institution of thy dearly beloved Son our Saviour Jesus Christ, we, thy humble servants, do celebrate and make here before thy Divine Majesty, with these thy holy ✠ gifts, which we now offer unto thee, the memorial thy Son hath commanded us to make; having in remembrance his blessed passion and precious death, his mighty resurrection and glorious ascension; rendering unto thee most hearty thanks for the innumerable benefits procured unto us by the same."},
        {"type": "heading", "text": "Invocation"},
        {"type": "rubric", "text": "Then shall the Priest uncover the Cup, bow profoundly, join his hands upon the Altar, and continue,"},
        {"type": "text", "dropcap": True, "text": "And we thine unworthy servants beseech thee, most merciful Father, to hear us, (g) and to send thy Holy Spirit upon us and upon the✠se thy gifts and creatures of Br✠ead and W✠ine, that, being blessed and hallowed by his life-giving power, they may become the Bo✠dy and Bl✠ood of thy most dearly beloved Son, to the end that all who shall receive the same may be sanctified both in body and soul, and preserved unto everlasting life."},
        {"type": "rubric", "text": "Ceremonial note: (g) He stands upright and imposes his hands over the Gifts."},
        {"type": "rubric", "text": "Then shall the Priest cover the Cup, genuflect, and continue, with hands extended,"},
        {"type": "text", "dropcap": True, "text": "And we earnestly desire thy fatherly goodness, mercifully to accept this our Sacrifice of Praise and Thanksgiving; most humbly beseeching thee to grant that, by the merits and death of thy Son Jesus Christ, and through faith in his Blood, we, and all thy whole Church, may obtain remission of our sins, and all other benefits of his Passion."},
        {"type": "heading", "text": "Commemoration for the Departed"},
        {"type": "text", "dropcap": True, "text": "Remember also, O Lord, thy servants and handmaids N. and N., who have gone before us with the sign of faith, and rest in the sleep of peace."},
        {"type": "rubric", "text": "Then shall the Priest join his hands, pray for the dead he hath in mind, then extend his hands and say,"},
        {"type": "text", "text": "To them, O Lord, and to all that rest in Christ, we beseech thee to grant a place of refreshing, light, and peace."},
        {"type": "heading", "text": "Oblation"},
        {"type": "text", "dropcap": True, "text": "And here we offer and present unto thee, O Lord, our selves, our souls and bodies, to be a reasonable, holy, and living sacrifice unto thee; humbly beseeching thee, (He kisses the Altar) that we, and all others who shall be partakers of this Holy Communion, may worthily receive the most precious Bo✠dy and Bl✠ood (h) of thy Son Jesus Christ, be filled with thy grace and heavenly benediction, and made one body with him, that he may dwell in us, and we in him."},
        {"type": "rubric", "text": "Ceremonial note: (h) After signing the Gifts, he signs himself."},
        {"type": "text", "dropcap": True, "text": "And although we are unworthy, through our manifold sins, to offer unto thee any sacrifice; yet we beseech thee to accept this our bounden duty and service; not weighing our merits, but pardoning our offences. (He joins his hands & bows his head profoundly.)"},
        {"type": "text", "dropcap": True, "text": "Through Jesus Christ our Lord; (i) by✠whom, and with wh✠om, in the unity of the Holy✠Ghost, (j) all ho✠nour and gl✠ory be unto thee,"},
        {"type": "rubric", "text": "Ceremonial notes: (i) He genuflects & makes the sign the Cross with the Host over the Cup thrice, from lip to lip. (j) He makes the sign of the Cross twice with the Host between the Cup & his breast."},
        {"type": "rubric", "text": "The Priest then uncovereth the Cup, elevateth the Host and Cup to the height of his breast then replacing them on the Altar, covereth the Cup, genuflecteth, then joineth his hands."},
        {"type": "rubric", "text": chant_note_for("the Priest's concluding doxology, sung or said in a raised voice")},
    ]


def chant_note_for(where):
    return "The traditional plainchant setting for %s is not reproduced here (this site does not render musical notation)." % where


# Paragraphs that DO open with a real drop cap (\lett{}) in the source -
# checked directly against Mass.tex; every other plain-prose TEXT block
# is a continuation/response and gets no dropcap. Matched by the first
# ~12 characters of the cleaned text (unique enough within this file).
DROPCAP_PREFIXES = [
    "Almighty God, unto whom",
    "Thou shalt love the Lord",
    "Take away from us",
    "We pray thee, O Lord, by",
    "Cleanse my heart and my lips",
    "Receive, O holy Father,",
    "O God, who didst wonderfully",
    "We offer unto thee, O Lord, the cup",
    "In a humble spirit,",
    "Come, O Sanctifier",
    "Through the intercession of blessed Michael",
    "May this incense",
    "Let my prayer, O Lord,",
    "The Lord kindle in us",
    "I will wash my hands",
    "Receive, O holy Trinity,",
    "Almighty and everliving God, who by thy holy Apostle",
    "We beseech thee also, so to direct",
    "Give grace, O heavenly Father,",
    "And to all thy People give",
    "And we most humbly beseech thee, of thy goodness",
    "And we also bless thy holy Name",
    "Our Father, who art in heaven",
    "Deliver us, O Lord, we beseech thee, from all evils",
    "May this commixture",
    "Almighty God, Father of our Lord Jesus Christ,",
    "Almighty God, our heavenly Father, who of his great mercy",
    "O Lord Jesu Christ, who saidst to thine Apostles",
    "We do not presume to come to this thy Table",
    "O Lord Jesu Christ, Son of the living God,",
    "Grant, O Lord, that what we have taken",
    "Let thy Body, O Lord, which I have taken",
    "Almighty and everliving God, we most heartily thank thee",
    "Let this my bounden duty and service",
    "The Peace of God, which passeth all understanding",
]


def is_dropcap(text):
    return any(text.startswith(p) for p in DROPCAP_PREFIXES)


def text_section(text, dropcap_hint=None):
    dc = is_dropcap(text) if dropcap_hint is None else dropcap_hint
    sec = {"type": "text", "text": text}
    if dc:
        sec = {"type": "text", "dropcap": True, "text": text}
    return sec


def main():
    raw = load_raw()
    sections = []

    i = 0
    n = len(raw)
    # Skip the two page-header-only TEXT lines at the very start
    # (\fancyhead.../\phantomsection.../\addcontentsline...) - print
    # layout only, not content.
    while i < n and raw[i][0] == "TEXT":
        i += 1

    in_canon = False  # True from the "Canon of the Mass" heading through Lord's Prayer

    while i < n:
        kind = raw[i][0]

        if kind == "HEADING":
            _, level, text = raw[i]
            sections.append({"type": "heading", "text": text})
            i += 1

            if text == "Canon of the Mass":
                in_canon = True
            elif text == "Lord's Prayer":
                in_canon = False

            # ---- Ten Commandments: replace the single giant TEXT blob ----
            if text == "Ten Commandments":
                assert raw[i][0] == "TEXT" and "God spake these words" in raw[i][1], raw[i]
                i += 1  # the "God spake..." announcement, already in ten_commandments()
                assert raw[i][0] == "TEXT" and raw[i][1].startswith("I am the Lord thy God"), raw[i]
                sections.extend(ten_commandments())
                i += 1
                continue
            continue

        if kind == "RUBRIC":
            _, env, text = raw[i]
            sections.append({"type": "rubric", "text": text})
            i += 1
            continue

        if kind == "ELCOL":
            _, eng, lat = raw[i]
            if eng.startswith("℣.") or eng.startswith("℟."):
                sections.append(elcol_to_versicle(eng, lat))
            else:
                sec = {"type": "collect", "text": eng}
                if lat:
                    sec["textLatin"] = lat
                if is_dropcap(eng):
                    sec["dropcap"] = True
                sections.append(sec)
            i += 1
            continue

        if kind == "TEXT":
            _, text = raw[i]

            # ---- Canon of the Mass: replace everything from "All glory
            # be to thee" through the end of Invocation/Oblation with the
            # hand-verified block, then skip forward past the raw
            # fragments (minipage noise, gregorioscore, etc.) until the
            # Lord's Prayer heading. ----
            if in_canon and text.startswith("All glory be to thee"):
                sections.extend(canon_words_of_institution())
                sections.extend(canon_invocation_oblation())
                while i < n and not (raw[i][0] == "HEADING" and raw[i][2] == "Lord's Prayer"):
                    i += 1
                continue

            # ---- Deacon/Priest paracol alternative (the blessing before
            # the Gospel) - a "if a Deacon is present / if the Priest
            # celebrates alone" pair, not sequential dialogue. ----
            if text == "\\begin{paracol}{2}":
                sections.extend(deacon_priest_dialogue())
                i += 1
                while i < n and raw[i][0] == "TEXT" and (
                    "\\begin{inhead}" in raw[i][1] or raw[i][1] in ("\\switchcolumn", "\\end{paracol}")
                ):
                    i += 1
                continue

            # ---- Skip pure layout/spacing noise with no content of its
            # own (\lettspace, bare minipage/figure/center wrappers that
            # already had their real text pulled out elsewhere, chant
            # notation, decorative images). ----
            stripped = text.strip()
            if stripped in ("\\lettspace",):
                i += 1
                continue
            if stripped.startswith("\\gregorioscore"):
                sections.append({"type": "rubric", "text": CHANT_NOTE})
                i += 1
                continue
            if stripped.startswith("\\begin{figure}"):
                i += 1
                continue

            # ---- \letuspray prints a small centered "Let us pray." line
            # right before the prayer that follows it, in the same spot
            # a rubric would normally introduce a prayer elsewhere in
            # this file - split it out the same way. ----
            if text.startswith("\\letuspray"):
                sections.append({"type": "rubric", "text": "Let us pray."})
                text = text[len("\\letuspray"):].lstrip("\n").lstrip()

            sections.append(text_section(text))
            i += 1
            continue

        raise AssertionError("unexpected kind %r at %d" % (kind, i))

    data = {
        "title": "The Ordinary of the Mass",
        "source": (
            "Transcribed from pages/HolyMass/Mass.tex. Covers the fixed "
            "Ordinary (everything that doesn't change day to day) - the "
            "variable Propers (Introit, Collect, Epistle, Gospel, "
            "Offertory/Communion antiphons) are noted with a rubric "
            "where they occur but aren't provided by this page; see "
            "ROADMAP.md."
        ),
        "sections": sections,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=None)
    print("wrote", len(sections), "sections to", OUT)


if __name__ == "__main__":
    main()
