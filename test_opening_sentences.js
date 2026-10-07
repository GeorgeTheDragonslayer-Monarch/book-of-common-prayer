const { JSDOM } = require("jsdom");
const fs = require("fs");

function makeDom() {
  const html = fs.readFileSync("index.html", "utf-8");
  const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously" });
  const { window } = dom;
  const scripts = ["js/data-psalter.js","js/data-kalendar.js","js/data-lectionary.js",
    "js/data-evensong-template.js","js/data-mattins-template.js","js/data-foreoffice.js","js/data-compline-template.js",
    "js/data-prime-template.js","js/data-terce-template.js","js/data-sext-template.js","js/data-none-template.js",
    "js/data-collects-temporale.js","js/data-collects-sanctorale.js","js/data-kjv.js","js/data-apocrypha.js",
    "js/data-marian-anthems.js","js/data-athanasian-creed.js","js/data-great-litany.js","js/data-litany-saints.js",
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
function getOfficeBody(win, doc, hourHash) {
  win.location.hash = hourHash;
  win.dispatchEvent(new win.Event("hashchange"));
  return doc.getElementById("officeBody").innerHTML;
}
function run(label, y, m0, d, hourHash, checks) {
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, y, m0, d);
  console.log(`=== ${label} ===`);
  const body = getOfficeBody(win, doc, hourHash);
  checks(body);
  console.log();
}

// A known "general" sentence's exact text, to confirm it now shows even
// on an ordinary day (it never did before this fix).
const GENERAL_MARKER = "correct";

run("Ordinary Trinity weekday Mattins (2026-06-30) - general + morning both present", 2026, 5, 30, "#office/mattins", (body) => {
  const preRubricIdx = body.indexOf("rubric-fine");
  const exhortIdx = body.indexOf("Exhortation to Penitence");
  const sentencesWindow = body.slice(preRubricIdx, exhortIdx);
  const count = (sentencesWindow.match(/sentence-citation/g) || []).length;
  console.log("has multiple Opening Sentences (general + morning combined, expect >7):", count, count > 7);
});

run("Advent I Mattins (2026-11-29) - general + morning + advent all present, not just advent", 2026, 10, 29, "#office/mattins", (body) => {
  const preRubricIdx = body.indexOf("rubric-fine");
  const exhortIdx = body.indexOf("Exhortation to Penitence");
  const sentencesWindow = body.slice(preRubricIdx, exhortIdx);
  const count = (sentencesWindow.match(/sentence-citation/g) || []).length;
  // general (11) + morning (7) + advent (4) = 22 total citations expected.
  console.log("Opening Sentences count (expect 22 = 11 general + 7 morning + 4 advent):", count);
});

run("Advent I Evensong (2026-11-29) - general + evening + advent, not morning", 2026, 10, 29, "#office/evensong", (body) => {
  const preRubricIdx = body.indexOf("rubric-fine");
  const exhortIdx = body.indexOf("Exhortation to Penitence");
  const sentencesWindow = body.slice(preRubricIdx, exhortIdx);
  const count = (sentencesWindow.match(/sentence-citation/g) || []).length;
  // general (11) + evening (6) + advent (4) = 21 total citations expected.
  console.log("Opening Sentences count (expect 21 = 11 general + 6 evening + 4 advent):", count);
});

run("Lent I Mattins - general + morning + lent all present", 2026, 2, 1, "#office/mattins", (body) => {
  const preRubricIdx = body.indexOf("rubric-fine");
  const exhortIdx = body.indexOf("Exhortation to Penitence");
  const sentencesWindow = body.slice(preRubricIdx, exhortIdx);
  const count = (sentencesWindow.match(/sentence-citation/g) || []).length;
  // general (11) + morning (7) + lent (1) = 19 total citations expected.
  console.log("Opening Sentences count (expect 19 = 11 general + 7 morning + 1 lent):", count);
});

// George's 9/2 note (task #135): "Issue titles from the BCP for the
// opening sentences for Mattins and Evensong." Each category now gets
// its own small centered heading (sourced 1:1 from ForeOffice.tex's own
// `\centerline{\color{RubricRed}\small% <Title>}` markup) directly above
// its own sentences, printed once per category rather than once per
// sentence.
run("Advent I Mattins (2026-11-29) - one heading per category, in order", 2026, 10, 29, "#office/mattins", (body) => {
  const headings = (body.match(/<p class="sentence-category-heading">(.*?)<\/p>/g) || []).map((h) => h.replace(/<[^>]+>/g, ""));
  console.log("headings found:", headings);
  console.log("exactly 3 headings, in General/Morning/Advent order:", JSON.stringify(headings) === JSON.stringify(["General", "Morning", "Advent"]));
});

run("Advent I Evensong (2026-11-29) - Evening heading, not Morning", 2026, 10, 29, "#office/evensong", (body) => {
  const headings = (body.match(/<p class="sentence-category-heading">(.*?)<\/p>/g) || []).map((h) => h.replace(/<[^>]+>/g, ""));
  console.log("headings found:", headings);
  console.log("exactly 3 headings, in General/Evening/Advent order:", JSON.stringify(headings) === JSON.stringify(["General", "Evening", "Advent"]));
});

run("Bare Trinitytide weekday Mattins (2026-07-01) - just General/Morning, no phantom day-specific heading", 2026, 6, 1, "#office/mattins", (body) => {
  const headings = (body.match(/<p class="sentence-category-heading">(.*?)<\/p>/g) || []).map((h) => h.replace(/<[^>]+>/g, ""));
  console.log("headings found:", headings);
  console.log("exactly 2 headings, General/Morning only:", JSON.stringify(headings) === JSON.stringify(["General", "Morning"]));
});

// Sanity: no duplicate category shown twice on a day with genuinely
// nothing beyond the Hour's own set (30 June actually has a real Apostle
// commemoration - St. Paul's - per the earlier task #130 finding, so use
// a date confirmed to have no winning feast at all instead: 1 July 2026
// is a bare Trinitytide Wednesday with only outranked commemorations).
run("Bare Trinitytide weekday Mattins - exact count, no double-counted category", 2026, 6, 1, "#office/mattins", (body) => {
  const preRubricIdx = body.indexOf("rubric-fine");
  const exhortIdx = body.indexOf("Exhortation to Penitence");
  const sentencesWindow = body.slice(preRubricIdx, exhortIdx);
  const count = (sentencesWindow.match(/sentence-citation/g) || []).length;
  console.log("Opening Sentences count (expect exactly 18 = 11 general + 7 morning, no duplicate):", count, count === 18);
});
