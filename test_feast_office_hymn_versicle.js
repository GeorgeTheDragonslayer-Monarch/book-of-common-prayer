const fs = require("fs");
const { JSDOM } = require("jsdom");

// George's 10/20 note (Feast of the Motherhood of the BVM): "In Evensong
// on Feast Days, the Versicle and Response is missing after the Office
// Hymn."
//
// Root cause, in js/app.js's "hymnSlot" placeholder case: when a winning
// Feast (or its Common) has its own proper Office Hymn text sourced in
// data/feast-office-hymns.json (the `feastEntry` branch, task #90), the
// code used to `return` immediately after printing the hymn's stanzas -
// never reaching the `if (h.versicle) {...}` block a few lines below,
// which only ever ran on the FERIAL fallback path (`h`, from
// mattinsHymnOptions/evensongHymnOptions). So any day whose Office Hymn
// came from a winning Feast rendered no trailing Versicle/Response at
// all, while an ordinary feria's hymn always did.
//
// Fixed by restructuring so both the `feastEntry` and ferial `h` cases
// render their hymn text first, then share a SINGLE trailing-versicle
// step. The versicle itself is looked up by weekday regardless of which
// hymn text was shown: FerialHymns.tex's own versicle is keyed by
// weekday/Hour, not by the specific hymn text (confirmed directly in the
// sourced data - every non-Sunday weekday at a given Hour already shares
// one identical ℣./℟., e.g. every Monday-Friday Evensong uses "Lord, let
// my prayer be set forth... / In thy sight as the incense."), so it is
// the correct, already-sourced text to show on a Feast day too, rather
// than nothing - a feast-specific versicle, if one is ever individually
// sourced and added to feastEntry.versicle, would simply take priority.
//
// St. Michael and All Angels (29 Sept, 1st Double, no competing feast)
// is used here because data/feast-office-hymns.json's sanctorale entry
// has its own `evensongHymn` (so the `feastEntry` branch, not the
// ferial fallback, is what's actually rendering the hymn text).
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
let failed = false;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failed = true;
}

// Finds the Office Hymn's own section-heading element and returns the
// text of the next couple of versicle/response lines that immediately
// follow it in the DOM (before the next heading), the same way a reader
// would see them on the page.
function versicleAfterHymn(doc) {
  const nodes = Array.from(doc.getElementById("officeBody").children);
  const hymnIdx = nodes.findIndex((n) => n.classList.contains("section-heading") && /Office Hymn/.test(n.textContent));
  if (hymnIdx === -1) return { found: false };
  const after = [];
  for (let i = hymnIdx + 1; i < nodes.length && after.length < 4; i++) {
    const n = nodes[i];
    if (n.classList.contains("versicle") || n.classList.contains("response")) after.push(n.textContent);
    else if (n.classList.contains("hymn-stanza") || n.classList.contains("hymn-stanza-row")) continue;
    else break;
  }
  return { found: true, lines: after };
}

// 1. 29 Sept 2026 (St. Michael and All Angels, 1st Double, no competing
// feast): the Office Hymn's own feastEntry branch must now be followed
// by its trailing Versicle & Response, not nothing.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 8, 29); // 29 Sept 2026 (month 0-indexed: 8 = September)
  win.location.hash = "#office/evensong";
  win.dispatchEvent(new win.Event("hashchange"));
  check("29 Sept 2026: Office Hymn heading names St. Michael and All Angels", Array.from(doc.querySelectorAll(".section-heading")).some((e) => /Office Hymn \(St\. Michael and All Angels\)/.test(e.textContent)));
  const { found, lines } = versicleAfterHymn(doc);
  check("29 Sept 2026: an Office Hymn heading was found to check after", found);
  check("29 Sept 2026: Versicle \"Lord, let my prayer be set forth.\" follows the Office Hymn", (lines || []).some((t) => /Lord, let my prayer be set forth\./.test(t)));
  check("29 Sept 2026: Response \"In thy sight as the incense.\" follows the Versicle", (lines || []).some((t) => /In thy sight as the incense\./.test(t)));
}

// 2. Control: an ordinary ferial Evensong (no winning Feast of its own)
// must keep showing its pre-existing ferial Versicle & Response too -
// confirming the fix didn't disturb the already-working ferial path.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 9, 20); // 20 Oct 2026, a true plain Tuesday feria (empty Kalendar entry, no displacement either direction)
  win.location.hash = "#office/evensong";
  win.dispatchEvent(new win.Event("hashchange"));
  check("20 Oct 2026: Office Hymn heading names a plain weekday (Tuesday Evensong)", Array.from(doc.querySelectorAll(".section-heading")).some((e) => /Office Hymn \(Tuesday Evensong\)/.test(e.textContent)));
  const { found, lines } = versicleAfterHymn(doc);
  check("20 Oct 2026: an Office Hymn heading was found to check after", found);
  check("20 Oct 2026: Versicle \"Lord, let my prayer be set forth.\" still follows the ferial Office Hymn", (lines || []).some((t) => /Lord, let my prayer be set forth\./.test(t)));
  check("20 Oct 2026: Response \"In thy sight as the incense.\" still follows the Versicle", (lines || []).some((t) => /In thy sight as the incense\./.test(t)));
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
