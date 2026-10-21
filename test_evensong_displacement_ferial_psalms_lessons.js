const { JSDOM } = require("jsdom");
const fs = require("fs");

// George's 10/7 note: "Yesterday in the evening, it had the Evensong
// lessons for tonight. I think it's because it is correctly identifying
// last evening as I Evensong of Our Lady of the Rosary. However, when
// the Festival does not have proper Psalms and Lessons (a Red Letter Day
// as specified in the Lectionary's Feasts of the Year and the Kalendar),
// the Psalms and Lessons are ferial (from the 30-Day or Alternative
// Psalter, and the Lectionary's Proper of Season)."
//
// Root cause: when the Table of Concurrence's resolveEveningDisplacement
// fires (here: 5 Oct 2026's Evensong is anticipated as First Evensong of
// Our Lady of the Rosary, 6 Oct, a Greater Double with no proper
// Lessons/Psalms of its own in lectionary-festivals.json), renderOfficePage
// swaps its module-level `resolved` to tomorrow's resolved day
// (`renderResolved`) for the whole render. That's correct for the title,
// Collect, and antiphons - this Evensong IS of the Rosary - but the
// ferial Lessons/Psalms fallback paths (pickLectionarySlot's lectionary
// read, and resolvePsalmsForDay's day-of-month Monthly Psalter lookup)
// must still be keyed off the *civil* evening (5 Oct), not the displacing
// feast's own date (6 Oct), or they silently render one day ahead.
//
// Fixed by threading eveningDisplacement.todayResolved (the pre-swap,
// civil-today resolved object, added to resolveEveningDisplacement's
// return value for exactly this purpose) back into both
// pickLectionarySlot's ferial-fallback branch and both call sites of
// resolvePsalmsForDay, whenever currentHour === "evensong" and a
// displacement is in effect. See js/app.js around resolveEveningDisplacement,
// pickLectionarySlot, and the two resolvePsalmsForDay call sites.

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

// 1. 5 Oct 2026 (ordinary Evensong, undisplaced - 6 Oct's Rosary is a
// Greater Double but 5 Oct is a plain feria, so no Table-2 carve-out
// fires): expect the civil day's own ferial Lessons (Deuteronomy 29) and
// Monthly Psalter entries for day-of-month 5 (Psalms 27, 28, 29).
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 9, 5); // 5 Oct 2026 (month is 0-indexed: 9 = October)
  console.log("\n=== 5 Oct 2026 Evensong (ordinary, undisplaced) ===");
  const body = getOfficeBody(win, doc, "#office/evensong");
  const text = doc.getElementById("officeBody").textContent;
  // NB: the rendered text runs the chapter number directly into the
  // following reading text with no space (e.g. "Deuteronomy 29Here
  // beginneth..."), so \b after a digit immediately followed by a letter
  // never matches (both are \w) - use a negative lookahead for another
  // digit instead, so "29" doesn't also match as a prefix of "290".
  console.log("First Lesson is Deuteronomy 29 (correct, own civil day):", /Deuteronomy 29(?!\d)/.test(text));
  const psalmHeadings = Array.from(doc.querySelectorAll(".psalm-block h4")).map((e) => e.textContent).join(" | ");
  console.log("Psalm headings:", psalmHeadings);
  console.log("Shows Psalms 27, 28, 29 (Monthly Psalter day 5):", /Psalm 27(?!\d)/.test(psalmHeadings) && /Psalm 28(?!\d)/.test(psalmHeadings) && /Psalm 29(?!\d)/.test(psalmHeadings));
}

// 2. 6 Oct 2026 (I Evensong of Our Lady of the Rosary, anticipated per
// Table 2 since Rosary is a Greater Double and 5 Oct is a plain feria):
// Collect/title/antiphons are properly of the Rosary, but Lessons and
// Psalms - since the Rosary has no proper Lessons/Psalms of its own -
// must still be the CIVIL day's (6 Oct's) own ferial Lessons
// (Deuteronomy 30, one chapter past 5 Oct's 29) and Monthly Psalter
// day-of-month 6 (Psalms 32, 33, 34) - NOT 7 Oct's entries (Psalm 37),
// which is what the pre-fix bug incorrectly showed.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, 2026, 9, 6);
  console.log("\n=== 6 Oct 2026 Evensong (I Evensong of Our Lady of the Rosary, displaced) ===");
  const body = getOfficeBody(win, doc, "#office/evensong");
  const text = doc.getElementById("officeBody").textContent;
  console.log("Title/hymn confirms this is of the Rosary:", /Holy Rosary/i.test(body));
  console.log("First Lesson is Deuteronomy 30 (correct ferial continuation, NOT 31:30-32:43):", /Deuteronomy 30(?!\d)/.test(text));
  console.log("Does NOT show the wrong 2-chapter jump (31):", !/Deuteronomy 31(?!\d)/.test(text));
  const psalmHeadings = Array.from(doc.querySelectorAll(".psalm-block h4")).map((e) => e.textContent).join(" | ");
  console.log("Psalm headings:", psalmHeadings);
  console.log("Shows Psalms 32, 33, 34 (Monthly Psalter day 6, correct):", /Psalm 32(?!\d)/.test(psalmHeadings) && /Psalm 33(?!\d)/.test(psalmHeadings) && /Psalm 34(?!\d)/.test(psalmHeadings));
  console.log("Does NOT show Psalm 37 alone (Monthly Psalter day 7, the pre-fix bug):", !(/Psalm 37(?!\d)/.test(psalmHeadings) && !/Psalm 32(?!\d)/.test(psalmHeadings)));
}

console.log("\n=== Done ===");
