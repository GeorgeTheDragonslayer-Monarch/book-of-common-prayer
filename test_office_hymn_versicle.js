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

// Monday 2028-01-03 (per earlier task #123 research: plain ferial day).
run("Monday Mattins Office Hymn versicle (2028-01-03)", 2028, 0, 3, "#office/mattins", (body) => {
  const officeHymnIdx = body.indexOf("Office Hymn (Monday Mattins)");
  const benedictusIdx = body.indexOf(">Benedictus<");
  const window_ = body.slice(officeHymnIdx, benedictusIdx);
  console.log("has 'O satisfy us with thy mercy' versicle:", /O satisfy us with thy mercy, and that soon\./.test(window_));
  console.log("has 'So shall we rejoice' response:", /So shall we rejoice and be glad all the days of our life\./.test(window_));
  console.log("versicle appears after the last hymn stanza (Almighty Father):", window_.indexOf("Almighty Father") < window_.indexOf("O satisfy us"));
});

run("Monday Evensong Office Hymn versicle (2028-01-03)", 2028, 0, 3, "#office/evensong", (body) => {
  const officeHymnIdx = body.indexOf("Office Hymn (Monday Evensong)");
  const window_ = body.slice(officeHymnIdx, officeHymnIdx + 2500);
  console.log("has 'Lord, let my prayer be set forth.' versicle:", /Lord, let my prayer be set forth\./.test(window_));
  console.log("has 'In thy sight as the incense.' response:", /In thy sight as the incense\./.test(window_));
});

run("Saturday Evensong Office Hymn versicle - distinct text (2028-01-08)", 2028, 0, 8, "#office/evensong", (body) => {
  const officeHymnIdx = body.indexOf("Office Hymn (Saturday Evensong)");
  const window_ = body.slice(officeHymnIdx, officeHymnIdx + 2500);
  console.log("has 'Let our evening prayer come up before thee, O Lord.' versicle:", /Let our evening prayer come up before thee, O Lord\./.test(window_));
  console.log("has 'And let thy mercy come down on us.' response:", /And let thy mercy come down on us\./.test(window_));
});

run("Sunday Mattins in Winter Office Hymn versicle (2028-01-09)", 2028, 0, 9, "#office/mattins", (body) => {
  const officeHymnIdx = body.indexOf("Office Hymn (Sunday Mattins in Winter)");
  const benedictusIdx = body.indexOf(">Benedictus<");
  const window_ = body.slice(officeHymnIdx, benedictusIdx);
  console.log("has 'The Lord is King' versicle:", /The Lord is King, and hath put on glorious apparel\./.test(window_));
  console.log("has 'The Lord hath put on his apparel' response:", /The Lord hath put on his apparel, and girded himself with strength\./.test(window_));
});

// Invitatory Hymn (post-Venite slot) should NOT get a versicle - source
// has none there, per task #123's own investigation.
run("Invitatory Hymn has no versicle appended (2028-01-03)", 2028, 0, 3, "#office/mattins", (body) => {
  const invIdx = body.indexOf("Invitatory Hymn (Monday)");
  const offIdx = body.indexOf("Office Hymn (Monday Mattins)");
  const window_ = body.slice(invIdx, offIdx);
  console.log("Invitatory Hymn block has no 'O satisfy us' versicle bleeding in:", !/O satisfy us with thy mercy/.test(window_));
});
