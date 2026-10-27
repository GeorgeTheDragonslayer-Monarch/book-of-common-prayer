/**
 * Approximates today's liturgical color from the resolved season/period
 * and any Kalendar entries for the date, using the same named colors
 * defined in BookOfCommonPrayer.tex (SarumBlue, LentenViolet,
 * GreenSeason, FestiveWhite, MartyrRed, MournfulBlack, JoyfulRose).
 *
 * seasonBaseColor (the season-only fallback) is still a plain heuristic,
 * not the full Ranking.tex precedence engine - see ROADMAP.md. But
 * resolveLiturgicalColor's Feast-vs-season override no longer is: pass
 * it the optional `feastInfo` argument (app.js's resolveFeastRankToday,
 * the same { winner, tier, isMartyr, transferred, ... } answer the day's
 * actual Mass Propers are resolved from) and the color is decided purely
 * from *that* - a hard-blocked or transferred-away feast (e.g. the
 * Annunciation falling in Holy Week) no longer wrongly colors the page
 * for a feast that isn't actually being kept, and a feast transferred
 * *in* from an earlier blocked date (which has no Kalendar entry of its
 * own for today) now correctly colors the page too. Without `feastInfo`
 * (e.g. in a standalone test), this falls back to the older, simpler
 * "any red-letter entry present" check.
 *
 * 8/27 fix (per Augustine's WebsiteNotes_2026-08-26.txt review, "a Sunday
 * around the 30th... should be green" / "today should show GREEN"):
 * this used to *also* scan the raw Kalendar array a second time for any
 * entry named/ranked as a martyr with rank !== "Commemoration" (a plain
 * string literal check - "Memorial", "Simple", etc. all counted) and
 * force red whenever the season's own base color was green, completely
 * independent of whether that martyr actually won the day per
 * `feastInfo`. That fired even on Sundays and ordinary ferias where a
 * lesser martyr's day was present in the Kalendar but never actually
 * observed (`decideCollectWinner` correctly said "season" wins, e.g.
 * 26 Aug 2026 - Pope St. Zephyrinus - and 30 Aug 2026, a Sunday - Sts.
 * Felix & Adauctus - both Trinitytide, both should be green). The same
 * loose scan also picked whichever red-letter Kalendar entry happened to
 * be *first* in the array on a day with more than one (e.g. 1 Aug 2026:
 * Chains of St. Peter actually wins, non-martyr, should be white - but
 * "Holy Maccabees, Martyrs" also listed that day tripped the fallback to
 * red). `feastInfo` (via app.js's `resolveFeastRankToday`, itself driven
 * by the same `Ranking.decideCollectWinner` that decides the day's actual
 * Mass Propers) already correctly identifies which single entry wins and
 * whether *that one* is a martyr - so the color now trusts it exclusively
 * instead of re-deriving a second, looser answer from the raw Kalendar.
 */

const LITURGICAL_COLORS = {
  violet: { name: "Violet", hex: "#5b3a6e", text: "#f2e9f6" },
  green: { name: "Green", hex: "#2f6b3f", text: "#e6f2e8" },
  white: { name: "White & Gold", hex: "#8a6d1d", text: "#fdf6e3" },
  red: { name: "Red", hex: "#8a1f1f", text: "#f9e6e6" },
  black: { name: "Black", hex: "#2b2b2b", text: "#e9e9e9" },
  rose: { name: "Rose", hex: "#a85a78", text: "#fbe9f0" },
  blue: { name: "Sarum Blue", hex: "#1f3a63", text: "#e6edf7" },
};

function seasonBaseColor(periodKey) {
  // George's 9/7 note, task #179: "The liturgical colour of Advent is
  // Sarum Blue" - this Western Rite site follows the Sarum use's own
  // distinctive blue for Advent rather than the ordinary Roman violet
  // (Advent III/Gaudete's rose exception is untouched, since George's
  // note doesn't mention it and Sarum use itself keeps that exception).
  if (/^Advent/.test(periodKey)) return periodKey === "Advent III" ? "rose" : "blue";
  if (/^(Septuagesima|Sexagesima|Quinquagesima)/.test(periodKey)) return "violet";
  if (/^Lent/.test(periodKey)) return periodKey === "Lent IV" ? "rose" : "violet";
  if (/^(Passion Sunday|Palm Sunday|Ash Wednesday)/.test(periodKey)) return "violet";
  // George's 9/7 note, task #179 (found while implementing the Advent
  // fix above): plain "Epiphany" (the Feast Day itself and its Octave,
  // which share this one periodKey per calendar.js's anchor list) is
  // correctly white, but this regex's missing anchor also matched
  // "Epiphany I" through "Epiphany VIII" - the ordinary Sundays/ferias
  // of Epiphanytide proper, appended separately by
  // `anchors.epiphanySundays.forEach` in calendar.js - wrongly coloring
  // that whole stretch of "ordinary Ferias" white instead of green
  // ("The liturgical colour of ordinary Ferias is green"). Split out as
  // an exact match so only the Feast/Octave itself is white; the
  // numbered Epiphany weeks now correctly fall through to the green
  // default below, same as Trinitytide's own numbered weeks already do.
  if (periodKey === "Epiphany") return "white";
  // Pending-corrections fix (10/3, task #213, item #10): "Corpus Christi
  // is currently shown in green; it should be white/gold." Corpus
  // Christi (Trinity Sunday + 4, periodKey "Corpus Christi" - see
  // calendar.js's buildAnchorList) had no rule here at all, so it fell
  // all the way through to this function's green default, same as any
  // ordinary Trinitytide feria. It's a 1st Double Feast of Our Lord
  // (Rubrics.tex), so it takes the ordinary Feast-of-Our-Lord white/gold
  // used for every other such Feast on this line - not matched by the
  // existing regex only because that regex never named it.
  if (periodKey === "Corpus Christi") return "white";
  // Pending-corrections fix (10/3, task #214, item #11): the Feast of
  // the Compassion of Our Lord Jesus Christ (newly anchored in
  // calendar.js's buildAnchorList, see that fix) is marked
  // "{FestiveWhite}" in its own PropSeas.tex entry - same white/gold as
  // Corpus Christi just above, for the same reason (no rule here named
  // it, so it would otherwise fall through to the green default).
  if (periodKey === "Compassion of Our Lord") return "white";
  // George's follow-up (10/26) to the Christ the King investigation
  // (see ROADMAP.md): "Patronage of St. Joseph" (newly anchored in
  // calendar.js's buildAnchorList, see that fix) is marked "First Class
  // Double" in its own PropSeas.tex entry - same reasoning as Corpus
  // Christi/the Compassion of Our Lord just above: no rule here named
  // it, so it would otherwise fall through to the green Eastertide-feria
  // default below.
  if (periodKey === "Patronage of St. Joseph") return "white";
  if (/^(Christmas|Easter|Whitsunday|Trinity Sunday|Circumcision|Most Holy Name)/.test(periodKey)) return "white";
  if (/^Trinity (I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXI|XXII|XXIII|XXIV)$/.test(periodKey)) return "green";
  if (/^Sunday Next before Advent$/.test(periodKey)) return "green";
  if (/^Rogation Sunday$/.test(periodKey)) return "violet";
  // George's follow-up (10/26) to the Christ the King investigation (see
  // ROADMAP.md): the Autumn Ember Days (newly anchored in calendar.js's
  // buildAnchorList, see that fix) are marked "{LentenViolet}" in their
  // own PropTime.tex entries - same violet as the Whitsun Ember days
  // just below, just under distinct periodKey names ("...in Autumn") so
  // this regex doesn't already match them.
  if (/^Ember (Wednesday|Friday|Saturday) in Autumn$/.test(periodKey)) return "violet";
  if (/^Ember (Wednesday|Friday|Saturday)$/.test(periodKey)) return "violet";
  return "green";
}

/**
 * Returns one of LITURGICAL_COLORS' keys for the resolved liturgical day.
 * When `feastInfo` is given and it says a feast actually wins today
 * (`winner === "feast"`, whether from the Kalendar or transferred in),
 * that single feast's own martyr-status decides red vs. white/gold - a
 * feast merely *listed* in the Kalendar but not actually won (a lower-
 * rank commemoration losing to a Sunday or a higher feast) never
 * overrides the season color, matching what the day's actual Office/Mass
 * Propers do. Without `feastInfo` (e.g. a standalone caller/test with no
 * Ranking-engine result to hand), falls back to the older, simpler "any
 * red-letter Kalendar entry present" check.
 */
function resolveLiturgicalColor(resolved, feastInfo) {
  // George's 9/7 note, task #179: "The liturgical colour of Holy
  // Innocents is violet, except when celebrated on Sunday when it is
  // red. The liturgical colour of its Octave Day is always red." Holy
  // Innocents (28 December, kalendarKey "12-28") is uniquely exempted
  // from the ordinary martyr-feast red in the classical rubrics - the
  // Innocents died before Christ's own Passion won them the martyr's
  // crown by grace, so violet (as if still penitential/awaiting
  // redemption) is used instead, EXCEPT when the feast is actually kept
  // on a Sunday, when red is restored. Its Octave Day (4 January,
  // kalendarKey "1-4") has no such exception and is always red. Checked
  // directly by kalendarKey (the "M-D" string every fixed Kalendar date
  // carries, per calendar.js) rather than the feast's own name string,
  // matching this codebase's established convention for other one-off
  // fixed-date rules (e.g. All Souls' Day's Requiem-language swap).
  // This must be checked before the generic isMartyr rule below, since
  // "Holy Innocents, Martyrs (Simple Octave)" - the Kalendar's own name
  // for the 28 December entry - would otherwise match that rule and
  // always show red.
  if (resolved && resolved.kalendarKey === "12-28" && feastInfo && feastInfo.winner === "feast") {
    return resolved.date.getUTCDay() === 0 ? "red" : "violet";
  }
  if (resolved && resolved.kalendarKey === "1-4" && feastInfo && feastInfo.winner === "feast") {
    return "red";
  }
  // George's consolidated 10/7 note: "Mattins and Evensong of All Souls'
  // Day should be the Office of the Dead with Double rite." PropTime.tex
  // prints All Souls' three Masses under `\festival{Double}{2
  // November}{...}{MournfulBlack}` - black, not the generic non-martyr
  // "white" the feast-winner rule just below would otherwise give it (All
  // Souls, Double rank, isn't a Martyr). Checked by kalendarKey, same
  // one-off-fixed-date convention as the Holy Innocents/Octave exceptions
  // just above, and before the generic rule for the same reason.
  if (resolved && resolved.kalendarKey === "11-2" && feastInfo && feastInfo.winner === "feast") {
    const kalendar = resolved.kalendar || [];
    if (kalendar.some((e) => e.name === "All Souls")) return "black";
  }
  if (feastInfo) {
    if (feastInfo.winner === "feast") {
      return feastInfo.isMartyr ? "red" : "white";
    }
    // George's 9/7 note, task #179: "The liturgical colour of Vigils is
    // violet" - a Vigil (rank "1st Vigil"/"2nd Vigil"/"Vigil" in
    // data/kalendar.json, per ranking.js's own classifyVigil) has no
    // real Sanctorale rank of its own (RANK_TIER has no entry for any
    // of those three strings, so it always resolves tier 0 in
    // resolveFeastRankToday), so it always fell through to season/
    // "winner": here and picked up whatever color the surrounding
    // season already had - white in Eastertide (Whitsun Even), green in
    // Trinitytide (Vigil of St. John Baptist, Vigil of All Hallows),
    // etc. - never its own violet. Checked only in this "season wins"
    // branch, not the "feast wins" one above, so a Vigil that happens to
    // share its date with an unrelated Feast that genuinely outranks it
    // still shows that Feast's own color rather than being forced violet.
    if (resolved) {
      const kalendar = resolved.kalendar || [];
      if (kalendar.some((e) => e.rank === "1st Vigil" || e.rank === "2nd Vigil" || e.rank === "Vigil")) {
        return "violet";
      }
    }
    return seasonBaseColor(resolved.periodKey);
  }
  const kalendar = resolved.kalendar || [];
  const redLetterFeast = kalendar.find((e) => e.redLetter && e.name);
  if (redLetterFeast) {
    if (/martyr/i.test(redLetterFeast.name) || /martyr/i.test(redLetterFeast.rank || "")) {
      return "red";
    }
    return "white";
  }
  return seasonBaseColor(resolved.periodKey);
}

if (typeof module !== "undefined") {
  module.exports = { LITURGICAL_COLORS, resolveLiturgicalColor, seasonBaseColor };
}
