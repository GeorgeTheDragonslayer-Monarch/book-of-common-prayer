const fs = require("fs");
const { JSDOM } = require("jsdom");

// George's consolidated 10/7 list, item 7: "Also, Mattins and Evensong of
// All Souls' Day should be the Office of the Dead with Double rite."
//
// The Office of the Dead (Vespers/Matins/Lauds of the Dead,
// `data/vesper-dead.json`/`matins-dead.json`/`lauds-dead.json`) had only
// ever existed as three separate, independently-navigated static-rite
// pages (`#vesper-dead`/`#matins-dead`/`#lauds-dead`) - visiting the
// ordinary Daily Office on All Souls' Day (2 November, kalendarKey
// "11-2", a fixed Double-rank feast per kalendar.json) showed the
// ordinary ferial/seasonal Mattins/Evensong template, with no sign
// anywhere that the day calls for the Dead rite instead.
//
// Fixed with a new `isAllSoulsOfficeOfTheDeadToday(resolved, feastInfo)`
// helper (js/app.js, just above `resolveFeastRankToday`) and a new branch
// in `renderOfficePage`: when it's true and the current Hour is Mattins
// or Evensong, the page renders Matins-of-the-Dead + Lauds-of-the-Dead
// (said together as one Hour in the classical form, matching how
// Mattins already functionally includes Lauds elsewhere on this site)
// in place of the ordinary Mattins template, and Vespers-of-the-Dead in
// place of the ordinary Evensong template - with the Nocturns forced to
// "three" (Double rite's own mandatory form, not the one-Nocturn choice
// that only applies on the separate, date-blind Matins-of-the-Dead page)
// and that now-moot Nocturn-count toggle (and its dependent Nocturn-I/II/
// III picker) stripped out, since neither has a working click handler
// wired to `#officeBody`.
//
// A related, previously-undetected color bug was caught and fixed along
// the way: `resolveLiturgicalColor` (js/liturgical-color.js) gave any
// winning non-Martyr feast "white" unconditionally, so All Souls (Double,
// not a Martyr) showed "White & Gold" instead of the black
// (`MournfulBlack`, PropTime.tex's own macro argument for All Souls'
// three Masses) a Requiem observance actually calls for. Fixed with a
// one-off kalendarKey check, the same pattern already used for the Holy
// Innocents/Octave Day color exceptions just above it in that function.
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
function getOfficeBody(win, doc, hourHash) {
  win.location.hash = hourHash;
  win.dispatchEvent(new win.Event("hashchange"));
  return doc.getElementById("officeBody").innerHTML;
}
let failed = false;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failed = true;
}

// 1. 2 Nov 2026 (All Souls' Day) Mattins: shows Matins + Lauds of the
// Dead, all three Nocturns (Double rite mandatory), no live Nocturn
// toggle, title reflects the Office of the Dead.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 10, 2); // 2 Nov 2026 (month 0-indexed: 10 = November)
  const body = getOfficeBody(win, doc, "#office/mattins");
  check("2 Nov 2026 Mattins: seasonLabel names the Office of the Dead", /the Office of the Dead \(Double rite\)/.test(doc.getElementById("seasonLabel").textContent));
  check("2 Nov 2026 Mattins: officeTitle says Mattins & Lauds of the Dead", /Mattins .* Lauds of the Dead/.test(doc.getElementById("officeTitle").textContent));
  check("2 Nov 2026 Mattins: Matins of the Dead heading present", /Matins of the Dead/.test(body));
  check("2 Nov 2026 Mattins: Lauds of the Dead heading present", /Lauds of the Dead/.test(body));
  check("2 Nov 2026 Mattins: all three Nocturns shown (Double rite forces \"three\")", /Nocturn I\b/.test(body) && /Nocturn II\b/.test(body) && /Nocturn III\b/.test(body));
  check("2 Nov 2026 Mattins: no live (but non-functional) Nocturn-count toggle shown", !/data-inline-toggle="matinsDeadNocturns"/.test(body));
  check("2 Nov 2026 Mattins: no live Nocturn-I/II/III picker shown either", !/data-inline-toggle="matinsDeadNocturnPick"/.test(body));
}

// 2. 2 Nov 2026 Evensong: shows Vespers of the Dead.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 10, 2);
  const body = getOfficeBody(win, doc, "#office/evensong");
  check("2 Nov 2026 Evensong: seasonLabel names the Office of the Dead", /the Office of the Dead \(Double rite\)/.test(doc.getElementById("seasonLabel").textContent));
  check("2 Nov 2026 Evensong: officeTitle says Vespers of the Dead", /Vespers of the Dead/.test(doc.getElementById("officeTitle").textContent));
  check("2 Nov 2026 Evensong: Vespers of the Dead heading present", /Vespers of the Dead/.test(body));
  check("2 Nov 2026 Evensong: color dot is Black (MournfulBlack), not White", doc.getElementById("colorDot").title.indexOf("Black") === 0);
}

// 3. Control: 1 Nov 2026 (All Saints', the day before) is completely
// unaffected - still the ordinary Daily Office, not the Dead rite.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 10, 1);
  const bodyM = getOfficeBody(win, doc, "#office/mattins");
  check("1 Nov 2026 (All Saints') Mattins: NOT the Office of the Dead", !/the Office of the Dead/.test(doc.getElementById("seasonLabel").textContent));
  check("1 Nov 2026 Mattins: ordinary Mattins title shown", /Order for Daily Morning Prayer|Mattins/.test(doc.getElementById("officeTitle").textContent) && !/Lauds of the Dead/.test(doc.getElementById("officeTitle").textContent));
  const bodyE = getOfficeBody(win, doc, "#office/evensong");
  check("1 Nov 2026 (All Saints') Evensong: NOT the Office of the Dead", !/the Office of the Dead/.test(doc.getElementById("seasonLabel").textContent));
}

// 4. Control: a plain ordinary weekday is unaffected by the new color
// exception (seasonBaseColor still governs).
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 10, 10); // 10 Nov 2026, an ordinary Trinitytide feria
  getOfficeBody(win, doc, "#office/mattins");
  check("10 Nov 2026 (ordinary feria): color is NOT forced black", doc.getElementById("colorDot").title.indexOf("Black") !== 0);
}

// 5. The dedicated, separate Matins-of-the-Dead page (task #176's own
// date-aware page) still works normally and still offers its own real
// Nocturn-count toggle, confirming this fix didn't touch that page.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  win.location.hash = "#matins-dead";
  win.dispatchEvent(new win.Event("hashchange"));
  const body = doc.getElementById("matinsDeadBody").innerHTML;
  check("The separate #matins-dead page still has its own working Nocturn-count toggle", /data-inline-toggle="matinsDeadNocturns"/.test(body));
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
