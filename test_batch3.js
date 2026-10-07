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
    "js/data-marian-anthems.js","js/data-athanasian-creed.js","js/data-old-testament-canticles.js","js/data-great-litany.js","js/data-litany-saints.js",
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

console.log("=== Batch 3 tests (8 non-Augustine items) ===");

console.log("\n--- 1. Gloria Patri after Magnificat/Nunc dimittis/Benedictus ---");
goOffice("evensong");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20); // ordinary day
let body = doc.getElementById("officeBody").innerHTML;
const magIdx = body.indexOf("doth magnify the Lord");
const nuncIdx = body.indexOf("now lettest thou thy servant");
const gpMatches = [...body.matchAll(/Glory be to the Father, and to the Son, and to the Holy Ghost\./g)].map((m) => m.index);
console.log("Evensong has >=1 Gloria Patri after Magnificat position:", gpMatches.some((i) => i > magIdx && i < nuncIdx));
console.log("Evensong has >=1 Gloria Patri after Nunc dimittis position:", gpMatches.some((i) => i > nuncIdx));

goOffice("mattins");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20);
body = doc.getElementById("officeBody").innerHTML;
const benIdx = body.indexOf("be the Lord God of Israel");
const creedRubricIdx = body.indexOf("Then shall be said the Apostles");
const gpMatches2 = [...body.matchAll(/Glory be to the Father, and to the Son, and to the Holy Ghost\./g)].map((m) => m.index);
console.log("Mattins has Gloria Patri after Benedictus (before Creed rubric):", gpMatches2.some((i) => i > benIdx && i < creedRubricIdx));

console.log("\n--- 2. Additional-prayers link removed entirely ---");
console.log("no 'additional prayers' text anywhere in Mattins body:", !/additional prayers/i.test(body));
console.log("no optional-toggle class present:", !body.includes("optional-toggle"));
console.log("Prayer for the Clergy and People still present (unwrapped):", body.includes("A Prayer for the Clergy and People"));

console.log("\n--- 3. 'Portion of the Psalms' rubric fully removed ---");
console.log("Mattins: no 'Portion of the Psalms' text:", !body.includes("Portion of the Psalms"));
console.log("Mattins: no leftover 'Gloria Patri is said after each Psalm' rubric:", !body.includes("The Gloria Patri is said after each Psalm"));
goOffice("evensong");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20);
const evBody = doc.getElementById("officeBody").innerHTML;
console.log("Evensong: no 'Portion of the Psalms' text:", !evBody.includes("Portion of the Psalms"));
console.log("Evensong: no 'Appointed for this day, with the Gloria Patri after each' text:", !evBody.includes("Appointed for this day, with the Gloria Patri after each"));
console.log("Evensong: gloriaChoice block still works (has 'Gloria in excelsis' heading):", evBody.includes("Gloria in excelsis"));

console.log("\n--- 4. 'Here beginneth/endeth' lesson framing ---");
goOffice("mattins");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20);
body = doc.getElementById("officeBody").innerHTML;
console.log("has 'Here beginneth the' text:", /Here beginneth the .+ Chapter of /.test(body));
console.log("has 'Here endeth the First Lesson.':", body.includes("Here endeth the First Lesson."));
console.log("has 'Here endeth the Second Lesson.':", body.includes("Here endeth the Second Lesson."));
console.log("rubric-black class used:", body.includes('class="rubric-black"'));

console.log("\n--- 5. Black vs red rubric inline distinction ---");
console.log("rubric-black-inline span present (Athanasian day list):", body.includes('class="rubric-black-inline"'));
console.log("Athanasian-day rubric still readable (has 'Christmas Day'):", body.includes(">Christmas Day<") || /Christmas Day/.test(body));

console.log("\n--- 6. Compline antiphon placement ---");
goOffice("compline");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20);
body = doc.getElementById("officeBody").innerHTML;
const psalm4Idx = body.indexOf("Psalm 4");
const firstAntiphonIdx = body.indexOf('class="antiphon"');
console.log("Psalm 4 heading found:", psalm4Idx >= 0);
console.log("first antiphon block renders after 'Psalm 4' heading:", firstAntiphonIdx > psalm4Idx && psalm4Idx > -1);
const nuncIdx2 = body.indexOf("Nunc Dimittis");
const nuncAntIdxs = [];
let searchFrom = 0;
while (true) {
  const idx = body.indexOf('class="antiphon"', searchFrom);
  if (idx === -1) break;
  nuncAntIdxs.push(idx);
  searchFrom = idx + 1;
}
console.log("at least one antiphon after 'Nunc Dimittis' heading:", nuncAntIdxs.some((i) => i > nuncIdx2));

console.log("\n--- 7. Venite omission logic + Ash Wednesday toggle ---");
goOffice("mattins");
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20); // ordinary day
body = doc.getElementById("officeBody").innerHTML;
console.log("Ordinary day: Venite text present:", body.includes(" come, let us sing unto the Lord"));
console.log("Ordinary day: no 'Portion of the Psalms' scaffolding rubric:", !body.includes("except on those days for which an Anthem"));

// Easter's anchors depend on the year; compute Maundy Thursday/Good Friday/Easter Even for 2026 (Easter = Apr 12, per Orthodox reckoning used by this book)
const anchors = win.getLiturgicalYearAnchors(new Date(Date.UTC(2026, 3, 1)));
const easter = anchors.easterDay;
function addDays(d, n) { return new Date(d.getTime() + n * 86400000); }
const maundyThu = addDays(easter, -3), goodFri = addDays(easter, -2), easterEven = addDays(easter, -1);

for (const [label, d] of [["Maundy Thursday", maundyThu], ["Good Friday", goodFri], ["Easter Even", easterEven]]) {
  clickCalendarDay("calendarToggle", "calendarPopover", d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const b = doc.getElementById("officeBody").innerHTML;
  console.log(`${label} (${d.toISOString().slice(0,10)}): Venite text absent:`, !b.includes(" come, let us sing unto the Lord"));
  console.log(`${label}: omission notice shown:`, b.includes("The Venite is omitted today."));
}

// Ash Wednesday: default (Included) should still show Venite; toggled to Omitted should hide it
clickCalendarDay("calendarToggle", "calendarPopover", anchors.ashWednesday.getUTCFullYear(), anchors.ashWednesday.getUTCMonth(), anchors.ashWednesday.getUTCDate());
let ashBody = doc.getElementById("officeBody").innerHTML;
console.log("Ash Wednesday (default Included): Venite present:", ashBody.includes(" come, let us sing unto the Lord"));
doc.querySelector('#officeBody button[data-inline-toggle="veniteAsh"][data-value="true"]').click();
ashBody = doc.getElementById("officeBody").innerHTML;
console.log("Ash Wednesday (toggled Omitted): Venite absent:", !ashBody.includes(" come, let us sing unto the Lord"));
console.log("Ash Wednesday (toggled Omitted): omission notice shown:", ashBody.includes("The Venite is omitted today."));
doc.querySelector('#officeBody button[data-inline-toggle="veniteAsh"][data-value="false"]').click(); // reset

// Non-Ash ordinary day should be unaffected by the Ash Wednesday toggle state
doc.querySelector('#officeBody button[data-inline-toggle="veniteAsh"][data-value="true"]').click();
clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20);
const ordinaryWithToggleOn = doc.getElementById("officeBody").innerHTML;
console.log("Ordinary day unaffected by Ash-Wednesday-only toggle:", ordinaryWithToggleOn.includes(" come, let us sing unto the Lord"));
clickCalendarDay("calendarToggle", "calendarPopover", anchors.ashWednesday.getUTCFullYear(), anchors.ashWednesday.getUTCMonth(), anchors.ashWednesday.getUTCDate());
doc.querySelector('#officeBody button[data-inline-toggle="veniteAsh"][data-value="false"]').click(); // reset

console.log("\n--- 8. Weekday Canticle: Automatic vs. Old Testament Canticle (task #140 rework) ---");
// George's 9/2 note (task #140): the site was previously showing the
// wrong Old Testament Canticles entirely - a "Nine Biblical Odes" scheme
// (First Song of Moses/Exodus 15, etc.) not actually in this Breviary,
// picked via a manual 9-option dropdown. Replaced with the canticles
// OTCant.tex actually contains (12 total: Monday-Saturday, one Ferial +
// one Festal each) - no dropdown at all now, since Mattins.tex's own
// rubric makes the Ferial/Festal choice automatic (the same rank test
// that already picks Te Deum vs. Benedicite doubles as this canticle's
// own Festal/Ferial answer).
clickCalendarDay("calendarToggle", "calendarPopover", 2025, 6, 14); // 2025-07-14, confirmed ordinary feria, a Monday -> Benedicite/Ferial
body = doc.getElementById("officeBody").innerHTML;
console.log("Automatic pick renders (has either Te Deum or Benedicite heading):", body.includes("Te Deum laudamus") || body.includes("Benedicite"));
doc.querySelector('#morningCanticleMenu button[data-morning-canticle-mode="oldTestament"]').click();
let overrideBody = doc.getElementById("officeBody").innerHTML;
console.log("No dropdown/ode-picker shown any more (automatic, not manual):", !overrideBody.includes("ode-picker") && !doc.getElementById("oldTestamentOdeSelect"));
console.log("Monday's own Ferial canticle (Confitebor tibi, sourced from OTCant.tex) renders:", overrideBody.includes("Confitebor tibi") && overrideBody.includes("thine anger is turned away"));
console.log("Old Testament Canticle always takes a Gloria Patri:", /Confitebor tibi[\s\S]{0,4000}Glory be to the Father, and to the Son, and to the Holy Ghost\./.test(overrideBody));
doc.querySelector('#morningCanticleMenu button[data-morning-canticle-mode="automatic"]').click(); // reset to Automatic
overrideBody = doc.getElementById("officeBody").innerHTML;
console.log("Reset to Automatic still shows Benedicite on this ordinary feria:", overrideBody.includes("Benedicite"));

console.log("\n--- Non-regression: other pages still render ---");
for (const hour of ["prime", "terce", "sext", "none"]) {
  goOffice(hour);
  clickCalendarDay("calendarToggle", "calendarPopover", 2026, 6, 20);
  const b = doc.getElementById("officeBody").innerHTML;
  console.log(hour, "still renders:", b.length > 500);
}

console.log("\nALL CHECKS PRINTED - done");
