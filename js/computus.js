/**
 * Liturgical computus for the 2025 Proposed Book of Common Prayer
 * (Antiochian Western Rite Vicariate).
 *
 * IMPORTANT: this BCP is Western Rite Orthodox. It keeps the fixed
 * (Gregorian) calendar for Christmas, Epiphany, etc., but calculates
 * Easter/Pascha and the whole moveable cycle on the ORTHODOX
 * (Julian-computus) date, not the Western Gregorian Easter date. This
 * was verified against pages/Front/TableYear.tex, whose sample years
 * (2027 Easter = 2 May, 2028 = 16 Apr, 2029 = 8 Apr, 2031 = 13 Apr,
 * etc.) only match the Julian/Orthodox computus converted to the
 * Gregorian calendar - they do NOT match the Western Gregorian Easter
 * algorithm. Get this wrong and every moveable-feast date in the site
 * is off by anywhere from 0 to 5 weeks.
 */

/** Julian-to-Gregorian calendar day offset. 13 days for AD 1900-2099. */
const JULIAN_GREGORIAN_OFFSET_DAYS = 13;

function addDays(date, days) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function utcDate(year, month, day) {
  // month is 1-indexed here for readability
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Orthodox Pascha (Easter), returned as a Gregorian-calendar UTC Date,
 * using the Meeus "Julian/Orthodox Easter" algorithm plus the
 * Julian->Gregorian offset.
 */
function orthodoxEaster(year) {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31); // 3 = March, 4 = April (Julian)
  const day = ((d + e + 114) % 31) + 1;
  const julianDate = utcDate(year, month, day);
  return addDays(julianDate, JULIAN_GREGORIAN_OFFSET_DAYS);
}

/** The Sunday on/nearest 30 November - i.e. the 4th Sunday before Christmas. */
function adventSunday(year) {
  // Advent Sunday belongs to the liturgical year that starts in `year` and
  // runs into `year + 1`. Christmas Day of that liturgical year is Dec 25 `year`.
  const christmas = utcDate(year, 12, 25);
  const christmasWeekday = christmas.getUTCDay(); // 0 = Sunday
  // The Sunday on/before Christmas:
  const sundayOnOrBeforeChristmas = addDays(christmas, -christmasWeekday);
  // Advent Sunday is the 4th Sunday before Christmas (inclusive counting),
  // i.e. 3 Sundays before "the Sunday on/before Christmas" UNLESS Christmas
  // itself falls on a Sunday, in which case that IS the 4th Sunday and
  // Advent I is 3 weeks earlier still. Either way: subtract 21 days from
  // the Sunday on/before Christmas gives the correct Advent Sunday.
  return addDays(sundayOnOrBeforeChristmas, -21);
}

function dateOnly(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysBetween(a, b) {
  return Math.round((dateOnly(b) - dateOnly(a)) / 86400000);
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Given a query date, returns every anchor date relevant to computing
 * that date's position in the church year, for whichever "liturgical
 * year" the date falls in (a liturgical year runs Advent Sunday to the
 * Saturday before the next Advent Sunday).
 */
function getLiturgicalYearAnchors(queryDate) {
  const q = dateOnly(queryDate);
  const calYear = q.getUTCFullYear();

  // Figure out which liturgical year (named by the calendar year its
  // Advent Sunday falls in) contains this date.
  let advYear = calYear;
  if (daysBetween(adventSunday(calYear), q) < 0) {
    advYear = calYear - 1;
  }
  // Guard: if the date is actually before that Advent Sunday still
  // (can happen for very early-January dates relative to a late Advent),
  // step back further; if it's on/after next year's Advent Sunday, step forward.
  while (daysBetween(adventSunday(advYear), q) < 0) advYear -= 1;
  while (daysBetween(adventSunday(advYear + 1), q) >= 0) advYear += 1;

  const christmasYear = advYear; // Christmas Day belonging to this liturgical year
  const easter = orthodoxEaster(advYear + 1); // Easter falls in the calendar year AFTER Advent starts

  const anchors = {
    adventSunday: adventSunday(advYear),
    christmas: utcDate(christmasYear, 12, 25),
    stStephen: utcDate(christmasYear, 12, 26),
    stJohnEvangelist: utcDate(christmasYear, 12, 27),
    holyInnocents: utcDate(christmasYear, 12, 28),
    circumcision: utcDate(christmasYear + 1, 1, 1),
    holyName: utcDate(christmasYear + 1, 1, 2),
    epiphany: utcDate(christmasYear + 1, 1, 6),
    septuagesima: addDays(easter, -63),
    sexagesima: addDays(easter, -56),
    quinquagesima: addDays(easter, -49),
    ashWednesday: addDays(easter, -46),
    lentI: addDays(easter, -42),
    lentII: addDays(easter, -35),
    lentIII: addDays(easter, -28),
    lentIV: addDays(easter, -21),
    passionSunday: addDays(easter, -14),
    palmSunday: addDays(easter, -7),
    easterDay: easter,
    easterI: addDays(easter, 7),
    easterII: addDays(easter, 14),
    easterIII: addDays(easter, 21),
    easterIV: addDays(easter, 28),
    rogationSunday: addDays(easter, 35),
    ascensionThursday: addDays(easter, 39),
    sundayWithinAscensionOctave: addDays(easter, 42),
    whitsunday: addDays(easter, 49),
    trinitySunday: addDays(easter, 56),
    corpusChristi: addDays(easter, 60), // Thursday after Trinity Sunday
    emberWedWhitsun: addDays(easter, 52),
    emberFriWhitsun: addDays(easter, 54),
    emberSatWhitsun: addDays(easter, 55),
    vigilOfPentecost: addDays(easter, 48), // Saturday before Whitsunday
  };

  // Ember days in Lent: Wed/Fri/Sat of the week after Lent I Sunday.
  anchors.emberWedLent = addDays(anchors.lentI, 3);
  anchors.emberFriLent = addDays(anchors.lentI, 5);
  anchors.emberSatLent = addDays(anchors.lentI, 6);

  // Ember days in Advent: Wed/Fri/Sat of the week after Advent III Sunday
  // (the 3rd Sunday of Advent).
  const adventIII = addDays(anchors.adventSunday, 14);
  anchors.emberWedAdvent = addDays(adventIII, 3);
  anchors.emberFriAdvent = addDays(adventIII, 5);
  anchors.emberSatAdvent = addDays(adventIII, 6);

  // Ember days in September (Holy Cross Embertide): Wed/Fri/Sat of the week
  // containing 14 September (Exaltation of the Holy Cross). Verified against
  // the 2026 Ordo: 14 Sept 2026 is a Monday, and the Ember days fall on the
  // Wed/Fri/Sat of that same week (16/18/19 Sept), i.e. the Sunday on/before
  // 14 Sept, +3/+5/+6 days.
  const holyCross = utcDate(christmasYear + 1, 9, 14);
  const holyCrossWeekday = holyCross.getUTCDay();
  const sundayOnOrBeforeHolyCross = addDays(holyCross, -holyCrossWeekday);
  anchors.emberWedSeptember = addDays(sundayOnOrBeforeHolyCross, 3);
  anchors.emberFriSeptember = addDays(sundayOnOrBeforeHolyCross, 5);
  anchors.emberSatSeptember = addDays(sundayOnOrBeforeHolyCross, 6);

  // Trinity I..XXIV are successive Sundays after Trinity Sunday.
  anchors.trinity = [];
  for (let i = 1; i <= 24; i++) {
    anchors.trinity.push(addDays(anchors.trinitySunday, 7 * i));
  }
  anchors.nextAdventSunday = adventSunday(advYear + 1);
  anchors.sundayNextBeforeAdvent = addDays(anchors.nextAdventSunday, -7);
  anchors.liturgicalYearStart = advYear;

  // Epiphany I..VIII are successive Sundays after Epiphany, but only as
  // many as fit before Septuagesima (first Sunday after Epiphany, +7/week).
  const epiphanyWeekday = anchors.epiphany.getUTCDay();
  const firstSundayAfterEpiphany = addDays(anchors.epiphany, (7 - epiphanyWeekday) % 7 === 0 ? 7 : (7 - epiphanyWeekday));
  anchors.epiphanySundays = [];
  for (let i = 0; i < 8; i++) {
    const d = addDays(firstSundayAfterEpiphany, 7 * i);
    if (daysBetween(d, anchors.septuagesima) > 0) {
      anchors.epiphanySundays.push(d);
    }
  }

  return anchors;
}

if (typeof module !== "undefined") {
  module.exports = { orthodoxEaster, adventSunday, getLiturgicalYearAnchors, addDays, dateOnly, daysBetween, WEEKDAY_NAMES };
}
