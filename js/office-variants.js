/**
 * Heuristics for the seasonal choices Mattins makes: which Invitatory
 * antiphon surrounds the Venite, and whether the festal Te Deum or the
 * penitential/ferial Benedicite is said. Like liturgical-color.js, the
 * season groupings below (seasonKeyFor and everything built on it) are
 * still a reasonable approximation of Mattins.tex, not the full
 * Ranking.tex precedence engine - see ROADMAP.md.
 *
 * The "is there a Semidouble-or-higher feast today" half of the picture
 * is no longer a separate approximation, though: every picker below that
 * needs that answer takes an optional `feastInfo` argument - the same
 * { winner, tier, transferred, ... } object js/ranking.js's
 * decideCollectWinner (via app.js's resolveFeastRankToday) already
 * computes for the day's actual Mass Propers - so a feast that's
 * present in the Kalendar but hard-blocked, transferred away, or merely
 * commemorated (and so doesn't actually govern the Office today) no
 * longer wrongly triggers festal treatment here, and a feast
 * transferred *in* from an earlier blocked date (invisible to a plain
 * scan of today's own Kalendar entries) correctly does. See
 * isHighRankToday below. `feastInfo` is optional - callers that don't
 * have one (e.g. standalone tests) fall back to the older, simpler
 * "any Semidouble-or-higher Kalendar entry present" scan.
 */

/* global getLiturgicalYearAnchors, addDaysLocal */
var getLiturgicalYearAnchors, addDaysLocal; // eslint-disable-line no-var
if (typeof require === "function" && typeof module !== "undefined") {
  getLiturgicalYearAnchors = require("./computus.js").getLiturgicalYearAnchors;
  addDaysLocal = require("./calendar.js").addDaysLocal;
}

const PENITENTIAL_SEASONS = /^(Advent|Septuagesima|Sexagesima|Quinquagesima|Ash Wednesday|Lent)/;
const HIGH_RANKS = ["1st Double", "2nd Double", "Greater Double", "Double", "Semidouble"];

/**
 * Whether a Semidouble-or-higher feast actually governs the Office
 * today. Prefers `feastInfo` (from app.js's resolveFeastRankToday, which
 * asks js/ranking.js's real decideCollectWinner/findTransferredFeast the
 * same question the Mass Propers themselves are resolved with); falls
 * back to a plain "any Semidouble+ Kalendar entry present, regardless of
 * whether it actually wins" scan when no feastInfo is supplied.
 */
function isHighRankToday(resolved, feastInfo) {
  if (feastInfo) return feastInfo.winner === "feast" && feastInfo.tier >= 3; // 3 = Semidouble, per ranking.js's RANK_TIER
  const kalendar = resolved.kalendar || [];
  return kalendar.some((e) => e.rank && HIGH_RANKS.includes(e.rank) && e.rank !== "Memorial");
}

function seasonKeyFor(periodKey) {
  if (/^Advent/.test(periodKey)) return "advent";
  if (/^(Christmas|St\. Stephen|St\. John Evangelist|Holy Innocents|Circumcision|Most Holy Name)/.test(periodKey)) return "christmas";
  if (/^Epiphany/.test(periodKey)) return "epiphany";
  if (/^(Septuagesima|Sexagesima|Quinquagesima)/.test(periodKey)) return "septuagesima";
  if (/^(Ash Wednesday|Lent)/.test(periodKey)) return "lent";
  if (/^(Passion Sunday|Palm Sunday)/.test(periodKey)) return "passiontide";
  if (/^(Easter|Rogation Sunday)/.test(periodKey)) return "eastertide";
  if (/^(Ascension|Sunday within Ascension Octave)/.test(periodKey)) return "ascensiontide";
  return "trinitytide"; // Whitsunday, Trinity Sunday, Trinity I-XXIV, Sunday Next before Advent
}

/**
 * Picks which Invitatory antiphon option applies for a resolved
 * liturgical day. Named seasons (Advent, Christmas, Epiphany,
 * Septuagesima, Lent, Passiontide, Eastertide, Ascensiontide) already
 * have their own distinctive antiphon and keep it even on a feast day
 * that falls within them - a Double-rank saint in Advent still prays
 * the Advent antiphon. The Kalendar-based catch-alls (a Feast of Our
 * Lord/Our Lady, or any Semidouble-or-higher feast) only apply during
 * Trinitytide/ordinary time, which has no distinctive antiphon of its
 * own otherwise.
 */
function pickInvitatorySeason(resolved, feastInfo) {
  const seasonKey = seasonKeyFor(resolved.periodKey);
  if (seasonKey !== "trinitytide") return seasonKey;
  // Unlike isHighRankToday just below, this "Feast of Our Lord/Our Lady"
  // branch used to scan resolved.kalendar directly by name, ungated by
  // whether that feast actually WINS today under Ranking.tex - so a
  // merely-commemorated or hard-blocked Marian/Dominical feast still
  // wrongly triggered this antiphon, and a feast transferred *in* from
  // an earlier blocked date (invisible to a plain scan of today's own
  // Kalendar entries) was wrongly skipped. Now asks feastInfo the same
  // question isHighRankToday already does, with the same documented
  // fallback for callers with no feastInfo. See ROADMAP.md.
  if (feastInfo) {
    if (feastInfo.winner === "feast" && /(Our Lord|Blessed Virgin Mary|Nativity of|Annunciation|Transfiguration)/i.test(feastInfo.name || "")) {
      return "feastsOfLordOrLady";
    }
  } else {
    const kalendar = resolved.kalendar || [];
    const lordOrLady = kalendar.find((e) => e.name && /(Our Lord|Blessed Virgin Mary|Nativity of|Annunciation|Transfiguration)/i.test(e.name));
    if (lordOrLady) return "feastsOfLordOrLady";
  }
  if (isHighRankToday(resolved, feastInfo)) return "semidoubleOrHigher";
  return "trinitytide";
}

/**
 * Whether an Octave Day (the closing day of an Octave, as distinct from
 * the ordinary numbered days within one) actually governs the Office
 * today - Mattins.tex's own Te Deum rubric names "Octave Days" as their
 * own category alongside "Festivals (at least Semidouble)," which only
 * matters separately because a handful of Octave Days are themselves
 * ranked below Semidouble (Simple: Octave Day of St. Stephen, St. John
 * Evangelist, the Holy Innocents, and St. Lawrence) and so wouldn't
 * otherwise trigger isHighRankToday at all. Every other Octave Day is
 * Greater Double or higher and was already covered by isHighRankToday
 * regardless - this only changes the outcome for those four Simple-rank
 * dates. Same feastInfo-preferred/kalendar-scan-fallback shape as
 * isHighRankToday, for the same reason (a merely-commemorated or
 * hard-blocked Octave Day shouldn't trigger this).
 */
function isOctaveDayToday(resolved, feastInfo) {
  const OCTAVE_DAY_RE = /^Octave Day of/;
  if (feastInfo) return feastInfo.winner === "feast" && OCTAVE_DAY_RE.test(feastInfo.name || "");
  const kalendar = resolved.kalendar || [];
  return kalendar.some((e) => e.name && OCTAVE_DAY_RE.test(e.name));
}

/**
 * Picks "teDeum" or "benedicite" per Mattins.tex's own rubric: "The
 * following Hymn [Te Deum] is sung or said on all Sundays (outside
 * Advent, Septuagesimatide, & Lent), Festivals (at least Semidouble),
 * Octave Days, & the Saturday Office of St. Mary" - the Sunday penitential
 * exclusion applies only to Sundays themselves, per the rubric's own
 * placement of that parenthetical; Benedicite (named there as the "daily
 * Old Testament Canticle") on penitential-season Sundays and on plain
 * ferial/memorial/vigil days otherwise. The Saturday branch remains an
 * approximation of "the Saturday Office of St. Mary" (this book doesn't
 * separately distinguish an ordinary Saturday from that votive office),
 * as before.
 */
function pickMorningCanticle(resolved, feastInfo) {
  const periodKey = resolved.periodKey;
  const isPenitential = PENITENTIAL_SEASONS.test(periodKey);
  const isSunday = resolved.weekdayName === "Sunday";

  if (isSunday) return isPenitential ? "benedicite" : "teDeum";
  if (isHighRankToday(resolved, feastInfo)) return "teDeum";
  if (isOctaveDayToday(resolved, feastInfo)) return "teDeum";
  if (resolved.weekdayName === "Saturday" && !isPenitential) return "teDeum"; // approximation of the Saturday Office of St. Mary
  return "benedicite";
}

/**
 * Compline's three seasonal choices: the antiphon said before/after the
 * four fixed Psalms (4, 31, 91, 134), the antiphon said before/after the
 * Nunc Dimittis, and which of the four Office Hymns is sung. Each uses
 * seasonKeyFor as its base signal, then narrows to the specific set of
 * options Compline.tex actually offers (which is a smaller set of
 * seasons than Mattins' Invitatory - e.g. there's no separate Compline
 * Psalm antiphon for Advent or Passiontide, so those fall through to
 * "Throughout the Year").
 */
function pickComplinePsalmAntiphon(resolved) {
  const seasonKey = seasonKeyFor(resolved.periodKey);
  if (seasonKey === "christmas") return "christmastide";
  if (seasonKey === "epiphany") return "epiphanyOctave";
  if (seasonKey === "lent") return "lent";
  if (seasonKey === "eastertide" || seasonKey === "ascensiontide") return "eastertide";
  return "throughoutYear";
}

function pickComplineNuncAntiphon(resolved) {
  const seasonKey = seasonKeyFor(resolved.periodKey);
  if (seasonKey === "advent") return "advent";
  if (seasonKey === "christmas") return "christmastide";
  if (seasonKey === "epiphany") return "epiphanyOctave";
  if (seasonKey === "lent") return "lent";
  if (seasonKey === "passiontide") return "passiontide";
  if (seasonKey === "eastertide" || seasonKey === "ascensiontide") return "eastertide";
  return "throughoutYear";
}

/**
 * Picks "ferial", "feastsAndSundays", "lent", or "eastertide" for the
 * Office Hymn. Compline.tex only labels four hymn variants (it doesn't
 * split out Advent/Christmas/Epiphany the way the Psalm/Nunc antiphons
 * do), so Sundays and Semidouble-or-higher feasts get the festal hymn,
 * Lent and Eastertide get their own, and everything else is Ferial.
 */
function pickComplineHymn(resolved, feastInfo) {
  const seasonKey = seasonKeyFor(resolved.periodKey);
  if (seasonKey === "lent") return "lent";
  if (seasonKey === "eastertide" || seasonKey === "ascensiontide") return "eastertide";
  const isSunday = resolved.weekdayName === "Sunday";
  if (isSunday || isHighRankToday(resolved, feastInfo)) return "feastsAndSundays";
  return "ferial";
}

/**
 * The four Little Hours (Prime, Terce, Sext, None) share one seasonal
 * pattern, so these three pickers are shared across all four templates
 * rather than duplicated per-Hour the way Compline's were (Compline's
 * hymn/antiphon option sets differ enough hour-to-hour that sharing
 * would have obscured more than it saved; the Little Hours' really are
 * the same shape).
 *
 * - pickLittleHourAntiphon: which Psalm antiphon (before/after that
 *   Hour's psalms) applies - the most granular of the three, with nine
 *   possible seasons matching what Prime/Terce/Sext/None.tex each list.
 *   Prime.tex doesn't have its own Passiontide antiphon (it only lists
 *   Advent/Christmastide/Epiphany Octave/Septuagesimatide/Lent/
 *   Eastertide/Festivals/Ferias) - rather than special-case that in
 *   code, prime-template.json just repeats its Lent antiphon under a
 *   "passiontide" key too, so this picker can stay generic.
 * - pickLittleHourChapter: which of the three Chapter variants
 *   (Ferias Throughout the Year / Sundays & Feast Days / Eastertide).
 * - pickLittleHourShortRespond: which of the three Short Respond variants
 *   (Ferial; Sundays & Feast Days outside Eastertide; Eastertide itself).
 *   Prime's Short Respond has no seasonal variants in the source, so
 *   prime-template.json doesn't use this placeholder at all.
 *
 *   Terce.tex's own source gives only ONE combined text block for this,
 *   headed "Sundays, Feasts, & in Eastertide," with "(alleluia, alleluia)"
 *   written parenthetically throughout - this codebase used to read that
 *   as one single "festal" variant covering all three occasions, alleluias
 *   included, verbatim with the parentheses kept in the rendered text.
 *   George's 9/4 note, task #155, relaying Augustine: "the '(alleluia,
 *   alleluia)' should be excised. Those alleluias should only be supplied
 *   during Eastertide, and without parentheses." That's the standard
 *   breviary-printing convention this source is actually using - a
 *   parenthetical word marks an optional seasonal insertion, not literal
 *   text to print with its parentheses intact on every occasion the
 *   heading covers - so terce-template.json's own "festal" variant was
 *   mechanically split into two: "festal" (ordinary Sundays/Feast Days,
 *   alleluia dropped entirely) and a new "eastertide" variant (alleluia
 *   kept, parentheses removed).
 */
function pickLittleHourAntiphon(resolved, feastInfo) {
  const seasonKey = seasonKeyFor(resolved.periodKey);
  if (seasonKey === "advent") return "advent";
  if (seasonKey === "christmas") return "christmastide";
  if (seasonKey === "epiphany") return "epiphanyOctave";
  if (seasonKey === "septuagesima") return "septuagesimatide";
  if (seasonKey === "lent") return "lent";
  if (seasonKey === "passiontide") return "passiontide";
  if (seasonKey === "eastertide" || seasonKey === "ascensiontide") return "eastertide";
  const isSunday = resolved.weekdayName === "Sunday";
  return (isSunday || isHighRankToday(resolved, feastInfo)) ? "festivalsThroughoutYear" : "feriasThroughoutYear";
}

function pickLittleHourChapter(resolved, feastInfo) {
  const seasonKey = seasonKeyFor(resolved.periodKey);
  if (seasonKey === "eastertide" || seasonKey === "ascensiontide") return "eastertide";
  const isSunday = resolved.weekdayName === "Sunday";
  return (isSunday || isHighRankToday(resolved, feastInfo)) ? "sundaysAndFeastDays" : "ferial";
}

function pickLittleHourShortRespond(resolved, feastInfo) {
  const seasonKey = seasonKeyFor(resolved.periodKey);
  if (seasonKey === "eastertide" || seasonKey === "ascensiontide") return "eastertide";
  const isSunday = resolved.weekdayName === "Sunday";
  return (isSunday || isHighRankToday(resolved, feastInfo)) ? "festal" : "ferial";
}

/**
 * Which of the four Marian Anthems is said at the end of Compline, per
 * Mary.tex's own rubric date-ranges:
 *   - Alma Redemptoris Mater: I Evensong of Advent I - II Evensong of the
 *     Purification (Candlemas, 2 Feb), inclusive. Has two V/R/Collect
 *     variants of its own (Advent, Christmastide) - see below.
 *   - Ave Regina Caelorum: Compline of the Purification - Compline of
 *     Spy Wednesday, inclusive.
 *   - Regina Caeli: I Evensong of Holy Saturday - I Evensong of Trinity
 *     Sunday, exclusive.
 *   - Salve Regina: I Evensong of Trinity Sunday - I Evensong of Advent
 *     I, exclusive.
 * None of this site's existing pickers need date-level (not just
 * periodKey-level) precision, because seasonKeyFor's buckets always
 * happen to line up with the actual season boundary. This one doesn't:
 * Candlemas falls in the *middle* of the "epiphany" bucket (and, in an
 * early-Easter year, can even fall after Septuagesima has already
 * started), so the Alma Redemptoris/Ave Regina boundary is resolved by
 * calendar date, not periodKey, whenever periodKey alone is ambiguous.
 * The Ember Days after Whitsunday resolve to their own standalone
 * periodKey ("Ember Wednesday"/"Friday"/"Saturday" - confirmed against
 * calendar.js's actual output, not assumed), which the "Trinity Sunday
 * onward" / "everything else" checks below would otherwise miss, so
 * they're matched explicitly. Advent's Ember Days resolve under
 * periodKey "Advent III" instead (with dayLabel "Ember Wednesday" etc.)
 * and are already caught by the `/^Advent/` check above - no collision
 * to resolve here, unlike collects-temporale.py's PropTime.tex parsing,
 * where both occurrences share one undifferentiated `\feastday` label.
 *
 * Per Mary.tex, no anthem at all is said on Maundy Thursday or Good
 * Friday (Regina Caeli doesn't begin until Holy Saturday) - this picker
 * returns null for those two days, and callers should render nothing
 * rather than a placeholder in that case.
 *
 * This site already collapses First/Second Evensong distinctions
 * elsewhere (see ROADMAP.md's Evensong-overlap note), so "I Evensong of
 * X" is treated as the start of X's own calendar day, matching how
 * every other seasonal picker in this file already works.
 */
function isOnOrBeforeCandlemas(date) {
  const m = date.getUTCMonth(); // 0-indexed
  const d = date.getUTCDate();
  if (m === 0) return true; // January
  if (m === 1 && d <= 2) return true; // 1-2 February
  return false;
}

function pickMarianAnthem(resolved) {
  const periodKey = resolved.periodKey;
  const dayLabel = resolved.dayLabel;
  const date = resolved.date;

  if (/^Advent/.test(periodKey)) return "almaRedemptorisAdvent";

  if (/^(Christmas|St\. Stephen|St\. John Evangelist|Holy Innocents|Circumcision|Most Holy Name)/.test(periodKey)) {
    return "almaRedemptorisChristmastide";
  }
  if (date && isOnOrBeforeCandlemas(date)) return "almaRedemptorisChristmastide";

  if (periodKey === "Palm Sunday" && (dayLabel === "Maundy Thursday" || dayLabel === "Good Friday")) return null;
  if (periodKey === "Palm Sunday" && dayLabel === "Easter Even") return "reginaCaeli";
  if (/^Easter/.test(periodKey)) return "reginaCaeli";
  if (periodKey === "Patronage of St. Joseph") return "reginaCaeli";
  if (periodKey === "Rogation Sunday") return "reginaCaeli";
  if (/^Ascension/.test(periodKey) || periodKey === "Sunday within Ascension Octave") return "reginaCaeli";
  if (periodKey === "Whitsunday") return "reginaCaeli";
  if (periodKey === "Ember Wednesday" || periodKey === "Ember Friday" || periodKey === "Ember Saturday") return "reginaCaeli"; // Whitsun Embers

  // George's follow-up (10/26) to the Christ the King investigation: the
  // Autumn Ember Days (newly given their own standalone periodKeys in
  // calendar.js's buildAnchorList, see that fix and ROADMAP.md) fall
  // well after Trinity Sunday, so - unlike the Whitsun Ember Days just
  // above, which fall before it - they belong under Salve Regina, not
  // Regina Caeli. Before this periodKey existed, these dates resolved
  // under their enclosing ordinary "Trinity N" periodKey and were
  // already correctly caught by the `/^Trinity /` check below; matched
  // explicitly here now that they have a periodKey of their own, so they
  // don't silently fall through to the pre-Trinity-Sunday "aveRegina"
  // default at the end of this function instead.
  if (/^Ember (Wednesday|Friday|Saturday) in Autumn$/.test(periodKey)) return "salveRegina";
  if (periodKey === "Trinity Sunday" || /^Trinity /.test(periodKey) || periodKey === "Corpus Christi" || periodKey === "Sunday Next before Advent") {
    return "salveRegina";
  }

  // Everything else post-Candlemas, pre-Holy Saturday: Septuagesima,
  // Sexagesima, Quinquagesima, Ash Wednesday, Lent I-IV, Passion Sunday,
  // and Palm Sunday week's non-Triduum days (Sunday-Spy Wednesday).
  return "aveRegina";
}

/**
 * Whether Mattins says the Athanasian Creed instead of the Apostles'
 * Creed today, per Mattins.tex's own rubric: "Upon these Feasts;
 * Christmas Day, the Epiphany, Saint Matthias, Easter Day, Ascension
 * Day, Whitsunday, Saint John Baptist, Saint James, Saint Bartholomew,
 * Saint Matthew, Saint Simon and Saint Jude, Saint Andrew, and upon
 * Trinity Sunday, shall be sung or said, instead of the Apostle's
 * Creed, the Athanasian Creed." Nine of these are fixed calendar dates
 * (checked by kalendarKey - simplest and most robust for a date that
 * never moves); the other four (Easter Day, Ascension Day, Whitsunday,
 * Trinity Sunday) are moveable feasts checked by periodKey. Each of
 * those four periodKeys spans more than one day (e.g. "Easter Day"
 * covers Easter Sunday through Easter Tuesday, per calendar.js), so
 * dayLabel === "Sunday" narrows to just the named day itself - this
 * site's own convention (confirmed against calendar.js's real output,
 * not assumed) for marking the "headline" day of a periodKey block,
 * regardless of what weekday it actually falls on.
 */
const ATHANASIAN_CREED_FIXED_DATES = new Set([
  "12-25", // Christmas Day
  "1-6",   // Epiphany
  "2-24",  // St. Matthias
  "6-24",  // St. John Baptist (Nativity)
  "7-25",  // St. James
  "8-24",  // St. Bartholomew
  "9-21",  // St. Matthew
  "10-28", // Sts. Simon & Jude
  "11-30", // St. Andrew
]);
const ATHANASIAN_CREED_MOVEABLE_PERIODS = new Set([
  "Easter Day", "Ascension Thursday", "Whitsunday", "Trinity Sunday",
]);

function isAthanasianCreedDay(resolved) {
  if (ATHANASIAN_CREED_FIXED_DATES.has(resolved.kalendarKey)) return true;
  return ATHANASIAN_CREED_MOVEABLE_PERIODS.has(resolved.periodKey) && resolved.dayLabel === "Sunday";
}

/**
 * Which Fore-Office Sentence-of-Scripture category (data/foreoffice.json's
 * `sentenceCategories`) applies today, for either Mattins (`hourType`
 * "morning") or Evensong ("evening"). Ported from pages/Office/
 * ForeOffice.tex, whose "General"/"Morning"/"Evening"/season/common-of-
 * saint headings are laid out as a reference the Minister picks "one or
 * more" from, not a strict single choice - for a single rendered page,
 * this picks exactly one category, in priority order: a named liturgical
 * season first (matching seasonKeyFor's granularity where it's fine-
 * grained enough, refined below for Whitsuntide/Trinity Sunday/Corpus
 * Christi specifically, since ForeOffice.tex splits those out of
 * seasonKeyFor's single "trinitytide" bucket); then, on an otherwise
 * "trinitytide" day, whichever Common-of-a-Saint category matches
 * today's actual winning feast (see pickCommonOfSaintCategory below);
 * then the Hour's own Morning/Evening set as the ordinary-day default.
 * "General" is reachable in principle but never actually chosen by this
 * function, since Morning/Evening always applies as a fallback - it's
 * kept in the data for completeness/manual reference, matching how
 * ForeOffice.tex itself prints it as the base, always-available column.
 */
const FOREOFFICE_SEASON_KEY_MAP = {
  advent: "advent",
  christmas: "christmastide",
  epiphany: "epiphanytide",
  septuagesima: "septuagesima",
  lent: "lent",
  passiontide: "passiontide",
  eastertide: "eastertide",
  ascensiontide: "ascensiontide",
};

/**
 * Common-of-a-Saint category for a winning feast's name, matched in
 * priority order (most specific identity first) against the vocabulary
 * actually used in data/kalendar.json's `name` field (confirmed by
 * direct search: 137 Martyr entries, 92 Bishop/68 Confessor/18 Doctor,
 * 18 Apostle/5 Evangelist, 14 Abbot, 44 Virgin/1 Matron, 3 Dedication).
 * "Blessed Sacrament" isn't a Kalendar name at all - it's Corpus
 * Christi's own Temporale periodKey, handled separately in
 * pickOpeningSentenceCategory. This is a heuristic, not a transcription
 * of any rubric telling us which category wins when a name matches more
 * than one (e.g. a martyred Bishop) - Martyr is checked first as the
 * more specific/older hagiographic category, then Apostle/Evangelist,
 * then Bishop/Confessor/Doctor, then Abbot, then the Blessed Virgin
 * Mary by name (checked before the generic Virgin/Matron category so a
 * feast that merely *mentions* the BVM in passing, e.g. "St. Joseph,
 * Spouse of the Blessed Virgin Mary, Confessor", doesn't wrongly match
 * her category - Confessor already claims that one first), then
 * Virgin/Matron, then Dedication of a Church.
 */
const COMMON_OF_SAINT_PATTERNS = [
  { category: "martyr", re: /Martyr/i },
  { category: "apostle", re: /Apostle|Evangelist/i },
  { category: "bishopConfessorDoctor", re: /Bishop|Confessor|Doctor/i },
  { category: "abbotMonk", re: /Abbot/i },
  { category: "blessedVirginMary", re: /Blessed Virgin Mary|Our Lady/i },
  { category: "virginMartyressMatron", re: /Virgin|Matron/i },
  { category: "dedicationOfChurch", re: /Dedication/i },
];

function pickCommonOfSaintCategory(name) {
  if (!name) return null;
  for (const { category, re } of COMMON_OF_SAINT_PATTERNS) {
    if (re.test(name)) return category;
  }
  return null;
}

function pickOpeningSentenceCategory(resolved, feastInfo, hourType) {
  const periodKey = resolved.periodKey;
  // ForeOffice.tex splits Whitsuntide, Trinity Sunday, and (via the
  // Blessed Sacrament category) Corpus Christi out of what
  // seasonKeyFor lumps together as one "trinitytide" bucket.
  if (periodKey === "Whitsunday" || periodKey === "Ember Wednesday" || periodKey === "Ember Friday" || periodKey === "Ember Saturday") {
    return "whitsuntide";
  }
  if (periodKey === "Trinity Sunday") return "trinitySunday";
  if (periodKey === "Corpus Christi") return "blessedSacrament";

  const seasonKey = seasonKeyFor(periodKey);
  const mapped = FOREOFFICE_SEASON_KEY_MAP[seasonKey];
  if (mapped) return mapped;

  // Ordinary Trinitytide (or any other day with no named season): defer
  // to today's actual winning feast, if any, before falling back to the
  // Hour's own Morning/Evening set.
  if (feastInfo && feastInfo.winner === "feast") {
    const saintCategory = pickCommonOfSaintCategory(feastInfo.name);
    if (saintCategory) return saintCategory;
  }
  return hourType === "evening" ? "evening" : "morning";
}

/**
 * Which ferial Office Hymn (the "hymnSlot" placeholder after each Lesson
 * at Mattins/Evensong - see Questions-for-Augustine.md Q5) applies today.
 * Sourced from the Breviary's pages/FerialHymns/FerialHymns.tex "Office
 * Hymns" section, which gives one hymn per weekday per Hour (Sunday
 * Mattins alone has a Winter/Summer pair rather than one fixed text).
 *
 * This only implements the FERIAL (weekday-cycle) hymn - i.e. exactly
 * the fallback case Q5's own note describes ("if there is no feast day
 * and the season does not indicate a particular hymn, you sing a ferial
 * hymn"). A feast or season with its own proper hymn would override this
 * on its own day, but that data hasn't been sourced/wired in yet (see
 * ROADMAP.md) - so this picker is applied unconditionally for now,
 * giving every day at least the correct ferial hymn rather than no hymn
 * text at all, honestly documented as a partial implementation.
 *
 * `hour` is "mattins" or "evensong" - Mattins additionally needs the
 * actual resolved date to place it before/after the Summer Hymns window
 * ("from the Second Sunday after Trinity until the Sunday within 28
 * September - 4 October, exclusive" - FerialHymns.tex's own rubric),
 * computed from the real Trinity Sunday date for the year in question
 * via getLiturgicalYearAnchors, not approximated by calendar month.
 */
function pickOfficeHymnSeason(resolved, hour) {
  const weekdayName = (resolved.weekdayName || "").toLowerCase();
  if (weekdayName !== "sunday") return weekdayName;
  if (hour !== "mattins") return "sunday";
  if (typeof getLiturgicalYearAnchors !== "function") return "winter"; // defensive fallback if computus.js isn't loaded
  const q = resolved.date;
  const anchors = getLiturgicalYearAnchors(q);
  const summerStart = addDaysLocal(anchors.trinitySunday, 14); // Second Sunday after Trinity
  // The Sunday within 28 September - 4 October is unique every year and
  // doesn't depend on Easter at all - find it directly from the query
  // date's own year.
  const year = q.getUTCFullYear();
  const sept28 = new Date(Date.UTC(year, 8, 28));
  const summerEnd = new Date(sept28.getTime() + ((7 - sept28.getUTCDay()) % 7) * 86400000);
  return q >= summerStart && q < summerEnd ? "summer" : "winter";
}

/**
 * Maps a Sanctorale feast name to the Commons.tex `\label{}` key whose
 * Office Hymn should be used when the feast has no proper hymn of its
 * own (see `data/feast-office-hymns.json`'s "commons" block, sourced from
 * this Breviary's Commons.tex). This is a fresh, hymn-specific mapping -
 * deliberately NOT reusing `pickCommonOfSaintCategory` above, because
 * that function's category priority (martyr checked before virgin/matron)
 * suits its own purpose (Fore-Office opening-sentence selection from
 * data/foreoffice.json) but is wrong here: Commons.tex's own "Common of
 * Virgins" section explicitly carries alternate Collects for "One Virgin
 * Martyress" alongside "One Virgin not a Martyress" under the SAME
 * hymn/antiphon set, i.e. the Breviary itself treats a virgin-martyr's
 * Office Hymn as belonging to the Virgins Common, not the generic
 * Martyrs Common - confirmed by direct inspection of Commons.tex (see
 * ROADMAP.md, 8/28 "feast/season Office Hymns" entry).
 *
 * `isEastertide` should be true for both the "eastertide" and
 * "ascensiontide" `seasonKeyFor()` values, matching how the rest of the
 * app already treats the Easter-to-Pentecost span as one block for
 * Office purposes (see the eastertide/ascensiontide check in app.js's
 * hymnSlot and other placeholder branches).
 *
 * This is necessarily a best-effort, name-string heuristic (the source
 * data has no structured gender/martyr-count metadata to key off), in
 * the same spirit as `COMMON_OF_SAINT_PATTERNS` above - a feast whose
 * name doesn't match any of these patterns (e.g. many named feasts of
 * Our Lord, or feasts with idiosyncratic titles) returns null and simply
 * falls through to the ferial hymn cycle, which is the existing,
 * long-standing fallback behaviour.
 */
function pickFeastCommonHymnLabel(name, isEastertide) {
  if (!name) return null;
  if (/Dedication/i.test(name)) return "CommonDedication";
  if (/Blessed Virgin Mary|Our Lady/i.test(name)) return "CommonBVM";
  if (/Matron/i.test(name)) return "CommonHolyMatrons";
  if (/Virgin/i.test(name)) return "CommonVirgin";
  if (/Apostle|Evangelist/i.test(name)) return isEastertide ? "CommonApostlesEaster" : "CommonApostles";
  if (/Martyr/i.test(name)) {
    if (!isEastertide) return "CommonMartyrs"; // no separate "single martyr, outside Eastertide" Common exists in this source
    const many = /\bSts?\.|&|\band\b/i.test(name);
    return many ? "CommonMartyrsEaster" : "CommonMartyrEaster";
  }
  if (/Bishop/i.test(name)) return "CommonConfessorBishop";
  if (/Confessor|Doctor|Abbot/i.test(name)) return "CommonConfessorNotBishop"; // Abbots explicitly rubric'd to reuse this Common's hymns/antiphons in Commons.tex
  return null;
}

if (typeof module !== "undefined") {
  module.exports = {
    pickInvitatorySeason, pickMorningCanticle, seasonKeyFor, isHighRankToday,
    pickComplinePsalmAntiphon, pickComplineNuncAntiphon, pickComplineHymn,
    pickLittleHourAntiphon, pickLittleHourChapter, pickLittleHourShortRespond,
    pickMarianAnthem, isAthanasianCreedDay,
    pickOpeningSentenceCategory, pickCommonOfSaintCategory,
    pickOfficeHymnSeason, pickFeastCommonHymnLabel,
  };
}
