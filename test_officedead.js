const { JSDOM } = require("jsdom");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
// runScripts:"dangerously" + real <script> elements, not window.eval per
// file: top-level `const`/`let` declared in one indirect eval() call
// (window.eval) doesn't persist into a later, separate eval() call, so
// js/liturgical-color.js's `const LITURGICAL_COLORS` was invisible to
// js/app.js under the old harness - harmless as long as nothing calls
// applyLiturgicalColor, but the Mass page now does (it's date-aware).
// Real <script> tags share one global lexical environment, matching an
// actual browser.
const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously" });
const { window } = dom;

const scripts = ["js/data-psalter.js","js/data-kalendar.js","js/data-lectionary.js",
  "js/data-evensong-template.js","js/data-mattins-template.js","js/data-compline-template.js",
  "js/data-prime-template.js","js/data-terce-template.js","js/data-sext-template.js","js/data-none-template.js",
  "js/data-collects-temporale.js","js/data-collects-sanctorale.js","js/data-kjv.js","js/data-apocrypha.js",
  "js/data-marian-anthems.js","js/data-athanasian-creed.js","js/data-great-litany.js","js/data-litany-saints.js",
  "js/data-mass-ordinary.js","js/data-confession.js","js/data-communion-sick.js","js/data-purification.js",
  "js/data-burial-child.js","js/data-confirmation.js","js/data-reception.js","js/data-matrimony.js","js/data-baptism.js",
  "js/data-unction.js","js/data-burial.js","js/data-adult-baptism.js","js/data-family.js",
  "js/data-asperges.js","js/data-foremass.js","js/data-preparation.js","js/data-thanksgiving.js","js/data-benediction.js",
  "js/data-vesper-dead.js","js/data-lauds-dead.js","js/data-matins-dead.js",
  "js/computus.js","js/calendar.js","js/psalms.js","js/liturgical-color.js","js/office-variants.js",
  "js/ranking.js","js/scripture.js","js/app.js"];
for (const s of scripts) {
  const el = window.document.createElement("script");
  el.textContent = fs.readFileSync(s, "utf-8");
  window.document.body.appendChild(el);
}

const doc = window.document;

function check(hash, bodyId, titleRe, extraChecks) {
  window.location.hash = "#" + hash;
  window.dispatchEvent(new window.Event("hashchange"));
  console.log(`--- ${hash} ---`);
  console.log("page hidden:", doc.getElementById("page-" + hash).hidden);
  const body = doc.getElementById(bodyId);
  console.log("body length:", body.innerHTML.length);
  console.log("has title:", titleRe.test(body.innerHTML));
  console.log("has stray latex artifacts:", /\\lett|\\margrub|\\lettspace|\\ding|\\elcol|\\psanum|\\smash|\\textit|\\dag\b|\\par|\\noindent/.test(body.innerHTML));
  console.log("nav-link/menu present:", !!doc.querySelector(`a[href="#${hash}"]`));
  if (extraChecks) extraChecks(body);
}

check("vesper-dead", "vesperDeadBody", /Vespers of the Dead/, (body) => {
  console.log("has Psalm 116 heading:", /Psalm 116/.test(body.innerHTML));
  console.log("has Magnificat heading:", /Magnificat/.test(body.innerHTML));
  console.log("has cross mark:", body.innerHTML.includes("✠"));
  console.log("has dagger (textContent):", body.textContent.includes("†"));
  console.log("has 'Here Endeth':", /Here Endeth the Order of Vespers/.test(body.innerHTML));
});

check("lauds-dead", "laudsDeadBody", /Lauds of the Dead/, (body) => {
  console.log("has Ego dixi heading:", /Ego dixi/.test(body.innerHTML));
  console.log("has Benedictus heading:", /Benedictus/.test(body.innerHTML));
  console.log("dagger count (textContent):", (body.textContent.match(/†/g) || []).length, "(expect 14)");
  console.log("has cross mark:", body.innerHTML.includes("✠"));
  console.log("has 'Here Endeth':", /Here Endeth the Order of Lauds/.test(body.innerHTML));
});

check("matins-dead", "matinsDeadBody", /Matins of the Dead/, (body) => {
  console.log("has Venite heading:", /Venite, exultemus/.test(body.innerHTML));
  console.log("has Nocturn I/II/III headings:", /Nocturn I/.test(body.innerHTML) && /Nocturn II/.test(body.innerHTML) && /Nocturn III/.test(body.innerHTML));
  console.log("has Lesson 1 heading:", /Lesson 1\. Job 7:16/.test(body.innerHTML));
  console.log("has Lesson 9 heading:", /Lesson 9\. Job 10:18/.test(body.innerHTML));
  console.log("dagger count (textContent):", (body.textContent.match(/†/g) || []).length, "(expect 19)");
  console.log("asterisk count (textContent):", (body.textContent.match(/\*/g) || []).length, "(expect 39)");
  console.log("has 'Here Endeth':", /Here Endeth the Order of Matins/.test(body.innerHTML));
});

// non-regression: all previously-built pages still render
const others = [
  ["family", "familyBody"], ["adult-baptism", "adultBaptismBody"], ["burial", "burialBody"],
  ["unction", "unctionBody"], ["baptism", "baptismBody"], ["matrimony", "matrimonyBody"],
  ["confirmation", "confirmationBody"], ["reception", "receptionBody"], ["purification", "purificationBody"],
  ["burial-child", "burialChildBody"], ["confession", "confessionBody"], ["communion-sick", "communionSickBody"],
  ["mass", "massBody"], ["litany", "litanyBody"], ["litany-saints", "litanySaintsBody"],
  ["asperges", "aspergesBody"], ["foremass", "foremassBody"], ["preparation", "preparationBody"],
  ["thanksgiving", "thanksgivingBody"], ["benediction", "benedictionBody"],
];
for (const [hash, bodyId] of others) {
  window.location.hash = "#" + hash;
  window.dispatchEvent(new window.Event("hashchange"));
  console.log(`${hash} still renders:`, doc.getElementById(bodyId).innerHTML.length > 100);
}

// language mode switch sanity check (English-only pages should show "no Latin" notes gracefully, not crash)
window.location.hash = "#matins-dead";
window.dispatchEvent(new window.Event("hashchange"));
const langBtn = doc.querySelector('#languageMenu button[data-lang="both"]');
langBtn.dispatchEvent(new window.Event("click", { bubbles: true }));
console.log("matins-dead renders in 'both' mode without crash, length:", doc.getElementById("matinsDeadBody").innerHTML.length > 100);
