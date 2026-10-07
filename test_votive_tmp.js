const { JSDOM } = require("jsdom");
const fs = require("fs");
function makeDom() {
  const html = fs.readFileSync("index.html", "utf-8");
  const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously", pretendToBeVisual: true });
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
    "js/data-vesper-dead.js","js/data-lauds-dead.js","js/data-matins-dead.js",
    "js/data-votive-bvm.js","js/data-votive-angels.js","js/data-votive-matrimony.js","js/data-votive-dead.js",
    "js/data-feast-office-hymns.js","js/data-penitential.js",
    "js/computus.js","js/calendar.js","js/psalms.js","js/liturgical-color.js","js/office-variants.js",
    "js/ranking.js","js/scripture.js","js/fasting.js","js/app.js"];
  for (const s of scripts) {
    if (!fs.existsSync(s)) continue;
    const el = window.document.createElement("script");
    el.textContent = fs.readFileSync(s, "utf-8");
    window.document.body.appendChild(el);
  }
  return dom;
}
function clickCalendarDay(win, doc, y, m0, day) {
  doc.getElementById("calendarToggle").click();
  const popover = doc.getElementById("calendarPopover");
  // 8/31 (2nd revision): month/year arrow-paging replaced with direct
  // <select> dropdowns - set both and dispatch "change", re-querying the
  // month select after the year change since renderCalendarPopover()
  // replaces the grid's innerHTML (and therefore the old select nodes).
  const yearSel = popover.querySelector(".cal-year-select");
  if (yearSel) { yearSel.value = String(y); yearSel.dispatchEvent(new win.Event("change")); }
  const monthSel = popover.querySelector(".cal-month-select");
  if (monthSel) { monthSel.value = String(m0); monthSel.dispatchEvent(new win.Event("change")); }
  const dayBtn = Array.from(popover.querySelectorAll("[data-cal-day]")).find((b) => parseInt(b.dataset.calDay, 10) === day);
  if (dayBtn) dayBtn.click();
}
let pass=0, fail=0;
function check(label, cond) { if (cond) pass++; else { fail++; console.log("FAIL:", label); } }

// Need a date first (calendar picker lives on office/mass pages) then navigate to votive.
const dom = makeDom();
const win = dom.window, doc = win.document;
win.location.hash = "#office/mattins";
win.dispatchEvent(new win.Event("hashchange"));

// Task #201 update: Votive Masses were split into four separate pages
// (George's corrections doc: "The different Votive Masses should be
// provided in different pages, accessible on different items under the
// Votive Masses drop-down in the menu."). The old single "#votive" hash
// and "votiveBody" element no longer exist - "Our Lady on Saturday" (with
// its date-driven season auto-pick and Third Collect toggle) is now its
// own page at "#votive-bvm"/"votiveBvmBody", and Angels/Matrimony/Dead
// are separate pages rather than sections further down the same page.
function goVotiveBvm(y, m0, d) {
  clickCalendarDay(win, doc, y, m0, d);
  win.location.hash = "#other";
  win.location.hash = "#votive-bvm";
  win.dispatchEvent(new win.Event("hashchange"));
  return doc.getElementById("votiveBvmBody").innerHTML;
}

// Trinitytide date (15 July 2026, ordinary Trinity season)
let body = goVotiveBvm(2026, 6, 15);
check("Trinitytide date shows Trinitytide form (unique text)", body.includes("Blessed is the womb of the Virgin Mary, that bore"));
check("Trinitytide date does NOT show Advent form", !body.includes("rop down dew, ye heavens"));
check("Trinitytide date does NOT show Septuagesimatide form intro", !body.includes("All the rich among the people"));

// Advent date (10 Dec 2026)
body = goVotiveBvm(2026, 11, 10);
check("Advent date shows Advent form", body.includes("rop down dew, ye heavens"));
check("Advent date does NOT show Trinitytide form", !body.includes("Blessed is the womb of the Virgin Mary, that bore"));

// Third Collect toggle - default is "persecutors"
check("Third Collect heading present", body.includes("Third Collect, Secret &amp; Postcommunion") || body.includes("Third Collect, Secret & Postcommunion"));
check("Default shows 'Against the Persecutors' Collect text", body.includes("mercifully to hear the prayers of thy Church"));
check("Default does NOT show 'For the Chief Bishop' Collect text", !body.includes("the pastor and ruler of all the faithful"));
check("Full doxology present (not truncated 'Through.')", body.includes("who liveth and reigneth with thee, in the unity of the Holy Ghost"));

// Toggle to "For the Chief Bishop"
const chiefBishopBtn = Array.from(doc.querySelectorAll("#votiveBvmBody button")).find((b) => b.textContent.trim() === "For the Chief Bishop");
check("Chief Bishop toggle button found", !!chiefBishopBtn);
if (chiefBishopBtn) chiefBishopBtn.click();
const body2 = doc.getElementById("votiveBvmBody").innerHTML;
check("After toggle, shows 'For the Chief Bishop' Collect text", body2.includes("the pastor and ruler of all the faithful"));
check("After toggle, no longer shows 'Against the Persecutors' Collect text", !body2.includes("mercifully to hear the prayers of thy Church"));

// Sanity: other Votive Masses (Angels, Matrimony, Masses for the Dead) each
// render correctly on their own separate page now.
win.location.hash = "#other";
win.location.hash = "#votive-angels";
win.dispatchEvent(new win.Event("hashchange"));
check("Mass of the Angels still present", doc.getElementById("votiveAngelsBody").innerHTML.includes("Mass of the Angels"));

win.location.hash = "#other";
win.location.hash = "#votive-matrimony";
win.dispatchEvent(new win.Event("hashchange"));
check("Holy Matrimony still present", doc.getElementById("votiveMatrimonyBody").innerHTML.includes("Holy Matrimony"));

win.location.hash = "#other";
win.location.hash = "#votive-dead";
win.dispatchEvent(new win.Event("hashchange"));
check("Masses for the Dead still present", doc.getElementById("votiveDeadBody").innerHTML.includes("Masses for the Dead"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
