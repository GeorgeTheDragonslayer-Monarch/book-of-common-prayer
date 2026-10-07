const { JSDOM } = require("jsdom");
const fs = require("fs");

function makeDom() {
  const html = fs.readFileSync("index.html", "utf-8");
  const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously" });
  const { window } = dom;
  const scripts = ["js/data-psalter.js","js/data-kalendar.js","js/data-lectionary.js",
    "js/data-evensong-template.js","js/data-mattins-template.js","js/data-foreoffice.js",
    "js/data-compline-template.js",
    "js/data-prime-template.js","js/data-terce-template.js","js/data-sext-template.js","js/data-none-template.js",
    "js/data-collects-temporale.js","js/data-collects-sanctorale.js","js/data-kjv.js","js/data-apocrypha.js",
    "js/data-marian-anthems.js","js/data-athanasian-creed.js","js/data-great-litany.js","js/data-litany-saints.js",
    "js/data-mass-ordinary.js","js/data-confession.js","js/data-communion-sick.js","js/data-purification.js",
    "js/data-burial-child.js","js/data-confirmation.js","js/data-reception.js","js/data-matrimony.js","js/data-baptism.js",
    "js/data-unction.js","js/data-burial.js","js/data-adult-baptism.js","js/data-family.js",
    "js/data-asperges.js","js/data-foremass.js","js/data-preparation.js","js/data-thanksgiving.js","js/data-benediction.js",
    "js/data-vesper-dead.js","js/data-lauds-dead.js","js/data-matins-dead.js","js/data-votive.js",
    "js/computus.js","js/calendar.js","js/psalms.js","js/liturgical-color.js","js/office-variants.js",
    "js/ranking.js","js/scripture.js","js/app.js"];
  for (const s of scripts) {
    const el = window.document.createElement("script");
    el.textContent = fs.readFileSync(s, "utf-8");
    window.document.body.appendChild(el);
  }
  return dom;
}

const dom = makeDom();
const win = dom.window;
const doc = win.document;

console.log("--- Unit: pickOpeningSentenceCategory on known dates ---");
// Christmas Day itself (25 Dec) - should be christmastide, regardless of year
const christmas = new Date(Date.UTC(2026, 11, 25));
const christmasResolved = win.resolveLiturgicalDay(christmas, win.LECTIONARY_DATA, win.KALENDAR_DATA);
console.log("Christmas category (morning):", win.pickOpeningSentenceCategory(christmasResolved, { winner: "season" }, "morning"));

// A plain ferial Trinitytide day with a winning Martyr feast: use St. Lawrence, 10 August
const stLawrence = new Date(Date.UTC(2026, 7, 10));
const stLawrenceResolved = win.resolveLiturgicalDay(stLawrence, win.LECTIONARY_DATA, win.KALENDAR_DATA);
console.log("St. Lawrence kalendar:", JSON.stringify(stLawrenceResolved.kalendar));
const martyrFeastInfo = { winner: "feast", tier: 6, name: "St. Lawrence, Archdeacon & Martyr", rank: "2nd Double" };
console.log("St. Lawrence category (should be martyr):", win.pickOpeningSentenceCategory(stLawrenceResolved, martyrFeastInfo, "evening"));

// Ordinary Trinitytide weekday, no winning feast - should default to hourType
const ordinary = new Date(Date.UTC(2026, 6, 20)); // a random July Monday
const ordinaryResolved = win.resolveLiturgicalDay(ordinary, win.LECTIONARY_DATA, win.KALENDAR_DATA);
console.log("Ordinary day category (morning):", win.pickOpeningSentenceCategory(ordinaryResolved, { winner: "season" }, "morning"));
console.log("Ordinary day category (evening):", win.pickOpeningSentenceCategory(ordinaryResolved, { winner: "season" }, "evening"));

// Trinity Sunday and Whitsunday and Corpus Christi specific-category checks
const anchors = win.getLiturgicalYearAnchors(new Date(Date.UTC(2026, 5, 1)));
const trinResolved = win.resolveLiturgicalDay(anchors.trinitySunday, win.LECTIONARY_DATA, win.KALENDAR_DATA);
console.log("Trinity Sunday category:", win.pickOpeningSentenceCategory(trinResolved, { winner: "season" }, "morning"));
const whitResolved = win.resolveLiturgicalDay(anchors.whitsunday, win.LECTIONARY_DATA, win.KALENDAR_DATA);
console.log("Whitsunday category:", win.pickOpeningSentenceCategory(whitResolved, { winner: "season" }, "morning"));
const ccResolved = win.resolveLiturgicalDay(anchors.corpusChristi, win.LECTIONARY_DATA, win.KALENDAR_DATA);
console.log("Corpus Christi category:", win.pickOpeningSentenceCategory(ccResolved, { winner: "season" }, "morning"));

console.log();
console.log("--- Full render: Mattins page ---");
doc.defaultView.location.hash = "#office/mattins";
doc.defaultView.dispatchEvent(new dom.window.Event("hashchange"));
const mattinsBody = doc.getElementById("officeBody").innerHTML;
console.log("has Sentences rubric:", mattinsBody.includes("one or more of the following Sentences"));
console.log("has sentence-citation:", mattinsBody.includes("sentence-citation"));
console.log("has Exhortation heading:", mattinsBody.includes("Exhortation to Penitence"));
console.log("has General Confession heading:", mattinsBody.includes("General Confession"));
console.log("has 'We have erred, and strayed':", mattinsBody.includes("We have erred, and strayed"));
console.log("has Declaration of Absolution heading:", mattinsBody.includes("Declaration of Absolution"));
// NOTE: dropcap="true" splits the first letter into its own <span>, so
// literal-substring checks below start from the *second* character.
console.log("has no-Priest text by default:", mattinsBody.includes("rant, we beseech thee, merciful Lord, to thy faithful people"));
console.log("does NOT have Priest full-Absolution text by default:", !mattinsBody.includes("lmighty God, the Father of our Lord Jesus Christ, who desireth not"));
console.log("has Lord's Prayer & Angelic Salutation heading:", mattinsBody.includes("Lord's Prayer &amp; Angelic Salutation") || mattinsBody.includes("Lord's Prayer & Angelic Salutation"));
console.log("has Hail Mary text:", mattinsBody.includes("ail Mary, full of grace"));
console.log("has correct cross before 'open thou our lips':", mattinsBody.includes("O Lord, ✝ open thou our lips"));
console.log("has correct cross before 'make speed':", mattinsBody.includes("O God, ✠ make speed"));
console.log("has Marian Anthem placeholder content (heading present):", /almaRedemptoris|Alma Redemptoris|Ave Regina|Regina C(o|æ)li|Salve Regina/i.test(mattinsBody));

console.log();
console.log("--- Toggle Priest Present, re-render Mattins ---");
doc.querySelector('#ministerMenu button[data-minister="priest"]').click();
const mattinsBodyPriest = doc.getElementById("officeBody").innerHTML;
console.log("ministerLabel now:", doc.getElementById("ministerLabel").textContent);
console.log("has Priest full-Absolution text now:", mattinsBodyPriest.includes("He pardoneth and"));
console.log("has Priest short-Absolution text now:", mattinsBodyPriest.includes("he Almighty and merciful Lord grant you Absolution"));
console.log("no longer has no-Priest text:", !mattinsBodyPriest.includes("rant, we beseech thee, merciful Lord, to thy faithful people"));

// Reset toggle back to default for cleanliness of subsequent checks
doc.querySelector('#ministerMenu button[data-minister="layman"]').click();

console.log();
console.log("--- Full render: Evensong page ---");
doc.defaultView.location.hash = "#office/evensong";
doc.defaultView.dispatchEvent(new dom.window.Event("hashchange"));
const evensongBody = doc.getElementById("officeBody").innerHTML;
console.log("has Sentences rubric:", evensongBody.includes("one or more of the following Sentences"));
console.log("has Exhortation heading:", evensongBody.includes("Exhortation to Penitence"));
console.log("has no-Priest text by default:", evensongBody.includes("rant, we beseech thee, merciful Lord, to thy faithful people"));
console.log("has correct cross before 'open thou our lips':", evensongBody.includes("O Lord, ✝ open thou our lips"));
console.log("has Marian Anthem placeholder content (heading present):", /almaRedemptoris|Alma Redemptoris|Ave Regina|Regina C(o|æ)li|Salve Regina/i.test(evensongBody));

console.log();
console.log("--- Non-regression: other Hours still render ---");
for (const hour of ["prime", "terce", "sext", "none", "compline"]) {
  doc.defaultView.location.hash = "#office/" + hour;
  doc.defaultView.dispatchEvent(new dom.window.Event("hashchange"));
  const body = doc.getElementById("officeBody").innerHTML;
  console.log(hour, "still renders:", body.length > 500);
}

console.log();
console.log("ALL CHECKS PRINTED - done");
