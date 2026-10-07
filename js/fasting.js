/**
 * Fasting & Abstinence classification for the Antiochian Western Rite
 * Vicariate's "ancient rule" fasting norms (restored 2012 per Bp. JOHN;
 * see https://www.orthodoxwest.com/fasting-norms), cross-validated
 * day-by-day against the 2026 Ordo (the Vicariate's own annual
 * liturgical calendar book, PDF supplied 2026). See ROADMAP.md for the
 * full derivation, including the specific Ordo entries used to confirm
 * or correct each rule below (a few of the Ordo's raw per-day symbols
 * are inconsistent - almost certainly PDF text-extraction artifacts,
 * not real rule differences - so the written prose rule was treated as
 * primary wherever the two disagreed).
 *
 * FASTING (one full meal after noon, plus a collation; obligatory from
 * age 21):
 *   - Every weekday (Mon-Sat) in Lent, Sundays excepted.
 *   - Monday, Wednesday, and Friday in Advent.
 *   - All 4 sets of Ember days (Lent, Whitsun, September/Holy Cross,
 *     Advent): the Wednesday, Friday, and Saturday of their Ember week.
 *   - The Vigils of Whitsunday (Pentecost), the Assumption, All Saints,
 *     and Christmas. If a Vigil's natural date is a Sunday, it is kept
 *     the preceding Saturday instead (Sunday is never a fasting day).
 *
 * ABSTINENCE (no meat/meat-juice, no quantity restriction; obligatory
 * from the age of reason):
 *   - Every Friday of the year, EXCEPT when Christmas Day itself falls
 *     on a Friday (abstinence is not of precept that day).
 *   - Every day of Lent, Sundays included (confirmed via the Ordo,
 *     which marks every single day Ash Wednesday-Holy Saturday with at
 *     least the abstinence symbol).
 *   - Every day of Advent, Sundays included (same pattern, confirmed via
 *     the Ordo marking every day Advent Sunday I-23 December).
 *   - Christmas Eve (24 December) specifically, regardless of weekday
 *     (confirmed via the Ordo: 24 Dec 2026, a Thursday, is still marked
 *     for both fasting and abstinence).
 */

/* global getLiturgicalYearAnchors, daysBetween, dateOnly, addDays */
var getLiturgicalYearAnchors, daysBetween, dateOnly, addDays; // eslint-disable-line no-var
if (typeof require === "function" && typeof module !== "undefined") {
  const computus = require("./computus.js");
  getLiturgicalYearAnchors = computus.getLiturgicalYearAnchors;
  daysBetween = computus.daysBetween;
  dateOnly = computus.dateOnly;
  addDays = computus.addDays;
}

function sameDate(a, b) {
  return daysBetween(a, b) === 0;
}

/** Inclusive range check: start <= q <= end. */
function between(q, start, end) {
  return daysBetween(start, q) >= 0 && daysBetween(q, end) >= 0;
}

/**
 * A fixed Vigil is kept on its natural calendar date, UNLESS that date
 * is a Sunday, in which case the fast is transferred to the preceding
 * Saturday (per the fasting-norms page: "when a fasting day falls upon
 * a Sunday, it is kept on the Saturday preceding that Sunday").
 */
function vigilObservedDate(naturalDate) {
  if (naturalDate.getUTCDay() === 0) return addDays(naturalDate, -1);
  return naturalDate;
}

/**
 * Classifies a date's fasting/abstinence status.
 * @param {Date} queryDate - any Date; only the Y/M/D (UTC) are used.
 * @returns {{isFasting: boolean, isAbstinence: boolean, labels: string[]}}
 */
function getFastingStatus(queryDate) {
  const q = dateOnly(queryDate);
  const anchors = getLiturgicalYearAnchors(q);
  const weekday = q.getUTCDay(); // 0 = Sunday .. 6 = Saturday

  let isFasting = false;
  let isAbstinence = false;
  const labels = [];

  const inLent = between(q, anchors.ashWednesday, addDays(anchors.easterDay, -1));
  const inAdvent = between(q, anchors.adventSunday, addDays(anchors.christmas, -1));

  if (inLent) {
    isAbstinence = true;
    if (weekday !== 0) {
      isFasting = true;
      labels.push("Weekday in Lent");
    } else {
      labels.push("Sunday in Lent");
    }
  }

  if (inAdvent) {
    isAbstinence = true;
    if (weekday === 1 || weekday === 3 || weekday === 5) {
      isFasting = true;
      labels.push("Monday/Wednesday/Friday in Advent");
    }
  }

  const emberDays = [
    [anchors.emberWedLent, "Ember Wednesday in Lent"],
    [anchors.emberFriLent, "Ember Friday in Lent"],
    [anchors.emberSatLent, "Ember Saturday in Lent"],
    [anchors.emberWedWhitsun, "Ember Wednesday in Pentecost"],
    [anchors.emberFriWhitsun, "Ember Friday in Pentecost"],
    [anchors.emberSatWhitsun, "Ember Saturday in Pentecost"],
    [anchors.emberWedSeptember, "Ember Wednesday in September"],
    [anchors.emberFriSeptember, "Ember Friday in September"],
    [anchors.emberSatSeptember, "Ember Saturday in September"],
    [anchors.emberWedAdvent, "Ember Wednesday in Advent"],
    [anchors.emberFriAdvent, "Ember Friday in Advent"],
    [anchors.emberSatAdvent, "Ember Saturday in Advent"],
  ];
  for (const [d, label] of emberDays) {
    if (sameDate(q, d)) {
      isFasting = true;
      labels.push(label);
      break;
    }
  }

  const isChristmasDay = sameDate(q, anchors.christmas);
  if (weekday === 5 && !isChristmasDay) {
    isAbstinence = true;
    labels.push("Friday abstinence");
  }

  const christmasEve = addDays(anchors.christmas, -1);
  if (sameDate(q, christmasEve)) {
    isFasting = true;
    isAbstinence = true;
    labels.push("Vigil of the Nativity");
  }

  // The year that August/October fall in, for this liturgical year (the
  // calendar year after Christmas - same convention as computus.js's
  // September Embertide anchor).
  const followingYear = anchors.epiphany.getUTCFullYear();
  const vigils = [
    [anchors.vigilOfPentecost, "Vigil of Pentecost"],
    [new Date(Date.UTC(followingYear, 7, 14)), "Vigil of the Assumption"], // 14 Aug
    [new Date(Date.UTC(followingYear, 9, 31)), "Vigil of All Saints"], // 31 Oct
  ];
  for (const [natural, label] of vigils) {
    const observed = vigilObservedDate(natural);
    if (sameDate(q, observed)) {
      isFasting = true;
      labels.push(label);
    }
  }

  return { isFasting, isAbstinence, labels };
}

if (typeof module !== "undefined") {
  module.exports = { getFastingStatus };
}
