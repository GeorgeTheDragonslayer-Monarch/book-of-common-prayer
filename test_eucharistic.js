const { JSDOM } = require("jsdom");
const fs = require("fs");

const html = fs.readFileSync("index.html", "utf-8");
// runScripts:"dangerously" + real <script> elements, not window.eval per
// file: top-level `const`/`let` declared in one indirect eval() call
// doesn't persist into a later, separate eval() call, so
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
  console.log("has stray latex artifacts:", /\\lett|\\margrub|\\lettspace|\\ding|\\elcol|\\psanum|\\smash|\\textit|\\dag\b/.test(body.innerHTML));
  console.log("nav-link/menu present:", !!doc.querySelector(`a[href="#${hash}"]`));
  if (extraChecks) extraChecks(body);
}

check("asperges", "aspergesBody", /Aspersion of the People/, (body) => {
  console.log("has Vidi Aquam:", /Vidi Aquam/.test(body.innerHTML));
});
check("foremass", "foremassBody", /Prayers at the Foot of the Altar/, (body) => {
  console.log("cross mark count:", (body.innerHTML.match(/✠/g) || []).length, "(expect 6)");
  console.log("has Confiteor (textContent):", body.textContent.includes("I confess to Almighty God"));
});
check("preparation", "preparationBody", /Preparation for Holy Communion/, (body) => {
  console.log("has Psalm 84 heading:", /Psalm 84/.test(body.innerHTML));
  console.log("has Psalm 130 heading:", /Psalm 130/.test(body.innerHTML));
  console.log("has dagger on first Remember not:", /Remember not, †/.test(body.textContent));
  console.log("Sunday heading present:", /Sunday/.test(body.innerHTML));
  console.log("Saturday heading present:", /Saturday/.test(body.innerHTML));
  console.log("does NOT contain excluded St Augustine prayer:", !/Against thee only have I sinned/.test(body.textContent));
  console.log("does NOT contain excluded Gregory prayer:", !/Living and True God, mine Holy Father/.test(body.textContent));
  console.log("has typo fix 'out of the worthiness':", body.textContent.includes("out of the worthiness"));
  console.log("does NOT have typo 'our of the worthiness':", !body.textContent.includes("our of the worthiness"));
});
check("thanksgiving", "thanksgivingBody", /Thanksgiving for Holy Communion/, (body) => {
  console.log("has Benedicite:", /Benedicite/.test(body.innerHTML));
  console.log("has dagger (textContent):", body.textContent.includes("†"));
});
check("benediction", "benedictionBody", /Benediction of the Blessed Sacrament/, (body) => {
  console.log("has Tantum Ergo:", /Tantum Ergo/.test(body.innerHTML));
  console.log("has Divine Praises:", /Divine Praises/.test(body.innerHTML));
  console.log("Ant. label present twice (textContent):", (body.textContent.match(/Ant\. Let us forever adore/g) || []).length, "(expect 2)");
});

// verify all other previously-built pages still render (non-regression)
const others = [
  ["family", "familyBody"], ["adult-baptism", "adultBaptismBody"], ["burial", "burialBody"],
  ["unction", "unctionBody"], ["baptism", "baptismBody"], ["matrimony", "matrimonyBody"],
  ["confirmation", "confirmationBody"], ["reception", "receptionBody"], ["purification", "purificationBody"],
  ["burial-child", "burialChildBody"], ["confession", "confessionBody"], ["communion-sick", "communionSickBody"],
  ["mass", "massBody"], ["litany", "litanyBody"], ["litany-saints", "litanySaintsBody"],
];
for (const [hash, bodyId] of others) {
  window.location.hash = "#" + hash;
  window.dispatchEvent(new window.Event("hashchange"));
  console.log(`${hash} still renders:`, doc.getElementById(bodyId).innerHTML.length > 100);
}

// language mode switch test on preparation (bilingual-heavy page)
window.location.hash = "#preparation";
window.dispatchEvent(new window.Event("hashchange"));
const langBtn = doc.querySelector('#languageMenu button[data-lang="both"]');
langBtn.dispatchEvent(new window.Event("click", { bubbles: true }));
const prepBodyBoth = doc.getElementById("preparationBody");
console.log("preparation 'both' mode has Latin (Dómine):", /Dómine/.test(prepBodyBoth.innerHTML));
console.log("preparation 'both' mode has English (Lord):", prepBodyBoth.textContent.includes("O Lord God of hosts"));
