// ranking.js — a deliberately partial implementation of
// pages/Front/Ranking.tex, scoped to the one question the site
// actually needs answered: on a date where both a Temporale (season)
// Collect and a Sanctorale (fixed-feast) Collect exist, which one is
// prayed, and is the other one commemorated?
//
// What this DOES implement, from Ranking.tex:
//   - The Feast Day rank ladder (1st Double > 2nd Double > Greater
//     Double > Double > Semidouble > Memorial > Simple).
//   - First Class Sundays (give place to no Feast).
//   - Second Class Sundays (give place only to a 1st Double).
//   - "All Other Sundays" (give place to a 1st or 2nd Double).
//   - First Class Ferias (Ash Wednesday, Holy Mon/Tue, Spy Wednesday -
//     no Feast Day may be celebrated at all), extended here to the
//     Triduum (Maundy Thursday - Easter Even) on the same reasoning,
//     since those days are sui generis and certainly outrank any Feast,
//     even though Ranking.tex's First Class Feria list doesn't name
//     them explicitly.
//   - Second Class Ferias (Ember Days, Rogation Monday, Lent & Passion
//     Week weekdays - only a 1st or 2nd Double may be kept).
//   - The privileged start of the Easter and Whitsun Octaves (the Feast
//     Day and its first 2 days - Easter Day/Monday/Tuesday, Whitsunday/
//     Whit-Monday/Tuesday) - "Feast Days cannot outrank the Days within
//     the Octave," with zero commemoration on exactly these 3 days
//     ("except on the Feast Day and the two following days").
//   - Plain Ferias (an ordinary weekday gives way to a Feast Day of
//     Simple rank or higher, but a mere Memorial is commemorated, not
//     celebrated in full).
//
//   - Octave-day-by-day rank shifts for *Common* Octaves specifically
//     (a Double occurring *within* a Common Octave, rather than being
//     the Octave's start/end) - see findCommonOctaveOrigin below, used
//     by app.js's collectOfDay to both (a) treat a "quiet" Octave day
//     with no competing feast of its own as if it were a Semidouble
//     Sanctorale entry borrowing the origin feast's Collect, and (b)
//     commemorate the Octave when a competing Double does win outright.
//   - Octave-day-by-day rank shifts for all three orders of *Privileged*
//     Octave too - see PRIVILEGED_OCTAVE_1ST/2ND/3RD_KEYS below. First
//     Order (Easter, Whitsun): the rest of the Octave past the 3 days
//     above, including the Octave Day, still can't be outranked, but
//     does get its loser commemorated (or transferred, for a I/II
//     Double - see requiresTransfer). Second Order (Epiphany, Corpus
//     Christi): outranked only by a I Double. Third Order (Christmas,
//     Ascension): outranked by anything Semidouble or higher, with a
//     stricter I/II-Double-only threshold on Ascension's own Octave Day
//     specifically. Verified across 2000-2100 against every one of this
//     Kalendar's 39 Sanctorale Collects (all 2nd Double or higher): 333
//     real collisions with the four moveable Privileged Octaves (Easter
//     113, Corpus Christi 129, Whitsun 65, Ascension 26) - this was
//     genuinely live, not just future-proofing (an earlier, unverified
//     assumption that it was a no-op turned out to be wrong for these
//     four; it's still accurate for the two fixed-date Privileged
//     Octaves, Christmas and Epiphany - see the comments by their key
//     sets below for why). Finding this also surfaced a standalone bug:
//     Corpus Christi (Trinity Sunday + 4) had no anchor at all in
//     calendar.js's buildAnchorList, so any date on or after it silently
//     resolved to nothing - fixed alongside this.
//   - Transferring a fixed I/II Double Feast Day to the next unhindered
//     day when it's hard-blocked on its own calendar date (a First
//     Class Sunday, First Class Feria/Triduum day, or anywhere within a
//     First Order Privileged Octave - Ranking.tex: "A I or II Double
//     Feast Day falling on a Sunday of the First Class is transferred to
//     the first unhindered day" / "A I or II Double is transferred to
//     the first unhindered day after the Octave"). `requiresTransfer`
//     below flags every classification/tier combination this applies
//     to; the actual date-walking search lives in app.js's
//     findTransferredFeast, since it needs resolveLiturgicalDay/the
//     Kalendar data this module doesn't have access to. Verified against
//     every year 2000-2100 on this site's real Orthodox-Paschal computus:
//     the three fixed Doubles that can land in the Lent/Passiontide/Holy
//     Week band (St. Joseph, St. Benedict, the Annunciation) resolve
//     within 1-3 days as before, and every Easter/Whitsun-Octave
//     collision (the 113+65 counted above) resolves to a transfer target
//     within a few days after the Octave ends. See "Known limitations"
//     in ROADMAP.md for what this simple version doesn't try to resolve
//     (two transferred feasts colliding on the same destination day).
//   - Privileged and Common Vigils - see classifyVigil below. Detected
//     directly off each Vigil's own `rank` string in data/kalendar.json
//     ("1st Vigil"/"2nd Vigil"/"Vigil") rather than a hand-built
//     periodKey/dayLabel set, except for Whitsun Even (the one
//     Privileged Vigil that's a moveable date with no Kalendar entry of
//     its own). Genuinely inert with this site's current data, in both
//     directions: no Vigil date has its own Sanctorale Collect, and none
//     collides with a different fixed feast's Collect either - every
//     Sanctorale Collect in this Kalendar is 2nd Double or higher, and
//     no Vigil date matches any of their 39 fixed dates.
//
// What this deliberately DOES NOT implement (see ROADMAP.md):
//   - Octave-day-by-day rank shifts for Simple Octaves, or for the
//     Christmas/Epiphany Privileged Octaves specifically (both fixed-
//     date, and both genuinely inert with this Kalendar's data - see the
//     comments by PRIVILEGED_OCTAVE_2ND/3RD_KEYS below). Simple Octaves
//     are explicitly "not commemorated" per Ranking.tex, so there's
//     nothing to synthesize there regardless.
//   - First/Second Evensong overlap rules - the source document itself
//     leaves this commented out and unfinished (see the bottom of
//     Ranking.tex), so there's no rubric here to implement yet.
// Treat this as "usually right," like liturgical-color.js - a future
// fixed feast added at a lower rank, or one landing during a Christmas/
// Epiphany Octave, could still expose a gap the above doesn't cover.

(function (global) {
  "use strict";

  // Descending priority within the four "Double" sub-ranks (1st Double >
  // 2nd Double > Greater Double > Double) was an assumed reading before -
  // standard practice, but not spelled out verbatim anywhere in
  // Ranking.tex's own prose. Put to Augustine directly; his answer
  // confirms this exact order. Referenced below wherever a rule's own
  // wording just says "a Double Feast" (any of these four - tier >= 4)
  // versus specifically "a Double of the I or II Class" (only the top
  // two - tier >= 6).
  const RANK_TIER = {
    "1st Double": 7,
    "2nd Double": 6,
    "Greater Double": 5,
    "Double": 4,
    "Semidouble": 3,
    "Memorial": 2,
    "Simple": 1,
  };

  // "Easter I" (Low Sunday) sits at a genuine conflict between two rules:
  // it's both the Octave Day of the Easter Octave (which would only
  // commemorate/transfer a losing Feast, not drop it outright) AND a
  // Sunday, which is First Class Sunday-strength in its own right. Asked
  // Augustine directly which governs; his answer: "the higher rank gets
  // priority, so treat it as a First Class Sunday, not an Octave Day" -
  // i.e. Sunday-strength outranks Octave-Day-strength here, so Low
  // Sunday gives place to no Feast at all, the same as every other First
  // Class Sunday (a documented flip from an earlier version of this file,
  // which read it the other way - see PRIVILEGED_OCTAVE_1ST_KEYS below,
  // which no longer covers it).
  const FIRST_CLASS_SUNDAY_PERIODS = new Set([
    "Advent I", "Lent I", "Lent II", "Lent III", "Lent IV",
    "Passion Sunday", "Palm Sunday", "Easter Day", "Easter I", "Whitsunday",
  ]);

  const SECOND_CLASS_SUNDAY_PERIODS = new Set([
    "Advent II", "Advent III", "Advent IV", "Septuagesima", "Sexagesima", "Quinquagesima",
  ]);

  // "periodKey|dayLabel" pairs that always keep the season/feria's own
  // Office in full, with the Feast Day not even commemorated (First
  // Class Ferias, the Triduum, and the first days of the Easter/Whitsun
  // Octaves - see module doc comment above).
  const ALWAYS_SEASON_KEYS = new Set([
    "Ash Wednesday|Sunday", // the table's anchor-day label for Ash Wednesday itself
    "Palm Sunday|Holy Monday", "Palm Sunday|Holy Tuesday", "Palm Sunday|Spy Wednesday",
    "Palm Sunday|Maundy Thursday", "Palm Sunday|Good Friday", "Palm Sunday|Easter Even",
    "Easter Day|Easter Monday", "Easter Day|Easter Tuesday",
    "Whitsunday|Whit-Monday", "Whitsunday|Whit-Tuesday",
  ]);
  // Easter Wednesday-Saturday used to be lumped in with ALWAYS_SEASON_KEYS
  // above (zero commemoration, same as Easter Monday/Tuesday) - that was
  // wrong: Ranking.tex's First Order Privileged Octave rule only gives
  // zero commemoration to "the Feast Day, and second & third days of the
  // Octave" (Easter Day/Monday/Tuesday here); every other day within the
  // Octave, including the Octave Day itself, still commemorates a losing
  // Feast (or transfers it, if it's a I/II Double) rather than silently
  // dropping it. See PRIVILEGED_OCTAVE_1ST_KEYS below for the fix.

  // First Order Privileged Octaves (Easter, Whitsun): "Feast Days cannot
  // outrank the Days within the Octave, nor the Octave Day" - so a
  // competing Feast never wins on any of these dates, but (unlike the
  // Feast Day + its first 2 days, in ALWAYS_SEASON_KEYS above) it IS
  // commemorated here, "except... a I or II Double [which] is
  // transferred to the first unhindered day after the Octave" instead
  // (see requiresTransfer below, and findTransferredFeast in app.js,
  // which actually walks the calendar to find that day). Every one of
  // this Kalendar's 39 Sanctorale Collects is 2nd Double or higher (see
  // ROADMAP.md), so in practice every real collision here is a transfer
  // case, not a plain commemoration - verified across 2000-2100: 113
  // Easter-Octave collisions, 65 Whitsun-Octave ones.
  //
  // Whitsun's Octave Day (Trinity Sunday) stays here - Augustine wasn't
  // asked about it specifically, and unlike Low Sunday it isn't also a
  // *named* First Class Sunday period in this data (Trinity Sunday has
  // no separate FIRST_CLASS_SUNDAY_PERIODS entry) - but see the note by
  // FIRST_CLASS_SUNDAY_PERIODS above: Low Sunday (Easter's Octave Day)
  // moved OUT of this set per his answer that Sunday-strength outranks
  // Octave-Day-strength, so it no longer appears below.
  const PRIVILEGED_OCTAVE_1ST_KEYS = new Set([
    "Easter Day|Easter Wednesday", "Easter Day|Easter Thursday",
    "Easter Day|Easter Friday", "Easter Day|Easter Saturday",
    "Ember Wednesday|Sunday", "Ember Wednesday|Whit-Thursday", // Whit-Wednesday/Thursday
    "Ember Friday|Sunday", // Whit-Friday
    "Ember Saturday|Sunday", // Whit-Saturday
    "Trinity Sunday|Sunday", // the Octave Day (Whitsun's Octave runs Whitsunday -> Trinity Sunday)
  ]);

  // Second Order Privileged Octaves (Epiphany, Corpus Christi): "Days
  // within the Octave are Semidouble, being only outranked by I Double...
  // The Octave Day is Greater Double, and gives place only to a I Double
  // of universal observance" - one uniform tier>=7 threshold for both.
  // Only Corpus Christi is enumerated here: Epiphany's own Octave (6-13
  // January) never resolves to a clean, stable periodKey/dayLabel set
  // the way the others do (it falls through this data's Christmas/
  // Epiphany "gap day" literal-date fallback depending on what weekday 6
  // January lands on that year), and - like Corpus Christi's Feast Day
  // itself below - has zero live collisions with this Kalendar's 39
  // Sanctorale Collects anyway (none fall between 1-6 and 1-13), so
  // there's nothing to verify a hand-built key set against. Revisit if
  // a future Sanctorale Collect is ever added in that window.
  // Corpus Christi's own periodKey (added to buildAnchorList in
  // calendar.js) only carries 3 days (the Feast Day itself, Friday,
  // Saturday) - the rest of its Octave lands on "Trinity I"'s own first
  // 5 days, always, since both are fixed offsets from Easter (Trinity I
  // starts at Trinity Sunday+7 = Corpus Christi+3, every year).
  const PRIVILEGED_OCTAVE_2ND_KEYS = new Set([
    "Corpus Christi|Sunday", // the Feast Day itself (a Thursday - "Sunday" is this data's anchor-day label)
    "Corpus Christi|Friday", "Corpus Christi|Saturday",
    "Trinity I|Sunday", "Trinity I|Monday", "Trinity I|Tuesday", "Trinity I|Wednesday",
    "Trinity I|Thursday", // the Octave Day
  ]);

  // Third Order Privileged Octaves (Christmas, Ascension): "Days within
  // the Octave are trumped by any feast over Simple" - read here as
  // tier>=3 (Semidouble and up), consistent with how a mere Memorial
  // never replaces an Office anywhere else in Ranking.tex, rather than
  // literally "anything above Simple" (which would make this the
  // *weakest*-protected Octave tier, an unlikely intent). "Any Double
  // Feast within this Octave has its Office with Commemoration of the
  // Octave" - handled the same way every other "commemorate the loser"
  // case is here, regardless of which side actually wins.
  // Only Ascension is enumerated below: Christmas's Third Order Octave
  // (25 December - 1 January) has zero live collisions with this
  // Kalendar's 39 Sanctorale Collects (none fall in that window - 26/27/
  // 28 December are already their own Temporale periodKeys, "St.
  // Stephen"/"St. John Evangelist"/"Holy Innocents", with no competing
  // Sanctorale Collect to rank against in this data model at all), so -
  // like Epiphany above - there's nothing to verify a hand-built
  // Christmas key set against; extend this the same way if that ever
  // changes.
  const PRIVILEGED_OCTAVE_3RD_KEYS = new Set([
    "Ascension Thursday|Sunday", // the Feast Day itself (a Thursday)
    "Ascension Thursday|Friday", "Ascension Thursday|Saturday",
    "Sunday within Ascension Octave|Sunday", "Sunday within Ascension Octave|Monday",
    "Sunday within Ascension Octave|Tuesday", "Sunday within Ascension Octave|Wednesday",
  ]);
  // "...but on the Octave Day of the Ascension only a I or II Double is
  // kept, with Commemoration of the Octave" - a stricter tier>=6
  // threshold than the rest of the Octave, and explicitly named for
  // Ascension only (Ranking.tex gives Christmas's Octave Day - 1
  // January, the Circumcision - no equivalent override, so it would use
  // the general Third Order threshold above, not this one; moot here
  // regardless, since nothing collides there - see above).
  const PRIVILEGED_OCTAVE_3RD_DAY_KEYS = new Set([
    "Sunday within Ascension Octave|Thursday",
  ]);

  // Vigils. Unlike the Octave day-sets above, these are detected off
  // `resolved.kalendar` itself rather than a hand-built periodKey/
  // dayLabel set: every fixed-date Vigil in this Kalendar already
  // self-identifies its own tier via its `rank` string ("1st Vigil" -
  // Christmas Even; "2nd Vigil" - Vigil of the Epiphany; plain "Vigil" -
  // every Common Vigil, including "Hallowe'en", the Eve of All Hallows,
  // which the Kalendar tags "Vigil" too). See classifyVigil below.
  //
  // The one Privileged Vigil that ISN'T a fixed Kalendar date - Whitsun
  // Even, the day before the moveable Whitsunday - needs the same
  // periodKey|dayLabel treatment as the Octaves above instead, since
  // there's no Kalendar entry for it to read a rank off of. It always
  // lands on the last dayLabel of "Sunday within Ascension Octave"
  // (Whitsunday - 1 = Ascension + 9, one day past that periodKey's own
  // Octave-Day dayLabel above), for the same fixed-offset-from-Easter
  // reason "Trinity I"'s first days double as Corpus Christi's Octave.
  const WHITSUN_EVEN_KEY = "Sunday within Ascension Octave|Saturday";

  // Every one of this Kalendar's 39 Sanctorale Collects is 2nd Double or
  // higher (see ROADMAP.md), and not one of them falls on a Vigil date -
  // fixed or moveable - so, unlike the Privileged Octaves above, Vigil
  // ranking genuinely is a no-op with this site's current data in both
  // directions: a Vigil never has its own Collect to rank *for*, and no
  // Vigil date ever collides with a *different* fixed feast's Collect
  // either (checked directly against data/collects-sanctorale.json's own
  // key list). Implemented anyway for completeness, the same way the
  // (also currently inert) Christmas/Epiphany Privileged Octaves are
  // above - decideCollectWinner is simply never consulted on any of
  // these dates under this site's data as it stands today.
  function classifyVigil(kalEntries) {
    if (!kalEntries) return null;
    for (const e of kalEntries) {
      if (e.rank === "1st Vigil") return "privileged-vigil-1st";
      if (e.rank === "2nd Vigil") return "privileged-vigil-2nd";
      if (e.rank === "Vigil") return "common-vigil";
    }
    return null;
  }

  // "periodKey|dayLabel" pairs that are Second Class Ferias (only a
  // 1st or 2nd Double may displace them).
  const SECOND_CLASS_FERIA_KEYS = new Set([
    "Ash Wednesday|Thursday", "Ash Wednesday|Friday", "Ash Wednesday|Saturday",
    "Rogation Sunday|Rogation Monday",
    ...["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].flatMap((d) =>
      ["Lent I", "Lent II", "Lent III", "Lent IV"].map((p) => `${p}|${d}`)
    ),
    ...["Ember Wednesday", "Ember Friday", "Ember Saturday"].map((d) => `Lent I|${d}`),
    ...["Passion Monday", "Passion Tuesday", "Passion Wednesday", "Passion Thursday", "Passion Friday", "Passion Saturday"].map(
      (d) => `Passion Sunday|${d}`
    ),
  ]);
  // Note: the standalone periodKeys "Ember Wednesday"/"Ember Friday"/
  // "Ember Saturday" (as opposed to a "Lent I|Ember Wednesday"-style
  // *dayLabel* nested inside another period) only ever refer to
  // Whitsun's own Ember Days - Advent's Ember Days resolve under
  // periodKey "Advent III" instead (see calendar.js), so there's no
  // ambiguity. Whitsun's Ember Days are now classified as part of the
  // Whitsun Octave (PRIVILEGED_OCTAVE_1ST_KEYS above), not as a plain
  // Second Class Feria - Ranking.tex's First Order Privileged Octave
  // rule ("Feast Days cannot outrank the Days within the Octave")
  // is a hard block a Second Class Feria's tier>=6 threshold doesn't
  // capture, and every one of this Kalendar's Sanctorale Collects is
  // 2nd Double or higher, so this genuinely changes the outcome, not
  // just the label.

  // Advent weekdays (Greater Ferias). Ranking.tex doesn't state the
  // override threshold explicitly for this tier - Second Class Feria's
  // threshold (1st/2nd Double only, tier>=6) is used here as the closest
  // documented analogue. Flagged to Augustine as an unstated threshold;
  // he asked for a concrete example before ruling, so this is STILL
  // OPEN, not yet confirmed either way. The example given back to him:
  // St. Peter Chrysologus (2 December, plain "Double" - tier 4) lands on
  // an Advent weekday in any year Advent Sunday falls 27 Nov-1 Dec. Under
  // the current tier>=6 assumption, the Advent feria keeps the Office
  // and he's only commemorated; if Greater Ferias are meant to be looser
  // than Ember/Passion-week's Second Class Ferias, a plain Double might
  // be intended to win outright instead. (St. Nicholas, 6 December, also
  // plain "Double," is a second real instance whenever Advent II's
  // weekdays reach that far.)
  const GREATER_FERIA_KEYS = new Set(
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].flatMap((d) =>
      ["Advent I", "Advent II", "Advent III", "Advent IV"].map((p) => `${p}|${d}`)
    )
  );

  // "always-season" (First Class Ferias/Triduum, the privileged start of
  // the Easter/Whitsun Octaves) and "first-class-sunday" are the only two
  // classifications where a Feast Day isn't just outranked but is a hard
  // block - not even commemorated, per Ranking.tex - which is exactly
  // the condition that triggers transfer to the next unhindered day.
  function isHardBlock(classification) {
    return classification === "always-season" || classification === "first-class-sunday";
  }

  // Broader than isHardBlock: also true for a I/II Double landing
  // anywhere else within a First Order Privileged Octave (Easter Wed-Sat,
  // the Octave Day, Whitsun's Ember Days, Trinity Sunday) - Ranking.tex
  // transfers those too, it just also commemorates lower-ranked Feasts
  // there instead of dropping them outright the way isHardBlock's two
  // classifications do. Second and Third Order Privileged Octaves don't
  // get a transfer rule at all in Ranking.tex - a Feast that clears
  // their (higher) threshold just wins outright, same as anywhere else.
  function requiresTransfer(classification, tier) {
    if (isHardBlock(classification)) return true;
    if (classification === "privileged-octave-1st" && tier >= 6) return true;
    return false;
  }

  function classifySeasonDay(resolved) {
    const { periodKey, dayLabel, weekdayName } = resolved;
    const key = `${periodKey}|${dayLabel}`;
    if (ALWAYS_SEASON_KEYS.has(key)) return "always-season";
    // Privileged Octave day-sets are checked before the generic Feria/
    // Sunday/Ember-day logic below, since several of their periodKeys
    // (the Whitsun Ember Days, "Trinity I"'s own first few days once
    // they double as the tail of Corpus Christi's Octave) would
    // otherwise be caught by a weaker, wrong classification first.
    if (PRIVILEGED_OCTAVE_1ST_KEYS.has(key)) return "privileged-octave-1st";
    if (PRIVILEGED_OCTAVE_3RD_DAY_KEYS.has(key)) return "privileged-octave-3rd-day";
    if (PRIVILEGED_OCTAVE_3RD_KEYS.has(key)) return "privileged-octave-3rd";
    if (PRIVILEGED_OCTAVE_2ND_KEYS.has(key)) return "privileged-octave-2nd";
    if (key === WHITSUN_EVEN_KEY) return "privileged-vigil-1st";
    const vigilCls = classifyVigil(resolved.kalendar);
    if (vigilCls) return vigilCls;
    if (SECOND_CLASS_FERIA_KEYS.has(key)) return "second-class-feria";
    if (GREATER_FERIA_KEYS.has(key)) return "greater-feria";
    const isAnchorSunday = dayLabel === "Sunday";
    if (isAnchorSunday && FIRST_CLASS_SUNDAY_PERIODS.has(periodKey)) return "first-class-sunday";
    if (isAnchorSunday && SECOND_CLASS_SUNDAY_PERIODS.has(periodKey)) return "second-class-sunday";
    if (weekdayName === "Sunday") return "other-sunday";
    return "feria";
  }

  // Returns { winner: "feast"|"season", commemorateOther: boolean,
  // classification: string, feastTier: number }.
  // sanctoraleRank is the `rank` string from data/kalendar.json for
  // today's fixed feast (e.g. "1st Double"), or null/undefined if there
  // isn't one.
  function decideCollectWinner(resolved, sanctoraleRank) {
    const cls = classifySeasonDay(resolved);
    const tier = RANK_TIER[sanctoraleRank] || 0;

    if (cls === "always-season") {
      return { winner: "season", commemorateOther: false, classification: cls, feastTier: tier };
    }
    if (cls === "first-class-sunday") {
      // Ranking.tex: a Double falling here would properly be
      // transferred to the next unhindered day - this engine doesn't
      // model transfer, it only decides today's Office, which is
      // always of the Sunday.
      return { winner: "season", commemorateOther: false, classification: cls, feastTier: tier };
    }
    if (cls === "privileged-octave-1st") {
      // "Feast Days cannot outrank the Days within the Octave, nor the
      // Octave Day" - the season always wins here, full stop. A I/II
      // Double is transferred instead of shown as a commemoration (see
      // requiresTransfer/findTransferredFeast); anything lower is
      // commemorated in place, per "other Feasts are commemorated,
      // except on the Feast Day and the two following days" (those
      // three days use "always-season" above instead, not this).
      const transferring = tier >= 6;
      return { winner: "season", commemorateOther: tier > 0 && !transferring, classification: cls, feastTier: tier };
    }
    if (cls === "privileged-octave-2nd") {
      // "outranked only by I Double" / the Octave Day "gives place only
      // to a I Double of universal observance" - one uniform tier>=7
      // threshold either way, with the loser (whichever side) commemorated.
      const winner = tier >= 7 ? "feast" : "season";
      return { winner, commemorateOther: tier > 0, classification: cls, feastTier: tier };
    }
    if (cls === "privileged-octave-3rd") {
      // "trumped by any feast over Simple" - see the interpretive note
      // by PRIVILEGED_OCTAVE_3RD_KEYS above for why this reads as tier>=3.
      const winner = tier >= 3 ? "feast" : "season";
      return { winner, commemorateOther: tier > 0, classification: cls, feastTier: tier };
    }
    if (cls === "privileged-octave-3rd-day") {
      // Ascension's Octave Day specifically: "only a I or II Double is
      // kept" - tier>=6, stricter than the rest of a Third Order Octave.
      const winner = tier >= 6 ? "feast" : "season";
      return { winner, commemorateOther: tier > 0, classification: cls, feastTier: tier };
    }
    if (cls === "privileged-vigil-1st") {
      // "Vigils of the First Class are preferred over any other Feast
      // Day" - read as a full block, the same strength as
      // "always-season" above (no commemoration; nothing in Ranking.tex
      // suggests these two Vigils yield even a commemoration to a
      // colliding Feast, unlike the softer wording used for Octaves).
      return { winner: "season", commemorateOther: false, classification: cls, feastTier: tier };
    }
    if (cls === "privileged-vigil-2nd") {
      // "preferred over any Feast Day, except I & II Doubles and Feasts
      // of Our Lord" - the "Feasts of Our Lord" exception isn't modeled
      // (this data has no such flag to check), so this only implements
      // the tier>=6 half.
      const winner = tier >= 6 ? "feast" : "season";
      return { winner, commemorateOther: tier > 0, classification: cls, feastTier: tier };
    }
    if (cls === "common-vigil") {
      // "preferred over any Feast Day, except Doubles & above or an
      // Octave" - the Octave exception isn't separately modeled here.
      // Flagged to Augustine alongside the Greater Feria question above;
      // he asked for an example. Unlike Greater Feria, there's no REAL
      // instance of this in the current Kalendar to point to - checked
      // every Common Vigil date against all seven Common Octave windows
      // plus Christmas's and Epiphany's Privileged Octave date ranges,
      // and none overlap (the closest is the Vigil of St. John Baptist,
      // 23 June, sitting exactly one day before St. John Baptist's own
      // Common Octave begins on the 24th - adjacent, not inside it). So
      // the honest example given back to him is hypothetical: IF a
      // future edition's Kalendar ever placed a Common Vigil inside
      // another feast's Octave, would the Vigil still only yield to a
      // Double-or-above Feast (this file's tier>=4 reading of the first
      // clause), or would merely being inside an Octave override that
      // regardless of the colliding Feast's rank (the second clause,
      // read as a separate, absolute exception)? Genuinely moot for this
      // book as it stands - tier>=4 (Double and up) is what's live today.
      const winner = tier >= 4 ? "feast" : "season";
      return { winner, commemorateOther: tier > 0, classification: cls, feastTier: tier };
    }
    if (cls === "second-class-sunday") {
      const winner = tier >= 7 ? "feast" : "season";
      return { winner, commemorateOther: tier > 0, classification: cls, feastTier: tier };
    }
    if (cls === "second-class-feria" || cls === "greater-feria") {
      const winner = tier >= 6 ? "feast" : "season";
      return { winner, commemorateOther: tier > 0, classification: cls, feastTier: tier };
    }
    if (cls === "other-sunday") {
      // Ranking.tex's own wording for this rule ("All Other Sundays...
      // give place to a Feast of the I or II Class") names the top two
      // Double sub-ranks specifically, not the whole Double family -
      // Augustine confirmed the I/II/Greater/plain Double priority order
      // this reading depends on (see the RANK_TIER comment above), so
      // tier>=6 (2nd Double or 1st Double only) stands as the correct,
      // now-confirmed threshold here - a Greater Double or plain Double
      // does not win an ordinary Sunday, only commemorated.
      //
      // This is what Augustine calls a "Lesser Sunday" in conversation
      // (8/29 answer, Q6 of the release-audit question list): "A Lesser
      // Sunday is a Sunday which is neither First nor Second Class, per
      // the Ranking of Days" - i.e. exactly this "other-sunday" bucket,
      // the classification `cls` reaches once FIRST_CLASS_SUNDAY_PERIODS
      // and SECOND_CLASS_SUNDAY_PERIODS have both already been ruled out
      // above. Recorded here since "Lesser Sunday" doesn't appear
      // anywhere in Ranking.tex itself under that name - it's Augustine's
      // own spoken shorthand for this rule, not a distinct fourth
      // category with its own separate precedence rule.
      const winner = tier >= 6 ? "feast" : "season";
      return { winner, commemorateOther: tier > 0, classification: cls, feastTier: tier };
    }
    // plain feria: Simple (1) or Semidouble+ (3+) wins outright; a bare
    // Memorial (2) does not replace the ferial Office, only commemorated.
    const winner = tier === 1 || tier >= 3 ? "feast" : "season";
    return { winner, commemorateOther: tier > 0, classification: cls, feastTier: tier };
  }

  // Common Octaves (Ranking.tex: "The Days within the Octave are
  // Semidouble. A Double Feast occurring within a Common Octave has its
  // Office with Commemoration of the Octave, unless otherwise noted.")
  // "A Double Feast" here (unlike "other-sunday"'s "I or II Class"
  // wording just above) doesn't single out a specific sub-rank, so this
  // reads as the whole Double family - tier >= 4 (plain Double, Greater
  // Double, or either specific Double) all outrank the Octave's own
  // Semidouble (tier 3) strength. Augustine confirmed the I/II/Greater/
  // plain Double priority order this depends on; nothing in this
  // Kalendar's data currently exercises a *plain* Double or Greater
  // Double actually colliding with a Common Octave day, though, so this
  // reading is confirmed-in-principle but not yet verified against a
  // real date the way the tier>=6 threshold above was - worth a second
  // look if a future edition adds a Sanctorale Collect that lands inside
  // one of the seven Octave windows below at Double or Greater Double
  // rank specifically.
  //
  // Maps the name a "Day N within the Octave of X" / "Octave Day of X"
  // Kalendar entry uses to refer back to its origin feast, to the "M-D"
  // kalendarKey of that origin feast's own day - where its Collect is
  // actually printed/parsed (data/collects-sanctorale.json). Fixed
  // Sanctorale dates don't move year to year, so these are safe
  // constants. Verified against data/kalendar.json: each origin here is
  // the only entry in the whole Kalendar whose own name contains
  // "(Common Octave)" and reads as one of these (i.e. this list matches
  // Ranking.tex's Common Octave category exactly - Privileged Octaves
  // like Christmas/Epiphany and Simple Octaves like St. Stephen use a
  // different naming pattern - "(Nth Octave)" and "(Simple Octave)"
  // respectively - and are deliberately NOT matched by
  // findCommonOctaveOrigin below, since their rules are different:
  // Third Order Privileged Octaves are "trumped by any feast over
  // Simple" - much weaker than a Common Octave's Semidouble protection -
  // and Simple Octaves are explicitly "not commemorated" at all).
  const COMMON_OCTAVE_ORIGINS = {
    "St. Tikhon of Moscow": "4-7",
    "St. George": "4-23",
    "St. John Baptist": "6-24",
    "Sts. Peter & Paul": "6-29",
    "Assumption": "8-15",
    "All Hallows": "11-1",
    "Conception": "12-8",
  };

  // Given one of today's Kalendar entries, returns
  // { name, rank, originKalendarKey } if it's a reference into a Common
  // Octave, else null. `rank` is read straight off the entry itself
  // (the Kalendar already records "Semidouble" for an ordinary Octave
  // day, "Greater Double" for the Octave Day - no need to re-derive it);
  // `originKalendarKey` is where to look up the origin feast's own
  // Collect text, since Octave days don't get their own separately
  // printed Collect in the source - they reuse the origin feast's.
  function findCommonOctaveOrigin(kalEntry) {
    if (!kalEntry || !kalEntry.name) return null;
    const m = kalEntry.name.match(/^Day [IVX]+ within the Octave of (.+)$/) || kalEntry.name.match(/^Octave Day of (.+)$/);
    if (!m) return null;
    const ref = m[1];
    const originName = Object.keys(COMMON_OCTAVE_ORIGINS).find((n) => ref.includes(n));
    if (!originName) return null;
    return { name: kalEntry.name, rank: kalEntry.rank, originKalendarKey: COMMON_OCTAVE_ORIGINS[originName], originName };
  }

  /**
   * Table 2 ("if there concur a...") - the Table of Concurrence governing
   * what happens at Evensong when today's own Vespers claim runs up
   * against tomorrow's, from Table2_revision.pdf (read and cross-checked
   * 8/24 - see ROADMAP.md). This is a DELIBERATELY PARTIAL implementation
   * of that table, not the full 9-row x 11-column grid:
   *
   * - Table 2's rows/columns include several categories this site has no
   *   data for at all (Privileged vs. Common Octave Day, Day-within-
   *   Octave, Simple Octave Day, St. Mary on Saturday, the specific
   *   Octave Day of a Greater Double) - only the six ranks this
   *   codebase's own `RANK_TIER`/period system can actually classify a
   *   day as are covered: Sunday, 1st Double, 2nd Double, Greater Double,
   *   (Lesser) Double, and Memorial.
   * - Of the cells covering those six, this table only stores the ones
   *   where TODAY's own Office should stay primary (Table 2 codes 2 and
   *   4 - "all of the preceding," with or without a commemoration of
   *   tomorrow). Codes 1, 3, and the "if equal" branch of 5 all mean
   *   TOMORROW's Office should displace today's entirely - correctly
   *   implementing that would mean swapping which day's whole Evensong
   *   (Psalms, Lessons, Hymn, everything, not just the Collect) renders
   *   under today's date, which is a much larger change this pass
   *   doesn't attempt. Those cells are simply left out of this table, so
   *   looking one up returns undefined/null and no concurrence rule
   *   fires - today's Evensong keeps rendering exactly as it already did
   *   before this feature existed. See ROADMAP.md for the full write-up.
   *
   * Every cell actually included below IS the real code from the table
   * (2 or 4), not a guess - see the ROADMAP.md entry for the full
   * derivation from Table2_revision.pdf's own grid.
   */
  const TABLE2_TODAY_WINS = {
    sunday:        { memorial: 4, lesserDouble: 4, greaterDouble: 4 },
    firstDouble:   { memorial: 2, lesserDouble: 4, greaterDouble: 4, secondDouble: 4, sunday: 4 },
    secondDouble:  { memorial: 2, lesserDouble: 4, greaterDouble: 4, sunday: 4 },
    greaterDouble: { memorial: 4, lesserDouble: 4 },
    lesserDouble:  { memorial: 4 },
  };

  /**
   * The other half of Table 2 (see TABLE2_TODAY_WINS's own doc comment
   * just above, which explains why these cells were left out of that
   * table originally): the cells where TOMORROW's First Evensong claim
   * outranks TODAY's own Office entirely (codes 1, 3, and 5), rather than
   * merely adding a commemoration to it. Re-read and verified 8/31
   * directly from Table2_revision.pdf (still present in this project's
   * uploads) and cross-checked cell-by-cell against every existing entry
   * in TABLE2_TODAY_WINS above (100% match) to confirm both the reading
   * and the row=today/column=tomorrow orientation before deriving these
   * previously-unrecorded cells - not a guess or a reconstruction from
   * general liturgical knowledge. Same six classifiable ranks as
   * TABLE2_TODAY_WINS (see classifyVespersCategory) - the same categories
   * this codebase has no data for are still just as absent here.
   *
   * Code meanings (Table2_revision.pdf's own key):
   *   1 = all of the following [tomorrow], nothing of the preceding [today]
   *   3 = all of the following [tomorrow], commemoration of the preceding [today]
   *   5 = "all of the more worthy, commemoration of the other; if equal,
   *       all of the following, commemoration of the preceding" - in this
   *       restricted six-rank submatrix, code 5 only ever appears on the
   *       table's own diagonal (today and tomorrow the same rank, i.e.
   *       always the tied/equal case), so it always resolves the same way
   *       as code 3: tomorrow's Office throughout, today commemorated.
   *       Stored here as the literal "5" from the source table (not
   *       silently rewritten to "3"), so this stays a faithful
   *       transcription of the real grid - see commemoratesDisplacedToday
   *       below for where that tie resolution is actually applied.
   */
  const TABLE2_TOMORROW_WINS = {
    sunday:        { secondDouble: 3, firstDouble: 3 },
    firstDouble:   { firstDouble: 5 },
    secondDouble:  { firstDouble: 3, secondDouble: 5 },
    greaterDouble: { secondDouble: 3, firstDouble: 1, sunday: 3, greaterDouble: 5 },
    lesserDouble:  { greaterDouble: 3, secondDouble: 3, firstDouble: 1, sunday: 3, lesserDouble: 5 },
  };

  // Whether a TABLE2_TOMORROW_WINS code means today's own Office should
  // still be commemorated within tomorrow's displaced Evensong, per the
  // code key on TABLE2_TOMORROW_WINS above: code 1 means nothing of today
  // at all; codes 3 and 5 (5 always being the tied/equal case in this
  // submatrix) both mean today is commemorated.
  function commemoratesDisplacedToday(code) {
    return code === 3 || code === 5;
  }

  /**
   * Classifies a single day's Vespers-concurrence category - see
   * TABLE2_TODAY_WINS above. `sanctoraleRank`/`winner` are exactly
   * `resolveMassPropersWinner`'s own fields for that day; `isSunday` is
   * that day's `weekdayName === "Sunday"`. A winning Sanctorale Feast
   * takes priority over the weekday even if that day is also a Sunday
   * (Sunday only applies when the Sunday's own Office is what's actually
   * being said) - matching how `resolveMassPropersWinner` itself already
   * decides which Office wins the day.
   *
   * George's 9/8 note, task #184: "Memorials are commemorated during I
   * Evensong and Mattins, but not II Evensong." Found while implementing
   * this that the `sanctoraleRank === "Memorial"` check inside the
   * `winner === "feast"` branch above was dead code from the moment Table
   * 2 was first written: a Memorial (RANK_TIER tier 2) can never actually
   * win any day under `decideCollectWinner` - every classification in
   * this file requires at least tier 3 (a plain feria's own Simple/
   * Semidouble-or-higher threshold, the lowest anywhere) - so `winner`
   * is never `"feast"` when `sanctoraleRank` is `"Memorial"`, and
   * `TABLE2_TODAY_WINS`/`TABLE2_TOMORROW_WINS`'s own `memorial` columns
   * (`sunday: {memorial:4}`, `firstDouble: {memorial:2}`, etc.) could
   * never be reached by any real date. What Table 2 actually needs to
   * know isn't whether a Memorial *won* (it never does), only whether one
   * is *noted in the Kalendar* for that day at all - added as a fallback
   * checked only after both the winning-Feast and Sunday cases above have
   * already had their turn, so a Sunday (or any real winning Feast) that
   * merely happens to share its date with a losing Memorial still
   * classifies as `"sunday"`/its own Double tier, not `"memorial"` - a
   * bare Memorial only ever "shows through" on a plain feria that has one
   * and nothing else claiming the day.
   */
  function classifyVespersCategory(isSunday, sanctoraleRank, winner) {
    if (winner === "feast") {
      if (sanctoraleRank === "1st Double") return "firstDouble";
      if (sanctoraleRank === "2nd Double") return "secondDouble";
      if (sanctoraleRank === "Greater Double") return "greaterDouble";
      if (sanctoraleRank === "Double") return "lesserDouble";
      if (sanctoraleRank === "Memorial") return "memorial"; // unreachable in practice - see doc comment above
      return null; // Semidouble/Simple - no row or column in Table 2
    }
    if (isSunday) return "sunday";
    if (sanctoraleRank === "Memorial") return "memorial";
    return null; // ordinary Feria with no Memorial either - no row or column in Table 2
  }

  const api = {
    decideCollectWinner, classifySeasonDay, RANK_TIER, findCommonOctaveOrigin, isHardBlock, requiresTransfer,
    TABLE2_TODAY_WINS, classifyVespersCategory, TABLE2_TOMORROW_WINS, commemoratesDisplacedToday,
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.Ranking = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
