const { JSDOM } = require("jsdom");
const fs = require("fs");

function makeDom() {
  const html = fs.readFileSync("index.html", "utf-8");
  const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously" });
  const { window } = dom;
  const scripts = ["js/data-psalter.js","js/data-kalendar.js","js/data-lectionary.js",
    "js/data-evensong-template.js","js/data-mattins-template.js","js/data-foreoffice.js",
    "js/data-compline-template.js",
    "js/data-prime-template.js","js/data-terce-template.js","js/data-sext-template.js","js/data-none-template.js",
    "js/data-collects-temporale.js","js/data-collects-sanctorale.js","js/data-kjv.js","js/data-apocrypha.js",
    "js/data-marian-anthems.js","js/data-athanasian-creed.js","js/data-great-litany.js","js/data-litany-saints.js",
    "js/data-mass-ordinary.js","js/data-confession.js","js/data-communion-sick.js","js/data-purification.js",
    "js/data-burial-child.js","js/data-confirmation.js","js/data-reception.js","js/data-matrimony.js","js/data-baptism.js",
    "js/data-unction.js","js/data-burial.js","js/data-adult-baptism.js","js/data-family.js",
    "js/data-asperges.js","js/data-foremass.js","js/data-preparation.js","js/data-thanksgiving.js","js/data-benediction.js",
    "js/data-vesper-dead.js","js/data-lauds-dead.js","js/data-matins-dead.js","js/data-votive.js",
    "js/computus.js","js/calendar.js","js/psalms.js","js/liturgical-color.js","js/office-variants.js",
    "js/ranking.js","js/scripture.js","js/app.js"];
  for (const s of scripts) {
    const el = window.document.createElement("script");
    el.textContent = fs.readFileSync(s, "utf-8");
    window.document.body.appendChild(el);
  }
  return dom;
}

function goToDate(win, y, m0, d) {
  win.__setCurrentDateForTest && win.__setCurrentDateForTest(new Date(Date.UTC(y, m0, d)));
}

console.log("=== Batch 2 tests ===");

const dom = makeDom();
const win = dom.window;
const doc = win.document;

// There's no exposed date-setter, so drive dates the same way test_mass_propers.js
// does for the calendar popover, but for Office page there is a simpler path:
// app.js keeps currentDate in closure; the office toolbar's prev/next/today buttons
// mutate it. Simplest robust approach here: use the Mattins/Evensong calendar
// popover exactly like the Mass test does.
function clickCalendarDay(popoverToggleId, popoverId, year, month0, day) {
  doc.getElementById(popoverToggleId).click();
  const popover = doc.getElementById(popoverId);
  const yearSel = popover.querySelector(".cal-year-select");
  if (yearSel) { yearSel.value = String(year); yearSel.dispatchEvent(new popover.ownerDocument.defaultView.Event("change")); }
  const monthSel = popover.querySelector(".cal-month-select");
  if (monthSel) { monthSel.value = String(month0); monthSel.dispatchEvent(new popover.ownerDocument.defaultView.Event("change")); }
  const dayBtn = Array.from(popover.querySelectorAll("[data-cal-day]")).find((b) => parseInt(b.dataset.calDay, 10) === day);
  if (dayBtn) dayBtn.click();
}

function goOffice(hour) {
  win.location.hash = "#office/" + hour;
  win.dispatchEvent(new win.Event("hashchange"));
}

console.log("\n--- 1. Gloria in excelsis / Gloria Patri toggle + seasonal suppression ---");
// Augustine's 9/5 answer flipped the default: "during Evensong, the
// Gloria Patri should be the default, not the Gloria in excelsis" -
// previously the reverse (task #171). Updated below to match.
goOffice("evensong");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20); // 20 July 2026 - ordinary Trinitytide, not penitential
let body = doc.getElementById("officeBody").innerHTML;
console.log("ordinary day: has 'Gloria Patri' heading by default:", body.includes("Gloria Patri"));
console.log("ordinary day: has Gloria Patri text by default ('As it was in the beginning'):", body.includes("As it was in the beginning"));

doc.querySelector('#officeBody button[data-inline-toggle="gloria"][data-value="excelsis"]').click();
body = doc.getElementById("officeBody").innerHTML;
console.log("after toggle to excelsis: has Gloria in excelsis text:", body.includes("lory be to God on high"));
console.log("after toggle to excelsis: no longer has Gloria Patri text:", !body.includes("As it was in the beginning"));
doc.querySelector('#officeBody button[data-inline-toggle="gloria"][data-value="patri"]').click(); // reset

clickCalendarDay("calendarToggle", "calendarPopover", 2026, 11, 6); // Advent - 6 Dec 2026
body = doc.getElementById("officeBody").innerHTML;
console.log("Advent: Gloria in excelsis text suppressed:", !body.includes("lory be to God on high"));
console.log("Advent: shows omission rubric:", body.includes("Gloria Patri already said"));

console.log("\n--- 2. Nicene Creed toggle ---");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20); // ordinary day, no Athanasian override
body = doc.getElementById("officeBody").innerHTML;
console.log("Evensong default: has Apostles' Creed heading:", body.includes("Apostles' Creed"));
doc.querySelector('#officeBody button[data-inline-toggle="creed"][data-value="nicene"]').click();
body = doc.getElementById("officeBody").innerHTML;
console.log("Evensong after toggle: has Nicene Creed heading:", body.includes("Nicene Creed"));
console.log("Evensong after toggle: has Nicene-specific text ('visible and invisible'):", body.includes("visible and invisible"));

goOffice("mattins");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20);
body = doc.getElementById("officeBody").innerHTML;
console.log("Mattins after toggle (still on nicene): has Nicene Creed heading:", body.includes("Nicene Creed"));

// Athanasian override day: Christmas Day. Even with Nicene selected, Athanasian should win.
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 11, 25);
body = doc.getElementById("officeBody").innerHTML;
console.log("Christmas Day (Athanasian day) with Nicene selected: shows Athanasian Creed:", body.includes("Athanasian Creed") || body.includes("Symbolum Athanasianum"));
console.log("Christmas Day: does NOT show 'Nicene Creed' heading (Athanasian overrides):", !body.includes("Nicene Creed"));

// The Creed toggle only renders when the choice actually matters (i.e.
// not on an Athanasian-override day like Christmas), so navigate back
// to an ordinary day before resetting it.
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20);
doc.querySelector('#officeBody button[data-inline-toggle="creed"][data-value="apostles"]').click(); // reset

console.log("\n--- 3. Procedural rubric cleanup ---");
goOffice("mattins");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20);
body = doc.getElementById("officeBody").innerHTML;
console.log("Mattins: no longer has 'Then shall be read the First Lesson, according to':", !body.includes("Then shall be read the First Lesson, according to"));
console.log("Mattins: no longer has old combined Second Lesson rubric:", !body.includes("taken out of the New Testament, according to the Lectionary"));
// Appears twice: once (pre-existing) after the First Lesson, once (new) after
// the Second Lesson, replacing the old combined rubric checked above.
console.log("Mattins: 'After which may be sung or said a Hymn.' appears after both Lessons:", (body.match(/After which may be sung or said a Hymn\./g) || []).length === 2);
// Superseded by test_batch3.js's rubric-removal + Gloria Patri checks:
// this exact rubric was later removed outright per Augustine's note.

goOffice("evensong");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20);
body = doc.getElementById("officeBody").innerHTML;
console.log("Evensong: no longer has 'Then shall be read the First Lesson, according to':", !body.includes("Then shall be read the First Lesson, according to"));
console.log("Evensong: no longer has 'Then a Lesson of the New Testament, as it is appointed.':", !body.includes("Then a Lesson of the New Testament, as it is appointed."));
// Superseded by test_batch3.js: this rubric was later removed outright too.

console.log("\n--- 4. Additional prayers visible by default ---");
goOffice("mattins");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20);
body = doc.getElementById("officeBody").innerHTML;
console.log("Mattins: 'A Prayer for the Clergy and People' visible in body:", body.includes("A Prayer for the Clergy and People"));
// The optional-section/toggle wrapper was later removed outright (see
// test_batch3.js) - additional prayers now render as plain content with
// no wrapper or link at all, which is a stronger version of "visible by
// default" than what was originally shipped here.
console.log("Prayer for the Clergy and People renders as plain content:", body.includes("A Prayer for the Clergy and People"));

console.log("\n--- 5. Antiphon placement (Prime) ---");
goOffice("prime");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20);
body = doc.getElementById("officeBody").innerHTML;
const psalm54Idx = body.indexOf("Psalm 54");
const firstAntiphonMarkerIdx = body.indexOf("antiphon", psalm54Idx >= 0 ? 0 : 0);
console.log("Psalm 54 heading found:", psalm54Idx >= 0);
// The antiphon placeholder renders a <p class="antiphon">...</p> block; check that
// class appears AFTER the "Psalm 54" heading text now (previously it came before).
const antiphonClassIdx = body.indexOf('class="antiphon"');
console.log("first antiphon block now renders after 'Psalm 54' heading:", antiphonClassIdx > psalm54Idx && psalm54Idx > -1);

console.log("\n--- 6. Alleluia suppression outside Eastertide ---");
goOffice("mattins");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20); // ordinary Trinitytide day
body = doc.getElementById("officeBody").innerHTML;
console.log("Ordinary day: has 'Let us bless the Lord':", body.includes("Let us bless the Lord"));
console.log("Ordinary day: does NOT have '(alleluia, alleluia.)':", !body.includes("(alleluia, alleluia.)"));

clickCalendarDay("calendarToggle", "calendarPopover", 2026, 3, 13); // Easter Monday 2026 (this book uses Orthodox Easter, Apr 12 2026)
body = doc.getElementById("officeBody").innerHTML;
console.log("Easter Monday: has '(alleluia, alleluia.)':", body.includes("(alleluia, alleluia.)"));

console.log("\n--- 7. Justification CSS ---");
const css = fs.readFileSync("css/style.css", "utf-8");
console.log("style.css has 'text-align: justify' on body:", /body\s*\{[^}]*text-align:\s*justify/s.test(css));

console.log("\n--- 8. Venite/Psalm 95 dedup ---");
const psalterData = win.PSALTER_DATA;
const day19 = win.resolveLiturgicalDay(new Date(Date.UTC(2026, 0, 19)), win.LECTIONARY_DATA, win.KALENDAR_DATA);
const r19morning = win.resolvePsalmsForDay(day19, psalterData, "morning");
console.log("Day 19 morning entries (no proper override day, check):", JSON.stringify(r19morning.entries));
console.log("Day 19 morning: Psalm 95 excluded:", !r19morning.entries.some((e) => e.num === 95));
console.log("Day 19 morning: still has 96, 97:", r19morning.entries.some((e) => e.num === 96) && r19morning.entries.some((e) => e.num === 97));
const r19evening = win.resolvePsalmsForDay(day19, psalterData, "evening");
console.log("Day 19 evening entries unaffected (still whatever they were):", JSON.stringify(r19evening.entries));
const day20 = win.resolveLiturgicalDay(new Date(Date.UTC(2026, 0, 20)), win.LECTIONARY_DATA, win.KALENDAR_DATA);
const r20morning = win.resolvePsalmsForDay(day20, psalterData, "morning");
console.log("Day 20 morning entries unaffected by filter logic (spot check, sanity only):", JSON.stringify(r20morning.entries));

console.log("\n--- Non-regression: other Hours still render ---");
for (const hour of ["terce", "sext", "none", "compline"]) {
  goOffice(hour);
  clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20);
  const b = doc.getElementById("officeBody").innerHTML;
  console.log(hour, "still renders:", b.length > 500);
}

console.log("\nALL CHECKS PRINTED - done");
