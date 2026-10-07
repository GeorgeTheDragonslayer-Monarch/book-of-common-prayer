// Regression test for the Psalm 119 daily-portion fix (8/27, per Augustine's
// WebsiteNotes_2026-08-26.txt review: "Psalm 119 is far too long to display
// in full - only the assigned daily portions should be shown").
//
// The 30-day Monthly Psalter cycle says Psalm 119 across five consecutive
// services - Day 24 Evening through Day 26 Evening - and the traditional
// table (confirmed against pages/Psalter/Psal.tex's own section breaks)
// divides its 176 verses as 1-32 / 33-72 / 73-104 / 105-144 / 145-176, not
// the whole psalm five times over. Before this fix, data/psalter.json's
// monthlyCycle stored a bare `119` at all five slots, so every one of
// those five Offices rendered the complete 176-verse psalm.
//
// September 2026 24-26 has no Sanctorale/Temporale proper that would
// override the Monthly Psalter cycle for Mattins/Evensong, so it's a clean
// ordinary-ferial test bed.
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
    "js/data-marian-anthems.js","js/data-athanasian-creed.js","js/data-old-testament-odes.js","js/data-great-litany.js","js/data-litany-saints.js",
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

const dom = makeDom();
const win = dom.window;
const doc = win.document;

function clickCalendarDay(popoverToggleId, popoverId, year, month0, day) {
  doc.getElementById(popoverToggleId).click();
  const popover = doc.getElementById(popoverId);
  // 8/31 (2nd revision): month/year arrow-paging replaced with direct
  // <select> dropdowns - set both and dispatch "change", re-querying the
  // month select after the year change since renderCalendarPopover()
  // replaces the grid's innerHTML (and therefore the old select nodes).
  const yearSel = popover.querySelector(".cal-year-select");
  if (yearSel) { yearSel.value = String(year); yearSel.dispatchEvent(new win.Event("change")); }
  const monthSel = popover.querySelector(".cal-month-select");
  if (monthSel) { monthSel.value = String(month0); monthSel.dispatchEvent(new win.Event("change")); }
  const dayBtn = Array.from(popover.querySelectorAll("[data-cal-day]")).find((b) => parseInt(b.dataset.calDay, 10) === day);
  if (dayBtn) dayBtn.click();
}
function goOffice(hour) {
  win.location.hash = "#office/" + hour;
  win.dispatchEvent(new win.Event("hashchange"));
}

let pass = 0, fail = 0;
function check(label, cond) {
  if (cond) { pass++; } else { fail++; console.log("FAIL:", label); }
}

console.log("=== Psalm 119 daily-portion test (2026-09-24 through 2026-09-26) ===");

const cases = [
  { hour: "evensong", y: 2026, m0: 8, d: 24, label: "Sep 24 Evensong -> Ps 119:1-32", verses: 32, isLast: false },
  { hour: "mattins", y: 2026, m0: 8, d: 25, label: "Sep 25 Mattins -> Ps 119:33-72", verses: 40, isLast: false },
  { hour: "evensong", y: 2026, m0: 8, d: 25, label: "Sep 25 Evensong -> Ps 119:73-104", verses: 32, isLast: false },
  { hour: "mattins", y: 2026, m0: 8, d: 26, label: "Sep 26 Mattins -> Ps 119:105-144", verses: 40, isLast: false },
  { hour: "evensong", y: 2026, m0: 8, d: 26, label: "Sep 26 Evensong -> Ps 119:145-176", verses: 32, isLast: true },
];

// A verse unique to the very end of the psalm (v.176) - should appear ONLY
// on the last (145-176) portion, never bleeding into the earlier four.
const finalVerseMarker = "I have gone astray like a sheep that is lost";
// A verse unique to the very start (v.1) - should appear ONLY on the first
// (1-32) portion.
const firstVerseMarker = "undefiled in the way";

for (const c of cases) {
  goOffice(c.hour);
  clickCalendarDay("calendarToggle", "calendarPopover", c.y, c.m0, c.d);
  const body = doc.getElementById("officeBody").innerHTML;
  check(`${c.label}: page rendered`, body.length > 500);
  check(`${c.label}: has a Psalm 119 heading`, /Psalm 119/.test(body));
  check(`${c.label}: no "Text not found" placeholder`, !body.includes("Text not found"));
  check(`${c.label}: final verse 176 present only on last portion`, body.includes(finalVerseMarker) === c.isLast);
  const startsFirst = c.label.includes("1-32");
  check(`${c.label}: opening verse present only on first portion`, body.includes(firstVerseMarker) === startsFirst);
}

// Neighbouring, unaffected days: confirm they weren't touched by the fix.
goOffice("mattins");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 8, 23); // Sep 23 morning: Ps 110-113, unaffected
let body = doc.getElementById("officeBody").innerHTML;
check("Sep 23 Mattins (Ps 110-113, unaffected day) still renders Psalm 110", /Psalm 110/.test(body));
check("Sep 23 Mattins doesn't mention Psalm 119 at all", !/Psalm 119/.test(body));

goOffice("mattins");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 9, 27); // Oct 27 morning: Ps 120-125, unaffected (no Sanctorale proper that day)
body = doc.getElementById("officeBody").innerHTML;
check("Oct 27 Mattins (Ps 120-125, unaffected day) still renders Psalm 120", /Psalm 120/.test(body));
check("Oct 27 Mattins doesn't mention Psalm 119 at all", !/Psalm 119/.test(body));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exitCode = 1;
