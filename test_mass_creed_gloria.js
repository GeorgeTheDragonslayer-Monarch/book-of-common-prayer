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
function getMassBody(win, doc) {
  win.location.hash = "#mass";
  win.dispatchEvent(new win.Event("hashchange"));
  return doc.getElementById("massBody").innerHTML;
}
function run(label, y, m0, d, checks) {
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, y, m0, d);
  console.log(`=== ${label} (${doc.getElementById("currentDateLabel") ? doc.getElementById("currentDateLabel").textContent : ""}) ===`);
  const body = getMassBody(win, doc);
  const hasCreed = /Nicene Creed/.test(body) && /I believe in one God/.test(body);
  const hasGloria = /Gloria in excelsis/.test(body) && /Glory be to God on high/.test(body);
  checks(hasCreed, hasGloria, body);
  console.log();
}

// Ordinary Trinitytide Sunday - Creed AND Gloria both said.
run("Trinity IV Sunday (2026-06-28)", 2026, 5, 28, (hasCreed, hasGloria) => {
  console.log("has Creed (expect true, Sunday):", hasCreed);
  console.log("has Gloria (expect true, Sunday not in penitential season):", hasGloria);
});

// Ordinary Trinitytide weekday with a genuine Apostle commemoration
// (Commemoration of St. Paul, Apostle falls on this date) - Creed correctly
// still said via the Apostle-feast match, even though it's a plain feria.
run("Trinity Tuesday with St. Paul commemoration (2026-06-30)", 2026, 5, 30, (hasCreed) => {
  console.log("has Creed (expect true, Commemoration of St. Paul, Apostle):", hasCreed);
});


// Christmas Day itself.
run("Christmas Day (2026-12-25)", 2026, 11, 25, (hasCreed, hasGloria) => {
  console.log("has Creed (expect true, Christmas range):", hasCreed);
});

// 2 January - within Christmas-to-St.-John's-Octave range, not itself a named feast.
run("2 January (within Christmas Octave range)", 2027, 0, 2, (hasCreed, hasGloria) => {
  console.log("has Creed (expect true, 25 Dec - 3 Jan range):", hasCreed);
});

// 4 January - one day past the range, ordinary feria (no Apostle/Marian/etc feast).
run("4 January (just past the Christmas/St. John Octave range)", 2027, 0, 4, (hasCreed) => {
  console.log("has Creed (expect false unless another named feast falls here):", hasCreed);
});

// Epiphany itself and within its Octave.
run("Epiphany (6 January)", 2027, 0, 6, (hasCreed) => {
  console.log("has Creed (expect true, Epiphany):", hasCreed);
});
run("10 January (within Epiphany Octave)", 2027, 0, 10, (hasCreed) => {
  console.log("has Creed (expect true, within Epiphany Octave):", hasCreed);
});

// St. Andrew's Day (Apostle) - 30 November.
run("St. Andrew, Apostle (30 November 2026)", 2026, 10, 30, (hasCreed) => {
  console.log("has Creed (expect true, Apostle feast):", hasCreed);
});

// Feast of St. Michael & All Angels - 29 September.
run("St. Michael & All Angels (29 September 2026)", 2026, 8, 29, (hasCreed) => {
  console.log("has Creed (expect true, Angels feast):", hasCreed);
});

// St. Jerome (30 September) - named Doctor.
run("St. Jerome (30 September 2026)", 2026, 8, 30, (hasCreed) => {
  console.log("has Creed (expect true, named Doctor):", hasCreed);
});

// Exaltation of the Holy Cross - 14 September.
run("Exaltation of the Holy Cross (14 September 2026)", 2026, 8, 14, (hasCreed) => {
  console.log("has Creed (expect true, Holy Cross feast):", hasCreed);
});

// Annunciation of the BVM - 25 March.
run("Annunciation of the BVM (25 March 2026)", 2026, 2, 25, (hasCreed) => {
  console.log("has Creed (expect true, Marian feast):", hasCreed);
});

// St. Anne (BVM's mother) - should NOT trigger via loose "Blessed Virgin Mary" substring match.
run("St. Anne (26 July 2026) - not itself a BVM feast", 2026, 6, 26, (hasCreed, hasGloria, body) => {
  const isAnne = /St\. Anne/.test(body);
  console.log("St. Anne is today's commemoration:", isAnne);
  console.log("has Creed (expect false unless Anne outranked by something else that day):", hasCreed);
});

// Maundy Thursday 2026 (Palm Sunday 2026-04-05, so Maundy Thursday = 2026-04-09).
run("Maundy Thursday (2026-04-09)", 2026, 3, 9, (hasCreed) => {
  console.log("has Creed (expect true, Maundy Thursday):", hasCreed);
});
// The Wednesday of Holy Week (day before Maundy Thursday) - sanity check
// that the fix didn't shift the date by one, and this ordinary Holy Week
// feria has no independent claim to the Creed.
run("Wednesday in Holy Week (2026-04-08, day before Maundy Thursday)", 2026, 3, 8, (hasCreed) => {
  console.log("has Creed (expect false unless a named feast independently falls here):", hasCreed);
});

// Advent - Gloria omitted (existing rule), Creed still said on Advent Sundays.
run("Advent I Sunday (2026-11-29)", 2026, 10, 29, (hasCreed, hasGloria) => {
  console.log("has Gloria (expect false, Advent):", hasGloria);
  console.log("has Creed (expect true, Sunday overrides even penitential season):", hasCreed);
});

