const { JSDOM } = require("jsdom");
const fs = require("fs");

// Task #201 update: the single combined "#votive"/"votiveBody" page this
// test used to exercise was split into four separate pages/data files
// (George's corrections doc: "The different Votive Masses should be
// provided in different pages, accessible on different items under the
// Votive Masses drop-down in the menu."), each with its own hash route
// and container id. Rewritten here to hit all four, preserving every
// content assertion the original test made (just distributed across the
// page that now actually carries each piece of content), rather than
// leaving this anchored to elements that no longer exist.
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
  "js/data-vesper-dead.js","js/data-lauds-dead.js","js/data-matins-dead.js",
  "js/data-votive-bvm.js","js/data-votive-angels.js","js/data-votive-matrimony.js","js/data-votive-dead.js",
  "js/computus.js","js/calendar.js","js/psalms.js","js/liturgical-color.js","js/office-variants.js",
  "js/ranking.js","js/scripture.js","js/app.js"];
for (const s of scripts) {
  const el = window.document.createElement("script");
  el.textContent = fs.readFileSync(s, "utf-8");
  window.document.body.appendChild(el);
}

const doc = window.document;

function go(hash) {
  window.location.hash = "#" + hash;
  window.dispatchEvent(new window.Event("hashchange"));
}

go("votive-bvm");
console.log("page-votive-bvm hidden:", doc.getElementById("page-votive-bvm").hidden);
const bvmBody = doc.getElementById("votiveBvmBody");
console.log("bvm body length:", bvmBody.innerHTML.length);
console.log("bvm has title:", bvmBody.querySelector("h2.office-title").textContent === "Our Lady on Saturday");
console.log("bvm has stray latex artifacts:", /\\lett|\\margrub|\\blackrubric|\\ding|\\elcol|\\gradall|\\textit|\\divineName|\\nth|\\par|\\noindent/.test(bvmBody.innerHTML));
console.log("nav-link present:", !!doc.querySelector('a[href="#votive-bvm"]'));
// bvmSeasonOption auto-pick (task #107): only one season's own Introit
// heading-plus-opening-text should render at a time - checking for each
// season's *own Introit opening line* rather than a loose season-name
// substring, since e.g. the Trinitytide form's own rubric legitimately
// mentions "Advent" in passing ("...until the Saturday before the First
// Sunday in Advent, inclusive.").
const seasonHeadingCount = ["Advent","Epiphanytide","Septuagesimatide","Eastertide","Trinitytide"]
  .filter((s) => bvmBody.innerHTML.includes(`<div class="section-heading">${s}</div>`)).length;
console.log("bvm shows exactly one of the 5 seasons at a time (bvmSeasonOption auto-pick, task #107):", seasonHeadingCount === 1);

go("votive-angels");
console.log("page-votive-angels hidden:", doc.getElementById("page-votive-angels").hidden);
const angelsBody = doc.getElementById("votiveAngelsBody");
console.log("angels body length:", angelsBody.innerHTML.length);
console.log("angels page title is Mass of the Angels:", angelsBody.querySelector("h2.office-title").textContent === "Mass of the Angels");
console.log("angels has stray latex artifacts:", /\\lett|\\margrub|\\blackrubric|\\ding|\\elcol|\\gradall|\\textit|\\divineName|\\nth|\\par|\\noindent/.test(angelsBody.innerHTML));

go("votive-matrimony");
console.log("page-votive-matrimony hidden:", doc.getElementById("page-votive-matrimony").hidden);
const matrimonyBody = doc.getElementById("votiveMatrimonyBody");
console.log("matrimony body length:", matrimonyBody.innerHTML.length);
console.log("matrimony page title is Holy Matrimony:", matrimonyBody.querySelector("h2.office-title").textContent === "Holy Matrimony");
console.log("cross mark count on matrimony page:", (matrimonyBody.innerHTML.match(/✠/g) || []).length, "(expect 1)");
console.log("has nuptial blessing text (textContent):", matrimonyBody.textContent.includes("sanctify and ✠ bless you"));

go("votive-dead");
console.log("page-votive-dead hidden:", doc.getElementById("page-votive-dead").hidden);
const deadBody = doc.getElementById("votiveDeadBody");
console.log("dead body length:", deadBody.innerHTML.length);
console.log("dead page title is Masses for the Dead:", deadBody.querySelector("h2.office-title").textContent === "Masses for the Dead");
console.log("has In Daily Masses of the Dead heading:", /In Daily Masses of the Dead/.test(deadBody.innerHTML));
console.log("has 3 Requiem daily Collects (textContent count of 'apostolic Priesthood'):", (deadBody.textContent.match(/apostolic Priesthood/g) || []).length);

// George's corrections doc, exact wording: "The different Votive Masses
// should be provided in different pages, accessible on different items
// under the Votive Masses drop-down in the menu." - verify the dropdown
// itself, not just the four underlying pages/data files.
console.log("\nNav dropdown checks:");
console.log("Votive Masses nav-item is a dropdown (data-dropdown='votive'):", !!doc.querySelector('[data-dropdown="votive"]'));
console.log("Votive Masses trigger button exists (data-trigger='votive'):", !!doc.querySelector('[data-trigger="votive"]'));
const votiveMenuLinks = [...doc.querySelectorAll("#votiveMenu a")].map((a) => a.getAttribute("href"));
console.log("votiveMenu has all 4 links:", ["#votive-bvm","#votive-angels","#votive-matrimony","#votive-dead"].every((h) => votiveMenuLinks.includes(h)));
console.log("votiveMenu has exactly 4 links (no leftover single-page item):", votiveMenuLinks.length === 4);

// Navigating between the four sub-pages should hide the others - each
// is its own independent page now, not one page with internal sections.
go("votive-bvm");
console.log("after navigating to bvm: angels page is hidden:", doc.getElementById("page-votive-angels").hidden);
console.log("after navigating to bvm: bvm page is visible:", !doc.getElementById("page-votive-bvm").hidden);
go("votive-dead");
console.log("after navigating to dead: bvm page is hidden:", doc.getElementById("page-votive-bvm").hidden);
console.log("after navigating to dead: dead page is visible:", !doc.getElementById("page-votive-dead").hidden);

// non-regression: all previously-built pages still render
const others = [
  ["family", "familyBody"], ["adult-baptism", "adultBaptismBody"], ["burial", "burialBody"],
  ["unction", "unctionBody"], ["baptism", "baptismBody"], ["matrimony", "matrimonyBody"],
  ["confirmation", "confirmationBody"], ["reception", "receptionBody"], ["purification", "purificationBody"],
  ["burial-child", "burialChildBody"], ["confession", "confessionBody"], ["communion-sick", "communionSickBody"],
  ["mass", "massBody"], ["litany", "litanyBody"], ["litany-saints", "litanySaintsBody"],
  ["asperges", "aspergesBody"], ["foremass", "foremassBody"], ["preparation", "preparationBody"],
  ["thanksgiving", "thanksgivingBody"], ["benediction", "benedictionBody"],
  ["vesper-dead", "vesperDeadBody"], ["matins-dead", "matinsDeadBody"], ["lauds-dead", "laudsDeadBody"],
];
for (const [hash, bodyId] of others) {
  go(hash);
  console.log(`${hash} still renders:`, doc.getElementById(bodyId).innerHTML.length > 100);
}
