// scripture.js — resolves the Lectionary's citation strings (e.g.
// "1 Chron 23:1-6,24-end", "Is 52:13-53:end", "Lk 15") against the KJV
// text in window.KJV_DATA, for the lesson1/lesson2 office placeholders.
//
// GRAMMAR (reverse-engineered from all 1406 unique citations in
// data/lectionary-temporale.json — see scripts/survey_citations.py-style
// exploration in project history):
//
//   citation := BOOK " " body
//   body     := segment (sep segment)*
//   sep      := "," | ";" | "&"
//
// Each segment is one of:
//   "C"            whole chapter C                      (only legal when
//                                                          starting a NEW
//                                                          context: body-
//                                                          initial, or
//                                                          right after a
//                                                          ";"/"&" sep)
//   "C:V"          chapter C, verse V through the chapter's last verse
//                  (new-context only; see below - a comma-continuation
//                   "V" alone is a single, literal verse instead)
//   "C:V-V2"       chapter C, verses V..V2
//   "C:V-end"      chapter C, verse V to the chapter's last verse
//   "C-C2"         whole chapters C..C2                 (new-context only)
//   "C-C2:V2"      chapter C in full, then C2 through verse V2 (new-ctx)
//   "C-C2:end"     chapters C..C2, both in full           (new-ctx only)
//   "C:V-C2:V2"    cross-chapter verse range
//   "C:V-C2:end"   cross-chapter, ending at C2's last verse
//   "V" / "V-V2" / "V-end"   (comma-continuation only) verse(s) within
//                             the *current* chapter, i.e. the chapter
//                             last referenced by the previous segment.
//                             A bare "V" here (no colon) is a single,
//                             literal verse - see the "C:V" note above.
//
// A "," continues the current chapter context (a bare number after a
// comma is a verse, not a chapter). A ";" or "&" starts a fresh,
// independent context (a bare number there is a whole chapter number).
// This distinction is confirmed by "Num 26:1-4,52-56,63-end; 27:12"
// (comma-continuations stay in ch.26; the "; 27:12" jumps to ch.27) and
// by "Zech 11 & 13:7-end" (both sides are whole/explicit chapters).
//
// "C:V" with no dash - a chapter:verse pair and nothing else - is the
// printed table's own convention for "from here to the end of the
// chapter", not an isolated single verse: e.g. "Gn 28:10" (Epiphany I
// Mattins Lesson 1) reads as the whole Bethel-ladder narrative through
// Gn 28:end, and "; 27:12" above reads Numbers 27:12-23 (Joshua's
// commissioning), not verse 12 alone. This applies only when "C:V" is
// starting a fresh context (isNewContext - see parseSegment) - a bare
// verse number reached via a *comma*-continuation (no colon, no
// chapter of its own) keeps its old, literal single-verse meaning,
// since those are genuinely separate short citations deliberately
// paired with a neighboring range (e.g. "1 Sam 2:1-11,26" - Hannah's
// Song plus the standalone note of v.26 about the child Samuel, not
// "verse 26 through the end of the chapter", which would instead run
// into the unrelated Eli's-sons subplot through v.36).
//
// Verse-number letter suffixes (10-11a, 15b-23) mark a half-verse split
// that the source text doesn't carry at that granularity; the letter is
// dropped and the whole verse is included. This is a documented,
// deliberate approximation — see ROADMAP.md.
//
// "end" as a range terminus means "through the last verse of that
// chapter", resolved by counting verses in window.KJV_DATA.
//
// A handful of books cited by this lectionary (Apocrypha: 1/2 Maccabees,
// Baruch, Ecclesiasticus, Tobit, Wisdom, 2 Esdras, Prayer of Manasses)
// are not part of the KJV protocanon dataset this site uses and cannot
// be resolved to text; resolveCitation() returns a clear
// { ok: false, reason: "apocrypha" } for these rather than pretending.

(function (global) {
  "use strict";

  // Canonical KJV book name -> alias tokens seen in the Lectionary.
  // (Keys must exactly match window.KJV_DATA's book keys.)
  const BOOK_ALIASES = {
    "Genesis": ["Gn", "Gen"],
    "Exodus": ["Ex", "Exod"],
    "Leviticus": ["Lev"],
    "Numbers": ["Num"],
    "Deuteronomy": ["Dt", "Deut"],
    "Joshua": ["Josh", "Joshua"],
    "Judges": ["Jdgs", "Judg"],
    "Ruth": ["Ruth"],
    "1 Samuel": ["1 Sam"],
    "2 Samuel": ["2 Sam"],
    "1 Kings": ["1 Kgs"],
    "2 Kings": ["2 Kgs"],
    "1 Chronicles": ["1 Chron"],
    "2 Chronicles": ["2 Chron"],
    "Ezra": ["Ezra"],
    "Nehemiah": ["Neh"],
    "Esther": ["Est"],
    "Job": ["Job"],
    "Psalms": ["Ps", "Psalm", "Psalms"],
    "Proverbs": ["Prv", "Prov"],
    "Ecclesiastes": ["Eccles", "Eccl"],
    "Song of Solomon": ["Song", "Cant"],
    "Isaiah": ["Is", "Isa"],
    "Jeremiah": ["Jer"],
    "Lamentations": ["Lam"],
    "Ezekiel": ["Ezek"],
    "Daniel": ["Dan"],
    "Hosea": ["Hos"],
    "Joel": ["Joel"],
    "Amos": ["Amos"],
    "Obadiah": ["Obadiah", "Obad"],
    "Jonah": ["Jonah"],
    "Micah": ["Mic"],
    "Nahum": ["Nah"],
    "Habakkuk": ["Hab"],
    "Zephaniah": ["Zeph"],
    "Haggai": ["Haggai", "Hag"],
    "Zechariah": ["Zech"],
    "Malachi": ["Mal"],
    "Matthew": ["Matt", "Mt"],
    "Mark": ["Mk", "Mark"],
    "Luke": ["Lk"],
    "John": ["Jn"],
    "Acts": ["Acts"],
    "Romans": ["Rom"],
    "1 Corinthians": ["1 Cor"],
    "2 Corinthians": ["2 Cor"],
    "Galatians": ["Gal"],
    "Ephesians": ["Eph"],
    "Philippians": ["Phil"],
    "Colossians": ["Col"],
    "1 Thessalonians": ["1 Thess"],
    "2 Thessalonians": ["2 Thess"],
    "1 Timothy": ["1 Tim"],
    "2 Timothy": ["2 Tim"],
    "Titus": ["Titus"],
    "Philemon": ["Philemon", "Phlm"],
    "Hebrews": ["Heb"],
    "James": ["Jas"],
    "1 Peter": ["1 Pet"],
    "2 Peter": ["2 Pet"],
    "1 John": ["1 Jn"],
    "2 John": ["2 Jn"],
    "3 John": ["3 Jn"],
    "Jude": ["Jude"],
    "Revelation": ["Rev"],
  };

  // Apocryphal/deuterocanonical books this Lectionary cites, which have
  // no entry in window.KJV_DATA (a protocanon-only KJV dataset).
  const APOCRYPHA_ALIASES = {
    "1 Maccabees": ["1 Macc"],
    "2 Maccabees": ["2 Macc"],
    "Baruch": ["Bar"],
    "Ecclesiasticus": ["Ecclus", "Sir"],
    "Tobit": ["Tob"],
    "Wisdom of Solomon": ["Wis"],
    "2 Esdras": ["2 Esd"],
    "Prayer of Manasses": ["Prayer of Manasses"],
  };

  // Full 1611 King James Bible running-header titles, keyed by the same
  // canonical book name BOOK_ALIASES/resolveCitation already use (e.g.
  // "1 Samuel", not the printed citation's own abbreviation "1 Sam").
  // Stored WITHOUT a leading article ("First Book of Samuel", not "The
  // First Book of Samuel") since every use of this table so far is
  // mid-sentence after "of" ("Here beginneth the Twentieth Chapter of
  // the First Book of Samuel") - callers that want it standalone should
  // prepend "The " themselves. Per Augustine's 8/26 review ("the full
  // title of the book, as in the 1611 King James Bible should be used"),
  // matching his own example ("It should be of the first book of
  // Samuel") - the archaic double subtitles some historic printings
  // carry (e.g. "...otherwise called, The First Book of the Kings") are
  // intentionally omitted here, since Augustine's own correction only
  // asked for the primary title, and every standard modern KJV printing's
  // running header agrees.
  const BOOK_FULL_TITLES = {
    "Genesis": "First Book of Moses, called Genesis",
    "Exodus": "Second Book of Moses, called Exodus",
    "Leviticus": "Third Book of Moses, called Leviticus",
    "Numbers": "Fourth Book of Moses, called Numbers",
    "Deuteronomy": "Fifth Book of Moses, called Deuteronomy",
    "Joshua": "Book of Joshua",
    "Judges": "Book of Judges",
    "Ruth": "Book of Ruth",
    "1 Samuel": "First Book of Samuel",
    "2 Samuel": "Second Book of Samuel",
    "1 Kings": "First Book of the Kings",
    "2 Kings": "Second Book of the Kings",
    "1 Chronicles": "First Book of the Chronicles",
    "2 Chronicles": "Second Book of the Chronicles",
    "Ezra": "Book of Ezra",
    "Nehemiah": "Book of Nehemiah",
    "Esther": "Book of Esther",
    "Job": "Book of Job",
    "Psalms": "Book of Psalms",
    "Proverbs": "Proverbs",
    "Ecclesiastes": "Ecclesiastes, or, The Preacher",
    "Song of Solomon": "Song of Solomon",
    "Isaiah": "Book of the Prophet Isaiah",
    "Jeremiah": "Book of the Prophet Jeremiah",
    "Lamentations": "Lamentations of Jeremiah",
    "Ezekiel": "Book of the Prophet Ezekiel",
    "Daniel": "Book of Daniel",
    "Hosea": "Prophet Hosea",
    "Joel": "Prophet Joel",
    "Amos": "Prophet Amos",
    "Obadiah": "Prophet Obadiah",
    "Jonah": "Prophet Jonah",
    "Micah": "Prophet Micah",
    "Nahum": "Prophet Nahum",
    "Habakkuk": "Prophet Habakkuk",
    "Zephaniah": "Prophet Zephaniah",
    "Haggai": "Prophet Haggai",
    "Zechariah": "Prophet Zechariah",
    "Malachi": "Prophet Malachi",
    "Matthew": "Gospel according to Saint Matthew",
    "Mark": "Gospel according to Saint Mark",
    "Luke": "Gospel according to Saint Luke",
    "John": "Gospel according to Saint John",
    "Acts": "Acts of the Apostles",
    "Romans": "Epistle of Paul the Apostle to the Romans",
    "1 Corinthians": "First Epistle of Paul the Apostle to the Corinthians",
    "2 Corinthians": "Second Epistle of Paul the Apostle to the Corinthians",
    "Galatians": "Epistle of Paul the Apostle to the Galatians",
    "Ephesians": "Epistle of Paul the Apostle to the Ephesians",
    "Philippians": "Epistle of Paul the Apostle to the Philippians",
    "Colossians": "Epistle of Paul the Apostle to the Colossians",
    "1 Thessalonians": "First Epistle of Paul the Apostle to the Thessalonians",
    "2 Thessalonians": "Second Epistle of Paul the Apostle to the Thessalonians",
    "1 Timothy": "First Epistle of Paul the Apostle to Timothy",
    "2 Timothy": "Second Epistle of Paul the Apostle to Timothy",
    "Titus": "Epistle of Paul the Apostle to Titus",
    "Philemon": "Epistle of Paul the Apostle to Philemon",
    "Hebrews": "Epistle of Paul the Apostle to the Hebrews",
    "James": "General Epistle of James",
    "1 Peter": "First Epistle General of Peter",
    "2 Peter": "Second Epistle General of Peter",
    "1 John": "First Epistle General of John",
    "2 John": "Second Epistle of John",
    "3 John": "Third Epistle of John",
    "Jude": "General Epistle of Jude",
    "Revelation": "Revelation of Saint John the Divine",
    // Apocrypha/deuterocanonical titles the Mass Epistle citations cite
    // (see app.js's epistleOfDay placeholder) - keyed by the exact
    // spelling those citations already use in collects-temporale.json/
    // collects-sanctorale.json ("Ecclesiasticus", "Wisdom", "Song of
    // Songs", "Judith", "Tobit"), not APOCRYPHA_ALIASES' own canonical
    // spelling ("Wisdom of Solomon") - the Epistle intro doesn't route
    // through resolveCitation's alias resolution at all (its text is
    // pre-transcribed directly onto the winning Mass Propers entry, not
    // looked up from KJV/Apocrypha data verse-by-verse), so this table
    // is looked up by the citation's own literal book text.
    "Ecclesiasticus": "Book of Ecclesiasticus",
    "Wisdom": "Book of Wisdom",
    "Song of Songs": "Song of Songs",
    "Judith": "Book of Judith",
    "Tobit": "Book of Tobit",
  };

  const ALIAS_TO_BOOK = {};
  for (const [book, aliases] of Object.entries(BOOK_ALIASES)) {
    for (const a of aliases) ALIAS_TO_BOOK[a] = book;
  }
  const ALIAS_TO_APOCRYPHA = {};
  for (const [book, aliases] of Object.entries(APOCRYPHA_ALIASES)) {
    for (const a of aliases) ALIAS_TO_APOCRYPHA[a] = book;
  }
  // Longest-alias-first so "2 Sam" doesn't get shadowed by shorter partials.
  const ALL_ALIASES = Object.keys(ALIAS_TO_BOOK)
    .concat(Object.keys(ALIAS_TO_APOCRYPHA))
    .sort((a, b) => b.length - a.length);

  function splitBookAndBody(citation) {
    const trimmed = citation.trim();
    for (const alias of ALL_ALIASES) {
      if (trimmed === alias) {
        return { alias, body: "" };
      }
      if (trimmed.startsWith(alias + " ")) {
        return { alias, body: trimmed.slice(alias.length).trim() };
      }
    }
    return null;
  }

  function stripVerseLetter(tok) {
    // "27a", "15b", "11a" -> "27" / "15" / "11" (see module doc comment)
    return tok.replace(/^(\d+)[a-c]$/, "$1");
  }

  function stripBrackets(s) {
    // "13[:1-38]" -> "13:1-38"
    return s.replace(/\[/g, "").replace(/\]/g, "");
  }

  // Parse one segment given whether it's a "new context" (body-initial,
  // or after ; / &) or a "continuation" (after ,), and the current
  // chapter (used by continuations, and updated by whichever segment
  // type is parsed). Returns { chapter, verseStart, verseEnd, endChapter }
  // where verseStart/verseEnd are numbers or "end"/1 sentinels resolved
  // later against the actual chapter, and endChapter is set only for
  // cross-chapter ranges (verseEnd belongs to endChapter, not chapter).
  function parseSegment(raw, currentChapter, isNewContext) {
    let s = stripBrackets(raw.trim());
    if (!s) return null;

    // cross-chapter range: "C:V-C2:V2" or "C:V-C2:end"
    let m = s.match(/^(\d+):(\d+[a-c]?)-(\d+):(\d+[a-c]?|end)$/i);
    if (m) {
      return {
        chapter: parseInt(m[1], 10),
        verseStart: parseInt(stripVerseLetter(m[2]), 10),
        endChapter: parseInt(m[3], 10),
        verseEnd: m[4].toLowerCase() === "end" ? "end" : parseInt(stripVerseLetter(m[4]), 10),
      };
    }

    // chapter range with explicit end verse, no start verse: "C-C2:V2" or "C-C2:end"
    if (isNewContext) {
      m = s.match(/^(\d+)-(\d+):(\d+[a-c]?|end)$/i);
      if (m) {
        return {
          chapter: parseInt(m[1], 10),
          verseStart: 1,
          endChapter: parseInt(m[2], 10),
          verseEnd: m[3].toLowerCase() === "end" ? "end" : parseInt(stripVerseLetter(m[3]), 10),
        };
      }
      // whole chapter range: "C-C2"
      m = s.match(/^(\d+)-(\d+)$/);
      if (m) {
        return {
          chapter: parseInt(m[1], 10),
          verseStart: 1,
          endChapter: parseInt(m[2], 10),
          verseEnd: "end",
        };
      }
      // whole single chapter: "C"
      m = s.match(/^(\d+)$/);
      if (m) {
        return { chapter: parseInt(m[1], 10), verseStart: 1, verseEnd: "end" };
      }
    }

    // same-chapter range: "C:V-V2" or "C:V-end"
    m = s.match(/^(\d+):(\d+[a-c]?)-(\d+[a-c]?|end)$/i);
    if (m) {
      return {
        chapter: parseInt(m[1], 10),
        verseStart: parseInt(stripVerseLetter(m[2]), 10),
        verseEnd: m[3].toLowerCase() === "end" ? "end" : parseInt(stripVerseLetter(m[3]), 10),
      };
    }

    // single starting verse, no dash: "C:V". In the printed Lectionary
    // (see pages/Lectionary/Lectionary.tex) this is the table's own
    // shorthand for "from this verse through the end of the chapter" -
    // not an isolated one-verse reading - confirmed against real rows:
    // "Gn 28:10" (Epiphany I Mattins Lesson 1, the whole Bethel-ladder
    // narrative through Gn 28:end), "Jdgs 16:21" (Samson's death, Jdgs
    // 16:21-31), "Mk 1:21" (the Capernaum day, Mk 1:21-45) - every case
    // like this reads as one complete pericope ending at the chapter's
    // close, never as a single disconnected verse. This only applies
    // when starting a *fresh* context (isNewContext): a bare verse
    // after a *comma*, sharing an already-established chapter, is a
    // genuinely separate short citation deliberately paired with its
    // neighbor (e.g. "1 Sam 2:1-11,26" - Hannah's Song plus the
    // standalone note of v.26 about the child Samuel - reading "26" to
    // the chapter's end would instead run into the unrelated Eli's-sons
    // subplot through v.36) and keeps the old, literal single-verse
    // meaning - see the continuation-only bare-verse branch below.
    m = s.match(/^(\d+):(\d+[a-c]?)$/i);
    if (m) {
      const v = parseInt(stripVerseLetter(m[2]), 10);
      return { chapter: parseInt(m[1], 10), verseStart: v, verseEnd: isNewContext ? "end" : v };
    }

    if (!isNewContext && currentChapter != null) {
      // continuation that crosses into a new chapter: "V-C2:V2" or
      // "V-C2:end" — verse V of the *current* chapter through an
      // explicit later chapter/verse (e.g. "Heb 11:1-3,17-12:2": the
      // second segment "17-12:2" means ch.11 v.17 through ch.12 v.2).
      m = s.match(/^(\d+[a-c]?)-(\d+):(\d+[a-c]?|end)$/i);
      if (m) {
        return {
          chapter: currentChapter,
          verseStart: parseInt(stripVerseLetter(m[1]), 10),
          endChapter: parseInt(m[2], 10),
          verseEnd: m[3].toLowerCase() === "end" ? "end" : parseInt(stripVerseLetter(m[3]), 10),
        };
      }
      // continuation, verse(s) only, inheriting currentChapter
      m = s.match(/^(\d+[a-c]?)-(\d+[a-c]?|end)$/i);
      if (m) {
        return {
          chapter: currentChapter,
          verseStart: parseInt(stripVerseLetter(m[1]), 10),
          verseEnd: m[2].toLowerCase() === "end" ? "end" : parseInt(stripVerseLetter(m[2]), 10),
        };
      }
      m = s.match(/^(\d+[a-c]?)$/i);
      if (m) {
        const v = parseInt(stripVerseLetter(m[1]), 10);
        return { chapter: currentChapter, verseStart: v, verseEnd: v };
      }
    }

    return null; // unrecognized shape
  }

  // Parses a full citation string (without the book name) into an
  // ordered list of segments as described above. Returns null if any
  // segment fails to parse.
  function parseBody(body) {
    if (!body) return null;
    // Split on top-level , ; & (none of these ever appear elsewhere in
    // a citation body).
    const parts = body.split(/\s*([,;&])\s*/).filter((x) => x !== "");
    // parts alternates: segmentText, sep, segmentText, sep, ...
    const segments = [];
    let currentChapter = null;
    let isNewContext = true;
    for (let i = 0; i < parts.length; i += 2) {
      const raw = parts[i];
      const seg = parseSegment(raw, currentChapter, isNewContext);
      if (!seg) return null;
      segments.push(seg);
      currentChapter = seg.endChapter != null ? seg.endChapter : seg.chapter;
      const sep = parts[i + 1];
      isNewContext = sep === ";" || sep === "&" || sep === undefined ? true : false;
    }
    return segments;
  }

  function chapterVerseCount(kjvData, book, chapter) {
    const chapterData = kjvData[book] && kjvData[book][String(chapter)];
    if (!chapterData) return 0;
    return Object.keys(chapterData).length;
  }

  // The raw KJV/Apocrypha source text (data/kjv.json, data/apocrypha.json)
  // carries the translators' own inline markup: {word} for a supplied
  // word with no equivalent in the original languages (traditionally
  // printed in italics - kept here as plain text, since this site has no
  // italic-run convention for mid-sentence single words), and
  // {word: note} / {phrase: or, alternate} for a marginal cross-reference
  // or alternate-reading footnote (dropped entirely - this prototype has
  // no margin/footnote apparatus to display them in). Distinguishing the
  // two is exactly a colon inside the braces: {is} has none (supplied
  // word), {shew...: Heb. uncover mine ear} does (footnote). Confirmed
  // and flagged during the Old Testament Odes work (8/25, cleaned by hand
  // there at data-authoring time) and confirmed again as a real,
  // user-facing issue by Augustine's 8/26 review ("it has these textual
  // notes... you just need to have your program notice what a footnote
  // is... and omit it") - this is the site-wide fix for the live
  // Daily-Office-Lesson rendering path this function feeds, previously
  // left as a documented, out-of-scope gap.
  function stripKjvMarkup(text) {
    if (!text) return text;
    return text
      .replace(/\{[^{}]*:[^{}]*\}/g, "")
      .replace(/\{([^{}]*)\}/g, "$1")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/ +([.,;:!?])/g, "$1")
      .trim();
  }

  function getVerseText(kjvData, book, chapter, verse) {
    const chapterData = kjvData[book] && kjvData[book][String(chapter)];
    if (!chapterData) return null;
    const raw = chapterData[String(verse)];
    return raw ? stripKjvMarkup(raw) : null;
  }

  // Resolves one already-parsed segment into an ordered list of
  // { chapter, verse, text } entries.
  function resolveSegment(kjvData, book, seg) {
    const out = [];
    const startChapter = seg.chapter;
    const endChapter = seg.endChapter != null ? seg.endChapter : seg.chapter;
    for (let ch = startChapter; ch <= endChapter; ch++) {
      const lastVerse = chapterVerseCount(kjvData, book, ch);
      if (lastVerse === 0) return null; // chapter doesn't exist in dataset
      let vStart = ch === startChapter ? seg.verseStart : 1;
      let vEnd = ch === endChapter ? (seg.verseEnd === "end" ? lastVerse : seg.verseEnd) : lastVerse;
      if (typeof vStart !== "number" || typeof vEnd !== "number" || vStart > vEnd) return null;
      for (let v = vStart; v <= vEnd; v++) {
        const text = getVerseText(kjvData, book, ch, v);
        if (text == null) return null;
        out.push({ chapter: ch, verse: v, text });
      }
    }
    return out;
  }

  // Public entry point. citation: raw string from lectionary-temporale.json.
  // kjvData: window.KJV_DATA (protocanon). apocryphaData: window.APOCRYPHA_DATA
  // (optional - only specific chapters this Lectionary actually cites
  // are present, not whole books; see data/apocrypha.json and
  // scripts/README notes in ROADMAP.md). Returns:
  //   { ok: true, book, verses: [{chapter, verse, text}, ...] }
  //   { ok: false, reason: "apocrypha", book }  - a real Apocrypha
  //     citation this prototype either doesn't have text for at all, or
  //     doesn't have *this particular chapter* of (only cited chapters
  //     were sourced, not whole books).
  //   { ok: false, reason: "unparsed" }
  //   { ok: false, reason: "unresolved", book }
  function resolveCitation(citation, kjvData, apocryphaData) {
    apocryphaData = apocryphaData || {};
    if (!citation || typeof citation !== "string") {
      return { ok: false, reason: "unparsed" };
    }
    const split = splitBookAndBody(citation);
    if (!split) return { ok: false, reason: "unparsed" };

    const isApocryphal = !!ALIAS_TO_APOCRYPHA[split.alias];
    const book = isApocryphal ? ALIAS_TO_APOCRYPHA[split.alias] : ALIAS_TO_BOOK[split.alias];
    if (!book) return { ok: false, reason: "unparsed" };
    const dataSource = isApocryphal ? apocryphaData : kjvData;
    const fail = (reason, b) => ({ ok: false, reason: isApocryphal ? "apocrypha" : reason, book: b !== undefined ? b : book });

    if (!split.body) {
      // Bare book name with no chapter (e.g. "Jude", "Prayer of
      // Manasses" - genuinely one-chapter books cited by book alone).
      const lastVerse = chapterVerseCount(dataSource, book, 1);
      if (lastVerse === 0) return fail("unresolved");
      const verses = [];
      for (let v = 1; v <= lastVerse; v++) {
        const text = getVerseText(dataSource, book, 1, v);
        if (text == null) return fail("unresolved");
        verses.push({ chapter: 1, verse: v, text });
      }
      return { ok: true, book, alias: split.alias, verses };
    }

    const segments = parseBody(split.body);
    if (!segments) return { ok: false, reason: "unparsed", book };

    // Esther chapters 11-16 (Vulgate/Apocrypha numbering) are the
    // deuterocanonical "Additions to Esther" - stored separately in
    // apocryphaData under "Esther (Additions)", using the same chapter
    // numbers as the citation itself (13, 14, 16...), since
    // protocanonical Esther (in kjvData) only runs to chapter 10.
    if (book === "Esther" && segments.some((seg) => seg.chapter > 10 || (seg.endChapter && seg.endChapter > 10))) {
      const allVerses = [];
      for (const seg of segments) {
        const resolved = resolveSegment(apocryphaData, "Esther (Additions)", seg);
        if (!resolved) return { ok: false, reason: "apocrypha", book: "Esther (Additions)" };
        allVerses.push(...resolved);
      }
      if (allVerses.length === 0) return { ok: false, reason: "apocrypha", book: "Esther (Additions)" };
      return { ok: true, book: "Esther (Additions)", alias: split.alias, verses: allVerses };
    }

    const allVerses = [];
    for (const seg of segments) {
      const resolved = resolveSegment(dataSource, book, seg);
      if (!resolved) return fail("unresolved");
      allVerses.push(...resolved);
    }
    if (allVerses.length === 0) return fail("unresolved");
    return { ok: true, book, alias: split.alias, verses: allVerses };
  }

  const api = { resolveCitation, BOOK_ALIASES, APOCRYPHA_ALIASES, BOOK_FULL_TITLES };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.Scripture = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
