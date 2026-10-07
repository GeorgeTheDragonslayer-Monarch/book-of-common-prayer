const { JSDOM } = require("jsdom");
const fs = require("fs");

function makeDom() {
  const html = fs.readFileSync("index.html", "utf-8");
  const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously" });
  const { window } = dom;
  const scripts = ["js/data-psalter.js","js/data-kalendar.js","js/data-lectionary.js","js/data-lectionary-festivals.js",
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
function getOfficeBody(win, doc, hourHash) {
  win.location.hash = hourHash;
  win.dispatchEvent(new win.Event("hashchange"));
  return doc.getElementById("officeBody").innerHTML;
}

// George's real-world report, 9/7/2026 evening: tonight (7 Sept, Trinity
// XIII Monday, a plain feria) is the eve of the Nativity of the BVM
// (8 Sept, 2nd Double) - a Table 2 code-1 displacement (plain feria today,
// Double-tier feast tomorrow, per the St. Gorazde precedent already coded
// in resolveEveningDisplacement). Confirm tonight's Evensong now shows the
// Nativity's FIRST Evensong Psalms/Lessons, not its Second.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 8, 7); // 7 Sept 2026
  console.log("=== 7 Sept 2026 evening (eve of Nativity of BVM, 2nd Double) - Evensong ===");
  const body = getOfficeBody(win, doc, "#office/evensong");
  console.log("displacement banner present:", body.includes("First Evensong of"));
  console.log("banner names the Nativity of the BVM:", body.includes("Nativity of the Blessed Virgin Mary"));
  const psalmHeadings = Array.from(doc.querySelectorAll(".psalm-block h4")).map((e) => e.textContent);
  console.log("Psalm headings shown:", psalmHeadings);
  const lessonCitations = Array.from(doc.querySelectorAll(".lesson-citation")).map((e) => e.textContent);
  console.log("Lesson citations shown:", lessonCitations);
}

// Cross-check directly against the source data: print the Nativity's own
// evensongI vs evensongII from lectionary-festivals.json so the psalm/
// lesson numbers above can be confirmed against the correct slot by eye.
{
  const raw = JSON.parse(fs.readFileSync("data/lectionary-festivals.json", "utf-8"));
  console.log("\n=== Raw festival data check (9-8, Nativity of BVM) ===");
  console.log("evensongI (should match what showed on 7 Sept evening above):", JSON.stringify(raw["9-8"].evensongI));
  console.log("evensongII (should match what showed on 8 Sept evening below):", JSON.stringify(raw["9-8"].evensongII));
}

// Regression: an ORDINARY Saturday evening before an ordinary Sunday (no
// Feast involved at all) must still show First Evensong correctly - this
// case has never gone through eveningDisplacement (classifyVespersCategory
// returns null for a plain-feria-vs-plain-Sunday pair), relying instead on
// evensongI being stored directly on the Saturday's own dataset row. Must
// remain unaffected by this fix.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  // Find a plain Saturday-before-Sunday with no Kalendar feast at all.
  clickCalendarDay(win, doc, 2026, 0, 10); // 10 Jan 2026 (Saturday before Epiphany I)
  console.log("\n=== 10 Jan 2026 (ordinary Saturday before Epiphany I Sunday) - Evensong ===");
  const body = getOfficeBody(win, doc, "#office/evensong");
  console.log("no displacement banner (ordinary Sunday, no Feast involved):", !body.includes("anticipated per the Table of Concurrence"));
  const psalmHeadings = Array.from(doc.querySelectorAll(".psalm-block h4")).map((e) => e.textContent);
  console.log("Psalm headings shown (should be Epiphany I's own First Evensong Psalms):", psalmHeadings);
}

// Regression: a day's own genuine SECOND Evensong (the feast's actual
// evening, no displacement) must still show evensongII, unaffected.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 8, 8); // 8 Sept 2026 itself, the Nativity's own evening
  console.log("\n=== 8 Sept 2026 evening (the Nativity's own evening, Second Evensong) - Evensong ===");
  const body = getOfficeBody(win, doc, "#office/evensong");
  console.log("no displacement banner (today IS the feast, not anticipating tomorrow):", !body.includes("anticipated per the Table of Concurrence"));
  const psalmHeadings = Array.from(doc.querySelectorAll(".psalm-block h4")).map((e) => e.textContent);
  console.log("Psalm headings shown (should be Nativity's own SECOND Evensong Psalms):", psalmHeadings);
}

console.log("\n=== Done ===");
