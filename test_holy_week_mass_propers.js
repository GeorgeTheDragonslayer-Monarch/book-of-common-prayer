const fs = require("fs");
const { JSDOM } = require("jsdom");

// George's consolidated 10/7 list, item 9: "Also, Holy Week's Masses
// needs to be replaced with what is in the Missal."
//
// Root cause: Holy Monday through Easter Even all share the single
// "Palm Sunday" periodKey bucket (js/calendar.js's describeSeason
// already special-cases this exact periodKey/dayLabel pair for the
// on-screen title - task #212), but `resolveMassPropersWinner`'s own
// Temporale lookup (`collectsTemporaleData[resolved.periodKey]`) had no
// day-of-week awareness at all - so EVERY day of Holy Week literally
// showed Palm Sunday's own Mass (the Palm procession Gospel and the
// Passion according to St. Matthew), Easter Even included, whose true
// Mass is the entirely different Paschal Vigil.
//
// Fixed with a new `resolveTemporaleSeasonEntry(resolved)` helper
// (js/app.js) that dereferences one level deeper by `resolved.dayLabel`
// for this one periodKey, matching a restructured
// data/collects-temporale.json (its "Palm Sunday" entry is now nested by
// day label - Sunday/Holy Monday/Holy Tuesday/Spy Wednesday/Maundy
// Thursday/Good Friday/Easter Even - the same convention data/
// lectionary-temporale.json's own "Palm Sunday" bucket already used).
//
// What's now shown, per this project's own primary .tex sources:
// - Palm Sunday (Sunday): unchanged, its full pre-existing Mass.
// - Holy Monday/Holy Tuesday/Spy Wednesday/Maundy Thursday: each day's
//   own sourced Collect (PropSeas.tex lines ~2558-2593) - no Introit/
//   Epistle/Gospel/Gradual/Offertory/Secret/Communion/Postcommunion
//   exists anywhere in this project for these four days, so those parts
//   correctly keep showing this site's pre-existing "No ... found for
//   this Proper yet" placeholder rather than Palm Sunday's own (wrong)
//   text.
// - Good Friday: its own three sourced Collects (PropSeas.tex lines
//   2604-2609, the historic "for the Church / for all estates of men /
//   for the conversion of the Jews, Turks, infidels, and heretics"
//   sequence - 1892 wording, per the source's own note that the 1928
//   revision's softened wording was reverted). The Mass of the
//   Presanctified itself (and Maundy Thursday's Mandatum rite) remain
//   BLOCKED - no description of either rite exists anywhere in this
//   project (same blocker as PENDING-CORRECTIONS.md item #8b).
// - Easter Even: its own fully-sourced Paschal Vigil Mass
//   (pages/Propers/EasterEven.tex's "Holy Mass" section) - Collect,
//   Epistle (1 Peter 3:17), Gospel (Matthew 27:57), the triple Alleluia
//   + verse followed by a Tract, and the Secret - transcribed here for
//   the first time. That file's fuller Vigil ceremonial (the Blessing of
//   the Paschal Fire, the Exsultet, the Twelve Prophecies, the Blessing
//   of the Font, and the Paschal Litany) is left out of scope for this
//   pass, same as Palm Sunday's own parallel Blessing-of-Palms/
//   Procession was left out of scope for item #9/task #212 (Candlemas).
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
function massBodyText(win, doc, y, m0, day) {
  clickCalendarDay(win, doc, y, m0, day);
  win.location.hash = "#mass";
  win.dispatchEvent(new win.Event("hashchange"));
  return doc.getElementById("massBody").textContent;
}
let failed = false;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failed = true;
}

const dom = makeDom();
const win = dom.window, doc = win.document;

// Orthodox Easter 2026 (this site's own computus) = 12 April, so Holy
// Week 2026 runs: Palm Sunday 5 Apr, Holy Monday 6, Holy Tuesday 7, Spy
// Wednesday 8, Maundy Thursday 9, Good Friday 10, Easter Even 11.

// 1. Palm Sunday itself is unchanged.
{
  const body = massBodyText(win, doc, 2026, 3, 5);
  check("Palm Sunday (5 Apr): still shows its own Palm-procession Gospel", /drew nigh unto Jerusalem/.test(body));
  check("Palm Sunday (5 Apr): seasonLabel reads \"Palm Sunday\"", doc.getElementById("massSeasonLabel").textContent === "Palm Sunday");
}

// 2. Holy Monday: its own Collect, not Palm Sunday's.
{
  const body = massBodyText(win, doc, 2026, 3, 6);
  check("Holy Monday (6 Apr): shows its own sourced Collect", /walking in the way of the cross/.test(body));
  check("Holy Monday (6 Apr): no longer shows Palm Sunday's Gospel", !/drew nigh unto Jerusalem/.test(body));
  check("Holy Monday (6 Apr): seasonLabel reads \"Holy Monday\"", doc.getElementById("massSeasonLabel").textContent === "Holy Monday");
}

// 3. Holy Tuesday: its own Collect.
{
  const body = massBodyText(win, doc, 2026, 3, 7);
  check("Holy Tuesday (7 Apr): shows its own sourced Collect", /gave his back to the smiters/.test(body));
  check("Holy Tuesday (7 Apr): no longer shows Palm Sunday's Gospel", !/drew nigh unto Jerusalem/.test(body));
}

// 4. Spy Wednesday: its own Collect.
{
  const body = massBodyText(win, doc, 2026, 3, 8);
  check("Spy Wednesday (8 Apr): shows its own sourced Collect", /meditation of those mighty acts/.test(body));
  check("Spy Wednesday (8 Apr): no longer shows Palm Sunday's Gospel", !/drew nigh unto Jerusalem/.test(body));
}

// 5. Maundy Thursday: its own Collect.
{
  const body = massBodyText(win, doc, 2026, 3, 9);
  check("Maundy Thursday (9 Apr): shows its own sourced Collect", /institute the Sacrament of his Body and Blood/.test(body));
  check("Maundy Thursday (9 Apr): no longer shows Palm Sunday's Gospel", !/drew nigh unto Jerusalem/.test(body));
}

// 6. Good Friday: all three of its own sourced Collects.
{
  const body = massBodyText(win, doc, 2026, 3, 10);
  check("Good Friday (10 Apr): shows the first Collect (for the Church)", /betrayed and given up into the hands of wicked men/.test(body));
  check("Good Friday (10 Apr): shows the second Collect (for all estates of men)", /for all estates of men in thy holy Church/.test(body));
  check("Good Friday (10 Apr): shows the third Collect (the 1892 wording)", /Jews, Turks, infidels, and heretics/.test(body));
  check("Good Friday (10 Apr): no longer shows Palm Sunday's Gospel", !/drew nigh unto Jerusalem/.test(body));
  check("Good Friday (10 Apr): seasonLabel reads \"Good Friday\"", doc.getElementById("massSeasonLabel").textContent === "Good Friday");
}

// 7. Easter Even: its own fully-sourced Paschal Vigil Mass - Collect,
// Epistle, Gospel, Secret - not Palm Sunday's Mass.
{
  const body = massBodyText(win, doc, 2026, 3, 11);
  check("Easter Even (11 Apr): shows its own Collect", /baptized into the death of thy blessed Son/.test(body));
  check("Easter Even (11 Apr): shows its own Epistle (1 Peter 3:17)", /Dearly beloved/.test(body) && /the days of Noah/.test(body));
  check("Easter Even (11 Apr): shows its own Gospel (Matthew 27:57)", /begged the body of Jesus/.test(body) && /sealing the stone/.test(body));
  check("Easter Even (11 Apr): shows its own Secret", /profitable for our healing in eternity/.test(body));
  check("Easter Even (11 Apr): no longer shows Palm Sunday's Gospel", !/drew nigh unto Jerusalem/.test(body));
  check("Easter Even (11 Apr): seasonLabel reads \"Easter Even\"", doc.getElementById("massSeasonLabel").textContent === "Easter Even");
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
