// Pending-corrections verification (10/2): "The Gloria in excelsis is
// said in the Mass on Feast Days of Double rank and higher, and on all
// Sundays, except in Advent, Septuagesimatide, and Lent - verify current
// logic matches this exactly." Rubrics.tex's own "Gloria in excelsis"
// entry reads word for word: "The Gloria in excelsis is said in the Mass
// on Feast Days of Double rank and higher. It is also said on all
// Sundays, except in Advent, Septuagesimatide, and Lent."
//
// `shouldOmitMassGloria` (js/app.js) already modeled the season/Sunday
// halves of this correctly; the bug was the rank threshold. RANK_TIER
// (js/ranking.js) puts Semidouble at tier 3 and Double at tier 4 - the
// old code read `feastInfo.tier >= 3`, which incorrectly let a
// Semidouble-rank weekday feast (one notch BELOW what the rubric names)
// say the Gloria too. Corrected to `tier >= 4`.
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

function massHasGloria(isoDateNoonUTC) {
  const dom = runOnDate(isoDateNoonUTC, "#mass");
  const html = dom.window.document.getElementById("massBody").innerHTML;
  return /Glory be to God on high/.test(html);
}

let failed = false;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failed = true;
}

// 7 January 2026 (Wednesday) - "Day II within the Octave of the
// Epiphany," Semidouble rank, outside any penitential season. Per the
// rubric this should NOT have a Gloria - a Semidouble is one rank below
// what "Double rank and higher" names.
check(
  "A weekday Semidouble-rank feast (7 Jan 2026, Day II within the Octave of the Epiphany) omits the Gloria",
  massHasGloria("2026-01-07T12:00:00Z") === false
);

// 14 January 2026 (Wednesday) - St. Hilary of Poitiers, plain "Double"
// rank (RANK_TIER tier 4, the bottom of "Double rank and higher"),
// outside any penitential season. Per the rubric this SHOULD have a
// Gloria - confirms the fix didn't overshoot and start excluding the
// bottom of the named range too.
check(
  "A weekday plain-Double-rank feast (14 Jan 2026, St. Hilary of Poitiers) still says the Gloria",
  massHasGloria("2026-01-14T12:00:00Z") === true
);

// Control: an ordinary Trinitytide Sunday still says the Gloria (the
// Sunday rule, untouched by this fix).
check(
  "An ordinary Sunday outside the penitential seasons (28 June 2026, Trinity IV) still says the Gloria",
  massHasGloria("2026-06-28T12:00:00Z") === true
);

// Control: an Advent Sunday still omits the Gloria (the season rule,
// untouched by this fix, and checked ahead of the rank/Sunday logic).
check(
  "An Advent Sunday (29 November 2026, Advent I) still omits the Gloria",
  massHasGloria("2026-11-29T12:00:00Z") === false
);

console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
process.exit(failed ? 1 : 0);
