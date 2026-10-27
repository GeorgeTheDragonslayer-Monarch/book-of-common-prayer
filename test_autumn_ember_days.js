// George's follow-up (10/26) to the Christ the King investigation: "Is
// there a way to check if this issue will occur with any other feasts?"
// -> yes, a systematic audit of every PropSeas.tex/PropTime.tex block
// with a header + \feastday but no \feastdate (the exact signature that
// made Christ the King unreachable) turned up two more genuine gaps of
// the same bug class: Patronage of St. Joseph (see
// test_patronage_and_compassion.js) and the Autumn Ember Days, tested
// here. "Go ahead" (George's reply) covered fixing both.
//
// Root cause: computus.js's getLiturgicalYearAnchors already computed
// anchors.emberWedSeptember/emberFriSeptember/emberSatSeptember (the
// Wed/Fri/Sat of the week containing 14 September, Holy Cross
// Embertide), but js/calendar.js's buildAnchorList never anchored them,
// so these three days always fell through to whatever ordinary
// Trinitytide Sunday's bucket contained that date - full Mass Propers
// and Office Lessons for all three days were already fully transcribed
// (from PropTime.tex lines 2785-3103 and Lectionary.tex lines 1446-1468)
// into data/collects-temporale.json and data/lectionary-temporale.json
// under new "Ember Wednesday in Autumn"/"Ember Friday in Autumn"/"Ember
// Saturday in Autumn" periodKeys (distinct from the pre-existing
// Whitsun-only "Ember Wednesday"/"Ember Friday"/"Ember Saturday" keys,
// which hold entirely different propers), but nothing could ever reach
// them.
//
// Fixed with:
//   - js/calendar.js's buildAnchorList: three new anchor entries for
//     the three days above.
//   - js/calendar.js's resolveLiturgicalDay: a small special case for
//     the single Thursday sitting between Ember Wednesday in Autumn and
//     Ember Friday in Autumn (not itself an Ember day - Autumn
//     Embertide is Wed/Fri/Sat only), which would otherwise show no
//     Office at all (the Ember Wednesday bucket has only one day-key,
//     unlike Patronage of St. Joseph/Compassion of Our Lord's own
//     multi-day Simple Octave buckets) - recomputed from whichever
//     Trinity week anchor would have governed the date absent the Ember
//     anchors, since (unlike Whitsun's own fixed, Easter-measured
//     "Whit-Thursday") this Thursday's true content varies by year.
//   - js/liturgical-color.js's seasonBaseColor: a new violet rule for
//     the three new periodKeys (PropTime.tex's own "{LentenViolet}").
//   - js/ranking.js's SECOND_CLASS_FERIA_KEYS: three new entries, and a
//     classifySeasonDay special case checked ahead of classifyVigil -
//     PropTime.tex states this rubric for these three days verbatim
//     ("no Feast is kept unless it be a First or Second Class Double"),
//     and a live 2026-09-19 check found it could otherwise be weakened
//     by a same-date Common Vigil's own, looser tier>=4 threshold.
//   - js/office-variants.js's pickMarianAnthem: a new Salve Regina rule
//     for the three new periodKeys - they fall well after Trinity
//     Sunday, so (unlike the Whitsun Ember Days, which fall before it)
//     they take Salve Regina, not Regina Caeli; before this periodKey
//     existed they were correctly caught by the generic `/^Trinity /`
//     check (since they resolved under their enclosing Trinity week),
//     so this is needed now that they have a periodKey of their own.
//   - js/app.js's isOfficeOfOurLadyToday: the Autumn Ember Saturday
//     exclusion this function's own comment used to flag as an open gap
//     ("September's Ember Saturday has no periodKey of its own to check
//     in this codebase at all") is now closed - see
//     test_saturday_office_of_our_lady.js's own updated exclusions list.
const fs = require("fs");
const { JSDOM } = require("jsdom");

function makeDom() {
  const html = fs.readFileSync("index.html", "utf-8");
  const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously" });
  const { window } = dom;
  const scripts = ["js/data-psalter.js","js/data-kalendar.js","js/data-lectionary.js",
    "js/data-evensong-template.js","js/data-mattins-template.js","js/data-foreoffice.js","js/data-compline-template.js",
    "js/data-prime-template.js","js/data-terce-template.js","js/data-sext-template.js","js/data-none-template.js",
    "js/data-collects-temporale.js","js/data-collects-sanctorale.js","js/data-kjv.js","js/data-apocrypha.js",
    "js/data-marian-anthems.js","js/data-athanasian-creed.js","js/data-old-testament-canticles.js","js/data-great-litany.js","js/data-litany-saints.js",
    "js/data-mass-ordinary.js","js/data-mass-prefaces.js","js/data-confession.js","js/data-communion-sick.js","js/data-purification.js",
    "js/data-burial-child.js","js/data-confirmation.js","js/data-reception.js","js/data-matrimony.js","js/data-baptism.js",
    "js/data-unction.js","js/data-burial.js","js/data-adult-baptism.js","js/data-family.js",
    "js/data-asperges.js","js/data-foremass.js","js/data-preparation.js","js/data-thanksgiving.js","js/data-benediction.js",
    "js/data-vesper-dead.js","js/data-lauds-dead.js","js/data-matins-dead.js","js/data-votive.js",
    "js/data-feast-office-hymns.js",
    "js/computus.js","js/calendar.js","js/psalms.js","js/liturgical-color.js","js/office-variants.js",
    "js/ranking.js","js/scripture.js","js/app.js"];
  for (const s of scripts) {
    const el = window.document.createElement("script");
    el.textContent = fs.readFileSync(s, "utf-8");
    window.document.body.appendChild(el);
  }
  return dom;
}
function clickCalendarDay(win, doc, y, m0, day) {
  doc.getElementById("calendarToggle").click();
  const popover = doc.getElementById("calendarPopover");
  const yearSel = popover.querySelector(".cal-year-select");
  if (yearSel) { yearSel.value = String(y); yearSel.dispatchEvent(new popover.ownerDocument.defaultView.Event("change")); }
  const monthSel = popover.querySelector(".cal-month-select");
  if (monthSel) { monthSel.value = String(m0); monthSel.dispatchEvent(new popover.ownerDocument.defaultView.Event("change")); }
  const dayBtn = Array.from(popover.querySelectorAll("[data-cal-day]")).find((b) => parseInt(b.dataset.calDay, 10) === day);
  if (dayBtn) dayBtn.click();
}
function officeBodyText(win, doc, hourHash) {
  win.location.hash = hourHash;
  win.dispatchEvent(new win.Event("hashchange"));
  return doc.getElementById("officeBody").textContent;
}
function massBodyText(win, doc) {
  win.location.hash = "#mass";
  win.dispatchEvent(new win.Event("hashchange"));
  return doc.getElementById("massBody").textContent;
}

let failed = false;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failed = true;
}

const VIOLET_RGB = "rgb(91, 58, 110)";
const GREEN_RGB = "rgb(47, 107, 63)";

// 1. Ember Wednesday in Autumn, 16 Sept 2026: anchored, violet, its own
// Mass Propers rendering, and two fixed Kalendar entries (a Double and a
// Memorial, neither tier>=6) correctly demoted to commemorations rather
// than winning the day.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 8, 16); // 16 Sept 2026 (month 0-indexed: 8 = September)
  const mattinsBody = officeBodyText(win, doc, "#office/mattins");
  check('16 Sept 2026: page title is "Ember Wednesday in Autumn"', doc.getElementById("seasonLabel").textContent.trim() === "Ember Wednesday in Autumn");
  check("16 Sept 2026: liturgical colour is violet", win.document.documentElement.style.getPropertyValue("--accent") === "#5b3a6e");
  check("16 Sept 2026: Sts. Cornelius & Cyprian (Double, tier 4) is only commemorated, not winning",
    doc.getElementById("kalendarLine").textContent.includes("Cornelius"));
  check("16 Sept 2026 Mattins: Collect heading names no competing Feast (season's own Collect wins)",
    Array.from(doc.querySelectorAll(".collect-heading")).some((e) => e.textContent.trim() === "The Collect"));
  const massBody = massBodyText(win, doc);
  check("16 Sept 2026 Mass: Collect text (\"our frailty may be upheld\")", /our frailty may be upheld/.test(massBody));
  check("16 Sept 2026 Mass: Epistle Amos 9:13", /Amos 9:13/.test(massBody) && /the plowman shall overtake the reaper/.test(massBody));
  check("16 Sept 2026 Mass: Gradual (\"Blessed are the people\" - the second, kept per the Whitsun Ember Saturday precedent of using the responsory immediately before the Gospel)",
    /Blessed are the people, whose God is the Lord/.test(massBody));
  check("16 Sept 2026 Mass: Gospel Mark 9:17 (the dumb spirit)", /Mark 9:17/.test(massBody) && /dumb spirit/.test(massBody));
  // Office Lessons, from Lectionary.tex's "Lessons for the Autumnal
  // Ember Days" table.
  check("16 Sept 2026 Mattins: First Lesson Genesis 14:13-20", /Genesis 14:13-20/.test(mattinsBody));
  check("16 Sept 2026 Mattins: Second Lesson Hebrews 4:14-5:10", /Hebrews 4:14-5:10/.test(mattinsBody));
  const evensongBody = officeBodyText(win, doc, "#office/evensong");
  check("16 Sept 2026 II Evensong: First Lesson 1 Kings 19", /1 Kings 19/.test(evensongBody));
  check("16 Sept 2026 II Evensong: Second Lesson 1 Timothy 3", /1 Timothy 3/.test(evensongBody));
}

// 2. The single Thursday between Ember Wednesday and Ember Friday in
// Autumn (17 Sept 2026) is NOT itself an Ember day - it must show the
// ordinary Trinitytide feria that would have governed it absent the new
// anchors (green, the correct Trinity week's own Thursday lessons),
// confirming the calendar.js special case recovers this day rather than
// leaving it blank.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 8, 17); // 17 Sept 2026
  const mattinsBody = officeBodyText(win, doc, "#office/mattins");
  check('17 Sept 2026: page title is "Thursday after the Fourteenth Sunday after Trinity", not an Ember day',
    doc.getElementById("seasonLabel").textContent.trim() === "Thursday after the Fourteenth Sunday after Trinity");
  check("17 Sept 2026: liturgical colour is green (ordinary Trinitytide), not violet",
    win.document.documentElement.style.getPropertyValue("--accent") === "#2f6b3f");
  check("17 Sept 2026 Mattins: shows real lessons (recovered from Trinity XIV's own Thursday), not blank",
    mattinsBody.length > 500);
}

// 3. Ember Friday in Autumn, 18 Sept 2026: anchored, violet, its own
// Mass Propers, no competing Kalendar entry that year.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 8, 18); // 18 Sept 2026
  const mattinsBody = officeBodyText(win, doc, "#office/mattins");
  check('18 Sept 2026: page title is "Ember Friday in Autumn"', doc.getElementById("seasonLabel").textContent.trim() === "Ember Friday in Autumn");
  check("18 Sept 2026: liturgical colour is violet", win.document.documentElement.style.getPropertyValue("--accent") === "#5b3a6e");
  check("18 Sept 2026 Mattins: First Lesson Numbers 17:1-18:7", /Numbers 17:1-18:7/.test(mattinsBody));
  const evensongBody = officeBodyText(win, doc, "#office/evensong");
  check("18 Sept 2026 II Evensong: First Lesson 2 Kings 2:1-22", /2 Kings 2:1-22/.test(evensongBody));
  const massBody = massBodyText(win, doc);
  check("18 Sept 2026 Mass: Collect text (\"year by year devoutly keep\")", /year by year devoutly keep this holy observance/.test(massBody));
  check("18 Sept 2026 Mass: Epistle Hosea 14:1", /Hosea 14:1/.test(massBody) && /O Israel, return unto the Lord/.test(massBody));
  check("18 Sept 2026 Mass: Gospel Luke 7:36 (the woman which was a sinner)", /Luke 7:36/.test(massBody) && /which was a sinner/.test(massBody));
}

// 4. Ember Saturday in Autumn, 19 Sept 2026: this is also the Vigil of
// St. Matthew (moved here from Sunday 9-20) AND Sts. Januarius &
// Companions, Martyrs, Double (tier 4) - a live collision found while
// implementing this fix. PropTime.tex's own rubric for these three days
// ("no Feast is kept unless it be a First or Second Class Double") must
// still protect Ember Saturday's own Mass/colour even though a Common
// Vigil is present (which, on its own, only needs tier>=4 to be
// outranked) - confirming the js/ranking.js classifySeasonDay ordering
// fix. The page title itself still shows the moved Vigil's name per the
// pre-existing, unrelated task #216 rule (show a Vigil's name when no
// Feast outranks the season) - see test_vigil_title.js.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 8, 19); // 19 Sept 2026
  const mattinsBody = officeBodyText(win, doc, "#office/mattins");
  check('19 Sept 2026: page title shows the moved Vigil ("Vigil of St. Matthew, Vigil")',
    doc.getElementById("seasonLabel").textContent.trim() === "Vigil of St. Matthew, Vigil");
  check("19 Sept 2026: liturgical colour is still violet (Ember Saturday's own season wins, not the plain Double)",
    win.document.documentElement.style.getPropertyValue("--accent") === "#5b3a6e");
  check("19 Sept 2026: Sts. Januarius & Companions (Double, tier 4) is only commemorated, not winning",
    doc.getElementById("kalendarLine").textContent.includes("Januarius"));
  check("19 Sept 2026 Mattins: First Lesson Deuteronomy 14:22", /Deuteronomy 14:22/.test(mattinsBody));
  const evensongBody = officeBodyText(win, doc, "#office/evensong");
  check("19 Sept 2026 II Evensong: First Lesson Ezekiel 34:1-16", /Ezekiel 34:1-16/.test(evensongBody));
  const massBody = massBodyText(win, doc);
  check("19 Sept 2026 Mass: Collect text (\"salutary continence\")", /salutary continence/.test(massBody));
  check("19 Sept 2026 Mass: Epistle Leviticus 23:26 (day of atonement)", /Leviticus 23:26/.test(massBody) && /day of atonement/.test(massBody));
  check("19 Sept 2026 Mass: Tract (\"O praise the Lord, all ye heathen\")", /O praise the Lord, all ye heathen/.test(massBody));
  check("19 Sept 2026 Mass: Gospel Luke 13:6 (the barren fig tree)", /Luke 13:6/.test(massBody) && /fig tree planted in his vineyard/.test(massBody));
}

// 5. Ember Saturday in Autumn with no same-date Kalendar entry at all
// (16 Sept 2028) - confirms the page title itself is "Ember Saturday in
// Autumn" when nothing else is competing for it, not just the
// commemoration/colour behaviour the collision case above covers.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2028, 8, 16); // 16 Sept 2028
  officeBodyText(win, doc, "#office/mattins");
  check('16 Sept 2028: page title is plainly "Ember Saturday in Autumn" with no collision',
    doc.getElementById("seasonLabel").textContent.trim() === "Ember Saturday in Autumn");
  check("16 Sept 2028: liturgical colour is violet", win.document.documentElement.style.getPropertyValue("--accent") === "#5b3a6e");
}

// 6. Ember Saturday in Autumn coinciding with the Exaltation of the Holy
// Cross itself (14 Sept 2030, when Holy Cross falls on a Saturday) -
// Exaltation of the Holy Cross is "Greater Double" (tier 5), which does
// NOT clear this rubric's own tier>=6 threshold, so Ember Saturday's own
// Office/Mass must still win, with Holy Cross only commemorated -
// despite Holy Cross being a real, well-ranked Feast, not a throwaway
// Memorial.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2030, 8, 14); // 14 Sept 2030
  officeBodyText(win, doc, "#office/mattins");
  check('14 Sept 2030: page title is "Ember Saturday in Autumn", not the Exaltation of the Holy Cross',
    doc.getElementById("seasonLabel").textContent.trim() === "Ember Saturday in Autumn");
  check("14 Sept 2030: liturgical colour is violet, not white/gold", win.document.documentElement.style.getPropertyValue("--accent") === "#5b3a6e");
  check("14 Sept 2030: the Exaltation of the Holy Cross (Greater Double, tier 5) is only commemorated",
    doc.getElementById("kalendarLine").textContent.includes("Exaltation of the Holy Cross"));
}

// 7. Marian Anthem: all three Autumn Ember Days fall well after Trinity
// Sunday, so they take Salve Regina - not Regina Caeli, which the
// Whitsun Ember Days (falling before Trinity Sunday) correctly keep.
{
  const dom = makeDom();
  const win = dom.window;
  for (const [y, m, d, label] of [[2026, 8, 16, "Ember Wednesday in Autumn"], [2026, 8, 18, "Ember Friday in Autumn"], [2026, 8, 19, "Ember Saturday in Autumn"]]) {
    const resolved = win.resolveLiturgicalDay(new Date(Date.UTC(y, m, d)), win.LECTIONARY_DATA, win.KALENDAR_DATA);
    check(`${label} (${y}-${m + 1}-${d}): Marian Anthem is Salve Regina, not Ave Regina`, win.pickMarianAnthem(resolved) === "salveRegina");
  }
  const whitsunResolved = win.resolveLiturgicalDay(new Date(Date.UTC(2026, 5, 6)), win.LECTIONARY_DATA, win.KALENDAR_DATA); // Whitsun Ember Saturday, 2026 (6 June)
  check("Whitsun's own Ember Saturday still correctly keeps Regina Caeli (control, unaffected by this fix)",
    win.pickMarianAnthem(whitsunResolved) === "reginaCaeli");
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
