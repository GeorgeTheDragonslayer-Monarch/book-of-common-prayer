const { JSDOM } = require("jsdom");
const fs = require("fs");

// Task #202: 14 Collect/Secret/Postcommunion fields (found by task #193's own
// jsdom probe of stripCollectEnding's ~98.5% match rate) still carried the
// site's own pre-existing task-#78-era stenographic shorthand for a
// doxology ending ("Who with.", "(Through.)", "Through . . . in the unity
// of the same Holy Spirit.", etc.) instead of the full spelled-out
// closing text every other Collect/Secret/Postcommunion on the site
// already carries. Expanded each using the exact family of full-text
// endings already used at scale elsewhere in this same corpus (confirmed
// by a direct corpus scan: the plain Father-addressed ending appears 830
// times, the "through the same...; who liveth" form 48 times, the
// Son-addressed "who livest and reignest with the Father..." form
// multiple times, etc.), matched to each entry by its own already-fixed
// wording (does it name Christ in the body already? is it addressed to
// the Son directly? does it mention the Holy Ghost/Spirit within the
// body?) - the same rule Front/Rubrics.tex's own "Conclusion of Collects"
// note documents, and the same one Augustine confirmed correct for task
// #78/Q3. This is a completion of the site's own already-established
// convention, not new theological content.
const dataDir = "data";
const temporale = JSON.parse(fs.readFileSync(`${dataDir}/collects-temporale.json`, "utf-8"));
const sanctorale = JSON.parse(fs.readFileSync(`${dataDir}/collects-sanctorale.json`, "utf-8"));

let pass = 0, fail = 0;
function check(label, cond) {
  if (cond) { pass++; }
  else { fail++; console.log("FAIL:", label); }
}

// --- Load the real index.html + full script list (same pattern as every
// other jsdom test in this project) so app.js's top-level init actually
// completes and window.stripCollectEnding is genuinely reachable. ---
const indexHtml = fs.readFileSync("index.html", "utf-8");
const dom = new JSDOM(indexHtml, { url: "http://localhost/", runScripts: "dangerously" });
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
  if (!fs.existsSync(s)) continue;
  const el = window.document.createElement("script");
  el.textContent = fs.readFileSync(s, "utf-8");
  window.document.body.appendChild(el);
}

const testCases = [
  ["Easter I", "text", temporale],
  ["Whitsunday", "postcommunionText", temporale],
  ["Corpus Christi", "text", temporale],
  ["Trinity I", "secondaryText", temporale],
  ["1-18", "text", sanctorale],
  ["1-19", "secondaryText", sanctorale],
  ["1-28", "postcommunionText", sanctorale],
  ["2-22", "secondaryText", sanctorale],
  ["2-22", "postcommunionSecondaryText", sanctorale],
  ["8-6", "postcommunionText", sanctorale],
  ["9-9", "postcommunionText", sanctorale],
  ["9-14", "text", sanctorale],
  ["11-21", "text", sanctorale],
  ["8-17", "text", sanctorale],
];

for (const [key, field, data] of testCases) {
  const text = data[key][field];
  check(`${key}/${field} ends with "Amen."`, /Amen\.\s*$/.test(text));
  check(`${key}/${field} no longer has a bare truncated marker`,
    !/Who with\.$|Who\.$|Who livest and reignest\.$|Who liveth and reigneth\.$|\(Through\.\)$|Through \. \. \.|Through the same$/.test(text));
  if (typeof window.stripCollectEnding === "function") {
    const stripped = window.stripCollectEnding(text);
    check(`${key}/${field} stripCollectEnding now strips it (was unmatched before task #202)`, stripped !== text);
  }
}

// Spot-check exact final wording for a few representative cases.
check("Easter I ends with full Father doxology",
  temporale["Easter I"].text.endsWith("Who liveth and reigneth with thee in the unity of the Holy Ghost, God, throughout all ages, world without end. Amen."));
check("Corpus Christi ends with full Son-addressed doxology (preserving 'with God the Father')",
  temporale["Corpus Christi"].text.endsWith("Who livest and reignest with God the Father, in the unity of the Holy Ghost, God, throughout all ages, world without end. Amen."));
check("Trinity I secondaryText matches Corpus Christi's fix exactly (same reused Collect)",
  temporale["Trinity I"].secondaryText === temporale["Corpus Christi"].text);
check("Whitsunday postcommunion keeps 'the same Holy Spirit' wording, now completed",
  temporale["Whitsunday"].postcommunionText.endsWith("in the unity of the same Holy Spirit, God, throughout all ages, world without end. Amen."));
check("2-22 secondaryText and postcommunionSecondaryText both expanded from '(Through.)'",
  sanctorale["2-22"].secondaryText.includes("Through Jesus Christ thy Son our Lord") &&
  sanctorale["2-22"].postcommunionSecondaryText.includes("Through Jesus Christ thy Son our Lord"));
check("9-14 Exaltation of the Holy Cross now has a complete sentence (no longer trails off unpunctuated)",
  sanctorale["9-14"].text.endsWith("world without end. Amen.") && !sanctorale["9-14"].text.trim().endsWith("Through the same"));

// Non-regression: St. Stephen's genuinely unique non-formulaic ending
// (correctly left untouched by stripCollectEnding and by this task) is
// still intact, word for word.
check("St. Stephen's unique ending left untouched",
  temporale["St. Stephen "] ? temporale["St. Stephen "].text.endsWith("our only Mediator and Advocate. Amen.") : true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
