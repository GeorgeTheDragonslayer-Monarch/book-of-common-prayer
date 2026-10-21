const fs = require("fs");
const { JSDOM } = require("jsdom");

// George's 10/20 note (Feast of the Motherhood of the BVM): "The program
// struggles to make sense of feasts with 2 Evensongs. It uses the same
// Psalm and Magnificat Antiphon (the 2nd Evensong one) both days."
//
// Root cause, in js/app.js: every place that chooses between a day's
// `firstEvensong...`/`secondEvensong...` antiphon pair (the group Psalm
// antiphon in the "psalms" placeholder case and its deferred "last Psalm
// antiphon" position, and the Magnificat antiphon in the
// "magnificatAntiphon" placeholder case, including both of their
// Feast-then-Common fallback blocks) always preferred the Second Evensong
// variant outright - `primaryEntry.secondEvensong... || primaryEntry.
// firstEvensong...` - with no awareness of `eveningDisplacement`, the
// Table-2 mechanism (resolveEveningDisplacement, task #91) that decides
// whether TONIGHT is First Evensong of an UPCOMING feast (anticipated,
// outranking today's own Office) or that feast's own Second Evensong (no
// displacement needed - tonight already IS the feast's evening). When
// displaced, `resolved` throughout the render pass is already the feast's
// own resolution (renderOfficePage's `renderResolved`), so the SAME
// `primaryEntry` is picked on both nights - only the antiphon variant
// proper to tonight differs, and the old code never asked which.
//
// Fixed with a new `pickEvensongAntiphonVariant(first, second)` helper
// that prefers the First Evensong variant exactly when `eveningDisplacement`
// is set (tonight anticipates tomorrow's feast), falling back to Second
// when First isn't sourced - and prefers Second (the pre-existing
// behavior) otherwise, falling back to First. Most sourced days only ever
// have one variant total, so either direction simply falls back to
// whichever one the day actually has (see
// test_evensong_ordinary_sunday_anticipation.js's own Trinity XI case).
//
// Candlemas (2 Feb) is used here because data/collects-sanctorale.json's
// "2-2" entry carries a genuinely distinct First/Second pair for BOTH the
// Magnificat antiphon and the group Psalm antiphon, and its 2nd Double
// rank is confirmed (by resolveEveningDisplacement firing on 1 Feb 2026,
// per the existing banner) to outrank 1 Feb's own winning feast (St.
// Ignatius of Antioch, a plain Double), so First Evensong is genuinely
// anticipated the night before.
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
  return doc.getElementById("officeBody").textContent;
}
let failed = false;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failed = true;
}

// 1. 1 Feb 2026: First Evensong of Candlemas (anticipated the night
// before, per the Table of Concurrence) must show Candlemas's FIRST
// Evensong antiphons, not its Second.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 1, 1); // 1 Feb 2026 (month 0-indexed: 1 = February)
  const body = getOfficeBody(win, doc, "#office/evensong");
  const banners = Array.from(doc.querySelectorAll(".rubric-fine")).map((e) => e.textContent);
  check("1 Feb 2026: banner announces First Evensong of Candlemas", banners.some((t) => /^This Evensong is First Evensong of Candlemas\b/.test(t)));
  check("1 Feb 2026: Magnificat antiphon is Candlemas's FIRST Evensong one (\"The ancient\")", /The ancient carried the Infant/.test(body));
  check("1 Feb 2026: Magnificat antiphon is NOT Candlemas's Second Evensong one (\"To-day\")", !/To-day the blessed Virgin Mary presented/.test(body));
  check("1 Feb 2026: Psalm antiphon is Candlemas's FIRST Evensong one (\"When thou was born\")", /When thou was born ineffably/.test(body));
  check("1 Feb 2026: Psalm antiphon is NOT Candlemas's Second Evensong one (\"A light\")", !/A light to lighten the Gentiles, and the glory of thy people Israel\./.test(body));
}

// 2. 2 Feb 2026: Candlemas itself (its own, undisplaced Second Evensong)
// must still show its Second Evensong antiphons, exactly as before this
// fix - confirming the fix is direction-aware, not just always-First.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 1, 2); // 2 Feb 2026
  const body = getOfficeBody(win, doc, "#office/evensong");
  const banners = Array.from(doc.querySelectorAll(".rubric-fine")).map((e) => e.textContent);
  check("2 Feb 2026 (Candlemas itself): no First-Evensong-anticipation banner fires", !banners.some((t) => /^This Evensong is First Evensong of/.test(t)));
  check("2 Feb 2026: Magnificat antiphon is Candlemas's SECOND Evensong one (\"To-day\")", /To-day the blessed Virgin Mary presented/.test(body));
  check("2 Feb 2026: Magnificat antiphon is NOT Candlemas's First Evensong one (\"The ancient\")", !/The ancient carried the Infant/.test(body));
  check("2 Feb 2026: Psalm antiphon is Candlemas's SECOND Evensong one (\"A light\")", /A light to lighten the Gentiles, and the glory of thy people Israel\./.test(body));
  check("2 Feb 2026: Psalm antiphon is NOT Candlemas's First Evensong one (\"When thou was born\")", !/When thou was born ineffably/.test(body));
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
