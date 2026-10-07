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
function getMassBody(win, doc) {
  win.location.hash = "#mass";
  win.dispatchEvent(new win.Event("hashchange"));
  return doc.getElementById("massBody").innerHTML;
}
function run(label, y, m0, d, checks) {
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  clickCalendarDay(win, doc, y, m0, d);
  console.log(`=== ${label} ===`);
  const body = getMassBody(win, doc);
  checks(body);
  console.log();
}

// Ordinary Trinitytide Sunday - a plain feria/season Mass with a
// standard Secret ending.
run("Trinity IV Sunday (2026-06-28) - Secret ending not doubled", 2026, 5, 28, (body) => {
  const secretIdx = body.indexOf(">Secret Prayers<");
  const dialogueIdx = body.indexOf("Throughout all ages, world without end.");
  console.log("has 'Secret Prayers' heading:", secretIdx >= 0);
  console.log("has the separate ℣./℟. dialogue after it:", dialogueIdx > secretIdx);
  // Count how many times "world without end" appears between the Secret
  // heading and the Epistle/Gospel that follows communion antiphons -
  // should be exactly 1 (the standalone dialogue), not 2+ (dialogue +
  // duplicated inside the Secret's own printed text).
  const collectIdx = body.indexOf(">The Collect<") >= 0 ? body.indexOf(">The Collect<") : body.indexOf("collect-heading");
  // Scope strictly to the Secret's own block (heading through the start
  // of the next heading, "Preface") to avoid false matches against the
  // Collect/Postcommunion/other Communion devotions elsewhere on the
  // same page, which legitimately also end in this same standard phrase.
  const nextHeadingIdx = body.indexOf(">Preface<", secretIdx);
  const secretWindow = body.slice(secretIdx, nextHeadingIdx > 0 ? nextHeadingIdx : secretIdx + 2000);
  const count = (secretWindow.match(/world without end/gi) || []).length;
  console.log("'world without end' occurrences within the Secret block (expect 1, just the dialogue):", count);
  console.log("Secret's own <p> text does NOT end with a dangling 'throughout all ages':", !/throughout all ages,\s*world without end\.\s*Amen\.\s*<\/p>/i.test(secretWindow));
});

// Epiphany - one of the 7 entries whose abbreviated ending was expanded.
run("Epiphany (2027-01-06) - abbreviated Secret ending now complete and not doubled", 2027, 0, 6, (body) => {
  console.log("has full doxology text 'in the unity of the Holy Ghost, God.':", /in the unity of the Holy Ghost, God\./.test(body));
  console.log("no leftover bare 'Who liveth and reigneth with thee.' unexpanded ending:", !/Who liveth and reigneth with thee\.<\/p>/.test(body));
  const secretIdx = body.indexOf(">Secret Prayers<");
  const nextHeadingIdx = body.indexOf(">Preface<", secretIdx);
  const secretWindow = body.slice(secretIdx, nextHeadingIdx > 0 ? nextHeadingIdx : secretIdx + 2000);
  console.log("Secret block has exactly 1 'world without end' (the dialogue, not doubled):", (secretWindow.match(/world without end/gi) || []).length === 1);
});

// Collect and Postcommunion should be completely unaffected (full ending kept, no stripping).
run("Trinity IV Sunday - Collect/Postcommunion endings untouched", 2026, 5, 28, (body) => {
  const collectBlock = body.slice(0, body.indexOf(">Epistle<"));
  console.log("Collect still ends in full 'throughout all ages, world without end. Amen.':", /throughout all ages, world without end\. Amen\.<\/p>/i.test(collectBlock));
  const postIdx = body.lastIndexOf("Postcommunion");
  const postBlock = body.slice(postIdx, postIdx + 2000);
  console.log("Postcommunion still ends in full 'throughout all ages, world without end. Amen.':", /throughout all ages, world without end\. Amen\.<\/p>/i.test(postBlock));
});
