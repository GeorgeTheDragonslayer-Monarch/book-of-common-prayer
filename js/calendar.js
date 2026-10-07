/**
 * Resolves a calendar date to a spot in the Proper of Season lectionary
 * table (data/lectionary-temporale.json) plus the fixed Sanctorale
 * (data/kalendar.json).
 *
 * Known limitation (documented, not hidden): this does NOT implement the
 * full ranking/precedence/transfer engine described in
 * pages/Front/Ranking.tex (Doubles outranking Sundays, Octaves,
 * privileged Vigils, transferred feasts, etc). It resolves the *default*
 * Proper of Season/Sanctorale position for a date. When a fixed feast
 * from the Kalendar should actually outrank or be commemorated alongside
 * the temporale office on a given day, that adjustment isn't made here
 * yet - see ROADMAP.md.
 */

/* global getLiturgicalYearAnchors, daysBetween, dateOnly */
var getLiturgicalYearAnchors, daysBetween, dateOnly; // eslint-disable-line no-var
if (typeof require === "function" && typeof module !== "undefined") {
  const computus = require("./computus.js");
  getLiturgicalYearAnchors = computus.getLiturgicalYearAnchors;
  daysBetween = computus.daysBetween;
  dateOnly = computus.dateOnly;
}

function monthName(idx0) {
  return ["January","February","March","April","May","June","July","August","September","October","November","December"][idx0];
}

/**
 * Builds the ordered list of {date, periodKey} anchors for the
 * liturgical year containing `queryDate`, in chronological order.
 */
function buildAnchorList(anchors) {
  const list = [
    [anchors.adventSunday, "Advent I"],
    [addDaysLocal(anchors.adventSunday, 7), "Advent II"],
    [addDaysLocal(anchors.adventSunday, 14), "Advent III"],
    [addDaysLocal(anchors.adventSunday, 21), "Advent IV"],
    [anchors.christmas, "Christmas"],
    [anchors.stStephen, "St. Stephen"],
    [anchors.stJohnEvangelist, "St. John Evangelist"],
    [anchors.holyInnocents, "Holy Innocents"],
    [addDaysLocal(anchors.christmas, 6), "Christmas I"], // Sunday after Christmas (approx; falls back gracefully if not a Sunday)
    [anchors.circumcision, "Circumcision"],
    [anchors.holyName, "Most Holy Name of Jesus"],
    [addDaysLocal(anchors.circumcision, 6), "Christmas II"],
    [anchors.epiphany, "Epiphany"],
    [anchors.septuagesima, "Septuagesima"],
    [anchors.sexagesima, "Sexagesima"],
    [anchors.quinquagesima, "Quinquagesima"],
    [anchors.ashWednesday, "Ash Wednesday"],
    [anchors.lentI, "Lent I"],
    [anchors.lentII, "Lent II"],
    [anchors.lentIII, "Lent III"],
    [anchors.lentIV, "Lent IV"],
    [anchors.passionSunday, "Passion Sunday"],
    [anchors.palmSunday, "Palm Sunday"],
    [anchors.easterDay, "Easter Day"],
    [anchors.easterI, "Easter I"],
    [anchors.easterII, "Easter II"],
    [anchors.easterIII, "Easter III"],
    [anchors.easterIV, "Easter IV"],
    [anchors.rogationSunday, "Rogation Sunday"],
    [anchors.ascensionThursday, "Ascension Thursday"],
    [anchors.sundayWithinAscensionOctave, "Sunday within Ascension Octave"],
    [anchors.whitsunday, "Whitsunday"],
    [anchors.emberWedWhitsun, "Ember Wednesday"],
    [anchors.emberFriWhitsun, "Ember Friday"],
    [anchors.emberSatWhitsun, "Ember Saturday"],
    [anchors.trinitySunday, "Trinity Sunday"],
    // Corpus Christi (Trinity+4, a Thursday) previously had no anchor at
    // all here despite data/lectionary-temporale.json having a real
    // "Corpus Christi" periodKey (dayLabels Sunday/Friday/Saturday, i.e.
    // the Feast Day itself plus the following Friday/Saturday) - any
    // date on or after it silently fell through to "Trinity Sunday"'s
    // own bucket with an out-of-range offset (dayLabel resolving to
    // null). The remaining days of Corpus Christi's own Octave (the
    // Sunday-through-Thursday that follow) land exactly on "Trinity I"'s
    // own anchor (Trinity Sunday + 7 = Corpus Christi + 3, always, since
    // both are fixed offsets from Easter) - see js/ranking.js's
    // PRIVILEGED_OCTAVE_2ND_KEYS for how those dayLabels double as the
    // rest of this Octave.
    [anchors.corpusChristi, "Corpus Christi"],
  ];
  anchors.epiphanySundays.forEach((d, i) => list.push([d, `Epiphany ${toRoman(i + 1)}`]));
  anchors.trinity.forEach((d, i) => list.push([d, `Trinity ${toRoman(i + 1)}`]));
  // Pending-corrections fix (10/3, task #214, item #11): "The Feast of
  // the Compassion of Jesus Christ is missing from the Kalendar
  // entirely." PropSeas.tex places it "Friday after Trinity I" (Second
  // Class Double, Simple Octave) - and both data/collects-temporale.json
  // (Mass propers: Introit, Collect, Epistle, Gradual/Alleluia/Tract,
  // Gospel, Offertory, Secret, Communion, Postcommunion) and
  // data/lectionary-temporale.json (Office lessons) already have a
  // complete "Compassion of Our Lord" entry, each with exactly 3 day
  // keys ("Sunday" - this data's generic anchor-day label, reused here
  // for the Feast Day itself even though it actually falls on a Friday,
  // same convention as Corpus Christi's own "Sunday" dayLabel -
  // "Friday", "Saturday") - fully sourced and ready, just never given
  // an anchor here, so resolveLiturgicalDay could never actually reach
  // it on any date. Anchored at Trinity I + 5 days (the Friday of that
  // week), mirroring how Corpus Christi (Trinity Sunday + 4, also a
  // Thursday reusing the "Sunday" label) is anchored just above.
  list.push([addDaysLocal(anchors.trinity[0], 5), "Compassion of Our Lord"]);
  list.push([anchors.sundayNextBeforeAdvent, "Sunday Next before Advent"]);

  list.sort((a, b) => a[0] - b[0]);
  return list;
}

function addDaysLocal(date, days) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toRoman(n) {
  const numerals = [[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
  let result = "";
  for (const [value, symbol] of numerals) {
    while (n >= value) { result += symbol; n -= value; }
  }
  return result;
}

/** Builds a flat index of literal "D Month" sub-day keys -> {periodKey, dayKey} for gap-day fallback lookups. */
function buildLiteralDateIndex(lectionaryData) {
  const index = {};
  const dateKeyRe = /^\d{1,2} [A-Za-z]+$/;
  for (const periodKey of Object.keys(lectionaryData)) {
    for (const dayKey of Object.keys(lectionaryData[periodKey])) {
      if (dateKeyRe.test(dayKey)) {
        index[dayKey] = { periodKey, dayKey };
      }
    }
  }
  return index;
}

/**
 * Main entry point: resolve a Date to lectionary + kalendar info.
 * @param {Date} queryDate - a UTC-midnight Date
 * @param {object} lectionaryData - parsed data/lectionary-temporale.json
 * @param {object} kalendarData - parsed data/kalendar.json
 */
function resolveLiturgicalDay(queryDate, lectionaryData, kalendarData) {
  const q = dateOnly(queryDate);
  const anchors = getLiturgicalYearAnchors(q);
  const anchorList = buildAnchorList(anchors);

  // Find the greatest anchor <= query date.
  let segment = anchorList[0];
  for (const entry of anchorList) {
    if (daysBetween(entry[0], q) >= 0) segment = entry;
    else break;
  }
  const [segmentStart, initialPeriodKey] = segment;
  const offset = daysBetween(segmentStart, q);
  let periodKey = initialPeriodKey;

  let dayEntry = null;
  let dayLabel = null;
  const periodBucket = lectionaryData[periodKey];
  if (periodBucket) {
    const keys = Object.keys(periodBucket);
    if (offset >= 0 && offset < keys.length) {
      dayLabel = keys[offset];
      dayEntry = periodBucket[dayLabel];
    }
  }

  let fallbackUsed = false;
  if (!dayEntry) {
    const literalIndex = buildLiteralDateIndex(lectionaryData);
    const literalKey = `${q.getUTCDate()} ${monthName(q.getUTCMonth())}`;
    const hit = literalIndex[literalKey];
    if (hit) {
      dayEntry = lectionaryData[hit.periodKey][hit.dayKey];
      dayLabel = hit.dayKey;
      periodKey = hit.periodKey; // the literal-date lookup knows the true source section
      fallbackUsed = true;
    }
  }

  const kalendarKey = `${q.getUTCMonth() + 1}-${q.getUTCDate()}`;
  let kalendarEntries = (kalendarData && kalendarData[kalendarKey]) || [];

  const weekdayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][q.getUTCDay()];

  // George's 9/7 note, task #180: "Vigils which fall on Sunday are
  // moved back one day to the Saturday." A fixed-date Vigil ("1st
  // Vigil"/"2nd Vigil"/"Vigil" in data/kalendar.json) landing on a
  // Sunday isn't kept that day at all - the Sunday's own Office/Mass/
  // colour proceed exactly as an ordinary Sunday, and the Vigil's own
  // observance (on this site, currently only visible as its liturgical
  // colour and its ranking-classification "privileged-vigil-*"/"common-
  // vigil" competition rule - no Vigil Mass Propers text has been
  // transcribed into this site's data at all yet) is anticipated to the
  // day before instead. Implemented once, here, at the single choke
  // point every downstream consumer (ranking.js's classifyVigil,
  // liturgical-color.js's Vigil-violet check) already reads `resolved.
  // kalendar` through, rather than teaching each of them this rule
  // separately: a Vigil entry is stripped out of a Sunday's own
  // `kalendar`, and spliced into the *previous* day's (Saturday's)
  // instead - looked up directly from `kalendarData` by date, since
  // this function only ever resolves one day at a time.
  const isVigilRank = (e) => e.rank === "1st Vigil" || e.rank === "2nd Vigil" || e.rank === "Vigil";
  if (weekdayName === "Sunday") {
    kalendarEntries = kalendarEntries.filter((e) => !isVigilRank(e));
  } else if (weekdayName === "Saturday") {
    const tomorrow = new Date(Date.UTC(q.getUTCFullYear(), q.getUTCMonth(), q.getUTCDate() + 1));
    const tomorrowKey = `${tomorrow.getUTCMonth() + 1}-${tomorrow.getUTCDate()}`;
    const tomorrowVigil = ((kalendarData && kalendarData[tomorrowKey]) || []).find(isVigilRank);
    if (tomorrowVigil) kalendarEntries = kalendarEntries.concat([tomorrowVigil]);
  }

  return {
    date: q,
    periodKey,
    segmentStart,
    offset,
    dayLabel,
    weekdayName,
    seasonLabel: describeSeason(periodKey, offset, weekdayName, dayLabel),
    lectionary: dayEntry, // {psalms, lesson1, lesson2, ...} or null if not yet resolvable
    fallbackUsed,
    kalendar: kalendarEntries,
    kalendarKey, // "M-D" string, e.g. "12-25" - keys data/kalendar.json and data/collects-sanctorale.json
  };
}

/**
 * Produces a human label like anglicanoffice.com's "Thursday after the
 * Eighth Sunday after Trinity" for a weekday, or - per George's 9/1
 * note ("the Sundays should be printed out... it seems like the Proper
 * of the Season is not being consulted at all") - a proper Sunday name
 * like "The Twelfth Sunday after Trinity" for the Sunday itself.
 * Previously offset===0 short-circuited straight to the bare periodKey
 * ("Trinity XII"), which is how the Trinity/Epiphany Sundays specifically
 * ended up on screen as an unformatted internal key rather than their
 * actual English name - every other anchor's periodKey (Palm Sunday,
 * Whitsunday, Ash Wednesday, etc.) was already a proper English name on
 * its own, so only the Roman-numeral Trinity/Epiphany buckets needed
 * this at offset 0.
 */
// Pending-corrections fix (10/2): "In Holy Week, the proper titles should
// be used (e.g., 'Good Friday,' not 'Friday in [Holy/Palm Sunday]
// week')." Holy Week (Monday-Saturday following Palm Sunday) shares the
// single "Palm Sunday" periodKey bucket with every other week in this
// site's own data model (see app.js's isVeniteOmittedToday, which
// already has to compute Maundy Thursday/Good Friday/Easter Even
// directly from Easter's date for exactly this reason) - so the generic
// fallback below was printing "Thursday/Friday/Saturday in Palm Sunday"
// for these three days, and "Monday/Tuesday/Wednesday in Palm Sunday"
// for the rest of the week.
//
// This needs no invented names at all: data/lectionary-temporale.json's
// own "Palm Sunday" bucket already keys its seven days "Sunday", "Holy
// Monday", "Holy Tuesday", "Spy Wednesday", "Maundy Thursday",
// "Good Friday", "Easter Even" - the exact same six weekday names
// js/ranking.js's ALWAYS_SEASON_KEYS set and js/office-variants.js's
// Regina Caeli table already build their own "periodKey|dayLabel"
// lookups from. resolveLiturgicalDay (above) already resolves this
// string into `dayLabel` for every day of this week; it just wasn't
// being threaded into describeSeason. (Note: this book's own Propers
// name the day before Easter "Easter Even," not "Holy Saturday" - see
// its own printed chapter title, pages/Propers/EasterEvenCover.tex:
// `\caption{\textsc{\Huge{Easter Even}}}` - so "Easter Even" is used
// here too, for consistency with the rest of this codebase, even though
// "Holy Saturday" is also a traditional name for the day elsewhere.)
function describeSeason(periodKey, offset, weekdayName, dayLabel) {
  const trinityMatch = periodKey.match(/^Trinity (I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXI|XXII|XXIII|XXIV)$/);
  if (trinityMatch) {
    if (offset === 0) return `The ${ordinalWord(trinityMatch[1])} Sunday after Trinity`;
    return `${weekdayName} after the ${ordinalWord(trinityMatch[1])} Sunday after Trinity`;
  }
  const epiphanyMatch = periodKey.match(/^Epiphany (I|II|III|IV|V|VI|VII|VIII)$/);
  if (epiphanyMatch) {
    if (offset === 0) return `The ${ordinalWord(epiphanyMatch[1])} Sunday after Epiphany`;
    return `${weekdayName} after the ${ordinalWord(epiphanyMatch[1])} Sunday after Epiphany`;
  }
  if (periodKey === "Palm Sunday" && offset >= 1 && offset <= 6 && dayLabel) {
    return dayLabel;
  }
  if (offset === 0) return periodKey;
  return `${weekdayName} in ${periodKey}`;
}

const ROMAN_TO_WORD = {
  I: "First", II: "Second", III: "Third", IV: "Fourth", V: "Fifth", VI: "Sixth",
  VII: "Seventh", VIII: "Eighth", IX: "Ninth", X: "Tenth", XI: "Eleventh", XII: "Twelfth",
  XIII: "Thirteenth", XIV: "Fourteenth", XV: "Fifteenth", XVI: "Sixteenth", XVII: "Seventeenth",
  XVIII: "Eighteenth", XIX: "Nineteenth", XX: "Twentieth", XXI: "Twenty-First", XXII: "Twenty-Second",
  XXIII: "Twenty-Third", XXIV: "Twenty-Fourth",
};
function ordinalWord(roman) { return ROMAN_TO_WORD[roman] || roman; }

if (typeof module !== "undefined") {
  module.exports = { resolveLiturgicalDay, buildAnchorList, buildLiteralDateIndex, describeSeason, addDaysLocal };
}
