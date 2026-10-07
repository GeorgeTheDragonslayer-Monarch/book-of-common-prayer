const { JSDOM } = require("jsdom");
const fs = require("fs");

// Covers the fix for the "missing nested commemoration collects" gap
// found while auditing the Ranking.tex/PropTime.tex rubrics: 5 fixed
// dates (3 May, 2 July, 25 July, 6 August, 15 September) each nest a
// second (2 July: second AND third) nested "Commemoration of X, as
// followeth" Collect/Secret/Postcommunion for a Memorial-rank saint
// sharing that date with a 2nd-Double-or-higher feast - all present in
// pages/Propers/PropTime.tex but previously missing from
// data/collects-sanctorale.json entirely. This also exercises the new
// secondaryName/tertiaryText/tertiaryName support added to
// renderCommemoratedOration in js/app.js.

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

function clickCalendarDay(doc, popoverToggleId, popoverId, year, month0, day) {
  doc.getElementById(popoverToggleId).click();
  const popover = doc.getElementById(popoverId);
  const yearSel = popover.querySelector(".cal-year-select");
  if (yearSel) { yearSel.value = String(year); yearSel.dispatchEvent(new popover.ownerDocument.defaultView.Event("change")); }
  const monthSel = popover.querySelector(".cal-month-select");
  if (monthSel) { monthSel.value = String(month0); monthSel.dispatchEvent(new popover.ownerDocument.defaultView.Event("change")); }
  const dayBtn = Array.from(popover.querySelectorAll("[data-cal-day]")).find((b) => parseInt(b.dataset.calDay, 10) === day);
  if (dayBtn) dayBtn.click();
}

function goMattins(win) {
  win.location.hash = "#office/mattins";
  win.dispatchEvent(new win.Event("hashchange"));
}

console.log("=== Batch 4 tests (missing nested commemoration collects) ===");

function checkDate(label, year, month0, day, expectedNames) {
  const dom = makeDom();
  const win = dom.window;
  const doc = win.document;
  goMattins(win);
  clickCalendarDay(doc, "calendarToggle", "calendarPopover", year, month0, day);
  const body = doc.getElementById("officeBody").innerHTML;
  console.log(`\n--- ${label} ---`);
  for (const name of expectedNames) {
    // "&" is escaped to "&amp;" in rendered HTML, so compare against
    // that form too - this is just a test-string quirk, not a rendering bug.
    console.log(`  Collect mentions "${name}":`, body.includes(name) || body.includes(name.replace(/&/g, "&amp;")));
  }
  const commemorationHeadings = [...body.matchAll(/Commemoration: ([^<]+)</g)].map((m) => m[1]);
  console.log("  Commemoration headings found:", JSON.stringify(commemorationHeadings));
}

checkDate("3 May - Invention of the Cross / Sts. Alexander, Eventius, Theodulus, & Juvenalis", 2026, 4, 3,
  ["Sts. Alexander, Eventius, Theodulus, & Juvenalis", "delivered from all evils that beset us"]);

checkDate("2 July - Visitation / St. John of San Francisco AND Sts. Processus & Martinian (double nest)", 2026, 6, 2,
  ["St. John of San Francisco", "Sts. Processus & Martinian", "absolved from all our sins", "profit by their example"]);

checkDate("25 July - St. James / St. Christopher", 2026, 6, 25,
  ["St. Christopher", "stablished in the love of thy name"]);

checkDate("6 August - Transfiguration / Sts. Sixtus II, Felicissimus, & Agapitus", 2026, 7, 6,
  ["Sts. Sixtus II, Felicissimus, & Agapitus", "everlasting felicity of their fellowship"]);

checkDate("15 September - Seven Sorrows / St. Nicomedes", 2026, 8, 15,
  ["St. Nicomedes", "obtaining of thy mercy"]);

// ---- Regression: the original secondaryText pair (25 Jan/22 Feb) still works ----
{
  const dom = makeDom();
  const win = dom.window;
  const doc = win.document;
  goMattins(win);
  clickCalendarDay(doc, "calendarToggle", "calendarPopover", 2026, 0, 25);
  const body = doc.getElementById("officeBody").innerHTML;
  console.log("\n--- Regression: 25 January (Conversion of St. Paul / commemoration of St. Peter) ---");
  console.log("  Still shows a commemoration (text-matched label, no explicit name field):", /Commemoration:/.test(body));
}

console.log("\nEXIT:0");
