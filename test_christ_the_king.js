const fs = require("fs");
const { JSDOM } = require("jsdom");

// George's 10/26 note: "Yesterday was the feast of Christ the King and
// the online BCP did not reflect that in the relevant offices. Conduct
// an investigation and find out what went wrong with the feast
// placement. Then correct the mistake."
//
// Root cause: Christ the King (pages/Propers/PropTime.tex: "Our Lord
// Jesus Christ the King," "First Class Double / Last Sunday in
// October," manually inserted between Sts. Simon & Jude and All
// Hallows, with its own Office Lessons/Psalms in
// pages/Lectionary/LectionaryFestivals.tex) was never wired into any of
// this site's data at all. Unlike every other Sanctorale feast, it has
// no \feastdate - it's kept on a computed civil date ("the last Sunday
// in October"), not a fixed one - so there was no "M-D" kalendarKey to
// hang a data/kalendar.json entry (or a data/collects-sanctorale.json/
// data/lectionary-festivals.json entry) off of. An existing code
// comment in js/app.js (by the Opening Sentence block, task #135/#137's
// area) already named this directly as a known, deliberately-deferred
// gap: "Christ the King also has one in the source, but it's a movable
// feast - no \feastdate to key it by - so it's left for a follow-up
// rather than guessed at here."
//
// Fixed with:
//   - js/calendar.js's resolveLiturgicalDay now injects a synthetic
//     Kalendar entry ({name: "Christ the King", rank: "1st Double",
//     isChristTheKing: true}) into `resolved.kalendar` whenever today
//     genuinely is the last Sunday of October - the same single choke
//     point its pre-existing Vigil-on-Sunday rule already uses, so
//     every downstream consumer of `resolved.kalendar`
//     (resolveFeastRankToday's ranking loop, the liturgical colour, the
//     "also commemorated" footnote dump) sees it exactly as a real
//     dated Kalendar line would look, with zero changes needed in any
//     of them - this alone is what makes the Sunday vs. Feast ranking,
//     the commemoration of the Sunday (Ranking.tex's "other-sunday"
//     rule, needing tier>=6 to win - this feast's 1st Double, tier 7,
//     clears it), the liturgical colour (white/gold, since
//     isMartyrEntry("Christ the King", ...) is false), and the page
//     title all come out correct automatically.
//   - js/app.js's new CHRIST_THE_KING_SANCTORALE (the Mass Propers,
//     transcribed verbatim from PropTime.tex) and
//     CHRIST_THE_KING_LECTIONARY (the Office Lessons/Psalms,
//     transcribed verbatim from LectionaryFestivals.tex) constants, and
//     a new isChristTheKingToday(resolved) predicate (just checks for
//     the injected Kalendar entry's `isChristTheKing` marker - the
//     actual date arithmetic lives once, in calendar.js), substituted
//     in at the three places that otherwise look a feast's data up by
//     its (here nonexistent) fixed kalendarKey:
//     resolveMassPropersWinner's `sanctorale`, renderForeOffice's
//     direct `openingSentence` lookup, and pickLectionarySlot's
//     `festival` lookup.
//
// Deliberately NOT implemented (consistent with this project's
// no-fabrication policy): the source's "The Last Gospel is of the
// Sunday occurring" rubric has no corresponding substitution mechanism
// anywhere on this site (Last Gospel isn't modeled as its own swappable
// Mass part at all), so this fix leaves that exactly as unimplemented
// as it was before - not guessed at. See ROADMAP.md.
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
let failed = false;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failed = true;
}

// 1. 25 Oct 2026 (the actual real-world date behind George's report -
// "yesterday," relative to this test suite's own fixed "today" of 26
// Oct 2026 - is this civil Sunday, the last Sunday of October 2026, and
// it also happens to fall on the same civil date as an existing, much
// lower-ranked fixed Kalendar entry, Sts. Chrysanthus & Daria, Martyrs,
// Memorial - tier 2, nowhere near the tier>=6 an "other-sunday" needs to
// win, so this also exercises that the fix doesn't let a lesser,
// unrelated fixed feast confuse which Collect/Psalms/Lessons show).
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 9, 25); // 25 Oct 2026 (month 0-indexed: 9 = October)
  const mattinsBody = officeBodyText(win, doc, "#office/mattins");
  check("25 Oct 2026: page title is \"Christ the King, 1st Double\"", doc.getElementById("seasonLabel").textContent.trim() === "Christ the King, 1st Double");
  check("25 Oct 2026: liturgical colour is white/gold (not green Trinitytide)", win.document.documentElement.style.getPropertyValue("--accent") === "#8a6d1d");
  check("25 Oct 2026: the lesser Sts. Chrysanthus & Daria entry is footnoted, not confused for the winning Feast", doc.getElementById("kalendarLine").textContent.includes("Sts. Chrysanthus & Daria"));
  check("25 Oct 2026 Mattins: Collect heading names Christ the King", Array.from(doc.querySelectorAll(".collect-heading")).some((e) => /Collect: Christ the King/.test(e.textContent)));
  check("25 Oct 2026 Mattins: the Sunday occurring (Trinity XX) is commemorated, per the source's rubric", Array.from(doc.querySelectorAll(".collect-heading")).some((e) => /Commemoration: Trinity XX/.test(e.textContent)));
  check("25 Oct 2026 Mattins: Psalms 2, 8, 24 (sourced from LectionaryFestivals.tex)", /Psalm 2\./.test(mattinsBody) && /Psalm 8\./.test(mattinsBody) && /Psalm 24\./.test(mattinsBody));
  check("25 Oct 2026 Mattins: First Lesson Jeremiah 10", /Jeremiah 10/.test(mattinsBody));
  check("25 Oct 2026 Mattins: Second Lesson Revelation 19:1-16", /Revelation 19:1-16/.test(mattinsBody));

  const evensongBody = officeBodyText(win, doc, "#office/evensong");
  check("25 Oct 2026 II Evensong: Psalms 48, 72", /Psalm 48\./.test(evensongBody) && /Psalm 72\./.test(evensongBody));
  check("25 Oct 2026 II Evensong: First Lesson Daniel 4", /Daniel 4/.test(evensongBody));
  check("25 Oct 2026 II Evensong: Second Lesson 1 Timothy 6:1-16", /1 Timothy 6:1-16/.test(evensongBody));
  check("25 Oct 2026 II Evensong: Collect heading still names Christ the King", Array.from(doc.querySelectorAll(".collect-heading")).some((e) => /Collect: Christ the King/.test(e.textContent)));
}

// 2. 24 Oct 2026 (the Saturday before): should anticipate Christ the
// King's own FIRST Evensong, per the pre-existing Table of Concurrence
// machinery (ranking.js's Table 2, task #91/#92) - no Christ-the-King-
// specific code needed for this; it falls out automatically once
// resolveFeastRankToday/decideCollectWinner know about the Feast at
// all, confirming the fix is a single, well-integrated choke point
// rather than a special case bolted on elsewhere.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 9, 24); // 24 Oct 2026 (the Saturday before)
  const body = officeBodyText(win, doc, "#office/evensong");
  const banners = Array.from(doc.querySelectorAll(".rubric-fine")).map((e) => e.textContent);
  check("24 Oct 2026: banner announces First Evensong of Christ the King", banners.some((t) => /^This Evensong is First Evensong of Christ the King\b/.test(t)));
  check("24 Oct 2026 I Evensong: Psalms 29, 45, 47", /Psalm 29\./.test(body) && /Psalm 45\./.test(body) && /Psalm 47\./.test(body));
  check("24 Oct 2026 I Evensong: First Lesson Jeremiah 23:1-8", /Jeremiah 23:1-8/.test(body));
  check("24 Oct 2026 I Evensong: Second Lesson Luke 1:26-33", /Luke 1:26-33/.test(body));
}

// 3. 26 Oct 2026 (the Monday after, this test suite's own "today"):
// Christ the King's commemoration must NOT leak forward into the
// following week's ordinary ferial Office - confirming the fix is
// scoped to the exact civil Sunday, not the whole period it falls
// within.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 9, 26); // 26 Oct 2026
  officeBodyText(win, doc, "#office/mattins");
  check("26 Oct 2026: no Christ the King Collect heading leaks into the following Monday", !Array.from(doc.querySelectorAll(".collect-heading")).some((e) => /Christ the King/.test(e.textContent)));
}

// 4. The Mass page on 25 Oct 2026 shows Christ the King's own Mass
// Propers (Introit/Collect/Gospel), sourced verbatim from PropTime.tex.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 9, 25);
  win.location.hash = "#mass";
  win.dispatchEvent(new win.Event("hashchange"));
  const body = doc.body.textContent;
  check("25 Oct 2026 Mass: Introit \"Worthy is the Lamb that was slain\"", body.includes("Worthy is the Lamb that was slain"));
  check("25 Oct 2026 Mass: Collect names \"the King of all\"", body.includes("the King of all"));
  check("25 Oct 2026 Mass: Gospel is John 18:33 (\"Art thou the King of the Jews?\")", body.includes("Art thou the King of the Jews?"));
}

// 5. A second, later year (2029) confirms the date arithmetic ("the
// last Sunday of October") generalizes correctly beyond 2026, and -
// since 28 Oct 2029 happens to be a genuine collision with an existing
// fixed Kalendar entry at 2nd Double rank (Sts. Simon & Jude, tier 6,
// the highest rank below Christ the King's own 1st Double, tier 7) -
// that Christ the King still correctly wins and the lower feast is
// merely footnoted, not silently dropped or wrongly promoted.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2029, 9, 28); // 28 Oct 2029 - the last Sunday of October that year
  officeBodyText(win, doc, "#office/mattins");
  check("28 Oct 2029: page title is \"Christ the King, 1st Double\"", doc.getElementById("seasonLabel").textContent.trim() === "Christ the King, 1st Double");
  check("28 Oct 2029: Sts. Simon & Jude (2nd Double, tier 6) is outranked and footnoted, not confused for the winner", doc.getElementById("kalendarLine").textContent.includes("Sts. Simon & Jude"));
  check("28 Oct 2029 Mattins: Collect heading still names Christ the King, not Sts. Simon & Jude", Array.from(doc.querySelectorAll(".collect-heading")).some((e) => /Collect: Christ the King/.test(e.textContent)));
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
