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

// George's 9/2 note, task #144: "(Evensong) the morning prayer is being
// used where the evening prayer should be; the prayer for the president
// should be in the evening prayer." pages/Prayers/PrayersThanksgivings.tex
// gives the Prayer for the President THREE forms - two for Morning Prayer
// ("O Lord, our heavenly Father..." / "O Lord our Governor...", already
// correctly toggled on Mattins per task #64) and a genuinely separate
// third one explicitly marked "During Evening Prayer" ("Almighty God,
// whose kingdom is everlasting..."). Evensong had been printing Mattins'
// own first Morning Prayer variant verbatim instead of this third text.
run("Mattins keeps its own Morning Prayer text and toggle (unaffected by this fix)", 2026, 8, 1, "#office/mattins", (body) => {
  console.log("has the 'O Lord, our heavenly Father...' Morning Prayer text (default toggle state):", body.includes("Ruler of the universe"));
  console.log("has the two-option toggle:", body.includes('data-inline-toggle="presidentPrayer"'));
});
run("Evensong now shows its own genuine Evening Prayer text, not Mattins'", 2026, 8, 1, "#office/evensong", (body) => {
  console.log("does NOT show Mattins' Morning Prayer text:", !body.includes("Ruler of the universe"));
  console.log("shows the source's own Evening-Prayer-specific text:", body.includes("whose kingdom is everlasting and power infinite"));
  console.log("has the Evening-Prayer-specific phrase 'The Governor of this State':", body.includes("The Governor of this State"));
  console.log("still has no toggle (single fixed text, per Augustine's 8/26 review):", !body.includes('data-inline-toggle="presidentPrayer"'));
  console.log("heading is unchanged:", body.includes("A Prayer for the President of the United States, and all in Civil Authority"));
});

// Commonwealth region has no Morning/Evening split for its own Prayer for
// the King and the Royal Family anywhere in the source - untouched by
// this fix, confirmed identical on both Hours once the region toggle is
// switched to Commonwealth.
{
  const dom = makeDom();
  const win = dom.window, doc = win.document;
  const commonwealthBtn = doc.querySelector('#regionMenu button[data-region="commonwealth"]');
  if (commonwealthBtn) commonwealthBtn.click();
  clickCalendarDay(win, doc, 2026, 8, 1);
  console.log("=== Commonwealth region's Prayer for the King - identical on Mattins and Evensong (untouched by this fix) ===");
  const mattinsBody = getOfficeBody(win, doc, "#office/mattins");
  const evensongBody = getOfficeBody(win, doc, "#office/evensong");
  const royalText = "we humbly beseech thee to bless our Sovereign Lord King Charles";
  console.log("Mattins shows the Commonwealth text:", mattinsBody.includes(royalText));
  console.log("Evensong shows the SAME Commonwealth text (no Morning/Evening split exists for it in the source):", evensongBody.includes(royalText));
  console.log();
}

console.log("=== Done ===");
