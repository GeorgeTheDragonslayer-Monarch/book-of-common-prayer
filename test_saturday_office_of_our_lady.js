// George's note (10/3, a direct observation, not a numbered
// PENDING-CORRECTIONS item): "today is a Saturday office of the BVM, but
// Matins and Vespers is treating it as just a saturday."
//
// pages/Front/Rubrics.tex has a dedicated "Office of Our Lady on
// Saturday" entry: "On all Saturdays - except in Advent, Septuagesimatide,
// Lent, and on Ember Days - unless the Office be of a Double Feast (even
// transferred), or of an occurrent Octave or Vigil, or of a Sunday
// anticipated according to the rubrics, the Office is of St. Mary." This
// is a genuinely separate rubric from the already-implemented "Votive
// Mass of Our Lady on Saturday" (Rubrics.tex's very next entry, with a
// *different* threshold - the Votive Masses dropdown's existing "Our
// Lady on Saturday" page, task #201, is that Mass-only observance and is
// NOT touched by this fix). This is about the actual Daily Office
// (Mattins/Evensong/the Little Hours), which showed no sign whatsoever
// that an unencumbered Saturday was "of St. Mary" - no title, no
// distinct Collect.
//
// Fixed with `isOfficeOfOurLadyToday`/`isOctaveOccurrentToday`/
// `bvmSaturdayCollectText` (js/app.js, just above `resolveFeastRankToday`),
// wired into the Office page's title (`renderOfficePage`) and its
// "collectOfDay" placeholder (`renderPlaceholder`) only - NOT into
// `computeDayTitle` itself (shared by the Mass and Home pages) and NOT
// into the Mass page's own "collectOfDay" (data/mass-ordinary.json uses
// the identical placeholder key). The Collect text reuses the Votive
// Mass's own already-sourced 5 seasonal BVM Collects (data/votive-bvm.json,
// data/seasonal-prayers.json's "maryInAdvent" entry for Advent
// specifically) rather than inventing anything. Deliberately NOT
// attempted: the Invitatory antiphon (Mattins.tex's own Invitatory-
// antiphon rubric doesn't name Saturday as a trigger at all - adding one
// would invent a rule, not fix a gap) and full proper Psalms/Lessons for
// this Office (would need the Common of the Blessed Virgin Mary, i.e.
// the same missing Commons.tex already blocking other items).
const fs = require("fs");
const { JSDOM } = require("jsdom");

function runOnDate(isoDateNoonUTC, hash) {
  const html = fs.readFileSync("index.html", "utf8");
  const dom = new JSDOM(html, { url: `http://localhost/${hash}`, runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
  const FixedDate = class extends Date {
    constructor(...args) {
      if (args.length === 0) { super(isoDateNoonUTC); }
      else { super(...args); }
    }
    static now() { return new Date(isoDateNoonUTC).getTime(); }
  };
  window.Date = FixedDate;
  const scriptSrcs = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  const combined = scriptSrcs.map((src) => fs.readFileSync(src, "utf8")).join("\n;\n");
  try {
    window.eval(combined);
  } catch (e) {
    console.log("ERROR evaluating combined scripts:", e.message);
  }
  return dom;
}

let failed = false;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failed = true;
}

// Today's actual live case, and a second plain unencumbered Saturday.
for (const d of ["2026-10-03", "2026-09-05"]) {
  const domM = runOnDate(d + "T12:00:00Z", "#office/mattins");
  const labelM = domM.window.document.getElementById("seasonLabel").textContent;
  const bodyM = domM.window.document.getElementById("officeBody").textContent;
  check(`${d} Mattins title says "(Office of Our Lady)"`, labelM.includes("(Office of Our Lady)"));
  check(`${d} Mattins Collect is of Our Lady on Saturday`, bodyM.includes("perpetual health of mind"));

  const domE = runOnDate(d + "T12:00:00Z", "#office/evensong");
  const labelE = domE.window.document.getElementById("seasonLabel").textContent;
  const bodyE = domE.window.document.getElementById("officeBody").textContent;
  check(`${d} Evensong title says "(Office of Our Lady)" too`, labelE.includes("(Office of Our Lady)"));
  check(`${d} Evensong Collect is of Our Lady on Saturday too`, bodyE.includes("perpetual health of mind"));

  // The Mass page must be completely unaffected - it shares the same
  // "collectOfDay" placeholder key but has its own, different rubric.
  const domMass = runOnDate(d + "T12:00:00Z", "#mass");
  const labelMass = domMass.window.document.getElementById("massSeasonLabel").textContent;
  const bodyMass = domMass.window.document.getElementById("massBody").textContent;
  check(`${d} Mass title is NOT touched by this fix`, !labelMass.includes("Office of Our Lady"));
  check(`${d} Mass body does NOT get the Our-Lady-on-Saturday Collect`, !bodyMass.includes("perpetual health of mind"));
}

// Each of the rubric's own named exclusions, all live-tested in 2026.
const exclusions = [
  ["2026-04-18", "Low Saturday (within Easter's own Privileged Octave)"],
  ["2026-06-06", "Ember Saturday (Whitsun)"],
  ["2026-06-13", "Saturday within Corpus Christi's own Privileged Octave"],
  ["2026-08-13", "A Double Feast (St. Maximus) winning the day"],
  ["2026-08-22", "An Octave Day (of the Assumption) winning the day"],
  ["2026-08-08", "A Vigil (of St. Lawrence, moved here from Sunday) present"],
  ["2026-12-05", "An Advent Saturday"],
  ["2026-02-21", "A Lenten Saturday (Sexagesima)"],
];
for (const [d, reason] of exclusions) {
  const dom = runOnDate(d + "T12:00:00Z", "#office/mattins");
  const label = dom.window.document.getElementById("seasonLabel").textContent;
  check(`${d} is correctly excluded (${reason})`, !label.includes("Office of Our Lady"));
}

// All 5 seasonal Collect forms resolve to real, distinct, sourced text.
{
  const dom = runOnDate("2026-01-31T12:00:00Z", "#office/mattins"); // Epiphanytide
  const body = dom.window.document.getElementById("officeBody").textContent;
  check("Epiphanytide's own seasonal BVM Collect text renders", body.includes("virgin child-bearing of blessed Mary"));
}

// A non-Saturday control, completely unaffected.
{
  const dom = runOnDate("2026-09-06T12:00:00Z", "#office/mattins"); // the Sunday after 9/5
  const label = dom.window.document.getElementById("seasonLabel").textContent;
  check("An ordinary Sunday is not affected by this fix", !label.includes("Office of Our Lady"));
}

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
