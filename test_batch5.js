const { JSDOM } = require("jsdom");
const fs = require("fs");

// Covers the fix for the "Memorial with zero printed Collect anywhere"
// gap found during the structural audit of Mattins on Tuesday in
// Advent I (4 December 2029, colliding with St. Barbara). Unlike the
// batch4 gap (real text existed in PropTime.tex but was never copied
// into the site's data), St. Barbara had no text anywhere in the
// source at all - Augustine supplied a proper Collect for her
// directly, now added to data/collects-sanctorale.json["12-4"]. Also
// covers the escapeHtml(undefined) guard added to
// renderCommemoratedOration, since her entry deliberately has no
// Secret/Postcommunion text of its own.

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

console.log("=== Batch 5 test (St. Barbara commemoration, 4 Dec 2029) ===");

// ---- Mattins: commemoration now appears under the Collect of the Day ----
{
  const dom = makeDom();
  const win = dom.window;
  const doc = win.document;
  win.location.hash = "#office/mattins";
  win.dispatchEvent(new win.Event("hashchange"));
  clickCalendarDay(doc, "calendarToggle", "calendarPopover", 2029, 11, 4);
  const body = doc.getElementById("officeBody").innerHTML;
  console.log("Advent I Collect still present:", body.includes("cast away the works of darkness"));
  console.log("Commemoration heading 'St. Barbara' present:", body.includes("Commemoration: St. Barbara"));
  console.log("St. Barbara's Collect text present:", body.includes("confess the Name of our Savior Jesus Christ"));
  console.log("No literal 'undefined' anywhere in body:", !/undefined/.test(body));
  console.log("Morning canticle is Benedicite (Memorial + Greater Feria, both below Semidouble):", body.includes("Benedicite"));
}

// ---- Mass page: same commemoration, and no undefined leak in Secret/Postcommunion ----
{
  const dom = makeDom();
  const win = dom.window;
  const doc = win.document;
  win.location.hash = "#mass";
  win.dispatchEvent(new win.Event("hashchange"));
  clickCalendarDay(doc, "calendarToggle", "calendarPopover", 2029, 11, 4);
  const body = doc.getElementById("massBody").innerHTML;
  console.log("\nMass page mentions St. Barbara:", body.includes("St. Barbara"));
  console.log("Mass page has no literal 'undefined':", !/undefined/.test(body));
}

console.log("\nEXIT:0");
