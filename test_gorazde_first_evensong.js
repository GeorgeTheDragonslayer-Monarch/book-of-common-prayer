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
    "js/data-marian-anthems.js","js/data-athanasian-creed.js","js/data-old-testament-canticles.js","js/data-great-litany.js","js/data-litany-saints.js",
    "js/data-mass-ordinary.js","js/data-mass-prefaces.js","js/data-confession.js","js/data-communion-sick.js","js/data-purification.js",
    "js/data-burial-child.js","js/data-confirmation.js","js/data-reception.js","js/data-matrimony.js","js/data-baptism.js",
    "js/data-unction.js","js/data-burial.js","js/data-adult-baptism.js","js/data-family.js",
    "js/data-asperges.js","js/data-foremass.js","js/data-preparation.js","js/data-thanksgiving.js","js/data-benediction.js",
    "js/data-vesper-dead.js","js/data-lauds-dead.js","js/data-matins-dead.js","js/data-votive.js",
    "js/data-feast-office-hymns.js","js/data-seasonal-prayers.js",
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

// George's 9/4 note via Augustine, task #148: "Last night should have
// been First Evensong for St. Gorazde. The Invitatory Hymn and the
// Office Hymns and Versicle and Antiphons should be of St. Gorazde."
// 3 September 2026 is a plain ferial Thursday with no Kalendar entry of
// its own; St. Gorazde of Prague (Double rank) falls the next day, 4
// September. Root cause: Table2_revision.pdf's own 9 rows never include
// a plain "feria" - classifyVespersCategory correctly returns null for
// one (there's no row to classify it into), but resolveEveningDisplacement
// then treated that null as "no rule fires, nothing changes," which is
// backwards - a feria isn't a row because it has no Vespers claim to WEIGH
// against anything, not because it should keep its own ordinary Evensong
// regardless of what feast follows. Fixed to treat a true plain feria
// (winner==="season", not Sunday) followed by a Double-tier feast
// tomorrow as Table 2's own code 1 ("all of the following, nothing of
// the preceding").
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 8, 3); // 3 September 2026, the eve
  console.log("=== 3 September 2026 Evensong - First Evensong of St. Gorazde ===");
  const body = getOfficeBody(win, doc, "#office/evensong");
  console.log("Displacement banner names St. Gorazde:", body.includes("First Evensong of St. Gorazde of Prague, Bishop &amp; Martyr"));
  console.log("No 'commemorated below' clause (plain feria has nothing to commemorate):", !body.includes("commemorated below"));
  console.log("Office Hymn is Common of Many Martyrs (not ferial Thursday hymn):", body.includes("Office Hymn (Common of Many Martyrs out of Eastertide)"));
  console.log("Magnificat antiphon is martyr-themed, not generic ferial:", body.includes("He hath put down the mighty that persecute the holy"));
  console.log();
}

// Today itself (4 September, St. Gorazde's actual day): the Invitatory
// Hymn slot (Mattins-only, before the Venite's Psalms) previously always
// showed the plain per-weekday ferial text regardless of any feast -
// confirmed as a genuine gap (not a deliberate scope decision, despite an
// earlier code comment saying so) once pages/Commons/Commons.tex's own
// `\mattinsInvitatoryHymn\label{MartyrsInvitatory}` was found to exist.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 8, 4); // 4 September 2026, St. Gorazde's actual day
  console.log("=== 4 September 2026 Mattins - St. Gorazde's own day ===");
  const body = getOfficeBody(win, doc, "#office/mattins");
  console.log("Invitatory Hymn heading names the Common:", body.includes("Invitatory Hymn (Common of Many Martyrs out of Eastertide)"));
  console.log("NOT the plain ferial 'Invitatory Hymn (Friday)':", !body.includes("Invitatory Hymn (Friday)"));
  console.log("Invitatory Hymn text is the Common's own ('The Martyrs' triumphs let us sing'):", body.includes("Martyrs&#39; triumphs let us sing") || body.includes("Martyrs' triumphs let us sing"));
  console.log("Office Hymn still correctly shows the Common too:", body.includes("Office Hymn (Common of Many Martyrs out of Eastertide)"));
  console.log();
}

// Ferial cycle must stay completely untouched on an ordinary day with no
// winning Feast at all (regression guard on the new invitatoryFeastEntry
// branch added ahead of the existing ferial fallback).
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2028, 0, 3); // Monday 3 January 2028, plain ferial (per test_invitatory_hymn.js)
  console.log("=== Plain ferial Monday - Invitatory Hymn ferial fallback unaffected ===");
  const body = getOfficeBody(win, doc, "#office/mattins");
  console.log("Still shows the ferial 'Invitatory Hymn (Monday)':", body.includes("Invitatory Hymn (Monday)"));
  console.log("No Common heading leaking in:", !body.includes("Common of"));
  console.log();
}

console.log("=== Done ===");
