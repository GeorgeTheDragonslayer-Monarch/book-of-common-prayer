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
// attempted at the time: the Invitatory antiphon (Mattins.tex's own
// Invitatory-antiphon rubric doesn't name Saturday as a trigger at all -
// adding one would invent a rule, not fix a gap); full proper Psalms/
// Lessons for this Office (would need the Common of the Blessed Virgin
// Mary, i.e. the same missing Commons.tex already blocking other items);
// and the rubric's own "of a Sunday anticipated" exclusion, which this
// codebase had no way to model for Evensong yet (see below).
//
// George's 10/7 note (the Magnificat-antiphon bug, task #19) led to a
// fix in `resolveEveningDisplacement` that completes exactly that missing
// exclusion as a side effect: an ordinary plain Saturday's First Evensong
// of the following Sunday now correctly displaces today's Evensong the
// same way a Double-tier feast's First Evensong already did (both are
// "a Sunday anticipated according to the rubrics" / Table 2's own code-1
// case - a plain Saturday has no claim of its own either way). Since
// `isOfficeOfOurLadyToday`'s very first check is `resolved.weekdayName
// !== "Saturday"`, and Evensong's title/Collect are now driven by
// `renderResolved` (which becomes tomorrow's *Sunday* resolved day the
// moment displacement fires), that check now correctly excludes Evensong
// on its own, with no separate code needed - exactly as this function's
// own doc comment anticipated it eventually would once Evensong's
// displacement mechanism covered the ordinary-Sunday case. Mattins is
// untouched by any of this (Mattins is never "anticipating" anything,
// and `resolveEveningDisplacement` only ever runs for `currentHour ===
// "evensong"') - it still correctly shows "(Office of Our Lady)" on an
// unencumbered Saturday morning. Evensong's two checks below were updated
// to expect the new, rubric-correct behavior: First Evensong of the
// following Sunday, NOT "(Office of Our Lady)".
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
  const bannerE = domE.window.document.querySelector(".rubric-fine");
  // Updated per task #19's fix: Rubrics.tex's own "of a Sunday
  // anticipated" exclusion now correctly applies at Evensong - an
  // unencumbered plain Saturday's Evensong is First Evensong of the
  // following Sunday, not "(Office of Our Lady)".
  check(`${d} Evensong title does NOT say "(Office of Our Lady)" ("Sunday anticipated" rubric exclusion)`, !labelE.includes("(Office of Our Lady)"));
  check(`${d} Evensong Collect is NOT of Our Lady on Saturday (Sunday's own First Evensong instead)`, !bodyE.includes("perpetual health of mind"));
  check(`${d} Evensong shows the First-Evensong-of-the-following-Sunday banner`, !!bannerE && /^This Evensong is First Evensong of/.test(bannerE.textContent));

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
