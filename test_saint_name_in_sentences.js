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
    "js/data-marian-anthems.js","js/data-athanasian-creed.js","js/data-great-litany.js","js/data-litany-saints.js",
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
function run(label, y, m0, d, hourHash, checks) {
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, y, m0, d);
  console.log(`=== ${label} ===`);
  const body = getOfficeBody(win, doc, hourHash);
  checks(body);
  console.log();
}

// St. Gorazde of Prague, Bishop & Martyr (9-4, kalendar.json rank
// "Double" - RANK_TIER 4, and outside any named ForeOffice season, so
// pickOpeningSentenceCategory falls through to his Common-of-Saint
// category, "bishopConfessorDoctor" via the "Bishop" match in
// COMMON_OF_SAINT_PATTERNS). This is the exact feast George's item #2
// screenshot showed duplicated as a subtitle, and its Common category's
// last opening sentence is the exact "Pray for us, O blessed N." line
// George's item #3 flagged. Task #137: "N." should become the winning
// Saint's own name (the part of kalendar.json's "name" field before its
// first comma - the office/title clause after the comma is spoken
// elsewhere on the page already).
run("St. Gorazde Mattins (2026-09-04, Double, Bishop & Martyr) - N. filled with the Saint's name", 2026, 8, 4, "#office/mattins", (body) => {
  const idx = body.indexOf("Pray for us, O blessed");
  console.log("found the Common-of-Saint closing sentence:", idx >= 0);
  const nextIdx = body.indexOf("</p>", idx);
  const sentence = body.slice(idx, nextIdx);
  console.log("sentence text:", sentence.replace(/<[^>]+>/g, ""));
  console.log("N. replaced with 'St. Gorazde of Prague' (not left as a bare 'N.'):", sentence.includes("O blessed St. Gorazde of Prague."));
  console.log("no stray literal 'N.' placeholder remains anywhere in the Fore-Office sentences:", !/blessed N\./.test(body));
});

// Same feast at Evensong - the "evening" tier is combined with the
// "bishopConfessorDoctor" tier per task #118's own combining logic, so
// the same substitution should still apply to the Common-of-Saint
// sentence even though it now sits alongside the Hour's own Evening set.
run("St. Gorazde Evensong (2026-09-04) - N. still filled with the Saint's name", 2026, 8, 4, "#office/evensong", (body) => {
  const idx = body.indexOf("Pray for us, O blessed");
  console.log("found the Common-of-Saint closing sentence:", idx >= 0);
  const nextIdx = body.indexOf("</p>", idx);
  const sentence = body.slice(idx, nextIdx);
  console.log("sentence text:", sentence.replace(/<[^>]+>/g, ""));
  console.log("N. replaced with 'St. Gorazde of Prague':", sentence.includes("O blessed St. Gorazde of Prague."));
});

// A plain weekday with no winning Sanctorale feast at all (2026-09-02,
// today - only ordinary Trinitytide) - the "general"/"morning" sets
// never contain "N." in the first place, so nothing should be touched
// and no crash should occur from feastNameForSentence being null.
run("Plain Trinitytide Wednesday (2026-09-02) - no feast, no 'N.' substitution attempted", 2026, 8, 2, "#office/mattins", (body) => {
  console.log("no 'Pray for us, O blessed' sentence present (no Common-of-Saint category today):", body.indexOf("Pray for us, O blessed") === -1);
});

// Sacramental-rite "N." placeholders (Matrimony, Baptism, Burial,
// Unction, Reception, Litany of the Saints) are a DIFFERENT, correct
// convention - "insert the person's own name here" (bride/groom/the
// sick/the departed/a Bishop) - confirmed by directly reading each
// file's actual matched lines (e.g. matrimony.json: "N., wilt thou have
// this woman to thy wedded wife..."; reception.json/unction.json/
// litany-saints.json: "thy servant N."/"our Bishop, N."). These render
// through renderSimplePart-style paths that never call renderForeOffice,
// so this fix - scoped to renderForeOffice's sentence loop alone -
// cannot reach or alter them; verified out of scope by inspection rather
// than by exercising those pages here, since this file's test harness
// only drives the Office (Mattins/Evensong) hash routes.
console.log("=== Done ===");
